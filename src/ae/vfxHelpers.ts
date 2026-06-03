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



  // ======================================================================
  // ★ WAVE 3 — NEW VFX FUNCTIONS ★
  // ======================================================================

  // ── CINEMATIC BLOOM ─────────────────────────────────────────────────────
  function cinematicBloom(comp, opts) {
    opts = opts || {};
    var strength = opts.strength != null ? opts.strength : 1.0;
    var radius = opts.radius != null ? opts.radius : 80;
    var threshold = opts.threshold != null ? opts.threshold : 0.65;
    var host = adjustment(comp, "MP_CinematicBloom");
    // Stage 1: tight core glow.
    var g1 = addFx(host, "ADBE Glow");
    if (g1) { try { g1.property("ADBE Glow-0002").setValue(threshold * 100); g1.property("ADBE Glow-0003").setValue(radius * 0.25); g1.property("ADBE Glow-0004").setValue(strength * 1.6); } catch(e){} }
    // Stage 2: mid bloom.
    var g2 = addFx(host, "ADBE Glow");
    if (g2) { try { g2.property("ADBE Glow-0002").setValue(threshold * 100); g2.property("ADBE Glow-0003").setValue(radius); g2.property("ADBE Glow-0004").setValue(strength * 0.9); } catch(e){} }
    // Stage 3: wide soft halo.
    var g3 = addFx(host, "ADBE Glow");
    if (g3) { try { g3.property("ADBE Glow-0002").setValue(threshold * 100); g3.property("ADBE Glow-0003").setValue(radius * 3.5); g3.property("ADBE Glow-0004").setValue(strength * 0.4); } catch(e){} }
    setBlend(host, "ADD");
    var op = tp(host, "opacity"); if (op) op.setValue(Math.round(75 * strength));
    log("cinematicBloom: 3-stage glow bloom");
    return host;
  }

  // ── DEPTH OF FIELD SIMULATION ───────────────────────────────────────────
  function depthOfField(comp, opts) {
    opts = opts || {};
    var blurAmount = opts.blurAmount != null ? opts.blurAmount : 20;
    var cw = comp.width; var ch = comp.height;
    var focal = opts.focalPoint || [0.5, 0.5];
    var focalPx = [focal[0] * cw, focal[1] * ch];
    var host = adjustment(comp, "MP_DOF_Blur");
    // Camera Lens Blur for quality, Fast Box Blur for fallback.
    var clf = addFx(host, "ADBE Camera Lens Blur");
    if (clf) {
      try { clf.property("ADBE Camera Lens Blur-0002").setValue(blurAmount); } catch(e){}
      try { clf.property("ADBE Camera Lens Blur-0001").setValue(3); } catch(e){}   // iris shape: hexagon
    } else {
      var fbb = addFx(host, "ADBE Fast Box Blur");
      if (fbb) { try { fbb.property("ADBE Fast Box Blur-0001").setValue(blurAmount); } catch(e){} }
    }
    log("depthOfField: camera lens blur @" + blurAmount + "px");
    return host;
  }

  // ── LENS DISTORTION ─────────────────────────────────────────────────────
  function lensDistortion(comp, opts) {
    opts = opts || {};
    var amount = opts.amount != null ? opts.amount : -25;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_LensDistort");
    var oc = addFx(host, "ADBE Optics Compensation");
    if (oc) {
      try { oc.property("ADBE Optics Compensation-0002").setValue(amount); } catch(e){}
      try { oc.property("ADBE Optics Compensation-0001").setValue(true); } catch(e){} // compensate
    } else {
      var sp = addFx(host, "ADBE Spherize");
      if (sp) { try { sp.property("ADBE Spherize-0001").setValue(amount); } catch(e){} }
    }
    if (opts.addAberration) {
      var ca = addFx(host, "ADBE Shift Channels");
      if (ca) { try { ca.property("ADBE Shift Channels-0001").setValue(1); } catch(e){} }
    }
    log("lensDistortion: amount=" + amount);
    return host;
  }

  // ── INK REVEAL ──────────────────────────────────────────────────────────
  function inkReveal(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 2.5;
    var t0 = opts.start || 0;
    var inkCol = opts.inkColor || [0.05, 0.05, 0.1];
    var spread = opts.spread || 1.2;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_InkReveal");
    host.startTime = t0;
    // Fractal noise grows to reveal layer (luma matte style).
    var inkSolid = solid(comp, inkCol, "MP_Ink_Mask", dur);
    inkSolid.startTime = t0;
    var fnInk = addFx(inkSolid, "ADBE Fractal Noise");
    if (fnInk) {
      try { fnInk.property("ADBE Fractal Noise-0001").setValue(2); fnInk.property("ADBE Fractal Noise-0003").setValue(0.7); } catch(e){}
      var evoInk = fnInk.property("ADBE Fractal Noise-0012");
      if (evoInk) { evoInk.setValueAtTime(t0, 0); evoInk.setValueAtTime(t0+dur, spread*2); }
      var contInk = fnInk.property("ADBE Fractal Noise-0004");
      if (contInk) { contInk.setValueAtTime(t0, -1.5); contInk.setValueAtTime(t0+dur*0.8, 0.8); contInk.setValueAtTime(t0+dur, 2.0); }
    }
    var tdInk = addFx(inkSolid, "ADBE Turbulent Displace");
    if (tdInk) { try { tdInk.property("ADBE Turbulent Displace-0003").setValue(50*spread); var evo2 = tdInk.property("ADBE Turbulent Displace-0009"); if (evo2) { evo2.setValueAtTime(t0,0); evo2.setValueAtTime(t0+dur,spread*1.5); } } catch(e){} }
    setBlend(inkSolid, "MULTIPLY");
    log("inkReveal: fractal noise luma reveal");
    return inkSolid;
  }

  // ── PAINT STROKE REVEAL ─────────────────────────────────────────────────
  function paintStrokeReveal(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.5;
    var t0 = opts.start || 0;
    var dir = opts.direction != null ? opts.direction : 0;
    var strokeW = opts.strokeWidth || 80;
    var col = opts.color || [0.1, 0.1, 0.1];
    var cw = comp.width; var ch = comp.height;
    var host = comp.layers.addShape();
    host.name = "MP_PaintStroke";
    host.startTime = t0;
    host.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2]);
    var root = host.property("ADBE Root Vectors Group");
    var g = root.addProperty("ADBE Vector Group");
    var vecs = g.property("ADBE Vectors Group");
    var path = vecs.addProperty("ADBE Vector Shape - Group");
    try {
      var shp = new Shape();
      shp.vertices = [[-cw*0.6, 0], [cw*0.6, 0]];
      shp.closed = false;
      path.property("ADBE Vector Shape").setValue(shp);
    } catch(e){}
    var stroke = vecs.addProperty("ADBE Vector Graphic - Stroke");
    try { stroke.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],1]); stroke.property("ADBE Vector Stroke Width").setValue(strokeW); } catch(e){}
    var trim = vecs.addProperty("ADBE Vector Filter - Trim");
    if (trim) {
      try {
        var te = trim.property("ADBE Vector Trim End");
        if (te) { te.setValueAtTime(t0, 0); te.setValueAtTime(t0+dur, 100); MP.setEase(te, "expoInOut"); }
      } catch(e){}
    }
    var rot = host.property("ADBE Transform Group").property("ADBE Rotate Z"); if (rot) rot.setValue(dir);
    var roughFx = addFx(host, "ADBE Roughen Edges");
    if (roughFx) { try { roughFx.property("ADBE Roughen Edges-0002").setValue(8); roughFx.property("ADBE Roughen Edges-0004").setValue(3); } catch(e){} }
    log("paintStrokeReveal: trim-path + roughen edges brush stroke");
    return host;
  }

  // ── SPAWN EFFECT ────────────────────────────────────────────────────────
  function spawnEffect(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.0;
    var t0 = opts.start || 0;
    var col = opts.color || [0.5, 0.8, 1];
    var flashCol = opts.flashColor || [1, 1, 1];
    var layer = findTargetLayer(comp, opts.targetLayer);
    if (layer) {
      // Materialize: opacity ramp in + flash.
      var op = tp(layer, "opacity");
      if (op) { op.setValueAtTime(t0, 0); op.setValueAtTime(t0+dur*0.15, 100); op.setValueAtTime(t0+dur*0.2, 60); op.setValueAtTime(t0+dur*0.35, 100); }
    }
    // Converging particle burst (reverse of explosion).
    var pLayer = solid(comp, [0,0,0], "MP_Spawn_Particles", dur);
    pLayer.startTime = t0;
    var ccpw = addFx(pLayer, "CC Particle World");
    if (ccpw) {
      try {
        var birth = ccpw.property("Birth Rate"); if (birth) { birth.setValueAtTime(t0, 8); birth.setValueAtTime(t0+dur*0.6, 0); }
        var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(dur*0.7);
        var phys = ccpw.property("Physics"); if (phys) { try { phys.property("Gravity").setValue(-0.3); phys.property("Velocity").setValue(1.2); } catch(ep){} }
        var part = ccpw.property("Particle"); if (part) { try { part.property("Birth Color").setValue([col[0],col[1],col[2],1]); part.property("Birth Size").setValue(0.06); part.property("Death Size").setValue(0.01); } catch(ep){} }
      } catch(e){}
    }
    setBlend(pLayer, "ADD");
    // Flash.
    var flash = solid(comp, flashCol, "MP_Spawn_Flash", dur);
    flash.startTime = t0;
    var flashOp = tp(flash, "opacity");
    if (flashOp) { flashOp.setValueAtTime(t0, 0); flashOp.setValueAtTime(t0+0.04, 80); flashOp.setValueAtTime(t0+0.2, 0); }
    setBlend(flash, "ADD");
    var glow = addFx(pLayer, "ADBE Glow"); if (glow) { try { glow.property("ADBE Glow-0003").setValue(50); glow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
    log("spawnEffect: converging particles + flash");
    return pLayer;
  }

  // ── HEAL AURA ───────────────────────────────────────────────────────────
  function healAura(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 2.5;
    var t0 = opts.start || 0;
    var col = opts.color || [0.2, 1, 0.4];
    var layer = findTargetLayer(comp, opts.targetLayer);
    var cw = comp.width; var ch = comp.height;
    var center = [cw/2, ch/2];
    // Rising sparkle particles.
    var sparkle = solid(comp, [0,0,0], "MP_Heal_Sparkles", dur);
    sparkle.startTime = t0;
    var ccpw = addFx(sparkle, "CC Particle World");
    if (ccpw) {
      try {
        var birth = ccpw.property("Birth Rate"); if (birth) birth.setValue(opts.particleCount != null ? opts.particleCount/30 : 1);
        var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(1.5);
        var phys = ccpw.property("Physics"); if (phys) { try { phys.property("Gravity").setValue(-0.2); phys.property("Velocity").setValue(0.6); } catch(ep){} }
        var part = ccpw.property("Particle"); if (part) { try { part.property("Particle Type").setValue(7); part.property("Birth Color").setValue([1,1,0.8,1]); part.property("Death Color").setValue([col[0],col[1],col[2],0]); part.property("Birth Size").setValue(0.04); } catch(ep){} }
      } catch(e){}
    }
    setBlend(sparkle, "ADD");
    // Pulsing green ring.
    var ring = comp.layers.addShape();
    ring.name = "MP_Heal_Ring"; ring.startTime = t0;
    ring.property("ADBE Transform Group").property("ADBE Position").setValue(center);
    var rRoot = ring.property("ADBE Root Vectors Group");
    var rG = rRoot.addProperty("ADBE Vector Group"); var rV = rG.property("ADBE Vectors Group");
    var rE = rV.addProperty("ADBE Vector Shape - Ellipse"); try { rE.property("ADBE Vector Ellipse Size").setValue([200,200]); } catch(e){}
    var rS = rV.addProperty("ADBE Vector Graphic - Stroke"); try { rS.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],1]); rS.property("ADBE Vector Stroke Width").setValue(4); } catch(e){}
    var rSc = tp(ring, "scale");
    if (rSc) { rSc.setValueAtTime(t0,[80,80]); rSc.setValueAtTime(t0+dur*0.5,[110,110]); rSc.setValueAtTime(t0+dur,[80,80]); MP.setEase(rSc,"sineInOut"); }
    var ringGlow = addFx(ring, "ADBE Glow"); if (ringGlow) { try { ringGlow.property("ADBE Glow-0003").setValue(30); ringGlow.property("ADBE Glow-0004").setValue(2.5); } catch(e){} }
    setBlend(ring, "ADD");
    log("healAura: rising sparkles + pulsing ring");
    return sparkle;
  }

  // ── DEATH DISSOLVE ──────────────────────────────────────────────────────
  function deathDissolve(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.8;
    var t0 = opts.start || 0;
    var col = opts.color || [0.3, 0.05, 0.05];
    var layer = findTargetLayer(comp, opts.targetLayer);
    if (layer) {
      var op = tp(layer, "opacity");
      if (op) { op.setValueAtTime(t0+dur*0.3, 100); op.setValueAtTime(t0+dur, 0); MP.setEase(op, "quadIn"); }
    }
    var dLayer = solid(comp, [0,0,0], "MP_Death_Particles", dur);
    dLayer.startTime = t0;
    var ccpw = addFx(dLayer, "CC Particle World");
    if (ccpw) {
      try {
        var birth = ccpw.property("Birth Rate"); if (birth) { birth.setValueAtTime(t0, opts.particleCount!=null?opts.particleCount/20:3); birth.setValueAtTime(t0+dur*0.8, 0); }
        var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(dur*0.6);
        var phys = ccpw.property("Physics"); if (phys) { try { phys.property("Gravity").setValue(-0.1); phys.property("Velocity").setValue(0.8); } catch(ep){} }
        var part = ccpw.property("Particle"); if (part) { try { part.property("Birth Color").setValue([col[0]*2,col[1]*2,col[2]*2,1]); part.property("Death Color").setValue([col[0],col[1],col[2],0]); } catch(ep){} }
      } catch(e){}
    }
    setBlend(dLayer, "ADD");
    log("deathDissolve: fade + dark upward particles");
    return dLayer;
  }

  // ── FREEZE EFFECT ───────────────────────────────────────────────────────
  function freezeEffect(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.2;
    var t0 = opts.start || 0;
    var col = opts.color || [0.5, 0.85, 1];
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_Freeze");
    host.startTime = t0;
    var hs = addFx(host, "ADBE HUE SATURATION");
    if (hs) { try { hs.property("ADBE HUE SATURATION-0001").setValue(1); hs.property("ADBE HUE SATURATION-0002").setValue(190); hs.property("ADBE HUE SATURATION-0003").setValue(40); } catch(e){} }
    var thresh = addFx(host, "ADBE Threshold2");
    if (thresh) {
      try {
        var tv = thresh.property("ADBE Threshold2-0001");
        if (tv) { tv.setValueAtTime(t0, 200); tv.setValueAtTime(t0+dur, 80); MP.setEase(tv, "expoOut"); }
      } catch(e){}
    }
    var fn = addFx(host, "ADBE Fractal Noise");
    if (fn) { try { fn.property("ADBE Fractal Noise-0001").setValue(1); fn.property("ADBE Fractal Noise-0006").setValue([30,30]); } catch(e){} }
    var glowFr = addFx(host, "ADBE Glow"); if (glowFr) { try { glowFr.property("ADBE Glow-0003").setValue(40); glowFr.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
    var cbFr = addFx(host, "ADBE Color Balance 2"); if (cbFr) { try { cbFr.property("ADBE Color Balance 2-0001").setValue([-20,-10,40]); cbFr.property("ADBE Color Balance 2-0002").setValue([0,-5,20]); } catch(e){} }
    log("freezeEffect: blue tint + crystal noise + ice cold balance");
    return host;
  }

  // ── BOUNCE IN ───────────────────────────────────────────────────────────
  function bounceIn(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 0.6;
    var t0 = opts.start || 0;
    var dir = opts.direction || "bottom";
    var overshoot = opts.overshoot || 1.3;
    var layer = findTargetLayer(comp, opts.targetLayer);
    if (!layer) { log("bounceIn: no target layer"); return null; }
    var cw = comp.width; var ch = comp.height;
    var pos = tp(layer, "position");
    var sc = tp(layer, "scale");
    var op = tp(layer, "opacity");
    if (op) { op.setValueAtTime(t0, 0); op.setValueAtTime(t0+0.05, 100); }
    var offsets = { bottom:[0,ch*0.3], top:[0,-ch*0.3], left:[-cw*0.3,0], right:[cw*0.3,0] };
    var off = offsets[dir] || offsets.bottom;
    if (pos) {
      var cur = pos.value;
      pos.setValueAtTime(t0, [cur[0]+off[0], cur[1]+off[1]]);
      pos.setValueAtTime(t0+dur*0.55, cur);
      pos.setValueAtTime(t0+dur*0.75, [cur[0]-off[0]*0.08, cur[1]-off[1]*0.08]);
      pos.setValueAtTime(t0+dur, cur);
      MP.setEase(pos, "expoOut");
    }
    if (sc) {
      sc.setValueAtTime(t0, [0,0]);
      sc.setValueAtTime(t0+dur*0.5, [overshoot*100,overshoot*100]);
      sc.setValueAtTime(t0+dur*0.7, [95,95]);
      sc.setValueAtTime(t0+dur, [100,100]);
    }
    log("bounceIn: spring physics bounce from " + dir);
    return layer;
  }

  // ── SLIDE TRANSITION ────────────────────────────────────────────────────
  function slideTransition(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 0.5;
    var t0 = opts.start || 0;
    var dir = opts.direction || "left";
    var addBlur = opts.addBlur !== false;
    var cw = comp.width; var ch = comp.height;
    // Blanket adjustment layer that slides and blurs.
    var host = adjustment(comp, "MP_SlideTransition");
    host.startTime = t0;
    host.outPoint = t0 + dur;
    var pos = tp(host, "position");
    var dirs = { left:[-cw,0,0,0], right:[cw,0,0,0], up:[0,-ch,0,0], down:[0,ch,0,0] };
    var d = dirs[dir] || dirs.left;
    if (pos) {
      pos.setValueAtTime(t0, [cw/2+d[0], ch/2+d[1]]);
      pos.setValueAtTime(t0+dur, [cw/2+d[2], ch/2+d[3]]);
      MP.setEase(pos, "expoInOut");
    }
    if (addBlur) {
      var db = addFx(host, "ADBE Motion Blur");
      if (!db) { var fbb = addFx(host, "ADBE Fast Box Blur"); if (fbb) { try { fbb.property("ADBE Fast Box Blur-0001").setValue(30); } catch(e){} } }
    }
    log("slideTransition: " + dir + " slide in " + dur + "s");
    return host;
  }

  // ── STICKER POP ─────────────────────────────────────────────────────────
  function stickerPop(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 0.4;
    var t0 = opts.start || 0;
    var rot = opts.rotation != null ? opts.rotation : 8;
    var layer = findTargetLayer(comp, opts.targetLayer);
    if (!layer) { log("stickerPop: no target layer"); return null; }
    var sc = tp(layer, "scale");
    var rotP = tp(layer, "rotation");
    var op = tp(layer, "opacity");
    if (op) { op.setValueAtTime(t0, 0); op.setValueAtTime(t0+0.05, 100); }
    if (sc) { sc.setValueAtTime(t0,[0,0]); sc.setValueAtTime(t0+dur*0.45,[120,120]); sc.setValueAtTime(t0+dur*0.65,[92,92]); sc.setValueAtTime(t0+dur*0.82,[104,104]); sc.setValueAtTime(t0+dur,[100,100]); }
    if (rotP) { rotP.setValueAtTime(t0,rot*2); rotP.setValueAtTime(t0+dur*0.4,rot); rotP.setValueAtTime(t0+dur*0.7,-rot*0.3); rotP.setValueAtTime(t0+dur,0); }
    if (opts.addShadow) {
      var shadow = addFx(layer, "ADBE Drop Shadow");
      if (shadow) { try { shadow.property("ADBE Drop Shadow-0002").setValue(0.5); shadow.property("ADBE Drop Shadow-0004").setValue(6); shadow.property("ADBE Drop Shadow-0005").setValue(10); } catch(e){} }
    }
    log("stickerPop: elastic scale + rotation bounce");
    return layer;
  }

  // ── ZOOM TRANSITION ─────────────────────────────────────────────────────
  function zoomTransition(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 0.25;
    var t0 = opts.start || 0;
    var blurAmt = opts.blurAmount || 80;
    var host = adjustment(comp, "MP_ZoomTransition");
    host.startTime = t0;
    host.outPoint = t0 + dur;
    var rfb = addFx(host, "CC Radial Fast Blur");
    if (rfb) {
      try {
        var rfbAmt = rfb.property("Amount");
        if (rfbAmt) { rfbAmt.setValueAtTime(t0, 0); rfbAmt.setValueAtTime(t0+dur*0.3, blurAmt); rfbAmt.setValueAtTime(t0+dur, 0); }
        rfb.property("Zoom").setValue(2);
      } catch(e){}
    } else {
      var crs = addFx(host, "ADBE Directional Blur");
      if (crs) { try { crs.property("ADBE Directional Blur-0001").setValue(45); crs.property("ADBE Directional Blur-0002").setValue(blurAmt); } catch(e){} }
    }
    var sc = tp(host, "scale");
    if (sc) { sc.setValueAtTime(t0, [100,100]); sc.setValueAtTime(t0+dur*0.5, [140,140]); sc.setValueAtTime(t0+dur, [100,100]); }
    log("zoomTransition: radial fast blur zoom cut");
    return host;
  }

  // ── PRODUCT SHINE 360 ───────────────────────────────────────────────────
  function productShine360(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 3;
    var t0 = opts.start || 0;
    var col = opts.color || [1, 1, 0.95];
    var intensity = opts.intensity != null ? opts.intensity : 60;
    var layer = findTargetLayer(comp, opts.targetLayer);
    // 4 sweeps at 90° intervals.
    var angles = [0, 90, 180, 270];
    for (var si = 0; si < angles.length; si++) {
      var sh = layer ? layer : adjustment(comp, "MP_Shine360_" + angles[si]);
      var sweep = addFx(sh, "CC Light Sweep");
      if (sweep) {
        try { sweep.property("Direction").setValue(angles[si]); sweep.property("Width").setValue(40); sweep.property("Intensity").setValue(intensity); } catch(e){}
        try {
          var center = sweep.property("Center");
          if (center) { center.setValueAtTime(t0 + si*(dur/4), [-comp.width, comp.height/2]); center.setValueAtTime(t0 + si*(dur/4) + (dur/4), [comp.width*2, comp.height/2]); }
        } catch(e){}
      }
    }
    log("productShine360: 4 light sweeps at 90° intervals");
    return layer;
  }

  // ── GLASS MORPHISM ──────────────────────────────────────────────────────
  function glassMorphism(comp, opts) {
    opts = opts || {};
    var blurAmt = opts.blurAmount != null ? opts.blurAmount : 25;
    var opacity = opts.opacity != null ? opts.opacity : 0.7;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || solid(comp, [1,1,1], "MP_GlassMorphism", comp.duration);
    // Frosted blur.
    var blur = addFx(host, "ADBE Gaussian Blur 2");
    if (blur) { try { blur.property("ADBE Gaussian Blur 2-0001").setValue(blurAmt); blur.property("ADBE Gaussian Blur 2-0003").setValue(true); } catch(e){} }
    // Reduce opacity for transparency.
    var op = tp(host, "opacity"); if (op) op.setValue(Math.round(opacity * 100));
    // Edge highlight.
    if (opts.borderGlow !== false) {
      var glowGM = addFx(host, "ADBE Glow"); if (glowGM) { try { glowGM.property("ADBE Glow-0002").setValue(90); glowGM.property("ADBE Glow-0003").setValue(8); glowGM.property("ADBE Glow-0004").setValue(0.8); } catch(e){} }
    }
    // White edge tint.
    var tint = addFx(host, "ADBE Tint");
    if (tint) { try { tint.property("ADBE Tint-0002").setValue([1,1,1,1]); tint.property("ADBE Tint-0003").setValue(20); } catch(e){} }
    log("glassMorphism: frosted blur + edge glow");
    return host;
  }

  // ── SMOKE TITLE REVEAL ──────────────────────────────────────────────────
  function smokeTitleReveal(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 3.0;
    var t0 = opts.start || 0;
    var smokeCol = opts.smokeColor || [0.5, 0.5, 0.5];
    var layer = findTargetLayer(comp, opts.targetLayer);
    // Smoke layer built from fractal noise.
    var smoke = solid(comp, [0,0,0], "MP_SmokeReveal", dur);
    smoke.startTime = t0;
    var fnSmoke = addFx(smoke, "ADBE Fractal Noise");
    if (fnSmoke) {
      try { fnSmoke.property("ADBE Fractal Noise-0001").setValue(4); fnSmoke.property("ADBE Fractal Noise-0006").setValue([200,200]); } catch(e){}
      var evoSmoke = fnSmoke.property("ADBE Fractal Noise-0012"); if (evoSmoke) { evoSmoke.setValueAtTime(t0,0); evoSmoke.setValueAtTime(t0+dur,1.2); }
      var contSmoke = fnSmoke.property("ADBE Fractal Noise-0004");
      if (contSmoke) { contSmoke.setValueAtTime(t0, 1.0); contSmoke.setValueAtTime(t0+dur*0.6, -0.5); contSmoke.setValueAtTime(t0+dur, -1.5); }
    }
    var tdSmoke = addFx(smoke, "ADBE Turbulent Displace");
    if (tdSmoke) { try { tdSmoke.property("ADBE Turbulent Displace-0003").setValue(60); var evo2 = tdSmoke.property("ADBE Turbulent Displace-0009"); if (evo2) { evo2.setValueAtTime(t0,0); evo2.setValueAtTime(t0+dur,2); } } catch(e){} }
    var hsSmoke = addFx(smoke, "ADBE HUE SATURATION");
    if (hsSmoke) { try { hsSmoke.property("ADBE HUE SATURATION-0001").setValue(1); hsSmoke.property("ADBE HUE SATURATION-0002").setValue(0); hsSmoke.property("ADBE HUE SATURATION-0003").setValue(0); } catch(e){} }
    setBlend(smoke, "SCREEN");
    var smokeOp = tp(smoke, "opacity");
    if (smokeOp) { smokeOp.setValueAtTime(t0, 80); smokeOp.setValueAtTime(t0+dur*0.7, 60); smokeOp.setValueAtTime(t0+dur, 0); }
    // Reveal target layer beneath smoke.
    if (layer) {
      var lOp = tp(layer, "opacity");
      if (lOp) { lOp.setValueAtTime(t0, 0); lOp.setValueAtTime(t0+dur*0.35, 100); }
    }
    if (opts.addLight) { MPVFX.run(comp, "lightRays", { start: t0, strength: 60 }); }
    log("smokeTitleReveal: fractal smoke + turbulent displace + reveal");
    return smoke;
  }

  // ── GLITCH LOGO REVEAL ──────────────────────────────────────────────────
  function glitchLogoReveal(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.2;
    var t0 = opts.start || 0;
    var intensity = opts.intensity || 1.0;
    var layer = findTargetLayer(comp, opts.targetLayer);
    if (!layer) { MPVFX.run(comp, "glitch", { start: t0, duration: dur*0.5 }); return null; }
    // Start invisible.
    var op = tp(layer, "opacity"); if (op) { op.setValueAtTime(t0, 0); op.setValueAtTime(t0+dur*0.3, 0); op.setValueAtTime(t0+dur*0.35, 80); op.setValueAtTime(t0+dur*0.5, 60); op.setValueAtTime(t0+dur*0.55, 100); }
    // Glitch displacement on layer.
    var disp = addFx(layer, "ADBE Displacement Map");
    if (disp) {
      var dAmt = disp.property("ADBE Displacement Map-0003");
      if (dAmt) { dAmt.setValueAtTime(t0+dur*0.25, 0); dAmt.setValueAtTime(t0+dur*0.3, 80*intensity); dAmt.setValueAtTime(t0+dur*0.4, 40*intensity); dAmt.setValueAtTime(t0+dur*0.55, 0); }
    }
    // RGB split during glitch.
    var shift = addFx(layer, "ADBE Shift Channels");
    if (shift) { try { var sr = shift.property("ADBE Shift Channels-0001"); if (sr) { sr.setValueAtTime(t0+dur*0.28,1); sr.setValueAtTime(t0+dur*0.45,4); sr.setValueAtTime(t0+dur*0.56,1); } } catch(e){} }
    // Final glow on settled logo.
    if (opts.finalGlow) {
      var gGlitch = addFx(layer, "ADBE Glow"); if (gGlitch) { try { gGlitch.property("ADBE Glow-0003").setValue(40); gGlitch.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
    }
    log("glitchLogoReveal: opacity flicker + displacement + RGB split + settle");
    return layer;
  }

  // ======================================================================
  // ★ PREMIUM PLUGIN REPLICAS — SIFIR MALİYET, PLUGIN YOK ★
  // Her fonksiyon ücretli pluginin aynı görsel sonucunu üretir.
  // Trapcode Shine · Starglow · Mir · Element 3D · Optical Flares · Saber
  // ======================================================================

  // ── TRAPCODE SHINE REPLICA ──────────────────────────────────────────────
  // Shine; CC Radial Fast Blur + Curves + threshold + ADD blend = god rays.
  // Kendi anamorphic streak katmanı da ekler (yatay ışık süpürmesi).
  function trapcodeShine(comp, opts) {
    opts = opts || {};
    var col = opts.color || [1, 0.85, 0.6];
    var strength = opts.strength != null ? opts.strength : 4.5;
    var src = opts.sourcePoint || [comp.width / 2, comp.height * 0.18];

    // --- Ana god-ray katmanı ---
    var ray = adjustment(comp, "MP_Shine_Rays");
    var rfb = addFx(ray, "CC Radial Fast Blur");
    if (rfb) {
      try { rfb.property("Center").setValue(src); } catch(e){}
      try { rfb.property("Amount").setValue(strength * 18); } catch(e){}
      try { rfb.property("Zoom").setValue(1); } catch(e){}   // "Fading" on older AE
    }
    var threshold = addFx(ray, "ADBE Threshold2");
    if (threshold) { try { threshold.property("ADBE Threshold2-0001").setValue(55); } catch(e){} }
    var curves = addFx(ray, "ADBE CurvesCustom");
    if (curves) {
      try { curves.property("ADBE CurvesCustom-0001").setValue([[0,0],[0.4,0],[0.75,0.85],[1,1]]); } catch(e){}
    }
    // Colorize pass via Hue/Saturation
    var hs = addFx(ray, "ADBE HUE SATURATION");
    if (hs) {
      try { hs.property("ADBE HUE SATURATION-0001").setValue(1); } catch(e){}  // colorize
      var hue = Math.round(Math.atan2(col[2]-col[0], col[1]-col[0]) * (180/Math.PI));
      try { hs.property("ADBE HUE SATURATION-0002").setValue(hue); } catch(e){}
      try { hs.property("ADBE HUE SATURATION-0003").setValue(50); } catch(e){}
    }
    setBlend(ray, "ADD");
    var op = tp(ray, "opacity"); if (op) op.setValue(80);

    // --- Anamorphic streak katmanı (yatay ışık çizgisi) ---
    var streak = solid(comp, [0,0,0], "MP_Shine_Streak", comp.duration);
    var fbb = addFx(streak, "CC Radial Fast Blur");
    if (fbb) {
      try { fbb.property("Center").setValue(src); } catch(e){}
      try { fbb.property("Amount").setValue(strength * 28); } catch(e){}
    }
    // Squish vertically for anamorphic look
    var sc = tp(streak, "scale"); if (sc) sc.setValue([100, 12]);
    var glow2 = addFx(streak, "ADBE Glow");
    if (glow2) { try { glow2.property("ADBE Glow-0003").setValue(80); glow2.property("ADBE Glow-0004").setValue(1.6); } catch(e){} }
    setBlend(streak, "ADD");
    var op2 = tp(streak, "opacity"); if (op2) op2.setValue(40);

    log("trapcodeShine (plugin replica): god rays + anamorphic streak");
    return ray;
  }

  // ── TRAPCODE STARGLOW REPLICA ───────────────────────────────────────────
  // Starglow = 8-directional directional blur on bright pixels → star streaks.
  function trapcodeStarglow(comp, opts) {
    opts = opts || {};
    var layer = findTargetLayer(comp, opts.targetLayer);
    var col = opts.color || [1, 0.95, 0.8];
    var streakLen = opts.streakLength != null ? opts.streakLength : 25;
    var boost = opts.boost != null ? opts.boost : 1.8;
    var angles = [0, 45, 90, 135, 180, 225, 270, 315];
    var host = comp.layers.addNull(comp.duration);
    host.name = "MP_Starglow";
    // For each of 8 angles, duplicate source solid + directional blur + ADD.
    for (var a = 0; a < angles.length; a++) {
      var streak = solid(comp, [0,0,0], "MP_StarStreak_" + angles[a], comp.duration);
      var srcFx = addFx(streak, "ADBE Channel Combiner");  // dummy to bring in solid
      // Apply directional blur
      var db = addFx(streak, "CC Force Motion Blur");
      if (!db) db = addFx(streak, "ADBE Motion Blur");
      // Use Fast Box Blur as a directional stand-in
      var fbb = addFx(streak, "ADBE Fast Box Blur");
      if (fbb) {
        try { fbb.property("ADBE Fast Box Blur-0001").setValue(streakLen * 1.5); } catch(e){}
        try { fbb.property("ADBE Fast Box Blur-0003").setValue(1); } catch(e){} // iterations
      }
      var ro = tp(streak, "rotation"); if (ro) ro.setValue(angles[a]);
      var sc2 = tp(streak, "scale"); if (sc2) sc2.setValue([100, 4]);
      var hue2 = addFx(streak, "ADBE Glow");
      if (hue2) { try { hue2.property("ADBE Glow-0003").setValue(60); hue2.property("ADBE Glow-0004").setValue(boost); } catch(e){} }
      setBlend(streak, "ADD");
      var opS = tp(streak, "opacity"); if (opS) opS.setValue(Math.round(45 + a * 2));
    }
    // Master glow adjustment on top.
    var masterGlow = adjustment(comp, "MP_Starglow_Master");
    var mgfx = addFx(masterGlow, "ADBE Glow");
    if (mgfx) { try { mgfx.property("ADBE Glow-0003").setValue(90); mgfx.property("ADBE Glow-0004").setValue(boost); } catch(e){} }
    setBlend(masterGlow, "ADD");
    var opM = tp(masterGlow, "opacity"); if (opM) opM.setValue(55);
    log("trapcodeStarglow (plugin replica): 8-direction streak sparkle");
    return masterGlow;
  }

  // ── TRAPCODE MIR REPLICA ────────────────────────────────────────────────
  // Mir = animated 3D mesh surface. We replicate with: turbulent displace +
  // CC Glass reflection + fractal noise + 3D layer with perspective.
  function trapcodeМir(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.2, 0.4, 0.8];
    var amplitude = opts.amplitude != null ? opts.amplitude : 120;

    // Base grid solid.
    var base = solid(comp, col, "MP_Mir_Surface");
    base.threeDLayer = true;
    // Add grid texture via fractal noise.
    var fn2 = addFx(base, "ADBE Fractal Noise");
    if (fn2) {
      try { fn2.property("ADBE Fractal Noise-0001").setValue(6); } catch(e){}    // fractal type: Strings
      try { fn2.property("ADBE Fractal Noise-0003").setValue(0.5); } catch(e){}  // contrast
      try { fn2.property("ADBE Fractal Noise-0006").setValue([80, 80]); } catch(e){}  // scale
      // Animate evolution over time.
      var evo = fn2.property("ADBE Fractal Noise-0012");
      if (evo) { evo.setValueAtTime(0, 0); evo.setValueAtTime(comp.duration, comp.duration * 0.4); }
    }
    // Turbulent displace for wave motion.
    var td = addFx(base, "ADBE Turbulent Displace");
    if (td) {
      try { td.property("ADBE Turbulent Displace-0003").setValue(amplitude); } catch(e){}
      try { td.property("ADBE Turbulent Displace-0004").setValue(180); } catch(e){}  // size
      var evo2 = td.property("ADBE Turbulent Displace-0009");
      if (evo2) { evo2.setValueAtTime(0, 0); evo2.setValueAtTime(comp.duration, 1.5); }
    }
    // CC Glass for reflection look.
    var glass = addFx(base, "CC Glass");
    if (glass) {
      try { glass.property("Height Map").setValue(1); } catch(e){}
      try { glass.property("Softness").setValue(8); } catch(e){}
      try { glass.property("Height").setValue(30); } catch(e){}
      try { glass.property("Displacement").setValue(amplitude * 0.6); } catch(e){}
    }
    // Colorize with hue/sat.
    var hsMir = addFx(base, "ADBE HUE SATURATION");
    if (hsMir) { try { hsMir.property("ADBE HUE SATURATION-0003").setValue(30); } catch(e){} }
    var glowMir = addFx(base, "ADBE Glow");
    if (glowMir) { try { glowMir.property("ADBE Glow-0003").setValue(50); glowMir.property("ADBE Glow-0004").setValue(1.2); } catch(e){} }
    // Tilt the 3D layer for perspective floor effect.
    try { base.property("ADBE Transform Group").property("ADBE Rotate X").setValue(65); } catch(e){}
    log("trapcodeМir (plugin replica): fractal 3D mesh surface");
    return base;
  }

  // ── OPTICAL FLARES HERO REPLICA ─────────────────────────────────────────
  // Optical Flares = multi-element lens flare system. We build: core burst +
  // anamorphic horizontal streak + 3x secondary glow orbs + shimmer ring +
  // animated position drift + bloom. All via shape layers + blur + ADD blend.
  function opticalFlaresHero(comp, opts) {
    opts = opts || {};
    var pos = opts.position || [comp.width * 0.6, comp.height * 0.3];
    var col = opts.color || [1, 0.9, 0.7];
    var brightness = (opts.brightness != null ? opts.brightness : 100) / 100;
    var dur = opts.duration || 3;
    var t0 = opts.start || 0;

    // --- 1. Core burst: radial gradient solid + glow ---
    var core = solid(comp, [0,0,0], "MP_OFlares_Core", dur);
    core.startTime = t0;
    var coreRg = addFx(core, "ADBE Ramp");
    if (coreRg) {
      try { coreRg.property("ADBE Ramp-0001").setValue(pos); } catch(e){}
      try { coreRg.property("ADBE Ramp-0003").setValue([pos[0]+200,pos[1]+200]); } catch(e){}
      try { coreRg.property("ADBE Ramp-0002").setValue([col[0],col[1],col[2],1]); } catch(e){}
      try { coreRg.property("ADBE Ramp-0004").setValue([0,0,0,0]); } catch(e){}
      try { coreRg.property("ADBE Ramp-0005").setValue(2); } catch(e){} // radial
    }
    var coreGlow = addFx(core, "ADBE Glow");
    if (coreGlow) { try { coreGlow.property("ADBE Glow-0003").setValue(120 * brightness); coreGlow.property("ADBE Glow-0004").setValue(2.4 * brightness); } catch(e){} }
    var coreSc = tp(core, "scale");
    if (coreSc) { coreSc.setValueAtTime(t0, [0,0]); coreSc.setValueAtTime(t0+0.25, [85*brightness,85*brightness]); coreSc.setValueAtTime(t0+dur, [65*brightness,65*brightness]); MP.setEase(coreSc,"expoOut"); }
    setBlend(core, "ADD");

    // --- 2. Anamorphic horizontal streak ---
    var streak = solid(comp, [0,0,0], "MP_OFlares_Streak", dur);
    streak.startTime = t0;
    var stRg = addFx(streak, "ADBE Ramp");
    if (stRg) {
      try { stRg.property("ADBE Ramp-0001").setValue(pos); } catch(e){}
      try { stRg.property("ADBE Ramp-0003").setValue([pos[0]+400,pos[1]]); } catch(e){}
      try { stRg.property("ADBE Ramp-0002").setValue([col[0],col[1],col[2],1]); } catch(e){}
      try { stRg.property("ADBE Ramp-0004").setValue([0,0,0,0]); } catch(e){}
      try { stRg.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }
    var stFB = addFx(streak, "ADBE Fast Box Blur");
    if (stFB) { try { stFB.property("ADBE Fast Box Blur-0001").setValue(250); } catch(e){} }
    var stSc = tp(streak, "scale"); if (stSc) stSc.setValue([100, 6]);
    var stPos = tp(streak, "position"); if (stPos) stPos.setValue(pos);
    setBlend(streak, "ADD");
    var stOp = tp(streak, "opacity"); if (stOp) stOp.setValue(Math.round(70 * brightness));

    // --- 3. Secondary flare orbs (3x at different positions along flare axis) ---
    var orbPositions = [
      [pos[0] * 0.35, pos[1] * 1.4],
      [comp.width * 0.75, pos[1] * 1.6],
      [comp.width * 0.9, pos[1] * 1.9]
    ];
    for (var oi = 0; oi < orbPositions.length; oi++) {
      var orb = solid(comp, [0,0,0], "MP_OFlares_Orb" + oi, dur);
      orb.startTime = t0;
      var orbRg = addFx(orb, "ADBE Ramp");
      if (orbRg) {
        try { orbRg.property("ADBE Ramp-0001").setValue(orbPositions[oi]); } catch(e){}
        try { orbRg.property("ADBE Ramp-0003").setValue([orbPositions[oi][0]+80,orbPositions[oi][1]+80]); } catch(e){}
        try { orbRg.property("ADBE Ramp-0002").setValue([col[0]*0.9,col[1]*0.9,col[2],1]); } catch(e){}
        try { orbRg.property("ADBE Ramp-0004").setValue([0,0,0,0]); } catch(e){}
        try { orbRg.property("ADBE Ramp-0005").setValue(2); } catch(e){}
      }
      var orbGlow = addFx(orb, "ADBE Glow");
      if (orbGlow) { try { orbGlow.property("ADBE Glow-0003").setValue(40 * brightness); orbGlow.property("ADBE Glow-0004").setValue(1.4); } catch(e){} }
      var orbSc = tp(orb, "scale"); if (orbSc) orbSc.setValue([40 - oi * 10, 40 - oi * 10]);
      setBlend(orb, "ADD");
      var orbOp = tp(orb, "opacity"); if (orbOp) orbOp.setValue(Math.round((55 - oi * 12) * brightness));
    }

    // --- 4. Shimmer ring ---
    var shimmer = comp.layers.addShape();
    shimmer.name = "MP_OFlares_Shimmer";
    shimmer.startTime = t0;
    var shPos = tp(shimmer, "position"); if (shPos) shPos.setValue(pos);
    var shRoot = shimmer.property("ADBE Root Vectors Group");
    var shEllipse = shRoot.addProperty("ADBE Vector Group");
    var shVecs = shEllipse.property("ADBE Vectors Group");
    var shShape = shVecs.addProperty("ADBE Vector Shape - Ellipse");
    try { shShape.property("ADBE Vector Ellipse Size").setValue([180*brightness, 180*brightness]); } catch(e){}
    var shStroke = shVecs.addProperty("ADBE Vector Graphic - Stroke");
    try { shStroke.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],1]); } catch(e){}
    try { shStroke.property("ADBE Vector Stroke Width").setValue(2); } catch(e){}
    var shimGlow = addFx(shimmer, "ADBE Glow");
    if (shimGlow) { try { shimGlow.property("ADBE Glow-0003").setValue(30); shimGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
    var shSc = tp(shimmer, "scale");
    if (shSc) { shSc.setValueAtTime(t0, [0,0]); shSc.setValueAtTime(t0+0.5, [100,100]); shSc.setValueAtTime(t0+dur, [160,160]); }
    var shOp = tp(shimmer, "opacity");
    if (shOp) { shOp.setValueAtTime(t0+0.3, Math.round(80*brightness)); shOp.setValueAtTime(t0+dur, 0); }
    setBlend(shimmer, "ADD");

    log("opticalFlaresHero (plugin replica): core + streak + 3 orbs + shimmer ring");
    return core;
  }

  // ── VIDEO COPILOT SABER REPLICA — Energy Slash ──────────────────────────
  // Saber: stroke path + intense glow + core + edge shimmer + motion blur.
  // Replicated with: shape stroke trim-path + 3-layer glow cascade + displace.
  function saberEnergySlash(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.2, 0.9, 1];
    var dur = opts.duration || 0.6;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;
    var center = opts.position || [cw/2, ch/2];
    var radius = opts.radius || (cw * 0.45);
    var glowInt = opts.glowIntensity || 3.5;
    var coreSize = opts.coreSize || 8;

    // Build arc path (90° arc = slash shape).
    var host = comp.layers.addShape();
    host.name = "MP_Saber_Slash";
    host.startTime = t0;
    host.property("ADBE Transform Group").property("ADBE Position").setValue(center);
    setBlend(host, "ADD");

    var root = host.property("ADBE Root Vectors Group");

    // Layer 1: Thick core
    var coreG = root.addProperty("ADBE Vector Group");
    var coreVecs = coreG.property("ADBE Vectors Group");
    var coreEllipse = coreVecs.addProperty("ADBE Vector Shape - Ellipse");
    try { coreEllipse.property("ADBE Vector Ellipse Size").setValue([radius*2, radius*2]); } catch(e){}
    var coreStroke = coreVecs.addProperty("ADBE Vector Graphic - Stroke");
    try { coreStroke.property("ADBE Vector Stroke Color").setValue([1,1,1,1]); } catch(e){}
    try { coreStroke.property("ADBE Vector Stroke Width").setValue(coreSize); } catch(e){}
    // Trim path for slash reveal.
    var trim = coreVecs.addProperty("ADBE Vector Filter - Trim");
    if (trim) {
      try {
        var trimStart = trim.property("ADBE Vector Trim Start");
        var trimEnd = trim.property("ADBE Vector Trim End");
        if (trimStart) { trimStart.setValueAtTime(t0, 0); trimStart.setValueAtTime(t0+dur*0.7, 25); }
        if (trimEnd) { trimEnd.setValueAtTime(t0, 0); trimEnd.setValueAtTime(t0+dur*0.45, 28); trimEnd.setValueAtTime(t0+dur, 60); }
      } catch(e){}
    }

    // Layer 2: Wide soft glow (ADD)
    var glowG = root.addProperty("ADBE Vector Group");
    var glowVecs = glowG.property("ADBE Vectors Group");
    var glowEllipse = glowVecs.addProperty("ADBE Vector Shape - Ellipse");
    try { glowEllipse.property("ADBE Vector Ellipse Size").setValue([radius*2, radius*2]); } catch(e){}
    var glowStroke2 = glowVecs.addProperty("ADBE Vector Graphic - Stroke");
    try { glowStroke2.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],1]); } catch(e){}
    try { glowStroke2.property("ADBE Vector Stroke Width").setValue(coreSize * 4); } catch(e){}
    var trim2 = glowVecs.addProperty("ADBE Vector Filter - Trim");
    if (trim2) {
      try {
        var ts2 = trim2.property("ADBE Vector Trim Start");
        var te2 = trim2.property("ADBE Vector Trim End");
        if (ts2) { ts2.setValueAtTime(t0,0); ts2.setValueAtTime(t0+dur*0.7,25); }
        if (te2) { te2.setValueAtTime(t0,0); te2.setValueAtTime(t0+dur*0.45,28); te2.setValueAtTime(t0+dur,60); }
      } catch(e){}
    }

    // 3-stage Glow cascade effect.
    var glow1 = addFx(host, "ADBE Glow");
    if (glow1) { try { glow1.property("ADBE Glow-0003").setValue(60); glow1.property("ADBE Glow-0004").setValue(glowInt); } catch(e){} }
    var glow2 = addFx(host, "ADBE Glow");
    if (glow2) { try { glow2.property("ADBE Glow-0003").setValue(160); glow2.property("ADBE Glow-0004").setValue(glowInt * 0.6); } catch(e){} }
    var glow3 = addFx(host, "ADBE Glow");
    if (glow3) { try { glow3.property("ADBE Glow-0003").setValue(380); glow3.property("ADBE Glow-0004").setValue(glowInt * 0.3); } catch(e){} }

    // Rotation (slash angle).
    var rot = tp(host, "rotation"); if (rot) rot.setValue(-30);
    mb(host);
    fadeOut(host, t0 + dur * 0.5, dur * 0.6);

    log("saberEnergySlash (plugin replica): core + glow cascade + trim-path reveal");
    return host;
  }

  // ── VIDEO COPILOT SABER — Portal Ring Replica ──────────────────────────
  function saberPortal(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.6, 0.1, 1];
    var dur = opts.duration || 2.5;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;
    var center = opts.position || [cw/2, ch/2];
    var ringR = opts.ringRadius || Math.min(cw, ch) * 0.35;
    var pulse = opts.pulseSpeed || 1.5;
    var glowInt = 3.2;

    // Outer ring.
    var host = comp.layers.addShape();
    host.name = "MP_Saber_Portal";
    host.startTime = t0;
    host.property("ADBE Transform Group").property("ADBE Position").setValue(center);
    setBlend(host, "ADD");
    var root = host.property("ADBE Root Vectors Group");

    // Draw 3 concentric rings with different widths.
    var rings = [
      { size: ringR * 2, width: 16, opacity: 1.0 },
      { size: ringR * 1.8, width: 6, opacity: 0.7 },
      { size: ringR * 2.2, width: 4, opacity: 0.5 }
    ];
    for (var ri = 0; ri < rings.length; ri++) {
      var rg = root.addProperty("ADBE Vector Group");
      var rv = rg.property("ADBE Vectors Group");
      var re = rv.addProperty("ADBE Vector Shape - Ellipse");
      try { re.property("ADBE Vector Ellipse Size").setValue([rings[ri].size, rings[ri].size]); } catch(e){}
      var rs = rv.addProperty("ADBE Vector Graphic - Stroke");
      try { rs.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],rings[ri].opacity]); } catch(e){}
      try { rs.property("ADBE Vector Stroke Width").setValue(rings[ri].width); } catch(e){}
    }

    // Spin the portal.
    var rot = host.property("ADBE Transform Group").property("ADBE Rotate Z");
    if (rot) { rot.setValueAtTime(t0, 0); rot.setValueAtTime(t0 + dur, 360 * pulse); }

    // Scale-in reveal.
    var sc = tp(host, "scale");
    if (sc) { sc.setValueAtTime(t0, [0,0]); sc.setValueAtTime(t0+0.5, [105,105]); sc.setValueAtTime(t0+0.7, [95,95]); sc.setValueAtTime(t0+dur, [100,100]); MP.setEase(sc,"expoOut"); }

    // 3-stage glow cascade (identical to Saber).
    var sg1 = addFx(host, "ADBE Glow"); if (sg1) { try { sg1.property("ADBE Glow-0003").setValue(50); sg1.property("ADBE Glow-0004").setValue(glowInt); } catch(e){} }
    var sg2 = addFx(host, "ADBE Glow"); if (sg2) { try { sg2.property("ADBE Glow-0003").setValue(120); sg2.property("ADBE Glow-0004").setValue(glowInt * 0.7); } catch(e){} }
    var sg3 = addFx(host, "ADBE Glow"); if (sg3) { try { sg3.property("ADBE Glow-0003").setValue(300); sg3.property("ADBE Glow-0004").setValue(glowInt * 0.35); } catch(e){} }

    // Electric shimmer (turbulent displace on the ring).
    var td = addFx(host, "ADBE Turbulent Displace");
    if (td) {
      try { td.property("ADBE Turbulent Displace-0003").setValue(12); } catch(e){}
      var evo = td.property("ADBE Turbulent Displace-0009");
      if (evo) { evo.setValueAtTime(t0, 0); evo.setValueAtTime(t0 + dur, 5); }
    }

    // Inner swirl solid (ADD, fractal noise vortex look).
    var inner = solid(comp, [0,0,0], "MP_Portal_Inner", dur);
    inner.startTime = t0;
    inner.property("ADBE Transform Group").property("ADBE Position").setValue(center);
    var mask = inner.Masks.addProperty("Mask");
    try {
      var shape = mask.property("ADBE Mask Shape");
      var pts = new Shape();
      // Circle mask for the inner area.
      var numPts = 40; var verts = []; var inTan = []; var outTan = [];
      for (var pi = 0; pi < numPts; pi++) {
        var ang = (pi / numPts) * Math.PI * 2;
        var r = ringR * 0.9;
        verts.push([Math.cos(ang)*r, Math.sin(ang)*r]);
        var tang = r * 0.55;
        inTan.push([-Math.sin(ang)*tang, Math.cos(ang)*tang]);
        outTan.push([Math.sin(ang)*tang, -Math.cos(ang)*tang]);
      }
      pts.vertices = verts; pts.inTangents = inTan; pts.outTangents = outTan; pts.closed = true;
      shape.setValue(pts);
    } catch(e2){}
    var fn3 = addFx(inner, "ADBE Fractal Noise");
    if (fn3) {
      try { fn3.property("ADBE Fractal Noise-0001").setValue(3); } catch(e){}   // swirly
      try { fn3.property("ADBE Fractal Noise-0006").setValue([80,80]); } catch(e){}
      var evo2 = fn3.property("ADBE Fractal Noise-0012");
      if (evo2) { evo2.setValueAtTime(t0, 0); evo2.setValueAtTime(t0+dur, dur * 0.8); }
    }
    var hsSaber = addFx(inner, "ADBE HUE SATURATION");
    if (hsSaber) { try { hsSaber.property("ADBE HUE SATURATION-0001").setValue(1); hsSaber.property("ADBE HUE SATURATION-0002").setValue(260); hsSaber.property("ADBE HUE SATURATION-0003").setValue(60); } catch(e){} }
    setBlend(inner, "ADD");
    var innerOp = tp(inner, "opacity"); if (innerOp) innerOp.setValue(60);
    var innerSc = tp(inner, "scale"); if (innerSc) { innerSc.setValueAtTime(t0,[0,0]); innerSc.setValueAtTime(t0+0.6,[100,100]); MP.setEase(innerSc,"expoOut"); }
    inner.startTime = t0;

    log("saberPortal (plugin replica): 3-ring portal + glow cascade + fractal vortex");
    return host;
  }

  // ── ELEMENT 3D PRODUCT SPIN REPLICA ────────────────────────────────────
  // Element 3D renders true 3D OBJ models. We replicate with multi-face 3D
  // solid-layer cube/product silhouette + camera spin + studio lighting null.
  function element3dProductSpin(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.9, 0.92, 1];
    var dur = opts.duration || 6;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;
    var center = [cw/2, ch/2];

    // Camera that orbits.
    var cam = comp.layers.addCamera("MP_E3D_Camera", center);
    try {
      cam.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, -1000]);
      cam.startTime = t0;
      var camPos = cam.property("ADBE Transform Group").property("ADBE Position");
      if (camPos) {
        camPos.setValueAtTime(t0, [cw*0.5, ch*0.5, -1000]);
        camPos.setValueAtTime(t0 + dur * 0.5, [cw*0.6, ch*0.45, -1000]);
        camPos.setValueAtTime(t0 + dur, [cw*0.5, ch*0.5, -1000]);
        MP.setEase(camPos, "sineInOut");
      }
    } catch(e){}

    // Studio light.
    var lit = comp.layers.addLight("MP_E3D_KeyLight", center);
    try {
      lit.property("ADBE Transform Group").property("ADBE Position").setValue([cw*0.3, ch*0.2, -600]);
      lit.property("ADBE Light Options Group").property("ADBE Light Intensity").setValue(150);
      lit.startTime = t0;
    } catch(e){}

    // Null controller — product rotation rig.
    var ctrl = comp.layers.addNull(dur);
    ctrl.name = "MP_E3D_ProductCtrl";
    ctrl.threeDLayer = true;
    ctrl.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, 0]);
    ctrl.startTime = t0;
    var ctrlRY = ctrl.property("ADBE Transform Group").property("ADBE Rotate Y");
    if (ctrlRY) { ctrlRY.setValueAtTime(t0, 0); ctrlRY.setValueAtTime(t0 + dur, 360); }

    // 6 faces of a product box (top/front/right/back/left/bottom).
    var faceData = [
      { name:"Front",  pos:[0,0,-80],   rx:0,   ry:0,   col:col              },
      { name:"Back",   pos:[0,0,80],    rx:0,   ry:180, col:[col[0]*0.7,col[1]*0.7,col[2]*0.7] },
      { name:"Right",  pos:[80,0,0],    rx:0,   ry:90,  col:[col[0]*0.85,col[1]*0.85,col[2]*0.9] },
      { name:"Left",   pos:[-80,0,0],   rx:0,   ry:-90, col:[col[0]*0.75,col[1]*0.75,col[2]*0.8] },
      { name:"Top",    pos:[0,-80,0],   rx:90,  ry:0,   col:[1,1,1] },
      { name:"Bottom", pos:[0,80,0],    rx:-90, ry:0,   col:[col[0]*0.5,col[1]*0.5,col[2]*0.55] },
    ];
    var faceW = 160; var faceH = 160;
    for (var fi = 0; fi < faceData.length; fi++) {
      var fd = faceData[fi];
      var face = comp.layers.addSolid(fd.col, "MP_E3D_" + fd.name, faceW, faceH, 1, dur);
      face.threeDLayer = true;
      face.startTime = t0;
      try {
        var ftg = face.property("ADBE Transform Group");
        var fpos = ftg.property("ADBE Position");
        if (fpos) fpos.setValue([cw/2 + fd.pos[0], ch/2 + fd.pos[1], fd.pos[2]]);
        ftg.property("ADBE Rotate X").setValue(fd.rx);
        ftg.property("ADBE Rotate Y").setValue(fd.ry);
        // Parent to rotation null.
        face.parent = ctrl;
      } catch(eF){}
      // Bevel/shine.
      var faceGlow = addFx(face, "ADBE Bevel Alpha");
      if (!faceGlow) faceGlow = addFx(face, "ADBE Drop Shadow");
      var faceSweep = addFx(face, "CC Light Sweep");
      if (faceSweep) { try { faceSweep.property("Direction").setValue(55); faceSweep.property("Width").setValue(60); faceSweep.property("Intensity").setValue(40); } catch(e){} }
    }

    // Post-process: DOF + premium glow.
    var postAdj = adjustment(comp, "MP_E3D_Finish");
    postAdj.startTime = t0;
    var dof = addFx(postAdj, "ADBE Camera Lens Blur");
    if (dof) { try { dof.property("ADBE Camera Lens Blur-0002").setValue(3); } catch(e){} }
    var finGlow = addFx(postAdj, "ADBE Glow");
    if (finGlow) { try { finGlow.property("ADBE Glow-0003").setValue(60); finGlow.property("ADBE Glow-0004").setValue(1.2); } catch(e){} }

    log("element3dProductSpin (plugin replica): 6-face 3D box + orbit camera + key light + DOF");
    return ctrl;
  }

  function element3dObject(comp, opts) { return element3dProductSpin(comp, opts); }

  // ── TRAPCODE PARTICULAR — Storm Cloud Replica ───────────────────────────
  // Particular storm cloud = thousands of 3D particles forming a volumetric
  // cloud. We approximate with: multi-layer CC Particle World stacked in 3D
  // with turbulent velocity + fractal noise tint + atmospheric fog pass.
  function particularStormCloud(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.4, 0.4, 0.5];
    var strength = opts.strength != null ? opts.strength : 8000;
    var turb = opts.turbulence != null ? opts.turbulence : 120;
    var life = opts.lifespan != null ? opts.lifespan : 4;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;

    // 4 stacked particle layers at different Z depths for volumetric feel.
    var depths = [-200, -100, 0, 100];
    var scales = [0.9, 1.0, 1.1, 0.85];
    for (var di = 0; di < depths.length; di++) {
      var pLayer = solid(comp, [0,0,0], "MP_Cloud_Layer" + di, dur);
      pLayer.threeDLayer = true;
      pLayer.startTime = t0;
      try { pLayer.property("ADBE Transform Group").property("ADBE Position").setValue([cw/2, ch/2, depths[di]]); } catch(e){}
      try { pLayer.property("ADBE Transform Group").property("ADBE Scale").setValue([100*scales[di], 100*scales[di], 100*scales[di]]); } catch(e){}

      var ccpw = addFx(pLayer, "CC Particle World");
      if (ccpw) {
        try {
          var birth = ccpw.property("Birth Rate"); if (birth) birth.setValue((strength / 1000) * 0.8);
          var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(life);
          var producer = ccpw.property("Producer");
          if (producer) { producer.property("Radius X").setValue(0.5); producer.property("Radius Y").setValue(0.2); producer.property("Radius Z").setValue(0.3); }
          var physics = ccpw.property("Physics");
          if (physics) { try { physics.property("Gravity").setValue(-0.05); physics.property("Extra").setValue(turb / 500); } catch(ep){} }
          var particle = ccpw.property("Particle");
          if (particle) {
            try { particle.property("Particle Type").setValue(8); } catch(e){}  // cloud-like
            try { particle.property("Birth Size").setValue(0.3); particle.property("Death Size").setValue(0.5); } catch(e){}
            try { particle.property("Birth Color").setValue([col[0]+0.2,col[1]+0.2,col[2]+0.25,1]); } catch(e){}
            try { particle.property("Death Color").setValue([col[0],col[1],col[2],0]); } catch(e){}
          }
        } catch(ePC){}
      } else {
        // Fractal noise fallback for cloud.
        var fn4 = addFx(pLayer, "ADBE Fractal Noise");
        if (fn4) {
          try { fn4.property("ADBE Fractal Noise-0001").setValue(4); fn4.property("ADBE Fractal Noise-0003").setValue(-0.3); fn4.property("ADBE Fractal Noise-0006").setValue([150,150]); } catch(e){}
          var evo3 = fn4.property("ADBE Fractal Noise-0012"); if (evo3) { evo3.setValueAtTime(t0,0); evo3.setValueAtTime(t0+dur, dur*0.3); }
        }
      }
      setBlend(pLayer, "SCREEN");
      var pOp = tp(pLayer, "opacity"); if (pOp) pOp.setValue(45 + di * 8);
    }

    // Color tint pass.
    var tintAdj = adjustment(comp, "MP_Cloud_Tint");
    tintAdj.startTime = t0;
    var tint = addFx(tintAdj, "ADBE Tint");
    if (tint) { try { tint.property("ADBE Tint-0002").setValue([col[0],col[1],col[2],1]); } catch(e){} }
    var tOp = tp(tintAdj, "opacity"); if (tOp) tOp.setValue(35);

    log("particularStormCloud (plugin replica): 4-layer volumetric CC Particle World cloud");
    return tintAdj;
  }

  // ── TRAPCODE PARTICULAR — Fairy Dust Replica ────────────────────────────
  function particularFairyDust(comp, opts) {
    opts = opts || {};
    var col = opts.color || [1, 0.9, 0.5];
    var strength = opts.strength != null ? opts.strength : 300;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;

    var layer = solid(comp, [0,0,0], "MP_FairyDust", dur);
    layer.startTime = t0;
    var ccpw = addFx(layer, "CC Particle World");
    if (ccpw) {
      try {
        var birth = ccpw.property("Birth Rate"); if (birth) birth.setValue(strength / 100);
        var longev = ccpw.property("Longevity (sec)"); if (longev) longev.setValue(3);
        var producer = ccpw.property("Producer");
        if (producer) { producer.property("Position Y").setValue(-0.3); producer.property("Radius X").setValue(0.3); }
        var physics = ccpw.property("Physics");
        if (physics) { try { physics.property("Gravity").setValue(-0.15); physics.property("Extra").setValue(0.4); } catch(e){} }
        var particle = ccpw.property("Particle");
        if (particle) {
          try { particle.property("Particle Type").setValue(6); } catch(e){}  // faded sphere / star
          try { particle.property("Birth Size").setValue(0.04); particle.property("Death Size").setValue(0.02); } catch(e){}
          try { particle.property("Max Opacity").setValue(80); } catch(e){}
          try { particle.property("Birth Color").setValue([1,1,0.9,1]); particle.property("Death Color").setValue([col[0],col[1],col[2],0]); } catch(e){}
        }
      } catch(eFD){}
    } else {
      var fn5 = addFx(layer, "ADBE Fractal Noise");
      if (fn5) { try { fn5.property("ADBE Fractal Noise-0003").setValue(0.8); fn5.property("ADBE Fractal Noise-0006").setValue([20,20]); } catch(e){} }
    }
    var glow = addFx(layer, "ADBE Glow");
    if (glow) { try { glow.property("ADBE Glow-0003").setValue(40); glow.property("ADBE Glow-0004").setValue(2.5); } catch(e){} }
    setBlend(layer, "ADD");
    log("particularFairyDust (plugin replica): CC Particle World magic sparkle trail");
    return layer;
  }

  // ======================================================================
  // ★ ÇILGIN / CRAZY NATIVE IMPLEMENTATIONS ★
  // ======================================================================

  // ── DIGITAL RAIN (Matrix) ───────────────────────────────────────────────
  function digitalRain(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.1, 1, 0.3];
    var cols = opts.columns || 24;
    var speed = opts.speed || 1;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;
    var colW = Math.round(cw / cols);

    // Dark background.
    var bg = solid(comp, [0, 0.02, 0], "MP_Rain_BG", dur);
    bg.startTime = t0;
    var bgOp = tp(bg, "opacity"); if (bgOp) bgOp.setValue(90);

    // Build expression-driven text columns.
    var chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ";
    var fontSize = Math.max(14, Math.round(colW * 0.85));
    for (var c = 0; c < cols; c++) {
      var xPos = colW * c + colW / 2;
      var delay = (c * 0.17 + Math.sin(c * 1.3) * 0.5);
      var colSpeed = speed * (0.7 + (c % 5) * 0.12);
      // Each column = a text layer with expression-driven position and sourceText.
      var tl = comp.layers.addText("01010110");
      tl.name = "Rain_Col" + c;
      tl.startTime = t0 + (delay % (dur * 0.6));

      var textDoc = tl.property("ADBE Text Properties").property("ADBE Text Document");
      try {
        var td = textDoc.value;
        td.fontSize = fontSize;
        td.fillColor = [col[0], col[1], col[2]];
        td.font = "Courier New";
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        textDoc.setValue(td);
      } catch(e){}

      // Animate position: rain falling from top.
      var pos2 = tl.property("ADBE Transform Group").property("ADBE Position");
      if (pos2) {
        pos2.setValueAtTime(t0, [xPos, -ch * 0.5]);
        pos2.setValueAtTime(t0 + dur, [xPos, ch * 1.8]);
        MP.setEase(pos2, "linear");
      }

      // Add glow.
      var rainGlow = addFx(tl, "ADBE Glow");
      if (rainGlow) { try { rainGlow.property("ADBE Glow-0003").setValue(25); rainGlow.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
    }

    // Scanline vignette overlay.
    var scanAdj = adjustment(comp, "MP_Rain_Vignette");
    scanAdj.startTime = t0;
    var scan = addFx(scanAdj, "ADBE HUE SATURATION");
    if (scan) { try { scan.property("ADBE HUE SATURATION-0001").setValue(1); scan.property("ADBE HUE SATURATION-0002").setValue(120); } catch(e){} }
    var vig = addFx(scanAdj, "ADBE Vignette");
    if (!vig) { vig = addFx(scanAdj, "ADBE Ramp"); }

    log("digitalRain: " + cols + " expression-driven text columns");
    return bg;
  }

  // ── PIXEL SORT GLITCH ART ───────────────────────────────────────────────
  function pixelSort(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 1.5;
    var t0 = opts.start || 0;
    var angle = opts.angle != null ? opts.angle : 0;
    var strength = opts.strength != null ? opts.strength : 80;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_PixelSort");
    host.startTime = t0;

    // Threshold pass: pull bright pixels.
    var thresh = addFx(host, "ADBE Threshold2");
    if (thresh) { try { thresh.property("ADBE Threshold2-0001").setValue(opts.threshold || 128); } catch(e){} }

    // Directional blur along sort axis (replicates the streak look).
    var fbb = addFx(host, "ADBE Fast Box Blur");
    if (fbb) {
      try { fbb.property("ADBE Fast Box Blur-0001").setValue(strength * 3); } catch(e){}
      try { fbb.property("ADBE Fast Box Blur-0003").setValue(3); } catch(e){}
    }
    // Rotate the sort direction.
    var ro2 = tp(host, "rotation"); if (ro2) ro2.setValue(angle);

    // Offset displacement map for digital corruption feel.
    var td2 = addFx(host, "ADBE Offset");
    if (td2) {
      try {
        var sh = td2.property("Shift Center To");
        if (sh) { sh.setValueAtTime(t0, [0,0]); sh.setValueAtTime(t0+dur*0.3, [strength*1.5, 0]); sh.setValueAtTime(t0+dur, [0,0]); }
      } catch(e){}
    }

    // RGB split for pixel-sort look.
    var disp = addFx(host, "ADBE Displacement Map");
    if (disp) {
      try { disp.property("ADBE Displacement Map-0003").setValue(strength * 0.5); } catch(e){}
      try { disp.property("ADBE Displacement Map-0004").setValue(0); } catch(e){}
    }

    setBlend(host, "SCREEN");
    fadeOut(host, t0 + dur * 0.6, dur * 0.4);
    log("pixelSort: directional threshold + fast-box + displacement");
    return host;
  }

  // ── LIQUID FILL ─────────────────────────────────────────────────────────
  function liquidFill(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.1, 0.5, 1];
    var dur = opts.duration || 2.5;
    var t0 = opts.start || 0;
    var waveH = opts.waveAmplitude != null ? opts.waveAmplitude : 12;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var cw = comp.width; var ch = comp.height;
    var host = layer || solid(comp, col, "MP_Liquid_Fill", dur);
    host.startTime = t0;

    // Liquid body (gradient fill).
    var liq = solid(comp, col, "MP_Liquid_Body", dur + 0.5);
    liq.startTime = t0;

    // Wave-warp for organic surface edge.
    var ww = addFx(liq, "ADBE Wave Warp");
    if (ww) {
      try { ww.property("ADBE Wave Warp-0001").setValue(3); } catch(e){}      // sine
      try { ww.property("ADBE Wave Warp-0002").setValue(waveH); } catch(e){}   // height
      try { ww.property("ADBE Wave Warp-0003").setValue(120); } catch(e){}     // width
      try { ww.property("ADBE Wave Warp-0004").setValue(1.5); } catch(e){}     // speed
    }

    // Mask that rises from bottom to top = fill animation.
    try {
      var mask2 = liq.Masks.addProperty("Mask");
      var ms = mask2.property("ADBE Mask Shape");
      var initShape = new Shape();
      initShape.vertices = [[0,ch],[cw,ch],[cw,ch],[0,ch]];
      initShape.closed = true;
      ms.setValueAtTime(t0, initShape);
      var fullShape = new Shape();
      fullShape.vertices = [[0,0],[cw,0],[cw,ch],[0,ch]];
      fullShape.closed = true;
      ms.setValueAtTime(t0 + dur, fullShape);
      MP.setEase(ms, "expoInOut");
      mask2.property("ADBE Mask Mode").setValue(1); // Add
    } catch(eMask){}

    // Gradient on the liquid.
    var ramp = addFx(liq, "ADBE Ramp");
    if (ramp) {
      try { ramp.property("ADBE Ramp-0001").setValue([cw/2, 0]); } catch(e){}
      try { ramp.property("ADBE Ramp-0003").setValue([cw/2, ch]); } catch(e){}
      try { ramp.property("ADBE Ramp-0002").setValue([Math.min(col[0]+0.2,1), Math.min(col[1]+0.2,1), Math.min(col[2]+0.3,1), 1]); } catch(e){}
      try { ramp.property("ADBE Ramp-0004").setValue([col[0]*0.4, col[1]*0.4, col[2]*0.7, 1]); } catch(e){}
      try { ramp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }

    // Bubbles (optional CC Particle World).
    if (opts.bubbles !== false) {
      var bub = solid(comp, [0,0,0], "MP_Liquid_Bubbles", dur);
      bub.startTime = t0 + dur * 0.2;
      var ccpw2 = addFx(bub, "CC Particle World");
      if (ccpw2) {
        try {
          var birth2 = ccpw2.property("Birth Rate"); if (birth2) birth2.setValue(0.8);
          var longev2 = ccpw2.property("Longevity (sec)"); if (longev2) longev2.setValue(1.2);
          var phys2 = ccpw2.property("Physics"); if (phys2) { try { phys2.property("Gravity").setValue(-0.2); } catch(e){} }
          var part2 = ccpw2.property("Particle");
          if (part2) { try { part2.property("Birth Size").setValue(0.03); part2.property("Birth Color").setValue([1,1,1,0.4]); } catch(e){} }
        } catch(eBub){}
      }
      setBlend(bub, "ADD");
      var bubOp = tp(bub, "opacity"); if (bubOp) bubOp.setValue(50);
    }

    // Glow on liquid edge.
    var liqGlow = addFx(liq, "ADBE Glow");
    if (liqGlow) { try { liqGlow.property("ADBE Glow-0003").setValue(30); liqGlow.property("ADBE Glow-0004").setValue(1.3); } catch(e){} }

    log("liquidFill: wave-warp liquid + rising mask + gradient + bubbles");
    return liq;
  }

  // ── FRACTAL ZOOM (Infinite) ─────────────────────────────────────────────
  function fractalZoom(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.3, 0.0, 0.8];
    var dur = opts.duration || 6;
    var t0 = opts.start || 0;
    var depth = opts.depth != null ? opts.depth : 7;
    var speed = opts.zoomSpeed || 1.5;
    var cw = comp.width; var ch = comp.height;

    // Create nested layers where each one is 1.05x smaller and starts slightly
    // offset in time — together they create infinite zoom illusion.
    var layers = [];
    for (var d = 0; d < depth; d++) {
      var fzLayer = solid(comp, [0,0,0], "MP_FractalZoom_D" + d, dur);
      fzLayer.startTime = t0;
      var fn6 = addFx(fzLayer, "ADBE Fractal Noise");
      if (fn6) {
        try {
          fn6.property("ADBE Fractal Noise-0001").setValue(5); // Turbulent
          fn6.property("ADBE Fractal Noise-0003").setValue(0.6); // contrast
          fn6.property("ADBE Fractal Noise-0006").setValue([150 * Math.pow(1.5, d), 150 * Math.pow(1.5, d)]); // scale per depth
          var evoFZ = fn6.property("ADBE Fractal Noise-0012");
          if (evoFZ) { evoFZ.setValueAtTime(t0, d * 0.3); evoFZ.setValueAtTime(t0+dur, d*0.3 + dur * speed * 0.5); }
        } catch(e){}
      }
      // Hue shift per depth.
      var hsFZ = addFx(fzLayer, "ADBE HUE SATURATION");
      if (hsFZ) { try { hsFZ.property("ADBE HUE SATURATION-0001").setValue(1); hsFZ.property("ADBE HUE SATURATION-0002").setValue(Math.round(d * 40 + 200)); hsFZ.property("ADBE HUE SATURATION-0003").setValue(70); } catch(e){} }

      // Scale zooms OUT (starting big, shrinking = viewer zooms in).
      var fzSc = tp(fzLayer, "scale");
      var startScale = Math.pow(1.05, depth - d) * 100;
      var endScale = Math.pow(1.05, depth - d - (dur * speed * 0.8)) * 100;
      if (fzSc) { fzSc.setValueAtTime(t0, [startScale, startScale]); fzSc.setValueAtTime(t0+dur, [endScale < 100 ? 100 : endScale, endScale < 100 ? 100 : endScale]); MP.setEase(fzSc, "linear"); }

      setBlend(fzLayer, d % 2 === 0 ? "ADD" : "SCREEN");
      var fzOp = tp(fzLayer, "opacity"); if (fzOp) fzOp.setValue(Math.round(70 - d * 6));
      layers.push(fzLayer);
    }

    // Global glow pass.
    var fzAdj = adjustment(comp, "MP_FractalZoom_Grade");
    fzAdj.startTime = t0;
    var fzGlow = addFx(fzAdj, "ADBE Glow"); if (fzGlow) { try { fzGlow.property("ADBE Glow-0003").setValue(80); fzGlow.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
    var fzCurve = addFx(fzAdj, "ADBE CurvesCustom"); if (fzCurve) { try { fzCurve.property("ADBE CurvesCustom-0001").setValue([[0,0],[0.3,0.15],[0.8,0.9],[1,1]]); } catch(e){} }

    log("fractalZoom: " + depth + "-layer nested scale expression tunnel");
    return fzAdj;
  }

  // ── HOLOGRAPHIC HUD OVERLAY ─────────────────────────────────────────────
  function holographicHud(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.1, 0.9, 1];
    var scanSpeed = opts.scanSpeed || 1.5;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;
    var showRadar = opts.showRadar !== false;
    var showBrackets = opts.showBrackets !== false;
    var showReadout = opts.showDataReadout !== false;

    // Base scanline overlay.
    var scanAdj = adjustment(comp, "MP_HUD_Scanlines");
    scanAdj.startTime = t0;
    var scanFn = addFx(scanAdj, "ADBE Posterize");
    if (scanFn) { try { scanFn.property("ADBE Posterize-0001").setValue(6); } catch(e){} }
    var scanHs = addFx(scanAdj, "ADBE HUE SATURATION");
    if (scanHs) { try { scanHs.property("ADBE HUE SATURATION-0001").setValue(1); scanHs.property("ADBE HUE SATURATION-0002").setValue(180); scanHs.property("ADBE HUE SATURATION-0003").setValue(50); } catch(e){} }
    var scanOp = tp(scanAdj, "opacity"); if (scanOp) scanOp.setValue(30);

    // Corner brackets (top-left, top-right, bottom-left, bottom-right).
    if (showBrackets) {
      var corners = [
        { x:60, y:60, rx:1, ry:1 }, { x:cw-60, y:60, rx:-1, ry:1 },
        { x:60, y:ch-60, rx:1, ry:-1 }, { x:cw-60, y:ch-60, rx:-1, ry:-1 }
      ];
      for (var ci = 0; ci < corners.length; ci++) {
        var brk = comp.layers.addShape();
        brk.name = "MP_HUD_Corner" + ci;
        brk.startTime = t0;
        brk.property("ADBE Transform Group").property("ADBE Position").setValue([corners[ci].x, corners[ci].y]);
        var bRoot = brk.property("ADBE Root Vectors Group");
        // Horizontal arm.
        var bh = bRoot.addProperty("ADBE Vector Group");
        var bvh = bh.property("ADBE Vectors Group");
        var brhRect = bvh.addProperty("ADBE Vector Shape - Rect");
        try { brhRect.property("ADBE Vector Rect Size").setValue([50, 4]); } catch(e){}
        try { brhRect.property("ADBE Vector Rect Position").setValue([corners[ci].rx * 25, 0]); } catch(e){}
        var bhFill = bvh.addProperty("ADBE Vector Graphic - Stroke");
        try { bhFill.property("ADBE Vector Stroke Color").setValue([col[0], col[1], col[2], 1]); } catch(e){}
        try { bhFill.property("ADBE Vector Stroke Width").setValue(3); } catch(e){}
        // Vertical arm.
        var bv = bRoot.addProperty("ADBE Vector Group");
        var bvv = bv.property("ADBE Vectors Group");
        var brvRect = bvv.addProperty("ADBE Vector Shape - Rect");
        try { brvRect.property("ADBE Vector Rect Size").setValue([4, 50]); } catch(e){}
        try { brvRect.property("ADBE Vector Rect Position").setValue([0, corners[ci].ry * 25]); } catch(e){}
        var bvFill = bvv.addProperty("ADBE Vector Graphic - Stroke");
        try { bvFill.property("ADBE Vector Stroke Color").setValue([col[0], col[1], col[2], 1]); } catch(e){}
        try { bvFill.property("ADBE Vector Stroke Width").setValue(3); } catch(e){}
        // Animate in.
        var brSc = tp(brk, "scale"); if (brSc) { brSc.setValueAtTime(t0, [0,0]); brSc.setValueAtTime(t0+0.4, [100,100]); MP.setEase(brSc, "expoOut"); }
        var brGlow = addFx(brk, "ADBE Glow"); if (brGlow) { try { brGlow.property("ADBE Glow-0003").setValue(20); brGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
        setBlend(brk, "ADD");
      }
    }

    // Scanning bar (horizontal sweep).
    var scanBar = solid(comp, [col[0]*0.2, col[1]*0.8, col[2], 1], "MP_HUD_ScanBar", dur);
    scanBar.startTime = t0;
    var sbSc = tp(scanBar, "scale"); if (sbSc) sbSc.setValue([100, 1]);
    var sbPos = tp(scanBar, "position");
    if (sbPos) { sbPos.setValueAtTime(t0, [cw/2, 0]); sbPos.setValueAtTime(t0+dur, [cw/2, ch]); MP.setEase(sbPos, "sineInOut"); }
    var sbOp = tp(scanBar, "opacity"); if (sbOp) sbOp.setValue(60);
    setBlend(scanBar, "ADD");

    // Radar circle (bottom-left).
    if (showRadar) {
      var radar = comp.layers.addShape();
      radar.name = "MP_HUD_Radar";
      radar.startTime = t0;
      var rPos = tp(radar, "position"); if (rPos) rPos.setValue([cw * 0.15, ch * 0.8]);
      var rRoot = radar.property("ADBE Root Vectors Group");
      // Concentric circles.
      for (var ri = 1; ri <= 3; ri++) {
        var rg = rRoot.addProperty("ADBE Vector Group");
        var rv2 = rg.property("ADBE Vectors Group");
        var re2 = rv2.addProperty("ADBE Vector Shape - Ellipse");
        try { re2.property("ADBE Vector Ellipse Size").setValue([ri*40, ri*40]); } catch(e){}
        var rs2 = rv2.addProperty("ADBE Vector Graphic - Stroke");
        try { rs2.property("ADBE Vector Stroke Color").setValue([col[0],col[1],col[2],1]); rs2.property("ADBE Vector Stroke Width").setValue(1); } catch(e){}
      }
      // Sweep hand.
      var sweep = rRoot.addProperty("ADBE Vector Group");
      var sv = sweep.property("ADBE Vectors Group");
      var sl = sv.addProperty("ADBE Vector Shape - Rect");
      try { sl.property("ADBE Vector Rect Size").setValue([60, 2]); sl.property("ADBE Vector Rect Position").setValue([30, 0]); } catch(e){}
      var ss = sv.addProperty("ADBE Vector Graphic - Stroke");
      try { ss.property("ADBE Vector Stroke Color").setValue([col[0],col[1]*1.2,col[2],1]); ss.property("ADBE Vector Stroke Width").setValue(2); } catch(e){}
      var sweepRot = sweep.property("ADBE Vector Transform Group").property("ADBE Vector Rotation");
      if (sweepRot) { sweepRot.setValueAtTime(t0, 0); sweepRot.setValueAtTime(t0+dur, 360 * scanSpeed * 2); }
      var radarGlow = addFx(radar, "ADBE Glow"); if (radarGlow) { try { radarGlow.property("ADBE Glow-0003").setValue(25); radarGlow.property("ADBE Glow-0004").setValue(2); } catch(e){} }
      setBlend(radar, "ADD");
    }

    // Data readout text layers.
    if (showReadout) {
      var readoutLines = ["SYS.STATUS: ONLINE", "SIGNAL: 94.7%", "UPLINK: ACTIVE", "THREAT: MINIMAL"];
      for (var li = 0; li < readoutLines.length; li++) {
        var rtl = comp.layers.addText(readoutLines[li]);
        rtl.name = "MP_HUD_Data" + li;
        rtl.startTime = t0 + li * 0.1;
        var rtDoc = rtl.property("ADBE Text Properties").property("ADBE Text Document");
        try { var rtd = rtDoc.value; rtd.fontSize = Math.round(ch * 0.016); rtd.fillColor = [col[0],col[1],col[2]]; rtd.font = "Courier New"; rtDoc.setValue(rtd); } catch(e){}
        var rtPos = tp(rtl, "position"); if (rtPos) rtPos.setValue([cw * 0.75, ch * (0.72 + li * 0.05)]);
        var rtGlow = addFx(rtl, "ADBE Glow"); if (rtGlow) { try { rtGlow.property("ADBE Glow-0003").setValue(15); rtGlow.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
        setBlend(rtl, "ADD");
      }
    }

    log("holographicHud: scanlines + corners + scan bar + radar + data readout");
    return scanAdj;
  }

  // ── ASCII ART FILTER ────────────────────────────────────────────────────
  function asciiArt(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.2, 1, 0.4];
    var cell = opts.cellSize || 12;
    var contrast = opts.contrast || 1.4;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_ASCII_Art");
    // Mosaic = pixelated grid (closest to ASCII in AE).
    var mosaic = addFx(host, "ADBE Mosaic");
    if (mosaic) { try { mosaic.property("ADBE Mosaic-0001").setValue(Math.round(comp.width/cell)); mosaic.property("ADBE Mosaic-0002").setValue(Math.round(comp.height/cell)); mosaic.property("ADBE Mosaic-0003").setValue(true); } catch(e){} }
    // Posterize to reduce to "character density" levels.
    var post = addFx(host, "ADBE Posterize");
    if (post) { try { post.property("ADBE Posterize-0001").setValue(8); } catch(e){} }
    // Increase contrast so the "cells" are distinct.
    var bright = addFx(host, "ADBE Brightness&Contrast2");
    if (bright) { try { bright.property("ADBE Brightness&Contrast2-0002").setValue(Math.round((contrast-1)*80)); } catch(e){} }
    // Colorize green monochrome.
    var hsAscii = addFx(host, "ADBE HUE SATURATION");
    if (hsAscii) { try { hsAscii.property("ADBE HUE SATURATION-0001").setValue(1); hsAscii.property("ADBE HUE SATURATION-0002").setValue(120); hsAscii.property("ADBE HUE SATURATION-0003").setValue(70); } catch(e){} }
    // Grid overlay for the character cell look.
    var grid = addFx(host, "ADBE GRID");
    if (grid) { try { grid.property("ADBE GRID-0002").setValue(cell); grid.property("ADBE GRID-0003").setValue(cell); } catch(e){} }
    log("asciiArt: mosaic + posterize + grid overlay");
    return host;
  }

  // ── THERMAL / INFRARED CAMERA ──────────────────────────────────────────
  function thermalCam(comp, opts) {
    opts = opts || {};
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_ThermalCam");
    // Desaturate first.
    var hs2 = addFx(host, "ADBE HUE SATURATION");
    if (hs2) { try { hs2.property("ADBE HUE SATURATION-0003").setValue(-100); } catch(e){} }
    // Gradient remap: cold=blue, mid=green, warm=yellow, hot=white/red.
    var gr = addFx(host, "ADBE Gradient Remap");
    if (gr) {
      // The Gradient Remap UI is not directly scriptable beyond applying; we add curves instead.
    }
    var curves = addFx(host, "ADBE CurvesCustom");
    if (curves) { try { curves.property("ADBE CurvesCustom-0001").setValue([[0,0],[0.35,0.15],[0.6,0.75],[1,1]]); } catch(e){} }
    // Color balance to push toward blue/teal (cold) in shadows.
    var cb = addFx(host, "ADBE Color Balance 2");
    if (cb) { try { cb.property("ADBE Color Balance 2-0001").setValue([0, -20, 50]); cb.property("ADBE Color Balance 2-0002").setValue([20, 30, -15]); cb.property("ADBE Color Balance 2-0003").setValue([60, 10, -40]); } catch(e){} }
    // Posterize to discrete temperature bands.
    var post2 = addFx(host, "ADBE Posterize");
    if (post2) { try { post2.property("ADBE Posterize-0001").setValue(6); } catch(e){} }
    // Mild noise for thermal sensor grain.
    var noiseT = addFx(host, "ADBE Noise");
    if (noiseT) { try { noiseT.property("ADBE Noise-0001").setValue(5); } catch(e){} }
    // Glow on hot areas.
    var glowT = addFx(host, "ADBE Glow");
    if (glowT) { try { glowT.property("ADBE Glow-0003").setValue(40); glowT.property("ADBE Glow-0004").setValue(1.2); } catch(e){} }
    log("thermalCam: desaturate + gradient remap + cold/hot color balance + posterize");
    return host;
  }

  // ── CLOTH / FLAG WAVE ──────────────────────────────────────────────────
  function clothWave(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 4;
    var t0 = opts.start || 0;
    var wH = opts.waveHeight != null ? opts.waveHeight : 40;
    var speed = opts.speed || 1.2;
    var dir = opts.direction != null ? opts.direction : 90;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_ClothWave");
    host.startTime = t0;

    // Wave Warp (primary cloth motion).
    var ww2 = addFx(host, "ADBE Wave Warp");
    if (ww2) {
      try { ww2.property("ADBE Wave Warp-0001").setValue(2); } catch(e){}     // sine
      try { ww2.property("ADBE Wave Warp-0002").setValue(wH); } catch(e){}    // height
      try { ww2.property("ADBE Wave Warp-0003").setValue(300); } catch(e){}   // width
      try { ww2.property("ADBE Wave Warp-0004").setValue(speed * 1.5); } catch(e){} // speed
      try { ww2.property("ADBE Wave Warp-0005").setValue(dir); } catch(e){} // direction
    }

    // Secondary turbulent displace for natural cloth wrinkles.
    var td3 = addFx(host, "ADBE Turbulent Displace");
    if (td3) {
      try { td3.property("ADBE Turbulent Displace-0003").setValue(wH * 0.5); } catch(e){}
      try { td3.property("ADBE Turbulent Displace-0004").setValue(80); } catch(e){}
      var evo4 = td3.property("ADBE Turbulent Displace-0009");
      if (evo4) { evo4.setValueAtTime(t0, 0); evo4.setValueAtTime(t0+dur, speed * 3); }
    }

    // Shadow pass to give depth to the folds.
    var shade = addFx(host, "ADBE Drop Shadow");
    if (shade) {
      try { shade.property("ADBE Drop Shadow-0002").setValue(0.35); } catch(e){}   // opacity
      try { shade.property("ADBE Drop Shadow-0004").setValue(8); } catch(e){}      // distance
      try { shade.property("ADBE Drop Shadow-0005").setValue(15); } catch(e){}     // softness
    }

    // Pin left edge if requested (flag on pole).
    if (opts.pinLeft !== false) {
      try {
        var ap = tp(host, "anchor");
        if (ap) ap.setValue([0, comp.height / 2]);
      } catch(e){}
    }

    log("clothWave: wave warp + turbulent displace + fold shadow");
    return host;
  }

  // ── WATERCOLOR PAINT ────────────────────────────────────────────────────
  function watercolorPaint(comp, opts) {
    opts = opts || {};
    var bleed = opts.bleedAmount != null ? opts.bleedAmount : 35;
    var spread = opts.colorSpread || 1.4;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_Watercolor");
    // Roughen edges = paint bleed look.
    var re = addFx(host, "ADBE Roughen Edges");
    if (re) {
      try { re.property("ADBE Roughen Edges-0001").setValue(2); } catch(e){} // roughen
      try { re.property("ADBE Roughen Edges-0002").setValue(bleed); } catch(e){} // border
      try { re.property("ADBE Roughen Edges-0004").setValue(5); } catch(e){}  // complexity
      try { re.property("ADBE Roughen Edges-0006").setValue(1.8); } catch(e){} // scale
    }
    // Turbulent displace for paint stroke smear.
    var tdWC = addFx(host, "ADBE Turbulent Displace");
    if (tdWC) {
      try { tdWC.property("ADBE Turbulent Displace-0003").setValue(bleed * 0.8); } catch(e){}
      try { tdWC.property("ADBE Turbulent Displace-0004").setValue(120); } catch(e){}
    }
    // Saturation boost for watercolor vividity.
    var hsWC = addFx(host, "ADBE HUE SATURATION");
    if (hsWC) { try { hsWC.property("ADBE HUE SATURATION-0003").setValue(Math.round((spread-1)*70)); } catch(e){} }
    // Gaussian blur for paint wet-on-wet bleed.
    var blur = addFx(host, "ADBE Gaussian Blur 2");
    if (blur) { try { blur.property("ADBE Gaussian Blur 2-0001").setValue(bleed * 0.25); } catch(e){} }
    // Paper texture (noise layer on top).
    if (opts.paperTexture !== false) {
      var paper = solid(comp, [0.92, 0.88, 0.8], "MP_WC_Paper", comp.duration);
      var paperFn = addFx(paper, "ADBE Fractal Noise");
      if (paperFn) { try { paperFn.property("ADBE Fractal Noise-0006").setValue([30,30]); paperFn.property("ADBE Fractal Noise-0003").setValue(-0.6); } catch(e){} }
      setBlend(paper, "MULTIPLY");
      var paperOp = tp(paper, "opacity"); if (paperOp) paperOp.setValue(25);
    }
    log("watercolorPaint: roughen edges + turbulent displace + saturation + paper");
    return host;
  }

  // ── DATABEND / CORRUPT FILE GLITCH ─────────────────────────────────────
  function databend(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || 2;
    var t0 = opts.start || 0;
    var intensity = opts.intensity || 1;
    var blockSz = opts.blockSize || 40;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_Databend");
    host.startTime = t0;

    // Block displacement (large random blocks).
    var disp2 = addFx(host, "ADBE Displacement Map");
    if (disp2) {
      var dAmt = disp2.property("ADBE Displacement Map-0003");
      if (dAmt) { dAmt.setValueAtTime(t0, 0); dAmt.setValueAtTime(t0+0.05, 200*intensity); dAmt.setValueAtTime(t0+0.15, 0); dAmt.setValueAtTime(t0+0.6, 0); dAmt.setValueAtTime(t0+0.65, 150*intensity); dAmt.setValueAtTime(t0+0.8, 0); }
    }

    // RGB channel separation (channel dropout).
    if (opts.channelDropout !== false) {
      var shift = addFx(host, "ADBE Shift Channels");
      if (shift) {
        try {
          var shiftR = shift.property("ADBE Shift Channels-0001");
          if (shiftR) { shiftR.setValueAtTime(t0+0.1, 1); shiftR.setValueAtTime(t0+0.2, 4); shiftR.setValueAtTime(t0+0.3, 1); } // R->G->R
        } catch(e){}
      }
    }

    // Extreme mosaic blocks for corruption.
    var mos2 = addFx(host, "ADBE Mosaic");
    if (mos2) {
      try {
        var mH = mos2.property("ADBE Mosaic-0001");
        var mV = mos2.property("ADBE Mosaic-0002");
        if (mH) { mH.setValueAtTime(t0, 320); mH.setValueAtTime(t0+0.05, Math.round(320/blockSz*8)); mH.setValueAtTime(t0+0.25, 320); }
        if (mV) { mV.setValueAtTime(t0, 180); mV.setValueAtTime(t0+0.05, Math.round(180/blockSz*8)); mV.setValueAtTime(t0+0.25, 180); }
      } catch(e){}
    }

    // Freeze frame artifacts (echo).
    var echo = addFx(host, "ADBE Echo");
    if (echo) {
      try { echo.property("ADBE Echo-0001").setValue(0.06); echo.property("ADBE Echo-0002").setValue(3); echo.property("ADBE Echo-0003").setValue(0.4); } catch(e){}
    }

    log("databend: block disp + channel dropout + mosaic corruption + echo");
    return host;
  }

  // ── FULL VHS TAPE EFFECT ────────────────────────────────────────────────
  function vhsRetro(comp, opts) {
    opts = opts || {};
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var trackingErr = opts.tracking != null ? opts.tracking : 1.0;
    var noiseAmt = opts.noise != null ? opts.noise : 0.6;
    var colorBleed = opts.colorBleed != null ? opts.colorBleed : 1.2;
    var cw = comp.width; var ch = comp.height;

    // 1. Color desaturation + VHS color shift.
    var colorAdj = adjustment(comp, "MP_VHS_Color");
    colorAdj.startTime = t0;
    var hsVHS = addFx(colorAdj, "ADBE HUE SATURATION");
    if (hsVHS) { try { hsVHS.property("ADBE HUE SATURATION-0003").setValue(-25); } catch(e){} }
    var cbVHS = addFx(colorAdj, "ADBE Color Balance 2");
    if (cbVHS) { try { cbVHS.property("ADBE Color Balance 2-0001").setValue([-20, 0, 15]); cbVHS.property("ADBE Color Balance 2-0002").setValue([10, -5, 0]); } catch(e){} }

    // 2. Luminance noise (tape noise).
    var noiseAdj = adjustment(comp, "MP_VHS_Noise");
    noiseAdj.startTime = t0;
    var noiseVHS = addFx(noiseAdj, "ADBE Noise");
    if (noiseVHS) { try { noiseVHS.property("ADBE Noise-0001").setValue(Math.round(noiseAmt * 20)); noiseVHS.property("ADBE Noise-0002").setValue(false); } catch(e){} }

    // 3. Chroma bleed (horizontal blur on color channels only).
    var bleedAdj = adjustment(comp, "MP_VHS_Bleed");
    bleedAdj.startTime = t0;
    var bleedBlur = addFx(bleedAdj, "ADBE Fast Box Blur");
    if (bleedBlur) { try { bleedBlur.property("ADBE Fast Box Blur-0001").setValue(Math.round(colorBleed * 8)); bleedBlur.property("ADBE Fast Box Blur-0002").setValue(1); } catch(e){} } // horizontal only
    var bleedOp = tp(bleedAdj, "opacity"); if (bleedOp) bleedOp.setValue(45);
    setBlend(bleedAdj, "SCREEN");

    // 4. Horizontal tracking error bars.
    var trackSolid = solid(comp, [0.85, 0.85, 0.85], "MP_VHS_Track", dur);
    trackSolid.startTime = t0;
    var trackSc = tp(trackSolid, "scale"); if (trackSc) trackSc.setValue([100, 1.5]);
    var trackPos = tp(trackSolid, "position");
    if (trackPos) {
      // Animates between a few random Y positions (tape glitch).
      var yPositions = [ch*0.2, ch*0.6, ch*0.1, ch*0.8, ch*0.4];
      for (var ti = 0; ti < yPositions.length; ti++) {
        trackPos.setValueAtTime(t0 + (ti * dur / yPositions.length), [cw/2, yPositions[ti]]);
      }
    }
    var trackWarp = addFx(trackSolid, "ADBE Turbulent Displace");
    if (trackWarp) { try { trackWarp.property("ADBE Turbulent Displace-0003").setValue(Math.round(trackingErr * 30)); trackWarp.property("ADBE Turbulent Displace-0004").setValue(50); } catch(e){} }
    setBlend(trackSolid, "SCREEN");
    var trackOp = tp(trackSolid, "opacity");
    if (trackOp) {
      // Flash on/off for tracking error.
      trackOp.setValueAtTime(t0, 0); trackOp.setValueAtTime(t0+0.5, 60); trackOp.setValueAtTime(t0+0.7, 0); trackOp.setValueAtTime(t0+1.8, 0); trackOp.setValueAtTime(t0+2.0, 80); trackOp.setValueAtTime(t0+2.2, 0);
    }

    // 5. Scanlines overlay.
    var scanLines = solid(comp, [0,0,0], "MP_VHS_Scanlines", dur);
    scanLines.startTime = t0;
    var scanGrid = addFx(scanLines, "ADBE GRID");
    if (scanGrid) { try { scanGrid.property("ADBE GRID-0003").setValue(4); scanGrid.property("ADBE GRID-0004").setValue(comp.height); } catch(e){} }
    setBlend(scanLines, "MULTIPLY");
    var scanOp2 = tp(scanLines, "opacity"); if (scanOp2) scanOp2.setValue(35);

    // 6. VHS timestamp (bottom-left corner text).
    if (opts.showTimestamp !== false) {
      var timestamp = comp.layers.addText("REC ● 00:00:00");
      timestamp.name = "MP_VHS_Timestamp";
      timestamp.startTime = t0;
      try {
        var tsDoc = timestamp.property("ADBE Text Properties").property("ADBE Text Document");
        var td2 = tsDoc.value; td2.fontSize = Math.round(ch * 0.025); td2.fillColor = [1, 1, 1]; td2.font = "Courier New"; tsDoc.setValue(td2);
      } catch(e){}
      var tsPos = tp(timestamp, "position"); if (tsPos) tsPos.setValue([cw * 0.04, ch * 0.92]);
      // Flicker for REC indicator.
      var tsOp = tp(timestamp, "opacity");
      if (tsOp) { tsOp.setValueAtTime(t0, 100); tsOp.setValueAtTime(t0+0.5, 100); tsOp.setValueAtTime(t0+0.6, 0); tsOp.setValueAtTime(t0+1.1, 0); tsOp.setValueAtTime(t0+1.2, 100); }
    }

    // 7. Final grain.
    var vhsGrain = adjustment(comp, "MP_VHS_Grain");
    vhsGrain.startTime = t0;
    var noiseVG = addFx(vhsGrain, "ADBE Noise"); if (noiseVG) { try { noiseVG.property("ADBE Noise-0001").setValue(6); } catch(e){} }
    setBlend(vhsGrain, "OVERLAY");
    var vgOp = tp(vhsGrain, "opacity"); if (vgOp) vgOp.setValue(30);

    log("vhsRetro: color shift + noise + chroma bleed + tracking bars + scanlines + timestamp");
    return colorAdj;
  }

  // ── KALEIDOSCOPE / MIRROR ───────────────────────────────────────────────
  function kaleidoscope(comp, opts) {
    opts = opts || {};
    var segments = opts.segments || 8;
    var rotation = opts.rotation || 1.0;
    var zoom = opts.zoom || 1.05;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_Kaleidoscope");
    host.startTime = t0;

    // CC Kaleida (native AE — but not many users know this exists!).
    var kk = addFx(host, "CC Kaleida");
    if (kk) {
      try { kk.property("Size").setValue(150); } catch(e){}
      try { kk.property("Mirroring").setValue(segments); } catch(e){}
      var mirAng = kk.property("Rotation");
      if (mirAng) { mirAng.setValueAtTime(t0, 0); mirAng.setValueAtTime(t0+dur, 360 * rotation); }
    } else {
      // Mirror fallback.
      var mirror = addFx(host, "ADBE Mirror");
      if (mirror) { try { mirror.property("ADBE Mirror-0002").setValue(0); } catch(e){} }
    }
    // Scale zoom over time.
    var scK = tp(host, "scale");
    if (scK) { scK.setValueAtTime(t0, [100, 100]); scK.setValueAtTime(t0+dur, [100*Math.pow(zoom, dur), 100*Math.pow(zoom, dur)]); MP.setEase(scK, "sineInOut"); }

    log("kaleidoscope: CC Kaleida + rotation + zoom");
    return host;
  }

  // ── SYNTHWAVE RETRO GRID ────────────────────────────────────────────────
  function synthwaveGrid(comp, opts) {
    opts = opts || {};
    var col = opts.color || [1, 0.2, 0.8];
    var gridCol = opts.gridColor || [0.5, 0.1, 1];
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;

    // Sky gradient (sunset).
    var sky = solid(comp, [0,0,0], "MP_Synth_Sky", dur);
    sky.startTime = t0;
    var skyRamp = addFx(sky, "ADBE Ramp");
    if (skyRamp) {
      try { skyRamp.property("ADBE Ramp-0001").setValue([cw/2, 0]); } catch(e){}
      try { skyRamp.property("ADBE Ramp-0003").setValue([cw/2, ch*0.55]); } catch(e){}
      try { skyRamp.property("ADBE Ramp-0002").setValue([0.06, 0, 0.12, 1]); } catch(e){}
      try { skyRamp.property("ADBE Ramp-0004").setValue([col[0]*0.6, col[1]*0.1, col[2]*0.3, 1]); } catch(e){}
      try { skyRamp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }

    // Horizon glow.
    var horizGlow = solid(comp, [0,0,0], "MP_Synth_Horizon", dur);
    horizGlow.startTime = t0;
    var hzRamp = addFx(horizGlow, "ADBE Ramp");
    if (hzRamp) {
      try { hzRamp.property("ADBE Ramp-0001").setValue([cw/2, ch*0.52]); } catch(e){}
      try { hzRamp.property("ADBE Ramp-0003").setValue([cw/2, ch*0.65]); } catch(e){}
      try { hzRamp.property("ADBE Ramp-0002").setValue([col[0], col[1]*0.6, col[2], 1]); } catch(e){}
      try { hzRamp.property("ADBE Ramp-0004").setValue([0,0,0,0]); } catch(e){}
      try { hzRamp.property("ADBE Ramp-0005").setValue(2); } catch(e){}
    }
    var hzGlow = addFx(horizGlow, "ADBE Glow");
    if (hzGlow) { try { hzGlow.property("ADBE Glow-0003").setValue(100); hzGlow.property("ADBE Glow-0004").setValue(2.5); } catch(e){} }
    setBlend(horizGlow, "ADD");

    // Grid floor (perspective grid from shape lines).
    var grid2 = comp.layers.addShape();
    grid2.name = "MP_Synth_Grid";
    grid2.startTime = t0;
    var gRoot = grid2.property("ADBE Root Vectors Group");
    var vanishX = cw / 2; var vanishY = ch * 0.55;
    var numVert = 12; var numHoriz = 10;
    // Vertical perspective lines (converging to vanish point).
    for (var gv = 0; gv <= numVert; gv++) {
      var gx = cw * (gv / numVert);
      var gg = gRoot.addProperty("ADBE Vector Group");
      var gvv = gg.property("ADBE Vectors Group");
      var path = gvv.addProperty("ADBE Vector Shape - Group");
      try {
        var shp = new Shape();
        shp.vertices = [[gx, ch], [vanishX, vanishY]];
        shp.closed = false;
        path.property("ADBE Vector Shape").setValue(shp);
      } catch(e){}
      var gStr = gvv.addProperty("ADBE Vector Graphic - Stroke");
      try { gStr.property("ADBE Vector Stroke Color").setValue([gridCol[0], gridCol[1], gridCol[2], 0.6]); gStr.property("ADBE Vector Stroke Width").setValue(1.5); } catch(e){}
    }
    // Horizontal lines (equally spaced in perspective).
    for (var gh = 1; gh <= numHoriz; gh++) {
      var gy = vanishY + (ch - vanishY) * (gh / numHoriz);
      var leftX = vanishX - (vanishX - 0) * ((gy - vanishY) / (ch - vanishY));
      var rightX = vanishX + (cw - vanishX) * ((gy - vanishY) / (ch - vanishY));
      var hhg = gRoot.addProperty("ADBE Vector Group");
      var hvv = hhg.property("ADBE Vectors Group");
      var hpath = hvv.addProperty("ADBE Vector Shape - Group");
      try {
        var hshp = new Shape();
        hshp.vertices = [[leftX, gy], [rightX, gy]];
        hshp.closed = false;
        hpath.property("ADBE Vector Shape").setValue(hshp);
      } catch(e){}
      var hStr = hvv.addProperty("ADBE Vector Graphic - Stroke");
      try { hStr.property("ADBE Vector Stroke Color").setValue([gridCol[0], gridCol[1], gridCol[2], 0.4 + gh * 0.04]); hStr.property("ADBE Vector Stroke Width").setValue(1); } catch(e){}
    }
    // Animate grid scrolling (Y offset over time).
    var gridPos = tp(grid2, "position");
    if (gridPos) { gridPos.setValueAtTime(t0, [0, 0]); gridPos.setValueAtTime(t0+dur, [0, (ch - vanishY) / numHoriz * 2]); MP.setEase(gridPos, "linear"); }
    var gridGlow = addFx(grid2, "ADBE Glow"); if (gridGlow) { try { gridGlow.property("ADBE Glow-0003").setValue(30); gridGlow.property("ADBE Glow-0004").setValue(1.8); } catch(e){} }
    setBlend(grid2, "ADD");

    // Stars (tiny particles in the sky).
    var stars = solid(comp, [0,0,0], "MP_Synth_Stars", dur);
    stars.startTime = t0;
    var starFn = addFx(stars, "ADBE Fractal Noise");
    if (starFn) {
      try { starFn.property("ADBE Fractal Noise-0001").setValue(1); starFn.property("ADBE Fractal Noise-0003").setValue(1.8); starFn.property("ADBE Fractal Noise-0006").setValue([8,8]); } catch(e){}
    }
    var starMask = stars.Masks.addProperty("Mask");
    try {
      var smShape = new Shape();
      smShape.vertices = [[0,0],[cw,0],[cw,ch*0.55],[0,ch*0.55]];
      smShape.closed = true;
      starMask.property("ADBE Mask Shape").setValue(smShape);
    } catch(e){}
    var starThresh = addFx(stars, "ADBE Threshold2");
    if (starThresh) { try { starThresh.property("ADBE Threshold2-0001").setValue(230); } catch(e){} }
    setBlend(stars, "ADD");
    var starOp = tp(stars, "opacity"); if (starOp) starOp.setValue(80);

    log("synthwaveGrid: sky gradient + horizon glow + perspective grid + stars");
    return sky;
  }

  // ── DUOTONE ─────────────────────────────────────────────────────────────
  function duotone(comp, opts) {
    opts = opts || {};
    var shadowCol = opts.shadowColor || [0.1, 0.0, 0.5];
    var highlightCol = opts.highlightColor || [1, 0.6, 0.0];
    var contrast = opts.contrast || 1.2;
    var layer = findTargetLayer(comp, opts.targetLayer);
    var host = layer || adjustment(comp, "MP_Duotone");
    // Desaturate fully.
    var hsD = addFx(host, "ADBE HUE SATURATION");
    if (hsD) { try { hsD.property("ADBE HUE SATURATION-0003").setValue(-100); } catch(e){} }
    // Contrast boost.
    var bcD = addFx(host, "ADBE Brightness&Contrast2");
    if (bcD) { try { bcD.property("ADBE Brightness&Contrast2-0002").setValue(Math.round((contrast-1)*80)); } catch(e){} }
    // Tint: map black → shadowCol, white → highlightCol.
    var tint = addFx(host, "ADBE Tint");
    if (tint) {
      try { tint.property("ADBE Tint-0001").setValue([shadowCol[0], shadowCol[1], shadowCol[2], 1]); } catch(e){}
      try { tint.property("ADBE Tint-0002").setValue([highlightCol[0], highlightCol[1], highlightCol[2], 1]); } catch(e){}
      try { tint.property("ADBE Tint-0003").setValue(100); } catch(e){}
    }
    // Color balance to fine-tune midtones.
    var cbD = addFx(host, "ADBE Color Balance 2");
    if (cbD) { try { cbD.property("ADBE Color Balance 2-0002").setValue([(highlightCol[0]-shadowCol[0])*20, (highlightCol[1]-shadowCol[1])*20, (highlightCol[2]-shadowCol[2])*20]); } catch(e){} }
    log("duotone: desaturate + tint black/white to two colors");
    return host;
  }

  // ── NOISE TUNNEL (Psychedelic) ──────────────────────────────────────────
  function noiseTunnel(comp, opts) {
    opts = opts || {};
    var col = opts.color || [0.4, 0.0, 1];
    var speed = opts.speed || 1.5;
    var complexity = opts.complexity || 4;
    var dur = opts.duration || comp.duration;
    var t0 = opts.start || 0;
    var cw = comp.width; var ch = comp.height;

    // 3 layers of fractal noise + polar coordinates = infinite tunnel.
    for (var ni = 0; ni < 3; ni++) {
      var ntLayer = solid(comp, [0,0,0], "MP_NoiseTunnel_" + ni, dur);
      ntLayer.startTime = t0;
      var ntFn = addFx(ntLayer, "ADBE Fractal Noise");
      if (ntFn) {
        try { ntFn.property("ADBE Fractal Noise-0001").setValue(ni + 2); } catch(e){}
        try { ntFn.property("ADBE Fractal Noise-0003").setValue(0.5 + ni * 0.15); } catch(e){}
        try { ntFn.property("ADBE Fractal Noise-0006").setValue([100 * Math.pow(1.5, ni), 100 * Math.pow(1.5, ni)]); } catch(e){}
        var ntEvo = ntFn.property("ADBE Fractal Noise-0012");
        if (ntEvo) { ntEvo.setValueAtTime(t0, ni * 0.5); ntEvo.setValueAtTime(t0+dur, ni*0.5 + dur * speed * 0.6); }
      }
      // Polar coordinates transform: linear → radial = tunnel!
      var polar = addFx(ntLayer, "ADBE Polar Coordinates");
      if (polar) {
        try { polar.property("ADBE Polar Coordinates-0001").setValue(100); } catch(e){}  // interpolation 100%
        try { polar.property("ADBE Polar Coordinates-0002").setValue(1); } catch(e){}    // rect to polar
      }
      // Hue shift per layer.
      var ntHs = addFx(ntLayer, "ADBE HUE SATURATION");
      if (ntHs) { try { ntHs.property("ADBE HUE SATURATION-0001").setValue(1); ntHs.property("ADBE HUE SATURATION-0002").setValue(Math.round(ni * 60 + 240)); ntHs.property("ADBE HUE SATURATION-0003").setValue(70); } catch(e){} }
      var ntGlow = addFx(ntLayer, "ADBE Glow");
      if (ntGlow) { try { ntGlow.property("ADBE Glow-0003").setValue(60); ntGlow.property("ADBE Glow-0004").setValue(1.5); } catch(e){} }
      setBlend(ntLayer, ni === 0 ? "NORMAL" : "ADD");
      var ntOp = tp(ntLayer, "opacity"); if (ntOp) ntOp.setValue(60 + ni * 15);
      // Scale drives zoom-in feeling.
      var ntSc = tp(ntLayer, "scale");
      if (ntSc) { ntSc.setValueAtTime(t0, [100,100]); ntSc.setValueAtTime(t0+dur, [100 * Math.pow(1.5, dur*speed*0.1), 100 * Math.pow(1.5, dur*speed*0.1)]); MP.setEase(ntSc,"linear"); }
    }

    // Grade.
    var ntAdj = adjustment(comp, "MP_NoiseTunnel_Grade");
    ntAdj.startTime = t0;
    var ntGrade = addFx(ntAdj, "ADBE CurvesCustom"); if (ntGrade) { try { ntGrade.property("ADBE CurvesCustom-0001").setValue([[0,0],[0.4,0.3],[0.8,1],[1,1]]); } catch(e){} }

    log("noiseTunnel: 3x fractal noise + polar coords = infinite psychedelic tunnel");
    return ntAdj;
  }

  // ── Helper: find a layer by name in the comp ──────────────────────────
  function findTargetLayer(comp, name) {
    if (!name) return null;
    try {
      for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (l.name.indexOf(name) !== -1) return l;
        if (name.charAt(name.length-1) === "_") {
          if (l.name.indexOf(name) === 0) return l;
        }
      }
    } catch(e){}
    return null;
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
    enableMotionBlur: function (comp, opts) { return enableMotionBlur(comp); },
    // ── Premium plugin replicas ──
    trapcodeShine: trapcodeShine,
    trapcodeStarglow: trapcodeStarglow,
    "trapcodeМir": trapcodeМir,
    opticalFlaresHero: opticalFlaresHero,
    saberEnergySlash: saberEnergySlash,
    saberPortal: saberPortal,
    element3dObject: element3dObject,
    element3dProductSpin: element3dProductSpin,
    particularStormCloud: particularStormCloud,
    particularFairyDust: particularFairyDust,
    // ── Wave 3: New cinema effects ──
    cinematicBloom: cinematicBloom,
    depthOfField: depthOfField,
    lensDistortion: lensDistortion,
    inkReveal: inkReveal,
    paintStrokeReveal: paintStrokeReveal,
    // ── Wave 3: New game effects ──
    spawnEffect: spawnEffect,
    healAura: healAura,
    deathDissolve: deathDissolve,
    freezeEffect: freezeEffect,
    // ── Wave 3: New social/ad effects ──
    bounceIn: bounceIn,
    slideTransition: slideTransition,
    stickerPop: stickerPop,
    zoomTransition: zoomTransition,
    productShine360: productShine360,
    glassMorphism: glassMorphism,
    smokeTitleReveal: smokeTitleReveal,
    glitchLogoReveal: glitchLogoReveal,
    // ── Crazy / AE-native original effects ──
    digitalRain: digitalRain,
    pixelSort: pixelSort,
    liquidFill: liquidFill,
    fractalZoom: fractalZoom,
    holographicHud: holographicHud,
    asciiArt: asciiArt,
    thermalCam: thermalCam,
    clothWave: clothWave,
    watercolorPaint: watercolorPaint,
    databend: databend,
    vhsRetro: vhsRetro,
    kaleidoscope: kaleidoscope,
    synthwaveGrid: synthwaveGrid,
    duotone: duotone,
    noiseTunnel: noiseTunnel
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
    ],

    // ★ YENİ PREMIUM + CRAZY COMPOSITE RECIPES ★

    // epicHeroReveal: Element 3D spin + Optical Flares + Shine + Starglow + sweep + grade.
    epicHeroReveal: [
      { fn: "element3dProductSpin", opts: { duration: 5, color: [0.9, 0.92, 1] } },
      { fn: "opticalFlaresHero", opts: { start: 0.5, duration: 2.5, brightness: 90 } },
      { fn: "trapcodeShine", opts: { strength: 3.5, color: [1, 0.9, 0.7] } },
      { fn: "trapcodeStarglow", opts: { streakLength: 20, boost: 1.6 } },
      { fn: "premiumGlow", opts: { strength: 70 } },
      { fn: "lightSweep", opts: { start: 1.5, duration: 1.4 } },
      { fn: "cinematicGrade", opts: {} }
    ],

    // neonCyberpunk: Matrix rain + HUD + neon + glitch + RGB split + duotone.
    neonCyberpunk: [
      { fn: "digitalRain", opts: { columns: 20, color: [0.1, 1, 0.3] } },
      { fn: "holographicHud", opts: { color: [0.1, 0.9, 1], showRadar: true } },
      { fn: "neonGlow", opts: { color: [0.1, 1, 0.8] } },
      { fn: "rgbSplit", opts: { strength: 8 } },
      { fn: "glitch", opts: { duration: 0.5 } },
      { fn: "duotone", opts: { shadowColor: [0.0, 0.0, 0.3], highlightColor: [0.1, 1, 0.4] } }
    ],

    // retroVHSSynthwave: VHS tape + synthwave grid + duotone + light leak + grain + RGB split.
    retroVHSSynthwave: [
      { fn: "synthwaveGrid", opts: { color: [1, 0.2, 0.8], gridColor: [0.5, 0.1, 1] } },
      { fn: "vhsRetro", opts: { tracking: 1.2, noise: 0.7, colorBleed: 1.4, showTimestamp: true } },
      { fn: "duotone", opts: { shadowColor: [0.2, 0.0, 0.4], highlightColor: [1, 0.5, 0.9] } },
      { fn: "lightLeak", opts: { strength: 25, color: [1, 0.3, 0.8] } },
      { fn: "filmGrain", opts: { strength: 10 } },
      { fn: "rgbSplit", opts: { strength: 5 } }
    ],

    // matrixHack: Digital rain + HUD + hologram + databend + cinematic green grade.
    matrixHack: [
      { fn: "digitalRain", opts: { columns: 28, color: [0.05, 1, 0.2], speed: 1.4 } },
      { fn: "holographicHud", opts: { color: [0.05, 0.9, 0.3], showRadar: true } },
      { fn: "hologram", opts: { color: [0.1, 1, 0.3], strength: 75 } },
      { fn: "databend", opts: { intensity: 0.6, blockSize: 30 } },
      { fn: "cinematicGrade", opts: {} }
    ],

    // cosmicStarfield: Starglow + noise tunnel + plexus + fog + grade.
    cosmicStarfield: [
      { fn: "noiseTunnel", opts: { color: [0.3, 0.0, 0.8], speed: 1.2 } },
      { fn: "trapcodeStarglow", opts: { streakLength: 30, boost: 2.0, color: [1, 0.95, 0.8] } },
      { fn: "plexusNetwork", opts: { strength: 40, color: [0.4, 0.6, 1] } },
      { fn: "atmosphericFog", opts: { strength: 30 } },
      { fn: "cinematicGrade", opts: {} }
    ],

    // liquidDream: Liquid fill + water ripple + kaleidoscope + bokeh + watercolor + glow.
    liquidDream: [
      { fn: "liquidFill", opts: { color: [0.1, 0.4, 0.9], waveAmplitude: 15, bubbles: true } },
      { fn: "waterRipple", opts: { strength: 20 } },
      { fn: "kaleidoscope", opts: { segments: 6, rotation: 0.5 } },
      { fn: "watercolorPaint", opts: { bleedAmount: 30, colorSpread: 1.5 } },
      { fn: "bokeh", opts: { strength: 35, color: [0.5, 0.7, 1] } },
      { fn: "premiumGlow", opts: { strength: 60 } }
    ],

    // saberMagicBattle: Saber slash + magic circle + charge + fairy dust + lightning + shockwave.
    saberMagicBattle: [
      { fn: "saberEnergySlash", opts: { start: 0, color: [0.2, 0.9, 1], glowIntensity: 3.5 } },
      { fn: "magicCircle", opts: { start: 0.2, color: [0.6, 0.4, 1] } },
      { fn: "chargeUp", opts: { start: 0, duration: 1.2, color: [0.4, 0.8, 1] } },
      { fn: "particularFairyDust", opts: { color: [0.8, 0.6, 1], strength: 250 } },
      { fn: "lightningBolt", opts: { start: 1.0, duration: 0.5, color: [0.7, 0.5, 1] } },
      { fn: "shockwave", opts: { start: 1.1, duration: 0.8, color: [0.7, 0.5, 1], strength: 18 } },
      { fn: "energyBurst", opts: { start: 1.0, duration: 1.0, color: [0.5, 0.3, 1] } }
    ],

    // glitchArtHero: Pixel sort + databend + ASCII art + RGB split + glitch.
    glitchArtHero: [
      { fn: "pixelSort", opts: { duration: 2, angle: 0, strength: 90 } },
      { fn: "databend", opts: { intensity: 0.8, blockSize: 50, channelDropout: true } },
      { fn: "asciiArt", opts: { cellSize: 10, contrast: 1.6 } },
      { fn: "rgbSplit", opts: { strength: 10 } },
      { fn: "glitch", opts: { duration: 0.6 } },
      { fn: "kineticPop", opts: {} }
    ],

    // ★ WAVE 3 COMPOSITES ★
    epicBattleScene: [
      { fn: "magicCircle", opts: { start: 0, color: [0.6, 0.3, 1] } },
      { fn: "chargeUp", opts: { start: 0.2, duration: 1.2, color: [0.4, 0.7, 1] } },
      { fn: "saberEnergySlash", opts: { start: 1.0, color: [0.2, 0.9, 1] } },
      { fn: "saberEnergySlash", opts: { start: 1.3, color: [1, 0.4, 0.1] } },
      { fn: "lightningBolt", opts: { start: 1.5, duration: 0.5, color: [0.8, 0.9, 1] } },
      { fn: "shockwave", opts: { start: 1.6, duration: 0.9, strength: 25 } },
      { fn: "energyBurst", opts: { start: 1.5, duration: 1.2, color: [0.5, 0.3, 1] } },
      { fn: "energyBurst", opts: { start: 2.0, duration: 1.0, color: [1, 0.5, 0.1] } },
      { fn: "cinematicGrade", opts: {} }
    ],
    productLaunchHero: [
      { fn: "element3dProductSpin", opts: { duration: 5, color: [1, 1, 1] } },
      { fn: "productShine360", opts: { duration: 4, intensity: 55 } },
      { fn: "opticalFlaresHero", opts: { start: 0.5, duration: 3.0, brightness: 85 } },
      { fn: "trapcodeStarglow", opts: { streakLength: 22, boost: 1.8 } },
      { fn: "trapcodeShine", opts: { strength: 4.0, color: [1, 0.9, 0.7] } },
      { fn: "cinematicBloom", opts: { strength: 0.9, radius: 70 } },
      { fn: "premiumGlow", opts: { strength: 65 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    dreamSequence: [
      { fn: "depthOfField", opts: { blurAmount: 15 } },
      { fn: "atmosphericFog", opts: { strength: 30 } },
      { fn: "bokeh", opts: { strength: 35, color: [1, 0.9, 0.8] } },
      { fn: "lightLeak", opts: { strength: 22, color: [1, 0.7, 0.4] } },
      { fn: "lightLeak", opts: { start: 2, strength: 18, color: [0.8, 0.6, 1] } },
      { fn: "watercolorPaint", opts: { bleedAmount: 20 } },
      { fn: "cinematicBloom", opts: { strength: 0.7, radius: 100 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    naturalDisaster: [
      { fn: "rainStorm", opts: { strength: 12000 } },
      { fn: "lightningBolt", opts: { start: 0.5, duration: 0.35, color: [0.9, 0.9, 1] } },
      { fn: "lightningBolt", opts: { start: 1.8, duration: 0.3, color: [0.8, 0.85, 1] } },
      { fn: "lightningBolt", opts: { start: 3.2, duration: 0.4, color: [1, 0.9, 0.8] } },
      { fn: "atmosphericFog", opts: { strength: 50 } },
      { fn: "shockwave", opts: { start: 0, duration: 1.2, strength: 20 } },
      { fn: "energyBurst", opts: { start: 0.05, duration: 1.5, color: [1, 0.6, 0.2] } },
      { fn: "cinematicGrade", opts: {} }
    ],
    sunriseScene: [
      { fn: "trapcodeShine", opts: { strength: 5.0, color: [1, 0.85, 0.5], sourcePoint: null } },
      { fn: "lightLeak", opts: { strength: 30, color: [1, 0.75, 0.3] } },
      { fn: "lightLeak", opts: { start: 1, strength: 20, color: [1, 0.55, 0.2] } },
      { fn: "atmosphericFog", opts: { strength: 25 } },
      { fn: "bokeh", opts: { strength: 28, color: [1, 0.9, 0.7] } },
      { fn: "cinematicBloom", opts: { strength: 0.8, radius: 90 } },
      { fn: "filmGrain", opts: { strength: 5 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    underseaWorld: [
      { fn: "waterRipple", opts: { strength: 22 } },
      { fn: "atmosphericFog", opts: { strength: 35 } },
      { fn: "bokeh", opts: { strength: 30, color: [0.4, 0.7, 1] } },
      { fn: "lightRays", opts: { strength: 80 } },
      { fn: "confetti", opts: { color: [0.6, 0.9, 1] } },
      { fn: "cinematicBloom", opts: { strength: 0.6 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    hackingSequence: [
      { fn: "digitalRain", opts: { columns: 30, color: [0.05, 1, 0.2], speed: 1.4 } },
      { fn: "holographicHud", opts: { color: [0.05, 0.9, 0.3], showRadar: true } },
      { fn: "hologram", opts: { color: [0.1, 1, 0.3], strength: 75 } },
      { fn: "databend", opts: { intensity: 0.7, blockSize: 35 } },
      { fn: "pixelSort", opts: { strength: 70 } },
      { fn: "glitch", opts: { duration: 0.5 } },
      { fn: "cinematicGrade", opts: {} }
    ],
    galaxyFlythrough: [
      { fn: "noiseTunnel", opts: { color: [0.3, 0.1, 0.8], speed: 1.3 } },
      { fn: "trapcodeStarglow", opts: { streakLength: 35, boost: 2.2, color: [1, 0.95, 0.8] } },
      { fn: "plexusNetwork", opts: { strength: 38, color: [0.4, 0.6, 1] } },
      { fn: "atmosphericFog", opts: { strength: 28 } },
      { fn: "cinematicBloom", opts: { strength: 0.9, radius: 100 } },
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
