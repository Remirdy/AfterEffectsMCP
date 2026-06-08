import path from "node:path";
import { promises as fs } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";

export type RasterVfxKind = "auto" | "fire" | "energy" | "portal" | "shockwave" | "magic" | "sparks";

export interface RasterVfxPlateOptions {
  prompt: string;
  outputFolder: string;
  kind?: RasterVfxKind;
  width?: number;
  height?: number;
  frames?: number;
  fps?: number;
  loop?: boolean;
  exportNormal?: boolean;
}

export interface RasterVfxPlateResult {
  kind: Exclude<RasterVfxKind, "auto">;
  framesFolder: string;
  firstFramePath: string;
  framePattern: string;
  normalFramesFolder?: string;
  width: number;
  height: number;
  frames: number;
  fps: number;
  notes: string[];
}

function inferKind(prompt: string, kind: RasterVfxKind = "auto"): Exclude<RasterVfxKind, "auto"> {
  if (kind !== "auto") return kind;
  if (/\b(fire|flame|ate[sş]|alev|ember)\b/i.test(prompt)) return "fire";
  if (/\b(portal|vortex|wormhole|girdap)\b/i.test(prompt)) return "portal";
  if (/\b(shockwave|shock\s*wave|impact|hit|darbe)\b/i.test(prompt)) return "shockwave";
  if (/\b(magic|spell|arcane|b[uü]y[uü]|sihir)\b/i.test(prompt)) return "magic";
  if (/\b(spark|k[ıi]v[ıi]lc[ıi]m)\b/i.test(prompt)) return "sparks";
  return "energy";
}

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function smooth(v: number): number {
  return v * v * (3 - 2 * v);
}

function noise(x: number, y: number, t: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const tt = Math.floor(t);
  const a = rand(ix * 157 + iy * 313 + tt * 911);
  const b = rand((ix + 1) * 157 + iy * 313 + tt * 911);
  const c = rand(ix * 157 + (iy + 1) * 313 + tt * 911);
  const d = rand((ix + 1) * 157 + (iy + 1) * 313 + tt * 911);
  const u = smooth(fx);
  const v = smooth(fy);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

// Worley Noise / Cellular noise for magic rune styles
function worley(x: number, y: number, t: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let minDist = 1e9;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx;
      const cy = iy + dy;
      const seed = cx * 73 + cy * 197 + Math.floor(t) * 97;
      const px = cx + rand(seed);
      const py = cy + rand(seed + 1);
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist < minDist) minDist = dist;
    }
  }
  return minDist;
}

// Loop-safe FBM Noise using trigonometry wrapping in time dimension
function fbmLoop(x: number, y: number, frame: number, totalFrames: number, frequencyScale: number = 1): number {
  let v = 0;
  let amp = 0.56;
  let freq = 1 * frequencyScale;
  const angle = (frame / totalFrames) * 2 * Math.PI;
  // Circular wrapping coordinates for time loop
  const tx = Math.cos(angle) * 1.5;
  const ty = Math.sin(angle) * 1.5;

  for (let i = 0; i < 5; i++) {
    const n1 = noise(x * freq, y * freq, tx + i * 21.3);
    const n2 = noise(x * freq + 50, y * freq + 50, ty + i * 43.7);
    const n = (n1 * (Math.cos(angle) + 1) * 0.5) + (n2 * (Math.sin(angle) + 1) * 0.5);
    v += n * amp;
    freq *= 2.03;
    amp *= 0.51;
  }
  return v;
}

// Curl Noise for fluid trails
function curlNoise(x: number, y: number, frame: number, totalFrames: number): { x: number; y: number } {
  const eps = 0.01;
  const n_x1 = fbmLoop(x + eps, y, frame, totalFrames);
  const n_x2 = fbmLoop(x - eps, y, frame, totalFrames);
  const n_y1 = fbmLoop(x, y + eps, frame, totalFrames);
  const n_y2 = fbmLoop(x, y - eps, frame, totalFrames);
  return {
    x: (n_y1 - n_y2) / (2 * eps),
    y: -(n_x1 - n_x2) / (2 * eps)
  };
}

function fireRamp(v: number): [number, number, number, number] {
  v = Math.max(0, Math.min(1, v));
  if (v < 0.16) return [50, 5, 0, v * 0.35];
  if (v < 0.38) return [160 + 250 * v, 25 + 100 * v, 0, 0.25 + v * 0.95];
  if (v < 0.68) return [255, 70 + (145 * (v - 0.38)) / 0.3, 4, 0.66 + v * 0.26];
  if (v < 0.88) return [255, 210 + (45 * (v - 0.68)) / 0.2, 55 + (95 * (v - 0.68)) / 0.2, 0.94];
  return [255, 255, 190 + (65 * (v - 0.88)) / 0.12, 1];
}

function glow(ctx: any, x: number, y: number, r: number, c: [number, number, number], a: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  g.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.22})`);
  g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpark(ctx: any, width: number, height: number, t: number, i: number, frame: number, totalFrames: number, isLoop: boolean): void {
  const cx = width / 2;
  const birth = (i * 0.041) % 3.7;
  const cycleTime = isLoop ? (frame / totalFrames) : t;
  const age = ((cycleTime + birth) % 2.15) / 2.15;
  const sx = cx + (rand(i * 17) - 0.5) * (width * 0.54);
  const sy = height * 0.84 + rand(i * 23) * (height * 0.07);
  const drift = (rand(i * 31) - 0.5) * (width * 0.32);
  const rise = height * 0.22 + rand(i * 41) * (height * 0.72);

  // Use Curl noise displacement to make spark paths organic
  const curl = curlNoise(sx * 0.01, sy * 0.01, frame, totalFrames);
  const x = sx + drift * age + Math.sin(cycleTime * 9 + i) * 22 + curl.x * 40;
  const y = sy - rise * age + curl.y * 40;

  const len = 18 + rand(i * 11) * 62;
  const angle = -Math.PI / 2 + (rand(i * 7) - 0.5) * 1.35;
  const a = Math.pow(1 - age, 1.5) * (0.2 + rand(i) * 0.9);
  const x2 = x - Math.cos(angle) * len;
  const y2 = y - Math.sin(angle) * len;
  const grad = ctx.createLinearGradient(x2, y2, x, y);
  grad.addColorStop(0, "rgba(255,60,0,0)");
  grad.addColorStop(0.35, `rgba(255,105,8,${a * 0.42})`);
  grad.addColorStop(1, `rgba(255,245,150,${a})`);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1 + rand(i * 5) * 2.3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x, y);
  ctx.stroke();
  if (i % 7 === 0) glow(ctx, x, y, 14 + rand(i) * 18, [255, 135, 20], a * 0.28);
}

function drawFieldFrame(ctx: any, kind: Exclude<RasterVfxKind, "auto">, width: number, height: number, frame: number, totalFrames: number, fps: number, isLoop: boolean): void {
  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  if (kind === "fire") {
    glow(ctx, cx, height * 0.84, width * 0.44, [255, 70, 8], 0.16);
    glow(ctx, cx, height * 0.78, width * 0.27, [255, 185, 35], 0.19);
  } else {
    const col: [number, number, number] = kind === "portal" || kind === "magic" ? [120, 70, 255] : [60, 210, 255];
    glow(ctx, cx, cy, width * 0.38, col, 0.34);
  }

  const image = ctx.createImageData(width, height);
  const data = image.data;
  const baseY = kind === "fire" ? height * 0.89 : height * 0.5;
  const yStart = kind === "fire" ? Math.floor(height * 0.1) : Math.floor(height * 0.12);
  const yEnd = kind === "fire" ? height : Math.floor(height * 0.88);

  // Use Curl or Worley noise depending on kind
  const isMagic = kind === "magic" || kind === "portal";

  for (let y = yStart; y < yEnd; y++) {
    for (let x = Math.floor(width * 0.13); x < Math.floor(width * 0.87); x++) {
      let value = 0;
      if (kind === "fire") {
        const h = (baseY - y) / (height * 0.78);
        if (h < -0.08 || h > 1.12) continue;
        const px = (x - cx) / (width * 0.28);

        // Looping dynamic plume math
        const loopAngle = (frame / totalFrames) * 2 * Math.PI;
        const centerOffset = Math.sin(h * 7.5 + loopAngle) * 0.11 + Math.sin(h * 17 - loopAngle * 1.5) * 0.035;
        const plumeWidth = 0.98 - h * 0.78 + 0.06 * Math.sin(h * 13 + loopAngle * 1.2);
        const base = Math.max(0, 1 - Math.abs(px + centerOffset) / plumeWidth);

        const lick1 = fbmLoop(x * 0.012, y * 0.017, frame, totalFrames);
        const lick2 = fbmLoop(x * 0.028, y * 0.026, frame, totalFrames, 1.5);
        const gaps = fbmLoop(x * 0.038 + 20, y * 0.044, frame, totalFrames);

        value = Math.pow(base, 1.65) * (1.08 - h * 0.22) + lick1 * 0.44 + lick2 * 0.28 - h * 0.42;
        value -= Math.max(0, gaps - 0.56) * 0.52;
        value = Math.max(0, Math.min(1, (value - 0.5) * 2.55));
      } else {
        const dx = (x - cx) / (width * 0.32);
        const dy = (y - cy) / (height * 0.32);
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const cycleProgress = (frame / totalFrames);
        const ring = kind === "shockwave"
          ? Math.exp(-Math.pow((r - ((cycleProgress * 0.9) % 1.1)) * 8, 2))
          : Math.exp(-Math.pow((r - 0.48) * 6, 2));

        let swirl = 0;
        if (isMagic) {
          // Cellular Worley noise for rune effects
          const wTime = (frame / totalFrames) * 10;
          swirl = 1 - worley(dx * 8 + Math.cos(angle) * 3, dy * 8 + Math.sin(angle) * 3, wTime);
        } else {
          swirl = fbmLoop(Math.cos(angle) * 2 + r * 3, Math.sin(angle) * 2 + r * 3, frame, totalFrames);
        }
        value = Math.max(0, ring * (0.65 + swirl * 0.65) - r * 0.2);
      }
      if (value <= 0.018) continue;
      const idx = (y * width + x) * 4;
      const ramp =
        kind === "fire"
          ? fireRamp(value)
          : ([80 + value * 120, isMagic ? 70 + value * 80 : 170 + value * 70, 255, Math.min(1, value)] as [number, number, number, number]);
      data[idx] = Math.min(255, data[idx] + ramp[0] * ramp[3]);
      data[idx + 1] = Math.min(255, data[idx + 1] + ramp[1] * ramp[3]);
      data[idx + 2] = Math.min(255, data[idx + 2] + ramp[2] * ramp[3]);
      data[idx + 3] = Math.min(255, data[idx + 3] + ramp[3] * 220);
    }
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalCompositeOperation = "lighter";
  const sparkCount = kind === "fire" || kind === "sparks" ? 180 : 80;
  for (let i = 0; i < sparkCount; i++) drawSpark(ctx, width, height, t, i, frame, totalFrames, isLoop);
}

// Compute Sobel Filter Normal Map on the canvas ImageData
export function generateNormalMap(diffuseCanvas: any, normalCanvas: any, strength: number = 2.0) {
  const width = diffuseCanvas.width;
  const height = diffuseCanvas.height;
  const diffCtx = diffuseCanvas.getContext("2d");
  const normCtx = normalCanvas.getContext("2d");
  const diffData = diffCtx.getImageData(0, 0, width, height);
  const normData = normCtx.createImageData(width, height);
  const src = diffData.data;
  const dst = normData.data;

  const getIntensity = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    const idx = (cy * width + cx) * 4;
    // intensity = (R+G+B)/3 * A
    return ((src[idx] + src[idx + 1] + src[idx + 2]) / 3) * (src[idx + 3] / 255);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tl = getIntensity(x - 1, y - 1);
      const t  = getIntensity(x, y - 1);
      const tr = getIntensity(x + 1, y - 1);
      const l  = getIntensity(x - 1, y);
      const r  = getIntensity(x + 1, y);
      const bl = getIntensity(x - 1, y + 1);
      const b  = getIntensity(x, y + 1);
      const br = getIntensity(x + 1, y + 1);

      // Sobel kernel gradients
      const dx = (tl + 2 * l + bl) - (tr + 2 * r + br);
      const dy = (tl + 2 * t + tr) - (bl + 2 * b + br);

      let nx = dx * strength;
      let ny = dy * strength;
      let nz = 255.0; // blue base depth

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * width + x) * 4;
      dst[idx] = Math.round((nx + 1.0) * 127.5);
      dst[idx + 1] = Math.round((ny + 1.0) * 127.5);
      dst[idx + 2] = Math.round((nz + 1.0) * 127.5);
      dst[idx + 3] = src[idx + 3]; // match transparency
    }
  }
  normCtx.putImageData(normData, 0, 0);
}

export async function generateRasterVfxPlate(opts: RasterVfxPlateOptions): Promise<RasterVfxPlateResult> {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const frames = opts.frames ?? 120;
  const fps = opts.fps ?? 30;
  const isLoop = opts.loop ?? true;
  const exportNormal = opts.exportNormal ?? true;

  const kind = inferKind(opts.prompt, opts.kind);
  const framesFolder = path.join(opts.outputFolder, "frames");
  await fs.mkdir(framesFolder, { recursive: true });

  let normalFramesFolder = "";
  if (exportNormal) {
    normalFramesFolder = path.join(opts.outputFolder, "normal_frames");
    await fs.mkdir(normalFramesFolder, { recursive: true });
  }

  for (let frame = 0; frame < frames; frame++) {
    const diffCanvas = createCanvas(width, height);
    const diffCtx = diffCanvas.getContext("2d");
    drawFieldFrame(diffCtx, kind, width, height, frame, frames, fps, isLoop);
    await fs.writeFile(path.join(framesFolder, `frame_${String(frame).padStart(4, "0")}.png`), await diffCanvas.encode("png"));

    if (exportNormal) {
      const normCanvas = createCanvas(width, height);
      generateNormalMap(diffCanvas, normCanvas, 2.5);
      await fs.writeFile(path.join(normalFramesFolder, `normal_${String(frame).padStart(4, "0")}.png`), await normCanvas.encode("png"));
    }
  }

  const result: RasterVfxPlateResult = {
    kind,
    framesFolder,
    firstFramePath: path.join(framesFolder, "frame_0000.png"),
    framePattern: path.join(framesFolder, "frame_%04d.png"),
    width,
    height,
    frames,
    fps,
    notes: [
      "High-quality VFX plates are raster/noise/particle-field based by default.",
      "Organic looping implemented via trigonometric wrapping in time coordinates.",
      "Matched normal map sequence generated via 3x3 Sobel kernel edge filtering.",
      "Suitable for direct URP/HDRP flipbook normal-map lighting."
    ],
  };

  if (exportNormal) {
    result.normalFramesFolder = normalFramesFolder;
  }

  await fs.writeFile(path.join(opts.outputFolder, "raster-vfx-manifest.json"), JSON.stringify(result, null, 2), "utf8");
  return result;
}
