import { runJsx } from "../ae/runner.js";
import { OpLog, pathExists, assertFile, guardOverwrite, ensureDir } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import path from "node:path";

export interface ViralityScore {
  score: number; // 0..100
  retentionRate: number; // 0..100
  hookStrength: "weak" | "average" | "strong" | "viral";
  recommendations: string[];
}

export interface AdVariant {
  suffix: string;
  hook: string;
  cta: string;
}

export class ViralityPredictor {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Evaluates the hook and CTA copywriting quality, returning scoring and improvements.
   */
  async predictVirality(hook: string, cta: string): Promise<ViralityScore> {
    this.log.info(`Evaluating virality score for Hook: "${hook}" and CTA: "${cta}"`);

    // Simple robust scoring heuristics based on copywriting best practices
    let score = 50;
    const recs: string[] = [];

    // Hook analysis
    const hookWords = hook.split(/\s+/).length;
    if (hookWords < 3) {
      score -= 10;
      recs.push("Hook is too short. Ideal hook has 4 to 8 words.");
    } else if (hookWords > 10) {
      score -= 5;
      recs.push("Hook is too wordy. Make it punchier for better scroll-stopping power.");
    }

    // Scroll-stopping words check
    const viralKeywords = /\b(stop|shock|secret|revealed|unbelievable|hack|future|don't|look|reasons)\b/i;
    if (viralKeywords.test(hook)) {
      score += 15;
    } else {
      recs.push("Add a scroll-stopper word (e.g. 'Stop', 'Secret', 'Hack', 'Future') to the first 2 seconds.");
    }

    // CTA analysis
    if (!cta || cta.length < 3) {
      score -= 15;
      recs.push("CTA is missing or weak. Always specify a clear benefit action (e.g. 'Shop 50% Off').");
    } else if (/\b(buy|shop|get|grab|download|free)\b/i.test(cta)) {
      score += 10;
    }

    // Final clamps
    score = Math.max(10, Math.min(100, score));
    const retention = Math.round(score * 0.72 + 10);
    const hookStrength = score >= 85 ? "viral" : score >= 70 ? "strong" : score >= 45 ? "average" : "weak";

    return {
      score,
      retentionRate: retention,
      hookStrength,
      recommendations: recs,
    };
  }

  /**
   * Generates A/B variant comps inside After Effects, swapping Hook and CTA text layers.
   */
  async generateABVariants(
    aepPath: string,
    outputAepPath: string,
    compName: string,
    variants: AdVariant[],
    approveOverwrite = false
  ): Promise<{ ok: boolean; variantsCreated: string[]; outputAepPath: string }> {
    this.log.info(`Generating A/B variants in After Effects for comp: ${compName}`);
    await assertFile(aepPath, "Source AEP");
    await guardOverwrite(outputAepPath, approveOverwrite);
    await ensureDir(path.dirname(outputAepPath));

    const abJsx = withReport(`
      var aepFile = new File(${JSON.stringify(aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP file not found");
      }
      
      app.open(aepFile);
      
      // Find the target composition
      var compName = ${JSON.stringify(compName)};
      var targetComp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
          targetComp = item;
          break;
        }
      }
      
      if (!targetComp) {
        // Fallback: pick comp with most layers
        var maxL = -1;
        for (var i = 1; i <= app.project.numItems; i++) {
          var item = app.project.item(i);
          if (item instanceof CompItem && item.numLayers > maxL) {
            targetComp = item;
            maxL = item.numLayers;
          }
        }
      }
      
      if (!targetComp) {
        throw new Error("Target composition not found.");
      }
      
      var variantsCreated = [];
      var variantsData = ${JSON.stringify(variants)};
      
      for (var v = 0; v < variantsData.length; v++) {
        var data = variantsData[v];
        var newComp = targetComp.duplicate();
        newComp.name = targetComp.name + "_" + data.suffix.toUpperCase();
        
        // Find text layers to replace
        for (var l = 1; l <= newComp.numLayers; l++) {
          var layer = newComp.layer(l);
          if (layer instanceof TextLayer) {
            var nameLower = layer.name.toLowerCase();
            var textDocument = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
            
            // Swap hook
            if (nameLower.indexOf("hook") >= 0 || nameLower.indexOf("title") >= 0 || nameLower.indexOf("headline") >= 0) {
              textDocument.text = data.hook;
              layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(textDocument);
            }
            
            // Swap cta
            if (nameLower.indexOf("cta") >= 0 || nameLower.indexOf("button") >= 0 || nameLower.indexOf("action") >= 0) {
              textDocument.text = data.cta;
              layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(textDocument);
            }
          }
        }
        variantsCreated.push(newComp.name);
      }
      
      app.project.save(new File(${JSON.stringify(outputAepPath)}));
      __result.output = variantsCreated.join("|");
    `);

    const result = await runJsx(abJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to generate A/B variants in After Effects: ${result.error}`);
    }

    const variantsCreated = (result.output || "").split("|").filter(Boolean);
    return { ok: true, variantsCreated, outputAepPath };
  }
}
