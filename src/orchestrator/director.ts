import path from "node:path";
import fs from "node:fs/promises";
import { ProjectState, ProjectStateManager } from "./state.js";
import { AiBridge } from "../ai/aiBridge.js";
import { TtsVoiceover } from "../audio/tts.js";
import { SttTranscribe } from "../audio/stt.js";
import { JsxDryRun } from "../qa/jsxDryRun.js";
import { RenderFarm } from "../render/farm.js";
import { runJsx, resolveAfterEffects } from "../ae/runner.js";
import { OpLog, ensureDir } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";

export interface DirectorOptions {
  projectId?: string;
  brandName?: string;
  outputFolder: string;
  concurrency?: number;
  maxRetries?: number;
}

export class MotionPilotDirector {
  private log: OpLog;
  private stateManager: ProjectStateManager;
  private bridge: AiBridge;
  private tts: TtsVoiceover;
  private stt: SttTranscribe;
  private dryRun: JsxDryRun;
  private farm: RenderFarm;
  private opts: DirectorOptions;

  constructor(opts: DirectorOptions, log?: OpLog) {
    this.log = log ?? new OpLog();
    this.opts = opts;
    const projectId = opts.projectId ?? `proj_${Date.now()}`;
    this.stateManager = new ProjectStateManager(process.cwd(), projectId);
    this.bridge = new AiBridge(this.log);
    this.tts = new TtsVoiceover(this.log);
    this.stt = new SttTranscribe(this.log);
    this.dryRun = new JsxDryRun(this.log);
    this.farm = new RenderFarm(this.log, opts.concurrency ?? 2);
  }

  async runWorkflow(brief: string): Promise<ProjectState> {
    const projectId = this.opts.projectId ?? `proj_${Date.now()}`;
    let state = await this.stateManager.loadState();
    if (!state) {
      this.log.info(`Initializing new project workflow state for: ${projectId}`);
      state = await this.stateManager.initializeState(projectId, brief);
    } else {
      this.log.info(`Resuming existing project workflow state: ${projectId}`);
    }

    const outFolder = path.join(this.opts.outputFolder, projectId);
    await ensureDir(outFolder);

    for (let i = state.currentStep; i < state.steps.length; i++) {
      const step = state.steps[i];
      state.currentStep = i;
      step.status = "running";
      await this.stateManager.saveState(state);

      this.log.info(`>>> Executing Director step ${i + 1}/${state.steps.length}: ${step.name}`);

      try {
        switch (step.name) {
          case "brand_ingest":
            state.brandKit = {
              brandName: this.opts.brandName ?? "Vortex Tech",
              palette: ["#00f2fe", "#4facfe", "#0f172a"],
              font: "Arial Black",
              fontSize: 110,
            };
            step.status = "completed";
            break;

          case "ad_concept":
            step.result = {
              hook: "Step into the Future of Sound",
              tagline: "Vortex Pro — Sound Reinvented",
              concept: "High-contrast neon cyberpunk product presentation with fast bass beat.",
            };
            step.status = "completed";
            break;

          case "assets_generation":
            const imgPath = await this.bridge.generateImage(brief, {
              width: 1080,
              height: 1920,
              style: "cyberpunk product studio",
              palette: state.brandKit.palette,
              outputFolder: path.join(outFolder, "assets"),
            });
            state.psdPath = imgPath; // Use generated image as primary backdrop
            step.result = { imagePath: imgPath };
            step.status = "completed";
            break;

          case "audio_voiceover":
            const text = `${state.brandKit.brandName}. ${step.result?.hook ?? "Step into the future."}`;
            const wavPath = await this.tts.generateVoiceover(text, {
              voice: "alloy",
              outputFolder: path.join(outFolder, "audio"),
            });
            state.voiceoverPath = wavPath;
            
            // Transcribe audio to timed word timestamps
            const trans = await this.stt.transcribe(wavPath, text);
            const transPath = path.join(outFolder, "audio", "transcript.json");
            await ensureDir(path.dirname(transPath));
            await fs.writeFile(transPath, JSON.stringify(trans, null, 2), "utf8");
            state.transcriptPath = transPath;
            
            step.result = { wavPath, transPath };
            step.status = "completed";
            break;

          case "video_shot_generation":
            const videoJob = await this.bridge.generateVideo(brief, {
              format: "vertical",
              duration: 4,
              outputFolder: path.join(outFolder, "video"),
            });
            // Auto-complete mock job for directory run
            const elapsed = Date.now() - videoJob.createdAt;
            videoJob.status = "completed";
            videoJob.progress = 100;
            const sampleVideo = "/Users/emirhan/Desktop/After_Effects_MCP/PSD_2_20s_AudioSynced_Professional_Ad_MCP.mp4";
            if (videoJob.outputPath) {
              await ensureDir(path.dirname(videoJob.outputPath));
              if (await fs.stat(sampleVideo).catch(() => null)) {
                await fs.copyFile(sampleVideo, videoJob.outputPath);
              } else {
                await fs.writeFile(videoJob.outputPath, "MOCK_VIDEO");
              }
            }
            state.metadata.videoPath = videoJob.outputPath;
            step.result = { videoJob };
            step.status = "completed";
            break;

          case "ae_import_and_assemble":
            state.aepPath = path.join(outFolder, `${projectId}_assembled.aep`);
            const assembleJsx = withReport(`
              app.newProject();
              var comp = app.project.items.addComp("MASTER_COMP", 1080, 1920, 1, 12, 30);
              
              // Import backdrop image
              var imgFile = new File(${JSON.stringify(state.psdPath)});
              if (imgFile.exists) {
                var imgItem = app.project.importFile(new ImportOptions(imgFile));
                comp.layers.add(imgItem);
              }
              
              // Import voiceover audio
              var sndFile = new File(${JSON.stringify(state.voiceoverPath)});
              if (sndFile.exists) {
                var sndItem = app.project.importFile(new ImportOptions(sndFile));
                comp.layers.add(sndItem);
              }
              
              app.project.save(new File(${JSON.stringify(state.aepPath)}));
              __result.output = ${JSON.stringify(state.aepPath)};
            `);
            
            // Validate JSX
            const dryRunRes = this.dryRun.validate(assembleJsx);
            if (!dryRunRes.valid) {
              throw new Error(`JSX validation failed: ${JSON.stringify(dryRunRes.issues)}`);
            }
            
            const runRes = await runJsx(assembleJsx, this.log);
            if (!runRes.ok) {
              throw new Error(`After Effects run failed: ${runRes.error}`);
            }
            
            step.status = "completed";
            break;

          case "ae_apply_vfx_and_titles":
            // Apply a neon glow + text animation
            const vfxJsx = withReport(`
              var aepFile = new File(${JSON.stringify(state.aepPath)});
              if (aepFile.exists) {
                app.open(aepFile);
                var comp = app.project.item(1);
                var textLayer = comp.layers.addText(${JSON.stringify(state.brandKit.brandName)});
                textLayer.name = "TitleText";
                
                // Add animated light sweep
                MP.addLightSweep(textLayer, 0.5, 1.5, "expoOut");
                
                // Save project
                app.project.save();
              }
            `);
            const runVfxRes = await runJsx(vfxJsx, this.log);
            if (!runVfxRes.ok) {
              throw new Error(`After Effects VFX run failed: ${runVfxRes.error}`);
            }
            step.status = "completed";
            break;

          case "render_and_package":
            state.outputPath = path.join(outFolder, "render.mp4");
            const renders = [
              {
                aepPath: state.aepPath!,
                compName: "MASTER_COMP",
                outputVideoPath: state.outputPath,
                maxRetries: this.opts.maxRetries ?? 2,
              }
            ];
            
            const renderResults = await this.farm.renderBatch(renders);
            const failed = renderResults.filter(r => r.status === "failed");
            if (failed.length > 0) {
              throw new Error(`Render failed: ${failed[0].error}`);
            }
            
            state.status = "completed";
            step.status = "completed";
            break;
        }
      } catch (err) {
        step.status = "failed";
        step.error = (err as Error).message;
        state.status = "failed";
        await this.stateManager.saveState(state);
        this.log.error(`Step ${step.name} failed: ${step.error}`);
        throw err;
      }
    }

    state.status = "completed";
    await this.stateManager.saveState(state);
    return state;
  }
}
