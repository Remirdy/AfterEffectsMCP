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

// ======================================================================
// ★ NEW LEGENDARY TOOLS SCHEMAS ★
// ======================================================================

export const build3dPlanetGeneratorSchema = {
  outputAepPath: z.string().describe("Path of the generated procedural planet AEP project."),
  color: z.array(z.number()).length(3).default([0.3, 0.6, 1]).describe("Primary planet glow RGB color 0..1."),
  ringColor: z.array(z.number()).length(3).default([0.8, 0.7, 0.9]).describe("Planet ring RGB color 0..1."),
  addRings: z.boolean().default(true).describe("Include planetary rings."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_3D_Planet"),
  approveOverwrite: z.boolean().default(false),
};

export const buildCyberScanOverlaySchema = {
  outputAepPath: z.string().describe("Path of the generated cyber scan AEP project."),
  targetLayer: z.string().default("Target_Layer").describe("Target layer name or wildcard prefix to overlay scanner HUD components on."),
  color: z.array(z.number()).length(3).default([0.1, 0.9, 1]).describe("Laser/HUD neon RGB color 0..1."),
  scanSpeed: z.number().positive().default(1.2).describe("Laser sweeping speed multiplier."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Cyber_Scan"),
  approveOverwrite: z.boolean().default(false),
};

export const buildDimensionalRiftSchema = {
  outputAepPath: z.string().describe("Path of the generated dimensional crack AEP project."),
  color: z.array(z.number()).length(3).default([0.6, 0.2, 1]).describe("Rift inner energy discharge color RGB 0..1."),
  riftWidth: z.number().positive().default(350).describe("Scale width of the screen tear/crack."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(8),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Dimensional_Rift"),
  approveOverwrite: z.boolean().default(false),
};

export const generateVfxNormalMapSequenceSchema = {
  diffuseFramesFolder: z.string().describe("Path to the input folder containing PNG diffuse frame sequences."),
  outputNormalFolder: z.string().describe("Target folder where computed Sobel normal map PNG frames are written."),
  strength: z.number().positive().default(2.5).describe("Height bump multiplier/Sobel gradient scaling factor."),
  approveOverwrite: z.boolean().default(false),
};

export const buildCosmicNebulaSceneSchema = {
  outputAepPath: z.string().describe("Path of the generated volumetric nebula AEP project."),
  color: z.array(z.number()).length(3).default([0.8, 0.3, 1]).describe("Primary nebula dust RGB color 0..1."),
  blackHole: z.boolean().default(true).describe("Include singularity black hole core and accretion disk."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(12),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Cosmic_Nebula"),
  approveOverwrite: z.boolean().default(false),
};

export const buildAudioBeatSyncControllerSchema = {
  outputAepPath: z.string().describe("Path of the target AEP project to write/save."),
  audioLayerName: z.string().default("Audio").describe("Layer name of the audio track file in the AEP project."),
  style: z.enum(["scale-glow", "particles-bounce"]).default("scale-glow"),
  sensitivity: z.number().positive().default(1.5).describe("Amplitude scale peak multiplier."),
  addGlow: z.boolean().default(true).describe("Flicker/pulse layer glows dynamically based on beat."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Audio_Sync"),
  approveOverwrite: z.boolean().default(false),
};

export const applyPixelArtFilterSchema = {
  outputAepPath: z.string().describe("Path of the pixel filter AEP project."),
  targetLayer: z.string().optional().describe("Optional target layer name to apply retro filters on."),
  cellSize: z.number().int().min(2).max(128).default(12).describe("Pixel mosaic block size in pixels."),
  dither: z.boolean().default(true).describe("Apply dither noise matrix filter overlay."),
  scanlines: z.boolean().default(true).describe("Apply CRT scanlines grid filter overlay."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  compName: z.string().default("MP_Pixel_Art_Filter"),
  approveOverwrite: z.boolean().default(false),
};

export const buildMatrixDigitalRainSchema = {
  outputAepPath: z.string().describe("Path of the generated Matrix digital rain AEP project."),
  color: z.array(z.number()).length(3).default([0.1, 1.0, 0.25]).describe("Neon character RGB color 0..1."),
  speed: z.number().positive().default(1).describe("Speed multiplier for falling columns."),
  fontSize: z.number().int().positive().default(20).describe("Font size of the characters."),
  columnCount: z.number().int().positive().default(28).describe("Number of vertical rain columns to spawn."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Matrix_Rain"),
  approveOverwrite: z.boolean().default(false),
};

export const buildBlackHoleGravityWarpSchema = {
  outputAepPath: z.string().describe("Path of the generated black hole warp AEP project."),
  singularityColor: z.array(z.number()).length(3).default([0.9, 0.45, 1.0]).describe("Event horizon corona glow RGB color 0..1."),
  accretionDiskColor: z.array(z.number()).length(3).default([1.0, 0.55, 0.1]).describe("Accretion disk gas RGB color 0..1."),
  warpStrength: z.number().positive().default(85).describe("Displacement warping offset amount."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Black_Hole"),
  approveOverwrite: z.boolean().default(false),
};

export const buildLiquidLavaSimulatorSchema = {
  outputAepPath: z.string().describe("Path of the generated fluid simulator AEP project."),
  lavaColor: z.array(z.number()).length(3).default([1.0, 0.25, 0.0]).describe("Primary liquid lava RGB color 0..1."),
  glowColor: z.array(z.number()).length(3).default([1.0, 0.65, 0.1]).describe("Secondary emission glow RGB color 0..1."),
  blobCount: z.number().int().positive().default(12).describe("Number of floating organic fluid spheres."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Liquid_Lava"),
  approveOverwrite: z.boolean().default(false),
};

export const buildLightningStormGeneratorSchema = {
  outputAepPath: z.string().describe("Path of the generated storm AEP project."),
  glowColor: z.array(z.number()).length(3).default([0.3, 0.75, 1.0]).describe("Lightning stroke neon RGB color 0..1."),
  boltFrequency: z.number().positive().default(2).describe("Frequency multiplier for random lightning strikes."),
  addRain: z.boolean().default(true).describe("Include atmospheric rain sheet overlay."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Lightning_Storm"),
  approveOverwrite: z.boolean().default(false),
};

export const buildMagicalSummoningSigilSchema = {
  outputAepPath: z.string().describe("Path of the generated magic circle AEP project."),
  glowColor: z.array(z.number()).length(3).default([0.6, 0.3, 1.0]).describe("Arcane rune/circle glow RGB color 0..1."),
  runeText: z.string().default("ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ").describe("Ancient characters to wrap around the sigil circle."),
  drawDuration: z.number().positive().default(2.5).describe("Time in seconds to draw the concentric sigils."),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  fps: z.number().positive().default(30),
  compName: z.string().default("MP_Magic_Sigil"),
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

// Type exports — Legendary
export type Build3dPlanetGeneratorInput = { [K in keyof typeof build3dPlanetGeneratorSchema]: z.infer<(typeof build3dPlanetGeneratorSchema)[K]> };
export type BuildCyberScanOverlayInput = { [K in keyof typeof buildCyberScanOverlaySchema]: z.infer<(typeof buildCyberScanOverlaySchema)[K]> };
export type BuildDimensionalRiftInput = { [K in keyof typeof buildDimensionalRiftSchema]: z.infer<(typeof buildDimensionalRiftSchema)[K]> };
export type GenerateVfxNormalMapSequenceInput = { [K in keyof typeof generateVfxNormalMapSequenceSchema]: z.infer<(typeof generateVfxNormalMapSequenceSchema)[K]> };
export type BuildCosmicNebulaSceneInput = { [K in keyof typeof buildCosmicNebulaSceneSchema]: z.infer<(typeof buildCosmicNebulaSceneSchema)[K]> };
export type BuildAudioBeatSyncControllerInput = { [K in keyof typeof buildAudioBeatSyncControllerSchema]: z.infer<(typeof buildAudioBeatSyncControllerSchema)[K]> };
export type ApplyPixelArtFilterInput = { [K in keyof typeof applyPixelArtFilterSchema]: z.infer<(typeof applyPixelArtFilterSchema)[K]> };

// Type exports — Ultimate
export type BuildMatrixDigitalRainInput = { [K in keyof typeof buildMatrixDigitalRainSchema]: z.infer<(typeof buildMatrixDigitalRainSchema)[K]> };
export type BuildBlackHoleGravityWarpInput = { [K in keyof typeof buildBlackHoleGravityWarpSchema]: z.infer<(typeof buildBlackHoleGravityWarpSchema)[K]> };
export type BuildLiquidLavaSimulatorInput = { [K in keyof typeof buildLiquidLavaSimulatorSchema]: z.infer<(typeof buildLiquidLavaSimulatorSchema)[K]> };
export type BuildLightningStormGeneratorInput = { [K in keyof typeof buildLightningStormGeneratorSchema]: z.infer<(typeof buildLightningStormGeneratorSchema)[K]> };
export type BuildMagicalSummoningSigilInput = { [K in keyof typeof buildMagicalSummoningSigilSchema]: z.infer<(typeof buildMagicalSummoningSigilSchema)[K]> };

// ======================================================================
// Wave 5: 30 Premium Plugin Replicas Schemas
// ======================================================================

const baseReplicaFields = {
  outputAepPath: z.string().describe("Path of the output After Effects AEP project file."),
  approveOverwrite: z.boolean().default(false).describe("Approve overwriting the output AEP if it exists."),
};

export const vfxParticularParticlesSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.3, 0.7, 1.0]).describe("Birth particle RGB color 0..1."),
  speed: z.number().positive().default(1.0).describe("Velocity speed scale factor."),
};

export const vfxSaberNeonSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.2, 1.0, 0.9]).describe("Core glow RGB color 0..1."),
  size: z.number().positive().default(1.0).describe("Glow size/width scaling factor."),
};

export const vfxPlexusMeshSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.5, 0.35, 1.0]).describe("Connecting lines RGB color 0..1."),
};

export const vfxShineRaysSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.8, 0.3]).describe("Light rays RGB color 0..1."),
};

export const vfxStarglowStreaksSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.9, 0.4]).describe("Star glare highlights RGB color 0..1."),
};

export const vfxMirTerrainSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.1, 0.9, 1.0]).describe("Terrain grid mesh RGB color 0..1."),
};

export const vfxTaoRibbonsSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.25, 0.5]).describe("Extruded ribbon spline RGB color 0..1."),
};

export const vfxFormParticlesSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.4, 0.8, 1.0]).describe("3D wave particle grid RGB color 0..1."),
};

export const vfxOpticalFlaresSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.9, 0.85, 1.0]).describe("Anamorphic streak halo RGB color 0..1."),
};

export const vfxElement3DSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.8, 0.7, 0.6]).describe("3D extruded mesh color RGB 0..1."),
};

export const vfxAnalogGlitchSchema = {
  ...baseReplicaFields,
};

export const vfxChromaticAberrationSchema = {
  ...baseReplicaFields,
  shift: z.number().positive().default(8).describe("RGB split channel offset in pixels."),
};

export const vfxHeatwaveRefractionSchema = {
  ...baseReplicaFields,
  speed: z.number().positive().default(1.0).describe("Heat refraction speed multiplier."),
};

export const vfxVhsTapeSchema = {
  ...baseReplicaFields,
};

export const vfxLooksGradingSchema = {
  ...baseReplicaFields,
};

export const vfxColoristaGradingSchema = {
  ...baseReplicaFields,
  shadows: z.array(z.number()).length(3).default([0.0, 0.0, 0.1]).describe("Shadow color lift offsets RGB 0..1."),
  highlights: z.array(z.number()).length(3).default([0.1, 0.0, 0.0]).describe("Highlight color gain offsets RGB 0..1."),
};

export const vfxSlowMotionSchema = {
  ...baseReplicaFields,
  slowPercent: z.number().min(1).max(99).default(25).describe("Time stretching percent (e.g. 25 = 4x slow motion)."),
};

export const vfxMotionBlurSchema = {
  ...baseReplicaFields,
  blurAmount: z.number().positive().default(1.0).describe("Motion blur shutter angle scale factor."),
};

export const vfxSapphireGlowSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.9, 0.55, 1.0]).describe("Exponential decay glow RGB color 0..1."),
};

export const vfxLightningStrikeSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.3, 0.75, 1.0]).describe("Advanced electric lightning strike RGB 0..1."),
};

export const vfxLensDistortionSchema = {
  ...baseReplicaFields,
  warp: z.number().positive().default(1.0).describe("Optics compensation lens warp field multiplier."),
};

export const vfxContinuumBloomSchema = {
  ...baseReplicaFields,
  intensity: z.number().positive().default(1.0).describe("Highlight bloom opacity scale factor."),
};

export const vfxKaleidoscopeSchema = {
  ...baseReplicaFields,
  sectors: z.number().int().min(2).max(64).default(8).describe("Number of mirrored kaleidoscope reflection sectors."),
};

export const vfxDeepGlowSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.65, 0.3, 1.0]).describe("Exponential box blurs RGB glow color 0..1."),
};

export const vfxNewtonPhysicsSchema = {
  ...baseReplicaFields,
  gravity: z.number().positive().default(1.0).describe("Gravity simulation physics multiplier."),
};

export const vfxStardustParticlesSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.3, 0.85, 1.0]).describe("Stardust node particles RGB color 0..1."),
};

export const vfxRiggingJoystickSchema = {
  ...baseReplicaFields,
};

export const vfxAutoCropSchema = {
  ...baseReplicaFields,
};

export const vfxBrushStrokeSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.45, 0.1]).describe("Brush stroke path RGB color 0..1."),
};

export const vfxAudioSpectrumSchema = {
  ...baseReplicaFields,
};

export const vfxDepthOfFieldSchema = {
  ...baseReplicaFields,
  blur: z.number().positive().default(1.0).describe("Focus distance bokeh camera blur scale factor."),
};

// Wave 6 Schemas
export const vfxPlanarTrackerSchema = {
  ...baseReplicaFields,
};

export const vfxRotoPaintSchema = {
  ...baseReplicaFields,
};

export const vfxNeatDenoiseSchema = {
  ...baseReplicaFields,
  sharpness: z.number().positive().default(1.0).describe("Post-denoise sharpening scale factor."),
};

export const vfxVolumetricRaysSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.9, 0.6]).describe("Volumetric rays color RGB 0..1."),
};

export const vfxCinematicFlareSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.2, 0.6, 1.0]).describe("Lens flare elements primary color RGB 0..1."),
};

export const vfxGodRaysSchema = {
  ...baseReplicaFields,
  threshold: z.number().min(0).max(1).default(0.6).describe("Highlight threshold for light rays extraction."),
};

export const vfxLightWrapSchema = {
  ...baseReplicaFields,
  wrapWidth: z.number().positive().default(1.0).describe("Composite wrap edge width factor."),
};

export const vfxDeepGlowProSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.3, 0.8, 1.0]).describe("Physically accurate glow color RGB 0..1."),
  aspect: z.number().positive().default(1.5).describe("Horizontal to vertical aspect ratio stretch parameter."),
};

export const vfxKnollFlareSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([1.0, 0.6, 0.2]).describe("Knoll flare primary color RGB 0..1."),
};

export const vfxElement3DProSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.8, 0.1, 0.2]).describe("Extruded mesh surface color RGB 0..1."),
};

export const vfxTwitchGlitchSchema = {
  ...baseReplicaFields,
  amount: z.number().positive().default(1.0).describe("Glitch severity and scale displacement factor."),
};

export const vfx3DStrokeSchema = {
  ...baseReplicaFields,
  color: z.array(z.number()).length(3).default([0.9, 0.3, 1.0]).describe("Spline stroke glow color RGB 0..1."),
};

// ======================================================================
// Wave 7: Zero-cost premium plugin gap-fill replicas
// ======================================================================

const advancedReplicaBaseFields = {
  ...baseReplicaFields,
  compName: z.string().default("MP_Premium_Replica_Comp").describe("Name of the generated After Effects composition."),
  duration: z.number().positive().default(10).describe("Composition duration in seconds."),
  width: z.number().int().positive().default(1920).describe("Composition width."),
  height: z.number().int().positive().default(1080).describe("Composition height."),
  intensity: z.number().min(0).max(3).default(1).describe("Overall effect strength multiplier."),
  color: z.array(z.number()).length(3).default([0.25, 0.75, 1.0]).describe("Primary RGB color 0..1."),
  sourceFootagePath: z.string().optional().describe("Optional footage/image path to import as a source layer."),
};

export const vfxChromaKeyStudioSchema = {
  ...advancedReplicaBaseFields,
  screenColor: z.enum(["green", "blue", "custom"]).default("green"),
  spillSuppression: z.number().min(0).max(100).default(65),
  edgeChoke: z.number().min(0).max(25).default(2),
};
export const vfxBeautyRetouchSchema = {
  ...advancedReplicaBaseFields,
  skinSmoothing: z.number().min(0).max(100).default(45),
  preserveDetail: z.number().min(0).max(100).default(70),
};
export const vfxSupercompAtmosphereSchema = {
  ...advancedReplicaBaseFields,
  haze: z.number().min(0).max(100).default(35),
  lightWrap: z.number().min(0).max(100).default(45),
};
export const vfxOpticalFlowRetimeSchema = {
  ...advancedReplicaBaseFields,
  speedPercent: z.number().min(1).max(400).default(40),
  rampStyle: z.enum(["smooth", "impact", "freeze", "speed_ramp"]).default("smooth"),
};
export const vfxDeflickerSchema = {
  ...advancedReplicaBaseFields,
  temporalWindow: z.number().int().min(2).max(12).default(5),
  luminanceSmoothing: z.number().min(0).max(100).default(55),
};
export const vfxSoundKeysSchema = {
  ...advancedReplicaBaseFields,
  audioPath: z.string().optional().describe("Optional audio file. When provided it is imported and run through AE 'Convert Audio to Keyframes' so the target is driven by REAL audio amplitude; omit to use a procedural sine fallback."),
  driveProperty: z.enum(["scale", "opacity", "glow", "position", "rotation"]).default("scale"),
  sensitivity: z.number().min(0.1).max(10).default(1.5),
};
export const vfxTrapcodeLuxSchema = {
  ...advancedReplicaBaseFields,
  coneLength: z.number().min(0).max(100).default(70),
};
export const vfxTrapcodeHorizonSchema = {
  ...advancedReplicaBaseFields,
  horizonStyle: z.enum(["sunset", "cyber", "studio", "space"]).default("sunset"),
};
export const vfxSapphirePackSchema = {
  ...advancedReplicaBaseFields,
  effect: z.enum(["glint", "edge_rays", "aurora", "film_effect", "grunge"]).default("glint"),
};
export const vfxCausticsWaterSchema = {
  ...advancedReplicaBaseFields,
  waveScale: z.number().min(0.1).max(10).default(2),
};
export const vfxHalftonePrintSchema = {
  ...advancedReplicaBaseFields,
  dotSize: z.number().min(2).max(80).default(18),
  pixelSort: z.boolean().default(true),
};
export const vfxMojoTealOrangeSchema = {
  ...advancedReplicaBaseFields,
  skinProtect: z.number().min(0).max(100).default(70),
};
export const vfxCosmoSkinSchema = {
  ...advancedReplicaBaseFields,
  smoothing: z.number().min(0).max(100).default(35),
};
export const vfxUniverseGlitchPackSchema = {
  ...advancedReplicaBaseFields,
  style: z.enum(["holomatrix", "retrograde", "datamosh", "crt"]).default("holomatrix"),
};
export const vfxCameraShakeProSchema = {
  ...advancedReplicaBaseFields,
  profile: z.enum(["handheld", "impact", "earthquake", "engine_idle"]).default("handheld"),
};
export const vfxFilmDamageSchema = {
  ...advancedReplicaBaseFields,
  age: z.number().min(0).max(100).default(65),
};
export const vfxTitleStudioSchema = {
  ...advancedReplicaBaseFields,
  text: z.string().default("MOTIONPILOT"),
  extrudeDepth: z.number().min(0).max(200).default(60),
};
export const vfxPixelChooserMaskSchema = {
  ...advancedReplicaBaseFields,
  qualifier: z.enum(["luma", "chroma", "skin", "depth"]).default("luma"),
};
export const rigRubberhoseLimbsSchema = {
  ...advancedReplicaBaseFields,
  limbCount: z.number().int().min(1).max(8).default(2),
};
export const animSquashStretchSchema = {
  ...advancedReplicaBaseFields,
  elasticity: z.number().min(0).max(100).default(55),
};
export const animMotionToolsSchema = {
  ...advancedReplicaBaseFields,
  preset: z.enum(["anchor_center", "align_grid", "auto_ease", "excite_wiggle"]).default("auto_ease"),
};
export const animExplodeShapeLayersSchema = {
  ...advancedReplicaBaseFields,
  pieces: z.number().int().min(2).max(64).default(12),
};
export const animTransitionBrowserSchema = {
  ...advancedReplicaBaseFields,
  transition: z.enum(["whip_pan", "zoom_blur", "glitch_cut", "liquid_wipe", "light_leak"]).default("whip_pan"),
};
export const vfxOrganicTrackSchema = {
  ...advancedReplicaBaseFields,
  meshDensity: z.number().int().min(2).max(16).default(6),
};
export const vfxObjectRemovalSchema = {
  ...advancedReplicaBaseFields,
  fillMethod: z.enum(["temporal", "clone", "content_aware_mock"]).default("temporal"),
};
export const vfxReflectionMirrorSchema = {
  ...advancedReplicaBaseFields,
  floorFade: z.number().min(0).max(100).default(65),
};
export const vfx3dCameraTrackSchema = {
  ...advancedReplicaBaseFields,
  solveQuality: z.enum(["draft", "standard", "high"]).default("standard"),
};
export const gradeFilmEmulationSchema = {
  ...advancedReplicaBaseFields,
  stock: z.enum(["kodak_2383", "kodak_portra", "fuji_eterna", "bleach_bypass", "noir"]).default("kodak_2383"),
  grain: z.number().min(0).max(100).default(22),
};
export const gradeColorFinesseSchema = {
  ...advancedReplicaBaseFields,
  look: z.enum(["neutral_balance", "commercial_pop", "skin_line", "night_for_day"]).default("commercial_pop"),
};

// Type exports
export type VfxParticularParticlesInput = { [K in keyof typeof vfxParticularParticlesSchema]: z.infer<(typeof vfxParticularParticlesSchema)[K]> };
export type VfxSaberNeonInput = { [K in keyof typeof vfxSaberNeonSchema]: z.infer<(typeof vfxSaberNeonSchema)[K]> };
export type VfxPlexusMeshInput = { [K in keyof typeof vfxPlexusMeshSchema]: z.infer<(typeof vfxPlexusMeshSchema)[K]> };
export type VfxShineRaysInput = { [K in keyof typeof vfxShineRaysSchema]: z.infer<(typeof vfxShineRaysSchema)[K]> };
export type VfxStarglowStreaksInput = { [K in keyof typeof vfxStarglowStreaksSchema]: z.infer<(typeof vfxStarglowStreaksSchema)[K]> };
export type VfxMirTerrainInput = { [K in keyof typeof vfxMirTerrainSchema]: z.infer<(typeof vfxMirTerrainSchema)[K]> };
export type VfxTaoRibbonsInput = { [K in keyof typeof vfxTaoRibbonsSchema]: z.infer<(typeof vfxTaoRibbonsSchema)[K]> };
export type VfxFormParticlesInput = { [K in keyof typeof vfxFormParticlesSchema]: z.infer<(typeof vfxFormParticlesSchema)[K]> };
export type VfxOpticalFlaresInput = { [K in keyof typeof vfxOpticalFlaresSchema]: z.infer<(typeof vfxOpticalFlaresSchema)[K]> };
export type VfxElement3DInput = { [K in keyof typeof vfxElement3DSchema]: z.infer<(typeof vfxElement3DSchema)[K]> };
export type VfxAnalogGlitchInput = { [K in keyof typeof vfxAnalogGlitchSchema]: z.infer<(typeof vfxAnalogGlitchSchema)[K]> };
export type VfxChromaticAberrationInput = { [K in keyof typeof vfxChromaticAberrationSchema]: z.infer<(typeof vfxChromaticAberrationSchema)[K]> };
export type VfxHeatwaveRefractionInput = { [K in keyof typeof vfxHeatwaveRefractionSchema]: z.infer<(typeof vfxHeatwaveRefractionSchema)[K]> };
export type VfxVhsTapeInput = { [K in keyof typeof vfxVhsTapeSchema]: z.infer<(typeof vfxVhsTapeSchema)[K]> };
export type VfxLooksGradingInput = { [K in keyof typeof vfxLooksGradingSchema]: z.infer<(typeof vfxLooksGradingSchema)[K]> };
export type VfxColoristaGradingInput = { [K in keyof typeof vfxColoristaGradingSchema]: z.infer<(typeof vfxColoristaGradingSchema)[K]> };
export type VfxSlowMotionInput = { [K in keyof typeof vfxSlowMotionSchema]: z.infer<(typeof vfxSlowMotionSchema)[K]> };
export type VfxMotionBlurInput = { [K in keyof typeof vfxMotionBlurSchema]: z.infer<(typeof vfxMotionBlurSchema)[K]> };
export type VfxSapphireGlowInput = { [K in keyof typeof vfxSapphireGlowSchema]: z.infer<(typeof vfxSapphireGlowSchema)[K]> };
export type VfxLightningStrikeInput = { [K in keyof typeof vfxLightningStrikeSchema]: z.infer<(typeof vfxLightningStrikeSchema)[K]> };
export type VfxLensDistortionInput = { [K in keyof typeof vfxLensDistortionSchema]: z.infer<(typeof vfxLensDistortionSchema)[K]> };
export type VfxContinuumBloomInput = { [K in keyof typeof vfxContinuumBloomSchema]: z.infer<(typeof vfxContinuumBloomSchema)[K]> };
export type VfxKaleidoscopeInput = { [K in keyof typeof vfxKaleidoscopeSchema]: z.infer<(typeof vfxKaleidoscopeSchema)[K]> };
export type VfxDeepGlowInput = { [K in keyof typeof vfxDeepGlowSchema]: z.infer<(typeof vfxDeepGlowSchema)[K]> };
export type VfxNewtonPhysicsInput = { [K in keyof typeof vfxNewtonPhysicsSchema]: z.infer<(typeof vfxNewtonPhysicsSchema)[K]> };
export type VfxStardustParticlesInput = { [K in keyof typeof vfxStardustParticlesSchema]: z.infer<(typeof vfxStardustParticlesSchema)[K]> };
export type VfxRiggingJoystickInput = { [K in keyof typeof vfxRiggingJoystickSchema]: z.infer<(typeof vfxRiggingJoystickSchema)[K]> };
export type VfxAutoCropInput = { [K in keyof typeof vfxAutoCropSchema]: z.infer<(typeof vfxAutoCropSchema)[K]> };
export type VfxBrushStrokeInput = { [K in keyof typeof vfxBrushStrokeSchema]: z.infer<(typeof vfxBrushStrokeSchema)[K]> };
export type VfxAudioSpectrumInput = { [K in keyof typeof vfxAudioSpectrumSchema]: z.infer<(typeof vfxAudioSpectrumSchema)[K]> };
export type VfxDepthOfFieldInput = { [K in keyof typeof vfxDepthOfFieldSchema]: z.infer<(typeof vfxDepthOfFieldSchema)[K]> };

// Wave 6 Inputs
export type VfxPlanarTrackerInput = { [K in keyof typeof vfxPlanarTrackerSchema]: z.infer<(typeof vfxPlanarTrackerSchema)[K]> };
export type VfxRotoPaintInput = { [K in keyof typeof vfxRotoPaintSchema]: z.infer<(typeof vfxRotoPaintSchema)[K]> };
export type VfxNeatDenoiseInput = { [K in keyof typeof vfxNeatDenoiseSchema]: z.infer<(typeof vfxNeatDenoiseSchema)[K]> };
export type VfxVolumetricRaysInput = { [K in keyof typeof vfxVolumetricRaysSchema]: z.infer<(typeof vfxVolumetricRaysSchema)[K]> };
export type VfxCinematicFlareInput = { [K in keyof typeof vfxCinematicFlareSchema]: z.infer<(typeof vfxCinematicFlareSchema)[K]> };
export type VfxGodRaysInput = { [K in keyof typeof vfxGodRaysSchema]: z.infer<(typeof vfxGodRaysSchema)[K]> };
export type VfxLightWrapInput = { [K in keyof typeof vfxLightWrapSchema]: z.infer<(typeof vfxLightWrapSchema)[K]> };
export type VfxDeepGlowProInput = { [K in keyof typeof vfxDeepGlowProSchema]: z.infer<(typeof vfxDeepGlowProSchema)[K]> };
export type VfxKnollFlareInput = { [K in keyof typeof vfxKnollFlareSchema]: z.infer<(typeof vfxKnollFlareSchema)[K]> };
export type VfxElement3DProInput = { [K in keyof typeof vfxElement3DProSchema]: z.infer<(typeof vfxElement3DProSchema)[K]> };
export type VfxTwitchGlitchInput = { [K in keyof typeof vfxTwitchGlitchSchema]: z.infer<(typeof vfxTwitchGlitchSchema)[K]> };
export type Vfx3DStrokeInput = { [K in keyof typeof vfx3DStrokeSchema]: z.infer<(typeof vfx3DStrokeSchema)[K]> };

export type VfxChromaKeyStudioInput = { [K in keyof typeof vfxChromaKeyStudioSchema]: z.infer<(typeof vfxChromaKeyStudioSchema)[K]> };
export type VfxBeautyRetouchInput = { [K in keyof typeof vfxBeautyRetouchSchema]: z.infer<(typeof vfxBeautyRetouchSchema)[K]> };
export type VfxSupercompAtmosphereInput = { [K in keyof typeof vfxSupercompAtmosphereSchema]: z.infer<(typeof vfxSupercompAtmosphereSchema)[K]> };
export type VfxOpticalFlowRetimeInput = { [K in keyof typeof vfxOpticalFlowRetimeSchema]: z.infer<(typeof vfxOpticalFlowRetimeSchema)[K]> };
export type VfxDeflickerInput = { [K in keyof typeof vfxDeflickerSchema]: z.infer<(typeof vfxDeflickerSchema)[K]> };
export type VfxSoundKeysInput = { [K in keyof typeof vfxSoundKeysSchema]: z.infer<(typeof vfxSoundKeysSchema)[K]> };
export type VfxTrapcodeLuxInput = { [K in keyof typeof vfxTrapcodeLuxSchema]: z.infer<(typeof vfxTrapcodeLuxSchema)[K]> };
export type VfxTrapcodeHorizonInput = { [K in keyof typeof vfxTrapcodeHorizonSchema]: z.infer<(typeof vfxTrapcodeHorizonSchema)[K]> };
export type VfxSapphirePackInput = { [K in keyof typeof vfxSapphirePackSchema]: z.infer<(typeof vfxSapphirePackSchema)[K]> };
export type VfxCausticsWaterInput = { [K in keyof typeof vfxCausticsWaterSchema]: z.infer<(typeof vfxCausticsWaterSchema)[K]> };
export type VfxHalftonePrintInput = { [K in keyof typeof vfxHalftonePrintSchema]: z.infer<(typeof vfxHalftonePrintSchema)[K]> };
export type VfxMojoTealOrangeInput = { [K in keyof typeof vfxMojoTealOrangeSchema]: z.infer<(typeof vfxMojoTealOrangeSchema)[K]> };
export type VfxCosmoSkinInput = { [K in keyof typeof vfxCosmoSkinSchema]: z.infer<(typeof vfxCosmoSkinSchema)[K]> };
export type VfxUniverseGlitchPackInput = { [K in keyof typeof vfxUniverseGlitchPackSchema]: z.infer<(typeof vfxUniverseGlitchPackSchema)[K]> };
export type VfxCameraShakeProInput = { [K in keyof typeof vfxCameraShakeProSchema]: z.infer<(typeof vfxCameraShakeProSchema)[K]> };
export type VfxFilmDamageInput = { [K in keyof typeof vfxFilmDamageSchema]: z.infer<(typeof vfxFilmDamageSchema)[K]> };
export type VfxTitleStudioInput = { [K in keyof typeof vfxTitleStudioSchema]: z.infer<(typeof vfxTitleStudioSchema)[K]> };
export type VfxPixelChooserMaskInput = { [K in keyof typeof vfxPixelChooserMaskSchema]: z.infer<(typeof vfxPixelChooserMaskSchema)[K]> };
export type RigRubberhoseLimbsInput = { [K in keyof typeof rigRubberhoseLimbsSchema]: z.infer<(typeof rigRubberhoseLimbsSchema)[K]> };
export type AnimSquashStretchInput = { [K in keyof typeof animSquashStretchSchema]: z.infer<(typeof animSquashStretchSchema)[K]> };
export type AnimMotionToolsInput = { [K in keyof typeof animMotionToolsSchema]: z.infer<(typeof animMotionToolsSchema)[K]> };
export type AnimExplodeShapeLayersInput = { [K in keyof typeof animExplodeShapeLayersSchema]: z.infer<(typeof animExplodeShapeLayersSchema)[K]> };
export type AnimTransitionBrowserInput = { [K in keyof typeof animTransitionBrowserSchema]: z.infer<(typeof animTransitionBrowserSchema)[K]> };
export type VfxOrganicTrackInput = { [K in keyof typeof vfxOrganicTrackSchema]: z.infer<(typeof vfxOrganicTrackSchema)[K]> };
export type VfxObjectRemovalInput = { [K in keyof typeof vfxObjectRemovalSchema]: z.infer<(typeof vfxObjectRemovalSchema)[K]> };
export type VfxReflectionMirrorInput = { [K in keyof typeof vfxReflectionMirrorSchema]: z.infer<(typeof vfxReflectionMirrorSchema)[K]> };
export type Vfx3dCameraTrackInput = { [K in keyof typeof vfx3dCameraTrackSchema]: z.infer<(typeof vfx3dCameraTrackSchema)[K]> };
export type GradeFilmEmulationInput = { [K in keyof typeof gradeFilmEmulationSchema]: z.infer<(typeof gradeFilmEmulationSchema)[K]> };
export type GradeColorFinesseInput = { [K in keyof typeof gradeColorFinesseSchema]: z.infer<(typeof gradeColorFinesseSchema)[K]> };


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
  qualityTarget: z.enum(["prototype", "production", "assetStore"]).default("assetStore").describe("Output quality target for naming, docs, optimization recommendations, and marketplace deliverables."),
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

// Wave 8: game VFX market expansion, cross-engine exports, and deeper pipelines
const extendedGameEffectTypeSchema = z.enum([
  "energy", "fire", "ice", "lightning", "heal", "poison", "shield", "portal", "slash", "impact", "smoke", "magic",
  "environment", "destruction", "gore", "scifi", "vehicle", "gameFeel", "casual", "locomotion", "decal", "shader", "ability"
]);

export const buildUnrealNiagaraPackSchema = unityVfxSchema({
  effectType: extendedGameEffectTypeSchema.optional(),
  targetPipeline: z.enum(["urp", "hdrp", "built-in"]).default("urp").describe("Ignored for Unreal; retained for shared manifest compatibility."),
});
export const buildGodotParticlesPackSchema = unityVfxSchema({
  effectType: extendedGameEffectTypeSchema.optional(),
  godotVersion: z.enum(["4.x", "3.x"]).default("4.x"),
});
export const exportEffekseerProjectSchema = unityVfxSchema({
  effectType: extendedGameEffectTypeSchema.optional(),
});
export const buildEngineAgnosticVfxManifestSchema = unityVfxSchema({
  engineTargets: z.array(z.enum(["unity", "unreal", "godot", "effekseer", "custom"])).default(["unity", "unreal", "godot", "effekseer"]),
  effectType: extendedGameEffectTypeSchema.optional(),
});
export const buildEnvironmentAmbientPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["rain", "snow", "fog", "sandstorm", "waterfall", "torch_fire", "fireflies", "dust_motes", "wind_leaves", "bioluminescence"])).optional(),
});
export const buildDestructionGorePackSchema = unityVfxSchema({
  elements: z.array(z.enum(["glass_shatter", "wood_splinters", "debris_chunks", "blood_splatter", "blood_pool", "ragdoll_residue"])).optional(),
});
export const buildScifiTechPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["plasma", "energy_shield", "teleport_warp", "hologram_glitch", "emp_wave", "laser_beam", "force_field", "tractor_beam", "sci_fi_explosion"])).optional(),
});
export const buildVehicleVfxPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["exhaust_smoke", "tire_smoke", "skid_marks", "nitro_burst", "jet_trail", "water_wake", "dust_trail"])).optional(),
});
export const buildGameFeelJuicePackSchema = unityVfxSchema({
  elements: z.array(z.enum(["damage_numbers", "level_up", "xp_gain", "coin_loot_pickup", "combo_counter", "crit_flash", "heal_buff_aura", "screen_shake_trigger", "hitstop"])).optional(),
});
export const buildMagicSchoolExtendedSchema = unityVfxSchema({
  elements: z.array(z.enum(["necromancy", "holy_light", "nature_druid", "blood_magic", "void_eldritch", "time", "gravity"])).optional(),
});
export const buildCasualCardFxPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["confetti", "sparkle", "match_burst", "slot_machine", "bubble_pop", "card_glint", "card_flip"])).optional(),
});
export const buildLocomotionFxPackSchema = unityVfxSchema({
  elements: z.array(z.enum(["footstep_dust", "water_splash", "snow_track", "jump_puff", "landing_puff", "dash_trail", "wall_run_spark"])).optional(),
});
export const generateMotionVectorFlowmapSchema = unityVfxSchema({
  texturePath: z.string().optional().describe("Optional flipbook or PNG sequence path to describe flowmap generation for."),
});
export const buildAbilityTimelineSchema = unityVfxSchema({
  abilityName: z.string().default("MotionPilotAbility"),
  phases: z.array(z.enum(["cast", "channel", "release", "impact", "aftermath", "cooldown"])).default(["cast", "channel", "release", "impact", "aftermath"]),
});
export const bindVfxToAnimationEventsSchema = unityVfxSchema({
  animationClipName: z.string().default("Attack.anim"),
  eventName: z.string().default("release"),
});
export const buildRealtimeShaderLibrarySchema = unityVfxSchema({
  elements: z.array(z.enum(["dissolve", "force_field_fresnel", "hologram", "toon_cel", "water", "lava", "ice", "glow"])).optional(),
});
export const pairVfxWithSfxSchema = unityVfxSchema({
  sfxStyle: z.enum(["cinematic_game", "retro_arcade", "casual_mobile", "dark_fantasy", "sci_fi"]).default("cinematic_game"),
});
export const buildDecalProjectionSystemSchema = unityVfxSchema({
  elements: z.array(z.enum(["scorch", "blood_accumulation", "ice_build_up", "poison_puddle", "crack", "magic_rune"])).optional(),
});
export const vfxFromConceptArtSchema = unityVfxSchema({
  conceptArtPath: z.string().optional(),
});
export const matchGameArtDirectionSchema = unityVfxSchema({
  screenshotPaths: z.array(z.string()).optional(),
});
export const vfxPackAutopilotSchema = unityVfxSchema({
  packSize: z.number().int().min(1).max(100).default(30),
  prompt: z.string().min(3).describe("Full pack request, e.g. 'dark fantasy RPG spell pack with 30 effects'."),
});

export const liveUnityVfxAuthorSchema = {
  graphName: z.string().min(1).default("MotionPilotLiveVFX"),
  prompt: z.string().min(3),
  outputFolder: z.string(),
  previewInUnity: z.boolean().default(true),
  unityAssetDir: z.string().default("Assets/MotionPilot").describe("Unity-relative folder where the compiled VFX artifact is written so the live preview binds to a real in-project asset."),
};

// --- Phase 1: MVP Canavarı new schemas ---
export const generateAiPlateSchema = {
  prompt: z.string().min(3).describe("Visual concept/prompt for the AI-generated plate."),
  outputFolder: z.string().describe("Output folder to save the generated PNG."),
  width: z.number().int().positive().default(1080),
  height: z.number().int().positive().default(1920),
  style: z.string().optional().describe("Optional style modifier (e.g. photorealistic, vector)."),
  palette: z.array(z.string()).optional().describe("Optional color hex codes or descriptors."),
};

export const generateAiVideoShotSchema = {
  prompt: z.string().min(3).describe("Video generation prompt/concept."),
  outputFolder: z.string().describe("Output folder to save the generated video MP4."),
  format: z.enum(["vertical", "horizontal", "square"]).default("vertical"),
  duration: z.number().positive().default(4).describe("Desired duration in seconds."),
  fps: z.number().int().positive().default(30),
};

export const ttsVoiceoverSchema = {
  text: z.string().min(1).describe("The text content to convert to voiceover speech."),
  outputFolder: z.string().describe("Output folder to save the generated .wav file."),
  voice: z.string().default("alloy").describe("Voice name or profile to use."),
  speed: z.number().positive().default(1.0).describe("Speech speed multiplier (0.5 to 2.0)."),
  duration: z.number().positive().optional().describe("Override target duration in seconds for mock mode."),
};

export const sttTranscribeSchema = {
  audioPath: z.string().describe("Path to the source audio .wav file."),
  referenceText: z.string().optional().describe("Optional reference text to guide or verify transcription."),
};

export const jsxDryRunSchema = {
  jsxContent: z.string().min(1).describe("The ExtendScript (JSX) code block to validate."),
};

export const renderFarmQueueSchema = {
  renders: z.array(z.object({
    aepPath: z.string().describe("Path to the source .aep project file."),
    compName: z.string().describe("Composition name to render."),
    outputVideoPath: z.string().describe("Target output video path."),
    maxRetries: z.number().int().nonnegative().optional().describe("Max retries on render failure."),
  })).min(1).describe("List of render jobs to run in parallel."),
  maxConcurrency: z.number().int().positive().default(2).describe("Maximum parallel render processes."),
};

export type GenerateAiPlateInput = { [K in keyof typeof generateAiPlateSchema]: z.infer<(typeof generateAiPlateSchema)[K]> };
export type GenerateAiVideoShotInput = { [K in keyof typeof generateAiVideoShotSchema]: z.infer<(typeof generateAiVideoShotSchema)[K]> };
export type TtsVoiceoverInput = { [K in keyof typeof ttsVoiceoverSchema]: z.infer<(typeof ttsVoiceoverSchema)[K]> };
export type SttTranscribeInput = { [K in keyof typeof sttTranscribeSchema]: z.infer<(typeof sttTranscribeSchema)[K]> };
export type JsxDryRunInput = { [K in keyof typeof jsxDryRunSchema]: z.infer<(typeof jsxDryRunSchema)[K]> };
export type RenderFarmQueueInput = { [K in keyof typeof renderFarmQueueSchema]: z.infer<(typeof renderFarmQueueSchema)[K]> };

// --- Phase 2: Orkestratör & Reklam ---
export const motionpilotDirectorSchema = {
  brief: z.string().min(5).describe("Natural language creative brief for the ad/video."),
  brandName: z.string().optional().describe("Optionally specify brand/product name."),
  outputFolder: z.string().describe("Output folder for project files and deliverables."),
  concurrency: z.number().int().positive().default(2),
};

export const brandKitIngestSchema = {
  brandName: z.string().min(1).describe("Brand/company name."),
  logoPath: z.string().optional().describe("Optional path to the logo file."),
  palette: z.array(z.string()).min(1).describe("List of kurumsal HEX colors."),
  font: z.string().default("Arial Black"),
  secondaryFont: z.string().optional(),
  fontSize: z.number().int().positive().default(110),
  marketingVoice: z.enum(["professional", "energetic", "minimal", "playful"]).default("professional"),
  additionalRules: z.array(z.string()).optional(),
};

export const adConceptGeneratorSchema = {
  productName: z.string().min(1),
  productDescription: z.string().min(5),
  duration: z.number().positive().default(15),
};

export const multiformatAdExportSchema = {
  aepPath: z.string().describe("Path to the source .aep project file."),
  outputAepPath: z.string().describe("Path to save the reframed .aep project file."),
  targetFormats: z.array(z.enum(["vertical", "square", "horizontal", "portrait"])).min(1),
  approveOverwrite: z.boolean().default(false),
};

export const viralityGateSchema = {
  hook: z.string().min(1).describe("Marketing hook copy text."),
  cta: z.string().min(1).describe("Call-to-action copy text."),
};

export const abVariantFactorySchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  variants: z.array(z.object({
    suffix: z.string().min(1),
    hook: z.string().min(1),
    cta: z.string().min(1),
  })).min(1),
  approveOverwrite: z.boolean().default(false),
};

// --- Phase 3: İleri Animasyon & VFX ---
export const smartKeyframeAssistantSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  layerName: z.string(),
  principle: z.enum(["overshoot", "anticipation", "squashStretch", "elasticEase"]),
  startTime: z.number().nonnegative(),
  duration: z.number().positive(),
  approveOverwrite: z.boolean().default(false),
};

export const buildCharacterRigSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  joints: z.array(z.object({
    layerName: z.string(),
    parentName: z.string(),
  })).min(1),
  breathLayer: z.string().optional(),
  blinkLayers: z.array(z.string()).optional(),
  approveOverwrite: z.boolean().default(false),
};

export const autoLipSyncSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  mouthLayerName: z.string(),
  transcriptPath: z.string(),
  approveOverwrite: z.boolean().default(false),
};

export const cameraChoreographerSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  moves: z.array(z.object({
    type: z.enum(["dolly", "orbit", "pan", "tilt", "rackFocus"]),
    startTime: z.number().nonnegative(),
    duration: z.number().positive(),
    strength: z.number().optional(),
  })).min(1),
  approveOverwrite: z.boolean().default(false),
};

export const sceneToSceneTransitionsSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  transitionType: z.enum(["whipPan", "zoomBlur", "morphWipe", "glitchCut"]),
  timestamp: z.number().nonnegative(),
  duration: z.number().positive(),
  approveOverwrite: z.boolean().default(false),
};

export const realtimeVfxPreviewSchema = {
  packageName: z.string().describe("Unity package name containing the VFX assets."),
};

export const proceduralVfxGraphCompilerSchema = {
  graphName: z.string().min(1),
  prompt: z.string().min(3),
  outputFolder: z.string(),
};

export const vfxSimulationBakerSchema = {
  outputFolder: z.string(),
  frameCount: z.number().int().positive().default(16),
  width: z.number().int().positive().default(256),
  height: z.number().int().positive().default(256),
  columns: z.number().int().positive().optional(),
  type: z.enum(["fire", "energy", "shockwave"]).default("energy"),
};

export const vfxQualityGraderV2Schema = {
  aepPath: z.string(),
  compName: z.string().optional(),
};

// --- Phase 4: Ölçek & Teslim ---
export const smartProxyWorkflowSchema = {
  imagePaths: z.array(z.string()).min(1),
  proxyFolder: z.string(),
};

export const deliveryPackagerSchema = {
  outputFolder: z.string(),
  videoPath: z.string(),
  thumbnailPath: z.string().optional(),
  title: z.string(),
  description: z.string(),
  platforms: z.array(z.string()).min(1).default(["youtube", "tiktok", "meta"]),
};

export const localizationPackSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  languageCode: z.string().length(2),
  translations: z.array(z.object({
    originalText: z.string(),
    translatedText: z.string(),
  })).min(1),
  audioPath: z.string().optional(),
  approveOverwrite: z.boolean().default(false),
};

export const productShotStudioSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string().default("00_MOCKUP_STUDIO"),
  productImagePath: z.string(),
  rotationSpeed: z.number().optional(),
  addLighting: z.boolean().default(true),
  approveOverwrite: z.boolean().default(false),
};

export const aiInpaintAndExtendSchema = {
  videoPath: z.string(),
  outputPath: z.string(),
  extendDuration: z.number().positive(),
  upscaleFactor: z.enum([2, 4] as any).default(2 as any),
};

export const houdiniAlembicBridgeSchema = {
  alembicPath: z.string(),
  outputFolder: z.string(),
  compName: z.string().optional(),
  loop: z.boolean().default(false),
};

export const autoMusicScoreSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  musicPath: z.string(),
  transcriptPath: z.string(),
  duckingDb: z.number().default(-12),
  approveOverwrite: z.boolean().default(false),
};

export type MotionpilotDirectorInput = { [K in keyof typeof motionpilotDirectorSchema]: z.infer<(typeof motionpilotDirectorSchema)[K]> };
export type BrandKitIngestInput = { [K in keyof typeof brandKitIngestSchema]: z.infer<(typeof brandKitIngestSchema)[K]> };
export type AdConceptGeneratorInput = { [K in keyof typeof adConceptGeneratorSchema]: z.infer<(typeof adConceptGeneratorSchema)[K]> };
export type MultiformatAdExportInput = { [K in keyof typeof multiformatAdExportSchema]: z.infer<(typeof multiformatAdExportSchema)[K]> };
export type ViralityGateInput = { [K in keyof typeof viralityGateSchema]: z.infer<(typeof viralityGateSchema)[K]> };
export type AbVariantFactoryInput = { [K in keyof typeof abVariantFactorySchema]: z.infer<(typeof abVariantFactorySchema)[K]> };
export type SmartKeyframeAssistantInput = { [K in keyof typeof smartKeyframeAssistantSchema]: z.infer<(typeof smartKeyframeAssistantSchema)[K]> };
export type BuildCharacterRigInput = { [K in keyof typeof buildCharacterRigSchema]: z.infer<(typeof buildCharacterRigSchema)[K]> };
export type AutoLipSyncInput = { [K in keyof typeof autoLipSyncSchema]: z.infer<(typeof autoLipSyncSchema)[K]> };
export type CameraChoreographerInput = { [K in keyof typeof cameraChoreographerSchema]: z.infer<(typeof cameraChoreographerSchema)[K]> };
export type SceneToSceneTransitionsInput = { [K in keyof typeof sceneToSceneTransitionsSchema]: z.infer<(typeof sceneToSceneTransitionsSchema)[K]> };
export type RealtimeVfxPreviewInput = { [K in keyof typeof realtimeVfxPreviewSchema]: z.infer<(typeof realtimeVfxPreviewSchema)[K]> };
export type ProceduralVfxGraphCompilerInput = { [K in keyof typeof proceduralVfxGraphCompilerSchema]: z.infer<(typeof proceduralVfxGraphCompilerSchema)[K]> };
export type VfxSimulationBakerInput = { [K in keyof typeof vfxSimulationBakerSchema]: z.infer<(typeof vfxSimulationBakerSchema)[K]> };
export type VfxQualityGraderV2Input = { [K in keyof typeof vfxQualityGraderV2Schema]: z.infer<(typeof vfxQualityGraderV2Schema)[K]> };
export type SmartProxyWorkflowInput = { [K in keyof typeof smartProxyWorkflowSchema]: z.infer<(typeof smartProxyWorkflowSchema)[K]> };
export type DeliveryPackagerInput = { [K in keyof typeof deliveryPackagerSchema]: z.infer<(typeof deliveryPackagerSchema)[K]> };
export type LocalizationPackInput = { [K in keyof typeof localizationPackSchema]: z.infer<(typeof localizationPackSchema)[K]> };
export type ProductShotStudioInput = { [K in keyof typeof productShotStudioSchema]: z.infer<(typeof productShotStudioSchema)[K]> };
export type AiInpaintAndExtendInput = { [K in keyof typeof aiInpaintAndExtendSchema]: z.infer<(typeof aiInpaintAndExtendSchema)[K]> };
export type HoudiniAlembicBridgeInput = { [K in keyof typeof houdiniAlembicBridgeSchema]: z.infer<(typeof houdiniAlembicBridgeSchema)[K]> };
export type AutoMusicScoreInput = { [K in keyof typeof autoMusicScoreSchema]: z.infer<(typeof autoMusicScoreSchema)[K]> };



// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------
export const jobStatusSchema = {
  jobId: z.string().optional(),
};
export type JobStatusInput = { [K in keyof typeof jobStatusSchema]: z.infer<(typeof jobStatusSchema)[K]> };

// ---------------------------------------------------------------------------
// Real video generation via Runway ML
// ---------------------------------------------------------------------------
export const runwayGenerateVideoSchema = {
  prompt: z.string().min(1),
  format: z.enum(["vertical", "horizontal", "square"]).default("vertical"),
  duration: z.number().refine((v: number) => [4, 8, 10].includes(v), { message: "Duration must be 4, 8, or 10" }).default(4),
  imagePromptUrl: z.string().url().optional(),
  outputDir: z.string(),
};
export type RunwayGenerateVideoInput = { [K in keyof typeof runwayGenerateVideoSchema]: z.infer<(typeof runwayGenerateVideoSchema)[K]> };

// ---------------------------------------------------------------------------
// Multi-locale batch localization (text-layer swap per locale)
// ---------------------------------------------------------------------------
export const localizationPackBatchSchema = {
  aepPath: z.string(),
  compName: z.string(),
  outputDir: z.string(),
  locales: z.array(z.object({
    locale: z.string(),
    texts: z.record(z.string()),
    fontOverrides: z.record(z.string()).optional(),
    filenameSuffix: z.string().optional(),
  })).optional(),
  localesJsonPath: z.string().optional(),
  approveOverwrite: z.boolean().default(false),
};
export type LocalizationPackBatchInput = { [K in keyof typeof localizationPackBatchSchema]: z.infer<(typeof localizationPackBatchSchema)[K]> };

// ---------------------------------------------------------------------------
// Autonomous ad factory tools
// ---------------------------------------------------------------------------
const brandMemorySchema = z.object({
  slug: z.string().optional(),
  name: z.string().optional(),
  palette: z.array(z.string()).optional(),
  fonts: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
  }).optional(),
  tone: z.string().optional(),
  logoPath: z.string().optional(),
  targetAudience: z.string().optional(),
  productDescription: z.string().optional(),
  pastCampaigns: z.array(z.object({
    date: z.string(),
    title: z.string(),
    viralityScore: z.number().optional(),
    outputPath: z.string().optional(),
  })).optional(),
  viralFormulas: z.array(z.string()).optional(),
}).passthrough();

export const podcastToViralClipsSchema = {
  audioPath: z.string(),
  outputDir: z.string(),
  maxClips: z.number().int().positive().default(8),
  clipDurationSec: z.number().positive().default(60),
  platform: z.enum(["tiktok", "reels", "youtube_shorts"]).default("tiktok"),
  addSubtitles: z.boolean().default(true),
  transcriptPath: z.string().optional(),
};
export type PodcastToViralClipsInput = { [K in keyof typeof podcastToViralClipsSchema]: z.infer<(typeof podcastToViralClipsSchema)[K]> };

export const reverseEngineerReferenceSchema = {
  videoPath: z.string(),
  outputDir: z.string(),
  brandSlug: z.string().optional(),
};
export type ReverseEngineerReferenceInput = { [K in keyof typeof reverseEngineerReferenceSchema]: z.infer<(typeof reverseEngineerReferenceSchema)[K]> };

export const brandBrainSchema = {
  action: z.enum(["save", "load", "list", "delete", "update"]),
  slug: z.string().optional(),
  memory: brandMemorySchema.optional(),
};
export type BrandBrainInput = { [K in keyof typeof brandBrainSchema]: z.infer<(typeof brandBrainSchema)[K]> };

export const storyboardFirstSchema = {
  brief: z.string().min(1),
  sceneCount: z.number().int().positive().default(6),
  style: z.enum(["cinematic", "minimal", "bold", "playful"]).default("cinematic"),
  outputDir: z.string(),
  brandSlug: z.string().optional(),
  generateImages: z.boolean().default(false),
  totalDurationSec: z.number().positive().default(30),
};
export type StoryboardFirstInput = { [K in keyof typeof storyboardFirstSchema]: z.infer<(typeof storyboardFirstSchema)[K]> };

export const viralAutopsySchema = {
  videoPath: z.string(),
  outputDir: z.string(),
  generateFixPlan: z.boolean().default(true),
};
export type ViralAutopsyInput = { [K in keyof typeof viralAutopsySchema]: z.infer<(typeof viralAutopsySchema)[K]> };

export const dataToMotionSchema = {
  dataPath: z.string(),
  outputDir: z.string(),
  chartType: z.enum(["bar", "line", "pie", "counter"]).default("bar"),
  title: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  addVoiceover: z.boolean().default(false),
  compName: z.string().optional(),
  durationSec: z.number().positive().optional(),
};
export type DataToMotionInput = { [K in keyof typeof dataToMotionSchema]: z.infer<(typeof dataToMotionSchema)[K]> };

export const trendRadarToAdSchema = {
  platform: z.enum(["tiktok", "reels", "youtube_shorts"]).default("tiktok"),
  niche: z.string().default("general"),
  brandSlug: z.string().optional(),
  autoGenerateBrief: z.boolean().default(true),
  outputDir: z.string(),
};
export type TrendRadarToAdInput = { [K in keyof typeof trendRadarToAdSchema]: z.infer<(typeof trendRadarToAdSchema)[K]> };

export const voiceBriefModeSchema = {
  audioPath: z.string(),
  outputDir: z.string(),
  autoLaunchDirector: z.boolean().default(false),
  brandSlug: z.string().optional(),
};
export type VoiceBriefModeInput = { [K in keyof typeof voiceBriefModeSchema]: z.infer<(typeof voiceBriefModeSchema)[K]> };

export const selfCritiqueRenderSchema = {
  aepPath: z.string(),
  compName: z.string(),
  outputDir: z.string(),
  maxIterations: z.number().int().positive().default(3),
  qualityThreshold: z.number().min(0).max(100).default(75),
  critiquePrompt: z.string().optional(),
};
export type SelfCritiqueRenderInput = { [K in keyof typeof selfCritiqueRenderSchema]: z.infer<(typeof selfCritiqueRenderSchema)[K]> };

export const evolutionaryAdSwarmSchema = {
  brief: z.string().min(1),
  brandSlug: z.string().optional(),
  populationSize: z.number().int().positive().default(12),
  generations: z.number().int().positive().default(3),
  outputDir: z.string(),
  hooks: z.array(z.string()).optional(),
  grades: z.array(z.string()).optional(),
  musicStyles: z.array(z.string()).optional(),
};
export type EvolutionaryAdSwarmInput = { [K in keyof typeof evolutionaryAdSwarmSchema]: z.infer<(typeof evolutionaryAdSwarmSchema)[K]> };

export const promptToCampaignSchema = {
  brief: z.string().min(1),
  brandSlug: z.string().optional(),
  heroVideoDurationSec: z.number().positive().default(30),
  platforms: z.array(z.enum(["tiktok", "instagram", "youtube", "facebook"])).optional(),
  includeStaticPosts: z.boolean().default(true),
  includePublishCalendar: z.boolean().default(true),
  outputDir: z.string(),
};
export type PromptToCampaignInput = { [K in keyof typeof promptToCampaignSchema]: z.infer<(typeof promptToCampaignSchema)[K]> };

export const autoSoundDesignSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  sfxDir: z.string().optional(),
  approveOverwrite: z.boolean().default(false),
  whooshThresholdPx: z.number().positive().optional(),
  impactThresholdPct: z.number().positive().optional(),
};
export type AutoSoundDesignInput = { [K in keyof typeof autoSoundDesignSchema]: z.infer<(typeof autoSoundDesignSchema)[K]> };

export const emotionArcScoringSchema = {
  aepPath: z.string(),
  outputAepPath: z.string(),
  compName: z.string(),
  scriptText: z.string().min(1),
  totalDurationSec: z.number().positive(),
  musicLayerName: z.string().optional(),
  approveOverwrite: z.boolean().default(false),
};
export type EmotionArcScoringInput = { [K in keyof typeof emotionArcScoringSchema]: z.infer<(typeof emotionArcScoringSchema)[K]> };

export const personalizedVideoAtScaleSchema = {
  templateAepPath: z.string(),
  compName: z.string(),
  csvPath: z.string(),
  outputDir: z.string(),
  mappings: z.array(z.object({ layerName: z.string(), csvColumn: z.string() })).min(1),
  maxRows: z.number().int().nonnegative().optional(),
  filenamePrefix: z.string().optional(),
  approveOverwrite: z.boolean().default(false),
};
export type PersonalizedVideoAtScaleInput = { [K in keyof typeof personalizedVideoAtScaleSchema]: z.infer<(typeof personalizedVideoAtScaleSchema)[K]> };

export const competitorWatchdogSchema = {
  action: z.enum(["add_competitor", "scan", "list", "remove_competitor"]),
  competitor: z.object({
    name: z.string(),
    slug: z.string(),
    url: z.string(),
    platform: z.enum(["youtube", "tiktok", "instagram", "rss"]),
    niche: z.string().optional(),
  }).optional(),
  slug: z.string().optional(),
  outputDir: z.string(),
};
export type CompetitorWatchdogInput = { [K in keyof typeof competitorWatchdogSchema]: z.infer<(typeof competitorWatchdogSchema)[K]> };

export const autoDirectorLoopSchema = {
  brief: z.string().min(1),
  brandSlug: z.string().optional(),
  outputDir: z.string(),
  autoApprove: z.boolean().default(true),
  swarmGenerations: z.number().int().positive().default(3),
  viralityGate: z.number().min(0).max(100).default(72),
  maxIterations: z.number().int().positive().default(5),
  expandToCampaign: z.boolean().default(false),
  templateAepPath: z.string().optional(),
  compName: z.string().optional(),
};
export type AutoDirectorLoopInput = { [K in keyof typeof autoDirectorLoopSchema]: z.infer<(typeof autoDirectorLoopSchema)[K]> };

export const dreamModeSchema = {
  action: z.enum(["start", "status", "stop", "preview"]),
  brandSlug: z.string().optional(),
  niche: z.string().optional(),
  days: z.number().int().positive().default(7),
  outputDir: z.string(),
  primaryPlatform: z.enum(["tiktok", "instagram", "youtube"]).optional(),
  autoExecute: z.boolean().default(false),
};
export type DreamModeInput = { [K in keyof typeof dreamModeSchema]: z.infer<(typeof dreamModeSchema)[K]> };

export const gameTrailerAutopilotSchema = {
  unityProjectPath: z.string(),
  outputDir: z.string(),
  gameTitle: z.string().optional(),
  durationSec: z.number().positive().default(45),
  style: z.enum(["cinematic", "action", "cozy", "horror", "arcade"]).default("cinematic"),
  sceneCount: z.number().int().positive().default(7),
};
export type GameTrailerAutopilotInput = { [K in keyof typeof gameTrailerAutopilotSchema]: z.infer<(typeof gameTrailerAutopilotSchema)[K]> };

export const vfxBreedingSchema = {
  presetA: z.string(),
  presetB: z.string(),
  outputDir: z.string(),
  childName: z.string().optional(),
  mutationRate: z.number().min(0).max(1).default(0.15),
};
export type VfxBreedingInput = { [K in keyof typeof vfxBreedingSchema]: z.infer<(typeof vfxBreedingSchema)[K]> };
