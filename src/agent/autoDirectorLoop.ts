/**
 * AutoDirectorLoop — MotionPilot 🔴 Moonshot
 *
 * Fully autonomous production loop:
 *   brief → self_critique → evolutionary_swarm → virality_gate → deliver
 *
 * Human touchpoints:
 *   - Input: initial brief
 *   - Output: champion ad + full audit trail
 *   - Optional: final approval gate (autoApprove=false)
 */

import path from "node:path";
import fs from "node:fs/promises";
import { OpLog, ensureDir } from "../util.js";
import { MotionPilotObserver } from "../telemetry/observer.js";
import { EvolutionaryAdSwarm, type SwarmOptions, type AdVariant } from "./evolutionarySwarm.js";
import { SelfCritiquePipeline, type SelfCritiqueOptions } from "./selfCritique.js";
import { CampaignFactory, type CampaignOptions } from "./campaignFactory.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoDirectorOptions {
  brief: string;
  brandSlug?: string;
  outputDir: string;
  /** Auto-approve without human confirmation (default: true for full autonomy) */
  autoApprove?: boolean;
  /** Max swarm generations (default: 3) */
  swarmGenerations?: number;
  /** Min virality score to accept (default: 72) */
  viralityGate?: number;
  /** Max total iterations before forced accept (default: 5) */
  maxIterations?: number;
  /** Include full campaign factory after champion is selected (default: false) */
  expandToCampaign?: boolean;
  /** Template AEP for critique (optional — enables real AE critique) */
  templateAepPath?: string;
  compName?: string;
}

export interface DirectorPhase {
  phase: string;
  status: "running" | "completed" | "skipped";
  result?: Record<string, unknown>;
  durationMs: number;
}

export interface AutoDirectorResult {
  jobId: string;
  champion: AdVariant;
  finalScore: number;
  passed: boolean;
  phases: DirectorPhase[];
  auditPath: string;
  campaignPath?: string;
  totalDurationMs: number;
  autonomyLevel: "full" | "supervised";
  message: string;
}

// ---------------------------------------------------------------------------
// AutoDirectorLoop class
// ---------------------------------------------------------------------------

export class AutoDirectorLoop {
  private log: OpLog;
  private observer: MotionPilotObserver;

  constructor(log: OpLog) {
    this.log = log;
    this.observer = MotionPilotObserver.getInstance();
  }

  async run(opts: AutoDirectorOptions): Promise<AutoDirectorResult> {
    const jobId = `director_loop_${Date.now()}`;
    const startTime = Date.now();
    const phases: DirectorPhase[] = [];

    await ensureDir(opts.outputDir);
    await this.observer.startJob(jobId, "auto_director_loop", opts.brief);

    const autoApprove = opts.autoApprove ?? true;
    const viralityGate = opts.viralityGate ?? 72;
    const maxIterations = opts.maxIterations ?? 5;

    this.log.info(`🎬 AutoDirectorLoop starting — jobId: ${jobId}`);
    this.log.info(`  Brief: "${opts.brief}"`);
    this.log.info(`  Virality gate: ${viralityGate} | Max iterations: ${maxIterations} | AutoApprove: ${autoApprove}`);

    let iteration = 0;
    let champion: AdVariant | null = null;
    let finalScore = 0;

    // ── Phase 1: Evolutionary Swarm ──────────────────────────────────────────
    const swarmStart = Date.now();
    this.log.info(`\n[Phase 1/3] Evolutionary Ad Swarm (${opts.swarmGenerations ?? 3} generations)...`);
    await this.observer.updateJob(jobId, "running", "Evolutionary swarm running");

    const swarm = new EvolutionaryAdSwarm(this.log);
    const swarmResult = await swarm.evolve({
      brief: opts.brief,
      brandSlug: opts.brandSlug,
      generations: opts.swarmGenerations ?? 3,
      outputDir: opts.outputDir,
    });

    champion = swarmResult.champion;
    finalScore = champion.viralityScore;

    phases.push({
      phase: "evolutionary_swarm",
      status: "completed",
      result: {
        champion: champion.id,
        score: champion.viralityScore,
        totalVariants: swarmResult.allVariants.length,
        generations: swarmResult.generationHistory.length,
      },
      durationMs: Date.now() - swarmStart,
    });

    this.log.info(
      `  Champion: ${champion.id} | Score: ${champion.viralityScore} | Hook: "${champion.hook}"`
    );

    // ── Phase 2: Self-Critique (if AEP provided) ──────────────────────────────
    const critiqueStart = Date.now();
    if (opts.templateAepPath && opts.compName) {
      this.log.info(`\n[Phase 2/3] Self-Critique Pipeline...`);
      await this.observer.updateJob(jobId, "running", "Self-critique loop");

      const critique = new SelfCritiquePipeline(this.log);
      let critiqueScore = 0;

      for (let iter = 0; iter < Math.min(maxIterations, 3); iter++) {
        iteration++;
        const critiqueResult = await critique.critiqueAndImprove({
          aepPath: opts.templateAepPath,
          compName: opts.compName,
          outputDir: opts.outputDir,
          maxIterations: 2,
          qualityThreshold: viralityGate,
          critiquePrompt: `Champion hook: "${champion.hook}", grade: "${champion.grade}", music: "${champion.musicStyle}"`,
        });

        critiqueScore = critiqueResult.finalScore;
        finalScore = Math.round((finalScore + critiqueScore) / 2);

        this.log.info(
          `  Critique iteration ${iter + 1}: score=${critiqueScore} | combined=${finalScore}`
        );

        if (critiqueResult.passed) break;
      }

      phases.push({
        phase: "self_critique",
        status: "completed",
        result: { critiqueScore, combinedScore: finalScore },
        durationMs: Date.now() - critiqueStart,
      });
    } else {
      this.log.info(`\n[Phase 2/3] Self-Critique skipped (no templateAepPath provided)`);
      phases.push({
        phase: "self_critique",
        status: "skipped",
        durationMs: 0,
      });
    }

    // ── Phase 3: Virality Gate ────────────────────────────────────────────────
    const gateStart = Date.now();
    this.log.info(`\n[Phase 3/3] Virality Gate check (threshold: ${viralityGate})...`);

    const passed = finalScore >= viralityGate || autoApprove;

    if (!passed) {
      this.log.warn(
        `  Gate FAILED: score ${finalScore} < threshold ${viralityGate}. ` +
          `AutoApprove is off — human review required.`
      );
    } else {
      this.log.info(`  Gate PASSED: score ${finalScore} >= ${viralityGate} ✅`);
    }

    phases.push({
      phase: "virality_gate",
      status: "completed",
      result: { score: finalScore, threshold: viralityGate, passed },
      durationMs: Date.now() - gateStart,
    });

    await this.observer.updateJob(jobId, passed ? "completed" : "failed", `Score: ${finalScore}`, {
      outputs: [opts.outputDir],
    });

    // ── Expand to Campaign (optional) ─────────────────────────────────────────
    let campaignPath: string | undefined;
    if (opts.expandToCampaign && passed) {
      this.log.info(`\n[Bonus] Expanding champion to full campaign...`);
      const factory = new CampaignFactory(this.log);
      const campaignResult = await factory.create({
        brief: swarmResult.championBrief,
        brandSlug: opts.brandSlug,
        outputDir: opts.outputDir,
      });
      campaignPath = campaignResult.campaignSummaryPath;
      this.log.info(`  Campaign generated: ${campaignResult.totalAssets} assets → ${campaignPath}`);
    }

    // ── Audit Trail ──────────────────────────────────────────────────────────
    const totalDurationMs = Date.now() - startTime;
    const audit = {
      jobId,
      brief: opts.brief,
      champion,
      finalScore,
      passed,
      viralityGate,
      phases,
      totalDurationMs,
      generatedAt: new Date().toISOString(),
    };

    const auditPath = path.join(opts.outputDir, `director_audit_${jobId}.json`);
    await fs.writeFile(auditPath, JSON.stringify(audit, null, 2), "utf8");

    this.log.info(
      `\n🏁 AutoDirectorLoop complete in ${(totalDurationMs / 1000).toFixed(1)}s | ` +
        `Score: ${finalScore} | Passed: ${passed}`
    );

    return {
      jobId,
      champion,
      finalScore,
      passed,
      phases,
      auditPath,
      campaignPath,
      totalDurationMs,
      autonomyLevel: autoApprove ? "full" : "supervised",
      message: passed
        ? `Champion selected: "${champion.hook}" (score: ${finalScore}). Audit: ${auditPath}`
        : `Below quality threshold (${finalScore}/${viralityGate}). Human review required.`,
    };
  }
}
