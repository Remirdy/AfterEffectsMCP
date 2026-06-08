import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { SmartProxyManager } from "../src/render/proxy.js";
import { DeliveryPackager } from "../src/render/deliveryPackager.js";
import { ProductStudioManager } from "../src/ad/productStudio.js";
import { HoudiniAlembicBridge } from "../src/vfx/alembic.js";
import { OpLog } from "../src/util.js";

// Mock sharp to avoid native dependency issues during tests
vi.mock("sharp", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      resize: vi.fn().mockReturnThis(),
      toFile: vi.fn(async () => ({})),
    })),
  };
});

// Mock runJsx
vi.mock("../src/ae/runner.js", () => {
  return {
    runJsx: vi.fn(async () => ({ ok: true, output: "mock_output.aep", error: null })),
    resolveAfterEffects: vi.fn(async () => "/mock/path/AfterEffects"),
  };
});

const testDir = path.join(process.cwd(), "tests_temp_scale");

describe("Phase 4: Scale, Packaging & Delivery", () => {
  const log = new OpLog();

  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.mkdir(testDir, { recursive: true }).catch(() => {});
  });

  describe("SmartProxyManager", () => {
    it("should generate low-res proxies and compile JSX to swap them in AE", async () => {
      const manager = new SmartProxyManager(log);
      const originalImg = path.join(testDir, "highres.png");
      await fs.writeFile(originalImg, "dummy image content");

      const swaps = await manager.createProxies([originalImg], testDir);
      expect(swaps.length).toBe(1);
      expect(swaps[0].originalPath).toBe(originalImg);
      expect(swaps[0].proxyPath).toContain("proxy_highres.png");

      const aepPath = path.join(testDir, "project.aep");
      await fs.writeFile(aepPath, "dummy aep");
      const toggleRes = await manager.toggleProxies(aepPath, aepPath, swaps, true, true);
      expect(toggleRes.ok).toBe(true);
    });
  });

  describe("DeliveryPackager", () => {
    const packager = new DeliveryPackager(log);

    it("should bundle final video, thumbnail and metadata for social platforms", async () => {
      const videoPath = path.join(testDir, "rendered.mp4");
      const thumbPath = path.join(testDir, "thumb.jpg");
      const outputFolder = path.join(testDir, "delivery_pkg");

      await fs.writeFile(videoPath, "video data");
      await fs.writeFile(thumbPath, "thumbnail data");

      const res = await packager.packageDelivery({
        outputFolder,
        videoPath,
        thumbnailPath: thumbPath,
        title: "Test Ad Title",
        description: "Ad description details",
        platforms: ["youtube", "tiktok"],
      });

      expect(res.ok).toBe(true);
      expect(res.packagedPaths.some((p) => p.includes("youtube"))).toBe(true);
      expect(res.packagedPaths.some((p) => p.includes("tiktok"))).toBe(true);
      expect(res.packagedPaths.some((p) => p.includes("metadata.json"))).toBe(true);

      const metadata = JSON.parse(await fs.readFile(path.join(outputFolder, "youtube", "metadata.json"), "utf-8"));
      expect(metadata.title).toBe("Test Ad Title");
      expect(metadata.platform).toBe("youtube");
    });

    it("should duplicate composition and translate layers in After Effects", async () => {
      const aepPath = path.join(testDir, "source.aep");
      const outAep = path.join(testDir, "localized.aep");
      await fs.writeFile(aepPath, "dummy aep");

      const res = await packager.localizeAd({
        aepPath,
        outputAepPath: outAep,
        compName: "MainComp",
        languageCode: "tr",
        translations: [
          { originalText: "Order Now", translatedText: "Şimdi Sipariş Ver" },
        ],
      }, true);

      expect(res.ok).toBe(true);
    });
  });

  describe("ProductStudioManager", () => {
    const manager = new ProductStudioManager(log);

    it("should call buildMockupScene and compile JSX without errors", async () => {
      const aepPath = path.join(testDir, "source.aep");
      const outAep = path.join(testDir, "mockup.aep");
      const productImg = path.join(testDir, "product.png");

      await fs.writeFile(aepPath, "dummy aep");
      await fs.writeFile(productImg, "dummy product");

      const res = await manager.buildMockupScene({
        aepPath,
        outputAepPath: outAep,
        compName: "MockupComp",
        productImagePath: productImg,
        rotationSpeed: 30,
        addLighting: true,
      }, true);

      expect(res.ok).toBe(true);
    });

    it("should mock upscaling and extending video duration", async () => {
      const videoPath = path.join(testDir, "original.mp4");
      const outputPath = path.join(testDir, "extended.mp4");
      await fs.writeFile(videoPath, "video data");

      const res = await manager.inpaintAndExtend(videoPath, outputPath, 4, 2);
      expect(res.ok).toBe(true);
      expect(res.upscaled).toBe(true);
      expect(res.duration).toBe(8);
    });
  });

  describe("HoudiniAlembicBridge", () => {
    const bridge = new HoudiniAlembicBridge(log);

    it("should copy alembic file to destination or generate a mock file if missing", async () => {
      const abcPath = path.join(testDir, "simulation.abc");
      const outputFolder = path.join(testDir, "imported_abc");

      // Case 1: Missing file, generates a mock
      const res1 = await bridge.importAlembic({
        alembicPath: abcPath,
        outputFolder,
        compName: "AlembicComp",
      });
      expect(res1.ok).toBe(true);
      expect(res1.copiedPath).toContain("simulation.abc");
      expect(res1.importNotes).toContain("generated for dev verification");

      // Case 2: File exists, copies it
      const res2 = await bridge.importAlembic({
        alembicPath: res1.copiedPath,
        outputFolder: path.join(testDir, "another_folder"),
      });
      expect(res2.ok).toBe(true);
      expect(res2.copiedPath).toContain("another_folder");
      expect(res2.importNotes).toContain("Successfully copied simulation file");
    });
  });
});
