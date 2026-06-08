import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import fs from "node:fs/promises";

export interface MockupOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  productImagePath: string;
  rotationSpeed?: number;
  addLighting?: boolean;
}

export class ProductStudioManager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Builds a rotating 3D product mockup scene inside After Effects.
   */
  async buildMockupScene(opts: MockupOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Building 3D product mockup scene using product image: ${opts.productImagePath}`);
    await assertFile(opts.productImagePath, "Product Image");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const studioJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (aepFile.exists) {
        app.open(aepFile);
      } else {
        app.newProject();
      }
      
      var compName = ${JSON.stringify(opts.compName)};
      var imgPath = ${JSON.stringify(opts.productImagePath)};
      var speed = ${opts.rotationSpeed ?? 45};
      var addLight = ${opts.addLighting ?? true};
      
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
          comp = item;
          break;
        }
      }
      
      if (!comp) {
        comp = app.project.items.addComp(compName, 1080, 1920, 1, 8, 30);
      }
      
      // Import and add product plate
      var imgFile = new File(imgPath);
      var imgItem = app.project.importFile(new ImportOptions(imgFile));
      var productL = comp.layers.add(imgItem);
      productL.name = "3D_Product_Mockup";
      productL.threeDLayer = true;
      
      // Setup 3D rotation expression
      var yRot = productL.property("ADBE Transform Group").property("ADBE Rotate Y");
      yRot.expression = "time * " + speed + ";"; // Rotates over time
      
      // Scale fitting
      var sc = productL.property("ADBE Transform Group").property("ADBE Scale");
      sc.setValue([75, 75, 75]);
      
      // Add lighting and spotlight shadows
      if (addLight) {
        var light = comp.layers.addLight("Studio Spot Light", [comp.width/2, comp.height/4, -800]);
        light.lightType = LightType.SPOT;
        light.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(140);
        light.property("ADBE Light Options Group").property("ADBE Light Casts Shadows").setValue(1);
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(studioJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to build product mockup scene: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }

  /**
   * Mock-ups extending (outpainting) and upscaling video files.
   */
  async inpaintAndExtend(
    videoPath: string,
    outputPath: string,
    extendDuration: number,
    upscaleFactor: 2 | 4 = 2
  ): Promise<{ ok: boolean; outputPath: string; upscaled: boolean; duration: number }> {
    this.log.info(`Triggering AI upscale (${upscaleFactor}x) and outpaint extend (+${extendDuration}s) for: ${videoPath}`);
    await assertFile(videoPath, "Source Video");

    // Copying the video to output path to simulate inpainting/extending
    await fs.copyFile(videoPath, outputPath);
    
    return {
      ok: true,
      outputPath,
      upscaled: true,
      duration: 8, // simulated extended duration
    };
  }
}
