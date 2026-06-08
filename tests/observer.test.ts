import { describe, it, expect, beforeEach } from "vitest";
import { MotionPilotObserver } from "../src/telemetry/observer.js";

describe("MotionPilotObserver", () => {
  let observer: MotionPilotObserver;

  beforeEach(() => {
    // Reset singleton between tests by accessing the private field
    (MotionPilotObserver as any)._instance = null;
    observer = MotionPilotObserver.getInstance();
  });

  it("should be a singleton", () => {
    const a = MotionPilotObserver.getInstance();
    const b = MotionPilotObserver.getInstance();
    expect(a).toBe(b);
  });

  it("should track job lifecycle: queued → running → completed", async () => {
    await observer.startJob("job_001", "test_tool", "Started processing");
    expect(observer.getJob("job_001")?.status).toBe("queued");

    await observer.updateJob("job_001", "running", "In progress");
    expect(observer.getJob("job_001")?.status).toBe("running");

    await observer.updateJob("job_001", "completed", undefined, { outputs: ["/tmp/out.mp4"] });
    const state = observer.getJob("job_001");
    expect(state?.status).toBe("completed");
    expect(state?.outputs).toEqual(["/tmp/out.mp4"]);
    expect(state?.events).toHaveLength(3);
  });

  it("should return null for unknown job", () => {
    expect(observer.getJob("nonexistent")).toBeNull();
  });

  it("should produce a dashboard snapshot with correct counts", async () => {
    await observer.startJob("j1", "tool_a");
    await observer.startJob("j2", "tool_b");
    await observer.updateJob("j1", "completed");
    await observer.updateJob("j2", "failed", "Something went wrong");

    const snap = observer.snapshot() as any;
    expect(snap.totalJobs).toBe(2);
    expect(snap.byStatus.completed).toBe(1);
    expect(snap.byStatus.failed).toBe(1);
    expect(snap.recentJobs).toHaveLength(2);
  });

  it("should produce a per-job snapshot", async () => {
    await observer.startJob("j_single", "director", "Brief received");
    const snap = observer.snapshot("j_single") as any;
    expect(snap.jobId).toBe("j_single");
    expect(snap.tool).toBe("director");
  });

  it("should set error field on failed jobs", async () => {
    await observer.startJob("j_fail", "tool_x");
    await observer.updateJob("j_fail", "failed", "Network timeout");
    const state = observer.getJob("j_fail");
    expect(state?.error).toBe("Network timeout");
  });

  it("should list jobs filtered by status", async () => {
    await observer.startJob("ja", "tool_a");
    await observer.startJob("jb", "tool_b");
    await observer.updateJob("ja", "running");

    const running = observer.listJobs("running");
    const queued = observer.listJobs("queued");
    expect(running).toHaveLength(1);
    expect(queued).toHaveLength(1);
  });
});
