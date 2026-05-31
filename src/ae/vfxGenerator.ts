import { JSX_HELPERS } from "./jsxHelpers.js";
import { VFX_HELPERS } from "./vfxHelpers.js";
import { getVfxPreset, getVfxComposite, VfxParamSpec } from "../vfx/presets.js";
import { VfxPlan } from "../vfx/vfxPlanner.js";

function jstr(s: string): string {
  return JSON.stringify(String(s));
}
function jsonLiteral(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Result-reporting preamble, including BOTH the base and VFX JSX libraries. */
function withReport(body: string): string {
  return `
${JSX_HELPERS}
${VFX_HELPERS}
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
  $.writeln("MP_RESULT_BEGIN");
  $.writeln(__result.ok + "|" + __result.output + "|" + __result.error);
  $.writeln("MP_LOG_BEGIN");
  $.writeln(__result.log);
  $.writeln("MP_RESULT_END");
  return __result.ok ? "OK" : "ERR";
})();
`;
}

export interface VfxApplication {
  /** Preset id from the catalog, e.g. "game.energy_burst". */
  presetId: string;
  /** Optional explicit MPVFX function override (advanced). */
  fn?: string;
  /** Layer name / wildcard the effect should decorate (for layer-mode presets). */
  targetLayer?: string;
  /** Parameter overrides merged over the preset defaults. */
  params?: VfxParamSpec;
}

/**
 * JSX that opens an AEP (or operates on the supplied comp), resolves each
 * requested VFX preset to its MPVFX function and parameters, applies them, and
 * saves a new AEP. Never mutates source text layers.
 */
export function generateApplyVfxJsx(opts: {
  aepPath: string;
  compName?: string;
  outputAepPath: string;
  applications: VfxApplication[];
}): string {
  // Resolve presets -> concrete { fn, opts } calls at build time.
  const calls = opts.applications.map((app) => {
    const preset = getVfxPreset(app.presetId);
    if (!preset && !app.fn) {
      throw new Error(`Unknown VFX preset: ${app.presetId}`);
    }
    const fn = app.fn ?? preset!.fn;
    const merged: Record<string, unknown> = {
      ...(preset?.defaults ?? {}),
      ...(app.params ?? {}),
    };
    if (app.targetLayer) merged.targetLayer = app.targetLayer;
    return { fn, opts: merged, presetId: app.presetId };
  });

  const callsLiteral = jsonLiteral(calls);

  const body = `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) { throw new Error("AEP not found: " + ${jstr(opts.aepPath)}); }
    app.open(proj);
    MP.log("Opened: " + ${jstr(opts.aepPath)});

    app.beginUndoGroup("MotionPilot VFX");
    var comp = null;
    var wantName = ${opts.compName ? jstr(opts.compName) : "null"};
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        if (wantName && it.name === wantName) { comp = it; break; }
        if (!wantName && (!comp || it.numLayers > comp.numLayers)) comp = it;
      }
    }
    if (!comp) { throw new Error("No composition found for VFX."); }
    MP.log("VFX target comp: " + comp.name + " (layers=" + comp.numLayers + ")");

    var CALLS = ${callsLiteral};
    var applied = [];
    for (var k = 0; k < CALLS.length; k++) {
      var call = CALLS[k];
      try {
        MPVFX.run(comp, call.fn, call.opts);
        applied.push(call.presetId || call.fn);
        MP.log("Applied VFX: " + (call.presetId || call.fn));
      } catch (eApply) {
        MP.log("VFX FAILED (" + (call.presetId || call.fn) + "): " + eApply.toString());
      }
    }

    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
    __result.log = MP.getLog() + "\\nMP_VFX_APPLIED_BEGIN\\n" + applied.join(",") + "\\nMP_VFX_APPLIED_END";
  `;
  return withReport(body);
}

/**
 * JSX that creates a brand-new comp populated purely with VFX layers (e.g. a
 * reusable explosion / magic-circle / fog element comp), then saves an AEP.
 */
export function generateCreateVfxCompJsx(opts: {
  outputAepPath: string;
  compName: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  backgroundColor?: [number, number, number];
  applications: VfxApplication[];
}): string {
  const calls = opts.applications.map((app) => {
    const preset = getVfxPreset(app.presetId);
    const fn = app.fn ?? preset?.fn;
    if (!fn) throw new Error(`Unknown VFX preset: ${app.presetId}`);
    const merged: Record<string, unknown> = { ...(preset?.defaults ?? {}), ...(app.params ?? {}) };
    if (app.targetLayer) merged.targetLayer = app.targetLayer;
    return { fn, opts: merged, presetId: app.presetId };
  });

  const body = `
    app.newProject();
    app.beginUndoGroup("MotionPilot VFX Comp");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    comp.bgColor = ${jsonLiteral(opts.backgroundColor ?? [0, 0, 0])};
    MP.log("Created VFX comp: " + comp.name);

    var CALLS = ${jsonLiteral(calls)};
    var applied = [];
    for (var k = 0; k < CALLS.length; k++) {
      var call = CALLS[k];
      try { MPVFX.run(comp, call.fn, call.opts); applied.push(call.presetId || call.fn); }
      catch (eApply) { MP.log("VFX FAILED (" + (call.presetId || call.fn) + "): " + eApply.toString()); }
    }
    try { comp.motionBlur = true; } catch (e) {}
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
    __result.log = MP.getLog() + "\\nMP_VFX_APPLIED_BEGIN\\n" + applied.join(",") + "\\nMP_VFX_APPLIED_END";
  `;
  return withReport(body);
}

export interface ComplexVfxApplication {
  /** Composite recipe id, e.g. "cinematicExplosion". */
  compositeId: string;
  /** 0.2..2 — scales strengths across the whole stack. */
  intensity?: number;
  /** Base start time (seconds) for the whole stack. */
  start?: number;
  /** Focal point [x,y] for the effect. */
  position?: [number, number];
  /** Override base color [r,g,b] 0..1. */
  color?: [number, number, number];
  /** Hero layer for layer-mode steps (light sweep / glow). */
  targetLayer?: string;
}

/**
 * JSX that applies one or more COMPOSITE VFX recipes (multi-layer, production
 * grade) to an existing AEP comp via MPVFX.runComposite, then saves a new AEP.
 */
export function generateComplexVfxJsx(opts: {
  aepPath?: string;
  compName?: string;
  outputAepPath: string;
  /** When aepPath is omitted, a fresh comp is created with these dims. */
  newComp?: { name: string; width: number; height: number; duration: number; fps: number };
  composites: ComplexVfxApplication[];
}): string {
  const calls = opts.composites.map((c) => {
    if (!getVfxComposite(c.compositeId)) {
      throw new Error(`Unknown VFX composite: ${c.compositeId}`);
    }
    return {
      recipe: c.compositeId,
      opts: {
        intensity: c.intensity ?? 1,
        start: c.start ?? 0,
        position: c.position ?? null,
        color: c.color ?? null,
        targetLayer: c.targetLayer ?? null,
      },
    };
  });

  const compSetup = opts.aepPath
    ? `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) { throw new Error("AEP not found: " + ${jstr(opts.aepPath)}); }
    app.open(proj);
    MP.log("Opened: " + ${jstr(opts.aepPath)});
    var comp = null;
    var wantName = ${opts.compName ? jstr(opts.compName) : "null"};
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        if (wantName && it.name === wantName) { comp = it; break; }
        if (!wantName && (!comp || it.numLayers > comp.numLayers)) comp = it;
      }
    }
    if (!comp) { throw new Error("No composition found for complex VFX."); }`
    : `
    app.newProject();
    var nc = ${jsonLiteral(opts.newComp ?? { name: "MotionPilot_VFX", width: 1920, height: 1080, duration: 6, fps: 30 })};
    var comp = app.project.items.addComp(nc.name, nc.width, nc.height, 1, nc.duration, nc.fps);
    comp.bgColor = [0, 0, 0];`;

  const body = `
    app.beginUndoGroup("MotionPilot Complex VFX");
    ${compSetup}
    MP.log("Complex VFX target comp: " + comp.name);

    var RECIPES = ${jsonLiteral(calls)};
    var applied = [];
    for (var k = 0; k < RECIPES.length; k++) {
      var r = RECIPES[k];
      try {
        var steps = MPVFX.runComposite(comp, r.recipe, r.opts);
        applied.push(r.recipe + "(" + steps.length + ")");
      } catch (eR) {
        MP.log("COMPOSITE FAILED (" + r.recipe + "): " + eR.toString());
      }
    }
    try { comp.motionBlur = true; } catch (e) {}
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
    __result.log = MP.getLog() + "\\nMP_VFX_COMPOSITE_BEGIN\\n" + applied.join(",") + "\\nMP_VFX_COMPOSITE_END";
  `;
  return withReport(body);
}

/**
 * JSX for prompt-planned VFX. The natural-language parsing happens in
 * TypeScript; this only dispatches the resulting preset/composite steps.
 */
export function generatePromptVfxJsx(opts: {
  aepPath?: string;
  compName?: string;
  outputAepPath: string;
  plan: VfxPlan;
  c4dScenePath?: string;
}): string {
  const c4dImport = opts.c4dScenePath
    ? `
    (function () {
      var c4dFile = new File(${jstr(opts.c4dScenePath)});
      if (!c4dFile.exists) { throw new Error("C4D scene not found: " + ${jstr(opts.c4dScenePath)}); }
      try {
        var io = new ImportOptions(c4dFile);
        var c4dItem = app.project.importFile(io);
        var c4dLayer = comp.layers.add(c4dItem);
        c4dLayer.name = "C4D/Cineware Scene";
        c4dLayer.startTime = 0;
        c4dLayer.outPoint = comp.duration;
        try { c4dLayer.threeDLayer = true; } catch (e3d) {}
        MP.log("Imported C4D scene via AE/Cineware path: " + ${jstr(opts.c4dScenePath)});
      } catch (eC4D) {
        throw new Error("C4D/Cineware import failed: " + eC4D.toString());
      }
    })();`
    : "";

  const compSetup = opts.aepPath
    ? `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) { throw new Error("AEP not found: " + ${jstr(opts.aepPath)}); }
    app.open(proj);
    MP.log("Opened: " + ${jstr(opts.aepPath)});
    var comp = null;
    var wantName = ${opts.compName ? jstr(opts.compName) : "null"};
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        if (wantName && it.name === wantName) { comp = it; break; }
        if (!wantName && (!comp || it.numLayers > comp.numLayers)) comp = it;
      }
    }
    if (!comp) { throw new Error("No composition found for prompt VFX."); }`
    : `
    app.newProject();
    var pc = ${jsonLiteral(opts.plan.composition)};
    var comp = app.project.items.addComp(pc.name, pc.width, pc.height, 1, pc.duration, pc.fps);
    comp.bgColor = [0, 0, 0];`;

  const body = `
    app.beginUndoGroup("MotionPilot Prompt Game VFX");
    ${compSetup}
    MP.log("Prompt VFX target comp: " + comp.name);
    ${c4dImport}

    var STEPS = ${jsonLiteral(opts.plan.steps)};
    var applied = [];
    for (var k = 0; k < STEPS.length; k++) {
      var step = STEPS[k];
      var stepOpts = step.params || {};
      if (step.targetLayer) stepOpts.targetLayer = step.targetLayer;
      try {
        if (step.type === "composite") {
          var resultSteps = MPVFX.runComposite(comp, step.name, stepOpts);
          applied.push(step.name + "(" + resultSteps.length + ")");
        } else {
          MPVFX.run(comp, step.name, stepOpts);
          applied.push(step.name);
        }
      } catch (eStep) {
        MP.log("PROMPT VFX FAILED (" + step.name + "): " + eStep.toString());
      }
    }
    try { comp.motionBlur = true; } catch (e) {}
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
    __result.log = MP.getLog() + "\\nMP_PROMPT_VFX_APPLIED_BEGIN\\n" + applied.join(",") + "\\nMP_PROMPT_VFX_APPLIED_END";
  `;
  return withReport(body);
}
