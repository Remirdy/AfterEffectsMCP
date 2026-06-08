import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { OpLog, ensureDir, pathExists, readJson } from '../util.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BrandMemory {
  slug: string;
  name: string;
  palette: string[]; // hex colors
  fonts: { headline?: string; body?: string };
  tone: string; // 'professional' | 'playful' | 'bold' | 'minimal'
  logoPath?: string;
  targetAudience?: string;
  productDescription?: string;
  pastCampaigns: Array<{
    date: string;
    title: string;
    viralityScore?: number;
    outputPath?: string;
  }>;
  viralFormulas: string[]; // e.g. 'hook-problem-solution-CTA'
  updatedAt: string;
}

export interface BrandBrainOptions {
  action: 'save' | 'load' | 'list' | 'delete' | 'update';
  slug?: string;
  memory?: Partial<BrandMemory>;
}

export interface BrandBrainResult {
  ok: boolean;
  brand?: BrandMemory;
  brands?: BrandMemory[];
  message: string;
}

// ─── Default factory ──────────────────────────────────────────────────────────

function defaultBrandMemory(slug: string): BrandMemory {
  return {
    slug,
    name: slug,
    palette: [],
    fonts: {},
    tone: 'professional',
    pastCampaigns: [],
    viralFormulas: [],
    updatedAt: new Date().toISOString(),
  };
}

// ─── BrandBrain class ─────────────────────────────────────────────────────────

export class BrandBrain {
  private log: OpLog;
  private readonly brandsRoot: string;

  constructor(log: OpLog) {
    this.log = log;
    this.brandsRoot = path.join(os.homedir(), '.motionpilot', 'brands');
  }

  private getBrainPath(slug: string): string {
    return path.join(this.brandsRoot, slug, 'brain.json');
  }

  async execute(opts: BrandBrainOptions): Promise<BrandBrainResult> {
    try {
      switch (opts.action) {
        case 'save':
          return await this.save(opts);
        case 'load':
          return await this.load(opts);
        case 'list':
          return await this.list();
        case 'delete':
          return await this.deleteBrand(opts);
        case 'update':
          return await this.update(opts);
        default:
          return { ok: false, message: `Unknown action: ${(opts as any).action}` };
      }
    } catch (err) {
      const msg = (err as Error).message;
      this.log.error(`BrandBrain.execute failed: ${msg}`);
      return { ok: false, message: msg };
    }
  }

  // ── save ────────────────────────────────────────────────────────────────────

  private async save(opts: BrandBrainOptions): Promise<BrandBrainResult> {
    const slug = opts.slug ?? opts.memory?.slug;
    if (!slug) {
      return { ok: false, message: 'slug is required for save action' };
    }

    const brainPath = this.getBrainPath(slug);
    await ensureDir(path.dirname(brainPath));

    let existing: BrandMemory = defaultBrandMemory(slug);
    if (await pathExists(brainPath)) {
      try {
        existing = await readJson<BrandMemory>(brainPath);
        this.log.info(`Merging with existing brand: ${slug}`);
      } catch {
        this.log.warn(`Could not read existing brain for ${slug}, overwriting`);
      }
    }

    const merged: BrandMemory = {
      ...existing,
      ...(opts.memory ?? {}),
      slug,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(brainPath, JSON.stringify(merged, null, 2), 'utf8');
    this.log.info(`Brand saved: ${slug} → ${brainPath}`);
    return { ok: true, brand: merged, message: `Brand '${slug}' saved successfully` };
  }

  // ── load ────────────────────────────────────────────────────────────────────

  private async load(opts: BrandBrainOptions): Promise<BrandBrainResult> {
    if (!opts.slug) {
      return { ok: false, message: 'slug is required for load action' };
    }

    const brainPath = this.getBrainPath(opts.slug);
    if (!(await pathExists(brainPath))) {
      return { ok: false, message: `Brand '${opts.slug}' not found at ${brainPath}` };
    }

    try {
      const brand = await readJson<BrandMemory>(brainPath);
      this.log.info(`Brand loaded: ${opts.slug}`);
      return { ok: true, brand, message: `Brand '${opts.slug}' loaded successfully` };
    } catch (err) {
      const msg = (err as Error).message;
      this.log.error(`Failed to parse brain.json for ${opts.slug}: ${msg}`);
      return { ok: false, message: `Failed to parse brand data: ${msg}` };
    }
  }

  // ── list ────────────────────────────────────────────────────────────────────

  private async list(): Promise<BrandBrainResult> {
    await ensureDir(this.brandsRoot);

    let entries: string[] = [];
    try {
      entries = await fs.readdir(this.brandsRoot);
    } catch {
      return { ok: true, brands: [], message: 'No brands found' };
    }

    const brands: BrandMemory[] = [];
    for (const entry of entries) {
      const brainPath = this.getBrainPath(entry);
      if (await pathExists(brainPath)) {
        try {
          const brand = await readJson<BrandMemory>(brainPath);
          brands.push(brand);
        } catch {
          this.log.warn(`Skipping unreadable brand: ${entry}`);
        }
      }
    }

    this.log.info(`Listed ${brands.length} brand(s)`);
    return {
      ok: true,
      brands,
      message: `Found ${brands.length} brand(s)`,
    };
  }

  // ── delete ──────────────────────────────────────────────────────────────────

  private async deleteBrand(opts: BrandBrainOptions): Promise<BrandBrainResult> {
    if (!opts.slug) {
      return { ok: false, message: 'slug is required for delete action' };
    }

    const brandDir = path.join(this.brandsRoot, opts.slug);
    if (!(await pathExists(brandDir))) {
      return { ok: false, message: `Brand '${opts.slug}' directory not found` };
    }

    await fs.rm(brandDir, { recursive: true, force: true });
    this.log.info(`Brand deleted: ${opts.slug}`);
    return { ok: true, message: `Brand '${opts.slug}' deleted successfully` };
  }

  // ── update ──────────────────────────────────────────────────────────────────

  private async update(opts: BrandBrainOptions): Promise<BrandBrainResult> {
    const slug = opts.slug ?? opts.memory?.slug;
    if (!slug) {
      return { ok: false, message: 'slug is required for update action' };
    }

    const brainPath = this.getBrainPath(slug);
    if (!(await pathExists(brainPath))) {
      return { ok: false, message: `Brand '${slug}' not found — use 'save' to create it first` };
    }

    let existing: BrandMemory;
    try {
      existing = await readJson<BrandMemory>(brainPath);
    } catch (err) {
      const msg = (err as Error).message;
      return { ok: false, message: `Failed to read existing brand: ${msg}` };
    }

    // Deep-merge arrays (pastCampaigns, viralFormulas, palette) by appending
    const incoming = opts.memory ?? {};
    const updated: BrandMemory = {
      ...existing,
      ...incoming,
      slug,
      palette: incoming.palette
        ? [...new Set([...existing.palette, ...incoming.palette])]
        : existing.palette,
      viralFormulas: incoming.viralFormulas
        ? [...new Set([...existing.viralFormulas, ...incoming.viralFormulas])]
        : existing.viralFormulas,
      pastCampaigns: incoming.pastCampaigns
        ? [...existing.pastCampaigns, ...incoming.pastCampaigns]
        : existing.pastCampaigns,
      fonts: incoming.fonts ? { ...existing.fonts, ...incoming.fonts } : existing.fonts,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(brainPath, JSON.stringify(updated, null, 2), 'utf8');
    this.log.info(`Brand updated: ${slug}`);
    return { ok: true, brand: updated, message: `Brand '${slug}' updated successfully` };
  }
}

// ─── Standalone helper ────────────────────────────────────────────────────────

/**
 * Convenience helper — loads a brand by slug without instantiating BrandBrain directly.
 * Returns null if the brand does not exist or cannot be parsed.
 */
export async function loadBrand(slug: string, log: OpLog): Promise<BrandMemory | null> {
  const brain = new BrandBrain(log);
  const result = await brain.execute({ action: 'load', slug });
  if (!result.ok || !result.brand) {
    log.warn(`loadBrand: could not load brand '${slug}': ${result.message}`);
    return null;
  }
  return result.brand;
}
