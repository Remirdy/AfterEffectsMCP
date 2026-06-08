import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists, readJson, writeJson } from "../util.js";

export interface BrandKit {
  brandName: string;
  logoPath?: string;
  palette: string[]; // HEX colors
  font: string;
  secondaryFont?: string;
  fontSize: number;
  marketingVoice?: "professional" | "energetic" | "minimal" | "playful" | string;
  additionalRules?: string[];
  updatedAt: number;
}

export class BrandKitManager {
  private configPath: string;

  constructor(workspaceDir: string) {
    this.configPath = path.join(workspaceDir, ".motionpilot", "brand-kit.json");
  }

  async loadBrandKit(): Promise<BrandKit | null> {
    try {
      if (await pathExists(this.configPath)) {
        return await readJson<BrandKit>(this.configPath);
      }
    } catch (e) {
      // Ignore reading errors
    }
    return null;
  }

  async saveBrandKit(kit: BrandKit): Promise<void> {
    kit.updatedAt = Date.now();
    await ensureDir(path.dirname(this.configPath));
    await writeJson(this.configPath, kit);
  }

  async ingestBrandKit(data: Omit<BrandKit, "updatedAt">): Promise<BrandKit> {
    const kit: BrandKit = {
      ...data,
      updatedAt: Date.now(),
    };
    await this.saveBrandKit(kit);
    return kit;
  }
}
