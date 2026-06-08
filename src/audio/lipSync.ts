import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite, readJson } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import { TranscriptionResult } from "./stt.js";

export interface LipSyncOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  mouthLayerName: string;
  transcriptPath: string;
}

export class LipSyncAutomator {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async syncMouth(opts: LipSyncOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Syncing mouth layer "${opts.mouthLayerName}" using transcript: ${opts.transcriptPath}`);
    await assertFile(opts.aepPath, "Source AEP");
    await assertFile(opts.transcriptPath, "Transcript JSON");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const transcript = await readJson<TranscriptionResult>(opts.transcriptPath);
    const words = transcript.words ?? [];

    // Construct the ExtendScript keyframe insertions
    const keyframesJs: string[] = [];
    
    // Set initial closed mouth (0.0s)
    keyframesJs.push(`timeRemap.setValueAtTime(0, 0.0);`);

    for (const w of words) {
      const start = w.start;
      const end = w.end;
      const mid = (start + end) / 2;

      // Map visemes to time remap frames (expressed in seconds in AE: e.g. 0s = closed, 0.1s = wide, 0.2s = narrow)
      keyframesJs.push(`timeRemap.setValueAtTime(${start}, 0.1);`); // open wide
      keyframesJs.push(`timeRemap.setValueAtTime(${mid}, 0.2);`);   // open narrow
      keyframesJs.push(`timeRemap.setValueAtTime(${end}, 0.1);`);   // open wide
      keyframesJs.push(`timeRemap.setValueAtTime(${end + 0.03}, 0.0);`); // closed
    }

    const lipSyncJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var mouthName = ${JSON.stringify(opts.mouthLayerName)};
      
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
      
      var layers = MP.findLayersByPattern(comp, mouthName);
      if (layers.length === 0) {
        throw new Error("Mouth layer not found: " + mouthName);
      }
      
      var layer = layers[0];
      
      // Enable time remap
      layer.timeRemapEnabled = true;
      var timeRemap = layer.property("ADBE Time Remapping");
      
      // Remove default end keyframes to avoid timeline shifts
      while (timeRemap.numKeys > 0) {
        timeRemap.removeKey(1);
      }
      
      // Inject speech viseme keyframes
      ${keyframesJs.join("\n      ")}
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(lipSyncJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to apply lip-sync keyframes: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }
}
