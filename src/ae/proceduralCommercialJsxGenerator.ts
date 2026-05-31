/**
 * Prompt-native procedural commercial builder.
 *
 * Unlike the asset-pack commercial flow, this generator creates the whole ad
 * inside After Effects with editable text, shape layers, gradients, trim paths,
 * camera/null parallax, particles, markers and a finishing pass. It is designed
 * for fictional/product-launch commercials where no external assets exist.
 */

import { wrapScriptWithVfx, jsxStr as jstr, jsxJsonLiteral as jsonLiteral } from "./jsxGenerator.js";

export interface ProceduralCommercialOptions {
  outputAepPath: string;
  compName: string;
  brandName: string;
  headline?: string;
  features?: string[];
  promptLine?: string;
  tagline?: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  palette?: string[];
  style?: "premiumTech" | "cinematic" | "minimal" | "energetic";
}

function sanitizeLines(lines: string[] | undefined, fallback: string[]): string[] {
  const clean = (lines || [])
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .filter((s) => !/(lorem|ipsum|placeholder|gibberish)/i.test(s));
  return clean.length ? clean : fallback;
}

function hexToRgb01(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const h = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return fallback;
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

export function generateProceduralCommercialJsx(opts: ProceduralCommercialOptions): string {
  const features = sanitizeLines(opts.features, ["Animate faster.", "Build cleaner.", "Create smarter."]).slice(0, 3);
  const headline = opts.headline || "AI Motion Design Control";
  const promptLine = opts.promptLine || "Control After Effects with prompts.";
  const tagline = opts.tagline || "From idea to motion.";
  const pal = opts.palette || [];
  const accent = hexToRgb01(pal[0], [0.02, 0.78, 1.0]);
  const violet = hexToRgb01(pal[1], [0.55, 0.22, 1.0]);
  const light = hexToRgb01(pal[2], [0.92, 0.96, 1.0]);

  const body = `
    app.newProject();
    app.beginUndoGroup("MotionPilot Procedural Commercial");

    var OUT = ${jstr(opts.outputAepPath)};
    var W = ${opts.width}, H = ${opts.height}, DUR = ${opts.duration}, FPS = ${opts.fps};
    var BRAND = ${jstr(opts.brandName)};
    var HEADLINE = ${jstr(headline)};
    var FEATURES = ${jsonLiteral(features)};
    var PROMPT_LINE = ${jstr(promptLine)};
    var TAGLINE = ${jstr(tagline)};
    var CYAN = ${jsonLiteral(accent)};
    var VIOLET = ${jsonLiteral(violet)};
    var WHITE = ${jsonLiteral(light)};
    var DIM = [0.52, 0.72, 0.90];
    var GLASS = [0.08, 0.13, 0.19];

    function tr(ly){ return ly.property("ADBE Transform Group"); }
    function prop(ly, name) {
      var p = tr(ly).property(name);
      if (!p && name === "ADBE Rotation") p = tr(ly).property("ADBE Rotate Z");
      return p;
    }
    function ease(p, name){ try { MP.setEase(p, name || "expoOut"); } catch(e){} }
    function k(ly, pName, times, vals, easeName) {
      var p = prop(ly, pName);
      if (!p) { MP.log("missing property " + pName + " on " + ly.name); return null; }
      for (var i=0; i<times.length; i++) p.setValueAtTime(times[i], vals[i]);
      ease(p, easeName || "expoOut");
      return p;
    }
    function addGlow(ly, radius, intensity) {
      try {
        var g = ly.property("ADBE Effect Parade").addProperty("ADBE Glow");
        g.property("Glow Threshold").setValue(42);
        g.property("Glow Radius").setValue(radius || 32);
        g.property("Glow Intensity").setValue(intensity || 0.6);
      } catch(e) {}
    }
    function addText(comp, name, text, size, pos, color, font) {
      var ly = comp.layers.addText(text);
      ly.name = name;
      var td = ly.property("Source Text").value;
      td.font = font || "HelveticaNeue-Medium";
      td.fontSize = size;
      td.fillColor = color || WHITE;
      td.applyFill = true;
      td.applyStroke = false;
      td.justification = ParagraphJustification.CENTER_JUSTIFY;
      td.tracking = 22;
      ly.property("Source Text").setValue(td);
      prop(ly, "ADBE Position").setValue(pos);
      try { MP.protectTextLayer(ly); } catch(e) {}
      return ly;
    }
    function addRect(comp, name, pos, size, fill, opacity, stroke, strokeW, radius) {
      var ly = comp.layers.addShape(); ly.name = name;
      var root = ly.property("ADBE Root Vectors Group");
      var grp = root.addProperty("ADBE Vector Group"); grp.name = name + "_Vector";
      var c = grp.property("ADBE Vectors Group");
      var r = c.addProperty("ADBE Vector Shape - Rect");
      r.property("ADBE Vector Rect Size").setValue(size);
      r.property("ADBE Vector Rect Roundness").setValue(radius || 18);
      var f = c.addProperty("ADBE Vector Graphic - Fill");
      f.property("ADBE Vector Fill Color").setValue(fill || GLASS);
      f.property("ADBE Vector Fill Opacity").setValue(opacity || 30);
      if (stroke) {
        var s = c.addProperty("ADBE Vector Graphic - Stroke");
        s.property("ADBE Vector Stroke Color").setValue(stroke);
        s.property("ADBE Vector Stroke Opacity").setValue(58);
        s.property("ADBE Vector Stroke Width").setValue(strokeW || 2);
      }
      prop(ly, "ADBE Position").setValue(pos);
      return ly;
    }
    function addEllipse(comp, name, pos, size, fill, opacity) {
      var ly = comp.layers.addShape(); ly.name = name;
      var c = ly.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var e = c.addProperty("ADBE Vector Shape - Ellipse");
      e.property("ADBE Vector Ellipse Size").setValue([size, size]);
      var f = c.addProperty("ADBE Vector Graphic - Fill");
      f.property("ADBE Vector Fill Color").setValue(fill || CYAN);
      f.property("ADBE Vector Fill Opacity").setValue(opacity || 100);
      prop(ly, "ADBE Position").setValue(pos);
      return ly;
    }
    function addLine(comp, name, pts, color, width, t0, t1) {
      var ly = comp.layers.addShape(); ly.name = name;
      var c = ly.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var pathProp = c.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape");
      var sh = new Shape(); sh.vertices = pts; sh.closed = false; sh.inTangents = []; sh.outTangents = [];
      for (var i=0; i<pts.length; i++) { sh.inTangents.push([0,0]); sh.outTangents.push([0,0]); }
      pathProp.setValue(sh);
      var st = c.addProperty("ADBE Vector Graphic - Stroke");
      st.property("ADBE Vector Stroke Color").setValue(color || CYAN);
      st.property("ADBE Vector Stroke Width").setValue(width || 3);
      st.property("ADBE Vector Stroke Line Cap").setValue(2);
      var trim = c.addProperty("ADBE Vector Filter - Trim");
      var end = trim.property("ADBE Vector Trim End");
      end.setValueAtTime(t0, 0); end.setValueAtTime(t1, 100); ease(end, "expoOut");
      return ly;
    }
    function addDiamond(comp, name, pos, size, color) {
      var ly = comp.layers.addShape(); ly.name = name;
      var c = ly.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group");
      var pathProp = c.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape");
      var s = size || 12;
      var sh = new Shape(); sh.vertices = [[0,-s],[s,0],[0,s],[-s,0]]; sh.closed = true;
      sh.inTangents = [[0,0],[0,0],[0,0],[0,0]]; sh.outTangents = [[0,0],[0,0],[0,0],[0,0]];
      pathProp.setValue(sh);
      var f = c.addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(color || CYAN);
      prop(ly, "ADBE Position").setValue(pos);
      return ly;
    }
    function mark(comp, t, label) { try { comp.markerProperty.setValueAtTime(t, new MarkerValue(label)); } catch(e){} }

    var comp = app.project.items.addComp(${jstr(opts.compName)}, W, H, 1, DUR, FPS);
    comp.bgColor = [0.01, 0.012, 0.03];
    mark(comp, 0, "Brand Birth");
    mark(comp, 2, "Product Positioning");
    mark(comp, 4, "Feature Rhythm");
    mark(comp, 7, "Prompt Control");
    mark(comp, 9, "Energy Build");
    mark(comp, Math.min(10.5, DUR - 1), "Final Lockup");

    // 01_BACKGROUND_GRADIENT
    var bg = comp.layers.addSolid([0.015,0.02,0.045], "01_BACKGROUND_GRADIENT / base dark gradient", W, H, 1, DUR);
    try {
      var ramp = bg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
      ramp.property("Start of Ramp").setValue([W*0.15,H*0.08]);
      ramp.property("End of Ramp").setValue([W*0.9,H*0.95]);
      ramp.property("Start Color").setValue([0.02,0.04,0.09]);
      ramp.property("End Color").setValue([0.0,0.0,0.018]);
    } catch(e) {}
    var cyanGlow = addEllipse(comp, "01_BACKGROUND_GRADIENT / animated cyan depth glow", [W*0.18,H*0.23], W*0.82, CYAN, 18);
    cyanGlow.blendingMode = BlendingMode.ADD; addGlow(cyanGlow, 180, 1.1);
    k(cyanGlow, "ADBE Position", [0,DUR*0.5,DUR], [[W*0.14,H*0.20],[W*0.70,H*0.28],[W*0.42,H*0.48]], "sineInOut");
    k(cyanGlow, "ADBE Scale", [0,DUR], [[120,50],[180,70]], "sineInOut");
    var violetGlow = addEllipse(comp, "01_BACKGROUND_GRADIENT / animated violet rim glow", [W*0.86,H*0.78], W*0.70, VIOLET, 15);
    violetGlow.blendingMode = BlendingMode.ADD; addGlow(violetGlow, 210, 0.9);
    k(violetGlow, "ADBE Position", [0,DUR], [[W*0.88,H*0.80],[W*0.66,H*0.68]], "sineInOut");

    // 02_PARTICLES_DEPTH
    var particleNull = comp.layers.addNull(); particleNull.name = "02_PARTICLES_DEPTH / depth particle controller"; particleNull.threeDLayer = true;
    for (var p=0; p<72; p++) {
      var x = (p*157)%W, y = (p*283)%H, z = -1800 + ((p*97)%2200);
      var dot = addEllipse(comp, "02_PARTICLES_DEPTH / keyframe particle " + ("0"+p).slice(-2), [x,y,z], 3+(p%4), (p%3===0?VIOLET:CYAN), 35+(p%35));
      dot.threeDLayer = true; dot.parent = particleNull;
      k(dot, "ADBE Position", [0,DUR], [[x,y,z],[x+((p%5)-2)*38,y-180-(p%7)*20,z+260]], "sineInOut");
      k(dot, "ADBE Opacity", [0,1,DUR-1,DUR], [0,35+(p%45),30+(p%35),0], "sineInOut");
    }

    // 03_REMIRDY_LOGO_ICON + 04_REMIRDY_WORDMARK generalized brand lockup
    var logoNull = comp.layers.addNull(); logoNull.name = "03_LOGO_ICON + 04_WORDMARK / logo controller"; logoNull.threeDLayer = true;
    k(logoNull, "ADBE Position", [0,2.2,4.0,Math.min(10.5,DUR-1)], [[W/2,H*0.48,-120],[W/2,H*0.40,-180],[W/2,H*0.28,-260],[W/2,H*0.40,-120]], "sineInOut");
    k(logoNull, "ADBE Scale", [0,1.6,4.0,Math.min(10.5,DUR-1)], [[82,82,82],[100,100,100],[70,70,70],[104,104,104]], "sineInOut");
    var iconPath = addLine(comp, "03_LOGO_ICON / abstract motion-path R icon", [[-80,40],[-80,-62],[-2,-62],[50,-28],[10,18],[78,72]], CYAN, 7, 0.15, 1.15);
    iconPath.parent = logoNull; iconPath.threeDLayer = true; iconPath.blendingMode = BlendingMode.ADD; addGlow(iconPath, 35, 0.8);
    var n1 = addEllipse(comp, "03_LOGO_ICON / AI node top", [-80,-62], 18, WHITE, 100);
    var n2 = addEllipse(comp, "03_LOGO_ICON / AI node center", [50,-28], 16, CYAN, 100);
    var n3 = addDiamond(comp, "03_LOGO_ICON / keyframe spark", [82,72], 15, VIOLET);
    var nodeList = [n1,n2,n3];
    for (var ni=0; ni<nodeList.length; ni++) {
      nodeList[ni].parent = logoNull; nodeList[ni].threeDLayer = true; nodeList[ni].blendingMode = BlendingMode.ADD;
      k(nodeList[ni], "ADBE Scale", [0.5+ni*0.18,1.15+ni*0.18], [[0,0,0],[100,100,100]], "backOut");
      k(nodeList[ni], "ADBE Opacity", [0.35+ni*0.18,1.35+ni*0.18], [0,100], "expoOut");
      addGlow(nodeList[ni], 26, 0.7);
    }
    var word = addText(comp, "04_WORDMARK / editable brand wordmark", BRAND, Math.round(W*0.087), [128,10,0], WHITE, "HelveticaNeue-Medium");
    word.parent = logoNull; word.threeDLayer = true; addGlow(word, 18, 0.25);
    k(word, "ADBE Position", [0.95,1.45], [[160,28,0],[132,10,0]], "expoOut");
    k(word, "ADBE Opacity", [0.85,1.45], [0,100], "expoOut");

    // 05_GLASS_UI_PANELS
    var glass = addRect(comp, "05_GLASS_UI_PANELS / positioning glass panel", [W/2,H*0.40,-210], [W*0.70,H*0.13], GLASS, 30, CYAN, 1.5, 34);
    glass.threeDLayer = true; glass.blendingMode = BlendingMode.SCREEN; addGlow(glass, 28, 0.3);
    k(glass, "ADBE Scale", [1.8,2.35,4.2], [[86,86,86],[100,100,100],[94,94,94]], "expoOut");
    k(glass, "ADBE Opacity", [1.8,2.35,4.2], [0,72,0], "sineInOut");
    var head = addText(comp, "05_GLASS_UI_PANELS / headline", HEADLINE, Math.round(W*0.054), [W/2,H*0.466,-180], WHITE, "HelveticaNeue-Medium");
    head.threeDLayer = true;
    k(head, "ADBE Position", [2.0,2.55,4.0], [[W/2,H*0.49,-180],[W/2,H*0.466,-180],[W/2,H*0.448,-180]], "expoOut");
    k(head, "ADBE Opacity", [2.0,2.55,4.15], [0,100,0], "sineInOut");

    // 08_MOTION_PATHS UI system
    for (var ui=0; ui<18; ui++) {
      var lx = W*0.15 + (ui%6)*W*0.139, ly = H*0.307 + Math.floor(ui/6)*H*0.047;
      var line = addLine(comp, "08_MOTION_PATHS / UI timeline connector " + ui, [[lx-36,ly],[lx+54,ly]], ui%2?VIOLET:CYAN, 2, 2.1+ui*0.03, 3.4+ui*0.03);
      line.threeDLayer = true; k(line, "ADBE Opacity", [2.0,3.1,4.0], [0,55,0], "sineInOut");
      var key = addDiamond(comp, "08_MOTION_PATHS / UI keyframe diamond " + ui, [lx+70,ly], 7, ui%2?VIOLET:CYAN);
      key.threeDLayer = true; k(key, "ADBE Opacity", [2.2,3.2,4.0], [0,75,0], "sineInOut");
    }

    // 06_FEATURE_CARDS
    var yBase = [H*0.3125,H*0.411,H*0.51];
    for (var c=0; c<FEATURES.length; c++) {
      var card = addRect(comp, "06_FEATURE_CARDS / glass card " + (c+1), [W/2,yBase[c],-120+c*40], [W*0.685,H*0.069], GLASS, 35, c===1?VIOLET:CYAN, 1.5, 24);
      card.threeDLayer = true; card.blendingMode = BlendingMode.SCREEN; addGlow(card, 22, 0.25);
      k(card, "ADBE Position", [4.0+c*0.65,4.55+c*0.65,7.0], [[W*0.62,yBase[c]+35,-120+c*40],[W/2,yBase[c],-120+c*40],[W*0.41,yBase[c]-45,-120+c*40]], "backOut");
      k(card, "ADBE Opacity", [4.0+c*0.65,4.55+c*0.65,7.0], [0,88,0], "sineInOut");
      var tx = addText(comp, "06_FEATURE_CARDS / " + FEATURES[c], FEATURES[c], Math.round(W*0.044), [W*0.542,yBase[c]+13,-90+c*40], WHITE, "HelveticaNeue-Medium");
      tx.threeDLayer = true;
      k(tx, "ADBE Position", [4.08+c*0.65,4.60+c*0.65,7.0], [[W*0.59,yBase[c]+33,-90+c*40],[W*0.542,yBase[c]+13,-90+c*40],[W*0.46,yBase[c]-40,-90+c*40]], "expoOut");
      k(tx, "ADBE Opacity", [4.08+c*0.65,4.60+c*0.65,7.0], [0,100,0], "sineInOut");
      if (c===0) addLine(comp, "06_FEATURE_CARDS / speed line icon", [[W*0.218,yBase[c]-18],[W*0.287,yBase[c]-18],[W*0.315,yBase[c]-18]], CYAN, 4, 4.1, 4.65);
      else if (c===1) { addRect(comp, "06_FEATURE_CARDS / layer stack icon back", [W*0.261,yBase[c]-8], [86,24], VIOLET, 55, VIOLET, 1, 4); addRect(comp, "06_FEATURE_CARDS / layer stack icon front", [W*0.283,yBase[c]+16], [86,24], CYAN, 55, CYAN, 1, 4); }
      else { addLine(comp, "06_FEATURE_CARDS / AI spark node icon", [[W*0.242,yBase[c]],[W*0.278,yBase[c]-34],[W*0.315,yBase[c]+18]], CYAN, 3, 5.4, 6.1); addDiamond(comp, "06_FEATURE_CARDS / AI spark diamond icon", [W*0.319,yBase[c]+20], 11, VIOLET); }
    }

    // 07_PROMPT_INTERFACE
    var pp = addRect(comp, "07_PROMPT_INTERFACE / clean command panel", [W/2,H*0.438,-120], [W*0.787,H*0.161], GLASS, 38, CYAN, 1.4, 28);
    pp.threeDLayer = true; pp.blendingMode = BlendingMode.SCREEN; addGlow(pp, 34, 0.35);
    k(pp, "ADBE Scale", [6.9,7.35,9.0], [[92,92,92],[100,100,100],[106,106,106]], "expoOut");
    k(pp, "ADBE Opacity", [6.9,7.35,9.0], [0,86,0], "sineInOut");
    var pt = addText(comp, "07_PROMPT_INTERFACE / prompt control line", PROMPT_LINE, Math.round(W*0.043), [W/2,H*0.44,-80], WHITE, "HelveticaNeue-Medium");
    pt.threeDLayer = true;
    k(pt, "ADBE Position", [7.0,7.48,9.0], [[W/2,H*0.464,-80],[W/2,H*0.44,-80],[W/2,H*0.423,-80]], "expoOut");
    k(pt, "ADBE Opacity", [7.0,7.48,9.0], [0,100,0], "sineInOut");
    var cursor = addLine(comp, "07_PROMPT_INTERFACE / glowing cursor response", [[W*0.18,H*0.484],[W*0.82,H*0.484]], CYAN, 4, 7.55, 8.35);
    cursor.threeDLayer = true; cursor.blendingMode = BlendingMode.ADD; addGlow(cursor, 28, 0.9);
    k(cursor, "ADBE Opacity", [7.4,8.8,9.0], [0,100,0], "sineInOut");

    for (var mp=0; mp<10; mp++) {
      var yy = H*0.27 + mp*H*0.042;
      var path = addLine(comp, "08_MOTION_PATHS / prompt reactive path " + mp, [[W*0.15,yy],[W*0.33,yy-60+(mp%3)*40],[W*0.56,yy+45],[W*0.85,yy-20]], mp%2?VIOLET:CYAN, 2.4, 7.4+mp*0.035, 8.7+mp*0.035);
      path.threeDLayer = true; path.blendingMode = BlendingMode.ADD; addGlow(path, 18, 0.35);
      k(path, "ADBE Opacity", [7.2,8.4,9.25], [0,62,0], "sineInOut");
    }

    // 09_LIGHTING_FX
    for (var st=0; st<16; st++) {
      var a = st*22.5, rad = W*0.23 + (st%4)*44;
      var sx = W/2 + Math.cos(a*Math.PI/180)*rad, sy = H*0.456 + Math.sin(a*Math.PI/180)*rad;
      var streak = addLine(comp, "09_LIGHTING_FX / energy build streak " + st, [[W/2,H*0.456],[sx,sy]], st%2?VIOLET:CYAN, 3, 9.0+st*0.018, 10.12+st*0.018);
      streak.blendingMode = BlendingMode.ADD; addGlow(streak, 32, 0.8);
      k(streak, "ADBE Opacity", [8.95,10.05,10.45], [0,80,0], "sineInOut");
    }
    var wipe = addRect(comp, "09_LIGHTING_FX / final clean light wipe", [W*1.2,H/2], [190,H*1.25], CYAN, 70, WHITE, 0, 0);
    wipe.blendingMode = BlendingMode.ADD; addGlow(wipe, 120, 1.3);
    k(wipe, "ADBE Position", [10.0,10.55], [[-W*0.16,H/2],[W*1.2,H/2]], "expoOut");
    k(wipe, "ADBE Opacity", [9.9,10.25,10.65], [0,100,0], "sineInOut");
    k(wipe, "ADBE Rotation", [9.9,10.65], [-12,-12], "linear");

    // 11_FINAL_LOCKUP
    var finalNull = comp.layers.addNull(); finalNull.name = "11_FINAL_LOCKUP / final logo controller"; finalNull.threeDLayer = true;
    k(finalNull, "ADBE Position", [10.35,10.85,DUR], [[W/2,H*0.427,-80],[W/2,H*0.385,-80],[W/2,H*0.375,-80]], "expoOut");
    k(finalNull, "ADBE Scale", [10.35,10.85,DUR], [[90,90,90],[106,106,106],[106,106,106]], "expoOut");
    var fp = addLine(comp, "11_FINAL_LOCKUP / final icon path", [[-80,40],[-80,-62],[-2,-62],[50,-28],[10,18],[78,72]], CYAN, 7, 10.38, 10.82);
    fp.parent = finalNull; fp.threeDLayer = true; fp.blendingMode = BlendingMode.ADD; addGlow(fp, 35, 0.8);
    var fw = addText(comp, "11_FINAL_LOCKUP / final editable wordmark", BRAND, Math.round(W*0.093), [135,10,0], WHITE, "HelveticaNeue-Medium");
    fw.parent = finalNull; fw.threeDLayer = true; addGlow(fw, 22, 0.25);
    k(fw, "ADBE Opacity", [10.45,10.9], [0,100], "expoOut");
    var tg = addText(comp, "11_FINAL_LOCKUP / final tagline", TAGLINE, Math.round(W*0.041), [W/2,H*0.484,-60], DIM, "HelveticaNeue-Medium");
    tg.threeDLayer = true;
    k(tg, "ADBE Position", [10.75,11.15,DUR], [[W/2,H*0.508,-60],[W/2,H*0.484,-60],[W/2,H*0.484,-60]], "expoOut");
    k(tg, "ADBE Opacity", [10.75,11.15,DUR], [0,100,100], "expoOut");

    // 10_CAMERA_CONTROL
    var camNull = comp.layers.addNull(); camNull.name = "10_CAMERA_CONTROL / animated 2.5D camera null"; camNull.threeDLayer = true;
    var cam = comp.layers.addCamera("10_CAMERA_CONTROL / cinematic push camera", [W/2,H/2]);
    prop(cam, "ADBE Position").setValue([W/2,H/2,-1750]);
    cam.parent = camNull;
    k(camNull, "ADBE Position", [0,4,7,9.8,DUR], [[0,0,0],[18,-48,130],[-25,-22,210],[0,-60,310],[0,-85,250]], "sineInOut");
    k(camNull, "ADBE Orientation", [0,6,DUR], [[0,0,0],[-1.2,1.5,0.2],[0.4,-0.8,0]], "sineInOut");

    // 12_COLOR_GRADE
    var grade = comp.layers.addSolid([0.5,0.5,0.5], "12_COLOR_GRADE / glow grain vignette adjustment", W, H, 1, DUR);
    grade.adjustmentLayer = true;
    try { var noise = grade.property("ADBE Effect Parade").addProperty("ADBE Noise"); noise.property("Amount of Noise").setValue(2.2); noise.property("Use Color Noise").setValue(false); } catch(e) {}
    var vig = comp.layers.addSolid([0,0,0], "12_COLOR_GRADE / soft cinematic vignette", W, H, 1, DUR);
    vig.opacity.setValue(32);
    try {
      var mask = vig.Masks.addProperty("Mask");
      var ms = new Shape(); ms.vertices = [[-120,-120],[W+120,-120],[W+120,H+120],[-120,H+120]];
      ms.closed = true; ms.inTangents = [[0,0],[0,0],[0,0],[0,0]]; ms.outTangents = [[0,0],[0,0],[0,0],[0,0]];
      mask.property("maskShape").setValue(ms);
      mask.property("maskMode").setValue(MaskMode.SUBTRACT);
      mask.property("maskFeather").setValue([Math.round(W*0.31),Math.round(W*0.31)]);
    } catch(e) {}

    try { comp.motionBlur = true; comp.shutterAngle = 160; } catch(e) {}
    for (var li=1; li<=comp.numLayers; li++) { try { comp.layer(li).motionBlur = true; } catch(e){} }
    try {
      MPVFX.run(comp, "cinematicGrade", {});
      MPVFX.run(comp, "filmGrain", { strength: 4 });
      MPVFX.run(comp, "enableMotionBlur", {});
    } catch(eV) { MP.log("optional finishing pass skipped: " + eV.toString()); }
    comp.workAreaStart = 0; comp.workAreaDuration = DUR;
    app.project.renderQueue.items.add(comp);
    comp.openInViewer();
    app.endUndoGroup();
    __result.output = MP.saveProject(OUT);
  `;

  return wrapScriptWithVfx(body);
}
