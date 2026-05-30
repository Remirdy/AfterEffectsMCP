#!/usr/bin/env node
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  analyzePsdVisualsSchema,
  createMotionPlanSchema,
  importPsdToAeSchema,
  animateAeProjectSchema,
  renderPreviewSchema,
  checkAfterEffectsSetupSchema,
  executeAeActionsSchema,
  AnalyzePsdInput,
  CreateMotionPlanInput,
  ImportPsdInput,
  AnimateInput,
  RenderInput,
  CheckAfterEffectsSetupInput,
  ExecuteAeActionsInput,
} from "./schemas.js";
import { analyzePsd } from "./psd/analyzer.js";
import { buildMotionPlan } from "./motion/planner.js";
import {
  generateImportJsx,
  generateAnimateJsx,
  generateRenderJsx,
  generateExecuteActionsJsx,
} from "./ae/jsxGenerator.js";
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
 * Tool 3: import_psd_to_after_effects
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
 * Tool 4: animate_after_effects_project
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
 * Tool 5: render_preview
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
 * Tool 6: check_after_effects_setup
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
 * Tool 7: execute_after_effects_actions
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

/* ------------------------------------------------------------------ */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("motionpilot-ae-mcp running on stdio\n");
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${(e as Error).stack ?? e}\n`);
  process.exit(1);
});
