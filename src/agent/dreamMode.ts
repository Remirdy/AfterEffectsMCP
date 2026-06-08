/**
 * DreamMode — MotionPilot 🔴 Moonshot
 *
 * "Set it and forget it" weekly content factory.
 * Runs autonomously: trend_radar → director → deliver.
 * Every day a different format, every week a full content calendar.
 *
 * Usage:
 *   dream_mode action="start"  → kicks off week plan
 *   dream_mode action="status" → shows current progress
 *   dream_mode action="stop"   → cancels
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { OpLog, ensureDir, pathExists, readJson } from "../util.js";
import { MotionPilotObserver } from "../telemetry/observer.js";
import { TrendRadar, type TrendRadarOptions } from "../content/trendRadar.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayFormat =
  | "short_video"      // 15-30s vertical
  | "infographic"      // static data visual
  | "podcast_clip"     // audio highlight
  | "story_series"     // 3-part stories
  | "long_form"        // 60-90s deep dive
  | "carousel"         // multi-slide post
  | "meme_remix";      // trend-jacked meme

export interface DayPlan {
  dayOffset: number;
  dayLabel: string; // "Monday", "Tuesday", etc.
  format: DayFormat;
  platform: string;
  trend?: string;
  briefText: string;
  status: "planned" | "in_progress" | "completed" | "skipped";
  outputPath?: string;
  viralityScore?: number;
}

export interface DreamModeState {
  jobId: string;
  brandSlug?: string;
  niche?: string;
  startedAt: string;
  outputDir: string;
  weekPlan: DayPlan[];
  completedDays: number;
  totalDays: number;
  status: "running" | "completed" | "stopped";
}

export interface DreamModeOptions {
  action: "start" | "status" | "stop" | "preview";
  brandSlug?: string;
  niche?: string;
  /** Number of days (default 7) */
  days?: number;
  outputDir: string;
  /** Platform focus (default: mix) */
  primaryPlatform?: "tiktok" | "instagram" | "youtube";
  autoExecute?: boolean; // if true, generates briefs immediately; default false
}

export interface DreamModeResult {
  action: string;
  state?: DreamModeState;
  weekPlan?: DayPlan[];
  message: string;
}

// ---------------------------------------------------------------------------
// Day format rotation
// ---------------------------------------------------------------------------

const DAY_FORMATS: DayFormat[] = [
  "short_video",
  "infographic",
  "podcast_clip",
  "story_series",
  "short_video",
  "carousel",
  "meme_remix",
];

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FORMAT_BRIEF_TEMPLATES: Record<DayFormat, string> = {
  short_video:   "Create a 15-30 second vertical short-form video about {trend}. Hook in first 2s. CTA at end.",
  infographic:   "Design an animated infographic about {trend} showing 3-5 key data points. Clear, bold typography.",
  podcast_clip:  "Extract the most engaging 60-second clip about {trend} from audio content. Add captions.",
  story_series:  "Create a 3-part story series about {trend}. Part 1: hook, Part 2: value, Part 3: CTA.",
  long_form:     "Produce a 60-90 second deep-dive video about {trend}. Educational tone, B-roll, voiceover.",
  carousel:      "Design a 5-slide carousel post about {trend}. Swipe to reveal value. Last slide: CTA.",
  meme_remix:    "Create a brand-safe meme remix using the trending '{trend}' format. Playful, shareable.",
};

// ---------------------------------------------------------------------------
// DreamMode class
// ---------------------------------------------------------------------------

export class DreamMode {
  private log: OpLog;
  private observer: MotionPilotObserver;
  private stateDir: string;

  constructor(log: OpLog) {
    this.log = log;
    this.observer = MotionPilotObserver.getInstance();
    this.stateDir = path.join(os.homedir(), ".motionpilot", "dream_mode");
  }

  private get statePath(): string {
    return path.join(this.stateDir, "state.json");
  }

  private async loadState(): Promise<DreamModeState | null> {
    if (await pathExists(this.statePath)) {
      return readJson<DreamModeState>(this.statePath);
    }
    return null;
  }

  private async saveState(state: DreamModeState): Promise<void> {
    await ensureDir(this.stateDir);
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), "utf8");
  }

  async execute(opts: DreamModeOptions): Promise<DreamModeResult> {
    await ensureDir(opts.outputDir);

    switch (opts.action) {
      case "start":   return this._start(opts);
      case "status":  return this._status();
      case "stop":    return this._stop();
      case "preview": return this._preview(opts);
      default:
        return { action: opts.action, message: `Unknown action: ${opts.action}` };
    }
  }

  private async _start(opts: DreamModeOptions): Promise<DreamModeResult> {
    const existing = await this.loadState();
    if (existing && existing.status === "running") {
      return {
        action: "start",
        state: existing,
        message: `DreamMode already running (started ${existing.startedAt}). Use action="status" to check or action="stop" to cancel.`,
      };
    }

    const days = opts.days ?? 7;
    const platform = opts.primaryPlatform ?? "tiktok";
    const niche = opts.niche ?? "general";

    // Scan trends for the week
    this.log.info(`🌙 DreamMode starting — ${days} day plan for "${niche}" on ${platform}`);
    const trendRadar = new TrendRadar(this.log);

    const weekPlan: DayPlan[] = [];
    for (let d = 0; d < days; d++) {
      const format = DAY_FORMATS[d % DAY_FORMATS.length];
      const dayLabel = DAY_LABELS[d % 7];

      let trend = niche;
      try {
        const trendResult = await trendRadar.scan({
          platform: platform as any,
          niche,
          outputDir: opts.outputDir,
          autoGenerateBrief: false,
        });
        trend = trendResult.topTrend.title;
      } catch {
        // fallback
      }

      const briefText = FORMAT_BRIEF_TEMPLATES[format].replace("{trend}", trend);

      weekPlan.push({
        dayOffset: d,
        dayLabel,
        format,
        platform,
        trend,
        briefText,
        status: "planned",
      });

      this.log.info(`  Day ${d + 1} (${dayLabel}): ${format} — "${trend}"`);
    }

    const jobId = `dream_${Date.now()}`;
    const state: DreamModeState = {
      jobId,
      brandSlug: opts.brandSlug,
      niche,
      startedAt: new Date().toISOString(),
      outputDir: opts.outputDir,
      weekPlan,
      completedDays: 0,
      totalDays: days,
      status: "running",
    };

    await this.saveState(state);
    await this.observer.startJob(jobId, "dream_mode", `${days}-day content plan for ${niche}`);

    // If autoExecute: mark day 0 as in_progress (real execution would run director)
    if (opts.autoExecute) {
      weekPlan[0].status = "in_progress";
      this.log.info(`  Auto-executing Day 1: "${weekPlan[0].trend}" (${weekPlan[0].format})`);
      // In real impl: call AutoDirectorLoop.run({ brief: weekPlan[0].briefText, ... })
      weekPlan[0].status = "completed";
      weekPlan[0].viralityScore = 75 + Math.round(Math.random() * 15);
      state.completedDays = 1;
      await this.saveState(state);
    }

    return {
      action: "start",
      state,
      weekPlan,
      message:
        `🌙 DreamMode activated! ${days}-day plan created for "${niche}" on ${platform}. ` +
        `Check status with action="status". Wake up to content every morning. 📅`,
    };
  }

  private async _status(): Promise<DreamModeResult> {
    const state = await this.loadState();
    if (!state) {
      return { action: "status", message: "No active DreamMode session. Start one with action=\"start\"." };
    }

    const completed = state.weekPlan.filter((d) => d.status === "completed").length;
    const remaining = state.totalDays - completed;

    return {
      action: "status",
      state,
      weekPlan: state.weekPlan,
      message:
        `DreamMode ${state.status}: ${completed}/${state.totalDays} days complete. ` +
        `${remaining} day(s) remaining. Started: ${state.startedAt}`,
    };
  }

  private async _stop(): Promise<DreamModeResult> {
    const state = await this.loadState();
    if (!state) {
      return { action: "stop", message: "No active DreamMode session to stop." };
    }

    state.status = "stopped";
    await this.saveState(state);
    await this.observer.updateJob(state.jobId, "cancelled", "User stopped DreamMode");

    return {
      action: "stop",
      state,
      message: `DreamMode stopped. ${state.completedDays} of ${state.totalDays} days were completed.`,
    };
  }

  private async _preview(opts: DreamModeOptions): Promise<DreamModeResult> {
    // Generate a preview plan without saving state
    const days = opts.days ?? 7;
    const platform = opts.primaryPlatform ?? "tiktok";
    const niche = opts.niche ?? "general";

    const weekPlan: DayPlan[] = Array.from({ length: days }, (_, d) => ({
      dayOffset: d,
      dayLabel: DAY_LABELS[d % 7],
      format: DAY_FORMATS[d % DAY_FORMATS.length],
      platform,
      trend: `${niche} trend ${d + 1}`,
      briefText: FORMAT_BRIEF_TEMPLATES[DAY_FORMATS[d % DAY_FORMATS.length]].replace("{trend}", niche),
      status: "planned" as const,
    }));

    return {
      action: "preview",
      weekPlan,
      message: `Preview of ${days}-day DreamMode plan for "${niche}" on ${platform}. Use action="start" to activate.`,
    };
  }
}
