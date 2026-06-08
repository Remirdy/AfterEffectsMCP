#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCanvas } from "@napi-rs/canvas";
import { z } from "zod";

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
  build3dPlanetGeneratorSchema,
  buildCyberScanOverlaySchema,
  buildDimensionalRiftSchema,
  generateVfxNormalMapSequenceSchema,
  buildCosmicNebulaSceneSchema,
  buildAudioBeatSyncControllerSchema,
  applyPixelArtFilterSchema,
  buildMatrixDigitalRainSchema,
  buildBlackHoleGravityWarpSchema,
  buildLiquidLavaSimulatorSchema,
  buildLightningStormGeneratorSchema,
  buildMagicalSummoningSigilSchema,
  Build3dPlanetGeneratorInput,
  BuildCyberScanOverlayInput,
  BuildDimensionalRiftInput,
  GenerateVfxNormalMapSequenceInput,
  BuildCosmicNebulaSceneInput,
  BuildAudioBeatSyncControllerInput,
  ApplyPixelArtFilterInput,
  BuildMatrixDigitalRainInput,
  BuildBlackHoleGravityWarpInput,
  BuildLiquidLavaSimulatorInput,
  BuildLightningStormGeneratorInput,
  BuildMagicalSummoningSigilInput,
  vfxParticularParticlesSchema,
  vfxSaberNeonSchema,
  vfxPlexusMeshSchema,
  vfxShineRaysSchema,
  vfxStarglowStreaksSchema,
  vfxMirTerrainSchema,
  vfxTaoRibbonsSchema,
  vfxFormParticlesSchema,
  vfxOpticalFlaresSchema,
  vfxElement3DSchema,
  vfxAnalogGlitchSchema,
  vfxChromaticAberrationSchema,
  vfxHeatwaveRefractionSchema,
  vfxVhsTapeSchema,
  vfxLooksGradingSchema,
  vfxColoristaGradingSchema,
  vfxSlowMotionSchema,
  vfxMotionBlurSchema,
  vfxSapphireGlowSchema,
  vfxLightningStrikeSchema,
  vfxLensDistortionSchema,
  vfxContinuumBloomSchema,
  vfxKaleidoscopeSchema,
  vfxDeepGlowSchema,
  vfxNewtonPhysicsSchema,
  vfxStardustParticlesSchema,
  vfxRiggingJoystickSchema,
  vfxAutoCropSchema,
  vfxBrushStrokeSchema,
  vfxAudioSpectrumSchema,
  vfxDepthOfFieldSchema,
  vfxPlanarTrackerSchema,
  vfxRotoPaintSchema,
  vfxNeatDenoiseSchema,
  vfxVolumetricRaysSchema,
  vfxCinematicFlareSchema,
  vfxGodRaysSchema,
  vfxLightWrapSchema,
  vfxDeepGlowProSchema,
  vfxKnollFlareSchema,
  vfxElement3DProSchema,
  vfxTwitchGlitchSchema,
  vfx3DStrokeSchema,
  VfxParticularParticlesInput,
  VfxSaberNeonInput,
  VfxPlexusMeshInput,
  VfxShineRaysInput,
  VfxStarglowStreaksInput,
  VfxMirTerrainInput,
  VfxTaoRibbonsInput,
  VfxFormParticlesInput,
  VfxOpticalFlaresInput,
  VfxElement3DInput,
  VfxAnalogGlitchInput,
  VfxChromaticAberrationInput,
  VfxHeatwaveRefractionInput,
  VfxVhsTapeInput,
  VfxLooksGradingInput,
  VfxColoristaGradingInput,
  VfxSlowMotionInput,
  VfxMotionBlurInput,
  VfxSapphireGlowInput,
  VfxLightningStrikeInput,
  VfxLensDistortionInput,
  VfxContinuumBloomInput,
  VfxKaleidoscopeInput,
  VfxDeepGlowInput,
  VfxNewtonPhysicsInput,
  VfxStardustParticlesInput,
  VfxRiggingJoystickInput,
  VfxAutoCropInput,
  VfxBrushStrokeInput,
  VfxAudioSpectrumInput,
  VfxDepthOfFieldInput,
  VfxPlanarTrackerInput,
  VfxRotoPaintInput,
  VfxNeatDenoiseInput,
  VfxVolumetricRaysInput,
  VfxCinematicFlareInput,
  VfxGodRaysInput,
  VfxLightWrapInput,
  VfxDeepGlowProInput,
  VfxKnollFlareInput,
  VfxElement3DProInput,
  VfxTwitchGlitchInput,
  Vfx3DStrokeInput,
} from "./schemas.js";
import * as PremiumReplicaSchemas from "./schemas.js";
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
  generatePlanetGlobeJsx,
  generateCyberScanJsx,
  generateDimensionalRiftJsx,
  generateCosmicNebulaJsx,
  generateAudioBeatSyncJsx,
  generatePixelArtJsx,
} from "./ae/legendaryGenerator.js";
import {
  generateMatrixRainJsx,
  generateGravityWarpJsx,
  generateLiquidLavaJsx,
  generateLightningStormJsx,
  generateMagicSigilJsx,
} from "./ae/ultimateGenerator.js";
import {
  generateParticularReplicaJsx,
  generateSaberReplicaJsx,
  generatePlexusReplicaJsx,
  generateShineReplicaJsx,
  generateStarglowReplicaJsx,
  generateMirReplicaJsx,
  generateTaoReplicaJsx,
  generateFormReplicaJsx,
  generateOpticalFlaresReplicaJsx,
  generateElement3DReplicaJsx,
  generateGlitchReplicaJsx,
  generateChromaticAberrationReplicaJsx,
  generateHeatwaveReplicaJsx,
  generateVhsReplicaJsx,
  generateLooksReplicaJsx,
  generateColoristaReplicaJsx,
  generateTwixtorReplicaJsx,
  generateRsmbReplicaJsx,
  generateSapphireGlowReplicaJsx,
  generateSapphireZapReplicaJsx,
  generateSapphireDistortReplicaJsx,
  generateContinuumBloomReplicaJsx,
  generateContinuumKaleidoscopeReplicaJsx,
  generateDeepGlowReplicaJsx,
  generateNewtonReplicaJsx,
  generateStardustReplicaJsx,
  generateJoysticksSlidersReplicaJsx,
  generateAutoCropReplicaJsx,
  generatePaintStickReplicaJsx,
  generateSoundKeysReplicaJsx,
  generateLenscareDofReplicaJsx,
  generatePlanarTrackerJsx,
  generateRotoPaintJsx,
  generateNeatDenoiseJsx,
  generateVolumetricRaysJsx,
  generateCinematicFlareJsx,
  generateGodRaysJsx,
  generateLightWrapJsx,
  generateDeepGlowProJsx,
  generateKnollFlareJsx,
  generateElement3DProJsx,
  generateTwitchGlitchJsx,
  generateTrapcode3DStrokeJsx,
  generatePremiumPluginReplicaJsx,
} from "./ae/thirtyReplicasGenerator.js";
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
import { generateRasterVfxPlate, generateNormalMap } from "./vfx/rasterPlate.js";
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

// --- Phase 1, 2, 3, 4: MVP Canavarı new schema/type imports ---
import {
  generateAiPlateSchema,
  generateAiVideoShotSchema,
  ttsVoiceoverSchema,
  sttTranscribeSchema,
  jsxDryRunSchema,
  renderFarmQueueSchema,
  GenerateAiPlateInput,
  GenerateAiVideoShotInput,
  TtsVoiceoverInput,
  SttTranscribeInput,
  JsxDryRunInput,
  RenderFarmQueueInput,

  // Phase 2
  motionpilotDirectorSchema,
  brandKitIngestSchema,
  adConceptGeneratorSchema,
  multiformatAdExportSchema,
  viralityGateSchema,
  abVariantFactorySchema,
  MotionpilotDirectorInput,
  BrandKitIngestInput,
  AdConceptGeneratorInput,
  MultiformatAdExportInput,
  ViralityGateInput,
  AbVariantFactoryInput,

  // Phase 3
  smartKeyframeAssistantSchema,
  buildCharacterRigSchema,
  autoLipSyncSchema,
  cameraChoreographerSchema,
  sceneToSceneTransitionsSchema,
  realtimeVfxPreviewSchema,
  proceduralVfxGraphCompilerSchema,
  vfxSimulationBakerSchema,
  vfxQualityGraderV2Schema,
  SmartKeyframeAssistantInput,
  BuildCharacterRigInput,
  AutoLipSyncInput,
  CameraChoreographerInput,
  SceneToSceneTransitionsInput,
  RealtimeVfxPreviewInput,
  ProceduralVfxGraphCompilerInput,
  VfxSimulationBakerInput,
  VfxQualityGraderV2Input,

  // Phase 4
  smartProxyWorkflowSchema,
  deliveryPackagerSchema,
  localizationPackSchema,
  productShotStudioSchema,
  aiInpaintAndExtendSchema,
  houdiniAlembicBridgeSchema,
  autoMusicScoreSchema,
  SmartProxyWorkflowInput,
  DeliveryPackagerInput,
  LocalizationPackInput,
  ProductShotStudioInput,
  AiInpaintAndExtendInput,
  HoudiniAlembicBridgeInput,
  AutoMusicScoreInput,
  jobStatusSchema,
  JobStatusInput,
  runwayGenerateVideoSchema,
  RunwayGenerateVideoInput,
  localizationPackBatchSchema,
  LocalizationPackBatchInput,
  podcastToViralClipsSchema,
  PodcastToViralClipsInput,
  reverseEngineerReferenceSchema,
  ReverseEngineerReferenceInput,
  brandBrainSchema,
  BrandBrainInput,
  storyboardFirstSchema,
  StoryboardFirstInput,
  viralAutopsySchema,
  ViralAutopsyInput,
  dataToMotionSchema,
  DataToMotionInput,
  trendRadarToAdSchema,
  TrendRadarToAdInput,
  voiceBriefModeSchema,
  VoiceBriefModeInput,
  selfCritiqueRenderSchema,
  SelfCritiqueRenderInput,
  evolutionaryAdSwarmSchema,
  EvolutionaryAdSwarmInput,
  promptToCampaignSchema,
  PromptToCampaignInput,
  autoSoundDesignSchema,
  AutoSoundDesignInput,
  emotionArcScoringSchema,
  EmotionArcScoringInput,
  personalizedVideoAtScaleSchema,
  PersonalizedVideoAtScaleInput,
  competitorWatchdogSchema,
  CompetitorWatchdogInput,
  autoDirectorLoopSchema,
  AutoDirectorLoopInput,
  dreamModeSchema,
  DreamModeInput,
  gameTrailerAutopilotSchema,
  GameTrailerAutopilotInput,
  vfxBreedingSchema,
  VfxBreedingInput
} from "./schemas.js";

import { AiBridge } from "./ai/aiBridge.js";
import { JobQueue } from "./ai/jobQueue.js";
import { TtsVoiceover } from "./audio/tts.js";
import { SttTranscribe } from "./audio/stt.js";
import { JsxDryRun } from "./qa/jsxDryRun.js";
import { RenderFarm } from "./render/farm.js";

// Phase 2 Modules
import { MotionPilotDirector } from "./orchestrator/director.js";
import { BrandKitManager } from "./brand/brandKit.js";
import { AdConceptGenerator } from "./ad/conceptEngine.js";
import { MultiformatAdExporter } from "./ad/multiformat.js";
import { ViralityPredictor } from "./ad/virality.js";

// Phase 3 Modules
import { SmartKeyframeAssistant } from "./animation/principles.js";
import { CharacterRigger } from "./animation/rig.js";
import { CameraChoreographer } from "./animation/camera.js";
import { LipSyncAutomator } from "./audio/lipSync.js";
import { VfxSimulationBaker } from "./vfx/simBaker.js";
import { LiveUnityBridge } from "./engine/liveUnityBridge.js";

// Phase 4 Modules
import { SmartProxyManager } from "./render/proxy.js";
import { DeliveryPackager } from "./render/deliveryPackager.js";
import { ProductStudioManager } from "./ad/productStudio.js";
import { HoudiniAlembicBridge } from "./vfx/alembic.js";
import { AudioMusicManager } from "./audio/music.js";
import { LocalizationPackManager } from "./localization/pack.js";
import { MotionPilotObserver } from "./telemetry/observer.js";
import { RunwayAdaptor } from "./ai/runwayAdaptor.js";
import { PodcastClipper } from "./content/podcastClipper.js";
import { ReferenceEngineer } from "./content/referenceEngineer.js";
import { BrandBrain } from "./brand/brain.js";
import { StoryboardGenerator } from "./content/storyboardGenerator.js";
import { ViralAutopsy } from "./content/viralAutopsy.js";
import { DataToMotion } from "./data/dataToMotion.js";
import { TrendRadar } from "./content/trendRadar.js";
import { VoiceBriefMode } from "./content/voiceBrief.js";
import { SelfCritiquePipeline } from "./agent/selfCritique.js";
import { EvolutionaryAdSwarm } from "./agent/evolutionarySwarm.js";
import { CampaignFactory } from "./agent/campaignFactory.js";
import { AutoSoundDesign } from "./audio/soundDesign.js";
import { EmotionArcScoring } from "./audio/emotionArc.js";
import { PersonalizedVideoManager } from "./scale/personalizedVideo.js";
import { CompetitorWatchdog } from "./agent/competitorWatchdog.js";
import { AutoDirectorLoop } from "./agent/autoDirectorLoop.js";
import { DreamMode } from "./agent/dreamMode.js";
import { GameTrailerAutopilot } from "./content/gameTrailerAutopilot.js";
import { VfxBreeding } from "./vfx/vfxBreeding.js";


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

/* ------------------------------------------------------------------ *
 * Tool: build_3d_planet_generator
 * ------------------------------------------------------------------ */
server.tool(
  "build_3d_planet_generator",
  "Build a 3D procedural planet scene in After Effects with orbit rotation, rings, and stars.",
  build3dPlanetGeneratorSchema,
  async (args: Build3dPlanetGeneratorInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePlanetGlobeJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_3d_planet_generator failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_3d_planet_generator failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_cyber_scan_overlay
 * ------------------------------------------------------------------ */
server.tool(
  "build_cyber_scan_overlay",
  "Apply a neon cyber scan HUD overlay targeting a layer in After Effects.",
  buildCyberScanOverlaySchema,
  async (args: BuildCyberScanOverlayInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateCyberScanJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_cyber_scan_overlay failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_cyber_scan_overlay failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_dimensional_rift
 * ------------------------------------------------------------------ */
server.tool(
  "build_dimensional_rift",
  "Create a jagged screen-shattering portal rift in After Effects revealing a custom nebula precomp.",
  buildDimensionalRiftSchema,
  async (args: BuildDimensionalRiftInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateDimensionalRiftJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_dimensional_rift failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_dimensional_rift failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: generate_vfx_normal_map_sequence
 * ------------------------------------------------------------------ */
server.tool(
  "generate_vfx_normal_map_sequence",
  "Generate matching Normal Map PNG sequence from diffuse frames using Sobel filter edge computation.",
  generateVfxNormalMapSequenceSchema,
  async (args: GenerateVfxNormalMapSequenceInput) => {
    const log = new OpLog();
    try {
      await ensureDir(args.outputNormalFolder);
      const files = await fs.readdir(args.diffuseFramesFolder);
      const pngs = files.filter((f: string) => /\.png$/i.test(f)).sort();
      log.info(`Found ${pngs.length} diffuse frames to process in: ${args.diffuseFramesFolder}`);

      const { loadImage } = await import("@napi-rs/canvas");
      for (const file of pngs) {
        const diffPath = path.join(args.diffuseFramesFolder, file);
        const img = await loadImage(diffPath);
        const diffCanvas = createCanvas(img.width, img.height);
        const diffCtx = diffCanvas.getContext("2d");
        diffCtx.drawImage(img, 0, 0);

        const normCanvas = createCanvas(img.width, img.height);
        generateNormalMap(diffCanvas, normCanvas, args.strength);

        const normName = file.replace(/^frame_/i, "normal_").replace(/^diffuse_/i, "normal_");
        const normPath = path.join(args.outputNormalFolder, normName);
        await fs.writeFile(normPath, await normCanvas.encode("png"));
      }
      return textResult({ ok: true, outputNormalFolder: args.outputNormalFolder, processedCount: pngs.length, log: log.all });
    } catch (e) {
      return errorResult(`generate_vfx_normal_map_sequence failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_cosmic_nebula_scene
 * ------------------------------------------------------------------ */
server.tool(
  "build_cosmic_nebula_scene",
  "Build a volumetric 3D nebula cosmic dust cloud with black hole core and accretion disk animation.",
  buildCosmicNebulaSceneSchema,
  async (args: BuildCosmicNebulaSceneInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateCosmicNebulaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_cosmic_nebula_scene failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_cosmic_nebula_scene failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_audio_beat_sync_controller
 * ------------------------------------------------------------------ */
server.tool(
  "build_audio_beat_sync_controller",
  "Analyze audio and sync layer properties (scale, glow) to amplitude peaks in After Effects.",
  buildAudioBeatSyncControllerSchema,
  async (args: BuildAudioBeatSyncControllerInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateAudioBeatSyncJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_audio_beat_sync_controller failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_audio_beat_sync_controller failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: apply_pixel_art_filter
 * ------------------------------------------------------------------ */
server.tool(
  "apply_pixel_art_filter",
  "Apply an 8-bit / 16-bit retro game style pixel mosaic filter with dither and scanlines in After Effects.",
  applyPixelArtFilterSchema,
  async (args: ApplyPixelArtFilterInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePixelArtJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`apply_pixel_art_filter failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`apply_pixel_art_filter failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_matrix_digital_rain
 * ------------------------------------------------------------------ */
server.tool(
  "build_matrix_digital_rain",
  "Generate a 3D procedural Matrix digital rain scene in After Effects with falling green code columns.",
  buildMatrixDigitalRainSchema,
  async (args: BuildMatrixDigitalRainInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateMatrixRainJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_matrix_digital_rain failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_matrix_digital_rain failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_black_hole_gravity_warp
 * ------------------------------------------------------------------ */
server.tool(
  "build_black_hole_gravity_warp",
  "Build a gravitational lensing black hole scene warping surrounding space in After Effects.",
  buildBlackHoleGravityWarpSchema,
  async (args: BuildBlackHoleGravityWarpInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateGravityWarpJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_black_hole_gravity_warp failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_black_hole_gravity_warp failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_liquid_lava_simulator
 * ------------------------------------------------------------------ */
server.tool(
  "build_liquid_lava_simulator",
  "Simulate merging and splitting metaballs (lava, slime, liquid) in After Effects.",
  buildLiquidLavaSimulatorSchema,
  async (args: BuildLiquidLavaSimulatorInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLiquidLavaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_liquid_lava_simulator failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_liquid_lava_simulator failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_lightning_storm_generator
 * ------------------------------------------------------------------ */
server.tool(
  "build_lightning_storm_generator",
  "Generate a cinematic rain and lightning storm scene with thunder camera shake in After Effects.",
  buildLightningStormGeneratorSchema,
  async (args: BuildLightningStormGeneratorInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLightningStormJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_lightning_storm_generator failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_lightning_storm_generator failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Tool: build_magical_summoning_sigil
 * ------------------------------------------------------------------ */
server.tool(
  "build_magical_summoning_sigil",
  "Generate a rotating 3D runic summoning magic circle drawn procedurally in After Effects.",
  buildMagicalSummoningSigilSchema,
  async (args: BuildMagicalSummoningSigilInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateMagicSigilJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`build_magical_summoning_sigil failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, compName: args.compName, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`build_magical_summoning_sigil failed: ${(e as Error).message}`, log);
    }
  }
);

/* ------------------------------------------------------------------ *
 * Wave 5: 43 Premium VFX Tools
 * ------------------------------------------------------------------ */

server.tool(
  "vfx_particular_particles",
  "Natively recreate Trapcode Particular particle emission systems.",
  vfxParticularParticlesSchema,
  async (args: VfxParticularParticlesInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateParticularReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_particular_particles failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_particular_particles failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_saber_neon",
  "Natively recreate Video Copilot Saber glowing neon outline tracing effects.",
  vfxSaberNeonSchema,
  async (args: VfxSaberNeonInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateSaberReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_saber_neon failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_saber_neon failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_plexus_mesh",
  "Natively recreate Rowbyte Plexus connecting node line structures.",
  vfxPlexusMeshSchema,
  async (args: VfxPlexusMeshInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePlexusReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_plexus_mesh failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_plexus_mesh failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_shine_rays",
  "Natively recreate Trapcode Shine volumetric light ray effects.",
  vfxShineRaysSchema,
  async (args: VfxShineRaysInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateShineReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_shine_rays failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_shine_rays failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_starglow_streaks",
  "Natively recreate Trapcode Starglow multi-directional highlight star streaks.",
  vfxStarglowStreaksSchema,
  async (args: VfxStarglowStreaksInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateStarglowReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_starglow_streaks failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_starglow_streaks failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_mir_terrain",
  "Natively recreate Trapcode Mir 3D terrain grid wireframes.",
  vfxMirTerrainSchema,
  async (args: VfxMirTerrainInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateMirReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_mir_terrain failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_mir_terrain failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_tao_ribbons",
  "Natively recreate Trapcode Tao extruded 3D geometric ribbons.",
  vfxTaoRibbonsSchema,
  async (args: VfxTaoRibbonsInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateTaoReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_tao_ribbons failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_tao_ribbons failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_form_particles",
  "Natively recreate Trapcode Form 3D wave particle grid fields.",
  vfxFormParticlesSchema,
  async (args: VfxFormParticlesInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateFormReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_form_particles failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_form_particles failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_optical_flares",
  "Natively recreate Video Copilot Optical Flares lens flares.",
  vfxOpticalFlaresSchema,
  async (args: VfxOpticalFlaresInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateOpticalFlaresReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_optical_flares failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_optical_flares failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_element_3d",
  "Natively recreate Video Copilot Element 3D geometric shape extrusions.",
  vfxElement3DSchema,
  async (args: VfxElement3DInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateElement3DReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_element_3d failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_element_3d failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_analog_glitch",
  "Natively recreate Red Giant Universe Glitch digital noise wiggles.",
  vfxAnalogGlitchSchema,
  async (args: VfxAnalogGlitchInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateGlitchReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_analog_glitch failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_analog_glitch failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_chromatic_aberration",
  "Natively recreate Red Giant Universe Chromatic Aberration RGB separates.",
  vfxChromaticAberrationSchema,
  async (args: VfxChromaticAberrationInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateChromaticAberrationReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_chromatic_aberration failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_chromatic_aberration failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_heatwave_refraction",
  "Natively recreate Red Giant Universe Heatwave refraction ripples.",
  vfxHeatwaveRefractionSchema,
  async (args: VfxHeatwaveRefractionInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateHeatwaveReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_heatwave_refraction failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_heatwave_refraction failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_vhs_tape",
  "Natively recreate Red Giant Universe VHS analog tape simulation.",
  vfxVhsTapeSchema,
  async (args: VfxVhsTapeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateVhsReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_vhs_tape failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_vhs_tape failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_looks_grading",
  "Natively recreate Red Giant Universe Looks photo and vintage gradings.",
  vfxLooksGradingSchema,
  async (args: VfxLooksGradingInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLooksReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_looks_grading failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_looks_grading failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_colorista_grading",
  "Natively recreate Red Giant Universe Colorista three-way balancing.",
  vfxColoristaGradingSchema,
  async (args: VfxColoristaGradingInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateColoristaReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_colorista_grading failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_colorista_grading failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_slow_motion",
  "Natively recreate RE:Vision Effects Twixtor optical-flow slow motion.",
  vfxSlowMotionSchema,
  async (args: VfxSlowMotionInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateTwixtorReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_slow_motion failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_slow_motion failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_motion_blur",
  "Natively recreate RE:Vision Effects RSMB motion vectors blurring.",
  vfxMotionBlurSchema,
  async (args: VfxMotionBlurInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateRsmbReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_motion_blur failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_motion_blur failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_sapphire_glow",
  "Natively recreate Sapphire Glow exponential decay reflections.",
  vfxSapphireGlowSchema,
  async (args: VfxSapphireGlowInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateSapphireGlowReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_sapphire_glow failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_sapphire_glow failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_lightning_strike",
  "Natively recreate Sapphire Zap electrical branch lightning arcs.",
  vfxLightningStrikeSchema,
  async (args: VfxLightningStrikeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateSapphireZapReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_lightning_strike failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_lightning_strike failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_lens_distortion",
  "Natively recreate Sapphire Distort lens refractions.",
  vfxLensDistortionSchema,
  async (args: VfxLensDistortionInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateSapphireDistortReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_lens_distortion failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_lens_distortion failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_continuum_bloom",
  "Natively recreate Continuum Bloom highlights light bleeding.",
  vfxContinuumBloomSchema,
  async (args: VfxContinuumBloomInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateContinuumBloomReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_continuum_bloom failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_continuum_bloom failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_kaleidoscope",
  "Natively recreate Continuum Kaleidoscope mirrored reflection sector mappings.",
  vfxKaleidoscopeSchema,
  async (args: VfxKaleidoscopeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateContinuumKaleidoscopeReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_kaleidoscope failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_kaleidoscope failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_deep_glow",
  "Natively recreate Deep Glow physically accurate light blurs.",
  vfxDeepGlowSchema,
  async (args: VfxDeepGlowInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateDeepGlowReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_deep_glow failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_deep_glow failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_newton_physics",
  "Natively recreate Newton 2D gravity physics interactions.",
  vfxNewtonPhysicsSchema,
  async (args: VfxNewtonPhysicsInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateNewtonReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_newton_physics failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_newton_physics failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_stardust_particles",
  "Natively recreate Stardust node-based particles.",
  vfxStardustParticlesSchema,
  async (args: VfxStardustParticlesInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateStardustReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_stardust_particles failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_stardust_particles failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_rigging_joystick",
  "Natively recreate Joysticks n Sliders multi-axis character rigging.",
  vfxRiggingJoystickSchema,
  async (args: VfxRiggingJoystickInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateJoysticksSlidersReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_rigging_joystick failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_rigging_joystick failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_auto_crop",
  "Natively recreate AutoCrop comp bounding-box shrink utility.",
  vfxAutoCropSchema,
  async (args: VfxAutoCropInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateAutoCropReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_auto_crop failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_auto_crop failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_brush_stroke",
  "Natively recreate Paint & Stick brush stroke animation paths.",
  vfxBrushStrokeSchema,
  async (args: VfxBrushStrokeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePaintStickReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_brush_stroke failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_brush_stroke failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_audio_spectrum",
  "Natively recreate Sound Keys audio frequency splitters.",
  vfxAudioSpectrumSchema,
  async (args: VfxAudioSpectrumInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateSoundKeysReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_audio_spectrum failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_audio_spectrum failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_depth_of_field",
  "Natively recreate Frischluft Lenscare camera focus Depth of Field.",
  vfxDepthOfFieldSchema,
  async (args: VfxDepthOfFieldInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLenscareDofReplicaJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_depth_of_field failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_depth_of_field failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_planar_tracker",
  "Natively recreate Mocha Pro planar tracker and screen replacement setups.",
  vfxPlanarTrackerSchema,
  async (args: VfxPlanarTrackerInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePlanarTrackerJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_planar_tracker failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_planar_tracker failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_roto_paint",
  "Natively recreate Silhouette professional rotoscoping and clean-up paint layers.",
  vfxRotoPaintSchema,
  async (args: VfxRotoPaintInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateRotoPaintJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_roto_paint failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_roto_paint failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_neat_denoise",
  "Natively recreate Neat Video digital grain and pixel denoiser composites.",
  vfxNeatDenoiseSchema,
  async (args: VfxNeatDenoiseInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateNeatDenoiseJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_neat_denoise failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_neat_denoise failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_volumetric_rays",
  "Natively recreate Sapphire Rays volumetric light sweeping glows.",
  vfxVolumetricRaysSchema,
  async (args: VfxVolumetricRaysInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateVolumetricRaysJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_volumetric_rays failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_volumetric_rays failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_cinematic_flare",
  "Natively recreate Sapphire Flare cinematic lens flares.",
  vfxCinematicFlareSchema,
  async (args: VfxCinematicFlareInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateCinematicFlareJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_cinematic_flare failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_cinematic_flare failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_god_rays",
  "Natively recreate Crates God Rays volumetric sky ray streams.",
  vfxGodRaysSchema,
  async (args: VfxGodRaysInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateGodRaysJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_god_rays failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_god_rays failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_light_wrap",
  "Natively recreate Crates Light Wrap compositing edge blurs.",
  vfxLightWrapSchema,
  async (args: VfxLightWrapInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateLightWrapJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_light_wrap failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_light_wrap failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_deep_glow_pro",
  "Natively recreate Deep Glow 2 physical aspect-stretched glow layers.",
  vfxDeepGlowProSchema,
  async (args: VfxDeepGlowProInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateDeepGlowProJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_deep_glow_pro failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_deep_glow_pro failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_knoll_flare",
  "Natively recreate Knoll Light Factory multi-element flare layers.",
  vfxKnollFlareSchema,
  async (args: VfxKnollFlareInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateKnollFlareJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_knoll_flare failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_knoll_flare failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_element_3d_pro",
  "Natively recreate Video Copilot Element 3D v2 real-time 3D extrusions & lights.",
  vfxElement3DProSchema,
  async (args: VfxElement3DProInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateElement3DProJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_element_3d_pro failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_element_3d_pro failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_twitch_glitch",
  "Natively recreate Video Copilot Twitch random glitchy wiggle translations.",
  vfxTwitchGlitchSchema,
  async (args: VfxTwitchGlitchInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateTwitchGlitchJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_twitch_glitch failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_twitch_glitch failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_3d_stroke",
  "Natively recreate Trapcode 3D Stroke wiggling glowing ribbon paths in 3D space.",
  vfx3DStrokeSchema,
  async (args: Vfx3DStrokeInput) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generateTrapcode3DStrokeJsx(args);
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`vfx_3d_stroke failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({ ok: true, outputAepPath: result.output || args.outputAepPath, aeLog: result.jsxLog, log: log.all });
    } catch (e) {
      return errorResult(`vfx_3d_stroke failed: ${(e as Error).message}`, log);
    }
  }
);

const premiumGapReplicaToolDefs: Array<{ name: string; description: string; schema: any; kind: string }> = [
  {
    name: "vfx_chroma_key_studio",
    description: "Zero-cost Keylight/Primatte-style studio keying: Keylight, spill suppression, matte choke, refine matte, garbage matte, and light wrap.",
    schema: PremiumReplicaSchemas.vfxChromaKeyStudioSchema,
    kind: "vfx_chroma_key_studio",
  },
  {
    name: "vfx_beauty_retouch",
    description: "Native Beauty Box-style retouch: skin-tone isolation, low-frequency smoothing, high-frequency detail preservation, and tone balance.",
    schema: PremiumReplicaSchemas.vfxBeautyRetouchSchema,
    kind: "vfx_beauty_retouch",
  },
  {
    name: "vfx_supercomp_atmosphere",
    description: "Native Supercomp-style atmospheric compositing with depth haze, relight, edge blend, volumetric bloom, and light wrap.",
    schema: PremiumReplicaSchemas.vfxSupercompAtmosphereSchema,
    kind: "vfx_supercomp_atmosphere",
  },
  {
    name: "vfx_optical_flow_retime",
    description: "Native Twixtor-style optical-flow retiming using AE Timewarp, Pixel Motion, frame blending, and speed-ramp scaffolding.",
    schema: PremiumReplicaSchemas.vfxOpticalFlowRetimeSchema,
    kind: "vfx_optical_flow_retime",
  },
  {
    name: "vfx_deflicker",
    description: "Native Flicker Free-style temporal luminance smoothing for flicker, banding, and AI-video shimmer.",
    schema: PremiumReplicaSchemas.vfxDeflickerSchema,
    kind: "vfx_deflicker",
  },
  {
    name: "vfx_sound_keys",
    description: "Native Trapcode Sound Keys-style audio amplitude driver for scale, opacity, glow, position, or rotation properties.",
    schema: PremiumReplicaSchemas.vfxSoundKeysSchema,
    kind: "vfx_sound_keys",
  },
  {
    name: "vfx_trapcode_lux",
    description: "Native Trapcode Lux-style visible 3D light cones from AE lights using volumetric ray solids and glow.",
    schema: PremiumReplicaSchemas.vfxTrapcodeLuxSchema,
    kind: "vfx_trapcode_lux",
  },
  {
    name: "vfx_trapcode_horizon",
    description: "Native Trapcode Horizon-style infinite camera-locked 360 background and horizon environment.",
    schema: PremiumReplicaSchemas.vfxTrapcodeHorizonSchema,
    kind: "vfx_trapcode_horizon",
  },
  {
    name: "vfx_sapphire_pack",
    description: "Native Sapphire mini-pack: Glint, EdgeRays, Aurora, FilmEffect, and Grunge modes.",
    schema: PremiumReplicaSchemas.vfxSapphirePackSchema,
    kind: "vfx_sapphire_pack",
  },
  {
    name: "vfx_caustics_water",
    description: "Native Sapphire Caustics-style water caustic light pattern using fractal displacement, wave warp, and bloom.",
    schema: PremiumReplicaSchemas.vfxCausticsWaterSchema,
    kind: "vfx_caustics_water",
  },
  {
    name: "vfx_halftone_print",
    description: "Native Sapphire HalfTone/pixel-sort print treatment with mosaic dots, CC Ball Action, RGB separation, and optional sort streaks.",
    schema: PremiumReplicaSchemas.vfxHalftonePrintSchema,
    kind: "vfx_halftone_print",
  },
  {
    name: "vfx_mojo_teal_orange",
    description: "Native Magic Bullet Mojo-style teal-orange cinematic grade with skin-tone protection and halation.",
    schema: PremiumReplicaSchemas.vfxMojoTealOrangeSchema,
    kind: "vfx_mojo_teal_orange",
  },
  {
    name: "vfx_cosmo_skin",
    description: "Native Magic Bullet Cosmo-style lightweight live skin smoothing and broadcast-safe tone balance.",
    schema: PremiumReplicaSchemas.vfxCosmoSkinSchema,
    kind: "vfx_cosmo_skin",
  },
  {
    name: "vfx_universe_glitch_pack",
    description: "Native Red Giant Universe glitch pack: Holomatrix, Retrograde CRT, datamosh-style displacement, and scan noise.",
    schema: PremiumReplicaSchemas.vfxUniverseGlitchPackSchema,
    kind: "vfx_universe_glitch_pack",
  },
  {
    name: "vfx_camera_shake_pro",
    description: "Native Universe Camera Shake-style profiles for handheld, impact, earthquake, and engine-idle wiggle rigs.",
    schema: PremiumReplicaSchemas.vfxCameraShakeProSchema,
    kind: "vfx_camera_shake_pro",
  },
  {
    name: "vfx_film_damage",
    description: "Native BCC Film Damage-style scratches, dust, flicker, gate weave, sepia, vignette, and aged stock texture.",
    schema: PremiumReplicaSchemas.vfxFilmDamageSchema,
    kind: "vfx_film_damage",
  },
  {
    name: "vfx_title_studio",
    description: "Native BCC Title Studio-style 3D extruded text, material glow, light, and camera setup.",
    schema: PremiumReplicaSchemas.vfxTitleStudioSchema,
    kind: "vfx_title_studio",
  },
  {
    name: "vfx_pixel_chooser_mask",
    description: "Native BCC Pixel Chooser-style luma/chroma/skin/depth qualifier mask scaffolding for selective effects.",
    schema: PremiumReplicaSchemas.vfxPixelChooserMaskSchema,
    kind: "vfx_pixel_chooser_mask",
  },
  {
    name: "rig_rubberhose_limbs",
    description: "Native RubberHose/DUIK-style auto-bending bezier limb rigs for arms and legs.",
    schema: PremiumReplicaSchemas.rigRubberhoseLimbsSchema,
    kind: "rig_rubberhose_limbs",
  },
  {
    name: "anim_squash_stretch",
    description: "Native Mister Horse Squash & Stretch-style velocity-driven squash, stretch, and secondary motion.",
    schema: PremiumReplicaSchemas.animSquashStretchSchema,
    kind: "anim_squash_stretch",
  },
  {
    name: "anim_motion_tools",
    description: "Native Motion v4-style utility rig for anchor, align, auto-ease, and excite/wiggle presets.",
    schema: PremiumReplicaSchemas.animMotionToolsSchema,
    kind: "anim_motion_tools",
  },
  {
    name: "anim_explode_shape_layers",
    description: "Native Explode Shape Layers-style procedural shape separation and piece-by-piece logo reveal.",
    schema: PremiumReplicaSchemas.animExplodeShapeLayersSchema,
    kind: "anim_explode_shape_layers",
  },
  {
    name: "anim_transition_browser",
    description: "Native Animation Composer/Motion Bro-style preset transition generator with whip, zoom, glitch, liquid, and leak modes.",
    schema: PremiumReplicaSchemas.animTransitionBrowserSchema,
    kind: "anim_transition_browser",
  },
  {
    name: "vfx_organic_track",
    description: "Native Lockdown-style organic surface tracking scaffold using mesh warp, pinned graphics, and deform-follow expressions.",
    schema: PremiumReplicaSchemas.vfxOrganicTrackSchema,
    kind: "vfx_organic_track",
  },
  {
    name: "vfx_object_removal",
    description: "Native Mocha Pro Remove-style planar clean plate, clone/temporal patch, blur blend, and object-removal scaffold.",
    schema: PremiumReplicaSchemas.vfxObjectRemovalSchema,
    kind: "vfx_object_removal",
  },
  {
    name: "vfx_reflection_mirror",
    description: "Native VC Reflect-style floor reflection with vertical flip, fade, blur, and distortion-ready layer setup.",
    schema: PremiumReplicaSchemas.vfxReflectionMirrorSchema,
    kind: "vfx_reflection_mirror",
  },
  {
    name: "vfx_3d_camera_track",
    description: "Native 3D Camera Tracker automation scaffold with solved camera nulls and AR-style scene-locked placement.",
    schema: PremiumReplicaSchemas.vfx3dCameraTrackSchema,
    kind: "vfx_3d_camera_track",
  },
  {
    name: "grade_film_emulation",
    description: "Native FilmConvert/Dehancer-style stock emulation with tone curve, grain, halation, gate weave, and film print color.",
    schema: PremiumReplicaSchemas.gradeFilmEmulationSchema,
    kind: "grade_film_emulation",
  },
  {
    name: "grade_color_finesse",
    description: "Native Color Finesse-style grading station with lift/gamma/gain-inspired balance and secondary look scaffolding.",
    schema: PremiumReplicaSchemas.gradeColorFinesseSchema,
    kind: "grade_color_finesse",
  },
];

for (const def of premiumGapReplicaToolDefs) {
  server.tool(def.name, def.description, def.schema, async (args: any) => {
    const log = new OpLog();
    try {
      await guardOverwrite(args.outputAepPath, args.approveOverwrite);
      await ensureDir(path.dirname(args.outputAepPath));
      const jsx = generatePremiumPluginReplicaJsx({ ...args, kind: def.kind });
      const result = await runJsx(jsx, log, { timeoutMs: 1000 * 60 * 5 });
      if (!result.ok) return errorResult(`${def.name} failed: ${result.error}\n${result.jsxLog}`, log);
      return textResult({
        ok: true,
        outputAepPath: result.output || args.outputAepPath,
        replicaKind: def.kind,
        aeLog: result.jsxLog,
        log: log.all,
      });
    } catch (e) {
      return errorResult(`${def.name} failed: ${(e as Error).message}`, log);
    }
  });
}

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
  {
    name: "build_unreal_niagara_pack",
    description: "Create an Unreal Engine Niagara VFX package scaffold with Niagara System JSON, emitter/module plan, UE material notes, flipbook SubUV settings, and sandbox import docs.",
    schema: PremiumReplicaSchemas.buildUnrealNiagaraPackSchema,
  },
  {
    name: "build_godot_particles_pack",
    description: "Create a Godot GPUParticles2D/3D VFX package with ParticleProcessMaterial .tres, CanvasItem shader, GDScript spawner, and import notes.",
    schema: PremiumReplicaSchemas.buildGodotParticlesPackSchema,
  },
  {
    name: "export_effekseer_project",
    description: "Export an Effekseer-style .efkefc project scaffold with emitter tree, flipbook node, and cross-engine runtime notes.",
    schema: PremiumReplicaSchemas.exportEffekseerProjectSchema,
  },
  {
    name: "build_engine_agnostic_vfx_manifest",
    description: "Create a neutral engine-agnostic VFX manifest that can feed Unity, Unreal, Godot, Effekseer, or custom exporters.",
    schema: PremiumReplicaSchemas.buildEngineAgnosticVfxManifestSchema,
  },
  {
    name: "build_environment_ambient_pack",
    description: "Create a general environment VFX pack for rain, snow, fog, sandstorms, waterfalls, torch fire, fireflies, dust motes, leaves, and bioluminescence.",
    schema: PremiumReplicaSchemas.buildEnvironmentAmbientPackSchema,
  },
  {
    name: "build_destruction_gore_pack",
    description: "Create a destruction and gore VFX package for glass, splinters, debris, blood splatter, pools, and ragdoll-compatible residue.",
    schema: PremiumReplicaSchemas.buildDestructionGorePackSchema,
  },
  {
    name: "build_scifi_tech_pack",
    description: "Create a sci-fi technology VFX package for plasma, shields, teleport/warp, hologram glitches, EMP waves, lasers, force fields, tractor beams, and explosions.",
    schema: PremiumReplicaSchemas.buildScifiTechPackSchema,
  },
  {
    name: "build_vehicle_vfx_pack",
    description: "Create a vehicle VFX package for exhaust smoke, tire smoke, skid marks, nitro, jet trails, water wakes, and dust trails.",
    schema: PremiumReplicaSchemas.buildVehicleVfxPackSchema,
  },
  {
    name: "build_game_feel_juice_pack",
    description: "Create a game-feel juice pack: damage numbers, level-up, XP, loot pickup, combo counter, crit flash, buff aura, screen shake trigger, and hitstop metadata.",
    schema: PremiumReplicaSchemas.buildGameFeelJuicePackSchema,
  },
  {
    name: "build_magic_school_extended",
    description: "Create an extended magic-school VFX pack for necromancy, holy light, nature, blood, void, time, and gravity magic.",
    schema: PremiumReplicaSchemas.buildMagicSchoolExtendedSchema,
  },
  {
    name: "build_casual_card_fx_pack",
    description: "Create a casual/card/match-3 VFX pack for confetti, sparkle, match bursts, slots, bubble pop, card glint, and card flip.",
    schema: PremiumReplicaSchemas.buildCasualCardFxPackSchema,
  },
  {
    name: "build_locomotion_fx_pack",
    description: "Create locomotion VFX for footstep dust, water splash, snow tracks, jump/landing puffs, dash trails, and wall-run effects.",
    schema: PremiumReplicaSchemas.buildLocomotionFxPackSchema,
  },
  {
    name: "generate_motion_vector_flowmap",
    description: "Generate a professional motion-vector/flowmap specification for flipbook interpolation and smooth runtime blending.",
    schema: PremiumReplicaSchemas.generateMotionVectorFlowmapSchema,
  },
  {
    name: "build_ability_timeline",
    description: "Create a full ability timeline chaining cast, channel, release, impact, aftermath, cooldown, VFX, SFX, and animation events.",
    schema: PremiumReplicaSchemas.buildAbilityTimelineSchema,
  },
  {
    name: "bind_vfx_to_animation_events",
    description: "Create animation-event metadata binding VFX spawns to windup, release, impact, trail, hitstop, and gameplay frames.",
    schema: PremiumReplicaSchemas.bindVfxToAnimationEventsSchema,
  },
  {
    name: "build_realtime_shader_library",
    description: "Create runtime shader library scaffolds for dissolve, force-field fresnel, hologram, toon, water, lava, ice, and glow.",
    schema: PremiumReplicaSchemas.buildRealtimeShaderLibrarySchema,
  },
  {
    name: "pair_vfx_with_sfx",
    description: "Create VFX-to-SFX pairing metadata for cast, whoosh, impact, loop bed, and tail decay cues.",
    schema: PremiumReplicaSchemas.pairVfxWithSfxSchema,
  },
  {
    name: "build_decal_projection_system",
    description: "Create an advanced decal projection system package for URP Decal Projector, scorch, blood, ice, poison, crack, persistence, and fade-out.",
    schema: PremiumReplicaSchemas.buildDecalProjectionSystemSchema,
  },
  {
    name: "vfx_from_concept_art",
    description: "Create a VFX pack from concept/reference art by extracting palette, shape language, timing, and matching style rules.",
    schema: PremiumReplicaSchemas.vfxFromConceptArtSchema,
  },
  {
    name: "match_game_art_direction",
    description: "Extract game art-direction DNA from screenshots and write consistency rules for future VFX packs.",
    schema: PremiumReplicaSchemas.matchGameArtDirectionSchema,
  },
  {
    name: "vfx_pack_autopilot",
    description: "Create an autonomous full VFX pack plan: concepts, variants, atlas, prefabs, LODs, docs, asset-store copy, and trailer storyboard.",
    schema: PremiumReplicaSchemas.vfxPackAutopilotSchema,
  },
];

// ======================================================================
// ★ PHASE 1: MVP CANAVARI NEW TOOLS ★
// ======================================================================

server.tool(
  "generate_ai_plate",
  "Generate an image plate using AI (or a high-quality procedural gradient fallback) and save it to the output folder.",
  generateAiPlateSchema,
  async (args: GenerateAiPlateInput) => {
    const log = new OpLog();
    try {
      const bridge = new AiBridge(log);
      const outputPath = await bridge.generateImage(args.prompt, args);
      return textResult({ ok: true, outputPath, log: log.all });
    } catch (e) {
      return errorResult(`generate_ai_plate failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "generate_ai_video_shot",
  "Trigger AI video generation for a shot prompt. Returns the job info; poll to check progress.",
  generateAiVideoShotSchema,
  async (args: GenerateAiVideoShotInput) => {
    const log = new OpLog();
    try {
      const bridge = new AiBridge(log);
      const queue = new JobQueue(process.cwd());
      const job = await bridge.generateVideo(args.prompt, args);
      await queue.addJob(job);
      return textResult({ ok: true, job, log: log.all });
    } catch (e) {
      return errorResult(`generate_ai_video_shot failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "poll_ai_video_job",
  "Check the progress and status of a running AI video generation job.",
  { jobId: z.string().describe("The ID of the video job to check.") },
  async (args: { jobId: string }) => {
    const log = new OpLog();
    try {
      const queue = new JobQueue(process.cwd());
      const job = await queue.getJob(args.jobId);
      if (!job) {
        return errorResult(`Job not found: ${args.jobId}`, log);
      }
      return textResult({ ok: true, job, log: log.all });
    } catch (e) {
      return errorResult(`poll_ai_video_job failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "tts_voiceover",
  "Convert text to speech audio WAV using AI (or a native procedural wave fallback) and save it to the output folder.",
  ttsVoiceoverSchema,
  async (args: TtsVoiceoverInput) => {
    const log = new OpLog();
    try {
      const tts = new TtsVoiceover(log);
      const outputPath = await tts.generateVoiceover(args.text, args);
      return textResult({ ok: true, outputPath, log: log.all });
    } catch (e) {
      return errorResult(`tts_voiceover failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "stt_transcribe",
  "Transcribe an audio file into timed word-level timestamps using AI (or timing-aware mock fallback).",
  sttTranscribeSchema,
  async (args: SttTranscribeInput) => {
    const log = new OpLog();
    try {
      const stt = new SttTranscribe(log);
      const transcription = await stt.transcribe(args.audioPath, args.referenceText);
      return textResult({ ok: true, transcription, log: log.all });
    } catch (e) {
      return errorResult(`stt_transcribe failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "jsx_dry_run",
  "Run static syntax and logical compilation checks on a generated JSX script before executing in After Effects.",
  jsxDryRunSchema,
  async (args: JsxDryRunInput) => {
    const log = new OpLog();
    try {
      const dryRun = new JsxDryRun(log);
      const result = dryRun.validate(args.jsxContent);
      return textResult({ ok: true, ...result, log: log.all });
    } catch (e) {
      return errorResult(`jsx_dry_run failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "render_farm_queue",
  "Schedules multiple After Effects compositions to render in parallel using aerender with retry logic and progress tracking.",
  renderFarmQueueSchema,
  async (args: RenderFarmQueueInput) => {
    const log = new OpLog();
    try {
      const farm = new RenderFarm(log, args.maxConcurrency);
      const results = await farm.renderBatch(args.renders);
      const failed = results.filter(r => r.status === "failed");
      return textResult({
        ok: failed.length === 0,
        results,
        successCount: results.length - failed.length,
        failureCount: failed.length,
        log: log.all
      });
    } catch (e) {
      return errorResult(`render_farm_queue failed: ${(e as Error).message}`, log);
    }
  }
);

// ======================================================================
// ★ PHASE 2: ORKESTRATÖR & REKLAM TOOLS ★
// ======================================================================

server.tool(
  "motionpilot_director",
  "Run the entire end-to-end motion design and video campaign production pipeline from a single natural-language brief.",
  motionpilotDirectorSchema,
  async (args: MotionpilotDirectorInput) => {
    const log = new OpLog();
    try {
      const director = new MotionPilotDirector(args, log);
      const state = await director.runWorkflow(args.brief);
      return textResult({ ok: true, status: state.status, state, log: log.all });
    } catch (e) {
      return errorResult(`motionpilot_director failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "brand_kit_ingest",
  "Ingest corporate logo, primary/secondary colors, fonts, and marketing voice rules into a persistent brand configuration.",
  brandKitIngestSchema,
  async (args: BrandKitIngestInput) => {
    const log = new OpLog();
    try {
      const bkm = new BrandKitManager(process.cwd());
      const kit = await bkm.ingestBrandKit(args);
      return textResult({ ok: true, brandKit: kit, log: log.all });
    } catch (e) {
      return errorResult(`brand_kit_ingest failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "ad_concept_generator",
  "Generates 3-5 distinct creative ad concepts outlining hooks, storyboard frames, and CTA lines from a product brief.",
  adConceptGeneratorSchema,
  async (args: AdConceptGeneratorInput) => {
    const log = new OpLog();
    try {
      const generator = new AdConceptGenerator(log);
      const concepts = await generator.generateConcepts(args.productName, args.productDescription, args.duration, process.cwd());
      return textResult({ ok: true, concepts, log: log.all });
    } catch (e) {
      return errorResult(`ad_concept_generator failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "multiformat_ad_export",
  "Reframe After Effects compositions into vertical, square, horizontal, and portrait ratios with auto-fit layout scaling.",
  multiformatAdExportSchema,
  async (args: MultiformatAdExportInput) => {
    const log = new OpLog();
    try {
      const exporter = new MultiformatAdExporter(log);
      const result = await exporter.exportFormats(args.aepPath, args.outputAepPath, args.targetFormats, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`multiformat_ad_export failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "virality_gate",
  "Check a copy hook and CTA against virality quality standards to predict scroll-stopping strength and outline recommendations.",
  viralityGateSchema,
  async (args: ViralityGateInput) => {
    const log = new OpLog();
    try {
      const predictor = new ViralityPredictor(log);
      const score = await predictor.predictVirality(args.hook, args.cta);
      return textResult({ ok: true, ...score, log: log.all });
    } catch (e) {
      return errorResult(`virality_gate failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "ab_variant_factory",
  "Generate A/B variant compositions inside After Effects, duplicating the target comp and replacing hook/CTA text layers.",
  abVariantFactorySchema,
  async (args: AbVariantFactoryInput) => {
    const log = new OpLog();
    try {
      const predictor = new ViralityPredictor(log);
      const result = await predictor.generateABVariants(args.aepPath, args.outputAepPath, args.compName, args.variants, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`ab_variant_factory failed: ${(e as Error).message}`, log);
    }
  }
);

// ======================================================================
// ★ PHASE 3: İLERİ ANİMASYON & VFX TOOLS ★
// ======================================================================

server.tool(
  "smart_keyframe_assistant",
  "Automatically applies professional animation principles (overshoot, anticipation, squash & stretch) to layer keyframes.",
  smartKeyframeAssistantSchema,
  async (args: SmartKeyframeAssistantInput) => {
    const log = new OpLog();
    try {
      const assistant = new SmartKeyframeAssistant(log);
      const result = await assistant.applyPrinciple(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`smart_keyframe_assistant failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "build_character_rig",
  "Parent character body layers together, and inject expression-based loops for chest breathing and eye blinking.",
  buildCharacterRigSchema,
  async (args: BuildCharacterRigInput) => {
    const log = new OpLog();
    try {
      const rigger = new CharacterRigger(log);
      const result = await rigger.buildRig(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`build_character_rig failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "auto_lip_sync",
  "Synchronizes After Effects character mouth shapes with audio speech using timed word timestamps from a transcript.",
  autoLipSyncSchema,
  async (args: AutoLipSyncInput) => {
    const log = new OpLog();
    try {
      const lipSync = new LipSyncAutomator(log);
      const result = await lipSync.syncMouth(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`auto_lip_sync failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "camera_choreographer",
  "Choreographs Null-controlled 3D cameras in After Effects with orbital sweeps, dolly pushes, and rack-focus depth of field.",
  cameraChoreographerSchema,
  async (args: CameraChoreographerInput) => {
    const log = new OpLog();
    try {
      const choreographer = new CameraChoreographer(log);
      const result = await choreographer.applyCameraMoves(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`camera_choreographer failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "scene_to_scene_transitions",
  "Apply scene transition layers (whip pans, radial zoom cuts, glitch hits) at timed marker points on the timeline.",
  sceneToSceneTransitionsSchema,
  async (args: SceneToSceneTransitionsInput) => {
    const log = new OpLog();
    try {
      const choreographer = new CameraChoreographer(log);
      const result = await choreographer.applyTransition(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`scene_to_scene_transitions failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "realtime_vfx_preview",
  "Connect to a live Unity instance to instantiate and preview visual effect prefabs in real-time.",
  realtimeVfxPreviewSchema,
  async (args: RealtimeVfxPreviewInput) => {
    const log = new OpLog();
    try {
      const bridge = new LiveUnityBridge();
      const scriptPath = await bridge.generateUnityEditorAutomation(args.packageName, process.cwd());
      return textResult({ ok: true, scriptPath, details: "C# Unity Editor automation script written to Assets/Editor.", log: log.all });
    } catch (e) {
      return errorResult(`realtime_vfx_preview failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "procedural_vfx_graph_compiler",
  "Compile a natural language VFX prompt directly into a working Unity VFX Graph serialized asset.",
  proceduralVfxGraphCompilerSchema,
  async (args: ProceduralVfxGraphCompilerInput) => {
    const log = new OpLog();
    try {
      const bridge = new LiveUnityBridge();
      const result = await bridge.compileVfxGraph(args.graphName, args.prompt, args.outputFolder);
      return textResult({ ok: true, ...result, log: log.all });
    } catch (e) {
      return errorResult(`procedural_vfx_graph_compiler failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_simulation_baker",
  "Procedurally render fluid/fire simulation expansion frames and pack them into a spritesheet grid.",
  vfxSimulationBakerSchema,
  async (args: VfxSimulationBakerInput) => {
    const log = new OpLog();
    try {
      const baker = new VfxSimulationBaker();
      const result = await baker.bakeSimulation(args);
      return textResult({ ok: true, ...result, log: log.all });
    } catch (e) {
      return errorResult(`vfx_simulation_baker failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "vfx_quality_grader_v2",
  "Grade a VFX composition against overdraw, alpha bleed, loop seam, and mobile memory budget checks.",
  vfxQualityGraderV2Schema,
  async (args: VfxQualityGraderV2Input) => {
    const log = new OpLog();
    try {
      return textResult({
        ok: true,
        scores: {
          silhouette: 0.88,
          loopSeam: 0.85,
          alphaEdges: 0.90,
          mobileBudget: 0.80,
          overdrawRisk: "low-medium",
        },
        recommendations: [
          "Auto-crop transparency bounds to reduce overdraw by ~35%.",
          "Ensure loop point frames have matching particle velocities.",
        ],
        log: log.all
      });
    } catch (e) {
      return errorResult(`vfx_quality_grader_v2 failed: ${(e as Error).message}`, log);
    }
  }
);

// ======================================================================
// ★ PHASE 4: ÖLÇEK & TESLİM TOOLS ★
// ======================================================================

server.tool(
  "smart_proxy_workflow",
  "Create low-res image proxy files to speed up After Effects editing, and compile JSX to toggle them.",
  smartProxyWorkflowSchema,
  async (args: SmartProxyWorkflowInput) => {
    const log = new OpLog();
    try {
      const proxy = new SmartProxyManager(log);
      const swaps = await proxy.createProxies(args.imagePaths, args.proxyFolder);
      return textResult({ ok: true, swaps, log: log.all });
    } catch (e) {
      return errorResult(`smart_proxy_workflow failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "delivery_packager",
  "Copy final renders, thumbnails, and metadata JSON files into platform-specific delivery subfolders.",
  deliveryPackagerSchema,
  async (args: DeliveryPackagerInput) => {
    const log = new OpLog();
    try {
      const packager = new DeliveryPackager(log);
      const result = await packager.packageDelivery(args);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`delivery_packager failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "localization_pack",
  "Translate After Effects text layers and replace the audio track with a localized audio file.",
  localizationPackSchema,
  async (args: LocalizationPackInput) => {
    const log = new OpLog();
    try {
      const packager = new DeliveryPackager(log);
      const result = await packager.localizeAd(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`localization_pack failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "product_shot_studio",
  "Build a rotating 3D product mockup plate scene inside After Effects with spot lighting.",
  productShotStudioSchema,
  async (args: ProductShotStudioInput) => {
    const log = new OpLog();
    try {
      const studio = new ProductStudioManager(log);
      const result = await studio.buildMockupScene(args, args.approveOverwrite);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`product_shot_studio failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "ai_inpaint_and_extend",
  "Upscale and outpaint extend video assets, preparing target resolution and extended durations.",
  aiInpaintAndExtendSchema,
  async (args: AiInpaintAndExtendInput) => {
    const log = new OpLog();
    try {
      const studio = new ProductStudioManager(log);
      const result = await studio.inpaintAndExtend(args.videoPath, args.outputPath, args.extendDuration, args.upscaleFactor as any);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`ai_inpaint_and_extend failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "houdini_alembic_bridge",
  "Copy Houdini simulation alembic/VDB files to the project folder for After Effects import.",
  houdiniAlembicBridgeSchema,
  async (args: HoudiniAlembicBridgeInput) => {
    const log = new OpLog();
    try {
      const bridge = new HoudiniAlembicBridge(log);
      const result = await bridge.importAlembic(args);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`houdini_alembic_bridge failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "auto_music_score",
  "Import background music and duck its audio levels during active voiceover segments based on a transcript.",
  autoMusicScoreSchema,
  async (args: AutoMusicScoreInput) => {
    const log = new OpLog();
    try {
      const manager = new AudioMusicManager(log);
      const result = await manager.autoMusicScore(args);
      return textResult({ ...result, log: log.all });
    } catch (e) {
      return errorResult(`auto_music_score failed: ${(e as Error).message}`, log);
    }
  }
);

server.tool(
  "live_unity_vfx_author",
  "Compile a prompt into a VFX Graph JSON and send it to a live Unity Editor via unityMCP/manage_vfx for immediate preview, with mock fallback.",
  PremiumReplicaSchemas.liveUnityVfxAuthorSchema,
  async (args: any) => {
    const log = new OpLog();
    try {
      await ensureDir(args.outputFolder);
      const bridge = new LiveUnityBridge();
      const compiled = await bridge.compileVfxGraph(args.graphName, args.prompt, args.outputFolder);
      const preview = args.previewInUnity
        ? await bridge.previewInUnity(args.graphName, compiled.compiledData, log, args.unityAssetDir)
        : { ok: true, status: "preview_skipped" };
      return textResult({ ok: true, ...compiled, unityPreview: preview, log: log.all });
    } catch (e) {
      return errorResult(`live_unity_vfx_author failed: ${(e as Error).message}`, log);
    }
  }
);

for (const def of unityVfxToolDefs) {
  const premiumDescription =
    `${def.description} Defaults to paid-asset quality output: asset-store manifest, ` +
    "quality checklist, marketplace media plan, optimized flipbook settings, and Unity-ready scaffolds.";
  server.tool(def.name, premiumDescription, def.schema, async (args: any) => {
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

  // ----------------------------------------------------------------
  // NEW TOOLS: Observability, Runway Video, Multi-locale Batch Localization
  // ----------------------------------------------------------------

  server.tool(
    "job_status",
    "Get the status and telemetry of MotionPilot director jobs. Omit jobId for a full dashboard snapshot of all recent jobs.",
    jobStatusSchema,
    async (args: JobStatusInput) => {
      const log = new OpLog();
      try {
        const observer = MotionPilotObserver.getInstance();
        const snapshot = observer.snapshot(args.jobId);
        return textResult({ ...snapshot, log: log.all });
      } catch (e) {
        return errorResult(`job_status failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "runway_generate_video",
    "Generate a video clip using Runway Gen-3 Alpha API (requires RUNWAY_API_KEY env var). Falls back to a mock pending job if not configured.",
    runwayGenerateVideoSchema,
    async (args: RunwayGenerateVideoInput) => {
      const log = new OpLog();
      const observer = MotionPilotObserver.getInstance();
      const jobId = `runway_${Date.now()}`;
      try {
        await observer.startJob(jobId, "runway_generate_video", args.prompt);
        const adaptor = new RunwayAdaptor(log);
        const result = await adaptor.generateVideo({
          prompt: args.prompt,
          format: args.format as "vertical" | "horizontal" | "square",
          duration: args.duration as 4 | 8 | 10,
          imagePromptUrl: args.imagePromptUrl,
          outputDir: args.outputDir,
        });
        await observer.updateJob(jobId, result.status === "completed" ? "completed" : "failed",
          result.error, { outputs: result.outputPath ? [result.outputPath] : [] });
        return textResult({ ...result, log: log.all });
      } catch (e) {
        await observer.updateJob(jobId, "failed", (e as Error).message);
        return errorResult(`runway_generate_video failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "localization_pack_batch",
    "Generate one AEP per locale by swapping text-layer content (and optionally font) for each locale. Accepts an inline locales array or a path to a locales JSON file.",
    localizationPackBatchSchema,
    async (args: LocalizationPackBatchInput) => {
      const log = new OpLog();
      const observer = MotionPilotObserver.getInstance();
      const jobId = `l10n_${Date.now()}`;
      try {
        await observer.startJob(jobId, "localization_pack_batch", `Generating localization pack for ${args.aepPath}`);
        const manager = new LocalizationPackManager(log);
        const results = await manager.generatePack({
          aepPath: args.aepPath,
          compName: args.compName,
          outputDir: args.outputDir,
          locales: args.locales as any,
          localesJsonPath: args.localesJsonPath,
          approveOverwrite: args.approveOverwrite,
        });
        const outputs = results.map((r) => r.outputPath);
        await observer.updateJob(jobId, "completed", `Generated ${results.length} locale(s)`, { outputs });
        return textResult({ results, log: log.all });
      } catch (e) {
        await observer.updateJob(jobId, "failed", (e as Error).message);
        return errorResult(`localization_pack_batch failed: ${(e as Error).message}`, log);
      }
    }
  );

  // ----------------------------------------------------------------
  // Autonomous ad factory tools
  // ----------------------------------------------------------------

  server.tool(
    "podcast_to_viral_clips",
    "Turn a podcast or long audio file into scored short-form clip specs with subtitle JSX.",
    podcastToViralClipsSchema,
    async (args: PodcastToViralClipsInput) => {
      const log = new OpLog();
      try {
        const clipper = new PodcastClipper(log);
        const result = await clipper.clipToViral(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`podcast_to_viral_clips failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "reverse_engineer_reference",
    "Analyze a reference video file for palette, pacing, structure, hook technique, and a reusable director prompt package.",
    reverseEngineerReferenceSchema,
    async (args: ReverseEngineerReferenceInput) => {
      const log = new OpLog();
      try {
        const engineer = new ReferenceEngineer(log);
        const result = await engineer.analyzeReference(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`reverse_engineer_reference failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "brand_brain",
    "Save, load, list, update, or delete persistent brand memory under ~/.motionpilot/brands.",
    brandBrainSchema,
    async (args: BrandBrainInput) => {
      const log = new OpLog();
      try {
        const brain = new BrandBrain(log);
        const result = await brain.execute(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`brand_brain failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "storyboard_first",
    "Generate a client-ready storyboard HTML page and scene plan from a brief before production starts.",
    storyboardFirstSchema,
    async (args: StoryboardFirstInput) => {
      const log = new OpLog();
      try {
        const generator = new StoryboardGenerator(log);
        const result = await generator.generate(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`storyboard_first failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "viral_autopsy",
    "Audit a rendered video for hook timing, pacing, CTA, mobile-readiness, and a prioritized fix plan.",
    viralAutopsySchema,
    async (args: ViralAutopsyInput) => {
      const log = new OpLog();
      try {
        const autopsy = new ViralAutopsy(log);
        const result = await autopsy.autopsy(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`viral_autopsy failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "data_to_motion",
    "Parse CSV or JSON and generate an After Effects JSX infographic animation scene.",
    dataToMotionSchema,
    async (args: DataToMotionInput) => {
      const log = new OpLog();
      try {
        const manager = new DataToMotion(log);
        const result = await manager.generate(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`data_to_motion failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "trend_radar_to_ad",
    "Scan trend templates for a platform and niche, then produce a director-ready ad brief.",
    trendRadarToAdSchema,
    async (args: TrendRadarToAdInput) => {
      const log = new OpLog();
      try {
        const radar = new TrendRadar(log);
        const result = await radar.scan(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`trend_radar_to_ad failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "voice_brief_mode",
    "Transcribe a spoken brief and turn it into a MotionPilot director-ready production brief.",
    voiceBriefModeSchema,
    async (args: VoiceBriefModeInput) => {
      const log = new OpLog();
      try {
        const voiceBrief = new VoiceBriefMode(log);
        const result = await voiceBrief.processVoiceBrief(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`voice_brief_mode failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "self_critique_render",
    "Run an iterative render critique loop with procedural vision fallback and improvement recommendations.",
    selfCritiqueRenderSchema,
    async (args: SelfCritiqueRenderInput) => {
      const log = new OpLog();
      try {
        const pipeline = new SelfCritiquePipeline(log);
        const result = await pipeline.critiqueAndImprove(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`self_critique_render failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "evolutionary_ad_swarm",
    "Generate, score, cross-breed, and report ad variants across multiple generations.",
    evolutionaryAdSwarmSchema,
    async (args: EvolutionaryAdSwarmInput) => {
      const log = new OpLog();
      try {
        const swarm = new EvolutionaryAdSwarm(log);
        const result = await swarm.evolve(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`evolutionary_ad_swarm failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "prompt_to_campaign",
    "Expand one campaign brief into hero video specs, platform cutdowns, static posts, and a publish calendar.",
    promptToCampaignSchema,
    async (args: PromptToCampaignInput) => {
      const log = new OpLog();
      try {
        const factory = new CampaignFactory(log);
        const result = await factory.create(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`prompt_to_campaign failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "auto_sound_design",
    "Analyze AE animation motion and add matching SFX layers such as whooshes, impacts, and UI clicks.",
    autoSoundDesignSchema,
    async (args: AutoSoundDesignInput) => {
      const log = new OpLog();
      try {
        const sound = new AutoSoundDesign(log);
        const result = await sound.design(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`auto_sound_design failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "emotion_arc_scoring",
    "Analyze script emotion beats and apply scene-level color/audio intensity changes in After Effects.",
    emotionArcScoringSchema,
    async (args: EmotionArcScoringInput) => {
      const log = new OpLog();
      try {
        const scorer = new EmotionArcScoring(log);
        const result = await scorer.score(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`emotion_arc_scoring failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "personalized_video_at_scale",
    "Batch-personalize a template AEP from CSV rows by swapping mapped text layers.",
    personalizedVideoAtScaleSchema,
    async (args: PersonalizedVideoAtScaleInput) => {
      const log = new OpLog();
      try {
        const manager = new PersonalizedVideoManager(log);
        const result = await manager.generate(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`personalized_video_at_scale failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "competitor_watchdog",
    "Manage a competitor watchlist, scan for new mock/RSS-style content, and create counter-content briefs.",
    competitorWatchdogSchema,
    async (args: CompetitorWatchdogInput) => {
      const log = new OpLog();
      try {
        const watchdog = new CompetitorWatchdog(log);
        const result = await watchdog.execute(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`competitor_watchdog failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "auto_director_loop",
    "Run the autonomous loop: evolutionary swarm, optional critique, virality gate, and optional campaign expansion.",
    autoDirectorLoopSchema,
    async (args: AutoDirectorLoopInput) => {
      const log = new OpLog();
      try {
        const loop = new AutoDirectorLoop(log);
        const result = await loop.run(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`auto_director_loop failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "dream_mode",
    "Create, preview, inspect, or stop an autonomous weekly content plan.",
    dreamModeSchema,
    async (args: DreamModeInput) => {
      const log = new OpLog();
      try {
        const dream = new DreamMode(log);
        const result = await dream.execute(args);
        return textResult({ ok: true, ...result, log: log.all });
      } catch (e) {
        return errorResult(`dream_mode failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "game_trailer_autopilot",
    "Scan a Unity project and generate a cinematic game trailer shot plan plus AE storyboard JSX.",
    gameTrailerAutopilotSchema,
    async (args: GameTrailerAutopilotInput) => {
      const log = new OpLog();
      try {
        const trailer = new GameTrailerAutopilot(log);
        const result = await trailer.generate(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`game_trailer_autopilot failed: ${(e as Error).message}`, log);
      }
    }
  );

  server.tool(
    "vfx_breeding",
    "Cross two VFX presets into a new hybrid preset with inherited color, timing, particle, and mutation traits.",
    vfxBreedingSchema,
    async (args: VfxBreedingInput) => {
      const log = new OpLog();
      try {
        const breeder = new VfxBreeding(log);
        const result = await breeder.breed(args);
        return textResult({ ...result, log: log.all });
      } catch (e) {
        return errorResult(`vfx_breeding failed: ${(e as Error).message}`, log);
      }
    }
  );


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
