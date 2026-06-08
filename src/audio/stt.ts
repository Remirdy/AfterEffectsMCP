import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, pathExists } from "../util.js";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  words: WordTimestamp[];
}

export class SttTranscribe {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async transcribe(audioPath: string, referenceText?: string): Promise<TranscriptionResult> {
    this.log.info(`Attempting transcription for audio: ${audioPath}`);
    if (!(await pathExists(audioPath))) {
      throw new Error(`Audio file does not exist: ${audioPath}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        this.log.info("Calling OpenAI Whisper API...");
        const fileData = await fs.readFile(audioPath);
        const fileBlob = new Blob([fileData], { type: "audio/wav" });

        const formData = new FormData();
        formData.append("file", fileBlob, path.basename(audioPath));
        formData.append("model", "whisper-1");
        formData.append("response_format", "verbose_json");
        formData.append("timestamp_granularities[]", "word");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI Whisper error: ${errText}`);
        }

        const result = (await response.json()) as any;
        return {
          text: result.text || "",
          duration: result.duration || 0,
          words: (result.words || []).map((w: any) => ({
            word: w.word,
            start: w.start,
            end: w.end,
          })),
        };
      } catch (e) {
        this.log.warn(`OpenAI Whisper transcription failed: ${(e as Error).message}. Falling back to mock transcription.`);
      }
    }

    // Mock Fallback
    this.log.info("Generating mock transcription from reference text or default...");
    const rawText = referenceText || "MotionPilot is the ultimate motion design and VFX automation factory powered by After Effects and AI.";
    const cleanWords = rawText.split(/\s+/).filter(Boolean);
    const durationPerWord = 0.35;
    const words: WordTimestamp[] = [];
    
    let currentStart = 0.1;
    for (let i = 0; i < cleanWords.length; i++) {
      const word = cleanWords[i];
      const end = Number((currentStart + durationPerWord).toFixed(2));
      words.push({
        word,
        start: Number(currentStart.toFixed(2)),
        end,
      });
      currentStart = end + 0.05; // Small pause
    }

    const totalDuration = Number((currentStart + 0.5).toFixed(2));
    this.log.info(`Mock transcription generated with ${words.length} words, total duration ${totalDuration}s.`);
    return {
      text: rawText,
      duration: totalDuration,
      words,
    };
  }
}
