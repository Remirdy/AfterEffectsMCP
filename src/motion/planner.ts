import { AnalysisReport, AnalyzedLayer, MotionAnimation, MotionPlan } from "../types.js";
import { suggestedAnimationFor } from "../psd/roles.js";
import { CreateMotionPlanInput } from "../schemas.js";
import { OpLog } from "../util.js";

/** Easing presets biased by the requested style. */
function easeFor(style: string, kind: "entrance" | "soft" | "bounce" | "loop"): string {
  const table: Record<string, Record<string, string>> = {
    premium: { entrance: "expoOut", soft: "quadOut", bounce: "backOut", loop: "quadInOut" },
    cinematic: { entrance: "expoOut", soft: "sineInOut", bounce: "quadOut", loop: "sineInOut" },
    energetic: { entrance: "backOut", soft: "quadOut", bounce: "backOut", loop: "quadInOut" },
    minimal: { entrance: "quadOut", soft: "quadOut", bounce: "quadOut", loop: "linear" },
    playful: { entrance: "backOut", soft: "backOut", bounce: "elasticOut", loop: "sineInOut" },
  };
  return (table[style] ?? table.premium)[kind];
}

const TEXT_SAFE_TYPES = new Set(["slideFade", "maskReveal", "textRangeReveal", "softReveal", "blurFade"]);

type PromptProfile = NonNullable<MotionPlan["promptProfile"]>;

function hasAny(prompt: string, words: RegExp[]): boolean {
  return words.some((w) => w.test(prompt));
}

function parsePromptProfile(prompt: string, style: string): PromptProfile {
  const p = prompt.toLowerCase();
  const direction: string[] = [];
  const professionalTouches: string[] = [];

  const fast = hasAny(p, [/fast/, /snappy/, /energetic/, /dynamic/, /reels?/, /tiktok/, /shorts?/, /quick/, /hızlı/, /enerjik/]);
  const slow = hasAny(p, [/slow/, /calm/, /cinematic/, /elegant/, /luxury/, /premium/, /minimal/, /yavaş/, /sakin/, /şık/]);
  const rich = hasAny(p, [/professional/, /behance/, /portfolio/, /commercial/, /advert/, /ad\b/, /promo/, /launch/, /pro/, /reklam/, /tanıtım/]);
  const minimal = style === "minimal" || hasAny(p, [/minimal/, /clean/, /simple/, /subtle/, /sade/, /temiz/]);

  if (hasAny(p, [/cinematic/, /film/, /trailer/, /kamera/, /camera/])) {
    direction.push("cinematic");
    professionalTouches.push("camera push");
  }
  if (hasAny(p, [/depth/, /parallax/, /3d/, /z[- ]?space/, /derinlik/])) {
    direction.push("depth");
    professionalTouches.push("layered parallax");
  }
  if (hasAny(p, [/kinetic/, /typography/, /type/, /headline/, /başlık/, /metin/])) {
    direction.push("kinetic typography");
    professionalTouches.push("text range reveal");
  }
  if (hasAny(p, [/glow/, /shine/, /light\s*sweep/, /neon/, /parla/, /ışıltı/])) {
    direction.push("light effects");
    professionalTouches.push("light sweep/glow");
  }
  if (hasAny(p, [/app/, /saas/, /dashboard/, /ui/, /product/, /mockup/])) {
    direction.push("product promo");
    professionalTouches.push("staggered UI hierarchy");
  }
  if (hasAny(p, [/loop/, /seamless/, /sonsuz/, /döngü/])) {
    direction.push("loop-ready");
    professionalTouches.push("ambient looping motion");
  }

  return {
    tempo: fast && !slow ? "fast" : slow && !fast ? "slow" : "balanced",
    density: minimal ? "minimal" : rich ? "rich" : "balanced",
    direction,
    professionalTouches,
  };
}

function tempoScale(profile: PromptProfile): number {
  if (profile.tempo === "fast") return 0.78;
  if (profile.tempo === "slow") return 1.18;
  return 1;
}

function wants(profile: PromptProfile, name: string): boolean {
  return profile.direction.indexOf(name) >= 0 || profile.professionalTouches.join(" ").indexOf(name) >= 0;
}

/**
 * Build a deterministic, hierarchy-aware motion plan from the PSD analysis.
 * The user prompt biases global choices (style is already resolved), but the
 * per-layer structure is derived from detected roles so the result matches the
 * actual design rather than being random.
 *
 * Text content is never read into the plan as something to change — only
 * transform/mask/range-selector animations are emitted for text layers.
 */
export function buildMotionPlan(
  report: AnalysisReport,
  input: CreateMotionPlanInput,
  log: OpLog
): MotionPlan {
  const { duration, fps, style } = input;
  const profile = parsePromptProfile(input.userPrompt, style);
  const speed = tempoScale(profile);
  const animations: MotionAnimation[] = [];

  // Group layers by role to drive timing/staggering.
  const byRole = new Map<string, AnalyzedLayer[]>();
  for (const l of report.layers) {
    if (!l.visible) continue;
    const arr = byRole.get(l.role) ?? [];
    arr.push(l);
    byRole.set(l.role, arr);
  }

  // 1. Background parallax (collapsed to a single wildcard rule when prefixed).
  const bg = byRole.get("background") ?? [];
  if (bg.length) {
    const usesPrefix = bg.every((l) => /^BG_/i.test(l.name));
    if (usesPrefix) {
      animations.push({
        target: "BG_",
        type: wants(profile, "depth") ? "depthDrift" : "slowParallax",
        start: 0,
        duration,
        strength: wants(profile, "depth") ? 38 : 25,
        ease: easeFor(style, "loop"),
      });
    } else {
      bg.forEach((l, i) =>
        animations.push({
          target: l.name,
          type: wants(profile, "depth") ? "depthDrift" : "slowParallax",
          start: 0,
          duration,
          strength: (wants(profile, "depth") ? 28 : 18) + i * 6,
          ease: easeFor(style, "loop"),
        })
      );
    }
  }

  // 2. Title, then subtitle slightly after.
  let cursor = 0.4;
  for (const role of ["title", "locked_text"] as const) {
    for (const l of byRole.get(role) ?? []) {
      const s = suggestedAnimationFor(l.role);
      animations.push({
        target: l.name,
        type: wants(profile, "kinetic typography") ? "textRangeReveal" : profile.density === "rich" ? "blurFade" : "slideFade",
        from: s.from ?? "top",
        start: round(cursor),
        duration: round(0.8 * speed),
        ease: easeFor(style, "entrance"),
        strength: 14,
      });
      cursor += 0.15;
    }
  }
  for (const l of byRole.get("subtitle") ?? []) {
    animations.push({
      target: l.name,
      type: "slideFade",
      from: "bottom",
      start: round(Math.max(cursor, 1.0)),
      duration: round(0.7 * speed),
      ease: easeFor(style, "soft"),
    });
    cursor += 0.15;
  }

  // 2b. Generic body text (no subtitle/title role): gentle staggered fade-up,
  //     ordered top-to-bottom so reading order is preserved. Text-safe only.
  const bodyText = (byRole.get("text") ?? []).slice().sort((a, b) => a.bounds.y - b.bounds.y);
  bodyText.forEach((l, i) => {
    animations.push({
      target: l.name,
      type: wants(profile, "kinetic typography") ? "textRangeReveal" : "slideFade",
      from: "bottom",
      start: round(Math.max(cursor, 1.3) + i * 0.18),
      duration: round(0.6 * speed),
      ease: easeFor(style, "soft"),
      strength: 36,
    });
  });

  // 3. Main mockup enters with depth.
  const mockups = [...(byRole.get("main_mockup") ?? []), ...(byRole.get("phone_mockup") ?? [])];
  mockups.forEach((l, i) => {
    const s = suggestedAnimationFor(l.role);
    animations.push({
      target: l.name,
      type: wants(profile, "depth") ? "depthDrift" : "slideScale",
      from: s.from ?? "right",
      start: round(1.0 + i * 0.25),
      duration: round(1.1 * speed),
      ease: easeFor(style, "bounce"),
      strength: wants(profile, "depth") ? 70 : 90,
    });
    if (wants(profile, "depth")) {
      animations.push({
        target: l.name,
        type: "slideScale",
        from: s.from ?? "right",
        start: round(0.9 + i * 0.25),
        duration: round(0.95 * speed),
        ease: easeFor(style, "bounce"),
        strength: 70,
      });
    }
  });

  // 4. UI cards stagger one-by-one.
  const cards = byRole.get("ui_card") ?? [];
  if (cards.length) {
    const usesPrefix = cards.every((l) => /^Card_/i.test(l.name));
    const start = round(Math.max(cursor, 1.8));
    if (usesPrefix) {
      animations.push({
        target: "Card_",
        type: profile.tempo === "fast" || profile.density === "rich" ? "overshootPop" : "staggerPop",
        start,
        duration: round(0.5 * speed),
        stagger: profile.tempo === "fast" ? 0.09 : 0.15,
        ease: easeFor(style, "bounce"),
      });
    } else {
      cards.forEach((l, i) =>
        animations.push({
          target: l.name,
          type: profile.tempo === "fast" || profile.density === "rich" ? "overshootPop" : "staggerPop",
          start: round(start + i * (profile.tempo === "fast" ? 0.09 : 0.15)),
          duration: round(0.5 * speed),
          ease: easeFor(style, "bounce"),
        })
      );
    }
  }

  // 5. Buttons — premium bounce after cards.
  (byRole.get("button") ?? []).forEach((l, i) =>
    animations.push({
      target: l.name,
      type: profile.density === "rich" ? "overshootPop" : "bounceIn",
      start: round(2.6 + i * 0.12),
      duration: round(0.5 * speed),
      ease: easeFor(style, "bounce"),
    })
  );

  // 6. Logo soft reveal.
  (byRole.get("logo") ?? []).forEach((l) =>
    animations.push({
      target: l.name,
      type: profile.density === "rich" ? "blurFade" : "softReveal",
      start: 0.2,
      duration: round(0.9 * speed),
      ease: easeFor(style, "soft"),
      strength: 10,
    })
  );

  // 7. Icons / particles / decorations — gentle continuous float for whole comp.
  for (const role of ["icon", "particle", "decoration", "character"] as const) {
    const items = byRole.get(role) ?? [];
    items.forEach((l, i) =>
      animations.push({
        target: l.name,
        type: profile.density === "rich" && role === "icon" ? "scalePulse" : "floatLoop",
        start: round(1.5 + i * 0.1),
        duration: duration - 1.5,
        strength: role === "icon" ? 10 : 16,
        ease: easeFor(style, "loop"),
      })
    );
  }

  // 8. Optional light sweep only if the prompt explicitly asks and avoidExcessive is off.
  const wantsSweep = /light\s*sweep|glow|shine|gleam/i.test(input.userPrompt);
  if (wantsSweep || wants(profile, "light effects")) {
    const hero = mockups[0] ?? (byRole.get("logo") ?? [])[0];
    if (hero) {
      animations.push({
        target: hero.name,
        type: "lightSweep",
        start: round(2.4),
        duration: round(1.2 * speed),
        ease: easeFor(style, "soft"),
      });
      if (profile.density === "rich") {
        animations.push({
          target: hero.name,
          type: "ambientGlow",
          start: round(1.4),
          duration: round(Math.min(duration - 1.4, 3.2)),
          strength: 32,
          ease: easeFor(style, "soft"),
        });
      }
    }
  }

  if (wants(profile, "camera push") && profile.density !== "minimal") {
    animations.push({
      target: "__COMP__",
      type: "cameraPush",
      start: 0,
      duration,
      strength: profile.tempo === "slow" ? 90 : 140,
      ease: easeFor(style, "loop"),
    });
  }

  if (profile.density === "rich") {
    const heroText = [...(byRole.get("title") ?? []), ...(byRole.get("locked_text") ?? [])][0];
    if (heroText && !wants(profile, "kinetic typography")) {
      animations.push({
        target: heroText.name,
        type: "maskReveal",
        from: "left",
        start: 0.35,
        duration: round(0.85 * speed),
        ease: easeFor(style, "entrance"),
      });
    }
  }

  // 9. Professional secondary-motion polish layer (rich density only).
  //    The "living frame" feel: breathing backgrounds, a hero that settles into
  //    a gentle depth drift, and a controlled micro-impact on the CTA.
  if (profile.density === "rich") {
    const bgFirst = bg[0];
    if (bgFirst) {
      animations.push({
        target: /^BG_/i.test(bgFirst.name) ? "BG_" : bgFirst.name,
        type: "breathBlur",
        start: 0,
        duration,
        strength: 8,
        ease: easeFor(style, "loop"),
      });
    }
    const heroSettle = mockups[0] ?? (byRole.get("logo") ?? [])[0];
    if (heroSettle) {
      animations.push({
        target: heroSettle.name,
        type: "depthDrift",
        start: round(2.3),
        duration: Math.max(1.5, round(duration - 2.3)),
        strength: 18,
        ease: easeFor(style, "loop"),
      });
    }
    const ctaBtn = (byRole.get("button") ?? [])[0];
    if (ctaBtn) {
      animations.push({
        target: ctaBtn.name,
        type: "microShake",
        start: round(2.62),
        duration: round(0.28),
        strength: 3,
        ease: easeFor(style, "bounce"),
      });
    }
  }

  // Ensure any text animation stays within text-safe types.
  for (const a of animations) {
    const layer = report.layers.find((l) => l.name === a.target);
    if (layer && (layer.type === "text" || layer.role === "locked_text") && !TEXT_SAFE_TYPES.has(a.type)) {
      log.warn(`Coercing unsafe text animation on "${a.target}" to slideFade.`);
      a.type = "slideFade";
    }
  }

  log.info(
    `Built motion plan with ${animations.length} animation rules (style=${style}, tempo=${profile.tempo}, density=${profile.density}).`
  );

  return {
    composition: {
      width: report.document.width,
      height: report.document.height,
      duration,
      fps,
      name: "MotionPilot_Main",
    },
    rules: {
      preserveTextContent: true,
      protectLockedLayers: true,
      avoidExcessiveEffects: true,
    },
    animations: animations.sort((a, b) => a.start - b.start),
    style,
    promptProfile: profile,
    generatedAt: new Date().toISOString(),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
