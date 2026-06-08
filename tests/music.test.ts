import { describe, it, expect } from "vitest";
import { AudioMusicManager } from "../src/audio/music.js";
import { OpLog } from "../src/util.js";
import type { TranscriptionResult } from "../src/audio/stt.js";

describe("AudioMusicManager.extractSpeechSegments", () => {
  const log = new OpLog();
  const mgr = new AudioMusicManager(log);

  const makeTranscript = (words: Array<{ start: number; end: number; word: string }>): TranscriptionResult => ({
    text: words.map((w) => w.word).join(" "),
    words: words.map((w) => ({ ...w, probability: 1 })),
  });

  it("returns empty array for empty word list", () => {
    const t = makeTranscript([]);
    expect(mgr.extractSpeechSegments(t)).toEqual([]);
  });

  it("returns a single segment for a single word", () => {
    const t = makeTranscript([{ start: 1.0, end: 1.5, word: "Hello" }]);
    const segs = mgr.extractSpeechSegments(t);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ start: 1.0, end: 1.5 });
  });

  it("merges words that are closer than the threshold (0.6s)", () => {
    const t = makeTranscript([
      { start: 0.0, end: 0.5, word: "Hello" },
      { start: 0.9, end: 1.4, word: "world" }, // gap = 0.4s < 0.6 → merge
    ]);
    const segs = mgr.extractSpeechSegments(t);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ start: 0.0, end: 1.4 });
  });

  it("splits words that are farther apart than the threshold (0.6s)", () => {
    const t = makeTranscript([
      { start: 0.0, end: 0.5, word: "Hello" },
      { start: 1.2, end: 1.8, word: "world" }, // gap = 0.7s > 0.6 → new segment
    ]);
    const segs = mgr.extractSpeechSegments(t);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ start: 0.0, end: 0.5 });
    expect(segs[1]).toEqual({ start: 1.2, end: 1.8 });
  });

  it("handles a complex sentence with multiple merge/split boundaries", () => {
    const t = makeTranscript([
      { start: 0.0, end: 0.3, word: "Buy" },
      { start: 0.5, end: 0.8, word: "now" },   // gap 0.2 → merge
      { start: 1.5, end: 1.8, word: "limited" }, // gap 0.7 → new segment
      { start: 2.0, end: 2.4, word: "offer" }, // gap 0.2 → merge
      { start: 3.5, end: 3.9, word: "today" }, // gap 1.1 → new segment
    ]);
    const segs = mgr.extractSpeechSegments(t);
    expect(segs).toHaveLength(3);
    expect(segs[0]).toEqual({ start: 0.0, end: 0.8 });
    expect(segs[1]).toEqual({ start: 1.5, end: 2.4 });
    expect(segs[2]).toEqual({ start: 3.5, end: 3.9 });
  });

  it("respects a custom mergeThreshold", () => {
    const t = makeTranscript([
      { start: 0.0, end: 0.5, word: "A" },
      { start: 2.0, end: 2.5, word: "B" }, // gap 1.5s, normally split
    ]);
    // Custom threshold: 2.0s → should merge
    const segs = mgr.extractSpeechSegments(t, 2.0);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ start: 0.0, end: 2.5 });
  });
});
