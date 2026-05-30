import path from "node:path";
import sharp from "sharp";
import { CreateImageAssetPackInput } from "../schemas.js";
import { ensureDir, writeJson } from "../util.js";

type AssetItem = {
  name: string;
  path: string;
  role: string;
  z: number;
  scale: number;
  position: [number, number];
};

function color(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  if (/^#?[0-9a-f]{6}$/i.test(input)) return input.startsWith("#") ? input : `#${input}`;
  return fallback;
}

function palette(input?: string[]): string[] {
  const p = input?.length ? input : ["#ff7900", "#0051a0", "#ffffff", "#14b8ff"];
  return [
    color(p[0], "#ff7900"),
    color(p[1], "#0051a0"),
    color(p[2], "#ffffff"),
    color(p[3], "#14b8ff"),
  ];
}

function svg(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

async function writeSvgPng(filePath: string, width: number, height: number, body: string) {
  await sharp(Buffer.from(svg(width, height, body))).png().toFile(filePath);
}

export async function createImageAssetPack(input: CreateImageAssetPackInput) {
  const width = input.width;
  const height = input.height;
  const outDir = input.outputFolder;
  const [primary, secondary, light, accent] = palette(input.palette);
  await ensureDir(outDir);

  const assets: AssetItem[] = [];
  const add = (name: string, role: string, z: number, scale: number, position: [number, number]) => {
    const item = { name, path: path.join(outDir, `${name}.png`), role, z, scale, position };
    assets.push(item);
    return item.path;
  };

  await writeSvgPng(
    add("bg_gradient", "background", 900, 120, [width / 2, height / 2]),
    width,
    height,
    `<defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="58%" stop-color="${secondary}"/>
        <stop offset="100%" stop-color="#050816"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="35%" r="58%">
        <stop offset="0%" stop-color="${accent}" stop-opacity=".42"/>
        <stop offset="65%" stop-color="${primary}" stop-opacity=".08"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#r)"/>`
  );

  await writeSvgPng(
    add("hero_orb", "hero", 80, 82, [width * 0.5, height * 0.4]),
    width,
    height,
    `<defs>
      <radialGradient id="orb" cx="42%" cy="34%" r="54%">
        <stop offset="0%" stop-color="${light}" stop-opacity=".96"/>
        <stop offset="42%" stop-color="${accent}" stop-opacity=".82"/>
        <stop offset="100%" stop-color="${secondary}" stop-opacity=".82"/>
      </radialGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="34" stdDeviation="32" flood-color="#000" flood-opacity=".34"/></filter>
    </defs>
    <circle cx="${width / 2}" cy="${height * 0.43}" r="${Math.min(width, height) * 0.22}" fill="url(#orb)" filter="url(#shadow)"/>
    <circle cx="${width * 0.44}" cy="${height * 0.36}" r="${Math.min(width, height) * 0.055}" fill="#fff" opacity=".72"/>`
  );

  await writeSvgPng(
    add("connection_rings", "accent", 240, 92, [width / 2, height * 0.42]),
    width,
    height,
    Array.from({ length: 8 }, (_, i) => {
      const r = 150 + i * 42;
      return `<circle cx="${width / 2}" cy="${height * 0.43}" r="${r}" fill="none" stroke="${i % 2 ? light : accent}" stroke-width="${i % 3 === 0 ? 4 : 2}" opacity="${0.2 - i * 0.015}"/>`;
    }).join("")
  );

  await writeSvgPng(
    add("kinetic_streaks", "accent", 420, 100, [width / 2, height * 0.5]),
    width,
    height,
    Array.from({ length: 18 }, (_, i) => {
      const y = 180 + i * 84;
      const x = i % 2 ? -120 : width * 0.55;
      return `<rect x="${x}" y="${y}" width="${width * 0.58}" height="8" rx="4" fill="${i % 2 ? light : accent}" opacity=".18" transform="rotate(-18 ${x} ${y})"/>`;
    }).join("")
  );

  await writeSvgPng(
    add("title_plate", "title", 40, 100, [width / 2, height * 0.22]),
    width,
    height,
    `<rect x="${width * 0.12}" y="${height * 0.12}" width="${width * 0.76}" height="${height * 0.16}" rx="34" fill="#020617" opacity=".34"/>
     <rect x="${width * 0.16}" y="${height * 0.24}" width="${width * 0.68}" height="10" rx="5" fill="${light}" opacity=".72"/>`
  );

  await writeSvgPng(
    add("cta_plate", "cta", -120, 96, [width / 2, height * 0.82]),
    width,
    height,
    `<rect x="${width * 0.18}" y="${height * 0.75}" width="${width * 0.64}" height="112" rx="56" fill="${secondary}" stroke="${light}" stroke-width="5"/>
     <rect x="${width * 0.28}" y="${height * 0.792}" width="${width * 0.44}" height="18" rx="9" fill="${light}" opacity=".9"/>`
  );

  const manifest = {
    ok: true,
    prompt: input.prompt,
    width,
    height,
    style: input.style,
    palette: [primary, secondary, light, accent],
    assets,
    afterEffects: {
      recommendedTool: "create_3d_scene_from_assets",
      camera: "slow push with orbital parallax",
      motion: ["parallaxOrbit", "liquidDrift", "magneticSnap", "lightSweep", "cameraPush"],
    },
    generatedAt: new Date().toISOString(),
  };

  const manifestPath = path.join(outDir, "asset-manifest.json");
  await writeJson(manifestPath, manifest);
  return { ...manifest, manifestPath };
}
