import { runJsx } from "../ae/runner.js";
import { OpLog, pathExists, assertFile, guardOverwrite, ensureDir } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import path from "node:path";

export interface ReframeFormatOptions {
  name: "vertical" | "square" | "horizontal" | "portrait";
  width: number;
  height: number;
}

export const STANDARD_FORMATS: Record<string, ReframeFormatOptions> = {
  vertical: { name: "vertical", width: 1080, height: 1920 },
  square: { name: "square", width: 1080, height: 1080 },
  horizontal: { name: "horizontal", width: 1920, height: 1080 },
  portrait: { name: "portrait", width: 1080, height: 1350 },
};

export class MultiformatAdExporter {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async exportFormats(
    aepPath: string,
    outputAepPath: string,
    targetFormats: Array<"vertical" | "square" | "horizontal" | "portrait"> = ["vertical", "square"],
    approveOverwrite = false
  ): Promise<{ ok: boolean; formatsCreated: string[]; outputAepPath: string }> {
    this.log.info(`Preparing multiformat reframe for project: ${aepPath}`);
    await assertFile(aepPath, "Source AEP");
    await guardOverwrite(outputAepPath, approveOverwrite);
    await ensureDir(path.dirname(outputAepPath));

    const formats = targetFormats.map((f) => STANDARD_FORMATS[f]).filter(Boolean);

    const reframeJsx = withReport(`
      var aepFile = new File(${JSON.stringify(aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP file not found");
      }
      
      app.open(aepFile);
      
      // Find the main/most layered comp to reframe
      var mainComp = null;
      var maxLayers = -1;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.numLayers > maxLayers) {
          mainComp = item;
          maxLayers = item.numLayers;
        }
      }
      
      if (!mainComp) {
        throw new Error("No compositions found in project.");
      }
      
      var formatsCreated = [];
      var formatsList = ${JSON.stringify(formats)};
      
      for (var f = 0; f < formatsList.length; f++) {
        var fmt = formatsList[f];
        var newName = mainComp.name + "_" + fmt.name.toUpperCase();
        
        // Duplicate comp
        var dupComp = mainComp.duplicate();
        dupComp.name = newName;
        
        // Set new resolution
        var oldW = dupComp.width;
        var oldH = dupComp.height;
        dupComp.width = fmt.width;
        dupComp.height = fmt.height;
        
        // Adjust each layer
        for (var l = 1; l <= dupComp.numLayers; l++) {
          var layer = dupComp.layer(l);
          
          // Identify backgrounds or large solid/null layers
          var isBg = /bg|back|gradient|particles|adjustment/i.test(layer.name) || 
                     (layer.width === oldW && layer.height === oldH);
                     
          var isTextOrLogo = /text|title|logo|cta|button/i.test(layer.name) ||
                             layer instanceof TextLayer;

          if (isBg) {
            // Scale background to fill new aspect ratio (fit max)
            var scaleX = (fmt.width / oldW) * 100;
            var scaleY = (fmt.height / oldH) * 100;
            var maxScale = Math.max(scaleX, scaleY);
            
            try {
              var sProp = layer.property("ADBE Transform Group").property("ADBE Scale");
              var currentScale = sProp.value;
              sProp.setValue([currentScale[0] * (maxScale/100), currentScale[1] * (maxScale/100)]);
              
              // Center it
              var pProp = layer.property("ADBE Transform Group").property("ADBE Position");
              pProp.setValue([fmt.width / 2, fmt.height / 2]);
            } catch (e) {}
          } else if (isTextOrLogo) {
            // Keep text/logos centered and scale down if it exceeds the new width (safe margin)
            try {
              var pProp = layer.property("ADBE Transform Group").property("ADBE Position");
              var posVal = pProp.value;
              // Re-center horizontally
              pProp.setValue([fmt.width / 2, posVal[1] * (fmt.height / oldH)]);
              
              // Scale constraint: fit inside 80% of new width
              if (layer.width && layer.width > fmt.width * 0.8) {
                var sProp = layer.property("ADBE Transform Group").property("ADBE Scale");
                var currentScale = sProp.value;
                var fitRatio = (fmt.width * 0.8) / layer.width;
                sProp.setValue([currentScale[0] * fitRatio, currentScale[1] * fitRatio]);
              }
            } catch (e) {}
          } else {
            // General elements, scale proportionally
            try {
              var pProp = layer.property("ADBE Transform Group").property("ADBE Position");
              var posVal = pProp.value;
              pProp.setValue([posVal[0] * (fmt.width / oldW), posVal[1] * (fmt.height / oldH)]);
            } catch (e) {}
          }
        }
        formatsCreated.push(newName);
      }
      
      app.project.save(new File(${JSON.stringify(outputAepPath)}));
      __result.output = formatsCreated.join("|");
    `);

    const result = await runJsx(reframeJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to reframe ad compositions in After Effects: ${result.error}`);
    }

    const formatsCreated = (result.output || "").split("|").filter(Boolean);
    this.log.info(`Successfully reframed ${formatsCreated.length} compositions: ${formatsCreated.join(", ")}`);
    return { ok: true, formatsCreated, outputAepPath };
  }
}
