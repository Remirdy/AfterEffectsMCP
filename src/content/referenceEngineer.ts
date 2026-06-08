import path from "node:path";
import fs from "node:fs/promises";
import { OpLog, assertFile, ensureDir } from "../util.js";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ReferenceAnalysisOptions {
  videoPath: string; // local file path
  outputDir: string;
  brandSlug?: string; // to tailor prompt package
}

export interface ReferenceAnalysis {
  colorPalette: string[]; // hex colors (extracted from metadata or procedural)
  pacing: { avgShotDurationSec: number; totalShots: number; rhythm: "fast" | "medium" | "slow" };
  hookTechnique: string; // description
  structureBreakdown: Array<{ timeSec: number; description: string }>;
  viralElements: string[];
  promptPackage: string; // ready-to-use director brief
  analysisPath: string; // JSON file path
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simple non-cryptographic hash of a string → number */
function simpleHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

/** Generate a procedural hex colour from a seed integer */
function seedToHex(seed: number): string {
  const r = (seed & 0xff).toString(16).padStart(2, "0");
  const g = ((seed >> 8) & 0xff).toString(16).padStart(2, "0");
  const b = ((seed >> 16) & 0xff).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/** Derive 6 distinct hex colours from a filename */
function generatePalette(filename: string): string[] {
  const base = simpleHash(filename);
  return Array.from({ length: 6 }, (_, i) => seedToHex((base * (i + 1) * 2654435761) >>> 0));
}

/** Infer hook technique from filename keywords */
function inferHookTechnique(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("product")) return "Product showcase opener";
  if (lower.includes("testimonial") || lower.includes("review")) return "Social proof hook";
  if (lower.includes("tutorial") || lower.includes("how")) return "How-to curiosity hook";
  if (lower.includes("story") || lower.includes("vlog")) return "Narrative story hook";
  if (lower.includes("behind") || lower.includes("bts")) return "Behind-the-scenes reveal";
  if (lower.includes("ad") || lower.includes("promo")) return "Direct-response ad hook";
  return "Dynamic visual hook";
}

/** Derive viral elements based on pacing and duration */
function inferViralElements(
  rhythm: "fast" | "medium" | "slow",
  durationSec: number
): string[] {
  const base: string[] = ["Strong visual identity", "Clear value proposition"];

  if (rhythm === "fast") {
    base.push("Rapid-fire editing", "High-energy transitions");
  } else if (rhythm === "medium") {
    base.push("Balanced storytelling pace", "Smooth scene transitions");
  } else {
    base.push("Deliberate cinematic tempo", "Sustained narrative tension");
  }

  if (durationSec <= 30) {
    base.push("Optimised for short-form platforms");
  } else if (durationSec <= 90) {
    base.push("Mid-form engagement arc");
  } else {
    base.push("Long-form authority building");
  }

  return base.slice(0, 6);
}

/** Build a director brief from collected analysis data */
function buildPromptPackage(
  filename: string,
  palette: string[],
  rhythm: "fast" | "medium" | "slow",
  hookTechnique: string,
  viralElements: string[],
  structureBreakdown: Array<{ timeSec: number; description: string }>,
  brandSlug?: string
): string {
  const brandLine = brandSlug ? `Brand: ${brandSlug}. ` : "";
  return `DIRECTOR BRIEF — Reference Analysis
${brandLine}Source: ${filename}

VISUAL IDENTITY
  Colour palette: ${palette.join(", ")}
  Rhythm: ${rhythm.toUpperCase()} pacing

HOOK STRATEGY
  Technique: ${hookTechnique}

STRUCTURE
${structureBreakdown.map((s) => `  [${s.timeSec}s] ${s.description}`).join("\n")}

VIRAL MECHANICS
${viralElements.map((e) => `  • ${e}`).join("\n")}

PRODUCTION NOTES
  Replicate the ${rhythm} editing tempo throughout. Open with a ${hookTechnique.toLowerCase()} within the first 3 seconds. Match the colour palette for brand consistency. Ensure each segment delivers a clear micro-message aligned with the overall arc.
`;
}

// ── ReferenceEngineer ─────────────────────────────────────────────────────────

export class ReferenceEngineer {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async analyzeReference(opts: ReferenceAnalysisOptions): Promise<ReferenceAnalysis> {
    const { videoPath, outputDir, brandSlug } = opts;

    this.log.info(`ReferenceEngineer: analysing ${path.basename(videoPath)}`);

    // 1. Validate and prepare directories
    await assertFile(videoPath, "videoPath");
    await ensureDir(outputDir);

    // 2. Read file metadata for duration estimate
    const stat = await fs.stat(videoPath);
    const fileSizeBytes = stat.size;
    const estimatedDurationSec = Math.min(300, fileSizeBytes / 50_000);
    this.log.info(
      `File size: ${fileSizeBytes} bytes → estimated duration: ${estimatedDurationSec.toFixed(1)}s`
    );

    const filename = path.basename(videoPath);

    // 3. Procedural colour palette from filename hash
    const colorPalette = generatePalette(filename);
    this.log.info(`Generated colour palette: ${colorPalette.join(", ")}`);

    // 4. Pacing estimate from duration
    let rhythm: "fast" | "medium" | "slow";
    if (estimatedDurationSec < 30) {
      rhythm = "fast";
    } else if (estimatedDurationSec <= 90) {
      rhythm = "medium";
    } else {
      rhythm = "slow";
    }

    // Estimate shot count: fast≈1 shot/2s, medium≈1/4s, slow≈1/8s
    const secondsPerShot = rhythm === "fast" ? 2 : rhythm === "medium" ? 4 : 8;
    const totalShots = Math.max(1, Math.round(estimatedDurationSec / secondsPerShot));
    const avgShotDurationSec = Math.round((estimatedDurationSec / totalShots) * 10) / 10;

    const pacing = { avgShotDurationSec, totalShots, rhythm };
    this.log.info(`Pacing: ${rhythm}, ~${totalShots} shots, avg ${avgShotDurationSec}s/shot`);

    // 5. Structure breakdown — 5 evenly-spaced segments
    const segmentLabels = [
      "Opening hook / attention grab",
      "Problem or context setup",
      "Core message / product feature",
      "Evidence / social proof",
      "Call-to-action / closing",
    ];
    const structureBreakdown = segmentLabels.map((desc, i) => ({
      timeSec: Math.round((estimatedDurationSec / 4) * i),
      description: desc,
    }));

    // 6. Hook technique inference
    const hookTechnique = inferHookTechnique(filename);
    this.log.info(`Hook technique: ${hookTechnique}`);

    // 7. Viral elements
    const viralElements = inferViralElements(rhythm, estimatedDurationSec);

    // 8. Prompt package
    const promptPackage = buildPromptPackage(
      filename,
      colorPalette,
      rhythm,
      hookTechnique,
      viralElements,
      structureBreakdown,
      brandSlug
    );

    // 9. Save analysis JSON
    const timestamp = Date.now();
    const analysisPath = path.join(outputDir, `reference_analysis_${timestamp}.json`);
    const analysisData: Omit<ReferenceAnalysis, "analysisPath"> & { analysisPath?: string } = {
      colorPalette,
      pacing,
      hookTechnique,
      structureBreakdown,
      viralElements,
      promptPackage,
    };
    await fs.writeFile(analysisPath, JSON.stringify({ ...analysisData, analysisPath }, null, 2), "utf8");
    this.log.info(`Analysis saved to: ${analysisPath}`);

    return {
      colorPalette,
      pacing,
      hookTechnique,
      structureBreakdown,
      viralElements,
      promptPackage,
      analysisPath,
    };
  }
}
