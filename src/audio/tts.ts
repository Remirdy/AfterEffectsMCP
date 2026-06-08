import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, ensureDir } from "../util.js";

export interface TtsOptions {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | string;
  speed?: number;
  outputFolder: string;
  duration?: number; // Used for mock wave length
}

/**
 * Procedurally generates a valid 16-bit Mono PCM WAV buffer containing a sine wave.
 * This is used as a zero-dependency fallback.
 */
export function generateMockWavBuffer(durationSeconds = 3): Buffer {
  const sampleRate = 8000;
  const bitsPerSample = 16;
  const numChannels = 1;
  const numSamples = sampleRate * durationSeconds;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const subChunk2Size = numSamples * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + subChunk2Size;

  const buffer = Buffer.alloc(44 + subChunk2Size);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write("WAVE", 8);

  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM = 1)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  // Generate a simple 440 Hz (A4) sine wave tone
  const frequency = 440;
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Scale sine wave value to signed 16-bit range (-32768 to 32767) at 50% volume
    const sampleVal = Math.sin(2 * Math.PI * frequency * t) * 32767 * 0.5;
    buffer.writeInt16LE(Math.floor(sampleVal), offset);
    offset += 2;
  }

  return buffer;
}

export class TtsVoiceover {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async generateVoiceover(text: string, opts: TtsOptions): Promise<string> {
    const voice = opts.voice ?? "alloy";
    const speed = opts.speed ?? 1.0;
    const outName = `tts_${Date.now()}.wav`;
    const outPath = path.join(opts.outputFolder, outName);

    await ensureDir(opts.outputFolder);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        this.log.info(`Calling OpenAI TTS for text: "${text}" with voice "${voice}"`);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "tts-1",
            input: text,
            voice: voice.toLowerCase(),
            response_format: "wav",
            speed,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI TTS error: ${errText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(outPath, buffer);
        this.log.info(`OpenAI TTS audio saved to ${outPath}`);
        return outPath;
      } catch (e) {
        this.log.warn(`OpenAI TTS failed: ${(e as Error).message}. Falling back to procedural audio generation.`);
      }
    }

    // Procedural Fallback
    const duration = opts.duration ?? Math.max(2, Math.ceil(text.split(/\s+/).length * 0.4));
    this.log.info(`Generating procedural mock voiceover WAV at ${outPath} (${duration}s duration)...`);
    const buffer = generateMockWavBuffer(duration);
    await fs.writeFile(outPath, buffer);
    this.log.info(`Procedural mock voiceover saved.`);
    return outPath;
  }
}
