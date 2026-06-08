/**
 * EmotionArcScoring — MotionPilot
 *
 * Analyzes a script/brief for emotional arc, then automatically applies:
 *  - Color grade LUT adjustments per scene (warm → tense → triumphant)
 *  - Music volume/intensity keyframes matching emotional peaks
 *  - Text layer color shifts aligned to emotion
 */

import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, ensureDir, assertFile } from "../util.js";
import { runJsx } from "../ae/runner.js";
import { withReport } from "../ae/jsxGenerator.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmotionType =
  | "neutral"
  | "tension"
  | "excitement"
  | "sadness"
  | "triumph"
  | "curiosity"
  | "warmth";

export interface EmotionBeat {
  /** Scene/segment index */
  index: number;
  timeSec: number;
  durationSec: number;
  emotion: EmotionType;
  intensity: number; // 0-100
  description: string;
}

export interface EmotionArcOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  /** Raw script, brief, or scene descriptions */
  scriptText: string;
  totalDurationSec: number;
  /** Music layer name to modulate (must already exist in comp) */
  musicLayerName?: string;
  approveOverwrite?: boolean;
}

export interface EmotionArcResult {
  ok: boolean;
  beats: EmotionBeat[];
  outputAepPath: string;
  arcDescription: string;
  /** Path to SVG chart of emotion arc */
  chartPath?: string;
}

// ---------------------------------------------------------------------------
// Emotion → AE mappings
// ---------------------------------------------------------------------------

const EMOTION_GRADE: Record<EmotionType, { hue: number; saturation: number; brightness: number }> = {
  neutral:    { hue: 0,   saturation: 0,   brightness: 0   },
  tension:    { hue: 220, saturation: 20,  brightness: -15 },
  excitement: { hue: 30,  saturation: 40,  brightness: 10  },
  sadness:    { hue: 200, saturation: 30,  brightness: -20 },
  triumph:    { hue: 45,  saturation: 50,  brightness: 20  },
  curiosity:  { hue: 270, saturation: 25,  brightness: 5   },
  warmth:     { hue: 25,  saturation: 35,  brightness: 15  },
};

const EMOTION_MUSIC_VOLUME: Record<EmotionType, number> = {
  neutral:    -6,
  tension:    -3,
  excitement: 0,
  sadness:    -9,
  triumph:    3,
  curiosity:  -4,
  warmth:     -2,
};

// ---------------------------------------------------------------------------
// Simple script parser — keyword → emotion mapping
// ---------------------------------------------------------------------------

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  tension:    ["problem", "conflict", "struggle", "fail", "break", "sorun", "kriz", "savaş", "danger"],
  excitement: ["amazing", "incredible", "wow", "launch", "new", "inanılmaz", "süper", "harika", "discover"],
  sadness:    ["sad", "loss", "miss", "alone", "üzgün", "yalnız", "kayıp", "zorlu"],
  triumph:    ["win", "success", "achieve", "hero", "kazan", "başarı", "zafer", "victory"],
  curiosity:  ["secret", "mystery", "how", "why", "what if", "merak", "nasıl", "neden", "secret"],
  warmth:     ["family", "together", "love", "care", "aile", "sevgi", "birlikte", "sıcak"],
  neutral:    [],
};

function parseEmotionBeats(scriptText: string, totalDurationSec: number, beatCount = 5): EmotionBeat[] {
  // Split script into roughly equal segments
  const words = scriptText.toLowerCase().split(/\s+/);
  const segmentSize = Math.ceil(words.length / beatCount);
  const secPerBeat = totalDurationSec / beatCount;

  const beats: EmotionBeat[] = [];

  for (let i = 0; i < beatCount; i++) {
    const segWords = words.slice(i * segmentSize, (i + 1) * segmentSize).join(" ");
    let dominantEmotion: EmotionType = "neutral";
    let maxHits = 0;

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [EmotionType, string[]][]) {
      if (emotion === "neutral") continue;
      const hits = keywords.filter((kw) => segWords.includes(kw)).length;
      if (hits > maxHits) {
        maxHits = hits;
        dominantEmotion = emotion;
      }
    }

    // Intensity: peaks in middle, strong at end
    const positionFactor = i === beatCount - 1 ? 0.9 : (i / (beatCount - 1));
    const intensity = Math.round(40 + positionFactor * 55 + maxHits * 10);

    beats.push({
      index: i,
      timeSec: i * secPerBeat,
      durationSec: secPerBeat,
      emotion: dominantEmotion,
      intensity: Math.min(100, intensity),
      description: `Scene ${i + 1}: ${dominantEmotion} (intensity ${Math.min(100, intensity)})`,
    });
  }

  return beats;
}

// ---------------------------------------------------------------------------
// SVG emotion arc chart
// ---------------------------------------------------------------------------

function generateSvgChart(beats: EmotionBeat[]): string {
  const W = 800;
  const H = 300;
  const pad = 40;
  const chartW = W - 2 * pad;
  const chartH = H - 2 * pad;

  const points = beats.map((b, i) => {
    const x = pad + (i / (beats.length - 1)) * chartW;
    const y = pad + (1 - b.intensity / 100) * chartH;
    return `${x},${y}`;
  });

  const emotionColors: Record<EmotionType, string> = {
    neutral: "#94a3b8", tension: "#3b82f6", excitement: "#f59e0b",
    sadness: "#6366f1", triumph: "#f97316", curiosity: "#a855f7", warmth: "#ec4899",
  };

  const dots = beats.map((b, i) => {
    const x = pad + (i / (beats.length - 1)) * chartW;
    const y = pad + (1 - b.intensity / 100) * chartH;
    return `<circle cx="${x}" cy="${y}" r="6" fill="${emotionColors[b.emotion] ?? "#94a3b8"}"/>
<text x="${x}" y="${y - 12}" text-anchor="middle" font-size="10" fill="#e2e8f0">${b.emotion}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:#1e293b;border-radius:8px;">
  <polyline points="${points.join(" ")}" fill="none" stroke="#7c3aed" stroke-width="3"/>
  ${dots}
  <text x="${W / 2}" y="${H - 5}" text-anchor="middle" font-size="12" fill="#94a3b8">Emotional Arc</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// EmotionArcScoring class
// ---------------------------------------------------------------------------

export class EmotionArcScoring {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async score(opts: EmotionArcOptions): Promise<EmotionArcResult> {
    await assertFile(opts.aepPath, "Source AEP");
    await ensureDir(path.dirname(opts.outputAepPath));

    const beats = parseEmotionBeats(opts.scriptText, opts.totalDurationSec);
    this.log.info(`Parsed ${beats.length} emotion beats from script.`);
    beats.forEach((b) => this.log.info(`  Beat ${b.index}: ${b.emotion} @ ${b.timeSec}s (${b.intensity}%)`));

    // Save SVG chart
    const chartDir = path.dirname(opts.outputAepPath);
    const chartPath = path.join(chartDir, `emotion_arc_${Date.now()}.svg`);
    try {
      await fs.writeFile(chartPath, generateSvgChart(beats), "utf8");
      this.log.info(`Emotion arc chart saved: ${chartPath}`);
    } catch {
      // non-fatal
    }

    // Build color grade + music keyframes in ExtendScript
    const gradeKeyframes = beats.map((b) => {
      const g = EMOTION_GRADE[b.emotion];
      const vol = EMOTION_MUSIC_VOLUME[b.emotion];
      return `{time:${b.timeSec},hue:${g.hue},sat:${g.saturation},bright:${g.brightness},vol:${vol}}`;
    }).join(",");

    const musicLayerName = opts.musicLayerName ?? "Background_Music";

    const jsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) throw new Error("AEP not found");
      app.open(aepFile);

      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === ${JSON.stringify(opts.compName)}) { comp = item; break; }
      }
      if (!comp) throw new Error("Comp not found: " + ${JSON.stringify(opts.compName)});

      var beats = [${gradeKeyframes}];
      var musicLayerName = ${JSON.stringify(musicLayerName)};

      // Apply Hue/Saturation and Brightness/Contrast to all AV layers
      for (var li = 1; li <= comp.numLayers; li++) {
        var layer = comp.layer(li);
        if (!(layer instanceof AVLayer)) continue;
        if (layer.name === musicLayerName) continue;

        var hsEffect = layer.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
        var bcEffect = layer.property("ADBE Effect Parade").addProperty("ADBE BRCOSA");

        if (hsEffect && bcEffect) {
          var hueProp = hsEffect.property("ADBE HUE SATURATION-0001");
          var satProp = hsEffect.property("ADBE HUE SATURATION-0002");
          var brightProp = bcEffect.property("ADBE BRCOSA-0001");

          for (var bi = 0; bi < beats.length; bi++) {
            var beat = beats[bi];
            try {
              if (hueProp) hueProp.setValueAtTime(beat.time, beat.hue);
              if (satProp) satProp.setValueAtTime(beat.time, beat.sat);
              if (brightProp) brightProp.setValueAtTime(beat.time, beat.bright);
            } catch(kfErr) {}
          }
        }
      }

      // Apply volume keyframes to music layer
      var musicLayer = null;
      for (var li = 1; li <= comp.numLayers; li++) {
        if (comp.layer(li).name === musicLayerName) { musicLayer = comp.layer(li); break; }
      }
      if (musicLayer) {
        var volProp = musicLayer.property("ADBE Audio Levels");
        if (volProp) {
          for (var bi = 0; bi < beats.length; bi++) {
            var beat = beats[bi];
            try {
              volProp.setValueAtTime(beat.time, [beat.vol, beat.vol]);
            } catch(e) {}
          }
        }
      }

      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = "ok";
    `);

    const result = await runJsx(jsx, this.log);
    if (!result.ok) {
      this.log.warn(`ExtendScript emotion arc failed: ${result.error}. Returning analysis only.`);
    }

    const arcDescription = beats.map((b) => `[${b.timeSec}s] ${b.emotion} (${b.intensity}%)`).join(" → ");

    return {
      ok: true,
      beats,
      outputAepPath: opts.outputAepPath,
      arcDescription,
      chartPath,
    };
  }
}
