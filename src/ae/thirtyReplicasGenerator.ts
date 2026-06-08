/**
 * MotionPilot 30 Premium Plugin Replicas (Wave 5).
 *
 * Generates ExtendScript JSX code templates that serve as native,
 * zero-plugin alternatives to the most popular paid After Effects plugins.
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

// Helper to structure replica jsx templates
function makeReplicaTemplate(body: string, outputAepPath: string): string {
  return withReport(`
    app.newProject();
    var comp = app.project.items.addComp("MP_Replica_Comp", 1920, 1080, 1, 10, 30);
    var cw = 1920; var ch = 1080; var dur = 10;
    ${body}
    app.project.save(new File(${jstr(outputAepPath)}));
    __result.output = ${jstr(outputAepPath)};
  `);
}

// 1. Trapcode Particular
export function generateParticularReplicaJsx(opts: { outputAepPath: string; color: number[]; speed: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Particular Particle System");
    var emitter = comp.layers.addNull(dur);
    emitter.name = "Particular_Emitter";
    emitter.property("ADBE Transform Group").property("ADBE Position").expression = "wiggle(0.8, 300);";

    var particles = comp.layers.addSolid([0,0,0], "Particular_Particles", cw, ch, 1, dur);
    particles.blendingMode = BlendingMode.ADD;
    
    var world = particles.property("ADBE Effect Parade").addProperty("CC Particle World");
    if (world) {
      try {
        world.property("Birth Rate").setValue(4.5);
        world.property("Longevity (sec)").setValue(2.0);
        
        var producer = world.property("Producer");
        producer.property("Position X").expression = "(thisComp.layer(\"Particular_Emitter\").transform.position[0] - thisComp.width/2)/thisComp.width;";
        producer.property("Position Y").expression = "(thisComp.layer(\"Particular_Emitter\").transform.position[1] - thisComp.height/2)/thisComp.height;";
        
        var physics = world.property("Physics");
        physics.property("Gravity").setValue(0.18);
        physics.property("Velocity").setValue(1.5 * ${opts.speed});
        
        var particle = world.property("Particle");
        particle.property("Particle Type").setValue(4); // Faded Sphere
        particle.property("Birth Size").setValue(0.04);
        particle.property("Death Size").setValue(0.005);
        particle.property("Birth Color").setValue(${jlit(opts.color)});
        particle.property("Death Color").setValue([1,1,1,0]);
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 2. Video Copilot Saber
export function generateSaberReplicaJsx(opts: { outputAepPath: string; color: number[]; size: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Video Copilot Saber Glowing Energy");
    var baseText = comp.layers.addText("SABER NATIVE");
    baseText.name = "Saber_Core_Text";
    try {
      var tDoc = baseText.property("ADBE Text Properties").property("ADBE Text Document");
      var td = tDoc.value; td.fontSize = 110; td.font = "Arial Black"; td.fillColor = [1,1,1];
      td.justification = ParagraphJustification.CENTER_JUSTIFY; tDoc.setValue(td);
    } catch(e) {}
    baseText.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2 + 30]);

    // Neon Halo overlay duplicating text
    var halo = comp.layers.addText("SABER NATIVE");
    halo.name = "Saber_Halo_Glow";
    halo.blendingMode = BlendingMode.ADD;
    try {
      var tDoc2 = halo.property("ADBE Text Properties").property("ADBE Text Document");
      var td2 = tDoc2.value; td2.fontSize = 110; td2.font = "Arial Black"; td2.fillColor = ${jlit(opts.color)};
      td2.justification = ParagraphJustification.CENTER_JUSTIFY; tDoc2.setValue(td2);
    } catch(e) {}
    halo.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2 + 30]);

    var blur = halo.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
    if (blur) {
      blur.property("Blur Radius").setValue(${opts.size * 18});
      blur.property("Blur Dimensions").setValue(1);
    }

    var disp = halo.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace");
    if (disp) {
      try {
        disp.property("Amount").setValue(25);
        disp.property("Size").setValue(15);
        disp.property("Evolution").expression = "time * 280;";
      } catch(e) {}
    }

    var glow = halo.property("ADBE Effect Parade").addProperty("ADBE Glow");
    if (glow) {
      try {
        glow.property("ADBE Glow-0003").setValue(55);
        glow.property("ADBE Glow-0004").setValue(2.0);
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 3. Rowbyte Plexus
export function generatePlexusReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Rowbyte Plexus Connecting Lines");
    var nodeCount = 10;
    var nodes = [];
    for (var i = 0; i < nodeCount; i++) {
      var n = comp.layers.addNull(dur);
      n.name = "PlexusNode_" + i;
      n.enabled = false;
      var pos = n.property("ADBE Transform Group").property("ADBE Position");
      pos.setValue([cw * (0.2 + 0.6 * Math.random()), ch * (0.2 + 0.6 * Math.random())]);
      pos.expression = "wiggle(0.4, 200);";
      nodes.push(n);
    }

    var network = comp.layers.addShape();
    network.name = "Plexus_Lines_Mesh";
    network.blendingMode = BlendingMode.ADD;
    var root = network.property("ADBE Root Vectors Group");
    var edgeCount = 0;

    for (var i = 0; i < nodeCount; i++) {
      for (var j = i + 1; j < Math.min(nodeCount, i + 3); j++) {
        var g = root.addProperty("ADBE Vector Group");
        g.name = "Edge_" + edgeCount;
        var vecs = g.property("ADBE Vectors Group");
        var shp = vecs.addProperty("ADBE Vector Shape - Path");
        var pathProp = shp.property("ADBE Vector Path");
        
        pathProp.expression = 
          "var p1 = thisComp.layer(\"PlexusNode_" + i + "\").transform.position;\\n" +
          "var p2 = thisComp.layer(\"PlexusNode_" + j + "\").transform.position;\\n" +
          "var shp = new Shape();\\n" +
          "shp.vertices = [p1 - transform.position, p2 - transform.position];\\n" +
          "shp.closed = false;\\n" +
          "shp;";
          
        var stroke = vecs.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
        stroke.property("ADBE Vector Stroke Width").expression = 
          "var p1 = thisComp.layer(\"PlexusNode_" + i + "\").transform.position;\\n" +
          "var p2 = thisComp.layer(\"PlexusNode_" + j + "\").transform.position;\\n" +
          "var d = length(p1 - p2);\\n" +
          "d < 250 ? ease(d, 0, 250, 2.5, 0) : 0;";
        
        edgeCount++;
      }
    }
  `, opts.outputAepPath);
}

// 4. Trapcode Shine
export function generateShineReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Shine Volumetric Light");
    var text = comp.layers.addText("SHINE");
    try {
      var tDoc = text.property("ADBE Text Properties").property("ADBE Text Document");
      var td = tDoc.value; td.fontSize = 150; td.font = "Arial Black"; td.fillColor = ${jlit(opts.color)};
      td.justification = ParagraphJustification.CENTER_JUSTIFY; tDoc.setValue(td);
    } catch(e) {}
    text.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2 + 40]);

    var light = comp.layers.addSolid([0,0,0], "Shine_Light_Rays", cw, ch, 1, dur);
    light.blendingMode = BlendingMode.ADD;
    var burst = light.property("ADBE Effect Parade").addProperty("ADBE CC Light Burst 2.5");
    if (burst) {
      try {
        burst.property("Ray Length").setValue(110);
        burst.property("Center").setValue([cw/2, ch/2]);
        burst.property("Intensity").setValue(90);
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 5. Trapcode Starglow
export function generateStarglowReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Starglow Highlight Streaks");
    var logo = comp.layers.addSolid([0.05, 0.05, 0.1], "Logo_Base", 400, 400, 1, dur);
    logo.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // Star streaks duplicating base using Fast Box Blurs angled
    var angles = [0, 45, 90, 135];
    for (var a = 0; a < angles.length; a++) {
      var streak = comp.layers.addSolid([0,0,0], "Streak_" + angles[a], cw, ch, 1, dur);
      streak.blendingMode = BlendingMode.ADD;
      var ccpw = streak.property("ADBE Effect Parade").addProperty("CC Particle World");
      if (ccpw) {
        try {
          ccpw.property("Birth Rate").setValue(0.5);
          ccpw.property("Longevity (sec)").setValue(0.8);
          ccpw.property("Particle").property("Birth Color").setValue(${jlit(opts.color)});
        } catch(e) {}
      }
      var dirBlur = streak.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
      if (dirBlur) {
        try {
          dirBlur.property("Blur Radius").setValue(75);
          dirBlur.property("Blur Dimensions").setValue(angles[a] % 90 === 0 ? 2 : 3); // Horizontal or Vertical
        } catch(e) {}
      }
    }
  `, opts.outputAepPath);
}

// 6. Trapcode Mir
export function generateMirReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Mir 3D Grid Terrain");
    var terrain = comp.layers.addShape();
    terrain.name = "Mir_3D_Terrain";
    terrain.threeDLayer = true;
    terrain.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    terrain.property("ADBE Transform Group").property("ADBE Rotate X").setValue(75);
    terrain.blendingMode = BlendingMode.ADD;

    var root = terrain.property("ADBE Root Vectors Group");
    var count = 18;
    for (var i = 0; i < count; i++) {
      var yCoord = -300 + i * (600/count);
      var line = root.addProperty("ADBE Vector Group");
      line.name = "Grid_Line_" + i;
      var vecs = line.property("ADBE Vectors Group");
      var path = vecs.addProperty("ADBE Vector Shape - Path");
      
      path.property("ADBE Vector Path").expression =
        "var verts = [];\\n" +
        "for (var j = 0; j <= 20; j++) {\\n" +
        "  var x = -500 + j * 50;\\n" +
        "  var wave = Math.sin(j * 0.4 + time * 2) * 55;\\n" +
        "  verts.push([x, wave]);\\n" +
        "}\\n" +
        "var shp = new Shape();\\n" +
        "shp.vertices = verts; shp.closed = false; shp;";
        
      var stroke = vecs.addProperty("ADBE Vector Graphic - Stroke");
      stroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
      stroke.property("ADBE Vector Stroke Width").setValue(1.5);
    }
  `, opts.outputAepPath);
}

// 7. Trapcode Tao
export function generateTaoReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Tao 3D Spline Ribbons");
    var ribbon = comp.layers.addShape();
    ribbon.name = "Tao_3D_Ribbon";
    ribbon.threeDLayer = true;
    ribbon.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    ribbon.blendingMode = BlendingMode.ADD;

    var root = ribbon.property("ADBE Root Vectors Group");
    var segments = 15;
    for (var s = 0; s < segments; s++) {
      var gp = root.addProperty("ADBE Vector Group");
      gp.name = "Seg_" + s;
      var vecs = gp.property("ADBE Vectors Group");
      var ell = vecs.addProperty("ADBE Vector Shape - Ellipse");
      ell.property("ADBE Vector Ellipse Size").setValue([45 - s*2, 45 - s*2]);
      var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});

      var t = gp.property("ADBE Vector Transform Group");
      var pos = t.property("ADBE Vector Position");
      pos.setValue([(s - segments/2)*30, 0]);
      pos.expression = "var y = Math.sin(time * 3 + " + s + " * 0.3) * 110; [value[0], y];";
    }
  `, opts.outputAepPath);
}

// 8. Trapcode Form
export function generateFormReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode Form 3D Particle Grid");
    var grid = comp.layers.addShape();
    grid.name = "Form_3D_Particle_Grid";
    grid.threeDLayer = true;
    grid.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    grid.blendingMode = BlendingMode.ADD;

    var root = grid.property("ADBE Root Vectors Group");
    var count = 12;
    for (var x = 0; x < count; x++) {
      for (var y = 0; y < count; y++) {
        var gp = root.addProperty("ADBE Vector Group");
        gp.name = "Point_" + x + "_" + y;
        var vecs = gp.property("ADBE Vectors Group");
        var ell = vecs.addProperty("ADBE Vector Shape - Ellipse");
        ell.property("ADBE Vector Ellipse Size").setValue([5, 5]);
        var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});

        var t = gp.property("ADBE Vector Transform Group");
        var xPos = (x - count/2)*40;
        var yPos = (y - count/2)*40;
        t.property("ADBE Vector Position").setValue([xPos, yPos]);
        t.property("ADBE Vector Scale").expression = 
          "var dist = length(transform.position + value - [0,0]);\\n" +
          "var w = Math.sin(time*2 + dist*0.01) * 45;\\n" +
          "[100 + w, 100 + w];";
      }
    }
  `, opts.outputAepPath);
}

// 9. Video Copilot Optical Flares
export function generateOpticalFlaresReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Video Copilot Optical Flares");
    var flare = comp.layers.addSolid([0,0,0], "Optical_Flares_Replica", cw, ch, 1, dur);
    flare.blendingMode = BlendingMode.ADD;
    var lf = flare.property("ADBE Effect Parade").addProperty("ADBE Lens Flare");
    if (lf) {
      try {
        lf.property("Flare Center").expression = "[thisComp.width/2 + Math.sin(time)*200, thisComp.height/2];";
        lf.property("Flare Brightness").setValue(115);
      } catch(e) {}
    }

    var streak = comp.layers.addShape();
    streak.name = "Anamorphic_Streak";
    streak.blendingMode = BlendingMode.ADD;
    var sRoot = streak.property("ADBE Root Vectors Group");
    var sEll = sRoot.addProperty("ADBE Vector Shape - Ellipse");
    sEll.property("ADBE Vector Ellipse Size").setValue([cw * 0.9, 12]);
    var sFill = sRoot.addProperty("ADBE Vector Graphic - Fill");
    sFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
    
    streak.property("ADBE Transform Group").property("ADBE Position").expression = "thisComp.layer(\"Optical_Flares_Replica\").effect(\"Lens Flare\")(\"Flare Center\");";
    
    var sBlur = streak.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
    if (sBlur) {
      try { sBlur.property("Blur Radius").setValue(25); sBlur.property("Blur Dimensions").setValue(2); } catch(e){}
    }
  `, opts.outputAepPath);
}

// 10. Video Copilot Element 3D
export function generateElement3DReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Video Copilot Element 3D Shape Extrusion");
    var model = comp.layers.addShape();
    model.name = "Extruded_Model";
    model.threeDLayer = true;
    model.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    
    var root = model.property("ADBE Root Vectors Group");
    var gp = root.addProperty("ADBE Vector Group");
    var vecs = gp.property("ADBE Vectors Group");
    var poly = vecs.addProperty("ADBE Vector Shape - Star"); // star polygon model
    poly.property("ADBE Vector Star Points").setValue(5);
    poly.property("ADBE Vector Star Outer Radius").setValue(150);
    
    var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});

    // Simulated extrusion depth using multiple layers or duplicate vectors offset in Z space
    // Native shape layers can extrude in ray-traced 3D / Cinema4D comp renderer
    try {
      comp.renderer = "ADBE Cinema 4D Launcher"; // Extrusion renderer
      model.geometryOption.depth.setValue(45);
    } catch(e) {
      // Fallback repeater offset
      var rep = vecs.addProperty("ADBE Vector Filter - Repeater");
      rep.property("ADBE Vector Repeater Copies").setValue(15);
      rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 0]);
      rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Scale").setValue([98, 98]);
    }
    
    var rotY = model.property("ADBE Transform Group").property("ADBE Rotate Y");
    if (rotY) rotY.expression = "time * 45;";
  `, opts.outputAepPath);
}

// 11. Red Giant Universe Glitch
export function generateGlitchReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Red Giant Universe Glitch");
    var src = comp.layers.addSolid([0.2, 0.4, 0.6], "Glitch_Source", cw, ch, 1, dur);
    
    var adj = comp.layers.addSolid([1,1,1], "Glitch_Adjustment", cw, ch, 1, dur);
    try { adj.adjustmentLayer = true; } catch(e){}
    
    var displacement = adj.property("ADBE Effect Parade").addProperty("ADBE Displacement Map");
    if (displacement) {
      try {
        displacement.property("Max Horizontal Displacement").expression = "wiggle(12, 45)[0];";
        displacement.property("Max Vertical Displacement").setValue(0);
      } catch(e) {}
    }
    var noise = adj.property("ADBE Effect Parade").addProperty("ADBE Noise");
    if (noise) {
      try { noise.property("ADBE Noise-0001").expression = "wiggle(15, 12)[0];"; } catch(e){}
    }
  `, opts.outputAepPath);
}

// 12. Red Giant Universe Chromatic Aberration
export function generateChromaticAberrationReplicaJsx(opts: { outputAepPath: string; shift: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Universe Chromatic Aberration");
    var base = comp.layers.addSolid([0.2, 0.2, 0.2], "Image_Base", cw, ch, 1, dur);

    // Channel separation (RGB Split)
    var rLayer = comp.layers.addSolid([0,0,0], "Channel_Red", cw, ch, 1, dur);
    rLayer.blendingMode = BlendingMode.ADD;
    var tr = rLayer.property("ADBE Transform Group").property("ADBE Position");
    tr.setValue([cw/2 - ${opts.shift}, ch/2]);
    var rFill = rLayer.property("ADBE Effect Parade").addProperty("ADBE Tint");
    rFill.property("Map White To").setValue([1, 0, 0]);

    var bLayer = comp.layers.addSolid([0,0,0], "Channel_Blue", cw, ch, 1, dur);
    bLayer.blendingMode = BlendingMode.ADD;
    var tb = bLayer.property("ADBE Transform Group").property("ADBE Position");
    tb.setValue([cw/2 + ${opts.shift}, ch/2]);
    var bFill = bLayer.property("ADBE Effect Parade").addProperty("ADBE Tint");
    bFill.property("Map White To").setValue([0, 0, 1]);
  `, opts.outputAepPath);
}

// 13. Red Giant Universe Heatwave
export function generateHeatwaveReplicaJsx(opts: { outputAepPath: string; speed: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Universe Heatwave Refraction");
    var base = comp.layers.addSolid([0.3, 0.1, 0.1], "Volcano_Base", cw, ch, 1, dur);
    
    var heat = comp.layers.addSolid([1,1,1], "Heat_Warp_Adjustment", cw, ch, 1, dur);
    try { heat.adjustmentLayer = true; } catch(e){}
    
    var wave = heat.property("ADBE Effect Parade").addProperty("ADBE Wave Warp");
    if (wave) {
      try {
        wave.property("Wave Height").setValue(15);
        wave.property("Wave Width").setValue(80);
        wave.property("Wave Speed").setValue(${opts.speed * 2.5});
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 14. Red Giant Universe VHS
export function generateVhsReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Universe VHS Analog Tape");
    var base = comp.layers.addSolid([0.15, 0.15, 0.15], "Footage", cw, ch, 1, dur);
    
    var vhs = comp.layers.addSolid([1,1,1], "VHS_Tape_Simulation", cw, ch, 1, dur);
    try { vhs.adjustmentLayer = true; } catch(e){}
    
    var grid = vhs.property("ADBE Effect Parade").addProperty("ADBE Grid");
    if (grid) {
      try {
        grid.property("Size From").setValue(2);
        grid.property("Height").setValue(4);
        grid.property("Border").setValue(1);
        grid.property("Color").setValue([0,0,0]);
        grid.property("Blending Mode").setValue(3); // Multiply
      } catch(e) {}
    }
    
    var noise = vhs.property("ADBE Effect Parade").addProperty("ADBE Noise");
    if (noise) {
      try { noise.property("ADBE Noise-0001").setValue(10); } catch(e){}
    }
  `, opts.outputAepPath);
}

// 15. Red Giant Universe Looks
export function generateLooksReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Universe Looks Creative Grade");
    var base = comp.layers.addSolid([0.4, 0.4, 0.4], "Footage", cw, ch, 1, dur);
    
    var looks = comp.layers.addSolid([1,1,1], "Looks_Color_Grade", cw, ch, 1, dur);
    try { looks.adjustmentLayer = true; } catch(e){}
    
    var curves = looks.property("ADBE Effect Parade").addProperty("ADBE CurvesCustom");
    var saturation = looks.property("ADBE Effect Parade").addProperty("ADBE HUE SATURATION");
    if (saturation) {
      try { saturation.property("ADBE HUE SATURATION-0002").setValue(125); } catch(e){} // Boost saturation
    }
  `, opts.outputAepPath);
}

// 16. Red Giant Universe Colorista
export function generateColoristaReplicaJsx(opts: { outputAepPath: string; shadows: number[]; highlights: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Colorista 3-way Grading");
    var base = comp.layers.addSolid([0.4, 0.4, 0.4], "Footage", cw, ch, 1, dur);
    
    var grade = comp.layers.addSolid([1,1,1], "Colorista_Grade", cw, ch, 1, dur);
    try { grade.adjustmentLayer = true; } catch(e){}
    
    var balance = grade.property("ADBE Effect Parade").addProperty("ADBE Color Balance");
    if (balance) {
      try {
        balance.property("Red Balance").setValue(${opts.shadows[0] * 20});
        balance.property("Blue Balance").setValue(${opts.highlights[2] * 20});
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 17. RE:Vision Effects Twixtor
export function generateTwixtorReplicaJsx(opts: { outputAepPath: string; slowPercent: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Twixtor Optical Flow Slow Motion");
    var clip = comp.layers.addSolid([0.2, 0.2, 0.25], "Video_Clip", cw, ch, 1, dur);
    
    var twixtor = clip.property("ADBE Effect Parade").addProperty("ADBE Timewarp");
    if (twixtor) {
      try {
        twixtor.property("Speed").setValue(${opts.slowPercent});
        twixtor.property("Method").setValue(3); // Pixel Motion Interpolation
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 18. RE:Vision Effects RSMB
export function generateRsmbReplicaJsx(opts: { outputAepPath: string; blurAmount: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating RSMB Pixel Motion Blur");
    var moving = comp.layers.addSolid([0.8, 0.1, 0.1], "Fast_Object", 200, 200, 1, dur);
    moving.property("ADBE Transform Group").property("ADBE Position").expression = "wiggle(15, 400);";
    
    var rsmb = comp.layers.addSolid([1,1,1], "RSMB_Motion_Blur", cw, ch, 1, dur);
    try { rsmb.adjustmentLayer = true; } catch(e){}
    
    var forceBlur = rsmb.property("ADBE Effect Parade").addProperty("ADBE Pixel Motion Blur");
    if (forceBlur) {
      try {
        forceBlur.property("Shutter Angle").setValue(${opts.blurAmount * 180});
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 19. Sapphire Glow
export function generateSapphireGlowReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sapphire Glow Exponential Decay");
    var text = comp.layers.addText("SAPPHIRE GLOW");
    text.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // Stack multiple fast box blurs to create exponential dropoff
    var glowCol = ${jlit(opts.color)};
    var passes = [10, 40, 120, 320];
    for (var p = 0; p < passes.length; p++) {
      var blurLayer = comp.layers.addText("SAPPHIRE GLOW");
      blurLayer.name = "Glow_Pass_" + p;
      blurLayer.blendingMode = BlendingMode.ADD;
      blurLayer.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
      
      try {
        var tDoc = blurLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tDoc.value; td.fillColor = glowCol; tDoc.setValue(td);
      } catch(e) {}

      var fbb = blurLayer.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
      if (fbb) {
        fbb.property("Blur Radius").setValue(passes[p]);
      }
    }
  `, opts.outputAepPath);
}

// 20. Sapphire Zap
export function generateSapphireZapReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sapphire Zap Electrical Strike");
    var zap = comp.layers.addSolid([0,0,0], "Sapphire_Zap_Strike", cw, ch, 1, dur);
    zap.blendingMode = BlendingMode.ADD;
    
    var strike = zap.property("ADBE Effect Parade").addProperty("ADBE Advanced Lightning");
    if (strike) {
      try {
        strike.property("Lightning Type").setValue(1); // Strike
        strike.property("Origin").setValue([cw/2, 0]);
        strike.property("Direction").setValue([cw/2, ch * 0.85]);
        strike.property("Glow Color").setValue(${jlit(opts.color)});
        strike.property("State/Conduction").expression = "time * 20;";
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 21. Sapphire Distort
export function generateSapphireDistortReplicaJsx(opts: { outputAepPath: string; warp: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sapphire Distort Lens Warp");
    var base = comp.layers.addSolid([0.3, 0.3, 0.4], "Footage", cw, ch, 1, dur);
    
    var distort = comp.layers.addSolid([1,1,1], "Lens_Distort_Adjustment", cw, ch, 1, dur);
    try { distort.adjustmentLayer = true; } catch(e){}
    
    var optics = distort.property("ADBE Effect Parade").addProperty("ADBE Optics Compensation");
    if (optics) {
      try {
        optics.property("FOV").setValue(${opts.warp * 60});
        optics.property("Reverse Lens Distortion").setValue(1);
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 22. Boris FX Continuum Bloom
export function generateContinuumBloomReplicaJsx(opts: { outputAepPath: string; intensity: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Continuum Light Bloom");
    var text = comp.layers.addText("BLOOM");
    text.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    var bloom = comp.layers.addSolid([1,1,1], "Bloom_Pass", cw, ch, 1, dur);
    try { bloom.adjustmentLayer = true; } catch(e){}
    bloom.blendingMode = BlendingMode.ADD;
    
    var thresh = bloom.property("ADBE Effect Parade").addProperty("ADBE Threshold2");
    if (thresh) {
      try { thresh.property("ADBE Threshold2-0001").setValue(180); } catch(e){}
    }
    var fbb = bloom.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
    if (fbb) {
      try { fbb.property("Blur Radius").setValue(65); } catch(e){}
    }
    
    var op = bloom.property("ADBE Transform Group").property("ADBE Opacity");
    if (op) {
      op.setValue(${opts.intensity * 70});
    }
  `, opts.outputAepPath);
}

// 23. Boris FX Continuum Kaleidoscope
export function generateContinuumKaleidoscopeReplicaJsx(opts: { outputAepPath: string; sectors: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Continuum Mirror Kaleidoscope");
    var shape = comp.layers.addShape();
    var sRoot = shape.property("ADBE Root Vectors Group");
    var ell = sRoot.addProperty("ADBE Vector Shape - Ellipse");
    var fill = sRoot.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([1, 0, 0.4]);
    shape.property("ADBE Transform Group").property("ADBE Position").expression = "wiggle(1, 200);";

    var mirror = comp.layers.addSolid([1,1,1], "Kaleidoscope_Adjustment", cw, ch, 1, dur);
    try { mirror.adjustmentLayer = true; } catch(e){}

    // Stack mirror passes to create geometric sector repetitions
    var numSectors = ${opts.sectors};
    for (var m = 0; m < numSectors; m++) {
      var mirFx = mirror.property("ADBE Effect Parade").addProperty("ADBE Mirror");
      if (mirFx) {
        try {
          mirFx.property("Reflection Center").setValue([cw/2, ch/2]);
          mirFx.property("Reflection Angle").setValue(m * (360/numSectors));
        } catch(e) {}
      }
    }
  `, opts.outputAepPath);
}

// 24. Aescripts Deep Glow
export function generateDeepGlowReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Aescripts Deep Glow Physically Accurate Glow");
    var text = comp.layers.addText("DEEP GLOW NATIVE");
    text.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // Create 6-pass blur structure screen-blended over base
    var glowColor = ${jlit(opts.color)};
    var passes = [4, 12, 36, 108, 324, 600];
    for (var p = 0; p < passes.length; p++) {
      var gp = comp.layers.addText("DEEP GLOW NATIVE");
      gp.name = "Deep_Glow_Pass_" + p;
      gp.blendingMode = BlendingMode.ADD;
      gp.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
      
      try {
        var tDoc = gp.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tDoc.value; td.fillColor = glowColor; tDoc.setValue(td);
      } catch(e) {}

      var fbb = gp.property("ADBE Effect Parade").addProperty("ADBE Fast Box Blur");
      if (fbb) {
        fbb.property("Blur Radius").setValue(passes[p]);
      }
      var op = gp.property("ADBE Transform Group").property("ADBE Opacity");
      if (op) op.setValue(35);
    }
  `, opts.outputAepPath);
}

// 25. Aescripts Newton Physics
export function generateNewtonReplicaJsx(opts: { outputAepPath: string; gravity: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Newton 2D Physics Simulator");
    var ball = comp.layers.addShape();
    ball.name = "Newton_Physics_Ball";
    var bRoot = ball.property("ADBE Root Vectors Group");
    var ell = bRoot.addProperty("ADBE Vector Shape - Ellipse");
    ell.property("ADBE Vector Ellipse Size").setValue([100, 100]);
    var fill = bRoot.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([0, 0.8, 1]);

    var pos = ball.property("ADBE Transform Group").property("ADBE Position");
    if (pos) {
      // Native gravity bounce expression
      pos.expression = 
        "var g = " + (${opts.gravity * 380}) + ";\\n" +
        "var y0 = 150;\\n" +
        "var t = time;\\n" +
        "var v0 = 0;\\n" +
        "var bounce = 0.72;\\n" +
        "var period = Math.sqrt(2 * (thisComp.height - 250 - y0) / g);\\n" +
        "var y = y0 + 0.5 * g * t * t;\\n" +
        "if (y > thisComp.height - 100) {\\n" +
        "  y = thisComp.height - 100 - Math.abs(Math.sin(time * 5) * 200 * Math.exp(-time * 0.8));\\n" +
        "}\\n" +
        "[thisComp.width/2, y];";
    }
  `, opts.outputAepPath);
}

// 26. Aescripts Stardust
export function generateStardustReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Stardust Node-based 3D Particles");
    var stardust = comp.layers.addSolid([0,0,0], "Stardust_Particles", cw, ch, 1, dur);
    stardust.blendingMode = BlendingMode.ADD;
    
    var world = stardust.property("ADBE Effect Parade").addProperty("CC Particle World");
    if (world) {
      try {
        world.property("Birth Rate").setValue(6.0);
        world.property("Longevity (sec)").setValue(1.5);
        world.property("Particle").property("Particle Type").setValue(4); // Faded Sphere
        world.property("Particle").property("Birth Color").setValue(${jlit(opts.color)});
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 27. Aescripts Joysticks 'n Sliders
export function generateJoysticksSlidersReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Joysticks n Sliders Rigging Control");
    var controller = comp.layers.addNull(dur);
    controller.name = "Joystick_Null";
    
    var sliderX = controller.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    sliderX.name = "Joystick X";
    var sliderY = controller.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    sliderY.name = "Joystick Y";

    sliderX.property("Slider").setValue(25);
    sliderY.property("Slider").setValue(-15);

    var head = comp.layers.addSolid([0.8, 0.7, 0.6], "Character_Head", 300, 300, 1, dur);
    head.property("ADBE Transform Group").property("ADBE Position").expression = 
      "var xOffset = thisComp.layer(\"Joystick_Null\").effect(\"Joystick X\")(\"Slider\");\\n" +
      "var yOffset = thisComp.layer(\"Joystick_Null\").effect(\"Joystick Y\")(\"Slider\");\\n" +
      "[thisComp.width/2 + xOffset * 3, thisComp.height/2 + yOffset * 3];";
  `, opts.outputAepPath);
}

// 28. Aescripts AutoCrop
export function generateAutoCropReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating AutoCrop Utility Script");
    // Standalone utility script crop logic inside JSX
    var target = comp.layers.addSolid([0.4, 0.6, 0.8], "Target_Solid", 200, 200, 1, dur);
    target.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);

    // Crop comp dimensions to match content layers bounding box
    comp.width = 300;
    comp.height = 300;
    target.property("ADBE Transform Group").property("ADBE Position").setValue([150, 150]);
  `, opts.outputAepPath);
}

// 29. Aescripts Paint & Stick
export function generatePaintStickReplicaJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Paint & Stick Path Strokes");
    var paint = comp.layers.addShape();
    paint.name = "Paint_Brush_Stroke";
    
    var root = paint.property("ADBE Root Vectors Group");
    var path = root.addProperty("ADBE Vector Shape - Path");
    var stroke = root.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
    stroke.property("ADBE Vector Stroke Width").setValue(16);

    var s = new Shape();
    s.vertices = [[300, 300], [450, 600], [900, 200], [1300, 800]];
    s.closed = false;
    path.property("ADBE Vector Path").setValue(s);

    var trim = root.addProperty("ADBE Vector Filter - Trim");
    if (trim) {
      try {
        var trimEnd = trim.property("ADBE Vector Trim End");
        trimEnd.setValueAtTime(0, 0);
        trimEnd.setValueAtTime(3.5, 100);
        MP.setEase(trimEnd, "expoOut");
      } catch(e) {}
    }
  `, opts.outputAepPath);
}

// 30. Aescripts Sound Keys
export function generateSoundKeysReplicaJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sound Keys Audio Spectrum Splitter");
    var audio = comp.layers.addSolid([0,0,0], "Audio_Track_Placeholder", 100, 100, 1, dur);
    audio.enabled = false;

    var keys = comp.layers.addNull(dur);
    keys.name = "Sound_Keys_Controller";
    
    var bass = keys.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    bass.name = "Bass Frequency Output";
    bass.property("Slider").expression = "10 + Math.abs(sin(time * 8) * 45) + random(0, 5);";

    var treble = keys.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    treble.name = "Treble Frequency Output";
    treble.property("Slider").expression = "5 + Math.abs(cos(time * 16) * 35) + random(0, 3);";
  `, opts.outputAepPath);
}

// 31. Frischluft Lenscare DOF
export function generateLenscareDofReplicaJsx(opts: { outputAepPath: string; blur: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Frischluft Lenscare Depth of Field");
    var solid3d = comp.layers.addSolid([0.3, 0.4, 0.5], "3D_Solid", 400, 400, 1, dur);
    solid3d.threeDLayer = true;
    solid3d.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 200]);

    var cam = comp.layers.addCamera("CinemaCam", [cw/2, ch/2]);
    try {
      cam.cameraOption.depthOfField.setValue(1); // Enable DoF
      cam.cameraOption.focusDistance.setValue(1000);
      cam.cameraOption.aperture.setValue(${opts.blur * 22});
    } catch(e) {}
  `, opts.outputAepPath);
}

// 32. Mocha Pro Planar Tracker & Cleanup
export function generatePlanarTrackerJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Mocha Pro Planar Tracker & Cleanup");
    var trackerTL = comp.layers.addNull(dur); trackerTL.name = "Mocha_TL";
    var trackerTR = comp.layers.addNull(dur); trackerTR.name = "Mocha_TR";
    var trackerBL = comp.layers.addNull(dur); trackerBL.name = "Mocha_BL";
    var trackerBR = comp.layers.addNull(dur); trackerBR.name = "Mocha_BR";
    
    trackerTL.property("Transform").property("Position").setValue([400, 300]);
    trackerTR.property("Transform").property("Position").setValue([1500, 300]);
    trackerBL.property("Transform").property("Position").setValue([400, 800]);
    trackerBR.property("Transform").property("Position").setValue([1500, 800]);
    
    trackerTL.property("Transform").property("Position").expression = "wiggle(0.7, 80);";
    trackerTR.property("Transform").property("Position").expression = "wiggle(0.7, 80);";
    trackerBL.property("Transform").property("Position").expression = "wiggle(0.7, 80);";
    trackerBR.property("Transform").property("Position").expression = "wiggle(0.7, 80);";
    
    var screenLayer = comp.layers.addSolid([0.2, 0.8, 0.4], "Screen_Insert", 1000, 600, 1, dur);
    var cornerPin = screenLayer.property("Effects").addProperty("ADBE Corner Pin");
    if (cornerPin) {
      cornerPin.property("Upper Left").expression = "thisComp.layer(\"Mocha_TL\").transform.position;";
      cornerPin.property("Upper Right").expression = "thisComp.layer(\"Mocha_TR\").transform.position;";
      cornerPin.property("Lower Left").expression = "thisComp.layer(\"Mocha_BL\").transform.position;";
      cornerPin.property("Lower Right").expression = "thisComp.layer(\"Mocha_BR\").transform.position;";
    }
    
    var cleanPlate = comp.layers.addSolid([0.1, 0.1, 0.1], "Clean_Plate_Source", cw, ch, 1, dur);
    cleanPlate.property("Transform").property("Position").expression = "value + [50, 0];";
  `, opts.outputAepPath);
}

// 33. Silhouette Roto Paint & Wire Clean
export function generateRotoPaintJsx(opts: { outputAepPath: string }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Silhouette Roto Paint");
    var footage = comp.layers.addSolid([0.2, 0.2, 0.3], "Footage_Source", cw, ch, 1, dur);
    
    var rotoMatte = comp.layers.addShape();
    rotoMatte.name = "Roto_Paint_Matte";
    var root = rotoMatte.property("ADBE Root Vectors Group");
    var gp = root.addProperty("ADBE Vector Group");
    var vecs = gp.property("ADBE Vectors Group");
    var path = vecs.addProperty("ADBE Vector Shape - Path");
    
    var s = new Shape();
    s.vertices = [[-150, -150], [150, -150], [100, 100], [-100, 100]];
    s.closed = true;
    path.property("ADBE Vector Path").setValue(s);
    path.property("ADBE Vector Path").expression = "var s = value; var t = time; s.vertices = [[-150 + Math.sin(t)*60, -150], [150 + Math.cos(t)*60, -150], [100, 100], [-100, 100]]; s;";
    
    var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    
    var cleanupWire = comp.layers.addSolid([0.2, 0.2, 0.3], "Wire_Removal_Clone", cw, ch, 1, dur);
    cleanupWire.property("Transform").property("Position").setValue([cw/2, ch/2]);
    try {
      cleanupWire.property("Transform").property("Position").expression = "thisComp.layer(\"Footage_Source\").transform.position + [0, 15];";
    } catch(e) {}
  `, opts.outputAepPath);
}

// 34. Neat Video Denoise
export function generateNeatDenoiseJsx(opts: { outputAepPath: string; sharpness: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Neat Video Noise Denoise");
    var noisy = comp.layers.addSolid([0.15, 0.15, 0.15], "Noisy_Footage", cw, ch, 1, dur);
    var noisyEffect = noisy.property("Effects").addProperty("ADBE Noise");
    if (noisyEffect) {
      noisyEffect.property("Noise Amount").setValue(25);
    }
    
    var denoiser = comp.layers.addSolid([1,1,1], "Denoised_Output", cw, ch, 1, dur);
    try { denoiser.adjustmentLayer = true; } catch(e){}
    
    var median = denoiser.property("Effects").addProperty("ADBE Median");
    if (median) {
      median.property("Radius").setValue(2);
    }
    var blur = denoiser.property("Effects").addProperty("ADBE Fast Box Blur");
    if (blur) {
      blur.property("Blur Radius").setValue(1);
    }
    var unsharp = denoiser.property("Effects").addProperty("ADBE Unsharp Mask");
    if (unsharp) {
      unsharp.property("Amount").setValue(${opts.sharpness * 90});
      unsharp.property("Radius").setValue(1.5);
    }
  `, opts.outputAepPath);
}

// 35. Sapphire Rays Volumetric Sweeps
export function generateVolumetricRaysJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sapphire Rays Volumetric Sweeps");
    var baseText = comp.layers.addText("RAYS SOURCE");
    baseText.property("Transform").property("Position").setValue([cw/2, ch/2]);
    
    var raySourceNull = comp.layers.addNull(dur);
    raySourceNull.name = "Ray_Source_Point";
    raySourceNull.property("Transform").property("Position").expression = "[thisComp.width/2 + Math.sin(time)*300, thisComp.height/2 + Math.cos(time)*150];";
    
    var raySolid = comp.layers.addSolid([0,0,0], "Sapphire_Rays_Layer", cw, ch, 1, dur);
    raySolid.blendingMode = BlendingMode.ADD;
    
    var ccRays = raySolid.property("Effects").addProperty("CC Light Rays");
    if (ccRays) {
      try {
        ccRays.property("Center").expression = "thisComp.layer(\"Ray_Source_Point\").transform.position;";
        ccRays.property("Intensity").setValue(150);
        ccRays.property("Warp Softness").setValue(65);
      } catch(e) {}
    }
    
    var colorFx = raySolid.property("Effects").addProperty("ADBE Tint");
    if (colorFx) {
      colorFx.property("Map White To").setValue(${jlit(opts.color)});
    }
  `, opts.outputAepPath);
}

// 36. Sapphire Flare Cinematic Flares
export function generateCinematicFlareJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Sapphire Flare Lens Flares");
    var lightSource = comp.layers.addNull(dur);
    lightSource.name = "Light_Source_Null";
    lightSource.property("Transform").property("Position").expression = "[thisComp.width/2 + Math.sin(time * 1.5) * 400, thisComp.height/2 + Math.cos(time * 0.8) * 200];";
    
    var flareLayer = comp.layers.addSolid([0,0,0], "Lens_Flare_Core", cw, ch, 1, dur);
    flareLayer.blendingMode = BlendingMode.ADD;
    var lf = flareLayer.property("Effects").addProperty("ADBE Lens Flare");
    if (lf) {
      try {
        lf.property("Flare Center").expression = "thisComp.layer(\"Light_Source_Null\").transform.position;";
        lf.property("Flare Brightness").setValue(130);
      } catch(e){}
    }
    
    var streak = comp.layers.addShape();
    streak.name = "Anamorphic_Streak";
    streak.blendingMode = BlendingMode.ADD;
    var sRoot = streak.property("ADBE Root Vectors Group");
    var sEll = sRoot.addProperty("ADBE Vector Shape - Ellipse");
    sEll.property("ADBE Vector Ellipse Size").setValue([cw * 0.95, 15]);
    var sFill = sRoot.addProperty("ADBE Vector Graphic - Fill");
    sFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
    
    streak.property("Transform").property("Position").expression = "thisComp.layer(\"Light_Source_Null\").transform.position;";
    var sBlur = streak.property("Effects").addProperty("ADBE Fast Box Blur");
    if (sBlur) {
      sBlur.property("Blur Radius").setValue(35);
      sBlur.property("Blur Dimensions").setValue(2);
    }
    
    var irisElements = 5;
    for (var i = 1; i <= irisElements; i++) {
      var iris = comp.layers.addShape();
      iris.name = "Iris_Ring_" + i;
      iris.blendingMode = BlendingMode.ADD;
      var iRoot = iris.property("ADBE Root Vectors Group");
      var iPol = iRoot.addProperty("ADBE Vector Shape - Star");
      iPol.property("ADBE Vector Polystar Type").setValue(2);
      iPol.property("Points").setValue(6);
      iPol.property("Outer Radius").setValue(20 + i * 15);
      
      var iFill = iRoot.addProperty("ADBE Vector Graphic - Fill");
      iFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
      
      var iTrans = iris.property("Transform");
      iTrans.property("Position").expression = 
        "var c = [thisComp.width/2, thisComp.height/2];\\n" +
        "var p = thisComp.layer(\"Light_Source_Null\").transform.position;\\n" +
        "c + (p - c) * " + (-0.3 * i) + ";";
      
      var iBlur = iris.property("Effects").addProperty("ADBE Fast Box Blur");
      if (iBlur) { iBlur.property("Blur Radius").setValue(10); }
      iris.property("Transform").property("Opacity").setValue(15);
    }
  `, opts.outputAepPath);
}

// 37. Crates God Rays Volumetric Sunbeams
export function generateGodRaysJsx(opts: { outputAepPath: string; threshold: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Crates God Rays Volumetric");
    var bg = comp.layers.addSolid([0.05, 0.05, 0.1], "Sky_BG", cw, ch, 1, dur);
    
    var sun = comp.layers.addShape();
    sun.name = "Sun_Source";
    var sunRoot = sun.property("ADBE Root Vectors Group");
    var sunEll = sunRoot.addProperty("ADBE Vector Shape - Ellipse");
    sunEll.property("ADBE Vector Ellipse Size").setValue([200, 200]);
    var sunFill = sunRoot.addProperty("ADBE Vector Graphic - Fill");
    sunFill.property("ADBE Vector Fill Color").setValue([1, 0.9, 0.7]);
    sun.property("Transform").property("Position").setValue([cw/2, ch * 0.3]);
    sun.property("Transform").property("Position").expression = "[thisComp.width/2, thisComp.height * 0.3 + Math.sin(time) * 100];";
    
    var godRays = comp.layers.addSolid([1,1,1], "God_Rays_Adjustment", cw, ch, 1, dur);
    try { godRays.adjustmentLayer = true; } catch(e){}
    
    var thresh = godRays.property("Effects").addProperty("ADBE Threshold2");
    if (thresh) {
      thresh.property("Threshold").setValue(${opts.threshold * 255});
    }
    
    var fastBlur = godRays.property("Effects").addProperty("ADBE Fast Box Blur");
    if (fastBlur) {
      fastBlur.property("Blur Radius").setValue(20);
    }
    
    var radialBlur = godRays.property("Effects").addProperty("ADBE CC Radial Fast Blur");
    if (radialBlur) {
      try {
        radialBlur.property("Center").expression = "thisComp.layer(\"Sun_Source\").transform.position;";
        radialBlur.property("Amount").setValue(95);
      } catch(e){}
    }
    
    var tritone = godRays.property("Effects").addProperty("CC Toner");
    if (tritone) {
      try {
        tritone.property("Highlights").setValue([1.0, 0.85, 0.4]);
        tritone.property("Midtones").setValue([0.2, 0.7, 0.8]);
        tritone.property("Shadows").setValue([0.0, 0.0, 0.05]);
      } catch(e){}
    }
  `, opts.outputAepPath);
}

// 38. Crates Light Wrap Compositing Edge Wrap
export function generateLightWrapJsx(opts: { outputAepPath: string; wrapWidth: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Crates Light Wrap Compositing");
    var bg = comp.layers.addSolid([0.1, 0.4, 0.8], "Background_Sky", cw, ch, 1, dur);
    var bgGrad = bg.property("Effects").addProperty("ADBE Ramp");
    if (bgGrad) {
      bgGrad.property("Start Color").setValue([0, 0.6, 1]);
      bgGrad.property("End Color").setValue([1, 0.4, 0.2]);
    }
    
    var fg = comp.layers.addSolid([0.2, 0.2, 0.2], "Foreground_Matte", 400, 700, 1, dur);
    fg.property("Transform").property("Position").setValue([cw/2, ch/2 + 100]);
    fg.property("Transform").property("Position").expression = "[thisComp.width/2 + Math.sin(time)*150, thisComp.height/2 + 100];";
    
    var wrapLayer = comp.layers.addSolid([0,0,0], "Crates_Light_Wrap_Overlay", cw, ch, 1, dur);
    wrapLayer.blendingMode = BlendingMode.ADD;
    
    var edgeBlur = wrapLayer.property("Effects").addProperty("ADBE Fast Box Blur");
    if (edgeBlur) {
      edgeBlur.property("Blur Radius").setValue(${opts.wrapWidth * 30});
    }
    
    wrapLayer.property("Transform").property("Opacity").expression = 
      "var fgPos = thisComp.layer(\"Foreground_Matte\").transform.position;\\n" +
      "var dist = length(transform.position - fgPos);\\n" +
      "dist < 400 ? ease(dist, 200, 400, 80, 0) : 0;";
  `, opts.outputAepPath);
}

// 39. Deep Glow 2 Aspect & Chroma Glow
export function generateDeepGlowProJsx(opts: { outputAepPath: string; color: number[]; aspect: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Deep Glow 2 High-End Physical Glow");
    var baseText = comp.layers.addText("DEEP GLOW V2");
    baseText.property("Transform").property("Position").setValue([cw/2, ch/2]);
    
    var glowColor = ${jlit(opts.color)};
    var passes = [4, 16, 64, 256, 768];
    var aspect = ${opts.aspect};
    
    for (var p = 0; p < passes.length; p++) {
      var gp = comp.layers.addText("DEEP GLOW V2");
      gp.name = "Deep_Glow_V2_Pass_" + p;
      gp.blendingMode = BlendingMode.ADD;
      gp.property("Transform").property("Position").setValue([cw/2, ch/2]);
      
      try {
        var tDoc = gp.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tDoc.value; td.fillColor = glowColor; tDoc.setValue(td);
      } catch(e) {}
      
      var fbb = gp.property("Effects").addProperty("ADBE Fast Box Blur");
      if (fbb) {
        fbb.property("Blur Radius").setValue(passes[p]);
        fbb.property("Blur Dimensions").setValue(3);
      }
      gp.property("Transform").property("Scale").setValue([100 * aspect, 100 / aspect]);
      
      var op = gp.property("Transform").property("Opacity");
      if (op) {
        op.setValue(35 * Math.pow(0.5, p));
      }
    }
  `, opts.outputAepPath);
}

// 40. Knoll Light Factory Photorealistic Flare Elements
export function generateKnollFlareJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Knoll Light Factory Photorealistic Flare");
    var tracker = comp.layers.addNull(dur);
    tracker.name = "Knoll_Flare_Null";
    tracker.property("Transform").property("Position").expression = "[thisComp.width/2 + Math.sin(time*2.5)*300, thisComp.height/2 + Math.cos(time*1.2)*100];";
    
    var glowball = comp.layers.addShape();
    glowball.name = "Knoll_Glowball";
    glowball.blendingMode = BlendingMode.ADD;
    var gbRoot = glowball.property("ADBE Root Vectors Group");
    var gbEll = gbRoot.addProperty("ADBE Vector Shape - Ellipse");
    gbEll.property("ADBE Vector Ellipse Size").setValue([250, 250]);
    var gbFill = gbRoot.addProperty("ADBE Vector Graphic - Fill");
    gbFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
    glowball.property("Transform").property("Position").expression = "thisComp.layer(\"Knoll_Flare_Null\").transform.position;";
    var gbBlur = glowball.property("Effects").addProperty("ADBE Fast Box Blur");
    if (gbBlur) gbBlur.property("Blur Radius").setValue(80);
    
    var star = comp.layers.addShape();
    star.name = "Knoll_Sunburst";
    star.blendingMode = BlendingMode.ADD;
    var starRoot = star.property("ADBE Root Vectors Group");
    var starPoly = starRoot.addProperty("ADBE Vector Shape - Star");
    starPoly.property("ADBE Vector Polystar Type").setValue(1);
    starPoly.property("Points").setValue(32);
    starPoly.property("Inner Radius").setValue(25);
    starPoly.property("Outer Radius").setValue(260);
    
    var starFill = starRoot.addProperty("ADBE Vector Graphic - Fill");
    starFill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
    
    star.property("Transform").property("Position").expression = "thisComp.layer(\"Knoll_Flare_Null\").transform.position;";
    star.property("Transform").property("Rotation").expression = "time * 25;";
    var starBlur = star.property("Effects").addProperty("ADBE Fast Box Blur");
    if (starBlur) starBlur.property("Blur Radius").setValue(15);
    star.property("Transform").property("Opacity").setValue(30);
    
    var ring = comp.layers.addShape();
    ring.name = "Knoll_Ring";
    ring.blendingMode = BlendingMode.ADD;
    var ringRoot = ring.property("ADBE Root Vectors Group");
    var ringEll = ringRoot.addProperty("ADBE Vector Shape - Ellipse");
    ringEll.property("ADBE Vector Ellipse Size").setValue([400, 400]);
    var ringStroke = ringRoot.addProperty("ADBE Vector Graphic - Stroke");
    ringStroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
    ringStroke.property("ADBE Vector Stroke Width").setValue(4);
    
    ring.property("Transform").property("Position").expression = "thisComp.layer(\"Knoll_Flare_Null\").transform.position;";
    var ringBlur = ring.property("Effects").addProperty("ADBE Fast Box Blur");
    if (ringBlur) ringBlur.property("Blur Radius").setValue(12);
    ring.property("Transform").property("Opacity").setValue(20);
  `, opts.outputAepPath);
}

// 41. Element 3D v2 Mesh Engine & Lighting
export function generateElement3DProJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Video Copilot Element 3D v2 Mesh Engine");
    try {
      comp.renderer = "ADBE Cinema 4D Launcher";
    } catch(e){}
    
    var geometryCount = 6;
    for (var i = 0; i < geometryCount; i++) {
      var mesh = comp.layers.addShape();
      mesh.name = "Element_3D_Mesh_" + i;
      mesh.threeDLayer = true;
      
      var root = mesh.property("ADBE Root Vectors Group");
      var ell = root.addProperty("ADBE Vector Shape - Ellipse");
      ell.property("ADBE Vector Ellipse Size").setValue([120, 120]);
      var fill = root.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(${jlit(opts.color)});
      
      try {
        mesh.geometryOption.depth.setValue(80);
      } catch(e) {}
      
      mesh.property("Transform").property("Position").setValue([cw/2 + (i - geometryCount/2)*180, ch/2, 0]);
      mesh.property("Transform").property("Rotation Y").expression = "time * 45 + " + (i * 30) + ";";
    }
    
    var keyLight = comp.layers.addLight("Key_Light", [cw/2 - 300, ch/2 - 400, -500]);
    keyLight.lightType = LightType.DIRECTIONAL;
    keyLight.property("Transform").property("Intensity").setValue(95);
    
    var rimLight = comp.layers.addLight("Rim_Light", [cw/2 + 400, ch/2 + 300, 600]);
    rimLight.lightType = LightType.DIRECTIONAL;
    rimLight.property("Transform").property("Intensity").setValue(50);
    
    var cam = comp.layers.addCamera("E3D_Camera", [cw/2, ch/2]);
    cam.property("Transform").property("Position").expression = "wiggle(0.4, 150);";
  `, opts.outputAepPath);
}

// 42. Video Copilot Twitch Controller Glitches
export function generateTwitchGlitchJsx(opts: { outputAepPath: string; amount: number }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Video Copilot Twitch Controller");
    var bg = comp.layers.addSolid([0.15, 0.15, 0.25], "Footage_Static", cw, ch, 1, dur);
    
    var text = comp.layers.addText("TWITCH NATIVE");
    text.property("Transform").property("Position").setValue([cw/2, ch/2]);
    
    var controller = comp.layers.addNull(dur);
    controller.name = "Twitch_Controller";
    
    var sliderAmt = controller.property("Effects").addProperty("ADBE Slider Control");
    sliderAmt.name = "Twitch Amount";
    sliderAmt.property("Slider").setValue(${opts.amount * 50});
    
    var sliderSpd = controller.property("Effects").addProperty("ADBE Slider Control");
    sliderSpd.name = "Twitch Speed";
    sliderSpd.property("Slider").setValue(15);
    
    text.property("Transform").property("Position").expression = 
      "var amt = thisComp.layer(\"Twitch_Controller\").effect(\"Twitch Amount\")(\"Slider\");\\n" +
      "var spd = thisComp.layer(\"Twitch_Controller\").effect(\"Twitch Speed\")(\"Slider\");\\n" +
      "var w = wiggle(spd, amt);\\n" +
      "var trigger = random(0, 100);\\n" +
      "trigger > 85 ? [w[0], w[1]] : value;";
      
    text.property("Transform").property("Scale").expression = 
      "var amt = thisComp.layer(\"Twitch_Controller\").effect(\"Twitch Amount\")(\"Slider\");\\n" +
      "var trigger = random(0, 100);\\n" +
      "trigger > 90 ? [100 + amt/2, 100 + amt/2] : [100, 100];";
      
    var glitchAdj = comp.layers.addSolid([1,1,1], "Twitch_Adjustment", cw, ch, 1, dur);
    try { glitchAdj.adjustmentLayer = true; } catch(e){}
    
    var chromaticSplit = glitchAdj.property("Effects").addProperty("ADBE Displacement Map");
    if (chromaticSplit) {
      chromaticSplit.property("Max Horizontal Displacement").expression = 
        "var amt = thisComp.layer(\"Twitch_Controller\").effect(\"Twitch Amount\")(\"Slider\");\\n" +
        "random(0, 100) > 85 ? random(-amt, amt) : 0;";
    }
  `, opts.outputAepPath);
}

// 43. Trapcode 3D Stroke Spline
export function generateTrapcode3DStrokeJsx(opts: { outputAepPath: string; color: number[] }): string {
  return makeReplicaTemplate(`
    MP.log("Replicating Trapcode 3D Stroke Spline");
    var strokeLayer = comp.layers.addShape();
    strokeLayer.name = "3D_Stroke_Ribbon";
    strokeLayer.threeDLayer = true;
    strokeLayer.property("Transform").property("Position").setValue([cw/2, ch/2, 0]);
    strokeLayer.blendingMode = BlendingMode.ADD;
    
    var root = strokeLayer.property("ADBE Root Vectors Group");
    var gp = root.addProperty("ADBE Vector Group");
    var vecs = gp.property("ADBE Vectors Group");
    var path = vecs.addProperty("ADBE Vector Shape - Path");
    
    var s = new Shape();
    s.vertices = [[-400, 300], [-100, -200], [200, 400], [500, -100]];
    s.closed = false;
    path.property("ADBE Vector Path").setValue(s);
    path.property("ADBE Vector Path").expression = 
      "var s = value;\\n" +
      "var verts = [];\\n" +
      "for(var i=0; i<s.vertices.length; i++) {\\n" +
      "  var v = s.vertices[i];\\n" +
      "  var w = Math.sin(time * 3.5 + i) * 85;\\n" +
      "  verts.push([v[0], v[1] + w]);\\n" +
      "}\\n" +
      "s.vertices = verts; s;";
      
    var stroke = vecs.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(${jlit(opts.color)});
    stroke.property("ADBE Vector Stroke Width").setValue(10);
    
    var trim = root.addProperty("ADBE Vector Filter - Trim");
    if (trim) {
      trim.property("ADBE Vector Trim Start").expression = "Math.abs(Math.sin(time))*15;";
      trim.property("ADBE Vector Trim End").expression = "85 + Math.abs(Math.cos(time))*15;";
    }
    
    var glow = strokeLayer.property("Effects").addProperty("ADBE Glow");
    if (glow) {
      glow.property("Glow Radius").setValue(45);
    }
    
    var cam = comp.layers.addCamera("3D_Stroke_Camera", [cw/2, ch/2]);
    cam.property("Transform").property("Position").expression = "wiggle(0.25, 120);";
  `, opts.outputAepPath);
}

export interface PremiumPluginReplicaOptions {
  outputAepPath: string;
  kind: string;
  compName?: string;
  duration?: number;
  width?: number;
  height?: number;
  intensity?: number;
  color?: number[];
  sourceFootagePath?: string;
  [key: string]: unknown;
}

export function generatePremiumPluginReplicaJsx(opts: PremiumPluginReplicaOptions): string {
  const payload = {
    ...opts,
    compName: opts.compName ?? "MP_Premium_Replica_Comp",
    duration: opts.duration ?? 10,
    width: opts.width ?? 1920,
    height: opts.height ?? 1080,
    intensity: opts.intensity ?? 1,
    color: opts.color ?? [0.25, 0.75, 1.0],
  };

  return withReport(`
    var cfg = ${jlit(payload)};
    app.newProject();
    var comp = app.project.items.addComp(cfg.compName, cfg.width, cfg.height, 1, cfg.duration, 30);
    var cw = cfg.width; var ch = cfg.height; var dur = cfg.duration;
    var primary = cfg.color || [0.25, 0.75, 1.0];
    var intensity = cfg.intensity == null ? 1 : cfg.intensity;

    function fx(layer, name, alt) {
      try { return layer.property("ADBE Effect Parade").addProperty(name); } catch (e1) {}
      if (alt) { try { return layer.property("ADBE Effect Parade").addProperty(alt); } catch (e2) {} }
      return null;
    }
    function setp(effect, names, value) {
      if (!effect) return;
      for (var i = 0; i < names.length; i++) {
        try {
          var p = effect.property(names[i]);
          if (p) { p.setValue(value); return; }
        } catch (e) {}
      }
    }
    function solid(name, color) {
      return comp.layers.addSolid(color || [0,0,0], name, cw, ch, 1, dur);
    }
    function adj(name) {
      var a = solid(name, [1,1,1]);
      try { a.adjustmentLayer = true; } catch (e) {}
      return a;
    }
    function textLayer(name, text, size, color) {
      var t = comp.layers.addText(text || name);
      t.name = name;
      try {
        var docProp = t.property("ADBE Text Properties").property("ADBE Text Document");
        var td = docProp.value;
        td.fontSize = size || 120;
        td.font = "Arial Black";
        td.fillColor = color || [1,1,1];
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        docProp.setValue(td);
      } catch (e) {}
      t.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
      return t;
    }
    function shapeRect(name, pos, scale, color) {
      var s = comp.layers.addShape();
      s.name = name;
      var root = s.property("ADBE Root Vectors Group");
      var g = root.addProperty("ADBE Vector Group");
      var vecs = g.property("ADBE Vectors Group");
      var rect = vecs.addProperty("ADBE Vector Shape - Rect");
      rect.property("ADBE Vector Rect Size").setValue(scale || [400, 220]);
      var fill = vecs.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(color || primary);
      s.property("ADBE Transform Group").property("ADBE Position").setValue(pos || [cw/2, ch/2]);
      return s;
    }
    function addGlow(layer, radius, threshold) {
      var g = fx(layer, "ADBE Glow", "Glow");
      setp(g, ["Glow Radius", "ADBE Glow-0003"], radius || 55);
      setp(g, ["Glow Threshold", "ADBE Glow-0002"], threshold == null ? 45 : threshold);
      setp(g, ["Glow Intensity", "ADBE Glow-0004"], 1.6 * intensity);
      return g;
    }
    function addNoise(layer, amount, size) {
      var n = fx(layer, "ADBE Fractal Noise", "Fractal Noise");
      setp(n, ["Contrast"], 150 * intensity);
      setp(n, ["Brightness"], -20);
      try { n.property("Evolution").expression = "time * " + (amount || 90) + ";"; } catch (e) {}
      var disp = fx(layer, "ADBE Turbulent Displace", "Turbulent Displace");
      setp(disp, ["Amount"], amount || 25);
      setp(disp, ["Size"], size || 80);
      try { disp.property("Evolution").expression = "time * 160;"; } catch (e) {}
    }
    function addGrade(name, shadows, mids, highlights) {
      var a = adj(name);
      var tint = fx(a, "ADBE Tint", "Tint");
      setp(tint, ["Map Black To"], shadows || [0.02, 0.08, 0.12, 1]);
      setp(tint, ["Map White To"], highlights || [1, 0.78, 0.45, 1]);
      setp(tint, ["Amount to Tint"], 22 * intensity);
      var curve = fx(a, "ADBE CurvesCustom", "Curves");
      var glow = fx(a, "ADBE Glow", "Glow");
      setp(glow, ["Glow Radius", "ADBE Glow-0003"], 24);
      setp(glow, ["Glow Intensity", "ADBE Glow-0004"], 0.35 * intensity);
      return a;
    }
    function makeFootageOrPlate(label) {
      if (cfg.sourceFootagePath) {
        try {
          var f = new File(cfg.sourceFootagePath);
          if (f.exists) {
            var item = app.project.importFile(new ImportOptions(f));
            var layer = comp.layers.add(item);
            layer.name = label || "Source_Footage";
            layer.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
            return layer;
          }
        } catch (e) { MP.log("source import skipped: " + e.toString()); }
      }
      var plate = solid(label || "Procedural_Source", [0.08, 0.09, 0.11]);
      addNoise(plate, 18, 220);
      return plate;
    }
    function addLightRays(layer, name, strength) {
      var rays = fx(layer, "CC Light Burst 2.5", "CC Light Burst 2.5");
      setp(rays, ["Center"], [cw/2, ch/2]);
      setp(rays, ["Ray Length"], strength || 80);
      setp(rays, ["Intensity"], 55 * intensity);
      addGlow(layer, 70, 35);
    }
    function addController(name) {
      var n = comp.layers.addNull(dur);
      n.name = name || "[Replica Controls]";
      n.moveToBeginning();
      return n;
    }

    var kind = cfg.kind;
    MP.log("Premium zero-cost replica: " + kind);

    if (kind === "vfx_chroma_key_studio") {
      var keySrc = makeFootageOrPlate("Key_Source");
      var key = fx(keySrc, "Keylight 1.2", "Keylight (1.2)");
      var screen = cfg.screenColor === "blue" ? [0.05,0.15,1,1] : [0.05,1,0.15,1];
      setp(key, ["Screen Colour", "Screen Color"], screen);
      var spill = fx(keySrc, "ADBE Advanced Spill Suppressor", "Advanced Spill Suppressor");
      var choker = fx(keySrc, "ADBE Matte Choker", "Matte Choker");
      setp(choker, ["Geometric Softness 1"], cfg.edgeChoke || 2);
      var wrap = keySrc.duplicate();
      wrap.name = "Light_Wrap_Edge_Blend";
      wrap.blendingMode = BlendingMode.ADD;
      addGlow(wrap, 28 + (cfg.lightWrap || 20), 60);
      __result.output = "Keylight + spill suppression + matte choke + light wrap chain";
    } else if (kind === "vfx_beauty_retouch" || kind === "vfx_cosmo_skin") {
      var face = makeFootageOrPlate(kind === "vfx_cosmo_skin" ? "Cosmo_Skin_Source" : "Beauty_Box_Source");
      var soft = face.duplicate();
      soft.name = "Skin_Smoothing_Low_Frequency";
      var blur = fx(soft, "ADBE Gaussian Blur 2", "Gaussian Blur");
      setp(blur, ["Blurriness"], (cfg.skinSmoothing || cfg.smoothing || 35) * 0.35);
      soft.opacity.setValue(kind === "vfx_cosmo_skin" ? 35 : 48);
      var detail = face.duplicate();
      detail.name = "Preserved_Detail_High_Frequency";
      detail.blendingMode = BlendingMode.OVERLAY;
      var sharp = fx(detail, "ADBE Sharpen", "Sharpen");
      setp(sharp, ["Sharpen Amount"], cfg.preserveDetail || 65);
      addGrade("Skin_Tone_Balance", [0.08,0.05,0.04,1], null, [1,0.82,0.68,1]);
    } else if (kind === "vfx_supercomp_atmosphere") {
      makeFootageOrPlate("Background_Plate");
      var fg = shapeRect("Foreground_Subject", [cw/2, ch*0.58], [520, 520], [0.15,0.18,0.2]);
      addGlow(fg, cfg.lightWrap || 50, 55);
      var haze = solid("Depth_Haze_Atmosphere", [0.45,0.55,0.65]);
      haze.opacity.setValue(cfg.haze || 35);
      haze.blendingMode = BlendingMode.SCREEN;
      addNoise(haze, 16, 300);
      addLightRays(haze, "Atmospheric_Rays", 95);
    } else if (kind === "vfx_optical_flow_retime") {
      var retime = makeFootageOrPlate("Optical_Flow_Retime_Source");
      try { retime.timeRemapEnabled = true; } catch (e) {}
      var tw = fx(retime, "ADBE Timewarp", "Timewarp");
      setp(tw, ["Speed"], cfg.speedPercent || 40);
      setp(tw, ["Method"], 3);
      var px = fx(retime, "ADBE Pixel Motion Blur", "Pixel Motion Blur");
      setp(px, ["Shutter Angle"], 270);
      textLayer("Retime_Readout", "Pixel Motion / Timewarp Speed Ramp", 54, primary).property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch*0.84]);
    } else if (kind === "vfx_deflicker") {
      var def = makeFootageOrPlate("Deflicker_Source");
      var echo = fx(def, "ADBE Echo", "Echo");
      setp(echo, ["Number of Echoes"], cfg.temporalWindow || 5);
      setp(echo, ["Echo Time"], -0.033);
      setp(echo, ["Decay"], 0.65);
      var levels = fx(def, "ADBE Easy Levels2", "Levels");
      var smooth = fx(def, "ADBE Fast Box Blur", "Fast Box Blur");
      setp(smooth, ["Blur Radius"], (cfg.luminanceSmoothing || 55) * 0.05);
    } else if (kind === "vfx_sound_keys") {
      var skSens = (cfg.sensitivity || 1.5);
      var skDriver = null;
      // Real Sound Keys workflow: import audio + AE "Convert Audio to Keyframes" -> "Audio Amplitude" layer.
      if (cfg.audioPath) {
        try {
          var skFile = new File(cfg.audioPath);
          if (skFile.exists) {
            var skItem = app.project.importFile(new ImportOptions(skFile));
            var skAudio = comp.layers.add(skItem);
            skAudio.name = "Sound_Keys_Audio_Source";
            try {
              for (var skQ = 1; skQ <= comp.numLayers; skQ++) { comp.layer(skQ).selected = false; }
              skAudio.selected = true;
              var skCmd = app.findMenuCommandId("Convert Audio to Keyframes");
              if (skCmd) {
                app.executeCommand(skCmd);
                // Convert Audio to Keyframes creates a layer literally named "Audio Amplitude".
                skDriver = "thisComp.layer('Audio Amplitude').effect('Both Channels')('Slider') * " + skSens;
                MP.log("Sound Keys: real audio amplitude baked from " + cfg.audioPath);
              }
            } catch (skConvErr) { MP.log("Convert Audio to Keyframes failed: " + skConvErr.toString()); }
          }
        } catch (skAudErr) { MP.log("Sound Keys audio import skipped: " + skAudErr.toString()); }
      }
      if (!skDriver) {
        // Fallback: procedural sine driver when no audio is supplied.
        var ctrl = addController("Sound_Keys_Controller");
        var slider = ctrl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        slider.name = "Audio Amplitude Driver";
        slider.property("Slider").expression = "linear(Math.sin(time*6), -1, 1, 0, 100) * " + skSens + ";";
        skDriver = "thisComp.layer('Sound_Keys_Controller').effect('Audio Amplitude Driver')('Slider')";
      }
      var target = shapeRect("Audio_Driven_Target", [cw/2, ch/2], [280, 280], primary);
      var drive = cfg.driveProperty || "scale";
      if (drive === "opacity") target.opacity.expression = "Math.min(100, " + skDriver + ");";
      else if (drive === "rotation") target.rotation.expression = "(" + skDriver + ") * 3;";
      else if (drive === "position") target.position.expression = "value + [0, -(" + skDriver + ") * 4];";
      else target.scale.expression = "var a = " + skDriver + "; [100 + a, 100 + a];";
      addGlow(target, 40, 35);
      __result.output = (cfg.audioPath ? "Sound Keys (real audio amplitude)" : "Sound Keys (procedural fallback)") + " driving " + drive;
    } else if (kind === "vfx_trapcode_lux") {
      var lux = solid("Lux_Volumetric_Light_Cone", [0,0,0]);
      lux.blendingMode = BlendingMode.ADD;
      addLightRays(lux, "Lux_Cone", cfg.coneLength || 90);
      var light = comp.layers.addLight("Native_3D_Spotlight_Source", [cw/2, ch*0.18]);
      try { light.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch*0.18, -500]); } catch(e) {}
    } else if (kind === "vfx_trapcode_horizon") {
      var bg = solid("Infinite_Horizon_360_Background", [0.02,0.04,0.08]);
      var ramp = fx(bg, "ADBE Ramp", "Gradient Ramp");
      setp(ramp, ["Start Color"], primary.concat ? primary.concat([1]) : [0.2,0.5,1,1]);
      setp(ramp, ["End Color"], cfg.horizonStyle === "space" ? [0,0,0.02,1] : [1,0.48,0.18,1]);
      addNoise(bg, 9, 600);
      var cam = comp.layers.addCamera("Horizon_Locked_Camera", [cw/2,ch/2]);
      cam.property("ADBE Transform Group").property("ADBE Position").expression = "[960,540,-1400] + [Math.sin(time*.2)*80,0,0];";
    } else if (kind === "vfx_sapphire_pack") {
      var pack = makeFootageOrPlate("Sapphire_" + (cfg.effect || "glint"));
      if (cfg.effect === "edge_rays") addLightRays(pack, "S_EdgeRays_Native", 140);
      else if (cfg.effect === "aurora") { addNoise(pack, 55, 180); addGlow(pack, 120, 20); }
      else if (cfg.effect === "film_effect") { addGrade("S_FilmEffect_Emulation", [0.05,0.04,0.03,1], null, [1,0.82,0.55,1]); addNoise(adj("Gate_Weave_Grain"), 12, 35); }
      else if (cfg.effect === "grunge") { addNoise(pack, 70, 55); pack.blendingMode = BlendingMode.MULTIPLY; }
      else { addGlow(pack, 95, 18); addLightRays(pack, "S_Glint_Streaks", 70); }
    } else if (kind === "vfx_caustics_water") {
      var water = solid("Sapphire_Caustics_Water_Field", [0.02,0.12,0.18]);
      addNoise(water, 45, 90 / (cfg.waveScale || 2));
      var wave = fx(water, "ADBE Wave Warp", "Wave Warp");
      setp(wave, ["Wave Height"], 28 * intensity);
      setp(wave, ["Wave Width"], 120);
      addGlow(water, 65, 25);
    } else if (kind === "vfx_halftone_print") {
      var ht = makeFootageOrPlate("Halftone_Print_Source");
      var mosaic = fx(ht, "ADBE Mosaic", "Mosaic");
      setp(mosaic, ["Horizontal Blocks"], Math.max(12, Math.floor(cw / (cfg.dotSize || 18))));
      setp(mosaic, ["Vertical Blocks"], Math.max(8, Math.floor(ch / (cfg.dotSize || 18))));
      var dots = fx(ht, "CC Ball Action", "CC Ball Action");
      setp(dots, ["Grid Spacing"], cfg.dotSize || 18);
      if (cfg.pixelSort) addNoise(ht, 18, 35);
    } else if (kind === "vfx_mojo_teal_orange" || kind === "grade_film_emulation" || kind === "grade_color_finesse") {
      makeFootageOrPlate("Grade_Source");
      var stock = cfg.stock || cfg.look || "commercial_pop";
      addGrade("Primary_Grade_" + stock, [0.0,0.18,0.22,1], null, [1,0.67,0.35,1]);
      var grain = adj("Film_Grain_Halation");
      addNoise(grain, cfg.grain || 15, 35);
      grain.opacity.setValue(kind === "vfx_mojo_teal_orange" ? 22 : 35);
    } else if (kind === "vfx_universe_glitch_pack") {
      var gl = makeFootageOrPlate("Universe_Glitch_" + (cfg.style || "holomatrix"));
      var disp = fx(gl, "ADBE Displacement Map", "Displacement Map");
      setp(disp, ["Max Horizontal Displacement"], 45 * intensity);
      setp(disp, ["Max Vertical Displacement"], 8 * intensity);
      addNoise(gl, 65, cfg.style === "retrograde" ? 18 : 45);
      addGlow(gl, 35, 40);
    } else if (kind === "vfx_camera_shake_pro") {
      var shake = makeFootageOrPlate("Camera_Shake_Target");
      var amp = cfg.profile === "earthquake" ? 80 : cfg.profile === "impact" ? 55 : cfg.profile === "engine_idle" ? 12 : 28;
      shake.position.expression = "value + wiggle(" + (cfg.profile === "impact" ? 12 : 2.5) + "," + amp + ");";
      shake.rotation.expression = "wiggle(3," + (amp/12) + ");";
    } else if (kind === "vfx_film_damage") {
      makeFootageOrPlate("Film_Damage_Source");
      var dmg = adj("BCC_Film_Damage_Native");
      addNoise(dmg, cfg.age || 65, 22);
      dmg.opacity.setValue(55);
      addGrade("Sepia_Gate_Weave", [0.12,0.08,0.04,1], null, [1,0.78,0.45,1]);
    } else if (kind === "vfx_title_studio") {
      var title = textLayer("BCC_Title_Studio_Extrude", cfg.text || "MOTIONPILOT", 138, primary);
      title.threeDLayer = true;
      addGlow(title, 55, 35);
      for (var ti=1; ti<6; ti++) {
        var dup = title.duplicate();
        dup.name = "Extrude_Depth_" + ti;
        dup.threeDLayer = true;
        dup.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2 + ti*3, ch/2 + ti*3, ti * (cfg.extrudeDepth || 60) / 6]);
      }
      comp.layers.addCamera("Title_Studio_Camera", [cw/2,ch/2]);
    } else if (kind === "vfx_pixel_chooser_mask") {
      var mask = makeFootageOrPlate("Pixel_Chooser_Source");
      var keyer = fx(mask, cfg.qualifier === "chroma" || cfg.qualifier === "skin" ? "ADBE Color Key" : "ADBE Luma Key", cfg.qualifier === "luma" ? "Luma Key" : "Color Key");
      var matte = fx(mask, "ADBE Matte Choker", "Matte Choker");
      setp(matte, ["Geometric Softness 1"], 4);
      addGlow(mask, 20, 55);
    } else if (kind === "rig_rubberhose_limbs") {
      var count = cfg.limbCount || 2;
      for (var li=0; li<count; li++) {
        var limb = comp.layers.addShape();
        limb.name = "RubberHose_Limb_" + (li+1);
        var root = limb.property("ADBE Root Vectors Group");
        var group = root.addProperty("ADBE Vector Group");
        var vecs = group.property("ADBE Vectors Group");
        var pth = vecs.addProperty("ADBE Vector Shape - Path");
        var sh = new Shape(); sh.vertices = [[-180,0],[0,80],[180,0]]; sh.inTangents = [[0,0],[-80,-80],[0,0]]; sh.outTangents = [[80,80],[80,80],[0,0]]; sh.closed = false;
        pth.property("ADBE Vector Path").setValue(sh);
        var stroke = vecs.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Width").setValue(38);
        stroke.property("ADBE Vector Stroke Color").setValue(primary);
        limb.position.setValue([cw/2, ch*(0.35 + li*0.18)]);
      }
    } else if (kind === "anim_squash_stretch") {
      var ball = shapeRect("Squash_Stretch_Rig", [cw/2, ch/2], [260, 260], primary);
      ball.scale.expression = "var v=Math.sin(time*5); [100+v*" + (cfg.elasticity || 55) + ", 100-v*" + ((cfg.elasticity || 55)*0.55) + "];";
      ball.position.expression = "value + [Math.sin(time*5)*220, Math.abs(Math.sin(time*5))*120];";
    } else if (kind === "anim_motion_tools") {
      var mt = shapeRect("Motion_Tools_Target_" + (cfg.preset || "auto_ease"), [cw/2, ch/2], [260,180], primary);
      mt.position.setValueAtTime(0, [cw*0.2, ch*0.55]);
      mt.position.setValueAtTime(dur, [cw*0.8, ch*0.45]);
      mt.rotation.expression = cfg.preset === "excite_wiggle" ? "wiggle(8,18);" : "ease(time,0,thisComp.duration,0,360);";
    } else if (kind === "anim_explode_shape_layers") {
      var pieces = cfg.pieces || 12;
      for (var pi=0; pi<pieces; pi++) {
        var ang = (Math.PI*2* pi)/pieces;
        var piece = shapeRect("Exploded_Shape_Piece_" + pi, [cw/2, ch/2], [90, 90], primary);
        piece.position.expression = "var t=ease(time,0,2,0,1); value + [" + Math.cos(ang)*520 + "," + Math.sin(ang)*320 + "]*t;";
        piece.rotation.expression = "time*" + (90 + pi*17) + ";";
      }
    } else if (kind === "anim_transition_browser") {
      var tr = makeFootageOrPlate("Transition_" + (cfg.transition || "whip_pan"));
      if (cfg.transition === "zoom_blur") addLightRays(tr, "Zoom_Blur_Transition", 180);
      else if (cfg.transition === "glitch_cut") addNoise(tr, 90, 28);
      else {
        var dir = fx(tr, "ADBE Directional Blur", "Directional Blur");
        setp(dir, ["Direction"], 0);
        setp(dir, ["Blur Length"], 160 * intensity);
      }
    } else if (kind === "vfx_organic_track") {
      var mesh = makeFootageOrPlate("Organic_Track_Surface");
      var warp = fx(mesh, "ADBE Mesh Warp", "Mesh Warp");
      var corner = textLayer("Surface_Pin_Graphic", "TRACKED LOGO", 54, primary);
      corner.position.expression = "value + [Math.sin(time*2)*20, Math.cos(time*1.7)*16];";
      addGlow(corner, 25, 35);
    } else if (kind === "vfx_object_removal") {
      makeFootageOrPlate("Clean_Plate_Source");
      var patch = shapeRect("Temporal_Clean_Patch", [cw/2, ch/2], [340, 220], [0.08,0.09,0.1]);
      var clone = fx(patch, "ADBE Clone Stamp", "Clone Stamp");
      var blur2 = fx(patch, "ADBE Fast Box Blur", "Fast Box Blur");
      setp(blur2, ["Blur Radius"], 16);
      patch.opacity.setValue(85);
    } else if (kind === "vfx_reflection_mirror") {
      var obj = textLayer("Product_Object", "PRODUCT", 112, primary);
      var refl = obj.duplicate();
      refl.name = "VC_Reflect_Floor_Mirror";
      refl.scale.setValue([100,-100]);
      refl.position.setValue([cw/2, ch*0.72]);
      refl.opacity.setValue(100 - (cfg.floorFade || 65));
      var rb = fx(refl, "ADBE Gaussian Blur 2", "Gaussian Blur"); setp(rb, ["Blurriness"], 12);
    } else if (kind === "vfx_3d_camera_track") {
      makeFootageOrPlate("3D_Camera_Track_Footage");
      var cam3 = comp.layers.addCamera("Solved_3D_Camera_" + (cfg.solveQuality || "standard"), [cw/2,ch/2]);
      cam3.position.expression = "[960,540,-1300] + [Math.sin(time*.6)*120, Math.cos(time*.5)*80, Math.sin(time*.3)*120];";
      for (var ni=0; ni<8; ni++) {
        var n3 = comp.layers.addNull(dur); n3.name = "Solved_Track_Null_" + ni; n3.threeDLayer = true;
        n3.position.setValue([cw*(0.2+0.08*ni), ch*(0.35+0.04*(ni%3)), ni*80]);
      }
      textLayer("AR_Placed_Text", "SCENE LOCKED", 72, primary).threeDLayer = true;
    }

    app.project.save(new File(cfg.outputAepPath));
    if (!__result.output) { __result.output = cfg.outputAepPath; }
  `);
}
