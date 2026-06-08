import fs from "node:fs/promises";
import path from "node:path";
import { runJsx } from "../ae/runner.js";
import { withReport } from "../ae/jsxGenerator.js";
import { OpLog, assertFile, guardOverwrite, readJson } from "../util.js";
import { TranscriptionResult } from "./stt.js";

export interface MusicScoreOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  musicPath: string;
  transcriptPath: string;
  duckingDb?: number; // Decibels of ducking during speech (e.g. -12)
  approveOverwrite?: boolean;
}

export interface SpeechSegment {
  start: number;
  end: number;
}

export class AudioMusicManager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Group word timestamps into contiguous speech segments, merging close words (closer than 0.6s).
   */
  public extractSpeechSegments(transcript: TranscriptionResult, mergeThreshold = 0.6): SpeechSegment[] {
    const words = transcript.words || [];
    if (words.length === 0) return [];

    const segments: SpeechSegment[] = [];
    let current: SpeechSegment = { start: words[0].start, end: words[0].end };

    for (let i = 1; i < words.length; i++) {
      const w = words[i];
      if (w.start - current.end <= mergeThreshold) {
        // Merge word into current segment
        current.end = Math.max(current.end, w.end);
      } else {
        // Save current segment and start new one
        segments.push(current);
        current = { start: w.start, end: w.end };
      }
    }
    segments.push(current);
    return segments;
  }

  /**
   * Imports background music and ducks its audio levels during active voiceover segments.
   */
  async autoMusicScore(opts: MusicScoreOptions): Promise<{ ok: boolean; outputAepPath: string; segmentsCount: number }> {
    this.log.info(`Importing music from: ${opts.musicPath}`);
    await assertFile(opts.aepPath, "Source AEP");
    await assertFile(opts.musicPath, "Music File");
    await assertFile(opts.transcriptPath, "Transcript File");
    await guardOverwrite(opts.outputAepPath, opts.approveOverwrite || false);

    const transcript = await readJson<TranscriptionResult>(opts.transcriptPath);
    const segments = this.extractSpeechSegments(transcript);
    const duckDb = opts.duckingDb ?? -12;

    this.log.info(`Extracted ${segments.length} speech segments for ducking at ${duckDb} dB.`);

    // Build keyframe ExtendScript statements
    const keyframesJs: string[] = [];
    for (const seg of segments) {
      const tStartDucking = Math.max(0, seg.start - 0.25);
      const tDucked = seg.start;
      const tEndDucked = seg.end;
      const tRecovered = seg.end + 0.35;

      // Keyframes expect value [leftChannel_dB, rightChannel_dB]
      keyframesJs.push(`volProp.setValueAtTime(${tStartDucking}, [0, 0]);`);
      keyframesJs.push(`volProp.setValueAtTime(${tDucked}, [${duckDb}, ${duckDb}]);`);
      keyframesJs.push(`volProp.setValueAtTime(${tEndDucked}, [${duckDb}, ${duckDb}]);`);
      keyframesJs.push(`volProp.setValueAtTime(${tRecovered}, [0, 0]);`);
    }

    const musicJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var musicPath = ${JSON.stringify(opts.musicPath)};
      
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
          comp = item;
          break;
        }
      }
      
      if (!comp) {
        throw new Error("Composition not found: " + compName);
      }
      
      // Import music asset
      var mFile = new File(musicPath);
      if (!mFile.exists) {
        throw new Error("Music asset file not found on disk: " + musicPath);
      }
      
      var musicItem = app.project.importFile(new ImportOptions(mFile));
      var musicLayer = comp.layers.add(musicItem);
      musicLayer.name = "Background_Music";
      
      // Push music to the bottom of composition layers list (so it behaves as a background track)
      musicLayer.moveToEnd();
      
      // Enable time stretch or audio
      musicLayer.audioEnabled = true;
      
      var volProp = musicLayer.property("ADBE Audio Levels");
      if (volProp) {
        // Clear default keys
        while (volProp.numKeys > 0) {
          volProp.removeKey(1);
        }
        
        // Inject speech-ducking keyframes
        ${keyframesJs.join("\n        ")}
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(musicJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to apply background music scoring and ducking: ${result.error}`);
    }

    return {
      ok: true,
      outputAepPath: result.output || opts.outputAepPath,
      segmentsCount: segments.length,
    };
  }
}
