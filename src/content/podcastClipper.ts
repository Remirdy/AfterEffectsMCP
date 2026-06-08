import path from "node:path";
import fs from "node:fs/promises";
import { OpLog, assertFile, ensureDir, readJson, pathExists } from "../util.js";
import { SttTranscribe } from "../audio/stt.js";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface PodcastClipperOptions {
  audioPath: string; // source audio/video file
  outputDir: string;
  maxClips?: number; // default 8
  clipDurationSec?: number; // max seconds per clip, default 60
  platform?: "tiktok" | "reels" | "youtube_shorts"; // affects aspect ratio
  addSubtitles?: boolean; // default true
  transcriptPath?: string; // optional pre-existing transcript
}

export interface ViralClip {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
  viralityScore: number; // 0-100
  reason: string; // why this was chosen
  outputPath?: string; // if extracted
}

export interface PodcastClipResult {
  clips: ViralClip[];
  transcriptPath: string;
  totalDurationSec: number;
}

// ── Internal segment shape after grouping transcript words ────────────────────

interface Segment {
  text: string;
  startSec: number;
  endSec: number;
  wordCount: number;
}

// ── Scoring constants ─────────────────────────────────────────────────────────

const HOOK_WORDS = [
  "shocking",
  "never",
  "secret",
  "mistake",
  "viral",
  "hack",
  "truth",
  "reason",
  "actually",
  "finally",
  "fail",
  "best",
  "worst",
  "exposed",
];

// ── PodcastClipper ────────────────────────────────────────────────────────────

export class PodcastClipper {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  private scoreSegment(seg: Segment, maxDurationSec: number): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const lower = seg.text.toLowerCase();

    // Hook-word bonus (cap at 30)
    const hookBonus = Math.min(
      30,
      HOOK_WORDS.filter((w) => lower.includes(w)).length * 15
    );
    if (hookBonus > 0) {
      const matched = HOOK_WORDS.filter((w) => lower.includes(w));
      score += hookBonus;
      reasons.push(`Hook words detected: ${matched.join(", ")} (+${hookBonus})`);
    }

    // Punctuation bonus
    if (/[?!]/.test(seg.text)) {
      score += 10;
      reasons.push("Contains question or exclamation (+10)");
    }

    // Duration bonus
    const duration = seg.endSec - seg.startSec;
    if (duration >= 15 && duration <= 45) {
      score += 20;
      reasons.push(`Ideal clip duration ${duration.toFixed(1)}s [15-45s] (+20)`);
    } else if (duration > 45 && duration <= maxDurationSec) {
      score += 10;
      reasons.push(`Acceptable clip duration ${duration.toFixed(1)}s [45-${maxDurationSec}s] (+10)`);
    }

    // Word-count bonus
    if (seg.wordCount >= 20 && seg.wordCount <= 80) {
      score += 15;
      reasons.push(`Good word count ${seg.wordCount} [20-80] (+15)`);
    }

    return { score: Math.min(100, score), reasons };
  }

  // ── Group words into sentence-like segments ───────────────────────────────

  private groupIntoSegments(
    words: Array<{ word: string; start: number; end: number }>,
    maxDurationSec: number
  ): Segment[] {
    if (words.length === 0) return [];

    const segments: Segment[] = [];
    let currentWords: string[] = [];
    let segStart = words[0].start;
    let segEnd = words[0].end;

    const flushSegment = () => {
      if (currentWords.length === 0) return;
      segments.push({
        text: currentWords.join(" "),
        startSec: segStart,
        endSec: segEnd,
        wordCount: currentWords.length,
      });
      currentWords = [];
    };

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const prospectiveDuration = w.end - segStart;

      // Start a new segment if we'd exceed maxDuration or if there's a big pause
      const pause = i > 0 ? w.start - words[i - 1].end : 0;
      if (prospectiveDuration > maxDurationSec || (pause > 2.0 && currentWords.length > 5)) {
        flushSegment();
        segStart = w.start;
      }

      currentWords.push(w.word);
      segEnd = w.end;
    }
    flushSegment();
    return segments;
  }

  // ── AE JSX subtitle layer builder ────────────────────────────────────────

  private buildSubtitleJsx(
    clips: ViralClip[],
    platform: "tiktok" | "reels" | "youtube_shorts"
  ): string {
    const aspectMap: Record<string, { w: number; h: number }> = {
      tiktok: { w: 1080, h: 1920 },
      reels: { w: 1080, h: 1920 },
      youtube_shorts: { w: 1080, h: 1920 },
    };
    const dim = aspectMap[platform] ?? { w: 1080, h: 1920 };

    const layerStatements = clips
      .map((clip, i) => {
        const safeText = clip.text.replace(/"/g, '\\"').replace(/\n/g, " ");
        return `
  // ── Clip ${i + 1} subtitle ──
  var textLayer${i} = comp.layers.addText(${JSON.stringify(safeText)});
  textLayer${i}.name = "Subtitle_Clip_${i + 1}";
  textLayer${i}.inPoint = ${clip.startSec};
  textLayer${i}.outPoint = ${clip.endSec};
  var tDoc${i} = textLayer${i}.property("Source Text").value;
  tDoc${i}.fontSize = 52;
  tDoc${i}.fillColor = [1, 1, 1];
  tDoc${i}.font = "Arial-BoldMT";
  tDoc${i}.justification = ParagraphJustification.CENTER_JUSTIFY;
  textLayer${i}.property("Source Text").setValue(tDoc${i});
  var pos${i} = textLayer${i}.property("Position");
  pos${i}.setValue([${dim.w / 2}, ${Math.round(dim.h * 0.82)}]);`;
      })
      .join("\n");

    return `
// Auto-generated subtitle JSX by PodcastClipper
// Platform: ${platform} | Comp size: ${dim.w}x${dim.h}
(function() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    alert("Please select an active composition.");
    return;
  }
  app.beginUndoGroup("PodcastClipper: Add Subtitles");
  ${layerStatements}
  app.endUndoGroup();
})();
`;
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  async clipToViral(opts: PodcastClipperOptions): Promise<PodcastClipResult> {
    const {
      audioPath,
      outputDir,
      maxClips = 8,
      clipDurationSec = 60,
      platform = "tiktok",
      addSubtitles = true,
    } = opts;

    this.log.info(`PodcastClipper: starting for ${path.basename(audioPath)}`);

    // 1. Validate input file and ensure output directory exists
    await assertFile(audioPath, "audioPath");
    await ensureDir(outputDir);

    // 2. Transcribe if no transcript provided
    let transcriptPath = opts.transcriptPath ?? "";
    let transcriptData: { text: string; duration: number; words: Array<{ word: string; start: number; end: number }> };

    if (transcriptPath && (await pathExists(transcriptPath))) {
      this.log.info(`Using existing transcript at: ${transcriptPath}`);
      transcriptData = await readJson(transcriptPath);
    } else {
      this.log.info("No transcript provided — running STT transcription…");
      const stt = new SttTranscribe(this.log);
      const result = await stt.transcribe(audioPath);
      transcriptData = result;

      // Save transcript next to outputDir
      transcriptPath = path.join(
        path.dirname(outputDir),
        `${path.basename(audioPath, path.extname(audioPath))}_transcript.json`
      );
      await fs.writeFile(transcriptPath, JSON.stringify(transcriptData, null, 2), "utf8");
      this.log.info(`Transcript saved to: ${transcriptPath}`);
    }

    const totalDurationSec = transcriptData.duration ?? 0;

    // 3. Group words into segments
    const segments = this.groupIntoSegments(transcriptData.words ?? [], clipDurationSec);
    this.log.info(`Grouped transcript into ${segments.length} segments`);

    if (segments.length === 0) {
      this.log.warn("No segments produced from transcript — returning empty result");
      return { clips: [], transcriptPath, totalDurationSec };
    }

    // 4. Score each segment
    const scored = segments.map((seg) => {
      const { score, reasons } = this.scoreSegment(seg, clipDurationSec);
      return { seg, score, reasons };
    });

    // 5. Sort by score descending and take top maxClips
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, maxClips);

    // Sort winning clips by time for readability
    top.sort((a, b) => a.seg.startSec - b.seg.startSec);

    const clips: ViralClip[] = top.map((item, i) => ({
      index: i + 1,
      startSec: Math.round(item.seg.startSec * 100) / 100,
      endSec: Math.round(item.seg.endSec * 100) / 100,
      text: item.seg.text,
      viralityScore: item.score,
      reason: item.reasons.join("; ") || "Selected by duration and word count",
      outputPath: path.join(outputDir, `clip_${String(i + 1).padStart(2, "0")}.mp4`),
    }));

    this.log.info(`Selected ${clips.length} viral clip(s)`);

    // 6. Generate AE JSX for subtitle overlay if requested
    if (addSubtitles && clips.length > 0) {
      const jsx = this.buildSubtitleJsx(clips, platform);
      const jsxPath = path.join(outputDir, `subtitle_overlay_${Date.now()}.jsx`);
      await fs.writeFile(jsxPath, jsx, "utf8");
      this.log.info(`Subtitle JSX written to: ${jsxPath}`);
    }

    return { clips, transcriptPath, totalDurationSec };
  }
}
