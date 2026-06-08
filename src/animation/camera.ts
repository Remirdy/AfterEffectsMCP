import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";

export interface CameraMove {
  type: "dolly" | "orbit" | "pan" | "tilt" | "rackFocus";
  startTime: number;
  duration: number;
  strength?: number;
}

export interface CameraChoreographerOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  moves: CameraMove[];
}

export interface TransitionOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  transitionType: "whipPan" | "zoomBlur" | "morphWipe" | "glitchCut";
  timestamp: number;
  duration: number;
}

export class CameraChoreographer {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async applyCameraMoves(opts: CameraChoreographerOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Choreographing camera moves in comp: ${opts.compName}`);
    await assertFile(opts.aepPath, "Source AEP");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const camJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var moves = ${JSON.stringify(opts.moves)};
      
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
      
      // Ensure all layers are 3D (excluding camera, lights, nulls, adjust)
      for (var l = 1; l <= comp.numLayers; l++) {
        var ly = comp.layer(l);
        if (!(ly instanceof CameraLayer) && !(ly instanceof LightLayer) && !ly.adjustmentLayer && !ly.nullObject) {
          try { ly.threeDLayer = true; } catch (e) {}
        }
      }
      
      // Setup Null camera control rig
      var rig = comp.layers.addNull(comp.duration);
      rig.name = "CAM_RIG_3D";
      rig.threeDLayer = true;
      rig.property("ADBE Transform Group").property("ADBE Position").setValue([comp.width/2, comp.height/2, 0]);
      
      // Add Camera
      var cam = comp.layers.addCamera("MP_CinematicCamera", [comp.width/2, comp.height/2]);
      cam.parent = rig;
      cam.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, -1200]);
      
      // Enable camera DoF
      var camOpts = cam.property("ADBE Camera Options Group");
      try {
        camOpts.property("ADBE Camera Depth of Field").setValue(1); // Enable DoF
        camOpts.property("ADBE Camera Aperture").setValue(45);
        camOpts.property("ADBE Camera Blur Level").setValue(150);
      } catch (e) {}

      // Apply moves
      for (var m = 0; m < moves.length; m++) {
        var move = moves[m];
        var t0 = move.startTime;
        var dur = move.duration;
        var str = move.strength || 100;
        
        if (move.type === "dolly") {
          var pProp = cam.property("ADBE Transform Group").property("ADBE Position");
          var startZ = pProp.value[2];
          pProp.setValueAtTime(t0, [0, 0, startZ]);
          pProp.setValueAtTime(t0 + dur, [0, 0, startZ + str * 4]);
          MP.setEase(pProp, "sineInOut");
        } 
        else if (move.type === "orbit") {
          var rProp = rig.property("ADBE Transform Group").property("ADBE Rotate Y");
          rProp.setValueAtTime(t0, 0);
          rProp.setValueAtTime(t0 + dur, str * 0.4);
          MP.setEase(rProp, "sineInOut");
        }
        else if (move.type === "rackFocus") {
          var fProp = camOpts.property("ADBE Camera Focus Distance");
          fProp.setValueAtTime(t0, 1200);
          fProp.setValueAtTime(t0 + dur, 1200 - str * 3);
          MP.setEase(fProp, "sineInOut");
        }
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(camJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to apply camera moves: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }

  async applyTransition(opts: TransitionOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Applying transition "${opts.transitionType}" at timestamp ${opts.timestamp}s`);
    await assertFile(opts.aepPath, "Source AEP");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const transJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var transType = ${JSON.stringify(opts.transitionType)};
      var t0 = ${opts.timestamp};
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
      
      if (transType === "whipPan") {
        MPVFX.run(comp, "whipPan", { start: t0, duration: dur, angle: 90 });
      }
      else if (transType === "zoomBlur") {
        var adj = comp.layers.addSolid([1, 1, 1], "Zoom Blur Transition", comp.width, comp.height, 1, dur);
        adj.adjustmentLayer = true;
        adj.startTime = t0;
        var rb = adj.property("ADBE Effect Parade").addProperty("CC Radial Fast Blur") || 
                 adj.property("ADBE Effect Parade").addProperty("ADBE Radial Blur");
        if (rb) {
          var amt = rb.property("Amount") || rb.property(1);
          amt.setValueAtTime(t0, 0);
          amt.setValueAtTime(t0 + dur/2, 60);
          amt.setValueAtTime(t0 + dur, 0);
          MP.setEase(amt, "quadInOut");
        }
      }
      else if (transType === "glitchCut") {
        var adj = comp.layers.addSolid([1, 1, 1], "Glitch Cut Transition", comp.width, comp.height, 1, dur);
        adj.adjustmentLayer = true;
        adj.startTime = t0;
        MPVFX.run(comp, "glitch", { targetLayer: adj.name, start: t0, duration: dur });
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(transJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to apply transition: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }
}
