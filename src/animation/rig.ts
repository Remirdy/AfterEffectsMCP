import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";

export interface RigJoint {
  layerName: string;
  parentName: string;
}

export interface CharacterRigOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  joints: RigJoint[];
  breathLayer?: string;
  blinkLayers?: string[];
}

export class CharacterRigger {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async buildRig(opts: CharacterRigOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Building character rig in comp: ${opts.compName}`);
    await assertFile(opts.aepPath, "Source AEP");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const rigJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var joints = ${JSON.stringify(opts.joints)};
      var breathLayer = ${JSON.stringify(opts.breathLayer ?? "")};
      var blinkLayers = ${JSON.stringify(opts.blinkLayers ?? [])};
      
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
      
      // 1. Parent body parts together
      for (var j = 0; j < joints.length; j++) {
        var jnt = joints[j];
        var childL = MP.findLayersByPattern(comp, jnt.layerName)[0];
        var parentL = MP.findLayersByPattern(comp, jnt.parentName)[0];
        
        if (childL && parentL) {
          childL.parent = parentL;
          MP.log("Parented " + jnt.layerName + " to " + jnt.parentName);
        }
      }
      
      // 2. Add breathing expression (subtle scale loop)
      if (breathLayer) {
        var bL = MP.findLayersByPattern(comp, breathLayer)[0];
        if (bL) {
          var sc = bL.property("ADBE Transform Group").property("ADBE Scale");
          sc.expression = "var freq = 1.8; var amp = 2; var s = Math.sin(time * freq * Math.PI * 2) * amp; [value[0], value[1] + s];";
          MP.log("Added breath loop to: " + breathLayer);
        }
      }
      
      // 3. Add blink expression (random opacity cuts)
      for (var b = 0; b < blinkLayers.length; b++) {
        var bL = MP.findLayersByPattern(comp, blinkLayers[b])[0];
        if (bL) {
          var op = bL.property("ADBE Transform Group").property("ADBE Opacity");
          op.expression = "seedRandom(Math.floor(time * 2), true); var blink = random(0, 1) > 0.85; blink ? 0 : 100;";
          MP.log("Added blink expression to: " + blinkLayers[b]);
        }
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(rigJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to build character rig: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }
}
