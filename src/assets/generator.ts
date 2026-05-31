/**
 * MotionPilot procedural image-asset pack generator.
 *
 * Produces a richly detailed, depth-aware set of high-quality PNG plates that
 * `create_3d_scene_from_assets` assembles into a parallax 2.5D After Effects
 * shot (and then finishes with a real cinematic VFX pass: bloom, shine sweep,
 * graded vignette and film grain).
 *
 * DESIGN PHILOSOPHY (mirrors the VFX library quality bar):
 *  - Nothing is a flat shape. Every plate is built from multi-stop gradients,
 *    radial light, soft shadow, rim/spec highlights, blur and organic grain.
 *  - Detail density is high: HUD reticles, tick-marked rings, plexus networks,
 *    perspective grids, fine particle fields and emissive cores — not 3 circles.
 *  - High contrast + a single emissive focal subject so the shot reads, instead
 *    of washing out into a blurry gradient.
 *  - The set + palette adapt to `style` and to color words in the prompt.
 *  - Each plate carries z-depth / scale / position / blend so the downstream 3D
 *    scene gets real parallax separation.
 */

import path from "node:path";
import sharp from "sharp";
import { CreateImageAssetPackInput } from "../schemas.js";
import { ensureDir, writeJson } from "../util.js";

type Style = CreateImageAssetPackInput["style"];

type AssetItem = {
  name: string;
  path: string;
  role: string;
  /** Parallax depth (higher = further back, moves less). */
  z: number;
  scale: number;
  position: [number, number];
  blend: "normal" | "add" | "screen" | "multiply";
  motion: string;
};

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function normHex(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const t = input.trim();
  if (/^#?[0-9a-f]{6}$/i.test(t)) return t.startsWith("#") ? t : `#${t}`;
  if (/^#?[0-9a-f]{3}$/i.test(t)) {
    const h = t.replace("#", "");
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return fallback;
}

const COLOR_WORDS: Array<{ re: RegExp; hex: string }> = [
  { re: /\b(blue|mavi|ocean|deniz)\b/i, hex: "#2563eb" },
  { re: /\b(cyan|teal|turkuaz|aqua)\b/i, hex: "#14b8ff" },
  { re: /\b(purple|mor|violet|amethyst)\b/i, hex: "#7c3aed" },
  { re: /\b(magenta|pink|pembe|fuchsia)\b/i, hex: "#ec4899" },
  { re: /\b(red|kırmızı|crimson|scarlet)\b/i, hex: "#ef4444" },
  { re: /\b(orange|turuncu|amber|sunset)\b/i, hex: "#f97316" },
  { re: /\b(gold|altın|yellow|sarı)\b/i, hex: "#facc15" },
  { re: /\b(green|yeşil|emerald|mint)\b/i, hex: "#10b981" },
  { re: /\b(white|beyaz|snow)\b/i, hex: "#f8fafc" },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function shade(hex: string, t: number): string {
  return t < 0 ? mix(hex, "#000000", -t) : mix(hex, "#ffffff", t);
}

// Deterministic pseudo-random in [0,1) for repeatable detail scatter.
function rnd(i: number, salt = 1): number {
  const x = Math.sin(i * 127.1 * salt + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Style-driven palette
// ---------------------------------------------------------------------------

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  ink: string;
}

const STYLE_PALETTES: Record<Style, string[]> = {
  brandFilm: ["#ff7900", "#0051a0", "#14b8ff", "#ffffff"],
  educationAd: ["#2563eb", "#0ea5e9", "#22d3ee", "#f8fafc"],
  tech3d: ["#14b8ff", "#7c3aed", "#22d3ee", "#e0f2fe"],
  abstract3d: ["#ec4899", "#7c3aed", "#f97316", "#fde68a"],
  socialAd: ["#f43f5e", "#8b5cf6", "#22d3ee", "#fff7ed"],
};

function buildPalette(style: Style, prompt: string, override?: string[]): Palette {
  const base = STYLE_PALETTES[style] ?? STYLE_PALETTES.brandFilm;
  const primary = normHex(override?.[0], base[0]);
  const secondary = normHex(override?.[1], base[1]);
  let accent = normHex(override?.[2], base[2]);
  const light = normHex(override?.[3], base[3]);
  if (!override?.length) {
    for (const c of COLOR_WORDS) {
      if (c.re.test(prompt)) {
        accent = c.hex;
        break;
      }
    }
  }
  const ink = "#04060f";
  return { primary, secondary, accent, light, ink };
}

// ---------------------------------------------------------------------------
// Reusable SVG filter / def fragments
// ---------------------------------------------------------------------------

function grainDef(id: string, opacity: number): string {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${opacity} 0"/>
  </filter>`;
}

function blurDef(id: string, std: number): string {
  return `<filter id="${id}"><feGaussianBlur stdDeviation="${std}"/></filter>`;
}

function dropShadowDef(id: string, dy: number, blur: number, opacity: number): string {
  return `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="#000" flood-opacity="${opacity}"/>
  </filter>`;
}

function svg(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

async function writeSvgPng(filePath: string, width: number, height: number, body: string) {
  await sharp(Buffer.from(svg(width, height, body))).png({ compressionLevel: 9 }).toFile(filePath);
}

// ---------------------------------------------------------------------------
// Plate builders
// ---------------------------------------------------------------------------

function plateBackground(w: number, h: number, p: Palette): string {
  // Deep, contrasty base so the emissive subject reads. Strong vignette.
  return `<defs>
    <linearGradient id="bgGrad" x1="0.1" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${shade(p.secondary, -0.18)}"/>
      <stop offset="50%" stop-color="${shade(p.secondary, -0.4)}"/>
      <stop offset="100%" stop-color="${shade(p.ink, 0.12)}"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${shade(p.accent, 0.15)}" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="${p.primary}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${p.ink}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="46%" r="72%">
      <stop offset="50%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#bgGlow)"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>`;
}

function plateGlowCore(w: number, h: number, p: Palette): string {
  // Big soft emissive halo behind the hero — gives bloom something to grab and
  // separates the subject from the background.
  const cx = w * 0.5;
  const cy = h * 0.42;
  const r = Math.min(w, h) * 0.4;
  return `<defs>
    <radialGradient id="core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${shade(p.accent, 0.35)}" stop-opacity="0.85"/>
      <stop offset="32%" stop-color="${p.accent}" stop-opacity="0.4"/>
      <stop offset="70%" stop-color="${p.primary}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${p.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r.toFixed(0)}" fill="url(#core)"/>`;
}

function plateAtmosphere(w: number, h: number, p: Palette): string {
  const blobs = Array.from({ length: 6 }, (_, i) => {
    const cx = (0.12 + 0.15 * i) * w;
    const cy = (0.2 + 0.13 * (i % 3)) * h;
    const r = Math.min(w, h) * (0.18 + 0.05 * (i % 3));
    const col = i % 2 ? p.accent : p.primary;
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${col}" opacity="${(0.06 - i * 0.006).toFixed(3)}" filter="url(#haze)"/>`;
  }).join("");
  return `<defs>${blurDef("haze", Math.round(Math.min(w, h) * 0.06))}</defs>${blobs}`;
}

function plateLightRays(w: number, h: number, p: Palette): string {
  const cx = w * 0.5;
  const rays = Array.from({ length: 13 }, (_, i) => {
    const a = (-54 + i * 9) * (Math.PI / 180);
    const len = h * 1.25;
    const x2 = cx + Math.sin(a) * len;
    const y2 = -h * 0.12 + Math.cos(a) * len;
    return `<line x1="${cx}" y1="${(-h * 0.12).toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="url(#ray)" stroke-width="${(w * 0.04).toFixed(0)}" opacity="${(0.42 - Math.abs(i - 6) * 0.05).toFixed(2)}"/>`;
  }).join("");
  return `<defs>
    <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.light}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
    </linearGradient>
    ${blurDef("rayBlur", Math.round(w * 0.018))}
  </defs>
  <g filter="url(#rayBlur)">${rays}</g>`;
}

function plateParticles(w: number, h: number, p: Palette): string {
  // Fine dust / star field — dense detail without washing the subject.
  const dots = Array.from({ length: 90 }, (_, i) => {
    const x = rnd(i, 1) * w;
    const y = rnd(i, 2) * h;
    const r = 0.6 + rnd(i, 3) * 2.2;
    const o = 0.15 + rnd(i, 4) * 0.55;
    const col = i % 4 === 0 ? p.light : i % 4 === 1 ? p.accent : "#ffffff";
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${col}" opacity="${o.toFixed(2)}"/>`;
  }).join("");
  return `<defs>${blurDef("pb", 0.4)}</defs><g filter="url(#pb)">${dots}</g>`;
}

function plateBokeh(w: number, h: number, p: Palette): string {
  const dots = Array.from({ length: 22 }, (_, i) => {
    const x = rnd(i, 5) * w;
    const y = rnd(i, 6) * h;
    const r = 10 + rnd(i, 7) * 64;
    const col = i % 3 === 0 ? p.light : i % 3 === 1 ? p.accent : p.primary;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${col}" opacity="${(0.04 + rnd(i, 8) * 0.08).toFixed(2)}" filter="url(#bk)"/>`;
  }).join("");
  return `<defs>${blurDef("bk", 16)}</defs>${dots}`;
}

function plateGrid(w: number, h: number, p: Palette): string {
  // Perspective floor grid converging to a horizon — depth + tech feel.
  const hor = h * 0.6;
  const vp = w * 0.5;
  const vlines = Array.from({ length: 17 }, (_, i) => {
    const t = (i - 8) / 8;
    const xBottom = vp + t * w * 1.1;
    return `<line x1="${vp}" y1="${hor.toFixed(0)}" x2="${xBottom.toFixed(0)}" y2="${h}" stroke="${p.accent}" stroke-width="1" opacity="0.18"/>`;
  }).join("");
  const hlines = Array.from({ length: 12 }, (_, i) => {
    const yy = hor + Math.pow(i / 12, 1.8) * (h - hor);
    return `<line x1="0" y1="${yy.toFixed(0)}" x2="${w}" y2="${yy.toFixed(0)}" stroke="${p.accent}" stroke-width="1" opacity="${(0.2 - i * 0.012).toFixed(2)}"/>`;
  }).join("");
  return `<defs>${blurDef("gr", 0.3)}</defs><g filter="url(#gr)">${vlines}${hlines}</g>`;
}

function plateNetwork(w: number, h: number, p: Palette): string {
  const n = 30;
  const nodes = Array.from({ length: n }, (_, i) => ({ x: rnd(i, 9) * w, y: rnd(i, 10) * h }));
  let edges = "";
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < Math.min(w, h) * 0.2) {
        edges += `<line x1="${nodes[i].x.toFixed(0)}" y1="${nodes[i].y.toFixed(0)}" x2="${nodes[j].x.toFixed(0)}" y2="${nodes[j].y.toFixed(0)}" stroke="${p.accent}" stroke-width="1" opacity="${(0.3 - d / (Math.min(w, h) * 1.2)).toFixed(2)}"/>`;
      }
    }
  }
  const dots = nodes.map((nd, i) => `<circle cx="${nd.x.toFixed(0)}" cy="${nd.y.toFixed(0)}" r="${(2 + rnd(i, 11) * 2).toFixed(1)}" fill="${p.light}" opacity="0.8"/>`).join("");
  return `${edges}${dots}`;
}

function plateKineticStreaks(w: number, h: number, p: Palette): string {
  const streaks = Array.from({ length: 18 }, (_, i) => {
    const y = (i / 18) * h + (i % 2 ? 24 : -8);
    const x = i % 2 ? -w * 0.1 : w * 0.5;
    const len = w * (0.35 + (i % 3) * 0.13);
    return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${len.toFixed(0)}" height="${5 + (i % 3) * 2}" rx="4" fill="url(#streak)" opacity="${(0.1 + (i % 4) * 0.035).toFixed(2)}" transform="rotate(-15 ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }).join("");
  return `<defs>
    <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${p.light}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>${streaks}`;
}

function plateAccentRings(w: number, h: number, p: Palette): string {
  // Concentric rings with tick marks and rotating dashed segments — instrument
  // / reticle detail around the hero.
  const cx = w * 0.5;
  const cy = h * 0.42;
  const baseR = Math.min(w, h) * 0.26;
  let out = "";
  for (let i = 0; i < 5; i++) {
    const r = baseR + i * Math.min(w, h) * 0.045;
    const dash = i % 2 ? `stroke-dasharray="${6 + i * 4} ${14 + i * 5}"` : "";
    out += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(0)}" fill="none" stroke="${i % 2 ? p.light : p.accent}" stroke-width="${i % 2 ? 1.5 : 2.5}" opacity="${(0.4 - i * 0.05).toFixed(2)}" ${dash}/>`;
  }
  // Tick marks around the inner ring.
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r0 = baseR - 8;
    const r1 = baseR - (i % 4 === 0 ? 22 : 14);
    return `<line x1="${(cx + Math.cos(a) * r0).toFixed(1)}" y1="${(cy + Math.sin(a) * r0).toFixed(1)}" x2="${(cx + Math.cos(a) * r1).toFixed(1)}" y2="${(cy + Math.sin(a) * r1).toFixed(1)}" stroke="${p.light}" stroke-width="${i % 4 === 0 ? 2 : 1}" opacity="0.45"/>`;
  }).join("");
  return `<defs>${blurDef("ringGlow", 1.2)}</defs><g filter="url(#ringGlow)">${out}${ticks}</g>`;
}

function plateHud(w: number, h: number, p: Palette): string {
  // Corner brackets, data readout chips and a reticle — premium tech HUD detail.
  const m = Math.min(w, h) * 0.06;
  const bl = Math.min(w, h) * 0.07;
  const corner = (x: number, y: number, sx: number, sy: number) =>
    `<path d="M ${x} ${(y + sy * bl).toFixed(0)} L ${x} ${y} L ${(x + sx * bl).toFixed(0)} ${y}" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.55"/>`;
  const corners =
    corner(m, m, 1, 1) +
    corner(w - m, m, -1, 1) +
    corner(m, h - m, 1, -1) +
    corner(w - m, h - m, -1, -1);
  // Data chips (small bars + dots) scattered at the margins.
  const chips = Array.from({ length: 8 }, (_, i) => {
    const left = i % 2 === 0;
    const x = left ? m * 1.4 : w - m * 1.4 - 120;
    const y = h * (0.2 + i * 0.07);
    return `<g opacity="0.5"><circle cx="${x.toFixed(0)}" cy="${(y + 6).toFixed(0)}" r="4" fill="${p.accent}"/><rect x="${(x + 14).toFixed(0)}" y="${y.toFixed(0)}" width="${(70 + (i % 3) * 34)}" height="6" rx="3" fill="${p.light}" opacity="0.7"/></g>`;
  }).join("");
  // Reticle around hero center.
  const cx = w * 0.5;
  const cy = h * 0.42;
  const reticle = `<g opacity="0.5" stroke="${p.light}" stroke-width="1.5" fill="none">
    <line x1="${cx}" y1="${(cy - 24).toFixed(0)}" x2="${cx}" y2="${(cy - 60).toFixed(0)}"/>
    <line x1="${cx}" y1="${(cy + 24).toFixed(0)}" x2="${cx}" y2="${(cy + 60).toFixed(0)}"/>
    <line x1="${(cx - 24).toFixed(0)}" y1="${cy}" x2="${(cx - 60).toFixed(0)}" y2="${cy}"/>
    <line x1="${(cx + 24).toFixed(0)}" y1="${cy}" x2="${(cx + 60).toFixed(0)}" y2="${cy}"/>
  </g>`;
  return `${corners}${chips}${reticle}`;
}

function plateHero(w: number, h: number, p: Palette, style: Style): string {
  const cx = w * 0.5;
  const cy = h * 0.42;
  const r = Math.min(w, h) * 0.2;
  const faceted = style === "tech3d" || style === "abstract3d";
  const defs = `<defs>
    <radialGradient id="heroBody" cx="40%" cy="30%" r="68%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="22%" stop-color="${shade(p.light, 0.1)}"/>
      <stop offset="52%" stop-color="${p.accent}"/>
      <stop offset="100%" stop-color="${shade(p.secondary, -0.35)}"/>
    </radialGradient>
    <radialGradient id="heroRim" cx="50%" cy="50%" r="50%">
      <stop offset="76%" stop-color="${p.accent}" stop-opacity="0"/>
      <stop offset="93%" stop-color="${p.light}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
    </radialGradient>
    ${dropShadowDef("heroShadow", Math.round(r * 0.2), Math.round(r * 0.26), 0.55)}
  </defs>`;
  let body: string;
  if (faceted) {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
    // Inner facet web (triangles from center + concentric inner hex).
    const facets = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * r).toFixed(1)}" y2="${(cy + Math.sin(a) * r).toFixed(1)}" stroke="${p.light}" stroke-width="1.5" opacity="0.35"/>`;
    }).join("");
    const innerPts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2 + Math.PI / 6;
      return `${(cx + Math.cos(a) * r * 0.55).toFixed(1)},${(cy + Math.sin(a) * r * 0.55).toFixed(1)}`;
    }).join(" ");
    body = `<polygon points="${pts}" fill="url(#heroBody)" filter="url(#heroShadow)"/>${facets}
      <polygon points="${innerPts}" fill="none" stroke="${p.light}" stroke-width="1.5" opacity="0.4"/>
      <polygon points="${pts}" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.6"/>`;
  } else {
    body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#heroBody)" filter="url(#heroShadow)"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(0)}" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.25"/>`;
  }
  const spec = `<ellipse cx="${(cx - r * 0.3).toFixed(0)}" cy="${(cy - r * 0.42).toFixed(0)}" rx="${(r * 0.26).toFixed(0)}" ry="${(r * 0.14).toFixed(0)}" fill="#fff" opacity="0.85"/>`;
  const rim = `<circle cx="${cx}" cy="${cy}" r="${(r * 1.06).toFixed(0)}" fill="url(#heroRim)"/>`;
  const refl = `<ellipse cx="${cx}" cy="${(cy + r * 1.2).toFixed(0)}" rx="${(r * 0.62).toFixed(0)}" ry="${(r * 0.1).toFixed(0)}" fill="${p.accent}" opacity="0.22"/>`;
  return `${defs}${refl}${body}${spec}${rim}`;
}

function plateTitlePlate(w: number, h: number, p: Palette): string {
  const x = w * 0.12;
  const y = h * 0.13;
  const bw = w * 0.76;
  const bh = h * 0.16;
  return `<defs>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.03"/>
    </linearGradient>
    ${dropShadowDef("plateShadow", 16, 26, 0.45)}
  </defs>
  <rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" rx="${(bh * 0.2).toFixed(0)}" fill="url(#glass)" stroke="${p.light}" stroke-opacity="0.3" stroke-width="1.5" filter="url(#plateShadow)"/>
  <rect x="${(x + bw * 0.06).toFixed(0)}" y="${(y + bh * 0.4).toFixed(0)}" width="${(bw * 0.82).toFixed(0)}" height="14" rx="7" fill="${p.light}" opacity="0.95"/>
  <rect x="${(x + bw * 0.06).toFixed(0)}" y="${(y + bh * 0.66).toFixed(0)}" width="${(bw * 0.5).toFixed(0)}" height="8" rx="4" fill="${p.light}" opacity="0.6"/>`;
}

function plateCta(w: number, h: number, p: Palette): string {
  const bw = w * 0.6;
  const bh = Math.max(82, h * 0.08);
  const x = (w - bw) / 2;
  const y = h * 0.8;
  return `<defs>
    <linearGradient id="cta" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${shade(p.accent, 0.22)}"/>
      <stop offset="100%" stop-color="${shade(p.accent, -0.2)}"/>
    </linearGradient>
    ${dropShadowDef("ctaShadow", 14, 22, 0.55)}
  </defs>
  <rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" rx="${(bh / 2).toFixed(0)}" fill="url(#cta)" stroke="${p.light}" stroke-opacity="0.55" stroke-width="2" filter="url(#ctaShadow)"/>
  <rect x="${(x + bw * 0.3).toFixed(0)}" y="${(y + bh * 0.42).toFixed(0)}" width="${(bw * 0.4).toFixed(0)}" height="14" rx="7" fill="${p.light}" opacity="0.96"/>`;
}

function plateGrain(w: number, h: number, opacity: number): string {
  return `<defs>${grainDef("grain", opacity)}</defs><rect width="100%" height="100%" filter="url(#grain)"/>`;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export async function createImageAssetPack(input: CreateImageAssetPackInput) {
  const width = input.width;
  const height = input.height;
  const outDir = input.outputFolder;
  const style = input.style;
  const p = buildPalette(style, input.prompt, input.palette);
  await ensureDir(outDir);

  const assets: AssetItem[] = [];
  const queue: Array<{ item: AssetItem; body: string }> = [];

  const add = (
    name: string,
    role: string,
    z: number,
    scale: number,
    position: [number, number],
    blend: AssetItem["blend"],
    motion: string,
    body: string,
  ) => {
    const item: AssetItem = { name, path: path.join(outDir, `${name}.png`), role, z, scale, position, blend, motion };
    assets.push(item);
    queue.push({ item, body });
  };

  const cx = width / 2;
  const cy = height / 2;
  const heroY = height * 0.42;
  const tech = style === "tech3d" || style === "abstract3d";

  // Far → near (z high → low). Subject (hero ~z200) sits in front of glow_core
  // and rings; only fine particles, HUD linework, title/CTA and grain are nearer.
  add("bg_base", "background", 1000, 116, [cx, cy], "normal", "slowDrift", plateBackground(width, height, p));
  if (tech) {
    add("grid", "atmosphere", 900, 118, [cx, cy], "add", "parallaxOrbit", plateGrid(width, height, p));
  } else {
    add("kinetic_streaks", "atmosphere", 900, 112, [cx, cy], "screen", "liquidDrift", plateKineticStreaks(width, height, p));
  }
  add("atmosphere", "atmosphere", 820, 120, [cx, cy], "screen", "liquidDrift", plateAtmosphere(width, height, p));
  add("light_rays", "light", 700, 120, [cx, height * 0.3], "add", "lightPulse", plateLightRays(width, height, p));
  add("bokeh", "atmosphere", 640, 108, [cx, cy], "screen", "depthDrift", plateBokeh(width, height, p));
  if (tech) {
    add("network", "accent", 560, 116, [cx, cy], "add", "parallaxOrbit", plateNetwork(width, height, p));
  }
  add("glow_core", "light", 300, 104, [cx, heroY], "add", "lightPulse", plateGlowCore(width, height, p));
  add("accent_rings", "accent", 240, 100, [cx, heroY], "add", "rotateSlow", plateAccentRings(width, height, p));
  add("hero_element", "hero", 200, 88, [cx, heroY], "normal", "magneticFloat", plateHero(width, height, p, style));
  if (tech) {
    add("hud", "accent", 150, 100, [cx, cy], "add", "rotateSlow", plateHud(width, height, p));
  }
  add("particles", "foreground", 100, 106, [cx, cy], "screen", "depthDrift", plateParticles(width, height, p));
  add("title_plate", "title", 80, 100, [cx, height * 0.21], "normal", "slideFade", plateTitlePlate(width, height, p));
  add("cta_plate", "cta", 60, 96, [cx, height * 0.84], "normal", "overshootPop", plateCta(width, height, p));
  add("grain_overlay", "grain", 10, 100, [cx, cy], "screen", "static", plateGrain(width, height, 0.045));

  await Promise.all(queue.map(({ item, body }) => writeSvgPng(item.path, width, height, body)));

  const manifest = {
    ok: true,
    packageType: "motionpilot_image_asset_pack",
    version: "3.0",
    prompt: input.prompt,
    width,
    height,
    style,
    palette: { primary: p.primary, secondary: p.secondary, accent: p.accent, light: p.light, ink: p.ink },
    layerCount: assets.length,
    assets,
    afterEffects: {
      recommendedTool: "create_3d_scene_from_assets",
      camera: tech ? "slow orbital push with subtle parallax" : "gentle dolly-in with layered parallax",
      depthRange: { near: Math.min(...assets.map((a) => a.z)), far: Math.max(...assets.map((a) => a.z)) },
      motion: ["parallaxOrbit", "liquidDrift", "magneticFloat", "lightPulse", "cameraPush"],
      grade: tech ? "cold-blue with neon accent bloom" : "warm cinematic with soft vignette",
      finishingPass: "auto: motionBlur + premiumGlow(hero/core/rings) + lightSweep + cinematicGrade + filmGrain",
    },
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outDir, "asset-manifest.json");
  await writeJson(manifestPath, manifest);
  return { ...manifest, manifestPath };
}
