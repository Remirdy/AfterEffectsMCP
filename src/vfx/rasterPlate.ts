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
}

export interface RasterVfxPlateResult {
  kind: Exclude<RasterVfxKind, "auto">;
  framesFolder: string;
  firstFramePath: string;
  framePattern: string;
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

function fbm(x: number, y: number, t: number): number {
  let v = 0;
  let amp = 0.56;
  let freq = 1;
  for (let i = 0; i < 6; i++) {
    v += noise(x * freq, y * freq, t * (1 + i * 0.31)) * amp;
    freq *= 2.03;
    amp *= 0.51;
  }
  return v;
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

function drawSpark(ctx: any, width: number, height: number, t: number, i: number): void {
  const cx = width / 2;
  const birth = (i * 0.041) % 3.7;
  const age = ((t + birth) % 2.15) / 2.15;
  const sx = cx + (rand(i * 17) - 0.5) * (width * 0.54);
  const sy = height * 0.84 + rand(i * 23) * (height * 0.07);
  const drift = (rand(i * 31) - 0.5) * (width * 0.32);
  const rise = height * 0.22 + rand(i * 41) * (height * 0.72);
  const x = sx + drift * age + Math.sin(t * 9 + i) * 22;
  const y = sy - rise * age;
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

function drawFieldFrame(ctx: any, kind: Exclude<RasterVfxKind, "auto">, width: number, height: number, frame: number, fps: number): void {
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
  for (let y = yStart; y < yEnd; y++) {
    for (let x = Math.floor(width * 0.13); x < Math.floor(width * 0.87); x++) {
      let value = 0;
      if (kind === "fire") {
        const h = (baseY - y) / (height * 0.78);
        if (h < -0.08 || h > 1.12) continue;
        const px = (x - cx) / (width * 0.28);
        const centerOffset = Math.sin(h * 7.5 + t * 2.2) * 0.11 + Math.sin(h * 17 - t * 3.4) * 0.035;
        const plumeWidth = 0.98 - h * 0.78 + 0.06 * Math.sin(h * 13 + t * 3.2);
        const base = Math.max(0, 1 - Math.abs(px + centerOffset) / plumeWidth);
        const lick1 = fbm(x * 0.012 + Math.sin(t * 1.7) * 3, y * 0.017 - t * 7.5, t * 3.1);
        const lick2 = fbm(x * 0.028, y * 0.026 - t * 15.5, t * 5.7);
        const gaps = fbm(x * 0.038 + 20, y * 0.044 - t * 18, t * 6.5);
        value = Math.pow(base, 1.65) * (1.08 - h * 0.22) + lick1 * 0.44 + lick2 * 0.28 - h * 0.42;
        value -= Math.max(0, gaps - 0.56) * 0.52;
        value = Math.max(0, Math.min(1, (value - 0.5) * 2.55));
      } else {
        const dx = (x - cx) / (width * 0.32);
        const dy = (y - cy) / (height * 0.32);
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const ring = kind === "shockwave" ? Math.exp(-Math.pow((r - ((t * 0.7) % 1.1)) * 8, 2)) : Math.exp(-Math.pow((r - 0.48) * 6, 2));
        const swirl = fbm(Math.cos(angle + t * 2) * 2 + r * 3, Math.sin(angle - t * 2) * 2 + r * 3, t * 5);
        value = Math.max(0, ring * (0.65 + swirl * 0.65) - r * 0.2);
      }
      if (value <= 0.018) continue;
      const idx = (y * width + x) * 4;
      const ramp =
        kind === "fire"
          ? fireRamp(value)
          : ([80 + value * 120, kind === "magic" || kind === "portal" ? 70 + value * 80 : 170 + value * 70, 255, Math.min(1, value)] as [number, number, number, number]);
      data[idx] = Math.min(255, data[idx] + ramp[0] * ramp[3]);
      data[idx + 1] = Math.min(255, data[idx + 1] + ramp[1] * ramp[3]);
      data[idx + 2] = Math.min(255, data[idx + 2] + ramp[2] * ramp[3]);
      data[idx + 3] = Math.min(255, data[idx + 3] + ramp[3] * 220);
    }
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalCompositeOperation = "lighter";
  const sparkCount = kind === "fire" || kind === "sparks" ? 180 : 80;
  for (let i = 0; i < sparkCount; i++) drawSpark(ctx, width, height, t, i);
}

export async function generateRasterVfxPlate(opts: RasterVfxPlateOptions): Promise<RasterVfxPlateResult> {
  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const frames = opts.frames ?? 120;
  const fps = opts.fps ?? 30;
  const kind = inferKind(opts.prompt, opts.kind);
  const framesFolder = path.join(opts.outputFolder, "frames");
  await fs.mkdir(framesFolder, { recursive: true });

  for (let frame = 0; frame < frames; frame++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    drawFieldFrame(ctx, kind, width, height, frame, fps);
    await fs.writeFile(path.join(framesFolder, `frame_${String(frame).padStart(4, "0")}.png`), await canvas.encode("png"));
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
      "Geometric AE shape fallbacks should be used only when raster plate generation is unavailable.",
      "Fire uses an organic turbulent heat field plus real spark streaks and smoke/glow volumes.",
    ],
  };
  await fs.writeFile(path.join(opts.outputFolder, "raster-vfx-manifest.json"), JSON.stringify(result, null, 2), "utf8");
  return result;
}
