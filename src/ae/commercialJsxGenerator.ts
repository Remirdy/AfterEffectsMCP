/**
 * MotionPilot — cinematic commercial builder (ExtendScript generator).
 *
 * Builds a fully-structured, premium 9:16 commercial from a procedural asset
 * manifest: named precomps (01_BACKGROUND … 08_FINAL_PACKSHOT), a null-driven
 * 3D camera, a five-scene timeline (Intro → Product Hero → Features → Energy
 * Build → Final CTA), section + sound-design markers, animated HUD/trim-path
 * feature callouts, and a global finishing pass (bloom + grade + grain) via
 * MPVFX. Logo/brand plates are flagged text-protected and never distorted.
 */

import { wrapScriptWithVfx, jsxStr as jstr, jsxJsonLiteral as jsonLiteral } from "./jsxGenerator.js";

export interface CommercialAsset {
  name: string;
  path: string;
  role: string;
  z: number;
  scale: number;
  position: [number, number];
  blend?: string;
  motion?: string;
}

export interface CommercialManifest {
  width: number;
  height: number;
  palette?: { primary?: string; secondary?: string; accent?: string; light?: string; ink?: string };
  assets: CommercialAsset[];
}

export interface CommercialOptions {
  manifest: CommercialManifest;
  outputAepPath: string;
  duration: number;
  fps: number;
  compName: string;
  brandName?: string;
  features?: string[];
}

function hexToRgb01(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const h = hex.replace("#", "");
  if (h.length !== 6) return fallback;
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

export function generateCommercialJsx(opts: CommercialOptions): string {
  const W = opts.manifest.width;
  const H = opts.manifest.height;
  const D = opts.duration;
  const FPS = opts.fps;
  const pal = opts.manifest.palette || {};
  const accent = hexToRgb01(pal.accent, [0.49, 0.23, 0.93]);
  const light = hexToRgb01(pal.light, [0.88, 0.95, 1]);
  const features = (opts.features && opts.features.length ? opts.features : ["Premium Build", "Smart Engine", "All-Day Power"]).slice(0, 3);

  const body = `
    app.newProject();
    app.beginUndoGroup("MotionPilot Commercial");

    var MANIFEST = ${jsonLiteral(opts.manifest)};
    var W = ${W}, H = ${H}, DUR = ${D}, FPS = ${FPS};
    var ACCENT = ${jsonLiteral(accent)};
    var LIGHT = ${jsonLiteral(light)};
    var FEATURES = ${jsonLiteral(features)};
    var CAM_Z = -1350, ZOOM = 980;

    // ---- helpers ----------------------------------------------------------
    function tg(ly){ return ly.property("ADBE Transform Group"); }
    function P(ly,n){ return tg(ly).property(n); }
    function setBlend(ly,b){ try{
      if(b==="add") ly.blendingMode=BlendingMode.ADD;
      else if(b==="screen") ly.blendingMode=BlendingMode.SCREEN;
      else if(b==="multiply") ly.blendingMode=BlendingMode.MULTIPLY;
    }catch(e){} }
    function fillScale(z, art){ return art*(z+(-CAM_Z))/ZOOM; }
    function mkComp(name){ return app.project.items.addComp(name, W, H, 1, DUR, FPS); }

    // Import every asset once, keyed by name.
    var FOOT = {};
    for (var i=0;i<MANIFEST.assets.length;i++){
      var a = MANIFEST.assets[i];
      var f = new File(a.path);
      if(!f.exists){ MP.log("missing asset: "+a.path); continue; }
      FOOT[a.name] = app.project.importFile(new ImportOptions(f));
    }
    function place(comp, name, opts3){
      opts3 = opts3||{};
      if(!FOOT[name]) return null;
      var ly = comp.layers.add(FOOT[name]);
      ly.name = opts3.label || name;
      if(opts3.threeD!==false){ ly.threeDLayer = true; }
      try { ly.motionBlur = true; } catch(e){}
      return ly;
    }

    // ===== PRECOMPS ========================================================
    // 01_BACKGROUND -- deep gradient + grid + atmosphere + emissive core.
    var bg = mkComp("01_BACKGROUND");
    var bgOrder = ["bg_base","grid","kinetic_streaks","atmosphere","glow_core"];
    for (var bi=0; bi<bgOrder.length; bi++){
      var an = bgOrder[bi];
      var ml=null; for(var k=0;k<MANIFEST.assets.length;k++){ if(MANIFEST.assets[k].name===an) ml=MANIFEST.assets[k]; }
      if(!ml) continue;
      var L = place(bg, an, {threeD:false});
      if(!L) continue;
      setBlend(L, ml.blend);
      // gentle living drift
      try{ P(L,"ADBE Position").expression = "[value[0]+Math.sin(time*"+(0.12+bi*0.04).toFixed(2)+")*"+(14+bi*6)+", value[1]+Math.cos(time*0.1)*10];"; }catch(e){}
    }

    // 04_LIGHTING_FX -- volumetric rays.
    var lfx = mkComp("04_LIGHTING_FX");
    var lr = place(lfx, "light_rays", {threeD:false});
    if(lr){ setBlend(lr,"add"); try{ P(lr,"ADBE Opacity").expression = "60+Math.sin(time*0.6)*22;"; P(lr,"ADBE Rotate Z").expression="Math.sin(time*0.18)*3;"; }catch(e){} }

    // 05_PARTICLES -- floating dust + bokeh.
    var pfx = mkComp("05_PARTICLES");
    var pa = place(pfx,"particles",{threeD:false}); if(pa){ setBlend(pa,"screen"); try{ P(pa,"ADBE Position").expression="[value[0]+Math.sin(time*0.3)*20, value[1]-(time*8%H)];"; }catch(e){} }
    var bk = place(pfx,"bokeh",{threeD:false}); if(bk){ setBlend(bk,"screen"); try{ P(bk,"ADBE Opacity").expression="55+Math.sin(time*0.5)*18;"; }catch(e){} }

    // 02_PRODUCT_HERO -- product + reticle rings + network/hud, with rim glow.
    var hero = mkComp("02_PRODUCT_HERO");
    var rings = place(hero,"accent_rings",{threeD:false}); if(rings){ setBlend(rings,"add"); try{ P(rings,"ADBE Rotate Z").expression="time*10;"; }catch(e){} }
    var net = place(hero,"network",{threeD:false}); if(net){ setBlend(net,"add"); try{ P(net,"ADBE Opacity").setValue(40); }catch(e){} }
    var hudL = place(hero,"hud",{threeD:false}); if(hudL){ setBlend(hudL,"add"); try{ P(hudL,"ADBE Opacity").setValue(70); }catch(e){} }
    var prod = place(hero,"hero_element",{threeD:false, label:"PRODUCT"});
    if(prod){
      // soft floating + breathing (glow is applied at the master level on the
      // 02_PRODUCT_HERO precomp layer via MPVFX.premiumGlow).
      try{ P(prod,"ADBE Position").expression="[value[0], value[1]+Math.sin(time*0.8)*8];"; }catch(e){}
      try{ P(prod,"ADBE Scale").expression="var s=Math.sin(time*0.7)*1.2; [value[0]+s,value[1]+s];"; }catch(e){}
    }

    // 03_LOGO_LOCKED -- brand lockup plate (TEXT-PROTECTED, never distorted).
    var logoC = mkComp("03_LOGO_LOCKED");
    var logo = place(logoC,"title_plate",{threeD:false, label:"LOGO_LOCKED"});
    if(logo){ try{ MP.protectTextLayer(logo); }catch(e){} }

    // 06_CALLOUTS -- three premium feature panels (trim-path reveal + overshoot).
    var coC = mkComp("06_CALLOUTS");
    function makeCallout(idx, txt, t0){
      var y = H*(0.30 + idx*0.16);
      var sh = coC.layers.addShape(); sh.name = "Callout_"+(idx+1);
      sh.startTime = 0;
      var root = sh.property("ADBE Root Vectors Group");
      // panel line (animated with trim path)
      var grp = root.addProperty("ADBE Vector Group");
      var vec = grp.property("ADBE Vectors Group");
      var rect = vec.addProperty("ADBE Vector Shape - Rect");
      rect.property("ADBE Vector Rect Size").setValue([W*0.62, 4]);
      var st = vec.addProperty("ADBE Vector Graphic - Stroke");
      st.property("ADBE Vector Stroke Color").setValue([LIGHT[0],LIGHT[1],LIGHT[2],1]);
      st.property("ADBE Vector Stroke Width").setValue(4);
      var fillR = vec.addProperty("ADBE Vector Shape - Rect");
      // trim path reveal
      var trim = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
      var tEnd = trim.property("ADBE Vector Trim End");
      tEnd.setValueAtTime(t0, 0); tEnd.setValueAtTime(t0+0.45, 100); MP.setEase(tEnd,"expoOut");
      P(sh,"ADBE Position").setValue([W*0.19, y]);
      // dot marker
      var dotG = root.addProperty("ADBE Vector Group");
      var dv = dotG.property("ADBE Vectors Group");
      var el = dv.addProperty("ADBE Vector Shape - Ellipse");
      el.property("ADBE Vector Ellipse Size").setValue([16,16]);
      var df = dv.addProperty("ADBE Vector Graphic - Fill");
      df.property("ADBE Vector Fill Color").setValue([ACCENT[0],ACCENT[1],ACCENT[2],1]);
      dotG.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([W*0.19, y]);
      // label text
      var tx = coC.layers.addText(txt);
      var td = tx.property("ADBE Text Properties").property("ADBE Text Document");
      var doc = td.value; doc.fontSize = Math.round(W*0.035); doc.fillColor=[LIGHT[0],LIGHT[1],LIGHT[2]]; doc.font="Arial-BoldMT"; td.setValue(doc);
      P(tx,"ADBE Position").setValue([W*0.24, y-14]);
      MP.addPositionAnimation(tx,[ -40,0 ], t0+0.12, 0.5, "backOut");
      MP.addOpacityAnimation(tx,0,100,t0+0.12,0.4,"quadOut");
      try{ MP.protectTextLayer(tx); }catch(e){}
      // panel exits before next scene
      MP.addOpacityAnimation(sh, 100, 0, 7.6, 0.4, "quadOut");
      MP.addOpacityAnimation(tx, 100, 0, 7.6, 0.4, "quadOut");
    }
    for (var ci=0; ci<FEATURES.length; ci++){ try{ makeCallout(ci, FEATURES[ci], 5.0 + ci*0.55); }catch(eC){ MP.log("callout "+ci+" failed: "+eC.toString()); } }

    // 08_FINAL_PACKSHOT -- centered product + logo lockup + glow.
    var packC = mkComp("08_FINAL_PACKSHOT");
    var pcore = place(packC,"glow_core",{threeD:false}); if(pcore){ setBlend(pcore,"add"); }
    var pprod = place(packC,"hero_element",{threeD:false, label:"PACK_PRODUCT"});
    var plogo = place(packC,"title_plate",{threeD:false, label:"PACK_LOGO"});
    if(plogo){ try{ MP.protectTextLayer(plogo); }catch(e){} P(plogo,"ADBE Position").setValue([W/2, H*0.7]); }

    // ===== MASTER COMP =====================================================
    var comp = app.project.items.addComp(${jstr(opts.compName)}, W, H, 1, DUR, FPS);
    comp.bgColor = [0.01,0.012,0.03];

    // 07_CAMERA_CONTROL -- null-driven 3D camera.
    var camNull = comp.layers.addNull(); camNull.name = "07_CAMERA_CONTROL"; camNull.threeDLayer = true;
    P(camNull,"ADBE Position").setValue([W/2, H/2, 0]);
    var cam = comp.layers.addCamera("MP_Camera", [W/2, H/2]);
    P(cam,"ADBE Position").setValue([W/2, H/2, CAM_Z]);
    cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(ZOOM);
    cam.parent = camNull;
    // Camera push-in (Intro), hold, energy zoom (8-10), settle (10-12) via null Z.
    var nz = P(camNull,"ADBE Position");
    nz.setValueAtTime(0,   [W/2,H/2, -240]);
    nz.setValueAtTime(2.0, [W/2,H/2, 0]);
    nz.setValueAtTime(8.0, [W/2,H/2, 0]);
    nz.setValueAtTime(10.0,[W/2,H/2, 220]);
    nz.setValueAtTime(12.0,[W/2,H/2, 160]);
    MP.setEase(nz,"sineInOut");

    // Place precomps as 3D layers (depth → parallax). z-comp scale fills frame.
    function nest(item, z, art){
      var ly = comp.layers.add(item);
      ly.threeDLayer = true;
      try{ ly.motionBlur = true; }catch(e){}
      P(ly,"ADBE Position").setValue([W/2,H/2,z]);
      var s = fillScale(z, art);
      P(ly,"ADBE Scale").setValue([s,s,s]);
      return ly;
    }
    var Lbg   = nest(bg, 600, 100); Lbg.name="01_BACKGROUND";
    var Llfx  = nest(lfx, 420, 100); Llfx.name="04_LIGHTING_FX"; setBlend(Llfx,"add");
    var Lpfx  = nest(pfx, 250, 100); Lpfx.name="05_PARTICLES"; setBlend(Lpfx,"screen");
    var Lhero = nest(hero, 60, 92);  Lhero.name="02_PRODUCT_HERO";
    var Llogo = nest(logoC, -40, 100); Llogo.name="03_LOGO_LOCKED";
    var Lco   = nest(coC, -120, 100); Lco.name="06_CALLOUTS";
    var Lpack = nest(packC, 40, 96); Lpack.name="08_FINAL_PACKSHOT";

    // ===== SCENE TIMELINE (in/out + masked fades) ==========================
    function fadeIn(ly,t,d){ var o=P(ly,"ADBE Opacity"); o.setValueAtTime(t,0); o.setValueAtTime(t+d,100); MP.setEase(o,"expoOut"); }
    function fadeOut(ly,t,d){ var o=P(ly,"ADBE Opacity"); o.setValueAtTime(t,100); o.setValueAtTime(t+d,0); MP.setEase(o,"quadOut"); }
    function win(ly,inP,outP){ try{ ly.inPoint=inP; ly.outPoint=outP; }catch(e){} }

    // Background + lighting + particles run the whole film.
    fadeIn(Lbg,0,0.8);
    fadeIn(Llfx,0.3,1.0);
    fadeIn(Lpfx,0.6,1.2);

    // 03_LOGO: intro reveal (masked fade + slight parallax), hold, hand to hero.
    win(Llogo,0.2,5.2);
    fadeIn(Llogo,0.4,1.0);
    MP.addPositionAnimation(Llogo,[0,40,0],0.4,1.1,"expoOut");
    fadeOut(Llogo,4.6,0.6);

    // 02_PRODUCT_HERO: enters 2s, dominates to ~8s.
    win(Lhero,1.8,8.4);
    fadeIn(Lhero,1.9,0.7);
    MP.addScaleAnimation(Lhero, fillScale(60,82), fillScale(60,92), 1.9, 1.3, "backOut");
    fadeOut(Lhero,7.9,0.5);

    // 06_CALLOUTS: features 5-8.
    win(Lco,4.9,8.2);
    fadeIn(Lco,4.9,0.3);

    // Energy build 8-10: faster particle drift + light pulse are driven by the
    // precomp expressions above; the camera zoom (null Z) provides the push.
    // 08_FINAL_PACKSHOT: 10-12 centered lockup.
    win(Lpack,9.6,12.0);
    fadeIn(Lpack,9.8,0.7);
    MP.addScaleAnimation(Lpack, fillScale(40,90), fillScale(40,96), 9.8, 1.2, "expoOut");

    // ===== MARKERS =========================================================
    function secMark(t,label){ try{ comp.markerProperty.setValueAtTime(t, new MarkerValue(label)); }catch(e){ MP.log("marker fail "+label); } }
    secMark(0.0,"Intro");
    secMark(2.0,"Product Hero");
    secMark(5.0,"Features");
    secMark(8.0,"Energy Build");
    secMark(10.0,"Final CTA");
    // Sound-design markers (suffixed so editors see the cue).
    secMark(0.02,"SFX: soft cinematic hit");
    secMark(2.02,"SFX: whoosh reveal");
    secMark(5.02,"SFX: feature pop");
    secMark(8.02,"SFX: riser / energy build");
    secMark(10.02,"SFX: final impact");
    secMark(11.98,"SFX: clean ending");

    // ===== GLOBAL FINISHING (adjustment-layer FX via MPVFX) ================
    try {
      MPVFX.run(comp, "enableMotionBlur", {});
      MPVFX.run(comp, "premiumGlow", { targetLayer: "02_PRODUCT_HERO", strength: 120 });
      MPVFX.run(comp, "premiumGlow", { targetLayer: "08_FINAL_PACKSHOT", strength: 120 });
      MPVFX.run(comp, "lightSweep", { targetLayer: "02_PRODUCT_HERO", start: 2.4, duration: 1.6 });
      MPVFX.run(comp, "cinematicGrade", {});
      MPVFX.run(comp, "filmGrain", { strength: 6 });
      MPVFX.run(comp, "assetStorePolish", { profile: "commercial", targetLayer: "08_FINAL_PACKSHOT", heroGlow: 70 });
      MP.log("commercial finishing pass applied");
    } catch(eVfx){ MP.log("finishing pass error: "+eVfx.toString()); }

    try { comp.motionBlur = true; } catch(e){}
    comp.openInViewer();
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
  `;
  return wrapScriptWithVfx(body);
}
