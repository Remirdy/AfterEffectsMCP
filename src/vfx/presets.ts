/**
 * MotionPilot VFX preset catalog.
 *
 * Each preset maps a human-facing effect name to a single MPVFX ExtendScript
 * function plus sensible default parameters and a target mode. Presets are
 * grouped by domain (game / cinema / social / ad) so the planner and the
 * `apply_vfx` tool can offer professional, domain-expert effects.
 */

export type VfxDomain = "game" | "cinema" | "social" | "ad";

/** How a preset is applied. */
export type VfxTargetMode =
  | "comp" // spawns its own layers into the comp (no target layer needed)
  | "layer"; // decorates / requires an existing target layer

export interface VfxParamSpec {
  start?: number;
  duration?: number;
  /** RGB 0..1 triplet. */
  color?: [number, number, number];
  strength?: number;
  /** Free-form extra options forwarded verbatim to the JSX function. */
  [k: string]: unknown;
}

export interface VfxPreset {
  id: string;
  domain: VfxDomain;
  name: string;
  description: string;
  /** MPVFX registry function this preset calls. */
  fn: string;
  targetMode: VfxTargetMode;
  defaults: VfxParamSpec;
  /** Whether the effect benefits from a premium plugin (informational). */
  premiumPlugin?: string;
}

export const VFX_PRESETS: VfxPreset[] = [
  // ---------------- GAME ----------------
  {
    id: "game.energy_burst",
    domain: "game",
    name: "Energy Burst",
    description: "Radial particle explosion for hits, casts and power-ups. Uses Trapcode Particular or CC Particle World, falls back to a procedural shape burst.",
    fn: "energyBurst",
    targetMode: "comp",
    defaults: { duration: 1.2, color: [0.3, 0.7, 1], strength: 1 },
    premiumPlugin: "Trapcode Particular",
  },
  {
    id: "game.shockwave",
    domain: "game",
    name: "Shockwave",
    description: "Expanding distortion ring with heat-haze refraction for impacts and ground slams.",
    fn: "shockwave",
    targetMode: "comp",
    defaults: { duration: 0.9, color: [0.7, 0.85, 1], strength: 18 },
  },
  {
    id: "game.magic_circle",
    domain: "game",
    name: "Arcane Magic Circle",
    description: "Rotating concentric rune polygons with glow — spell cast / summon ground sigil.",
    fn: "magicCircle",
    targetMode: "comp",
    defaults: { color: [0.55, 0.35, 1] },
  },
  {
    id: "game.power_aura",
    domain: "game",
    name: "Power-Up Aura",
    description: "Pulsing glow plus rising embers around a hero layer (charge / buff state).",
    fn: "powerAura",
    targetMode: "layer",
    defaults: { color: [1, 0.6, 0.2] },
  },
  {
    id: "game.hit_spark",
    domain: "game",
    name: "Hit Spark",
    description: "Short directional impact spark for melee hits and UI feedback.",
    fn: "hitSpark",
    targetMode: "comp",
    defaults: { duration: 0.35, rays: 6, color: [1, 0.9, 0.4] },
  },

  // ---------------- CINEMA ----------------
  {
    id: "cinema.atmospheric_fog",
    domain: "cinema",
    name: "Atmospheric Fog",
    description: "Slow drifting volumetric haze from layered fractal noise. Adds depth and mood.",
    fn: "atmosphericFog",
    targetMode: "comp",
    defaults: { strength: 35 },
  },
  {
    id: "cinema.light_rays",
    domain: "cinema",
    name: "Volumetric Light Rays",
    description: "God-rays / light shafts. CC Light Rays when present, radial-gradient fallback.",
    fn: "lightRays",
    targetMode: "comp",
    defaults: { strength: 120 },
  },
  {
    id: "cinema.lens_flare",
    domain: "cinema",
    name: "Anamorphic Lens Flare",
    description: "Animated lens flare sweeping across frame. Optical Flares when available, stock flare otherwise.",
    fn: "lensFlare",
    targetMode: "comp",
    defaults: { duration: 1.5 },
    premiumPlugin: "Video Copilot Optical Flares",
  },
  {
    id: "cinema.fire",
    domain: "cinema",
    name: "Procedural Fire",
    description: "Rising fire column built from fractal noise + turbulent displacement + fire colorize.",
    fn: "fireSmoke",
    targetMode: "comp",
    defaults: { mode: "fire" },
  },
  {
    id: "cinema.smoke",
    domain: "cinema",
    name: "Procedural Smoke",
    description: "Soft rising smoke from fractal noise + displacement, screen-blended.",
    fn: "fireSmoke",
    targetMode: "comp",
    defaults: { mode: "smoke" },
  },
  {
    id: "cinema.energy_beam",
    domain: "cinema",
    name: "Energy Beam / Laser",
    description: "Glowing crackling beam between two points. Video Copilot Saber when present, stroke+glow fallback.",
    fn: "energyBeam",
    targetMode: "comp",
    defaults: { duration: 1.0, color: [0.3, 0.8, 1], strength: 8 },
    premiumPlugin: "Video Copilot Saber",
  },
  {
    id: "cinema.film_grain",
    domain: "cinema",
    name: "Film Grain",
    description: "Subtle organic grain overlay as an adjustment layer for a filmic texture.",
    fn: "filmGrain",
    targetMode: "comp",
    defaults: { strength: 8 },
  },
  {
    id: "cinema.color_grade",
    domain: "cinema",
    name: "Cinematic Grade + Vignette",
    description: "Curves/vibrance adjustment plus a soft feathered vignette for a film look.",
    fn: "cinematicGrade",
    targetMode: "comp",
    defaults: {},
  },

  // ---------------- SOCIAL ----------------
  {
    id: "social.glitch",
    domain: "social",
    name: "Digital Glitch",
    description: "Choppy RGB-split / block-displacement glitch hit for transitions and accents.",
    fn: "glitch",
    targetMode: "layer",
    defaults: { duration: 0.5 },
  },
  {
    id: "social.rgb_split",
    domain: "social",
    name: "Chromatic Aberration",
    description: "RGB channel split for a trendy retro / vaporwave look.",
    fn: "rgbSplit",
    targetMode: "layer",
    defaults: { strength: 6 },
  },
  {
    id: "social.neon_glow",
    domain: "social",
    name: "Neon Sign Glow",
    description: "Layered glow + flicker turning text/shapes into a neon sign.",
    fn: "neonGlow",
    targetMode: "layer",
    defaults: { color: [0.2, 1, 0.9] },
  },
  {
    id: "social.whip_pan",
    domain: "social",
    name: "Whip Pan Transition",
    description: "Fast directional-blur whip-pan between scenes (Reels/TikTok cut).",
    fn: "whipPan",
    targetMode: "comp",
    defaults: { duration: 0.4, angle: 90 },
  },
  {
    id: "social.kinetic_pop",
    domain: "social",
    name: "Kinetic Pop",
    description: "Punchy scale-overshoot + tilt pop for stickers, emojis and captions.",
    fn: "kineticPop",
    targetMode: "layer",
    defaults: {},
  },

  // ---------------- ADVANCED GAME ----------------
  {
    id: "game.lightning_bolt",
    domain: "game",
    name: "Branching Lightning",
    description: "Jagged branching electric arc between two points with glow + flicker. Use from/to ([x,y]).",
    fn: "lightningBolt",
    targetMode: "comp",
    defaults: { duration: 0.6, color: [0.6, 0.8, 1], strength: 4, branches: 2, segments: 9 },
  },
  {
    id: "game.portal",
    domain: "game",
    name: "Portal / Wormhole",
    description: "Swirling polar-distorted vortex with rotating energy rings and core glow.",
    fn: "portal",
    targetMode: "comp",
    defaults: { color: [0.5, 0.2, 1] },
  },
  {
    id: "game.force_field",
    domain: "game",
    name: "Force Field / Shield",
    description: "Translucent energy dome with fresnel edge glow and optional impact ripple (set impact:true).",
    fn: "forceField",
    targetMode: "comp",
    defaults: { color: [0.3, 0.7, 1], impact: false },
  },
  {
    id: "game.disintegrate",
    domain: "game",
    name: "Disintegration",
    description: "Scatter a target layer into particles (Thanos-style dissolve). CC Pixel Polly or stock displace fallback.",
    fn: "disintegrate",
    targetMode: "layer",
    defaults: { duration: 1.4, strength: 40 },
  },
  {
    id: "game.sword_slash",
    domain: "game",
    name: "Sword / Energy Slash",
    description: "Fast curved slash arc with trim-path reveal, glow and motion blur.",
    fn: "swordSlash",
    targetMode: "comp",
    defaults: { duration: 0.4, color: [1, 1, 1], radius: 240 },
  },
  {
    id: "game.speed_lines",
    domain: "game",
    name: "Anime Speed Lines",
    description: "Radial focus speed lines converging on a point (set dark:true for manga ink lines).",
    fn: "speedLines",
    targetMode: "comp",
    defaults: { duration: 0.8 },
  },
  {
    id: "game.charge_up",
    domain: "game",
    name: "Energy Charge-Up",
    description: "Growing core glow with converging energy that releases a burst at the end.",
    fn: "chargeUp",
    targetMode: "comp",
    defaults: { duration: 1.4, color: [0.4, 0.8, 1] },
  },
  {
    id: "game.muzzle_flash",
    domain: "game",
    name: "Muzzle Flash",
    description: "Brief radial muzzle flash with directional sparks for gunfire.",
    fn: "muzzleFlash",
    targetMode: "comp",
    defaults: { duration: 0.12, radius: 90, color: [1, 0.85, 0.5] },
  },

  // ---------------- ADVANCED CINEMA ----------------
  {
    id: "cinema.hologram",
    domain: "cinema",
    name: "Sci-Fi Hologram",
    description: "Scanlines + cyan tint + flicker + glow turning a target layer into a hologram.",
    fn: "hologram",
    targetMode: "layer",
    defaults: { color: [0.3, 0.9, 1], strength: 82 },
  },
  {
    id: "cinema.rain_storm",
    domain: "cinema",
    name: "Rain Storm",
    description: "Falling rain + atmospheric haze. CC Rainfall when present, procedural streaks otherwise.",
    fn: "rainStorm",
    targetMode: "comp",
    defaults: { strength: 8000 },
  },
  {
    id: "cinema.snow_fall",
    domain: "cinema",
    name: "Snow Fall",
    description: "Drifting snow. CC Snowfall when present, particle/fog fallback otherwise.",
    fn: "snowFall",
    targetMode: "comp",
    defaults: { strength: 6000 },
  },
  {
    id: "cinema.water_ripple",
    domain: "cinema",
    name: "Water Ripple / Caustics",
    description: "Wave-warp surface distortion + caustics on everything beneath (adjustment layer).",
    fn: "waterRipple",
    targetMode: "comp",
    defaults: { strength: 18 },
  },
  {
    id: "cinema.light_leak",
    domain: "cinema",
    name: "Light Leak / Film Burn",
    description: "Warm organic drifting gradient flare, screen-blended for an analog film feel.",
    fn: "lightLeak",
    targetMode: "comp",
    defaults: { strength: 35, color: [1, 0.55, 0.2] },
  },

  // ---------------- ADVANCED AD / SOCIAL ----------------
  {
    id: "ad.plexus_network",
    domain: "ad",
    name: "Plexus Network",
    description: "Connected-dots tech network. Trapcode Form when present, procedural cell-pattern fallback.",
    fn: "plexusNetwork",
    targetMode: "comp",
    defaults: { strength: 45, color: [0.4, 0.7, 1] },
  },
  {
    id: "ad.bokeh",
    domain: "ad",
    name: "Bokeh Lights",
    description: "Soft defocused floating light dots for premium product backgrounds.",
    fn: "bokeh",
    targetMode: "comp",
    defaults: { strength: 40, color: [1, 0.9, 0.7] },
  },
  {
    id: "social.confetti",
    domain: "social",
    name: "Confetti Burst",
    description: "Celebratory confetti particles raining/scattering for win moments.",
    fn: "confetti",
    targetMode: "comp",
    defaults: { color: [1, 0.4, 0.6] },
  },

  // ---------------- PREMIUM AD POLISH (brand-safe, cinematic) ----------------
  {
    id: "ad.light_sweep",
    domain: "ad",
    name: "Hero Light Sweep",
    description: "Premium shine sweeping across a hero/title layer (CC Light Sweep, brand-safe).",
    fn: "lightSweep",
    targetMode: "layer",
    defaults: { start: 1.1, duration: 1.5 },
  },
  {
    id: "ad.premium_glow",
    domain: "ad",
    name: "Premium Soft Glow",
    description: "Clean two-stage glow (tight core + wide halo) on a hero layer — no flicker.",
    fn: "premiumGlow",
    targetMode: "layer",
    defaults: { strength: 80 },
  },
  {
    id: "ad.motion_blur",
    domain: "ad",
    name: "Enable Motion Blur",
    description: "Turns on comp + per-layer motion blur for a professional, smooth motion feel.",
    fn: "enableMotionBlur",
    targetMode: "comp",
    defaults: {},
  },
];

// ---------------------------------------------------------------------------
// Composite recipes — multi-layer, production-grade effects applied in one call.
// These names map to MPVFX.runComposite(); intensity (0.2..2) scales the stack.
// ---------------------------------------------------------------------------
export interface VfxComposite {
  id: string;
  domain: VfxDomain;
  name: string;
  description: string;
  steps: string[];
}

export const VFX_COMPOSITES: VfxComposite[] = [
  {
    id: "premiumAdPolish",
    domain: "ad",
    name: "Premium Ad Polish",
    description: "Brand-safe cinematic finish: motion blur + soft bokeh + hero light sweep + premium glow + subtle light leak + cinematic grade + fine film grain. No game-style FX.",
    steps: ["enableMotionBlur", "bokeh", "lightLeak", "premiumGlow", "lightSweep", "cinematicGrade", "filmGrain"],
  },
  {
    id: "premiumReveal",
    domain: "ad",
    name: "Premium Hero Reveal",
    description: "Depth bokeh + volumetric light rays + hero light sweep + cinematic grade + grain for product/hero reveals.",
    steps: ["enableMotionBlur", "lightRays", "bokeh", "lightSweep", "cinematicGrade", "filmGrain"],
  },
  {
    id: "cinematicExplosion",
    domain: "cinema",
    name: "Cinematic Explosion",
    description: "Full explosion stack: flash → fireball → fire → smoke → shockwave → sparks → cinematic grade.",
    steps: ["muzzleFlash", "energyBurst", "fire", "smoke", "shockwave", "hitSpark", "cinematicGrade"],
  },
  {
    id: "magicCast",
    domain: "game",
    name: "Magic Spell Cast",
    description: "Charge-up → arcane circle → lightning discharge → shockwave release.",
    steps: ["chargeUp", "magicCircle", "lightningBolt", "shockwave"],
  },
  {
    id: "heroEntrance",
    domain: "cinema",
    name: "Hero Entrance",
    description: "Volumetric light rays → lens flare → atmospheric fog → bokeh → cinematic grade.",
    steps: ["lightRays", "lensFlare", "atmosphericFog", "bokeh", "cinematicGrade"],
  },
  {
    id: "celebration",
    domain: "social",
    name: "Celebration",
    description: "Confetti + dual color bursts + bokeh + light leak for win / reveal moments.",
    steps: ["confetti", "energyBurst", "energyBurst", "bokeh", "lightLeak"],
  },
  {
    id: "powerSurge",
    domain: "game",
    name: "Sci-Fi Power Surge",
    description: "Force field + lightning + plexus network + charge-up for tech/energy moments.",
    steps: ["forceField", "lightningBolt", "plexusNetwork", "chargeUp"],
  },
  {
    id: "stormScene",
    domain: "cinema",
    name: "Storm Scene",
    description: "Rain storm + atmospheric fog + lightning flashes + cinematic grade.",
    steps: ["rainStorm", "lightningBolt", "lightningBolt", "cinematicGrade"],
  },
];

export function listVfxComposites(domain?: VfxDomain): VfxComposite[] {
  return domain ? VFX_COMPOSITES.filter((c) => c.domain === domain) : VFX_COMPOSITES;
}

export function getVfxComposite(id: string): VfxComposite | undefined {
  return VFX_COMPOSITES.find((c) => c.id === id);
}

export function listVfxPresets(domain?: VfxDomain): VfxPreset[] {
  return domain ? VFX_PRESETS.filter((p) => p.domain === domain) : VFX_PRESETS;
}

export function getVfxPreset(id: string): VfxPreset | undefined {
  return VFX_PRESETS.find((p) => p.id === id);
}
