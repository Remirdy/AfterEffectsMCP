/**
 * Runway ML REST API adaptor for MotionPilot video generation.
 *
 * Supports Runway Gen-3 Alpha API (Gen-3 Turbo / standard).
 * Falls back gracefully when RUNWAY_API_KEY is not set.
 *
 * Env vars:
 *   RUNWAY_API_KEY   — Runway API secret key
 *   RUNWAY_MODEL     — model id, default "gen3a_turbo"
 *
 * Docs: https://docs.runwayml.com/reference/gen-3-alpha-turbo
 */

import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, ensureDir } from "../util.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RunwayFormat = "vertical" | "horizontal" | "square";

export interface RunwayVideoRequest {
  prompt: string;
  format?: RunwayFormat;
  duration?: 4 | 8 | 10;
  /** Optional base64 or public URL image to use as first-frame reference */
  imagePromptUrl?: string;
  outputDir: string;
}

export interface RunwayVideoResult {
  jobId: string;
  status: "completed" | "pending" | "failed";
  outputPath?: string;
  videoUrl?: string;
  error?: string;
  provider: "runway" | "mock";
}

// ---------------------------------------------------------------------------
// Resolution mapping
// ---------------------------------------------------------------------------

const FORMAT_TO_RATIO: Record<RunwayFormat, string> = {
  vertical: "768:1280",
  horizontal: "1280:768",
  square: "960:960",
};

// ---------------------------------------------------------------------------
// RunwayAdaptor
// ---------------------------------------------------------------------------

export class RunwayAdaptor {
  private log: OpLog;
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.runwayml.com/v1";

  constructor(log: OpLog) {
    this.log = log;
    this.apiKey = process.env.RUNWAY_API_KEY ?? "";
    this.model = process.env.RUNWAY_MODEL ?? "gen3a_turbo";
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Generate a video clip from a text prompt. Returns a VideoResult.
   * If API key is absent or generation fails, returns a mock result.
   */
  async generateVideo(req: RunwayVideoRequest): Promise<RunwayVideoResult> {
    await ensureDir(req.outputDir);
    const jobId = `runway_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (!this.isConfigured) {
      this.log.warn("RUNWAY_API_KEY not set — returning mock RunwayVideoResult.");
      return {
        jobId,
        status: "pending",
        provider: "mock",
        outputPath: path.join(req.outputDir, `${jobId}.mp4`),
      };
    }

    const ratio = FORMAT_TO_RATIO[req.format ?? "vertical"];
    const duration = req.duration ?? 4;

    // --- Step 1: create a generation task ---
    this.log.info(`[Runway] Creating generation task: "${req.prompt.slice(0, 60)}…" (${ratio}, ${duration}s)`);

    let taskId: string;
    try {
      const body: Record<string, unknown> = {
        model: this.model,
        prompt_text: req.prompt,
        ratio,
        duration,
      };
      if (req.imagePromptUrl) {
        body.prompt_image = req.imagePromptUrl;
      }

      const createRes = await fetch(`${this.baseUrl}/image_to_video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify(body),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Runway API error ${createRes.status}: ${errText}`);
      }

      const created = (await createRes.json()) as { id: string };
      taskId = created.id;
      this.log.info(`[Runway] Task created: ${taskId}`);
    } catch (err) {
      const msg = `Runway task creation failed: ${(err as Error).message}`;
      this.log.error(msg);
      return { jobId, status: "failed", error: msg, provider: "runway" };
    }

    // --- Step 2: poll until complete (max 3 min) ---
    const maxAttempts = 36; // 36 × 5s = 3 min
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(5000);

      let task: { status: string; output?: string[] | null; failure?: string };
      try {
        const pollRes = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Runway-Version": "2024-11-06",
          },
        });
        if (!pollRes.ok) throw new Error(`Poll ${pollRes.status}`);
        task = (await pollRes.json()) as typeof task;
      } catch (err) {
        this.log.warn(`[Runway] Poll attempt ${attempt + 1} failed: ${(err as Error).message}`);
        continue;
      }

      this.log.info(`[Runway] Task ${taskId} status: ${task.status} (attempt ${attempt + 1})`);

      if (task.status === "SUCCEEDED" && task.output?.[0]) {
        const videoUrl = task.output[0];
        const outputPath = path.join(req.outputDir, `${jobId}.mp4`);

        // --- Step 3: download the video ---
        try {
          this.log.info(`[Runway] Downloading video → ${path.basename(outputPath)}`);
          const dlRes = await fetch(videoUrl);
          if (!dlRes.ok) throw new Error(`Download error ${dlRes.status}`);
          const buffer = Buffer.from(await dlRes.arrayBuffer());
          await fs.writeFile(outputPath, buffer);
          this.log.info(`[Runway] Video saved: ${outputPath}`);
        } catch (err) {
          this.log.warn(`[Runway] Download failed, returning URL only: ${(err as Error).message}`);
          return { jobId, status: "completed", videoUrl, provider: "runway" };
        }

        return { jobId, status: "completed", outputPath, videoUrl, provider: "runway" };
      }

      if (task.status === "FAILED") {
        return { jobId, status: "failed", error: task.failure ?? "Unknown Runway failure", provider: "runway" };
      }
    }

    return { jobId, status: "failed", error: "Runway task timed out after 3 minutes", provider: "runway" };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
