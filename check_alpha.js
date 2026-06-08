import sharp from "sharp";

async function main() {
  const assets = [
    "dragon_body.png",
    "dragon_left_inner.png",
    "dragon_left_outer.png",
    "dragon_right_inner.png",
    "dragon_right_outer.png"
  ];
  
  for (const asset of assets) {
    try {
      const imgPath = `/Users/emirhan/Desktop/After_Effects_MCP/dragon_assets/${asset}`;
      const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
      let visiblePixels = 0;
      let totalPixels = info.width * info.height;
      for (let i = 0; i < totalPixels; i++) {
        if (data[i * 4 + 3] > 0) visiblePixels++;
      }
      console.log(`${asset}: ${visiblePixels} / ${totalPixels} visible pixels (${Math.round(visiblePixels/totalPixels*100)}%)`);
    } catch (e) {
      console.error(`Error checking ${asset}:`, e.message);
    }
  }
}

main();
