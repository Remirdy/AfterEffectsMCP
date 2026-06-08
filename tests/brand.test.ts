import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { BrandKitManager } from "../src/brand/brandKit.js";
import { AdConceptGenerator } from "../src/ad/conceptEngine.js";
import { ViralityPredictor } from "../src/ad/virality.js";
import { MultiformatAdExporter } from "../src/ad/multiformat.js";
import { OpLog } from "../src/util.js";

// Mock the runner so that we don't need After Effects installed for tests
vi.mock("../src/ae/runner.js", () => {
  return {
    runJsx: vi.fn(async (jsxContent: string) => {
      // Simulate success and return the correct response format
      if (jsxContent.includes("variantsCreated")) {
        return { ok: true, output: "MainComp_VAR1|MainComp_VAR2", error: null };
      }
      if (jsxContent.includes("formatsCreated")) {
        return { ok: true, output: "MainComp_VERTICAL|MainComp_SQUARE", error: null };
      }
      return { ok: true, output: "success_mock", error: null };
    }),
    resolveAfterEffects: vi.fn(async () => "/mock/path/AfterEffects"),
  };
});

// Mock fs to avoid touching the actual filesystem where possible,
// or use a temporary test directory inside process.cwd()
const testDir = path.join(process.cwd(), "tests_temp_brand");

describe("Phase 2: Brand Kit & Marketing Engine", () => {
  const log = new OpLog();

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    // Recreate temp folder
    await fs.mkdir(testDir, { recursive: true }).catch(() => {});
  });

  describe("BrandKitManager", () => {
    it("should ingest and load a brand kit", async () => {
      const bkm = new BrandKitManager(testDir);
      const testKit = {
        brandName: "Tesla",
        palette: ["#E82127", "#000000", "#FFFFFF"],
        font: "Montserrat",
        fontSize: 90,
        marketingVoice: "minimal",
      };

      const ingested = await bkm.ingestBrandKit(testKit);
      expect(ingested.brandName).toBe("Tesla");
      expect(ingested.palette).toContain("#E82127");
      expect(ingested.updatedAt).toBeGreaterThan(0);

      const loaded = await bkm.loadBrandKit();
      expect(loaded).not.toBeNull();
      expect(loaded?.brandName).toBe("Tesla");
      expect(loaded?.font).toBe("Montserrat");
    });
  });

  describe("AdConceptGenerator", () => {
    it("should generate storyboard concepts incorporating Brand Kit preferences", async () => {
      const bkm = new BrandKitManager(testDir);
      await bkm.ingestBrandKit({
        brandName: "Acme Power",
        palette: ["#FFA500", "#111111"],
        font: "Impact",
        fontSize: 120,
        marketingVoice: "energetic",
      });

      const generator = new AdConceptGenerator(log);
      const concepts = await generator.generateConcepts(
        "SuperCharger",
        "The fastest solar bank for off-grid adventures.",
        15,
        testDir
      );

      expect(concepts.length).toBeGreaterThan(0);
      const cinematic = concepts.find((c) => c.conceptId === "concept_cinematic_hype");
      expect(cinematic).toBeDefined();
      expect(cinematic?.hook).toContain("Acme Power");
      expect(cinematic?.visualStyle).toBe("cinematic");

      const social = concepts.find((c) => c.conceptId === "concept_social_retention");
      expect(social?.musicTempo).toBe("fast");
    });
  });

  describe("ViralityPredictor", () => {
    const predictor = new ViralityPredictor(log);

    it("should score hooks based on scroll-stopping keyword presence and length", async () => {
      const goodHookRes = await predictor.predictVirality("Stop scrolling! The future of tech is here.", "Shop 50% Off");
      expect(goodHookRes.score).toBeGreaterThan(70);
      expect(goodHookRes.hookStrength).toBe("strong");

      const weakHookRes = await predictor.predictVirality("A short simple box.", "");
      expect(weakHookRes.score).toBeLessThan(50);
      expect(weakHookRes.hookStrength).toBe("weak");
      expect(weakHookRes.recommendations.length).toBeGreaterThan(0);
    });

    it("should generate A/B variant comps in After Effects", async () => {
      // Mock files
      const aepPath = path.join(testDir, "mock_original.aep");
      const outAepPath = path.join(testDir, "mock_variants.aep");
      await fs.writeFile(aepPath, "dummy AEP content");

      const variants = [
        { suffix: "var1", hook: "Stop! Look at this.", cta: "Shop Now" },
        { suffix: "var2", hook: "Secret revealed!", cta: "Order Free" },
      ];

      const res = await predictor.generateABVariants(aepPath, outAepPath, "MainComp", variants, true);
      expect(res.ok).toBe(true);
      expect(res.variantsCreated).toEqual(["MainComp_VAR1", "MainComp_VAR2"]);
    });
  });

  describe("MultiformatAdExporter", () => {
    it("should reframe compositions for multiple aspect ratios", async () => {
      const exporter = new MultiformatAdExporter(log);
      const aepPath = path.join(testDir, "mock_original.aep");
      const outAepPath = path.join(testDir, "mock_reframe.aep");
      await fs.writeFile(aepPath, "dummy AEP content");

      const res = await exporter.exportFormats(aepPath, outAepPath, ["vertical", "square"], true);
      expect(res.ok).toBe(true);
      expect(res.formatsCreated).toContain("MainComp_VERTICAL");
      expect(res.formatsCreated).toContain("MainComp_SQUARE");
    });
  });
});
