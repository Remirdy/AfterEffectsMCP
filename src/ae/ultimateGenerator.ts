/**
 * MotionPilot Ultimate VFX JSX generators (Wave 4 - Crazy Ideas).
 *
 * Generates ExtendScript for the 5 ultimate visual tools:
 *   - build_matrix_digital_rain
 *   - build_black_hole_gravity_warp
 *   - build_liquid_lava_simulator
 *   - build_lightning_storm_generator
 *   - build_magical_summoning_sigil
 *
 * All helpers from JSX_HELPERS + VFX_HELPERS are prepended by the caller via withReport().
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

// 1. build_matrix_digital_rain
export function generateMatrixRainJsx(opts: {
  outputAepPath: string;
  color: number[];
  speed: number;
  fontSize: number;
  columnCount: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building 3D Procedural Matrix Digital Rain");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};
    
    // Background Solid (Deep green/black shade)
    var bg = comp.layers.addSolid([0, 0.015, 0.005], "Matrix_BG", cw, ch, 1, dur);

    var count = ${opts.columnCount};
    var colColor = ${jlit(opts.color)};
    var fontSize = ${opts.fontSize};
    var baseSpeed = ${opts.speed};

    for (var i = 0; i < count; i++) {
      // Create vertical column of characters
      var rawString = "100110101011001";
      if (typeof Math !== "undefined") {
        var len = 15 + Math.floor(Math.random() * 15);
        var sArr = [];
        for (var j = 0; j < len; j++) {
          sArr.push(Math.random() > 0.5 ? "1" : "0");
        }
        rawString = sArr.join("\\r"); // carriage return for vertical flow
      }

      var textLayer = comp.layers.addText(rawString);
      textLayer.name = "Code_Col_" + i;
      textLayer.startTime = 0;
      textLayer.outPoint = dur;

      // Formatting text
      try {
        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var td = textProp.value;
        td.fontSize = fontSize + Math.floor(Math.random() * 8 - 4);
        td.font = "Courier New";
        td.fillColor = colColor;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        textProp.setValue(td);
      } catch(e) {}

      // Matrix scrolling position and falling character expression
      var pos = textLayer.property("ADBE Transform Group").property("ADBE Position");
      if (pos) {
        pos.expression = 
          "seedRandom(" + i + ", true);\\n" +
          "var x = random(40, thisComp.width - 40);\\n" +
          "var speed = random(120, 380) * " + baseSpeed + ";\\n" +
          "var delay = random(0, " + dur + ");\\n" +
          "var y = ((time - delay) * speed) % (thisComp.height + 600) - 200;\\n" +
          "[x, y];";
      }

      // Add source text expression to scramble character stream over time
      var sourceText = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
      if (sourceText) {
        sourceText.expression =
          "seedRandom(index + Math.floor(time * 12), false);\\n" +
          "var len = 15 + Math.floor(random() * 15);\\n" +
          "var chars = [];\\n" +
          "for (var c = 0; c < len; c++) {\\n" +
          "  var code = 12449 + Math.floor(random() * 85); // Katakana glyphs\\n" +
          "  if (random() < 0.25) code = 48 + Math.floor(random() * 2); // Binary 0/1\\n" +
          "  chars.push(String.fromCharCode(code));\\n" +
          "}\\n" +
          "chars.join('\\\\r');";
      }

      // Apply linear wipe to fade the top of the stream
      var wipe = textLayer.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
      if (wipe) {
        try {
          wipe.property("Transition Completion").setValue(45);
          wipe.property("Wipe Angle").setValue(0); // Wipe from top to bottom
          wipe.property("Feather").setValue(120);
        } catch(eWipe) {}
      }

      // Apply glows on the text columns
      var glow = textLayer.property("ADBE Effect Parade").addProperty("ADBE Glow");
      if (glow) {
        try {
          glow.property("ADBE Glow-0003").setValue(25);
          glow.property("ADBE Glow-0004").setValue(1.5);
        } catch (eGlow) {}
      }
      
      textLayer.blendingMode = BlendingMode.ADD;
    }

    __mpAssetStoreFinish(comp, "social", "Code_Col_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 2. build_black_hole_gravity_warp
export function generateGravityWarpJsx(opts: {
  outputAepPath: string;
  singularityColor: number[];
  accretionDiskColor: number[];
  warpStrength: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Black Hole Gravitational Lensing and Accretion Disk");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // 1. Starfield Background
    var bg = comp.layers.addSolid([0, 0, 0.03], "Space_Background", cw, ch, 1, dur);
    var fnBg = bg.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fnBg) {
      try {
        fnBg.property("ADBE Fractal Noise-0001").setValue(1); // Blocky noise for star field
        fnBg.property("ADBE Fractal Noise-0003").setValue(2.3);
        fnBg.property("ADBE Fractal Noise-0013").setValue(5);
      } catch(e) {}
    }
    var thBg = bg.property("ADBE Effect Parade").addProperty("ADBE Threshold2");
    if (thBg) {
      try { thBg.property("ADBE Threshold2-0001").setValue(238); } catch(e) {}
    }

    // 2. Accretion Disk (Swirling Fractal Noise)
    var disk = comp.layers.addSolid([0,0,0], "Accretion_Disk", cw, ch, 1, dur);
    disk.blendingMode = BlendingMode.ADD;
    var fnDisk = disk.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fnDisk) {
      try {
        fnDisk.property("ADBE Fractal Noise-0002").setValue(4); // Dynamic progressive
        fnDisk.property("ADBE Fractal Noise-0003").setValue(1.8);
        fnDisk.property("ADBE Fractal Noise-0005").setValue(130);
        fnDisk.property("ADBE Fractal Noise-0013").setValue(160);
        fnDisk.property("ADBE Fractal Noise-0017").expression = "time * 75;"; // rotate gas
      } catch(e) {}
    }
    
    // Polar Coordinates to shape noise into accretion disk swirl
    var polar = disk.property("ADBE Effect Parade").addProperty("ADBE Polar Coordinates");
    if (polar) {
      try {
        polar.property("ADBE Polar Coordinates-0001").setValue(100);
        polar.property("ADBE Polar Coordinates-0002").setValue(1); // Rect to Polar
      } catch(e) {}
    }

    // Accretion disk tint/colorize
    var tint = disk.property("ADBE Effect Parade").addProperty("ADBE Tint");
    if (tint) {
      try {
        tint.property("ADBE Tint-0002").setValue(${jlit(opts.accretionDiskColor)});
      } catch(e) {}
    }

    // Scale and position accretion disk
    disk.property("ADBE Transform Group").property("ADBE Scale").setValue([50, 20]); // Flatten into angled disk
    disk.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(-25); // Tilt disk
    disk.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // 3. Singularity Black Hole Core
    var hole = comp.layers.addShape();
    hole.name = "Singularity_Core";
    var hRoot = hole.property("ADBE Root Vectors Group");
    var hEll = hRoot.addProperty("ADBE Vector Shape - Ellipse");
    var radius = Math.round(Math.min(cw, ch) * 0.12);
    hEll.property("ADBE Vector Ellipse Size").setValue([radius * 2, radius * 2]);
    var hFill = hRoot.addProperty("ADBE Vector Graphic - Fill");
    hFill.property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]); // Perfect black singularity
    hole.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // Emissive Corona Ring
    var corona = comp.layers.addShape();
    corona.name = "Singularity_Corona";
    corona.blendingMode = BlendingMode.ADD;
    var cRoot = corona.property("ADBE Root Vectors Group");
    var cEll = cRoot.addProperty("ADBE Vector Shape - Ellipse");
    cEll.property("ADBE Vector Ellipse Size").setValue([radius * 2 + 10, radius * 2 + 10]);
    var cStroke = cRoot.addProperty("ADBE Vector Graphic - Stroke");
    cStroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.singularityColor)});
    cStroke.property("ADBE Vector Stroke Width").setValue(12);
    corona.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
    
    var cGlow = corona.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (cGlow) {
      try {
        cGlow.property("ADBE Glow-0003").setValue(50);
        cGlow.property("ADBE Glow-0004").setValue(2.2);
      } catch(e) {}
    }

    // 4. Displacement Map Rig (Gravitational Lensing)
    // Create displacement source comp
    var mapComp = proj.items.addComp("Displacement_Ramp_Map", cw, ch, 1, dur, ${opts.fps});
    var mapSolid = mapComp.layers.addSolid([0.5, 0.5, 0.5], "Ramp", cw, ch, 1, dur); // Neutral grey base
    var ramp = mapSolid.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    if (ramp) {
      try {
        ramp.property("ADBE Ramp-0001").setValue([cw/2, ch/2]); // Start center
        ramp.property("ADBE Ramp-0002").setValue([1, 1, 1]); // White (max push)
        ramp.property("ADBE Ramp-0003").setValue([cw/2 + radius * 2, ch/2]); // Outer bound
        ramp.property("ADBE Ramp-0004").setValue([0.5, 0.5, 0.5]); // Neutral grey (no push)
        ramp.property("ADBE Ramp-0005").setValue(2); // Radial Ramp shape
      } catch(e) {}
    }

    // Add map precomp to main comp
    var mapLayer = comp.layers.addComp(mapComp);
    mapLayer.name = "Gravity_Warp_Map_Source";
    mapLayer.enabled = false; // Hide from render, only referenced by effect

    // Adjustment Layer to hold Displacement Map
    var adj = comp.layers.addSolid([1,1,1], "Gravitational_Lensing_Adjustment", cw, ch, 1, dur);
    try { adj.adjustmentLayer = true; } catch(e) {}
    adj.moveToBeginning(); // Must sit on top to warp background and disk

    var dispEffect = adj.property("ADBE Effect Parade").addProperty("ADBE Displacement Map");
    if (dispEffect) {
      try {
        dispEffect.property("Displacement Map Layer").setValue(mapLayer.index);
        dispEffect.property("Horizontal Use For").setValue(1); // Red Channel
        dispEffect.property("Vertical Use For").setValue(2); // Green Channel
        dispEffect.property("Max Horizontal Displacement").setValue(${opts.warpStrength});
        dispEffect.property("Max Vertical Displacement").setValue(${opts.warpStrength});
      } catch(e) {}
    }

    // Camera movement
    var cam = comp.layers.addCamera("CinemaCam", [cw/2, ch/2]);
    var camPos = cam.property("ADBE Transform Group").property("ADBE Position");
    camPos.setValueAtTime(0, [cw/2, ch/2, -1400]);
    camPos.setValueAtTime(dur, [cw/2 - 60, ch/2 + 30, -1100]);
    MP.setEase(camPos, "sineInOut");

    __mpAssetStoreFinish(comp, "cinematic", "Singularity_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 3. build_liquid_lava_simulator
export function generateLiquidLavaJsx(opts: {
  outputAepPath: string;
  lavaColor: number[];
  glowColor: number[];
  blobCount: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Procedural Liquid Metaball / Lava Flow");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // Dark volcanic background
    var bg = comp.layers.addSolid([0.02, 0.01, 0.01], "Volcanic_BG", cw, ch, 1, dur);

    // Shape layer to host organic floating metaball circles
    var host = comp.layers.addShape();
    host.name = "Liquid_Blobs_Host";
    host.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
    
    var root = host.property("ADBE Root Vectors Group");
    var blobCount = ${opts.blobCount};
    var lavaColor = ${jlit(opts.lavaColor)};
    
    for (var i = 0; i < blobCount; i++) {
      var grp = root.addProperty("ADBE Vector Group");
      grp.name = "Blob_Group_" + i;
      
      var vecs = grp.property("ADBE Vectors Group");
      var ell = vecs.addProperty("ADBE Vector Shape - Ellipse");
      var radius = 60 + Math.random() * 80;
      ell.property("ADBE Vector Ellipse Size").setValue([radius * 2, radius * 2]);
      
      var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(lavaColor);

      // Animate positioning via wiggles to make blobs float around
      var trans = grp.property("ADBE Vector Transform Group");
      var pos = trans.property("ADBE Vector Position");
      pos.setValue([
        (Math.random() - 0.5) * cw * 0.6,
        (Math.random() - 0.5) * ch * 0.6
      ]);
      pos.expression = "wiggle(0.4, 280);";
    }

    // ── The Metaball Magic ──
    // Fast Box Blur
    var blur = host.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
    if (blur) {
      try {
        blur.property("Blur Radius").setValue(65);
        blur.property("Blur Dimensions").setValue(1); // Horizontal and Vertical
        blur.property("Repeat Edge Pixels").setValue(1); // True
      } catch(e) {}
    }

    // Simple Choker (pulls blurred alphas back to a sharp border)
    var choker = host.property("ADBE Effect Parade").addProperty("ADBE Simple Choker");
    if (choker) {
      try {
        choker.property("Choke Matte").setValue(42);
      } catch(e) {}
    }

    // Liquid Glow effect
    var glow = host.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (glow) {
      try {
        glow.property("ADBE Glow-0002").setValue(15); // Threshold
        glow.property("ADBE Glow-0003").setValue(90); // Radius
        glow.property("ADBE Glow-0004").setValue(2.0); // Intensity
      } catch(e) {}
    }

    host.blendingMode = BlendingMode.NORMAL;

    __mpAssetStoreFinish(comp, "cinema", "Liquid_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 4. build_lightning_storm_generator
export function generateLightningStormJsx(opts: {
  outputAepPath: string;
  glowColor: number[];
  boltFrequency: number;
  addRain: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Atmospheric Lightning Storm and Rain Scene");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // 1. Storm sky background solid
    var sky = comp.layers.addSolid([0.01, 0.015, 0.035], "Storm_Sky_BG", cw, ch, 1, dur);
    
    // Cloud Fractal Noise
    var clouds = comp.layers.addSolid([0.1, 0.1, 0.15], "Storm_Clouds", cw, ch, 1, dur);
    var fnClouds = clouds.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fnClouds) {
      try {
        fnClouds.property("ADBE Fractal Noise-0003").setValue(1.6); // Contrast
        fnClouds.property("ADBE Fractal Noise-0004").setValue(55);  // Brightness
        fnClouds.property("ADBE Fractal Noise-0013").setValue(380); // Scale
        fnClouds.property("ADBE Fractal Noise-0017").expression = "time * 6;"; // Slow evolution
      } catch(e) {}
    }
    clouds.blendingMode = BlendingMode.MULTIPLY;
    clouds.property("ADBE Transform Group").property("ADBE Opacity").setValue(75);

    // 2. Ambient Lightning Flash (triggers opacity bursts randomly)
    var ambientFlash = comp.layers.addSolid([0.8, 0.9, 1.0], "Ambient_Flash", cw, ch, 1, dur);
    ambientFlash.blendingMode = BlendingMode.ADD;
    var ambOp = ambientFlash.property("ADBE Transform Group").property("ADBE Opacity");
    if (ambOp) {
      ambOp.expression = 
        "seedRandom(Math.floor(time * " + opts.boltFrequency + "), false);\\n" +
        "var trigger = random(0, 100);\\n" +
        "if (trigger > 90) {\\n" +
        "  var age = time % (1 / " + opts.boltFrequency + ");\\n" +
        "  var dec = Math.exp(-age * 22);\\n" +
        "  dec * random(30, 85);\\n" +
        "} else { 0; }";
    }

    // 3. Lightning Bolts (Using CC Advanced Lightning)
    var boltLayer = comp.layers.addSolid([0,0,0], "Lightning_Bolt_Layer", cw, ch, 1, dur);
    boltLayer.blendingMode = BlendingMode.ADD;
    var lt = boltLayer.property("ADBE Effect Parade").addProperty("ADBE Advanced Lightning");
    if (lt) {
      try {
        // Advanced Lightning settings
        lt.property("Lightning Type").setValue(1); // Strike mode
        lt.property("Origin").setValue([cw/2, 0]); // Strike from top center
        
        // Randomize direction / target point
        lt.property("Direction").expression = 
          "seedRandom(Math.floor(time * " + opts.boltFrequency + "), true);\\n" +
          "[random(thisComp.width*0.2, thisComp.width*0.8), thisComp.height * random(0.6, 0.95)];";
          
        // Animate bolt state/conduction to trigger new lightning paths
        lt.property("State/Conduction").expression = "time * 16;";
        
        // Glow settings
        lt.property("Glow Color").setValue(${jlit(opts.glowColor)});
        lt.property("Core Color").setValue([1, 1, 1]);
        
        // Match opacity of bolt to the ambient flash triggers
        var boltOp = boltLayer.property("ADBE Transform Group").property("ADBE Opacity");
        if (boltOp) {
          boltOp.expression = "thisComp.layer(\"Ambient_Flash\").transform.opacity * 1.5;";
        }
      } catch(e) {}
    }

    // 4. Vertical Rain Sheet
    if (${opts.addRain}) {
      var rain = comp.layers.addSolid([0, 0, 0], "Rain_Sheet", cw, ch, 1, dur);
      rain.blendingMode = BlendingMode.ADD;
      var ccRain = rain.property("ADBE Effect Parade").addProperty("CC Rainfall");
      if (ccRain) {
        try {
          ccRain.property("Drops").setValue(2500);
          ccRain.property("Size").setValue(2);
          ccRain.property("Speed").setValue(4500);
          ccRain.property("Wind").setValue(15);
          ccRain.property("Color").setValue([0.75, 0.85, 0.95, 0.25]);
        } catch(e) {}
      }
    }

    // 5. Thunder Camera Rumble linked to lightning strikes
    var cam = comp.layers.addCamera("CinemaCam", [cw/2, ch/2]);
    var camPos = cam.property("ADBE Transform Group").property("ADBE Position");
    if (camPos) {
      camPos.expression = 
        "var flash = thisComp.layer(\"Ambient_Flash\").transform.opacity;\\n" +
        "if (flash > 10) {\\n" +
        "  wiggle(15, flash * 0.4);\\n" +
        "} else { value; }";
    }

    __mpAssetStoreFinish(comp, "cinema", "Storm_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 5. build_magical_summoning_sigil
export function generateMagicSigilJsx(opts: {
  outputAepPath: string;
  glowColor: number[];
  runeText: string;
  drawDuration: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building 3D Runic Magical Summoning Sigil Circle");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};
    var drawDur = ${opts.drawDuration};
    var sigilColor = ${jlit(opts.glowColor)};

    // Dark spell ground bg
    var bg = comp.layers.addSolid([0.02, 0.02, 0.04], "Summoning_Ground", cw, ch, 1, dur);
    
    // Null container to handle tilt and rotation in 3D
    var null3D = comp.layers.addNull(dur);
    null3D.name = "Sigil_3D_Controller";
    null3D.threeDLayer = true;
    null3D.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    null3D.property("ADBE Transform Group").property("ADBE Rotate X").setValue(72); // Lay circle flat on floor

    // Spawning vector sigil layer
    var sigil = comp.layers.addShape();
    sigil.name = "Runic_Sigil_Geometry";
    sigil.threeDLayer = true;
    sigil.parent = null3D; // Parent to the 3D controller null
    sigil.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, 0]);
    sigil.blendingMode = BlendingMode.ADD;

    var root = sigil.property("ADBE Root Vectors Group");
    
    // Outer concentric circle
    var ring1 = root.addProperty("ADBE Vector Group");
    ring1.name = "Outer_Ring";
    var r1V = ring1.property("ADBE Vectors Group");
    var r1Ell = r1V.addProperty("ADBE Vector Shape - Ellipse");
    r1Ell.property("ADBE Vector Ellipse Size").setValue([580, 580]);
    var r1Str = r1V.addProperty("ADBE Vector Graphic - Stroke");
    r1Str.property("ADBE Vector Stroke Color").setValue(sigilColor);
    r1Str.property("ADBE Vector Stroke Width").setValue(3);

    // Inner concentric circle
    var ring2 = root.addProperty("ADBE Vector Group");
    ring2.name = "Inner_Ring";
    var r2V = ring2.property("ADBE Vectors Group");
    var r2Ell = r2V.addProperty("ADBE Vector Shape - Ellipse");
    r2Ell.property("ADBE Vector Ellipse Size").setValue([510, 510]);
    var r2Str = r2V.addProperty("ADBE Vector Graphic - Stroke");
    r2Str.property("ADBE Vector Stroke Color").setValue(sigilColor);
    r2Str.property("ADBE Vector Stroke Width").setValue(1.5);
    
    // Inner dashed core ring
    var ring3 = root.addProperty("ADBE Vector Group");
    ring3.name = "Dashed_Ring";
    var r3V = ring3.property("ADBE Vectors Group");
    var r3Ell = r3V.addProperty("ADBE Vector Shape - Ellipse");
    r3Ell.property("ADBE Vector Ellipse Size").setValue([410, 410]);
    var r3Str = r3V.addProperty("ADBE Vector Graphic - Stroke");
    r3Str.property("ADBE Vector Stroke Color").setValue(sigilColor);
    r3Str.property("ADBE Vector Stroke Width").setValue(2);
    // Add dashes to ring 3
    var dashGroup = r3Str.property("Dashes");
    if (dashGroup) {
      try {
        var d1 = dashGroup.addProperty("ADBE Vector Stroke Dash 1");
        d1.setValue(12);
        var g1 = dashGroup.addProperty("ADBE Vector Stroke Gap 1");
        g1.setValue(8);
      } catch(e) {}
    }

    // Add Trim Paths to animate drawing of all rings
    var trim = root.addProperty("ADBE Vector Filter - Trim");
    if (trim) {
      try {
        var trimEnd = trim.property("ADBE Vector Trim End");
        trimEnd.setValueAtTime(0, 0);
        trimEnd.setValueAtTime(drawDur, 100);
        MP.setEase(trimEnd, "expoOut");
      } catch(e) {}
    }

    // Apply rotation expressions to create opposite motion
    ring1.property("ADBE Vector Transform Group").property("ADBE Vector Rotation").expression = "time * 25;";
    ring2.property("ADBE Vector Transform Group").property("ADBE Vector Rotation").expression = "time * -35;";
    ring3.property("ADBE Vector Transform Group").property("ADBE Vector Rotation").expression = "time * 45;";

    // Glow on the vector shapes
    var glow = sigil.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (glow) {
      try {
        glow.property("ADBE Glow-0003").setValue(45);
        glow.property("ADBE Glow-0004").setValue(2.0);
      } catch(e) {}
    }

    // Add rotating Runic Characters text wrapping around the circle
    var runicText = comp.layers.addText(${jstr(opts.runeText)});
    runicText.name = "Runic_Sigil_Characters";
    runicText.threeDLayer = true;
    runicText.parent = null3D;
    runicText.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, 0]);
    runicText.blendingMode = BlendingMode.ADD;

    try {
      var tProp = runicText.property("ADBE Text Properties").property("ADBE Text Document");
      var td = tProp.value;
      td.fontSize = 24;
      td.fillColor = sigilColor;
      td.justification = ParagraphJustification.CENTER_JUSTIFY;
      tProp.setValue(td);
    } catch(eText) {}

    // Runic rotation expression
    var runicRot = runicText.property("ADBE Transform Group").property("ADBE Rotate Z");
    if (runicRot) {
      runicRot.expression = "time * -15;";
    }

    // Animate opacity of runes to sync with draw-in duration
    var runicOp = runicText.property("ADBE Transform Group").property("ADBE Opacity");
    if (runicOp) {
      runicOp.setValueAtTime(0, 0);
      runicOp.setValueAtTime(drawDur * 0.4, 0);
      runicOp.setValueAtTime(drawDur, 100);
      MP.setEase(runicOp, "quadOut");
    }

    // Dynamic scale pulse on active summon
    var nullScale = null3D.property("ADBE Transform Group").property("ADBE Scale");
    if (nullScale) {
      nullScale.setValueAtTime(0, [0, 0, 100]);
      nullScale.setValueAtTime(drawDur * 0.5, [75, 75, 100]);
      nullScale.setValueAtTime(drawDur, [100, 100, 100]);
      nullScale.setValueAtTime(drawDur + 0.1, [112, 112, 100]);
      nullScale.setValueAtTime(drawDur + 0.5, [100, 100, 100]);
      MP.setEase(nullScale, "expoOut");
    }

    // Add cinematic glow to characters
    var textGlow = runicText.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (textGlow) {
      try {
        textGlow.property("ADBE Glow-0003").setValue(20);
        textGlow.property("ADBE Glow-0004").setValue(1.5);
      } catch(e) {}
    }

    __mpAssetStoreFinish(comp, "game", "Sigil_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}
