import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { MotionPilotDirector } from "../src/orchestrator/director.js";
import { OpLog } from "../src/util.js";

// Mocking dependencies imported by director.ts
vi.mock("../src/ai/aiBridge.js", () => {
  return {
    AiBridge: vi.fn().mockImplementation(() => ({
      generateImage: vi.fn(async () => path.join(process.cwd(), "tests_temp_director", "backdrop.psd")),
      generateVideo: vi.fn(async () => ({
        id: "job_video",
        status: "completed",
        progress: 100,
        createdAt: Date.now(),
        outputPath: path.join(process.cwd(), "tests_temp_director", "shot.mp4"),
      })),
    })),
  };
});

vi.mock("../src/audio/tts.js", () => {
  return {
    TtsVoiceover: vi.fn().mockImplementation(() => ({
      generateVoiceover: vi.fn(async () => path.join(process.cwd(), "tests_temp_director", "voiceover.wav")),
    })),
  };
});

vi.mock("../src/audio/stt.js", () => {
  return {
    SttTranscribe: vi.fn().mockImplementation(() => ({
      transcribe: vi.fn(async () => ({
        text: "Vortex Tech. Step into the future.",
        words: [
          { word: "Vortex", start: 0, end: 1 },
          { word: "Tech.", start: 1, end: 2 },
        ],
      })),
    })),
  };
});

vi.mock("../src/qa/jsxDryRun.js", () => {
  return {
    JsxDryRun: vi.fn().mockImplementation(() => ({
      validate: vi.fn(() => ({ valid: true, issues: [] })),
    })),
  };
});

vi.mock("../src/render/farm.js", () => {
  return {
    RenderFarm: vi.fn().mockImplementation(() => ({
      renderBatch: vi.fn(async (renders) =>
        renders.map((r: any) => ({
          aepPath: r.aepPath,
          compName: r.compName,
          status: "completed",
          outputVideoPath: r.outputVideoPath,
        }))
      ),
    })),
  };
});

vi.mock("../src/ae/runner.js", () => {
  return {
    runJsx: vi.fn(async () => ({ ok: true, output: path.join(process.cwd(), "tests_temp_director", "output.aep"), error: null })),
    resolveAfterEffects: vi.fn(async () => "/mock/path/AfterEffects"),
  };
});

const testDir = path.join(process.cwd(), "tests_temp_director");

describe("Phase 2: MotionPilotDirector", () => {
  const log = new OpLog();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(fs, "copyFile").mockImplementation(async (src, dest) => {
      await fs.writeFile(dest, "MOCK_VIDEO_DATA");
    });
    await fs.mkdir(testDir, { recursive: true }).catch(() => {});
  });

  afterEach(async () => {
    // Clean up test states
    await fs.rm(path.join(process.cwd(), ".motionpilot"), { recursive: true, force: true }).catch(() => {});
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it("should execute the full orchestration workflow successfully", async () => {
    const director = new MotionPilotDirector(
      {
        projectId: "proj_test_workflow",
        brandName: "Acme Spark",
        outputFolder: testDir,
      },
      log
    );

    const state = await director.runWorkflow("Create a cool cyberpunk headset commercial");

    expect(state).toBeDefined();
    expect(state.status).toBe("completed");
    expect(state.currentStep).toBe(state.steps.length - 1);
    expect(state.steps.every((s) => s.status === "completed")).toBe(true);

    // Verify brand kit settings propagated
    expect(state.brandKit.brandName).toBe("Acme Spark");
    expect(state.brandKit.palette).toEqual(["#00f2fe", "#4facfe", "#0f172a"]);

    // Verify output files mapped correctly
    expect(state.psdPath).toContain("backdrop.psd");
    expect(state.voiceoverPath).toContain("voiceover.wav");
    expect(state.aepPath).toContain("proj_test_workflow_assembled.aep");
  });
});
