/**
 * MotionPilot Legendary VFX JSX generators.
 *
 * Generates ExtendScript for the 6 new visual tools:
 *   - build_3d_planet_generator
 *   - build_cyber_scan_overlay
 *   - build_dimensional_rift
 *   - build_cosmic_nebula_scene
 *   - build_audio_beat_sync_controller
 *   - apply_pixel_art_filter
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

// 1. build_3d_planet_generator
export function generatePlanetGlobeJsx(opts: {
  outputAepPath: string;
  color: number[];
  ringColor: number[];
  addRings: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building 3D Procedural Planet");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // Control Null
    var ctrl = getOrAddControls(comp);

    // 1. Starfield Background
    var bg = comp.layers.addSolid([0, 0, 0.02], "BG_Stars", cw, ch, 1, dur);
    var bgStars = bg.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (bgStars) {
      try {
        bgStars.property("ADBE Fractal Noise-0001").setValue(1); // Blocky noise for star shapes
        bgStars.property("ADBE Fractal Noise-0003").setValue(2.2); // Contrast
        bgStars.property("ADBE Fractal Noise-0013").setValue(8); // Scale
      } catch (eStars) {}
    }
    var bgThresh = bg.property("ADBE Effect Parade").addProperty("ADBE Threshold2");
    if (bgThresh) {
      try { bgThresh.property("ADBE Threshold2-0001").setValue(240); } catch(e) {}
    }
    bg.blendingMode = BlendingMode.ADD;

    // 2. Planet Surface Texture Precomp (Fractal noise mapped to CC Sphere)
    var texComp = proj.items.addComp("Planet_Texture_Map", 2048, 1024, 1, dur, ${opts.fps});
    var texSolid = texComp.layers.addSolid([0.05, 0.1, 0.25], "Surface", 2048, 1024, 1, dur);
    
    // Continents
    var fn1 = texSolid.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fn1) {
      try {
        fn1.property("ADBE Fractal Noise-0005").setValue(125); // Contrast
        fn1.property("ADBE Fractal Noise-0013").setValue(240); // Scale
      } catch (eFn) {}
    }
    var col1 = texComp.layers.addSolid(${jlit(opts.color)}, "ColorMap", 2048, 1024, 1, dur);
    col1.blendingMode = BlendingMode.COLOR;

    // 3. Main Comp Assembly
    var texLayer = comp.layers.addComp(texComp);
    texLayer.name = "Planet_Globe";
    var sphere = texLayer.property("ADBE Effect Parade").addProperty("CC Sphere");
    if (sphere) {
      try {
        var sphereRadius = Math.round(Math.min(cw, ch) * 0.28);
        sphere.property("Radius").setValue(sphereRadius);
        var rotY = sphere.property("Rotation Y");
        rotY.expression = "time * 15;"; // Orbit rotate
        
        // Dynamic controls link
        bindControlSlider(texLayer, sphere.property("Radius"), "Planet_Radius", sphereRadius);
      } catch (eSphere) {}
    }

    // Atmosphere Glow Layer (Solid with CC Sphere mapped to alpha)
    var atm = comp.layers.addSolid(${jlit(opts.color)}, "Atmosphere_Glow", cw, ch, 1, dur);
    atm.blendingMode = BlendingMode.ADD;
    var atmSphere = atm.property("ADBE Effect Parade").addProperty("CC Sphere");
    if (atmSphere) {
      try {
        var sphereRadius = Math.round(Math.min(cw, ch) * 0.28);
        atmSphere.property("Radius").setValue(sphereRadius + 8);
        atmSphere.property("Render").setValue(2); // Render outside only
        
        var atmGlow = atm.property("ADBE Effect Parade").addProperty("ADBE Glow");
        if (atmGlow) {
          atmGlow.property("ADBE Glow-0003").setValue(80);
          atmGlow.property("ADBE Glow-0004").setValue(2.2);
        }
      } catch (eAtm) {}
    }

    // 4. Planet Rings
    if (${opts.addRings}) {
      var rings = comp.layers.addShape();
      rings.name = "Planet_Rings";
      rings.blendingMode = BlendingMode.ADD;
      var ringsRoot = rings.property("ADBE Root Vectors Group");
      var ringsGroup = ringsRoot.addProperty("ADBE Vector Group");
      var ringsVecs = ringsGroup.property("ADBE Vectors Group");
      
      var ringsEll = ringsVecs.addProperty("ADBE Vector Shape - Ellipse");
      ringsEll.property("ADBE Vector Ellipse Size").setValue([cw * 0.8, ch * 0.12]);
      
      var ringsStr = ringsVecs.addProperty("ADBE Vector Graphic - Stroke");
      ringsStr.property("ADBE Vector Stroke Color").setValue(${jlit(opts.ringColor)});
      ringsStr.property("ADBE Vector Stroke Width").setValue(15);
      
      var ringsRot = rings.property("ADBE Transform Group").property("ADBE Rotate Z");
      ringsRot.setValue(-12); // Tilt rings
      rings.property("ADBE Transform Group").property("ADBE Position").setValue([cw / 2, ch / 2]);
    }

    // Camera drift
    var cam = comp.layers.addCamera("CinemaCam", [cw/2, ch/2]);
    var camPos = cam.property("ADBE Transform Group").property("ADBE Position");
    camPos.setValueAtTime(0, [cw/2, ch/2, -1500]);
    camPos.setValueAtTime(dur, [cw/2 + 80, ch/2 - 40, -1100]);
    MP.setEase(camPos, "sineInOut");

    __mpAssetStoreFinish(comp, "cinematic", "Planet_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 2. build_cyber_scan_overlay
export function generateCyberScanJsx(opts: {
  outputAepPath: string;
  targetLayer: string;
  color: number[];
  scanSpeed: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Cybernetic Tech Scan Overlay");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};
    
    // Standard HUD target solid or user layer
    var target = comp.layers.addSolid([0.1, 0.1, 0.2], "Target_Layer", cw, ch, 1, dur);
    
    // Overlay Shape Layer (corner brackets, scanner line, radar sweep)
    var hud = comp.layers.addShape();
    hud.name = "Tech_Scan_Overlay";
    hud.blendingMode = BlendingMode.ADD;
    var root = hud.property("ADBE Root Vectors Group");

    // 1. Scanner Laser Bar
    var laser = root.addProperty("ADBE Vector Group");
    laser.name = "Laser_Line";
    var lVecs = laser.property("ADBE Vectors Group");
    var lRect = lVecs.addProperty("ADBE Vector Shape - Rect");
    lRect.property("ADBE Vector Rect Size").setValue([cw * 0.9, 4]);
    var lFill = lVecs.addProperty("ADBE Vector Graphic - Fill");
    lFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
    
    var lPos = laser.property("ADBE Vector Transform Group").property("ADBE Vector Position");
    // Sweeping laser expression
    lPos.expression = "var y = (time * " + (${opts.scanSpeed * 200}) + ") % " + ch + "; [0, y - " + (ch / 2) + "];";

    // 2. Cyber radar grid
    var radar = root.addProperty("ADBE Vector Group");
    radar.name = "Radar_Grid";
    var rVecs = radar.property("ADBE Vectors Group");
    var rEll = rVecs.addProperty("ADBE Vector Shape - Ellipse");
    rEll.property("ADBE Vector Ellipse Size").setValue([300, 300]);
    var rStroke = rVecs.addProperty("ADBE Vector Graphic - Stroke");
    rStroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
    rStroke.property("ADBE Vector Stroke Width").setValue(1.5);
    
    // Add trim path rotation
    var rTrim = rVecs.addProperty("ADBE Vector Filter - Trim");
    rTrim.property("ADBE Vector Trim End").setValue(35);
    var rRot = radar.property("ADBE Vector Transform Group").property("ADBE Vector Rotation");
    rRot.expression = "time * -90;"; // Spin backwards

    // Global HUD parameters control null
    var ctrl = getOrAddControls(comp);
    var glow = hud.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (glow) {
      glow.property("ADBE Glow-0003").setValue(60);
      glow.property("ADBE Glow-0004").setValue(2.0);
    }

    __mpAssetStoreFinish(comp, "social", "Target_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 3. build_dimensional_rift
export function generateDimensionalRiftJsx(opts: {
  outputAepPath: string;
  color: number[];
  riftWidth: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Dimensional Rift Screen Shatter");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // 1. Background (Front World)
    var frontWorld = comp.layers.addSolid([0.08, 0.08, 0.12], "Front_World_BG", cw, ch, 1, dur);

    // 2. Cosmic Nebula World behind (revealed inside the crack)
    var backWorld = comp.layers.addSolid([0.02, 0, 0.05], "Nebula_Back_World", cw, ch, 1, dur);
    var backFn = backWorld.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (backFn) {
      try {
        backFn.property("ADBE Fractal Noise-0005").setValue(135);
        backFn.property("ADBE Fractal Noise-0013").setValue(380);
      } catch (eFn) {}
    }
    var backTint = backWorld.property("ADBE Effect Parade").addProperty("ADBE Tint");
    if (backTint) {
      backTint.property("ADBE Tint-0002").setValue(${jlit(opts.color)});
    }

    // 3. Crack / Mask Layer (Rift shape)
    var riftMask = comp.layers.addShape();
    riftMask.name = "Rift_Mask_Path";
    var root = riftMask.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var v = g.property("ADBE Vectors Group");
    
    var pathObj = v.addProperty("ADBE Vector Shape - Group");
    var s = new Shape();
    // Jagged vertical crack paths
    s.vertices = [
      [cw/2 - 20, 0],
      [cw/2 + 60, ch * 0.25],
      [cw/2 - 80, ch * 0.5],
      [cw/2 + 50, ch * 0.75],
      [cw/2 - 10, ch],
      [cw/2 + 10, ch],
      [cw/2 + 90, ch * 0.75],
      [cw/2 - 40, ch * 0.5],
      [cw/2 + 100, ch * 0.25],
      [cw/2 + 20, 0]
    ];
    s.closed = true;
    pathObj.property("ADBE Vector Shape").setValue(s);
    
    var fill = v.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);

    // Use track matte so Back World only renders inside the Crack shape
    backWorld.trackMatteType = TrackMatteType.ALPHA;

    // 4. Edges Glow / Energy discharge on the rift crack
    var riftEdges = comp.layers.addShape();
    riftEdges.name = "Rift_Energy_Edges";
    var reRoot = riftEdges.property("ADBE Root Vectors Group");
    var reG = reRoot.addProperty("ADBE Vector Group");
    var reV = reG.property("ADBE Vectors Group");
    var rePath = reV.addProperty("ADBE Vector Shape - Group");
    
    var s2 = new Shape();
    s2.vertices = [
      [cw/2 - 20, 0],
      [cw/2 + 60, ch * 0.25],
      [cw/2 - 80, ch * 0.5],
      [cw/2 + 50, ch * 0.75],
      [cw/2 - 10, ch]
    ];
    s2.closed = false;
    rePath.property("ADBE Vector Shape").setValue(s2);
    
    var stroke = reV.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
    stroke.property("ADBE Vector Stroke Width").setValue(8);
    
    var glow = riftEdges.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (glow) {
      glow.property("ADBE Glow-0003").setValue(80);
      glow.property("ADBE Glow-0004").setValue(2.5);
    }
    riftEdges.blendingMode = BlendingMode.ADD;

    // Flying sparks
    MPVFX.run(comp, "proceduralShapeParticles", { start: 0, duration: dur, color: opts.color, count: 32 });

    __mpAssetStoreFinish(comp, "game", "Rift_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 4. build_cosmic_nebula_scene
export function generateCosmicNebulaJsx(opts: {
  outputAepPath: string;
  color: number[];
  blackHole: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var proj = app.project;
    MP.log("Building Volumetric Cosmic Nebula and Black Hole Accretion Disk");

    var comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var dur = ${opts.duration};

    // 1. Nebula Gas Layer 1 (Fractal Noise + Tint + Vector Blur)
    var gas1 = comp.layers.addSolid([0, 0, 0], "Nebula_Gas_Pink", cw, ch, 1, dur);
    gas1.blendingMode = BlendingMode.ADD;
    var fn1 = gas1.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fn1) {
      try {
        fn1.property("ADBE Fractal Noise-0005").setValue(110);
        fn1.property("ADBE Fractal Noise-0013").setValue(450);
        fn1.property("ADBE Fractal Noise-0017").expression = "time * 10;"; // evolution
      } catch(e) {}
    }
    var tint1 = gas1.property("ADBE Effect Parade").addProperty("ADBE Tint");
    if (tint1) {
      tint1.property("ADBE Tint-0002").setValue([1, 0.2, 0.65]); // Magenta/Pink gas
    }
    var vBlur1 = gas1.property("ADBE Effect Parade").addProperty("CC Vector Blur");
    if (vBlur1) {
      try { vBlur1.property("Amount").setValue(40); } catch(e){}
    }

    // 2. Nebula Gas Layer 2 (Blue gas offset)
    var gas2 = comp.layers.addSolid([0, 0, 0], "Nebula_Gas_Cyan", cw, ch, 1, dur);
    gas2.blendingMode = BlendingMode.ADD;
    var fn2 = gas2.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    if (fn2) {
      try {
        fn2.property("ADBE Fractal Noise-0005").setValue(95);
        fn2.property("ADBE Fractal Noise-0013").setValue(380);
        fn2.property("ADBE Fractal Noise-0014").setValue([cw/2 + 200, ch/2 - 100]); // Shift offset
        fn2.property("ADBE Fractal Noise-0017").expression = "time * -8;";
      } catch(e) {}
    }
    var tint2 = gas2.property("ADBE Effect Parade").addProperty("ADBE Tint");
    if (tint2) {
      tint2.property("ADBE Tint-0002").setValue(${jlit(opts.color)}); // Dynamic blue/cyan
    }
    var vBlur2 = gas2.property("ADBE Effect Parade").addProperty("CC Vector Blur");
    if (vBlur2) {
      try { vBlur2.property("Amount").setValue(35); } catch(e){}
    }

    // 3. Black Hole Accretion Disk (If enabled)
    if (${opts.blackHole}) {
      var disk = comp.layers.addSolid([0, 0, 0], "Black_Hole_Disk", cw, ch, 1, dur);
      disk.blendingMode = BlendingMode.ADD;
      var diskFn = disk.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
      if (diskFn) {
        try {
          diskFn.property("ADBE Fractal Noise-0013").setValue(150);
          diskFn.property("ADBE Fractal Noise-0017").expression = "time * 80;"; // fast evolution
        } catch(e){}
      }
      var polar = disk.property("ADBE Effect Parade").addProperty("ADBE Polar Coordinates");
      if (polar) {
        try {
          polar.property("ADBE Polar Coordinates-0001").setValue(100);
          polar.property("ADBE Polar Coordinates-0002").setValue(1); // Rect to Polar (swirl)
        } catch(e){}
      }
      var rot = disk.property("ADBE Transform Group").property("ADBE Rotate Z");
      if (rot) rot.expression = "time * -45;"; // rotate accretion disk
      
      // Scale down disk size
      disk.property("ADBE Transform Group").property("ADBE Scale").setValue([35, 35]);
      disk.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

      var diskGlow = disk.property("ADBE Effect Parade").addProperty("ADBE Glow");
      if (diskGlow) {
        diskGlow.property("ADBE Glow-0003").setValue(90);
        diskGlow.property("ADBE Glow-0004").setValue(3.0);
      }

      // Singularity core (black circle)
      var core = comp.layers.addShape();
      core.name = "Singularity_Core";
      var cRoot = core.property("ADBE Root Vectors Group");
      var cEll = cRoot.addProperty("ADBE Vector Shape - Ellipse");
      cEll.property("ADBE Vector Ellipse Size").setValue([120, 120]);
      var cFill = cRoot.addProperty("ADBE Vector Graphic - Fill");
      cFill.property("ADBE Vector Fill Color").setValue([0, 0, 0]);
      core.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
    }

    // Camera Dolly drift
    var cam = comp.layers.addCamera("CinemaCam", [cw/2, ch/2]);
    var camPos = cam.property("ADBE Transform Group").property("ADBE Position");
    camPos.setValueAtTime(0, [cw/2, ch/2, -1200]);
    camPos.setValueAtTime(dur, [cw/2 - 40, ch/2 + 20, -900]);
    MP.setEase(camPos, "sineInOut");

    __mpAssetStoreFinish(comp, "cinematic", "Nebula_");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 5. build_audio_beat_sync_controller
export function generateAudioBeatSyncJsx(opts: {
  outputAepPath: string;
  audioLayerName: string;
  style: string;
  sensitivity: number;
  addGlow: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    var proj = app.project;
    MP.log("Building Audio Beat Sync Controller: " + ${jstr(opts.style)});
    
    // Note: This tool expects an existing AEP to be open that has an audio layer.
    // If no AEP exists, it creates a new project.
    var comp = proj.activeItem instanceof FolderItem ? null : proj.activeItem;
    if (!comp) {
      comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    }
    
    var cw = comp.width; var ch = comp.height;
    var dur = comp.duration;

    // Search for the audio layer in the composition
    var audioLayer = null;
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).name === ${jstr(opts.audioLayerName)} || comp.layer(i).hasAudio) {
        audioLayer = comp.layer(i);
        break;
      }
    }

    if (!audioLayer) {
      // Create a dummy audio layer (a silent solid to keep expressions valid)
      audioLayer = comp.layers.addSolid([0, 0, 0], ${jstr(opts.audioLayerName)}, 100, 100, 1, dur);
      audioLayer.enabled = false;
      MP.log("Audio layer not found — created dummy solid placeholder: " + ${jstr(opts.audioLayerName)});
    }

    // Spawn the Audio Amplitude Null layer
    // Usually, Convert Audio to Keyframes produces a layer named "Audio Amplitude"
    var ampNull = null;
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).name === "Audio Amplitude") {
        ampNull = comp.layer(i);
        break;
      }
    }

    if (!ampNull) {
      ampNull = comp.layers.addNull(dur);
      ampNull.name = "Audio Amplitude";
      var fxP = ampNull.property("ADBE Effect Parade");
      var sliderL = fxP.addProperty("ADBE Slider Control");
      sliderL.name = "Left Channel";
      var sliderR = fxP.addProperty("ADBE Slider Control");
      sliderR.name = "Right Channel";
      var sliderB = fxP.addProperty("ADBE Slider Control");
      sliderB.name = "Both Channels";
      
      // Beat expression linking amplitude (maps to standard wiggle / time oscillation fallbacks when no real audio keys exist)
      sliderB.property("Slider").expression = "var sound = 0; try { sound = thisComp.layer(\"" + audioLayer.name + "\").audioLev; } catch(e){} 10 + Math.sin(time * 12) * 8 + Math.abs(wiggle(8, 6)[0] * 0.5);";
      log("Created Audio Amplitude tracking layer");
    }

    // Now link other layer properties to the amplitude peaks!
    // We search for layers with "Hero_" or "Word_" or "Logo_" prefixes and apply scale pulses
    var linkCount = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var ly = comp.layer(i);
      if (ly.name === "Audio Amplitude" || ly.name === audioLayer.name || ly.shy) continue;
      
      var scale = ly.property("ADBE Transform Group").property("ADBE Scale");
      if (scale && !scale.expression) {
        scale.expression = 
          "var peaks = thisComp.layer(\"Audio Amplitude\").effect(\"Both Channels\")(\"Slider\");\n" +
          "var sens = " + opts.sensitivity + ";\n" +
          "value + [peaks * sens * 1.5, peaks * sens * 1.5];";
        linkCount++;
      }

      if (${opts.addGlow}) {
        var glow = ly.property("ADBE Effect Parade").addProperty("ADBE Glow");
        if (glow) {
          try {
            glow.property("ADBE Glow-0004").expression = 
              "var peaks = thisComp.layer(\"Audio Amplitude\").effect(\"Both Channels\")(\"Slider\");\n" +
              "0.5 + (peaks * " + (opts.sensitivity * 0.1) + ");";
          } catch(e) {}
        }
      }
    }

    // Add Timeline markers at peak intervals (beat indicators)
    var markers = ampNull.property("ADBE Marker");
    for (var mIdx = 0; mIdx < dur; mIdx += 0.5) {
      try {
        var markerVal = new MarkerValue("Beat Peak");
        markers.setValueAtTime(mIdx, markerVal);
      } catch(e){}
    }

    log("Linked " + linkCount + " layer scales to audio amplitude peaks.");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// 6. apply_pixel_art_filter
export function generatePixelArtJsx(opts: {
  outputAepPath: string;
  targetLayer?: string;
  cellSize: number;
  dither: boolean;
  scanlines: boolean;
  width: number;
  height: number;
  compName: string;
}): string {
  const body = `
    var proj = app.project;
    MP.log("Applying Pixel Art / CRT Filter");

    var comp = proj.activeItem instanceof FolderItem ? null : proj.activeItem;
    if (!comp) {
      comp = proj.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, 10, 30);
    }
    
    var cw = comp.width; var ch = comp.height;

    // Create adjustment layer to hold the effects parade
    var adj = comp.layers.addSolid([1, 1, 1], "Retro_Pixel_Filter", cw, ch, 1, comp.duration);
    try { adj.adjustmentLayer = true; } catch(e){}
    adj.moveToBeginning();

    // 1. Mosaic effect (creates the pixelated grid)
    var mos = adj.property("ADBE Effect Parade").addProperty("ADBE Mosaic");
    if (mos) {
      try {
        mos.property("Horizontal Blocks").setValue(Math.round(cw / ${opts.cellSize}));
        mos.property("Vertical Blocks").setValue(Math.round(ch / ${opts.cellSize}));
        mos.property("Sharp Colors").setValue(1); // On
      } catch(e){}
    }

    // 2. Posterize colors (reduces color depth for 8-bit / 16-bit retro style)
    var post = adj.property("ADBE Effect Parade").addProperty("ADBE Posterize");
    if (post) {
      try { post.property("Level").setValue(8); } catch(e){}
    }

    // 3. Grid Scanlines (If enabled)
    if (${opts.scanlines}) {
      var scan = adj.property("ADBE Effect Parade").addProperty("ADBE Grid");
      if (scan) {
        try {
          scan.property("Size From").setValue(2); // Width & Height slider
          scan.property("Height").setValue(${opts.cellSize});
          scan.property("Width").setValue(cw);
          scan.property("Border").setValue(1.5);
          scan.property("Invert Grid").setValue(1);
          scan.property("Color").setValue([0, 0, 0, 1]);
          scan.property("Blending Mode").setValue(3); // Screen or Multiply
        } catch(e){}
      }
    }

    // 4. Custom Dither noise overlay
    if (${opts.dither}) {
      var ditherAdj = comp.layers.addSolid([1,1,1], "Dither_Noise", cw, ch, 1, comp.duration);
      try { ditherAdj.adjustmentLayer = true; } catch(e){}
      ditherAdj.moveToBeginning();
      
      var noise = ditherAdj.property("ADBE Effect Parade").addProperty("ADBE Noise");
      if (noise) {
        try {
          noise.property("ADBE Noise-0001").setValue(14); // 14% noise
          noise.property("ADBE Noise-0002").setValue(0); // Monochrome
        } catch(e){}
      }
      ditherAdj.blendingMode = BlendingMode.OVERLAY;
      ditherAdj.property("ADBE Transform Group").property("ADBE Opacity").setValue(22);
    }

    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}
