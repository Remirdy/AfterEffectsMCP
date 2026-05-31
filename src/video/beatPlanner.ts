/**
 * Professional beat / narrative planner for prompt-to-video.
 *
 * Replaces the simple beatCount-based approach with a three-act narrative
 * structure, intensity curve, shot continuity rules, music sync awareness,
 * and professional cinematic beat generation. Designed to match the
 * professionalism of the VFX planner (`vfx/vfxPlanner.ts`).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NarrativeAct = "hook" | "build" | "resolve";
export type PacingTempo = "slow" | "medium" | "fast" | "dynamic";
export type MoodProfile =
  | "dramatic"
  | "uplifting"
  | "mysterious"
  | "corporate"
  | "playful"
  | "romantic"
  | "intense"
  | "melancholic"
  | "energetic"
  | "serene";

export interface BeatIntensity {
  /** 0..1 normalized intensity for this beat. */
  value: number;
  /** Narrative reason for the intensity level. */
  reason: string;
}

export interface ShotContinuity {
  /** Avoid jump-cuts between similar shot sizes. */
  sizeContrast: boolean;
  /** Maintain 180° rule when cutting between subjects. */
  rule180: boolean;
  /** Suggested cut points aligned with action or music. */
  cutOnAction: boolean;
}

export interface BRollSuggestion {
  /** Type of b-roll insert. */
  type: "detail" | "reaction" | "environment" | "symbolic" | "texture" | "timelapse";
  /** Description of the b-roll shot. */
  description: string;
  /** Suggested duration in seconds. */
  duration: number;
}

export interface CinematicBeat {
  /** 1-indexed beat number. */
  beat: number;
  /** Narrative act this beat belongs to. */
  act: NarrativeAct;
  /** Start time in seconds. */
  startTime: number;
  /** End time in seconds. */
  endTime: number;
  /** Duration of this beat in seconds. */
  duration: number;
  /** Purpose of this beat in the narrative. */
  purpose: string;
  /** Visual description for this beat. */
  visual: string;
  /** Camera/motion direction. */
  motion: string;
  /** Intensity profile for this beat. */
  intensity: BeatIntensity;
  /** Shot type recommendation. */
  shotType: string;
  /** Camera move recommendation. */
  cameraMove: string;
  /** Lens recommendation. */
  lens: string;
  /** Lighting recommendation. */
  lighting: string;
  /** Transition into this beat. */
  transitionIn: string;
  /** Transition out of this beat. */
  transitionOut: string;
  /** Color palette for this beat. */
  palette: string[];
  /** B-roll suggestions for this beat. */
  bRollSuggestions: BRollSuggestion[];
  /** Music sync notes. */
  musicSync: string;
}

export interface VideoBeatPlan {
  beats: CinematicBeat[];
  /** Overall pacing/tempo. */
  tempo: PacingTempo;
  /** Overall mood. */
  mood: MoodProfile;
  /** Three-act structure breakdown. */
  structure: {
    hookEnd: number;
    buildEnd: number;
    resolveEnd: number;
  };
  /** Overall intensity curve description. */
  intensityCurve: string;
  /** Music BPM if specified. */
  bpm: number | null;
  /** Planning notes. */
  notes: string[];
}

// ---------------------------------------------------------------------------
// NLP — Mood Detection (English + Turkish)
// ---------------------------------------------------------------------------

const MOOD_PATTERNS: Array<{ re: RegExp; mood: MoodProfile }> = [
  { re: /\b(dramatic|dramatik|intense|yoğun|powerful|güçlü|epic|destansı)\b/i, mood: "dramatic" },
  { re: /\b(uplifting|ilham|inspiring|motivating|positive|pozitif|hopeful|umut)\b/i, mood: "uplifting" },
  { re: /\b(mysterious|gizemli|enigmatic|dark|karanlık|suspense|gerilim)\b/i, mood: "mysterious" },
  { re: /\b(corporate|kurumsal|professional|profesyonel|business|iş)\b/i, mood: "corporate" },
  { re: /\b(playful|eğlenceli|fun|neşeli|colorful|renkli|cartoon|çizgi)\b/i, mood: "playful" },
  { re: /\b(romantic|romantik|love|aşk|tender|hassas|intimate|samimi)\b/i, mood: "romantic" },
  { re: /\b(intense|yoğun|aggressive|saldırgan|heavy|ağır|fierce|şiddetli)\b/i, mood: "intense" },
  { re: /\b(melancholic|melankolik|sad|üzgün|nostalgic|nostaljik|bittersweet)\b/i, mood: "melancholic" },
  { re: /\b(energetic|enerjik|fast|hızlı|dynamic|dinamik|punchy|vurucu)\b/i, mood: "energetic" },
  { re: /\b(serene|huzurlu|calm|sakin|peaceful|barışçıl|zen|tranquil)\b/i, mood: "serene" },
];

const TEMPO_PATTERNS: Array<{ re: RegExp; tempo: PacingTempo }> = [
  { re: /\b(slow|yavaş|languid|leisurely|gentle|yumuşak|calm|sakin)\b/i, tempo: "slow" },
  { re: /\b(fast|hızlı|rapid|quick|snappy|punchy|vurucu|energetic|enerjik)\b/i, tempo: "fast" },
  { re: /\b(dynamic|dinamik|varied|değişken|ramping|building|crescendo)\b/i, tempo: "dynamic" },
];

// ---------------------------------------------------------------------------
// Intensity Curve Generators
// ---------------------------------------------------------------------------

type IntensityCurveType = "gradual-build" | "peak-valley" | "constant-high" | "slow-burn" | "bookend";

function inferIntensityCurve(mood: MoodProfile, tempo: PacingTempo): IntensityCurveType {
  if (mood === "dramatic" || mood === "intense") return "peak-valley";
  if (mood === "energetic") return "constant-high";
  if (mood === "serene" || mood === "melancholic") return "slow-burn";
  if (mood === "mysterious") return "gradual-build";
  if (tempo === "dynamic") return "peak-valley";
  if (tempo === "fast") return "constant-high";
  return "gradual-build";
}

function computeIntensity(beatIndex: number, totalBeats: number, curve: IntensityCurveType): BeatIntensity {
  const t = totalBeats <= 1 ? 0.5 : beatIndex / (totalBeats - 1);

  switch (curve) {
    case "gradual-build":
      return { value: 0.3 + t * 0.6, reason: "gradually building energy toward climax" };
    case "peak-valley": {
      // Peak at ~60% through, valley at start and end
      const peak = Math.sin(t * Math.PI);
      return { value: 0.2 + peak * 0.7, reason: t < 0.5 ? "rising tension" : t < 0.8 ? "peak intensity" : "resolving tension" };
    }
    case "constant-high":
      return { value: 0.7 + Math.sin(t * Math.PI * 2) * 0.2, reason: "sustained high energy with rhythmic variation" };
    case "slow-burn":
      return { value: 0.2 + t * t * 0.5, reason: "slowly intensifying emotional weight" };
    case "bookend":
      return { value: t < 0.2 || t > 0.8 ? 0.8 : 0.4, reason: t < 0.2 ? "strong opening hook" : t > 0.8 ? "powerful closing" : "breathing room" };
    default:
      return { value: 0.5, reason: "balanced" };
  }
}

// ---------------------------------------------------------------------------
// Three-Act Structure
// ---------------------------------------------------------------------------

function actForBeat(beatIndex: number, totalBeats: number): NarrativeAct {
  const t = totalBeats <= 1 ? 0.5 : beatIndex / (totalBeats - 1);
  if (t < 0.2) return "hook";
  if (t < 0.7) return "build";
  return "resolve";
}

function purposeForAct(act: NarrativeAct, beatIndex: number, totalBeats: number): string {
  switch (act) {
    case "hook":
      return beatIndex === 0
        ? "Open with a strong visual hook — capture attention in the first 2 seconds"
        : "Establish tone, introduce the visual language and subject";
    case "build": {
      const progress = totalBeats <= 1 ? 0.5 : beatIndex / (totalBeats - 1);
      if (progress < 0.4) return "Develop the narrative — introduce supporting visuals and context";
      if (progress < 0.6) return "Intensify the message — layer visual complexity and emotional depth";
      return "Drive toward climax — peak visual and emotional impact";
    }
    case "resolve":
      return beatIndex === totalBeats - 1
        ? "Final resolution — brand lockup, call-to-action, or emotional payoff"
        : "Begin resolution — simplify visuals, settle into closing mood";
  }
}

// ---------------------------------------------------------------------------
// Shot/Camera/Lighting Selection
// ---------------------------------------------------------------------------

interface ShotProfile {
  shotType: string;
  cameraMove: string;
  lens: string;
  lighting: string;
}

function shotProfileForBeat(act: NarrativeAct, mood: MoodProfile, intensity: number, beatIndex: number): ShotProfile {
  // Vary shot types to maintain visual interest (avoid repetition)
  const shotCycle = ["wide", "medium", "close", "medium", "wide", "extreme-close"];
  const baseShot = shotCycle[beatIndex % shotCycle.length];

  // Override based on act
  const shotType =
    act === "hook" ? (beatIndex === 0 ? "wide" : "medium") :
    act === "resolve" ? (intensity > 0.7 ? "close" : "medium") :
    baseShot;

  // Camera moves based on mood and intensity
  const cameraMove =
    mood === "dramatic" ? (intensity > 0.6 ? "dolly-in" : "crane-up") :
    mood === "energetic" ? (intensity > 0.7 ? "whip-pan" : "handheld") :
    mood === "serene" ? "dolly-out" :
    mood === "corporate" ? "static" :
    mood === "mysterious" ? "push-in" :
    intensity > 0.6 ? "dolly-in" : "static";

  // Lens based on shot type
  const lens =
    shotType === "wide" ? "24mm wide" :
    shotType === "extreme-close" ? "100mm macro" :
    shotType === "close" ? "85mm" :
    shotType === "aerial" ? "16mm ultra-wide" :
    "50mm";

  // Lighting based on mood
  const lighting =
    mood === "dramatic" ? "dramatic-contrast" :
    mood === "mysterious" ? "low-key" :
    mood === "romantic" ? "golden-hour" :
    mood === "energetic" ? "high-key" :
    mood === "melancholic" ? "soft-diffused" :
    mood === "corporate" ? "studio-three-point" :
    mood === "serene" ? "golden-hour" :
    "soft-diffused";

  return { shotType, cameraMove, lens, lighting };
}

// ---------------------------------------------------------------------------
// Transition Selection
// ---------------------------------------------------------------------------

function transitionForBeat(
  act: NarrativeAct,
  mood: MoodProfile,
  tempo: PacingTempo,
  intensity: number,
  isLast: boolean,
): { transIn: string; transOut: string } {
  if (isLast) {
    return { transIn: intensity > 0.6 ? "dissolve" : "cut", transOut: "dissolve" };
  }

  const fast = tempo === "fast" || mood === "energetic";
  const cinematic = mood === "dramatic" || mood === "mysterious" || mood === "cinematic" as MoodProfile;

  const transIn =
    act === "hook" ? "cut" :
    fast ? (intensity > 0.7 ? "whip-pan" : "cut") :
    cinematic ? (intensity > 0.5 ? "dissolve" : "light-leak") :
    "dissolve";

  const transOut =
    fast ? (intensity > 0.7 ? "whip-pan" : "cut") :
    cinematic ? "dissolve" :
    act === "resolve" ? "dissolve" :
    intensity > 0.6 ? "zoom-push" : "cut";

  return { transIn, transOut };
}

// ---------------------------------------------------------------------------
// B-Roll Suggestions
// ---------------------------------------------------------------------------

function suggestBRoll(act: NarrativeAct, mood: MoodProfile, visual: string): BRollSuggestion[] {
  const suggestions: BRollSuggestion[] = [];

  if (act === "build") {
    suggestions.push({
      type: "detail",
      description: "Tight detail shot emphasizing texture, material quality, or key visual element",
      duration: 2,
    });
  }

  if (mood === "corporate" || mood === "uplifting") {
    suggestions.push({
      type: "environment",
      description: "Establishing wide shot of location, workspace, or context setting",
      duration: 3,
    });
  }

  if (mood === "dramatic" || mood === "mysterious") {
    suggestions.push({
      type: "symbolic",
      description: "Metaphorical insert — abstract visual that reinforces the emotional theme",
      duration: 2,
    });
  }

  if (act === "resolve") {
    suggestions.push({
      type: "reaction",
      description: "Human reaction shot or emotional response to reinforce the message",
      duration: 2,
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Music Sync
// ---------------------------------------------------------------------------

function musicSyncNote(tempo: PacingTempo, bpm: number | null, beatIndex: number, act: NarrativeAct): string {
  if (bpm) {
    const beatDuration = 60 / bpm;
    const barsPerBeat = Math.max(1, Math.round(4 / beatDuration));
    return `Sync to ${bpm} BPM — cut on every ${barsPerBeat} bars; ${act === "hook" ? "land on downbeat for impact" : act === "resolve" ? "let final note ring" : "follow rhythmic pulse"}`;
  }

  switch (act) {
    case "hook":
      return "Cut on the first strong downbeat; visual and audio hooks must align";
    case "build":
      return tempo === "fast"
        ? "Match cuts to rhythmic pulse; tighter cuts as energy builds"
        : "Let visuals breathe between musical phrases; cut on chord changes";
    case "resolve":
      return "Slow cuts aligned with final musical phrase; hold the last shot for emotional weight";
  }
}

// ---------------------------------------------------------------------------
// Motion Description
// ---------------------------------------------------------------------------

function motionForBeat(
  shotProfile: ShotProfile,
  intensity: number,
  act: NarrativeAct,
  mood: MoodProfile,
): string {
  const parts: string[] = [];

  // Camera movement description
  const moveDesc: Record<string, string> = {
    "static": "locked-off frame, steady composition",
    "dolly-in": "smooth dolly pushing into the subject, building intimacy",
    "dolly-out": "slow dolly pulling back, revealing context and scale",
    "crane-up": "rising crane revealing the scene from above",
    "crane-down": "descending crane moving into the action",
    "orbit": "orbiting the subject, creating dimensional depth",
    "steadicam-follow": "fluid steadicam following the subject's movement",
    "handheld": "controlled handheld with organic micro-movements",
    "whip-pan": "fast whip-pan with motion blur for energetic transition",
    "push-in": "subtle push-in creating tension and focus",
    "pull-out": "gentle pull-out expanding the viewer's perspective",
    "pan-left": "smooth horizontal pan revealing the scene",
    "pan-right": "smooth horizontal pan following action",
    "tilt-up": "vertical tilt revealing height and scale",
    "zoom-in": "controlled zoom emphasizing the subject",
  };
  parts.push(moveDesc[shotProfile.cameraMove] ?? `${shotProfile.cameraMove} camera movement`);

  // Depth of field
  if (shotProfile.lens.includes("85") || shotProfile.lens.includes("100")) {
    parts.push("shallow depth of field with creamy bokeh separation");
  } else if (shotProfile.lens.includes("24") || shotProfile.lens.includes("16")) {
    parts.push("deep focus capturing environmental context");
  }

  // Intensity-based motion
  if (intensity > 0.7) {
    parts.push(mood === "energetic" ? "kinetic energy with rhythmic visual beats" : "heightened visual tension");
  } else if (intensity < 0.3) {
    parts.push("restrained, deliberate motion for contemplative tone");
  }

  // Act-specific
  if (act === "hook") parts.push("immediate visual impact, no slow buildup");
  if (act === "resolve") parts.push("settling into final composition, clean and readable");

  return parts.join("; ");
}

// ---------------------------------------------------------------------------
// Main Beat Planning Function
// ---------------------------------------------------------------------------

export interface BeatPlanOptions {
  /** Total video duration in seconds. */
  duration: number;
  /** Natural-language prompt. */
  prompt: string;
  /** Optional style hint. */
  style?: string;
  /** Optional explicit mood override. */
  mood?: MoodProfile;
  /** Optional explicit tempo override. */
  tempo?: PacingTempo;
  /** Optional music BPM for sync. */
  bpm?: number | null;
  /** Optional color palette. */
  palette?: string[];
  /** Optional brand name. */
  brandName?: string;
}

/**
 * Build a professional cinematic beat plan from a prompt and duration.
 *
 * Unlike the simple `makeBeats` function, this planner produces:
 * - Three-act narrative structure (hook → build → resolve)
 * - Beat intensity curve based on mood and pacing
 * - Shot type, camera move, lens, and lighting per beat
 * - Transition recommendations per beat
 * - B-roll suggestions
 * - Music sync guidance
 */
export function buildCinematicBeatPlan(opts: BeatPlanOptions): VideoBeatPlan {
  const { duration, prompt, palette, brandName } = opts;
  const notes: string[] = [];

  // ---- 1. Detect mood and tempo from prompt ----
  let mood: MoodProfile = opts.mood ?? "corporate";
  for (const mp of MOOD_PATTERNS) {
    if (mp.re.test(prompt)) { mood = mp.mood; break; }
  }

  let tempo: PacingTempo = opts.tempo ?? "medium";
  for (const tp of TEMPO_PATTERNS) {
    if (tp.re.test(prompt)) { tempo = tp.tempo; break; }
  }

  // Style overrides
  if (opts.style === "cinematic") { mood = opts.mood ?? "dramatic"; tempo = opts.tempo ?? "slow"; }
  if (opts.style === "socialAd") { tempo = opts.tempo ?? "fast"; }
  if (opts.style === "musicVideo") { tempo = opts.tempo ?? "dynamic"; mood = opts.mood ?? "energetic"; }

  const bpm = opts.bpm ?? null;
  notes.push(`Mood: ${mood}. Tempo: ${tempo}.`);
  if (bpm) notes.push(`Music sync: ${bpm} BPM.`);

  // ---- 2. Calculate beat count based on duration and tempo ----
  const baseBeatsPerSecond = tempo === "fast" ? 0.35 : tempo === "slow" ? 0.15 : 0.22;
  let beatCount = Math.max(3, Math.min(12, Math.round(duration * baseBeatsPerSecond)));
  // If BPM is provided, align beat count to musical bars
  if (bpm) {
    const barDuration = (60 / bpm) * 4; // 4 beats per bar
    beatCount = Math.max(3, Math.min(12, Math.round(duration / barDuration)));
  }

  // ---- 3. Determine intensity curve ----
  const curveType = inferIntensityCurve(mood, tempo);
  const intensityCurveDesc =
    curveType === "gradual-build" ? "Steadily rising energy from opening to climax" :
    curveType === "peak-valley" ? "Rising tension with peak intensity at ~60%, then resolution" :
    curveType === "constant-high" ? "Sustained high energy with rhythmic variation" :
    curveType === "slow-burn" ? "Slowly building emotional weight with exponential intensity" :
    "Strong opening and closing with breathing room in the middle";
  notes.push(`Intensity curve: ${intensityCurveDesc}`);

  // ---- 4. Three-act structure timing ----
  const hookEnd = Math.round(duration * 0.2 * 10) / 10;
  const buildEnd = Math.round(duration * 0.7 * 10) / 10;
  const resolveEnd = duration;

  // ---- 5. Generate beats ----
  const defaultPalette = palette?.length ? palette : ["deep navy", "electric blue", "warm white", "accent gold"];
  const beats: CinematicBeat[] = [];

  for (let i = 0; i < beatCount; i++) {
    const startTime = Math.round((i * (duration / beatCount)) * 10) / 10;
    const endTime = i === beatCount - 1 ? duration : Math.round(((i + 1) * (duration / beatCount)) * 10) / 10;
    const beatDuration = Math.round((endTime - startTime) * 10) / 10;

    const act = actForBeat(i, beatCount);
    const intensity = computeIntensity(i, beatCount, curveType);
    const shotProfile = shotProfileForBeat(act, mood, intensity.value, i);
    const { transIn, transOut } = transitionForBeat(act, mood, tempo, intensity.value, i === beatCount - 1);

    // Visual description
    let visual: string;
    if (i === 0 && brandName) {
      visual = `${brandName} brand world — establishing visual identity and tone`;
    } else if (act === "hook") {
      visual = "Attention-grabbing hero visual — bold, clear, immediately compelling";
    } else if (act === "resolve" && i === beatCount - 1) {
      visual = brandName
        ? `${brandName} brand lockup with call-to-action — clean, memorable closing frame`
        : "Final brand moment with call-to-action — clean, memorable closing composition";
    } else {
      const buildVisuals = [
        "Supporting visual building on the core message — layered depth and context",
        "Dynamic connection visual — motion graphics or symbolic transitions linking ideas",
        "Immersive hero composition — peak visual complexity with layered elements",
        "Contextual environment — establishing broader narrative context",
        "Detail moment — intimate visual emphasizing quality and craftsmanship",
      ];
      visual = buildVisuals[(i - 1) % buildVisuals.length];
    }

    beats.push({
      beat: i + 1,
      act,
      startTime,
      endTime,
      duration: beatDuration,
      purpose: purposeForAct(act, i, beatCount),
      visual,
      motion: motionForBeat(shotProfile, intensity.value, act, mood),
      intensity,
      shotType: shotProfile.shotType,
      cameraMove: shotProfile.cameraMove,
      lens: shotProfile.lens,
      lighting: shotProfile.lighting,
      transitionIn: transIn,
      transitionOut: transOut,
      palette: defaultPalette,
      bRollSuggestions: suggestBRoll(act, mood, visual),
      musicSync: musicSyncNote(tempo, bpm, i, act),
    });
  }

  notes.push(`Generated ${beatCount} beats across ${duration}s (${Math.round(duration / beatCount * 10) / 10}s avg per beat).`);
  notes.push(`Three-act structure: Hook (0-${hookEnd}s), Build (${hookEnd}-${buildEnd}s), Resolve (${buildEnd}-${resolveEnd}s).`);

  return {
    beats,
    tempo,
    mood,
    structure: { hookEnd, buildEnd, resolveEnd },
    intensityCurve: intensityCurveDesc,
    bpm,
    notes,
  };
}
