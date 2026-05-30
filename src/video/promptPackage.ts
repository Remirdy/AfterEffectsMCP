import { CreateVideoPromptPackageInput } from "../schemas.js";

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

function size(format: CreateVideoPromptPackageInput["format"]): string {
  switch (format) {
    case "horizontal":
      return "1280x720";
    case "square":
      return "1024x1024";
    default:
      return "720x1280";
  }
}

function styleKeywords(style: string): string[] {
  const table: Record<string, string[]> = {
    brandFilm: ["dynamic", "connect", "immersion", "asset system", "graphic universe"],
    cinematic: ["premium camera language", "depth", "atmosphere", "controlled light"],
    socialAd: ["fast hooks", "clear CTA", "rhythmic beats", "scroll-stopping motion"],
    productPromo: ["hero product reveal", "feature beats", "interface motion", "polished CTA"],
    abstractMotion: ["procedural shapes", "kinetic patterns", "symbolic transitions", "modular assets"],
  };
  return table[style] ?? table.brandFilm;
}

function beatCount(duration: number): number {
  if (duration <= 8) return 3;
  if (duration <= 15) return 4;
  if (duration <= 30) return 5;
  return 6;
}

function makeBeats(input: CreateVideoPromptPackageInput): Array<Record<string, unknown>> {
  const prompt = input.prompt;
  const count = beatCount(input.duration);
  const segment = Math.round((input.duration / count) * 10) / 10;
  const isEducation = includesAny(prompt, ["education", "school", "course", "student", "eğitim", "okul", "kurs"]);
  const hasTech = includesAny(prompt, ["platform", "app", "dashboard", "streaming", "tech", "ui"]);
  const hasBrand = Boolean(input.brandName);
  const palette = input.palette?.length ? input.palette : ["deep navy", "electric blue", "warm white", "accent orange"];

  const subjects = [
    hasBrand ? `${input.brandName} brand world` : "the brand world",
    isEducation ? "motivated students and learning symbols" : hasTech ? "modular interface and platform signals" : "modular graphic assets",
    "dynamic connection lines and symbolic transitions",
    "immersive hero composition with layered depth",
    "final brand lockup and call-to-action moment",
    "loop-ready closing visual system",
  ];

  return Array.from({ length: count }, (_, i) => {
    const start = Math.round(i * segment * 10) / 10;
    const end = i === count - 1 ? input.duration : Math.round((i + 1) * segment * 10) / 10;
    return {
      beat: i + 1,
      time: `${start}s-${end}s`,
      purpose:
        i === 0
          ? "hook and establish tone"
          : i === count - 1
            ? "resolve into brand/CTA"
            : "build visual system and momentum",
      visual: subjects[i] ?? subjects[subjects.length - 1],
      motion:
        i === 0
          ? "fast graphic assembly, magnetic snap, subtle camera push"
          : i === count - 1
            ? "clean settle, glow accent, readable CTA"
            : "liquid drift, parallax orbit, kinetic wipes, rhythmic transitions",
      color: palette,
    };
  });
}

function makeSoraPrompt(input: CreateVideoPromptPackageInput, beat: Record<string, unknown>): string {
  const brand = input.brandName ? `Brand: ${input.brandName}` : "Brand: unnamed concept";
  const reference = input.referenceUrl
    ? `Reference direction: inspired by the referenced brand-film approach, using modular graphic assets, dynamic connection, and immersive visual language. Do not copy the reference.`
    : "Reference direction: original brand-film motion language.";
  return [
    `Use case: ${input.style} video segment`,
    `Primary request: ${input.prompt}`,
    brand,
    reference,
    `Format: ${aspect(input.format)}, ${size(input.format)}`,
    `Timing: ${beat.time}; ${beat.purpose}`,
    `Scene/background: ${beat.visual}`,
    `Action: ${beat.motion}`,
    "Camera: controlled digital camera move, layered depth, premium motion design framing",
    `Lighting/mood: polished, sophisticated, high-contrast but clean`,
    `Color palette: ${(input.palette?.length ? input.palette : ["deep navy", "electric blue", "warm white", "accent orange"]).join(", ")}`,
    "Style: brand film, motion graphics, modular asset system, crisp typography-safe composition",
    input.text ? `Text (verbatim): "${input.text}"` : "Text: avoid long readable text unless explicitly provided",
    "Constraints: no copyrighted characters, no copied logos, no real people likeness, no unreadable text, no flicker artifacts",
  ].join("\n");
}

export function buildVideoPromptPackage(input: CreateVideoPromptPackageInput) {
  const keywords = styleKeywords(input.style);
  const beats = makeBeats(input);
  const soraPrompts = beats.map((beat) => ({
    beat: beat.beat,
    seconds: input.duration <= 12 ? String(input.duration) : input.duration <= 24 ? "8" : "12",
    size: size(input.format),
    prompt: makeSoraPrompt(input, beat),
  }));

  return {
    ok: true,
    packageType: "prompt_to_video",
    brandName: input.brandName ?? null,
    format: input.format,
    duration: input.duration,
    style: input.style,
    referenceUrl: input.referenceUrl ?? null,
    creativeBrief: {
      concept: input.prompt,
      tone: keywords,
      visualSystem: [
        "modular graphic asset language",
        "clear hierarchy across beats",
        "procedural motion that can be recreated in After Effects",
        "short AI-video segments that can be stitched or used as style exploration",
      ],
      avoid: [
        "copying the reference video",
        "copyrighted characters or logos",
        "real-person likeness",
        "long generated text",
        "overcrowded frames",
      ],
    },
    shotList: beats,
    aiVideoPrompts: soraPrompts,
    afterEffectsDirection: {
      composition: { duration: input.duration, format: aspect(input.format), fps: 30 },
      motionLanguage: [
        "magneticSnap for asset entrances",
        "liquidDrift and parallaxOrbit for background systems",
        "revealWipeBlur for typography-safe reveals",
        "microShake only on impact/CTA moments",
        "cameraPush for cinematic transitions",
      ],
      suggestedAnimationTypes: [
        "magneticSnap",
        "liquidDrift",
        "parallaxOrbit",
        "revealWipeBlur",
        "cinematicJitter",
        "microShake",
        "lightSweep",
        "cameraPush",
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}
