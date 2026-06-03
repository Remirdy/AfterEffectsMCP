import { z } from "zod";

/**
 * Zod input schemas for every MCP tool exposed by motionpilot-ae-mcp.
 * These are used both for runtime validation and to advertise the JSON
 * schema to MCP clients.
 */

export const analyzePsdVisualsSchema = {
  psdPath: z.string().describe("Absolute path to the source .psd file. Never modified."),
  outputAnalysisFolder: z
    .string()
    .describe("Folder where preview PNG, thumbnails and analysis.json are written. Created if missing."),
  includeLayerThumbnails: z
    .boolean()
    .default(true)
    .describe("Export a PNG thumbnail per visible layer."),
  includeFlattenedPreview: z
    .boolean()
    .default(true)
    .describe("Export a flattened full-composition preview.png."),
  includeTextLayerInfo: z
    .boolean()
    .default(true)
    .describe("Extract text content, font, size and color for text layers."),
};

export const createMotionPlanSchema = {
  analysisJsonPath: z.string().describe("Path to the analysis.json produced by analyze_psd_visuals."),
  userPrompt: z
    .string()
    .describe(
      "Natural-language animation direction from the user. The planner reads style, tempo, density, " +
        "camera/depth/parallax, kinetic typography, glow/light sweep, product promo, social ad and loop-ready cues."
    ),
  duration: z.number().positive().default(10).describe("Composition duration in seconds."),
  fps: z.number().positive().default(30).describe("Frames per second."),
  style: z
    .enum(["premium", "cinematic", "energetic", "minimal", "playful"])
    .default("premium")
    .describe("Overall motion style that biases easing and intensity."),
  outputMotionPlanPath: z
    .string()
    .optional()
    .describe("Optional path to write the motion plan JSON. Defaults next to the analysis file."),
};

export const createVideoPromptPackageSchema = {
  prompt: z
    .string()
    .min(8)
    .describe("Core prompt for the video or brand film concept."),
  referenceUrl: z
    .string()
    .url()
    .optional()
    .describe("Optional reference URL for direction only. The package avoids copying the reference."),
  brandName: z.string().optional().describe("Optional brand/project name."),
  text: z.string().optional().describe("Optional short on-screen text to preserve verbatim."),
  duration: z.number().positive().default(25).describe("Target total duration in seconds."),
  format: z.enum(["vertical", "horizontal", "square"]).default("vertical"),
  style: z
    .enum(["brandFilm", "cinematic", "socialAd", "productPromo", "abstractMotion", "documentary", "musicVideo"])
    .default("brandFilm"),
  palette: z.array(z.string()).optional().describe("Optional color palette words or hex values."),

  /* ---- Professional cinematic fields ---- */
  resolution: z
    .enum(["720p", "1080p", "4k"])
    .default("1080p")
    .describe("Target output resolution. Affects comp dimensions and AI prompt specs."),
  fps: z
    .number()
    .positive()
    .default(30)
    .describe("Frames per second. Use 24 for cinematic, 30 for standard, 60 for smooth motion."),
  mood: z
    .enum(["dramatic", "uplifting", "mysterious", "corporate", "playful", "romantic", "intense", "melancholic", "energetic", "serene"])
    .optional()
    .describe("Overall mood/atmosphere of the video. Auto-detected from prompt when omitted."),
  colorGrade: z
    .enum(["teal-orange", "cold-blue", "warm-golden", "desaturated", "neon-vibrant", "pastel-soft", "bleach-bypass", "cross-process", "monochrome", "vintage-film", "neutral"])
    .optional()
    .describe("Color grading profile. Auto-inferred from mood/style when omitted."),
  tempo: z
    .enum(["slow", "medium", "fast", "dynamic"])
    .optional()
    .describe("Pacing/tempo of the edit. Affects beat timing, transition density and cut frequency."),
  transitions: z
    .enum(["cuts-only", "smooth", "dynamic", "cinematic"])
    .default("cinematic")
    .describe("Transition style preference: cuts-only (hard cuts), smooth (dissolves), dynamic (whip-pans/zooms), cinematic (mixed organic)."),
  musicBpm: z
    .number()
    .positive()
    .optional()
    .describe("Music BPM for beat-synced editing. Aligns cut points and transitions to musical rhythm."),
  shotTypes: z
    .array(z.enum(["wide", "medium", "close", "extreme-close", "aerial", "tracking", "dolly", "crane", "steadicam", "pov", "overhead", "dutch-angle"]))
    .optional()
    .describe("Preferred shot types to use. The planner will prioritize these in the beat plan."),
  includeAeComposition: z
    .boolean()
    .default(false)
    .describe("When true, generates an After Effects composition with title cards, transitions, color grading, camera animation and VFX polish alongside the prompt package."),
  outputAepPath: z
    .string()
    .optional()
    .describe("Path for the generated AEP when includeAeComposition is true. Required when includeAeComposition is enabled."),
  approveOverwrite: z
    .boolean()
    .default(false)
    .describe("Must be true to overwrite an existing outputAepPath."),

  outputJsonPath: z
    .string()
    .optional()
    .describe("Optional path to save the generated prompt package JSON."),
};

export const createImageAssetPackSchema = {
  prompt: z.string().min(8).describe("Visual concept for procedural image assets."),
  outputFolder: z.string().describe("Folder where generated PNG assets and asset-manifest.json are written."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  style: z.enum(["brandFilm", "educationAd", "tech3d", "abstract3d", "socialAd"]).default("brandFilm"),
  palette: z.array(z.string()).optional().describe("Optional color palette as hex values or color words."),
};

export const create3dSceneFromAssetsSchema = {
  assetManifestPath: z.string().describe("Path to asset-manifest.json produced by create_image_asset_pack."),
  outputAepPath: z.string().describe("Path of the generated 3D/2.5D After Effects project."),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("MotionPilot_3D_Scene"),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const buildCinematicCommercialSchema = {
  prompt: z.string().min(6).describe("Creative concept for the commercial (drives palette/style of the procedural assets)."),
  outputFolder: z.string().describe("Folder where the procedural asset pack (PNGs + manifest) is written."),
  outputAepPath: z.string().describe("Path of the generated structured commercial .aep project."),
  assetManifestPath: z.string().optional().describe("Optional existing asset-manifest.json. If omitted, a procedural pack is generated from prompt+style."),
  style: z.enum(["brandFilm", "educationAd", "tech3d", "abstract3d", "socialAd"]).default("tech3d"),
  palette: z.array(z.string()).optional().describe("Optional color palette as hex values or color words."),
  brandName: z.string().optional().describe("Brand name for the logo lockup (text stays sharp, never distorted)."),
  features: z.array(z.string()).max(3).optional().describe("Up to three feature callout labels (5s–8s section)."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("MotionPilot_Commercial"),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const buildProceduralCommercialSchema = {
  prompt: z
    .string()
    .min(6)
    .describe(
      "Creative brief for an editable, asset-free After Effects commercial. Use when there are no source assets and the ad should be built from text, shape layers, gradients, particles, cameras and motion graphics."
    ),
  outputAepPath: z.string().describe("Path of the generated structured commercial .aep project."),
  brandName: z.string().describe("Brand/product name to use as editable wordmark text."),
  headline: z
    .string()
    .optional()
    .describe("Primary product positioning line. Kept verbatim and readable."),
  features: z
    .array(z.string())
    .max(3)
    .optional()
    .describe("Up to three short feature cards. Kept verbatim; no fake placeholder text is generated."),
  promptLine: z
    .string()
    .optional()
    .describe("Prompt/control moment line. Kept verbatim and readable."),
  tagline: z
    .string()
    .optional()
    .describe("Final lockup tagline. Kept verbatim and readable."),
  palette: z
    .array(z.string())
    .max(4)
    .optional()
    .describe("Optional hex palette. First = primary accent, second = secondary accent, third = text/light."),
  style: z
    .enum(["premiumTech", "cinematic", "minimal", "energetic"])
    .default("premiumTech")
    .describe("Procedural motion-graphics style profile."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("00_MASTER_COMP"),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const importPsdToAeSchema = {
  psdPath: z.string().describe("Absolute path to the source .psd file."),
  outputAepPath: z.string().describe("Path of the new .aep project to create."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  importMode: z
    .literal("composition_retained_layer_sizes")
    .default("composition_retained_layer_sizes")
    .describe("PSD import mode. Retains individual layer sizes inside a composition."),
  approveOverwrite: z
    .boolean()
    .default(false)
    .describe("Must be true to overwrite an existing outputAepPath."),
};

export const animateAeProjectSchema = {
  aepPath: z.string().describe("Path to the source .aep project (typically from import_psd_to_after_effects)."),
  motionPlanJsonPath: z.string().describe("Path to the motion plan JSON."),
  outputAepPath: z.string().describe("Path of the animated .aep to save (a new copy)."),
  preserveTextContent: z
    .boolean()
    .default(true)
    .describe("When true, sourceText is never modified — only transform/effect properties."),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const renderPreviewSchema = {
  aepPath: z.string().describe("Path to the .aep project to render."),
  compName: z.string().describe("Name of the composition to render."),
  outputVideoPath: z.string().describe("Path of the rendered video file."),
  format: z.enum(["mp4", "mov"]).default("mp4"),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite an existing output."),
};

export const checkAfterEffectsSetupSchema = {};

/* ---------------------------------------------------------------- *
 * VFX tools (game / cinema / social / ad)
 * ---------------------------------------------------------------- */

const vfxApplicationSchema = z.object({
  presetId: z
    .string()
    .describe("VFX preset id from list_vfx_presets, e.g. 'game.energy_burst', 'cinema.fire', 'social.glitch'."),
  fn: z.string().optional().describe("Advanced: override the underlying MPVFX function name directly."),
  targetLayer: z
    .string()
    .optional()
    .describe("Layer name or 'Prefix_' wildcard the effect should decorate (required for layer-mode presets like neon_glow, power_aura, kinetic_pop, glitch)."),
  params: z
    .record(z.any())
    .optional()
    .describe("Parameter overrides merged over preset defaults: start, duration, color ([r,g,b] 0..1), strength, position ([x,y]), from/to ([x,y]), mode, angle, rays."),
});

export const listVfxPresetsSchema = {
  domain: z
    .enum(["game", "cinema", "social", "ad"])
    .optional()
    .describe("Optional domain filter. Omit to list every preset across all domains."),
  includeComposites: z
    .boolean()
    .default(true)
    .describe("Also list multi-layer composite recipes (cinematicExplosion, magicCast, etc.)."),
};

const complexVfxApplicationSchema = z.object({
  compositeId: z
    .string()
    .describe("Composite recipe id: cinematicExplosion, magicCast, heroEntrance, celebration, powerSurge, stormScene."),
  intensity: z
    .number()
    .min(0.2)
    .max(3)
    .default(1)
    .describe("Scales effect strengths across the whole stack (0.2 subtle … 3 extreme)."),
  start: z.number().default(0).describe("Base start time in seconds for the whole stack."),
  position: z.array(z.number()).length(2).optional().describe("Focal point [x,y] in comp pixels."),
  color: z.array(z.number()).length(3).optional().describe("Override base color [r,g,b] 0..1."),
  targetLayer: z
    .string()
    .optional()
    .describe("Hero layer name/wildcard for layer-mode steps (e.g. light sweep & glow target the title in premiumAdPolish)."),
});

export const buildComplexVfxSchema = {
  aepPath: z
    .string()
    .optional()
    .describe("Existing .aep to apply composites to. Omit to create a fresh comp from newComp dims."),
  outputAepPath: z.string().describe("Path of the new .aep to save."),
  compName: z.string().optional().describe("Target comp name when aepPath is given. Defaults to the comp with most layers."),
  newComp: z
    .object({
      name: z.string().default("MotionPilot_VFX"),
      width: z.number().int().positive().default(1920),
      height: z.number().int().positive().default(1080),
      duration: z.number().positive().default(6),
      fps: z.number().positive().default(30),
    })
    .optional()
    .describe("Dimensions for a brand-new comp when aepPath is omitted."),
  composites: z
    .array(complexVfxApplicationSchema)
    .min(1)
    .describe("One or more multi-layer composite recipes to apply, each fully built in a single step."),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const createGameVfxFromPromptSchema = {
  prompt: z
    .string()
    .min(3)
    .describe(
      "Natural-language game VFX prompt in English or Turkish, e.g. 'mavi büyü patlaması', 'electric shield impact', 'fire sword slash'."
    ),
  aepPath: z
    .string()
    .optional()
    .describe("Optional existing .aep to apply the prompt-generated VFX to. Omit to create a fresh standalone VFX comp."),
  outputAepPath: z.string().describe("Path of the new .aep to save."),
  compName: z
    .string()
    .optional()
    .describe("Target comp name when aepPath is given, or new comp name when creating a fresh comp."),
  targetLayer: z
    .string()
    .optional()
    .describe("Hero layer name/wildcard for layer-mode VFX such as aura, disintegrate, neon, hologram or glitch."),
  width: z.number().int().positive().optional().describe("Override new-comp width. Prompt format words still work when omitted."),
  height: z.number().int().positive().optional().describe("Override new-comp height. Prompt format words still work when omitted."),
  duration: z.number().positive().default(5).describe("Composition/effect duration in seconds."),
  fps: z.number().positive().default(30),
  position: z.array(z.number()).length(2).optional().describe("Focal point [x,y] in comp pixels."),
  outputPlanJsonPath: z
    .string()
    .optional()
    .describe("Optional path to write the inferred VFX plan JSON before AE execution."),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const createGameEngineVfxPackageSchema = {
  prompt: z
    .string()
    .min(3)
    .describe(
      "Natural-language VFX prompt. If engine is auto, words like Unity, Unreal, Niagara, VFX Graph, URP or HDRP select the package target."
    ),
  outputFolder: z.string().describe("Folder for the engine-ready VFX package. Created if missing."),
  engine: z
    .enum(["auto", "unity", "unreal", "both"])
    .default("auto")
    .describe("Target engine package. auto infers from prompt; defaults to Unity when no engine is mentioned."),
  exportKind: z
    .enum(["spritesheet", "pngSequence", "both"])
    .default("both")
    .describe("Requested engine export format metadata. The tool creates source AEP + manifest/docs; render outputs can be generated from the AEP."),
  compName: z.string().default("MotionPilot_Engine_VFX"),
  frameWidth: z.number().int().positive().default(1024),
  frameHeight: z.number().int().positive().default(1024),
  duration: z.number().positive().default(2),
  fps: z.number().positive().default(30),
  loop: z.boolean().default(false),
  blendMode: z.enum(["additive", "alphaBlend", "premultipliedAlpha"]).default("additive"),
  position: z.array(z.number()).length(2).optional().describe("Focal point [x,y] in comp pixels."),
  c4dMode: z
    .enum(["auto", "off", "use", "require"])
    .default("auto")
    .describe(
      "Cinema 4D/Cineware behavior. auto uses C4D only when prompt mentions it or c4dScenePath is supplied; require fails if no c4dScenePath is supplied."
    ),
  c4dScenePath: z
    .string()
    .optional()
    .describe("Optional absolute path to a .c4d scene to import into the AE source comp via Cineware/AE import."),
  approveOverwrite: z
    .boolean()
    .default(false)
    .describe("Must be true when outputFolder already contains a manifest/source AEP that would be replaced."),
};

export const createRasterVfxPlateSchema = {
  prompt: z
    .string()
    .min(3)
    .describe("Natural-language VFX prompt. Example: 'Create fire', 'blue portal', 'magic shockwave'."),
  outputFolder: z.string().describe("Folder where PNG frames and raster-vfx-manifest.json are written."),
  kind: z.enum(["auto", "fire", "energy", "portal", "shockwave", "magic", "sparks"]).default("auto"),
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(720),
  frames: z.number().int().positive().default(120),
  fps: z.number().positive().default(30),
  approveOverwrite: z.boolean().default(false).describe("Must be true when outputFolder already contains raster-vfx-manifest.json."),
};

export const applyVfxSchema = {
  aepPath: z.string().describe("Path to the .aep project the VFX should be applied to."),
  outputAepPath: z.string().describe("Path of the new .aep to save with the VFX applied (a new copy)."),
  compName: z
    .string()
    .optional()
    .describe("Target composition name. Defaults to the comp with the most layers."),
  vfx: z
    .array(vfxApplicationSchema)
    .min(1)
    .describe("One or more VFX presets to apply, in order. Comp-mode presets spawn their own layers; layer-mode presets decorate targetLayer."),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const createVfxCompositionSchema = {
  outputAepPath: z.string().describe("Path of the new .aep project containing a standalone VFX element comp."),
  compName: z.string().default("MotionPilot_VFX").describe("Name of the VFX composition to create."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(5),
  fps: z.number().positive().default(30),
  backgroundColor: z
    .array(z.number())
    .length(3)
    .optional()
    .describe("Comp background RGB 0..1. Defaults to black (good for ADD-blended VFX)."),
  vfx: z
    .array(vfxApplicationSchema)
    .min(1)
    .describe("VFX presets that populate the new comp (e.g. an explosion or magic-circle element)."),
  approveOverwrite: z.boolean().default(false).describe("Must be true to overwrite outputAepPath."),
};

export const executeAeActionsSchema = {
  aepPath: z
    .string()
    .optional()
    .describe("Optional existing .aep project to open. If omitted, actions run in a new/empty AE project."),
  outputAepPath: z
    .string()
    .optional()
    .describe("Where to save the resulting .aep. Required for mutating actions; omitted for inspection-only actions."),
  approveOverwrite: z
    .boolean()
    .default(false)
    .describe("Must be true to overwrite an existing outputAepPath."),
  actions: z
    .array(
      z
        .object({
          type: z.enum([
            "createComposition",
            "listCompositions",
            "getProjectInfo",
            "createTextLayer",
            "createShapeLayer",
            "createSolidLayer",
            "createAdjustmentLayer",
            "createCameraLayer",
            "createNullLayer",
            "setLayerProperties",
            "setLayer3d",
            "setBlendMode",
            "setTrackMatte",
            "duplicateLayer",
            "deleteLayer",
            "createMask",
            "setKeyframes",
            "applyExpression",
            "batchSetProperties",
          ]),
        })
        .passthrough()
    )
    .min(1)
    .describe(
      "Batch AE actions. Common fields: compName, layerName, newName. Supports creating comps/layers, " +
        "editing transforms/timing/blend/track matte/masks, setting keyframes, expressions, and project inspection."
    ),
};

export type AnalyzePsdInput = {
  [K in keyof typeof analyzePsdVisualsSchema]: z.infer<(typeof analyzePsdVisualsSchema)[K]>;
};
export type CreateMotionPlanInput = {
  [K in keyof typeof createMotionPlanSchema]: z.infer<(typeof createMotionPlanSchema)[K]>;
};
export type CreateVideoPromptPackageInput = {
  [K in keyof typeof createVideoPromptPackageSchema]: z.infer<(typeof createVideoPromptPackageSchema)[K]>;
};
export type CreateImageAssetPackInput = {
  [K in keyof typeof createImageAssetPackSchema]: z.infer<(typeof createImageAssetPackSchema)[K]>;
};
export type Create3dSceneFromAssetsInput = {
  [K in keyof typeof create3dSceneFromAssetsSchema]: z.infer<(typeof create3dSceneFromAssetsSchema)[K]>;
};
export type BuildCinematicCommercialInput = {
  [K in keyof typeof buildCinematicCommercialSchema]: z.infer<(typeof buildCinematicCommercialSchema)[K]>;
};
export type BuildProceduralCommercialInput = {
  [K in keyof typeof buildProceduralCommercialSchema]: z.infer<(typeof buildProceduralCommercialSchema)[K]>;
};
export type ImportPsdInput = {
  [K in keyof typeof importPsdToAeSchema]: z.infer<(typeof importPsdToAeSchema)[K]>;
};
export type AnimateInput = {
  [K in keyof typeof animateAeProjectSchema]: z.infer<(typeof animateAeProjectSchema)[K]>;
};
export type RenderInput = {
  [K in keyof typeof renderPreviewSchema]: z.infer<(typeof renderPreviewSchema)[K]>;
};
export type CheckAfterEffectsSetupInput = Record<string, never>;
export type ExecuteAeActionsInput = {
  [K in keyof typeof executeAeActionsSchema]: z.infer<(typeof executeAeActionsSchema)[K]>;
};
export type ListVfxPresetsInput = {
  [K in keyof typeof listVfxPresetsSchema]: z.infer<(typeof listVfxPresetsSchema)[K]>;
};
export type ApplyVfxInput = {
  [K in keyof typeof applyVfxSchema]: z.infer<(typeof applyVfxSchema)[K]>;
};
export type CreateVfxCompositionInput = {
  [K in keyof typeof createVfxCompositionSchema]: z.infer<(typeof createVfxCompositionSchema)[K]>;
};
export type BuildComplexVfxInput = {
  [K in keyof typeof buildComplexVfxSchema]: z.infer<(typeof buildComplexVfxSchema)[K]>;
};
export type CreateGameVfxFromPromptInput = {
  [K in keyof typeof createGameVfxFromPromptSchema]: z.infer<(typeof createGameVfxFromPromptSchema)[K]>;
};
export type CreateGameEngineVfxPackageInput = {
  [K in keyof typeof createGameEngineVfxPackageSchema]: z.infer<(typeof createGameEngineVfxPackageSchema)[K]>;
};
export type CreateRasterVfxPlateInput = {
  [K in keyof typeof createRasterVfxPlateSchema]: z.infer<(typeof createRasterVfxPlateSchema)[K]>;
};

// ======================================================================
// ★ YENİ ÇILGIN TOOL ŞEMALARI ★
// ======================================================================

export const buildKineticTypographySchema = {
  text: z.string().min(1).describe("The full text or lyrics to animate. Each word/line gets its own keyframe-driven animation."),
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  style: z
    .enum(["wordByWord", "letterByLetter", "lineByLine", "scramble", "typewriter", "bounce", "3dSpin"])
    .default("wordByWord")
    .describe("Animation style. wordByWord = each word pops on beat; letterByLetter = stagger per character; scramble = Matrix-style randomize then reveal; typewriter = cursor typing; bounce = elastic scale bounce; 3dSpin = letters spin in 3D."),
  bpm: z.number().positive().default(120).describe("Beats per minute. Controls word timing and stagger intervals."),
  palette: z.array(z.string()).max(4).optional().describe("Color palette for gradient text / highlight colors. First = primary."),
  font: z.string().default("Arial Black").describe("Font name to use for all text layers."),
  fontSize: z.number().int().positive().default(120).describe("Base font size in pixels."),
  addGlow: z.boolean().default(true).describe("Add neon glow / bloom to text layers."),
  addBackground: z.boolean().default(true).describe("Add a styled gradient/particle background."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_KineticTypo"),
  approveOverwrite: z.boolean().default(false),
};

export const createParticleLogoRevealSchema = {
  logoText: z.string().describe("Brand name / logo text to assemble from particles."),
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  revealStyle: z
    .enum(["assemble", "disassemble", "swirl", "explosion", "rain", "vortex"])
    .default("assemble")
    .describe("assemble = particles converge to form the logo; disassemble = logo shatters to particles; swirl = spiral in; explosion = particles blast outward from logo; rain = particles fall from top to form text; vortex = rotating vortex reveal."),
  particleColor: z.array(z.number()).length(3).optional().describe("RGB 0..1 particle base color. Defaults to brand accent."),
  logoColor: z.array(z.number()).length(3).optional().describe("RGB 0..1 final logo text color."),
  particleCount: z.number().int().positive().default(800).describe("Approximate number of particles in the effect."),
  revealDuration: z.number().positive().default(2.5).describe("Duration of the reveal animation in seconds."),
  holdDuration: z.number().positive().default(2.0).describe("How long to hold on the completed logo."),
  addGlow: z.boolean().default(true).describe("Add glow/bloom to particles and final logo."),
  addAftertrail: z.boolean().default(true).describe("Add motion trail/echo to particles in flight."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_ParticleLogo"),
  approveOverwrite: z.boolean().default(false),
};

export const buildHolographicHudSceneSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  sceneType: z
    .enum(["cockpit", "cyberspace", "medical", "tactical", "sci-fi-lab", "hacker"])
    .default("sci-fi-lab")
    .describe("HUD scene preset. cockpit = flight/mech HUD; cyberspace = floating data nodes; medical = biometric monitor; tactical = military threat display; sci-fi-lab = research terminal; hacker = matrix-style code."),
  primaryColor: z.array(z.number()).length(3).optional().describe("Primary HUD color RGB 0..1. Default: cyan [0.1, 0.9, 1]."),
  accentColor: z.array(z.number()).length(3).optional().describe("Accent / warning color RGB 0..1. Default: orange [1, 0.5, 0.1]."),
  dataLines: z.array(z.string()).max(8).optional().describe("Custom data readout strings to display. Max 8 lines."),
  showRadar: z.boolean().default(true),
  showBarGraph: z.boolean().default(true),
  showCircularGauge: z.boolean().default(true),
  showScanlines: z.boolean().default(true),
  showCornerBrackets: z.boolean().default(true),
  showWaveform: z.boolean().default(true).describe("Animated audio waveform / signal line."),
  backgroundStyle: z
    .enum(["black", "dark-gradient", "grid", "stars", "city"])
    .default("dark-gradient"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_HUD_Scene"),
  approveOverwrite: z.boolean().default(false),
};

export const buildGenerativeArtLoopSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  style: z
    .enum(["flowField", "cellular", "fractalTree", "lavalamp", "voronoi", "spirograph", "turbulentInk", "crystalline"])
    .default("flowField")
    .describe("Generative art algorithm. flowField = curving particle field like Perlin noise flow; cellular = Conway's Game of Life inspired shapes; fractalTree = L-system branching; lavalamp = blob morphing blobs; voronoi = cell pattern; spirograph = hypotrochoid curves; turbulentInk = ink-drop-in-water; crystalline = geometric crystal growth."),
  palette: z.array(z.string()).max(5).optional().describe("Color palette for the generative art. Up to 5 colors."),
  complexity: z.number().int().min(1).max(10).default(5).describe("Complexity level 1-10 affecting density, iterations, layer count."),
  speed: z.number().positive().default(1.0).describe("Animation speed multiplier."),
  loopable: z.boolean().default(true).describe("When true, the animation loops perfectly (end frame matches start frame)."),
  resolution: z.enum(["1080p", "4k", "square-1k"]).default("1080p"),
  duration: z.number().positive().default(6),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_GenArt_Loop"),
  approveOverwrite: z.boolean().default(false),
};

export const createRetroSynthwaveSceneSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  sceneElements: z
    .array(z.enum(["grid", "sun", "mountains", "stars", "scanlines", "vhsChrome", "neonText", "city"]))
    .default(["grid", "sun", "mountains", "stars", "scanlines", "neonText"])
    .describe("Which scene elements to include. grid = perspective floor grid; sun = striped retrowave sun; mountains = silhouette mountains; stars = starfield; scanlines = CRT scanlines; vhsChrome = VHS tape aesthetic; neonText = glowing title text; city = city silhouette skyline."),
  primaryColor: z.array(z.number()).length(3).default([1, 0.2, 0.8]).describe("Primary neon color RGB 0..1 (typically hot pink/magenta)."),
  secondaryColor: z.array(z.number()).length(3).default([0.3, 0.1, 1]).describe("Secondary color RGB 0..1 (typically deep purple)."),
  gridColor: z.array(z.number()).length(3).default([0.5, 0.1, 0.9]).describe("Grid line color RGB 0..1."),
  titleText: z.string().optional().describe("Optional title text displayed in neon style."),
  subtitleText: z.string().optional().describe("Optional subtitle / tagline text."),
  gridSpeed: z.number().positive().default(1.0).describe("Grid scrolling speed multiplier."),
  sunStripes: z.number().int().min(3).max(20).default(8).describe("Number of horizontal stripes on the retrowave sun."),
  addVHSEffect: z.boolean().default(true).describe("Apply full VHS tape degradation on top."),
  addGlitch: z.boolean().default(false).describe("Add occasional glitch hits."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Synthwave_Scene"),
  approveOverwrite: z.boolean().default(false),
};

// ======================================================================
// Social creator package schemas
// ======================================================================

export const buildReelTemplateSchema = {
  outputAepPath: z.string().describe("Path of the generated Instagram Reel template .aep project."),
  brandName: z.string().default("BRAND").describe("Brand/account name used in editable text layers."),
  hookText: z.string().default("STOP SCROLLING").describe("Opening hook text. Kept editable."),
  ctaTexts: z.array(z.string()).max(4).default(["FOLLOW", "SAVE", "SHARE"]).describe("CTA card labels."),
  musicBpm: z.number().positive().default(120).describe("BPM used to place beat markers and sync cuts."),
  palette: z.array(z.string()).max(5).optional().describe("Optional hex palette. First colors drive accents and cards."),
  includeSafeGuides: z.boolean().default(true).describe("Add non-rendering 9:16 safe-area guides."),
  duration: z.number().positive().default(15),
  fps: z.number().positive().default(30),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  compName: z.string().default("MP_Instagram_Reel_Template"),
  approveOverwrite: z.boolean().default(false),
};

export const createTiktokTransitionPackSchema = {
  outputAepPath: z.string().describe("Path of the generated TikTok transition pack .aep project."),
  transitions: z
    .array(z.enum(["zoomBlur", "spin", "glitchCut", "whipPan", "seamlessMorph", "flashPop", "rgbSplit", "speedRamp", "sliceWipe", "shakeCut"]))
    .default(["zoomBlur", "spin", "glitchCut", "whipPan", "seamlessMorph", "flashPop", "rgbSplit", "speedRamp", "sliceWipe", "shakeCut"])
    .describe("Transition comps to build. Defaults to a 10-transition pack."),
  palette: z.array(z.string()).max(5).optional(),
  transitionDuration: z.number().positive().default(1),
  fps: z.number().positive().default(30),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  compPrefix: z.string().default("MP_TikTok_Transition"),
  approveOverwrite: z.boolean().default(false),
};

export const buildYoutubePackageSchema = {
  outputAepPath: z.string().describe("Path of the generated YouTube channel package .aep project."),
  channelName: z.string().default("CHANNEL").describe("Editable channel name text."),
  tagline: z.string().optional().describe("Optional intro/outro tagline."),
  lowerThirdNames: z.array(z.string()).max(5).default(["Host", "Guest", "Topic"]).describe("Lower-third title variants."),
  palette: z.array(z.string()).max(5).optional(),
  style: z.enum(["clean", "bold", "gaming", "tech", "creator"]).default("creator"),
  fps: z.number().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  approveOverwrite: z.boolean().default(false),
};

// ======================================================================
// Procedural spectacle schemas
// ======================================================================

export const buildAuroraBorealisSchema = {
  outputAepPath: z.string().describe("Path of the generated procedural aurora .aep project."),
  palette: z.array(z.string()).max(5).optional().describe("Aurora color stops as hex values."),
  waveIntensity: z.number().positive().default(70),
  noiseScale: z.number().positive().default(160),
  bandCount: z.number().int().min(2).max(9).default(5),
  addStars: z.boolean().default(true),
  addReflection: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Aurora_Borealis"),
  approveOverwrite: z.boolean().default(false),
};

export const buildFireTornadoSchema = {
  outputAepPath: z.string().describe("Path of the generated fire tornado .aep project."),
  intensity: z.number().min(0.2).max(3).default(1.2),
  flameColor: z.array(z.number()).length(3).default([1, 0.32, 0.04]),
  coreColor: z.array(z.number()).length(3).default([1, 0.9, 0.25]),
  particleDrift: z.number().positive().default(1),
  addSmoke: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Fire_Tornado"),
  approveOverwrite: z.boolean().default(false),
};

export const buildOceanWavesSchema = {
  outputAepPath: z.string().describe("Path of the generated procedural ocean waves .aep project."),
  waterColor: z.array(z.number()).length(3).default([0.02, 0.28, 0.45]),
  foamColor: z.array(z.number()).length(3).default([0.82, 0.95, 1]),
  waveHeight: z.number().positive().default(65),
  sprayAmount: z.number().min(0).max(3).default(1),
  addDepthShadow: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Ocean_Waves"),
  approveOverwrite: z.boolean().default(false),
};

// Type exports for new tools.
export type BuildKineticTypographyInput = {
  [K in keyof typeof buildKineticTypographySchema]: z.infer<(typeof buildKineticTypographySchema)[K]>;
};
export type CreateParticleLogoRevealInput = {
  [K in keyof typeof createParticleLogoRevealSchema]: z.infer<(typeof createParticleLogoRevealSchema)[K]>;
};
export type BuildHolographicHudSceneInput = {
  [K in keyof typeof buildHolographicHudSceneSchema]: z.infer<(typeof buildHolographicHudSceneSchema)[K]>;
};
export type BuildGenerativeArtLoopInput = {
  [K in keyof typeof buildGenerativeArtLoopSchema]: z.infer<(typeof buildGenerativeArtLoopSchema)[K]>;
};
export type CreateRetroSynthwaveSceneInput = {
  [K in keyof typeof createRetroSynthwaveSceneSchema]: z.infer<(typeof createRetroSynthwaveSceneSchema)[K]>;
};
export type BuildReelTemplateInput = {
  [K in keyof typeof buildReelTemplateSchema]: z.infer<(typeof buildReelTemplateSchema)[K]>;
};
export type CreateTiktokTransitionPackInput = {
  [K in keyof typeof createTiktokTransitionPackSchema]: z.infer<(typeof createTiktokTransitionPackSchema)[K]>;
};
export type BuildYoutubePackageInput = {
  [K in keyof typeof buildYoutubePackageSchema]: z.infer<(typeof buildYoutubePackageSchema)[K]>;
};
export type BuildAuroraBorealisInput = {
  [K in keyof typeof buildAuroraBorealisSchema]: z.infer<(typeof buildAuroraBorealisSchema)[K]>;
};
export type BuildFireTornadoInput = {
  [K in keyof typeof buildFireTornadoSchema]: z.infer<(typeof buildFireTornadoSchema)[K]>;
};
export type BuildOceanWavesInput = {
  [K in keyof typeof buildOceanWavesSchema]: z.infer<(typeof buildOceanWavesSchema)[K]>;
};

// ======================================================================
// ★ WAVE 3 — NEW TOOLS ★
// ======================================================================

export const buildAudioSpectrumVisualizerSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  style: z
    .enum(["bars", "waveform", "radial", "particles", "mirror-bars", "circle-waveform"])
    .default("bars")
    .describe("bars = vertical frequency bars; waveform = oscilloscope line; radial = circular frequency burst; particles = amplitude-driven particle field; mirror-bars = mirrored top/bottom bars; circle-waveform = circular waveform ring."),
  audioLayerName: z
    .string()
    .default("Audio")
    .describe("Name of the audio layer to link expressions to. Place your audio file on a layer with this name before running."),
  barCount: z.number().int().min(8).max(256).default(64).describe("Number of frequency bars (for bar/mirror-bars style)."),
  primaryColor: z.array(z.number()).length(3).default([0.2, 0.6, 1]).describe("Base color RGB 0..1."),
  accentColor: z.array(z.number()).length(3).default([1, 0.2, 0.8]).describe("Peak/accent color RGB 0..1."),
  sensitivity: z.number().min(0.1).max(5).default(1.5).describe("Amplitude sensitivity multiplier."),
  addGlow: z.boolean().default(true),
  addBackground: z.boolean().default(true),
  backgroundStyle: z.enum(["black", "dark-gradient", "blur-behind"]).default("dark-gradient"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(30),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_AudioViz"),
  approveOverwrite: z.boolean().default(false),
};

export const buildInfographicAnimationSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  chartType: z
    .enum(["bar", "horizontal-bar", "pie", "donut", "line", "counter", "progress-ring", "comparison"])
    .default("bar")
    .describe("bar = vertical bars; horizontal-bar = horizontal; pie = pie chart; donut = donut ring; line = line graph; counter = animated number counter; progress-ring = circular progress indicator; comparison = side-by-side stat comparison."),
  data: z
    .array(z.object({ label: z.string(), value: z.number(), color: z.string().optional() }))
    .min(1)
    .max(20)
    .describe("Data points. Each has label, value, and optional hex color override."),
  title: z.string().optional().describe("Chart title text."),
  subtitle: z.string().optional().describe("Chart subtitle / source text."),
  primaryColor: z.array(z.number()).length(3).default([0.2, 0.5, 1]).describe("Primary color RGB 0..1."),
  palette: z.array(z.string()).max(10).optional().describe("Optional hex palette cycling per data point."),
  animationStyle: z.enum(["grow", "fade", "bounce", "cascade"]).default("grow"),
  addGrid: z.boolean().default(true).describe("Add background grid lines."),
  addLabels: z.boolean().default(true).describe("Add value labels on bars/segments."),
  addLegend: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(5),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Infographic"),
  approveOverwrite: z.boolean().default(false),
};

export const buildLowerThirdSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  name: z.string().default("John Doe").describe("Primary name / title text."),
  title: z.string().default("Creative Director").describe("Secondary title / role text."),
  style: z
    .enum(["broadcast", "minimal", "corporate", "neon", "bold", "documentary", "news-ticker"])
    .default("broadcast")
    .describe("broadcast = classic BBC/CNN style with animated bar; minimal = clean text slide-in; corporate = icon + info card; neon = glowing cyberpunk; bold = large impactful text; documentary = Ken Burns style; news-ticker = scrolling ticker bar."),
  primaryColor: z.array(z.number()).length(3).default([0.1, 0.4, 0.9]).describe("Brand accent color RGB 0..1."),
  textColor: z.array(z.number()).length(3).default([1, 1, 1]).describe("Text color RGB 0..1."),
  animateIn: z.enum(["slide-left", "slide-right", "slide-up", "fade", "wipe"]).default("slide-left"),
  holdDuration: z.number().positive().default(3).describe("How long the lower third stays on screen."),
  generateVariants: z.number().int().min(1).max(10).default(1).describe("Generate N variants in separate comps (useful for multiple speakers)."),
  additionalNames: z.array(z.object({ name: z.string(), title: z.string() })).optional().describe("Extra name/title pairs for additional variants."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_LowerThird"),
  approveOverwrite: z.boolean().default(false),
};

export const buildLogoStingSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  logoText: z.string().default("BRAND").describe("Brand name / logo text."),
  tagline: z.string().optional().describe("Optional tagline beneath the logo."),
  style: z
    .enum(["reveal", "explosion", "elegant", "glitch", "neon", "corporate", "film", "minimal"])
    .default("reveal")
    .describe("reveal = particles assemble logo; explosion = logo slams in with shockwave; elegant = smooth light sweep reveal; glitch = digital glitch reveal; neon = neon flicker-on; corporate = clean slide + shine; film = cinematic light burst; minimal = typewriter."),
  primaryColor: z.array(z.number()).length(3).default([1, 1, 1]).describe("Logo text color RGB 0..1."),
  accentColor: z.array(z.number()).length(3).default([0.2, 0.6, 1]).describe("Accent / glow color RGB 0..1."),
  duration: z.number().positive().default(4).describe("Total sting duration in seconds."),
  addSound: z.boolean().default(false).describe("Add a sound design marker note (no audio generated, just a marker at impact frame)."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_LogoSting"),
  approveOverwrite: z.boolean().default(false),
};

export const buildGalaxySceneSchema = {
  outputAepPath: z.string().describe("Path of the generated procedural galaxy .aep project."),
  galaxyType: z
    .enum(["spiral", "barred-spiral", "nebula", "globular-cluster", "galaxy-collision"])
    .default("spiral")
    .describe("spiral = classic Milky Way style; barred-spiral = bar structure through center; nebula = colorful gas cloud + stars; globular-cluster = dense star ball; galaxy-collision = two galaxies merging."),
  primaryColor: z.array(z.number()).length(3).default([0.5, 0.7, 1]).describe("Core star color RGB 0..1."),
  nebulaColor: z.array(z.number()).length(3).default([0.8, 0.3, 1]).describe("Nebula/dust cloud color RGB 0..1."),
  starCount: z.enum(["minimal", "normal", "dense", "ultra"]).default("normal"),
  addCameraMove: z.boolean().default(true).describe("Add a slow camera drift / zoom for cinematic feel."),
  addNebula: z.boolean().default(true),
  loopable: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Galaxy_Scene"),
  approveOverwrite: z.boolean().default(false),
};

export const build3dCityscapeSchema = {
  outputAepPath: z.string().describe("Path of the generated procedural 3D cityscape .aep project."),
  timeOfDay: z.enum(["day", "dusk", "night", "dawn"]).default("night").describe("Affects sky color, window lights, and fog density."),
  cameraMove: z.enum(["static", "slow-dolly", "fly-through", "crane-up", "orbit"]).default("slow-dolly"),
  buildingStyle: z.enum(["modern", "retro", "futuristic", "dystopian"]).default("modern"),
  cityColor: z.array(z.number()).length(3).default([0.05, 0.05, 0.15]).describe("Building facade primary color RGB 0..1."),
  lightColor: z.array(z.number()).length(3).default([1, 0.85, 0.5]).describe("Window light color RGB 0..1."),
  addFog: z.boolean().default(true),
  addRain: z.boolean().default(false),
  addReflections: z.boolean().default(true).describe("Add wet street reflection layer."),
  buildingCount: z.number().int().min(5).max(40).default(20),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Cityscape"),
  approveOverwrite: z.boolean().default(false),
};

export const buildDnaHelixSchema = {
  outputAepPath: z.string().describe("Path of the generated DNA helix .aep project."),
  helixColor1: z.array(z.number()).length(3).default([0.1, 0.6, 1]).describe("First strand color RGB 0..1."),
  helixColor2: z.array(z.number()).length(3).default([1, 0.3, 0.5]).describe("Second strand color RGB 0..1."),
  basePairColor: z.array(z.number()).length(3).default([0.9, 0.9, 1]).describe("Base pair connector color RGB 0..1."),
  rotationSpeed: z.number().positive().default(1).describe("Rotation speed multiplier."),
  helixTurns: z.number().int().min(2).max(12).default(5).describe("Number of full helical turns visible."),
  addLabels: z.boolean().default(false).describe("Add A/T/G/C base pair labels."),
  addGlow: z.boolean().default(true),
  cameraAngle: z.enum(["front", "diagonal", "side", "top"]).default("diagonal"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_DNA_Helix"),
  approveOverwrite: z.boolean().default(false),
};

export const buildCountdownTimerSchema = {
  outputAepPath: z.string().describe("Path of the generated countdown timer .aep project."),
  countdownFrom: z.number().int().min(1).max(3600).default(10).describe("Starting number in seconds."),
  style: z
    .enum(["digital", "analog", "film-leader", "minimal", "neon", "explosion-reveal", "flip-clock"])
    .default("digital")
    .describe("digital = 7-segment display; analog = clock with hands; film-leader = classic film countdown; minimal = clean numbers; neon = glowing neon; explosion-reveal = each second explodes in; flip-clock = mechanical flip animation."),
  primaryColor: z.array(z.number()).length(3).default([1, 1, 1]).describe("Number color RGB 0..1."),
  accentColor: z.array(z.number()).length(3).default([1, 0.3, 0.1]).describe("Background/accent color RGB 0..1."),
  addProgressRing: z.boolean().default(true).describe("Add an animated circular progress ring."),
  addLabels: z.boolean().default(true).describe("Add HH:MM:SS labels below digits."),
  endAction: z.enum(["freeze", "flash", "explode", "fade"]).default("flash").describe("What happens when countdown reaches zero."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Countdown"),
  approveOverwrite: z.boolean().default(false),
};

export const buildTextMorphSchema = {
  outputAepPath: z.string().describe("Path of the generated .aep project."),
  words: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("List of words to morph between in sequence."),
  morphStyle: z
    .enum(["liquid", "particle-scatter", "glitch-swap", "blur-dissolve", "wave-distort", "shatter"])
    .default("liquid")
    .describe("liquid = letters flow/morph like liquid; particle-scatter = word scatters to particles then reforms; glitch-swap = glitch transition between words; blur-dissolve = directional blur cross-dissolve; wave-distort = wave warp morphing; shatter = word shatters then new word assembles."),
  fontSize: z.number().int().positive().default(150),
  font: z.string().default("Arial Black"),
  primaryColor: z.array(z.number()).length(3).default([1, 1, 1]).describe("Text color RGB 0..1."),
  accentColor: z.array(z.number()).length(3).default([0.3, 0.8, 1]).describe("Transition/particle color RGB 0..1."),
  holdDuration: z.number().positive().default(1.5).describe("How long each word holds before morphing."),
  morphDuration: z.number().positive().default(0.8).describe("Duration of the morph transition."),
  addBackground: z.boolean().default(true),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_TextMorph"),
  approveOverwrite: z.boolean().default(false),
};

export const createTimelineAnimationSchema = {
  outputAepPath: z.string().describe("Path of the generated timeline animation .aep project."),
  events: z
    .array(z.object({ year: z.string(), label: z.string(), description: z.string().optional(), color: z.string().optional() }))
    .min(2)
    .max(20)
    .describe("Timeline events in order. Each has year/date label, short label, optional description."),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  style: z.enum(["corporate", "minimal", "creative", "dark", "infographic"]).default("corporate"),
  primaryColor: z.array(z.number()).length(3).default([0.2, 0.5, 1]),
  accentColor: z.array(z.number()).length(3).default([1, 0.5, 0.1]),
  animationStyle: z.enum(["cascade", "draw-line", "pop-in", "fade-slide"]).default("cascade"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(15),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Timeline"),
  approveOverwrite: z.boolean().default(false),
};

export const applyLutGradeSchema = {
  aepPath: z.string().describe("Path to the source .aep project."),
  outputAepPath: z.string().describe("Path of the graded .aep project."),
  compName: z.string().optional().describe("Target composition name. Defaults to most-layered comp."),
  lutPath: z.string().optional().describe("Path to a .cube LUT file. If omitted, applies a built-in cinematic preset."),
  lutPreset: z
    .enum(["teal-orange", "cold-blue", "warm-golden", "desaturated", "neon-vibrant", "bleach-bypass", "cross-process", "vintage-film", "monochrome"])
    .optional()
    .describe("Built-in LUT preset (used when lutPath is omitted)."),
  intensity: z.number().min(0).max(1).default(1).describe("Blend amount: 0 = no effect, 1 = full LUT."),
  addVignette: z.boolean().default(true),
  addGrain: z.boolean().default(false),
  approveOverwrite: z.boolean().default(false),
};

export const organizeAeProjectSchema = {
  aepPath: z.string().describe("Path to the .aep project to organize."),
  outputAepPath: z.string().describe("Path of the organized .aep project (a new copy)."),
  namingConvention: z
    .enum(["snake_case", "camelCase", "UPPER_SNAKE", "Title_Case"])
    .default("snake_case")
    .describe("Naming convention to apply to unlabeled layers."),
  createFolders: z.boolean().default(true).describe("Create named folders in the project panel (Comps, Solids, Footage, Precomps)."),
  colorCodeLayers: z.boolean().default(true).describe("Apply color labels by layer type: text=yellow, shape=cyan, solid=gray, adjustment=green, camera=purple, null=orange."),
  removeUnused: z.boolean().default(false).describe("Remove unused footage items from the project."),
  addGuides: z.boolean().default(true).describe("Add safe-zone guides (title safe / action safe) to compositions."),
  approveOverwrite: z.boolean().default(false),
};

export const batchRenderQueueSchema = {
  aepPath: z.string().describe("Path to the .aep project."),
  renders: z
    .array(z.object({
      compName: z.string(),
      outputPath: z.string(),
      format: z.enum(["mp4", "mov", "png-sequence", "tiff-sequence"]).default("mp4"),
      scale: z.number().min(0.1).max(1).default(1).optional().describe("Output scale factor (0.5 = half resolution)."),
    }))
    .min(1)
    .max(20)
    .describe("List of comps to render with their output paths and formats."),
  renderAllComps: z.boolean().default(false).describe("When true, ignores the renders list and queues every comp in the project."),
  useAerender: z.boolean().default(true).describe("Prefer headless aerender over the AE render queue."),
};

export const exportAsLottieSchema = {
  aepPath: z.string().describe("Path to the .aep project."),
  compName: z.string().describe("Composition to export through Bodymovin/Lottie."),
  outputJsonPath: z.string().describe("Target .json path for the Lottie file."),
  includeAssets: z.boolean().default(true).describe("Ask Bodymovin to include/collect referenced assets when available."),
  openBodymovinPanel: z.boolean().default(true).describe("Open the Bodymovin panel if direct scripted export is unavailable."),
};

export const buildWorldMapSchema = {
  outputAepPath: z.string().describe("Path of the generated world map .aep project."),
  mapStyle: z.enum(["political", "minimal", "dark-tech", "satellite-style", "vintage"]).default("dark-tech"),
  highlightCountries: z.array(z.string()).optional().describe("Country names or ISO codes to highlight."),
  connectionPoints: z
    .array(z.object({ lat: z.number(), lon: z.number(), label: z.string().optional(), color: z.string().optional() }))
    .optional()
    .describe("Lat/lon points to mark. Connected with animated arc lines if 2+ points."),
  animateConnections: z.boolean().default(true).describe("Animate arc lines drawing between connection points."),
  primaryColor: z.array(z.number()).length(3).default([0.1, 0.4, 0.8]).describe("Map base color RGB 0..1."),
  highlightColor: z.array(z.number()).length(3).default([0.2, 0.9, 0.5]).describe("Highlighted country/point color RGB 0..1."),
  addGlowPoints: z.boolean().default(true).describe("Add pulsing glow circles at connection points."),
  cameraMove: z.enum(["static", "slow-pan", "zoom-to-region"]).default("static"),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_WorldMap"),
  approveOverwrite: z.boolean().default(false),
};

export const buildTemplateFromBrandkitSchema = {
  outputAepPath: z.string().describe("Path of the generated brand template .aep project."),
  brandName: z.string().default("BRAND").describe("Brand name used in editable text layers."),
  logoText: z.string().optional().describe("Optional logo/wordmark text. Defaults to brandName."),
  tagline: z.string().optional().describe("Optional tagline used in intro/outro and CTA comps."),
  colors: z
    .array(z.string())
    .min(1)
    .max(8)
    .default(["#1E6BFF", "#111827", "#FFFFFF", "#14B8A6"])
    .describe("Brand colors as hex values. First = primary, second = dark/base, third = text/light, fourth = accent."),
  fonts: z.array(z.string()).max(3).optional().describe("Preferred AE font names. First = display, second = body."),
  tone: z.enum(["premium", "corporate", "playful", "tech", "luxury", "creator"]).default("premium"),
  deliverables: z
    .array(z.enum(["intro", "outro", "lower-third", "title-card", "cta", "social-story", "end-screen"]))
    .default(["intro", "outro", "lower-third", "title-card", "cta"])
    .describe("Template comps to generate from the brand kit."),
  includeSafeGuides: z.boolean().default(true).describe("Add locked non-rendering safe-area guide layers."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(6),
  fps: z.number().positive().default(30),
  compPrefix: z.string().default("BK"),
  approveOverwrite: z.boolean().default(false),
};

export const buildProductMockupSceneSchema = {
  outputAepPath: z.string().describe("Path of the generated product mockup .aep project."),
  productName: z.string().default("Product").describe("Editable product/brand name shown on the mockup."),
  productType: z.enum(["phone", "laptop", "tablet", "box", "bottle", "can", "card", "app-screen", "packaging"]).default("phone"),
  headline: z.string().optional().describe("Optional hero headline text."),
  subhead: z.string().optional().describe("Optional supporting line / feature promise."),
  style: z.enum(["studio", "premium-tech", "minimal", "neon", "luxury", "social-ad"]).default("studio"),
  primaryColor: z.array(z.number()).length(3).default([0.1, 0.35, 1]).describe("Primary product/accent RGB 0..1."),
  accentColor: z.array(z.number()).length(3).default([0.1, 0.9, 0.75]).describe("Secondary glow/highlight RGB 0..1."),
  surfaceColor: z.array(z.number()).length(3).default([0.05, 0.06, 0.08]).describe("Product body/surface RGB 0..1."),
  cameraMove: z.enum(["static", "push-in", "orbit", "float", "hero-rise"]).default("push-in"),
  add360Shine: z.boolean().default(true).describe("Add animated product light sweeps and shine passes."),
  addCallouts: z.boolean().default(true).describe("Add editable feature callout tags around the product."),
  callouts: z.array(z.string()).max(4).optional().describe("Optional short callout labels."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Product_Mockup"),
  approveOverwrite: z.boolean().default(false),
};

// Type exports — Wave 3
export type BuildAudioSpectrumVisualizerInput = { [K in keyof typeof buildAudioSpectrumVisualizerSchema]: z.infer<(typeof buildAudioSpectrumVisualizerSchema)[K]> };
export type BuildInfographicAnimationInput = { [K in keyof typeof buildInfographicAnimationSchema]: z.infer<(typeof buildInfographicAnimationSchema)[K]> };
export type BuildLowerThirdInput = { [K in keyof typeof buildLowerThirdSchema]: z.infer<(typeof buildLowerThirdSchema)[K]> };
export type BuildLogoStingInput = { [K in keyof typeof buildLogoStingSchema]: z.infer<(typeof buildLogoStingSchema)[K]> };
export type BuildGalaxySceneInput = { [K in keyof typeof buildGalaxySceneSchema]: z.infer<(typeof buildGalaxySceneSchema)[K]> };
export type Build3dCityscapeInput = { [K in keyof typeof build3dCityscapeSchema]: z.infer<(typeof build3dCityscapeSchema)[K]> };
export type BuildDnaHelixInput = { [K in keyof typeof buildDnaHelixSchema]: z.infer<(typeof buildDnaHelixSchema)[K]> };
export type BuildCountdownTimerInput = { [K in keyof typeof buildCountdownTimerSchema]: z.infer<(typeof buildCountdownTimerSchema)[K]> };
export type BuildTextMorphInput = { [K in keyof typeof buildTextMorphSchema]: z.infer<(typeof buildTextMorphSchema)[K]> };
export type CreateTimelineAnimationInput = { [K in keyof typeof createTimelineAnimationSchema]: z.infer<(typeof createTimelineAnimationSchema)[K]> };
export type ApplyLutGradeInput = { [K in keyof typeof applyLutGradeSchema]: z.infer<(typeof applyLutGradeSchema)[K]> };
export type OrganizeAeProjectInput = { [K in keyof typeof organizeAeProjectSchema]: z.infer<(typeof organizeAeProjectSchema)[K]> };
export type BatchRenderQueueInput = { [K in keyof typeof batchRenderQueueSchema]: z.infer<(typeof batchRenderQueueSchema)[K]> };
export type ExportAsLottieInput = { [K in keyof typeof exportAsLottieSchema]: z.infer<(typeof exportAsLottieSchema)[K]> };
export type BuildWorldMapInput = { [K in keyof typeof buildWorldMapSchema]: z.infer<(typeof buildWorldMapSchema)[K]> };
export type BuildTemplateFromBrandkitInput = { [K in keyof typeof buildTemplateFromBrandkitSchema]: z.infer<(typeof buildTemplateFromBrandkitSchema)[K]> };
export type BuildProductMockupSceneInput = { [K in keyof typeof buildProductMockupSceneSchema]: z.infer<(typeof buildProductMockupSceneSchema)[K]> };

// ======================================================================
// Unity game VFX production toolkit schemas
// ======================================================================

const unityBlendModeSchema = z.enum(["additive", "alphaBlend", "premultipliedAlpha", "distortion"]);
const unityPipelineSchema = z.enum(["urp", "hdrp", "built-in"]);
const unityPlatformSchema = z.enum(["mobile", "desktop", "console", "all"]);

const unityVfxBaseSchema = {
  outputFolder: z.string().describe("Folder where the Unity-ready VFX package is written."),
  packageName: z.string().optional().describe("Optional folder/package name. Defaults from tool + effect."),
  prompt: z.string().optional().describe("Natural-language VFX direction. Used to infer effect type and recommendations."),
  effectName: z.string().optional().describe("Human-readable effect name."),
  effectType: z
    .enum(["energy", "fire", "ice", "lightning", "heal", "poison", "shield", "portal", "slash", "impact", "smoke", "magic"])
    .optional(),
  style: z.enum(["stylized", "realistic", "anime", "dark", "sci-fi", "mobile", "cinematic"]).default("stylized"),
  width: z.number().int().positive().default(1024),
  height: z.number().int().positive().default(1024),
  fps: z.number().positive().default(30),
  frameCount: z.number().int().positive().default(64),
  columns: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
  loop: z.boolean().optional().describe("Whether the VFX should be authored/imported as a loop."),
  blendMode: unityBlendModeSchema.optional(),
  targetPipeline: unityPipelineSchema.default("urp"),
  targetPlatform: unityPlatformSchema.default("all"),
  spriteSheetPath: z.string().optional().describe("Optional relative/absolute sprite-sheet path to reference in the manifest."),
  pngSequenceFolder: z.string().optional().describe("Optional frame sequence folder to reference in the manifest."),
  pivot: z.array(z.number()).length(2).optional().describe("Normalized Unity pivot, usually [0.5, 0.5] or [0.5, 0]."),
  maxTextureSize: z.number().int().positive().optional(),
  particleBudget: z.number().int().positive().optional(),
  overdrawBudget: z.number().positive().optional(),
  variationCount: z.number().int().positive().max(100).optional().describe("Number of controlled variants to plan/generate in the package."),
  qualityTarget: z.enum(["prototype", "production", "assetStore"]).optional().describe("Output quality target for naming, docs, and optimization recommendations."),
  approveOverwrite: z.boolean().default(false),
};

function unityVfxSchema(extra: Record<string, z.ZodTypeAny> = {}) {
  return { ...unityVfxBaseSchema, ...extra };
}

export const buildUnityVfxSpritesheetSchema = unityVfxSchema({
  texturePath: z.string().optional().describe("Optional existing rendered texture/spritesheet path."),
});
export const buildUnityVfxPrefabPackageSchema = unityVfxSchema();
export const buildVfxGraphTemplateSchema = unityVfxSchema({
  phases: z.array(z.string()).max(8).optional().describe("Optional named VFX phases for the graph."),
});
export const buildUrpParticleMaterialsSchema = unityVfxSchema({
  materialVariants: z.array(z.enum(["additive", "alphaBlend", "softParticle", "distortion", "flipbook"])).optional(),
});
export const buildHitImpactPackSchema = unityVfxSchema({
  impactTypes: z.array(z.enum(["bullet", "magic", "slash", "shield", "ground", "spark"])).optional(),
});
export const buildElementalSpellPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["fire", "ice", "lightning", "poison", "holy", "dark", "arcane"])).optional(),
});
export const buildProjectileVfxSchema = unityVfxSchema({
  phases: z.array(z.enum(["cast", "muzzle", "trail", "impact", "linger"])).default(["cast", "trail", "impact"]),
});
export const buildCharacterStatusEffectsSchema = unityVfxSchema({
  statuses: z.array(z.enum(["heal", "poison", "burn", "freeze", "stun", "shield", "rage", "invisibility"])).optional(),
});
export const exportUnityFlipbookManifestSchema = unityVfxSchema();
export const buildUnityShadergraphStubSchema = unityVfxSchema();
export const buildVfxLodVariantsSchema = unityVfxSchema({
  lods: z.array(z.enum(["high", "medium", "low", "mobile"])).default(["high", "medium", "low", "mobile"]),
});
export const buildMobileVfxOptimizerSchema = unityVfxSchema({
  targetPlatform: unityPlatformSchema.default("mobile"),
});
export const buildVfxCollisionVariantsSchema = unityVfxSchema({
  surfaces: z.array(z.enum(["ground", "wall", "air", "water", "metal", "organic"])).optional(),
});
export const buildUnityImportSettingsSchema = unityVfxSchema();
export const buildRpgSpellLibrarySchema = unityVfxSchema({
  spells: z.array(z.string()).max(24).optional(),
});
export const buildFpsMuzzleImpactPackSchema = unityVfxSchema({
  weaponTypes: z.array(z.enum(["pistol", "rifle", "shotgun", "energy", "launcher"])).optional(),
});
export const buildMobaSkillVfxSchema = unityVfxSchema({
  skillShape: z.enum(["line", "cone", "circle", "dash", "targeted", "aoe"]).default("circle"),
});
export const buildPlatformerPickupVfxSchema = unityVfxSchema({
  pickupTypes: z.array(z.enum(["coin", "gem", "checkpoint", "jumpDust", "landingPuff", "dashTrail", "deathPoof"])).optional(),
});
export const buildHorrorGameAtmosphericsSchema = unityVfxSchema({
  atmosphereTypes: z.array(z.enum(["fogPulse", "ghostDistortion", "flicker", "bloodMist", "cursedAura", "screenShock"])).optional(),
});
export const planUnityVfxFromPromptSchema = unityVfxSchema({
  prompt: z.string().min(3).describe("Unity VFX prompt to analyze and turn into a production plan."),
});
export const buildVfxComboFromPromptSchema = unityVfxSchema({
  prompt: z.string().min(3).describe("Prompt used to create a combined plan + package + manifest scaffold."),
});
export const validateUnityVfxBudgetSchema = unityVfxSchema({
  texturePath: z.string().optional().describe("Optional texture/spritesheet path for budget notes."),
});
export const buildVfxPreviewSceneSchema = unityVfxSchema();
export const buildVfxTimingSheetSchema = unityVfxSchema({
  phases: z.array(z.string()).max(12).optional().describe("Custom timing phases, e.g. anticipation, flash, peak, decay."),
});

export const buildPremiumVfxAtlasPackSchema = unityVfxSchema({
  variationCount: z.number().int().min(2).max(64).default(12),
  qualityTarget: z.enum(["prototype", "production", "assetStore"]).default("assetStore"),
});
export const buildLayeredVfxPassesSchema = unityVfxSchema({
  passes: z.array(z.enum(["core", "glow", "smoke", "sparks", "distortion", "debris", "light"])).optional(),
});
export const buildFlipbookNormalDistortionSchema = unityVfxSchema({
  maps: z.array(z.enum(["color", "normal", "distortion", "flowmap", "emissive"])).default(["color", "normal", "distortion"]),
});
export const buildVfxVariationGeneratorSchema = unityVfxSchema({
  variationCount: z.number().int().min(2).max(100).default(20),
});
export const buildCombatVfxBundleSchema = unityVfxSchema({
  combatTypes: z.array(z.enum(["slash", "hit", "crit", "block", "parry", "dash", "charge", "ultimate", "groundCrack"])).optional(),
});
export const buildMagicSchoolBundleSchema = unityVfxSchema({
  schools: z.array(z.enum(["fire", "frost", "lightning", "arcane", "nature", "dark"])).optional(),
});
export const buildShaderDrivenVfxPackSchema = unityVfxSchema({
  shaderEffects: z.array(z.enum(["dissolve", "fresnelAura", "scrollingNoise", "refraction", "heatHaze", "uvDistortion"])).optional(),
});
export const buildMeshBasedVfxPrimitivesSchema = unityVfxSchema({
  primitives: z.array(z.enum(["ring", "cone", "arc", "slashMesh", "shockwaveDisk", "beamStrip", "trailRibbon"])).optional(),
});
export const buildTrailRendererPackSchema = unityVfxSchema({
  trailTypes: z.array(z.enum(["weapon", "dash", "projectile", "ribbon"])).optional(),
});
export const buildDecalImpactPackSchema = unityVfxSchema({
  decalTypes: z.array(z.enum(["scorch", "magicRune", "bulletHole", "crack", "bloodSplat", "iceMark", "poisonPuddle"])).optional(),
});
export const buildScreenSpaceVfxSchema = unityVfxSchema({
  screenEffects: z.array(z.enum(["damageVignette", "lowHealthPulse", "hitFlash", "speedLines", "radialBlur", "shockDistortion"])).optional(),
});
export const buildAssetStoreVfxPackageSchema = unityVfxSchema({
  variationCount: z.number().int().min(1).max(100).default(24),
  qualityTarget: z.enum(["prototype", "production", "assetStore"]).default("assetStore"),
});
export const buildDemoSceneGallerySchema = unityVfxSchema({
  categories: z.array(z.string()).max(16).optional(),
});
export const buildVfxThumbnailSheetSchema = unityVfxSchema({
  thumbnailCount: z.number().int().min(1).max(100).default(24),
});
export const buildVfxDocumentationPackSchema = unityVfxSchema();
export const buildVfxPackIndexSchema = unityVfxSchema({
  categories: z.array(z.string()).max(24).optional(),
});
export const scoreVfxAssetQualitySchema = unityVfxSchema({
  qualityTarget: z.enum(["prototype", "production", "assetStore"]).default("assetStore"),
});
export const buildVfxPerformanceProfilesSchema = unityVfxSchema({
  profiles: z.array(z.enum(["mobile", "desktop", "console"])).default(["mobile", "desktop", "console"]),
});
export const auditVfxOverdrawSchema = unityVfxSchema({
  overdrawBudget: z.number().positive().default(3),
});
export const buildVfxLifetimeCurvesSchema = unityVfxSchema();
export const buildVfxColorRampsSchema = unityVfxSchema({
  rampFamilies: z.array(z.enum(["fire", "ice", "poison", "holy", "dark", "sciFi"])).optional(),
});

export const renderVfxFlipbookFromAeSchema = unityVfxSchema({
  aepPath: z.string().optional().describe("Optional AE source .aep path for aerender command generation."),
  compName: z.string().optional().describe("AE composition name to render."),
});
export const packFlipbookAtlasSchema = unityVfxSchema({
  padding: z.number().int().min(0).max(64).default(4).describe("Recommended atlas padding in pixels."),
});
export const generateVfxPreviewGifMp4Schema = unityVfxSchema({
  outputVideoPath: z.string().optional().describe("Optional MP4 preview output path."),
  outputGifPath: z.string().optional().describe("Optional GIF preview output path."),
});
export const renderVfxThumbnailContactSheetSchema = unityVfxSchema({
  thumbnailCount: z.number().int().min(1).max(100).default(24),
});
export const autoCropAlphaFramesSchema = unityVfxSchema();
export const normalizeFlipbookBrightnessAlphaSchema = unityVfxSchema();
export const validateLoopSeamSchema = unityVfxSchema({
  loop: z.boolean().default(true),
});
export const generateRealUnityPrefabsSchema = unityVfxSchema();
export const generateVfxGraphAssetSchema = unityVfxSchema();
export const generateShadergraphAssetSchema = unityVfxSchema();
export const createUnityDemoProjectSchema = unityVfxSchema({
  targetPipeline: unityPipelineSchema.default("urp"),
});
export const createUnityPackageExportSchema = unityVfxSchema({
  outputUnityPackagePath: z.string().optional().describe("Target .unitypackage path for generated Unity export script."),
});
export const buildMarketplaceMediaPackSchema = unityVfxSchema({
  thumbnailCount: z.number().int().min(1).max(100).default(24),
});
export const writeAssetStoreDescriptionSchema = unityVfxSchema();
export const generatePackTrailerStoryboardSchema = unityVfxSchema();
export const buildDemoGalleryUiSchema = unityVfxSchema();
export const analyzeFlipbookSilhouetteSchema = unityVfxSchema();
export const detectAlphaBleedingEdgesSchema = unityVfxSchema();
export const estimateTextureMemoryBudgetSchema = unityVfxSchema();
export const compareLodVisualLossSchema = unityVfxSchema({
  highLodPath: z.string().optional(),
  mediumLodPath: z.string().optional(),
  lowLodPath: z.string().optional(),
});
export const validateMobileVfxPackSchema = unityVfxSchema({
  targetPlatform: unityPlatformSchema.default("mobile"),
});
