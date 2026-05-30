import { promises as fs } from "node:fs";
import path from "node:path";
import { readPsd, Layer, Psd, initializeCanvas } from "ag-psd";
import { createCanvas, Image } from "@napi-rs/canvas";
import sharp from "sharp";

// ag-psd needs a canvas backend in Node to decode layer/composite image data.
initializeCanvas(
  ((width: number, height: number) => createCanvas(width, height)) as never,
  ((data: { width: number; height: number }) => {
    const c = createCanvas(data.width, data.height);
    const ctx = c.getContext("2d");
    ctx.putImageData(data as never, 0, 0);
    return c as never;
  }) as never
);
// Silence unused import in builds where Image isn't referenced elsewhere.
void Image;
import {
  AnalysisReport,
  AnalyzedLayer,
  LayerType,
  TextInfo,
} from "../types.js";
import { detectRole, isLocked, suggestedAnimationFor } from "./roles.js";
import { OpLog, ensureDir } from "../util.js";
import { AnalyzePsdInput } from "../schemas.js";

function mapType(layer: Layer): LayerType {
  if (layer.text) return "text";
  if (layer.children && layer.children.length) return "group";
  if (layer.adjustment) return "adjustment";
  if ((layer as { placedLayer?: unknown }).placedLayer) return "smartobject";
  if (layer.canvas || layer.imageData) return "image";
  return "unknown";
}

function extractText(layer: Layer): TextInfo | undefined {
  if (!layer.text) return undefined;
  const style = layer.text.style ?? {};
  const fill = style.fillColor as { r?: number; g?: number; b?: number } | undefined;
  const color = fill
    ? `rgb(${Math.round(fill.r ?? 0)}, ${Math.round(fill.g ?? 0)}, ${Math.round(fill.b ?? 0)})`
    : undefined;
  return {
    text: layer.text.text ?? "",
    font: style.font?.name,
    fontSize: typeof style.fontSize === "number" ? style.fontSize : undefined,
    color,
  };
}

/** Flatten a single layer's canvas to a trimmed PNG thumbnail. */
async function exportLayerThumbnail(
  layer: Layer,
  outFile: string,
  maxSize = 320
): Promise<boolean> {
  const canvas = layer.canvas as unknown as
    | { width?: number; height?: number; toBuffer?: (m: string) => Buffer }
    | undefined;
  if (!canvas || !canvas.width || !canvas.height) return false;
  const png: Buffer | undefined = canvas.toBuffer?.("image/png");
  if (!png) return false;
  await sharp(png)
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .png()
    .toFile(outFile);
  return true;
}

/**
 * Read a PSD, build a structured analysis report and export preview images.
 * The source PSD is opened read-only and is never modified.
 */
export async function analyzePsd(input: AnalyzePsdInput, log: OpLog): Promise<AnalysisReport> {
  log.info(`Reading PSD: ${input.psdPath}`);
  const buffer = await fs.readFile(input.psdPath);
  const psd: Psd = readPsd(buffer, {
    skipCompositeImageData: !input.includeFlattenedPreview,
    skipLayerImageData: !input.includeLayerThumbnails,
    skipThumbnail: false,
    useImageData: false,
  });

  await ensureDir(input.outputAnalysisFolder);
  const thumbsDir = path.join(input.outputAnalysisFolder, "thumbnails");
  if (input.includeLayerThumbnails) await ensureDir(thumbsDir);

  // Flattened preview from composite canvas.
  let previewPath: string | undefined;
  if (input.includeFlattenedPreview && psd.canvas) {
    const png = (psd.canvas as unknown as { toBuffer?: (m: string) => Buffer }).toBuffer?.("image/png");
    if (png) {
      previewPath = path.join(input.outputAnalysisFolder, "preview.png");
      await sharp(png).png().toFile(previewPath);
      log.info(`Wrote flattened preview: ${previewPath}`);
    } else {
      log.warn("Composite canvas present but could not be encoded to PNG.");
    }
  }

  const layers: AnalyzedLayer[] = [];
  let zIndex = 0;

  // ag-psd stores layers bottom-first within children; flatten recursively.
  const flat: Layer[] = [];
  const walk = (nodes: Layer[] | undefined) => {
    if (!nodes) return;
    for (const n of nodes) {
      flat.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(psd.children);

  for (const layer of flat) {
    const name = layer.name ?? `Layer ${zIndex}`;
    const type = mapType(layer);
    const locked = isLocked(name) || Boolean(layer.protected?.transparency);
    const role = detectRole(name, type);
    const left = layer.left ?? 0;
    const top = layer.top ?? 0;
    const width = (layer.right ?? 0) - left;
    const height = (layer.bottom ?? 0) - top;
    const suggestion = suggestedAnimationFor(role);

    let thumbnailPath: string | undefined;
    if (input.includeLayerThumbnails && type !== "group") {
      const safe = name.replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 60);
      const file = path.join(thumbsDir, `${String(zIndex).padStart(3, "0")}_${safe}.png`);
      try {
        if (await exportLayerThumbnail(layer, file)) thumbnailPath = file;
      } catch (e) {
        log.warn(`Thumbnail failed for "${name}": ${(e as Error).message}`);
      }
    }

    layers.push({
      name,
      type,
      role,
      bounds: { x: left, y: top, width: Math.max(0, width), height: Math.max(0, height) },
      visible: layer.hidden !== true,
      locked,
      opacity: Math.round(((layer.opacity ?? 1) as number) * 100),
      zIndex,
      thumbnailPath,
      text: input.includeTextLayerInfo ? extractText(layer) : undefined,
      suggestedAnimation: suggestion.label,
    });
    zIndex++;
  }

  // Second pass: when layers carry no naming conventions, infer roles from
  // geometry and z-order so the motion plan still respects visual hierarchy.
  refineRolesByGeometry(layers, psd.width, psd.height, log);

  const report: AnalysisReport = {
    document: {
      width: psd.width,
      height: psd.height,
      layerCount: layers.length,
      previewPath,
      sourcePsd: input.psdPath,
    },
    layers,
    visualSuggestions: buildSuggestions(layers),
    generatedAt: new Date().toISOString(),
  };

  log.info(`Analyzed ${layers.length} layers (${psd.width}x${psd.height}).`);
  return report;
}

/**
 * Heuristic role assignment for PSDs without naming conventions.
 * Only fills in layers still tagged "unknown" (or generic "text"); explicit
 * prefix-based roles from detectRole() are never overridden.
 */
function refineRolesByGeometry(
  layers: AnalyzedLayer[],
  docW: number,
  docH: number,
  log: OpLog
): void {
  const area = docW * docH;
  const visible = layers.filter((l) => l.visible && l.type !== "group");
  // Image-like = anything that isn't text/group and has real bounds (canvas may
  // be skipped during analysis, leaving type "unknown" but bounds intact).
  const isImageLike = (l: AnalyzedLayer) =>
    l.type !== "text" && l.type !== "group" && l.bounds.width > 0 && l.bounds.height > 0;

  // 1. Background: near full-bleed fills, or large layers at the very bottom of z-order.
  for (const l of visible) {
    if (l.role !== "unknown" || !isImageLike(l)) continue;
    const cover = (l.bounds.width * l.bounds.height) / area;
    if (cover >= 0.95 || (cover >= 0.7 && l.zIndex <= 2)) l.role = "background";
  }

  // 2. Main visual / character: the single largest remaining image.
  const images = visible.filter((l) => isImageLike(l) && l.role === "unknown");
  if (images.length) {
    let hero = images[0];
    for (const l of images) {
      if (l.bounds.width * l.bounds.height > hero.bounds.width * hero.bounds.height) hero = l;
    }
    if ((hero.bounds.width * hero.bounds.height) / area >= 0.12) hero.role = "main_mockup";
  }

  // 3. Text roles by vertical position and size.
  const texts = visible.filter((l) => l.type === "text");
  if (texts.length) {
    // Title = topmost large text in the upper 35% of the canvas.
    const upper = texts
      .filter((l) => l.bounds.y < docH * 0.4)
      .sort((a, b) => b.bounds.height - a.bounds.height);
    if (upper[0] && upper[0].role === "text") {
      upper[0].role = "locked_text"; // protect + transform-only
    }
    for (const l of texts) {
      if (l.role !== "text") continue;
      const cy = l.bounds.y + l.bounds.height / 2;
      // Phone / short numeric badges -> button bounce.
      if (l.text && /^[\d\s()+]{6,}$/.test(l.text.text.replace(/\s+/g, " ").trim())) {
        l.role = "button";
      } else if (cy > docH * 0.78) {
        l.role = "text"; // footer address text — gentle fade, keep as text
      } else if (cy < docH * 0.55) {
        l.role = "subtitle";
      }
    }
  }

  // 4. Small images near the bottom: treat repeated ones as UI cards, a lone one as logo.
  const bottomImgs = visible.filter(
    (l) => isImageLike(l) && l.role === "unknown" && l.bounds.y + l.bounds.height / 2 > docH * 0.7
  );
  if (bottomImgs.length >= 3) {
    for (const l of bottomImgs) l.role = "ui_card";
  } else {
    for (const l of bottomImgs) {
      const cover = (l.bounds.width * l.bounds.height) / area;
      l.role = cover < 0.05 ? "icon" : "logo";
    }
  }

  // Refresh suggested-animation labels to match refined roles.
  for (const l of layers) {
    if (l.role !== "unknown") l.suggestedAnimation = suggestedAnimationFor(l.role).label;
  }

  const counts: Record<string, number> = {};
  for (const l of layers) counts[l.role] = (counts[l.role] ?? 0) + 1;
  log.info("Refined roles: " + JSON.stringify(counts));
}

function buildSuggestions(layers: AnalyzedLayer[]): string[] {
  const out: string[] = [];
  const roles = layers.map((l) => l.role);
  const count = (r: string) => roles.filter((x) => x === r).length;

  if (count("background") >= 2) {
    out.push("Use background parallax because there are separated BG layers.");
  } else if (count("background") === 1) {
    out.push("Apply a subtle single-layer background parallax for depth.");
  }
  if (count("ui_card") >= 2) {
    out.push("Use staggered card reveal because multiple Card_ layers were detected.");
  }
  if (count("phone_mockup") + count("main_mockup") >= 1) {
    out.push("Slide the main mockup in with scale + light blur for cinematic depth.");
  }
  if (count("icon") >= 1) {
    out.push("Give icons a small continuous float so the scene feels alive without distraction.");
  }
  if (layers.some((l) => l.locked || l.role === "locked_text")) {
    out.push("Protect all LOCKED text layers and only animate transform properties.");
  }
  if (count("logo") >= 1) {
    out.push("Reveal the logo softly (opacity + slight scale), never spin or bounce it.");
  }
  out.push("Animate strictly according to visual hierarchy: background → title → subtitle → mockup → cards → icons.");
  return out;
}
