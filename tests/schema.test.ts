import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  generateAiPlateSchema,
  generateAiVideoShotSchema,
  ttsVoiceoverSchema,
  sttTranscribeSchema,
  jsxDryRunSchema,
  renderFarmQueueSchema,
} from "../src/schemas.js";

// Helper to validate using Zod object parser
function validateSchema(schema: Record<string, z.ZodType<any>>, data: any) {
  return z.object(schema).safeParse(data);
}

describe("Phase 1 Schemas", () => {
  describe("generateAiPlateSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(generateAiPlateSchema, {
        prompt: "A futuristic cyberpunk city",
        outputFolder: "/path/to/output",
        width: 1080,
        height: 1920,
        style: "cyberpunk",
        palette: ["#ff00ff", "#00ffff"],
      });
      expect(result.success).toBe(true);
    });

    it("should fail validation if prompt is too short", () => {
      const result = validateSchema(generateAiPlateSchema, {
        prompt: "A",
        outputFolder: "/path/to/output",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("generateAiVideoShotSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(generateAiVideoShotSchema, {
        prompt: "Camera zooming into the neon sign",
        outputFolder: "/path/to/output",
        format: "vertical",
        duration: 5,
        fps: 30,
      });
      expect(result.success).toBe(true);
    });

    it("should default format to vertical", () => {
      const schemaObj = z.object(generateAiVideoShotSchema);
      const parsed = schemaObj.parse({
        prompt: "Camera panning left",
        outputFolder: "/path/to/output",
      });
      expect(parsed.format).toBe("vertical");
      expect(parsed.duration).toBe(4);
    });
  });

  describe("ttsVoiceoverSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(ttsVoiceoverSchema, {
        text: "Welcome to MotionPilot!",
        outputFolder: "/path/to/output",
        voice: "alloy",
        speed: 1.0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("sttTranscribeSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(sttTranscribeSchema, {
        audioPath: "/path/to/audio.wav",
        referenceText: "Welcome to MotionPilot!",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("jsxDryRunSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(jsxDryRunSchema, {
        jsxContent: "var a = 5;",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("renderFarmQueueSchema", () => {
    it("should validate valid input", () => {
      const result = validateSchema(renderFarmQueueSchema, {
        renders: [
          {
            aepPath: "/path/to/project1.aep",
            compName: "MainComp",
            outputVideoPath: "/path/to/output1.mp4",
          },
          {
            aepPath: "/path/to/project2.aep",
            compName: "PromoComp",
            outputVideoPath: "/path/to/output2.mp4",
            maxRetries: 3,
          },
        ],
        maxConcurrency: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should fail validation if renders list is empty", () => {
      const result = validateSchema(renderFarmQueueSchema, {
        renders: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
