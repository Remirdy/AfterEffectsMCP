import path from "node:path";
import fs from "node:fs/promises";
import { OpLog, ensureDir } from "../util.js";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface StoryboardOptions {
  brief: string;
  sceneCount?: number; // default 6
  style?: "cinematic" | "minimal" | "bold" | "playful"; // default cinematic
  outputDir: string;
  brandSlug?: string;
  generateImages?: boolean; // default false (uses placeholder colours)
  totalDurationSec?: number; // default 30
}

export interface StoryboardScene {
  index: number;
  timeSec: number;
  durationSec: number;
  description: string;
  cameraMove: string;
  textOverlay?: string;
  colorHex: string; // bg colour for placeholder
  imagePrompt?: string; // DALL-E prompt if generateImages=true
  imagePath?: string;
}

export interface StoryboardResult {
  scenes: StoryboardScene[];
  htmlPath: string;
  briefSummary: string;
}

// ── Style palettes ────────────────────────────────────────────────────────────

const STYLE_PALETTES: Record<StoryboardOptions["style"] & string, string[]> = {
  cinematic: ["#0a1628", "#1a2d4a", "#c9a84c", "#e8c96e", "#2c4a6e", "#8ab4d8"],
  minimal: ["#f5f5f5", "#e0e0e0", "#ffffff", "#bdbdbd", "#9e9e9e", "#f0f0f0"],
  bold: ["#1a0000", "#8b0000", "#ff0000", "#1a1a1a", "#cc0000", "#ff4444"],
  playful: ["#ffd6e7", "#c8e6c9", "#bbdefb", "#fff9c4", "#e1bee7", "#ffccbc"],
};

const CAMERA_MOVES = [
  "Static",
  "Slow push-in",
  "Pan right",
  "Drone pull-back",
  "Handheld close-up",
  "Rack focus",
];

// ── Brief parser ─────────────────────────────────────────────────────────────

interface BriefElements {
  product: string;
  tone: string;
  cta: string;
  keywords: string[];
}

function parseBrief(brief: string): BriefElements {
  const lower = brief.toLowerCase();

  // Product detection
  const productMatch =
    brief.match(/(?:for|product|app|service|brand)[:\s]+([A-Za-z0-9 _-]+)/i)?.[1]?.trim() ??
    brief.split(/\s+/).slice(0, 3).join(" ");

  // Tone detection
  let tone = "professional";
  if (/fun|playful|energetic|exciting/i.test(lower)) tone = "energetic and playful";
  else if (/luxury|premium|elegant|sophisticated/i.test(lower)) tone = "luxury and refined";
  else if (/minimal|clean|simple/i.test(lower)) tone = "clean and minimal";
  else if (/bold|powerful|strong/i.test(lower)) tone = "bold and powerful";

  // CTA detection
  const ctaMatch =
    brief.match(
      /(?:cta|call[- ]to[- ]action|sign[\s-]?up|download|buy|shop|visit|try|learn more)[:\s]*([^.!?,\n]+)/i
    )?.[0]?.trim() ?? "Learn more today";

  // Keywords
  const stopWords = new Set(["the", "a", "an", "and", "or", "for", "to", "of", "in", "is", "it", "with", "our", "we"]);
  const keywords = lower
    .split(/[\s,;.!?]+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 8);

  return { product: productMatch, tone, cta: ctaMatch, keywords };
}

// ── Scene template builder ────────────────────────────────────────────────────

function buildSceneTemplates(
  sceneCount: number,
  elements: BriefElements,
  totalDurationSec: number,
  style: string,
  palette: string[]
): Omit<StoryboardScene, "imagePath" | "imagePrompt">[] {
  const scenes: Omit<StoryboardScene, "imagePath" | "imagePrompt">[] = [];

  // Determine individual scene durations
  const baseDuration = Math.round((totalDurationSec / sceneCount) * 10) / 10;

  // Build scene descriptions
  const descriptionMap = (index: number, total: number): { description: string; textOverlay?: string } => {
    if (index === 0) {
      return {
        description: "Hook — grab attention with a compelling opening moment",
        textOverlay: elements.keywords[0]?.toUpperCase() ?? "ATTENTION",
      };
    }
    if (index === 1) {
      return {
        description: "Problem presentation — identify the pain point your audience feels",
        textOverlay: `The Problem: ${elements.keywords[1] ?? "sound familiar?"}`,
      };
    }
    if (index === total - 1) {
      return {
        description: "CTA — Call to action, drive immediate viewer response",
        textOverlay: elements.cta,
      };
    }
    if (index === total - 2) {
      return {
        description: "Social proof / result — showcase credibility and outcome",
        textOverlay: "Real results. Real people.",
      };
    }
    // Middle scenes: solution/feature showcase
    const featureNum = index - 1;
    const keyword = elements.keywords[featureNum + 2] ?? elements.keywords[featureNum] ?? "feature";
    return {
      description: `Solution showcase #${featureNum} — highlight the ${keyword} benefit`,
      textOverlay: `✓ ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
    };
  };

  let currentTimeSec = 0;
  for (let i = 0; i < sceneCount; i++) {
    const { description, textOverlay } = descriptionMap(i, sceneCount);
    const cameraMove = CAMERA_MOVES[i % CAMERA_MOVES.length];
    const colorHex = palette[i % palette.length];
    const isLast = i === sceneCount - 1;
    // Give first and last scenes slightly longer duration
    const durationSec =
      i === 0 || isLast
        ? Math.round(baseDuration * 1.2 * 10) / 10
        : Math.round(baseDuration * 0.9 * 10) / 10;

    scenes.push({
      index: i + 1,
      timeSec: Math.round(currentTimeSec * 10) / 10,
      durationSec,
      description,
      cameraMove,
      textOverlay,
      colorHex,
    });
    currentTimeSec += durationSec;
  }

  return scenes;
}

// ── DALL-E image generator ────────────────────────────────────────────────────

async function generateDalleImage(
  prompt: string,
  outPath: string,
  log: OpLog
): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  try {
    log.info(`Calling DALL-E for scene prompt: "${prompt.slice(0, 60)}…"`);
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DALL-E error: ${errText}`);
    }

    const data = (await response.json()) as any;
    const b64 = data.data[0].b64_json;
    const buffer = Buffer.from(b64, "base64");
    await fs.writeFile(outPath, buffer);
    log.info(`Scene image saved to: ${outPath}`);
    return outPath;
  } catch (e) {
    log.warn(`DALL-E failed for scene: ${(e as Error).message}`);
    return undefined;
  }
}

// ── HTML storyboard generator ─────────────────────────────────────────────────

function generateHtml(
  scenes: StoryboardScene[],
  briefSummary: string,
  style: string,
  brandSlug?: string
): string {
  const title = brandSlug ? `${brandSlug} — Storyboard` : "MotionPilot Storyboard";
  const styleLabel = style.charAt(0).toUpperCase() + style.slice(1);

  const sceneCards = scenes
    .map((scene) => {
      const imageContent = scene.imagePath
        ? `<img src="${scene.imagePath}" alt="Scene ${scene.index}" style="width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:10px;">`
        : `<div style="width:100%;height:160px;background:${scene.colorHex};border-radius:6px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;">
             <span style="color:rgba(255,255,255,0.5);font-size:36px;font-weight:bold;">${scene.index}</span>
           </div>`;

      const textOverlayBadge = scene.textOverlay
        ? `<div class="text-overlay">💬 ${scene.textOverlay}</div>`
        : "";

      return `
        <div class="scene-card">
          ${imageContent}
          <div class="scene-meta">
            <span class="scene-num">Scene ${scene.index}</span>
            <span class="scene-time">${scene.timeSec}s — ${(scene.timeSec + scene.durationSec).toFixed(1)}s</span>
          </div>
          <div class="scene-description">${scene.description}</div>
          <div class="scene-camera">📷 ${scene.cameraMove}</div>
          ${textOverlayBadge}
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0e1117;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      padding: 40px 24px;
    }
    header {
      text-align: center;
      margin-bottom: 48px;
    }
    header h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #f8fafc;
    }
    header .style-tag {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 14px;
      background: #1e293b;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .brief-summary {
      max-width: 800px;
      margin: 0 auto 40px;
      padding: 20px 24px;
      background: #1e293b;
      border-radius: 12px;
      border-left: 4px solid #3b82f6;
      font-size: 0.9rem;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .brief-summary strong { color: #e2e8f0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .scene-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #2d3748;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .scene-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .scene-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .scene-num {
      font-weight: 700;
      font-size: 0.85rem;
      color: #60a5fa;
    }
    .scene-time {
      font-size: 0.75rem;
      color: #64748b;
      font-variant-numeric: tabular-nums;
    }
    .scene-description {
      font-size: 0.85rem;
      color: #cbd5e1;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .scene-camera {
      font-size: 0.78rem;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .text-overlay {
      font-size: 0.78rem;
      color: #a78bfa;
      font-style: italic;
      border-top: 1px solid #2d3748;
      padding-top: 8px;
      margin-top: 4px;
    }
    footer {
      text-align: center;
      margin-top: 60px;
      font-size: 0.75rem;
      color: #475569;
    }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <span class="style-tag">${styleLabel} Style • ${scenes.length} Scenes</span>
  </header>
  <div class="brief-summary">
    <strong>Brief Summary:</strong> ${briefSummary}
  </div>
  <div class="grid">
    ${sceneCards}
  </div>
  <footer>Generated by MotionPilot • ${new Date().toISOString()}</footer>
</body>
</html>`;
}

// ── StoryboardGenerator ───────────────────────────────────────────────────────

export class StoryboardGenerator {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async generate(opts: StoryboardOptions): Promise<StoryboardResult> {
    const {
      brief,
      sceneCount = 6,
      style = "cinematic",
      outputDir,
      brandSlug,
      generateImages = false,
      totalDurationSec = 30,
    } = opts;

    this.log.info(`StoryboardGenerator: generating ${sceneCount} scenes (style: ${style})`);

    // 1. Ensure output directory exists
    await ensureDir(outputDir);

    // 2. Parse brief for key elements
    const elements = parseBrief(brief);
    this.log.info(`Brief parsed — product: "${elements.product}", tone: "${elements.tone}"`);

    const briefSummary =
      `${elements.product} | Tone: ${elements.tone} | ` +
      `CTA: "${elements.cta}" | Key themes: ${elements.keywords.slice(0, 4).join(", ")}`;

    // 3. Select palette
    const palette = STYLE_PALETTES[style] ?? STYLE_PALETTES.cinematic;

    // 4. Build scene templates
    const sceneTemplates = buildSceneTemplates(
      sceneCount,
      elements,
      totalDurationSec,
      style,
      palette
    );

    // 5. Optionally generate DALL-E images
    const scenes: StoryboardScene[] = [];
    for (const tmpl of sceneTemplates) {
      const scene: StoryboardScene = { ...tmpl };

      if (generateImages && process.env.OPENAI_API_KEY) {
        const imagePrompt = `${style} style storyboard frame: ${tmpl.description}. Product: ${elements.product}. Tone: ${elements.tone}. No text overlays. High quality, cinematic composition.`;
        scene.imagePrompt = imagePrompt;
        const imageName = `scene_${String(tmpl.index).padStart(2, "0")}_${Date.now()}.png`;
        const imagePath = path.join(outputDir, imageName);
        const saved = await generateDalleImage(imagePrompt, imagePath, this.log);
        if (saved) scene.imagePath = saved;
      }

      scenes.push(scene);
    }

    this.log.info(`Built ${scenes.length} scenes`);

    // 6. Generate HTML storyboard
    const html = generateHtml(scenes, briefSummary, style, brandSlug);
    const timestamp = Date.now();
    const htmlPath = path.join(outputDir, `storyboard_${timestamp}.html`);
    await fs.writeFile(htmlPath, html, "utf8");
    this.log.info(`Storyboard HTML saved to: ${htmlPath}`);

    return { scenes, htmlPath, briefSummary };
  }
}
