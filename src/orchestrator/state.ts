import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists, readJson, writeJson } from "../util.js";

export interface ProjectState {
  projectId: string;
  brief: string;
  status: "idle" | "planning" | "generating_assets" | "animating" | "rendering" | "completed" | "failed";
  currentStep: number;
  steps: Array<{
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    result?: any;
    error?: string;
  }>;
  brandKit?: any;
  psdPath?: string;
  analysisPath?: string;
  motionPlanPath?: string;
  voiceoverPath?: string;
  transcriptPath?: string;
  aepPath?: string;
  outputPath?: string;
  metadata: Record<string, any>;
  updatedAt: number;
}

export class ProjectStateManager {
  private stateFilePath: string;

  constructor(workspaceDir: string, projectId: string) {
    this.stateFilePath = path.join(workspaceDir, ".motionpilot", `state_${projectId}.json`);
  }

  async loadState(): Promise<ProjectState | null> {
    try {
      if (await pathExists(this.stateFilePath)) {
        return await readJson<ProjectState>(this.stateFilePath);
      }
    } catch (e) {
      // Ignore reading errors
    }
    return null;
  }

  async saveState(state: ProjectState): Promise<void> {
    state.updatedAt = Date.now();
    await ensureDir(path.dirname(this.stateFilePath));
    await writeJson(this.stateFilePath, state);
  }

  async initializeState(projectId: string, brief: string): Promise<ProjectState> {
    const state: ProjectState = {
      projectId,
      brief,
      status: "idle",
      currentStep: 0,
      steps: [
        { name: "brand_ingest", status: "pending" },
        { name: "ad_concept", status: "pending" },
        { name: "assets_generation", status: "pending" },
        { name: "audio_voiceover", status: "pending" },
        { name: "video_shot_generation", status: "pending" },
        { name: "ae_import_and_assemble", status: "pending" },
        { name: "ae_apply_vfx_and_titles", status: "pending" },
        { name: "render_and_package", status: "pending" },
      ],
      metadata: {},
      updatedAt: Date.now(),
    };
    await this.saveState(state);
    return state;
  }
}
