import path from 'node:path';
import { OpLog, assertFile, ensureDir } from '../util.js';
import { SttTranscribe } from '../audio/stt.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VoiceBriefOptions {
  audioPath: string;          // recorded voice file
  outputDir: string;
  autoLaunchDirector?: boolean; // default false
  brandSlug?: string;
}

export interface VoiceBriefResult {
  ok: boolean;
  transcribedText: string;
  parsedBrief: {
    product?: string;
    tone?: string;
    duration?: number;
    platform?: string;
    target?: string;
    raw: string;
  };
  directorReadyBrief: string;
  message: string;
}

// ─── VoiceBriefMode class ─────────────────────────────────────────────────────

export class VoiceBriefMode {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async processVoiceBrief(opts: VoiceBriefOptions): Promise<VoiceBriefResult> {
    const { audioPath, outputDir, autoLaunchDirector = false, brandSlug } = opts;

    try {
      await assertFile(audioPath, 'audioPath');
      await ensureDir(outputDir);

      // ── Transcribe ──────────────────────────────────────────────────────────
      this.log.info(`Transcribing voice brief: ${audioPath}`);
      const stt = new SttTranscribe(this.log);
      const transcription = await stt.transcribe(audioPath);
      const text = transcription.text;
      this.log.info(`Transcription complete (${transcription.words.length} words)`);

      // ── Parse key fields from transcript ────────────────────────────────────
      const parsedBrief = this.parseTranscript(text);

      // ── Enrich with brand slug if provided ─────────────────────────────────
      if (brandSlug) {
        this.log.info(`Brand context: ${brandSlug} (attach via brand_brain for full integration)`);
      }

      // ── Build director-ready brief ──────────────────────────────────────────
      const directorReadyBrief = this.buildDirectorBrief(parsedBrief, brandSlug);

      // ── Log summary ─────────────────────────────────────────────────────────
      this.log.info(
        `Voice brief processed: ${parsedBrief.duration ?? '?'}s brief for ${parsedBrief.product ?? 'unknown product'}`
      );

      if (autoLaunchDirector) {
        this.log.info(
          'autoLaunchDirector=true noted — pass directorReadyBrief to motionpilot_director to continue'
        );
      }

      return {
        ok: true,
        transcribedText: text,
        parsedBrief,
        directorReadyBrief,
        message: 'Voice brief processed successfully',
      };
    } catch (err) {
      const msg = (err as Error).message;
      this.log.error(`VoiceBriefMode.processVoiceBrief failed: ${msg}`);
      return {
        ok: false,
        transcribedText: '',
        parsedBrief: { raw: '' },
        directorReadyBrief: '',
        message: msg,
      };
    }
  }

  // ─── Parser ────────────────────────────────────────────────────────────────

  private parseTranscript(text: string): VoiceBriefResult['parsedBrief'] {
    const lower = text.toLowerCase();

    // ── Duration ────────────────────────────────────────────────────────────
    let duration: number | undefined;
    const durationPatterns = [
      // e.g. "30 saniye", "30 second", "30s", "30sn", "30 seconds"
      /(\d+)\s*(?:saniye|second|seconds|sn\b|secs?)/i,
      // e.g. "saniye 30"
      /(?:saniye|second|seconds|sn)\s*(\d+)/i,
    ];
    for (const pat of durationPatterns) {
      const m = text.match(pat);
      if (m) {
        duration = parseInt(m[1], 10);
        break;
      }
    }

    // ── Tone ────────────────────────────────────────────────────────────────
    let tone: string | undefined;
    if (/eğlenceli|fun|playful/i.test(text)) {
      tone = 'playful';
    } else if (/ciddi|professional|serious/i.test(text)) {
      tone = 'professional';
    } else if (/bold|güçlü|powerful|strong/i.test(text)) {
      tone = 'bold';
    } else if (/minimal|clean|simple/i.test(text)) {
      tone = 'minimal';
    }

    // ── Platform ────────────────────────────────────────────────────────────
    let platform: string | undefined;
    if (/tiktok/i.test(text)) {
      platform = 'tiktok';
    } else if (/instagram|reels?/i.test(text)) {
      platform = 'reels';
    } else if (/youtube|shorts/i.test(text)) {
      platform = 'youtube_shorts';
    }

    // ── Target audience ─────────────────────────────────────────────────────
    let target: string | undefined;
    const targetMatch = text.match(
      /(?:hedef kitle|target audience|for|için)\s+([a-zA-ZğüşıöçĞÜŞİÖÇ\s]{3,30}?)(?:\.|,|$)/i
    );
    if (targetMatch) {
      target = targetMatch[1].trim();
    }

    // ── Product ──────────────────────────────────────────────────────────────
    // Look for first noun phrase after trigger words
    let product: string | undefined;
    const productTriggers = [
      /(?:reklam|ad|advertisement)\s+(?:için\s+)?([a-zA-ZğüşıöçĞÜŞİÖÇ\s]{2,30}?)(?:\s+için|\s+için\s|\.|,|$)/i,
      /(?:for|için)\s+([a-zA-ZğüşıöçĞÜŞİÖÇ\s]{2,30}?)(?:\s+reklam|\s+ad|\s+video|\.|,|$)/i,
      /(?:product|ürün|marka|brand)\s*[:=]?\s*([a-zA-ZğüşıöçĞÜŞİÖÇ\d\s]{2,30}?)(?:\.|,|\s{2}|$)/i,
    ];
    for (const pat of productTriggers) {
      const m = text.match(pat);
      if (m) {
        product = m[1].trim();
        break;
      }
    }
    // Fallback: first capitalised proper noun in the text
    if (!product) {
      const properNounMatch = text.match(/\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)\b/);
      if (properNounMatch) {
        product = properNounMatch[1];
      }
    }

    return {
      product,
      tone,
      duration,
      platform,
      target,
      raw: text,
    };
  }

  // ─── Director brief builder ────────────────────────────────────────────────

  private buildDirectorBrief(
    parsed: VoiceBriefResult['parsedBrief'],
    brandSlug?: string
  ): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════',
      '  MOTIONPILOT VOICE BRIEF → DIRECTOR BRIEF',
      '═══════════════════════════════════════════════',
    ];

    if (parsed.product) lines.push(`Product    : ${parsed.product}`);
    if (parsed.tone)    lines.push(`Tone       : ${parsed.tone}`);
    if (parsed.platform) lines.push(`Platform   : ${parsed.platform}`);
    if (parsed.duration != null) lines.push(`Duration   : ${parsed.duration}s`);
    if (parsed.target)  lines.push(`Target     : ${parsed.target}`);
    if (brandSlug)      lines.push(`Brand      : ${brandSlug}`);

    lines.push('');
    lines.push('RAW TRANSCRIPT:');
    lines.push(parsed.raw);
    lines.push('');
    lines.push('STRUCTURED BRIEF:');

    const structured: string[] = [];

    if (parsed.product) {
      structured.push(`Create a ${parsed.tone ?? 'compelling'} video ad for ${parsed.product}.`);
    } else {
      structured.push(`Create a ${parsed.tone ?? 'compelling'} video ad.`);
    }

    if (parsed.platform) {
      const fmtMap: Record<string, string> = {
        tiktok: '9:16 vertical, ≤60s TikTok format',
        reels: '9:16 vertical, ≤30s Instagram Reels format',
        youtube_shorts: '9:16 vertical, ≤60s YouTube Shorts format',
      };
      structured.push(`Format: ${fmtMap[parsed.platform] ?? parsed.platform}.`);
    }

    if (parsed.duration != null) {
      structured.push(`Target duration: ${parsed.duration} seconds.`);
    }

    if (parsed.target) {
      structured.push(`Target audience: ${parsed.target}.`);
    }

    if (brandSlug) {
      structured.push(
        `Apply brand guidelines from brand_brain slug '${brandSlug}' (palette, fonts, tone).`
      );
    }

    structured.push('Open with a strong hook. Close with a clear CTA.');

    lines.push(structured.join(' '));
    lines.push('═══════════════════════════════════════════════');

    return lines.join('\n');
  }
}
