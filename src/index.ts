#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  analyzePsdVisualsSchema,
  createMotionPlanSchema,
  createVideoPromptPackageSchema,
  createImageAssetPackSchema,
  create3dSceneFromAssetsSchema,
  buildCinematicCommercialSchema,
  buildProceduralCommercialSchema,
  importPsdToAeSchema,
  animateAeProjectSchema,
  renderPreviewSchema,
  checkAfterEffectsSetupSchema,
  executeAeActionsSchema,
  listVfxPresetsSchema,
  applyVfxSchema,
  createVfxCompositionSchema,
  buildComplexVfxSchema,
  createGameVfxFromPromptSchema,
  createGameEngineVfxPackageSchema,
  createRasterVfxPlateSchema,
  buildKineticTypographySchema,
  createParticleLogoRevealSchema,
  buildHolographicHudSceneSchema,
  buildGenerativeArtLoopSchema,
  createRetroSynthwaveSceneSchema,
  buildReelTemplateSchema,
  createTiktokTransitionPackSchema,
  buildYoutubePackageSchema,
  buildAuroraBorealisSchema,
  buildFireTornadoSchema,
  buildOceanWavesSchema,
  buildAudioSpectrumVisualizerSchema,
  buildInfographicAnimationSchema,
  buildLowerThirdSchema,
  buildLogoStingSchema,
  buildGalaxySceneSchema,
  build3dCityscapeSchema,
  buildDnaHelixSchema,
  buildCountdownTimerSchema,
  buildTextMorphSchema,
  createTimelineAnimationSchema,
  applyLutGradeSchema,
  organizeAeProjectSchema,
  batchRenderQueueSchema,
  exportAsLottieSchema,
  buildWorldMapSchema,
  buildTemplateFromBrandkitSchema,
  buildProductMockupSceneSchema,
  buildUnityVfxSpritesheetSchema,
  buildUnityVfxPrefabPackageSchema,
  buildVfxGraphTemplateSchema,
  buildUrpParticleMaterialsSchema,
  buildHitImpactPackSchema,
  buildElementalSpellPackSchema,
  buildProjectileVfxSchema,
  buildCharacterStatusEffectsSchema,
  exportUnityFlipbookManifestSchema,
  buildUnityShadergraphStubSchema,
  buildVfxLodVariantsSchema,
  buildMobileVfxOptimizerSchema,
  buildVfxCollisionVariantsSchema,
  buildUnityImportSettingsSchema,
  buildRpgSpellLibrarySchema,
  buildFpsMuzzleImpactPackSchema,
  buildMobaSkillVfxSchema,
  buildPlatformerPickupVfxSchema,
  buildHorrorGameAtmosphericsSchema,
  planUnityVfxFromPromptSchema,
  buildVfxComboFromPromptSchema,
  validateUnityVfxBudgetSchema,
  buildVfxPreviewSceneSchema,
  buildVfxTimingSheetSchema,
  buildPremiumVfxAtlasPackSchema,
  buildLayeredVfxPassesSchema,
  buildFlipbookNormalDistortionSchema,
  buildVfxVariationGeneratorSchema,
  buildCombatVfxBundleSchema,
  buildMagicSchoolBundleSchema,
  buildShaderDrivenVfxPackSchema,
  buildMeshBasedVfxPrimitivesSchema,
  buildTrailRendererPackSchema,
  buildDecalImpactPackSchema,
  buildScreenSpaceVfxSchema,
  buildAssetStoreVfxPackageSchema,
  buildDemoSceneGallerySchema,
  buildVfxThumbnailSheetSchema,
  buildVfxDocumentationPackSchema,
  buildVfxPackIndexSchema,
  scoreVfxAssetQualitySchema,
  buildVfxPerformanceProfilesSchema,
  auditVfxOverdrawSchema,
  buildVfxLifetimeCurvesSchema,
  buildVfxColorRampsSchema,
  renderVfxFlipbookFromAeSchema,
  packFlipbookAtlasSchema,
  generateVfxPreviewGifMp4Schema,
  renderVfxThumbnailContactSheetSchema,
  autoCropAlphaFramesSchema,
  normalizeFlipbookBrightnessAlphaSchema,
  validateLoopSeamSchema,
  generateRealUnityPrefabsSchema,
  generateVfxGraphAssetSchema,
  generateShadergraphAssetSchema,
  createUnityDemoProjectSchema,
  createUnityPackageExportSchema,
  buildMarketplaceMediaPackSchema,
  writeAssetStoreDescriptionSchema,
  generatePackTrailerStoryboardSchema,
  buildDemoGalleryUiSchema,
  analyzeFlipbookSilhouetteSchema,
  detectAlphaBleedingEdgesSchema,
  estimateTextureMemoryBudgetSchema,
  compareLodVisualLossSchema,
  validateMobileVfxPackSchema,
  ListVfxPresetsInput,
  ApplyVfxInput,
  CreateVfxCompositionInput,
  BuildComplexVfxInput,
  CreateGameVfxFromPromptInput,
  CreateGameEngineVfxPackageInput,
  CreateRasterVfxPlateInput,
  BuildKineticTypographyInput,
  CreateParticleLogoRevealInput,
  BuildHolographicHudSceneInput,
  BuildGenerativeArtLoopInput,
  CreateRetroSynthwaveSceneInput,
  BuildReelTemplateInput,
  CreateTiktokTransitionPackInput,
  BuildYoutubePackageInput,
  BuildAuroraBorealisInput,
  BuildFireTornadoInput,
  BuildOceanWavesInput,
  BuildAudioSpectrumVisualizerInput,
  BuildInfographicAnimationInput,
  BuildLowerThirdInput,
  BuildLogoStingInput,
  BuildGalaxySceneInput,
  Build3dCityscapeInput,
  BuildDnaHelixInput,
  BuildCountdownTimerInput,
  BuildTextMorphInput,
  CreateTimelineAnimationInput,
  ApplyLutGradeInput,
  OrganizeAeProjectInput,
  BatchRenderQueueInput,
  ExportAsLottieInput,
  BuildWorldMapInput,
  BuildTemplateFromBrandkitInput,
  BuildProductMockupSceneInput,
  AnalyzePsdInput,
  CreateMotionPlanInput,
  CreateVideoPromptPackageInput,
  CreateImageAssetPackInput,
  Create3dSceneFromAssetsInput,
  BuildCinematicCommercialInput,
  BuildProceduralCommercialInput,
  ImportPsdInput,
  AnimateInput,
  RenderInput,
  CheckAfterEffectsSetupInput,
  ExecuteAeActionsInput,
} from "./schemas.js";
import { analyzePsd } from "./psd/analyzer.js";
import { buildMotionPlan } from "./motion/planner.js";
import { buildVideoPromptPackage } from "./video/promptPackage.js";
import { createImageAssetPack } from "./assets/generator.js";
import {
  generateImportJsx,
  generateAnimateJsx,
  generateRenderJsx,
  generateExecuteActionsJsx,
  generateCreate3dSceneJsx,
} from "./ae/jsxGenerator.js";
import { generateCommercialJsx } from "./ae/commercialJsxGenerator.js";
import { generateProceduralCommercialJsx } from "./ae/proceduralCommercialJsxGenerator.js";
import { generateApplyVfxJsx, generateCreateVfxCompJsx, generateComplexVfxJsx, generatePromptVfxJsx } from "./ae/vfxGenerator.js";
import {
  generateKineticTypographyJsx,
  generateParticleLogoRevealJsx,
  generateHolographicHudSceneJsx,
  generateGenerativeArtLoopJsx,
  generateRetroSynthwaveSceneJsx,
  generateAuroraBorealisJsx,
  generateFireTornadoJsx,
  generateOceanWavesJsx,
} from "./ae/crazyGenerator.js";
import {
  generateVideoCompositionFromPackageJsx,
  generateReelTemplateJsx,
  generateTiktokTransitionPackJsx,
  generateYoutubePackageJsx,
} from "./ae/videoJsxGenerator.js";
import {
  generateAudioSpectrumVisualizerJsx,
  generateInfographicAnimationJsx,
  generateLowerThirdJsx,
  generateLogoStingJsx,
  generateGalaxySceneJsx,
  generate3dCityscapeJsx,
  generateDnaHelixJsx,
  generateCountdownTimerJsx,
  generateTextMorphJsx,
  generateTimelineAnimationJsx,
  generateApplyLutGradeJsx,
  generateOrganizeAeProjectJsx,
  generateBatchRenderQueueJsx,
  generateExportAsLottieJsx,
  generateWorldMapJsx,
  generateTemplateFromBrandkitJsx,
  generateProductMockupSceneJsx,
} from "./ae/broadcastGenerator.js";
import { listVfxPresets, listVfxComposites, VfxDomain } from "./vfx/presets.js";
import { buildVfxPlanFromPrompt } from "./vfx/vfxPlanner.js";
import { writeEnginePackage, inferC4dRequested } from "./engine/package.js";
import { createUnityVfxToolkitPackage } from "./engine/unityVfxToolkit.js";
import type { UnityVfxToolKind } from "./engine/unityVfxToolkit.js";
import { generateRasterVfxPlate } from "./vfx/rasterPlate.js";
import { resolveAerender, resolveAfterEffects, runJsx, runAerender } from "./ae/runner.js";
import {
  OpLog,
  assertFile,
  guardOverwrite,
  readJson,
  writeJson,
  textResult,
  errorResult,
  ensureDir,
} from "./util.js";
import { AnalysisReport, MotionPlan } from "./types.js";

/**
 * Build a fully-configured MotionPilot AE MCP server instance with all tools
 * registered. Shared by the stdio entrypoint (this file) and the remote HTTP
 * entrypoint (`http.ts`, used by ChatGPT custom connectors / OpenAI API).
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "motionpilot-ae-mcp",
    version: "1.0.0",
  });

/* ------------------------------------------------------------------ *
 * Tool 1: analyze_psd_visuals
 * ------------------------------------------------------------------ */
server.tool(
  "analyze_psd_visuals",
  "Analyze a PSD visually and structurally: export a flattened preview and per-layer " +
    "thumbnails, extract layer names/order/bounds/opacity/visibility/type, detect naming " +
    "conventions (BG_, Text_, Title_, Phone_, Card_, Icon_, Logo_, LOCKED, ...), suggest a " +
    "role and animation per layer, and return a structured JSON report with image paths.",
  analyzePsdVisualsSchema,
  async (args: AnalyzePsdInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.psdPath, "PSD");
      if (!/\.psd$/i.test(args.psdPath)) log.warn("File does not end in .psd — attempting to read anyway.");
      await ensureDir(args.outputAnalysisFolder);

      const report = await analyzePsd(args, log);
      const jsonPath = path.join(args.outputAnalysisFolder, "analysis.json");
      await writeJson(jsonPath, report);
      log.info(`Wrote analysis JSON: ${jsonPath}`);

      return textResult({
        ok: true,
        analysisJsonPath: jsonPath,
        document: report.document,
        layerCount: report.layers.length,
        layers: report.layers,
        visualSuggestions: report.visualSuggestions,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`analyze_psd_visuals failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 2: create_motion_plan_from_analysis
 * ------------------------------------------------------------------ */
server.tool(
  "create_motion_plan_from_analysis",
  "Read a PSD analysis JSON and the user's natural-language direction, then produce a " +
    "structured, hierarchy-aware motion plan. Text content is never changed; locked/text " +
    "layers are only animated via position/scale/opacity/mask/text-range-selector.",
  createMotionPlanSchema,
  async (args: CreateMotionPlanInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.analysisJsonPath, "analysis JSON");
      const report = await readJson<AnalysisReport>(args.analysisJsonPath);
      const plan = buildMotionPlan(report, args, log);

      const outPath =
        args.outputMotionPlanPath ??
        path.join(path.dirname(args.analysisJsonPath), "motion-plan.json");
      await writeJson(outPath, plan);
      log.info(`Wrote motion plan: ${outPath}`);

      return textResult({
        ok: true,
        motionPlanJsonPath: outPath,
        composition: plan.composition,
        rules: plan.rules,
        style: plan.style,
        promptProfile: plan.promptProfile,
        animationCount: plan.animations.length,
        animations: plan.animations,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_motion_plan_from_analysis failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 3: create_video_prompt_package
 * ------------------------------------------------------------------ */
server.tool(
  "create_video_prompt_package",
  "Create a prompt-to-video package from a natural-language concept and optional reference URL: " +
    "creative brief, beat/shot list, AI-video prompts, and After Effects motion direction. " +
    "This does not call a video model or copy the reference; it prepares production-ready prompts.",
  createVideoPromptPackageSchema,
  async (args: CreateVideoPromptPackageInput) => {
    const log = new OpLog();
    try {
      const pkg = buildVideoPromptPackage(args);

      let aeResult: { outputAepPath: string; aeLog: string } | null = null;
      if (args.includeAeComposition) {
        if (!args.outputAepPath) {
          return errorResult("outputAepPath is required when includeAeComposition is true.", log);
        }
        await guardOverwrite(args.outputAepPath, args.approveOverwrite);
        await ensureDir(path.dirname(args.outputAepPath));

        const jsx = generateVideoCompositionFromPackageJsx({
          outputAepPath: args.outputAepPath,
          packageData: pkg,
          compName: args.brandName,
        });

        const result = await runJsx(jsx, log);
        if (!result.ok) {
          return errorResult(
            `create_video_prompt_package failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
            log
          );
        }
        aeResult = {
          outputAepPath: result.output || args.outputAepPath,
          aeLog: result.jsxLog || "",
        };
      }

      if (args.outputJsonPath) {
        await ensureDir(path.dirname(args.outputJsonPath));
        await writeJson(args.outputJsonPath, pkg);
        log.info(`Wrote video prompt package: ${args.outputJsonPath}`);
      }

      return textResult({
        ...pkg,
        outputJsonPath: args.outputJsonPath ?? null,
        aeComposition: aeResult,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_video_prompt_package failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 4: create_image_asset_pack
 * ------------------------------------------------------------------ */
server.tool(
  "create_image_asset_pack",
  "Generate a procedural PNG asset pack from a visual prompt: background, hero object, " +
    "connection rings, kinetic streaks, title plate, and CTA plate. Returns an asset manifest " +
    "that can be converted into a 3D/2.5D After Effects scene.",
  createImageAssetPackSchema,
  async (args: CreateImageAssetPackInput) => {
    const log = new OpLog();
    try {
      const pack = await createImageAssetPack(args);
      log.info(`Generated ${pack.assets.length} image assets: ${args.outputFolder}`);
      return textResult({ ...pack, log: log.all });
    } catch (e) {
      return errorResult(`create_image_asset_pack failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 5: create_3d_scene_from_assets
 * ------------------------------------------------------------------ */
server.tool(
  "create_3d_scene_from_assets",
  "Create a 3D/2.5D After Effects project from an asset manifest. Imports generated images, " +
    "places them as 3D layers with Z-depth, adds camera, light, parallax/orbit expressions, " +
    "and saves a new AEP. Does not render.",
  create3dSceneFromAssetsSchema,
  async (args: Create3dSceneFromAssetsInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.assetManifestPath, "asset manifest");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const manifest = await readJson<{
        width: number;
        height: number;
        assets: Array<{ name: string; path: string; role: string; z: number; scale: number; position: [number, number] }>;
      }>(args.assetManifestPath);
      const jsx = generateCreate3dSceneJsx({
        manifest,
        outputAepPath: args.outputAepPath,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `create_3d_scene_from_assets failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: args.compName,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_3d_scene_from_assets failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 5b: build_cinematic_commercial
 * ------------------------------------------------------------------ */
server.tool(
  "build_cinematic_commercial",
  "Build a fully-structured premium 9:16 commercial in After Effects from procedural brand " +
    "assets: named precomps (01_BACKGROUND…08_FINAL_PACKSHOT), a null-driven 3D camera, a five-scene " +
    "timeline (Intro → Product Hero → Features → Energy Build → Final CTA), section + sound-design " +
    "markers, animated trim-path HUD feature callouts, and a global finishing pass (motion blur, " +
    "bloom, cinematic grade, film grain). Logo/brand plates are text-protected and never distorted. " +
    "Generates a procedural asset pack first unless an assetManifestPath is supplied. Does not render.",
  buildCinematicCommercialSchema,
  async (args: BuildCinematicCommercialInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      await ensureDir(args.outputFolder);

      // 1. Obtain the asset manifest (reuse existing, or generate procedurally).
      let manifest: any;
      if (args.assetManifestPath) {
        await assertFile(args.assetManifestPath, "asset manifest");
        manifest = await readJson(args.assetManifestPath);
        log.info(`Using existing asset manifest: ${args.assetManifestPath}`);
      } else {
        manifest = await createImageAssetPack({
          prompt: args.prompt,
          outputFolder: args.outputFolder,
          width: args.width,
          height: args.height,
          style: args.style,
          palette: args.palette,
        } as CreateImageAssetPackInput);
        log.info(`Generated procedural asset pack (${manifest.layerCount} layers).`);
      }

      // 2. Build the structured commercial JSX and run it.
      const jsx = generateCommercialJsx({
        manifest,
        outputAepPath: args.outputAepPath,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
        brandName: args.brandName,
        features: args.features,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `build_cinematic_commercial failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: args.compName,
        manifestPath: manifest.manifestPath ?? args.assetManifestPath,
        precomps: ["01_BACKGROUND", "02_PRODUCT_HERO", "03_LOGO_LOCKED", "04_LIGHTING_FX", "05_PARTICLES", "06_CALLOUTS", "07_CAMERA_CONTROL", "08_FINAL_PACKSHOT"],
        sceneMarkers: ["Intro", "Product Hero", "Features", "Energy Build", "Final CTA"],
        nextStep: "render_preview for an H.264 social export.",
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`build_cinematic_commercial failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 5c: build_procedural_commercial
 * ------------------------------------------------------------------ */
server.tool(
  "build_procedural_commercial",
  "Build a complete professional commercial directly inside After Effects with no external " +
    "assets: editable wordmark/logo text, abstract shape-layer icon, gradients, particles, " +
    "glass UI panels, feature cards, prompt interface, trim-path motion graphics, camera/null " +
    "2.5D parallax, timeline markers, render-queue setup and finishing layers. Use this for " +
    "fictional brands, startup launch ads, AI/product promos, social vertical commercials, " +
    "and any brief that says there are no existing assets. All visible text is supplied by " +
    "the user or conservative defaults; no lorem ipsum or fake paragraphs are generated.",
  buildProceduralCommercialSchema,
  async (args: BuildProceduralCommercialInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const jsx = generateProceduralCommercialJsx({
        outputAepPath: args.outputAepPath,
        compName: args.compName,
        brandName: args.brandName,
        headline: args.headline,
        features: args.features,
        promptLine: args.promptLine,
        tagline: args.tagline,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        palette: args.palette,
        style: args.style,
      });

      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `build_procedural_commercial failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }

      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: args.compName,
        format: { width: args.width, height: args.height, duration: args.duration, fps: args.fps },
        generatedSystems: [
          "01_BACKGROUND_GRADIENT",
          "02_PARTICLES_DEPTH",
          "03_LOGO_ICON",
          "04_WORDMARK",
          "05_GLASS_UI_PANELS",
          "06_FEATURE_CARDS",
          "07_PROMPT_INTERFACE",
          "08_MOTION_PATHS",
          "09_LIGHTING_FX",
          "10_CAMERA_CONTROL",
          "11_FINAL_LOCKUP",
          "12_COLOR_GRADE",
        ],
        sceneMarkers: ["Brand Birth", "Product Positioning", "Feature Rhythm", "Prompt Control", "Energy Build", "Final Lockup"],
        nextStep: "Use render_preview on the returned comp for an H.264 vertical social export.",
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`build_procedural_commercial failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 6: import_psd_to_after_effects
 * ------------------------------------------------------------------ */
server.tool(
  "import_psd_to_after_effects",
  "Open After Effects, import the PSD as a composition retaining layer sizes, set duration " +
    "and FPS, and save a new AEP project. The source PSD is never modified.",
  importPsdToAeSchema,
  async (args: ImportPsdInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.psdPath, "PSD");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const jsx = generateImportJsx({
        psdPath: args.psdPath,
        outputAepPath: args.outputAepPath,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `import_psd_to_after_effects failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: "MotionPilot_Main",
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`import_psd_to_after_effects failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 7: animate_after_effects_project
 * ------------------------------------------------------------------ */
server.tool(
  "animate_after_effects_project",
  "Open an AEP, apply the motion plan as keyframes/effects (position, scale, opacity, " +
    "rotation, blur, masks, parallax, stagger, light sweep), add easing everywhere, and save " +
    "a new animated AEP. When preserveTextContent is true, sourceText is never modified.",
  animateAeProjectSchema,
  async (args: AnimateInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      await assertFile(args.motionPlanJsonPath, "motion plan JSON");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const plan = await readJson<MotionPlan>(args.motionPlanJsonPath);
      const jsx = generateAnimateJsx({
        aepPath: args.aepPath,
        plan,
        outputAepPath: args.outputAepPath,
        preserveTextContent: args.preserveTextContent,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `animate_after_effects_project failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: plan.composition.name,
        appliedAnimations: plan.animations.length,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`animate_after_effects_project failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 8: render_preview
 * ------------------------------------------------------------------ */
server.tool(
  "render_preview",
  "Render a composition to an MP4/MOV preview using aerender when available, otherwise via " +
    "the After Effects render queue. Returns render logs and the output path.",
  renderPreviewSchema,
  async (args: RenderInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      await guardOverwrite(args.outputVideoPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputVideoPath));

      // Prefer aerender (headless, reliable). Fall back to JSX render queue.
      try {
        const r = await runAerender(
          { aepPath: args.aepPath, compName: args.compName, outputVideoPath: args.outputVideoPath },
          log
        );
        return textResult({
          ok: r.ok,
          method: "aerender",
          outputVideoPath: r.output,
          renderLog: r.logText,
          log: log.all,
        });
      } catch (aerenderErr) {
        log.warn(`aerender unavailable, falling back to JSX render queue: ${(aerenderErr as Error).message}`);
        const jsx = generateRenderJsx({
          aepPath: args.aepPath,
          compName: args.compName,
          outputVideoPath: args.outputVideoPath,
          format: args.format,
        });
        const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 30 });
        if (!result.ok) {
          return errorResult(
            `render_preview failed: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
            log
          );
        }
        return textResult({
          ok: true,
          method: "render_queue",
          outputVideoPath: result.output || args.outputVideoPath,
          renderLog: result.jsxLog,
          log: log.all,
        });
      }
    } catch (e) {
      return errorResult(`render_preview failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 9: check_after_effects_setup
 * ------------------------------------------------------------------ */
server.tool(
  "check_after_effects_setup",
  "Check whether the local After Effects and aerender paths can be resolved. Does not launch After Effects.",
  checkAfterEffectsSetupSchema,
  async (_args: CheckAfterEffectsSetupInput) => {
    const log = new OpLog();
    try {
      let afterEffectsPath: string | null = null;
      let aerenderPath: string | null = null;
      let afterEffectsError: string | null = null;

      try {
        afterEffectsPath = await resolveAfterEffects(log);
      } catch (e) {
        afterEffectsError = (e as Error).message;
      }
      aerenderPath = await resolveAerender(log);

      return textResult({
        ok: Boolean(afterEffectsPath),
        afterEffectsPath,
        aerenderPath,
        afterEffectsError,
        environment: {
          AE_BINARY: process.env.AE_BINARY ?? null,
          AERENDER_BINARY: process.env.AERENDER_BINARY ?? null,
          platform: process.platform,
        },
        log: log.all,
      });
    } catch (e) {
      return errorResult(`check_after_effects_setup failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 10: execute_after_effects_actions
 * ------------------------------------------------------------------ */
server.tool(
  "execute_after_effects_actions",
  "Run a batch of general After Effects actions: create/list compositions, get project " +
    "info, create text/shape/solid/adjustment/camera/null layers, edit transforms/timing, " +
    "toggle 2D/3D, set blend modes and track mattes, duplicate/delete layers, create masks, " +
    "set keyframes, apply expressions, and batch-set properties.",
  executeAeActionsSchema,
  async (args: ExecuteAeActionsInput) => {
    const log = new OpLog();
    try {
      if (args.aepPath) await assertFile(args.aepPath, "AEP");

      const inspectionOnly = args.actions.every((a) =>
        a.type === "listCompositions" || a.type === "getProjectInfo"
      );
      if (!inspectionOnly && !args.outputAepPath) {
        return errorResult("execute_after_effects_actions failed: outputAepPath is required for mutating actions.", log);
      }
      if (args.outputAepPath) {
        await guardOverwrite(args.outputAepPath, args.approveOverwrite);
        await ensureDir(path.dirname(args.outputAepPath));
      }

      const jsx = generateExecuteActionsJsx({
        aepPath: args.aepPath,
        outputAepPath: args.outputAepPath,
        actions: args.actions,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `execute_after_effects_actions failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`execute_after_effects_actions failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 11: list_vfx_presets
 * ------------------------------------------------------------------ */
server.tool(
  "list_vfx_presets",
  "List the professional VFX presets available across four domains — game (energy bursts, " +
    "shockwaves, magic circles, power auras, hit sparks), cinema (atmospheric fog, volumetric " +
    "light rays, lens flares, procedural fire/smoke, energy beams, film grain, cinematic grade), " +
    "and social (glitch, chromatic aberration, neon glow, whip-pan, kinetic pop). Each preset is " +
    "hybrid: it uses premium plugins (Trapcode Particular, Saber, Optical Flares) when present and " +
    "falls back to stock After Effects effects otherwise.",
  listVfxPresetsSchema,
  async (args: ListVfxPresetsInput) => {
    const presets = listVfxPresets(args.domain as VfxDomain | undefined);
    const composites = args.includeComposites
      ? listVfxComposites(args.domain as VfxDomain | undefined)
      : [];
    return textResult({
      ok: true,
      count: presets.length,
      compositeCount: composites.length,
      domains: ["game", "cinema", "social", "ad"],
      presets: presets.map((p) => ({
        id: p.id,
        domain: p.domain,
        name: p.name,
        description: p.description,
        targetMode: p.targetMode,
        defaults: p.defaults,
        premiumPlugin: p.premiumPlugin ?? null,
      })),
      composites: composites.map((c) => ({
        id: c.id,
        domain: c.domain,
        name: c.name,
        description: c.description,
        steps: c.steps,
        usage: "build_complex_vfx",
      })),
    });
  }
);

/* ------------------------------------------------------------------ *
 * Tool 12: apply_vfx
 * ------------------------------------------------------------------ */
server.tool(
  "apply_vfx",
  "Apply one or more professional VFX presets to an existing AEP composition and save a new copy. " +
    "Comp-mode presets (e.g. energy_burst, shockwave, fire, fog, light_rays) spawn their own layers; " +
    "layer-mode presets (e.g. neon_glow, power_aura, kinetic_pop, glitch) decorate a targetLayer. " +
    "Effects are hybrid (premium plugins when available, stock fallback otherwise) and never modify " +
    "source text. Use list_vfx_presets to discover preset ids and parameters.",
  applyVfxSchema,
  async (args: ApplyVfxInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const jsx = generateApplyVfxJsx({
        aepPath: args.aepPath,
        compName: args.compName,
        outputAepPath: args.outputAepPath,
        applications: args.vfx as any,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `apply_vfx failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        appliedVfx: args.vfx.map((v) => v.presetId),
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`apply_vfx failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 13: create_vfx_composition
 * ------------------------------------------------------------------ */
server.tool(
  "create_vfx_composition",
  "Create a brand-new After Effects project containing a standalone, reusable VFX element " +
    "composition (e.g. an explosion, magic circle, fog plate, fire column, or laser beam) built " +
    "from one or more VFX presets, then save the AEP. Ideal for building a VFX element library " +
    "that can be composited into other projects.",
  createVfxCompositionSchema,
  async (args: CreateVfxCompositionInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const jsx = generateCreateVfxCompJsx({
        outputAepPath: args.outputAepPath,
        compName: args.compName,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        backgroundColor: args.backgroundColor as [number, number, number] | undefined,
        applications: args.vfx as any,
      });
      const result = await runJsx(jsx, log);
      if (!result.ok) {
        return errorResult(
          `create_vfx_composition failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        compName: args.compName,
        appliedVfx: args.vfx.map((v) => v.presetId),
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_vfx_composition failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 14: build_complex_vfx
 * ------------------------------------------------------------------ */
server.tool(
  "build_complex_vfx",
  "Build DETAILED, production-grade COMPOSITE VFX in a single call — each recipe stacks many " +
    "layers and effects into one professional result with an intensity control. Recipes: " +
    "'cinematicExplosion' (flash+fireball+fire+smoke+shockwave+sparks+grade), 'magicCast' " +
    "(charge+arcane circle+lightning+shockwave), 'heroEntrance' (light rays+lens flare+fog+bokeh+grade), " +
    "'celebration' (confetti+bursts+bokeh+light leak), 'powerSurge' (force field+lightning+plexus+charge), " +
    "'stormScene' (rain+fog+lightning+grade). Works on an existing AEP or creates a fresh comp. " +
    "Hybrid: premium plugins when present, stock fallback otherwise. Source text is never modified.",
  buildComplexVfxSchema,
  async (args: BuildComplexVfxInput) => {
    const log = new OpLog();
    try {
      if (args.aepPath) await assertFile(args.aepPath, "AEP");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const jsx = generateComplexVfxJsx({
        aepPath: args.aepPath,
        compName: args.compName,
        outputAepPath: args.outputAepPath,
        newComp: args.newComp,
        composites: args.composites as any,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) {
        return errorResult(
          `build_complex_vfx failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        appliedComposites: args.composites.map((c) => c.compositeId),
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`build_complex_vfx failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 15: create_game_vfx_from_prompt
 * ------------------------------------------------------------------ */
server.tool(
  "create_game_vfx_from_prompt",
  "Create game-ready VFX directly from a natural-language prompt in English or Turkish. " +
    "The prompt planner recognizes effects like explosion/patlama, fire/ateş, lightning/şimşek, " +
    "portal, shield/kalkan, beam/lazer, shockwave, magic circle/büyü çemberi, aura, sword slash, " +
    "hit sparks and muzzle flashes, infers color/intensity/format, then creates a standalone AEP " +
    "or applies the VFX to an existing project.",
  createGameVfxFromPromptSchema,
  async (args: CreateGameVfxFromPromptInput) => {
    const log = new OpLog();
    try {
      if (args.aepPath) await assertFile(args.aepPath, "AEP");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));

      const plan = buildVfxPlanFromPrompt(args.prompt, {
        targetLayer: args.targetLayer,
        duration: args.duration,
        fps: args.fps,
        position: args.position as [number, number] | undefined,
      });
      if (args.width) plan.composition.width = args.width;
      if (args.height) plan.composition.height = args.height;
      if (args.compName) plan.composition.name = args.compName;
      if (args.position == null) {
        plan.steps.forEach((step) => {
          if (!step.params) return;
          if (Array.isArray(step.params.position)) {
            step.params.position = [plan.composition.width / 2, plan.composition.height / 2];
          }
        });
      }

      if (args.outputPlanJsonPath) {
        await ensureDir(path.dirname(args.outputPlanJsonPath));
        await writeJson(args.outputPlanJsonPath, plan);
        log.info(`Wrote prompt VFX plan: ${args.outputPlanJsonPath}`);
      }

      const jsx = generatePromptVfxJsx({
        aepPath: args.aepPath,
        compName: args.aepPath ? args.compName : undefined,
        outputAepPath: args.outputAepPath,
        plan,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) {
        return errorResult(
          `create_game_vfx_from_prompt failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        outputPlanJsonPath: args.outputPlanJsonPath ?? null,
        plan,
        matched: plan.matched,
        notes: plan.notes,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_game_vfx_from_prompt failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 16: create_game_engine_vfx_package
 * ------------------------------------------------------------------ */
server.tool(
  "create_game_engine_vfx_package",
  "Create a Unity/Unreal-ready game VFX package from a prompt. If engine is auto, the prompt " +
    "can choose Unity, Unreal/Niagara, or both. The package includes an editable AE source AEP, " +
    "manifest.json, render target metadata for sprite sheets / PNG sequences, and engine import " +
    "notes. If the user asks for Cinema 4D/Cineware (or supplies c4dScenePath), the generated AE " +
    "source can import that .c4d scene through AE/Cineware; otherwise it uses After Effects-only VFX.",
  createGameEngineVfxPackageSchema,
  async (args: CreateGameEngineVfxPackageInput) => {
    const log = new OpLog();
    try {
      const manifestPath = path.join(args.outputFolder, "manifest.json");
      const sourceAepPath = path.join(args.outputFolder, "source", `${args.compName}.aep`);
      await guardOverwrite(manifestPath, args.approveOverwrite);
      await guardOverwrite(sourceAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(sourceAepPath));

      const c4dRequested = inferC4dRequested(args.prompt, args.c4dMode as any, args.c4dScenePath);
      if (args.c4dMode === "require" && !args.c4dScenePath) {
        throw new Error("c4dMode=require needs c4dScenePath.");
      }
      if (args.c4dScenePath) {
        await assertFile(args.c4dScenePath, "C4D scene");
        if (!/\.c4d$/i.test(args.c4dScenePath)) {
          log.warn("c4dScenePath does not end in .c4d; attempting AE import anyway.");
        }
      }

      const plan = buildVfxPlanFromPrompt(args.prompt, {
        duration: args.duration,
        fps: args.fps,
        position: args.position as [number, number] | undefined,
      });
      plan.composition.width = args.frameWidth;
      plan.composition.height = args.frameHeight;
      plan.composition.duration = args.duration;
      plan.composition.fps = args.fps;
      plan.composition.name = args.compName;
      if (args.position == null) {
        plan.steps.forEach((step) => {
          if (!step.params) return;
          if (Array.isArray(step.params.position)) {
            step.params.position = [args.frameWidth / 2, args.frameHeight / 2];
          }
        });
      }

      const jsx = generatePromptVfxJsx({
        outputAepPath: sourceAepPath,
        plan,
        c4dScenePath: c4dRequested ? args.c4dScenePath : undefined,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) {
        return errorResult(
          `create_game_engine_vfx_package failed in After Effects: ${result.error}\n--- AE log ---\n${result.jsxLog}`,
          log
        );
      }

      const manifest = await writeEnginePackage({
        prompt: args.prompt,
        engine: args.engine as any,
        exportKind: args.exportKind,
        outputFolder: args.outputFolder,
        aepPath: result.output || sourceAepPath,
        compName: args.compName,
        plan,
        frameWidth: args.frameWidth,
        frameHeight: args.frameHeight,
        fps: args.fps,
        duration: args.duration,
        loop: args.loop,
        blendMode: args.blendMode,
        c4dMode: args.c4dMode as any,
        c4dScenePath: c4dRequested ? args.c4dScenePath : undefined,
      });
      log.info(`Wrote engine VFX package manifest: ${manifest.files.manifest}`);

      return textResult({
        ok: true,
        outputFolder: args.outputFolder,
        sourceAepPath: manifest.sourceAepPath,
        manifestPath: manifest.files.manifest,
        engine: manifest.engine,
        exportKind: manifest.exportKind,
        c4d: manifest.c4d,
        renderTargets: manifest.renderTargets,
        files: manifest.files,
        matched: plan.matched,
        notes: plan.notes,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`create_game_engine_vfx_package failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 17: create_raster_vfx_plate
 * ------------------------------------------------------------------ */
server.tool(
  "create_raster_vfx_plate",
  "Create a high-quality raster/noise/particle-field VFX plate as PNG frames. " +
    "This is the preferred quality path for professional game VFX such as fire, portals, " +
    "magic energy, shockwaves and spark-heavy effects. It avoids geometric-looking AE shape " +
    "fallbacks and produces engine/AE-friendly image sequences.",
  createRasterVfxPlateSchema,
  async (args: CreateRasterVfxPlateInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(path.join(args.outputFolder, "raster-vfx-manifest.json"), args.approveOverwrite);
      const result = await generateRasterVfxPlate({
        prompt: args.prompt,
        outputFolder: args.outputFolder,
        kind: args.kind,
        width: args.width,
        height: args.height,
        frames: args.frames,
        fps: args.fps,
      });
      log.info(`Generated raster VFX plate frames: ${result.framesFolder}`);
      return textResult({ ok: true, ...result, log: log.all });
    } catch (e) {
      return errorResult(`create_raster_vfx_plate failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 18: build_kinetic_typography
 * ------------------------------------------------------------------ */
server.tool(
  "build_kinetic_typography",
  "Create a kinetic typography animation from any text or lyrics in After Effects. " +
    "Supports 7 animation styles: wordByWord (beat-synced pop), letterByLetter (stagger), " +
    "lineByLine, scramble (Matrix-style randomize→reveal), typewriter (cursor), bounce (elastic), " +
    "3dSpin (letters spin in 3D). Auto-times words to BPM, applies per-word color from palette, " +
    "neon glow, particle background. No plugin required — pure AE expressions + shape layers.",
  buildKineticTypographySchema,
  async (args: BuildKineticTypographyInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateKineticTypographyJsx({
        text: args.text,
        outputAepPath: args.outputAepPath,
        style: args.style,
        bpm: args.bpm,
        palette: args.palette,
        font: args.font,
        fontSize: args.fontSize,
        addGlow: args.addGlow,
        addBackground: args.addBackground,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`build_kinetic_typography failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, style: args.style, bpm: args.bpm, wordCount: args.text.trim().split(/\s+/).length, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_kinetic_typography failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 19: create_particle_logo_reveal
 * ------------------------------------------------------------------ */
server.tool(
  "create_particle_logo_reveal",
  "Build a professional logo reveal where the brand name assembles from or shatters into " +
    "particles. 6 styles: assemble (converge), disassemble (shatter), swirl (spiral), " +
    "explosion (blast out), rain (fall from top), vortex (rotating). Uses CC Particle World " +
    "for the particle system + motion trail echo + neon glow + light sweep on final logo. " +
    "Zero external assets or plugins needed — pure After Effects.",
  createParticleLogoRevealSchema,
  async (args: CreateParticleLogoRevealInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateParticleLogoRevealJsx({
        logoText: args.logoText,
        outputAepPath: args.outputAepPath,
        revealStyle: args.revealStyle,
        particleColor: args.particleColor as number[] | undefined,
        logoColor: args.logoColor as number[] | undefined,
        particleCount: args.particleCount,
        revealDuration: args.revealDuration,
        holdDuration: args.holdDuration,
        addGlow: args.addGlow,
        addAftertrail: args.addAftertrail,
        width: args.width,
        height: args.height,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`create_particle_logo_reveal failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, revealStyle: args.revealStyle, particleCount: args.particleCount, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`create_particle_logo_reveal failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 20: build_holographic_hud_scene
 * ------------------------------------------------------------------ */
server.tool(
  "build_holographic_hud_scene",
  "Build a complete sci-fi holographic HUD scene from scratch — no plugins, no stock footage. " +
    "6 scene presets: cockpit, cyberspace, medical, tactical, sci-fi-lab, hacker. Includes: " +
    "corner brackets, scanning bar, rotating radar with sweep hand, animated bar graph, circular " +
    "progress gauge, waveform signal line, data readout text, optional digital rain background, " +
    "VHS scanlines, and cinematic grade. Every element is built from shape layers + expressions.",
  buildHolographicHudSceneSchema,
  async (args: BuildHolographicHudSceneInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateHolographicHudSceneJsx({
        outputAepPath: args.outputAepPath,
        sceneType: args.sceneType,
        primaryColor: args.primaryColor as number[] | undefined,
        accentColor: args.accentColor as number[] | undefined,
        dataLines: args.dataLines,
        showRadar: args.showRadar,
        showBarGraph: args.showBarGraph,
        showCircularGauge: args.showCircularGauge,
        showScanlines: args.showScanlines,
        showCornerBrackets: args.showCornerBrackets,
        showWaveform: args.showWaveform,
        backgroundStyle: args.backgroundStyle,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_holographic_hud_scene failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, sceneType: args.sceneType, elements: ["scanlines","cornerBrackets","scanBar","radar","barGraph","circularGauge","waveform","dataReadout"], aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_holographic_hud_scene failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 21: build_generative_art_loop
 * ------------------------------------------------------------------ */
server.tool(
  "build_generative_art_loop",
  "Generate a seamlessly-looping procedural generative art animation in After Effects with " +
    "no external assets or plugins. 8 algorithm styles: flowField (Perlin-flow-inspired fractal " +
    "layers + polar coordinates), lavalamp (animated blobs + turbulent displace), spirograph " +
    "(hypotrochoid rotating rings), cellular, fractalTree, voronoi, turbulentInk, crystalline. " +
    "Complexity 1-10 controls layer count and density. Perfect for music visualizers, loop " +
    "backgrounds and abstract motion art.",
  buildGenerativeArtLoopSchema,
  async (args: BuildGenerativeArtLoopInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateGenerativeArtLoopJsx({
        outputAepPath: args.outputAepPath,
        style: args.style,
        palette: args.palette,
        complexity: args.complexity,
        speed: args.speed,
        loopable: args.loopable,
        resolution: args.resolution,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_generative_art_loop failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, style: args.style, complexity: args.complexity, loopable: args.loopable, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_generative_art_loop failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 22: create_retro_synthwave_scene
 * ------------------------------------------------------------------ */
server.tool(
  "create_retro_synthwave_scene",
  "Build a complete retro synthwave / outrun aesthetic scene from scratch in After Effects. " +
    "No plugins, no stock footage, no external assets. Includes: animated perspective floor grid, " +
    "striped retrowave sun, mountain silhouettes, star field, horizon glow line, neon title text " +
    "with Starglow sparkle, subtitle, full VHS tape degradation (tracking error bars, chroma " +
    "bleed, noise, timestamp), CRT scanlines, optional glitch hits, film grain, cinematic grade. " +
    "All built from shape layers + expressions + fractal noise.",
  createRetroSynthwaveSceneSchema,
  async (args: CreateRetroSynthwaveSceneInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateRetroSynthwaveSceneJsx({
        outputAepPath: args.outputAepPath,
        sceneElements: args.sceneElements,
        primaryColor: args.primaryColor as number[],
        secondaryColor: args.secondaryColor as number[],
        gridColor: args.gridColor as number[],
        titleText: args.titleText,
        subtitleText: args.subtitleText,
        gridSpeed: args.gridSpeed,
        sunStripes: args.sunStripes,
        addVHSEffect: args.addVHSEffect,
        addGlitch: args.addGlitch,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`create_retro_synthwave_scene failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, sceneElements: args.sceneElements, vhsEffect: args.addVHSEffect, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`create_retro_synthwave_scene failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 23: build_reel_template
 * ------------------------------------------------------------------ */
server.tool(
  "build_reel_template",
  "Build an editable Instagram Reel template with a hook animation, BPM-synced music beat " +
    "markers, CTA cards, safe-area guide layer, and a 9:16 export-ready composition.",
  buildReelTemplateSchema,
  async (args: BuildReelTemplateInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateReelTemplateJsx({
        outputAepPath: args.outputAepPath,
        brandName: args.brandName,
        hookText: args.hookText,
        ctaTexts: args.ctaTexts,
        musicBpm: args.musicBpm,
        palette: args.palette,
        includeSafeGuides: args.includeSafeGuides,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_reel_template failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, format: "9:16", musicBpm: args.musicBpm, ctaCards: args.ctaTexts.length, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_reel_template failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 24: create_tiktok_transition_pack
 * ------------------------------------------------------------------ */
server.tool(
  "create_tiktok_transition_pack",
  "Create a TikTok transition pack with ten editable vertical transition comps: zoom blur, " +
    "spin, glitch cut, whip pan, seamless morph, flash pop, RGB split, speed ramp, slice wipe, " +
    "and shake cut. Each comp contains replaceable source layers and a cut-point marker.",
  createTiktokTransitionPackSchema,
  async (args: CreateTiktokTransitionPackInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateTiktokTransitionPackJsx({
        outputAepPath: args.outputAepPath,
        transitions: args.transitions,
        palette: args.palette,
        transitionDuration: args.transitionDuration,
        fps: args.fps,
        width: args.width,
        height: args.height,
        compPrefix: args.compPrefix,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`create_tiktok_transition_pack failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, transitionCount: args.transitions.length, transitions: args.transitions, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`create_tiktok_transition_pack failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 25: build_youtube_package
 * ------------------------------------------------------------------ */
server.tool(
  "build_youtube_package",
  "Build a YouTube channel motion package from scratch: intro, outro, end screen, subscribe " +
    "animation, and a lower-third set. All layers are editable text/shape layers.",
  buildYoutubePackageSchema,
  async (args: BuildYoutubePackageInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateYoutubePackageJsx({
        outputAepPath: args.outputAepPath,
        channelName: args.channelName,
        tagline: args.tagline,
        lowerThirdNames: args.lowerThirdNames,
        palette: args.palette,
        style: args.style,
        fps: args.fps,
        width: args.width,
        height: args.height,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_youtube_package failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, channelName: args.channelName, lowerThirdCount: args.lowerThirdNames.length, packageComps: ["YT_Intro_Logo_05s", "YT_Outro_08s", "YT_End_Screen_20s", "YT_Subscribe_Animation_04s"], aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_youtube_package failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 26: build_aurora_borealis
 * ------------------------------------------------------------------ */
server.tool(
  "build_aurora_borealis",
  "Build a fully procedural northern-lights scene using wave warp, fractal noise, polar " +
    "coordinates, animated color transitions, stars, and optional icy reflection.",
  buildAuroraBorealisSchema,
  async (args: BuildAuroraBorealisInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateAuroraBorealisJsx({
        outputAepPath: args.outputAepPath,
        palette: args.palette,
        waveIntensity: args.waveIntensity,
        noiseScale: args.noiseScale,
        bandCount: args.bandCount,
        addStars: args.addStars,
        addReflection: args.addReflection,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_aurora_borealis failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, bandCount: args.bandCount, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_aurora_borealis failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 27: build_fire_tornado
 * ------------------------------------------------------------------ */
server.tool(
  "build_fire_tornado",
  "Build a procedural fire tornado composite: fire core, spiral distortion, turbulent " +
    "displacement, ember particle drift, optional smoke, and cinematic grade.",
  buildFireTornadoSchema,
  async (args: BuildFireTornadoInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateFireTornadoJsx({
        outputAepPath: args.outputAepPath,
        intensity: args.intensity,
        flameColor: args.flameColor as number[],
        coreColor: args.coreColor as number[],
        particleDrift: args.particleDrift,
        addSmoke: args.addSmoke,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_fire_tornado failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, intensity: args.intensity, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_fire_tornado failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 28: build_ocean_waves
 * ------------------------------------------------------------------ */
server.tool(
  "build_ocean_waves",
  "Build realistic procedural ocean waves using layered wave warp, depth shadow, spray " +
    "particles and foam bands. No footage or external assets required.",
  buildOceanWavesSchema,
  async (args: BuildOceanWavesInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateOceanWavesJsx({
        outputAepPath: args.outputAepPath,
        waterColor: args.waterColor as number[],
        foamColor: args.foamColor as number[],
        waveHeight: args.waveHeight,
        sprayAmount: args.sprayAmount,
        addDepthShadow: args.addDepthShadow,
        width: args.width,
        height: args.height,
        duration: args.duration,
        fps: args.fps,
        compName: args.compName,
      });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_ocean_waves failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, waveHeight: args.waveHeight, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_ocean_waves failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool 29: build_audio_spectrum_visualizer
 * ------------------------------------------------------------------ */
server.tool(
  "build_audio_spectrum_visualizer",
  "Build an editable audio-reactive visualizer comp: frequency bars, mirrored bars, waveform, circular waveform, radial spectrum, or particle field. The generated expressions target a named audio layer.",
  buildAudioSpectrumVisualizerSchema,
  async (args: BuildAudioSpectrumVisualizerInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateAudioSpectrumVisualizerJsx(args as any);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_audio_spectrum_visualizer failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, style: args.style, audioLayerName: args.audioLayerName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_audio_spectrum_visualizer failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_infographic_animation",
  "Build animated business infographics: bar, horizontal bar, pie, donut, line graph, counter, progress ring, or comparison chart with editable labels and data-driven animation.",
  buildInfographicAnimationSchema,
  async (args: BuildInfographicAnimationInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateInfographicAnimationJsx(args as any);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_infographic_animation failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, chartType: args.chartType, dataPoints: args.data.length, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_infographic_animation failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_lower_third",
  "Build broadcast-quality lower-third graphics with name/title, ticker/news variants, live-style color themes, and optional multi-speaker variant comps.",
  buildLowerThirdSchema,
  async (args: BuildLowerThirdInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLowerThirdJsx(args as any);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_lower_third failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, style: args.style, variants: args.generateVariants, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_lower_third failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_logo_sting",
  "Build a 3-5 second professional logo sting from editable text: particle reveal, explosion, elegant light sweep, glitch, neon, corporate, film, or minimal.",
  buildLogoStingSchema,
  async (args: BuildLogoStingInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLogoStingJsx(args as any);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_logo_sting failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, logoText: args.logoText, style: args.style, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_logo_sting failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_galaxy_scene",
  "Build a procedural galaxy or nebula scene from AE shape/effect layers: spiral galaxy, barred spiral, nebula, cluster, or collision with stars, bloom, and optional camera drift.",
  buildGalaxySceneSchema,
  async (args: BuildGalaxySceneInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateGalaxySceneJsx(args as any), log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_galaxy_scene failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, galaxyType: args.galaxyType, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_galaxy_scene failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_3d_cityscape",
  "Build a procedural 3D cityscape from shape-layer buildings, window lights, camera fly-through, fog, rain, and reflections. No external assets.",
  build3dCityscapeSchema,
  async (args: Build3dCityscapeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generate3dCityscapeJsx(args as any), log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_3d_cityscape failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, buildingCount: args.buildingCount, cameraMove: args.cameraMove, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_3d_cityscape failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_dna_helix",
  "Build an expression-driven rotating DNA helix with 3D strand nodes, base-pair connectors, glow, camera angle, and optional scientific styling.",
  buildDnaHelixSchema,
  async (args: BuildDnaHelixInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateDnaHelixJsx(args as any), log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_dna_helix failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, helixTurns: args.helixTurns, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_dna_helix failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_countdown_timer",
  "Build a digital, analog, film-leader, neon, flip-clock, or minimal countdown timer with optional progress ring and end flash/explosion.",
  buildCountdownTimerSchema,
  async (args: BuildCountdownTimerInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateCountdownTimerJsx(args as any), log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_countdown_timer failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, countdownFrom: args.countdownFrom, style: args.style, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_countdown_timer failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_text_morph",
  "Build a liquid/glitch/particle-style text morph sequence between supplied words using editable text layers, opacity/scale timing, glow, and distortion.",
  buildTextMorphSchema,
  async (args: BuildTextMorphInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateTextMorphJsx(args as any), log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_text_morph failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, words: args.words, morphStyle: args.morphStyle, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_text_morph failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "create_timeline_animation",
  "Build an editable historical/product timeline animation with event dots, labels, connecting line draw-on, horizontal/vertical layouts, and corporate/creative styles.",
  createTimelineAnimationSchema,
  async (args: CreateTimelineAnimationInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateTimelineAnimationJsx(args as any), log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`create_timeline_animation failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, eventCount: args.events.length, orientation: args.orientation, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`create_timeline_animation failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "apply_lut_grade",
  "Apply a cinematic color grade to an AEP via a .cube LUT when available, or built-in curve presets, with optional vignette and grain.",
  applyLutGradeSchema,
  async (args: ApplyLutGradeInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      if (args.lutPath) await assertFile(args.lutPath, "LUT");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateApplyLutGradeJsx(args as any), log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`apply_lut_grade failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, lutPreset: args.lutPreset ?? null, lutPath: args.lutPath ?? null, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`apply_lut_grade failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "organize_ae_project",
  "Organize an AEP project: create folders, color-code layers by type, optionally add safe-zone marker layers, remove unused items, and save a clean copy.",
  organizeAeProjectSchema,
  async (args: OrganizeAeProjectInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateOrganizeAeProjectJsx(args as any), log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`organize_ae_project failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`organize_ae_project failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "batch_render_queue",
  "Add multiple comps to the After Effects render queue in one call. Useful for batch rendering deliverables from a single AEP.",
  batchRenderQueueSchema,
  async (args: BatchRenderQueueInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      const result = await runJsx(generateBatchRenderQueueJsx(args as any), log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`batch_render_queue failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, output: result.output, requested: args.renderAllComps ? "all comps" : args.renders.map((r) => r.compName), aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`batch_render_queue failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "export_as_lottie",
  "Prepare or run a Bodymovin/Lottie export for a comp. If direct Bodymovin scripting is unavailable, opens/prepares the Bodymovin workflow and marks the target JSON path.",
  exportAsLottieSchema,
  async (args: ExportAsLottieInput) => {
    const log = new OpLog();
    try {
      await assertFile(args.aepPath, "AEP");
      await ensureDir(path.dirname(args.outputJsonPath));
      const result = await runJsx(generateExportAsLottieJsx(args), log, { timeoutMs: 1000 * 60 * 3 });
      if (!result.ok) return errorResult(`export_as_lottie failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputJsonPath: args.outputJsonPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`export_as_lottie failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_world_map",
  "Build a procedural world map animation with animated connection arcs, highlighted points, labels, glow, and dark-tech/minimal styling.",
  buildWorldMapSchema,
  async (args: BuildWorldMapInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateWorldMapJsx(args as any), log, { timeoutMs: 1000 * 60 * 4 });
      if (!result.ok) return errorResult(`build_world_map failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, pointCount: args.connectionPoints?.length ?? 0, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_world_map failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_template_from_brandkit",
  "Build a reusable After Effects motion template package from a brand kit: intro, outro, lower-third, title-card, CTA, social story, and end-screen comps using supplied colors, fonts, logo text, and tone.",
  buildTemplateFromBrandkitSchema,
  async (args: BuildTemplateFromBrandkitInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateTemplateFromBrandkitJsx(args as any), log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_template_from_brandkit failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        brandName: args.brandName,
        deliverables: args.deliverables,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`build_template_from_brandkit failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_product_mockup_scene",
  "Build a procedural product mockup hero scene with no external assets: phone, laptop, tablet, box, bottle, can, card, app-screen, or packaging, plus camera motion, shine, and callouts.",
  buildProductMockupSceneSchema,
  async (args: BuildProductMockupSceneInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const result = await runJsx(generateProductMockupSceneJsx(args as any), log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_product_mockup_scene failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        productName: args.productName,
        productType: args.productType,
        style: args.style,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`build_product_mockup_scene failed: ${(e as Error).message}`, log);
    }
  }
);

const unityVfxToolDefs: Array<{ name: UnityVfxToolKind; description: string; schema: any }> = [
  {
    name: "build_unity_vfx_spritesheet",
    description: "Create Unity-ready sprite-sheet metadata, import settings, material/prefab stubs, and flipbook grid guidance for a rendered VFX sheet.",
    schema: buildUnityVfxSpritesheetSchema,
  },
  {
    name: "build_unity_vfx_prefab_package",
    description: "Create a complete Unity VFX prefab package scaffold: Textures, Materials, Prefabs, Scripts, VFXGraph, ShaderGraph, manifest, and README.",
    schema: buildUnityVfxPrefabPackageSchema,
  },
  {
    name: "build_vfx_graph_template",
    description: "Create a Unity VFX Graph template plan with spawn/init/update/output contexts, flipbook player settings, and recommended exposed properties.",
    schema: buildVfxGraphTemplateSchema,
  },
  {
    name: "build_urp_particle_materials",
    description: "Create URP particle material stubs for additive, alpha blend, soft particle, distortion, and flipbook workflows.",
    schema: buildUrpParticleMaterialsSchema,
  },
  {
    name: "build_hit_impact_pack",
    description: "Create a Unity impact VFX pack plan for bullet, magic, slash, shield, ground, and spark burst impacts.",
    schema: buildHitImpactPackSchema,
  },
  {
    name: "build_elemental_spell_pack",
    description: "Create a Unity elemental spell VFX library scaffold covering fire, ice, lightning, poison, holy, dark, and arcane effects.",
    schema: buildElementalSpellPackSchema,
  },
  {
    name: "build_projectile_vfx",
    description: "Create a projectile VFX package with cast/muzzle, trail, impact, and linger phase metadata for Unity prefabs.",
    schema: buildProjectileVfxSchema,
  },
  {
    name: "build_character_status_effects",
    description: "Create attachable character status VFX package scaffolds for heal, poison, burn, freeze, stun, shield, rage, and invisibility.",
    schema: buildCharacterStatusEffectsSchema,
  },
  {
    name: "export_unity_flipbook_manifest",
    description: "Export a Unity flipbook manifest with frame grid, FPS, duration, loop mode, pivot, blend mode, and import settings.",
    schema: exportUnityFlipbookManifestSchema,
  },
  {
    name: "build_unity_shadergraph_stub",
    description: "Create Shader Graph stub JSON for dissolve, fresnel, rim glow, distortion, and flipbook UV workflows.",
    schema: buildUnityShadergraphStubSchema,
  },
  {
    name: "build_vfx_lod_variants",
    description: "Create high/medium/low/mobile LOD variant metadata for Unity VFX textures, particles, and frame counts.",
    schema: buildVfxLodVariantsSchema,
  },
  {
    name: "build_mobile_vfx_optimizer",
    description: "Create a mobile VFX optimization report and package settings for overdraw, texture memory, frame count, and particle budgets.",
    schema: buildMobileVfxOptimizerSchema,
  },
  {
    name: "build_vfx_collision_variants",
    description: "Create collision-surface variants for ground, wall, air, water, metal, and organic impact VFX.",
    schema: buildVfxCollisionVariantsSchema,
  },
  {
    name: "build_unity_import_settings",
    description: "Create Unity texture import setting recommendations for VFX flipbooks and PNG sequences.",
    schema: buildUnityImportSettingsSchema,
  },
  {
    name: "build_rpg_spell_library",
    description: "Create an RPG spell VFX library scaffold with cast circle, projectile, impact, buff, debuff, and area effect structure.",
    schema: buildRpgSpellLibrarySchema,
  },
  {
    name: "build_fps_muzzle_impact_pack",
    description: "Create FPS VFX package scaffolds for muzzle flash, tracer, bullet impact, smoke puff, and shell spark effects.",
    schema: buildFpsMuzzleImpactPackSchema,
  },
  {
    name: "build_moba_skill_vfx",
    description: "Create MOBA skill VFX package metadata for telegraph, cast, projectile/area, impact, lingering zone, and cooldown icon support.",
    schema: buildMobaSkillVfxSchema,
  },
  {
    name: "build_platformer_pickup_vfx",
    description: "Create platformer VFX package scaffolds for pickup, checkpoint, jump dust, landing puff, dash trail, and death effects.",
    schema: buildPlatformerPickupVfxSchema,
  },
  {
    name: "build_horror_game_atmospherics",
    description: "Create horror game atmospheric VFX scaffolds for fog pulse, ghost distortion, flicker, blood mist, cursed aura, and screen shock.",
    schema: buildHorrorGameAtmosphericsSchema,
  },
  {
    name: "plan_unity_vfx_from_prompt",
    description: "Analyze a Unity VFX prompt and write a production plan with effect type, phases, render targets, budget, and Unity integration notes.",
    schema: planUnityVfxFromPromptSchema,
  },
  {
    name: "build_vfx_combo_from_prompt",
    description: "Create a combined prompt-to-Unity package: production plan, spritesheet manifest, material/prefab stubs, VFX Graph stub, and README.",
    schema: buildVfxComboFromPromptSchema,
  },
  {
    name: "validate_unity_vfx_budget",
    description: "Validate a Unity VFX budget estimate for texture memory, overdraw risk, particle count, target platform, and optimization actions.",
    schema: validateUnityVfxBudgetSchema,
  },
  {
    name: "build_vfx_preview_scene",
    description: "Create a Unity preview-scene scaffold with effect spawner script, prefab placeholder, camera/lighting guidance, and loop testing metadata.",
    schema: buildVfxPreviewSceneSchema,
  },
  {
    name: "build_vfx_timing_sheet",
    description: "Create a frame-accurate VFX timing sheet for anticipation, flash, peak, decay, and linger phases.",
    schema: buildVfxTimingSheetSchema,
  },
  {
    name: "build_premium_vfx_atlas_pack",
    description: "Create an asset-store-style premium VFX atlas package with controlled variants, atlas metadata, import settings, and Unity prefab/material scaffolds.",
    schema: buildPremiumVfxAtlasPackSchema,
  },
  {
    name: "build_layered_vfx_passes",
    description: "Create a layered VFX pass package splitting core, glow, smoke, sparks, distortion, debris, and light passes for premium Unity compositing.",
    schema: buildLayeredVfxPassesSchema,
  },
  {
    name: "build_flipbook_normal_distortion",
    description: "Create a flipbook package plan for color, normal, distortion, flowmap, and emissive maps with Shader Graph integration notes.",
    schema: buildFlipbookNormalDistortionSchema,
  },
  {
    name: "build_vfx_variation_generator",
    description: "Create controlled VFX variation metadata for color, scale, timing, shape, noise seed, and atlas naming.",
    schema: buildVfxVariationGeneratorSchema,
  },
  {
    name: "build_combat_vfx_bundle",
    description: "Create a premium combat VFX bundle scaffold: slash, hit, crit, block, parry, dash, charge, ultimate, and ground crack.",
    schema: buildCombatVfxBundleSchema,
  },
  {
    name: "build_magic_school_bundle",
    description: "Create a magic school VFX bundle scaffold for fire, frost, lightning, arcane, nature, and dark schools.",
    schema: buildMagicSchoolBundleSchema,
  },
  {
    name: "build_shader_driven_vfx_pack",
    description: "Create a Shader Graph driven Unity VFX pack for dissolve, fresnel aura, scrolling noise, refraction, heat haze, and UV distortion.",
    schema: buildShaderDrivenVfxPackSchema,
  },
  {
    name: "build_mesh_based_vfx_primitives",
    description: "Create mesh-based VFX primitive scaffolds: ring, cone, arc, slash mesh, shockwave disk, beam strip, and trail ribbon.",
    schema: buildMeshBasedVfxPrimitivesSchema,
  },
  {
    name: "build_trail_renderer_pack",
    description: "Create a Unity Trail Renderer package for weapon, dash, projectile, and ribbon trails with material and prefab stubs.",
    schema: buildTrailRendererPackSchema,
  },
  {
    name: "build_decal_impact_pack",
    description: "Create a decal impact VFX pack for scorch, magic rune, bullet hole, crack, blood splat, ice mark, and poison puddle decals.",
    schema: buildDecalImpactPackSchema,
  },
  {
    name: "build_screen_space_vfx",
    description: "Create screen-space VFX package metadata for damage vignette, low-health pulse, hit flash, speed lines, radial blur, and shock distortion.",
    schema: buildScreenSpaceVfxSchema,
  },
  {
    name: "build_asset_store_vfx_package",
    description: "Create a full asset-store-style Unity VFX package scaffold with demo scene, prefabs, thumbnails, docs, pack index, and URP/HDRP notes.",
    schema: buildAssetStoreVfxPackageSchema,
  },
  {
    name: "build_demo_scene_gallery",
    description: "Create a demo scene gallery scaffold with effect stations, spawner script, loop/one-shot testing metadata, and catalog docs.",
    schema: buildDemoSceneGallerySchema,
  },
  {
    name: "build_vfx_thumbnail_sheet",
    description: "Create thumbnail/contact-sheet metadata and marketplace preview scaffolding for a Unity VFX pack.",
    schema: buildVfxThumbnailSheetSchema,
  },
  {
    name: "build_vfx_documentation_pack",
    description: "Create a documentation pack covering setup, import settings, performance notes, customization, and color-change guide.",
    schema: buildVfxDocumentationPackSchema,
  },
  {
    name: "build_vfx_pack_index",
    description: "Create a searchable VFX pack index in JSON/Markdown with categories, prefab paths, budget table, loopability, and mobile-safe flags.",
    schema: buildVfxPackIndexSchema,
  },
  {
    name: "score_vfx_asset_quality",
    description: "Score a VFX asset/package against premium criteria: silhouette, timing, readability, overdraw, color separation, and loop quality.",
    schema: scoreVfxAssetQualitySchema,
  },
  {
    name: "build_vfx_performance_profiles",
    description: "Create mobile/desktop/console VFX performance profiles with texture sizes, particle budgets, frame counts, and shader complexity notes.",
    schema: buildVfxPerformanceProfilesSchema,
  },
  {
    name: "audit_vfx_overdraw",
    description: "Create an overdraw audit report for Unity VFX based on alpha area, blend mode, particle density, screen coverage, and platform budget.",
    schema: auditVfxOverdrawSchema,
  },
  {
    name: "build_vfx_lifetime_curves",
    description: "Create Unity lifetime curve presets for size, alpha, emission burst, velocity dampening, and color over life.",
    schema: buildVfxLifetimeCurvesSchema,
  },
  {
    name: "build_vfx_color_ramps",
    description: "Create color ramp/palette metadata for fire, ice, poison, holy, dark, and sci-fi Unity VFX looks.",
    schema: buildVfxColorRampsSchema,
  },
  {
    name: "render_vfx_flipbook_from_ae",
    description: "Create an AE-to-Unity flipbook render package with aerender command templates, PNG sequence targets, alpha settings, and next-step atlas metadata.",
    schema: renderVfxFlipbookFromAeSchema,
  },
  {
    name: "pack_flipbook_atlas",
    description: "Create flipbook atlas packing metadata for PNG sequences: trim, padding, sprite grid, pivot, and Unity texture-sheet animation settings.",
    schema: packFlipbookAtlasSchema,
  },
  {
    name: "generate_vfx_preview_gif_mp4",
    description: "Create marketplace preview media pipeline metadata for GIF/MP4 output, timing, contact sheet, and preview render targets.",
    schema: generateVfxPreviewGifMp4Schema,
  },
  {
    name: "render_vfx_thumbnail_contact_sheet",
    description: "Create thumbnail/contact-sheet render metadata for VFX marketplace presentation and pack browsing.",
    schema: renderVfxThumbnailContactSheetSchema,
  },
  {
    name: "auto_crop_alpha_frames",
    description: "Create alpha-frame auto-crop QC metadata for trimming transparent bounds, reducing overdraw, and adjusting pivot/bounds.",
    schema: autoCropAlphaFramesSchema,
  },
  {
    name: "normalize_flipbook_brightness_alpha",
    description: "Create brightness/alpha normalization QC metadata to detect flicker and stabilize flipbook frame intensity.",
    schema: normalizeFlipbookBrightnessAlphaSchema,
  },
  {
    name: "validate_loop_seam",
    description: "Create loop seam validation metadata comparing first/last frame quality and recommending seamless-loop fixes.",
    schema: validateLoopSeamSchema,
  },
  {
    name: "generate_real_unity_prefabs",
    description: "Create Unity prefab generation scaffolds for real Particle System/VFX Graph prefabs, materials, texture-sheet animation, and export scripts.",
    schema: generateRealUnityPrefabsSchema,
  },
  {
    name: "generate_vfx_graph_asset",
    description: "Create Unity VFX Graph asset scaffolds with graph contexts, blackboard properties, flipbook blocks, and pipeline notes.",
    schema: generateVfxGraphAssetSchema,
  },
  {
    name: "generate_shadergraph_asset",
    description: "Create Shader Graph asset scaffolds for flipbook, fresnel, dissolve, distortion, flowmap, and emissive VFX shaders.",
    schema: generateShadergraphAssetSchema,
  },
  {
    name: "create_unity_demo_project",
    description: "Create a minimal Unity demo project scaffold with Assets, Packages, ProjectSettings, demo scene placeholder, and VFX preview spawner.",
    schema: createUnityDemoProjectSchema,
  },
  {
    name: "create_unity_package_export",
    description: "Create Unity export script and package metadata to export generated VFX folders as a .unitypackage.",
    schema: createUnityPackageExportSchema,
  },
  {
    name: "build_marketplace_media_pack",
    description: "Create marketplace media pack scaffolds for cover image, thumbnails, feature banners, preview GIF/MP4 targets, and media plan.",
    schema: buildMarketplaceMediaPackSchema,
  },
  {
    name: "write_asset_store_description",
    description: "Write Unity Asset Store style description, feature list, compatibility notes, pipeline notes, and included-content summary.",
    schema: writeAssetStoreDescriptionSchema,
  },
  {
    name: "generate_pack_trailer_storyboard",
    description: "Create a trailer storyboard for a VFX pack: shots, timing, camera moves, demo gallery moments, customization, and CTA.",
    schema: generatePackTrailerStoryboardSchema,
  },
  {
    name: "build_demo_gallery_ui",
    description: "Create Unity demo gallery UI scaffolding with dropdown, next/previous, replay, slow-motion toggle, and category filtering.",
    schema: buildDemoGalleryUiSchema,
  },
  {
    name: "analyze_flipbook_silhouette",
    description: "Create flipbook silhouette/readability QC metadata and premium asset quality recommendations.",
    schema: analyzeFlipbookSilhouetteSchema,
  },
  {
    name: "detect_alpha_bleeding_edges",
    description: "Create alpha edge and premultiply QC metadata for detecting bleed, halos, and import-setting fixes.",
    schema: detectAlphaBleedingEdgesSchema,
  },
  {
    name: "estimate_texture_memory_budget",
    description: "Estimate Unity VFX texture memory budget from flipbook size, grid, mipmaps, and target platform.",
    schema: estimateTextureMemoryBudgetSchema,
  },
  {
    name: "compare_lod_visual_loss",
    description: "Create LOD visual-loss comparison metadata for high/medium/low VFX textures, frames, and quality tradeoffs.",
    schema: compareLodVisualLossSchema,
  },
  {
    name: "validate_mobile_vfx_pack",
    description: "Create a mobile VFX validation report for texture size, overdraw, particle count, shader complexity, and pass/fail recommendations.",
    schema: validateMobileVfxPackSchema,
  },
];

for (const def of unityVfxToolDefs) {
  server.tool(def.name, def.description, def.schema, async (args: any) => {
    const log = new OpLog();
    try {
      const result = await createUnityVfxToolkitPackage(def.name, args);
      log.info(`Created Unity VFX toolkit package: ${result.outputFolder}`);
      return textResult({ ok: true, ...result, log: log.all });
    } catch (e) {
      return errorResult(`${def.name} failed: ${(e as Error).message}`, log);
    }
  });
}

  return server;
}

/* ------------------------------------------------------------------ */
async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("motionpilot-ae-mcp running on stdio\n");
}

// Only auto-launch the stdio transport when this file is run directly
// (e.g. `node dist/index.js`). When imported by `http.ts`, do nothing.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((e) => {
    process.stderr.write(`Fatal: ${(e as Error).stack ?? e}\n`);
    process.exit(1);
  });
}
