import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite, ensureDir, pathExists } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import sharp from "sharp";
import path from "node:path";

export interface ProxySwap {
  originalPath: string;
  proxyPath: string;
}

export class SmartProxyManager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Resizes high-res images to low-res proxies to speed up editing.
   */
  async createProxies(imagePaths: string[], proxyFolder: string): Promise<ProxySwap[]> {
    this.log.info(`Creating low-res proxies for ${imagePaths.length} assets...`);
    await ensureDir(proxyFolder);
    const swaps: ProxySwap[] = [];

    for (const imgPath of imagePaths) {
      if (!(await pathExists(imgPath))) continue;

      const baseName = path.basename(imgPath);
      const proxyPath = path.join(proxyFolder, `proxy_${baseName}`);
      
      this.log.info(`Generating proxy: ${proxyPath}`);
      await sharp(imgPath)
        .resize(360) // Downscale to 360px width
        .toFile(proxyPath);

      swaps.push({ originalPath: imgPath, proxyPath });
    }

    return swaps;
  }

  /**
   * Compiles JSX to swap After Effects project item sources between original and proxy.
   */
  async toggleProxies(
    aepPath: string,
    outputAepPath: string,
    swaps: ProxySwap[],
    useProxy: boolean,
    approveOverwrite = false
  ): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Toggling proxy mode: ${useProxy ? "ON" : "OFF"}`);
    await assertFile(aepPath, "Source AEP");
    await guardOverwrite(outputAepPath, approveOverwrite);

    const proxyJsx = withReport(`
      var aepFile = new File(${JSON.stringify(aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var swaps = ${JSON.stringify(swaps)};
      var useProxy = ${useProxy};
      
      for (var s = 0; s < swaps.length; s++) {
        var targetPath = useProxy ? swaps[s].proxyPath : swaps[s].originalPath;
        var replacementFile = new File(targetPath);
        
        if (replacementFile.exists) {
          // Find matching original file item in project
          var matchName = useProxy ? swaps[s].originalPath : swaps[s].proxyPath;
          var searchName = new File(matchName).name;
          
          for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FootageItem && item.file && item.file.name === searchName) {
              item.replace(replacementFile);
              MP.log("Swapped " + item.name + " to " + targetPath);
              break;
            }
          }
        }
      }
      
      app.project.save(new File(${JSON.stringify(outputAepPath)}));
      __result.output = ${JSON.stringify(outputAepPath)};
    `);

    const result = await runJsx(proxyJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to toggle After Effects proxies: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || outputAepPath };
  }
}
