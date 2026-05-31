import { JSX_HELPERS } from "./jsxHelpers.js";
import { VFX_HELPERS } from "./vfxHelpers.js";

/* ------------------------------------------------------------------ */
/*  TS-side helpers (identical to vfxGenerator.ts)                    */
/* ------------------------------------------------------------------ */

function jstr(s: string): string {
  return JSON.stringify(String(s));
}
function jsonLiteral(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Result-reporting preamble, including BOTH the base and VFX JSX libraries. */
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

/* ------------------------------------------------------------------ */
/*  Public interfaces                                                 */
/* ------------------------------------------------------------------ */

export interface VideoCompositionPlan {
  /** Composition settings */
  composition: {
    name: string;
    width: number;
    height: number;
    duration: number;
    fps: number;
  };
  /** Background settings */
  background: {
    type: "gradient" | "solid" | "fractalNoise";
    colors: [number, number, number][]; // RGB 0..1
    evolution?: boolean; // animate fractal noise
  };
  /** Title cards to create */
  titleCards: Array<{
    text: string;
    position: "center" | "lower-third" | "upper" | "custom";
    customPosition?: [number, number];
    fontSize: number;
    fontFamily?: string;
    color: [number, number, number]; // RGB 0..1
    startTime: number;
    duration: number;
    animation:
      | "fadeIn"
      | "slideUp"
      | "slideLeft"
      | "typewriter"
      | "scaleReveal"
      | "blurReveal"
      | "maskWipe";
    /** Optional background bar behind text */
    backgroundBar?: {
      color: [number, number, number];
      opacity: number; // 0..100
      padding: number;
    };
  }>;
  /** Transitions between segments */
  transitions: Array<{
    type:
      | "light-leak"
      | "whip-pan"
      | "zoom-push"
      | "dissolve"
      | "flash"
      | "glitch-cut"
      | "blur-transition";
    time: number; // when transition occurs
    duration: number;
    color?: [number, number, number];
  }>;
  /** Color grading */
  colorGrade?: {
    profile: string; // teal-orange, cold-blue, warm-golden, etc.
    intensity: number; // 0..100
    vignette: boolean;
    filmGrain: boolean;
  };
  /** Camera animation (3D) */
  camera?: {
    type:
      | "dolly-in"
      | "dolly-out"
      | "crane-up"
      | "crane-down"
      | "orbit"
      | "push-in"
      | "pull-out"
      | "static";
    strength: number; // movement intensity
    startTime: number;
    duration: number;
  };
  /** VFX polish to apply (uses existing MPVFX) */
  polish?: {
    bokeh?: boolean;
    lightLeak?: boolean;
    filmGrain?: boolean;
    lensFlare?: boolean;
    atmosphericFog?: boolean;
  };
}

export interface VideoPackageToAeOpts {
  outputAepPath: string;
  packageData: any; // The output from buildVideoPromptPackage
  compName?: string;
}

/* ------------------------------------------------------------------ */
/*  JSX code-gen helpers (produce ES3-safe ExtendScript strings)       */
/* ------------------------------------------------------------------ */

/**
 * Generates the ExtendScript block that creates the background layer
 * (gradient solid, plain solid, or fractal noise with optional evolution).
 */
function genBackgroundJsx(bg: VideoCompositionPlan["background"]): string {
  var lines: string[] = [];
  lines.push("    // --- Background ---");

  if (bg.type === "solid") {
    lines.push(
      "    var bgColor = " + jsonLiteral(bg.colors[0] || [0, 0, 0]) + ";"
    );
    lines.push(
      '    var bgLayer = comp.layers.addSolid(bgColor, "Background", comp.width, comp.height, 1, comp.duration);'
    );
    lines.push("    bgLayer.locked = true;");
    lines.push('    MP.log("Background: solid");');
  } else if (bg.type === "gradient") {
    var topColor = bg.colors[0] || [0.1, 0.1, 0.15];
    var botColor = bg.colors[1] || [0.05, 0.05, 0.08];
    lines.push(
      '    var bgLayer = comp.layers.addSolid([0,0,0], "Background", comp.width, comp.height, 1, comp.duration);'
    );
    lines.push(
      '    var ramp = bgLayer.property("ADBE Effect Parade").addProperty("ADBE Ramp");'
    );
    lines.push("    if (ramp) {");
    lines.push("      try {");
    lines.push(
      '        ramp.property("ADBE Ramp-0001").setValue([comp.width/2, 0]);'
    ); // start point
    lines.push(
      '        ramp.property("ADBE Ramp-0002").setValue(' +
        jsonLiteral(topColor) +
        ");"
    ); // start color
    lines.push(
      '        ramp.property("ADBE Ramp-0003").setValue([comp.width/2, comp.height]);'
    ); // end point
    lines.push(
      '        ramp.property("ADBE Ramp-0004").setValue(' +
        jsonLiteral(botColor) +
        ");"
    ); // end color
    lines.push(
      '        ramp.property("ADBE Ramp-0005").setValue(1);'
    ); // radial=1, linear=0 — use linear
    // Actually linear is 0
    lines.pop();
    lines.push(
      '        ramp.property("ADBE Ramp-0005").setValue(0);'
    );
    lines.push("      } catch (eRamp) {}");
    lines.push("    }");
    lines.push("    bgLayer.locked = true;");
    lines.push('    MP.log("Background: gradient");');
  } else {
    // fractalNoise
    var baseColor = bg.colors[0] || [0.08, 0.08, 0.12];
    lines.push(
      "    var bgSolidColor = " + jsonLiteral(baseColor) + ";"
    );
    lines.push(
      '    var bgLayer = comp.layers.addSolid(bgSolidColor, "Background", comp.width, comp.height, 1, comp.duration);'
    );
    lines.push(
      '    var fn = bgLayer.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");'
    );
    lines.push("    if (fn) {");
    lines.push("      try {");
    lines.push(
      '        var fnContrast = fn.property("ADBE Fractal Noise-0005"); if (fnContrast) fnContrast.setValue(45);'
    );
    lines.push(
      '        var fnBright = fn.property("ADBE Fractal Noise-0006"); if (fnBright) fnBright.setValue(-60);'
    );
    lines.push(
      '        var fnScale = fn.property("ADBE Fractal Noise-0013"); if (fnScale) fnScale.setValue(600);'
    );
    if (bg.evolution !== false) {
      lines.push(
        '        var fnEvo = fn.property("ADBE Fractal Noise-0017"); if (fnEvo) fnEvo.expression = "time*8;";'
      );
      lines.push(
        '        var fnOff = fn.property("ADBE Fractal Noise-0014"); if (fnOff) fnOff.expression = "[value[0]+time*6, value[1]+time*2];";'
      );
    }
    lines.push("      } catch (eFN) {}");
    lines.push("    }");
    // Blend mode overlay so the base colour shows through
    lines.push(
      '    try { bgLayer.blendingMode = BlendingMode.NORMAL; } catch (e) {}'
    );
    lines.push('    MP.log("Background: fractalNoise");');
  }
  return lines.join("\n");
}

/**
 * Position resolver — returns an ES3 expression that evaluates to [x, y].
 */
function positionExpr(
  pos: "center" | "lower-third" | "upper" | "custom",
  custom?: [number, number]
): string {
  switch (pos) {
    case "center":
      return "[comp.width/2, comp.height/2]";
    case "lower-third":
      return "[comp.width/2, comp.height*0.82]";
    case "upper":
      return "[comp.width/2, comp.height*0.18]";
    case "custom":
      if (custom) return jsonLiteral(custom);
      return "[comp.width/2, comp.height/2]";
    default:
      return "[comp.width/2, comp.height/2]";
  }
}

/**
 * Generates ExtendScript for creating a single title card with its animation.
 */
function genTitleCardJsx(
  card: VideoCompositionPlan["titleCards"][number],
  index: number
): string {
  var lines: string[] = [];
  var varPrefix = "tc" + index;
  var layerName = "Title " + (index + 1);

  lines.push("    // --- Title Card " + (index + 1) + " ---");

  // Background bar (created first so it sits behind text)
  if (card.backgroundBar) {
    var barVar = varPrefix + "Bar";
    lines.push(
      "    var " +
        barVar +
        ' = comp.layers.addSolid(' +
        jsonLiteral(card.backgroundBar.color) +
        ', "' +
        layerName +
        ' Bar", comp.width, comp.height, 1, ' +
        card.duration +
        ");"
    );
    lines.push("    " + barVar + ".startTime = " + card.startTime + ";");
    lines.push(
      "    " +
        barVar +
        ".outPoint = " +
        (card.startTime + card.duration) +
        ";"
    );
    lines.push(
      "    " +
        barVar +
        '.property("ADBE Transform Group").property("ADBE Opacity").setValue(' +
        card.backgroundBar.opacity +
        ");"
    );
    lines.push(
      "    " +
        barVar +
        '.property("ADBE Transform Group").property("ADBE Position").setValue(' +
        positionExpr(card.position, card.customPosition) +
        ");"
    );
    // Scale bar to approximate text height + padding
    var barScaleY = Math.max(
      6,
      Math.round((card.fontSize + card.backgroundBar.padding * 2) / 10)
    );
    lines.push(
      "    " +
        barVar +
        '.property("ADBE Transform Group").property("ADBE Scale").setValue([100, ' +
        barScaleY +
        "]);"
    );
  }

  // Text layer
  lines.push(
    "    var " +
      varPrefix +
      ' = comp.layers.addText(' +
      jstr(card.text) +
      ");"
  );
  lines.push("    " + varPrefix + '.name = "' + layerName + '";');
  lines.push("    " + varPrefix + ".startTime = " + card.startTime + ";");
  lines.push(
    "    " +
      varPrefix +
      ".outPoint = " +
      (card.startTime + card.duration) +
      ";"
  );

  // Source text styling
  lines.push("    (function () {");
  lines.push(
    '      var srcText = ' +
      varPrefix +
      '.property("ADBE Text Properties").property("ADBE Text Document");'
  );
  lines.push("      var doc = srcText.value;");
  lines.push("      doc.fontSize = " + card.fontSize + ";");
  lines.push(
    "      doc.fillColor = " + jsonLiteral(card.color) + ";"
  );
  if (card.fontFamily) {
    lines.push("      try { doc.font = " + jstr(card.fontFamily) + "; } catch (eFont) {}");
  }
  lines.push('      doc.justification = ParagraphJustification.CENTER_JUSTIFY;');
  lines.push("      srcText.setValue(doc);");
  lines.push("    })();");

  // Position
  lines.push(
    "    " +
      varPrefix +
      '.property("ADBE Transform Group").property("ADBE Position").setValue(' +
      positionExpr(card.position, card.customPosition) +
      ");"
  );

  // Protect text layer
  lines.push("    MP.protectTextLayer(" + varPrefix + ");");

  // Animation
  var t0 = String(card.startTime);
  var animDur = "0.6"; // default animation duration

  switch (card.animation) {
    case "fadeIn":
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", " +
          animDur +
          ', "expoOut");'
      );
      break;
    case "slideUp":
      lines.push(
        "    MP.addPositionAnimation(" +
          varPrefix +
          ", [0, 80], " +
          t0 +
          ", " +
          animDur +
          ', "expoOut");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", 0.35, " +
          '"quadOut");'
      );
      break;
    case "slideLeft":
      lines.push(
        "    MP.addPositionAnimation(" +
          varPrefix +
          ", [-120, 0], " +
          t0 +
          ", " +
          animDur +
          ', "expoOut");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", 0.35, " +
          '"quadOut");'
      );
      break;
    case "typewriter":
      lines.push(
        "    MP.addTextRangeReveal(" +
          varPrefix +
          ", " +
          t0 +
          ", 0.8, " +
          '"linear");'
      );
      break;
    case "scaleReveal":
      lines.push(
        "    MP.addScaleAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", " +
          animDur +
          ', "backOut");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", 0.3, " +
          '"quadOut");'
      );
      break;
    case "blurReveal":
      lines.push(
        "    MP.addBlurAnimation(" +
          varPrefix +
          ", 30, 0, " +
          t0 +
          ", " +
          animDur +
          ', "expoOut");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          t0 +
          ", 0.4, " +
          '"quadOut");'
      );
      break;
    case "maskWipe":
      lines.push(
        "    MP.addMaskReveal(" +
          varPrefix +
          ', "left", ' +
          t0 +
          ", " +
          animDur +
          ', "expoOut");'
      );
      break;
  }

  // Fade-out at end of card
  var fadeOutStart = card.startTime + card.duration - 0.4;
  lines.push(
    "    MP.addOpacityAnimation(" +
      varPrefix +
      ", 100, 0, " +
      fadeOutStart +
      ', 0.4, "quadOut");'
  );

  // Fade out bar too if present
  if (card.backgroundBar) {
    lines.push(
      "    MP.addOpacityAnimation(" +
        varPrefix +
        "Bar, " +
        card.backgroundBar.opacity +
        ", 0, " +
        fadeOutStart +
        ', 0.4, "quadOut");'
    );
  }

  lines.push(
    '    MP.log("Title card ' + (index + 1) + ": " + card.animation + '");'
  );
  return lines.join("\n");
}

/**
 * Generates ExtendScript for creating a single transition effect.
 */
function genTransitionJsx(
  tr: VideoCompositionPlan["transitions"][number],
  index: number
): string {
  var lines: string[] = [];
  var varPrefix = "trans" + index;
  lines.push("    // --- Transition " + (index + 1) + ": " + tr.type + " ---");

  switch (tr.type) {
    case "light-leak": {
      var col = tr.color || [1, 0.85, 0.5];
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid(' +
          jsonLiteral(col) +
          ', "Light Leak ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      lines.push(
        "    try { " +
          varPrefix +
          ".blendingMode = BlendingMode.ADD; } catch (e) {}"
      );
      // Opacity ramp: 0 -> 80 -> 0
      var peakTime = tr.time + tr.duration * 0.4;
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 80, " +
          tr.time +
          ", " +
          (tr.duration * 0.4) +
          ', "expoOut");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 80, 0, " +
          peakTime +
          ", " +
          (tr.duration * 0.6) +
          ', "quadOut");'
      );
      // Fractal noise for organic texture
      lines.push("    (function () {");
      lines.push(
        '      var fn = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");'
      );
      lines.push("      if (fn) {");
      lines.push("        try {");
      lines.push(
        '          fn.property("ADBE Fractal Noise-0005").setValue(120);'
      ); // contrast
      lines.push(
        '          fn.property("ADBE Fractal Noise-0006").setValue(30);'
      ); // brightness
      lines.push(
        '          fn.property("ADBE Fractal Noise-0013").setValue(350);'
      ); // scale
      lines.push(
        '          var evo = fn.property("ADBE Fractal Noise-0017"); if (evo) evo.expression = "time*60;";'
      );
      lines.push("        } catch (eLL) {}");
      lines.push("      }");
      lines.push("    })();");
      break;
    }

    case "whip-pan":
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid([1,1,1], "Whip Pan Adj ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push(
        "    try { " + varPrefix + ".adjustmentLayer = true; } catch (e) {}"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      // Directional blur
      lines.push("    (function () {");
      lines.push(
        '      var db = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Motion Blur");'
      );
      lines.push("      if (!db) {");
      lines.push(
        '        db = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Directional Blur");'
      );
      lines.push("      }");
      lines.push("      if (db) {");
      lines.push("        try {");
      lines.push(
        '          var dir = db.property("ADBE Motion Blur-0001"); if (dir) dir.setValue(90);'
      );
      lines.push(
        '          var len = db.property("ADBE Motion Blur-0002");'
      );
      lines.push("          if (len) {");
      lines.push(
        "            len.setValueAtTime(" + tr.time + ", 0);"
      );
      lines.push(
        "            len.setValueAtTime(" +
          (tr.time + tr.duration * 0.5) +
          ", 180);"
      );
      lines.push(
        "            len.setValueAtTime(" +
          (tr.time + tr.duration) +
          ", 0);"
      );
      lines.push("          }");
      lines.push("        } catch (eWP) {}");
      lines.push("      }");
      lines.push("    })();");
      break;

    case "zoom-push":
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid([1,1,1], "Zoom Push Adj ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push(
        "    try { " + varPrefix + ".adjustmentLayer = true; } catch (e) {}"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      lines.push("    (function () {");
      lines.push(
        '      var trfx = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Transform");'
      );
      lines.push("      if (trfx) {");
      lines.push("        try {");
      lines.push(
        '          var sc = trfx.property("ADBE Transform-0004");'
      ); // scale
      lines.push("          if (sc) {");
      lines.push(
        "            sc.setValueAtTime(" + tr.time + ", 100);"
      );
      lines.push(
        "            sc.setValueAtTime(" +
          (tr.time + tr.duration * 0.5) +
          ", 135);"
      );
      lines.push(
        "            sc.setValueAtTime(" +
          (tr.time + tr.duration) +
          ", 100);"
      );
      lines.push("          }");
      lines.push("        } catch (eZP) {}");
      lines.push("      }");
      // Add fast blur for the push feel
      lines.push(
        '      var fb = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");'
      );
      lines.push("      if (fb) {");
      lines.push("        try {");
      lines.push(
        '          var amt = fb.property("ADBE Gaussian Blur 2-0001");'
      );
      lines.push("          if (amt) {");
      lines.push(
        "            amt.setValueAtTime(" + tr.time + ", 0);"
      );
      lines.push(
        "            amt.setValueAtTime(" +
          (tr.time + tr.duration * 0.5) +
          ", 18);"
      );
      lines.push(
        "            amt.setValueAtTime(" +
          (tr.time + tr.duration) +
          ", 0);"
      );
      lines.push("          }");
      lines.push("        } catch (eZPB) {}");
      lines.push("      }");
      lines.push("    })();");
      break;

    case "dissolve":
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid([1,1,1], "Dissolve Adj ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push(
        "    try { " + varPrefix + ".adjustmentLayer = true; } catch (e) {}"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      // Use a Gaussian Blur ramp-up-down for a soft dissolve feel
      lines.push("    (function () {");
      lines.push(
        '      var gb = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");'
      );
      lines.push("      if (gb) {");
      lines.push(
        '        var amt = gb.property("ADBE Gaussian Blur 2-0001");'
      );
      lines.push("        if (amt) {");
      lines.push("          amt.setValueAtTime(" + tr.time + ", 0);");
      lines.push(
        "          amt.setValueAtTime(" +
          (tr.time + tr.duration * 0.5) +
          ", 30);"
      );
      lines.push(
        "          amt.setValueAtTime(" +
          (tr.time + tr.duration) +
          ", 0);"
      );
      lines.push("        }");
      lines.push("      }");
      lines.push("    })();");
      break;

    case "flash": {
      var flashCol = tr.color || [1, 1, 1];
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid(' +
          jsonLiteral(flashCol) +
          ', "Flash ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      lines.push(
        "    try { " +
          varPrefix +
          ".blendingMode = BlendingMode.ADD; } catch (e) {}"
      );
      // Quick flash: 0 -> 100 -> 0
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 0, 100, " +
          tr.time +
          ", " +
          (tr.duration * 0.15) +
          ', "linear");'
      );
      lines.push(
        "    MP.addOpacityAnimation(" +
          varPrefix +
          ", 100, 0, " +
          (tr.time + tr.duration * 0.15) +
          ", " +
          (tr.duration * 0.85) +
          ', "expoOut");'
      );
      break;
    }

    case "glitch-cut":
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid([1,1,1], "Glitch Cut Adj ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push(
        "    try { " + varPrefix + ".adjustmentLayer = true; } catch (e) {}"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      // Posterize time for choppy frame-rate + transform jitter
      lines.push("    (function () {");
      lines.push(
        '      var pt = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Posterize Time");'
      );
      lines.push(
        "      if (pt) { try { pt.property(1).setValue(10); } catch (e) {} }"
      );
      lines.push(
        '      var trfx = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Transform");'
      );
      lines.push("      if (trfx) {");
      lines.push("        try {");
      lines.push(
        '          var p = trfx.property("ADBE Transform-0006");'
      );
      lines.push(
        '          if (p) p.expression = "seedRandom(Math.floor(time*30),true); var g = random(-25,25); [value[0]+g, value[1]+random(-10,10)];";'
      );
      lines.push("        } catch (eGC) {}");
      lines.push("      }");
      lines.push("    })();");
      break;

    case "blur-transition":
      lines.push(
        "    var " +
          varPrefix +
          ' = comp.layers.addSolid([1,1,1], "Blur Trans Adj ' +
          (index + 1) +
          '", comp.width, comp.height, 1, ' +
          tr.duration +
          ");"
      );
      lines.push(
        "    try { " + varPrefix + ".adjustmentLayer = true; } catch (e) {}"
      );
      lines.push("    " + varPrefix + ".startTime = " + tr.time + ";");
      lines.push(
        "    " +
          varPrefix +
          ".outPoint = " +
          (tr.time + tr.duration) +
          ";"
      );
      lines.push("    (function () {");
      lines.push(
        '      var gb = ' +
          varPrefix +
          '.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");'
      );
      lines.push("      if (gb) {");
      lines.push(
        '        var amt = gb.property("ADBE Gaussian Blur 2-0001");'
      );
      lines.push("        if (amt) {");
      lines.push("          amt.setValueAtTime(" + tr.time + ", 0);");
      lines.push(
        "          amt.setValueAtTime(" +
          (tr.time + tr.duration * 0.5) +
          ", 45);"
      );
      lines.push(
        "          amt.setValueAtTime(" +
          (tr.time + tr.duration) +
          ", 0);"
      );
      lines.push("        }");
      lines.push("      }");
      lines.push("    })();");
      break;
  }

  lines.push(
    '    MP.log("Transition ' + (index + 1) + ": " + tr.type + '");'
  );
  return lines.join("\n");
}

/**
 * Generates ExtendScript for the color grading adjustment layer.
 */
function genColorGradeJsx(
  grade: NonNullable<VideoCompositionPlan["colorGrade"]>
): string {
  var lines: string[] = [];
  lines.push("    // --- Color Grading ---");
  lines.push(
    '    var gradeAdj = comp.layers.addSolid([1,1,1], "Color Grade", comp.width, comp.height, 1, comp.duration);'
  );
  lines.push(
    "    try { gradeAdj.adjustmentLayer = true; } catch (e) {}"
  );

  // Curves effect
  lines.push(
    '    var curves = gradeAdj.property("ADBE Effect Parade").addProperty("ADBE CurvesCustom");'
  );

  // Vibrance
  lines.push(
    '    var vib = gradeAdj.property("ADBE Effect Parade").addProperty("ADBE Vibrance");'
  );

  // Profile-specific colour adjustments
  lines.push("    (function () {");
  lines.push('      var profile = "' + grade.profile + '";');
  lines.push("      var intensity = " + grade.intensity + " / 100;");
  lines.push("      if (vib) {");
  lines.push("        try {");
  lines.push(
    '          vib.property("ADBE Vibrance-0001").setValue(Math.round(25 * intensity));'
  ); // vibrance
  lines.push(
    '          vib.property("ADBE Vibrance-0002").setValue(Math.round(8 * intensity));'
  ); // saturation
  lines.push("        } catch (eV) {}");
  lines.push("      }");

  // Profile-based tint via a Photo Filter or Tint effect
  lines.push(
    '      var tint = gradeAdj.property("ADBE Effect Parade").addProperty("ADBE Tint");'
  );
  lines.push("      if (tint) {");
  lines.push("        try {");
  lines.push('          if (profile === "teal-orange") {');
  lines.push(
    '            tint.property("ADBE Tint-0001").setValue([0, 0.35, 0.4]);'
  ); // shadows → teal
  lines.push(
    '            tint.property("ADBE Tint-0002").setValue([1, 0.72, 0.4]);'
  ); // highlights → orange
  lines.push('          } else if (profile === "cold-blue") {');
  lines.push(
    '            tint.property("ADBE Tint-0001").setValue([0.05, 0.1, 0.25]);'
  );
  lines.push(
    '            tint.property("ADBE Tint-0002").setValue([0.7, 0.8, 1]);'
  );
  lines.push('          } else if (profile === "warm-golden") {');
  lines.push(
    '            tint.property("ADBE Tint-0001").setValue([0.15, 0.08, 0]);'
  );
  lines.push(
    '            tint.property("ADBE Tint-0002").setValue([1, 0.92, 0.7]);'
  );
  lines.push('          } else if (profile === "desaturated") {');
  lines.push(
    '            tint.property("ADBE Tint-0001").setValue([0.1, 0.1, 0.1]);'
  );
  lines.push(
    '            tint.property("ADBE Tint-0002").setValue([0.9, 0.9, 0.85]);'
  );
  lines.push('          } else if (profile === "neon-pop") {');
  lines.push(
    '            tint.property("ADBE Tint-0001").setValue([0.05, 0, 0.15]);'
  );
  lines.push(
    '            tint.property("ADBE Tint-0002").setValue([1, 0.9, 1]);'
  );
  lines.push("          }");
  // Blend tint amount with intensity
  lines.push(
    '          tint.property("ADBE Tint-0003").setValue(Math.round(35 * intensity));'
  ); // amount
  lines.push("        } catch (eT) {}");
  lines.push("      }");
  lines.push("    })();");

  // Opacity scales with intensity
  lines.push(
    '    gradeAdj.property("ADBE Transform Group").property("ADBE Opacity").setValue(' +
      Math.max(40, Math.min(100, grade.intensity)) +
      ");"
  );

  // Vignette
  if (grade.vignette) {
    lines.push("    // Vignette");
    lines.push(
      '    var vigLayer = comp.layers.addSolid([0,0,0], "Vignette", comp.width, comp.height, 1, comp.duration);'
    );
    lines.push(
      '    var vigMask = vigLayer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");'
    );
    lines.push("    var vigShape = new Shape();");
    lines.push("    var vw = comp.width; var vh = comp.height;");
    lines.push(
      "    vigShape.vertices = [[vw*0.5, -vh*0.1], [vw*1.1, vh*0.5], [vw*0.5, vh*1.1], [-vw*0.1, vh*0.5]];"
    );
    lines.push(
      "    vigShape.inTangents = [[-vw*0.3,0],[0,-vh*0.3],[vw*0.3,0],[0,vh*0.3]];"
    );
    lines.push(
      "    vigShape.outTangents = [[vw*0.3,0],[0,vh*0.3],[-vw*0.3,0],[0,-vh*0.3]];"
    );
    lines.push("    vigShape.closed = true;");
    lines.push(
      '    vigMask.property("ADBE Mask Shape").setValue(vigShape);'
    );
    lines.push("    vigMask.maskMode = MaskMode.SUBTRACT;");
    lines.push(
      '    vigMask.property("ADBE Mask Feather").setValue([vw*0.25, vh*0.25]);'
    );
    lines.push(
      '    vigLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(50);'
    );
    lines.push('    MP.log("Vignette added");');
  }

  // Film grain
  if (grade.filmGrain) {
    lines.push("    // Film grain");
    lines.push("    try {");
    lines.push("      MPVFX.run(comp, \"filmGrain\", { strength: 6 });");
    lines.push('      MP.log("Film grain via MPVFX");');
    lines.push("    } catch (eFG) {");
    lines.push('      MP.log("Film grain skipped: " + eFG.toString());');
    lines.push("    }");
  }

  lines.push('    MP.log("Color grading: ' + grade.profile + '");');
  return lines.join("\n");
}

/**
 * Generates ExtendScript for a 3D camera with animation keyframes.
 */
function genCameraJsx(
  cam: NonNullable<VideoCompositionPlan["camera"]>
): string {
  var lines: string[] = [];
  lines.push("    // --- Camera Animation ---");

  // Create camera
  lines.push(
    '    var cam = comp.layers.addCamera("Video Camera", [comp.width/2, comp.height/2]);'
  );
  lines.push("    var camPos = cam.property(\"ADBE Transform Group\").property(\"ADBE Position\");");
  lines.push("    var camZoom = cam.property(\"ADBE Camera Options Group\").property(\"ADBE Camera Zoom\");");
  lines.push("    var cx = comp.width / 2;");
  lines.push("    var cy = comp.height / 2;");

  var t0 = cam.startTime;
  var t1 = cam.startTime + cam.duration;
  var s = cam.strength;

  switch (cam.type) {
    case "dolly-in":
      lines.push("    camPos.setValueAtTime(" + t0 + ", [cx, cy, -1500]);");
      lines.push(
        "    camPos.setValueAtTime(" +
          t1 +
          ", [cx, cy, " +
          (-1500 + s * 8) +
          "]);"
      );
      lines.push('    MP.setEase(camPos, "sineInOut");');
      break;
    case "dolly-out":
      lines.push("    camPos.setValueAtTime(" + t0 + ", [cx, cy, -1200]);");
      lines.push(
        "    camPos.setValueAtTime(" +
          t1 +
          ", [cx, cy, " +
          (-1200 - s * 8) +
          "]);"
      );
      lines.push('    MP.setEase(camPos, "sineInOut");');
      break;
    case "crane-up":
      lines.push("    camPos.setValueAtTime(" + t0 + ", [cx, cy + " + s * 3 + ", -1400]);");
      lines.push("    camPos.setValueAtTime(" + t1 + ", [cx, cy - " + s * 3 + ", -1400]);");
      lines.push('    MP.setEase(camPos, "sineInOut");');
      break;
    case "crane-down":
      lines.push("    camPos.setValueAtTime(" + t0 + ", [cx, cy - " + s * 3 + ", -1400]);");
      lines.push("    camPos.setValueAtTime(" + t1 + ", [cx, cy + " + s * 3 + ", -1400]);");
      lines.push('    MP.setEase(camPos, "sineInOut");');
      break;
    case "orbit":
      // Use expressions for orbit since keyframes can't easily express circular motion
      lines.push("    camPos.setValue([cx, cy, -1400]);");
      lines.push("    try {");
      lines.push(
        '      camPos.expression = "var t0 = ' +
          t0 +
          "; var dur = " +
          cam.duration +
          "; var str = " +
          s +
          '; var pct = clamp((time-t0)/dur, 0, 1); var angle = pct * Math.PI * 2 * 0.25; [value[0] + Math.sin(angle)*str*4, value[1], value[2] + Math.cos(angle)*str*4 - str*4];";'
      );
      lines.push("    } catch (eOrb) {}");
      break;
    case "push-in":
      lines.push("    var baseZoom = camZoom.value;");
      lines.push("    camPos.setValue([cx, cy, -1400]);");
      lines.push("    camZoom.setValueAtTime(" + t0 + ", baseZoom);");
      lines.push(
        "    camZoom.setValueAtTime(" + t1 + ", baseZoom + " + s * 5 + ");"
      );
      lines.push('    MP.setEase(camZoom, "sineInOut");');
      break;
    case "pull-out":
      lines.push("    var baseZoom = camZoom.value;");
      lines.push("    camPos.setValue([cx, cy, -1400]);");
      lines.push("    camZoom.setValueAtTime(" + t0 + ", baseZoom);");
      lines.push(
        "    camZoom.setValueAtTime(" + t1 + ", baseZoom - " + s * 5 + ");"
      );
      lines.push('    MP.setEase(camZoom, "sineInOut");');
      break;
    case "static":
    default:
      lines.push("    camPos.setValue([cx, cy, -1400]);");
      break;
  }

  // Make all existing layers 3D so they respond to the camera
  lines.push("    for (var ci = 1; ci <= comp.numLayers; ci++) {");
  lines.push("      var cl = comp.layer(ci);");
  lines.push(
    "      if (!(cl instanceof CameraLayer) && !(cl instanceof LightLayer)) {"
  );
  lines.push("        try { cl.threeDLayer = true; } catch (e3d) {}");
  lines.push("      }");
  lines.push("    }");

  lines.push('    MP.log("Camera: ' + cam.type + '");');
  return lines.join("\n");
}

/**
 * Generates ExtendScript for applying VFX polish via MPVFX.run().
 */
function genPolishJsx(
  polish: NonNullable<VideoCompositionPlan["polish"]>
): string {
  var lines: string[] = [];
  lines.push("    // --- VFX Polish ---");

  if (polish.bokeh) {
    lines.push("    try {");
    lines.push(
      '      var bokehAdj = comp.layers.addSolid([1,1,1], "Bokeh", comp.width, comp.height, 1, comp.duration);'
    );
    lines.push(
      "      try { bokehAdj.adjustmentLayer = true; } catch (e) {}"
    );
    lines.push(
      '      var ccLB = bokehAdj.property("ADBE Effect Parade").addProperty("CC Lens Blur");'
    );
    lines.push("      if (ccLB) {");
    lines.push("        try {");
    lines.push('          var rad = ccLB.property("Blur Radius"); if (rad) rad.setValue(8);');
    lines.push("        } catch (eBK) {}");
    lines.push("      } else {");
    lines.push(
      '        var gb = bokehAdj.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");'
    );
    lines.push(
      '        if (gb) { try { gb.property("ADBE Gaussian Blur 2-0001").setValue(4); } catch (e) {} }'
    );
    lines.push("      }");
    lines.push(
      '      bokehAdj.property("ADBE Transform Group").property("ADBE Opacity").setValue(40);'
    );
    lines.push('      MP.log("Bokeh polish applied");');
    lines.push("    } catch (eBokeh) {");
    lines.push('      MP.log("Bokeh skipped: " + eBokeh.toString());');
    lines.push("    }");
  }

  if (polish.lightLeak) {
    lines.push("    try {");
    lines.push('      MPVFX.run(comp, "lensFlare", { duration: comp.duration * 0.6, start: comp.duration * 0.2 });');
    lines.push('      MP.log("Light leak polish applied");');
    lines.push("    } catch (eLL) {");
    lines.push('      MP.log("Light leak skipped: " + eLL.toString());');
    lines.push("    }");
  }

  if (polish.filmGrain) {
    lines.push("    try {");
    lines.push('      MPVFX.run(comp, "filmGrain", { strength: 5 });');
    lines.push('      MP.log("Film grain polish applied");');
    lines.push("    } catch (eFG) {");
    lines.push('      MP.log("Film grain skipped: " + eFG.toString());');
    lines.push("    }");
  }

  if (polish.lensFlare) {
    lines.push("    try {");
    lines.push('      MPVFX.run(comp, "lensFlare", { duration: 1.5, start: 0.5 });');
    lines.push('      MP.log("Lens flare polish applied");');
    lines.push("    } catch (eLF) {");
    lines.push('      MP.log("Lens flare skipped: " + eLF.toString());');
    lines.push("    }");
  }

  if (polish.atmosphericFog) {
    lines.push("    try {");
    lines.push('      MPVFX.run(comp, "atmosphericFog", { strength: 20 });');
    lines.push('      MP.log("Atmospheric fog polish applied");');
    lines.push("    } catch (eAF) {");
    lines.push('      MP.log("Atmospheric fog skipped: " + eAF.toString());');
    lines.push("    }");
  }

  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Main export: generateVideoCompositionJsx                          */
/* ------------------------------------------------------------------ */

/**
 * Generate ExtendScript JSX that creates a full professional video
 * composition in After Effects — background, title cards with reveal
 * animations, transitions, color grading, camera motion, and VFX polish.
 *
 * The returned string is a self-contained script that can be run via
 * `app.executeCommand` or `afterfx -r`.
 */
export function generateVideoCompositionJsx(opts: {
  outputAepPath: string;
  plan: VideoCompositionPlan;
}): string {
  const plan = opts.plan;
  const comp = plan.composition;

  // Build body sections
  const sections: string[] = [];

  // 1. New project + composition
  sections.push(`
    app.newProject();
    app.beginUndoGroup("MotionPilot Video Composition");
    var comp = app.project.items.addComp(
      ${jstr(comp.name)}, ${comp.width}, ${comp.height},
      1, ${comp.duration}, ${comp.fps}
    );
    comp.bgColor = [0, 0, 0];
    MP.log("Created composition: " + comp.name + " (" + ${comp.width} + "x" + ${comp.height} + " @ " + ${comp.fps} + "fps, " + ${comp.duration} + "s)");
  `);

  // 2. Background
  sections.push(genBackgroundJsx(plan.background));

  // 3. Title cards (added in reverse so first card is on top)
  for (var i = plan.titleCards.length - 1; i >= 0; i--) {
    sections.push(genTitleCardJsx(plan.titleCards[i], i));
  }

  // 4. Transitions
  for (var t = 0; t < plan.transitions.length; t++) {
    sections.push(genTransitionJsx(plan.transitions[t], t));
  }

  // 5. Color grading
  if (plan.colorGrade) {
    sections.push(genColorGradeJsx(plan.colorGrade));
  }

  // 6. Camera
  if (plan.camera) {
    sections.push(genCameraJsx(plan.camera));
  }

  // 7. VFX polish
  if (plan.polish) {
    sections.push(genPolishJsx(plan.polish));
  }

  // 8. Enable motion blur
  sections.push(`
    // --- Motion Blur ---
    try { comp.motionBlur = true; } catch (e) {}
    for (var mbi = 1; mbi <= comp.numLayers; mbi++) {
      try {
        var mbl = comp.layer(mbi);
        if (!(mbl instanceof CameraLayer) && !(mbl instanceof LightLayer)) {
          mbl.motionBlur = true;
        }
      } catch (eMB) {}
    }
    MP.log("Motion blur enabled");
  `);

  // 9. Save project
  sections.push(`
    app.endUndoGroup();
    __result.output = MP.saveProject(${jstr(opts.outputAepPath)});
    __result.log = MP.getLog();
  `);

  return withReport(sections.join("\n"));
}

/* ------------------------------------------------------------------ */
/*  Secondary export: generateVideoCompositionFromPackageJsx          */
/* ------------------------------------------------------------------ */

/**
 * Converts a video prompt package (the output of `buildVideoPromptPackage`)
 * into a basic AE composition with title cards, transitions, and color
 * grading derived from the creative brief.
 *
 * This is a convenience wrapper that maps the package's higher-level
 * structure to a `VideoCompositionPlan` and delegates to
 * `generateVideoCompositionJsx`.
 */
export function generateVideoCompositionFromPackageJsx(
  opts: VideoPackageToAeOpts
): string {
  const pkg = opts.packageData;

  // Extract composition settings from package or use defaults
  const compName = opts.compName || pkg.title || "Video Composition";
  const width: number = pkg.resolution?.width || 1920;
  const height: number = pkg.resolution?.height || 1080;
  const fps: number = pkg.fps || 30;

  // Calculate total duration from segments or use package duration
  let totalDuration: number = pkg.totalDuration || 30;
  const segments: any[] = pkg.segments || pkg.scenes || [];
  if (segments.length > 0 && !pkg.totalDuration) {
    totalDuration = segments.reduce(
      (sum: number, seg: any) => sum + (seg.duration || 5),
      0
    );
  }

  // Build title cards from segments
  const titleCards: VideoCompositionPlan["titleCards"] = [];
  let currentTime = 0;
  for (const seg of segments) {
    const text: string = seg.title || seg.text || seg.heading || "";
    if (!text) {
      currentTime += seg.duration || 5;
      continue;
    }

    // Determine position based on segment type
    let position: "center" | "lower-third" | "upper" = "center";
    const segType: string = (seg.type || "").toLowerCase();
    if (
      segType === "lower-third" ||
      segType === "lowerthird" ||
      segType === "subtitle"
    ) {
      position = "lower-third";
    } else if (segType === "header" || segType === "upper") {
      position = "upper";
    }

    // Map animation from segment hints
    let animation:
      | "fadeIn"
      | "slideUp"
      | "slideLeft"
      | "typewriter"
      | "scaleReveal"
      | "blurReveal"
      | "maskWipe" = "fadeIn";
    const animHint: string = (
      seg.animation ||
      seg.reveal ||
      ""
    ).toLowerCase();
    if (animHint.includes("slide") && animHint.includes("up"))
      animation = "slideUp";
    else if (animHint.includes("slide")) animation = "slideLeft";
    else if (animHint.includes("type")) animation = "typewriter";
    else if (animHint.includes("scale")) animation = "scaleReveal";
    else if (animHint.includes("blur")) animation = "blurReveal";
    else if (animHint.includes("wipe") || animHint.includes("mask"))
      animation = "maskWipe";

    titleCards.push({
      text,
      position,
      fontSize: seg.fontSize || 72,
      color: seg.color || [1, 1, 1],
      startTime: currentTime,
      duration: seg.duration || 5,
      animation,
      backgroundBar: seg.backgroundBar,
    });

    // Add subtitle if present
    if (seg.subtitle || seg.description) {
      titleCards.push({
        text: seg.subtitle || seg.description,
        position: "lower-third",
        fontSize: seg.subtitleFontSize || 36,
        color: seg.subtitleColor || [0.85, 0.85, 0.85],
        startTime: currentTime + 0.3,
        duration: (seg.duration || 5) - 0.5,
        animation: "slideUp",
      });
    }

    currentTime += seg.duration || 5;
  }

  // Build transitions from segment boundaries
  const transitions: VideoCompositionPlan["transitions"] = [];
  const transitionTypes: VideoCompositionPlan["transitions"][number]["type"][] =
    [
      "dissolve",
      "light-leak",
      "blur-transition",
      "flash",
      "zoom-push",
      "whip-pan",
    ];
  let segTime = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    segTime += segments[i].duration || 5;
    const trType: string = (
      segments[i].transition ||
      ""
    ).toLowerCase();
    let type: VideoCompositionPlan["transitions"][number]["type"] = "dissolve";
    if (trType.includes("light") || trType.includes("leak"))
      type = "light-leak";
    else if (trType.includes("whip") || trType.includes("pan"))
      type = "whip-pan";
    else if (trType.includes("zoom") || trType.includes("push"))
      type = "zoom-push";
    else if (trType.includes("flash")) type = "flash";
    else if (trType.includes("glitch")) type = "glitch-cut";
    else if (trType.includes("blur")) type = "blur-transition";
    else {
      // Cycle through transition types for variety
      type = transitionTypes[i % transitionTypes.length];
    }

    transitions.push({
      type,
      time: segTime - 0.5, // overlap slightly
      duration: 0.8,
    });
  }

  // Color grading from creative brief
  const brief = pkg.creativeBrief || pkg.brief || pkg.style || {};
  let colorProfile = "teal-orange";
  const mood: string = (
    brief.mood ||
    brief.tone ||
    brief.colorScheme ||
    ""
  ).toLowerCase();
  if (mood.includes("cold") || mood.includes("blue") || mood.includes("icy"))
    colorProfile = "cold-blue";
  else if (
    mood.includes("warm") ||
    mood.includes("gold") ||
    mood.includes("sunset")
  )
    colorProfile = "warm-golden";
  else if (mood.includes("neon") || mood.includes("vibrant"))
    colorProfile = "neon-pop";
  else if (
    mood.includes("desat") ||
    mood.includes("muted") ||
    mood.includes("minimal")
  )
    colorProfile = "desaturated";

  // Determine background
  const bgHint: string = (brief.background || "").toLowerCase();
  let bgType: "gradient" | "solid" | "fractalNoise" = "gradient";
  if (bgHint.includes("solid") || bgHint.includes("flat")) bgType = "solid";
  else if (
    bgHint.includes("noise") ||
    bgHint.includes("fractal") ||
    bgHint.includes("organic")
  )
    bgType = "fractalNoise";

  const bgColors: [number, number, number][] =
    brief.backgroundColors || brief.bgColors || [[0.06, 0.06, 0.1], [0.02, 0.02, 0.04]];

  // Build the plan
  const plan: VideoCompositionPlan = {
    composition: {
      name: compName,
      width,
      height,
      duration: totalDuration,
      fps,
    },
    background: {
      type: bgType,
      colors: bgColors,
      evolution: bgType === "fractalNoise",
    },
    titleCards,
    transitions,
    colorGrade: {
      profile: colorProfile,
      intensity: brief.gradeIntensity || 65,
      vignette: brief.vignette !== false,
      filmGrain: brief.filmGrain !== false,
    },
    camera:
      brief.camera !== false
        ? {
            type: brief.cameraMove || "push-in",
            strength: brief.cameraStrength || 15,
            startTime: 0,
            duration: totalDuration,
          }
        : undefined,
    polish: {
      atmosphericFog: brief.atmosphericFog || false,
      lightLeak: brief.lightLeak || false,
      filmGrain: false, // already in colorGrade
      lensFlare: brief.lensFlare || false,
      bokeh: brief.bokeh || false,
    },
  };

  return generateVideoCompositionJsx({
    outputAepPath: opts.outputAepPath,
    plan,
  });
}
