/**
 * MotionPilot Crazy/Experimental JSX generators.
 *
 * Generates ExtendScript for 5 new tool types that produce visual results
 * not natively available in After Effects:
 *   - Kinetic Typography
 *   - Particle Logo Reveal
 *   - Holographic HUD Scene
 *   - Generative Art Loop
 *   - Retro Synthwave Scene
 *
 * Each function returns a self-contained JSX string that runs inside AE.
 * All helpers from JSX_HELPERS + VFX_HELPERS are prepended by the caller.
 */

import { JSX_HELPERS } from "./jsxHelpers.js";
import { VFX_HELPERS } from "./vfxHelpers.js";

function jstr(s: string): string {
  return JSON.stringify(String(s));
}
function jlit(v: unknown): string {
  return JSON.stringify(v).replace(/</g, "\\u003c");
}

function withReport(body: string): string {
  return `
${JSX_HELPERS}
${VFX_HELPERS}
(function () {
  var __result = { ok: true, log: "", output: "", error: null };
  function __mpAssetStoreFinish(comp, profile, targetLayer) {
    try {
      if (comp) MPVFX.run(comp, "assetStorePolish", { profile: profile || "cinematic", targetLayer: targetLayer || null });
    } catch (ePolish) {
      try { MP.log("asset-store polish skipped: " + ePolish.toString()); } catch (eLog) {}
    }
  }
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

// ============================================================
// Tool 18: build_kinetic_typography
// ============================================================
export function generateKineticTypographyJsx(opts: {
  text: string;
  outputAepPath: string;
  style: string;
  bpm: number;
  palette?: string[];
  font: string;
  fontSize: number;
  addGlow: boolean;
  addBackground: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const words = opts.text.trim().split(/\s+/);
  const beatInterval = 60 / opts.bpm;
  const colors = opts.palette && opts.palette.length > 0
    ? opts.palette
    : ["#FFFFFF", "#00FFFF", "#FF00FF", "#FFFF00"];

  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Kinetic Typography: ${opts.style}");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});

    // ── Background ──────────────────────────────────────────────────
    ${opts.addBackground ? `
    var bg = comp.layers.addSolid([0.04, 0.04, 0.08], "BG_Gradient", ${opts.width}, ${opts.height}, 1, ${opts.duration});
    var bgRamp = bg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    if (bgRamp) {
      try { bgRamp.property("ADBE Ramp-0001").setValue([${opts.width/2}, 0]); } catch(e){}
      try { bgRamp.property("ADBE Ramp-0003").setValue([${opts.width/2}, ${opts.height}]); } catch(e){}
      try { bgRamp.property("ADBE Ramp-0002").setValue([0.05, 0.05, 0.15, 1]); } catch(e){}
      try { bgRamp.property("ADBE Ramp-0004").setValue([0.0, 0.0, 0.05, 1]); } catch(e){}
      try { bgRamp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }
    // BG particle field (subtle).
    MPVFX.run(comp, "bokeh", { strength: 20, color: [0.3, 0.1, 0.8], count: 8 });
    ` : ""}

    // ── Animate each word ──────────────────────────────────────────
    var words = ${jlit(words)};
    var beatInterval = ${beatInterval.toFixed(4)};
    var style = ${jstr(opts.style)};
    var cw = ${opts.width}; var ch = ${opts.height};
    var fontSize = ${opts.fontSize};
    var palette = ${jlit(colors)};
    var font = ${jstr(opts.font)};

    for (var wi = 0; wi < words.length; wi++) {
      var word = words[wi];
      var t0 = wi * beatInterval;
      if (t0 >= ${opts.duration} - 0.5) break;
      var dur = Math.min(beatInterval * 2.5, ${opts.duration} - t0);

      var textLayer = comp.layers.addText(word);
      textLayer.name = "Word_" + wi + "_" + word;
      textLayer.startTime = t0;
      textLayer.outPoint = t0 + dur;

      // Text document styling.
      try {
        var tdProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var tdVal = tdProp.value;
        tdVal.fontSize = fontSize;
        tdVal.font = font;
        tdVal.justification = ParagraphJustification.CENTER_JUSTIFY;
        // Cycle through palette colors.
        var hexCol = palette[wi % palette.length];
        if (hexCol.charAt(0) === "#") {
          var r = parseInt(hexCol.substr(1,2),16)/255;
          var g = parseInt(hexCol.substr(3,2),16)/255;
          var b = parseInt(hexCol.substr(5,2),16)/255;
          tdVal.fillColor = [r,g,b];
        } else {
          tdVal.fillColor = [1,1,1];
        }
        tdProp.setValue(tdVal);
      } catch(eText){}

      // Center position (with vertical stagger).
      var rowHeight = Math.round(ch / (words.length > 4 ? 4 : words.length + 1));
      var yPos = ch / 2 + (wi % 3 - 1) * rowHeight * 0.5;
      var posP = textLayer.property("ADBE Transform Group").property("ADBE Position");
      var scaleP = textLayer.property("ADBE Transform Group").property("ADBE Scale");
      var opP = textLayer.property("ADBE Transform Group").property("ADBE Opacity");
      var rotP = textLayer.property("ADBE Transform Group").property("ADBE Rotate Z");

      if (posP) posP.setValue([cw / 2, yPos]);

      // Per-style animation.
      if (style === "wordByWord") {
        if (scaleP) { scaleP.setValueAtTime(t0, [0,0]); scaleP.setValueAtTime(t0+0.12, [115,115]); scaleP.setValueAtTime(t0+0.22, [100,100]); MP.setEase(scaleP,"expoOut"); }
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.1, 100); opP.setValueAtTime(t0+dur*0.75, 100); opP.setValueAtTime(t0+dur, 0); }
      } else if (style === "bounce") {
        if (scaleP) { scaleP.setValueAtTime(t0, [0,0]); scaleP.setValueAtTime(t0+0.15, [130,130]); scaleP.setValueAtTime(t0+0.28, [95,95]); scaleP.setValueAtTime(t0+0.38, [105,105]); scaleP.setValueAtTime(t0+0.45, [100,100]); }
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.1, 100); opP.setValueAtTime(t0+dur-0.2, 100); opP.setValueAtTime(t0+dur, 0); }
      } else if (style === "typewriter") {
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.05, 100); opP.setValueAtTime(t0+dur-0.1, 100); opP.setValueAtTime(t0+dur, 0); }
        if (posP) { posP.setValueAtTime(t0, [cw*0.15, yPos]); posP.setValueAtTime(t0+0.05, [cw*0.15 + wi * 80 % (cw*0.7), yPos]); }
      } else if (style === "3dSpin") {
        textLayer.threeDLayer = true;
        if (rotP) { rotP.setValueAtTime(t0, -90); rotP.setValueAtTime(t0+0.3, 0); MP.setEase(rotP,"expoOut"); }
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.15, 100); opP.setValueAtTime(t0+dur-0.2, 100); opP.setValueAtTime(t0+dur, 0); }
      } else if (style === "scramble") {
        // Scramble: letter-by-letter position jitter then settle.
        if (posP) {
          posP.setValueAtTime(t0, [cw/2 + (Math.sin(wi*3)*120), yPos + Math.cos(wi*2.1)*80]);
          posP.setValueAtTime(t0+0.35, [cw/2, yPos]);
          MP.setEase(posP, "expoOut");
        }
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.05, 100); opP.setValueAtTime(t0+dur-0.15, 100); opP.setValueAtTime(t0+dur, 0); }
      } else {
        // letterByLetter and lineByLine default.
        if (scaleP) { scaleP.setValueAtTime(t0, [0,0]); scaleP.setValueAtTime(t0+0.18, [100,100]); MP.setEase(scaleP,"expoOut"); }
        if (opP) { opP.setValueAtTime(t0, 0); opP.setValueAtTime(t0+0.12, 100); opP.setValueAtTime(t0+dur-0.2, 100); opP.setValueAtTime(t0+dur, 0); }
      }

      // Glow on each word.
      ${opts.addGlow ? `
      var wGlow = textLayer.property("ADBE Effect Parade").addProperty("ADBE Glow");
      if (wGlow) { try { wGlow.property("ADBE Glow-0003").setValue(35); wGlow.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
      ` : ""}
    }

    // ── Beat marker line ────────────────────────────────────────────
    var markerLayer = comp.layers.addNull(${opts.duration});
    markerLayer.name = "MP_Beat_Markers";
    var markers = markerLayer.property("ADBE Marker");
    for (var bi = 0; bi * beatInterval < ${opts.duration}; bi++) {
      try {
        var mk = new MarkerValue("Beat " + (bi+1));
        markers.setValueAtTime(bi * beatInterval, mk);
      } catch(e){}
    }

    MP.log("Kinetic typography built: " + words.length + " words, style: " + style);
    __mpAssetStoreFinish(comp, "social", "Word_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// Tool 19: create_particle_logo_reveal
// ============================================================
export function generateParticleLogoRevealJsx(opts: {
  logoText: string;
  outputAepPath: string;
  revealStyle: string;
  particleColor?: number[];
  logoColor?: number[];
  particleCount: number;
  revealDuration: number;
  holdDuration: number;
  addGlow: boolean;
  addAftertrail: boolean;
  width: number;
  height: number;
  fps: number;
  compName: string;
}): string {
  const pCol = opts.particleColor ?? [0.3, 0.7, 1];
  const lCol = opts.logoColor ?? [1, 1, 1];
  const totalDur = opts.revealDuration + opts.holdDuration + 1.5;

  const body = `
    app.newProject();
    MP.log("Building Particle Logo Reveal: ${opts.revealStyle}");

    var comp = proj = app.project.items.addComp(${jstr(opts.compName)},
      ${opts.width}, ${opts.height}, 1, ${totalDur}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var revDur = ${opts.revealDuration};
    var holdDur = ${opts.holdDuration};
    var pCol = ${jlit(pCol)};
    var lCol = ${jlit(lCol)};
    var style = ${jstr(opts.revealStyle)};
    var pCount = ${opts.particleCount};

    // ── 1. Dark background ──────────────────────────────────────────
    var bg = comp.layers.addSolid([0.02, 0.02, 0.05], "MP_Logo_BG", cw, ch, 1, ${totalDur});

    // ── 2. Particle cloud (CC Particle World, center-burst) ─────────
    var pLayer = comp.layers.addSolid([0,0,0], "MP_Logo_Particles", cw, ch, 1, revDur + 0.5);
    pLayer.blendingMode = BlendingMode.ADD;
    var ccpw = pLayer.property("ADBE Effect Parade").addProperty("CC Particle World");
    if (ccpw) {
      try {
        var birth = ccpw.property("Birth Rate"); if (birth) birth.setValue(pCount / 30);
        var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(revDur * 0.8);
        var producer = ccpw.property("Producer");
        if (producer) { producer.property("Radius X").setValue(style === "rain" ? 0.5 : 0.05); producer.property("Radius Y").setValue(style === "rain" ? 0.05 : 0.05); producer.property("Position Y").setValue(style === "rain" ? -0.4 : 0); }
        var physics = ccpw.property("Physics");
        if (physics) {
          if (style === "assemble") { try { physics.property("Gravity").setValue(0); physics.property("Velocity").setValue(1.5); physics.property("Extra").setValue(0.6); } catch(e){} }
          else if (style === "explosion") { try { physics.property("Gravity").setValue(0.2); physics.property("Velocity").setValue(3.0); } catch(e){} }
          else if (style === "rain") { try { physics.property("Gravity").setValue(0.5); physics.property("Velocity").setValue(0.8); } catch(e){} }
          else if (style === "vortex") { try { physics.property("Gravity").setValue(-0.1); physics.property("Extra").setValue(0.8); } catch(e){} }
          else { try { physics.property("Gravity").setValue(0); physics.property("Velocity").setValue(1.8); } catch(e){} }
        }
        var particle = ccpw.property("Particle");
        if (particle) {
          try { particle.property("Particle Type").setValue(7); } catch(e){}   // star
          try { particle.property("Birth Size").setValue(0.05); particle.property("Death Size").setValue(0.01); } catch(e){}
          try { particle.property("Birth Color").setValue([pCol[0],pCol[1],pCol[2],1]); particle.property("Death Color").setValue([lCol[0],lCol[1],lCol[2],0]); } catch(e){}
        }
      } catch(eP){}
    } else {
      // Fallback: shape-layer radial burst.
      MPVFX.run(comp, "energyBurst", { duration: revDur, color: pCol, strength: 1.5 });
    }

    // After-trail / echo.
    ${opts.addAftertrail ? `
    var echo = pLayer.property("ADBE Effect Parade").addProperty("ADBE Echo");
    if (echo) { try { echo.property("ADBE Echo-0001").setValue(0.08); echo.property("ADBE Echo-0002").setValue(4); echo.property("ADBE Echo-0003").setValue(0.5); } catch(e){} }
    ` : ""}

    // Glow on particles.
    ${opts.addGlow ? `
    var pGlow = pLayer.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (pGlow) { try { pGlow.property("ADBE Glow-0003").setValue(50); pGlow.property("ADBE Glow-0004").setValue(2.0); } catch(e){} }
    ` : ""}

    // ── 3. Logo text (appears after reveal) ─────────────────────────
    var logoLayer = comp.layers.addText(${jstr(opts.logoText)});
    logoLayer.name = "MP_Logo_Text";
    logoLayer.startTime = revDur * 0.7;
    try {
      var ldProp = logoLayer.property("ADBE Text Properties").property("ADBE Text Document");
      var ldVal = ldProp.value;
      ldVal.fontSize = Math.round(cw * 0.12);
      ldVal.fillColor = lCol;
      ldVal.font = "Arial Black";
      ldVal.justification = ParagraphJustification.CENTER_JUSTIFY;
      ldProp.setValue(ldVal);
    } catch(eL){}
    var lPos = logoLayer.property("ADBE Transform Group").property("ADBE Position");
    if (lPos) lPos.setValue([cw/2, ch/2]);

    // Logo scale-in animation.
    var lSc = logoLayer.property("ADBE Transform Group").property("ADBE Scale");
    if (lSc) { lSc.setValueAtTime(revDur*0.7, [0,0]); lSc.setValueAtTime(revDur*0.7+0.5, [105,105]); lSc.setValueAtTime(revDur*0.7+0.7, [100,100]); MP.setEase(lSc,"expoOut"); }
    var lOp = logoLayer.property("ADBE Transform Group").property("ADBE Opacity");
    if (lOp) { lOp.setValueAtTime(revDur*0.7, 0); lOp.setValueAtTime(revDur*0.7+0.35, 100); }

    ${opts.addGlow ? `
    var lGlow = logoLayer.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (lGlow) { try { lGlow.property("ADBE Glow-0003").setValue(60); lGlow.property("ADBE Glow-0004").setValue(2.5); } catch(e){} }
    // Light sweep on logo.
    MPVFX.run(comp, "lightSweep", { start: revDur + 0.4, duration: 1.2, targetLayer: "MP_Logo_Text" });
    ` : ""}

    // ── 4. Finishing grade ──────────────────────────────────────────
    MPVFX.run(comp, "cinematicGrade", {});
    MPVFX.run(comp, "filmGrain", { strength: 4 });

    MP.log("Particle logo reveal built: " + pCount + " particles, style: " + style);
    __mpAssetStoreFinish(comp, "commercial", "MP_Logo_Text");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// Tool 20: build_holographic_hud_scene
// ============================================================
export function generateHolographicHudSceneJsx(opts: {
  outputAepPath: string;
  sceneType: string;
  primaryColor?: number[];
  accentColor?: number[];
  dataLines?: string[];
  showRadar: boolean;
  showBarGraph: boolean;
  showCircularGauge: boolean;
  showScanlines: boolean;
  showCornerBrackets: boolean;
  showWaveform: boolean;
  backgroundStyle: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const pCol = opts.primaryColor ?? [0.1, 0.9, 1];
  const aCol = opts.accentColor ?? [1, 0.5, 0.1];
  const dataLines = opts.dataLines ?? [
    "SYS.STATUS: ONLINE", "CPU: 87.3%", "SIGNAL: 94.7%", "UPLINK: ACTIVE",
    "THREAT: MINIMAL", "SCANNING...", "AUTH: GRANTED", "INITIALIZING..."
  ];

  const body = `
    app.newProject();
    MP.log("Building Holographic HUD Scene: ${opts.sceneType}");

    var comp = app.project.items.addComp(${jstr(opts.compName)},
      ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var pCol = ${jlit(pCol)};
    var aCol = ${jlit(aCol)};
    var dur = ${opts.duration};
    var sceneType = ${jstr(opts.sceneType)};

    // ── 1. Background ───────────────────────────────────────────────
    var bgStyle = ${jstr(opts.backgroundStyle)};
    if (bgStyle === "black") {
      comp.layers.addSolid([0,0,0], "MP_HUD_BG", cw, ch, 1, dur);
    } else if (bgStyle === "grid") {
      var gridBG = comp.layers.addSolid([0.02, 0.04, 0.08], "MP_HUD_BG", cw, ch, 1, dur);
      MPVFX.run(comp, "synthwaveGrid", { color: pCol, gridColor: pCol, duration: dur });
    } else if (bgStyle === "stars") {
      comp.layers.addSolid([0, 0, 0.02], "MP_HUD_BG", cw, ch, 1, dur);
      MPVFX.run(comp, "noiseTunnel", { color: pCol, speed: 0.4, duration: dur });
    } else {
      var darkBG = comp.layers.addSolid([0,0,0], "MP_HUD_BG", cw, ch, 1, dur);
      var bgRamp = darkBG.property("ADBE Effect Parade").addProperty("ADBE Ramp");
      if (bgRamp) {
        try { bgRamp.property("ADBE Ramp-0001").setValue([cw/2, 0]); bgRamp.property("ADBE Ramp-0003").setValue([cw/2, ch]); } catch(e){}
        try { bgRamp.property("ADBE Ramp-0002").setValue([0.02, 0.04, 0.1, 1]); bgRamp.property("ADBE Ramp-0004").setValue([0,0,0,1]); bgRamp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
      }
    }

    // ── 2. Full HUD overlay ─────────────────────────────────────────
    MPVFX.run(comp, "holographicHud", {
      color: pCol,
      scanSpeed: 1.2,
      showRadar: ${opts.showRadar},
      showBrackets: ${opts.showCornerBrackets},
      showDataReadout: true,
      duration: dur
    });

    // ── 3. Bar graph (animated data bars) ──────────────────────────
    ${opts.showBarGraph ? `
    var numBars = 8;
    var barW = Math.round(cw * 0.025);
    var maxBarH = Math.round(ch * 0.18);
    var barX = cw * 0.72;
    var barBaseY = ch * 0.55;
    for (var bi = 0; bi < numBars; bi++) {
      var barH = Math.round(maxBarH * (0.3 + Math.random() * 0.7));
      var bar = comp.layers.addShape();
      bar.name = "MP_HUD_Bar" + bi;
      var barRoot = bar.property("ADBE Root Vectors Group");
      var bG = barRoot.addProperty("ADBE Vector Group");
      var bV = bG.property("ADBE Vectors Group");
      var bRect = bV.addProperty("ADBE Vector Shape - Rect");
      try { bRect.property("ADBE Vector Rect Size").setValue([barW, barH]); bRect.property("ADBE Vector Rect Position").setValue([0, -barH/2]); } catch(e){}
      var bFill = bV.addProperty("ADBE Vector Graphic - Fill");
      try { bFill.property("ADBE Vector Fill Color").setValue([pCol[0], pCol[1], pCol[2], 1]); } catch(e){}
      var barPos = bar.property("ADBE Transform Group").property("ADBE Position");
      if (barPos) barPos.setValue([barX + bi * (barW + 4), barBaseY]);
      // Animate height: bar grows up on stagger.
      var barSc = bar.property("ADBE Transform Group").property("ADBE Scale");
      if (barSc) { barSc.setValueAtTime(bi * 0.06, [100, 0]); barSc.setValueAtTime(bi * 0.06 + 0.3, [100, 100]); MP.setEase(barSc, "expoOut"); }
      var barGlow = bar.property("ADBE Effect Parade").addProperty("ADBE Glow");
      if (barGlow) { try { barGlow.property("ADBE Glow-0003").setValue(15); barGlow.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
      bar.blendingMode = BlendingMode.ADD;
    }
    ` : ""}

    // ── 4. Circular gauge ──────────────────────────────────────────
    ${opts.showCircularGauge ? `
    var gauge = comp.layers.addShape();
    gauge.name = "MP_HUD_Gauge";
    var gaugePos = gauge.property("ADBE Transform Group").property("ADBE Position");
    if (gaugePos) gaugePos.setValue([cw * 0.82, ch * 0.25]);
    var gaugeRoot = gauge.property("ADBE Root Vectors Group");
    // Outer ring.
    var gOuter = gaugeRoot.addProperty("ADBE Vector Group");
    var gOV = gOuter.property("ADBE Vectors Group");
    var gOEll = gOV.addProperty("ADBE Vector Shape - Ellipse");
    try { gOEll.property("ADBE Vector Ellipse Size").setValue([120, 120]); } catch(e){}
    var gOStr = gOV.addProperty("ADBE Vector Graphic - Stroke");
    try { gOStr.property("ADBE Vector Stroke Color").setValue([pCol[0]*0.4, pCol[1]*0.4, pCol[2]*0.4, 1]); gOStr.property("ADBE Vector Stroke Width").setValue(2); } catch(e){}
    // Progress arc (trim path animated).
    var gInner = gaugeRoot.addProperty("ADBE Vector Group");
    var gIV = gInner.property("ADBE Vectors Group");
    var gIEll = gIV.addProperty("ADBE Vector Shape - Ellipse");
    try { gIEll.property("ADBE Vector Ellipse Size").setValue([100, 100]); } catch(e){}
    var gIStr = gIV.addProperty("ADBE Vector Graphic - Stroke");
    try { gIStr.property("ADBE Vector Stroke Color").setValue([pCol[0], pCol[1], pCol[2], 1]); gIStr.property("ADBE Vector Stroke Width").setValue(5); } catch(e){}
    var gTrim = gIV.addProperty("ADBE Vector Filter - Trim");
    if (gTrim) {
      try { var gTrimEnd = gTrim.property("ADBE Vector Trim End"); if (gTrimEnd) { gTrimEnd.setValueAtTime(0, 0); gTrimEnd.setValueAtTime(0.8, 73); } } catch(e){}
    }
    var gaugeGlow = gauge.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (gaugeGlow) { try { gaugeGlow.property("ADBE Glow-0003").setValue(20); gaugeGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
    gauge.blendingMode = BlendingMode.ADD;
    ` : ""}

    // ── 5. Animated waveform ────────────────────────────────────────
    ${opts.showWaveform ? `
    var waveform = comp.layers.addShape();
    waveform.name = "MP_HUD_Waveform";
    waveform.blendingMode = BlendingMode.ADD;
    var wPos = waveform.property("ADBE Transform Group").property("ADBE Position");
    if (wPos) wPos.setValue([cw/2, ch * 0.88]);
    var wRoot = waveform.property("ADBE Root Vectors Group");
    // Build a zig-zag waveform from a path shape.
    var wGroup = wRoot.addProperty("ADBE Vector Group");
    var wVecs = wGroup.property("ADBE Vectors Group");
    var wPath = wVecs.addProperty("ADBE Vector Shape - Group");
    try {
      var wShp = new Shape();
      var numPts = 40; var wVerts = [];
      for (var wi = 0; wi < numPts; wi++) {
        var wx = (wi / (numPts-1) - 0.5) * cw * 0.5;
        var wy = Math.sin(wi * 0.8) * 20;
        wVerts.push([wx, wy]);
      }
      wShp.vertices = wVerts; wShp.closed = false;
      wPath.property("ADBE Vector Shape").setValue(wShp);
    } catch(eW){}
    var wStroke = wVecs.addProperty("ADBE Vector Graphic - Stroke");
    try { wStroke.property("ADBE Vector Stroke Color").setValue([pCol[0], pCol[1], pCol[2], 1]); wStroke.property("ADBE Vector Stroke Width").setValue(2); } catch(e){}
    var wGlow = waveform.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (wGlow) { try { wGlow.property("ADBE Glow-0003").setValue(20); wGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
    // Turbulent displace to animate the waveform.
    var wTD = waveform.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace");
    if (wTD) {
      try { wTD.property("ADBE Turbulent Displace-0003").setValue(15); wTD.property("ADBE Turbulent Displace-0004").setValue(60); var wEvo = wTD.property("ADBE Turbulent Displace-0009"); if (wEvo) { wEvo.setValueAtTime(0, 0); wEvo.setValueAtTime(dur, 3); } } catch(e){}
    }
    ` : ""}

    // ── 6. Scanline + atmospheric finish ───────────────────────────
    ${opts.showScanlines ? `
    MPVFX.run(comp, "vhsRetro", { tracking: 0, noise: 0.3, colorBleed: 0, showTimestamp: false, duration: dur });
    ` : ""}
    MPVFX.run(comp, "cinematicGrade", {});

    MP.log("HUD scene built: " + sceneType);
    __mpAssetStoreFinish(comp, "cinematic", "HUD_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// Tool 21: build_generative_art_loop
// ============================================================
export function generateGenerativeArtLoopJsx(opts: {
  outputAepPath: string;
  style: string;
  palette?: string[];
  complexity: number;
  speed: number;
  loopable: boolean;
  resolution: string;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const dims = opts.resolution === "4k" ? [3840, 2160] : opts.resolution === "square-1k" ? [1080, 1080] : [1920, 1080];
  const colors = opts.palette ?? ["#6600FF", "#00FFCC", "#FF0066", "#FFAA00", "#00AAFF"];

  const body = `
    app.newProject();
    MP.log("Building Generative Art Loop: ${opts.style}");

    var comp = app.project.items.addComp(${jstr(opts.compName)},
      ${dims[0]}, ${dims[1]}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${dims[0]}; var ch = ${dims[1]};
    var dur = ${opts.duration};
    var complexity = ${opts.complexity};
    var speed = ${opts.speed};
    var loopable = ${opts.loopable};
    var style = ${jstr(opts.style)};
    var palette = ${jlit(colors)};

    // Parse a hex color to [r,g,b].
    function hexToRGB(hex) {
      if (hex.charAt(0)==="#") hex = hex.substr(1);
      return [parseInt(hex.substr(0,2),16)/255, parseInt(hex.substr(2,2),16)/255, parseInt(hex.substr(4,2),16)/255];
    }

    // Dark background.
    comp.layers.addSolid([0.02, 0.02, 0.04], "GenArt_BG", cw, ch, 1, dur);

    if (style === "flowField") {
      // Flow field: many overlapping fractal noise layers with polar distortion.
      var numLayers = 3 + complexity;
      for (var fi = 0; fi < numLayers; fi++) {
        var fl = comp.layers.addSolid([0,0,0], "Flow_" + fi, cw, ch, 1, dur);
        var ffn = fl.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
        if (ffn) {
          try { ffn.property("ADBE Fractal Noise-0001").setValue(fi % 5 + 1); ffn.property("ADBE Fractal Noise-0006").setValue([60 + fi*20, 60+fi*20]); ffn.property("ADBE Fractal Noise-0003").setValue(0.4 + fi * 0.05); } catch(e){}
          var fEvo = ffn.property("ADBE Fractal Noise-0012");
          if (fEvo) { fEvo.setValueAtTime(0, fi * 0.3); fEvo.setValueAtTime(loopable ? dur : dur + 0.001, fi * 0.3 + dur * speed * 0.4); }
        }
        var fPolar = fl.property("ADBE Effect Parade").addProperty("ADBE Polar Coordinates");
        if (fPolar) { try { fPolar.property("ADBE Polar Coordinates-0001").setValue(fi % 2 === 0 ? 100 : 0); fPolar.property("ADBE Polar Coordinates-0002").setValue(fi%2===0?1:2); } catch(e){} }
        var col = hexToRGB(palette[fi % palette.length]);
        var fHs = fl.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
        if (fHs) { try { fHs.property("ADBE HUE SATURATION-0001").setValue(1); fHs.property("ADBE HUE SATURATION-0002").setValue(Math.round(fi*40)); fHs.property("ADBE HUE SATURATION-0003").setValue(70); } catch(e){} }
        fl.blendingMode = fi === 0 ? BlendingMode.NORMAL : BlendingMode.ADD;
        var fOp = fl.property("ADBE Transform Group").property("ADBE Opacity"); if (fOp) fOp.setValue(60 - fi * 4);
        var fSc = fl.property("ADBE Transform Group").property("ADBE Scale");
        if (fSc && loopable) { fSc.setValueAtTime(0, [100,100]); fSc.setValueAtTime(dur, [100,100]); }
      }

    } else if (style === "lavalamp") {
      // Lava lamp: displacement-driven blobs.
      var numBlobs = 3 + complexity;
      for (var li = 0; li < numBlobs; li++) {
        var blob = comp.layers.addShape();
        blob.name = "Blob_" + li;
        blob.blendingMode = BlendingMode.ADD;
        var bRoot = blob.property("ADBE Root Vectors Group");
        var bG2 = bRoot.addProperty("ADBE Vector Group");
        var bV2 = bG2.property("ADBE Vectors Group");
        var bEll = bV2.addProperty("ADBE Vector Shape - Ellipse");
        var bSize = 150 + li * 60;
        try { bEll.property("ADBE Vector Ellipse Size").setValue([bSize, bSize * 1.2]); } catch(e){}
        var bFill = bV2.addProperty("ADBE Vector Graphic - Fill");
        var bCol = hexToRGB(palette[li % palette.length]);
        try { bFill.property("ADBE Vector Fill Color").setValue([bCol[0], bCol[1], bCol[2], 0.6]); } catch(e){}
        var bPos = blob.property("ADBE Transform Group").property("ADBE Position");
        if (bPos) {
          var startX = cw * (0.2 + li * 0.2); var startY = ch * (0.3 + li * 0.15);
          bPos.setValueAtTime(0, [startX, startY]);
          bPos.setValueAtTime(dur * 0.33, [cw - startX + 50, ch - startY + 80]);
          bPos.setValueAtTime(dur * 0.66, [startX + 120, startY - 60]);
          bPos.setValueAtTime(loopable ? dur : dur + 0.001, [startX, startY]);
          MP.setEase(bPos, "sineInOut");
        }
        var bBlur = blob.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        if (bBlur) { try { bBlur.property("ADBE Gaussian Blur 2-0001").setValue(60 + li * 20); } catch(e){} }
        var bGlow = blob.property("ADBE Effect Parade").addProperty("ADBE Glow");
        if (bGlow) { try { bGlow.property("ADBE Glow-0003").setValue(80); bGlow.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
      }
      // Turbulent displace for organic blobby-ness.
      var blobAdj = comp.layers.addSolid([1,1,1], "Blob_Warp", cw, ch, 1, dur);
      try { blobAdj.adjustmentLayer = true; } catch(e){}
      var bTD = blobAdj.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace");
      if (bTD) { try { bTD.property("ADBE Turbulent Displace-0003").setValue(80); bTD.property("ADBE Turbulent Displace-0004").setValue(200); var bEvo = bTD.property("ADBE Turbulent Displace-0009"); if (bEvo) { bEvo.setValueAtTime(0, 0); bEvo.setValueAtTime(loopable ? dur : dur+0.001, speed * 2); } } catch(e){} }

    } else if (style === "spirograph") {
      // Spirograph: multiple rotating ellipses with trim-path.
      var numRings = 3 + complexity;
      for (var si = 0; si < numRings; si++) {
        var ring2 = comp.layers.addShape();
        ring2.name = "Spiro_" + si;
        ring2.blendingMode = BlendingMode.ADD;
        var rPos2 = ring2.property("ADBE Transform Group").property("ADBE Position"); if (rPos2) rPos2.setValue([cw/2, ch/2]);
        var rRoot2 = ring2.property("ADBE Root Vectors Group");
        var rG = rRoot2.addProperty("ADBE Vector Group");
        var rV = rG.property("ADBE Vectors Group");
        var rEll2 = rV.addProperty("ADBE Vector Shape - Ellipse");
        var rSize = 80 + si * (cw * 0.04);
        try { rEll2.property("ADBE Vector Ellipse Size").setValue([rSize, rSize * (0.6 + si * 0.1)]); } catch(e){}
        var rStr2 = rV.addProperty("ADBE Vector Graphic - Stroke");
        var rCol = hexToRGB(palette[si % palette.length]);
        try { rStr2.property("ADBE Vector Stroke Color").setValue([rCol[0], rCol[1], rCol[2], 1]); rStr2.property("ADBE Vector Stroke Width").setValue(2); } catch(e){}
        var rRot = ring2.property("ADBE Transform Group").property("ADBE Rotate Z");
        if (rRot) { rRot.setValueAtTime(0, 0); rRot.setValueAtTime(loopable ? dur : dur+0.001, 360 * speed * (si % 2 === 0 ? 1 : -1.3)); }
        var rGlow2 = ring2.property("ADBE Effect Parade").addProperty("ADBE Glow"); if (rGlow2) { try { rGlow2.property("ADBE Glow-0003").setValue(30); rGlow2.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
      }

    } else {
      // Default: turbulent ink (fractal noise + polar + grade).
      MPVFX.run(comp, "noiseTunnel", { color: hexToRGB(palette[0]), speed: speed, complexity: complexity, duration: dur });
    }

    // ── Master grade ────────────────────────────────────────────────
    MPVFX.run(comp, "cinematicGrade", {});
    var grainAdj = comp.layers.addSolid([1,1,1], "GenArt_Grain", cw, ch, 1, dur);
    try { grainAdj.adjustmentLayer = true; } catch(e){}
    var noise2 = grainAdj.property("ADBE Effect Parade").addProperty("ADBE Noise"); if (noise2) { try { noise2.property("ADBE Noise-0001").setValue(4); } catch(e){} }
    grainAdj.blendingMode = BlendingMode.OVERLAY;
    var grOp = grainAdj.property("ADBE Transform Group").property("ADBE Opacity"); if (grOp) grOp.setValue(30);

    MP.log("Generative art loop built: " + style + ", complexity " + complexity);
    __mpAssetStoreFinish(comp, "cinematic", "GEN_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// Tool 22: create_retro_synthwave_scene
// ============================================================
export function generateRetroSynthwaveSceneJsx(opts: {
  outputAepPath: string;
  sceneElements: string[];
  primaryColor: number[];
  secondaryColor: number[];
  gridColor: number[];
  titleText?: string;
  subtitleText?: string;
  gridSpeed: number;
  sunStripes: number;
  addVHSEffect: boolean;
  addGlitch: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    MP.log("Building Retro Synthwave Scene");

    var comp = app.project.items.addComp(${jstr(opts.compName)},
      ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};
    var pCol = ${jlit(opts.primaryColor)};
    var sCol = ${jlit(opts.secondaryColor)};
    var gCol = ${jlit(opts.gridColor)};
    var elements = ${jlit(opts.sceneElements)};
    var numStripes = ${opts.sunStripes};
    var gridSpeed = ${opts.gridSpeed};

    function hasEl(name) { for (var i=0;i<elements.length;i++) { if(elements[i]===name) return true; } return false; }

    // ── 1. Sky background ──────────────────────────────────────────
    var sky = comp.layers.addSolid([0,0,0], "MP_SW_Sky", cw, ch, 1, dur);
    var skyRamp = sky.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    if (skyRamp) {
      try { skyRamp.property("ADBE Ramp-0001").setValue([cw/2, 0]); skyRamp.property("ADBE Ramp-0003").setValue([cw/2, ch*0.55]); } catch(e){}
      try { skyRamp.property("ADBE Ramp-0002").setValue([0.04, 0, 0.1, 1]); skyRamp.property("ADBE Ramp-0004").setValue([sCol[0]*0.6, sCol[1]*0.1, sCol[2]*0.4, 1]); skyRamp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }

    // ── 2. Stars ────────────────────────────────────────────────────
    if (hasEl("stars")) {
      var stars = comp.layers.addSolid([0,0,0], "MP_SW_Stars", cw, ch, 1, dur);
      var starFn = stars.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
      if (starFn) { try { starFn.property("ADBE Fractal Noise-0001").setValue(1); starFn.property("ADBE Fractal Noise-0003").setValue(1.9); starFn.property("ADBE Fractal Noise-0006").setValue([6,6]); } catch(e){} }
      var starThresh = stars.property("ADBE Effect Parade").addProperty("ADBE Threshold2");
      if (starThresh) { try { starThresh.property("ADBE Threshold2-0001").setValue(235); } catch(e){} }
      // Mask to sky area only.
      var starMask = stars.Masks.addProperty("Mask");
      try { var sMShape = new Shape(); sMShape.vertices = [[0,0],[cw,0],[cw,ch*0.55],[0,ch*0.55]]; sMShape.closed=true; starMask.property("ADBE Mask Shape").setValue(sMShape); } catch(e){}
      stars.blendingMode = BlendingMode.ADD;
      var stOp = stars.property("ADBE Transform Group").property("ADBE Opacity"); if (stOp) stOp.setValue(80);
    }

    // ── 3. Retro sun (horizontal stripe sun) ───────────────────────
    if (hasEl("sun")) {
      var sunGroup = comp.layers.addShape();
      sunGroup.name = "MP_SW_Sun";
      var sunPos = sunGroup.property("ADBE Transform Group").property("ADBE Position");
      if (sunPos) sunPos.setValue([cw/2, ch * 0.55]);
      var sunRoot = sunGroup.property("ADBE Root Vectors Group");
      var sunRadius = Math.round(Math.min(cw, ch) * 0.16);
      // Base circle.
      var sunCircle = sunRoot.addProperty("ADBE Vector Group");
      var sunCV = sunCircle.property("ADBE Vectors Group");
      var sunEll = sunCV.addProperty("ADBE Vector Shape - Ellipse");
      try { sunEll.property("ADBE Vector Ellipse Size").setValue([sunRadius*2, sunRadius*2]); } catch(e){}
      var sunFill = sunCV.addProperty("ADBE Vector Graphic - Fill");
      try { sunFill.property("ADBE Vector Fill Color").setValue([pCol[0], pCol[1]*0.8, pCol[2], 1]); } catch(e){}
      // Horizontal stripe mask bars (bottom half).
      for (var si = 0; si < numStripes; si++) {
        var stripeY = sunRadius * 0.1 + si * (sunRadius * 0.9 / numStripes);
        var stripeH = Math.max(2, sunRadius * 0.9 / numStripes * 0.4);
        var stripe = sunRoot.addProperty("ADBE Vector Group");
        var sV = stripe.property("ADBE Vectors Group");
        var sRect = sV.addProperty("ADBE Vector Shape - Rect");
        try { sRect.property("ADBE Vector Rect Size").setValue([sunRadius*2, stripeH]); sRect.property("ADBE Vector Rect Position").setValue([0, stripeY + stripeH/2]); } catch(e){}
        var sFill = sV.addProperty("ADBE Vector Graphic - Fill");
        try { sFill.property("ADBE Vector Fill Color").setValue([0.04, 0.0, 0.1, 1]); } catch(e){}  // dark stripe
      }
      var sunGlow = sunGroup.property("ADBE Effect Parade").addProperty("ADBE Glow");
      if (sunGlow) { try { sunGlow.property("ADBE Glow-0003").setValue(80); sunGlow.property("ADBE Glow-0004").setValue(2.0); } catch(e){} }
    }

    // ── 4. Mountains silhouette ─────────────────────────────────────
    if (hasEl("mountains")) {
      var mtn = comp.layers.addShape();
      mtn.name = "MP_SW_Mountains";
      var mRoot = mtn.property("ADBE Root Vectors Group");
      var mGrp = mRoot.addProperty("ADBE Vector Group");
      var mVecs = mGrp.property("ADBE Vectors Group");
      var mPath = mVecs.addProperty("ADBE Vector Shape - Group");
      try {
        var mShp = new Shape();
        // Mountain silhouette vertices.
        mShp.vertices = [
          [0, ch*0.75], [cw*0.05, ch*0.52], [cw*0.15, ch*0.65], [cw*0.22, ch*0.45],
          [cw*0.32, ch*0.62], [cw*0.4, ch*0.48], [cw*0.5, ch*0.38],
          [cw*0.6, ch*0.52], [cw*0.68, ch*0.44], [cw*0.78, ch*0.58],
          [cw*0.87, ch*0.47], [cw*0.95, ch*0.6], [cw, ch*0.75],
          [cw, ch], [0, ch]
        ];
        mShp.closed = true;
        mPath.property("ADBE Vector Shape").setValue(mShp);
      } catch(eMtn){}
      var mFill = mVecs.addProperty("ADBE Vector Graphic - Fill");
      try { mFill.property("ADBE Vector Fill Color").setValue([0.06, 0.01, 0.12, 1]); } catch(e){}
    }

    // ── 5. Perspective floor grid ───────────────────────────────────
    if (hasEl("grid")) {
      MPVFX.run(comp, "synthwaveGrid", { color: pCol, gridColor: gCol, duration: dur });
    }

    // ── 6. Horizon glow line ────────────────────────────────────────
    var horizGlow = comp.layers.addSolid([0,0,0], "MP_SW_Horizon", cw, ch, 1, dur);
    var hzR = horizGlow.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    if (hzR) {
      try { hzR.property("ADBE Ramp-0001").setValue([cw/2, ch*0.53]); hzR.property("ADBE Ramp-0003").setValue([cw/2, ch*0.65]); } catch(e){}
      try { hzR.property("ADBE Ramp-0002").setValue([pCol[0], pCol[1]*0.6, pCol[2], 1]); hzR.property("ADBE Ramp-0004").setValue([0,0,0,0]); hzR.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }
    var hzGlow = horizGlow.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (hzGlow) { try { hzGlow.property("ADBE Glow-0003").setValue(120); hzGlow.property("ADBE Glow-0004").setValue(3.0); } catch(e){} }
    horizGlow.blendingMode = BlendingMode.ADD;

    // ── 7. Neon title text ──────────────────────────────────────────
    ${opts.titleText ? `
    if (hasEl("neonText")) {
      var titleLayer = comp.layers.addText(${jstr(opts.titleText)});
      titleLayer.name = "MP_SW_Title";
      try {
        var tProp = titleLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var tVal = tProp.value;
        tVal.fontSize = Math.round(cw * 0.09);
        tVal.fillColor = [pCol[0], pCol[1], pCol[2]];
        tVal.font = "Arial Black";
        tVal.justification = ParagraphJustification.CENTER_JUSTIFY;
        tProp.setValue(tVal);
      } catch(e){}
      var tPos = titleLayer.property("ADBE Transform Group").property("ADBE Position"); if (tPos) tPos.setValue([cw/2, ch*0.3]);
      var tSc = titleLayer.property("ADBE Transform Group").property("ADBE Scale"); if (tSc) { tSc.setValueAtTime(0, [0,0]); tSc.setValueAtTime(0.5, [105,105]); tSc.setValueAtTime(0.7, [100,100]); MP.setEase(tSc,"expoOut"); }
      MPVFX.run(comp, "neonGlow", { targetLayer: "MP_SW_Title", color: pCol });
      MPVFX.run(comp, "trapcodeStarglow", { streakLength: 15, boost: 1.8, color: pCol });
    }
    ` : ""}

    ${opts.subtitleText ? `
    var subLayer = comp.layers.addText(${jstr(opts.subtitleText)});
    subLayer.name = "MP_SW_Subtitle";
    try {
      var sProp = subLayer.property("ADBE Text Properties").property("ADBE Text Document");
      var sVal = sProp.value;
      sVal.fontSize = Math.round(cw * 0.035);
      sVal.fillColor = [sCol[0]+0.3, sCol[1]+0.1, sCol[2]+0.3];
      sVal.font = "Arial";
      sVal.justification = ParagraphJustification.CENTER_JUSTIFY;
      sProp.setValue(sVal);
    } catch(e){}
    var sPos = subLayer.property("ADBE Transform Group").property("ADBE Position"); if (sPos) sPos.setValue([cw/2, ch*0.38]);
    var sOp = subLayer.property("ADBE Transform Group").property("ADBE Opacity"); if (sOp) { sOp.setValueAtTime(0.5, 0); sOp.setValueAtTime(1.0, 100); }
    ` : ""}

    // ── 8. VHS effect ───────────────────────────────────────────────
    ${opts.addVHSEffect ? `
    if (hasEl("vhsChrome") || hasEl("scanlines")) {
      MPVFX.run(comp, "vhsRetro", { tracking: 0.8, noise: 0.5, colorBleed: 1.0, showTimestamp: true, duration: dur });
    }
    ` : `
    if (hasEl("scanlines")) {
      var scAdj = comp.layers.addSolid([1,1,1], "Scanlines", cw, ch, 1, dur);
      try { scAdj.adjustmentLayer = true; } catch(e){}
      var scGrid = scAdj.property("ADBE Effect Parade").addProperty("ADBE GRID");
      if (scGrid) { try { scGrid.property("ADBE GRID-0003").setValue(4); scGrid.property("ADBE GRID-0004").setValue(ch); } catch(e){} }
      scAdj.blendingMode = BlendingMode.MULTIPLY;
      var scOp2 = scAdj.property("ADBE Transform Group").property("ADBE Opacity"); if (scOp2) scOp2.setValue(30);
    }
    `}

    // ── 9. Occasional glitch ────────────────────────────────────────
    ${opts.addGlitch ? `
    MPVFX.run(comp, "glitch", { start: 1.5, duration: 0.4 });
    MPVFX.run(comp, "glitch", { start: 4.0, duration: 0.35 });
    ` : ""}

    // ── 10. Grain + grade ───────────────────────────────────────────
    MPVFX.run(comp, "filmGrain", { strength: 8 });
    MPVFX.run(comp, "cinematicGrade", {});

    MP.log("Retro synthwave scene built");
    __mpAssetStoreFinish(comp, "cinematic", "SUN_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

function hexPalette(palette: string[] | undefined, fallback: string[]): string[] {
  return palette && palette.length > 0 ? palette : fallback;
}

export function generateAuroraBorealisJsx(opts: {
  outputAepPath: string;
  palette?: string[];
  waveIntensity: number;
  noiseScale: number;
  bandCount: number;
  addStars: boolean;
  addReflection: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const colors = hexPalette(opts.palette, ["#2AFADF", "#4C83FF", "#8F5CFF", "#B6FF6A", "#FF6AD5"]);
  const body = `
    app.newProject();
    MP.log("Building procedural aurora borealis");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var dur = comp.duration;
    var palette = ${jlit(colors)};
    function hexToRGB(hex) { if (hex.charAt(0)==="#") hex = hex.substr(1); return [parseInt(hex.substr(0,2),16)/255, parseInt(hex.substr(2,2),16)/255, parseInt(hex.substr(4,2),16)/255]; }
    var sky = comp.layers.addSolid([0.01,0.015,0.07], "Polar_Night_Sky", cw, ch, 1, dur);
    var skyRamp = sky.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    if (skyRamp) { try { skyRamp.property("ADBE Ramp-0001").setValue([cw/2,0]); skyRamp.property("ADBE Ramp-0002").setValue([0.01,0.02,0.08]); skyRamp.property("ADBE Ramp-0003").setValue([cw/2,ch]); skyRamp.property("ADBE Ramp-0004").setValue([0,0,0.015]); } catch(e){} }
    ${opts.addStars ? `
    var stars = comp.layers.addSolid([0,0,0], "Procedural_Stars", cw, ch, 1, dur);
    var starFn = stars.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (starFn) { try { starFn.property("ADBE Fractal Noise-0003").setValue(2.2); starFn.property("ADBE Fractal Noise-0006").setValue([7,7]); } catch(e){} }
    var starTh = stars.property("ADBE Effect Parade").addProperty("ADBE Threshold2"); if (starTh) { try { starTh.property("ADBE Threshold2-0001").setValue(238); } catch(e){} }
    stars.blendingMode = BlendingMode.ADD;
    ` : ""}
    for (var i = 0; i < ${opts.bandCount}; i++) {
      var band = comp.layers.addSolid([0,0,0], "Aurora_Band_" + (i+1), cw, ch, 1, dur);
      band.blendingMode = BlendingMode.ADD;
      var fn = band.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
      if (fn) { try { fn.property("ADBE Fractal Noise-0001").setValue(4); fn.property("ADBE Fractal Noise-0003").setValue(1.3); fn.property("ADBE Fractal Noise-0006").setValue([${opts.noiseScale} + i*22, ${opts.noiseScale} * 0.45]); var evo = fn.property("ADBE Fractal Noise-0012"); if (evo) { evo.setValueAtTime(0, i*30); evo.setValueAtTime(dur, i*30 + dur*55); } } catch(e){} }
      var wave = band.property("ADBE Effect Parade").addProperty("ADBE Wave Warp");
      if (wave) { try { wave.property("ADBE Wave Warp-0002").setValue(${opts.waveIntensity} + i*8); wave.property("ADBE Wave Warp-0003").setValue(280 + i*45); wave.property("ADBE Wave Warp-0004").setValue(0.35 + i*0.08); wave.property("ADBE Wave Warp-0005").setValue(i*18); } catch(e){} }
      var polar = band.property("ADBE Effect Parade").addProperty("ADBE Polar Coordinates");
      if (polar) { try { polar.property("ADBE Polar Coordinates-0001").setValue(18 + i*5/${opts.bandCount}); polar.property("ADBE Polar Coordinates-0002").setValue(2); } catch(e){} }
      var tint = band.property("ADBE Effect Parade").addProperty("ADBE Tint");
      if (tint) { try { tint.property("ADBE Tint-0003").setValue(hexToRGB(palette[i % palette.length])); tint.property("ADBE Tint-0004").setValue(82); } catch(e){} }
      var mask = band.Masks.addProperty("Mask");
      try { var shp = new Shape(); var y = ch*(0.18 + i*0.06); shp.vertices = [[0,y],[cw,y-ch*0.08],[cw,y+ch*0.22],[0,y+ch*0.18]]; shp.closed = true; mask.property("ADBE Mask Shape").setValue(shp); mask.property("ADBE Mask Feather").setValue([120,90]); } catch(e) {}
      var op = band.property("ADBE Transform Group").property("ADBE Opacity"); if (op) { op.setValueAtTime(0, 28 + i*6); op.setValueAtTime(dur/2, 68 + i*4); op.setValueAtTime(dur, 28 + i*6); }
    }
    ${opts.addReflection ? `
    var refl = comp.layers.addSolid([0,0,0], "Ice_Lake_Reflection", cw, ch, 1, dur);
    var rr = refl.property("ADBE Effect Parade").addProperty("ADBE Ramp"); if (rr) { try { rr.property("ADBE Ramp-0001").setValue([cw/2,ch*0.62]); rr.property("ADBE Ramp-0002").setValue([0.05,0.25,0.22]); rr.property("ADBE Ramp-0003").setValue([cw/2,ch]); rr.property("ADBE Ramp-0004").setValue([0,0,0.02]); } catch(e){} }
    var rw = refl.property("ADBE Effect Parade").addProperty("ADBE Wave Warp"); if (rw) { try { rw.property("ADBE Wave Warp-0002").setValue(18); rw.property("ADBE Wave Warp-0003").setValue(180); rw.property("ADBE Wave Warp-0004").setValue(0.15); } catch(e){} }
    refl.blendingMode = BlendingMode.ADD; var ro = refl.property("ADBE Transform Group").property("ADBE Opacity"); if (ro) ro.setValue(28);
    ` : ""}
    MPVFX.run(comp, "filmGrain", { strength: 4 });
    MP.log("Aurora borealis built: wave warp + fractal noise + polar coordinates + color bands.");
    __mpAssetStoreFinish(comp, "cinematic", "Aurora_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

export function generateFireTornadoJsx(opts: {
  outputAepPath: string;
  intensity: number;
  flameColor: number[];
  coreColor: number[];
  particleDrift: number;
  addSmoke: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    MP.log("Building procedural fire tornado");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var dur = comp.duration; var intensity = ${opts.intensity};
    var bg = comp.layers.addSolid([0.02,0.01,0.005], "Soot_Background", cw, ch, 1, dur);
    MPVFX.run(comp, "fire", { position: [cw/2, ch*0.62], duration: dur, strength: intensity * 1.4, color: ${jlit(opts.flameColor)} });
    for (var i=0; i<5; i++) {
      var flame = comp.layers.addSolid([0,0,0], "Spiral_Flame_Sheet_" + (i+1), cw, ch, 1, dur);
      flame.blendingMode = BlendingMode.ADD;
      var fn = flame.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
      if (fn) { try { fn.property("ADBE Fractal Noise-0003").setValue(1.35+i*0.08); fn.property("ADBE Fractal Noise-0006").setValue([80+i*22, 180+i*45]); var evo = fn.property("ADBE Fractal Noise-0012"); if(evo){evo.setValueAtTime(0, i*30); evo.setValueAtTime(dur, 260+i*80);} } catch(e){} }
      var twirl = flame.property("ADBE Effect Parade").addProperty("ADBE Twirl");
      if (twirl) { try { twirl.property("ADBE Twirl-0001").setValue([cw/2, ch*0.55]); twirl.property("ADBE Twirl-0002").setValue((i%2===0?1:-1) * (220 + intensity*120)); twirl.property("ADBE Twirl-0003").setValue(260 + i*35); } catch(e){} }
      var td = flame.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace");
      if (td) { try { td.property("ADBE Turbulent Displace-0003").setValue(55 + intensity*35); td.property("ADBE Turbulent Displace-0004").setValue(140); var te = td.property("ADBE Turbulent Displace-0009"); if(te){te.setValueAtTime(0,0);te.setValueAtTime(dur,5);} } catch(e){} }
      var tint = flame.property("ADBE Effect Parade").addProperty("ADBE Tint"); if (tint) { try { tint.property("ADBE Tint-0003").setValue(i===0 ? ${jlit(opts.coreColor)} : ${jlit(opts.flameColor)}); tint.property("ADBE Tint-0004").setValue(90); } catch(e){} }
      var mask = flame.Masks.addProperty("Mask");
      try { var shp = new Shape(); shp.vertices = [[cw*0.46,ch*0.95],[cw*0.54,ch*0.95],[cw*0.61,ch*0.20],[cw*0.39,ch*0.20]]; shp.closed=true; mask.property("ADBE Mask Shape").setValue(shp); mask.property("ADBE Mask Feather").setValue([85,90]); } catch(e){}
      var op = flame.property("ADBE Transform Group").property("ADBE Opacity"); if (op) op.setValue(55 - i*6);
    }
    var sparks = comp.layers.addSolid([0,0,0], "Particle_Drift_Embers", cw, ch, 1, dur);
    var p = sparks.property("ADBE Effect Parade").addProperty("CC Particle World");
    if (p) { try { p.property("Birth Rate").setValue(5 * intensity); p.property("Longevity (sec)").setValue(2); var prod=p.property("Producer"); prod.property("Position Y").setValue(0.35); prod.property("Radius X").setValue(0.08); prod.property("Radius Y").setValue(0.12); } catch(e){} }
    sparks.blendingMode = BlendingMode.ADD;
    ${opts.addSmoke ? `MPVFX.run(comp, "smoke", { position: [cw/2, ch*0.42], strength: intensity, duration: dur });` : ""}
    MPVFX.run(comp, "cinematicGrade", {});
    MP.log("Fire tornado built: fire + spiral distort + turbulent displace + particle drift.");
    __mpAssetStoreFinish(comp, "game", "Fire_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

export function generateOceanWavesJsx(opts: {
  outputAepPath: string;
  waterColor: number[];
  foamColor: number[];
  waveHeight: number;
  sprayAmount: number;
  addDepthShadow: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    MP.log("Building procedural ocean waves");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var dur = comp.duration;
    var sky = comp.layers.addSolid([0.25,0.52,0.72], "Sky_Horizon", cw, ch, 1, dur);
    var water = comp.layers.addSolid(${jlit(opts.waterColor)}, "Ocean_Depth_Base", cw, ch, 1, dur);
    var wr = water.property("ADBE Effect Parade").addProperty("ADBE Ramp"); if (wr) { try { wr.property("ADBE Ramp-0001").setValue([cw/2,ch*0.42]); wr.property("ADBE Ramp-0002").setValue([${opts.waterColor[0] + 0.08},${opts.waterColor[1] + 0.12},${opts.waterColor[2] + 0.15}]); wr.property("ADBE Ramp-0003").setValue([cw/2,ch]); wr.property("ADBE Ramp-0004").setValue(${jlit(opts.waterColor)}); } catch(e){} }
    try { var m = water.Masks.addProperty("Mask"); var shp = new Shape(); shp.vertices = [[0,ch*0.38],[cw,ch*0.36],[cw,ch],[0,ch]]; shp.closed=true; m.property("ADBE Mask Shape").setValue(shp); } catch(e){}
    for (var i=0; i<4; i++) {
      var wave = comp.layers.addSolid(${jlit(opts.foamColor)}, "Wave_Warp_Layer_" + (i+1), cw, ch, 1, dur);
      var mask = wave.Masks.addProperty("Mask");
      try { var y = ch*(0.44+i*0.12); var s = new Shape(); s.vertices = [[0,y],[cw,y-30],[cw,y+30],[0,y+45]]; s.closed=true;; mask.property("ADBE Mask Shape").setValue(s); mask.property("ADBE Mask Feather").setValue([40,18]);; } catch(e){}
      var ww = wave.property("ADBE Effect Parade").addProperty("ADBE Wave Warp"); if (ww) { try { ww.property("ADBE Wave Warp-0002").setValue(${opts.waveHeight}*(1-i*0.12)); ww.property("ADBE Wave Warp-0003").setValue(260+i*100); ww.property("ADBE Wave Warp-0004").setValue(0.25+i*0.08); ww.property("ADBE Wave Warp-0005").setValue(i*22); } catch(e){} }
      var td = wave.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace"); if (td) { try { td.property("ADBE Turbulent Displace-0003").setValue(18+i*8); td.property("ADBE Turbulent Displace-0004").setValue(90); } catch(e){} }
      wave.blendingMode = BlendingMode.SCREEN; var op = wave.property("ADBE Transform Group").property("ADBE Opacity"); if (op) op.setValue(70-i*7);
    }
    ${opts.addDepthShadow ? `
    var shadow = comp.layers.addSolid([0,0,0], "Depth_Shadow_Under_Waves", cw, ch, 1, dur);
    try { var sm = shadow.Masks.addProperty("Mask"); var ss = new Shape(); ss.vertices=[[0,ch*0.50],[cw,ch*0.48],[cw,ch],[0,ch]]; ss.closed=true; sm.property("ADBE Mask Shape").setValue(ss); sm.property("ADBE Mask Feather").setValue([80,80]); } catch(e){}
    var so = shadow.property("ADBE Transform Group").property("ADBE Opacity"); if (so) so.setValue(35);
    ` : ""}
    if (${opts.sprayAmount} > 0) {
      var spray = comp.layers.addSolid([0,0,0], "Spray_Particles", cw, ch, 1, dur);
      var p = spray.property("ADBE Effect Parade").addProperty("CC Particle World");
      if (p) { try { p.property("Birth Rate").setValue(2 * ${opts.sprayAmount}); p.property("Longevity (sec)").setValue(0.8); var prod = p.property("Producer"); prod.property("Position Y").setValue(0.2); prod.property("Radius X").setValue(0.5); prod.property("Radius Y").setValue(0.03); } catch(e){} }
      spray.blendingMode = BlendingMode.SCREEN;
    }
    MPVFX.run(comp, "filmGrain", { strength: 3 });
    MP.log("Ocean waves built: layered wave warp, depth shadow, spray particles and foam.");
    __mpAssetStoreFinish(comp, "cinematic", "Ocean_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}
