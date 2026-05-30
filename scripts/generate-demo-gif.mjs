import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";

const input = process.argv[2] || "work_preview.png";
const output = process.argv[3] || "assets/demo.gif";

const width = 360;
const height = 640;
const frames = 44;
const delay = 45;

await mkdir(path.dirname(output), { recursive: true });

const encoder = new GIFEncoder(width, height, "neuquant", true);
encoder.setDelay(delay);
encoder.setRepeat(0);
encoder.setQuality(12);

const stream = createWriteStream(output);
encoder.createReadStream().pipe(stream);
encoder.start();

for (let i = 0; i < frames; i++) {
  const t = i / (frames - 1);
  const ease = 1 - Math.pow(1 - Math.min(t * 1.4, 1), 3);
  const loop = Math.sin(t * Math.PI * 2);
  const zoom = 1.08 - ease * 0.05 + loop * 0.006;
  const slideY = Math.round((1 - ease) * 36 + loop * 5);
  const blur = Math.max(0, 4 * (1 - ease));

  let pipeline = sharp(input)
    .resize(Math.round(width * zoom), Math.round(height * zoom), { fit: "cover" })
    .extract({
      left: Math.max(0, Math.round((width * zoom - width) / 2)),
      top: Math.max(0, Math.round((height * zoom - height) / 2 - slideY)),
      width,
      height,
    });

  if (blur >= 0.3) {
    pipeline = pipeline.blur(blur);
  }

  const frame = await pipeline
    .modulate({ brightness: 0.96 + ease * 0.04, saturation: 1.04 })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}">
            <defs>
              <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#000" stop-opacity="${0.18 * (1 - ease)}"/>
                <stop offset="58%" stop-color="#000" stop-opacity="0"/>
                <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#shade)"/>
            <rect x="${Math.round(-120 + ease * 520)}" y="0" width="68" height="${height}"
              fill="#fff" opacity="${0.12 * Math.sin(Math.min(t, 0.75) / 0.75 * Math.PI)}"
              transform="skewX(-18)"/>
          </svg>`
        ),
        blend: "screen",
      },
    ])
    .removeAlpha()
    .raw()
    .toBuffer();

  encoder.addFrame(frame);
}

encoder.finish();

await new Promise((resolve, reject) => {
  stream.on("finish", resolve);
  stream.on("error", reject);
});

console.log(`Wrote ${output}`);
