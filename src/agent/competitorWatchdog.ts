/**
 * CompetitorWatchdog — MotionPilot
 *
 * Monitors competitor channels for new content, analyzes it with
 * viral_autopsy logic, and generates counter-content briefs.
 *
 * Data flow:
 *  1. Load watchlist from ~/.motionpilot/watchdog/watchlist.json
 *  2. For each competitor: fetch latest content metadata (RSS/mock)
 *  3. Compare against known content cache → detect new items
 *  4. Analyze new items → generate counter-brief
 *  5. Save updated cache + report
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { OpLog, ensureDir, pathExists, readJson } from "../util.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompetitorEntry {
  name: string;
  slug: string;
  /** YouTube channel URL, RSS feed URL, or any public URL */
  url: string;
  platform: "youtube" | "tiktok" | "instagram" | "rss";
  niche?: string;
}

export interface DetectedContent {
  competitorSlug: string;
  title: string;
  publishedAt: string;
  url: string;
  estimatedViralScore: number;
  detectedStrengths: string[];
  counterBrief: string;
  isNew: boolean;
}

export interface WatchlistConfig {
  competitors: CompetitorEntry[];
  lastScanAt?: string;
}

export interface WatchdogOptions {
  action: "add_competitor" | "scan" | "list" | "remove_competitor";
  competitor?: CompetitorEntry;
  slug?: string; // for remove
  outputDir: string;
}

export interface WatchdogResult {
  action: string;
  competitors?: CompetitorEntry[];
  detectedContent?: DetectedContent[];
  newContentCount?: number;
  reportPath?: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Mock content generator (simulates fetching new posts)
// ---------------------------------------------------------------------------

const CONTENT_TEMPLATES = [
  "Summer Sale Campaign — Bold CTA focus",
  "Product Launch Video — Unboxing hook",
  "Customer Testimonial Compilation",
  "Behind the Scenes — Brand story",
  "Educational explainer — How it works",
  "Limited Offer — Countdown urgency",
  "Trend reaction — Viral audio remix",
];

const STRENGTH_POOL = [
  "Strong hook in first 2 seconds",
  "Clear and urgent CTA",
  "High contrast thumbnail",
  "Fast pacing under 15 seconds",
  "Emotional storytelling",
  "Trending audio used",
  "Problem-solution structure",
  "Bold typography",
];

function generateMockContent(competitor: CompetitorEntry, existingCount: number): DetectedContent[] {
  // Simulate 0-2 new items per competitor
  const seed = competitor.slug.charCodeAt(0) + Date.now() % 7;
  const newCount = seed % 3;

  return Array.from({ length: newCount }, (_, i) => {
    const templateIdx = (seed + i) % CONTENT_TEMPLATES.length;
    const title = CONTENT_TEMPLATES[templateIdx];
    const strengths = STRENGTH_POOL.filter((_, si) => (seed + si) % 3 === 0).slice(0, 3);
    const score = 55 + (seed % 35);

    const counterBrief = `Counter-strategy for "${title}" by ${competitor.name}: ` +
      `Focus on ${competitor.niche ?? "your product"} with stronger ${strengths[0] ?? "hook"}. ` +
      `Use same pacing but add unique angle: show behind-the-scenes or customer result. ` +
      `Target same audience but differentiate with authenticity over polish.`;

    return {
      competitorSlug: competitor.slug,
      title,
      publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
      url: `${competitor.url}#post_${existingCount + i}`,
      estimatedViralScore: score,
      detectedStrengths: strengths,
      counterBrief,
      isNew: true,
    };
  });
}

// ---------------------------------------------------------------------------
// CompetitorWatchdog class
// ---------------------------------------------------------------------------

export class CompetitorWatchdog {
  private log: OpLog;
  private watchdogDir: string;
  private watchlistPath: string;
  private cachePath: string;

  constructor(log: OpLog) {
    this.log = log;
    this.watchdogDir = path.join(os.homedir(), ".motionpilot", "watchdog");
    this.watchlistPath = path.join(this.watchdogDir, "watchlist.json");
    this.cachePath = path.join(this.watchdogDir, "content_cache.json");
  }

  async execute(opts: WatchdogOptions): Promise<WatchdogResult> {
    await ensureDir(this.watchdogDir);
    await ensureDir(opts.outputDir);

    switch (opts.action) {
      case "add_competitor":
        return this._addCompetitor(opts);
      case "remove_competitor":
        return this._removeCompetitor(opts);
      case "list":
        return this._listCompetitors();
      case "scan":
        return this._scan(opts.outputDir);
      default:
        return { action: opts.action, message: `Unknown action: ${opts.action}` };
    }
  }

  private async _loadWatchlist(): Promise<WatchlistConfig> {
    if (await pathExists(this.watchlistPath)) {
      return readJson<WatchlistConfig>(this.watchlistPath);
    }
    return { competitors: [] };
  }

  private async _saveWatchlist(config: WatchlistConfig): Promise<void> {
    config.lastScanAt = new Date().toISOString();
    await fs.writeFile(this.watchlistPath, JSON.stringify(config, null, 2), "utf8");
  }

  private async _loadCache(): Promise<Record<string, string[]>> {
    if (await pathExists(this.cachePath)) {
      return readJson<Record<string, string[]>>(this.cachePath);
    }
    return {};
  }

  private async _saveCache(cache: Record<string, string[]>): Promise<void> {
    await fs.writeFile(this.cachePath, JSON.stringify(cache, null, 2), "utf8");
  }

  private async _addCompetitor(opts: WatchdogOptions): Promise<WatchdogResult> {
    if (!opts.competitor) {
      return { action: "add_competitor", message: "No competitor data provided." };
    }
    const config = await this._loadWatchlist();
    const existing = config.competitors.findIndex((c) => c.slug === opts.competitor!.slug);
    if (existing >= 0) {
      config.competitors[existing] = opts.competitor;
      this.log.info(`Updated competitor: ${opts.competitor.name}`);
    } else {
      config.competitors.push(opts.competitor);
      this.log.info(`Added competitor: ${opts.competitor.name}`);
    }
    await this._saveWatchlist(config);
    return {
      action: "add_competitor",
      competitors: config.competitors,
      message: `Competitor "${opts.competitor.name}" added to watchlist (${config.competitors.length} total).`,
    };
  }

  private async _removeCompetitor(opts: WatchdogOptions): Promise<WatchdogResult> {
    const config = await this._loadWatchlist();
    const before = config.competitors.length;
    config.competitors = config.competitors.filter((c) => c.slug !== opts.slug);
    await this._saveWatchlist(config);
    return {
      action: "remove_competitor",
      competitors: config.competitors,
      message: `Removed ${before - config.competitors.length} competitor(s). ${config.competitors.length} remaining.`,
    };
  }

  private async _listCompetitors(): Promise<WatchdogResult> {
    const config = await this._loadWatchlist();
    return {
      action: "list",
      competitors: config.competitors,
      message: `${config.competitors.length} competitor(s) in watchlist.`,
    };
  }

  private async _scan(outputDir: string): Promise<WatchdogResult> {
    const config = await this._loadWatchlist();
    if (config.competitors.length === 0) {
      return {
        action: "scan",
        detectedContent: [],
        newContentCount: 0,
        message: "No competitors in watchlist. Use action=add_competitor first.",
      };
    }

    const cache = await this._loadCache();
    const allDetected: DetectedContent[] = [];

    this.log.info(`Scanning ${config.competitors.length} competitor(s)...`);

    for (const competitor of config.competitors) {
      this.log.info(`  Scanning: ${competitor.name} (${competitor.platform})`);
      const existingUrls = cache[competitor.slug] ?? [];
      const detected = generateMockContent(competitor, existingUrls.length);

      for (const item of detected) {
        if (!existingUrls.includes(item.url)) {
          existingUrls.push(item.url);
          allDetected.push(item);
          this.log.info(`    NEW: "${item.title}" (viral score: ${item.estimatedViralScore})`);
        }
      }

      cache[competitor.slug] = existingUrls;
    }

    await this._saveCache(cache);

    // Save report
    const reportPath = path.join(outputDir, `watchdog_report_${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify({ scannedAt: new Date().toISOString(), detected: allDetected }, null, 2), "utf8");

    this.log.info(`Scan complete: ${allDetected.length} new items detected.`);

    return {
      action: "scan",
      detectedContent: allDetected,
      newContentCount: allDetected.length,
      reportPath,
      message: `Scanned ${config.competitors.length} competitor(s), found ${allDetected.length} new item(s).`,
    };
  }
}
