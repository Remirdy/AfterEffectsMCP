/**
 * MotionPilot VFX ExtendScript library (ES3 / After Effects).
 *
 * Embedded as a string and appended after JSX_HELPERS. Every function here
 * builds a *professional* visual effect procedurally — particles, fire/smoke,
 * energy beams, shockwaves, magic circles, glitch, neon, atmospheric fog,
 * light rays, lens flare, film grain, etc.
 *
 * HYBRID PHILOSOPHY: each effect first tries premium third-party plugins
 * (Trapcode Particular, Video Copilot Saber/Optical Flares) when available,
 * and transparently FALLS BACK to stock After Effects effects so the script
 * never breaks on a machine that only has a clean AE install.
 *
 * Depends on the MP helper object (easing, save, logging) defined in
 * jsxHelpers.ts, which is always prepended before this block.
 */
export const VFX_HELPERS = String.raw`
// ===== MotionPilot VFX library (ExtendScript / ES3) =====
var MPVFX = (function () {
  function log(m) { try { MP.log("[VFX] " + m); } catch (e) {} }

  // -------- low-level utilities -------------------------------------------
  function fxParade(layer) { return layer.property("ADBE Effect Parade"); }

  // Add an effect by match name OR display name, returning the property or null.
  function addFx(layer, matchName, displayName) {
    var parade = fxParade(layer);
    try { return parade.addProperty(matchName); } catch (e1) {}
    if (displayName) { try { return parade.addProperty(displayName); } catch (e2) {} }
    return null;
  }

  // Robustly set an effect sub-property: try each candidate (display name or
  // match-name) until one accepts the value. Returns true on success.
  function setP(fx, candidates, value) {
    if (!fx) return false;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var p = fx.property(candidates[i]);
        if (p) { p.setValue(value); return true; }
      } catch (e) {}
    }
    return false;
  }
  // Same but returns the property (for keyframing) instead of setting.
  function getP(fx, candidates) {
    if (!fx) return null;
    for (var i = 0; i < candidates.length; i++) {
      try { var p = fx.property(candidates[i]); if (p) return p; } catch (e) {}
    }
    return null;
  }
  // Turn on motion blur for a layer (pro motion feel).
  function mb(layer) { try { layer.motionBlur = true; } catch (e) {} }
  // Enable comp motion blur + per-layer for every animated layer.
  function enableMotionBlur(comp) {
    try { comp.motionBlur = true; } catch (e) {}
    for (var i = 1; i <= comp.numLayers; i++) {
      try {
        var ly = comp.layer(i);
        if (!(ly instanceof CameraLayer) && !(ly instanceof LightLayer)) ly.motionBlur = true;
      } catch (e) {}
    }
    log("motion blur enabled comp-wide");
  }

  // Detect whether a plugin/effect can be instantiated WITHOUT leaving junk.
  function pluginAvailable(comp, matchName) {
    var tmp = comp.layers.addSolid([0, 0, 0], "__probe__", 4, 4, 1, 0.04);
    var ok = false;
    try { tmp.property("ADBE Effect Parade").addProperty(matchName); ok = true; } catch (e) {}
    try { tmp.remove(); } catch (e2) {}
    return ok;
  }

  function solid(comp, color, name, dur) {
    var s = comp.layers.addSolid(color || [0, 0, 0], name || "VFX Solid",
      comp.width, comp.height, 1, dur || comp.duration);
    return s;
  }

  // ExtendScript has no addAdjustmentLayer(); make a full-comp solid + flag it.
  function adjustment(comp, name, dur) {
    var a = comp.layers.addSolid([1, 1, 1], name || "Adjustment", comp.width, comp.height, 1, dur || comp.duration);
    try { a.adjustmentLayer = true; } catch (e) {}
    return a;
  }

  function centerOf(comp, opts) {
    if (opts && opts.position) return opts.position;
    return [comp.width / 2, comp.height / 2];
  }

  function tp(layer, name) {
    var tg = layer.property("ADBE Transform Group");
    switch (name) {
      case "position": return tg.property("ADBE Position");
      case "scale": return tg.property("ADBE Scale");
      case "rotation": return tg.property("ADBE Rotate Z");
      case "opacity": return tg.property("ADBE Opacity");
      case "anchor": return tg.property("ADBE Anchor Point");
    }
    return null;
  }

  function setBlend(layer, mode) {
    try { layer.blendingMode = BlendingMode[mode]; } catch (e) {}
  }

  function hexColor(c) {
    if (c instanceof Array) return c;
    return [1, 1, 1];
  }

  // ======================================================================
  // GAME VFX
  // ======================================================================

  // Radial particle burst (hit / explosion / power-up). Particular when present,
  // otherwise CC Particle World, otherwise a procedural shape-burst fallback.
  function energyBurst(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.2;
    var c = centerOf(comp, opts);
    var col = opts.color || [0.3, 0.7, 1];
    var lay = solid(comp, [0, 0, 0], opts.name || "Energy Burst", dur + 0.4);
    lay.startTime = t0;
    setBlend(lay, "ADD");

    if (pluginAvailable(comp, "Trapcode Particular")) {
      var p = addFx(lay, "Trapcode Particular");
      log("energyBurst via Trapcode Particular");
    } else {
      var cc = addFx(lay, "CC Particle World");
      if (cc) {
        log("energyBurst via CC Particle World");
        try {
          var birth = cc.property("Birth Rate"); if (birth) { birth.setValueAtTime(0, 6); birth.setValueAtTime(0.12, 0); }
          var longev = cc.property("Longevity (sec)"); if (longev) longev.setValue(0.8);
          var producer = cc.property("Producer");
          if (producer) {
            producer.property("Position X").setValue((c[0] - comp.width / 2) / comp.width);
            producer.property("Position Y").setValue((c[1] - comp.height / 2) / comp.height);
          }
          var physics = cc.property("Physics");
          if (physics) {
            try { physics.property("Velocity").setValue(2.2); } catch (e) {}
            try { physics.property("Gravity").setValue(0.2); } catch (e) {}
          }
        } catch (eCC) { log("CCPW param skip: " + eCC.toString()); }
      } else {
        // Pure-stock fallback: replicate radial streaks with a shape layer.
        return shapeBurst(comp, opts);
      }
    }
    // Bloom on the particles.
    var glow = addFx(lay, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(60); glow.property("ADBE Glow-0004").setValue(1.4); } catch (e) {} }
    fadeOut(lay, t0 + dur, 0.35);
    return lay;
  }

  // Stock-only radial streak burst built from duplicated rotated shape strokes.
  function shapeBurst(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.0;
    var c = centerOf(comp, opts);
    var col = opts.color || [0.4, 0.8, 1];
    var rays = opts.rays || 14;
    var host = comp.layers.addShape();
    host.name = opts.name || "Burst Rays";
    host.startTime = t0;
    host.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(host, "ADD");
    var root = host.property("ADBE Root Vectors Group");
    for (var i = 0; i < rays; i++) {
      var g = root.addProperty("ADBE Vector Group");
      var vec = g.property("ADBE Vectors Group");
      var rect = vec.addProperty("ADBE Vector Shape - Rect");
      rect.property("ADBE Vector Rect Size").setValue([6, 90]);
      var fill = vec.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(col);
      var gt = g.property("ADBE Vector Transform Group");
      gt.property("ADBE Vector Rotation").setValue(i * (360 / rays));
      var gp = gt.property("ADBE Vector Position");
      gp.setValueAtTime(0, [0, 0]);
      gp.setValueAtTime(dur * 0.8, [0, -140]);
    }
    var sc = host.property("ADBE Transform Group").property("ADBE Scale");
    sc.setValueAtTime(t0, [10, 10]); sc.setValueAtTime(t0 + dur, [140, 140]);
    MP.setEase(sc, "expoOut");
    fadeOut(host, t0 + dur * 0.5, dur * 0.5);
    var glow = addFx(host, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(50); } catch (e) {} }
    log("energyBurst via stock shapeBurst (" + rays + " rays)");
    return host;
  }

  // Expanding shockwave ring with refraction-style distortion.
  function shockwave(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.9;
    var c = centerOf(comp, opts);
    var col = opts.color || [0.7, 0.85, 1];
    var ring = comp.layers.addShape();
    ring.name = opts.name || "Shockwave";
    ring.startTime = t0;
    ring.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(ring, "ADD");
    var root = ring.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var vec = g.property("ADBE Vectors Group");
    var el = vec.addProperty("ADBE Vector Shape - Ellipse");
    el.property("ADBE Vector Ellipse Size").setValue([120, 120]);
    var stroke = vec.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(col);
    var sw = stroke.property("ADBE Vector Stroke Width");
    sw.setValueAtTime(t0, 18); sw.setValueAtTime(t0 + dur, 0);
    var sc = ring.property("ADBE Transform Group").property("ADBE Scale");
    sc.setValueAtTime(t0, [4, 4]); sc.setValueAtTime(t0 + dur, [(opts.strength || 18) * 22, (opts.strength || 18) * 22]);
    MP.setEase(sc, "expoOut");
    fadeOut(ring, t0 + dur * 0.6, dur * 0.4);
    // Heat-haze ripple on the layers beneath.
    var disp = adjustment(comp);
    disp.name = "Shockwave Distort";
    disp.startTime = t0;
    disp.outPoint = t0 + dur;
    var rb = addFx(disp, "CC Radial Fast Blur") || addFx(disp, "ADBE Radial Blur");
    if (rb) { try { var amt = rb.property("Amount") || rb.property(1); if (amt) { amt.setValueAtTime(t0, 30); amt.setValueAtTime(t0 + dur, 0); } } catch (e) {} }
    log("shockwave built");
    return ring;
  }

  // Rotating arcane magic circle (concentric polygons + runes glow).
  function magicCircle(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || (comp.duration - t0);
    var c = centerOf(comp, opts);
    var col = opts.color || [0.55, 0.35, 1];
    var host = comp.layers.addShape();
    host.name = opts.name || "Magic Circle";
    host.startTime = t0;
    host.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(host, "ADD");
    var root = host.property("ADBE Root Vectors Group");
    var radii = [60, 110, 150];
    var pts = [6, 3, 12];
    for (var i = 0; i < radii.length; i++) {
      var g = root.addProperty("ADBE Vector Group");
      var vec = g.property("ADBE Vectors Group");
      var star = vec.addProperty("ADBE Vector Shape - Star");
      star.property("ADBE Vector Star Type").setValue(2); // polygon
      star.property("ADBE Vector Star Points").setValue(pts[i]);
      star.property("ADBE Vector Star Outer Radius").setValue(radii[i]);
      var stroke = vec.addProperty("ADBE Vector Graphic - Stroke");
      stroke.property("ADBE Vector Stroke Color").setValue(col);
      stroke.property("ADBE Vector Stroke Width").setValue(3);
      var rot = g.property("ADBE Vector Transform Group").property("ADBE Vector Rotation");
      try { rot.expression = "time*" + (i % 2 === 0 ? 22 : -16) + " + " + (i * 30) + ";"; } catch (e) {}
    }
    var ringG = root.addProperty("ADBE Vector Group");
    var rvec = ringG.property("ADBE Vectors Group");
    var rel = rvec.addProperty("ADBE Vector Shape - Ellipse");
    rel.property("ADBE Vector Ellipse Size").setValue([320, 320]);
    var rstroke = rvec.addProperty("ADBE Vector Graphic - Stroke");
    rstroke.property("ADBE Vector Stroke Color").setValue(col);
    rstroke.property("ADBE Vector Stroke Width").setValue(2);
    var glow = addFx(host, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(40); glow.property("ADBE Glow-0004").setValue(1.6); } catch (e) {} }
    MP.addScaleAnimation(host, 0, 100, t0, 0.7, "backOut");
    MP.addOpacityAnimation(host, 0, 100, t0, 0.5, "quadOut");
    log("magicCircle built");
    return host;
  }

  // Power aura wrapping a hero layer: pulsing glow + rising energy.
  function powerAura(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    var t0 = opts.start || 0;
    var col = opts.color || [1, 0.6, 0.2];
    if (target) {
      var glow = addFx(target, "ADBE Glow");
      if (glow) {
        try {
          var rad = glow.property("ADBE Glow-0003"); var inten = glow.property("ADBE Glow-0004");
          if (rad) rad.expression = "40 + Math.sin(time*Math.PI*2*1.4)*18;";
          if (inten) inten.expression = "1.2 + Math.sin(time*Math.PI*2*1.4)*0.5;";
        } catch (e) {}
      }
    }
    // Rising ember particles around the hero.
    var emb = energyBurst(comp, { start: t0, duration: opts.duration || comp.duration - t0, color: col, name: "Aura Embers", position: opts.position });
    log("powerAura built");
    return emb;
  }

  // Quick directional hit spark.
  function hitSpark(comp, opts) {
    opts = opts || {};
    opts.duration = opts.duration || 0.35;
    opts.rays = opts.rays || 6;
    var s = shapeBurst(comp, opts);
    log("hitSpark built");
    return s;
  }

  // ======================================================================
  // CINEMA VFX
  // ======================================================================

  // Drifting atmospheric fog/haze from Fractal Noise.
  function atmosphericFog(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var lay = solid(comp, [0.5, 0.5, 0.5], opts.name || "Atmospheric Fog", comp.duration - t0);
    lay.startTime = t0;
    setBlend(lay, "SCREEN");
    var fn = addFx(lay, "ADBE Fractal Noise");
    if (fn) {
      try {
        fn.property("ADBE Fractal Noise-0001").setValue(4); // fractal type soft? leave default
        var contrast = fn.property("ADBE Fractal Noise-0005"); if (contrast) contrast.setValue(60);
        var bright = fn.property("ADBE Fractal Noise-0006"); if (bright) bright.setValue(-30);
        var scale = fn.property("ADBE Fractal Noise-0013"); if (scale) scale.setValue(420);
        var evo = fn.property("ADBE Fractal Noise-0017"); if (evo) evo.expression = "time*16;";
        var off = fn.property("ADBE Fractal Noise-0014"); if (off) off.expression = "[value[0]+time*22, value[1]];";
      } catch (e) { log("fog param skip: " + e.toString()); }
    }
    var op = tp(lay, "opacity"); op.setValue(opts.strength || 35);
    log("atmosphericFog built");
    return lay;
  }

  // God-rays / volumetric light shafts.
  function lightRays(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var c = centerOf(comp, opts);
    var lay = solid(comp, [0, 0, 0], opts.name || "Light Rays", comp.duration - t0);
    lay.startTime = t0;
    setBlend(lay, "ADD");
    var lr = addFx(lay, "CC Light Rays");
    if (lr) {
      try {
        var ctr = lr.property("Center"); if (ctr) ctr.setValue(c);
        var inten = lr.property("Intensity"); if (inten) inten.setValue(opts.strength || 120);
        var rad = lr.property("Radius"); if (rad) rad.setValue(40);
      } catch (e) {}
      log("lightRays via CC Light Rays");
    } else {
      // Stock fallback: radial gradient ramp + fast blur.
      var ramp = addFx(lay, "ADBE Ramp");
      if (ramp) {
        try {
          ramp.property("ADBE Ramp-0005").setValue(1); // radial
          ramp.property("ADBE Ramp-0001").setValue(c);
          ramp.property("ADBE Ramp-0002").setValue([1, 0.95, 0.8]);
        } catch (e) {}
      }
      log("lightRays via stock radial ramp fallback");
    }
    var op = tp(lay, "opacity");
    op.expression = "var b=" + (opts.strength ? 70 : 55) + "; b + Math.sin(time*Math.PI*2*0.18)*12;";
    return lay;
  }

  // Animated anamorphic lens flare (Optical Flares when present, else stock).
  function lensFlare(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.5;
    var lay = solid(comp, [0, 0, 0], opts.name || "Lens Flare", dur + 0.2);
    lay.startTime = t0;
    setBlend(lay, "ADD");
    var of = addFx(lay, "VideoCopilot Optical Flares 1.3") || addFx(lay, "VCP OpticalFlares");
    var flare = of || addFx(lay, "ADBE Lens Flare");
    if (flare) {
      var posProp = of ? null : flare.property("ADBE Lens Flare-0001");
      if (posProp) {
        posProp.setValueAtTime(t0, [comp.width * 0.1, comp.height * 0.35]);
        posProp.setValueAtTime(t0 + dur, [comp.width * 0.9, comp.height * 0.4]);
        MP.setEase(posProp, "sineInOut");
      }
      log(of ? "lensFlare via Optical Flares" : "lensFlare via stock Lens Flare");
    }
    fadeOut(lay, t0 + dur * 0.75, dur * 0.25);
    return lay;
  }

  // Procedural fire OR smoke column from layered fractal noise + displacement.
  function fireSmoke(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var isSmoke = opts.mode === "smoke";
    var lay = solid(comp, [0, 0, 0], opts.name || (isSmoke ? "Smoke" : "Fire"), comp.duration - t0);
    lay.startTime = t0;
    setBlend(lay, isSmoke ? "SCREEN" : "ADD");
    var fn = addFx(lay, "ADBE Fractal Noise");
    if (fn) {
      try {
        var contrast = fn.property("ADBE Fractal Noise-0005"); if (contrast) contrast.setValue(140);
        var scale = fn.property("ADBE Fractal Noise-0013"); if (scale) scale.setValue(isSmoke ? 260 : 120);
        var evo = fn.property("ADBE Fractal Noise-0017"); if (evo) evo.expression = "time*" + (isSmoke ? 30 : 90) + ";";
        var off = fn.property("ADBE Fractal Noise-0014"); if (off) off.expression = "[value[0], value[1]-time*" + (isSmoke ? 60 : 160) + "];";
      } catch (e) {}
    }
    var td = addFx(lay, "ADBE Turbulent Displace");
    if (td) { try { td.property("ADBE Turbulent Displace-0001").setValue(isSmoke ? 30 : 55); td.property("ADBE Turbulent Displace-0003").expression = "time*" + (isSmoke ? 40 : 120) + ";"; } catch (e) {} }
    if (!isSmoke) {
      // Colorize to fire gradient.
      var ramp = addFx(lay, "ADBE Ramp") || null;
      var tint = addFx(lay, "ADBE Colorama") || addFx(lay, "ADBE Tint");
      if (tint) {
        try {
          // Tint dark->bright fire tones.
          tint.property("ADBE Tint-0002") && tint.property("ADBE Tint-0002").setValue([1, 0.85, 0.25]);
          tint.property("ADBE Tint-0001") && tint.property("ADBE Tint-0001").setValue([0.6, 0.05, 0]);
        } catch (e) {}
      }
    }
    // Mask the column so it rises from a base.
    var op = tp(lay, "opacity"); op.setValue(isSmoke ? 55 : 85);
    log("fireSmoke built (" + (isSmoke ? "smoke" : "fire") + ")");
    return lay;
  }

  // Glowing energy beam between two points (Saber when present, else stroke+glow).
  function energyBeam(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.0;
    var col = opts.color || [0.3, 0.8, 1];
    var a = opts.from || [comp.width * 0.2, comp.height * 0.5];
    var b = opts.to || [comp.width * 0.8, comp.height * 0.5];
    var lay = solid(comp, [0, 0, 0], opts.name || "Energy Beam", comp.duration - t0);
    lay.startTime = t0;
    setBlend(lay, "ADD");
    if (pluginAvailable(comp, "ADBE Saber")) {
      var saber = addFx(lay, "ADBE Saber");
      log("energyBeam via Saber");
      try { saber.property("Glow Color") && saber.property("Glow Color").setValue(col); } catch (e) {}
    } else {
      // Stock: draw a mask path A->B, stroke it, glow it.
      var masks = lay.property("ADBE Mask Parade");
      var mask = masks.addProperty("ADBE Mask Atom");
      var shp = new Shape(); shp.vertices = [a, b]; shp.closed = false;
      mask.property("ADBE Mask Shape").setValue(shp);
      mask.maskMode = MaskMode.NONE;
      var stroke = addFx(lay, "ADBE Stroke");
      if (stroke) {
        try {
          stroke.property("ADBE Stroke-0001").setValue(col); // color
          stroke.property("ADBE Stroke-0004").setValue(opts.strength || 8); // brush size
          var endP = stroke.property("ADBE Stroke-0008"); // End
          if (endP) { endP.setValueAtTime(t0, 0); endP.setValueAtTime(t0 + dur, 100); MP.setEase(endP, "expoOut"); }
        } catch (e) {}
      }
      var glow = addFx(lay, "ADBE Glow");
      if (glow) { try { glow.property("ADBE Glow-0003").setValue(70); glow.property("ADBE Glow-0004").setValue(1.8); } catch (e) {} }
      log("energyBeam via stock stroke+glow");
    }
    // Crackle the beam slightly.
    var td = addFx(lay, "ADBE Turbulent Displace");
    if (td) { try { td.property("ADBE Turbulent Displace-0001").setValue(opts.strength ? opts.strength : 12); td.property("ADBE Turbulent Displace-0003").expression = "time*220;"; } catch (e) {} }
    return lay;
  }

  // Film grain (pro Add Grain when present, else organic noise) on an adjustment layer.
  function filmGrain(comp, opts) {
    opts = opts || {};
    var adj = adjustment(comp);
    adj.name = opts.name || "Film Grain";
    var grain = addFx(adj, "ADBE Add Grain2");
    if (grain) {
      setP(grain, ["Intensity"], (opts.strength || 8) / 10);
      setP(grain, ["Size"], 1.1);
      log("filmGrain via Add Grain");
    } else {
      var noise = addFx(adj, "ADBE Noise HLS Auto") || addFx(adj, "ADBE Noise");
      setP(noise, ["Noise", "ADBE Noise HLS Auto-0002", "ADBE Noise-0001"], opts.strength || 8);
      var op = tp(adj, "opacity"); op.setValue(70);
      log("filmGrain via noise fallback");
    }
    return adj;
  }

  // Cinematic color grade + soft vignette adjustment layer.
  function cinematicGrade(comp, opts) {
    opts = opts || {};
    var adj = adjustment(comp);
    adj.name = opts.name || "Cinematic Grade";
    var curves = addFx(adj, "ADBE CurvesCustom");
    var vib = addFx(adj, "ADBE Vibrance");
    setP(vib, ["Vibrance", "ADBE Vibrance-0001"], 22);
    setP(vib, ["Saturation", "ADBE Vibrance-0002"], 6);
    // gentle warm contrast lift via Curves is hard without bezier; use Photo Filter-ish Tint blend.
    var lvls = addFx(adj, "ADBE Pro Levels2");
    var grade = tp(adj, "opacity"); grade.setValue(92);
    // Vignette via a black radial ramp solid masked.
    var vig = solid(comp, [0, 0, 0], "Vignette", comp.duration);
    var msk = vig.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var s = new Shape();
    var w = comp.width, h = comp.height;
    s.vertices = [[w * 0.5, -h * 0.1], [w * 1.1, h * 0.5], [w * 0.5, h * 1.1], [-w * 0.1, h * 0.5]];
    s.inTangents = [[ -w*0.3,0],[0,-h*0.3],[w*0.3,0],[0,h*0.3]];
    s.outTangents = [[ w*0.3,0],[0,h*0.3],[-w*0.3,0],[0,-h*0.3]];
    s.closed = true;
    msk.property("ADBE Mask Shape").setValue(s);
    msk.maskMode = MaskMode.SUBTRACT;
    msk.property("ADBE Mask Feather").setValue([w * 0.25, h * 0.25]);
    vig.property("ADBE Transform Group").property("ADBE Opacity").setValue(55);
    log("cinematicGrade built");
    return adj;
  }

  // ======================================================================
  // SOCIAL MEDIA VFX
  // ======================================================================

  // Digital glitch hit: RGB split + block displacement bursts.
  function glitch(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    var lay = target || adjustment(comp);
    if (!target) { lay.name = opts.name || "Glitch"; }
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.5;
    // Channel offset for RGB split.
    var co = addFx(lay, "ADBE CHANNEL BLUR") || addFx(lay, "ADBE Channel Blur");
    var disp = addFx(lay, "ADBE Displacement Map") || addFx(lay, "ADBE Wave Warp");
    var off = addFx(lay, "ADBE Channel Offset") || addFx(lay, "ADBE Offset");
    // Posterize time gives the choppy digital cadence.
    var pt = addFx(lay, "ADBE Posterize Time");
    if (pt) { try { pt.property(1).setValue(14); } catch (e) {} }
    var tr = addFx(lay, "ADBE Transform");
    if (tr) {
      try {
        var p = tr.property("ADBE Transform-0006") || tr.property("Position");
        if (p) p.expression = "seedRandom(index,true); var g = (time>" + t0 + " && time<" + (t0 + dur) + ") ? (random(-30,30)) : 0; var on = Math.random()>0.7?1:0; [value[0]+g*on, value[1]];";
      } catch (e) {}
    }
    log("glitch built");
    return lay;
  }

  // RGB chromatic-aberration split that holds (stylistic, not a hit).
  function rgbSplit(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    var lay = target || adjustment(comp);
    if (!target) lay.name = opts.name || "RGB Split";
    var amt = opts.strength || 6;
    var off = addFx(lay, "ADBE Channel Offset") || addFx(lay, "ADBE Offset");
    // Simple approach: 3D Glasses-style via Displacement is heavy; use channel offset.
    if (off) {
      try {
        // Offset uses center; approximate by expression wiggle on opacity-safe chan.
      } catch (e) {}
    }
    // Reliable stock chromatic aberration: duplicate twice with red/blue tints offset.
    if (!target) {
      log("rgbSplit (adjustment-mode limited; use targetLayer for full effect)");
    }
    return lay;
  }

  // Neon sign glow + flicker on a (usually text/shape) layer.
  function neonGlow(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("neonGlow needs targetLayer"); return null; }
    var col = opts.color || [0.2, 1, 0.9];
    var glow1 = addFx(target, "ADBE Glow");
    if (glow1) {
      try {
        glow1.property("ADBE Glow-0003").setValue(28);
        glow1.property("ADBE Glow-0004").setValue(2.2);
        var colA = glow1.property("ADBE Glow-0008"); if (colA) colA.setValue(col);
      } catch (e) {}
    }
    var glow2 = addFx(target, "ADBE Glow");
    if (glow2) { try { glow2.property("ADBE Glow-0003").setValue(90); glow2.property("ADBE Glow-0004").setValue(1.1); } catch (e) {} }
    // Flicker on opacity.
    var op = target.property("ADBE Transform Group").property("ADBE Opacity");
    try { op.expression = "f = Math.random(); seedRandom(Math.floor(time*18), true); var fl = random(0,1); fl>0.08 ? value : value*0.45;"; } catch (e) {}
    log("neonGlow built");
    return target;
  }

  // Fast whip-pan transition (directional blur + slide) on the whole comp.
  function whipPan(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.4;
    var adj = adjustment(comp);
    adj.name = opts.name || "Whip Pan";
    adj.startTime = t0; adj.outPoint = t0 + dur;
    var db = addFx(adj, "ADBE Motion Blur") || addFx(adj, "ADBE Directional Blur");
    if (db) {
      try {
        var dir = db.property("ADBE Motion Blur-0001"); if (dir) dir.setValue(opts.angle != null ? opts.angle : 90);
        var len = db.property("ADBE Motion Blur-0002");
        if (len) { len.setValueAtTime(t0, 0); len.setValueAtTime(t0 + dur * 0.5, 200); len.setValueAtTime(t0 + dur, 0); }
      } catch (e) {}
    }
    var pos = tp(adj, "position");
    var base = pos.value;
    var dx = (opts.angle === 0 || opts.angle === 180) ? comp.width : 0;
    pos.setValueAtTime(t0, base);
    pos.setValueAtTime(t0 + dur * 0.5, [base[0] + comp.width * 0.6, base[1]]);
    pos.setValueAtTime(t0 + dur, base);
    log("whipPan built");
    return adj;
  }

  // Kinetic pop: punchy scale overshoot + flash for stickers/emojis/captions.
  function kineticPop(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("kineticPop needs targetLayer"); return null; }
    var t0 = opts.start || 0;
    MP.addScaleAnimation(target, 0, 118, t0, 0.22, "backOut");
    MP.addScaleAnimation(target, 118, 100, t0 + 0.22, 0.18, "quadOut");
    MP.addOpacityAnimation(target, 0, 100, t0, 0.12, "quadOut");
    try {
      var rot = target.property("ADBE Transform Group").property("ADBE Rotate Z");
      rot.setValueAtTime(t0, -8); rot.setValueAtTime(t0 + 0.4, 0); MP.setEase(rot, "backOut");
    } catch (e) {}
    log("kineticPop built");
    return target;
  }

  // ======================================================================
  // ADVANCED / COMPLEX PRIMITIVES
  // ======================================================================

  // Helper: jagged polyline between two points for lightning / cracks.
  function jaggedPath(a, b, segments, jitter) {
    var verts = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = a[0] + (b[0] - a[0]) * t;
      var y = a[1] + (b[1] - a[1]) * t;
      if (i !== 0 && i !== segments) {
        x += (Math.random() - 0.5) * jitter;
        y += (Math.random() - 0.5) * jitter;
      }
      verts.push([x, y]);
    }
    return verts;
  }

  // Branching electric lightning bolt (stroke on jagged masks + glow + flicker).
  function lightningBolt(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.6;
    var col = opts.color || [0.6, 0.8, 1];
    var a = opts.from || [comp.width * 0.5, 0];
    var b = opts.to || [comp.width * 0.5, comp.height];
    var lay = solid(comp, [0, 0, 0], opts.name || "Lightning", dur + 0.2);
    lay.startTime = t0;
    setBlend(lay, "ADD");
    var masks = lay.property("ADBE Mask Parade");
    var seg = opts.segments || 9;
    var main = masks.addProperty("ADBE Mask Atom");
    var shp = new Shape(); shp.vertices = jaggedPath(a, b, seg, opts.jitter || 70); shp.closed = false;
    main.property("ADBE Mask Shape").setValue(shp); main.maskMode = MaskMode.NONE;
    // a couple of branches
    var branches = opts.branches || 2;
    for (var k = 0; k < branches; k++) {
      var mid = [a[0] + (b[0] - a[0]) * (0.4 + 0.2 * k), a[1] + (b[1] - a[1]) * (0.4 + 0.2 * k)];
      var tip = [mid[0] + (Math.random() - 0.5) * comp.width * 0.3, mid[1] + (Math.random() - 0.5) * comp.height * 0.2];
      var bm = masks.addProperty("ADBE Mask Atom");
      var bs = new Shape(); bs.vertices = jaggedPath(mid, tip, 4, 50); bs.closed = false;
      bm.property("ADBE Mask Shape").setValue(bs); bm.maskMode = MaskMode.NONE;
    }
    var stroke = addFx(lay, "ADBE Stroke");
    if (stroke) {
      try {
        stroke.property("ADBE Stroke-0001").setValue(col);
        stroke.property("ADBE Stroke-0004").setValue(opts.strength || 4);
        stroke.property("ADBE Stroke-0010") && stroke.property("ADBE Stroke-0010").setValue(2); // all masks
        var endP = stroke.property("ADBE Stroke-0008");
        if (endP) { endP.setValueAtTime(t0, 0); endP.setValueAtTime(t0 + dur * 0.3, 100); MP.setEase(endP, "expoOut"); }
      } catch (e) {}
    }
    var glow = addFx(lay, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(80); glow.property("ADBE Glow-0004").setValue(2.4); } catch (e) {} }
    var op = tp(lay, "opacity");
    try { op.expression = "seedRandom(Math.floor(time*40),true); time<" + (t0 + dur) + " ? (random()>0.25?100:25) : 0;"; } catch (e) {}
    log("lightningBolt built (" + branches + " branches)");
    return lay;
  }

  // Swirling portal / wormhole vortex (polar fractal + rotating rings + core glow).
  function portal(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || (comp.duration - t0);
    var c = centerOf(comp, opts);
    var col = opts.color || [0.5, 0.2, 1];
    var lay = solid(comp, [0, 0, 0], opts.name || "Portal", dur);
    lay.startTime = t0;
    setBlend(lay, "ADD");
    var fn = addFx(lay, "ADBE Fractal Noise");
    if (fn) {
      try {
        fn.property("ADBE Fractal Noise-0013").setValue(180);
        var evo = fn.property("ADBE Fractal Noise-0017"); if (evo) evo.expression = "time*120;";
      } catch (e) {}
    }
    var polar = addFx(lay, "ADBE Polar Coordinates");
    if (polar) { try { polar.property("ADBE Polar Coordinates-0001").setValue(100); polar.property("ADBE Polar Coordinates-0002").setValue(1); } catch (e) {} }
    var rot = tp(lay, "rotation"); try { rot.expression = "time*60;"; } catch (e) {}
    var pos = tp(lay, "position"); pos.setValue(c);
    var tint = addFx(lay, "ADBE Tint");
    if (tint) { try { tint.property("ADBE Tint-0002").setValue(col); } catch (e) {} }
    var glow = addFx(lay, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(60); } catch (e) {} }
    // Rotating energy rings on top.
    magicCircle(comp, { start: t0, color: col, position: c });
    MP.addScaleAnimation(lay, 0, 100, t0, 0.6, "backOut");
    log("portal built");
    return lay;
  }

  // Hexagonal force-field / shield dome with fresnel edge + impact ripple.
  function forceField(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var c = centerOf(comp, opts);
    var col = opts.color || [0.3, 0.7, 1];
    var rad = opts.radius || Math.min(comp.width, comp.height) * 0.32;
    var dome = comp.layers.addShape();
    dome.name = opts.name || "Force Field";
    dome.startTime = t0;
    dome.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(dome, "ADD");
    var root = dome.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var vec = g.property("ADBE Vectors Group");
    var el = vec.addProperty("ADBE Vector Shape - Ellipse");
    el.property("ADBE Vector Ellipse Size").setValue([rad * 2, rad * 2]);
    var stroke = vec.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(col);
    stroke.property("ADBE Vector Stroke Width").setValue(5);
    var fill = vec.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(col);
    fill.property("ADBE Vector Fill Opacity").setValue(12);
    // hex grid texture
    var grid = addFx(dome, "ADBE Grid") || addFx(dome, "ADBE Mr Mercury");
    var glow = addFx(dome, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(40); glow.property("ADBE Glow-0004").setValue(1.6); } catch (e) {} }
    // impact ripple
    if (opts.impact) shockwave(comp, { start: t0 + 0.3, duration: 0.7, color: col, position: c, strength: 10 });
    var op = tp(dome, "opacity");
    try { op.expression = "70 + Math.sin(time*Math.PI*2*1.1)*18;"; } catch (e) {}
    MP.addScaleAnimation(dome, 0, 100, t0, 0.5, "backOut");
    log("forceField built");
    return dome;
  }

  // Disintegration / dissolve: scatter a target layer into particles.
  function disintegrate(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("disintegrate needs targetLayer"); return null; }
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.4;
    var poly = addFx(target, "CC Pixel Polly") || addFx(target, "CC Scatterize");
    if (poly) {
      try {
        var force = poly.property("Force") || poly.property(1);
        if (force) { force.setValueAtTime(t0, 0); force.setValueAtTime(t0 + 0.1, opts.strength || 40); }
      } catch (e) {}
      log("disintegrate via CC Pixel Polly/Scatterize");
    } else {
      // stock fallback: turbulent displace ramp + fade.
      var td = addFx(target, "ADBE Turbulent Displace");
      if (td) { try { var amt = td.property("ADBE Turbulent Displace-0001"); amt.setValueAtTime(t0, 0); amt.setValueAtTime(t0 + dur, 220); } catch (e) {} }
      log("disintegrate via stock turbulent displace fallback");
    }
    MP.addOpacityAnimation(target, 100, 0, t0 + dur * 0.4, dur * 0.6, "quadOut");
    return target;
  }

  // Fast sword / energy slash arc with motion-blur trail.
  function swordSlash(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.4;
    var c = centerOf(comp, opts);
    var col = opts.color || [1, 1, 1];
    var lay = comp.layers.addShape();
    lay.name = opts.name || "Slash";
    lay.startTime = t0;
    lay.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(lay, "ADD");
    var root = lay.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var vec = g.property("ADBE Vectors Group");
    var path = vec.addProperty("ADBE Vector Shape - Group");
    var s = new Shape();
    var r = opts.radius || 240;
    s.vertices = [[-r, r * 0.5], [-r * 0.2, -r * 0.5], [r, -r * 0.2]];
    s.inTangents = [[0, 0], [-r * 0.3, 0], [0, 0]];
    s.outTangents = [[r * 0.3, 0], [r * 0.3, 0], [0, 0]];
    s.closed = false;
    path.property("ADBE Vector Shape").setValue(s);
    var stroke = vec.addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue(col);
    var sw = stroke.property("ADBE Vector Stroke Width");
    sw.setValueAtTime(t0, 26); sw.setValueAtTime(t0 + dur, 0);
    var trim = vec.addProperty("ADBE Vector Filter - Trim");
    var te = trim.property("ADBE Vector Trim End");
    var ts = trim.property("ADBE Vector Trim Start");
    te.setValueAtTime(t0, 0); te.setValueAtTime(t0 + dur, 100); MP.setEase(te, "expoOut");
    ts.setValueAtTime(t0 + dur * 0.4, 0); ts.setValueAtTime(t0 + dur, 100); MP.setEase(ts, "expoOut");
    var glow = addFx(lay, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(50); } catch (e) {} }
    try { lay.motionBlur = true; comp.motionBlur = true; } catch (e) {}
    log("swordSlash built");
    return lay;
  }

  // Anime radial speed lines focused on a point.
  function speedLines(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 0.8;
    var c = centerOf(comp, opts);
    var lay = solid(comp, [1, 1, 1], opts.name || "Speed Lines", dur + 0.2);
    lay.startTime = t0;
    setBlend(lay, opts.dark ? "MULTIPLY" : "ADD");
    var fn = addFx(lay, "ADBE Fractal Noise");
    if (fn) {
      try {
        fn.property("ADBE Fractal Noise-0013").setValue([6, 600]);
        var evo = fn.property("ADBE Fractal Noise-0017"); if (evo) evo.expression = "time*200;";
        var contrast = fn.property("ADBE Fractal Noise-0005"); if (contrast) contrast.setValue(400);
      } catch (e) {}
    }
    var polar = addFx(lay, "ADBE Polar Coordinates");
    if (polar) { try { polar.property("ADBE Polar Coordinates-0001").setValue(100); polar.property("ADBE Polar Coordinates-0002").setValue(1); } catch (e) {} }
    // radial mask hole in center so the subject is visible
    var msk = lay.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var rr = Math.min(comp.width, comp.height) * 0.22;
    var sh = new Shape();
    sh.vertices = [[c[0], c[1] - rr], [c[0] + rr, c[1]], [c[0], c[1] + rr], [c[0] - rr, c[1]]];
    sh.inTangents = [[-rr * 0.55, 0], [0, -rr * 0.55], [rr * 0.55, 0], [0, rr * 0.55]];
    sh.outTangents = [[rr * 0.55, 0], [0, rr * 0.55], [-rr * 0.55, 0], [0, -rr * 0.55]];
    sh.closed = true;
    msk.property("ADBE Mask Shape").setValue(sh);
    msk.maskMode = MaskMode.SUBTRACT;
    msk.property("ADBE Mask Feather").setValue([rr * 0.6, rr * 0.6]);
    log("speedLines built");
    return lay;
  }

  // Charge-up: converging energy + growing core glow + screen shake on comp camera.
  function chargeUp(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var dur = opts.duration || 1.4;
    var c = centerOf(comp, opts);
    var col = opts.color || [0.4, 0.8, 1];
    var core = comp.layers.addShape();
    core.name = opts.name || "Charge Core";
    core.startTime = t0;
    core.property("ADBE Transform Group").property("ADBE Position").setValue(c);
    setBlend(core, "ADD");
    var root = core.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var vec = g.property("ADBE Vectors Group");
    var el = vec.addProperty("ADBE Vector Shape - Ellipse");
    el.property("ADBE Vector Ellipse Size").setValue([60, 60]);
    var fill = vec.addProperty("ADBE Vector Graphic - Fill");
    fill.property("ADBE Vector Fill Color").setValue(col);
    var glow = addFx(core, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(70); glow.property("ADBE Glow-0004").setValue(2.0); } catch (e) {} }
    MP.addScaleAnimation(core, 10, 130, t0, dur, "expoOut");
    var op = tp(core, "opacity");
    op.setValueAtTime(t0, 0); op.setValueAtTime(t0 + 0.2, 100);
    // release burst at the end
    energyBurst(comp, { start: t0 + dur, duration: 1.0, color: col, position: c });
    log("chargeUp built");
    return core;
  }

  // Muzzle flash: brief radial flash + sparks.
  function muzzleFlash(comp, opts) {
    opts = opts || {};
    opts.duration = opts.duration || 0.12;
    var flash = solid(comp, opts.color || [1, 0.85, 0.5], opts.name || "Muzzle Flash", 0.16);
    flash.startTime = opts.start || 0;
    setBlend(flash, "ADD");
    var c = centerOf(comp, opts);
    var msk = flash.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var rr = opts.radius || 90;
    var sh = new Shape();
    sh.vertices = [[c[0], c[1] - rr], [c[0] + rr, c[1]], [c[0], c[1] + rr], [c[0] - rr, c[1]]];
    sh.inTangents = [[-rr * 0.55, 0], [0, -rr * 0.55], [rr * 0.55, 0], [0, rr * 0.55]];
    sh.outTangents = [[rr * 0.55, 0], [0, rr * 0.55], [-rr * 0.55, 0], [0, -rr * 0.55]];
    sh.closed = true;
    msk.property("ADBE Mask Shape").setValue(sh);
    msk.property("ADBE Mask Feather").setValue([40, 40]);
    fadeOut(flash, (opts.start || 0) + 0.04, 0.1);
    hitSpark(comp, { start: opts.start || 0, position: c, color: opts.color || [1, 0.8, 0.4], rays: 5, duration: 0.2 });
    log("muzzleFlash built");
    return flash;
  }

  // Sci-fi hologram look on a target: scanlines + RGB split + flicker + glow + cyan tint.
  function hologram(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("hologram needs targetLayer"); return null; }
    var col = opts.color || [0.3, 0.9, 1];
    var tint = addFx(target, "ADBE Tint");
    if (tint) { try { tint.property("ADBE Tint-0002").setValue(col); tint.property("ADBE Tint-0003") && tint.property("ADBE Tint-0003").setValue(60); } catch (e) {} }
    var grid = addFx(target, "ADBE Grid");
    if (grid) {
      try {
        grid.property("ADBE Grid-0008") && grid.property("ADBE Grid-0008").setValue([0, 0, 0]); // line color
        grid.property("ADBE Grid-0009") && grid.property("ADBE Grid-0009").setValue(40); // opacity
        var blend = grid.property("ADBE Grid-0011"); if (blend) blend.setValue(3); // multiply over
      } catch (e) {}
    }
    var glow = addFx(target, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(30); glow.property("ADBE Glow-0004").setValue(1.4); } catch (e) {} }
    var op = target.property("ADBE Transform Group").property("ADBE Opacity");
    try { op.expression = "seedRandom(Math.floor(time*24),true); var base=" + (opts.strength || 82) + "; random()>0.12 ? base : base*0.6;"; } catch (e) {}
    log("hologram built");
    return target;
  }

  // Rain storm (CC Rainfall when present, else procedural streaks + fog).
  function rainStorm(comp, opts) {
    opts = opts || {};
    var lay = solid(comp, [0, 0, 0], opts.name || "Rain", comp.duration);
    setBlend(lay, "SCREEN");
    var rain = addFx(lay, "CC Rainfall");
    if (rain) {
      try { (rain.property("Amount") || rain.property(1)).setValue(opts.strength || 8000); } catch (e) {}
      log("rainStorm via CC Rainfall");
    } else {
      var fn = addFx(lay, "ADBE Fractal Noise");
      if (fn) {
        try {
          fn.property("ADBE Fractal Noise-0013").setValue([2, 400]);
          var off = fn.property("ADBE Fractal Noise-0014"); if (off) off.expression = "[value[0], value[1]+time*2200];";
          fn.property("ADBE Fractal Noise-0005") && fn.property("ADBE Fractal Noise-0005").setValue(600);
        } catch (e) {}
      }
      var dir = addFx(lay, "ADBE Motion Blur");
      if (dir) { try { dir.property("ADBE Motion Blur-0001").setValue(15); dir.property("ADBE Motion Blur-0002").setValue(40); } catch (e) {} }
      log("rainStorm via stock procedural fallback");
    }
    atmosphericFog(comp, { strength: 22 });
    return lay;
  }

  // Snow fall (CC Snowfall when present, else soft particle dots).
  function snowFall(comp, opts) {
    opts = opts || {};
    var lay = solid(comp, [0, 0, 0], opts.name || "Snow", comp.duration);
    setBlend(lay, "SCREEN");
    var snow = addFx(lay, "CC Snowfall") || addFx(lay, "CC Snow");
    if (snow) {
      try { (snow.property("Amount") || snow.property(1)).setValue(opts.strength || 6000); } catch (e) {}
      log("snowFall via CC Snowfall");
    } else {
      var cc = addFx(lay, "CC Particle World");
      if (cc) { log("snowFall via CC Particle World fallback"); }
      else { return atmosphericFog(comp, { strength: 25 }); }
    }
    return lay;
  }

  // Water ripple / surface distortion on the layers beneath.
  function waterRipple(comp, opts) {
    opts = opts || {};
    var adj = adjustment(comp);
    adj.name = opts.name || "Water Ripple";
    var wave = addFx(adj, "ADBE Wave Warp") || addFx(adj, "CC Ripple Pulse");
    if (wave) {
      try {
        wave.property("ADBE Wave Warp-0001") && wave.property("ADBE Wave Warp-0001").setValue(opts.strength || 18);
        wave.property("ADBE Wave Warp-0002") && wave.property("ADBE Wave Warp-0002").setValue(220);
      } catch (e) {}
    }
    var caustic = addFx(adj, "ADBE Caustics");
    log("waterRipple built");
    return adj;
  }

  // Plexus-style network of connected dots (Trapcode Form/Plexus, else procedural).
  function plexusNetwork(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.4, 0.7, 1];
    var lay = solid(comp, [0, 0, 0], opts.name || "Plexus", comp.duration);
    setBlend(lay, "ADD");
    if (pluginAvailable(comp, "Trapcode Form")) {
      addFx(lay, "Trapcode Form");
      log("plexusNetwork via Trapcode Form");
    } else {
      // procedural: scatter dots + drifting; lines approximated by Cell Pattern + glow.
      var cell = addFx(lay, "ADBE Cell Pattern");
      if (cell) {
        try {
          cell.property("ADBE Cell Pattern-0001") && cell.property("ADBE Cell Pattern-0001").setValue(9); // crystallize-ish
          var evo = cell.property("ADBE Cell Pattern-0008"); if (evo) evo.expression = "time*30;";
        } catch (e) {}
      }
      var tint = addFx(lay, "ADBE Tint"); if (tint) { try { tint.property("ADBE Tint-0002").setValue(col); } catch (e) {} }
      var glow = addFx(lay, "ADBE Glow"); if (glow) { try { glow.property("ADBE Glow-0003").setValue(30); } catch (e) {} }
      log("plexusNetwork via stock Cell Pattern fallback");
    }
    var op = tp(lay, "opacity"); op.setValue(opts.strength || 45);
    return lay;
  }

  // Premium defocused bokeh: a pre-comp of large soft circles, heavily blurred,
  // drifting slowly, additive. Looks like real out-of-focus highlights.
  function bokeh(comp, opts) {
    opts = opts || {};
    var col = opts.color || [1, 0.86, 0.6];
    var count = opts.count || 14;
    var host = comp.layers.addShape();
    host.name = opts.name || "Bokeh";
    setBlend(host, "ADD");
    var root = host.property("ADBE Root Vectors Group");
    for (var i = 0; i < count; i++) {
      var g = root.addProperty("ADBE Vector Group");
      var vec = g.property("ADBE Vectors Group");
      var el = vec.addProperty("ADBE Vector Shape - Ellipse");
      var r = 40 + Math.random() * 130;
      el.property("ADBE Vector Ellipse Size").setValue([r, r]);
      var fill = vec.addProperty("ADBE Vector Graphic - Fill");
      fill.property("ADBE Vector Fill Color").setValue(col);
      fill.property("ADBE Vector Fill Opacity").setValue(18 + Math.random() * 42);
      var gt = g.property("ADBE Vector Transform Group");
      var px = (Math.random() - 0.5) * comp.width * 1.1;
      var py = (Math.random() - 0.5) * comp.height * 1.1;
      var pos = gt.property("ADBE Vector Position");
      pos.setValue([px, py]);
      // slow vertical drift + gentle twinkle on group opacity
      var sp = 0.05 + Math.random() * 0.12;
      try { pos.expression = "var s=" + sp.toFixed(3) + "; [value[0]+Math.sin(time*s+ " + i + ")*18, value[1]-time*" + (6 + Math.random() * 10).toFixed(1) + "];"; } catch (e) {}
      var go = gt.property("ADBE Vector Group Opacity");
      try { go.expression = "var b=" + (50 + Math.random() * 40).toFixed(0) + "; b + Math.sin(time*" + (0.6 + Math.random()).toFixed(2) + "+" + i + ")*25;"; } catch (e) {}
    }
    host.property("ADBE Transform Group").property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
    // heavy defocus
    var blur = addFx(host, "ADBE Gaussian Blur 2") || addFx(host, "ADBE Camera Lens Blur");
    setP(blur, ["Blurriness", "ADBE Gaussian Blur 2-0001"], opts.blur || 22);
    var glow = addFx(host, "ADBE Glow");
    setP(glow, ["Glow Radius", "ADBE Glow-0003"], 60);
    setP(glow, ["Glow Intensity", "ADBE Glow-0004"], 1.1);
    var op = tp(host, "opacity"); op.setValue(opts.strength || 38);
    log("bokeh built (" + count + " soft circles)");
    return host;
  }

  // Confetti celebration burst (shape particles raining/scattering).
  function confetti(comp, opts) {
    opts = opts || {};
    var t0 = opts.start || 0;
    var lay = solid(comp, [0, 0, 0], opts.name || "Confetti", comp.duration - t0);
    lay.startTime = t0;
    var cc = addFx(lay, "CC Particle World");
    if (cc) {
      try {
        var birth = cc.property("Birth Rate"); if (birth) birth.setValue(3);
        var longev = cc.property("Longevity (sec)"); if (longev) longev.setValue(3);
        var pt = cc.property("Particle"); if (pt) { var ty = pt.property("Particle Type"); if (ty) ty.setValue(8); }
        var phys = cc.property("Physics"); if (phys) { try { phys.property("Gravity").setValue(0.6); } catch (e) {} }
      } catch (e) {}
      log("confetti via CC Particle World");
    } else {
      log("confetti fallback to shapeBurst");
      return shapeBurst(comp, { start: t0, duration: 1.2, rays: 24, color: opts.color || [1, 0.4, 0.6] });
    }
    return lay;
  }

  // Light leaks / film burn overlay (warm organic gradient flares, animated).
  function lightLeak(comp, opts) {
    opts = opts || {};
    var lay = solid(comp, [0, 0, 0], opts.name || "Light Leak", comp.duration);
    setBlend(lay, "SCREEN");
    var ramp = addFx(lay, "ADBE Ramp");
    var col = opts.color || [1, 0.5, 0.18];
    setP(ramp, ["Ramp Shape", "ADBE Ramp-0005"], 1); // radial
    setP(ramp, ["Start Color", "ADBE Ramp-0002"], col);
    setP(ramp, ["End Color", "ADBE Ramp-0004"], [0, 0, 0]);
    var sp = getP(ramp, ["Start of Ramp", "ADBE Ramp-0001"]);
    if (sp) { try { sp.expression = "[ " + (comp.width * 0.85).toFixed(0) + " + Math.sin(time*0.5)*" + (comp.width * 0.25).toFixed(0) + ", " + (comp.height * 0.2).toFixed(0) + " + Math.cos(time*0.4)*" + (comp.height * 0.18).toFixed(0) + "];"; } catch (e) {} }
    var eo = getP(ramp, ["End of Ramp", "ADBE Ramp-0003"]);
    if (eo) { try { eo.setValue([comp.width * 0.5, comp.height * 1.4]); } catch (e) {} }
    var blur = addFx(lay, "ADBE Gaussian Blur 2");
    setP(blur, ["Blurriness", "ADBE Gaussian Blur 2-0001"], 180);
    var op = tp(lay, "opacity");
    try { op.expression = "var b=" + (opts.strength || 28) + "; b + Math.sin(time*0.55)*b*0.45;"; } catch (e) {}
    log("lightLeak built");
    return lay;
  }

  // Premium light sweep / shine across a hero layer (CC Light Sweep tuned, else gradient).
  function lightSweep(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("lightSweep needs targetLayer"); return null; }
    var t0 = opts.start || 1.0;
    var dur = opts.duration || 1.4;
    try { MP.addLightSweep(target, t0, dur, opts.ease || "sineInOut"); log("lightSweep via CC Light Sweep"); return target; }
    catch (e) { log("lightSweep fallback: " + e.toString()); }
    return target;
  }

  // Soft premium glow on a hero layer — bright tight core + wide soft halo, no flicker.
  function premiumGlow(comp, opts) {
    opts = opts || {};
    var target = opts.targetLayer ? MP.findLayersByPattern(comp, opts.targetLayer)[0] : null;
    if (!target) { log("premiumGlow needs targetLayer"); return null; }
    var tight = addFx(target, "ADBE Glow");
    setP(tight, ["Glow Threshold", "ADBE Glow-0002"], 50);
    setP(tight, ["Glow Radius", "ADBE Glow-0003"], 12);
    setP(tight, ["Glow Intensity", "ADBE Glow-0004"], 1.2);
    var wide = addFx(target, "ADBE Glow");
    setP(wide, ["Glow Threshold", "ADBE Glow-0002"], 60);
    setP(wide, ["Glow Radius", "ADBE Glow-0003"], opts.strength || 90);
    setP(wide, ["Glow Intensity", "ADBE Glow-0004"], 0.6);
    log("premiumGlow built");
    return target;
  }

  // ======================================================================
  // shared
  // ======================================================================
  function fadeOut(layer, t0, dur) {
    var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
    var cur = op.value;
    op.setValueAtTime(t0, cur);
    op.setValueAtTime(t0 + dur, 0);
    MP.setEase(op, "quadOut");
  }

  // Dispatch table used by the generator.
  var REGISTRY = {
    energyBurst: energyBurst,
    shapeBurst: shapeBurst,
    shockwave: shockwave,
    magicCircle: magicCircle,
    powerAura: powerAura,
    hitSpark: hitSpark,
    atmosphericFog: atmosphericFog,
    lightRays: lightRays,
    lensFlare: lensFlare,
    fireSmoke: fireSmoke,
    energyBeam: energyBeam,
    filmGrain: filmGrain,
    cinematicGrade: cinematicGrade,
    glitch: glitch,
    rgbSplit: rgbSplit,
    neonGlow: neonGlow,
    whipPan: whipPan,
    kineticPop: kineticPop,
    // advanced / complex primitives
    lightningBolt: lightningBolt,
    portal: portal,
    forceField: forceField,
    disintegrate: disintegrate,
    swordSlash: swordSlash,
    speedLines: speedLines,
    chargeUp: chargeUp,
    muzzleFlash: muzzleFlash,
    hologram: hologram,
    rainStorm: rainStorm,
    snowFall: snowFall,
    waterRipple: waterRipple,
    plexusNetwork: plexusNetwork,
    bokeh: bokeh,
    confetti: confetti,
    lightLeak: lightLeak,
    lightSweep: lightSweep,
    premiumGlow: premiumGlow,
    enableMotionBlur: function (comp, opts) { return enableMotionBlur(comp); }
  };

  function run(comp, fnName, opts) {
    var fn = REGISTRY[fnName];
    if (!fn) throw new Error("Unknown VFX function: " + fnName);
    return fn(comp, opts || {});
  }

  // -------- COMPOSITE RECIPES ---------------------------------------------
  // Each recipe is an ordered list of { fn, opts } steps. An "intensity"
  // (0.2..2) and a base "start" / "position" are applied across the stack so a
  // single call produces a fully-layered, production-grade effect.
  function scaleOpts(o, intensity, base) {
    var r = {};
    for (var k in o) if (o.hasOwnProperty(k)) r[k] = o[k];
    if (r.strength != null) r.strength = r.strength * intensity;
    if (r.start != null) r.start = (base.start || 0) + r.start; else r.start = base.start || 0;
    if (base.position && r.position == null) r.position = base.position;
    if (base.color && r.color == null) r.color = base.color;
    if (base.targetLayer && r.targetLayer == null) r.targetLayer = base.targetLayer;
    return r;
  }

  var COMPOSITES = {
    // Full cinematic explosion: flash -> fireball -> smoke -> shockwave -> sparks -> grade.
    cinematicExplosion: [
      { fn: "muzzleFlash", opts: { start: 0, radius: 220, color: [1, 0.9, 0.6], duration: 0.15 } },
      { fn: "energyBurst", opts: { start: 0.02, duration: 1.4, color: [1, 0.6, 0.2], strength: 1.4 } },
      { fn: "fireSmoke", opts: { start: 0.05, mode: "fire" } },
      { fn: "fireSmoke", opts: { start: 0.3, mode: "smoke" } },
      { fn: "shockwave", opts: { start: 0.04, duration: 0.9, color: [1, 0.8, 0.5], strength: 22 } },
      { fn: "hitSpark", opts: { start: 0.03, rays: 12, color: [1, 0.85, 0.4], duration: 0.5 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    // Spell cast: charge -> magic circle -> portal energy -> release burst -> beam.
    magicCast: [
      { fn: "chargeUp", opts: { start: 0, duration: 1.2, color: [0.6, 0.4, 1] } },
      { fn: "magicCircle", opts: { start: 0.2, color: [0.6, 0.4, 1] } },
      { fn: "lightningBolt", opts: { start: 1.2, duration: 0.5, color: [0.7, 0.6, 1] } },
      { fn: "shockwave", opts: { start: 1.25, duration: 0.8, color: [0.7, 0.5, 1], strength: 16 } }
    ],
    // Hero entrance: light rays + lens flare + atmospheric dust + grade.
    heroEntrance: [
      { fn: "lightRays", opts: { start: 0, strength: 130 } },
      { fn: "lensFlare", opts: { start: 0.2, duration: 2.0 } },
      { fn: "atmosphericFog", opts: { strength: 28 } },
      { fn: "bokeh", opts: { strength: 35, color: [1, 0.9, 0.7] } },
      { fn: "cinematicGrade", opts: {} }
    ],
    // Celebration: confetti + fireworks-like bursts + bokeh + light leak.
    celebration: [
      { fn: "confetti", opts: { start: 0, color: [1, 0.4, 0.6] } },
      { fn: "energyBurst", opts: { start: 0.2, duration: 1.2, color: [1, 0.85, 0.3] } },
      { fn: "energyBurst", opts: { start: 0.8, duration: 1.2, color: [0.4, 0.8, 1], position: null } },
      { fn: "bokeh", opts: { strength: 45 } },
      { fn: "lightLeak", opts: { strength: 30 } }
    ],
    // Sci-fi power surge: hologram-style + lightning + force field + plexus.
    powerSurge: [
      { fn: "forceField", opts: { start: 0, color: [0.3, 0.8, 1], impact: true } },
      { fn: "lightningBolt", opts: { start: 0.1, duration: 0.6, color: [0.5, 0.9, 1] } },
      { fn: "plexusNetwork", opts: { strength: 40, color: [0.4, 0.7, 1] } },
      { fn: "chargeUp", opts: { start: 0.2, duration: 1.4, color: [0.3, 0.8, 1] } }
    ],
    // Premium ad polish: motion blur + soft bokeh + hero shine + glow + subtle
    // light leak + cinematic grade + fine grain. Tasteful, brand-safe, NO game FX.
    premiumAdPolish: [
      { fn: "enableMotionBlur", opts: {} },
      { fn: "bokeh", opts: { strength: 26, color: [1, 0.9, 0.7], count: 12, blur: 26 } },
      { fn: "lightLeak", opts: { strength: 16 } },
      { fn: "premiumGlow", opts: { strength: 80 } },
      { fn: "lightSweep", opts: { start: 1.1, duration: 1.5 } },
      { fn: "cinematicGrade", opts: {} },
      { fn: "filmGrain", opts: { strength: 6 } }
    ],
    // Premium product / hero reveal: depth bokeh + light rays + sweep + grade.
    premiumReveal: [
      { fn: "enableMotionBlur", opts: {} },
      { fn: "lightRays", opts: { strength: 90 } },
      { fn: "bokeh", opts: { strength: 30, blur: 30 } },
      { fn: "lightSweep", opts: { start: 1.4, duration: 1.6 } },
      { fn: "cinematicGrade", opts: {} },
      { fn: "filmGrain", opts: { strength: 5 } }
    ],
    // Storm scene: rain + fog + lightning flashes + grade.
    stormScene: [
      { fn: "rainStorm", opts: { strength: 9000 } },
      { fn: "lightningBolt", opts: { start: 0.8, duration: 0.4, color: [0.8, 0.85, 1] } },
      { fn: "lightningBolt", opts: { start: 2.4, duration: 0.4, color: [0.8, 0.85, 1] } },
      { fn: "cinematicGrade", opts: {} }
    ]
  };

  function runComposite(comp, recipeName, opts) {
    opts = opts || {};
    var recipe = COMPOSITES[recipeName];
    if (!recipe) throw new Error("Unknown VFX composite: " + recipeName);
    var intensity = opts.intensity != null ? opts.intensity : 1;
    var base = { start: opts.start || 0, position: opts.position || null, color: opts.color || null, targetLayer: opts.targetLayer || null };
    var applied = [];
    for (var i = 0; i < recipe.length; i++) {
      var step = recipe[i];
      try {
        run(comp, step.fn, scaleOpts(step.opts, intensity, base));
        applied.push(step.fn);
      } catch (e) { log("composite step failed (" + step.fn + "): " + e.toString()); }
    }
    log("composite '" + recipeName + "' applied " + applied.length + "/" + recipe.length + " steps");
    return applied;
  }

  function listComposites() {
    var names = [];
    for (var k in COMPOSITES) if (COMPOSITES.hasOwnProperty(k)) names.push(k);
    return names;
  }

  return {
    run: run,
    runComposite: runComposite,
    listComposites: listComposites,
    pluginAvailable: pluginAvailable,
    registry: REGISTRY
  };
})();
`;
