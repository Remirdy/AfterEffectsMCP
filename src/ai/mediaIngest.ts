import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { OpLog, ensureDir, pathExists } from "../util.js";

export class MediaIngest {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Downloads a file from a URL to a local destination.
   * If the input is already a local path, it will copy it.
   */
  async ingestMedia(source: string, destPath: string): Promise<string> {
    await ensureDir(path.dirname(destPath));

    if (source.startsWith("http://") || source.startsWith("https://")) {
      this.log.info(`Downloading media from: ${source} to ${destPath}`);
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(destPath, buffer);
      this.log.info(`Download completed.`);
    } else {
      // Local copy
      if (!(await pathExists(source))) {
        throw new Error(`Source file does not exist: ${source}`);
      }
      this.log.info(`Copying local media from: ${source} to ${destPath}`);
      await fs.copyFile(source, destPath);
    }
    return destPath;
  }

  /**
   * Automatically crops the transparent alpha borders of a PNG image.
   * Uses the sharp library to find the non-zero alpha bounding box.
   */
  async autoCropAlpha(imagePath: string, destPath: string, threshold = 5): Promise<{
    cropped: boolean;
    outputPath: string;
    originalWidth: number;
    originalHeight: number;
    croppedWidth?: number;
    croppedHeight?: number;
    bounds?: { left: number; top: number; width: number; height: number };
  }> {
    this.log.info(`Analyzing alpha bounds for auto-crop: ${imagePath}`);
    if (!(await pathExists(imagePath))) {
      throw new Error(`Image file does not exist: ${imagePath}`);
    }

    const img = sharp(imagePath);
    const metadata = await img.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width === 0 || height === 0) {
      throw new Error("Invalid image dimensions");
    }

    // Retrieve raw RGBA buffer
    const { data, info } = await img
      .raw()
      .toBuffer({ resolveWithObject: true });

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    const channels = info.channels;
    if (channels < 4) {
      this.log.info("Image does not have an alpha channel. Skipping crop.");
      await fs.copyFile(imagePath, destPath);
      return { cropped: false, outputPath: destPath, originalWidth: width, originalHeight: height };
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const alpha = data[idx + 3];
        if (alpha > threshold) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Check if the image is entirely transparent or already fully cropped
    if (maxX < minX || maxY < minY) {
      this.log.info("Image is entirely transparent. Skipping crop.");
      await fs.copyFile(imagePath, destPath);
      return { cropped: false, outputPath: destPath, originalWidth: width, originalHeight: height };
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    // Check if crop is meaningful (e.g. at least 2 pixels saved)
    if (cropWidth === width && cropHeight === height) {
      this.log.info("Image is already tightly cropped. Skipping.");
      await fs.copyFile(imagePath, destPath);
      return { cropped: false, outputPath: destPath, originalWidth: width, originalHeight: height };
    }

    this.log.info(`Cropping transparent border: [left: ${minX}, top: ${minY}, width: ${cropWidth}, height: ${cropHeight}]`);
    await ensureDir(path.dirname(destPath));
    await sharp(imagePath)
      .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
      .toFile(destPath);

    return {
      cropped: true,
      outputPath: destPath,
      originalWidth: width,
      originalHeight: height,
      croppedWidth: cropWidth,
      croppedHeight: cropHeight,
      bounds: { left: minX, top: minY, width: cropWidth, height: cropHeight }
    };
  }
}
