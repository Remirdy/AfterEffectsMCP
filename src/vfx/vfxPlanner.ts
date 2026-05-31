/**
 * Prompt → VFX planner.
 *
 * Turns a natural-language prompt (English + Turkish) into an ordered list of
 * VFX steps (presets and/or composite recipes) with colors, timing, position
 * and intensity inferred from the text. Designed primarily for GAME VFX
 * ("a blue magic explosion", "mavi enerji patlaması", "lightning strike",
 * "fire breath", "portal opening", "shield impact"…) but works for cinema /
 * social cues too.
 *
 * The output is consumed by `generateVfxPlanJsx`, which dispatches each step to
 * MPVFX.run (presets) or MPVFX.runComposite (composites) inside After Effects.
 */

export type VfxStepType = "preset" | "composite";

export interface VfxStep {
  type: VfxStepType;
  /** MPVFX registry fn name (preset) or composite recipe name. */
  name: string;
  /** Layer name/wildcard for layer-mode presets. */
  targetLayer?: string;
  /** Params forwarded to MPVFX (start, duration, color, strength, position, mode, intensity…). */
  params?: Record<string, unknown>;
}

export interface VfxPlan {
  steps: VfxStep[];
  /** Comp settings used when creating a fresh comp (no source AEP). */
  composition: { width: number; height: number; duration: number; fps: number; name: string };
  intensity: number;
  color: [number, number, number] | null;
  matched: string[];
  notes: string[];
}

type RGB = [number, number, number];

const COLORS: Array<{ re: RegExp; rgb: RGB; label: string }> = [
  { re: /\b(blue|mavi|ice|buz|frost)\b/i, rgb: [0.3, 0.7, 1], label: "blue" },
  { re: /\b(cyan|camg[oö]be[gğ]i|teal|turkuaz)\b/i, rgb: [0.3, 0.9, 1], label: "cyan" },
  { re: /\b(red|k[ıi]rm[ıi]z[ıi]|blood|kan)\b/i, rgb: [1, 0.25, 0.2], label: "red" },
  { re: /\b(orange|turuncu|fire|ate[sş]|alev|ember)\b/i, rgb: [1, 0.6, 0.2], label: "fire orange" },
  { re: /\b(purple|mor|violet|arcane|b[uü]y[uü])\b/i, rgb: [0.6, 0.3, 1], label: "purple" },
  { re: /\b(green|ye[sş]il|poison|zehir|toxic)\b/i, rgb: [0.3, 1, 0.5], label: "green" },
  { re: /\b(gold|alt[ıi]n|yellow|sar[ıi])\b/i, rgb: [1, 0.85, 0.3], label: "gold" },
  { re: /\b(pink|pembe|magenta)\b/i, rgb: [1, 0.4, 0.7], label: "pink" },
  { re: /\b(white|beyaz|holy|kutsal)\b/i, rgb: [1, 1, 1], label: "white" },
];

interface Rule {
  re: RegExp;
  step: Omit<VfxStep, "params"> & { params?: Record<string, unknown> };
  label: string;
}

// Order matters: composites (broad scenes) first, then specific primitives.
const RULES: Rule[] = [
  // ---- composites / scenes ----
  { re: /(\bexplosion\b|patlama(?:s[ıi])?|\bblast\b|\bdetonat|infilak)/i, label: "explosion", step: { type: "composite", name: "cinematicExplosion" } },
  { re: /\b(magic\s*(cast|spell)|spell\s*cast|b[uü]y[uü](?:l[uü])?\s*(yap|cast|patlama(?:s[ıi])?|[cç]ember(?:i)?)?|sihir)\b/i, label: "magic cast", step: { type: "composite", name: "magicCast" } },
  { re: /\b(power\s*surge|enerji\s*dalga(?:s[ıi])?|sci-?fi\s*surge|g[uü][cç]\s*dalga(?:s[ıi])?)\b/i, label: "power surge", step: { type: "composite", name: "powerSurge" } },
  { re: /\b(storm|f[ıi]rt[ıi]na(?:s[ıi])?|thunderstorm)\b/i, label: "storm", step: { type: "composite", name: "stormScene" } },
  { re: /\b(celebrat|kutlama|victory|zafer|win\b|confetti|konfeti)\b/i, label: "celebration", step: { type: "composite", name: "celebration" } },

  // ---- elemental ----
  { re: /\b(fire\s*ball|fireball|ate[sş]\s*topu)\b/i, label: "fireball", step: { type: "preset", name: "energyBurst", params: { color: [1, 0.6, 0.2] } } },
  { re: /\b(fire|ate[sş]|alev|flame|yan(?:g[ıi]n|an))\b/i, label: "fire", step: { type: "preset", name: "fireSmoke", params: { mode: "fire" } } },
  { re: /\b(smoke|duman|sis)\b/i, label: "smoke", step: { type: "preset", name: "fireSmoke", params: { mode: "smoke" } } },
  { re: /\b(lightning|[sş]im[sş]ek|y[ıi]ld[ıi]r[ıi]m|electric|elektrik|thunder|bolt)\b/i, label: "lightning", step: { type: "preset", name: "lightningBolt" } },
  { re: /\b(rain|ya[gğ]mur)\b/i, label: "rain", step: { type: "preset", name: "rainStorm" } },
  { re: /\b(snow|kar\b|blizzard|tipi)\b/i, label: "snow", step: { type: "preset", name: "snowFall" } },
  { re: /\b(water|su\b|splash|s[ıi][cç]rama|ripple|dalga)\b/i, label: "water", step: { type: "preset", name: "waterRipple" } },

  // ---- energy / sci-fi ----
  { re: /\b(portal|vortex|wormhole|solucan\s*deli[gğ]i|girdap)\b/i, label: "portal", step: { type: "preset", name: "portal" } },
  { re: /\b(shield|kalkan|force\s*field|bariyer|barrier)\b/i, label: "force field", step: { type: "preset", name: "forceField", params: { impact: true } } },
  { re: /\b(beam|laser|lazer|[ıi][sş][ıi]n|ray\s*gun)\b/i, label: "energy beam", step: { type: "preset", name: "energyBeam" } },
  { re: /\b(shock\s*wave|shockwave|[sş]ok\s*dalga(?:s[ıi])?|sars[ıi]nt[ıi])\b/i, label: "shockwave", step: { type: "preset", name: "shockwave" } },
  { re: /\b(magic\s*circle|b[uü]y[uü]\s*[cç]ember(?:i)?|rune|r[uü]n|sigil|sigi)\b/i, label: "magic circle", step: { type: "preset", name: "magicCircle" } },
  { re: /\b(aura|power\s*up|powerup|g[uü][cç]len(?:me)?|buff|charge\s*aura)\b/i, label: "power aura", step: { type: "preset", name: "powerAura" } },
  { re: /\b(charge\s*up|chargeup|[sş]arj|enerji\s*topla(?:ma)?|g[uü][cç]\s*topla(?:ma)?)\b/i, label: "charge up", step: { type: "preset", name: "chargeUp" } },
  { re: /\b(plexus|network\s*lines|a[gğ]\s*[cç]izgi|connected\s*dots)\b/i, label: "plexus", step: { type: "preset", name: "plexusNetwork" } },

  // ---- impact / melee / ranged ----
  { re: /(\bburst\b|p[ıi]nar|\bradial\s*burst\b|enerji\s*patlama(?:s[ıi])?)/i, label: "energy burst", step: { type: "preset", name: "energyBurst" } },
  { re: /\b(impact|hit|vuru[sş]|darbe(?:si)?|[cç]arp(?:ma)?)\b/i, label: "hit spark", step: { type: "preset", name: "hitSpark" } },
  { re: /\b(spark|k[ıi]v[ıi]lc[ıi]m(?:lar)?)\b/i, label: "spark", step: { type: "preset", name: "hitSpark" } },
  { re: /\b(slash|sword|k[ıi]l[ıi][cç]|kesik|sav(?:ur|ru)(?:ma)?)\b/i, label: "sword slash", step: { type: "preset", name: "swordSlash" } },
  { re: /\b(speed\s*lines|h[ıi]z\s*[cç]izgi|anime\s*lines)\b/i, label: "speed lines", step: { type: "preset", name: "speedLines" } },
  { re: /\b(muzzle|gun\s*fire|gunfire|silah\s*ate[sş]|namlu|at[ıi][sş])\b/i, label: "muzzle flash", step: { type: "preset", name: "muzzleFlash" } },
  { re: /\b(disintegrat|da[gğ][ıi]l|toz\s*ol|dissolve|eriy)\b/i, label: "disintegrate", step: { type: "preset", name: "disintegrate" } },

  // ---- light / atmosphere ----
  { re: /\b(light\s*rays|god\s*rays|[ıi][sş][ıi]k\s*huzme|volumetric)\b/i, label: "light rays", step: { type: "preset", name: "lightRays" } },
  { re: /\b(lens\s*flare|flare|parlama)\b/i, label: "lens flare", step: { type: "preset", name: "lensFlare" } },
  { re: /\b(fog|sis|haze|pus)\b/i, label: "fog", step: { type: "preset", name: "atmosphericFog" } },
  { re: /\b(hologram|holografik|holo)\b/i, label: "hologram", step: { type: "preset", name: "hologram" } },
  { re: /\b(bokeh|defocus)\b/i, label: "bokeh", step: { type: "preset", name: "bokeh" } },
  { re: /\b(glitch|bozulma|datamosh)\b/i, label: "glitch", step: { type: "preset", name: "glitch" } },
  { re: /\b(neon)\b/i, label: "neon", step: { type: "preset", name: "neonGlow" } },
];

function parseIntensity(p: string): number {
  if (/\b(massive|huge|devasa|kocaman|epic|destans[ıi]|intense|yo[gğ]un|extreme|a[sş][ıi]r[ıi]|powerful|g[uü][cç]l[uü]|big|b[uü]y[uü]k)\b/i.test(p)) return 1.8;
  if (/\b(subtle|hafif|ince|small|k[uü][cç][uü]k|gentle|yumu[sş]ak|light)\b/i.test(p)) return 0.5;
  return 1;
}

function parseColor(p: string): { rgb: RGB | null; label: string | null } {
  for (const c of COLORS) if (c.re.test(p)) return { rgb: c.rgb, label: c.label };
  return { rgb: null, label: null };
}

function parseFormat(p: string): { width: number; height: number } {
  if (/\b(vertical|dikey|reels?|tiktok|shorts?|story|9:16|portrait)\b/i.test(p)) return { width: 1080, height: 1920 };
  if (/\b(square|kare|1:1)\b/i.test(p)) return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

export interface VfxPlanOptions {
  /** Hero layer name for layer-mode presets when applying to an existing AEP. */
  targetLayer?: string;
  /** Override comp duration (seconds). */
  duration?: number;
  fps?: number;
  /** Focal point [x,y]; defaults to comp center. */
  position?: [number, number];
}

export function buildVfxPlanFromPrompt(prompt: string, opts: VfxPlanOptions = {}): VfxPlan {
  const p = String(prompt || "");
  const intensity = parseIntensity(p);
  const { rgb, label: colorLabel } = parseColor(p);
  const fmt = parseFormat(p);
  const duration = opts.duration ?? 5;
  const fps = opts.fps ?? 30;
  const notes: string[] = [];
  const matched: string[] = [];

  const center: [number, number] = opts.position ?? [fmt.width / 2, fmt.height / 2];

  // Layer-mode presets that need a target; if none provided we still let them
  // run with their built-in fallback (e.g. powerAura -> embers).
  const layerMode = new Set(["powerAura", "disintegrate", "hologram", "neonGlow", "glitch", "premiumGlow", "lightSweep"]);

  const steps: VfxStep[] = [];
  for (const rule of RULES) {
    if (!rule.re.test(p)) continue;
    matched.push(rule.label);
    const params: Record<string, unknown> = { ...(rule.step.params ?? {}) };
    // Apply parsed color unless the rule pinned its own elemental color.
    if (rgb && params.color == null) params.color = rgb;
    // Composites take intensity; presets take strength scaling via intensity too.
    if (rule.step.type === "composite") {
      params.intensity = intensity;
      params.position = center;
      if (rgb) params.color = rgb;
    } else {
      params.position = params.position ?? center;
      if (typeof params.strength === "number") params.strength = (params.strength as number) * intensity;
    }
    const step: VfxStep = { type: rule.step.type, name: rule.step.name, params };
    if (rule.step.type === "preset" && layerMode.has(rule.step.name) && opts.targetLayer) {
      step.targetLayer = opts.targetLayer;
    }
    steps.push(step);
  }

  if (steps.length === 0) {
    notes.push("No specific VFX keyword recognized — defaulting to an energy burst. Try words like explosion, fire, lightning, portal, shield, beam, magic, shockwave.");
    steps.push({ type: "preset", name: "energyBurst", params: { color: rgb ?? [0.4, 0.8, 1], position: center, intensity } });
  }

  if (colorLabel) notes.push(`Color: ${colorLabel}.`);
  notes.push(`Intensity: ${intensity === 1.8 ? "high" : intensity === 0.5 ? "subtle" : "balanced"} (${intensity}).`);

  return {
    steps,
    composition: { width: fmt.width, height: fmt.height, duration, fps, name: "MotionPilot_VFX" },
    intensity,
    color: rgb,
    matched,
    notes,
  };
}
