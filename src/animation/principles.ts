import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";

export interface AnimationPrincipleOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  layerName: string;
  principle: "overshoot" | "anticipation" | "squashStretch" | "elasticEase";
  startTime: number;
  duration: number;
}

export class SmartKeyframeAssistant {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async applyPrinciple(opts: AnimationPrincipleOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Applying animation principle "${opts.principle}" to layer "${opts.layerName}"`);
    await assertFile(opts.aepPath, "Source AEP");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const principlesJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var layerName = ${JSON.stringify(opts.layerName)};
      var principle = ${JSON.stringify(opts.principle)};
      var t0 = ${opts.startTime};
      var dur = ${opts.duration};
      
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
          comp = item;
          break;
        }
      }
      
      if (!comp) {
        throw new Error("Composition not found: " + compName);
      }
      
      var layers = MP.findLayersByPattern(comp, layerName);
      if (layers.length === 0) {
        throw new Error("Layer not found: " + layerName);
      }
      
      var layer = layers[0];
      var transform = layer.property("ADBE Transform Group");
      
      if (principle === "overshoot") {
        // Position overshoot
        var pos = transform.property("ADBE Position");
        var base = pos.value;
        pos.setValueAtTime(t0, [base[0], base[1] + 300]);
        pos.setValueAtTime(t0 + dur * 0.7, [base[0], base[1] - 40]); // shoot past target
        pos.setValueAtTime(t0 + dur, base); // settle back
        MP.setEase(pos, "backOut");
      } 
      else if (principle === "anticipation") {
        // Backward windup before forward movement
        var pos = transform.property("ADBE Position");
        var base = pos.value;
        pos.setValueAtTime(t0, base);
        pos.setValueAtTime(t0 + dur * 0.2, [base[0], base[1] + 40]); // slip back slightly
        pos.setValueAtTime(t0 + dur, [base[0], base[1] - 400]); // shoot forward
        MP.setEase(pos, "quadInOut");
      }
      else if (principle === "squashStretch") {
        // Squash on contact (X stretches, Y squashes)
        var sc = transform.property("ADBE Scale");
        sc.setValueAtTime(t0, [100, 100]);
        sc.setValueAtTime(t0 + dur * 0.4, [125, 75]); // squash
        sc.setValueAtTime(t0 + dur * 0.7, [85, 115]); // bounce stretch
        sc.setValueAtTime(t0 + dur, [100, 100]);
        MP.setEase(sc, "elasticOut");
      }
      else if (principle === "elasticEase") {
        // Standard springy bounce
        var sc = transform.property("ADBE Scale");
        sc.setValueAtTime(t0, [0, 0]);
        sc.setValueAtTime(t0 + dur, [100, 100]);
        MP.setEase(sc, "elasticOut");
      }
      
      // Enable motion blur for premium feel
      layer.motionBlur = true;
      comp.motionBlur = true;
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(principlesJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to apply animation principle: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }
}
