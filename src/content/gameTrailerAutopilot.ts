import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, ensureDir, pathExists } from "../util.js";

export interface GameTrailerAutopilotOptions {
  unityProjectPath: string;
  outputDir: string;
  gameTitle?: string;
  durationSec?: number;
  style?: "cinematic" | "action" | "cozy" | "horror" | "arcade";
  sceneCount?: number;
}

export interface TrailerShot {
  index: number;
  timeSec: number;
  durationSec: number;
  sceneName: string;
  cameraMove: string;
  caption: string;
  grade: string;
  musicCue: string;
}

export interface GameTrailerAutopilotResult {
  ok: boolean;
  gameTitle: string;
  shots: TrailerShot[];
  storyboardPath: string;
  jsxPath: string;
  directorBrief: string;
  message: string;
}

const STYLE_MOVES: Record<NonNullable<GameTrailerAutopilotOptions["style"]>, string[]> = {
  cinematic: ["slow dolly in", "wide crane reveal", "orbit hero move", "rack-focus close-up"],
  action: ["whip pan", "dash cam follow", "impact zoom", "fast orbit"],
  cozy: ["gentle pan", "slow push", "soft overhead", "parallax drift"],
  horror: ["creeping dolly", "Dutch tilt", "flash-frame cut", "low-angle crawl"],
  arcade: ["snap zoom", "side-scroll tracking", "beat jump cut", "top-down spin"],
};

export class GameTrailerAutopilot {
  constructor(private readonly log: OpLog) {}

  async generate(opts: GameTrailerAutopilotOptions): Promise<GameTrailerAutopilotResult> {
    const durationSec = opts.durationSec ?? 45;
    const sceneCount = Math.max(3, Math.min(opts.sceneCount ?? 7, 12));
    const style = opts.style ?? "cinematic";
    const gameTitle = opts.gameTitle ?? path.basename(opts.unityProjectPath);

    if (!(await pathExists(opts.unityProjectPath))) {
      throw new Error(`Unity project path not found: ${opts.unityProjectPath}`);
    }
    await ensureDir(opts.outputDir);

    const scenes = await this.discoverUnityScenes(opts.unityProjectPath);
    const shots = this.buildShots(scenes, sceneCount, durationSec, style);
    const directorBrief = this.buildDirectorBrief(gameTitle, style, shots);

    const storyboardPath = path.join(opts.outputDir, `game_trailer_storyboard_${Date.now()}.json`);
    const jsxPath = path.join(opts.outputDir, `game_trailer_autopilot_${Date.now()}.jsx`);
    await fs.writeFile(storyboardPath, JSON.stringify({ gameTitle, style, durationSec, shots, directorBrief }, null, 2), "utf8");
    await fs.writeFile(jsxPath, this.buildAeJsx(gameTitle, shots, durationSec), "utf8");

    this.log.info(`Game trailer storyboard written: ${storyboardPath}`);
    this.log.info(`Game trailer AE JSX written: ${jsxPath}`);

    return {
      ok: true,
      gameTitle,
      shots,
      storyboardPath,
      jsxPath,
      directorBrief,
      message: `Generated ${shots.length}-shot ${style} trailer plan for ${gameTitle}`,
    };
  }

  private async discoverUnityScenes(projectPath: string): Promise<string[]> {
    const assetsPath = path.join(projectPath, "Assets");
    const names: string[] = [];
    await this.walkUnityScenes(assetsPath, names).catch(() => {});
    if (names.length === 0) {
      this.log.warn("No .unity scenes found; using procedural trailer beats");
      return ["OpeningWorld", "GameplayLoop", "HeroMoment", "Challenge", "FinalCTA"];
    }
    this.log.info(`Discovered ${names.length} Unity scene(s)`);
    return names.slice(0, 12);
  }

  private async walkUnityScenes(dir: string, names: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walkUnityScenes(fullPath, names);
      } else if (entry.isFile() && entry.name.endsWith(".unity")) {
        names.push(path.basename(entry.name, ".unity"));
      }
    }
  }

  private buildShots(
    scenes: string[],
    sceneCount: number,
    durationSec: number,
    style: NonNullable<GameTrailerAutopilotOptions["style"]>
  ): TrailerShot[] {
    const shotDuration = Math.round((durationSec / sceneCount) * 100) / 100;
    const moves = STYLE_MOVES[style];
    return Array.from({ length: sceneCount }, (_, index) => ({
      index: index + 1,
      timeSec: Math.round(index * shotDuration * 100) / 100,
      durationSec: shotDuration,
      sceneName: scenes[index % scenes.length],
      cameraMove: moves[index % moves.length],
      caption: index === 0 ? "Enter the world" : index === sceneCount - 1 ? "Play now" : `Moment ${index + 1}`,
      grade: style === "horror" ? "cold contrast" : style === "cozy" ? "warm soft" : "high-energy cinematic",
      musicCue: index === 0 ? "logo sting" : index === sceneCount - 1 ? "final hit" : "beat-synced rise",
    }));
  }

  private buildDirectorBrief(gameTitle: string, style: string, shots: TrailerShot[]): string {
    return [
      `Create a ${style} game trailer for ${gameTitle}.`,
      "Use captured Unity scenes as source beats, add cinematic camera choreography, color grade, music accents, and a logo sting.",
      "Shot plan:",
      ...shots.map((shot) => `${shot.index}. ${shot.sceneName}: ${shot.cameraMove}, ${shot.caption}, ${shot.durationSec}s`),
      "Deliver 16:9 hero trailer plus 9:16 cutdown guidance.",
    ].join("\n");
  }

  private buildAeJsx(gameTitle: string, shots: TrailerShot[], durationSec: number): string {
    const safeTitle = JSON.stringify(gameTitle);
    const shotData = JSON.stringify(shots);
    return `
app.beginUndoGroup("MotionPilot Game Trailer Autopilot");
var comp = app.project.items.addComp("GAME_TRAILER_AUTOPILOT", 1920, 1080, 1, ${durationSec}, 30);
var title = comp.layers.addText(${safeTitle});
title.startTime = 0;
title.outPoint = 2.5;
title.property("Position").setValue([960, 520]);
var shots = ${shotData};
for (var i = 0; i < shots.length; i++) {
  var s = shots[i];
  var layer = comp.layers.addText((s.index) + ". " + s.sceneName + " - " + s.caption);
  layer.startTime = s.timeSec;
  layer.outPoint = Math.min(${durationSec}, s.timeSec + s.durationSec);
  layer.property("Position").setValue([960, 760]);
}
app.endUndoGroup();
`;
  }
}
