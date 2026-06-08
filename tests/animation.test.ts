import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { SmartKeyframeAssistant } from "../src/animation/principles.js";
import { CharacterRigger } from "../src/animation/rig.js";
import { CameraChoreographer } from "../src/animation/camera.js";
import { LipSyncAutomator } from "../src/audio/lipSync.js";
import { OpLog } from "../src/util.js";

// Mock the runner
vi.mock("../src/ae/runner.js", () => {
  return {
    runJsx: vi.fn(async () => ({ ok: true, output: "mock_output.aep", error: null })),
    resolveAfterEffects: vi.fn(async () => "/mock/path/AfterEffects"),
  };
});

const testDir = path.join(process.cwd(), "tests_temp_animation");

describe("Phase 3: Advanced Animation & Rigging", () => {
  const log = new OpLog();

  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.mkdir(testDir, { recursive: true }).catch(() => {});
  });

  describe("SmartKeyframeAssistant", () => {
    it("should compile and call applyPrinciple successfully", async () => {
      const assistant = new SmartKeyframeAssistant(log);
      const aepPath = path.join(testDir, "mock_src.aep");
      const outAepPath = path.join(testDir, "mock_dest.aep");
      await fs.writeFile(aepPath, "dummy");

      const res = await assistant.applyPrinciple({
        aepPath,
        outputAepPath: outAepPath,
        compName: "Main",
        layerName: "Logo",
        principle: "overshoot",
        startTime: 0.5,
        duration: 1.0,
      }, true);

      expect(res.ok).toBe(true);
      expect(res.outputAepPath).toBe("mock_output.aep");
    });
  });

  describe("CharacterRigger", () => {
    it("should compile and call buildRig successfully", async () => {
      const rigger = new CharacterRigger(log);
      const aepPath = path.join(testDir, "mock_src.aep");
      const outAepPath = path.join(testDir, "mock_dest.aep");
      await fs.writeFile(aepPath, "dummy");

      const res = await rigger.buildRig({
        aepPath,
        outputAepPath: outAepPath,
        compName: "CharComp",
        joints: [
          { layerName: "Hand_L", parentName: "Arm_L" },
          { layerName: "Arm_L", parentName: "Body" },
        ],
        breathLayer: "Body",
        blinkLayers: ["Eye_L", "Eye_R"],
      }, true);

      expect(res.ok).toBe(true);
    });
  });

  describe("CameraChoreographer", () => {
    it("should choreograph 3D camera sweeps", async () => {
      const choreo = new CameraChoreographer(log);
      const aepPath = path.join(testDir, "mock_src.aep");
      const outAepPath = path.join(testDir, "mock_dest.aep");
      await fs.writeFile(aepPath, "dummy");

      const res = await choreo.applyCameraMoves({
        aepPath,
        outputAepPath: outAepPath,
        compName: "Scene3D",
        moves: [
          { type: "dolly", startTime: 0, duration: 2, strength: 120 },
          { type: "orbit", startTime: 2, duration: 2, strength: 45 },
        ],
      }, true);

      expect(res.ok).toBe(true);
    });

    it("should apply whip pan/zoom blur transitions", async () => {
      const choreo = new CameraChoreographer(log);
      const aepPath = path.join(testDir, "mock_src.aep");
      const outAepPath = path.join(testDir, "mock_dest.aep");
      await fs.writeFile(aepPath, "dummy");

      const res = await choreo.applyTransition({
        aepPath,
        outputAepPath: outAepPath,
        compName: "Main",
        transitionType: "zoomBlur",
        timestamp: 4.5,
        duration: 0.8,
      }, true);

      expect(res.ok).toBe(true);
    });
  });

  describe("LipSyncAutomator", () => {
    it("should generate viseme keyframes from transcript JSON", async () => {
      const sync = new LipSyncAutomator(log);
      const aepPath = path.join(testDir, "mock_src.aep");
      const outAepPath = path.join(testDir, "mock_dest.aep");
      const transcriptPath = path.join(testDir, "transcript.json");

      await fs.writeFile(aepPath, "dummy");
      await fs.writeFile(
        transcriptPath,
        JSON.stringify({
          text: "Hi",
          words: [{ word: "Hi", start: 0.5, end: 1.0 }],
        })
      );

      const res = await sync.syncMouth({
        aepPath,
        outputAepPath: outAepPath,
        compName: "Main",
        mouthLayerName: "Mouth_LipSync",
        transcriptPath,
      }, true);

      expect(res.ok).toBe(true);
    });
  });
});
