import sharp from "sharp";
import path from "path";

async function main() {
  const inputPath = "/Users/emirhan/Desktop/After_Effects_MCP/dragon_plate.png";
  const outDir = "/Users/emirhan/Desktop/After_Effects_MCP/dragon_assets";
  
  // Create output directory
  import("fs").then((fs) => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  });

  try {
    console.log("Reading dragon_plate.png...");
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Get raw RGB pixels
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(`Processing ${width}x${height} image...`);
    const outBuffer = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      
      outBuffer[i * 4] = r;
      outBuffer[i * 4 + 1] = g;
      outBuffer[i * 4 + 2] = b;
      
      // Threshold: if pixel is close to black, make it transparent
      // We can also make a soft edge by scaling alpha for near-black pixels
      const brightness = r + g + b;
      if (brightness < 35) {
        outBuffer[i * 4 + 3] = 0;
      } else if (brightness < 60) {
        // Soft feather edge
        const factor = (brightness - 35) / 25;
        outBuffer[i * 4 + 3] = Math.round(factor * 255);
      } else {
        outBuffer[i * 4 + 3] = 255;
      }
    }

    const transparentImage = sharp(outBuffer, {
      raw: { width, height, channels: 4 }
    });

    console.log("Saving transparent master image...");
    const masterPath = path.join(outDir, "dragon_transparent.png");
    await transparentImage.png().toFile(masterPath);

    console.log("Slicing dragon into 5 separate high-quality transparent assets...");

    // Slice coordinates (left, top, width, height)
    const slices = {
      body: { left: 380, top: 250, width: 260, height: 774 },
      left_inner: { left: 280, top: 100, width: 175, height: 500 },
      left_outer: { left: 0, top: 0, width: 280, height: 600 },
      right_inner: { left: 565, top: 100, width: 179, height: 500 },
      right_outer: { left: 744, top: 0, width: 280, height: 600 }
    };

    for (const [key, rect] of Object.entries(slices)) {
      console.log(`Extracting ${key}...`);
      await sharp(masterPath)
        .extract(rect)
        .png()
        .toFile(path.join(outDir, `dragon_${key}.png`));
    }

    console.log("All transparent assets created successfully!");
  } catch (error) {
    console.error("Error creating transparent assets:", error);
  }
}

main();
