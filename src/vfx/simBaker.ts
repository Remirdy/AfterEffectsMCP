import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { ensureDir, writeJson } from "../util.js";

export interface SimBakerOptions {
  outputFolder: string;
  frameCount?: number;
  width?: number;
  height?: number;
  columns?: number;
  type?: "fire" | "energy" | "shockwave";
}

export class VfxSimulationBaker {
  async bakeSimulation(opts: SimBakerOptions): Promise<{ spritesheetPath: string; manifestPath: string }> {
    const frameCount = opts.frameCount ?? 16;
    const width = opts.width ?? 256;
    const height = opts.height ?? 256;
    const cols = opts.columns ?? Math.ceil(Math.sqrt(frameCount));
    const rows = Math.ceil(frameCount / cols);

    const sheetWidth = cols * width;
    const sheetHeight = rows * height;

    await ensureDir(opts.outputFolder);

    const canvas = createCanvas(sheetWidth, sheetHeight);
    const ctx = canvas.getContext("2d");

    const framesMeta: any[] = [];

    // Procedural render of simulation frames
    for (let i = 0; i < frameCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * width;
      const y = row * height;
      const progress = i / (frameCount - 1);

      ctx.save();
      ctx.translate(x, y);

      // Draw background-free procedural simulation
      const centerX = width / 2;
      const centerY = height / 2;

      if (opts.type === "shockwave") {
        // Growing shockwave ring
        const radius = (width / 2.3) * progress;
        const alpha = 1 - progress;
        ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
        ctx.lineWidth = 12 * (1 - progress);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (opts.type === "fire") {
        // Swirling fire flame
        const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY + (height/6) * progress, (width/2.5) * (0.3 + progress * 0.7));
        grad.addColorStop(0, "rgba(255, 240, 150, 1)");
        grad.addColorStop(0.3, "rgba(255, 120, 0, 0.8)");
        grad.addColorStop(0.7, "rgba(200, 20, 0, 0.3)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX + Math.sin(progress * Math.PI * 4) * 10, centerY - progress * 20, (width/3) * (0.3 + progress * 0.7), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Swirling plasma energy ball
        const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, (width/2.2) * (0.2 + progress * 0.8));
        grad.addColorStop(0, "rgba(255, 255, 255, 1)");
        grad.addColorStop(0.4, "rgba(121, 40, 202, 0.8)");
        grad.addColorStop(0.8, "rgba(0, 242, 254, 0.2)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Add turbulent swirl spikes
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const r = (width/2.2) * (0.2 + progress * 0.7) + Math.cos(a * 8 + progress * 10) * 12;
          const px = centerX + Math.cos(a) * r;
          const py = centerY + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Record metadata
      framesMeta.push({
        frameIndex: i,
        uv: {
          x: x / sheetWidth,
          y: y / sheetHeight,
          w: width / sheetWidth,
          h: height / sheetHeight,
        },
      });
    }

    const spritesheetName = `sim_bake_${opts.type ?? "energy"}_${Date.now()}.png`;
    const spritesheetPath = path.join(opts.outputFolder, spritesheetName);
    const manifestPath = path.join(opts.outputFolder, `sim_manifest_${opts.type ?? "energy"}_${Date.now()}.json`);

    await fs.writeFile(spritesheetPath, canvas.toBuffer("image/png"));
    await writeJson(manifestPath, {
      type: opts.type ?? "energy",
      frameCount,
      grid: { cols, rows, cellWidth: width, cellHeight: height },
      sheetSize: { width: sheetWidth, height: sheetHeight },
      frames: framesMeta,
    });

    return { spritesheetPath, manifestPath };
  }
}
