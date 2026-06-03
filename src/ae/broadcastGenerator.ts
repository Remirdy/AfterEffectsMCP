/**
 * MotionPilot Broadcast & Workflow JSX generators — Wave 3.
 * Tools: audio spectrum visualizer, infographic, lower third, logo sting,
 * apply LUT, organize project, batch render, world map, countdown timer.
 */

import { JSX_HELPERS } from "./jsxHelpers.js";
import { VFX_HELPERS } from "./vfxHelpers.js";

function jstr(s: string): string { return JSON.stringify(String(s)); }
function jlit(v: unknown): string { return JSON.stringify(v).replace(/</g, "\\u003c"); }

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
    __rf.encoding = "UTF-8"; __rf.open("w");
    __rf.write("MP_RESULT_BEGIN\\n");
    __rf.write(__result.ok + "|" + __result.output + "|" + __result.error + "\\n");
    __rf.write("MP_LOG_BEGIN\\n");
    __rf.write(__result.log + "\\n");
    __rf.write("MP_RESULT_END\\n");
    __rf.close();
  } catch (eWrite) {}
  $.writeln("MP_RESULT_BEGIN");
  $.writeln(__result.ok + "|" + __result.output + "|" + __result.error);
  $.writeln("MP_LOG_BEGIN"); $.writeln(__result.log); $.writeln("MP_RESULT_END");
  return __result.ok ? "OK" : "ERR";
})();
`;
}

// ============================================================
// build_audio_spectrum_visualizer
// ============================================================
export function generateAudioSpectrumVisualizerJsx(opts: {
  outputAepPath: string;
  style: string;
  audioLayerName: string;
  barCount: number;
  primaryColor: number[];
  accentColor: number[];
  sensitivity: number;
  addGlow: boolean;
  addBackground: boolean;
  backgroundStyle: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    MP.log("Building Audio Spectrum Visualizer: ${opts.style}");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var pCol = ${jlit(opts.primaryColor)};
    var aCol = ${jlit(opts.accentColor)};
    var sens = ${opts.sensitivity};
    var barCount = ${opts.barCount};
    var style = ${jstr(opts.style)};
    var audioName = ${jstr(opts.audioLayerName)};

    // Background.
    ${opts.addBackground ? `
    var bg = comp.layers.addSolid([0.02, 0.02, 0.05], "BG", cw, ch, 1, ${opts.duration});
    if (${jstr(opts.backgroundStyle)} === "dark-gradient") {
      var bgR = bg.property("ADBE Effect Parade").addProperty("ADBE Ramp");
      if (bgR) { try { bgR.property("ADBE Ramp-0001").setValue([cw/2,0]); bgR.property("ADBE Ramp-0003").setValue([cw/2,ch]); bgR.property("ADBE Ramp-0002").setValue([0.04,0.04,0.12,1]); bgR.property("ADBE Ramp-0004").setValue([0,0,0,1]); bgR.property("ADBE Ramp-0005").setValue(2); } catch(e){} }
    }
    ` : ""}

    // NOTE TO USER: Place your audio file on a layer named "Audio" before running.
    // The expressions below reference that layer. If the layer is missing, bars
    // will simply stay at rest position. You can also use the Audio Waveform effect
    // on any footage layer to visualize audio after importing.

    // Audio comment layer (guide).
    var audioNote = comp.layers.addText("[ Place audio on a layer named \\\"" + audioName + "\\\" ]");
    audioNote.name = "MP_AudioGuide";
    try {
      var anDoc = audioNote.property("ADBE Text Properties").property("ADBE Text Document");
      var andv = anDoc.value; andv.fontSize = 18; andv.fillColor = [0.5,0.5,0.5]; andv.justification = ParagraphJustification.CENTER_JUSTIFY; anDoc.setValue(andv);
    } catch(e){}
    var anPos = audioNote.property("ADBE Transform Group").property("ADBE Position");
    if (anPos) anPos.setValue([cw/2, ch * 0.06]);

    if (style === "bars" || style === "mirror-bars") {
      var barW = Math.round((cw * 0.85) / barCount);
      var gap = Math.max(1, Math.round(barW * 0.15));
      var actualBarW = barW - gap;
      var startX = (cw - barCount * barW) / 2 + barW / 2;
      var mirror = style === "mirror-bars";
      for (var bi = 0; bi < barCount; bi++) {
        var xPos = startX + bi * barW;
        var barLayer = comp.layers.addShape();
        barLayer.name = "Bar_" + bi;
        barLayer.blendingMode = BlendingMode.ADD;
        var bRoot = barLayer.property("ADBE Root Vectors Group");
        var bG = bRoot.addProperty("ADBE Vector Group");
        var bV = bG.property("ADBE Vectors Group");
        var bRect = bV.addProperty("ADBE Vector Shape - Rect");
        try { bRect.property("ADBE Vector Rect Size").setValue([actualBarW, ch * 0.5]); } catch(e){}
        // Color gradient from primary to accent based on bar position.
        var t = bi / barCount;
        var barCol = [pCol[0]*(1-t)+aCol[0]*t, pCol[1]*(1-t)+aCol[1]*t, pCol[2]*(1-t)+aCol[2]*t];
        var bFill = bV.addProperty("ADBE Vector Graphic - Fill");
        try { bFill.property("ADBE Vector Fill Color").setValue([barCol[0],barCol[1],barCol[2],1]); } catch(e){}
        var bPos = barLayer.property("ADBE Transform Group").property("ADBE Position");
        if (bPos) bPos.setValue([xPos, mirror ? ch/2 : ch * 0.75]);
        // Expression-driven scale: links to audio amplitude approximation.
        // Uses wiggle as proxy since real audio expressions need the source layer.
        var bSc = barLayer.property("ADBE Transform Group").property("ADBE Scale");
        if (bSc) {
          var freqOffset = 0.5 + (bi / barCount) * 3.0;
          var expr = "var aud = 0; try { aud = thisComp.layer(" + JSON.stringify(audioName) + ").audioLevels.value[0]; } catch(e){} var mapped = Math.max(0, (aud + 60) / 60) * " + (sens * 100) + "; var base = wiggle(" + freqOffset.toFixed(1) + ", mapped * 0.3).x; [100, Math.max(2, mapped + Math.abs(base) * 0.5)];";
          try { bSc.expression = expr; } catch(eExpr) {
            // Fallback: animate with wiggle keyframes.
            bSc.setValueAtTime(0, [100, 5]);
            bSc.setValueAtTime(${opts.duration}/2, [100, 60 + bi * 1.2]);
            bSc.setValueAtTime(${opts.duration}, [100, 5]);
          }
        }
        if (${opts.addGlow}) {
          var bGlow = barLayer.property("ADBE Effect Parade").addProperty("ADBE Glow");
          if (bGlow) { try { bGlow.property("ADBE Glow-0003").setValue(20); bGlow.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
        }
      }
    } else if (style === "waveform" || style === "circle-waveform") {
      var waveShape = comp.layers.addShape();
      waveShape.name = "MP_Waveform";
      waveShape.blendingMode = BlendingMode.ADD;
      var wRoot = waveShape.property("ADBE Root Vectors Group");
      var wG = wRoot.addProperty("ADBE Vector Group");
      var wV = wG.property("ADBE Vectors Group");
      var wPath = wV.addProperty("ADBE Vector Shape - Group");
      // Build static path; expression would morph it.
      try {
        var wShp = new Shape();
        var numPts = 128; var wVerts = [];
        for (var wi = 0; wi < numPts; wi++) {
          if (style === "circle-waveform") {
            var ang = (wi / numPts) * Math.PI * 2;
            var r = Math.min(cw,ch) * 0.3;
            wVerts.push([Math.cos(ang)*r, Math.sin(ang)*r]);
          } else {
            wVerts.push([(wi/(numPts-1)-0.5)*cw*0.8, 0]);
          }
        }
        wShp.vertices = wVerts; wShp.closed = style === "circle-waveform";
        wPath.property("ADBE Vector Shape").setValue(wShp);
      } catch(e){}
      var wStr = wV.addProperty("ADBE Vector Graphic - Stroke");
      try { wStr.property("ADBE Vector Stroke Color").setValue([pCol[0],pCol[1],pCol[2],1]); wStr.property("ADBE Vector Stroke Width").setValue(3); } catch(e){}
      var wPos = waveShape.property("ADBE Transform Group").property("ADBE Position");
      if (wPos) wPos.setValue([cw/2, ch/2]);
      var wTD = waveShape.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace");
      if (wTD) { try { wTD.property("ADBE Turbulent Displace-0003").setValue(40 * sens); var wEvo = wTD.property("ADBE Turbulent Displace-0009"); if (wEvo) { wEvo.setValueAtTime(0,0); wEvo.setValueAtTime(${opts.duration}, 5); } } catch(e){} }
      if (${opts.addGlow}) {
        var wGlow = waveShape.property("ADBE Effect Parade").addProperty("ADBE Glow");
        if (wGlow) { try { wGlow.property("ADBE Glow-0003").setValue(30); wGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
      }
    } else if (style === "radial") {
      // Radial burst bars.
      var numRays = 72;
      for (var ri = 0; ri < numRays; ri++) {
        var ray = comp.layers.addShape();
        ray.name = "Ray_" + ri;
        ray.blendingMode = BlendingMode.ADD;
        ray.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
        var rayRoot = ray.property("ADBE Root Vectors Group");
        var rayG = rayRoot.addProperty("ADBE Vector Group");
        var rayV = rayG.property("ADBE Vectors Group");
        var rayRect = rayV.addProperty("ADBE Vector Shape - Rect");
        try { rayRect.property("ADBE Vector Rect Size").setValue([3, ch*0.25]); rayRect.property("ADBE Vector Rect Position").setValue([0, -ch*0.18]); } catch(e){}
        var t2 = ri / numRays;
        var rayCol = [pCol[0]*(1-t2)+aCol[0]*t2, pCol[1]*(1-t2)+aCol[1]*t2, pCol[2]*(1-t2)+aCol[2]*t2];
        var rayFill = rayV.addProperty("ADBE Vector Graphic - Fill");
        try { rayFill.property("ADBE Vector Fill Color").setValue([rayCol[0],rayCol[1],rayCol[2],1]); } catch(e){}
        var rayTrans = rayG.property("ADBE Vector Transform Group");
        try { rayTrans.property("ADBE Vector Rotation").setValue(ri * (360/numRays)); } catch(e){}
        var raySc = ray.property("ADBE Transform Group").property("ADBE Scale");
        if (raySc) {
          raySc.setValueAtTime(0, [100, 20]);
          raySc.setValueAtTime(${opts.duration}*0.25, [100, 80+ri%12*5]);
          raySc.setValueAtTime(${opts.duration}*0.5, [100, 30]);
          raySc.setValueAtTime(${opts.duration}*0.75, [100, 95+ri%8*6]);
          raySc.setValueAtTime(${opts.duration}, [100, 20]);
        }
        if (${opts.addGlow}) {
          var rayGlow = ray.property("ADBE Effect Parade").addProperty("ADBE Glow");
          if (rayGlow) { try { rayGlow.property("ADBE Glow-0003").setValue(15); rayGlow.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
        }
      }
    } else {
      // particles style.
      MPVFX.run(comp, "particularFairyDust", { color: pCol, strength: 400 });
      MPVFX.run(comp, "cinematicBloom", { strength: 1.2 });
    }

    // Finish.
    MPVFX.run(comp, "cinematicGrade", {});
    MP.log("Audio spectrum visualizer built: " + style + ", " + barCount + " bars");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// build_infographic_animation
// ============================================================
export function generateInfographicAnimationJsx(opts: {
  outputAepPath: string;
  chartType: string;
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  subtitle?: string;
  primaryColor: number[];
  palette?: string[];
  animationStyle: string;
  addGrid: boolean;
  addLabels: boolean;
  addLegend: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const maxVal = Math.max(...opts.data.map(d => d.value));
  const palette = opts.palette ?? ["#3380FF","#FF4060","#20D090","#FFB020","#A040FF","#FF6820","#20B0FF","#FF2080","#40E060","#FFE020"];

  const body = `
    app.newProject();
    MP.log("Building Infographic: ${opts.chartType}");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var pCol = ${jlit(opts.primaryColor)};
    var data = ${jlit(opts.data)};
    var maxVal = ${maxVal};
    var chartType = ${jstr(opts.chartType)};
    var animStyle = ${jstr(opts.animationStyle)};
    var palette = ${jlit(palette)};
    function hexToRGB(hex) { if(hex&&hex.charAt(0)==="#")hex=hex.substr(1); return [parseInt(hex.substr(0,2),16)/255,parseInt(hex.substr(2,2),16)/255,parseInt(hex.substr(4,2),16)/255]; }

    // Background.
    var bg = comp.layers.addSolid([0.97,0.97,0.98], "BG", cw, ch, 1, ${opts.duration});

    // Title.
    ${opts.title ? `
    var titleL = comp.layers.addText(${jstr(opts.title)});
    titleL.name = "MP_Chart_Title";
    try { var td = titleL.property("ADBE Text Properties").property("ADBE Text Document"); var tv = td.value; tv.fontSize = Math.round(cw*0.035); tv.fillColor = [0.1,0.1,0.15]; tv.font = "Arial Black"; tv.justification = ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv); } catch(e){}
    var tPos = titleL.property("ADBE Transform Group").property("ADBE Position"); if (tPos) tPos.setValue([cw/2, ch*0.07]);
    var tSc = titleL.property("ADBE Transform Group").property("ADBE Scale"); if (tSc) { tSc.setValueAtTime(0,[0,0]); tSc.setValueAtTime(0.3,[100,100]); MP.setEase(tSc,"expoOut"); }
    ` : ""}

    // Chart area.
    var chartX = cw * 0.1; var chartY = ch * 0.15; var chartW = cw * 0.8; var chartH = ch * 0.65;
    var stagger = Math.min(0.15, (${opts.duration} * 0.5) / data.length);

    if (chartType === "bar" || chartType === "horizontal-bar") {
      var isHoriz = chartType === "horizontal-bar";
      ${opts.addGrid ? `
      for (var gi = 0; gi <= 5; gi++) {
        var gridLine = comp.layers.addShape(); gridLine.name = "Grid_" + gi;
        var glRoot = gridLine.property("ADBE Root Vectors Group");
        var glG = glRoot.addProperty("ADBE Vector Group"); var glV = glG.property("ADBE Vectors Group");
        var glPath = glV.addProperty("ADBE Vector Shape - Group");
        try {
          var glShp = new Shape();
          if (isHoriz) { var gy2 = chartY + gi*(chartH/5); glShp.vertices = [[chartX,gy2],[chartX+chartW,gy2]]; }
          else { var gy2 = chartY + gi*(chartH/5); glShp.vertices = [[chartX,gy2],[chartX+chartW,gy2]]; }
          glShp.closed = false; glPath.property("ADBE Vector Shape").setValue(glShp);
        } catch(e){}
        var glStr = glV.addProperty("ADBE Vector Graphic - Stroke");
        try { glStr.property("ADBE Vector Stroke Color").setValue([0.85,0.85,0.88,1]); glStr.property("ADBE Vector Stroke Width").setValue(1); } catch(e){}
      }
      ` : ""}

      var barSlot = isHoriz ? chartH / data.length : chartW / data.length;
      var barThick = barSlot * 0.6;
      for (var di = 0; di < data.length; di++) {
        var d = data[di];
        var frac = d.value / maxVal;
        var col3 = d.color ? hexToRGB(d.color) : hexToRGB(palette[di % palette.length]);
        var t0bar = di * stagger;

        var barShape = comp.layers.addShape(); barShape.name = "Bar_" + di;
        var bRoot2 = barShape.property("ADBE Root Vectors Group");
        var bG2 = bRoot2.addProperty("ADBE Vector Group"); var bV2 = bG2.property("ADBE Vectors Group");
        var bRect2 = bV2.addProperty("ADBE Vector Shape - Rect");
        var bFill2 = bV2.addProperty("ADBE Vector Graphic - Fill");
        try { bFill2.property("ADBE Vector Fill Color").setValue([col3[0],col3[1],col3[2],1]); } catch(e){}

        var bPos2 = barShape.property("ADBE Transform Group").property("ADBE Position");
        var bSc2 = barShape.property("ADBE Transform Group").property("ADBE Scale");

        if (isHoriz) {
          var barLen = chartW * frac;
          try { bRect2.property("ADBE Vector Rect Size").setValue([barLen, barThick]); bRect2.property("ADBE Vector Rect Position").setValue([barLen/2-chartW/2, 0]); } catch(e){}
          if (bPos2) bPos2.setValue([chartX + chartW/2, chartY + di*barSlot + barSlot/2]);
          if (bSc2) { bSc2.setValueAtTime(t0bar,[0,100]); bSc2.setValueAtTime(t0bar+0.5,[100,100]); MP.setEase(bSc2,"expoOut"); }
        } else {
          var barH2 = chartH * frac;
          try { bRect2.property("ADBE Vector Rect Size").setValue([barThick, barH2]); bRect2.property("ADBE Vector Rect Position").setValue([0, -barH2/2]); } catch(e){}
          if (bPos2) bPos2.setValue([chartX + di*barSlot + barSlot/2, chartY + chartH]);
          if (bSc2) { bSc2.setValueAtTime(t0bar,[100,0]); bSc2.setValueAtTime(t0bar+0.5,[100,100]); MP.setEase(bSc2,"expoOut"); }
        }

        // Label.
        ${opts.addLabels ? `
        var lbl = comp.layers.addText(d.label);
        lbl.name = "Lbl_" + di;
        try { var ld = lbl.property("ADBE Text Properties").property("ADBE Text Document"); var lv = ld.value; lv.fontSize = Math.round(barSlot*0.28); lv.fillColor = [0.2,0.2,0.25]; lv.justification = ParagraphJustification.CENTER_JUSTIFY; ld.setValue(lv); } catch(e){}
        var lPos = lbl.property("ADBE Transform Group").property("ADBE Position");
        if (isHoriz) { if (lPos) lPos.setValue([chartX - 60, chartY + di*barSlot + barSlot/2]); }
        else { if (lPos) lPos.setValue([chartX + di*barSlot + barSlot/2, chartY + chartH + 30]); }
        var lOp = lbl.property("ADBE Transform Group").property("ADBE Opacity");
        if (lOp) { lOp.setValueAtTime(t0bar, 0); lOp.setValueAtTime(t0bar+0.3, 100); }
        ` : ""}
      }

    } else if (chartType === "pie" || chartType === "donut") {
      var isDonut = chartType === "donut";
      var total = 0; for (var di2 = 0; di2 < data.length; di2++) total += data[di2].value;
      var cx = cw/2; var cy = ch/2; var outerR = Math.min(chartW,chartH)*0.4;
      var innerR = isDonut ? outerR * 0.55 : 0;
      var startAngle = -90;
      for (var di3 = 0; di3 < data.length; di3++) {
        var d3 = data[di3]; var sliceDeg = (d3.value / total) * 360;
        var col4 = d3.color ? hexToRGB(d3.color) : hexToRGB(palette[di3 % palette.length]);
        var slice = comp.layers.addShape(); slice.name = "Slice_" + di3;
        slice.property("ADBE Transform Group").property("ADBE Position").setValue([cx,cy]);
        var slRoot = slice.property("ADBE Root Vectors Group");
        var slG = slRoot.addProperty("ADBE Vector Group"); var slV = slG.property("ADBE Vectors Group");
        // Build arc path.
        var arcPts = []; var numArcPts = Math.max(8, Math.round(sliceDeg/5));
        for (var api = 0; api <= numArcPts; api++) {
          var ang = (startAngle + (api/numArcPts)*sliceDeg) * Math.PI / 180;
          arcPts.push([Math.cos(ang)*outerR, Math.sin(ang)*outerR]);
        }
        if (isDonut) {
          for (var api2 = numArcPts; api2 >= 0; api2--) {
            var ang2 = (startAngle + (api2/numArcPts)*sliceDeg) * Math.PI / 180;
            arcPts.push([Math.cos(ang2)*innerR, Math.sin(ang2)*innerR]);
          }
        } else { arcPts.push([0,0]); }
        var slPath = slV.addProperty("ADBE Vector Shape - Group");
        try { var slShp = new Shape(); slShp.vertices = arcPts; slShp.closed = true; slPath.property("ADBE Vector Shape").setValue(slShp); } catch(e){}
        var slFill = slV.addProperty("ADBE Vector Graphic - Fill");
        try { slFill.property("ADBE Vector Fill Color").setValue([col4[0],col4[1],col4[2],1]); } catch(e){}
        var slSc = slice.property("ADBE Transform Group").property("ADBE Scale");
        var t0sl = di3 * stagger;
        if (slSc) { slSc.setValueAtTime(t0sl,[0,0]); slSc.setValueAtTime(t0sl+0.4,[105,105]); slSc.setValueAtTime(t0sl+0.55,[100,100]); MP.setEase(slSc,"expoOut"); }
        startAngle += sliceDeg;
      }

    } else if (chartType === "counter") {
      // Animated number counter.
      var counterL = comp.layers.addText("0");
      counterL.name = "MP_Counter";
      try {
        var cd = counterL.property("ADBE Text Properties").property("ADBE Text Document");
        var cv = cd.value; cv.fontSize = Math.round(ch*0.18); cv.fillColor = [pCol[0],pCol[1],pCol[2]]; cv.font = "Arial Black"; cv.justification = ParagraphJustification.CENTER_JUSTIFY; cd.setValue(cv);
      } catch(e){}
      var cPos = counterL.property("ADBE Transform Group").property("ADBE Position"); if (cPos) cPos.setValue([cw/2, ch/2]);
      var targetVal = data[0] ? data[0].value : 100;
      try {
        var counterExpr = "var t = time / " + ${opts.duration} + "; Math.round(t * " + targetVal + ").toString();";
        counterL.property("ADBE Text Properties").property("ADBE Text Document").expression = counterExpr;
      } catch(eExpr) {
        // Keyframe fallback.
        var cDoc = counterL.property("ADBE Text Properties").property("ADBE Text Document");
        cDoc.setValueAtTime(0, cDoc.value);
        cDoc.setValueAtTime(${opts.duration}, cDoc.value);
      }
      MPVFX.run(comp, "cinematicBloom", { strength: 0.6 });

    } else if (chartType === "progress-ring") {
      var prComp = comp;
      var prCx = cw/2; var prCy = ch/2; var prR = Math.min(cw,ch)*0.3;
      // Background ring.
      var bgRing = prComp.layers.addShape(); bgRing.name = "ProgressRing_BG";
      bgRing.property("ADBE Transform Group").property("ADBE Position").setValue([prCx,prCy]);
      var bgRRoot = bgRing.property("ADBE Root Vectors Group");
      var bgRG = bgRRoot.addProperty("ADBE Vector Group"); var bgRV = bgRG.property("ADBE Vectors Group");
      var bgREll = bgRV.addProperty("ADBE Vector Shape - Ellipse"); try { bgREll.property("ADBE Vector Ellipse Size").setValue([prR*2,prR*2]); } catch(e){}
      var bgRStr = bgRV.addProperty("ADBE Vector Graphic - Stroke"); try { bgRStr.property("ADBE Vector Stroke Color").setValue([0.85,0.85,0.9,1]); bgRStr.property("ADBE Vector Stroke Width").setValue(20); } catch(e){}
      // Progress ring.
      var pRing = prComp.layers.addShape(); pRing.name = "ProgressRing_Fill";
      pRing.property("ADBE Transform Group").property("ADBE Position").setValue([prCx,prCy]);
      var pRRoot = pRing.property("ADBE Root Vectors Group");
      var pRG = pRRoot.addProperty("ADBE Vector Group"); var pRV = pRG.property("ADBE Vectors Group");
      var pREll = pRV.addProperty("ADBE Vector Shape - Ellipse"); try { pREll.property("ADBE Vector Ellipse Size").setValue([prR*2,prR*2]); } catch(e){}
      var pRStr = pRV.addProperty("ADBE Vector Graphic - Stroke"); try { pRStr.property("ADBE Vector Stroke Color").setValue([pCol[0],pCol[1],pCol[2],1]); pRStr.property("ADBE Vector Stroke Width").setValue(20); } catch(e){}
      var pRTrim = pRV.addProperty("ADBE Vector Filter - Trim");
      if (pRTrim) {
        try { var pRTrimEnd = pRTrim.property("ADBE Vector Trim End"); if (pRTrimEnd) { pRTrimEnd.setValueAtTime(0,0); pRTrimEnd.setValueAtTime(${opts.duration}*0.7, (data[0].value/maxVal)*100); MP.setEase(pRTrimEnd,"expoOut"); } } catch(e){}
      }
      var pRGlow = pRing.property("ADBE Effect Parade").addProperty("ADBE Glow"); if (pRGlow) { try { pRGlow.property("ADBE Glow-0003").setValue(30); pRGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
    }

    // Legend.
    ${opts.addLegend ? `
    for (var li = 0; li < Math.min(data.length, 8); li++) {
      var lD = data[li]; var lCol = lD.color ? hexToRGB(lD.color) : hexToRGB(palette[li % palette.length]);
      var legDot = comp.layers.addShape(); legDot.name = "Leg_Dot_" + li;
      var legX = cw*0.1 + li*(cw*0.1); var legY = ch*0.9;
      legDot.property("ADBE Transform Group").property("ADBE Position").setValue([legX, legY]);
      var ldRoot = legDot.property("ADBE Root Vectors Group"); var ldG = ldRoot.addProperty("ADBE Vector Group"); var ldV = ldG.property("ADBE Vectors Group");
      var ldEll = ldV.addProperty("ADBE Vector Shape - Ellipse"); try { ldEll.property("ADBE Vector Ellipse Size").setValue([14,14]); } catch(e){}
      var ldFill = ldV.addProperty("ADBE Vector Graphic - Fill"); try { ldFill.property("ADBE Vector Fill Color").setValue([lCol[0],lCol[1],lCol[2],1]); } catch(e){}
      var legTxt = comp.layers.addText(lD.label); legTxt.name = "Leg_Lbl_" + li;
      try { var ld2 = legTxt.property("ADBE Text Properties").property("ADBE Text Document"); var lv2 = ld2.value; lv2.fontSize = 14; lv2.fillColor = [0.3,0.3,0.35]; ld2.setValue(lv2); } catch(e){}
      var ltp = legTxt.property("ADBE Transform Group").property("ADBE Position"); if (ltp) ltp.setValue([legX+10, legY+20]);
    }
    ` : ""}

    // Subtitle.
    ${opts.subtitle ? `
    var subL = comp.layers.addText(${jstr(opts.subtitle)});
    subL.name = "MP_Chart_Subtitle";
    try { var sd = subL.property("ADBE Text Properties").property("ADBE Text Document"); var sv = sd.value; sv.fontSize = 16; sv.fillColor = [0.5,0.5,0.55]; sv.justification = ParagraphJustification.CENTER_JUSTIFY; sd.setValue(sv); } catch(e){}
    var sPos = subL.property("ADBE Transform Group").property("ADBE Position"); if (sPos) sPos.setValue([cw/2, ch*0.95]);
    ` : ""}

    MP.log("Infographic built: " + chartType + " with " + data.length + " data points");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// build_lower_third
// ============================================================
export function generateLowerThirdJsx(opts: {
  outputAepPath: string;
  name: string;
  title: string;
  style: string;
  primaryColor: number[];
  textColor: number[];
  animateIn: string;
  holdDuration: number;
  generateVariants: number;
  additionalNames?: Array<{ name: string; title: string }>;
  width: number;
  height: number;
  fps: number;
  compName: string;
}): string {
  const allNames = [{ name: opts.name, title: opts.title }, ...(opts.additionalNames ?? [])];
  const variantCount = Math.min(opts.generateVariants, allNames.length);

  const body = `
    app.newProject();
    MP.log("Building Lower Third: ${opts.style}");
    var cw = ${opts.width}; var ch = ${opts.height};
    var pCol = ${jlit(opts.primaryColor)};
    var tCol = ${jlit(opts.textColor)};
    var style = ${jstr(opts.style)};
    var animateIn = ${jstr(opts.animateIn)};
    var holdDur = ${opts.holdDuration};
    var names = ${jlit(allNames)};
    var variantCount = ${variantCount};

    for (var vi = 0; vi < variantCount; vi++) {
      var nameData = names[vi] || names[0];
      var compName2 = ${jstr(opts.compName)} + (variantCount > 1 ? "_v" + (vi+1) : "");
      var totalDur = 0.6 + holdDur + 0.5;
      var comp = app.project.items.addComp(compName2, cw, ch, 1, totalDur, ${opts.fps});

      // Placeholder background (transparent in final use).
      var bgGuide = comp.layers.addSolid([0.08,0.08,0.1], "BG_Guide", cw, ch, 1, totalDur);
      var bgOp = bgGuide.property("ADBE Transform Group").property("ADBE Opacity"); if (bgOp) bgOp.setValue(30);

      var baseY = ch * 0.78;
      var t0 = 0.1;

      if (style === "broadcast") {
        // Colored bar + white name + subtitle.
        var bar = comp.layers.addShape(); bar.name = "LT_Bar";
        var barRoot = bar.property("ADBE Root Vectors Group");
        var barG = barRoot.addProperty("ADBE Vector Group"); var barV = barG.property("ADBE Vectors Group");
        var barRect = barV.addProperty("ADBE Vector Shape - Rect");
        try { barRect.property("ADBE Vector Rect Size").setValue([cw*0.45, 6]); barRect.property("ADBE Vector Rect Position").setValue([cw*0.225-cw/2, 0]); } catch(e){}
        var barFill = barV.addProperty("ADBE Vector Graphic - Fill"); try { barFill.property("ADBE Vector Fill Color").setValue([pCol[0],pCol[1],pCol[2],1]); } catch(e){}
        bar.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.07, baseY - 8]);
        var barSc = bar.property("ADBE Transform Group").property("ADBE Scale");
        if (barSc) { barSc.setValueAtTime(t0,[0,100]); barSc.setValueAtTime(t0+0.35,[100,100]); MP.setEase(barSc,"expoOut"); }

        // Name.
        var nameL = comp.layers.addText(nameData.name);
        nameL.name = "LT_Name";
        try { var nd = nameL.property("ADBE Text Properties").property("ADBE Text Document"); var nv = nd.value; nv.fontSize = Math.round(ch*0.045); nv.fillColor = [tCol[0],tCol[1],tCol[2]]; nv.font = "Arial Black"; nd.setValue(nv); } catch(e){}
        var nPos = nameL.property("ADBE Transform Group").property("ADBE Position"); if (nPos) nPos.setValue([cw*0.07, baseY - 30]);
        var nOp = nameL.property("ADBE Transform Group").property("ADBE Opacity"); if (nOp) { nOp.setValueAtTime(t0+0.2, 0); nOp.setValueAtTime(t0+0.45, 100); }

        // Title.
        var titL = comp.layers.addText(nameData.title);
        titL.name = "LT_Title";
        try { var td2 = titL.property("ADBE Text Properties").property("ADBE Text Document"); var tv2 = td2.value; tv2.fontSize = Math.round(ch*0.028); tv2.fillColor = [pCol[0]+0.2,pCol[1]+0.2,pCol[2]+0.2]; tv2.font = "Arial"; td2.setValue(tv2); } catch(e){}
        var tPos2 = titL.property("ADBE Transform Group").property("ADBE Position"); if (tPos2) tPos2.setValue([cw*0.07, baseY + 8]);
        var tOp2 = titL.property("ADBE Transform Group").property("ADBE Opacity"); if (tOp2) { tOp2.setValueAtTime(t0+0.3, 0); tOp2.setValueAtTime(t0+0.55, 100); }

        // Slide out.
        var barSc2 = bar.property("ADBE Transform Group").property("ADBE Scale");
        var nOp2 = nameL.property("ADBE Transform Group").property("ADBE Opacity");
        var tOp3 = titL.property("ADBE Transform Group").property("ADBE Opacity");
        var outT = t0 + holdDur;
        if (barSc2) { barSc2.setValueAtTime(outT+0.1,[100,100]); barSc2.setValueAtTime(outT+0.4,[0,100]); MP.setEase(barSc2,"expoIn"); }
        if (nOp2) { nOp2.setValueAtTime(outT, 100); nOp2.setValueAtTime(outT+0.3, 0); }
        if (tOp3) { tOp3.setValueAtTime(outT, 100); tOp3.setValueAtTime(outT+0.25, 0); }

      } else if (style === "neon") {
        var nameL2 = comp.layers.addText(nameData.name); nameL2.name = "LT_Name";
        try { var nd2 = nameL2.property("ADBE Text Properties").property("ADBE Text Document"); var nv2 = nd2.value; nv2.fontSize = Math.round(ch*0.06); nv2.fillColor = [pCol[0],pCol[1],pCol[2]]; nv2.font = "Arial Black"; nd2.setValue(nv2); } catch(e){}
        nameL2.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.5, baseY - 20]);
        MPVFX.run(comp, "neonGlow", { targetLayer: "LT_Name", color: pCol });
        var titL2 = comp.layers.addText(nameData.title); titL2.name = "LT_Title";
        try { var td3 = titL2.property("ADBE Text Properties").property("ADBE Text Document"); var tv3 = td3.value; tv3.fontSize = Math.round(ch*0.03); tv3.fillColor = [0.8,0.8,1]; tv3.font = "Arial"; td3.setValue(tv3); } catch(e){}
        titL2.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.5, baseY + 20]);
        var n2Op = nameL2.property("ADBE Transform Group").property("ADBE Opacity"); if (n2Op) { n2Op.setValueAtTime(t0,0); n2Op.setValueAtTime(t0+0.3,100); n2Op.setValueAtTime(t0+holdDur+0.2,100); n2Op.setValueAtTime(t0+holdDur+0.5,0); }
        var t2Op = titL2.property("ADBE Transform Group").property("ADBE Opacity"); if (t2Op) { t2Op.setValueAtTime(t0+0.2,0); t2Op.setValueAtTime(t0+0.45,100); t2Op.setValueAtTime(t0+holdDur+0.2,100); t2Op.setValueAtTime(t0+holdDur+0.5,0); }

      } else {
        // Minimal / default.
        var mNameL = comp.layers.addText(nameData.name); mNameL.name = "LT_Name";
        try { var mnd = mNameL.property("ADBE Text Properties").property("ADBE Text Document"); var mnv = mnd.value; mnv.fontSize = Math.round(ch*0.05); mnv.fillColor = [tCol[0],tCol[1],tCol[2]]; mnv.font = "Arial Black"; mnd.setValue(mnv); } catch(e){}
        mNameL.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.07, baseY - 20]);
        var mTitL = comp.layers.addText(nameData.title); mTitL.name = "LT_Title";
        try { var mtd = mTitL.property("ADBE Text Properties").property("ADBE Text Document"); var mtv = mtd.value; mtv.fontSize = Math.round(ch*0.025); mtv.fillColor = [0.6,0.6,0.7]; mtv.font = "Arial"; mtd.setValue(mtv); } catch(e){}
        mTitL.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.07, baseY + 14]);
        var mnOp = mNameL.property("ADBE Transform Group").property("ADBE Opacity"); if (mnOp) { mnOp.setValueAtTime(t0,0); mnOp.setValueAtTime(t0+0.4,100); mnOp.setValueAtTime(t0+holdDur,100); mnOp.setValueAtTime(t0+holdDur+0.4,0); }
        var mtOp = mTitL.property("ADBE Transform Group").property("ADBE Opacity"); if (mtOp) { mtOp.setValueAtTime(t0+0.15,0); mtOp.setValueAtTime(t0+0.5,100); mtOp.setValueAtTime(t0+holdDur,100); mtOp.setValueAtTime(t0+holdDur+0.4,0); }
      }

      MP.log("Lower third variant " + (vi+1) + " built: " + nameData.name);
    }

    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// build_logo_sting
// ============================================================
export function generateLogoStingJsx(opts: {
  outputAepPath: string;
  logoText: string;
  tagline?: string;
  style: string;
  primaryColor: number[];
  accentColor: number[];
  duration: number;
  addSound: boolean;
  width: number;
  height: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    MP.log("Building Logo Sting: ${opts.style}");
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = ${opts.width}; var ch = ${opts.height};
    var pCol = ${jlit(opts.primaryColor)};
    var aCol = ${jlit(opts.accentColor)};
    var style = ${jstr(opts.style)};
    var dur = ${opts.duration};

    // Dark background.
    comp.layers.addSolid([0.02,0.02,0.04], "BG", cw, ch, 1, dur);

    // Logo text layer.
    var logoLayer = comp.layers.addText(${jstr(opts.logoText)});
    logoLayer.name = "MP_Logo";
    try {
      var ld = logoLayer.property("ADBE Text Properties").property("ADBE Text Document");
      var lv = ld.value; lv.fontSize = Math.round(cw * 0.12); lv.fillColor = [pCol[0],pCol[1],pCol[2]];
      lv.font = "Arial Black"; lv.justification = ParagraphJustification.CENTER_JUSTIFY; ld.setValue(lv);
    } catch(e){}
    var lPos = logoLayer.property("ADBE Transform Group").property("ADBE Position"); if (lPos) lPos.setValue([cw/2, ch/2]);
    var lSc = logoLayer.property("ADBE Transform Group").property("ADBE Scale");
    var lOp = logoLayer.property("ADBE Transform Group").property("ADBE Opacity");

    if (style === "reveal" || style === "particles") {
      if (lSc) { lSc.setValueAtTime(0,[0,0]); lSc.setValueAtTime(dur*0.45,[105,105]); lSc.setValueAtTime(dur*0.6,[100,100]); MP.setEase(lSc,"expoOut"); }
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(dur*0.3,100); }
      MPVFX.run(comp, "particularFairyDust", { color: aCol, strength: 300 });
      MPVFX.run(comp, "energyBurst", { start: dur*0.35, duration: 0.8, color: aCol });
    } else if (style === "explosion") {
      MPVFX.run(comp, "muzzleFlash", { start: 0.05, radius: 200, color: [1,1,1] });
      MPVFX.run(comp, "shockwave", { start: 0.05, duration: 0.6, strength: 25 });
      MPVFX.run(comp, "energyBurst", { start: 0, duration: 1.0, color: aCol });
      if (lSc) { lSc.setValueAtTime(0,[200,200]); lSc.setValueAtTime(0.3,[100,100]); lSc.setValueAtTime(0.45,[103,103]); lSc.setValueAtTime(0.6,[100,100]); MP.setEase(lSc,"expoOut"); }
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(0.08,100); }
    } else if (style === "elegant") {
      if (lSc) { lSc.setValueAtTime(0,[95,95]); lSc.setValueAtTime(dur*0.5,[100,100]); MP.setEase(lSc,"sineOut"); }
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(dur*0.4,100); }
      MPVFX.run(comp, "lightSweep", { start: dur*0.4, duration: 1.2, targetLayer: "MP_Logo" });
      MPVFX.run(comp, "atmosphericFog", { strength: 20 });
      MPVFX.run(comp, "trapcodeShine", { strength: 2.5, color: [1, 0.9, 0.8] });
    } else if (style === "glitch") {
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(0.05,0); lOp.setValueAtTime(0.1,100); lOp.setValueAtTime(0.15,40); lOp.setValueAtTime(0.2,100); lOp.setValueAtTime(0.35,60); lOp.setValueAtTime(0.45,100); }
      MPVFX.run(comp, "glitch", { start: 0, duration: 0.5 });
      MPVFX.run(comp, "rgbSplit", { strength: 8, targetLayer: "MP_Logo" });
      MPVFX.run(comp, "digitalRain", { columns: 12, color: aCol, duration: dur });
    } else if (style === "neon") {
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(0.1,60); lOp.setValueAtTime(0.2,20); lOp.setValueAtTime(0.3,80); lOp.setValueAtTime(0.5,100); }
      MPVFX.run(comp, "neonGlow", { targetLayer: "MP_Logo", color: aCol });
      MPVFX.run(comp, "trapcodeStarglow", { streakLength: 18, boost: 2.0, color: aCol });
    } else if (style === "film") {
      MPVFX.run(comp, "opticalFlaresHero", { start: 0, duration: dur*0.6, brightness: 100 });
      MPVFX.run(comp, "trapcodeShine", { strength: 5, color: [1,0.9,0.7] });
      if (lSc) { lSc.setValueAtTime(0,[90,90]); lSc.setValueAtTime(dur*0.5,[100,100]); MP.setEase(lSc,"sineOut"); }
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(dur*0.3,100); }
      MPVFX.run(comp, "atmosphericFog", { strength: 15 });
    } else {
      // corporate / minimal.
      if (lOp) { lOp.setValueAtTime(0,0); lOp.setValueAtTime(0.5,100); }
      var lPosAnim = logoLayer.property("ADBE Transform Group").property("ADBE Position");
      if (lPosAnim) { lPosAnim.setValueAtTime(0,[cw/2, ch/2+40]); lPosAnim.setValueAtTime(0.5,[cw/2,ch/2]); MP.setEase(lPosAnim,"expoOut"); }
      MPVFX.run(comp, "lightSweep", { start: 0.6, duration: 1.2, targetLayer: "MP_Logo" });
      MPVFX.run(comp, "premiumGlow", { strength: 50, targetLayer: "MP_Logo" });
    }

    // Tagline.
    ${opts.tagline ? `
    var tagL = comp.layers.addText(${jstr(opts.tagline)});
    tagL.name = "MP_Tagline";
    try { var td = tagL.property("ADBE Text Properties").property("ADBE Text Document"); var tv = td.value; tv.fontSize = Math.round(cw*0.025); tv.fillColor = [0.7,0.7,0.75]; tv.font = "Arial"; tv.justification = ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv); } catch(e){}
    var tagPos = tagL.property("ADBE Transform Group").property("ADBE Position"); if (tagPos) tagPos.setValue([cw/2, ch*0.6]);
    var tagOp = tagL.property("ADBE Transform Group").property("ADBE Opacity"); if (tagOp) { tagOp.setValueAtTime(dur*0.5, 0); tagOp.setValueAtTime(dur*0.7, 100); }
    ` : ""}

    // Impact marker.
    ${opts.addSound ? `
    var marker = comp.layers.addNull(dur); marker.name = "MP_SoundMarker";
    try { var mk = new MarkerValue("IMPACT — add SFX here"); comp.layer("MP_SoundMarker").property("ADBE Marker").setValueAtTime(0.08, mk); } catch(e){}
    ` : ""}

    MPVFX.run(comp, "filmGrain", { strength: 5 });
    MPVFX.run(comp, "cinematicGrade", {});
    MP.log("Logo sting built: ${opts.style}");
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// apply_lut_grade
// ============================================================
export function generateApplyLutGradeJsx(opts: {
  aepPath: string;
  outputAepPath: string;
  compName?: string;
  lutPath?: string;
  lutPreset?: string;
  intensity: number;
  addVignette: boolean;
  addGrain: boolean;
}): string {
  const lutPresets: Record<string, number[][]> = {
    "teal-orange":    [[0,0],[0.2,0.15],[0.5,0.5],[0.8,0.88],[1,1]],
    "cold-blue":      [[0,0.04],[0.3,0.2],[0.6,0.62],[1,0.95]],
    "warm-golden":    [[0,0],[0.25,0.3],[0.6,0.68],[1,1]],
    "desaturated":    [[0,0.05],[0.4,0.38],[0.7,0.68],[1,0.93]],
    "neon-vibrant":   [[0,0],[0.3,0.28],[0.6,0.7],[1,1]],
    "bleach-bypass":  [[0,0.08],[0.3,0.25],[0.6,0.6],[1,0.9]],
    "vintage-film":   [[0,0.06],[0.35,0.38],[0.65,0.65],[1,0.92]],
    "monochrome":     [[0,0],[0.3,0.28],[0.7,0.72],[1,1]],
    "cross-process":  [[0,0],[0.2,0.18],[0.5,0.55],[0.8,0.85],[1,1]],
  };
  const curves = lutPresets[opts.lutPreset ?? "teal-orange"] ?? lutPresets["teal-orange"];

  const body = `
    var proj = new File(${jstr(opts.aepPath)});
    if (!proj.exists) throw new Error("AEP not found: " + ${jstr(opts.aepPath)});
    app.open(proj);
    app.beginUndoGroup("MotionPilot LUT Grade");
    var comp = null;
    var wantName = ${opts.compName ? jstr(opts.compName) : "null"};
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem) {
        if (wantName && it.name === wantName) { comp = it; break; }
        if (!comp) comp = it;
      }
    }
    if (!comp) throw new Error("No composition found.");
    MP.log("Applying LUT grade to: " + comp.name);

    // LUT via Apply Color LUT effect or Curves fallback.
    var gradeAdj = comp.layers.addSolid([1,1,1], "MP_LUT_Grade", comp.width, comp.height, 1, comp.duration);
    try { gradeAdj.adjustmentLayer = true; } catch(e){}
    gradeAdj.name = "MP_LUT_Grade";

    ${opts.lutPath ? `
    var lut = gradeAdj.property("ADBE Effect Parade").addProperty("Apply Color LUT");
    if (lut) { try { lut.property("Choose LUT").setValue(${jstr(opts.lutPath)}); } catch(e){} }
    else {
    ` : "{ // No LUT file, use curves preset"}
      var curves = gradeAdj.property("ADBE Effect Parade").addProperty("ADBE CurvesCustom");
      if (curves) {
        try { curves.property("ADBE CurvesCustom-0001").setValue(${jlit(curves)}); } catch(e){}
      }
    }

    // Intensity blend.
    var gradeOp = gradeAdj.property("ADBE Transform Group").property("ADBE Opacity");
    if (gradeOp) gradeOp.setValue(Math.round(${opts.intensity} * 100));

    // Vignette.
    ${opts.addVignette ? `
    var vigAdj = comp.layers.addSolid([0,0,0], "MP_Vignette", comp.width, comp.height, 1, comp.duration);
    try { vigAdj.adjustmentLayer = true; } catch(e){}
    var vigMask = vigAdj.Masks.addProperty("Mask");
    try {
      var vShp = new Shape(); var vCx = comp.width/2; var vCy = comp.height/2;
      var vRx = comp.width*0.42; var vRy = comp.height*0.42;
      var numVp = 40; var vVerts = []; var vIn = []; var vOut = [];
      for (var vpi = 0; vpi < numVp; vpi++) {
        var vang = (vpi/numVp)*Math.PI*2;
        vVerts.push([Math.cos(vang)*vRx, Math.sin(vang)*vRy]);
        var tang = 0.55;
        vIn.push([-Math.sin(vang)*vRx*tang, Math.cos(vang)*vRy*tang]);
        vOut.push([Math.sin(vang)*vRx*tang, -Math.cos(vang)*vRy*tang]);
      }
      vShp.vertices = vVerts; vShp.inTangents = vIn; vShp.outTangents = vOut; vShp.closed = true;
      vigMask.property("ADBE Mask Shape").setValue(vShp);
      vigMask.property("ADBE Mask Mode").setValue(2); // Subtract
      vigMask.property("ADBE Mask Feather").setValue([comp.width*0.25, comp.width*0.25]);
      vigMask.property("ADBE Mask Opacity").setValue(70);
    } catch(eVig){}
    vigAdj.blendingMode = BlendingMode.MULTIPLY;
    var vigOp = vigAdj.property("ADBE Transform Group").property("ADBE Opacity"); if (vigOp) vigOp.setValue(60);
    ` : ""}

    // Film grain.
    ${opts.addGrain ? `
    var grainAdj = comp.layers.addSolid([1,1,1], "MP_Grain", comp.width, comp.height, 1, comp.duration);
    try { grainAdj.adjustmentLayer = true; } catch(e){}
    var noiseGr = grainAdj.property("ADBE Effect Parade").addProperty("ADBE Noise");
    if (noiseGr) { try { noiseGr.property("ADBE Noise-0001").setValue(5); } catch(e){} }
    grainAdj.blendingMode = BlendingMode.OVERLAY;
    var grainOp = grainAdj.property("ADBE Transform Group").property("ADBE Opacity"); if (grainOp) grainOp.setValue(25);
    ` : ""}

    app.endUndoGroup();
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("LUT grade applied: preset=${opts.lutPreset ?? "curves"}, intensity=${opts.intensity}");
  `;
  return withReport(body);
}

// ============================================================
// organize_ae_project
// ============================================================
export function generateOrganizeAeProjectJsx(opts: {
  aepPath: string;
  outputAepPath: string;
  namingConvention: string;
  createFolders: boolean;
  colorCodeLayers: boolean;
  removeUnused: boolean;
  addGuides: boolean;
}): string {
  const body = `
    var proj2 = new File(${jstr(opts.aepPath)});
    if (!proj2.exists) throw new Error("AEP not found: " + ${jstr(opts.aepPath)});
    app.open(proj2);
    app.beginUndoGroup("MotionPilot Organize");
    MP.log("Organizing AE project...");

    // Color labels for layer types.
    // AE label index: 0=none,1=red,2=yellow,3=aqua,4=pink,5=lavender,6=peach,7=sea-foam,
    //                  8=blue,9=green,10=purple,11=orange,12=brown,13=fuchsia,14=cyan,15=sandstone,16=dark-green
    var colorMap = {
      TextLayer: 2,        // yellow
      ShapeLayer: 3,       // aqua
      AVLayer_solid: 11,   // orange (solids)
      AVLayer_adj: 7,      // sea-foam (adjustment)
      CameraLayer: 5,      // lavender
      LightLayer: 6,       // peach
      AVLayer_null: 12,    // brown (nulls)
    };

    ${opts.createFolders ? `
    // Create project folders.
    var folderNames = ["Comps", "Precomps", "Solids", "Footage", "Audio"];
    var folders = {};
    for (var fi = 0; fi < folderNames.length; fi++) {
      var fn2 = folderNames[fi];
      var existingFolder = null;
      for (var pi = 1; pi <= app.project.numItems; pi++) {
        var it = app.project.item(pi);
        if (it instanceof FolderItem && it.name === fn2) { existingFolder = it; break; }
      }
      folders[fn2] = existingFolder || app.project.items.addFolder(fn2);
    }
    MP.log("Created " + folderNames.length + " project folders");
    ` : ""}

    // Process all items.
    var totalLayersColored = 0;
    for (var itemIdx = 1; itemIdx <= app.project.numItems; itemIdx++) {
      var item = app.project.item(itemIdx);
      if (!(item instanceof CompItem)) continue;

      // Color-code layers.
      ${opts.colorCodeLayers ? `
      for (var layIdx = 1; layIdx <= item.numLayers; layIdx++) {
        try {
          var lay = item.layer(layIdx);
          var labelColor = 0;
          if (lay instanceof TextLayer) labelColor = colorMap.TextLayer;
          else if (lay instanceof ShapeLayer) labelColor = colorMap.ShapeLayer;
          else if (lay instanceof CameraLayer) labelColor = colorMap.CameraLayer;
          else if (lay instanceof LightLayer) labelColor = colorMap.LightLayer;
          else if (lay instanceof AVLayer) {
            if (lay.nullLayer) labelColor = colorMap.AVLayer_null;
            else if (lay.adjustmentLayer) labelColor = colorMap.AVLayer_adj;
            else labelColor = colorMap.AVLayer_solid;
          }
          if (labelColor > 0) { lay.label = labelColor; totalLayersColored++; }
        } catch(eLay){}
      }
      ` : ""}

      // Add safe-zone guides.
      ${opts.addGuides ? `
      try {
        var guideComp = item;
        var safeTitle = new Guide(0.9);    // 90% title safe
        var safeAction = new Guide(0.95);  // 95% action safe
        // Guides API not available in all AE versions; use markers instead.
        var guideNull = guideComp.layers.addNull(guideComp.duration);
        guideNull.name = "SAFE_ZONES [title 90% / action 95%]";
        guideNull.label = 15; // sandstone
        guideNull.shy = true;
        guideNull.locked = true;
      } catch(eGuide){}
      ` : ""}
    }

    // Remove unused.
    ${opts.removeUnused ? `
    try { app.project.reduceProject([]); } catch(eReduce) { MP.log("reduceProject skipped: " + eReduce.toString()); }
    ` : ""}

    app.endUndoGroup();
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("Project organized. Layers color-coded: " + totalLayersColored);
  `;
  return withReport(body);
}

// ============================================================
// batch_render_queue
// ============================================================
export function generateBatchRenderQueueJsx(opts: {
  aepPath: string;
  renders: Array<{ compName: string; outputPath: string; format: string; scale?: number }>;
  renderAllComps: boolean;
}): string {
  const body = `
    var proj3 = new File(${jstr(opts.aepPath)});
    if (!proj3.exists) throw new Error("AEP not found: " + ${jstr(opts.aepPath)});
    app.open(proj3);
    MP.log("Setting up batch render queue...");

    var renders = ${jlit(opts.renders)};
    var renderAll = ${opts.renderAllComps};
    var renderQueue = app.project.renderQueue;
    var addedCount = 0;

    if (renderAll) {
      for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem) {
          try {
            var rqi = renderQueue.items.add(it);
            var outMod = rqi.outputModule(1);
            outMod.file = new File(it.name + ".mp4");
            addedCount++;
          } catch(eRqi){}
        }
      }
    } else {
      for (var ri = 0; ri < renders.length; ri++) {
        var rd = renders[ri];
        var comp3 = null;
        for (var ci = 1; ci <= app.project.numItems; ci++) {
          var cit = app.project.item(ci);
          if (cit instanceof CompItem && cit.name === rd.compName) { comp3 = cit; break; }
        }
        if (!comp3) { MP.log("Comp not found: " + rd.compName); continue; }
        try {
          var rqItem = renderQueue.items.add(comp3);
          var outMod2 = rqItem.outputModule(1);
          outMod2.file = new File(rd.outputPath);
          addedCount++;
        } catch(eRqi2){ MP.log("Failed to add " + rd.compName + ": " + eRqi2.toString()); }
      }
    }

    MP.log("Added " + addedCount + " comps to render queue");
    __result.output = "Render queue ready: " + addedCount + " items";
    // Note: we do NOT call renderQueue.render() from within a JSX spawned by runJsx
    // because it would block. The user clicks Render All in the Render Queue panel.
  `;
  return withReport(body);
}

// ============================================================
// export_as_lottie
// ============================================================
export function generateExportAsLottieJsx(opts: {
  aepPath: string;
  compName: string;
  outputJsonPath: string;
  includeAssets: boolean;
  openBodymovinPanel: boolean;
}): string {
  const body = `
    var proj4 = new File(${jstr(opts.aepPath)});
    if (!proj4.exists) throw new Error("AEP not found: " + ${jstr(opts.aepPath)});
    app.open(proj4);
    var comp = null;
    for (var i = 1; i <= app.project.numItems; i++) {
      var it = app.project.item(i);
      if (it instanceof CompItem && it.name === ${jstr(opts.compName)}) { comp = it; break; }
    }
    if (!comp) throw new Error("Comp not found for Lottie export: " + ${jstr(opts.compName)});
    MP.log("Preparing Lottie export for comp: " + comp.name);

    var outputFile = new File(${jstr(opts.outputJsonPath)});
    try { outputFile.parent.create(); } catch(e){}

    var exported = false;
    try {
      if ($.global.bodymovin && $.global.bodymovin.render) {
        $.global.bodymovin.render({
          comp: comp,
          destination: outputFile.fsName,
          assets: ${opts.includeAssets}
        });
        exported = true;
      }
    } catch (eBm) {
      MP.log("Direct Bodymovin export unavailable: " + eBm.toString());
    }

    if (!exported) {
      var note = comp.layers.addText("LOTTIE EXPORT READY: " + outputFile.fsName);
      note.name = "MP_Lottie_Export_Note";
      note.enabled = false;
      ${opts.openBodymovinPanel ? `
      try { app.executeCommand(app.findMenuCommandId("Bodymovin")); } catch(ePanel) { MP.log("Bodymovin panel open skipped: " + ePanel.toString()); }
      ` : ""}
      __result.output = "Bodymovin panel/manual export prepared: " + outputFile.fsName;
    } else {
      __result.output = outputFile.fsName;
    }
    MP.log(exported ? "Lottie JSON exported." : "Lottie export prepared; use Bodymovin panel if JSON was not written.");
  `;
  return withReport(body);
}

// ============================================================
// build_galaxy_scene
// ============================================================
export function generateGalaxySceneJsx(opts: {
  outputAepPath: string;
  galaxyType: string;
  primaryColor: number[];
  nebulaColor: number[];
  starCount: string;
  addCameraMove: boolean;
  addNebula: boolean;
  loopable: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const density: Record<string, number> = { minimal: 80, normal: 180, dense: 320, ultra: 520 };
  const count = density[opts.starCount] ?? 180;
  const body = `
    app.newProject();
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var pCol = ${jlit(opts.primaryColor)}; var nCol = ${jlit(opts.nebulaColor)};
    comp.bgColor = [0,0,0.02];
    var bg = comp.layers.addSolid([0,0,0.02], "BG_Deep_Space", cw, ch, 1, comp.duration);
    ${opts.addNebula ? `
    for (var ni = 0; ni < 5; ni++) {
      var neb = comp.layers.addSolid([nCol[0], nCol[1], nCol[2]], "Nebula_Cloud_" + ni, cw, ch, 1, comp.duration);
      neb.blendingMode = BlendingMode.ADD;
      var fn = neb.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
      if (fn) { try { fn.property("ADBE Fractal Noise-0002").setValue(6); fn.property("ADBE Fractal Noise-0003").setValue(85 + ni*25); fn.property("ADBE Fractal Noise-0006").setValue(180); fn.property("ADBE Fractal Noise-0010").expression = "time*" + (25 + ni*8); } catch(e){} }
      var polar = neb.property("ADBE Effect Parade").addProperty("CC Radial Blur");
      if (polar) { try { polar.property("Amount").setValue(20 + ni*6); polar.property("Type").setValue(2); } catch(e){} }
      var nop = neb.property("ADBE Transform Group").property("ADBE Opacity"); if (nop) nop.setValue(18);
      var nrot = neb.property("ADBE Transform Group").property("ADBE Rotate Z"); if (nrot) nrot.expression = "time*" + (ni%2===0 ? 2 : -1.5);
    }
    ` : ""}
    for (var si = 0; si < ${count}; si++) {
      var star = comp.layers.addShape(); star.name = "Star_" + si; star.blendingMode = BlendingMode.ADD;
      var root = star.property("ADBE Root Vectors Group"); var g = root.addProperty("ADBE Vector Group"); var v = g.property("ADBE Vectors Group");
      var ell = v.addProperty("ADBE Vector Shape - Ellipse"); var size = 1 + (si % 5);
      try { ell.property("ADBE Vector Ellipse Size").setValue([size, size]); } catch(e){}
      var fill = v.addProperty("ADBE Vector Graphic - Fill"); try { fill.property("ADBE Vector Fill Color").setValue([pCol[0],pCol[1],pCol[2],1]); } catch(e){}
      var arm = si % 4; var r = Math.pow(si / ${count}, 0.72) * Math.min(cw,ch) * 0.46; var a = (si * 0.37) + arm * Math.PI/2 + r * 0.012;
      if (${jstr(opts.galaxyType)} === "globular-cluster") { a = si * 2.399; r = Math.sqrt(si/${count}) * Math.min(cw,ch) * 0.36; }
      var x = cw/2 + Math.cos(a) * r + (Math.random()-0.5)*80; var y = ch/2 + Math.sin(a) * r * 0.55 + (Math.random()-0.5)*50;
      var pos = star.property("ADBE Transform Group").property("ADBE Position"); if (pos) pos.setValue([x,y]);
      var op = star.property("ADBE Transform Group").property("ADBE Opacity"); if (op) op.expression = "55 + Math.sin(time*" + (1 + si%7) + "+" + si + ")*35";
    }
    MPVFX.run(comp, "cinematicBloom", { strength: 0.9, radius: 100 });
    ${opts.addCameraMove ? `var camNull = comp.layers.addNull(comp.duration); camNull.name = "CAM_Galaxy_Drift"; var s = bg.property("ADBE Transform Group").property("ADBE Scale"); if (s) { s.setValueAtTime(0,[100,100]); s.setValueAtTime(comp.duration,[112,112]); MP.setEase(s,"sineOut"); }` : ""}
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("Galaxy scene built: " + ${jstr(opts.galaxyType)});
  `;
  return withReport(body);
}

// ============================================================
// build_3d_cityscape
// ============================================================
export function generate3dCityscapeJsx(opts: {
  outputAepPath: string;
  timeOfDay: string;
  cameraMove: string;
  buildingStyle: string;
  cityColor: number[];
  lightColor: number[];
  addFog: boolean;
  addRain: boolean;
  addReflections: boolean;
  buildingCount: number;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var cityCol = ${jlit(opts.cityColor)}; var lightCol = ${jlit(opts.lightColor)};
    var sky = comp.layers.addSolid(${opts.timeOfDay === "day" ? "[0.55,0.72,0.95]" : opts.timeOfDay === "dusk" ? "[0.18,0.12,0.28]" : "[0.02,0.025,0.06]"}, "BG_Sky", cw, ch, 1, comp.duration);
    for (var i = 0; i < ${opts.buildingCount}; i++) {
      var depth = i / ${Math.max(1, opts.buildingCount - 1)};
      var bw = 55 + (i % 5) * 22; var bh = ch * (0.18 + ((i*37)%100)/160);
      var x = (i + 0.5) * (cw / ${opts.buildingCount});
      var b = comp.layers.addShape(); b.name = "Building_" + i; b.threeDLayer = true;
      var root = b.property("ADBE Root Vectors Group"); var g = root.addProperty("ADBE Vector Group"); var v = g.property("ADBE Vectors Group");
      var rect = v.addProperty("ADBE Vector Shape - Rect"); try { rect.property("ADBE Vector Rect Size").setValue([bw,bh]); rect.property("ADBE Vector Rect Position").setValue([0,-bh/2]); } catch(e){}
      var fill = v.addProperty("ADBE Vector Graphic - Fill"); try { fill.property("ADBE Vector Fill Color").setValue([cityCol[0]*(1-depth*0.5),cityCol[1]*(1-depth*0.5),cityCol[2]+depth*0.08,1]); } catch(e){}
      var pos = b.property("ADBE Transform Group").property("ADBE Position"); if (pos) pos.setValue([x, ch*0.92, -depth*900]);
      for (var wx = -2; wx <= 2; wx++) for (var wy = 0; wy < 8; wy++) {
        if (((wx+wy+i)%3)===0) continue;
        var w = comp.layers.addShape(); w.name = "Window_" + i + "_" + wx + "_" + wy; w.parent = b;
        var wr = w.property("ADBE Root Vectors Group"); var wg = wr.addProperty("ADBE Vector Group"); var wv = wg.property("ADBE Vectors Group");
        var we = wv.addProperty("ADBE Vector Shape - Rect"); try { we.property("ADBE Vector Rect Size").setValue([8,12]); } catch(e){}
        var wf = wv.addProperty("ADBE Vector Graphic - Fill"); try { wf.property("ADBE Vector Fill Color").setValue([lightCol[0],lightCol[1],lightCol[2],1]); } catch(e){}
        w.property("ADBE Transform Group").property("ADBE Position").setValue([wx*16, -28 - wy*34]);
        var wo = w.property("ADBE Transform Group").property("ADBE Opacity"); if (wo) wo.expression = "60 + Math.sin(time*2+" + i + wy + ")*30";
      }
    }
    ${opts.addReflections ? `var refl = comp.layers.addSolid([0.02,0.03,0.06], "Wet_Street_Reflection", cw, ch*0.22, 1, comp.duration); refl.blendingMode = BlendingMode.ADD; refl.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch*0.92]); var ro = refl.property("ADBE Transform Group").property("ADBE Opacity"); if (ro) ro.setValue(22);` : ""}
    ${opts.addFog ? `MPVFX.run(comp, "atmosphericFog", { strength: 35 });` : ""}
    ${opts.addRain ? `MPVFX.run(comp, "rainStorm", { strength: 0.7, duration: comp.duration });` : ""}
    var cam = comp.layers.addCamera("Camera_Flythrough", [cw/2, ch/2]); cam.property("ADBE Transform Group").property("ADBE Position").setValueAtTime(0,[cw/2,ch*0.52,-1200]); cam.property("ADBE Transform Group").property("ADBE Position").setValueAtTime(comp.duration,[cw/2 + (${jstr(opts.cameraMove)}==="orbit"?260:0),ch*0.48,-450]);
    MPVFX.run(comp, "cinematicBloom", { strength: 0.45 });
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("3D cityscape built.");
  `;
  return withReport(body);
}

// ============================================================
// build_dna_helix
// ============================================================
export function generateDnaHelixJsx(opts: {
  outputAepPath: string;
  helixColor1: number[];
  helixColor2: number[];
  basePairColor: number[];
  rotationSpeed: number;
  helixTurns: number;
  addLabels: boolean;
  addGlow: boolean;
  cameraAngle: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const pairs = opts.helixTurns * 16;
  const body = `
    app.newProject();
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var c1 = ${jlit(opts.helixColor1)}; var c2 = ${jlit(opts.helixColor2)}; var bp = ${jlit(opts.basePairColor)};
    comp.layers.addSolid([0.01,0.015,0.035], "BG_Lab_Dark", cw, ch, 1, comp.duration);
    var rig = comp.layers.addNull(comp.duration); rig.name = "DNA_Rotation_Rig"; rig.threeDLayer = true;
    for (var i = 0; i < ${pairs}; i++) {
      var t = i / (${pairs}-1); var y = (t - 0.5) * ch * 0.78; var ang = t * Math.PI * 2 * ${opts.helixTurns};
      for (var side = 0; side < 2; side++) {
        var dot = comp.layers.addShape(); dot.name = "DNA_Node_" + i + "_" + side; dot.threeDLayer = true; dot.parent = rig;
        var root = dot.property("ADBE Root Vectors Group"); var g = root.addProperty("ADBE Vector Group"); var v = g.property("ADBE Vectors Group");
        var ell = v.addProperty("ADBE Vector Shape - Ellipse"); try { ell.property("ADBE Vector Ellipse Size").setValue([14,14]); } catch(e){}
        var fill = v.addProperty("ADBE Vector Graphic - Fill"); var cc = side===0?c1:c2; try { fill.property("ADBE Vector Fill Color").setValue([cc[0],cc[1],cc[2],1]); } catch(e){}
        var a2 = ang + side*Math.PI; var x = Math.cos(a2)*180; var z = Math.sin(a2)*180;
        dot.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2 + x, ch/2 + y, z]);
        ${opts.addGlow ? `var gl = dot.property("ADBE Effect Parade").addProperty("ADBE Glow"); if (gl) { try { gl.property("ADBE Glow-0003").setValue(20); gl.property("ADBE Glow-0004").setValue(1.6); } catch(e){} }` : ""}
      }
      var rung = comp.layers.addShape(); rung.name = "BasePair_" + i; rung.threeDLayer = true; rung.parent = rig;
      var rr = rung.property("ADBE Root Vectors Group"); var rg = rr.addProperty("ADBE Vector Group"); var rv = rg.property("ADBE Vectors Group"); var path = rv.addProperty("ADBE Vector Shape - Group");
      try { var sh = new Shape(); sh.vertices = [[-180,0],[180,0]]; sh.closed = false; path.property("ADBE Vector Shape").setValue(sh); } catch(e){}
      var st = rv.addProperty("ADBE Vector Graphic - Stroke"); try { st.property("ADBE Vector Stroke Color").setValue([bp[0],bp[1],bp[2],1]); st.property("ADBE Vector Stroke Width").setValue(3); } catch(e){}
      rung.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2 + y, 0]);
      rung.property("ADBE Transform Group").property("ADBE Rotate Y").setValue(ang*180/Math.PI);
    }
    var rot = rig.property("ADBE Transform Group").property("ADBE Rotate Y"); if (rot) rot.expression = "time*" + (${opts.rotationSpeed}*55);
    var cam = comp.layers.addCamera("Camera_DNA", [cw/2,ch/2]); cam.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, ${opts.cameraAngle === "side" ? -850 : -1150}]);
    MPVFX.run(comp, "cinematicBloom", { strength: 0.5 });
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("DNA helix built.");
  `;
  return withReport(body);
}

// ============================================================
// build_countdown_timer
// ============================================================
export function generateCountdownTimerJsx(opts: {
  outputAepPath: string;
  countdownFrom: number;
  style: string;
  primaryColor: number[];
  accentColor: number[];
  addProgressRing: boolean;
  addLabels: boolean;
  endAction: string;
  width: number;
  height: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var dur = ${opts.countdownFrom + 1};
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, dur, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var pc = ${jlit(opts.primaryColor)}; var ac = ${jlit(opts.accentColor)};
    comp.layers.addSolid([0.015,0.015,0.02], "BG_Countdown", cw, ch, 1, dur);
    var num = comp.layers.addText(String(${opts.countdownFrom}));
    num.name = "Countdown_Number";
    try { var td = num.property("ADBE Text Properties").property("ADBE Text Document"); var tv = td.value; tv.fontSize = Math.round(cw*0.18); tv.font = "Arial Black"; tv.fillColor = [pc[0],pc[1],pc[2]]; tv.justification = ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv); } catch(e){}
    num.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch/2]);
    try { num.property("ADBE Text Properties").property("ADBE Text Document").expression = "var n=Math.max(0, ${opts.countdownFrom}-Math.floor(time)); var s=(n<10?'0':'')+n; var d=value; d.text=s; d;"; } catch(e){}
    var sc = num.property("ADBE Transform Group").property("ADBE Scale"); if (sc) sc.expression = "var f=time-Math.floor(time); var b=100+Math.exp(-f*7)*22*Math.sin(f*18); [b,b]";
    ${opts.addProgressRing ? `
    var ring = comp.layers.addShape(); ring.name = "Progress_Ring"; ring.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch/2]);
    var rroot = ring.property("ADBE Root Vectors Group"); var rg = rroot.addProperty("ADBE Vector Group"); var rv = rg.property("ADBE Vectors Group"); var el = rv.addProperty("ADBE Vector Shape - Ellipse"); try { el.property("ADBE Vector Ellipse Size").setValue([cw*0.34,cw*0.34]); } catch(e){}
    var st = rv.addProperty("ADBE Vector Graphic - Stroke"); try { st.property("ADBE Vector Stroke Color").setValue([ac[0],ac[1],ac[2],1]); st.property("ADBE Vector Stroke Width").setValue(8); } catch(e){}
    var tr = rv.addProperty("ADBE Vector Filter - Trim"); try { tr.property("ADBE Vector Trim End").setValueAtTime(0,100); tr.property("ADBE Vector Trim End").setValueAtTime(dur-1,0); } catch(e){}
    ` : ""}
    ${opts.addLabels ? `var lab = comp.layers.addText(${jstr(opts.style.toUpperCase())}); lab.name = "Countdown_Label"; try { var ld=lab.property("ADBE Text Properties").property("ADBE Text Document"); var lv=ld.value; lv.fontSize=28; lv.fillColor=[0.7,0.7,0.75]; lv.justification=ParagraphJustification.CENTER_JUSTIFY; ld.setValue(lv); } catch(e){} lab.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch*0.68]);` : ""}
    if (${jstr(opts.endAction)} === "flash" || ${jstr(opts.endAction)} === "explode") { MPVFX.run(comp, "muzzleFlash", { start: dur-1, radius: 260, color: ac }); }
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("Countdown timer built.");
  `;
  return withReport(body);
}

// ============================================================
// build_text_morph
// ============================================================
export function generateTextMorphJsx(opts: {
  outputAepPath: string;
  words: string[];
  morphStyle: string;
  fontSize: number;
  font: string;
  primaryColor: number[];
  accentColor: number[];
  holdDuration: number;
  morphDuration: number;
  addBackground: boolean;
  width: number;
  height: number;
  fps: number;
  compName: string;
}): string {
  const dur = opts.words.length * (opts.holdDuration + opts.morphDuration);
  const body = `
    app.newProject();
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${dur}, ${opts.fps});
    var cw = comp.width; var ch = comp.height; var words = ${jlit(opts.words)}; var pc=${jlit(opts.primaryColor)}; var ac=${jlit(opts.accentColor)};
    ${opts.addBackground ? `comp.layers.addSolid([0.02,0.02,0.045], "BG_TextMorph", cw, ch, 1, comp.duration);` : ""}
    for (var i=0; i<words.length; i++) {
      var t0 = i*(${opts.holdDuration}+${opts.morphDuration});
      var l = comp.layers.addText(words[i]); l.name = "Morph_Word_" + i + "_" + words[i];
      l.startTime = Math.max(0,t0-${opts.morphDuration}); l.outPoint = Math.min(comp.duration,t0+${opts.holdDuration}+${opts.morphDuration});
      try { var td=l.property("ADBE Text Properties").property("ADBE Text Document"); var tv=td.value; tv.fontSize=${opts.fontSize}; tv.font=${jstr(opts.font)}; tv.fillColor=[pc[0],pc[1],pc[2]]; tv.justification=ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv); } catch(e){}
      l.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch/2]);
      var op=l.property("ADBE Transform Group").property("ADBE Opacity"); if(op){ op.setValueAtTime(l.startTime,0); op.setValueAtTime(t0,100); op.setValueAtTime(t0+${opts.holdDuration},100); op.setValueAtTime(t0+${opts.holdDuration}+${opts.morphDuration},0); }
      var sc=l.property("ADBE Transform Group").property("ADBE Scale"); if(sc){ sc.setValueAtTime(l.startTime,[92,92]); sc.setValueAtTime(t0,[100,100]); sc.setValueAtTime(t0+${opts.holdDuration},[100,100]); sc.setValueAtTime(t0+${opts.holdDuration}+${opts.morphDuration},[108,108]); MP.setEase(sc,"expoOut"); }
      if (${jstr(opts.morphStyle)} === "liquid" || ${jstr(opts.morphStyle)} === "wave-distort") {
        var tdsp = l.property("ADBE Effect Parade").addProperty("ADBE Turbulent Displace"); if (tdsp) { try { tdsp.property("ADBE Turbulent Displace-0003").setValue(0); tdsp.property("ADBE Turbulent Displace-0003").setValueAtTime(t0+${opts.holdDuration},0); tdsp.property("ADBE Turbulent Displace-0003").setValueAtTime(t0+${opts.holdDuration}+${opts.morphDuration}*0.5,70); tdsp.property("ADBE Turbulent Displace-0003").setValueAtTime(t0+${opts.holdDuration}+${opts.morphDuration},0); } catch(e){} }
      } else if (${jstr(opts.morphStyle)} === "glitch-swap") { MPVFX.run(comp, "glitch", { start: t0+${opts.holdDuration}-0.05, duration: ${opts.morphDuration} }); }
      var gl = l.property("ADBE Effect Parade").addProperty("ADBE Glow"); if (gl) { try { gl.property("ADBE Glow-0003").setValue(25); gl.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
    }
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output = ${jstr(opts.outputAepPath)};
    MP.log("Text morph built with " + words.length + " words.");
  `;
  return withReport(body);
}

// ============================================================
// create_timeline_animation
// ============================================================
export function generateTimelineAnimationJsx(opts: {
  outputAepPath: string;
  events: Array<{ year: string; label: string; description?: string; color?: string }>;
  orientation: string;
  style: string;
  primaryColor: number[];
  accentColor: number[];
  animationStyle: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var comp = app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw=comp.width,ch=comp.height,events=${jlit(opts.events)},pc=${jlit(opts.primaryColor)},ac=${jlit(opts.accentColor)};
    comp.layers.addSolid(${opts.style === "dark" ? "[0.02,0.025,0.04]" : "[0.96,0.97,0.99]"}, "BG_Timeline", cw, ch, 1, comp.duration);
    var line = comp.layers.addShape(); line.name = "Timeline_Main_Line";
    var root=line.property("ADBE Root Vectors Group"); var g=root.addProperty("ADBE Vector Group"); var v=g.property("ADBE Vectors Group"); var path=v.addProperty("ADBE Vector Shape - Group");
    try { var sh=new Shape(); sh.vertices=${opts.orientation === "vertical" ? "[[cw/2,ch*0.14],[cw/2,ch*0.88]]" : "[[cw*0.1,ch/2],[cw*0.9,ch/2]]"}; sh.closed=false; path.property("ADBE Vector Shape").setValue(sh); } catch(e){}
    var st=v.addProperty("ADBE Vector Graphic - Stroke"); try { st.property("ADBE Vector Stroke Color").setValue([pc[0],pc[1],pc[2],1]); st.property("ADBE Vector Stroke Width").setValue(5); } catch(e){}
    var trim=v.addProperty("ADBE Vector Filter - Trim"); try { trim.property("ADBE Vector Trim End").setValueAtTime(0,0); trim.property("ADBE Vector Trim End").setValueAtTime(comp.duration*0.75,100); } catch(e){}
    for (var i=0;i<events.length;i++) {
      var t=i/(Math.max(1,events.length-1)); var x=${opts.orientation === "vertical" ? "cw/2" : "cw*0.1+t*cw*0.8"}; var y=${opts.orientation === "vertical" ? "ch*0.14+t*ch*0.74" : "ch/2"};
      var dot=comp.layers.addShape(); dot.name="Event_Dot_"+i; dot.property("ADBE Transform Group").property("ADBE Position").setValue([x,y]);
      var dr=dot.property("ADBE Root Vectors Group"); var dg=dr.addProperty("ADBE Vector Group"); var dv=dg.property("ADBE Vectors Group"); var ell=dv.addProperty("ADBE Vector Shape - Ellipse"); try{ell.property("ADBE Vector Ellipse Size").setValue([24,24]);}catch(e){}
      var fill=dv.addProperty("ADBE Vector Graphic - Fill"); try{fill.property("ADBE Vector Fill Color").setValue([ac[0],ac[1],ac[2],1]);}catch(e){}
      var ds=dot.property("ADBE Transform Group").property("ADBE Scale"); if(ds){ ds.setValueAtTime(i*0.25,[0,0]); ds.setValueAtTime(i*0.25+0.35,[115,115]); ds.setValueAtTime(i*0.25+0.48,[100,100]); MP.setEase(ds,"expoOut"); }
      var label=comp.layers.addText(events[i].year+"\\n"+events[i].label); label.name="Event_Label_"+i;
      try{var td=label.property("ADBE Text Properties").property("ADBE Text Document"); var tv=td.value; tv.fontSize=24; tv.fillColor=${opts.style === "dark" ? "[0.92,0.94,1]" : "[0.12,0.13,0.18]"}; tv.justification=ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv);}catch(e){}
      label.property("ADBE Transform Group").property("ADBE Position").setValue([x, y + (i%2===0 ? -70 : 80)]);
      var lo=label.property("ADBE Transform Group").property("ADBE Opacity"); if(lo){lo.setValueAtTime(i*0.25,0); lo.setValueAtTime(i*0.25+0.35,100);}
    }
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output=${jstr(opts.outputAepPath)};
    MP.log("Timeline animation built.");
  `;
  return withReport(body);
}

// ============================================================
// build_world_map
// ============================================================
export function generateWorldMapJsx(opts: {
  outputAepPath: string;
  mapStyle: string;
  highlightCountries?: string[];
  connectionPoints?: Array<{ lat: number; lon: number; label?: string; color?: string }>;
  animateConnections: boolean;
  primaryColor: number[];
  highlightColor: number[];
  addGlowPoints: boolean;
  cameraMove: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const body = `
    app.newProject();
    var comp=app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw=comp.width,ch=comp.height,pc=${jlit(opts.primaryColor)},hc=${jlit(opts.highlightColor)},pts=${jlit(opts.connectionPoints ?? [])};
    comp.layers.addSolid(${opts.mapStyle === "dark-tech" ? "[0.015,0.02,0.035]" : "[0.9,0.92,0.94]"}, "BG_Map", cw, ch, 1, comp.duration);
    var map=comp.layers.addShape(); map.name="Procedural_World_Map"; map.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2,ch/2]);
    var root=map.property("ADBE Root Vectors Group");
    for(var i=0;i<7;i++){ var g=root.addProperty("ADBE Vector Group"); var v=g.property("ADBE Vectors Group"); var r=v.addProperty("ADBE Vector Shape - Rect"); try{r.property("ADBE Vector Rect Size").setValue([cw*(0.1+0.08*(i%3)), ch*(0.08+0.03*(i%4))]); r.property("ADBE Vector Rect Position").setValue([(i-3)*cw*0.11, Math.sin(i)*ch*0.12]);}catch(e){} var f=v.addProperty("ADBE Vector Graphic - Fill"); try{f.property("ADBE Vector Fill Color").setValue([pc[0],pc[1],pc[2],1]);}catch(e){} }
    function xy(lat,lon){ return [cw/2 + (lon/180)*cw*0.42, ch/2 - (lat/90)*ch*0.32]; }
    var prev=null;
    for(var pi=0;pi<pts.length;pi++){
      var p=xy(pts[pi].lat,pts[pi].lon);
      var dot=comp.layers.addShape(); dot.name="Map_Point_"+pi; dot.property("ADBE Transform Group").property("ADBE Position").setValue(p);
      var dr=dot.property("ADBE Root Vectors Group"); var dg=dr.addProperty("ADBE Vector Group"); var dv=dg.property("ADBE Vectors Group"); var ell=dv.addProperty("ADBE Vector Shape - Ellipse"); try{ell.property("ADBE Vector Ellipse Size").setValue([18,18]);}catch(e){} var fill=dv.addProperty("ADBE Vector Graphic - Fill"); try{fill.property("ADBE Vector Fill Color").setValue([hc[0],hc[1],hc[2],1]);}catch(e){}
      ${opts.addGlowPoints ? `var gl=dot.property("ADBE Effect Parade").addProperty("ADBE Glow"); if(gl){try{gl.property("ADBE Glow-0003").setValue(25); gl.property("ADBE Glow-0004").setValue(2);}catch(e){}}` : ""}
      if(pts[pi].label){ var lab=comp.layers.addText(pts[pi].label); lab.name="Map_Label_"+pi; try{var td=lab.property("ADBE Text Properties").property("ADBE Text Document"); var tv=td.value; tv.fontSize=22; tv.fillColor=[1,1,1]; td.setValue(tv);}catch(e){} lab.property("ADBE Transform Group").property("ADBE Position").setValue([p[0]+34,p[1]-18]); }
      if(prev && ${opts.animateConnections}){ var line=comp.layers.addShape(); line.name="Connection_"+(pi-1)+"_"+pi; var lr=line.property("ADBE Root Vectors Group"); var lg=lr.addProperty("ADBE Vector Group"); var lv=lg.property("ADBE Vectors Group"); var path=lv.addProperty("ADBE Vector Shape - Group"); try{var sh=new Shape(); sh.vertices=[prev,[(prev[0]+p[0])/2,(prev[1]+p[1])/2-80],p]; sh.closed=false; path.property("ADBE Vector Shape").setValue(sh);}catch(e){} var st=lv.addProperty("ADBE Vector Graphic - Stroke"); try{st.property("ADBE Vector Stroke Color").setValue([hc[0],hc[1],hc[2],1]); st.property("ADBE Vector Stroke Width").setValue(3);}catch(e){} var tr=lv.addProperty("ADBE Vector Filter - Trim"); try{tr.property("ADBE Vector Trim End").setValueAtTime(pi*0.45,0); tr.property("ADBE Vector Trim End").setValueAtTime(pi*0.45+0.8,100);}catch(e){} }
      prev=p;
    }
    MPVFX.run(comp, "cinematicBloom", { strength: 0.35 });
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output=${jstr(opts.outputAepPath)};
    MP.log("World map built with " + pts.length + " points.");
  `;
  return withReport(body);
}

// ============================================================
// build_template_from_brandkit
// ============================================================
export function generateTemplateFromBrandkitJsx(opts: {
  outputAepPath: string;
  brandName: string;
  logoText?: string;
  tagline?: string;
  colors: string[];
  fonts?: string[];
  tone: string;
  deliverables: string[];
  includeSafeGuides: boolean;
  width: number;
  height: number;
  duration: number;
  fps: number;
  compPrefix: string;
}): string {
  const colors = opts.colors.length ? opts.colors : ["#1E6BFF", "#111827", "#FFFFFF", "#14B8A6"];
  const displayFont = opts.fonts?.[0] ?? "Arial Black";
  const bodyFont = opts.fonts?.[1] ?? "Arial";
  const body = `
    app.newProject();
    var brand=${jstr(opts.brandName)}, logo=${jstr(opts.logoText ?? opts.brandName)}, tagline=${opts.tagline ? jstr(opts.tagline) : "null"};
    var colors=${jlit(colors)}, deliverables=${jlit(opts.deliverables)}, tone=${jstr(opts.tone)};
    function hexToRgb(hex){ if(hex.charAt(0)==="#") hex=hex.substr(1); return [parseInt(hex.substr(0,2),16)/255, parseInt(hex.substr(2,2),16)/255, parseInt(hex.substr(4,2),16)/255]; }
    var primary=hexToRgb(colors[0]||"#1E6BFF"), dark=hexToRgb(colors[1]||"#111827"), light=hexToRgb(colors[2]||"#FFFFFF"), accent=hexToRgb(colors[3]||colors[0]||"#14B8A6");
    function addText(comp, name, text, size, pos, color, font, justify){
      var l=comp.layers.addText(text); l.name=name;
      try{ var td=l.property("ADBE Text Properties").property("ADBE Text Document"); var tv=td.value; tv.fontSize=size; tv.fillColor=color; tv.font=font; tv.justification=justify||ParagraphJustification.CENTER_JUSTIFY; td.setValue(tv); }catch(e){}
      l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
      return l;
    }
    function addSafe(comp){
      if(!${opts.includeSafeGuides}) return;
      var g=comp.layers.addShape(); g.name="SAFE_GUIDES_90_95"; g.enabled=false; g.locked=true;
    }
    function addBrandBg(comp, vertical){
      comp.layers.addSolid(dark, "BG_Brand_Base", comp.width, comp.height, 1, comp.duration);
      var wash=comp.layers.addSolid(primary, "BG_Brand_Primary_Wash", comp.width, comp.height, 1, comp.duration); wash.blendingMode=BlendingMode.ADD;
      var ramp=wash.property("ADBE Effect Parade").addProperty("ADBE Ramp");
      if(ramp){ try{ ramp.property("ADBE Ramp-0001").setValue([0,0]); ramp.property("ADBE Ramp-0003").setValue([comp.width,comp.height]); ramp.property("ADBE Ramp-0002").setValue([primary[0],primary[1],primary[2],1]); ramp.property("ADBE Ramp-0004").setValue([accent[0],accent[1],accent[2],1]); ramp.property("ADBE Ramp-0005").setValue(2); }catch(e){} }
      var op=wash.property("ADBE Transform Group").property("ADBE Opacity"); if(op) op.setValue(tone==="luxury"?18:28);
      MPVFX.run(comp, tone==="tech" ? "plexusNetwork" : "cinematicBloom", tone==="tech" ? { color: accent, strength: 0.25 } : { strength: 0.35 });
    }
    function buildComp(kind, idx){
      var vertical = kind==="social-story";
      var w = vertical ? 1080 : ${opts.width}; var h = vertical ? 1920 : ${opts.height};
      var dur = kind==="end-screen" ? 20 : ${opts.duration};
      var comp=app.project.items.addComp(${jstr(opts.compPrefix)}+"_"+kind.toUpperCase().replace(/-/g,"_"), w, h, 1, dur, ${opts.fps});
      addBrandBg(comp, vertical); addSafe(comp);
      var logoL=addText(comp,"LOGO_WORDMARK",logo,Math.round(w*(vertical?0.09:0.065)),[w/2,h*(kind==="lower-third"?0.76:0.42)],light,${jstr(displayFont)});
      var sc=logoL.property("ADBE Transform Group").property("ADBE Scale"); if(sc){ sc.setValueAtTime(0,[92,92]); sc.setValueAtTime(0.55,[100,100]); MP.setEase(sc,"expoOut"); }
      var op=logoL.property("ADBE Transform Group").property("ADBE Opacity"); if(op){ op.setValueAtTime(0,0); op.setValueAtTime(0.35,100); }
      if(kind==="lower-third"){
        var bar=comp.layers.addShape(); bar.name="LT_Brand_Bar"; bar.property("ADBE Transform Group").property("ADBE Position").setValue([w*0.34,h*0.78]);
        var br=bar.property("ADBE Root Vectors Group"); var bg=br.addProperty("ADBE Vector Group"); var bv=bg.property("ADBE Vectors Group"); var rr=bv.addProperty("ADBE Vector Shape - Rect"); try{rr.property("ADBE Vector Rect Size").setValue([w*0.48,h*0.12]);}catch(e){} var bf=bv.addProperty("ADBE Vector Graphic - Fill"); try{bf.property("ADBE Vector Fill Color").setValue([primary[0],primary[1],primary[2],1]);}catch(e){}
        logoL.property("ADBE Transform Group").property("ADBE Position").setValue([w*0.28,h*0.76]);
        addText(comp,"LT_ROLE","Title / Role",Math.round(h*0.035),[w*0.28,h*0.82],light,${jstr(bodyFont)});
      } else if(kind==="title-card"){
        addText(comp,"TITLE_TEXT","Title Card",Math.round(w*0.055),[w/2,h*0.58],light,${jstr(displayFont)});
      } else if(kind==="cta"){
        addText(comp,"CTA_TEXT",tagline||"Start today",Math.round(w*0.045),[w/2,h*0.6],light,${jstr(displayFont)});
      } else if(kind==="outro" || kind==="end-screen"){
        addText(comp,"OUTRO_TAGLINE",tagline||brand,Math.round(w*0.035),[w/2,h*0.58],light,${jstr(bodyFont)});
      } else if(kind==="intro"){
        MPVFX.run(comp, "lightSweep", { start: 0.7, duration: 1.1, targetLayer: "LOGO_WORDMARK" });
      }
      var marker=comp.layers.addNull(dur); marker.name="MP_TEMPLATE_NOTES"; try{ marker.enabled=false; marker.property("ADBE Marker").setValueAtTime(0,new MarkerValue("Brand kit template: "+kind)); }catch(e){}
      return comp;
    }
    for(var i=0;i<deliverables.length;i++) buildComp(deliverables[i], i);
    MP.log("Brandkit template built: " + deliverables.length + " comps for " + brand);
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output=${jstr(opts.outputAepPath)};
  `;
  return withReport(body);
}

// ============================================================
// build_product_mockup_scene
// ============================================================
export function generateProductMockupSceneJsx(opts: {
  outputAepPath: string;
  productName: string;
  productType: string;
  headline?: string;
  subhead?: string;
  style: string;
  primaryColor: number[];
  accentColor: number[];
  surfaceColor: number[];
  cameraMove: string;
  add360Shine: boolean;
  addCallouts: boolean;
  callouts?: string[];
  width: number;
  height: number;
  duration: number;
  fps: number;
  compName: string;
}): string {
  const callouts = opts.callouts?.length ? opts.callouts : ["Fast setup", "Editable layers", "Premium motion"];
  const body = `
    app.newProject();
    var comp=app.project.items.addComp(${jstr(opts.compName)}, ${opts.width}, ${opts.height}, 1, ${opts.duration}, ${opts.fps});
    var cw=comp.width,ch=comp.height,pc=${jlit(opts.primaryColor)},ac=${jlit(opts.accentColor)},surf=${jlit(opts.surfaceColor)},ptype=${jstr(opts.productType)};
    comp.layers.addSolid(${opts.style === "minimal" ? "[0.94,0.95,0.97]" : "[0.015,0.018,0.028]"}, "BG_Studio", cw, ch, 1, comp.duration);
    MPVFX.run(comp, ${opts.style === "neon" || opts.style === "premium-tech" ? `"plexusNetwork"` : `"cinematicBloom"`}, ${opts.style === "neon" || opts.style === "premium-tech" ? `{ color: ac, strength: 0.22 }` : `{ strength: 0.25 }`});
    var rig=comp.layers.addNull(comp.duration); rig.name="PRODUCT_RIG"; rig.threeDLayer=true;
    function addRect(name,size,pos,color,radius){
      var l=comp.layers.addShape(); l.name=name; l.threeDLayer=true; l.parent=rig;
      var root=l.property("ADBE Root Vectors Group"); var g=root.addProperty("ADBE Vector Group"); var v=g.property("ADBE Vectors Group"); var r=v.addProperty("ADBE Vector Shape - Rect");
      try{ r.property("ADBE Vector Rect Size").setValue(size); r.property("ADBE Vector Rect Roundness").setValue(radius||12); }catch(e){}
      var f=v.addProperty("ADBE Vector Graphic - Fill"); try{ f.property("ADBE Vector Fill Color").setValue([color[0],color[1],color[2],1]); }catch(e){}
      l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
      return l;
    }
    var product;
    if(ptype==="phone" || ptype==="tablet" || ptype==="app-screen"){
      var pw=ptype==="tablet"?520:330, ph=ptype==="tablet"?700:640;
      product=addRect("PRODUCT_DEVICE_BODY",[pw,ph],[cw*0.56,ch*0.52,0],surf,34);
      var screen=addRect("PRODUCT_SCREEN",[pw*0.86,ph*0.82],[cw*0.56,ch*0.52,2],pc,22); screen.name="REPLACE_SCREEN_CONTENT";
      addRect("SCREEN_UI_CARD",[pw*0.62,ph*0.12],[cw*0.56,ch*0.42,5],ac,14);
      addRect("SCREEN_UI_BUTTON",[pw*0.38,ph*0.07],[cw*0.56,ch*0.62,5],[1,1,1],12);
    } else if(ptype==="laptop"){
      product=addRect("PRODUCT_LAPTOP_SCREEN",[620,380],[cw*0.56,ch*0.45,0],surf,18);
      addRect("REPLACE_SCREEN_CONTENT",[560,300],[cw*0.56,ch*0.45,3],pc,10);
      addRect("PRODUCT_LAPTOP_BASE",[720,70],[cw*0.56,ch*0.68,0],surf,18);
    } else if(ptype==="bottle" || ptype==="can"){
      product=addRect("PRODUCT_CONTAINER",[260,560],[cw*0.57,ch*0.52,0],surf,ptype==="can"?28:70);
      addRect("PRODUCT_LABEL",[230,170],[cw*0.57,ch*0.54,4],pc,18);
    } else {
      product=addRect("PRODUCT_PACKAGE",[460,560],[cw*0.58,ch*0.53,0],surf,22);
      addRect("PRODUCT_LABEL_PANEL",[350,210],[cw*0.58,ch*0.54,4],pc,18);
    }
    var name=comp.layers.addText(${jstr(opts.productName)}); name.name="PRODUCT_NAME_TEXT"; name.parent=rig;
    try{ var nd=name.property("ADBE Text Properties").property("ADBE Text Document"); var nv=nd.value; nv.fontSize=42; nv.font="Arial Black"; nv.fillColor=[1,1,1]; nv.justification=ParagraphJustification.CENTER_JUSTIFY; nd.setValue(nv); }catch(e){}
    name.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.57,ch*0.54,8]);
    ${opts.headline ? `var h=comp.layers.addText(${jstr(opts.headline)}); h.name="HERO_HEADLINE"; try{var hd=h.property("ADBE Text Properties").property("ADBE Text Document"); var hv=hd.value; hv.fontSize=Math.round(cw*0.045); hv.font="Arial Black"; hv.fillColor=${opts.style === "minimal" ? "[0.08,0.09,0.12]" : "[1,1,1]"}; hd.setValue(hv);}catch(e){} h.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.25,ch*0.36]);` : ""}
    ${opts.subhead ? `var sh=comp.layers.addText(${jstr(opts.subhead)}); sh.name="HERO_SUBHEAD"; try{var sd=sh.property("ADBE Text Properties").property("ADBE Text Document"); var sv=sd.value; sv.fontSize=30; sv.font="Arial"; sv.fillColor=${opts.style === "minimal" ? "[0.22,0.24,0.28]" : "[0.78,0.82,0.92]"}; sd.setValue(sv);}catch(e){} sh.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.25,ch*0.46]);` : ""}
    var rpos=rig.property("ADBE Transform Group").property("ADBE Position"); if(rpos){ rpos.setValueAtTime(0,[0,40,0]); rpos.setValueAtTime(comp.duration,[0,0,0]); MP.setEase(rpos,"sineOut"); }
    var rrot=rig.property("ADBE Transform Group").property("ADBE Rotate Y"); if(rrot){ rrot.setValueAtTime(0,${opts.cameraMove === "orbit" ? -18 : -6}); rrot.setValueAtTime(comp.duration,${opts.cameraMove === "orbit" ? 18 : 5}); }
    ${opts.add360Shine ? `MPVFX.run(comp, "productShine360", { targetLayer: "PRODUCT_", duration: comp.duration*0.75, color: [1,1,0.95], intensity: 45 }); MPVFX.run(comp, "lightSweep", { start: 0.8, duration: 1.4, targetLayer: "PRODUCT_" });` : ""}
    ${opts.addCallouts ? `
    var labels=${jlit(callouts)};
    for(var i=0;i<labels.length;i++){
      var c=comp.layers.addText(labels[i]); c.name="CALLOUT_"+i;
      try{var cd=c.property("ADBE Text Properties").property("ADBE Text Document"); var cv=cd.value; cv.fontSize=24; cv.font="Arial"; cv.fillColor=[1,1,1]; cd.setValue(cv);}catch(e){}
      c.property("ADBE Transform Group").property("ADBE Position").setValue([cw*(i%2===0?0.2:0.82), ch*(0.34+i*0.11)]);
      var co=c.property("ADBE Transform Group").property("ADBE Opacity"); if(co){co.setValueAtTime(0.5+i*0.25,0); co.setValueAtTime(0.85+i*0.25,100);}
    }
    ` : ""}
    MPVFX.run(comp, "cinematicGrade", {});
    app.project.save(new File(${jstr(opts.outputAepPath)}));
    __result.output=${jstr(opts.outputAepPath)};
    MP.log("Product mockup scene built: " + ptype);
  `;
  return withReport(body);
}
