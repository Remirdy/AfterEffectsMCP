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
