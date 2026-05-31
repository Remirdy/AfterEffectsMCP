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
  ListVfxPresetsInput,
  ApplyVfxInput,
  CreateVfxCompositionInput,
  BuildComplexVfxInput,
  CreateGameVfxFromPromptInput,
  CreateGameEngineVfxPackageInput,
  AnalyzePsdInput,
  CreateMotionPlanInput,
  CreateVideoPromptPackageInput,
  CreateImageAssetPackInput,
  Create3dSceneFromAssetsInput,
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
import { generateApplyVfxJsx, generateCreateVfxCompJsx, generateComplexVfxJsx, generatePromptVfxJsx } from "./ae/vfxGenerator.js";
import { listVfxPresets, listVfxComposites, VfxDomain } from "./vfx/presets.js";
import { buildVfxPlanFromPrompt } from "./vfx/vfxPlanner.js";
import { writeEnginePackage, inferC4dRequested } from "./engine/package.js";
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
      if (args.outputJsonPath) {
        await ensureDir(path.dirname(args.outputJsonPath));
        await writeJson(args.outputJsonPath, pkg);
        log.info(`Wrote video prompt package: ${args.outputJsonPath}`);
      }
      return textResult({
        ...pkg,
        outputJsonPath: args.outputJsonPath ?? null,
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
