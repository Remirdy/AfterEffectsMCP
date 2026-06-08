import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, ensureDir } from "../util.js";
import { MotionPilotObserver } from "../telemetry/observer.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignOptions {
  brief: string;
  brandSlug?: string;
  heroVideoDurationSec?: number; // default 30
  platforms?: Array<"tiktok" | "instagram" | "youtube" | "facebook">; // default all
  includeStaticPosts?: boolean;    // default true
  includePublishCalendar?: boolean; // default true
  outputDir: string;
}

export interface PlatformCutdown {
  platform: string;
  durationSec: number;
  aspectRatio: string;
  description: string;
  keyChanges: string[];
}

export interface StaticPost {
  index: number;
  platform: string;
  format: string;
  description: string;
  altText: string;
  hashtags: string[];
}

export interface CalendarEntry {
  dayOffset: number; // days from campaign start
  platform: string;
  contentType: string;
  title: string;
  notes: string;
}

export interface CampaignResult {
  heroVideo: { brief: string; durationSec: number; spec: string };
  platformCutdowns: PlatformCutdown[];
  staticPosts: StaticPost[];
  publishCalendar: CalendarEntry[];
  campaignSummaryPath: string;
  totalAssets: number;
}

// ---------------------------------------------------------------------------
// Platform cutdown specs
// ---------------------------------------------------------------------------

type PlatformKey = "tiktok" | "instagram" | "youtube" | "facebook";

interface CutdownSpec {
  durationSec: number;
  aspectRatio: string;
  description: string;
  keyChanges: string[];
}

function buildCutdownsForPlatform(
  platform: PlatformKey,
  brief: string,
  heroDuration: number
): CutdownSpec[] {
  switch (platform) {
    case "tiktok":
      return [
        {
          durationSec: 6,
          aspectRatio: "9:16",
          description: `TikTok 6s ultra-short hook — distills the single most arresting visual from the hero`,
          keyChanges: [
            "Hook tightened to first 1.5s of hero footage",
            "CTA moved to frame 4s with burn-in text",
            "Music cut to drop beat only",
            "Safe zone crop for 9:16 (top 80% active)",
          ],
        },
        {
          durationSec: 15,
          aspectRatio: "9:16",
          description: `TikTok 15s short-form — story arc compressed: hook → product → CTA`,
          keyChanges: [
            "Problem/solution beat compressed to 6s",
            "Product reveal at 10s (moved from 22s in hero)",
            "Voiceover trimmed to key tagline only",
            "Caption overlay added for sound-off viewing",
          ],
        },
        {
          durationSec: heroDuration,
          aspectRatio: "9:16",
          description: `TikTok full-length vertical — hero regraded for TikTok's brighter display profile`,
          keyChanges: [
            "Reframed to 9:16 with intelligent subject tracking",
            "Display brightness +10% for TikTok OLED compression",
            "End card CTA updated with TikTok-native follow prompt",
          ],
        },
      ];

    case "instagram":
      return [
        {
          durationSec: 15,
          aspectRatio: "9:16",
          description: `Instagram Reel 15s — punchy, music-forward cut optimised for the Reels feed`,
          keyChanges: [
            "Hook text on-screen within first 0.3s",
            "Beat-synced cuts throughout",
            "Branded watermark repositioned to top-right safe zone",
            "Thumbnail frame selected at peak visual moment (4.1s)",
          ],
        },
        {
          durationSec: heroDuration,
          aspectRatio: "1:1",
          description: `Instagram Feed 1:1 — square crop of hero video for in-feed autoplay`,
          keyChanges: [
            "Center-crop to 1:1; subject always centered",
            "Captions added in lower-third (Instagram native font match)",
            "CTA at 13s: 'Link in bio' prompt added",
            "Color grade warmed +200K for Instagram feed aesthetic",
          ],
        },
      ];

    case "youtube":
      return [
        {
          durationSec: heroDuration,
          aspectRatio: "16:9",
          description: `YouTube pre-roll 30s — full hero for skippable in-stream placement`,
          keyChanges: [
            "Skip-safe hook delivered in first 5s (brand + hook)",
            "YouTube end card template added at 25–30s",
            "Audio loudness normalized to -14 LUFS (YouTube standard)",
            "Custom thumbnail frame extracted at 2.8s",
          ],
        },
        {
          durationSec: 15,
          aspectRatio: "16:9",
          description: `YouTube Shorts 15s — horizontal crop adapted for Shorts feed`,
          keyChanges: [
            "Horizontal 16:9 retained (no reframe needed)",
            "Title card added at frame 0 with brand name",
            "Subscribe CTA watermark in top-right from 10s",
          ],
        },
      ];

    case "facebook":
      return [
        {
          durationSec: 15,
          aspectRatio: "16:9",
          description: `Facebook Feed 15s — optimised for silent autoplay in news feed`,
          keyChanges: [
            "First 3s: text-only visual hook for sound-off viewers",
            "Subtitles added as SRT burn-in",
            "CTA button area left clear in lower-right for overlay",
            "Color grade desaturated -5% to match Facebook's feed tone",
          ],
        },
        {
          durationSec: heroDuration,
          aspectRatio: "16:9",
          description: `Facebook In-Stream 30s — longer-form for engaged audience segments`,
          keyChanges: [
            "Facebook-safe font sizing (min 24pt on 1920px)",
            "Brand logo held for full first 2s",
            "Privacy overlay safe zone respected (no text in lower 10%)",
          ],
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// Static post generator
// ---------------------------------------------------------------------------

function generateStaticPosts(
  platforms: PlatformKey[],
  brief: string,
  brandSlug: string
): StaticPost[] {
  const posts: StaticPost[] = [];

  const postTemplates: Array<{
    platformFn: (p: PlatformKey[]) => PlatformKey;
    format: string;
    descriptionFn: (brand: string) => string;
    altTextFn: (brand: string) => string;
    hashtags: string[];
  }> = [
    {
      platformFn: (p) => (p.includes("instagram") ? "instagram" : p[0]),
      format: "1:1 Square (1080×1080)",
      descriptionFn: (b) => `Hero product shot with bold headline overlay. Brand palette dominant. "${b}" wordmark bottom-center.`,
      altTextFn: (b) => `${b} product hero image with campaign headline`,
      hashtags: [`#${brandSlug}`, "#ad", "#newdrop", "#brand"],
    },
    {
      platformFn: (p) => (p.includes("instagram") ? "instagram" : p[0]),
      format: "4:5 Portrait (1080×1350)",
      descriptionFn: (b) => `Lifestyle context shot: product in-use, natural lighting. Caption space at bottom 20%.`,
      altTextFn: (b) => `${b} lifestyle shot showing product in everyday use`,
      hashtags: [`#${brandSlug}`, "#lifestyle", "#authentic", "#moments"],
    },
    {
      platformFn: (p) => (p.includes("facebook") ? "facebook" : p[0]),
      format: "16:9 Landscape (1200×628)",
      descriptionFn: (b) => `Facebook link preview card: split layout — product left, benefit bullets right. CTA button area reserved.`,
      altTextFn: (b) => `${b} campaign split-layout ad with product and key benefits`,
      hashtags: [`#${brandSlug}`, "#sale", "#limitedtime"],
    },
    {
      platformFn: (p) => (p.includes("tiktok") ? "tiktok" : p[p.length - 1]),
      format: "9:16 Vertical (1080×1920)",
      descriptionFn: (b) => `TikTok story card: bold typographic layout with brand accent color, single impactful stat or claim center-frame.`,
      altTextFn: (b) => `${b} vertical story card with bold typographic layout`,
      hashtags: [`#${brandSlug}`, "#fyp", "#viral", "#foryou"],
    },
    {
      platformFn: (p) => (p.includes("youtube") ? "youtube" : p[0]),
      format: "16:9 Thumbnail (1280×720)",
      descriptionFn: (b) => `YouTube thumbnail: high-contrast face/emotion + product + bold red/yellow text. 85% visual weight in left 2/3.`,
      altTextFn: (b) => `${b} YouTube thumbnail with high contrast and bold text`,
      hashtags: [`#${brandSlug}`, "#youtube", "#watch"],
    },
  ];

  for (let i = 0; i < Math.min(5, postTemplates.length); i++) {
    const tmpl = postTemplates[i];
    const platform = tmpl.platformFn(platforms);
    posts.push({
      index: i + 1,
      platform,
      format: tmpl.format,
      description: tmpl.descriptionFn(brandSlug),
      altText: tmpl.altTextFn(brandSlug),
      hashtags: tmpl.hashtags,
    });
  }

  return posts;
}

// ---------------------------------------------------------------------------
// Publish calendar generator (2-week schedule)
// ---------------------------------------------------------------------------

function generatePublishCalendar(
  platforms: PlatformKey[],
  heroDuration: number
): CalendarEntry[] {
  const calendar: CalendarEntry[] = [];

  // Day 1: Hero video launch on all platforms simultaneously
  for (const platform of platforms) {
    calendar.push({
      dayOffset: 1,
      platform,
      contentType: "hero_video",
      title: `Hero Video Launch — ${platform}`,
      notes: `Publish ${heroDuration}s hero cut. Boost with paid spend. Pin comment with CTA link. Monitor first-hour engagement.`,
    });
  }

  // Day 3: TikTok / Reels short-form push
  const shortFormPlatforms = platforms.filter((p) => p === "tiktok" || p === "instagram");
  for (const platform of (shortFormPlatforms.length ? shortFormPlatforms : [platforms[0]])) {
    calendar.push({
      dayOffset: 3,
      platform,
      contentType: "short_video",
      title: `Short-Form Amplification — ${platform}`,
      notes: `Publish 15s cut. Use trending audio remix if available. Respond to all comments in first 2h. Reshare any UGC.`,
    });
  }

  // Day 5: Static post wave 1
  calendar.push({
    dayOffset: 5,
    platform: "instagram",
    contentType: "static_post",
    title: "Static Post Wave 1 — Hero Product Shot",
    notes: "Carousel of 3 static posts: hero, lifestyle, testimonial. Caption includes link-in-bio. Schedule at peak engagement hour (7–9pm local).",
  });

  if (platforms.includes("facebook")) {
    calendar.push({
      dayOffset: 5,
      platform: "facebook",
      contentType: "static_post",
      title: "Static Post Wave 1 — Facebook Link Card",
      notes: "Landscape link preview card. A/B test two headline variants. Allocate $50 boost targeting lookalike audience.",
    });
  }

  // Day 7: Engagement / response content
  for (const platform of platforms.slice(0, 2)) {
    calendar.push({
      dayOffset: 7,
      platform,
      contentType: "engagement_content",
      title: `Engagement Response — ${platform}`,
      notes: "Reply-video or Q&A format addressing top questions from Day 1–5 comments. Keep under 30s. Humanise the brand voice.",
    });
  }

  // Day 10: Static post wave 2
  calendar.push({
    dayOffset: 10,
    platform: platforms.includes("instagram") ? "instagram" : platforms[0],
    contentType: "static_post",
    title: "Static Post Wave 2 — Social Proof",
    notes: "Post compilation of user reactions / testimonials. Tag contributors. Use UGC as primary visual asset where possible.",
  });

  if (platforms.includes("tiktok")) {
    calendar.push({
      dayOffset: 10,
      platform: "tiktok",
      contentType: "static_post",
      title: "TikTok Photo Mode — Stats Card",
      notes: "TikTok photo carousel: 3 slides showing campaign results, social proof stats, or product benefits. High-contrast design.",
    });
  }

  // Day 14: Final CTA push across all platforms
  for (const platform of platforms) {
    calendar.push({
      dayOffset: 14,
      platform,
      contentType: "cta_push",
      title: `Final CTA Push — ${platform}`,
      notes: "Last-call creative: 6s ultra-short with urgency copy ('Only X left', 'Offer ends tonight'). Maximum paid spend day. Retarget all video viewers from Day 1.",
    });
  }

  // Sort by dayOffset then platform
  calendar.sort((a, b) => a.dayOffset - b.dayOffset || a.platform.localeCompare(b.platform));
  return calendar;
}

// ---------------------------------------------------------------------------
// Main class
// ---------------------------------------------------------------------------

export class CampaignFactory {
  private log: OpLog;
  private observer: MotionPilotObserver;

  constructor(log: OpLog) {
    this.log = log;
    this.observer = MotionPilotObserver.getInstance();
  }

  async create(opts: CampaignOptions): Promise<CampaignResult> {
    const heroDuration = opts.heroVideoDurationSec ?? 30;
    const platforms: PlatformKey[] = (opts.platforms as PlatformKey[]) ?? ["tiktok", "instagram", "youtube", "facebook"];
    const includeStaticPosts = opts.includeStaticPosts ?? true;
    const includePublishCalendar = opts.includePublishCalendar ?? true;
    const brandSlug = opts.brandSlug ?? "brand";
    const jobId = `campaign_${Date.now()}`;

    await ensureDir(opts.outputDir);
    this.log.info(`CampaignFactory starting — brand: "${brandSlug}", platforms: [${platforms.join(", ")}]`);

    await this.observer.startJob(jobId, "campaign_factory", `Building campaign for "${brandSlug}"`, {
      brief: opts.brief,
      brandSlug,
      platforms,
      heroDuration,
    });

    // ── Hero video spec ───────────────────────────────────────────────────────
    const heroVideo = {
      brief: opts.brief,
      durationSec: heroDuration,
      spec: `${heroDuration}s horizontal 16:9 at 1920×1080, 30fps. Designed as master deliverable for all downstream platform cuts.`,
    };

    this.log.info(`Hero spec: ${heroVideo.spec}`);

    // ── Platform cutdowns ─────────────────────────────────────────────────────
    const platformCutdowns: PlatformCutdown[] = [];

    for (const platform of platforms) {
      const specs = buildCutdownsForPlatform(platform, opts.brief, heroDuration);
      for (const spec of specs) {
        platformCutdowns.push({
          platform,
          durationSec: spec.durationSec,
          aspectRatio: spec.aspectRatio,
          description: spec.description,
          keyChanges: spec.keyChanges,
        });
      }
      this.log.info(`Platform "${platform}": ${specs.length} cutdowns generated`);
    }

    // ── Static posts ──────────────────────────────────────────────────────────
    let staticPosts: StaticPost[] = [];
    if (includeStaticPosts) {
      staticPosts = generateStaticPosts(platforms, opts.brief, brandSlug);
      this.log.info(`Static posts generated: ${staticPosts.length}`);
    }

    // ── Publish calendar ──────────────────────────────────────────────────────
    let publishCalendar: CalendarEntry[] = [];
    if (includePublishCalendar) {
      publishCalendar = generatePublishCalendar(platforms, heroDuration);
      this.log.info(`Calendar entries generated: ${publishCalendar.length}`);
    }

    // ── Asset count ───────────────────────────────────────────────────────────
    const totalAssets = 1 + platformCutdowns.length + staticPosts.length;
    this.log.info(`Total campaign assets: ${totalAssets}`);

    // ── Persist campaign JSON ─────────────────────────────────────────────────
    const timestamp = Date.now();
    const campaignFileName = `campaign_${timestamp}.json`;
    const campaignSummaryPath = path.join(opts.outputDir, campaignFileName);

    const campaignPayload = {
      generatedAt: new Date().toISOString(),
      brief: opts.brief,
      brandSlug,
      heroVideo,
      platformCutdowns,
      staticPosts,
      publishCalendar,
      totalAssets,
    };

    try {
      await fs.writeFile(campaignSummaryPath, JSON.stringify(campaignPayload, null, 2), "utf8");
      this.log.info(`Campaign summary saved: ${campaignSummaryPath}`);
    } catch (writeErr) {
      this.log.warn(`Could not save campaign JSON: ${(writeErr as Error).message}`);
    }

    await this.observer.updateJob(jobId, "running", `Cutdowns: ${platformCutdowns.length}, Static: ${staticPosts.length}, Calendar: ${publishCalendar.length}`, {
      platformCutdownCount: platformCutdowns.length,
      staticPostCount: staticPosts.length,
      calendarEntries: publishCalendar.length,
    });

    const result: CampaignResult = {
      heroVideo,
      platformCutdowns,
      staticPosts,
      publishCalendar,
      campaignSummaryPath,
      totalAssets,
    };

    await this.observer.updateJob(jobId, "completed", `Campaign created — ${totalAssets} total assets`, {
      totalAssets,
      campaignSummaryPath,
      outputs: [campaignSummaryPath],
    });

    this.log.info(
      `CampaignFactory complete — ${totalAssets} assets, ${platformCutdowns.length} cutdowns, ${staticPosts.length} statics, ${publishCalendar.length} calendar entries`
    );

    return result;
  }
}
