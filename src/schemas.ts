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
    .enum(["brandFilm", "cinematic", "socialAd", "productPromo", "abstractMotion"])
    .default("brandFilm"),
  palette: z.array(z.string()).optional().describe("Optional color palette words or hex values."),
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
