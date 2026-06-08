import fs from 'node:fs/promises';
import path from 'node:path';
import { OpLog, ensureDir } from '../util.js';
import { loadBrand } from '../brand/brain.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TrendRadarOptions {
  platform?: 'tiktok' | 'reels' | 'youtube_shorts'; // default tiktok
  niche?: string;      // e.g. 'fitness', 'tech', 'food'
  brandSlug?: string;  // if set, loads brand context from BrandBrain
  autoGenerateBrief?: boolean; // default true
  outputDir: string;
}

export interface TrendItem {
  title: string;
  format: string;
  estimatedViralScore: number; // 0-100
  soundtrack?: string;
  technique: string;
  briefSuggestion: string;
}

export interface TrendRadarResult {
  ok: boolean;
  trends: TrendItem[];
  topTrend: TrendItem;
  generatedBrief?: string;
  reportPath: string;
  message: string;
}

// ─── Trend templates ──────────────────────────────────────────────────────────

const TREND_TEMPLATES: Record<
  'tiktok' | 'reels' | 'youtube_shorts',
  Array<{ title: string; format: string; technique: string; soundtrack?: string }>
> = {
  tiktok: [
    {
      title: 'POV storytelling',
      format: '9:16 video',
      technique: 'First-person camera, immersive narration, subtle text overlays',
      soundtrack: 'Trending ambient lo-fi beat',
    },
    {
      title: 'Day in the life',
      format: '9:16 video',
      technique: 'Jump cuts, time-lapse segments, aesthetic colour grade',
      soundtrack: 'Upbeat indie pop',
    },
    {
      title: 'Before/After reveal',
      format: '9:16 split-screen',
      technique: 'Wipe transition, dramatic pause, freeze-frame',
      soundtrack: 'Bass-drop reveal audio',
    },
    {
      title: 'Duet challenge',
      format: '9:16 duet',
      technique: 'Side-by-side reaction, mirrored movement, bold CTA overlay',
      soundtrack: 'Viral challenge audio',
    },
    {
      title: 'Trending audio lip-sync',
      format: '9:16 video',
      technique: 'Tight face framing, expressive reaction, quick scene cuts',
      soundtrack: 'Current #1 trending TikTok audio',
    },
  ],
  reels: [
    {
      title: 'Aesthetic product reveal',
      format: '9:16 video',
      technique: 'Slow unboxing, macro shots, cinematic colour grade',
      soundtrack: 'Minimal chill-wave track',
    },
    {
      title: 'Transformation montage',
      format: '9:16 video',
      technique: 'Rapid montage, match-cut transitions, upbeat pacing',
      soundtrack: 'EDM build-up and drop',
    },
    {
      title: 'Tutorial overlay text',
      format: '9:16 video',
      technique: 'Step-by-step captions, zoom-in highlights, end-card CTA',
      soundtrack: 'Background acoustic guitar',
    },
    {
      title: 'Collab spotlight',
      format: '9:16 video',
      technique: 'Interview-style cuts, logo lower-thirds, branded colour bar',
      soundtrack: 'Brand-consistent background music',
    },
    {
      title: 'Slow-mo hero shot',
      format: '9:16 video',
      technique: '120fps slow motion, dramatic freeze, bold supered text',
      soundtrack: 'Cinematic orchestral swell',
    },
  ],
  youtube_shorts: [
    {
      title: 'First 3 seconds hook',
      format: '9:16 short',
      technique: 'Pattern interrupt opener, bold question, fast text flash',
      soundtrack: 'Punchy stinger intro',
    },
    {
      title: 'Comment bait ending',
      format: '9:16 short',
      technique: 'Controversial statement outro, reply-bait graphic, loop trigger',
      soundtrack: 'Tension-hold ambient pad',
    },
    {
      title: 'Rapid fire tips',
      format: '9:16 list video',
      technique: 'Number countdown, fast text overlays, kinetic typography',
      soundtrack: 'Upbeat typing-rhythm beat',
    },
    {
      title: 'Reaction compilation',
      format: '9:16 split-screen',
      technique: 'Grid layout, synced cuts, caption-driven punchlines',
      soundtrack: 'Fun comedic background track',
    },
    {
      title: 'Story time format',
      format: '9:16 talking-head',
      technique: 'Direct-to-camera narrative, zoom cuts, subtitle burn-in',
      soundtrack: 'Subtle background lo-fi',
    },
  ],
};

// ─── Scoring seed utility ─────────────────────────────────────────────────────

/**
 * Deterministic pseudo-random score seeded by niche + platform + index.
 * Score range: 60–95
 */
function seededScore(niche: string, platform: string, index: number): number {
  const seed = [...`${niche}${platform}${index}`].reduce(
    (acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0,
    0
  );
  return 60 + (Math.abs(seed) % 36);
}

// ─── TrendRadar class ─────────────────────────────────────────────────────────

export class TrendRadar {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async scan(opts: TrendRadarOptions): Promise<TrendRadarResult> {
    const {
      platform = 'tiktok',
      niche = 'general',
      brandSlug,
      autoGenerateBrief = true,
      outputDir,
    } = opts;

    try {
      await ensureDir(outputDir);

      // ── Brand context (optional) ────────────────────────────────────────────
      if (brandSlug) {
        this.log.info(
          `Brand context noted: ${brandSlug} (load via brand_brain for full integration)`
        );
        // Non-blocking — brand data is noted for brief enrichment
        await loadBrand(brandSlug, this.log);
      }

      // ── Select 5 random templates from platform bucket ─────────────────────
      const templates = TREND_TEMPLATES[platform] ?? TREND_TEMPLATES['tiktok'];

      // Shuffle using seeded scoring to ensure consistent results for same inputs
      const scored = templates.map((t, i) => ({
        ...t,
        estimatedViralScore: seededScore(niche, platform, i),
      }));

      // Sort descending by score, then pick top 5
      const sorted = [...scored].sort((a, b) => b.estimatedViralScore - a.estimatedViralScore);
      const top5 = sorted.slice(0, 5);

      // ── Build TrendItem list ────────────────────────────────────────────────
      const trends: TrendItem[] = top5.map((t) => ({
        title: t.title,
        format: t.format,
        estimatedViralScore: t.estimatedViralScore,
        soundtrack: t.soundtrack,
        technique: t.technique,
        briefSuggestion: this.buildBriefSuggestion(t.title, niche, platform, t.technique),
      }));

      const topTrend = trends[0];
      this.log.info(
        `Top trend for [${platform}/${niche}]: "${topTrend.title}" (score: ${topTrend.estimatedViralScore})`
      );

      // ── Generate director brief ─────────────────────────────────────────────
      let generatedBrief: string | undefined;
      if (autoGenerateBrief) {
        generatedBrief = this.buildDirectorBrief(topTrend, niche, platform, brandSlug);
        this.log.info('Director brief auto-generated');
      }

      // ── Save report ─────────────────────────────────────────────────────────
      const timestamp = Date.now();
      const reportFileName = `trend_radar_${platform}_${niche}_${timestamp}.json`;
      const reportPath = path.join(outputDir, reportFileName);

      const report = {
        generatedAt: new Date().toISOString(),
        platform,
        niche,
        brandSlug: brandSlug ?? null,
        trends,
        topTrend,
        generatedBrief: generatedBrief ?? null,
      };

      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      this.log.info(`Trend report saved: ${reportPath}`);

      return {
        ok: true,
        trends,
        topTrend,
        generatedBrief,
        reportPath,
        message: `Scanned ${trends.length} trends for [${platform}/${niche}]`,
      };
    } catch (err) {
      const msg = (err as Error).message;
      this.log.error(`TrendRadar.scan failed: ${msg}`);
      // Return a safe empty result
      const empty: TrendItem = {
        title: '',
        format: '',
        estimatedViralScore: 0,
        technique: '',
        briefSuggestion: '',
      };
      return {
        ok: false,
        trends: [],
        topTrend: empty,
        reportPath: '',
        message: msg,
      };
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private buildBriefSuggestion(
    trendTitle: string,
    niche: string,
    platform: string,
    technique: string
  ): string {
    return (
      `Create a "${trendTitle}" video in the ${niche} space optimised for ${platform}. ` +
      `Technique: ${technique}. ` +
      `Open with a strong hook in the first 2 seconds, keep total runtime under 60s, ` +
      `and end with a clear call-to-action.`
    );
  }

  private buildDirectorBrief(
    topTrend: TrendItem,
    niche: string,
    platform: string,
    brandSlug?: string
  ): string {
    const brandNote = brandSlug
      ? `\n- Brand: ${brandSlug} (apply brand palette & tone from brand_brain)`
      : '';

    return [
      `═══════════════════════════════════════════════`,
      `  MOTIONPILOT DIRECTOR BRIEF`,
      `═══════════════════════════════════════════════`,
      `Platform   : ${platform}`,
      `Niche      : ${niche}`,
      `Top Trend  : ${topTrend.title} (viral score: ${topTrend.estimatedViralScore}/100)`,
      `Format     : ${topTrend.format}`,
      `Technique  : ${topTrend.technique}`,
      topTrend.soundtrack ? `Soundtrack : ${topTrend.soundtrack}` : '',
      brandNote,
      ``,
      `SUGGESTED BRIEF:`,
      topTrend.briefSuggestion,
      ``,
      `PRODUCTION NOTES:`,
      `- Hook within first 2–3 seconds is critical`,
      `- Keep caption burn-ins under 6 words per frame`,
      `- End card: include CTA + account handle`,
      `- Export: 1080×1920 @ 30fps, H.264`,
      `═══════════════════════════════════════════════`,
    ]
      .filter((l) => l !== null)
      .join('\n');
  }
}
