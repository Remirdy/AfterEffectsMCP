/**
 * Professional prompt-to-video package builder.
 *
 * Converts a natural-language concept (with optional reference URL, brand name,
 * mood, color-grade, tempo, and music BPM) into a production-ready package:
 *
 *  1. Cinematic creative brief with detailed visual system
 *  2. Three-act beat/shot list with intensity curves
 *  3. Professional AI-video prompts (Sora/Runway/Kling) with cinematic vocabulary
 *  4. After Effects motion & composition direction
 *  5. Optional AE composition plan (when includeAeComposition is true)
 *
 * Modeled after the professional VFX planner (`vfx/vfxPlanner.ts`) in scope
 * and quality.
 */

import { CreateVideoPromptPackageInput } from "../schemas.js";
import { buildCinematicBeatPlan, CinematicBeat, VideoBeatPlan, MoodProfile, PacingTempo } from "./beatPlanner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function words(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function includesAny(input: string, list: string[]): boolean {
  const w = new Set(words(input));
  return list.some((item) => w.has(item));
}

// ---------------------------------------------------------------------------
// Format / Resolution
// ---------------------------------------------------------------------------

function aspect(format: CreateVideoPromptPackageInput["format"]): string {
  switch (format) {
    case "horizontal":
      return "16:9 horizontal";
    case "square":
      return "1:1 square";
    default:
      return "9:16 vertical";
  }
}

function resolutionDims(
  format: CreateVideoPromptPackageInput["format"],
  resolution: string,
): { width: number; height: number; label: string } {
  const res = resolution || "1080p";
  switch (format) {
    case "horizontal":
      return res === "4k" ? { width: 3840, height: 2160, label: "3840×2160" }
        : res === "720p" ? { width: 1280, height: 720, label: "1280×720" }
        : { width: 1920, height: 1080, label: "1920×1080" };
    case "square":
      return res === "4k" ? { width: 2160, height: 2160, label: "2160×2160" }
        : res === "720p" ? { width: 720, height: 720, label: "720×720" }
        : { width: 1080, height: 1080, label: "1080×1080" };
    default: // vertical
      return res === "4k" ? { width: 2160, height: 3840, label: "2160×3840" }
        : res === "720p" ? { width: 720, height: 1280, label: "720×1280" }
        : { width: 1080, height: 1920, label: "1080×1920" };
  }
}

// ---------------------------------------------------------------------------
// Style / Mood / Color Grade Detection
// ---------------------------------------------------------------------------

function styleKeywords(style: string): string[] {
  const table: Record<string, string[]> = {
    brandFilm: ["dynamic brand identity", "modular graphic universe", "immersive asset system", "premium visual language", "narrative-driven design"],
    cinematic: ["premium camera language", "atmospheric depth", "controlled dramatic light", "layered parallax", "filmic texture"],
    socialAd: ["scroll-stopping hooks", "rapid-fire visual beats", "clear CTA cadence", "high-contrast motion", "platform-native pacing"],
    productPromo: ["hero product reveal", "feature demonstration beats", "lifestyle integration", "premium polish", "persuasive visual arc"],
    abstractMotion: ["procedural generative shapes", "kinetic patterns", "symbolic transitions", "modular repeatable assets", "mathematical beauty"],
    documentary: ["authentic storytelling", "observational camera", "interview-driven narrative", "archival integration", "natural light integrity"],
    musicVideo: ["beat-synced editing", "visual rhythm", "artist performance", "creative color treatment", "genre-specific aesthetics"],
  };
  return table[style] ?? table.brandFilm;
}

/** Infer color grade from mood/style when not explicitly set. */
function inferColorGrade(mood: MoodProfile | undefined, style: string, explicitGrade: string | undefined): string {
  if (explicitGrade) return explicitGrade;

  const moodGrade: Record<string, string> = {
    dramatic: "teal-orange",
    uplifting: "warm-golden",
    mysterious: "cold-blue",
    corporate: "neutral",
    playful: "pastel-soft",
    romantic: "warm-golden",
    intense: "bleach-bypass",
    melancholic: "desaturated",
    energetic: "neon-vibrant",
    serene: "pastel-soft",
  };

  const styleGrade: Record<string, string> = {
    cinematic: "teal-orange",
    documentary: "vintage-film",
    musicVideo: "cross-process",
    socialAd: "neon-vibrant",
    abstractMotion: "cold-blue",
  };

  if (mood && moodGrade[mood]) return moodGrade[mood];
  if (styleGrade[style]) return styleGrade[style];
  return "neutral";
}

/** Color grade → Curves / LUT-style description for AI prompts. */
function colorGradeDescription(grade: string): string {
  const desc: Record<string, string> = {
    "teal-orange": "teal shadows and warm orange highlights — cinematic complementary color palette, high separation",
    "cold-blue": "cool blue-shifted palette with desaturated warmth — clinical, futuristic, or suspenseful",
    "warm-golden": "warm golden tones with soft amber highlights — inviting, premium, emotional",
    "desaturated": "pulled-back saturation with muted tones — somber, documentary, understated elegance",
    "neon-vibrant": "punchy saturated neons with deep blacks — energetic, modern, social-first",
    "pastel-soft": "gentle pastel palette with low contrast — delicate, lifestyle, wellness",
    "bleach-bypass": "silver-retained look with crushed blacks and reduced saturation — gritty, intense, action",
    "cross-process": "shifted color channels with unexpected hue combinations — creative, editorial, music",
    "monochrome": "black and white or near-monochrome — timeless, stark, artistic",
    "vintage-film": "warm film stock emulation with soft halation and subtle grain — nostalgic, authentic",
    "neutral": "balanced, natural color reproduction with subtle contrast enhancement — professional, clean",
  };
  return desc[grade] ?? desc.neutral;
}

// ---------------------------------------------------------------------------
// Professional Sora / AI Video Prompt Builder
// ---------------------------------------------------------------------------

function buildCinematicAiPrompt(
  input: CreateVideoPromptPackageInput,
  beat: CinematicBeat,
  colorGrade: string,
  dims: { width: number; height: number; label: string },
): string {
  const brand = input.brandName ? `Brand: ${input.brandName}` : "Brand: unnamed concept";
  const reference = input.referenceUrl
    ? `Visual reference direction: draw inspiration from the referenced approach — mood, pacing, and visual language. Do not copy specific shots, logos, or identifiable elements.`
    : "Visual reference: original creative direction.";

  // Shot-specific cinematography instructions
  const cameraInstruction = buildCameraInstruction(beat);
  const lightingInstruction = buildLightingInstruction(beat);

  // Style transfer keywords for AI models
  const styleTransfer = buildStyleTransfer(input.style, colorGrade, beat);

  // Negative / constraint instructions
  const constraints = buildConstraints(input, beat);

  // Coherence instructions for multi-beat consistency
  const coherence = beat.beat > 1
    ? "CONTINUITY: Maintain consistent visual identity, color palette, and subject appearance from previous segments. Match lighting direction and camera perspective for seamless editing."
    : "ESTABLISHING SHOT: Set the definitive visual language, color palette, and tonal baseline for the entire video.";

  return [
    `[SEGMENT ${beat.beat}/${beat.act.toUpperCase()} ACT] ${input.style} video`,
    ``,
    `CONCEPT: ${input.prompt}`,
    brand,
    reference,
    ``,
    `TECHNICAL SPECS:`,
    `  Format: ${aspect(input.format)}, ${dims.label}`,
    `  Timing: ${beat.startTime}s–${beat.endTime}s (${beat.duration}s segment)`,
    `  Narrative purpose: ${beat.purpose}`,
    `  Intensity: ${Math.round(beat.intensity.value * 100)}% — ${beat.intensity.reason}`,
    ``,
    `CINEMATOGRAPHY:`,
    `  Shot: ${beat.shotType} shot, ${beat.lens} lens`,
    `  ${cameraInstruction}`,
    `  Depth of field: ${beat.shotType === "close" || beat.shotType === "extreme-close" ? "shallow — subject sharp, background creamy bokeh" : "appropriate for scene depth"}`,
    ``,
    `LIGHTING:`,
    `  ${lightingInstruction}`,
    ``,
    `SCENE:`,
    `  Visual: ${beat.visual}`,
    `  Motion: ${beat.motion}`,
    ``,
    `COLOR & GRADE:`,
    `  ${colorGradeDescription(colorGrade)}`,
    `  Palette: ${(input.palette?.length ? input.palette : ["deep navy", "electric blue", "warm white", "accent gold"]).join(", ")}`,
    ``,
    `STYLE:`,
    `  ${styleTransfer}`,
    input.text ? `  On-screen text (verbatim): "${input.text}"` : "  Avoid long on-screen text unless explicitly provided",
    ``,
    `${coherence}`,
    ``,
    `MUSIC SYNC: ${beat.musicSync}`,
    ``,
    `TRANSITION IN: ${beat.transitionIn} | TRANSITION OUT: ${beat.transitionOut}`,
    ``,
    `${constraints}`,
  ].join("\n");
}

function buildCameraInstruction(beat: CinematicBeat): string {
  const moves: Record<string, string> = {
    "static": "Camera: locked-off tripod, perfectly stable frame. Use a subtle 2% zoom to avoid lifelessness.",
    "dolly-in": "Camera: smooth dolly pushing toward subject — increasing intimacy and focus. Speed ramps from gentle to decisive.",
    "dolly-out": "Camera: dolly pulling back — gradually revealing context and environment. Maintain subject center-frame.",
    "crane-up": "Camera: crane/jib rising — reveals the scene from low to elevated perspective. Steady, majestic movement.",
    "crane-down": "Camera: descending crane — moves from overview into intimate detail. Controlled deceleration at end.",
    "orbit": "Camera: 45° orbital arc around subject — creates dimensional depth and visual interest. Maintain consistent distance.",
    "steadicam-follow": "Camera: fluid Steadicam tracking alongside subject. Natural micro-movements without shake. Following pace.",
    "handheld": "Camera: controlled handheld — organic micro-movements for authenticity. Not shaky — deliberate and grounded.",
    "whip-pan": "Camera: fast horizontal whip-pan with natural motion blur. Use as energetic transition device.",
    "push-in": "Camera: subtle forward push — building tension. Slow enough to feel deliberate, not rushed.",
    "pull-out": "Camera: gentle backward movement — expanding perspective. Creates sense of reflection and closure.",
    "pan-left": "Camera: smooth horizontal pan left — revealing new visual information progressively.",
    "pan-right": "Camera: smooth horizontal pan right — following action or narrative direction.",
    "tilt-up": "Camera: vertical tilt upward — revealing height, scale, or aspiration.",
    "zoom-in": "Camera: controlled optical zoom — emphasizing subject without physical movement.",
  };
  return moves[beat.cameraMove] ?? `Camera: ${beat.cameraMove} movement — professional, controlled.`;
}

function buildLightingInstruction(beat: CinematicBeat): string {
  const lights: Record<string, string> = {
    "high-key": "Lighting: high-key, bright and even — clean, optimistic, professional. Fill ratio near 1:1, no harsh shadows.",
    "low-key": "Lighting: low-key, dramatic shadows — chiaroscuro with strong key light. Deep blacks, selective illumination.",
    "silhouette": "Lighting: backlit silhouette — strong rim light, subject in shadow. Dramatic outline and shape emphasis.",
    "golden-hour": "Lighting: golden-hour warmth — long shadows, warm amber fill, natural flare. Magic hour cinematography.",
    "blue-hour": "Lighting: blue-hour cool tones — pre-dawn or post-sunset ambient. Soft, melancholic, contemplative.",
    "neon-night": "Lighting: urban neon at night — colored practical lights, reflections on wet surfaces, high contrast pools of light.",
    "volumetric": "Lighting: volumetric god-rays or haze — visible light beams cutting through atmosphere. Dramatic depth.",
    "soft-diffused": "Lighting: soft diffused — large source, minimal shadows. Flattering, natural, approachable.",
    "dramatic-contrast": "Lighting: high-contrast dramatic — strong key with minimal fill. Bold shadows define form and mood.",
    "studio-three-point": "Lighting: professional three-point studio setup — key, fill, and backlight. Clean and controlled.",
  };
  return lights[beat.lighting] ?? `Lighting: ${beat.lighting} — professional, mood-appropriate.`;
}

function buildStyleTransfer(style: string, colorGrade: string, beat: CinematicBeat): string {
  const base: string[] = [];

  // Camera/lens style reference
  if (beat.lens.includes("85") || beat.lens.includes("100")) {
    base.push("Shot on Arri Alexa Mini with Cooke S7/i prime lens — creamy bokeh, gentle fall-off");
  } else if (beat.lens.includes("24") || beat.lens.includes("16")) {
    base.push("Shot on Arri Alexa with Zeiss Master Prime wide-angle — controlled barrel distortion, cinematic depth");
  } else {
    base.push("Shot on Arri Alexa with Zeiss Master Prime — clean, cinematic image with natural skin tones");
  }

  // Style-specific references
  switch (style) {
    case "cinematic":
      base.push("Film-grade color science, 2.39:1 cinematic sensibility even in wider ratios");
      break;
    case "socialAd":
      base.push("High-energy social-first visual design, bold graphics, attention-optimized composition");
      break;
    case "documentary":
      base.push("Authentic observational style, available light preference, textural grain");
      break;
    case "musicVideo":
      base.push("Creative freedom in color and framing, performative energy, editorial rhythm");
      break;
    case "productPromo":
      base.push("Premium product photography translated to motion — hero lighting, clean surfaces, aspirational");
      break;
    case "abstractMotion":
      base.push("Generative art aesthetic — mathematical precision meets organic flow, procedural beauty");
      break;
    default:
      base.push("Premium brand film production quality — every frame is a potential key visual");
  }

  // Color grade style
  if (colorGrade !== "neutral") {
    base.push(`Color graded: ${colorGradeDescription(colorGrade)}`);
  }

  return base.join(". ");
}

function buildConstraints(input: CreateVideoPromptPackageInput, beat: CinematicBeat): string {
  const constraints = [
    "CONSTRAINTS (STRICT):",
    "  • No copyrighted characters, logos, or trademarked elements",
    "  • No real-person likeness or recognizable individuals",
    "  • No unreadable or garbled generated text — avoid text unless specified",
    "  • No temporal flicker, strobing, or frame-rate artifacts",
    "  • No abrupt unmotivated camera shake or jitter",
    "  • No over-saturated or blown-out highlights",
    "  • Maintain consistent physics and spatial logic within the segment",
  ];

  if (beat.act === "hook") {
    constraints.push("  • HOOK: Must capture full attention within the first 1.5 seconds — lead with visual impact");
  }
  if (beat.act === "resolve") {
    constraints.push("  • RESOLVE: Final frame must be clean, readable, and suitable as a freeze-frame brand moment");
  }
  if (input.text) {
    constraints.push(`  • Preserve this text verbatim on screen: "${input.text}"`);
  }

  return constraints.join("\n");
}

// ---------------------------------------------------------------------------
// AE Composition Plan (for includeAeComposition)
// ---------------------------------------------------------------------------

export interface AeVideoCompositionPlan {
  composition: {
    name: string;
    width: number;
    height: number;
    duration: number;
    fps: number;
  };
  background: {
    type: "gradient" | "solid" | "fractalNoise";
    colors: [number, number, number][];
    evolution: boolean;
  };
  titleCards: Array<{
    text: string;
    position: "center" | "lower-third" | "upper" | "custom";
    fontSize: number;
    color: [number, number, number];
    startTime: number;
    duration: number;
    animation: "fadeIn" | "slideUp" | "slideLeft" | "typewriter" | "scaleReveal" | "blurReveal" | "maskWipe";
    backgroundBar?: {
      color: [number, number, number];
      opacity: number;
      padding: number;
    };
  }>;
  transitions: Array<{
    type: "light-leak" | "whip-pan" | "zoom-push" | "dissolve" | "flash" | "glitch-cut" | "blur-transition";
    time: number;
    duration: number;
    color?: [number, number, number];
  }>;
  colorGrade: {
    profile: string;
    intensity: number;
    vignette: boolean;
    filmGrain: boolean;
  };
  camera?: {
    type: "dolly-in" | "dolly-out" | "crane-up" | "crane-down" | "orbit" | "push-in" | "pull-out" | "static";
    strength: number;
    startTime: number;
    duration: number;
  };
  polish: {
    bokeh: boolean;
    lightLeak: boolean;
    filmGrain: boolean;
    lensFlare: boolean;
    atmosphericFog: boolean;
  };
}

function buildAeCompositionPlan(
  input: CreateVideoPromptPackageInput,
  beatPlan: VideoBeatPlan,
  dims: { width: number; height: number },
  colorGrade: string,
): AeVideoCompositionPlan {
  const compName = input.brandName
    ? `${input.brandName.replace(/[^a-zA-Z0-9_]/g, "_")}_Video`
    : "MotionPilot_Video";

  // Map color grade to background colors
  const bgColorMap: Record<string, [number, number, number][]> = {
    "teal-orange": [[0.05, 0.08, 0.12], [0.1, 0.15, 0.2]],
    "cold-blue": [[0.03, 0.05, 0.1], [0.06, 0.1, 0.18]],
    "warm-golden": [[0.12, 0.08, 0.04], [0.18, 0.12, 0.06]],
    "neon-vibrant": [[0.02, 0.02, 0.06], [0.06, 0.02, 0.08]],
    "desaturated": [[0.08, 0.08, 0.08], [0.12, 0.12, 0.12]],
  };
  const bgColors = bgColorMap[colorGrade] ?? [[0.05, 0.05, 0.08], [0.1, 0.1, 0.15]];

  // Title cards from beats
  const titleCards: AeVideoCompositionPlan["titleCards"] = [];

  // Opening title
  if (input.brandName) {
    titleCards.push({
      text: input.brandName,
      position: "center",
      fontSize: Math.round(dims.width * 0.06),
      color: [1, 1, 1] as [number, number, number],
      startTime: 0.5,
      duration: 3,
      animation: "scaleReveal",
      backgroundBar: {
        color: [0, 0, 0] as [number, number, number],
        opacity: 40,
        padding: 20,
      },
    });
  }

  // On-screen text
  if (input.text) {
    const midBeat = beatPlan.beats[Math.floor(beatPlan.beats.length / 2)];
    titleCards.push({
      text: input.text,
      position: "lower-third",
      fontSize: Math.round(dims.width * 0.035),
      color: [1, 1, 1] as [number, number, number],
      startTime: midBeat?.startTime ?? input.duration * 0.4,
      duration: 3,
      animation: "slideUp",
    });
  }

  // CTA at end
  titleCards.push({
    text: input.brandName ? `${input.brandName}` : "Learn More",
    position: "center",
    fontSize: Math.round(dims.width * 0.05),
    color: [1, 1, 1] as [number, number, number],
    startTime: input.duration - 4,
    duration: 3.5,
    animation: "blurReveal",
  });

  // Transitions from beat plan
  const transitions: AeVideoCompositionPlan["transitions"] = [];
  for (const beat of beatPlan.beats) {
    if (beat.beat === 1) continue;
    const transType = mapTransitionType(beat.transitionIn);
    if (transType) {
      transitions.push({
        type: transType,
        time: beat.startTime,
        duration: 0.6,
      });
    }
  }

  // Camera
  const cameraType = beatPlan.mood === "dramatic" ? "dolly-in" as const
    : beatPlan.mood === "serene" ? "dolly-out" as const
    : beatPlan.mood === "energetic" ? "orbit" as const
    : "push-in" as const;

  // Polish based on style
  const isHigh = input.style === "cinematic" || input.style === "brandFilm";
  const isSocial = input.style === "socialAd" || input.style === "musicVideo";

  return {
    composition: {
      name: compName,
      width: dims.width,
      height: dims.height,
      duration: input.duration,
      fps: input.fps ?? 30,
    },
    background: {
      type: "fractalNoise",
      colors: bgColors as [number, number, number][],
      evolution: true,
    },
    titleCards,
    transitions,
    colorGrade: {
      profile: colorGrade,
      intensity: 65,
      vignette: true,
      filmGrain: isHigh,
    },
    camera: {
      type: cameraType,
      strength: beatPlan.mood === "energetic" ? 80 : 50,
      startTime: 0,
      duration: input.duration,
    },
    polish: {
      bokeh: isHigh,
      lightLeak: isHigh,
      filmGrain: isHigh,
      lensFlare: false,
      atmosphericFog: beatPlan.mood === "mysterious" || beatPlan.mood === "dramatic",
    },
  };
}

function mapTransitionType(trans: string): AeVideoCompositionPlan["transitions"][0]["type"] | null {
  const mapping: Record<string, AeVideoCompositionPlan["transitions"][0]["type"]> = {
    "light-leak": "light-leak",
    "whip-pan": "whip-pan",
    "zoom-push": "zoom-push",
    "dissolve": "dissolve",
    "flash": "flash",
    "glitch-cut": "glitch-cut",
    "blur-transition": "blur-transition",
    "cut": "dissolve", // soft cut as dissolve
    "morph": "dissolve",
    "wipe": "dissolve",
    "iris": "dissolve",
    "slide": "dissolve",
  };
  return mapping[trans] ?? null;
}

// ---------------------------------------------------------------------------
// Sound design / editorial / deliverable specs
// ---------------------------------------------------------------------------

function buildSoundDesign(mood: MoodProfile | undefined, style: string, bpm: number | null) {
  const moodMusic: Record<string, string> = {
    dramatic: "tense orchestral swell with sub-bass pulse, building to a downbeat hit",
    uplifting: "warm major-key strings + claps, rising toward an anthemic chorus",
    mysterious: "sparse ambient pads, granular textures, distant low drone",
    corporate: "clean minimal synth bed, soft pluck arps, confident steady pulse",
    playful: "bouncy plucks, marimba/pizzicato, light percussion and pops",
    romantic: "intimate piano + airy strings, slow swells, soft reverb tail",
    intense: "distorted bass, driving four-on-the-floor kick, tight transients",
    melancholic: "minor-key piano, vinyl crackle, sustained cello",
    energetic: "fast electronic drums, sidechain pump, bright synth stabs",
    serene: "soft pads, gentle felt piano, natural ambience",
  };
  const music = moodMusic[mood ?? ""] ?? "genre-appropriate bed that supports the three-act intensity curve";
  return {
    musicDirection: music,
    bpm: bpm ?? "match cut points to natural musical phrasing (typically 90–128 BPM)",
    mixApproach: style === "documentary" ? "dialogue-forward, music ducked under VO" : "music-led with rhythmic sound design",
    sfxLayers: [
      "whoosh / riser on each transition (pitched to the cut)",
      "impact / sub-boom on hero reveals and CTA",
      "fine UI ticks or texture foley on graphic accents",
      "ambient room/space tone for depth under the bed",
    ],
    mastering: "loudness -14 LUFS for social, -16 LUFS for web; true-peak ≤ -1 dBTP",
  };
}

function buildEditorial(beatPlan: VideoBeatPlan) {
  return {
    cuttingStyle: beatPlan.tempo === "fast"
      ? "rapid rhythmic cutting on the beat, frequent J/L cuts to keep energy"
      : beatPlan.tempo === "slow"
        ? "long held shots, motivated dissolves, breathing room between beats"
        : "balanced pacing — match cut lengths to narrative intensity",
    avgShotLength: beatPlan.tempo === "fast" ? "0.8–1.5s" : beatPlan.tempo === "slow" ? "3–5s" : "1.5–3s",
    rhythm: "accelerate cuts into the climax (act 2), decelerate into the resolve",
    continuity: "match action across cuts, preserve screen direction and lighting from beat to beat",
    firstFrameRule: "open on the strongest visual — no slow logo intro before the hook",
  };
}

function buildDeliverables(dims: { width: number; height: number; label: string }, format: CreateVideoPromptPackageInput["format"], fps: number) {
  const others: Array<{ label: string; ratio: string; size: string }> = [];
  if (format !== "vertical") others.push({ label: "Vertical (Reels/TikTok/Shorts)", ratio: "9:16", size: "1080×1920" });
  if (format !== "square") others.push({ label: "Square (Feed)", ratio: "1:1", size: "1080×1080" });
  if (format !== "horizontal") others.push({ label: "Horizontal (YouTube/Web)", ratio: "16:9", size: "1920×1080" });
  return {
    masterFormat: { ratio: aspect(format), size: dims.label, fps, codec: "ProRes 422 HQ master → H.264 high-bitrate delivery" },
    crops: others,
    captions: "burn-in safe-area captions for sound-off viewing (85% center safe zone)",
    versions: ["full cut", "15s social cut", "6s bumper", "still key-frame for thumbnail/poster"],
    colorSpace: "Rec.709, 8-bit delivery; grade in 32-bit float",
  };
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function buildVideoPromptPackage(input: CreateVideoPromptPackageInput) {
  const keywords = styleKeywords(input.style);
  const dims = resolutionDims(input.format, (input as any).resolution);
  const fps = (input as any).fps ?? 30;

  // Detect/resolve mood and color grade
  const mood: MoodProfile | undefined = (input as any).mood;
  const colorGrade = inferColorGrade(mood, input.style, (input as any).colorGrade);
  const tempo: PacingTempo | undefined = (input as any).tempo;
  const musicBpm: number | undefined = (input as any).musicBpm;

  // Build professional beat plan using three-act structure
  const beatPlan = buildCinematicBeatPlan({
    duration: input.duration,
    prompt: input.prompt,
    style: input.style,
    mood,
    tempo,
    bpm: musicBpm ?? null,
    palette: input.palette,
    brandName: input.brandName,
  });

  // Build AI video prompts with cinematic vocabulary
  const aiVideoPrompts = beatPlan.beats.map((beat) => ({
    beat: beat.beat,
    act: beat.act,
    seconds: beat.duration <= 6 ? String(beat.duration) : beat.duration <= 12 ? "8" : "12",
    size: dims.label,
    shotType: beat.shotType,
    cameraMove: beat.cameraMove,
    lens: beat.lens,
    lighting: beat.lighting,
    intensity: Math.round(beat.intensity.value * 100),
    transitionIn: beat.transitionIn,
    transitionOut: beat.transitionOut,
    prompt: buildCinematicAiPrompt(input, beat, colorGrade, dims),
  }));

  // Build AE composition plan if requested
  const aeCompositionPlan = (input as any).includeAeComposition
    ? buildAeCompositionPlan(input, beatPlan, dims, colorGrade)
    : undefined;

  // After Effects direction — much more detailed than before
  const motionLanguage = [
    "magneticSnap for asset entrances with overshoot + settle easing",
    "liquidDrift for organic background element movement",
    "parallaxOrbit for layered 2.5D depth scenes",
    "revealWipeBlur for typography-safe cinematic reveals",
    "microShake only on impact/CTA moments — controlled 2-4px amplitude",
    `cameraPush with ${beatPlan.mood === "dramatic" ? "strong" : "subtle"} zoom — ${dims.label} composition`,
    "breathBlur for ambient, living background elements",
    `lightSweep for hero element highlight at ${beatPlan.mood === "energetic" ? "fast" : "natural"} speed`,
    "cinematicJitter for handheld authenticity (when needed)",
    "textRangeReveal for character-by-character text animation",
  ];

  return {
    ok: true,
    packageType: "prompt_to_video",
    version: "2.0",
    brandName: input.brandName ?? null,
    format: input.format,
    resolution: (input as any).resolution ?? "1080p",
    dimensions: dims,
    duration: input.duration,
    fps,
    style: input.style,
    referenceUrl: input.referenceUrl ?? null,

    // ---- Creative Brief ----
    creativeBrief: {
      concept: input.prompt,
      mood: beatPlan.mood,
      tempo: beatPlan.tempo,
      colorGrade,
      colorGradeDescription: colorGradeDescription(colorGrade),
      tone: keywords,
      visualSystem: [
        "Cohesive visual language maintained across all beats — consistent color palette, typography, and spatial grammar",
        "Clear visual hierarchy: hero subject → supporting context → ambient atmosphere",
        "Every frame operates as a potential key visual — no throwaway compositions",
        "Motion language reinforces narrative arc — energy matches the three-act intensity curve",
        `Color grade: ${colorGradeDescription(colorGrade)}`,
        "AI-video segments designed for seamless stitching or standalone style exploration",
      ],
      avoid: [
        "copying the reference video — use for mood/tone inspiration only",
        "copyrighted characters, logos, or trademarked elements",
        "real-person likeness — unless explicitly approved",
        "long auto-generated text — preserve only provided verbatim text",
        "overcrowded frames — maintain breathing room and visual hierarchy",
        "inconsistent visual identity between segments",
        "temporal artifacts: flicker, strobing, frame-rate mismatch",
        "unmotivated camera shake or erratic movement",
      ],
    },

    // ---- Three-Act Beat Plan ----
    narrativeStructure: {
      threeActBreakdown: beatPlan.structure,
      intensityCurve: beatPlan.intensityCurve,
      musicBpm: beatPlan.bpm,
    },
    shotList: beatPlan.beats.map((b) => ({
      beat: b.beat,
      act: b.act,
      time: `${b.startTime}s–${b.endTime}s`,
      duration: b.duration,
      purpose: b.purpose,
      visual: b.visual,
      motion: b.motion,
      shotType: b.shotType,
      cameraMove: b.cameraMove,
      lens: b.lens,
      lighting: b.lighting,
      intensity: Math.round(b.intensity.value * 100),
      intensityReason: b.intensity.reason,
      transitionIn: b.transitionIn,
      transitionOut: b.transitionOut,
      palette: b.palette,
      bRollSuggestions: b.bRollSuggestions,
      musicSync: b.musicSync,
    })),

    // ---- AI Video Prompts ----
    aiVideoPrompts,

    // ---- After Effects Direction ----
    afterEffectsDirection: {
      composition: {
        name: aeCompositionPlan?.composition.name ?? "MotionPilot_Video",
        width: dims.width,
        height: dims.height,
        duration: input.duration,
        format: aspect(input.format),
        fps,
      },
      colorGrading: {
        profile: colorGrade,
        description: colorGradeDescription(colorGrade),
        vignette: true,
        filmGrain: input.style === "cinematic" || input.style === "documentary",
      },
      motionLanguage,
      suggestedAnimationTypes: [
        "magneticSnap",
        "liquidDrift",
        "parallaxOrbit",
        "revealWipeBlur",
        "cinematicJitter",
        "microShake",
        "lightSweep",
        "cameraPush",
        "breathBlur",
        "textRangeReveal",
        "depthDrift",
        "scaleReveal",
        "blurFade",
        "kineticBounce",
      ],
      cameraDirection: {
        type: beatPlan.mood === "dramatic" ? "dolly-in" : beatPlan.mood === "serene" ? "dolly-out" : "push-in",
        note: `${beatPlan.mood} mood → use ${beatPlan.mood === "energetic" ? "dynamic handheld with controlled micro-movements" : "smooth, deliberate camera motion with easing"}`,
      },
    },

    // ---- AE Composition Plan (optional) ----
    aeCompositionPlan: aeCompositionPlan ?? null,

    // ---- Sound Design ----
    soundDesign: buildSoundDesign(mood, input.style, beatPlan.bpm ?? null),

    // ---- Editorial / Cutting Direction ----
    editorial: buildEditorial(beatPlan),

    // ---- Deliverable Specs ----
    deliverables: buildDeliverables(dims, input.format, fps),

    // ---- Planning Notes ----
    planningNotes: beatPlan.notes,
    generatedAt: new Date().toISOString(),
  };
}
