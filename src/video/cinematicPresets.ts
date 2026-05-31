/**
 * MotionPilot Cinematic Presets Catalog.
 *
 * Professional video / cinematic preset definitions that describe shot
 * composition, camera movement, color grading, lighting and pacing.  Presets
 * are grouped by domain (brandFilm / cinematic / socialAd / productPromo /
 * documentary / musicVideo / abstractMotion) so the planner can compose
 * production-grade video sequences.
 *
 * Architecture mirrors `vfx/presets.ts` — domain-based organisation, typed
 * interfaces, flat arrays and thin helper functions.
 */

// ---------------------------------------------------------------------------
// Domain & Attribute Types
// ---------------------------------------------------------------------------

/** Primary production domain a preset belongs to. */
export type VideoDomain =
  | "brandFilm"
  | "cinematic"
  | "socialAd"
  | "productPromo"
  | "documentary"
  | "musicVideo"
  | "abstractMotion";

/** Physical shot framing. */
export type ShotType =
  | "wide"
  | "medium"
  | "close"
  | "extreme-close"
  | "aerial"
  | "tracking"
  | "dolly"
  | "crane"
  | "steadicam"
  | "pov"
  | "overhead"
  | "dutch-angle";

/** Camera movement during the shot. */
export type CameraMove =
  | "static"
  | "dolly-in"
  | "dolly-out"
  | "crane-up"
  | "crane-down"
  | "orbit"
  | "steadicam-follow"
  | "pan-left"
  | "pan-right"
  | "tilt-up"
  | "tilt-down"
  | "zoom-in"
  | "zoom-out"
  | "push-in"
  | "pull-out"
  | "handheld"
  | "whip-pan"
  | "drone-orbit";

/** Transition effect between shots. */
export type TransitionType =
  | "cut"
  | "dissolve"
  | "whip-pan"
  | "zoom-push"
  | "light-leak"
  | "glitch-cut"
  | "morph"
  | "wipe"
  | "iris"
  | "slide"
  | "blur-transition"
  | "flash";

/** Color grading look applied to the shot. */
export type ColorGradeProfile =
  | "teal-orange"
  | "cold-blue"
  | "warm-golden"
  | "desaturated"
  | "neon-vibrant"
  | "pastel-soft"
  | "bleach-bypass"
  | "cross-process"
  | "monochrome"
  | "vintage-film"
  | "neutral";

/** Lighting setup / mood of the shot. */
export type LightingProfile =
  | "high-key"
  | "low-key"
  | "silhouette"
  | "golden-hour"
  | "blue-hour"
  | "neon-night"
  | "volumetric"
  | "soft-diffused"
  | "dramatic-contrast"
  | "studio-three-point";

// ---------------------------------------------------------------------------
// Cinematic Preset
// ---------------------------------------------------------------------------

/** A single cinematic shot preset with all compositional attributes. */
export interface CinematicPreset {
  /** Unique preset identifier (domain.camelCaseName). */
  id: string;
  /** Production domain this preset belongs to. */
  domain: VideoDomain;
  /** Human-readable English name. */
  name: string;
  /** Human-readable Turkish name. */
  nametr: string;
  /** Short description of the shot and its intended use. */
  description: string;
  /** Physical framing of the shot. */
  shotType: ShotType;
  /** Camera movement during the shot. */
  cameraMove: CameraMove;
  /** Lens focal length / descriptor, e.g. "35mm", "85mm", "16mm wide". */
  lens: string;
  /** Depth-of-field treatment. */
  dof: "shallow" | "deep" | "rack-focus";
  /** Lighting setup / mood. */
  lighting: LightingProfile;
  /** Color grading look. */
  colorGrade: ColorGradeProfile;
  /** Edit pacing / tempo. */
  pacing: "slow" | "medium" | "fast" | "ramping";
  /** Transition effect entering this shot. */
  transitionIn: TransitionType;
  /** Transition effect leaving this shot. */
  transitionOut: TransitionType;
  /** Duration recommendation in seconds. */
  suggestedDuration: number;
  /** AE effects / techniques to apply for this look. */
  aeEffects: string[];
}

// ---------------------------------------------------------------------------
// Preset Catalog
// ---------------------------------------------------------------------------

export const VIDEO_PRESETS: CinematicPreset[] = [
  // ======================== BRAND FILM ========================
  {
    id: "brandFilm.heroReveal",
    domain: "brandFilm",
    name: "Hero Reveal",
    nametr: "Kahraman Açılış",
    description:
      "Grand opening wide shot with slow dolly-in through volumetric haze. Teal-orange grade sells premium brand authority.",
    shotType: "wide",
    cameraMove: "dolly-in",
    lens: "24mm",
    dof: "shallow",
    lighting: "volumetric",
    colorGrade: "teal-orange",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "CC Light Rays",
      "Fractal Noise (fog)",
      "Vignette",
    ],
  },
  {
    id: "brandFilm.brandMoment",
    domain: "brandFilm",
    name: "Brand Moment",
    nametr: "Marka Anı",
    description:
      "Orbiting medium shot capturing the emotional brand beat — warm golden tones with soft diffused light and a gentle light-leak entry.",
    shotType: "medium",
    cameraMove: "orbit",
    lens: "50mm",
    dof: "shallow",
    lighting: "soft-diffused",
    colorGrade: "warm-golden",
    pacing: "medium",
    transitionIn: "light-leak",
    transitionOut: "dissolve",
    suggestedDuration: 5,
    aeEffects: [
      "Lumetri Color",
      "Light Leak overlay",
      "Gaussian Blur (BG)",
      "Glow",
    ],
  },
  {
    id: "brandFilm.productShowcase",
    domain: "brandFilm",
    name: "Product Showcase",
    nametr: "Ürün Vitrini",
    description:
      "Tight close-up dolly-in on the hero product under controlled studio lighting. Clean neutral grade, shallow DOF draws the eye.",
    shotType: "close",
    cameraMove: "dolly-in",
    lens: "85mm",
    dof: "shallow",
    lighting: "studio-three-point",
    colorGrade: "neutral",
    pacing: "slow",
    transitionIn: "cut",
    transitionOut: "zoom-push",
    suggestedDuration: 5,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "CC Light Sweep",
      "Drop Shadow",
    ],
  },
  {
    id: "brandFilm.teamStory",
    domain: "brandFilm",
    name: "Team Story",
    nametr: "Ekip Hikayesi",
    description:
      "Steadicam follow-shot of the people behind the brand. Warm golden naturalistic grade with deep focus to keep the environment in context.",
    shotType: "medium",
    cameraMove: "steadicam-follow",
    lens: "35mm",
    dof: "deep",
    lighting: "soft-diffused",
    colorGrade: "warm-golden",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Warp Stabilizer",
      "Lumetri Color",
      "Film Grain",
      "Vignette",
    ],
  },
  {
    id: "brandFilm.valueProposition",
    domain: "brandFilm",
    name: "Value Proposition",
    nametr: "Değer Önerisi",
    description:
      "Clean, static medium frame for text supers and key messaging. High-key, neutral palette keeps brand colours accurate.",
    shotType: "medium",
    cameraMove: "static",
    lens: "50mm",
    dof: "deep",
    lighting: "high-key",
    colorGrade: "neutral",
    pacing: "medium",
    transitionIn: "cut",
    transitionOut: "wipe",
    suggestedDuration: 4,
    aeEffects: [
      "Lumetri Color",
      "Linear Wipe",
      "Text Animator",
      "Drop Shadow",
    ],
  },

  // ======================== CINEMATIC ========================
  {
    id: "cinematic.epicEstablishing",
    domain: "cinematic",
    name: "Epic Establishing",
    nametr: "Epik Kurucu Çekim",
    description:
      "Sweeping wide crane-up revealing a vast landscape or set at golden hour. Deep focus and teal-orange grade for maximum scale.",
    shotType: "wide",
    cameraMove: "crane-up",
    lens: "16mm wide",
    dof: "deep",
    lighting: "golden-hour",
    colorGrade: "teal-orange",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 8,
    aeEffects: [
      "Lumetri Color",
      "CC Light Rays",
      "Fractal Noise (atmo)",
      "Film Grain",
      "Vignette",
    ],
  },
  {
    id: "cinematic.emotionalCloseUp",
    domain: "cinematic",
    name: "Emotional Close-Up",
    nametr: "Duygusal Yakın Çekim",
    description:
      "Static extreme close-up on the subject's face / eyes. Shallow DOF, low-key lighting, desaturated grade — raw intimacy.",
    shotType: "extreme-close",
    cameraMove: "static",
    lens: "85mm",
    dof: "shallow",
    lighting: "low-key",
    colorGrade: "desaturated",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "cut",
    suggestedDuration: 5,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "Curves (lift shadows)",
      "Film Grain",
    ],
  },
  {
    id: "cinematic.actionSequence",
    domain: "cinematic",
    name: "Action Sequence",
    nametr: "Aksiyon Sekansı",
    description:
      "Handheld tracking shot with fast pacing and whip-pan transitions. Bleach-bypass grade with dramatic contrast sells gritty urgency.",
    shotType: "tracking",
    cameraMove: "handheld",
    lens: "35mm",
    dof: "deep",
    lighting: "dramatic-contrast",
    colorGrade: "bleach-bypass",
    pacing: "fast",
    transitionIn: "whip-pan",
    transitionOut: "whip-pan",
    suggestedDuration: 4,
    aeEffects: [
      "Warp Stabilizer (partial)",
      "Directional Blur",
      "Lumetri Color",
      "CC Force Motion Blur",
      "Film Grain (heavy)",
    ],
  },
  {
    id: "cinematic.dramaticReveal",
    domain: "cinematic",
    name: "Dramatic Reveal",
    nametr: "Dramatik Açılış",
    description:
      "Slow dolly-in with rack-focus from wide context to subject detail. Volumetric lighting and cold-blue grade build tension; pacing ramps up toward the reveal beat.",
    shotType: "wide",
    cameraMove: "dolly-in",
    lens: "50mm",
    dof: "rack-focus",
    lighting: "volumetric",
    colorGrade: "cold-blue",
    pacing: "ramping",
    transitionIn: "blur-transition",
    transitionOut: "flash",
    suggestedDuration: 7,
    aeEffects: [
      "Camera Lens Blur (animated)",
      "CC Light Rays",
      "Lumetri Color",
      "Optical Flares",
      "Time Remap",
    ],
  },
  {
    id: "cinematic.nightMood",
    domain: "cinematic",
    name: "Night Mood",
    nametr: "Gece Atmosferi",
    description:
      "Steadicam medium shot drifting through a neon-lit nightscape. Shallow DOF with vibrant neon colour palette and light-leak outro.",
    shotType: "medium",
    cameraMove: "steadicam-follow",
    lens: "35mm",
    dof: "shallow",
    lighting: "neon-night",
    colorGrade: "neon-vibrant",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "light-leak",
    suggestedDuration: 6,
    aeEffects: [
      "Lumetri Color",
      "Glow",
      "Camera Lens Blur",
      "Light Leak overlay",
      "Film Grain",
    ],
  },

  // ======================== SOCIAL AD ========================
  {
    id: "socialAd.scrollStopper",
    domain: "socialAd",
    name: "Scroll Stopper",
    nametr: "Kaydırma Durdurucu",
    description:
      "Punchy close-up zoom-in with a flash entry. High-key neon-vibrant grade grabs attention in the first 0.5s of a feed scroll.",
    shotType: "close",
    cameraMove: "zoom-in",
    lens: "50mm",
    dof: "shallow",
    lighting: "high-key",
    colorGrade: "neon-vibrant",
    pacing: "fast",
    transitionIn: "flash",
    transitionOut: "cut",
    suggestedDuration: 3,
    aeEffects: [
      "Transform (scale keyframes)",
      "Lumetri Color",
      "Glow",
      "CC Radial Fast Blur",
    ],
  },
  {
    id: "socialAd.quickDemo",
    domain: "socialAd",
    name: "Quick Demo",
    nametr: "Hızlı Demo",
    description:
      "Clean static medium for a fast product walkthrough. Deep DOF keeps everything sharp; neutral grade preserves UI / product colours.",
    shotType: "medium",
    cameraMove: "static",
    lens: "35mm",
    dof: "deep",
    lighting: "high-key",
    colorGrade: "neutral",
    pacing: "fast",
    transitionIn: "cut",
    transitionOut: "cut",
    suggestedDuration: 4,
    aeEffects: [
      "Lumetri Color",
      "Motion Tile (screen mockup)",
      "Drop Shadow",
    ],
  },
  {
    id: "socialAd.testimonialBite",
    domain: "socialAd",
    name: "Testimonial Bite",
    nametr: "Müşteri Yorumu",
    description:
      "Warm close-up of a talking head with soft lighting and shallow DOF. Dissolve in/out conveys trust and approachability.",
    shotType: "close",
    cameraMove: "static",
    lens: "85mm",
    dof: "shallow",
    lighting: "soft-diffused",
    colorGrade: "warm-golden",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "Film Grain (light)",
      "Vignette",
    ],
  },
  {
    id: "socialAd.beforeAfter",
    domain: "socialAd",
    name: "Before / After",
    nametr: "Önce / Sonra",
    description:
      "Side-by-side or whip-pan wipe revealing a transformation. Deep focus, neutral grade, fast pacing for maximum impact.",
    shotType: "medium",
    cameraMove: "whip-pan",
    lens: "35mm",
    dof: "deep",
    lighting: "high-key",
    colorGrade: "neutral",
    pacing: "fast",
    transitionIn: "whip-pan",
    transitionOut: "whip-pan",
    suggestedDuration: 4,
    aeEffects: [
      "Directional Blur",
      "Linear Wipe",
      "Lumetri Color",
      "CC Force Motion Blur",
    ],
  },
  {
    id: "socialAd.urgentCTA",
    domain: "socialAd",
    name: "Urgent CTA",
    nametr: "Acil Çağrı",
    description:
      "Push-in close on the call-to-action with glitch-cut entry and flash exit. Neon-vibrant grade + dramatic contrast drives conversion urgency.",
    shotType: "close",
    cameraMove: "push-in",
    lens: "50mm",
    dof: "shallow",
    lighting: "dramatic-contrast",
    colorGrade: "neon-vibrant",
    pacing: "fast",
    transitionIn: "glitch-cut",
    transitionOut: "flash",
    suggestedDuration: 3,
    aeEffects: [
      "Transform (push-in keyframes)",
      "Lumetri Color",
      "Glow",
      "CC Pixel Polly (glitch)",
      "Exposure (flash)",
    ],
  },

  // ======================== PRODUCT PROMO ========================
  {
    id: "productPromo.unboxingReveal",
    domain: "productPromo",
    name: "Unboxing Reveal",
    nametr: "Kutu Açılış",
    description:
      "Crane-down into a close-up of the product emerging from packaging. Ramping pace accelerates into the hero moment; warm studio tones.",
    shotType: "close",
    cameraMove: "crane-down",
    lens: "85mm",
    dof: "shallow",
    lighting: "studio-three-point",
    colorGrade: "warm-golden",
    pacing: "ramping",
    transitionIn: "blur-transition",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Camera Lens Blur (animated)",
      "Lumetri Color",
      "CC Light Sweep",
      "Time Remap",
      "Vignette",
    ],
  },
  {
    id: "productPromo.featureHighlight",
    domain: "productPromo",
    name: "Feature Highlight",
    nametr: "Özellik Vurgusu",
    description:
      "Extreme close-up dolly-in on a specific product detail (texture, button, material). Slow pace lets the viewer absorb craftsmanship.",
    shotType: "extreme-close",
    cameraMove: "dolly-in",
    lens: "100mm macro",
    dof: "shallow",
    lighting: "studio-three-point",
    colorGrade: "neutral",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "zoom-push",
    suggestedDuration: 5,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "CC Light Sweep",
      "Sharpen",
    ],
  },
  {
    id: "productPromo.lifestyleContext",
    domain: "productPromo",
    name: "Lifestyle Context",
    nametr: "Yaşam Tarzı",
    description:
      "Wide steadicam follow of the product in real-world use at golden hour. Deep focus connects product to environment; warm naturalistic grade.",
    shotType: "wide",
    cameraMove: "steadicam-follow",
    lens: "35mm",
    dof: "deep",
    lighting: "golden-hour",
    colorGrade: "warm-golden",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Warp Stabilizer",
      "Lumetri Color",
      "CC Light Rays (subtle)",
      "Film Grain",
    ],
  },
  {
    id: "productPromo.techShowcase",
    domain: "productPromo",
    name: "Tech Showcase",
    nametr: "Teknoloji Vitrini",
    description:
      "Orbiting medium shot of a tech device under neon accents. Cold-blue grade + shallow DOF isolates the product; zoom-push transitions keep energy up.",
    shotType: "medium",
    cameraMove: "orbit",
    lens: "50mm",
    dof: "shallow",
    lighting: "neon-night",
    colorGrade: "cold-blue",
    pacing: "medium",
    transitionIn: "zoom-push",
    transitionOut: "light-leak",
    suggestedDuration: 5,
    aeEffects: [
      "Lumetri Color",
      "Glow",
      "CC Radial Fast Blur",
      "Light Leak overlay",
    ],
  },

  // ======================== DOCUMENTARY ========================
  {
    id: "documentary.interviewSetup",
    domain: "documentary",
    name: "Interview Setup",
    nametr: "Röportaj Çekimi",
    description:
      "Classic medium interview frame with shallow DOF on an 85mm. Soft-diffused lighting and neutral grade keep the subject honest and natural.",
    shotType: "medium",
    cameraMove: "static",
    lens: "85mm",
    dof: "shallow",
    lighting: "soft-diffused",
    colorGrade: "neutral",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "cut",
    suggestedDuration: 10,
    aeEffects: [
      "Camera Lens Blur",
      "Lumetri Color",
      "Film Grain (subtle)",
      "Vignette",
    ],
  },
  {
    id: "documentary.bRollMontage",
    domain: "documentary",
    name: "B-Roll Montage",
    nametr: "B-Roll Montaj",
    description:
      "Handheld wide establishing shots cut together as B-roll. Golden-hour light and vintage-film grade add an observational, lived-in texture.",
    shotType: "wide",
    cameraMove: "handheld",
    lens: "35mm",
    dof: "deep",
    lighting: "golden-hour",
    colorGrade: "vintage-film",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 8,
    aeEffects: [
      "Warp Stabilizer",
      "Lumetri Color",
      "Film Grain",
      "Vignette",
      "Color Balance (warm)",
    ],
  },
  {
    id: "documentary.aerialSurvey",
    domain: "documentary",
    name: "Aerial Survey",
    nametr: "Havadan Görüntü",
    description:
      "Drone orbit over a location. Deep focus captures geography; golden-hour teal-orange grade provides a cinematic documentary look.",
    shotType: "aerial",
    cameraMove: "drone-orbit",
    lens: "24mm",
    dof: "deep",
    lighting: "golden-hour",
    colorGrade: "teal-orange",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 10,
    aeEffects: [
      "Warp Stabilizer",
      "Lumetri Color",
      "CC Light Rays",
      "Film Grain",
    ],
  },
  {
    id: "documentary.archivalInsert",
    domain: "documentary",
    name: "Archival Insert",
    nametr: "Arşiv Görüntüsü",
    description:
      "Static medium frame for historical / archive footage inserts. Vintage-film grade and soft-diffused light unify disparate source material.",
    shotType: "medium",
    cameraMove: "static",
    lens: "50mm",
    dof: "deep",
    lighting: "soft-diffused",
    colorGrade: "vintage-film",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Lumetri Color",
      "Film Grain (heavy)",
      "Vignette (heavy)",
      "Gaussian Blur (edges)",
    ],
  },

  // ======================== MUSIC VIDEO ========================
  {
    id: "musicVideo.performanceShot",
    domain: "musicVideo",
    name: "Performance Shot",
    nametr: "Performans Çekimi",
    description:
      "Handheld medium on the artist performing. Dramatic contrast lighting with cross-process colour and fast hard cuts match musical energy.",
    shotType: "medium",
    cameraMove: "handheld",
    lens: "35mm",
    dof: "shallow",
    lighting: "dramatic-contrast",
    colorGrade: "cross-process",
    pacing: "fast",
    transitionIn: "cut",
    transitionOut: "cut",
    suggestedDuration: 4,
    aeEffects: [
      "Warp Stabilizer (partial)",
      "Lumetri Color",
      "Curves (cross-process)",
      "Film Grain",
    ],
  },
  {
    id: "musicVideo.rhythmicMontage",
    domain: "musicVideo",
    name: "Rhythmic Montage",
    nametr: "Ritmik Montaj",
    description:
      "Rapid close-up whip-pan cuts synced to beat drops. Neon-night lighting and vibrant neon grade; glitch-cut entries for maximum energy.",
    shotType: "close",
    cameraMove: "whip-pan",
    lens: "50mm",
    dof: "shallow",
    lighting: "neon-night",
    colorGrade: "neon-vibrant",
    pacing: "fast",
    transitionIn: "glitch-cut",
    transitionOut: "whip-pan",
    suggestedDuration: 3,
    aeEffects: [
      "Directional Blur",
      "Lumetri Color",
      "Glow",
      "CC Pixel Polly (glitch)",
      "Posterize Time (beat-sync)",
    ],
  },
  {
    id: "musicVideo.slowMotionMood",
    domain: "musicVideo",
    name: "Slow-Motion Mood",
    nametr: "Ağır Çekim Duygu",
    description:
      "Dolly-out close-up in slow motion. Golden-hour backlight with pastel-soft grade creates a dreamy, introspective bridge section.",
    shotType: "close",
    cameraMove: "dolly-out",
    lens: "85mm",
    dof: "shallow",
    lighting: "golden-hour",
    colorGrade: "pastel-soft",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "light-leak",
    suggestedDuration: 8,
    aeEffects: [
      "Time Remap (slow-mo)",
      "Pixel Motion Blur",
      "Camera Lens Blur",
      "Lumetri Color",
      "Light Leak overlay",
    ],
  },
  {
    id: "musicVideo.visualTrip",
    domain: "musicVideo",
    name: "Visual Trip",
    nametr: "Görsel Yolculuk",
    description:
      "Wide orbiting shot through volumetric fog with cross-process grading. Ramping pacing and morph transitions create a hallucinatory, surreal atmosphere.",
    shotType: "wide",
    cameraMove: "orbit",
    lens: "16mm wide",
    dof: "deep",
    lighting: "volumetric",
    colorGrade: "cross-process",
    pacing: "ramping",
    transitionIn: "morph",
    transitionOut: "morph",
    suggestedDuration: 10,
    aeEffects: [
      "CC Light Rays",
      "Fractal Noise (fog)",
      "Lumetri Color",
      "Curves (cross-process)",
      "Time Remap",
      "Optics Compensation (barrel)",
    ],
  },
  {
    id: "musicVideo.lyricVisual",
    domain: "musicVideo",
    name: "Lyric Visual",
    nametr: "Şarkı Sözü Görseli",
    description:
      "Static medium frame for lyric / typography overlay. Soft-diffused light and pastel-soft grade provide a gentle canvas for kinetic text.",
    shotType: "medium",
    cameraMove: "static",
    lens: "50mm",
    dof: "shallow",
    lighting: "soft-diffused",
    colorGrade: "pastel-soft",
    pacing: "medium",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 6,
    aeEffects: [
      "Lumetri Color",
      "Text Animator",
      "Gaussian Blur (BG)",
      "Glow (subtle)",
    ],
  },

  // ======================== ABSTRACT MOTION ========================
  {
    id: "abstractMotion.particleDrift",
    domain: "abstractMotion",
    name: "Particle Drift",
    nametr: "Parçacık Akışı",
    description:
      "Wide overhead field of slowly drifting particles. Deep focus, monochrome grade, slow pacing — ideal for titles and lower-thirds.",
    shotType: "overhead",
    cameraMove: "static",
    lens: "35mm",
    dof: "deep",
    lighting: "low-key",
    colorGrade: "monochrome",
    pacing: "slow",
    transitionIn: "dissolve",
    transitionOut: "dissolve",
    suggestedDuration: 8,
    aeEffects: [
      "CC Particle World",
      "Lumetri Color",
      "Glow",
      "Vignette",
    ],
  },
  {
    id: "abstractMotion.liquidWarp",
    domain: "abstractMotion",
    name: "Liquid Warp",
    nametr: "Sıvı Deformasyon",
    description:
      "Medium static shot with turbulent displacement creating organic liquid motion. Neon-vibrant cross-process grade with ramping pace for transitions.",
    shotType: "medium",
    cameraMove: "static",
    lens: "50mm",
    dof: "deep",
    lighting: "neon-night",
    colorGrade: "cross-process",
    pacing: "ramping",
    transitionIn: "morph",
    transitionOut: "morph",
    suggestedDuration: 5,
    aeEffects: [
      "Turbulent Displace",
      "CC Glass",
      "Lumetri Color",
      "Glow",
      "Curves (cross-process)",
    ],
  },
  {
    id: "abstractMotion.geometricPulse",
    domain: "abstractMotion",
    name: "Geometric Pulse",
    nametr: "Geometrik Nabız",
    description:
      "Dutch-angle close-up of repeating geometric shapes pulsing to a beat. Neon-vibrant grade, fast pacing, glitch-cut transitions.",
    shotType: "dutch-angle",
    cameraMove: "push-in",
    lens: "24mm",
    dof: "deep",
    lighting: "neon-night",
    colorGrade: "neon-vibrant",
    pacing: "fast",
    transitionIn: "glitch-cut",
    transitionOut: "glitch-cut",
    suggestedDuration: 4,
    aeEffects: [
      "Shape Layers (repeater)",
      "Lumetri Color",
      "Glow",
      "Posterize Time",
      "CC Pixel Polly",
    ],
  },
];

// ---------------------------------------------------------------------------
// Video Sequences — ordered multi-shot recipes (like VfxComposite)
// ---------------------------------------------------------------------------

/** An ordered sequence of cinematic presets forming a complete video segment. */
export interface VideoSequence {
  /** Unique sequence identifier. */
  id: string;
  /** Primary domain this sequence belongs to. */
  domain: VideoDomain;
  /** Human-readable name. */
  name: string;
  /** Short description of the sequence's narrative arc. */
  description: string;
  /** Ordered preset IDs that form this sequence. */
  presetSequence: string[];
  /** Total recommended duration in seconds. */
  totalDuration: number;
}

export const VIDEO_SEQUENCES: VideoSequence[] = [
  {
    id: "brandIntro30s",
    domain: "brandFilm",
    name: "Brand Intro (30s)",
    description:
      "Complete 30-second brand introduction arc: grand hero reveal → emotional brand moment → product close-up → team humanity → value message.",
    presetSequence: [
      "brandFilm.heroReveal",
      "brandFilm.brandMoment",
      "brandFilm.productShowcase",
      "brandFilm.teamStory",
      "brandFilm.valueProposition",
    ],
    totalDuration: 30,
  },
  {
    id: "cinematic60s",
    domain: "cinematic",
    name: "Cinematic Short (60s)",
    description:
      "One-minute cinematic reel: epic establishing → dramatic reveal → action peak → emotional close-up → atmospheric night close.",
    presetSequence: [
      "cinematic.epicEstablishing",
      "cinematic.dramaticReveal",
      "cinematic.actionSequence",
      "cinematic.emotionalCloseUp",
      "cinematic.nightMood",
    ],
    totalDuration: 60,
  },
  {
    id: "socialReel15s",
    domain: "socialAd",
    name: "Social Reel (15s)",
    description:
      "Fast 15-second social ad: attention-grabbing scroll stopper → quick product demo → urgent call-to-action.",
    presetSequence: [
      "socialAd.scrollStopper",
      "socialAd.quickDemo",
      "socialAd.urgentCTA",
    ],
    totalDuration: 15,
  },
  {
    id: "productLaunch45s",
    domain: "productPromo",
    name: "Product Launch (45s)",
    description:
      "45-second product launch video: hero brand reveal → unboxing → feature macro → lifestyle use → tech hero close.",
    presetSequence: [
      "brandFilm.heroReveal",
      "productPromo.unboxingReveal",
      "productPromo.featureHighlight",
      "productPromo.lifestyleContext",
      "productPromo.techShowcase",
    ],
    totalDuration: 45,
  },
  {
    id: "documentaryOpen",
    domain: "documentary",
    name: "Documentary Opening (40s)",
    description:
      "40-second documentary cold-open: aerial geography → interview setup → evocative B-roll montage.",
    presetSequence: [
      "documentary.aerialSurvey",
      "documentary.interviewSetup",
      "documentary.bRollMontage",
    ],
    totalDuration: 40,
  },
  {
    id: "musicVideoFull",
    domain: "musicVideo",
    name: "Music Video Full (90s)",
    description:
      "Full 90-second music video structure: performance energy → rhythmic montage → slow-motion bridge → surreal trip → lyric visual close.",
    presetSequence: [
      "musicVideo.performanceShot",
      "musicVideo.rhythmicMontage",
      "musicVideo.slowMotionMood",
      "musicVideo.visualTrip",
      "musicVideo.lyricVisual",
    ],
    totalDuration: 90,
  },
  {
    id: "testimonialAd",
    domain: "socialAd",
    name: "Testimonial Ad (20s)",
    description:
      "20-second testimonial-driven ad: customer talking-head → product showcase proof → urgent CTA close.",
    presetSequence: [
      "socialAd.testimonialBite",
      "brandFilm.productShowcase",
      "socialAd.urgentCTA",
    ],
    totalDuration: 20,
  },
  {
    id: "premiumBrandFilm",
    domain: "brandFilm",
    name: "Premium Brand Film (45s)",
    description:
      "45-second premium brand film: epic landscape → hero reveal → product showcase → emotional close-up → brand moment close.",
    presetSequence: [
      "cinematic.epicEstablishing",
      "brandFilm.heroReveal",
      "brandFilm.productShowcase",
      "cinematic.emotionalCloseUp",
      "brandFilm.brandMoment",
    ],
    totalDuration: 45,
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * List all cinematic presets, optionally filtered by domain.
 * @param domain - If provided, only presets belonging to this domain are returned.
 */
export function listVideoPresets(domain?: VideoDomain): CinematicPreset[] {
  return domain
    ? VIDEO_PRESETS.filter((p) => p.domain === domain)
    : VIDEO_PRESETS;
}

/**
 * Retrieve a single cinematic preset by its ID.
 * @param id - The preset identifier, e.g. `"cinematic.epicEstablishing"`.
 */
export function getVideoPreset(id: string): CinematicPreset | undefined {
  return VIDEO_PRESETS.find((p) => p.id === id);
}

/**
 * List all video sequences, optionally filtered by domain.
 * @param domain - If provided, only sequences belonging to this domain are returned.
 */
export function listVideoSequences(domain?: VideoDomain): VideoSequence[] {
  return domain
    ? VIDEO_SEQUENCES.filter((s) => s.domain === domain)
    : VIDEO_SEQUENCES;
}

/**
 * Retrieve a single video sequence by its ID.
 * @param id - The sequence identifier, e.g. `"brandIntro30s"`.
 */
export function getVideoSequence(id: string): VideoSequence | undefined {
  return VIDEO_SEQUENCES.find((s) => s.id === id);
}

/**
 * Find presets that match a descriptive mood keyword.
 *
 * Searches across name, description, lighting, and color-grade fields.
 * @param mood - A mood keyword such as "dramatic", "warm", "neon", "cinematic".
 */
export function getPresetsForMood(mood: string): CinematicPreset[] {
  const q = mood.toLowerCase();
  return VIDEO_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.lighting.toLowerCase().includes(q) ||
      p.colorGrade.toLowerCase().includes(q),
  );
}

/**
 * Find presets that match a specific pacing.
 * @param pacing - One of "slow", "medium", "fast", "ramping".
 */
export function getPresetsForPacing(
  pacing: "slow" | "medium" | "fast" | "ramping",
): CinematicPreset[] {
  return VIDEO_PRESETS.filter((p) => p.pacing === pacing);
}
