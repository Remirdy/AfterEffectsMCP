import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";

const beforePath = process.argv[2] || "work_preview.png";
const afterPath = process.argv[3] || "MotionPilot_Main.mp4";
const outputPath = process.argv[4] || "assets/before-after.gif";

const canvasW = 760;
const canvasH = 520;
const panelW = 236;
const panelH = 420;
const leftX = 76;
const rightX = 448;
const panelY = 72;
const frames = 40;
const fps = 8;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited ${code}\n${stderr}`));
    });
  });
}

async function coverImage(input, width, height) {
  return sharp(input)
    .resize(width, height, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
}

function shellSvg(afterOpacity) {
  return Buffer.from(`
    <svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="52%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" rx="28" fill="url(#bg)"/>
      <text x="48" y="42" fill="#f8fafc" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" font-weight="700">PSD to After Effects motion</text>
      <text x="48" y="64" fill="#94a3b8" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12">analysis → motion plan → animated AEP → render</text>

      <rect x="${leftX - 10}" y="${panelY - 10}" width="${panelW + 20}" height="${panelH + 20}" rx="22" fill="#020617" filter="url(#shadow)"/>
      <rect x="${rightX - 10}" y="${panelY - 10}" width="${panelW + 20}" height="${panelH + 20}" rx="22" fill="#020617" filter="url(#shadow)"/>
      <rect x="${leftX - 1}" y="${panelY - 1}" width="${panelW + 2}" height="${panelH + 2}" rx="16" fill="none" stroke="#334155" stroke-width="2"/>
      <rect x="${rightX - 1}" y="${panelY - 1}" width="${panelW + 2}" height="${panelH + 2}" rx="16" fill="none" stroke="#38bdf8" stroke-opacity="${afterOpacity}" stroke-width="2"/>

      <rect x="${leftX}" y="${panelY + panelH + 14}" width="76" height="26" rx="13" fill="#334155"/>
      <text x="${leftX + 38}" y="${panelY + panelH + 32}" text-anchor="middle" fill="#e2e8f0" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12" font-weight="700">BEFORE</text>
      <rect x="${rightX}" y="${panelY + panelH + 14}" width="66" height="26" rx="13" fill="#0284c7"/>
      <text x="${rightX + 33}" y="${panelY + panelH + 32}" text-anchor="middle" fill="#f8fafc" font-family="Inter, Helvetica, Arial, sans-serif" font-size="12" font-weight="700">AFTER</text>

      <path d="M338 269 H405" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round"/>
      <path d="M392 252 L410 269 L392 286" fill="none" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="374" cy="269" r="46" fill="none" stroke="#38bdf8" stroke-opacity="${0.3 + afterOpacity * 0.45}" stroke-width="2"/>
      <text x="374" y="326" text-anchor="middle" fill="#94a3b8" font-family="Inter, Helvetica, Arial, sans-serif" font-size="11">MotionPilot</text>
    </svg>
  `);
}

await mkdir(path.dirname(outputPath), { recursive: true });
const tmpDir = await mkdtemp(path.join(os.tmpdir(), "motionpilot-before-after-"));

try {
  await run(ffmpeg, [
    "-y",
    "-i",
    afterPath,
    "-vf",
    `fps=${fps},scale=${panelW}:${panelH}:force_original_aspect_ratio=increase,crop=${panelW}:${panelH}`,
    "-frames:v",
    String(frames),
    path.join(tmpDir, "frame-%03d.png"),
  ]);

  const frameFiles = (await readdir(tmpDir))
    .filter((name) => name.endsWith(".png"))
    .sort()
    .map((name) => path.join(tmpDir, name));

  if (!frameFiles.length) {
    throw new Error("No video frames were extracted.");
  }

  const before = await coverImage(beforePath, panelW, panelH);
  const encoder = new GIFEncoder(canvasW, canvasH, "neuquant", true);
  encoder.setDelay(1000 / fps);
  encoder.setRepeat(0);
  encoder.setQuality(12);

  const stream = createWriteStream(outputPath);
  encoder.createReadStream().pipe(stream);
  encoder.start();

  for (let i = 0; i < frameFiles.length; i++) {
    const t = i / Math.max(frameFiles.length - 1, 1);
    const pulse = 0.5 + Math.sin(t * Math.PI * 2) * 0.5;
    const after = await coverImage(frameFiles[i], panelW, panelH);
    const raw = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 3,
        background: "#0f172a",
      },
    })
      .composite([
        { input: shellSvg(pulse), left: 0, top: 0 },
        { input: before, left: leftX, top: panelY },
        { input: after, left: rightX, top: panelY },
      ])
      .raw()
      .toBuffer();
    encoder.addFrame(raw);
  }

  encoder.finish();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  console.log(`Wrote ${outputPath}`);
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}
