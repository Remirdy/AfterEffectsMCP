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

  // ======================================================================
  // ★ PREMIUM PAID PLUGIN PRESETS ★
  // (Fallback to stock AE when plugin is not installed)
  // ======================================================================

  // --- Video Copilot Element 3D ---
  {
    id: "premium.element3d_object",
    domain: "ad",
    name: "Element 3D Object",
    description: "Photorealistic 3D object rendered inside AE via Video Copilot Element 3D. Falls back to a 3D shape-layer mockup. Supply modelPath for a custom .obj.",
    fn: "element3dObject",
    targetMode: "comp",
    defaults: { duration: 4, color: [0.9, 0.9, 1], rotationSpeed: 45, scale: 100 },
    premiumPlugin: "Video Copilot Element 3D",
  },
  {
    id: "premium.element3d_product",
    domain: "ad",
    name: "Element 3D Product Spin",
    description: "360° product hero rotation using Element 3D with studio lighting, HDRI reflection and depth-of-field. Falls back to a 2.5D spinning solid.",
    fn: "element3dProductSpin",
    targetMode: "comp",
    defaults: { duration: 6, color: [1, 1, 1], bevelSize: 3, reflectivity: 0.6 },
    premiumPlugin: "Video Copilot Element 3D",
  },

  // --- Trapcode Shine ---
  {
    id: "premium.trapcode_shine",
    domain: "cinema",
    name: "Trapcode Shine Light Rays",
    description: "Ultra-high-quality volumetric light rays from Trapcode Shine. Far superior to CC Light Rays — produces cinematic god rays with threshold masking. Falls back to CC Light Rays.",
    fn: "trapcodeShine",
    targetMode: "comp",
    defaults: { strength: 4.5, sourcePoint: [960, 200], rayLength: 8, colorize: true, color: [1, 0.85, 0.6] },
    premiumPlugin: "Trapcode Shine",
  },

  // --- Trapcode Starglow ---
  {
    id: "premium.starglow",
    domain: "cinema",
    name: "Trapcode Starglow",
    description: "Multi-directional star-shaped glint/glow streaks on bright pixels — iconic cinematic sparkle effect. Falls back to stylized glow + star shape layers.",
    fn: "trapcodeStarglow",
    targetMode: "layer",
    defaults: { streakLength: 25, boost: 1.8, color: [1, 0.95, 0.8] },
    premiumPlugin: "Trapcode Starglow",
  },

  // --- Trapcode Mir ---
  {
    id: "premium.mir_surface",
    domain: "ad",
    name: "Trapcode Mir 3D Surface",
    description: "Reflective undulating 3D mesh surface / abstract landscape using Trapcode Mir. Perfect for techy background environments. Falls back to a Caustics + wave warp solid.",
    fn: "trapcodeМir",
    targetMode: "comp",
    defaults: { color: [0.2, 0.4, 0.8], wireframe: false, reflections: true, amplitude: 120 },
    premiumPlugin: "Trapcode Mir",
  },

  // --- Video Copilot Optical Flares (full hero setup) ---
  {
    id: "premium.optical_flares_hero",
    domain: "cinema",
    name: "Optical Flares Hero Setup",
    description: "Full cinematic Optical Flares setup: hero source flare + secondary anamorphic streaks + lens shimmer + animated position. The definitive lens flare for film VFX. Falls back to stock Lens Flare.",
    fn: "opticalFlaresHero",
    targetMode: "comp",
    defaults: { duration: 3, brightness: 100, position: [960, 540], anamorphicStreak: true, color: [1, 0.9, 0.7] },
    premiumPlugin: "Video Copilot Optical Flares",
  },

  // --- Video Copilot Saber (enhanced) ---
  {
    id: "premium.saber_energy_slash",
    domain: "game",
    name: "Saber Energy Slash",
    description: "Video Copilot Saber generating a vivid curved energy slash with glow core, edge shimmer and after-trail. Smoother and brighter than the built-in sword_slash. Falls back to stroke+glow combo.",
    fn: "saberEnergySlash",
    targetMode: "comp",
    defaults: { duration: 0.6, color: [0.2, 0.9, 1], glowIntensity: 3.5, coreSize: 8 },
    premiumPlugin: "Video Copilot Saber",
  },
  {
    id: "premium.saber_portal",
    domain: "game",
    name: "Saber Portal Ring",
    description: "Saber-powered swirling circular portal ring with electric edge — more detailed than the built-in portal effect. Falls back to shape-layer ring + glow.",
    fn: "saberPortal",
    targetMode: "comp",
    defaults: { duration: 2.5, color: [0.6, 0.1, 1], ringRadius: 320, pulseSpeed: 1.5 },
    premiumPlugin: "Video Copilot Saber",
  },

  // --- Trapcode Particular (advanced cloud) ---
  {
    id: "premium.particular_storm",
    domain: "cinema",
    name: "Particular Storm Cloud",
    description: "Dense 3D volumetric storm cloud using Trapcode Particular with turbulence and depth. Thousands of particles forming a realistic atmospheric mass. Falls back to fractal noise solid.",
    fn: "particularStormCloud",
    targetMode: "comp",
    defaults: { strength: 8000, color: [0.4, 0.4, 0.5], turbulence: 120, lifespan: 4 },
    premiumPlugin: "Trapcode Particular",
  },
  {
    id: "premium.particular_fairy_dust",
    domain: "ad",
    name: "Particular Fairy Dust / Magic Sparkles",
    description: "Premium magical sparkle trail using Trapcode Particular — tiny glowing particles drifting upward with twinkle expressions. Falls back to CC Particle World.",
    fn: "particularFairyDust",
    targetMode: "comp",
    defaults: { color: [1, 0.9, 0.5], strength: 300, size: 3, lifespan: 3 },
    premiumPlugin: "Trapcode Particular",
  },

  // ======================================================================
  // ★ ÇILGIN / CRAZY EFEKTLER — AE'DE NATIVE OLMAYAN ★
  // ======================================================================

  // --- Digital Rain ---
  {
    id: "crazy.digital_rain",
    domain: "cinema",
    name: "Matrix Digital Rain",
    description: "Matrix-style cascading green katakana/binary character rain. Built from expression-driven text layers with stagger and randomized fall speeds. AE has no native equivalent.",
    fn: "digitalRain",
    targetMode: "comp",
    defaults: { color: [0.1, 1, 0.3], columns: 24, speed: 1, glowIntensity: 2.5, duration: 6 },
  },

  // --- Pixel Sort Glitch ---
  {
    id: "crazy.pixel_sort",
    domain: "social",
    name: "Pixel Sort Glitch Art",
    description: "Pixel-sorting aesthetic from glitch art — directional streaks where bright pixels bleed horizontally. Achieved via Directional Blur + threshold + displacement. AE has no native pixel-sort.",
    fn: "pixelSort",
    targetMode: "layer",
    defaults: { duration: 1.5, angle: 0, threshold: 128, strength: 80 },
  },

  // --- Liquid Fill ---
  {
    id: "crazy.liquid_fill",
    domain: "ad",
    name: "Liquid Fill / Pour Effect",
    description: "A shape/text layer appears to fill up with liquid from the bottom — wave-top surface, color gradient, meniscus wobble. Pure AE expression + wave warp + masks. No native AE liquid sim.",
    fn: "liquidFill",
    targetMode: "layer",
    defaults: { duration: 2.5, color: [0.1, 0.5, 1], waveAmplitude: 12, bubbles: true },
  },

  // --- Fractal Zoom ---
  {
    id: "crazy.fractal_zoom",
    domain: "cinema",
    name: "Infinite Fractal Zoom",
    description: "Infinite zooming tunnel/fractal animation using nested pre-comps + scale expressions + fractal noise. Creates an infinite corridor illusion. Not natively possible in AE without expressions.",
    fn: "fractalZoom",
    targetMode: "comp",
    defaults: { duration: 6, color: [0.3, 0.0, 0.8], zoomSpeed: 1.5, depth: 7 },
  },

  // --- Holographic HUD Overlay ---
  {
    id: "crazy.holographic_hud",
    domain: "cinema",
    name: "Holographic HUD Overlay",
    description: "Full sci-fi HUD (Heads-Up Display): corner brackets, rotating radar, scanning bars, data readout text, glitch flicker, cyan tint — all from shape layers + expressions. AE has no HUD builder.",
    fn: "holographicHud",
    targetMode: "comp",
    defaults: { color: [0.1, 0.9, 1], scanSpeed: 1.5, showRadar: true, showBrackets: true, showDataReadout: true },
  },

  // --- ASCII Art Filter ---
  {
    id: "crazy.ascii_art",
    domain: "social",
    name: "ASCII Art Filter",
    description: "Converts a layer into an animated ASCII-art styled mosaic using Mosaic effect + expression-driven character grid. No native ASCII mode in AE.",
    fn: "asciiArt",
    targetMode: "layer",
    defaults: { cellSize: 12, contrast: 1.4, color: [0.2, 1, 0.4] },
  },

  // --- Thermal Camera ---
  {
    id: "crazy.thermal_cam",
    domain: "cinema",
    name: "Thermal / Infrared Camera",
    description: "False-color thermal camera look: hot areas = white/yellow/red, cold = blue/black. Uses gradient remap + glow + noise. Not available natively in AE.",
    fn: "thermalCam",
    targetMode: "layer",
    defaults: { strength: 1.0, palette: "military" },
  },

  // --- Cloth Wave ---
  {
    id: "crazy.cloth_wave",
    domain: "ad",
    name: "Cloth / Flag Wave Simulation",
    description: "Realistic cloth/flag waving simulation using wave warp + displacement + corner-pin expressions with damping physics. AE has no cloth sim — this is a procedural approximation.",
    fn: "clothWave",
    targetMode: "layer",
    defaults: { duration: 4, waveHeight: 40, speed: 1.2, direction: 90, pinLeft: true },
  },

  // --- Watercolor Paint ---
  {
    id: "crazy.watercolor",
    domain: "ad",
    name: "Watercolor Paint Effect",
    description: "Transforms a layer into an animated watercolor painting: paper texture, paint bleed, wet-edge bleeding, color spread via Roughen Edges + fractal + color shift. No native watercolor in AE.",
    fn: "watercolorPaint",
    targetMode: "layer",
    defaults: { bleedAmount: 35, paperTexture: true, colorSpread: 1.4 },
  },

  // --- Databend / Corruption ---
  {
    id: "crazy.databend",
    domain: "social",
    name: "Databend / Corrupt File Glitch",
    description: "Extreme glitch aesthetic: block corruption, color channel dropout, macro displacement, freeze-frame artifacts and scanline tears. Inspired by databending. More extreme than standard glitch.",
    fn: "databend",
    targetMode: "layer",
    defaults: { duration: 2, intensity: 1, blockSize: 40, channelDropout: true },
  },

  // --- VHS Retro ---
  {
    id: "crazy.vhs_retro",
    domain: "social",
    name: "Full VHS Tape Effect",
    description: "Complete VHS tape aesthetic: tracking error bars, luminance noise, color bleed, chroma shift, tape wobble, scan lines, VHS timestamp overlay. Much more complete than simple chromatic aberration.",
    fn: "vhsRetro",
    targetMode: "comp",
    defaults: { duration: 4, tracking: 1.0, noise: 0.6, colorBleed: 1.2, showTimestamp: true },
  },

  // --- Mirror / Kaleidoscope ---
  {
    id: "crazy.kaleidoscope",
    domain: "ad",
    name: "Mirror / Kaleidoscope",
    description: "Animated kaleidoscope / symmetry effect: 4-8 mirror axes, rotation, zoom — pure expression + CC Kaleida. Great for music videos and hypnotic ad backgrounds.",
    fn: "kaleidoscope",
    targetMode: "layer",
    defaults: { segments: 8, rotation: 1.0, zoom: 1.05 },
  },

  // --- Synthwave Grid ---
  {
    id: "crazy.synthwave_grid",
    domain: "social",
    name: "Synthwave Retro Grid",
    description: "Outrun/synthwave perspective grid floor with horizon glow, sunset gradient sky, grid line flash pulse. Built from shape layers + perspective expressions. Instantly iconic aesthetic.",
    fn: "synthwaveGrid",
    targetMode: "comp",
    defaults: { color: [1, 0.2, 0.8], gridColor: [0.5, 0.1, 1], horizonGlow: true, duration: 4 },
  },

  // --- Duotone ---
  {
    id: "crazy.duotone",
    domain: "social",
    name: "Duotone Color Grade",
    description: "Two-color duotone image treatment: maps shadows to one hue, highlights to another. Uber-popular in editorial/social design. Achieved via gradient remap — often requested, no direct native AE preset.",
    fn: "duotone",
    targetMode: "layer",
    defaults: { shadowColor: [0.1, 0.0, 0.5], highlightColor: [1, 0.6, 0.0], contrast: 1.2 },
  },

  // --- Noise Tunnel ---
  {
    id: "crazy.noise_tunnel",
    domain: "cinema",
    name: "Psychedelic Noise Tunnel",
    description: "Hypnotic animated tunnel built from polar-coordinate-transformed fractal noise. Time-offset expressions drive the zooming tunnel illusion. Pure AE expression art — no plugin needed.",
    fn: "noiseTunnel",
    targetMode: "comp",
    defaults: { color: [0.4, 0.0, 1], speed: 1.5, complexity: 4, duration: 6 },
  },

  // ======================================================================
  // ★ WAVE 3 — NEW VFX PRESETS ★
  // ======================================================================

  // ── Cinema: post-processing missing pieces ──────────────────────────────
  {
    id: "cinema.bloom",
    domain: "cinema",
    name: "Cinematic Bloom",
    description: "Soft multi-stage bloom effect: bright areas spread a wide organic glow halo. Built from 3 stacked Glow passes at different radii, screen-blended — more organic than a single Glow.",
    fn: "cinematicBloom",
    targetMode: "comp",
    defaults: { strength: 1.0, radius: 80, threshold: 0.65 },
  },
  {
    id: "cinema.depth_of_field",
    domain: "cinema",
    name: "Depth of Field Simulation",
    description: "Procedural depth-of-field: radial blur from a focal point with adjustable falloff. Uses Camera Lens Blur on an adjustment layer, or Directional Blur fallback for lighter rigs.",
    fn: "depthOfField",
    targetMode: "comp",
    defaults: { focalPoint: [0.5, 0.5], focalRange: 300, blurAmount: 20, backgroundOnly: true },
  },
  {
    id: "cinema.lens_distortion",
    domain: "cinema",
    name: "Lens Distortion",
    description: "Barrel / fisheye / pincushion lens distortion. Optics Compensation effect with animated chromatic aberration. Great for action cameras or stylized looks.",
    fn: "lensDistortion",
    targetMode: "layer",
    defaults: { amount: -25, addAberration: true },
  },
  {
    id: "cinema.ink_reveal",
    domain: "cinema",
    name: "Ink Reveal",
    description: "Ink drop in water — a layer reveals through spreading ink bleed using fractal noise + turbulent displace + luma matte. No native AE equivalent.",
    fn: "inkReveal",
    targetMode: "layer",
    defaults: { duration: 2.5, inkColor: [0.05, 0.05, 0.1], spread: 1.2 },
  },
  {
    id: "cinema.paint_stroke",
    domain: "cinema",
    name: "Paint Stroke Reveal",
    description: "A layer reveals through an animated brush paint stroke — trim path on a thick textured stroke sweeping across the frame.",
    fn: "paintStrokeReveal",
    targetMode: "layer",
    defaults: { duration: 1.5, direction: 0, strokeWidth: 80, color: [0.1, 0.1, 0.1] },
  },

  // ── Game: missing status effect types ───────────────────────────────────
  {
    id: "game.spawn_effect",
    domain: "game",
    name: "Spawn / Materialize",
    description: "Character or object materializes from energy particles converging + flash + settling. The reverse of disintegrate.",
    fn: "spawnEffect",
    targetMode: "layer",
    defaults: { duration: 1.0, color: [0.5, 0.8, 1], flashColor: [1, 1, 1] },
  },
  {
    id: "game.heal_aura",
    domain: "game",
    name: "Healing Aura",
    description: "Green rising sparkles + soft pulsing glow ring around a hero layer. Classic RPG heal / regen visual.",
    fn: "healAura",
    targetMode: "layer",
    defaults: { duration: 2.5, color: [0.2, 1, 0.4], particleCount: 30 },
  },
  {
    id: "game.death_dissolve",
    domain: "game",
    name: "Death / Dissolve Out",
    description: "Layer dissolves into upward-drifting dark particles then fades. Classic game character death effect.",
    fn: "deathDissolve",
    targetMode: "layer",
    defaults: { duration: 1.8, color: [0.3, 0.05, 0.05], particleCount: 60 },
  },
  {
    id: "game.freeze_effect",
    domain: "game",
    name: "Ice Freeze / Crystallize",
    description: "Layer appears to freeze over: blue tint + ice crystal growth (fractal noise threshold) + cold vapor particles + crack lines.",
    fn: "freezeEffect",
    targetMode: "layer",
    defaults: { duration: 1.2, color: [0.5, 0.85, 1], crackLines: true },
  },

  // ── Social: missing animation presets ───────────────────────────────────
  {
    id: "social.bounce_in",
    domain: "social",
    name: "Bounce In",
    description: "Layer bounces in from a direction with elastic overshoot: position + scale keyframes with spring physics curve.",
    fn: "bounceIn",
    targetMode: "layer",
    defaults: { direction: "bottom", duration: 0.6, overshoot: 1.3 },
  },
  {
    id: "social.slide_transition",
    domain: "social",
    name: "Slide Transition",
    description: "Smooth directional slide transition between two clips — one slides out as the next slides in, with optional motion blur.",
    fn: "slideTransition",
    targetMode: "comp",
    defaults: { direction: "left", duration: 0.5, addBlur: true },
  },
  {
    id: "social.sticker_pop",
    domain: "social",
    name: "Sticker / Emoji Pop",
    description: "Punchy sticker-style pop-on: rapid scale overshoot + slight rotation + bounce settle + optional shadow. Perfect for captions and reaction stickers.",
    fn: "stickerPop",
    targetMode: "layer",
    defaults: { duration: 0.4, rotation: 8, addShadow: true },
  },
  {
    id: "social.zoom_transition",
    domain: "social",
    name: "Zoom Blur Transition",
    description: "Ultra-fast zoom-in blur transition: radial fast blur out then into the next shot. TikTok / Reels signature cut.",
    fn: "zoomTransition",
    targetMode: "comp",
    defaults: { duration: 0.25, blurAmount: 80 },
  },

  // ── Ad: missing product effects ─────────────────────────────────────────
  {
    id: "ad.product_shine_360",
    domain: "ad",
    name: "Product 360° Shine",
    description: "A full 360° light sweep around a product layer: 4 light sweeps at 90° intervals, staggered for a rotating-light studio look.",
    fn: "productShine360",
    targetMode: "layer",
    defaults: { duration: 3, color: [1, 1, 0.95], intensity: 60 },
  },
  {
    id: "ad.glass_morphism",
    domain: "ad",
    name: "Glass Morphism UI Card",
    description: "Frosted glass UI card effect: blurred background + white edge highlight + subtle inner glow + drop shadow. 2024-era glassmorphism aesthetic.",
    fn: "glassMorphism",
    targetMode: "layer",
    defaults: { blurAmount: 25, opacity: 0.7, borderGlow: true },
  },
  {
    id: "ad.smoke_title",
    domain: "ad",
    name: "Smoke Title Reveal",
    description: "Title text reveals through dissipating smoke: text appears as smoke clears, then particles drift away. Cinematic ad opener.",
    fn: "smokeTitleReveal",
    targetMode: "layer",
    defaults: { duration: 3.0, smokeColor: [0.5, 0.5, 0.5], addLight: true },
  },
  {
    id: "ad.glitch_logo",
    domain: "ad",
    name: "Glitch Logo Reveal",
    description: "Logo reveal through digital glitch: corrupted blocks → RGB split → settle clean. Tech brand aesthetic.",
    fn: "glitchLogoReveal",
    targetMode: "layer",
    defaults: { duration: 1.2, intensity: 1.0, finalGlow: true },
  },
  {
    id: "crazy.dimensional_rift",
    domain: "game",
    name: "Dimensional Rift / Portal Crack",
    description: "A screen-shattering dimensional portal rift that opens a crack in the comp to reveal nebula/star precomp behind.",
    fn: "dimensionalRift",
    targetMode: "comp",
    defaults: { duration: 4.0, color: [0.6, 0.2, 1], riftWidth: 350 },
  },
  {
    id: "crazy.cyber_scan",
    domain: "game",
    name: "Cybernetic Scan / Tech HUD",
    description: "Sweeping laser scan lines, radar sweep, and target locking brackets decorating a hero layer.",
    fn: "cyberScanOverlay",
    targetMode: "layer",
    defaults: { color: [0.1, 0.9, 1], scanSpeed: 1.2 },
  },
  {
    id: "cinema.planet_globe",
    domain: "cinema",
    name: "3D Procedural Planet",
    description: "A 3D orbiting planet with atmospheres, rotating clouds, shading, and planetary rings.",
    fn: "planetGlobeGenerator",
    targetMode: "comp",
    defaults: { duration: 10.0, color: [0.3, 0.6, 1], ringColor: [0.8, 0.7, 0.9], addRings: true },
  },
  {
    id: "cinema.cosmic_nebula",
    domain: "cinema",
    name: "3D Volumetric Nebula",
    description: "A volumetric space nebula dust cloud with black hole core and accretion disk animation.",
    fn: "cosmicNebulaGenerator",
    targetMode: "comp",
    defaults: { duration: 12.0, color: [0.8, 0.3, 1], blackHole: true },
  },
  {
    id: "social.pixel_art",
    domain: "social",
    name: "Pixel Art / CRT Filter",
    description: "Turns any layer or comp into a retro 8-bit or 16-bit game pixel art style with dither, CRT scanlines.",
    fn: "pixelArtFilter",
    targetMode: "layer",
    defaults: { cellSize: 12, dither: true, scanlines: true },
  },
  {
    id: "cinema.gravity_warp",
    domain: "cinema",
    name: "Black Hole Gravitational Warp",
    description: "Physical gravity lens lensing distortion map warping surrounding space and stars around a black hole core.",
    fn: "gravityWarp",
    targetMode: "comp",
    defaults: { singularityColor: [0.9, 0.45, 1.0], accretionDiskColor: [1.0, 0.55, 0.1], warpStrength: 85 },
  },
  {
    id: "cinema.liquid_lava",
    domain: "cinema",
    name: "Liquid Lava Simulator",
    description: "Procedural metaball liquid simulation of organic lava or slime using blur and simple choker thresholding.",
    fn: "liquidLava",
    targetMode: "comp",
    defaults: { lavaColor: [1.0, 0.25, 0.0], glowColor: [1.0, 0.65, 0.1], blobCount: 12 },
  },
  {
    id: "cinema.lightning_storm",
    domain: "cinema",
    name: "Lightning Storm Generator",
    description: "Atmospheric lightning storm environment with cloud generator, rain sheet, ambient triggers, lightning bolts, and rumble.",
    fn: "lightningStorm",
    targetMode: "comp",
    defaults: { glowColor: [0.3, 0.75, 1.0], boltFrequency: 2, addRain: true },
  },
  {
    id: "game.magic_sigil",
    domain: "game",
    name: "Summoning Magic Sigil",
    description: "3D layered magical circle summoning ritual with rotating runic layers, dash paths, and draw-in Trim Paths.",
    fn: "magicSigil",
    targetMode: "comp",
    defaults: { glowColor: [0.6, 0.3, 1.0], runeText: "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ", drawDuration: 2.5 },
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

  // ★ YENİ PREMIUM + CRAZY COMPOSİTES ★
  {
    id: "epicHeroReveal",
    domain: "ad",
    name: "Epic Hero Reveal (Premium)",
    description: "Element 3D product spin + Optical Flares hero + Trapcode Shine rays + Starglow sparkle + premium glow + cinematic grade. The ultimate product launch reveal.",
    steps: ["element3dProductSpin", "opticalFlaresHero", "trapcodeShine", "trapcodeStarglow", "premiumGlow", "lightSweep", "cinematicGrade"],
  },
  {
    id: "neonCyberpunk",
    domain: "social",
    name: "Neon Cyberpunk",
    description: "Digital Rain background + neon glow + holographic HUD overlay + RGB split + glitch hits + duotone blue-magenta grade. Blade Runner / cyberpunk aesthetic.",
    steps: ["digitalRain", "holographicHud", "neonGlow", "rgbSplit", "glitch", "duotone"],
  },
  {
    id: "retroVHSSynthwave",
    domain: "social",
    name: "Retro VHS Synthwave",
    description: "Full VHS tape effect + synthwave retro grid + duotone pink-purple + film grain + light leak + chromatic aberration. 80s outrun aesthetic.",
    steps: ["vhsRetro", "synthwaveGrid", "duotone", "lightLeak", "filmGrain", "rgbSplit"],
  },
  {
    id: "matrixHack",
    domain: "cinema",
    name: "Matrix Hack Scene",
    description: "Digital rain cascade + holographic HUD overlay + hologram layer effect + databend glitch + cinematic green grade. Full Matrix hacker aesthetic.",
    steps: ["digitalRain", "holographicHud", "hologram", "databend", "cinematicGrade"],
  },
  {
    id: "cosmicStarfield",
    domain: "cinema",
    name: "Cosmic Starfield",
    description: "Starglow sparkle field + noise tunnel portal + plexus star network + atmospheric fog haze + cinematic color grade. Deep space sci-fi look.",
    steps: ["trapcodeStarglow", "noiseTunnel", "plexusNetwork", "atmosphericFog", "cinematicGrade"],
  },
  {
    id: "liquidDream",
    domain: "ad",
    name: "Liquid Dream",
    description: "Liquid fill hero layer + water ripple caustics + kaleidoscope reflection + bokeh depth + watercolor paint texture + premium glow. Dreamy fluid aesthetic.",
    steps: ["liquidFill", "waterRipple", "kaleidoscope", "watercolorPaint", "bokeh", "premiumGlow"],
  },
  {
    id: "saberMagicBattle",
    domain: "game",
    name: "Saber Magic Battle",
    description: "Saber energy slash + magic circle + charge-up glow + Particular fairy dust + lightning bolt + shockwave release + energy burst. Full anime-style magic battle VFX.",
    steps: ["saberEnergySlash", "magicCircle", "chargeUp", "particularFairyDust", "lightningBolt", "shockwave", "energyBurst"],
  },
  {
    id: "glitchArtHero",
    domain: "social",
    name: "Glitch Art Hero",
    description: "Pixel sort + databend corruption + ASCII art mosaic + chromatic aberration + glitch hit + kinetic pop. Maximum glitch art aesthetic for experimental content.",
    steps: ["pixelSort", "databend", "asciiArt", "rgbSplit", "glitch", "kineticPop"],
  },

  // ★ WAVE 3 — NEW COMPOSITE RECIPES ★
  {
    id: "epicBattleScene",
    domain: "game",
    name: "Epic Battle Scene",
    description: "Full anime battle: magic cast → saber slash × 2 → freeze effect → shockwave → energy burst × 3 → cinematic explosion → speed lines. Maximum intensity game VFX.",
    steps: ["magicCircle", "chargeUp", "saberEnergySlash", "saberEnergySlash", "lightningBolt", "shockwave", "energyBurst", "energyBurst", "cinematicGrade"],
  },
  {
    id: "productLaunchHero",
    domain: "ad",
    name: "Product Launch Hero",
    description: "Premium product reveal: Element 3D spin + 360° product shine + Optical Flares hero + Starglow sparkle + Shine rays + bloom + cinematic grade. The definitive product launch opener.",
    steps: ["element3dProductSpin", "productShine360", "opticalFlaresHero", "trapcodeStarglow", "trapcodeShine", "cinematicBloom", "premiumGlow", "cinematicGrade"],
  },
  {
    id: "dreamSequence",
    domain: "cinema",
    name: "Dream Sequence",
    description: "Dreamy atmospheric look: depth of field + atmospheric fog + bokeh drift + light leak × 2 + watercolor paint + bloom + warm cinematic grade. Ideal for flashback/memory sequences.",
    steps: ["depthOfField", "atmosphericFog", "bokeh", "lightLeak", "lightLeak", "watercolorPaint", "cinematicBloom", "cinematicGrade"],
  },
  {
    id: "naturalDisaster",
    domain: "cinema",
    name: "Natural Disaster",
    description: "Storm scene on steroids: rain storm + lightning × 3 + atmospheric fog + cinematic explosion debris + shockwave + dark grade. Weather emergency / disaster film look.",
    steps: ["rainStorm", "lightningBolt", "lightningBolt", "lightningBolt", "atmosphericFog", "shockwave", "energyBurst", "cinematicGrade"],
  },
  {
    id: "sunriseScene",
    domain: "cinema",
    name: "Sunrise / Golden Hour",
    description: "Warm golden hour scene: Shine light rays from horizon + light leak × 2 + atmospheric fog + bokeh dust particles + bloom + warm grade. Cinematic sunrise reveal.",
    steps: ["trapcodeShine", "lightLeak", "lightLeak", "atmosphericFog", "bokeh", "cinematicBloom", "filmGrain", "cinematicGrade"],
  },
  {
    id: "underseaWorld",
    domain: "cinema",
    name: "Undersea World",
    description: "Underwater scene: water ripple distortion + caustics + atmospheric fog (tinted blue) + particles (bubbles) + light rays from above + bloom + cold blue grade.",
    steps: ["waterRipple", "atmosphericFog", "bokeh", "lightRays", "confetti", "cinematicBloom", "cinematicGrade"],
  },
  {
    id: "hackingSequence",
    domain: "cinema",
    name: "Hacking Sequence",
    description: "Full hacker aesthetic: digital rain cascade + holographic HUD overlay + hologram layer effect + databend glitch hits + pixel sort lines + green cinematic grade.",
    steps: ["digitalRain", "holographicHud", "hologram", "databend", "pixelSort", "glitch", "cinematicGrade"],
  },
  {
    id: "galaxyFlythrough",
    domain: "cinema",
    name: "Galaxy Fly-Through",
    description: "Deep space fly-through: noise tunnel + Starglow sparkle field + plexus star network + atmospheric nebula fog + cosmic bloom + grade. Sci-fi establishing shot.",
    steps: ["noiseTunnel", "trapcodeStarglow", "plexusNetwork", "atmosphericFog", "cinematicBloom", "cinematicGrade"],
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
