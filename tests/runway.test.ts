import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RunwayAdaptor } from "../src/ai/runwayAdaptor.js";
import { OpLog } from "../src/util.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

// Mock global fetch for all tests
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("RunwayAdaptor", () => {
  let log: OpLog;
  let tmpDir: string;

  beforeEach(async () => {
    log = new OpLog();
    tmpDir = path.join(os.tmpdir(), `runway_test_${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    fetchMock.mockReset();
    delete process.env.RUNWAY_API_KEY;
    // Skip real polling delays
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.RUNWAY_API_KEY;
  });

  it("isConfigured returns false when no API key", () => {
    const adaptor = new RunwayAdaptor(log);
    expect(adaptor.isConfigured).toBe(false);
  });

  it("isConfigured returns true when API key is set", () => {
    process.env.RUNWAY_API_KEY = "test_key_123";
    const adaptor = new RunwayAdaptor(log);
    expect(adaptor.isConfigured).toBe(true);
  });

  it("returns mock pending result when no API key", async () => {
    const adaptor = new RunwayAdaptor(log);
    const result = await adaptor.generateVideo({
      prompt: "A sunset over mountains",
      format: "vertical",
      outputDir: tmpDir,
    });
    expect(result.status).toBe("pending");
    expect(result.provider).toBe("mock");
    expect(result.jobId).toMatch(/^runway_/);
  });

  it("returns completed result with real download on success", async () => {
    process.env.RUNWAY_API_KEY = "test_key_fake";
    vi.useRealTimers(); // allow real async for this test

    const fakeBytes = new Uint8Array([102,97,107,101,45,109,112,52,45,100,97,116,97]); // "fake-mp4-data"
    const fakeArrayBuffer = fakeBytes.buffer;

    // Mock: task creation
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "task_abc123" }),
    } as any);

    // Mock: poll response (SUCCEEDED immediately)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "SUCCEEDED", output: ["https://cdn.runway.ml/video.mp4"] }),
    } as any);

    // Mock: download
    fetchMock.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => fakeArrayBuffer,
    } as any);

    // Override sleep so polling doesn't actually wait 5s
    const mod = await import("../src/ai/runwayAdaptor.js");
    // We mock the internal timer by resolving the promise immediately:
    // The sleep inside the module executes, but since we mock fetch to resolve
    // immediately and timers are fake in the other tests, here we just set
    // a very short global timer for the poll to succeed on first attempt.
    // Actually with real timers + immediate fetch mocks, it'll run in ms.

    const adaptor = new RunwayAdaptor(log);
    const result = await adaptor.generateVideo({
      prompt: "Test video",
      format: "horizontal",
      duration: 4,
      outputDir: tmpDir,
    });

    expect(result.status).toBe("completed");
    expect(result.provider).toBe("runway");
    expect(result.outputPath).toBeDefined();

    const fileContent = await fs.readFile(result.outputPath!);
    expect(fileContent.toString()).toBe("fake-mp4-data");
  }, 15000); // 15s timeout to allow the 5s sleep

  it("returns failed result when API create call fails", async () => {
    process.env.RUNWAY_API_KEY = "test_key_fake";
    vi.useRealTimers();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as any);

    const adaptor = new RunwayAdaptor(log);
    const result = await adaptor.generateVideo({
      prompt: "Unauthorized test",
      outputDir: tmpDir,
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("401");
  });

  it("returns failed result when task status is FAILED", async () => {
    process.env.RUNWAY_API_KEY = "test_key_fake";
    vi.useRealTimers();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "task_xyz" }),
    } as any);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "FAILED", failure: "Content policy violation" }),
    } as any);

    const adaptor = new RunwayAdaptor(log);
    const result = await adaptor.generateVideo({
      prompt: "Failed generation test",
      outputDir: tmpDir,
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Content policy violation");
  }, 10000); // 10s timeout for the 5s sleep
});
