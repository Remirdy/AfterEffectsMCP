import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { OpLog } from "../src/util.js";
import { GameTrailerAutopilot } from "../src/content/gameTrailerAutopilot.js";
import { VfxBreeding } from "../src/vfx/vfxBreeding.js";

const testDir = path.join(process.cwd(), "tests_temp_autonomous_factory");

describe("Moonshot autonomous factory tools", () => {
  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
  });

  describe("GameTrailerAutopilot", () => {
    it("generates a trailer plan from discovered Unity scenes", async () => {
      const projectDir = path.join(testDir, "UnityGame");
      await fs.mkdir(path.join(projectDir, "Assets", "Scenes"), { recursive: true });
      await fs.writeFile(path.join(projectDir, "Assets", "Scenes", "Arena.unity"), "%YAML", "utf8");

      const result = await new GameTrailerAutopilot(new OpLog()).generate({
        unityProjectPath: projectDir,
        outputDir: testDir,
        gameTitle: "Arena Rush",
        sceneCount: 4,
      });

      expect(result.ok).toBe(true);
      expect(result.shots).toHaveLength(4);
      expect(result.shots.some((shot) => shot.sceneName === "Arena")).toBe(true);
    });

    it("falls back to procedural trailer beats when no Unity scenes exist", async () => {
      const projectDir = path.join(testDir, "EmptyUnityGame");
      await fs.mkdir(path.join(projectDir, "Assets"), { recursive: true });

      const result = await new GameTrailerAutopilot(new OpLog()).generate({
        unityProjectPath: projectDir,
        outputDir: testDir,
        style: "arcade",
      });

      expect(result.shots[0].sceneName).toBe("OpeningWorld");
      expect(result.directorBrief).toContain("arcade game trailer");
    });

    it("writes storyboard JSON and AE JSX artifacts", async () => {
      const projectDir = path.join(testDir, "ArtifactGame");
      await fs.mkdir(path.join(projectDir, "Assets"), { recursive: true });

      const result = await new GameTrailerAutopilot(new OpLog()).generate({
        unityProjectPath: projectDir,
        outputDir: testDir,
        gameTitle: "Artifact Quest",
      });

      const storyboard = JSON.parse(await fs.readFile(result.storyboardPath, "utf8"));
      const jsx = await fs.readFile(result.jsxPath, "utf8");
      expect(storyboard.gameTitle).toBe("Artifact Quest");
      expect(jsx).toContain("GAME_TRAILER_AUTOPILOT");
    });
  });

  describe("VfxBreeding", () => {
    it("creates a hybrid preset when preset inputs are names", async () => {
      const result = await new VfxBreeding(new OpLog()).breed({
        presetA: "ArcaneLightning",
        presetB: "FireImpact",
        outputDir: testDir,
      });

      expect(result.ok).toBe(true);
      expect(result.childName).toContain("ArcaneLightning");
      expect(result.prompt).toContain("preset named");
    });

    it("inherits traits from JSON preset files", async () => {
      const presetA = path.join(testDir, "blue.json");
      const presetB = path.join(testDir, "snap.json");
      await fs.writeFile(presetA, JSON.stringify({ name: "Blue", colorRamp: ["#001", "#0ff"] }), "utf8");
      await fs.writeFile(presetB, JSON.stringify({ name: "Snap", timing: { attack: 0.01, decay: 0.2 } }), "utf8");

      const result = await new VfxBreeding(new OpLog()).breed({
        presetA,
        presetB,
        outputDir: testDir,
        childName: "BlueSnap",
      });

      const child = JSON.parse(await fs.readFile(result.childPresetPath, "utf8"));
      expect(child.colorRamp).toEqual(["#001", "#0ff"]);
      expect(child.timing.attack).toBe(0.01);
    });

    it("clamps mutation rate into a valid range", async () => {
      const result = await new VfxBreeding(new OpLog()).breed({
        presetA: "A",
        presetB: "B",
        outputDir: testDir,
        mutationRate: 4,
      });

      const child = JSON.parse(await fs.readFile(result.childPresetPath, "utf8"));
      expect(child.particles.mutation).toBe(1);
      expect(result.inheritedTraits.mutationRate).toBe("1");
    });
  });
});
