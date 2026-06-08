import fs from "node:fs/promises";
import path from "node:path";
import { VideoJob } from "./aiBridge.js";
import { ensureDir, pathExists, readJson, writeJson } from "../util.js";

export class JobQueue {
  private queueFilePath: string;

  constructor(workspaceDir: string) {
    this.queueFilePath = path.join(workspaceDir, ".motionpilot", "ai-jobs.json");
  }

  private async loadJobs(): Promise<Record<string, VideoJob>> {
    try {
      if (await pathExists(this.queueFilePath)) {
        return await readJson<Record<string, VideoJob>>(this.queueFilePath);
      }
    } catch (e) {
      // Ignore reading errors, return empty
    }
    return {};
  }

  private async saveJobs(jobs: Record<string, VideoJob>): Promise<void> {
    await ensureDir(path.dirname(this.queueFilePath));
    await writeJson(this.queueFilePath, jobs);
  }

  async addJob(job: VideoJob): Promise<void> {
    const jobs = await this.loadJobs();
    jobs[job.jobId] = job;
    await this.saveJobs(jobs);
  }

  async getJob(jobId: string): Promise<VideoJob | null> {
    const jobs = await this.loadJobs();
    const job = jobs[jobId];
    if (!job) return null;

    // Simulate progress updates for mock jobs in pending/processing state
    if (job.status === "pending" || job.status === "processing") {
      const elapsed = Date.now() - job.createdAt;
      // Increment progress by 25% per poll, or complete if 4 seconds have passed
      if (elapsed > 4000) {
        job.status = "completed";
        job.progress = 100;
        
        // Generate mock video output by copying an existing mp4 in the workspace if possible
        if (job.outputPath) {
          await ensureDir(path.dirname(job.outputPath));
          const sampleMp4 = "/Users/emirhan/Desktop/After_Effects_MCP/PSD_2_20s_AudioSynced_Professional_Ad_MCP.mp4";
          if (await pathExists(sampleMp4)) {
            await fs.copyFile(sampleMp4, job.outputPath);
          } else {
            // Write a small dummy file if no sample found
            await fs.writeFile(job.outputPath, "MOCK_VIDEO_DATA");
          }
        }
      } else {
        job.status = "processing";
        job.progress = Math.min(99, Math.floor((elapsed / 4000) * 100));
      }
      jobs[jobId] = job;
      await this.saveJobs(jobs);
    }

    return job;
  }

  async updateJob(jobId: string, updates: Partial<VideoJob>): Promise<VideoJob> {
    const jobs = await this.loadJobs();
    if (!jobs[jobId]) {
      throw new Error(`Job not found: ${jobId}`);
    }
    jobs[jobId] = { ...jobs[jobId], ...updates };
    await this.saveJobs(jobs);
    return jobs[jobId];
  }

  async listJobs(): Promise<VideoJob[]> {
    const jobs = await this.loadJobs();
    return Object.values(jobs);
  }
}
