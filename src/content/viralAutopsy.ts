import path from "node:path";
import fs from "node:fs/promises";
import { OpLog, assertFile, ensureDir } from "../util.js";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ViralAutopsyOptions {
  videoPath: string;
  outputDir: string;
  generateFixPlan?: boolean; // default true
}

export interface AutopsyIssue {
  severity: "critical" | "warning" | "suggestion";
  timeSec?: number;
  issue: string;
  fix: string;
}

export interface ViralAutopsyResult {
  overallScore: number; // 0-100
  verdict: "viral_potential" | "needs_work" | "poor";
  issues: AutopsyIssue[];
  strengths: string[];
  fixPlan: string;
  reportPath: string;
}

// ── ViralAutopsy ──────────────────────────────────────────────────────────────

export class ViralAutopsy {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  // ── Diagnostic engine ─────────────────────────────────────────────────────

  private runDiagnostics(
    videoPath: string,
    durationSec: number,
    fileSizeBytes: number
  ): AutopsyIssue[] {
    const issues: AutopsyIssue[] = [];
    const filename = path.basename(videoPath).toLowerCase();

    // ── Duration checks ────────────────────────────────────────────────────

    if (durationSec < 6) {
      issues.push({
        severity: "critical",
        timeSec: 0,
        issue: "Too short for message delivery",
        fix: "Extend video to at least 15–30 seconds to allow the hook, message, and CTA to land.",
      });
    } else if (durationSec > 45) {
      issues.push({
        severity: "warning",
        timeSec: 30,
        issue: "Attention typically drops sharply after 30s on short-form platforms",
        fix: "Trim content to under 30 seconds or restructure so the key message appears before 15s.",
      });
    }

    // ── Hook timing ───────────────────────────────────────────────────────

    if (durationSec > 3 && !filename.includes("hook")) {
      issues.push({
        severity: "suggestion",
        timeSec: 0,
        issue: "No explicit hook pattern detected in file metadata",
        fix: 'Add a strong visual or audio hook within the first 2–3 seconds (e.g. bold text, dramatic cut, or surprising sound).',
      });
    }

    // ── Resolution / quality proxy ────────────────────────────────────────

    if (fileSizeBytes < 5 * 1024 * 1024) {
      issues.push({
        severity: "warning",
        timeSec: undefined,
        issue: "File size suggests potentially low resolution or heavy compression",
        fix: "Re-export at minimum 1080p with a higher bitrate (>= 8 Mbps for social platforms).",
      });
    }

    // ── Common structural improvements (always added as suggestions) ───────

    issues.push({
      severity: "suggestion",
      timeSec: Math.round(durationSec * 0.1),
      issue: "Opening frame may lack a clear visual focal point",
      fix: "Use rule-of-thirds framing or a centred subject for the opening shot.",
    });

    issues.push({
      severity: "suggestion",
      timeSec: Math.round(durationSec * 0.85),
      issue: "CTA placement not confirmed",
      fix: "Ensure a clear call-to-action appears in the final 20% of the video, both as text and voiceover.",
    });

    if (durationSec > 15) {
      issues.push({
        severity: "suggestion",
        timeSec: Math.round(durationSec * 0.5),
        issue: "Mid-video engagement dip is common",
        fix: "Insert a pattern interrupt at the midpoint (e.g. text flash, sound effect, quick cut).",
      });
    }

    return issues;
  }

  // ── Score calculator ──────────────────────────────────────────────────────

  private calculateScore(issues: AutopsyIssue[]): number {
    let score = 70;
    for (const issue of issues) {
      if (issue.severity === "critical") score -= 20;
      else if (issue.severity === "warning") score -= 10;
      // suggestions don't reduce score but were considered for fixPlan
    }
    return Math.max(0, Math.min(100, score));
  }

  // ── Strength derivation ───────────────────────────────────────────────────

  private deriveStrengths(durationSec: number, fileSizeBytes: number, filename: string): string[] {
    const strengths: string[] = [];

    if (durationSec >= 15 && durationSec <= 30) {
      strengths.push("Optimal duration for short-form platforms (15–30s)");
    } else if (durationSec > 30 && durationSec <= 60) {
      strengths.push("Mid-length format supports story arc development");
    }

    if (fileSizeBytes >= 5 * 1024 * 1024) {
      strengths.push("File size indicates higher-quality export suitable for social upload");
    }

    const lname = filename.toLowerCase();
    if (lname.includes("hook") || lname.includes("viral") || lname.includes("promo")) {
      strengths.push("Filename suggests intentional viral production strategy");
    } else {
      strengths.push("Content shows potential for platform-native engagement");
    }

    return strengths.slice(0, 3);
  }

  // ── Fix plan builder ──────────────────────────────────────────────────────

  private buildFixPlan(issues: AutopsyIssue[]): string {
    const ordered = [
      ...issues.filter((i) => i.severity === "critical"),
      ...issues.filter((i) => i.severity === "warning"),
      ...issues.filter((i) => i.severity === "suggestion"),
    ];

    const steps = ordered.map((issue, idx) => {
      const timeLabel = issue.timeSec !== undefined ? ` [~${issue.timeSec}s]` : "";
      return `${idx + 1}. [${issue.severity.toUpperCase()}]${timeLabel} ${issue.issue}\n   → ${issue.fix}`;
    });

    return `VIRAL AUTOPSY — ACTION PLAN\n${"─".repeat(40)}\n${steps.join("\n\n")}`;
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  async autopsy(opts: ViralAutopsyOptions): Promise<ViralAutopsyResult> {
    const { videoPath, outputDir, generateFixPlan = true } = opts;

    this.log.info(`ViralAutopsy: analysing ${path.basename(videoPath)}`);

    // 1. Validate input and ensure output dir exists
    await assertFile(videoPath, "videoPath");
    await ensureDir(outputDir);

    // 2. Estimate duration from file size
    const stat = await fs.stat(videoPath);
    const fileSizeBytes = stat.size;
    const estimatedDurationSec = Math.min(300, fileSizeBytes / 50_000);
    this.log.info(
      `File size: ${fileSizeBytes} bytes → estimated duration: ${estimatedDurationSec.toFixed(1)}s`
    );

    // 3. Run diagnostic checks
    const issues = this.runDiagnostics(videoPath, estimatedDurationSec, fileSizeBytes);
    this.log.info(
      `Diagnostics complete: ${issues.filter((i) => i.severity === "critical").length} critical, ` +
        `${issues.filter((i) => i.severity === "warning").length} warnings, ` +
        `${issues.filter((i) => i.severity === "suggestion").length} suggestions`
    );

    // 4. Score
    const overallScore = this.calculateScore(issues);
    this.log.info(`Overall virality score: ${overallScore}/100`);

    // 5. Verdict
    let verdict: "viral_potential" | "needs_work" | "poor";
    if (overallScore >= 75) {
      verdict = "viral_potential";
    } else if (overallScore >= 50) {
      verdict = "needs_work";
    } else {
      verdict = "poor";
    }

    // 6. Strengths
    const strengths = this.deriveStrengths(
      estimatedDurationSec,
      fileSizeBytes,
      path.basename(videoPath)
    );

    // 7. Fix plan
    const fixPlan = generateFixPlan ? this.buildFixPlan(issues) : "Fix plan generation disabled.";

    // 8. Save report JSON
    const timestamp = Date.now();
    const reportPath = path.join(outputDir, `viral_autopsy_${timestamp}.json`);
    const report: ViralAutopsyResult = {
      overallScore,
      verdict,
      issues,
      strengths,
      fixPlan,
      reportPath,
    };
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    this.log.info(`Autopsy report saved to: ${reportPath}`);

    return report;
  }
}
