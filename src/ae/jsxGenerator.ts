import { MotionPlan, MotionAnimation, Direction } from "../types.js";
import { JSX_HELPERS } from "./jsxHelpers.js";

function jstr(s: string): string {
  return JSON.stringify(String(s));
}

function jsonLiteral(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function offsetForDirection(dir: Direction | undefined, strength: number): [number, number] {
  switch (dir) {
    case "top":
      return [0, -strength];
    case "bottom":
      return [0, strength];
    case "left":
      return [-strength, 0];
    case "right":
      return [strength, 0];
    default:
      return [0, strength];
  }
}

/** Standard preamble that prints a result marker so the runner can parse output. */
function withReport(body: string): string {
  return `
${JSX_HELPERS}
(function () {
  var __result = { ok: true, log: "", output: "", error: null };
  try {
${body}
    if (!__result.log) { __result.log = MP.getLog(); }
  } catch (e) {
    __result.ok = false;
    __result.error = e.toString() + (e.line ? (" @line " + e.line) : "");
    try { __result.log = MP.getLog(); } catch (ee) {}
  }
  // Primary channel: write the result to a sidecar file the runner polls.
  // This works regardless of how AE was launched (CLI flag or AppleScript).
  try {
    var __rf = new File("__MP_RESULT_FILE__");
    __rf.encoding = "UTF-8";
    __rf.open("w");
    __rf.write("MP_RESULT_BEGIN\\n");
    __rf.write(__result.ok + "|" + __result.output + "|" + __result.error + "\\n");
    __rf.write("MP_LOG_BEGIN\\n");
    __rf.write(__result.log + "\\n");
    __rf.write("MP_RESULT_END\\n");
    __rf.close();
  } catch (eWrite) {}
  // Secondary channel: stdout markers (used when AE is run with a CLI flag).
  $.writeln("MP_RESULT_BEGIN");
  $.writeln(__result.ok + "|" + __result.output + "|" + __result.error);
  $.writeln("MP_LOG_BEGIN");
  $.writeln(__result.log);
  $.writeln("MP_RESULT_END");
  return __result.ok ? "OK" : "ERR";
})();
`;
}

/**
 * JSX to import a PSD as a composition (retaining layer sizes), set comp
 * duration/fps, and save a new AEP. Never modifies the PSD.
 */
export function generateImportJsx(opts: {
  psdPath: string;
  outputAepPath: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
}): string {
  const body = `
    app.beginUndoGroup("MotionPilot Import");
    var psdFile = new File(${jstr(opts.psdPath)});
    if (!psdFile.exists) { throw new Error("PSD not found: " + ${jstr(opts.psdPath)}); }

    var io = new ImportOptions(psdFile);
    // Force "Composition - Retain Layer Sizes" so each PSD layer becomes its own
    // AE layer. Do NOT gate on canImportAs (it can misreport on some versions).
    try {
      io.importAs = ImportAsType.COMP;
    } catch (e1) {
      try { io.importAs = ImportAsType.COMP_CROPPED_LAYERS; } catch (e2) {}
    }
    var imported = app.project.importFile(io);
    MP.log("Imported PSD as: " + imported.name + " (" + imported.typeName + ")");

    // Pick the composition with the MOST layers — that's the PSD comp.
    // (A blank/auxiliary comp could otherwise be selected by mistake.)
    var mainComp = null;
    if (imported instanceof CompItem) { mainComp = imported; }
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        if (!mainComp || it.numLayers > mainComp.numLayers) mainComp = it;
      }
    }
    if (!mainComp || mainComp.numLayers === 0) {
      throw new Error(
        "PSD did not import as a layered composition (no comp with layers was created). " +
        "Imported item type: " + imported.typeName + "."
      );
    }
    mainComp.name = "MotionPilot_Main";
    mainComp.duration = ${opts.duration};
    mainComp.frameRate = ${opts.fps};
    MP.log("Main comp: " + mainComp.name + " " + mainComp.width + "x" + mainComp.height +
           " " + mainComp.duration + "s @" + mainComp.frameRate + "fps, layers=" + mainComp.numLayers);

    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
  `;
  return withReport(body);
}

/** Emit the per-animation ExtendScript fragment. */
function emitAnimation(a: MotionAnimation): string {
  const ease = jstr(a.ease ?? "expoOut");
  const t0 = a.start;
  const dur = a.duration;
  switch (a.type) {
    case "slowParallax":
      return `MP.addParallax(ly, ${a.strength ?? 20}, ${t0}, ${dur}, ${ease});`;
    case "slideFade": {
      const [ox, oy] = offsetForDirection(a.from, a.strength ?? 60);
      return `
        if (ly.property("ADBE Text Properties")) {
          MP.protectTextLayer(ly);
          MP.addPositionAnimation(ly, [${ox}, ${oy}], ${t0}, ${dur}, ${ease});
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${dur}, ${ease});
        } else {
          MP.addPositionAnimation(ly, [${ox}, ${oy}], ${t0}, ${dur}, ${ease});
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${dur}, ${ease});
        }`;
    }
    case "slideScale": {
      const [ox, oy] = offsetForDirection(a.from, a.strength ?? 90);
      return `
        MP.addPositionAnimation(ly, [${ox}, ${oy}], ${t0}, ${dur}, ${ease});
        MP.addScaleAnimation(ly, 88, 100, ${t0}, ${dur}, ${ease});
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.7)}, ${ease});
        MP.addBlurAnimation(ly, 14, 0, ${t0}, ${dur}, ${ease});`;
    }
    case "staggerPop":
      // staggerPop on a wildcard is handled at group level (see emitGroup).
      return `
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.4)}, ${ease});
        MP.addScaleAnimation(ly, 82, 100, ${t0}, ${dur}, ${ease});`;
    case "bounceIn":
      return `
        MP.addScaleAnimation(ly, 70, 100, ${t0}, ${dur}, ${ease});
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.3)}, ${ease});`;
    case "softReveal":
      return `
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${dur}, ${ease});
        MP.addScaleAnimation(ly, 96, 100, ${t0}, ${dur}, ${ease});`;
    case "floatLoop":
      // Gentle continuous vertical float via expression on position.
      return `
        (function () {
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          var amp = ${a.strength ?? 12};
          try {
            pos.expression = "var amp=" + amp + "; var freq=0.4; [value[0], value[1] + Math.sin(time*Math.PI*2*freq)*amp];";
          } catch (e) { MP.log("float expression failed: " + e.toString()); }
        })();`;
    case "maskReveal":
      return `MP.addMaskReveal(ly, ${jstr(a.from ?? "left")}, ${t0}, ${dur}, ${ease});`;
    case "textRangeReveal":
      return `MP.protectTextLayer(ly); MP.addTextRangeReveal(ly, ${t0}, ${dur}, ${ease});`;
    case "lightSweep":
      return `MP.addLightSweep(ly, ${t0}, ${dur}, ${ease});`;
    case "blurFade":
      return `
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${dur}, ${ease});
        MP.addBlurAnimation(ly, ${a.strength ?? 18}, 0, ${t0}, ${dur}, ${ease});`;
    case "overshootPop":
      return `
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.35)}, ${ease});
        MP.addScaleAnimation(ly, 72, 104, ${t0}, ${dur * 0.72}, ${ease});
        MP.addScaleAnimation(ly, 104, 100, ${t0 + dur * 0.72}, ${dur * 0.28}, "quadOut");`;
    case "rotateIn":
      return `
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.45)}, ${ease});
        MP.addRotationAnimation(ly, ${a.strength ?? -8}, 0, ${t0}, ${dur}, ${ease});
        MP.addScaleAnimation(ly, 94, 100, ${t0}, ${dur}, ${ease});`;
    case "depthDrift":
      return `
        (function () {
          try { ly.threeDLayer = true; } catch (e3d) {}
          MP.addParallax(ly, ${a.strength ?? 34}, ${t0}, ${dur}, ${ease});
        })();`;
    case "scalePulse":
      return `
        (function () {
          var sc = ly.property("ADBE Transform Group").property("ADBE Scale");
          var base = sc.value;
          var amt = ${a.strength ?? 3};
          try {
            sc.expression = "var amp=" + amt + "; var freq=0.55; var s=1 + Math.sin(time*Math.PI*2*freq)*amp/100; [value[0]*s, value[1]*s];";
          } catch (e) { MP.log("scalePulse expression failed: " + e.toString()); }
        })();`;
    case "ambientGlow":
      return `MP.addAmbientGlow(ly, ${t0}, ${dur}, ${a.strength ?? 35}, ${ease});`;
    case "cameraPush":
      return `MP.addCameraPush(comp, ${t0}, ${dur}, ${a.strength ?? 120}, ${ease});`;
    case "magneticSnap": {
      const [ox, oy] = offsetForDirection(a.from, a.strength ?? 70);
      return `
        (function () {
          var tg = ly.property("ADBE Transform Group");
          var pos = tg.property("ADBE Position");
          var sc = tg.property("ADBE Scale");
          var base = pos.value;
          pos.setValueAtTime(${t0}, [base[0] + ${ox}, base[1] + ${oy}]);
          pos.setValueAtTime(${t0 + dur * 0.62}, [base[0] - ${ox * 0.08}, base[1] - ${oy * 0.08}]);
          pos.setValueAtTime(${t0 + dur}, base);
          sc.setValueAtTime(${t0}, [92, 92]);
          sc.setValueAtTime(${t0 + dur * 0.62}, [103, 103]);
          sc.setValueAtTime(${t0 + dur}, [100, 100]);
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur * 0.45, 0.45)}, ${ease});
          MP.setEase(pos, ${ease});
          MP.setEase(sc, ${ease});
        })();`;
    }
    case "liquidDrift":
      return `
        (function () {
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          var amp = ${a.strength ?? 18};
          try {
            pos.expression = "var amp=" + amp + "; var sx=Math.sin(time*1.07+index)*amp; var sy=Math.sin(time*0.73+index*1.7)*amp*0.55; [value[0]+sx, value[1]+sy];";
          } catch (e) { MP.log("liquidDrift expression failed: " + e.toString()); }
        })();`;
    case "cinematicJitter":
      return `
        (function () {
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          var amt = ${a.strength ?? 5};
          try {
            pos.expression = "posterizeTime(12); var a=" + amt + "; var n=wiggle(2.4,a); [n[0],n[1]];";
          } catch (e) { MP.log("cinematicJitter expression failed: " + e.toString()); }
        })();`;
    case "microShake":
      return `
        (function () {
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          var rot = ly.property("ADBE Transform Group").property("ADBE Rotate Z");
          var amt = ${a.strength ?? 4};
          try {
            pos.expression = "var a=" + amt + "; wiggle(7,a);";
            rot.expression = "wiggle(6," + Math.max(0.3, (a.strength ?? 4) * 0.12) + ");";
          } catch (e) { MP.log("microShake expression failed: " + e.toString()); }
        })();`;
    case "revealWipeBlur":
      return `
        MP.addMaskReveal(ly, ${jstr(a.from ?? "left")}, ${t0}, ${dur}, ${ease});
        MP.addBlurAnimation(ly, ${a.strength ?? 20}, 0, ${t0}, ${dur}, ${ease});
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur * 0.55, 0.55)}, ${ease});`;
    case "parallaxOrbit":
      return `
        (function () {
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          var amp = ${a.strength ?? 24};
          try {
            pos.expression = "var amp=" + amp + "; var sp=.22; [value[0]+Math.cos(time*Math.PI*2*sp+index)*amp, value[1]+Math.sin(time*Math.PI*2*sp+index)*amp*.45];";
          } catch (e) { MP.log("parallaxOrbit expression failed: " + e.toString()); }
        })();`;
    case "breathBlur":
      return `
        (function () {
          MP.addScaleAnimation(ly, 98, 101, ${t0}, ${dur * 0.5}, "sineInOut");
          MP.addScaleAnimation(ly, 101, 100, ${t0 + dur * 0.5}, ${dur * 0.5}, "sineInOut");
          try {
            var fx = ly.property("ADBE Effect Parade");
            var blur = fx.addProperty("ADBE Gaussian Blur 2");
            var amt = blur.property("ADBE Gaussian Blur 2-0001");
            amt.expression = "1.8 + Math.sin(time*Math.PI*2*.28+index)*1.2;";
          } catch (e) { MP.log("breathBlur blur failed: " + e.toString()); }
        })();`;
    case "typewriterFlicker":
      return `
        (function () {
          MP.protectTextLayer(ly);
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.9)}, ${ease});
          try {
            var op = ly.property("ADBE Transform Group").property("ADBE Opacity");
            op.expression = "var gate=time<" + (${t0} + ${dur}) + "; gate ? value + Math.sin(time*38+index)*7 : value;";
          } catch (e) { MP.log("typewriterFlicker expression failed: " + e.toString()); }
        })();`;
    case "elasticScale":
      return `
        (function () {
          var sc = ly.property("ADBE Transform Group").property("ADBE Scale");
          sc.setValueAtTime(${t0}, [0, 0]);
          sc.setValueAtTime(${t0 + dur}, [100, 100]);
          MP.setEase(sc, "elasticOut");
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.3)}, ${ease});
        })();`;
    case "glitchIn":
      return `
        (function () {
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.25)}, ${ease});
          var fx = ly.property("ADBE Effect Parade");
          try {
            var pt = fx.addProperty("ADBE Posterize Time"); pt.property(1).setValue(16);
          } catch (ept) {}
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          try {
            pos.expression = "seedRandom(index,true); var g=(time<" + (${t0} + ${dur}) + ")?1:0; var on=Math.random()>0.6?1:0; [value[0]+random(-26,26)*g*on, value[1]+random(-6,6)*g*on];";
          } catch (e) {}
        })();`;
    case "neonFlicker":
      return `
        (function () {
          try {
            var glow = ly.property("ADBE Effect Parade").addProperty("ADBE Glow");
            glow.property("ADBE Glow-0003").setValue(${a.strength ?? 30});
            glow.property("ADBE Glow-0004").setValue(1.8);
          } catch (eg) {}
          var op = ly.property("ADBE Transform Group").property("ADBE Opacity");
          try { op.expression = "seedRandom(Math.floor(time*16),true); random(0,1)>0.1 ? 100 : 40;"; } catch (e) {}
        })();`;
    case "chromaSplit":
      return `
        (function () {
          try {
            var off = ly.property("ADBE Effect Parade").addProperty("ADBE Channel Offset") ||
                      ly.property("ADBE Effect Parade").addProperty("ADBE Offset");
          } catch (e) {}
          var pos = ly.property("ADBE Transform Group").property("ADBE Position");
          try { pos.expression = "var a=" + (${a.strength ?? 5}) + "; [value[0]+Math.sin(time*9)*a, value[1]];"; } catch (e2) {}
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.4)}, ${ease});
        })();`;
    case "flip3D":
      return `
        (function () {
          try { ly.threeDLayer = true; } catch (e3) {}
          var ry = ly.property("ADBE Transform Group").property("ADBE Rotate Y");
          ry.setValueAtTime(${t0}, ${a.strength ?? 90});
          ry.setValueAtTime(${t0 + dur}, 0);
          MP.setEase(ry, ${ease});
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.4)}, ${ease});
        })();`;
    case "energyTrail":
      return `
        (function () {
          try {
            var ec = ly.property("ADBE Effect Parade").addProperty("ADBE Echo");
            ec.property("ADBE Echo-0001").setValue(-0.03);
            ec.property("ADBE Echo-0002").setValue(${a.strength ?? 6});
            ec.property("ADBE Echo-0004").setValue(0.7);
          } catch (e) {}
          MP.addPositionAnimation(ly, [0, ${a.strength ?? -40}], ${t0}, ${dur}, ${ease});
        })();`;
    case "motionStreak":
      return `
        (function () {
          try {
            var db = ly.property("ADBE Effect Parade").addProperty("ADBE Motion Blur");
            var len = db.property("ADBE Motion Blur-0002");
            if (len) { len.setValueAtTime(${t0}, ${a.strength ?? 180}); len.setValueAtTime(${t0 + dur}, 0); }
          } catch (e) {}
          MP.addPositionAnimation(ly, [${a.strength ?? 200}, 0], ${t0}, ${dur}, ${ease});
          MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.3)}, ${ease});
        })();`;
    case "kineticBounce":
      return `
        MP.addScaleAnimation(ly, 0, 118, ${t0}, ${dur * 0.55}, "backOut");
        MP.addScaleAnimation(ly, 118, 100, ${t0 + dur * 0.55}, ${dur * 0.45}, "quadOut");
        MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${Math.min(dur, 0.18)}, ${ease});`;
    default:
      return `MP.addOpacityAnimation(ly, 0, 100, ${t0}, ${dur}, ${ease});`;
  }
}

function emitGroup(a: MotionAnimation, preserveText: boolean): string {
  const ease = jstr(a.ease ?? "expoOut");
  if (a.target === "__COMP__") {
    return `
    (function () {
      MP.log(${jstr(a.type + " __COMP__")});
      ${emitAnimation(a)}
    })();`;
  }
  // Staggered group reveal for wildcard card targets.
  if ((a.type === "staggerPop" || a.type === "overshootPop") && a.stagger) {
    const body =
      a.type === "overshootPop"
        ? `
        MP.addOpacityAnimation(ly, 0, 100, st, ${Math.min(a.duration, 0.35)}, ${ease});
        MP.addScaleAnimation(ly, 72, 104, st, ${a.duration * 0.72}, ${ease});
        MP.addScaleAnimation(ly, 104, 100, st + ${a.duration * 0.72}, ${a.duration * 0.28}, "quadOut");`
        : `MP.addOpacityAnimation(ly, 0, 100, st, ${a.duration * 0.8}, ${ease});
        MP.addScaleAnimation(ly, 80, 100, st, ${a.duration}, ${ease});`;
    return `
    (function () {
      var matched = MP.findLayersByPattern(comp, ${jstr(a.target)});
      MP.log("Stagger ${a.target} -> " + matched.length + " layers");
      for (var k = 0; k < matched.length; k++) {
        var ly = matched[k];
        var st = ${a.start} + k * ${a.stagger};
        ${body}
      }
    })();`;
  }
  return `
    (function () {
      var matched = MP.findLayersByPattern(comp, ${jstr(a.target)});
      MP.log(${jstr(a.type + " " + a.target)} + " -> " + matched.length + " layers");
      for (var k = 0; k < matched.length; k++) {
        var ly = matched[k];
        var isText = ly.property("ADBE Text Properties") != null;
        if (isText) { MP.protectTextLayer(ly); }
        ${
          preserveText
            ? `if (isText && ${jstr(a.type)} === "slideScale") { /* never scale-blur text */ ly = ly; }`
            : ""
        }
        ${emitAnimation(a)}
      }
    })();`;
}

/**
 * JSX to open an AEP, read the motion plan (inlined), apply keyframes/effects,
 * and save a new AEP. preserveTextContent ensures sourceText is never changed.
 */
export function generateAnimateJsx(opts: {
  aepPath: string;
  plan: MotionPlan;
  outputAepPath: string;
  preserveTextContent: boolean;
}): string {
  const groups = opts.plan.animations.map((a) => emitGroup(a, opts.preserveTextContent)).join("\n");
  const body = `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) { throw new Error("AEP not found: " + ${jstr(opts.aepPath)}); }
    app.open(proj);
    MP.log("Opened: " + ${jstr(opts.aepPath)});

    app.beginUndoGroup("MotionPilot Animate");
    var comp = null;
    var wantName = ${jstr(opts.plan.composition.name)};
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && it.name === wantName) { comp = it; break; }
    }
    if (!comp) {
      // Fallback: the comp with the most layers.
      for (var j = 1; j <= app.project.numItems; j++) {
        var cj = app.project.item(j);
        if (cj instanceof CompItem && (!comp || cj.numLayers > comp.numLayers)) comp = cj;
      }
    }
    if (!comp) { throw new Error("No composition found to animate."); }
    if (comp.numLayers === 0) {
      throw new Error("Composition '" + comp.name + "' has 0 layers — nothing to animate. " +
        "Re-run import so the PSD comes in as a layered composition.");
    }
    comp.duration = ${opts.plan.composition.duration};
    comp.frameRate = ${opts.plan.composition.fps};
    MP.log("Animating comp: " + comp.name + " (layers=" + comp.numLayers + ")");

    var PRESERVE_TEXT = ${opts.preserveTextContent ? "true" : "false"};

${groups}

    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
  `;
  return withReport(body);
}

/** JSX to add a comp to the render queue and render to a video file. */
export function generateRenderJsx(opts: {
  aepPath: string;
  compName: string;
  outputVideoPath: string;
  format: "mp4" | "mov";
}): string {
  const body = `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) { throw new Error("AEP not found: " + ${jstr(opts.aepPath)}); }
    app.open(proj);
    var comp = null;
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && it.name === ${jstr(opts.compName)}) { comp = it; break; }
    }
    if (!comp) { throw new Error("Comp not found: " + ${jstr(opts.compName)}); }

    var rqItem = app.project.renderQueue.items.add(comp);
    var om = rqItem.outputModule(1);
    // Try to find a real H.264 output-module template on THIS machine instead of
    // hard-coding one name (template names vary across AE versions/locales).
    (function () {
      var preferred = [
        "H.264 - Match Render Settings -  15 Mbps",
        "H.264 - Match Render Settings - 15 Mbps",
        "H.264 - Match Render Settings - 40 Mbps",
        "H.264 - Match Render Settings - 5 Mbps",
        "H.264",
        "High Quality with Alpha",
        "High Quality"
      ];
      var available = [];
      try { available = om.templates; } catch (eT) {}
      // 1) exact preferred match
      for (var i = 0; i < preferred.length; i++) {
        for (var j = 0; j < available.length; j++) {
          if (available[j] === preferred[i]) {
            try { om.applyTemplate(available[j]); MP.log("Render template: " + available[j]); return; }
            catch (eA) {}
          }
        }
      }
      // 2) any template whose name contains "H.264" / "H264"
      for (var k = 0; k < available.length; k++) {
        if (/h\.?264/i.test(available[k])) {
          try { om.applyTemplate(available[k]); MP.log("Render template (fuzzy H.264): " + available[k]); return; }
          catch (eF) {}
        }
      }
      MP.log("No H.264 template found; using output module default. Available: " + available.join(" | "));
    })();
    om.file = new File(${jstr(opts.outputVideoPath)});
    app.project.renderQueue.render();
    __result.output = ${jstr(opts.outputVideoPath)};
    MP.log("Rendered: " + ${jstr(opts.outputVideoPath)});
  `;
  return withReport(body);
}

export function generateExecuteActionsJsx(opts: {
  aepPath?: string;
  outputAepPath?: string;
  actions: Record<string, unknown>[];
}): string {
  const body = `
    var inputProject = ${opts.aepPath ? jstr(opts.aepPath) : "null"};
    if (inputProject) {
      var proj = new File(inputProject);
      if (!proj.exists) { throw new Error("AEP not found: " + inputProject); }
      app.open(proj);
      MP.log("Opened: " + inputProject);
    } else {
      app.newProject();
      MP.log("Created new AE project");
    }

    var ACTIONS = ${jsonLiteral(opts.actions)};
    var SUMMARY = [];
    var changed = false;

    function asArray(v, fallback) {
      return v instanceof Array ? v : fallback;
    }
    function color(v, fallback) {
      var c = asArray(v, fallback || [1, 1, 1]);
      return [Number(c[0]), Number(c[1]), Number(c[2])];
    }
    function getComp(name) {
      for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
      }
      throw new Error("Composition not found: " + name);
    }
    function getLayer(comp, nameOrIndex) {
      if (typeof nameOrIndex === "number") return comp.layer(nameOrIndex);
      for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name === nameOrIndex) return comp.layer(i);
      }
      throw new Error("Layer not found in " + comp.name + ": " + nameOrIndex);
    }
    function transformProp(layer, propName) {
      var tg = layer.property("ADBE Transform Group");
      switch (String(propName)) {
        case "position": return tg.property("ADBE Position");
        case "scale": return tg.property("ADBE Scale");
        case "rotation":
        case "rotationZ": return tg.property("ADBE Rotate Z");
        case "xRotation":
        case "rotationX": return tg.property("ADBE Rotate X");
        case "yRotation":
        case "rotationY": return tg.property("ADBE Rotate Y");
        case "opacity": return tg.property("ADBE Opacity");
        case "anchorPoint": return tg.property("ADBE Anchor Point");
        default: throw new Error("Unsupported transform property: " + propName);
      }
    }
    function setProp(layer, name, value) {
      if (name === "startTime") layer.startTime = Number(value);
      else if (name === "inPoint") layer.inPoint = Number(value);
      else if (name === "outPoint") layer.outPoint = Number(value);
      else if (name === "enabled") layer.enabled = Boolean(value);
      else if (name === "name") layer.name = String(value);
      else transformProp(layer, name).setValue(value);
    }
    function setBlend(layer, mode) {
      var key = String(mode || "normal").toUpperCase();
      var map = {
        NORMAL: BlendingMode.NORMAL,
        MULTIPLY: BlendingMode.MULTIPLY,
        SCREEN: BlendingMode.SCREEN,
        OVERLAY: BlendingMode.OVERLAY,
        ADD: BlendingMode.ADD,
        CLASSIC_COLOR_DODGE: BlendingMode.CLASSIC_COLOR_DODGE,
        COLOR_DODGE: BlendingMode.COLOR_DODGE,
        DARKEN: BlendingMode.DARKEN,
        LIGHTEN: BlendingMode.LIGHTEN,
        SOFT_LIGHT: BlendingMode.SOFT_LIGHT,
        HARD_LIGHT: BlendingMode.HARD_LIGHT,
        DIFFERENCE: BlendingMode.DIFFERENCE
      };
      layer.blendingMode = map[key] || BlendingMode.NORMAL;
    }
    function addShape(comp, a) {
      var ly = comp.layers.addShape();
      ly.name = a.name || (a.shapeType || "shape") + " layer";
      var root = ly.property("ADBE Root Vectors Group");
      var group = root.addProperty("ADBE Vector Group");
      group.name = a.shapeType || "rectangle";
      var vectors = group.property("ADBE Vectors Group");
      var shapeType = String(a.shapeType || "rectangle");
      var shape;
      if (shapeType === "ellipse") shape = vectors.addProperty("ADBE Vector Shape - Ellipse");
      else if (shapeType === "star" || shapeType === "polygon") {
        shape = vectors.addProperty("ADBE Vector Shape - Star");
        shape.property("ADBE Vector Star Type").setValue(shapeType === "polygon" ? 2 : 1);
        if (a.points) shape.property("ADBE Vector Star Points").setValue(Number(a.points));
        if (a.outerRadius) shape.property("ADBE Vector Star Outer Radius").setValue(Number(a.outerRadius));
        if (a.innerRadius && shapeType === "star") shape.property("ADBE Vector Star Inner Radius").setValue(Number(a.innerRadius));
      } else {
        shape = vectors.addProperty("ADBE Vector Shape - Rect");
        if (a.size) shape.property("ADBE Vector Rect Size").setValue(a.size);
        if (a.roundness !== undefined) shape.property("ADBE Vector Rect Roundness").setValue(Number(a.roundness));
      }
      if (a.fillColor) {
        var fill = vectors.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(color(a.fillColor));
      }
      if (a.strokeColor) {
        var stroke = vectors.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(color(a.strokeColor));
        stroke.property("ADBE Vector Stroke Width").setValue(Number(a.strokeWidth || 1));
      }
      if (a.position) ly.property("ADBE Transform Group").property("ADBE Position").setValue(a.position);
      return ly;
    }
    function addMask(layer, a) {
      var masks = layer.property("ADBE Mask Parade");
      var mask = masks.addProperty("ADBE Mask Atom");
      mask.name = a.maskName || "Mask 1";
      var shp = new Shape();
      var vertices = a.vertices || [[0, 0], [100, 0], [100, 100], [0, 100]];
      shp.vertices = vertices;
      shp.inTangents = a.inTangents || [];
      shp.outTangents = a.outTangents || [];
      shp.closed = a.closed !== false;
      mask.property("ADBE Mask Shape").setValue(shp);
      if (a.feather !== undefined) mask.property("ADBE Mask Feather").setValue(asArray(a.feather, [Number(a.feather), Number(a.feather)]));
      if (a.expansion !== undefined) mask.property("ADBE Mask Expansion").setValue(Number(a.expansion));
      if (a.opacity !== undefined) mask.property("ADBE Mask Opacity").setValue(Number(a.opacity));
      return mask;
    }
    function matteMode(mode) {
      switch (String(mode || "alpha")) {
        case "alphaInverted": return TrackMatteType.ALPHA_INVERTED;
        case "luma": return TrackMatteType.LUMA;
        case "lumaInverted": return TrackMatteType.LUMA_INVERTED;
        default: return TrackMatteType.ALPHA;
      }
    }
    function projectInfo() {
      var comps = [];
      for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem) {
          comps.push({ name: it.name, width: it.width, height: it.height, duration: it.duration, fps: it.frameRate, layers: it.numLayers });
        }
      }
      return { file: app.project.file ? app.project.file.fsName : null, itemCount: app.project.numItems, compositions: comps };
    }

    app.beginUndoGroup("MotionPilot AE Actions");
    for (var ai = 0; ai < ACTIONS.length; ai++) {
      var a = ACTIONS[ai];
      var type = String(a.type);
      if (type === "createComposition") {
        var comp = app.project.items.addComp(a.name || "Comp 1", Number(a.width || 1920), Number(a.height || 1080), Number(a.pixelAspect || 1), Number(a.duration || 10), Number(a.fps || 30));
        if (a.backgroundColor) comp.bgColor = color(a.backgroundColor, [0, 0, 0]);
        SUMMARY.push({ type: type, compName: comp.name });
        changed = true;
      } else if (type === "listCompositions") {
        SUMMARY.push({ type: type, compositions: projectInfo().compositions });
      } else if (type === "getProjectInfo") {
        SUMMARY.push({ type: type, project: projectInfo() });
      } else if (type === "createTextLayer") {
        var tc = getComp(a.compName);
        var tl = tc.layers.addText(a.text || "");
        tl.name = a.name || "Text";
        var td = tl.property("ADBE Text Properties").property("ADBE Text Document").value;
        if (a.font) td.font = String(a.font);
        if (a.fontSize) td.fontSize = Number(a.fontSize);
        if (a.color) td.fillColor = color(a.color);
        if (a.justification) td.justification = ParagraphJustification[String(a.justification)] || td.justification;
        tl.property("ADBE Text Properties").property("ADBE Text Document").setValue(td);
        if (a.position) transformProp(tl, "position").setValue(a.position);
        SUMMARY.push({ type: type, layerName: tl.name });
        changed = true;
      } else if (type === "createShapeLayer") {
        var sl = addShape(getComp(a.compName), a);
        SUMMARY.push({ type: type, layerName: sl.name });
        changed = true;
      } else if (type === "createSolidLayer" || type === "createAdjustmentLayer") {
        var sc = getComp(a.compName);
        var so = sc.layers.addSolid(color(a.color, [0, 0, 0]), a.name || (type === "createAdjustmentLayer" ? "Adjustment" : "Solid"), Number(a.width || sc.width), Number(a.height || sc.height), Number(a.pixelAspect || 1), Number(a.duration || sc.duration));
        if (type === "createAdjustmentLayer") so.adjustmentLayer = true;
        if (a.position) transformProp(so, "position").setValue(a.position);
        SUMMARY.push({ type: type, layerName: so.name });
        changed = true;
      } else if (type === "createCameraLayer") {
        var cc = getComp(a.compName);
        var cam = cc.layers.addCamera(a.name || "Camera", asArray(a.centerPoint, [cc.width / 2, cc.height / 2]));
        if (a.zoom) cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(Number(a.zoom));
        if (a.position) transformProp(cam, "position").setValue(a.position);
        SUMMARY.push({ type: type, layerName: cam.name });
        changed = true;
      } else if (type === "createNullLayer") {
        var nc = getComp(a.compName);
        var nl = nc.layers.addNull(Number(a.duration || nc.duration));
        nl.name = a.name || "Null";
        if (a.position) transformProp(nl, "position").setValue(a.position);
        if (a.threeDLayer !== undefined) nl.threeDLayer = Boolean(a.threeDLayer);
        SUMMARY.push({ type: type, layerName: nl.name });
        changed = true;
      } else if (type === "setLayerProperties") {
        var lp = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        var props = a.properties || {};
        for (var pn in props) if (props.hasOwnProperty(pn)) setProp(lp, pn, props[pn]);
        SUMMARY.push({ type: type, layerName: lp.name });
        changed = true;
      } else if (type === "setLayer3d") {
        var l3 = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        l3.threeDLayer = Boolean(a.enabled);
        SUMMARY.push({ type: type, layerName: l3.name, enabled: l3.threeDLayer });
        changed = true;
      } else if (type === "setBlendMode") {
        var bl = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        setBlend(bl, a.mode);
        SUMMARY.push({ type: type, layerName: bl.name, mode: a.mode || "normal" });
        changed = true;
      } else if (type === "setTrackMatte") {
        var mc = getComp(a.compName);
        var target = getLayer(mc, a.layerName || a.layerIndex);
        if (a.matteLayerName || a.matteLayerIndex) {
          var matte = getLayer(mc, a.matteLayerName || a.matteLayerIndex);
          try { target.setTrackMatte(matte, matteMode(a.mode)); }
          catch (e) { target.trackMatteType = matteMode(a.mode); }
        } else {
          target.trackMatteType = matteMode(a.mode);
        }
        SUMMARY.push({ type: type, layerName: target.name, mode: a.mode || "alpha" });
        changed = true;
      } else if (type === "duplicateLayer") {
        var dl = getLayer(getComp(a.compName), a.layerName || a.layerIndex).duplicate();
        if (a.newName) dl.name = String(a.newName);
        SUMMARY.push({ type: type, layerName: dl.name });
        changed = true;
      } else if (type === "deleteLayer") {
        var del = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        var oldName = del.name;
        del.remove();
        SUMMARY.push({ type: type, layerName: oldName });
        changed = true;
      } else if (type === "createMask") {
        var ml = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        var mask = addMask(ml, a);
        SUMMARY.push({ type: type, layerName: ml.name, maskName: mask.name });
        changed = true;
      } else if (type === "setKeyframes") {
        var kl = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        var kp = transformProp(kl, a.property);
        var keys = a.keyframes || [];
        for (var ki = 0; ki < keys.length; ki++) kp.setValueAtTime(Number(keys[ki].time), keys[ki].value);
        if (a.ease) MP.setEase(kp, a.ease);
        SUMMARY.push({ type: type, layerName: kl.name, property: a.property, keyframes: keys.length });
        changed = true;
      } else if (type === "applyExpression") {
        var el = getLayer(getComp(a.compName), a.layerName || a.layerIndex);
        transformProp(el, a.property).expression = String(a.expression || "");
        SUMMARY.push({ type: type, layerName: el.name, property: a.property });
        changed = true;
      } else if (type === "batchSetProperties") {
        var bc = getComp(a.compName);
        var names = a.layerNames || [];
        var bprops = a.properties || {};
        for (var bi = 0; bi < names.length; bi++) {
          var bly = getLayer(bc, names[bi]);
          for (var bpn in bprops) if (bprops.hasOwnProperty(bpn)) setProp(bly, bpn, bprops[bpn]);
        }
        SUMMARY.push({ type: type, layerCount: names.length });
        changed = true;
      } else {
        throw new Error("Unsupported action type: " + type);
      }
    }
    app.endUndoGroup();

    __result.log = MP.getLog() + "\\nMP_ACTION_SUMMARY_BEGIN\\n" + MP.toJson(SUMMARY) + "\\nMP_ACTION_SUMMARY_END";
    if (changed) {
      if (!${opts.outputAepPath ? "true" : "false"}) throw new Error("outputAepPath is required for mutating actions.");
      __result.output = MP.saveProject(${opts.outputAepPath ? jstr(opts.outputAepPath) : '""'});
    }
  `;
  return withReport(body);
}

export function generateCreate3dSceneJsx(opts: {
  manifest: {
    width: number;
    height: number;
    assets: Array<{
      name: string;
      path: string;
      role: string;
      z: number;
      scale: number;
      position: [number, number];
    }>;
  };
  outputAepPath: string;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    app.beginUndoGroup("MotionPilot 3D Scene");

    var MANIFEST = ${jsonLiteral(opts.manifest)};
    var comp = app.project.items.addComp(${jstr(opts.compName)}, MANIFEST.width, MANIFEST.height, 1, ${opts.duration}, ${opts.fps});
    comp.bgColor = [0.02, 0.025, 0.05];
    MP.log("Created 3D scene comp: " + comp.name);

    function importAsset(path) {
      var f = new File(path);
      if (!f.exists) throw new Error("Asset not found: " + path);
      var io = new ImportOptions(f);
      return app.project.importFile(io);
    }

    var layers = [];
    for (var i = 0; i < MANIFEST.assets.length; i++) {
      var a = MANIFEST.assets[i];
      var item = importAsset(a.path);
      var ly = comp.layers.add(item);
      ly.name = a.name;
      ly.threeDLayer = true;
      ly.property("ADBE Transform Group").property("ADBE Position").setValue([a.position[0], a.position[1], a.z]);
      ly.property("ADBE Transform Group").property("ADBE Scale").setValue([a.scale, a.scale, a.scale]);
      try { ly.motionBlur = true; } catch (e) {}
      layers.push(ly);

      if (a.role === "background") {
        MP.addParallax(ly, 28, 0, ${opts.duration}, "sineInOut");
      } else if (a.role === "hero") {
        MP.addScaleAnimation(ly, 84, a.scale, 0.45, 1.4, "backOut");
        MP.addPositionAnimation(ly, [0, 72], 0.45, 1.4, "backOut");
        ly.property("ADBE Transform Group").property("ADBE Rotate Y").expression = "Math.sin(time*.55)*5;";
      } else if (a.role === "accent") {
        ly.property("ADBE Transform Group").property("ADBE Position").expression =
          "var amp=26; [value[0]+Math.cos(time*.55+index)*amp, value[1]+Math.sin(time*.42+index)*amp*.45, value[2]];";
        ly.property("ADBE Transform Group").property("ADBE Rotate Z").expression = "time*8 + index*12;";
        MP.addOpacityAnimation(ly, 0, 100, 0.8 + i * 0.12, 0.8, "quadOut");
      } else if (a.role === "title") {
        MP.addPositionAnimation(ly, [0, -48], 1.8, 0.9, "expoOut");
        MP.addOpacityAnimation(ly, 0, 100, 1.8, 0.65, "expoOut");
      } else if (a.role === "cta") {
        MP.addPositionAnimation(ly, [0, 92], ${Math.max(1.5, opts.duration - 3.2)}, 0.85, "backOut");
        MP.addOpacityAnimation(ly, 0, 100, ${Math.max(1.5, opts.duration - 3.2)}, 0.55, "quadOut");
        ly.property("ADBE Transform Group").property("ADBE Scale").expression =
          "var p=Math.sin(time*Math.PI*2*.7)*1.4; [value[0]+p,value[1]+p,value[2]+p];";
      }
    }

    var cam = comp.layers.addCamera("MotionPilot Camera", [MANIFEST.width / 2, MANIFEST.height / 2]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([MANIFEST.width / 2, MANIFEST.height / 2, -1350]);
    cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(980);
    MP.addCameraPush(comp, 0, ${opts.duration}, 180, "sineInOut");

    var light = comp.layers.addLight("MotionPilot Key Light", [MANIFEST.width * 0.3, MANIFEST.height * 0.25]);
    light.lightType = LightType.PARALLEL;
    light.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(90);
    light.property("ADBE Transform Group").property("ADBE Position").setValue([MANIFEST.width * 0.2, MANIFEST.height * 0.2, -500]);

    try { comp.motionBlur = true; } catch (e) {}
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
  `;
  return withReport(body);
}
