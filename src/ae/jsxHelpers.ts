/**
 * ExtendScript (After Effects JSX) helper library, embedded as a string so it
 * can be prepended to every generated script. These functions are pure
 * ExtendScript (ES3) — no modern JS syntax.
 *
 * Exposed helpers (per spec):
 *  findLayersByPattern, setEase, addPositionAnimation, addScaleAnimation,
 *  addOpacityAnimation, addRotationAnimation, addBlurAnimation, addMaskReveal,
 *  addTextRangeReveal, addParallax, addStaggeredReveal, addLightSweep,
 *  addAmbientGlow, addCameraPush, protectTextLayer, saveProject
 */
export const JSX_HELPERS = String.raw`
// ===== MotionPilot AE helper library (ExtendScript / ES3) =====
var MP = (function () {
  var LOG = [];
  function log(m) { LOG.push(String(m)); }

  // --- easing presets -> [influence, speed]
  function easePreset(name) {
    switch (String(name)) {
      case "expoOut":   return { inf: 80, type: "out" };
      case "backOut":   return { inf: 70, type: "out" };
      case "quadOut":   return { inf: 55, type: "out" };
      case "sineInOut": return { inf: 45, type: "both" };
      case "quadInOut": return { inf: 50, type: "both" };
      case "elasticOut":return { inf: 85, type: "out" };
      case "linear":    return { inf: 0.1, type: "linear" };
      default:           return { inf: 60, type: "out" };
    }
  }

  // Apply temporal ease to every keyframe on a property.
  // AE quirk: spatial properties (Position) need a SINGLE ease element regardless
  // of value dimensions, while separable multi-dim props (Scale) need one per
  // dimension. We try 1-element first, then fall back to N-element.
  function makeEaseArray(count, inf) {
    var a = [];
    for (var d = 0; d < count; d++) a.push(new KeyframeEase(0, inf));
    return a;
  }
  function setEase(prop, easeName) {
    var p = easePreset(easeName);
    if (p.type === "linear") { return; }
    var n = prop.numKeys;
    var dim = prop.value instanceof Array ? prop.value.length : 1;
    for (var i = 1; i <= n; i++) {
      var done = false;
      // Attempt 1: single ease element (spatial position + all 1D properties).
      try {
        prop.setTemporalEaseAtKey(i, makeEaseArray(1, p.inf), makeEaseArray(1, p.inf));
        done = true;
      } catch (e1) {}
      // Attempt 2: one ease element per value dimension (separable scale, etc).
      if (!done && dim > 1) {
        try {
          prop.setTemporalEaseAtKey(i, makeEaseArray(dim, p.inf), makeEaseArray(dim, p.inf));
          done = true;
        } catch (e2) {}
      }
      if (!done) log("ease skip key " + i + " on " + prop.name);
    }
  }

  // Match layers in a comp by exact name or "Prefix_" wildcard (trailing match).
  function findLayersByPattern(comp, pattern) {
    var res = [];
    var isWild = pattern.charAt(pattern.length - 1) === "_" ||
                 pattern.indexOf("*") >= 0;
    var clean = pattern.replace(/\*/g, "");
    for (var i = 1; i <= comp.numLayers; i++) {
      var ly = comp.layer(i);
      var nm = ly.name;
      if (isWild) {
        if (nm.length >= clean.length &&
            nm.substring(0, clean.length).toLowerCase() === clean.toLowerCase()) {
          res.push(ly);
        }
      } else if (nm === pattern) {
        res.push(ly);
      }
    }
    return res;
  }

  function getPos(layer) {
    var p = layer.property("ADBE Transform Group").property("ADBE Position");
    return p.value;
  }

  function addPositionAnimation(layer, fromOffset, t0, dur, easeName) {
    var tg = layer.property("ADBE Transform Group");
    var pos = tg.property("ADBE Position");
    var base = pos.value;
    var start = [base[0] + fromOffset[0], base[1] + fromOffset[1]];
    pos.setValueAtTime(t0, start);
    pos.setValueAtTime(t0 + dur, base);
    setEase(pos, easeName);
  }

  function addScaleAnimation(layer, fromScale, toScale, t0, dur, easeName) {
    var sc = layer.property("ADBE Transform Group").property("ADBE Scale");
    sc.setValueAtTime(t0, [fromScale, fromScale]);
    sc.setValueAtTime(t0 + dur, [toScale, toScale]);
    setEase(sc, easeName);
  }

  function addOpacityAnimation(layer, fromOp, toOp, t0, dur, easeName) {
    var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
    op.setValueAtTime(t0, fromOp);
    op.setValueAtTime(t0 + dur, toOp);
    setEase(op, easeName);
  }

  function addRotationAnimation(layer, fromDeg, toDeg, t0, dur, easeName) {
    var rot = layer.property("ADBE Transform Group").property("ADBE Rotate Z");
    rot.setValueAtTime(t0, fromDeg);
    rot.setValueAtTime(t0 + dur, toDeg);
    setEase(rot, easeName);
  }

  // Animated Gaussian blur in -> 0 for cinematic depth on entrances.
  function addBlurAnimation(layer, fromBlur, toBlur, t0, dur, easeName) {
    var fx = layer.property("ADBE Effect Parade");
    var blur = fx.addProperty("ADBE Gaussian Blur 2");
    var amt = blur.property("ADBE Gaussian Blur 2-0001");
    amt.setValueAtTime(t0, fromBlur);
    amt.setValueAtTime(t0 + dur, toBlur);
    setEase(amt, easeName);
  }

  // Linear wipe used as a mask-style reveal (non-destructive, keeps text sharp).
  function addMaskReveal(layer, direction, t0, dur, easeName) {
    var fx = layer.property("ADBE Effect Parade");
    var wipe = fx.addProperty("ADBE Linear Wipe");
    var comp = layer.containingComp;
    var ang = 270; // reveal from left
    if (direction === "top") ang = 180;
    else if (direction === "bottom") ang = 0;
    else if (direction === "right") ang = 90;
    wipe.property("ADBE Linear Wipe-0002").setValue(ang);
    var prog = wipe.property("ADBE Linear Wipe-0001");
    prog.setValueAtTime(t0, 100);
    prog.setValueAtTime(t0 + dur, 0);
    setEase(prog, easeName);
  }

  // Text Animator range-selector reveal (Opacity 0->100), keeps source text intact.
  function addTextRangeReveal(layer, t0, dur, easeName) {
    try {
      var animators = layer.property("ADBE Text Properties").property("ADBE Text Animators");
      var anim = animators.addProperty("ADBE Text Animator");
      anim.name = "MP Reveal";
      var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
      var props = anim.property("ADBE Text Animator Properties");
      var op = props.addProperty("ADBE Text Opacity");
      op.setValue(0);
      var startSel = sel.property("ADBE Text Percent Start");
      startSel.setValueAtTime(t0, 0);
      startSel.setValueAtTime(t0 + dur, 100);
      setEase(startSel, easeName);
    } catch (e) {
      log("textRangeReveal fallback to opacity: " + e.toString());
      addOpacityAnimation(layer, 0, 100, t0, dur, easeName);
    }
  }

  // Slow positional drift for parallax depth across the whole comp.
  function addParallax(layer, strengthPx, t0, dur, easeName) {
    var pos = layer.property("ADBE Transform Group").property("ADBE Position");
    var base = pos.value;
    pos.setValueAtTime(t0, [base[0] - strengthPx * 0.5, base[1]]);
    pos.setValueAtTime(t0 + dur, [base[0] + strengthPx * 0.5, base[1]]);
    setEase(pos, easeName);
  }

  // Apply a pop (scale+opacity) reveal to an array of layers with stagger.
  function addStaggeredReveal(layers, t0, dur, stagger, easeName) {
    for (var i = 0; i < layers.length; i++) {
      var ly = layers[i];
      var st = t0 + i * stagger;
      addOpacityAnimation(ly, 0, 100, st, dur * 0.8, easeName);
      addScaleAnimation(ly, 80, 100, st, dur, easeName);
    }
  }

  // Light sweep: a soft CC Light Sweep effect animated across the layer.
  function addLightSweep(layer, t0, dur, easeName) {
    var fx = layer.property("ADBE Effect Parade");
    var sweep;
    try { sweep = fx.addProperty("CC Light Sweep"); }
    catch (e) { log("CC Light Sweep unavailable: " + e.toString()); return; }
    var center = sweep.property("Center");
    if (center) {
      var w = layer.containingComp.width;
      center.setValueAtTime(t0, [-w * 0.2, layer.height / 2]);
      center.setValueAtTime(t0 + dur, [w * 1.2, layer.height / 2]);
      setEase(center, easeName);
    }
  }

  function addAmbientGlow(layer, t0, dur, strength, easeName) {
    var fx = layer.property("ADBE Effect Parade");
    var glow;
    try { glow = fx.addProperty("ADBE Glow"); }
    catch (e) { log("Glow unavailable: " + e.toString()); return; }
    var radius = glow.property("ADBE Glow-0003");
    var intensity = glow.property("ADBE Glow-0004");
    if (radius) radius.setValue(Math.max(12, strength || 35));
    if (intensity) {
      intensity.setValueAtTime(t0, 0);
      intensity.setValueAtTime(t0 + dur * 0.5, Math.max(0.35, (strength || 35) / 100));
      intensity.setValueAtTime(t0 + dur, 0.12);
      setEase(intensity, easeName);
    }
  }

  function addCameraPush(comp, t0, dur, zoomDelta, easeName) {
    try {
      var cam = null;
      for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i) instanceof CameraLayer) { cam = comp.layer(i); break; }
      }
      if (!cam) {
        cam = comp.layers.addCamera("MP Camera Push", [comp.width / 2, comp.height / 2]);
        cam.property("ADBE Transform Group").property("ADBE Position").setValue([comp.width / 2, comp.height / 2, -1200]);
      }
      var zoom = cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom");
      var base = zoom.value;
      zoom.setValueAtTime(t0, base);
      zoom.setValueAtTime(t0 + dur, base + (zoomDelta || 120));
      setEase(zoom, easeName);
      log("Camera push added to " + comp.name);
    } catch (e) {
      log("cameraPush failed: " + e.toString());
    }
  }

  // Mark a layer so we never touch its source text.
  function protectTextLayer(layer) {
    try {
      layer.comment = (layer.comment ? layer.comment + " " : "") + "[MP:TEXT_PROTECTED]";
    } catch (e) {}
  }

  function saveProject(path) {
    var f = new File(path);
    var folder = f.parent;
    if (!folder.exists) folder.create();
    app.project.save(f);
    log("Saved project: " + path);
    return f.fsName;
  }

  function quoteJsonString(s) {
    return '"' + String(s)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t") + '"';
  }

  function toJson(value) {
    if (value === null) return "null";
    var t = typeof value;
    if (t === "string") return quoteJsonString(value);
    if (t === "number" || t === "boolean") return String(value);
    if (value instanceof Array) {
      var arr = [];
      for (var i = 0; i < value.length; i++) arr.push(toJson(value[i]));
      return "[" + arr.join(",") + "]";
    }
    if (t === "object") {
      var parts = [];
      for (var k in value) {
        if (value.hasOwnProperty(k) && typeof value[k] !== "undefined") {
          parts.push(quoteJsonString(k) + ":" + toJson(value[k]));
        }
      }
      return "{" + parts.join(",") + "}";
    }
    return "null";
  }

  // Safely get or add an effect on a layer using matchName (language-independent)
  function getOrAddEffect(layer, effectMatchName) {
    var fx = layer.property("ADBE Effect Parade") ||
             layer.property("Effects") ||
             layer.property("Efekt") ||
             layer.property("Effekt");
    if (!fx) return null;

    // Check if it already exists
    for (var i = 1; i <= fx.numProperties; i++) {
      if (fx.property(i).matchName === effectMatchName) {
        return fx.property(i);
      }
    }

    // If not, add it
    try {
      return fx.addProperty(effectMatchName);
    } catch (e) {
      log("Failed to add effect matchName " + effectMatchName + ": " + e.toString());
    }
    return null;
  }

  // Safely set an effect property value by its 1-indexed position (language-independent)
  function setEffectValue(effect, propIndex, value) {
    if (!effect) return false;
    try {
      var prop = effect.property(propIndex);
      if (prop) {
        prop.setValue(value);
        return true;
      }
    } catch (e) {
      log("Failed to set effect property index " + propIndex + ": " + e.toString());
    }
    return false;
  }

  // Set custom cubic-bezier easing curves on keyframes (speed, influence)
  function setCustomBezierEase(prop, inSpeed, inInfluence, outSpeed, outInfluence) {
    var n = prop.numKeys;
    var dim = prop.value instanceof Array ? prop.value.length : 1;
    for (var i = 1; i <= n; i++) {
      try {
        var ei = new KeyframeEase(inSpeed, inInfluence);
        var eo = new KeyframeEase(outSpeed, outInfluence);
        prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
          prop.setTemporalEaseAtKey(i, [ei, ei, ei], [eo, eo, eo]);
        } else if (prop.value instanceof Array && prop.value.length === 3) {
          prop.setTemporalEaseAtKey(i, [ei, ei, ei], [eo, eo, eo]);
        } else if (prop.value instanceof Array && prop.value.length === 2) {
          prop.setTemporalEaseAtKey(i, [ei, ei], [eo, eo]);
        } else {
          prop.setTemporalEaseAtKey(i, [ei], [eo]);
        }
      } catch (e) {
        log("Failed to apply custom ease on " + prop.name + " key " + i);
      }
    }
  }

  // Add an elegant text range animator for character-level fade/scale/slide
  function addTextCharacterAnimator(layer, animName, t0, dur, properties, easeName) {
    try {
      var animators = layer.property("ADBE Text Properties").property("ADBE Text Animators");
      var anim = animators.addProperty("ADBE Text Animator");
      anim.name = animName || "MP Character Animator";

      var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
      var props = anim.property("ADBE Text Animator Properties");

      if (properties.opacity !== undefined) {
        props.addProperty("ADBE Text Opacity").setValue(properties.opacity);
      }
      if (properties.scale !== undefined) {
        props.addProperty("ADBE Text Scale").setValue([properties.scale, properties.scale]);
      }
      if (properties.position !== undefined) {
        props.addProperty("ADBE Text Position").setValue(properties.position);
      }

      var startSel = sel.property("ADBE Text Percent Start");
      startSel.setValueAtTime(t0, 0);
      startSel.setValueAtTime(t0 + dur, 100);
      setEase(startSel, easeName || "quadOut");
      log("Added character text animator to: " + layer.name);
    } catch (e) {
      log("Failed to add text character animator: " + e.toString());
    }
  }

  // Apply Lumetri Color LUT to a layer (e.g. adjustment layer)
  function applyLUT(layer, lutPath) {
    var fx = getOrAddEffect(layer, "Adobe Lumetri Color");
    if (!fx) {
      fx = getOrAddEffect(layer, "Lumetri Color");
    }
    if (fx) {
      try {
        var basic = fx.property("ADBE Lumetri Color-0001") || fx.property(1);
        if (basic) {
          var inputLut = basic.property("ADBE Lumetri Color-0002") || basic.property(3);
          if (inputLut) {
            inputLut.setValue(lutPath);
            log("Applied LUT " + lutPath + " to layer: " + layer.name);
            return true;
          }
        }
      } catch (e) {
        log("Failed to apply LUT path to Lumetri Color: " + e.toString());
      }
    }
    return false;
  }

  return {
    log: log, getLog: function () { return LOG.join("\n"); },
    setEase: setEase,
    findLayersByPattern: findLayersByPattern,
    addPositionAnimation: addPositionAnimation,
    addScaleAnimation: addScaleAnimation,
    addOpacityAnimation: addOpacityAnimation,
    addRotationAnimation: addRotationAnimation,
    addBlurAnimation: addBlurAnimation,
    addMaskReveal: addMaskReveal,
    addTextRangeReveal: addTextRangeReveal,
    addParallax: addParallax,
    addStaggeredReveal: addStaggeredReveal,
    addLightSweep: addLightSweep,
    addAmbientGlow: addAmbientGlow,
    addCameraPush: addCameraPush,
    protectTextLayer: protectTextLayer,
    saveProject: saveProject,
    toJson: toJson,
    getPos: getPos,
    getOrAddEffect: getOrAddEffect,
    setEffectValue: setEffectValue,
    setCustomBezierEase: setCustomBezierEase,
    addTextCharacterAnimator: addTextCharacterAnimator,
    applyLUT: applyLUT
  };
})();
`;
