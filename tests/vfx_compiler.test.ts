import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { LiveUnityBridge } from "../src/engine/liveUnityBridge.js";
import { VfxSimulationBaker } from "../src/vfx/simBaker.js";

const testDir = path.join(process.cwd(), "tests_temp_vfx");

describe("Phase 3 & 4: VFX compilation and Simulation Baking", () => {
  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true }).catch(() => {});
  });

  describe("LiveUnityBridge", () => {
    const bridge = new LiveUnityBridge();

    it("should compile a detailed VFX Graph asset representing the particles system", async () => {
      const res = await bridge.compileVfxGraph("test_fire", "fire flame burn", testDir);
      expect(res.graphPath).toContain("VFX_test_fire.vfx");
      expect(res.compiledData.graphName).toBe("test_fire");
      expect(res.compiledData.nodes.length).toBeGreaterThan(0);

      // Check specific parameters driven by prompt
      const spawnNode = res.compiledData.nodes.find((n) => n.id === "node_spawn");
      expect(spawnNode?.properties.rate).toBe(150); // Fire uses 150 spawn rate
    });

    it("should generate a clean C# MenuItem Unity Editor script", async () => {
      const csPath = await bridge.generateUnityEditorAutomation("TeslaBeam", testDir);
      expect(csPath).toContain("VFXBuilder_TeslaBeam.cs");

      const code = await fs.readFile(csPath, "utf8");
      expect(code).toContain("public static class VFXBuilder_TeslaBeam");
      expect(code).toContain("[MenuItem(\"MotionPilot/Build VFX Graph TeslaBeam\")]");
    });
  });

  describe("VfxSimulationBaker", () => {
    const baker = new VfxSimulationBaker();

    it("should procedurally bake an energy spritesheet and manifest", async () => {
      const res = await baker.bakeSimulation({
        outputFolder: testDir,
        frameCount: 4,
        width: 64,
        height: 64,
        type: "shockwave",
      });

      expect(res.spritesheetPath).toContain(".png");
      expect(res.manifestPath).toContain(".json");

      const manifest = JSON.parse(await fs.readFile(res.manifestPath, "utf8"));
      expect(manifest.frameCount).toBe(4);
      expect(manifest.grid.cellWidth).toBe(64);
      expect(manifest.frames.length).toBe(4);
    });
  });
});
