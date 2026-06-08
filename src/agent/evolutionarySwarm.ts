import { OpLog, ensureDir } from "../util.js";
import { MotionPilotObserver } from "../telemetry/observer.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwarmOptions {
  brief: string;
  brandSlug?: string;
  populationSize?: number; // default 12
  generations?: number;    // default 3
  outputDir: string;
  hooks?: string[];        // optional custom hook variants
  grades?: string[];       // optional color grade options
  musicStyles?: string[];  // optional music style options
}

export interface AdVariant {
  id: string;
  generation: number;
  hook: string;
  grade: string;
  musicStyle: string;
  pacing: "fast" | "medium" | "slow";
  viralityScore: number;
  parents?: string[]; // IDs of parent variants
}

export interface EvolutionResult {
  champion: AdVariant;
  allVariants: AdVariant[];
  generationHistory: Array<{
    generation: number;
    avgScore: number;
    bestScore: number;
    winner: AdVariant;
  }>;
  evolutionTree: string;   // ASCII tree representation
  championBrief: string;   // ready to use with motionpilot_director
}

// ---------------------------------------------------------------------------
// Default gene pools
// ---------------------------------------------------------------------------

const DEFAULT_HOOKS = [
  "Shocking reveal",
  "Question hook",
  "POV storytelling",
  "Before/after",
  "Countdown",
  "Bold statement",
  "Social proof",
  "Problem agitation",
];

const DEFAULT_GRADES = [
  "Cinematic teal-orange",
  "Vibrant saturated",
  "Minimal clean white",
  "Neon dark",
  "Warm golden hour",
  "Cool dramatic",
];

const DEFAULT_MUSIC_STYLES = [
  "Upbeat electronic",
  "Emotional piano",
  "Hip-hop trap",
  "Inspirational orchestra",
  "Lo-fi chill",
  "Rock energetic",
];

const PACINGS: Array<"fast" | "medium" | "slow"> = ["fast", "medium", "slow"];

// ---------------------------------------------------------------------------
// Seeded pseudo-random helper (deterministic for a given combo string)
// ---------------------------------------------------------------------------

function seededRand(seed: string, offset: number = 0): number {
  let h = offset;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  // Map to [0, 1)
  return ((h >>> 0) % 10000) / 10000;
}

function pickPseudo<T>(arr: T[], seed: string, offset: number = 0): T {
  const idx = Math.floor(seededRand(seed, offset) * arr.length);
  return arr[Math.max(0, Math.min(arr.length - 1, idx))];
}

// ---------------------------------------------------------------------------
// Scoring function
// ---------------------------------------------------------------------------

function scoreVariant(
  hook: string,
  grade: string,
  musicStyle: string,
  pacing: "fast" | "medium" | "slow",
  parentBestScore?: number
): number {
  const combo = `${hook}|${grade}|${musicStyle}`;

  let base: number;
  if (parentBestScore !== undefined) {
    // Inherit 60% of best parent score, add variance
    const variance = (seededRand(combo, 99) - 0.5) * 20; // -10..+10
    base = parentBestScore * 0.6 + 30 + variance;
  } else {
    // Generation 0: 50 ± 25
    base = 50 + (seededRand(combo) - 0.5) * 50; // 25..75
  }

  // Pacing bonus
  if (pacing === "fast") base += 5;

  // Hook bonus
  if (/reveal|before/i.test(hook)) base += 8;

  // Grade bonus for high-contrast
  if (/neon|cinematic|vibrant/i.test(grade)) base += 3;

  // Music bonus
  if (/trap|electronic|rock/i.test(musicStyle)) base += 2;

  return Math.round(Math.min(100, Math.max(1, base)));
}

// ---------------------------------------------------------------------------
// ASCII tree builder
// ---------------------------------------------------------------------------

function buildEvolutionTree(
  allVariants: AdVariant[],
  generationHistory: EvolutionResult["generationHistory"]
): string {
  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════╗");
  lines.push("║      EvolutionaryAdSwarm Tree        ║");
  lines.push("╚══════════════════════════════════════╝");

  for (const genRecord of generationHistory) {
    const { generation, avgScore, bestScore, winner } = genRecord;
    lines.push(`\nGen ${generation} — avg: ${avgScore.toFixed(1)} | best: ${bestScore}`);
    lines.push(`  ★ Champion: [${winner.id}] score=${winner.viralityScore}`);
    lines.push(`    hook:  "${winner.hook}"`);
    lines.push(`    grade: "${winner.grade}"`);
    lines.push(`    music: "${winner.musicStyle}" | pacing: ${winner.pacing}`);

    if (winner.parents && winner.parents.length > 0) {
      lines.push(`    parents: ${winner.parents.join(" × ")}`);
    }

    // List all variants in this generation (truncated)
    const genVariants = allVariants
      .filter((v) => v.generation === generation)
      .sort((a, b) => b.viralityScore - a.viralityScore);

    const shown = genVariants.slice(0, 4);
    for (const v of shown) {
      const marker = v.id === winner.id ? "│★" : "│ ";
      lines.push(`  ${marker} ${v.id}: score=${v.viralityScore} | ${v.hook.slice(0, 18)}`);
    }
    if (genVariants.length > 4) {
      lines.push(`  │  … +${genVariants.length - 4} more`);
    }
  }

  lines.push("\n└── Final champion selected from all generations");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Champion brief builder
// ---------------------------------------------------------------------------

function buildChampionBrief(champion: AdVariant, opts: SwarmOptions): string {
  return [
    `## Champion Ad Brief (EvolutionaryAdSwarm)`,
    ``,
    `**Brand:** ${opts.brandSlug ?? "unknown"}`,
    `**Original Brief:** ${opts.brief}`,
    ``,
    `### Winning Variant: ${champion.id}`,
    `- **Hook Strategy:** ${champion.hook}`,
    `- **Color Grade:** ${champion.grade}`,
    `- **Music Style:** ${champion.musicStyle}`,
    `- **Pacing:** ${champion.pacing}`,
    `- **Virality Score:** ${champion.viralityScore}/100`,
    `- **Generation:** ${champion.generation} (survived ${champion.generation} rounds of selection)`,
    ``,
    `### Recommended Production Notes`,
    `- Open with "${champion.hook}" approach in first 0–2s`,
    `- Apply "${champion.grade}" LUT across all footage`,
    `- Score with "${champion.musicStyle}" track, tempo-matched to ${champion.pacing} edit pace`,
    `- Export vertical (9:16) for social-first distribution`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main class
// ---------------------------------------------------------------------------

export class EvolutionaryAdSwarm {
  private log: OpLog;
  private observer: MotionPilotObserver;

  constructor(log: OpLog) {
    this.log = log;
    this.observer = MotionPilotObserver.getInstance();
  }

  async evolve(opts: SwarmOptions): Promise<EvolutionResult> {
    const populationSize = Math.max(2, opts.populationSize ?? 12);
    const generations = Math.max(1, opts.generations ?? 3);
    const jobId = `swarm_${Date.now()}`;

    await ensureDir(opts.outputDir);
    this.log.info(
      `EvolutionaryAdSwarm starting — pop: ${populationSize}, gens: ${generations}`
    );

    await this.observer.startJob(jobId, "evolutionary_swarm", "Running ad evolution swarm", {
      brief: opts.brief,
      brandSlug: opts.brandSlug,
      populationSize,
      generations,
    });

    // Gene pools
    const hooks = opts.hooks?.length ? opts.hooks : DEFAULT_HOOKS;
    const grades = opts.grades?.length ? opts.grades : DEFAULT_GRADES;
    const musicStyles = opts.musicStyles?.length ? opts.musicStyles : DEFAULT_MUSIC_STYLES;

    const allVariants: AdVariant[] = [];
    const generationHistory: EvolutionResult["generationHistory"] = [];

    let previousGenVariants: AdVariant[] = [];

    // ── Generation loop ───────────────────────────────────────────────────────
    for (let gen = 0; gen < generations; gen++) {
      this.log.info(`--- Generation ${gen} ---`);
      const genVariants: AdVariant[] = [];

      for (let i = 0; i < populationSize; i++) {
        const idBase = `g${gen}_v${i}`;
        let hook: string;
        let grade: string;
        let musicStyle: string;
        let pacing: "fast" | "medium" | "slow";
        let parents: string[] | undefined;
        let viralityScore: number;

        if (gen === 0) {
          // Random initial population
          hook = pickPseudo(hooks, `${opts.brief}_hook_${i}`, gen);
          grade = pickPseudo(grades, `${opts.brief}_grade_${i}`, gen + 100);
          musicStyle = pickPseudo(musicStyles, `${opts.brief}_music_${i}`, gen + 200);
          pacing = pickPseudo(PACINGS, `${opts.brief}_pacing_${i}`, gen + 300);
          viralityScore = scoreVariant(hook, grade, musicStyle, pacing);
        } else {
          // Cross-pollinate from top-3 of previous generation
          const top3 = [...previousGenVariants]
            .sort((a, b) => b.viralityScore - a.viralityScore)
            .slice(0, 3);

          const parentA = top3[i % top3.length];
          const parentB = top3[(i + 1) % top3.length];
          const parentC = top3[(i + 2) % top3.length];

          hook = parentA.hook;
          grade = parentB.grade;
          musicStyle = parentC.musicStyle;
          pacing = parentA.pacing;
          parents = [parentA.id, parentB.id, parentC.id];

          // Mutation: 20% chance to randomly swap one gene
          const mutRoll = seededRand(`mut_${idBase}_${opts.brief}`, gen * i + 7);
          if (mutRoll < 0.2) {
            const geneChoice = Math.floor(seededRand(`gene_${idBase}`, gen) * 4);
            if (geneChoice === 0) hook = pickPseudo(hooks, `mut_hook_${idBase}`, gen);
            else if (geneChoice === 1) grade = pickPseudo(grades, `mut_grade_${idBase}`, gen);
            else if (geneChoice === 2) musicStyle = pickPseudo(musicStyles, `mut_music_${idBase}`, gen);
            else pacing = pickPseudo(PACINGS, `mut_pacing_${idBase}`, gen);
            this.log.info(`Mutation applied on variant ${idBase} (gene ${["hook","grade","music","pacing"][geneChoice]})`);
          }

          const bestParentScore = Math.max(...top3.map((p) => p.viralityScore));
          viralityScore = scoreVariant(hook, grade, musicStyle, pacing, bestParentScore);
        }

        const variant: AdVariant = {
          id: idBase,
          generation: gen,
          hook,
          grade,
          musicStyle,
          pacing,
          viralityScore,
          ...(parents ? { parents } : {}),
        };

        genVariants.push(variant);
        allVariants.push(variant);
        this.log.info(`  Variant ${idBase}: score=${viralityScore}, hook="${hook}", grade="${grade}"`);
      }

      // Record generation stats
      const scores = genVariants.map((v) => v.viralityScore);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const bestScore = Math.max(...scores);
      const winner = genVariants.find((v) => v.viralityScore === bestScore)!;

      generationHistory.push({ generation: gen, avgScore, bestScore, winner });
      this.log.info(`Gen ${gen} — avg: ${avgScore.toFixed(1)}, best: ${bestScore}, winner: ${winner.id}`);

      await this.observer.updateJob(jobId, "running", `Gen ${gen} complete — best: ${bestScore}`, {
        generation: gen,
        avgScore,
        bestScore,
        winnerId: winner.id,
      });

      previousGenVariants = genVariants;
    }

    // ── Champion selection ────────────────────────────────────────────────────
    const champion = allVariants.reduce((best, v) =>
      v.viralityScore > best.viralityScore ? v : best
    );

    this.log.info(`Champion: ${champion.id} — score=${champion.viralityScore}`);

    // ── Build outputs ─────────────────────────────────────────────────────────
    const evolutionTree = buildEvolutionTree(allVariants, generationHistory);
    const championBrief = buildChampionBrief(champion, opts);

    const result: EvolutionResult = {
      champion,
      allVariants,
      generationHistory,
      evolutionTree,
      championBrief,
    };

    // Save outputs to disk (best-effort)
    try {
      const { writeJson } = await import("../util.js");
      const resultsPath = `${opts.outputDir}/swarm_result_${Date.now()}.json`;
      await writeJson(resultsPath, {
        champion,
        generationHistory,
        totalVariants: allVariants.length,
        championBrief,
      });
      this.log.info(`Swarm results saved: ${resultsPath}`);
    } catch (e) {
      this.log.warn(`Could not persist swarm results: ${(e as Error).message}`);
    }

    await this.observer.updateJob(jobId, "completed", `Champion: ${champion.id} score=${champion.viralityScore}`, {
      championId: champion.id,
      championScore: champion.viralityScore,
      totalVariants: allVariants.length,
    });

    return result;
  }
}
