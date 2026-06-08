/**
 * MotionPilot Observability / Telemetry
 *
 * Centralised in-process event store for director job state.
 * Persists events to ~/.motionpilot/telemetry/<date>.jsonl so they survive
 * between MCP tool calls within the same day.
 *
 * Design goals:
 *  - Zero-dependency (only Node core + fs)
 *  - Never throws – errors are silently logged so the calling tool never fails
 *    because of a telemetry write
 *  - Thread-safe via an async write queue
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface JobEvent {
  jobId: string;
  /** MotionPilot tool that created this job, e.g. "director_brief" */
  tool: string;
  status: JobStatus;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Short human-readable summary or error message */
  message?: string;
  /** Arbitrary structured payload (metrics, output paths, etc.) */
  payload?: Record<string, unknown>;
}

export interface JobState {
  jobId: string;
  tool: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  events: JobEvent[];
  /** Final output or artifact paths */
  outputs?: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// MotionPilotObserver – singleton
// ---------------------------------------------------------------------------

export class MotionPilotObserver {
  private static _instance: MotionPilotObserver | null = null;

  /** In-memory job state cache */
  private jobs = new Map<string, JobState>();

  /** Persistent log directory */
  private logDir: string;

  /** Write-queue to avoid concurrent append conflicts */
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor() {
    this.logDir = path.join(os.homedir(), ".motionpilot", "telemetry");
  }

  public static getInstance(): MotionPilotObserver {
    if (!MotionPilotObserver._instance) {
      MotionPilotObserver._instance = new MotionPilotObserver();
    }
    return MotionPilotObserver._instance;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Create a new job in "queued" state and return its initial state. */
  async startJob(jobId: string, tool: string, message?: string, payload?: Record<string, unknown>): Promise<JobState> {
    const now = new Date().toISOString();
    const event: JobEvent = { jobId, tool, status: "queued", timestamp: now, message, payload };
    const state: JobState = {
      jobId,
      tool,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      events: [event],
    };
    this.jobs.set(jobId, state);
    await this._appendEvent(event);
    return state;
  }

  /** Transition an existing job to a new status. */
  async updateJob(
    jobId: string,
    status: JobStatus,
    message?: string,
    payload?: Record<string, unknown>
  ): Promise<JobState | null> {
    const state = this.jobs.get(jobId);
    if (!state) return null;

    const now = new Date().toISOString();
    const event: JobEvent = { jobId, tool: state.tool, status, timestamp: now, message, payload };
    state.status = status;
    state.updatedAt = now;
    state.events.push(event);

    if (payload?.outputs && Array.isArray(payload.outputs)) {
      state.outputs = payload.outputs as string[];
    }
    if (status === "failed" && message) {
      state.error = message;
    }

    await this._appendEvent(event);
    return state;
  }

  /** Get current in-memory state for a job. */
  getJob(jobId: string): JobState | null {
    return this.jobs.get(jobId) ?? null;
  }

  /** List all tracked jobs (optionally filter by status). */
  listJobs(filterStatus?: JobStatus): JobState[] {
    const all = Array.from(this.jobs.values());
    if (filterStatus) return all.filter((j) => j.status === filterStatus);
    return all;
  }

  /** Return a JSON snapshot for MCP tool responses. */
  snapshot(jobId?: string): Record<string, unknown> {
    if (jobId) {
      return (this.getJob(jobId) as unknown as Record<string, unknown>) ?? { error: `Job ${jobId} not found` };
    }
    return {
      totalJobs: this.jobs.size,
      byStatus: {
        queued: this.listJobs("queued").length,
        running: this.listJobs("running").length,
        completed: this.listJobs("completed").length,
        failed: this.listJobs("failed").length,
        cancelled: this.listJobs("cancelled").length,
      },
      recentJobs: Array.from(this.jobs.values())
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 10)
        .map((j) => ({
          jobId: j.jobId,
          tool: j.tool,
          status: j.status,
          updatedAt: j.updatedAt,
          error: j.error,
          outputs: j.outputs,
        })),
    };
  }

  // -------------------------------------------------------------------------
  // Persistence (best-effort JSONL append)
  // -------------------------------------------------------------------------

  private async _appendEvent(event: JobEvent): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this._doAppend(event)).catch(() => {});
    await this.writeQueue;
  }

  private async _doAppend(event: JobEvent): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const logFile = path.join(this.logDir, `${dateStr}.jsonl`);
      await fs.appendFile(logFile, JSON.stringify(event) + "\n", "utf8");
    } catch {
      // Silently swallow – telemetry must never break the calling tool
    }
  }
}
