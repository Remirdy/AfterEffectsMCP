import path from "node:path";
import { promises as fs } from "node:fs";

import { VfxPlan } from "../vfx/vfxPlanner.js";

export type EngineTarget = "unity" | "unreal" | "both";
export type EngineTargetInput = EngineTarget | "auto";
export type EngineExportKind = "spritesheet" | "pngSequence" | "both";
export type C4dMode = "auto" | "off" | "use" | "require";

export interface EnginePackageOptions {
  prompt: string;
  engine: EngineTargetInput;
  exportKind: EngineExportKind;
  outputFolder: string;
  aepPath: string;
  compName: string;
  plan: VfxPlan;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  duration: number;
  loop: boolean;
  blendMode: "additive" | "alphaBlend" | "premultipliedAlpha";
  c4dMode: C4dMode;
  c4dScenePath?: string;
}

export interface EnginePackageManifest {
  packageType: "motionpilot_game_engine_vfx";
  prompt: string;
  engine: EngineTarget;
  exportKind: EngineExportKind;
  sourceAepPath: string;
  compName: string;
  renderTargets: {
    pngSequenceFolder: string | null;
    spriteSheetPath: string | null;
    previewPath: string;
  };
  renderSettings: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    frameCount: number;
    loop: boolean;
    alpha: "straight";
    blendMode: "additive" | "alphaBlend" | "premultipliedAlpha";
    recommendedPivot: [number, number];
    spriteSheet: {
      columns: number;
      rows: number;
      cellWidth: number;
      cellHeight: number;
      sheetWidth: number;
      sheetHeight: number;
    };
  };
  engineMapping: EngineEffectMapping[];
  c4d: {
    requested: boolean;
    mode: C4dMode;
    scenePath: string | null;
    notes: string[];
  };
  vfxPlan: VfxPlan;
  files: {
    manifest: string;
    unityNotes?: string;
    unrealNotes?: string;
    renderScript: string;
  };
}

export interface EngineEffectMapping {
  effect: string;
  category: "additive" | "alphaBlend" | "distortion";
  unity: { renderer: string; blend: string; vfxGraph: string };
  unreal: { material: string; blend: string; niagara: string };
  oneShot: boolean;
}

/**
 * Maps each MotionPilot VFX preset/composite to concrete Unity (VFX Graph /
 * Shuriken) and Unreal (Niagara) integration guidance — so the package reads
 * like a TD wrote it, not a generic "import the sprite sheet" note.
 */
const EFFECT_ENGINE_TABLE: Record<string, Omit<EngineEffectMapping, "effect">> = {
  energyBurst: { category: "additive", oneShot: true, unity: { renderer: "VFX Graph flipbook (Output Particle Quad)", blend: "Additive", vfxGraph: "Single Burst spawn → Set Lifetime → Flipbook Player, Size over Life curve" }, unreal: { material: "Unlit / Additive", blend: "Additive", niagara: "Spawn Burst Instantaneous → Sprite Renderer SubUV one-shot" } },
  shockwave: { category: "distortion", oneShot: true, unity: { renderer: "VFX Graph flipbook + Distortion output", blend: "Additive (Soft)", vfxGraph: "Use the flipbook as a normal/distortion source on an expanding ring mesh" }, unreal: { material: "Translucent + Refraction", blend: "Translucent", niagara: "Scale Sprite Size by Life on a single particle, drive distortion via material" } },
  fireSmoke: { category: "alphaBlend", oneShot: false, unity: { renderer: "VFX Graph flipbook", blend: "Alpha Blend (smoke) / Additive (fire core)", vfxGraph: "Continuous spawn rate, upward Velocity + Turbulence, Color over Life" }, unreal: { material: "Translucent (smoke) / Additive (fire)", blend: "Translucent", niagara: "Spawn Rate emitter, Curl Noise force, SubUV animation" } },
  lightningBolt: { category: "additive", oneShot: true, unity: { renderer: "VFX Graph flipbook or Line/Strip output", blend: "Additive", vfxGraph: "One-shot burst, very short lifetime, high emissive multiplier + Bloom" }, unreal: { material: "Unlit / Additive emissive", blend: "Additive", niagara: "Beam/Ribbon emitter or SubUV one-shot, drive flicker via dynamic param" } },
  portal: { category: "additive", oneShot: false, unity: { renderer: "VFX Graph flipbook (loop)", blend: "Additive", vfxGraph: "Loop-authored flipbook, rotate UV, emissive core mesh behind" }, unreal: { material: "Additive panner", blend: "Additive", niagara: "Looping SubUV, World-aligned, rotating mesh core" } },
  forceField: { category: "alphaBlend", oneShot: false, unity: { renderer: "Mesh + Fresnel shader (flipbook as impact overlay)", blend: "Alpha Blend", vfxGraph: "Use flipbook for impact ripples; dome is a fresnel mesh shader" }, unreal: { material: "Translucent Fresnel", blend: "Translucent", niagara: "Impact ripples as SubUV decals on a fresnel dome mesh" } },
  hitSpark: { category: "additive", oneShot: true, unity: { renderer: "VFX Graph flipbook", blend: "Additive", vfxGraph: "Tiny one-shot burst, very short life, no gravity" }, unreal: { material: "Additive", blend: "Additive", niagara: "Instant burst, short lifetime SubUV" } },
  muzzleFlash: { category: "additive", oneShot: true, unity: { renderer: "VFX Graph flipbook", blend: "Additive", vfxGraph: "1-frame-ish flash, attach to muzzle socket, randomize roll" }, unreal: { material: "Additive", blend: "Additive", niagara: "Single particle, socket-attached, brief life SubUV" } },
  disintegrate: { category: "alphaBlend", oneShot: true, unity: { renderer: "VFX Graph + dissolve shader on mesh", blend: "Alpha Blend", vfxGraph: "Spawn from skinned mesh, dissolve clip mask drives particle emission" }, unreal: { material: "Masked dissolve + Translucent particles", blend: "Masked", niagara: "Emit from mesh reproduction, dissolve mask in material" } },
  rainStorm: { category: "alphaBlend", oneShot: false, unity: { renderer: "VFX Graph flipbook (loop)", blend: "Alpha Blend", vfxGraph: "High spawn rate, downward velocity, world-space, stretched billboards" }, unreal: { material: "Translucent", blend: "Translucent", niagara: "Spawn Rate, gravity, velocity-aligned ribbons" } },
};

function defaultMapping(effect: string): EngineEffectMapping {
  return {
    effect,
    category: "additive",
    oneShot: true,
    unity: { renderer: "VFX Graph flipbook (Output Particle Quad)", blend: "Additive", vfxGraph: "Burst spawn → Flipbook Player, Size/Color over Life" },
    unreal: { material: "Unlit / Additive", blend: "Additive", niagara: "Burst emitter → Sprite Renderer SubUV" },
    ...(EFFECT_ENGINE_TABLE[effect] ? { ...EFFECT_ENGINE_TABLE[effect] } : {}),
  };
}

function buildEngineMapping(plan: VfxPlan): EngineEffectMapping[] {
  const seen = new Set<string>();
  const out: EngineEffectMapping[] = [];
  for (const step of plan.steps) {
    if (seen.has(step.name)) continue;
    seen.add(step.name);
    out.push(defaultMapping(step.name));
  }
  return out;
}

/** Choose a near-square sprite-sheet grid for a given frame count. */
function spriteGrid(frameCount: number, frameW: number, frameH: number) {
  const columns = Math.ceil(Math.sqrt(frameCount));
  const rows = Math.ceil(frameCount / columns);
  return {
    columns,
    rows,
    cellWidth: frameW,
    cellHeight: frameH,
    sheetWidth: columns * frameW,
    sheetHeight: rows * frameH,
  };
}

export function inferEngine(prompt: string, engine: EngineTargetInput): EngineTarget {
  if (engine !== "auto") return engine;
  const p = prompt.toLowerCase();
  const hasUnity = /\b(unity|urp|hdrp|vfx\s*graph|particle\s*system)\b/i.test(p);
  const hasUnreal = /\b(unreal|ue5?|niagara|cascade)\b/i.test(p);
  if (hasUnity && hasUnreal) return "both";
  if (hasUnreal) return "unreal";
  return "unity";
}

export function inferC4dRequested(prompt: string, mode: C4dMode, c4dScenePath?: string): boolean {
  if (mode === "off") return false;
  if (mode === "use" || mode === "require" || c4dScenePath) return true;
  return /\b(c4d|cinema\s*4d|cineware|maxon)\b/i.test(prompt);
}

function unityNotes(manifest: EnginePackageManifest): string {
  return `# Unity Import Notes

Package: MotionPilot game-engine VFX
Prompt: ${manifest.prompt}

## Recommended Import

- Import the rendered PNG sequence or sprite sheet into Unity.
- Texture Type: Sprite (2D and UI) for sprite sheets, or Default for VFX Graph flipbooks.
- Alpha Source: Input Texture Alpha.
- sRGB: On for stylized color VFX, Off only when using the texture as data.
- Wrap Mode: Clamp for one-shot impacts, Repeat for looped flipbooks.
- Filter Mode: Bilinear.
- Compression: None or High Quality for UI/trailer use.
- Pivot: ${manifest.renderSettings.recommendedPivot[0]}, ${manifest.renderSettings.recommendedPivot[1]}.
- Blend Mode: ${manifest.renderSettings.blendMode}.

## URP/HDRP Setup

- Additive energy, magic, fire, sparks: use Additive or Soft Additive material.
- Smoke/fog/soft aura: use Alpha Blend.
- Unity VFX Graph: use Flipbook Player with ${manifest.renderSettings.frameCount} frames at ${manifest.renderSettings.fps} FPS.
- Particle System: Texture Sheet Animation module can read the sprite-sheet grid after render.

## Sprite Sheet Grid

- Grid: ${manifest.renderSettings.spriteSheet.columns} columns × ${manifest.renderSettings.spriteSheet.rows} rows (${manifest.renderSettings.frameCount} frames).
- Cell size: ${manifest.renderSettings.spriteSheet.cellWidth}×${manifest.renderSettings.spriteSheet.cellHeight}px.
- Sheet size: ${manifest.renderSettings.spriteSheet.sheetWidth}×${manifest.renderSettings.spriteSheet.sheetHeight}px.
- Shuriken Texture Sheet Animation: set Tiles X=${manifest.renderSettings.spriteSheet.columns}, Y=${manifest.renderSettings.spriteSheet.rows}, Frame over Time = linear 0→1.

## Per-Effect Integration

${manifest.engineMapping
  .map(
    (m) =>
      `### ${m.effect} (${m.category}${m.oneShot ? ", one-shot" : ", looping"})\n` +
      `- Renderer: ${m.unity.renderer}\n` +
      `- Blend: ${m.unity.blend}\n` +
      `- VFX Graph: ${m.unity.vfxGraph}`
  )
  .join("\n\n")}

## Source

The editable source comp is:

\`${manifest.sourceAepPath}\`
`;
}

function unrealNotes(manifest: EnginePackageManifest): string {
  return `# Unreal / Niagara Import Notes

Package: MotionPilot game-engine VFX
Prompt: ${manifest.prompt}

## Recommended Import

- Import the rendered sprite sheet or PNG sequence into Unreal.
- For Niagara flipbooks, create a translucent/additive material and drive SubUV animation.
- Material Blend Mode: ${manifest.renderSettings.blendMode === "alphaBlend" ? "Translucent" : "Additive"}.
- Shading Model: Unlit for stylized game VFX.
- Two Sided: On for billboard particles.
- Frame Rate: ${manifest.renderSettings.fps} FPS.
- Frame Count: ${manifest.renderSettings.frameCount}.
- Loop: ${manifest.renderSettings.loop ? "Yes" : "No"}.

## Niagara Setup

- Use a Sprite Renderer with SubUV/Flipbook settings.
- Use the manifest frame count and sprite-sheet grid after render.
- Impacts and attacks should be one-shot emitters.
- Portals, auras and environmental effects can loop if the render is authored as loop-ready.

## Sprite Sheet Grid (SubUV)

- SubImages: Horizontal=${manifest.renderSettings.spriteSheet.columns}, Vertical=${manifest.renderSettings.spriteSheet.rows} (${manifest.renderSettings.frameCount} frames).
- Cell: ${manifest.renderSettings.spriteSheet.cellWidth}×${manifest.renderSettings.spriteSheet.cellHeight}px — set the SubUV material node accordingly.
- Drive "SubUVAnimation" module / Particles.SubImageIndex from 0→${manifest.renderSettings.frameCount - 1} over lifetime.

## Per-Effect Integration

${manifest.engineMapping
  .map(
    (m) =>
      `### ${m.effect} (${m.category}${m.oneShot ? ", one-shot" : ", looping"})\n` +
      `- Material: ${m.unreal.material}\n` +
      `- Blend Mode: ${m.unreal.blend}\n` +
      `- Niagara: ${m.unreal.niagara}`
  )
  .join("\n\n")}

## Source

The editable source comp is:

\`${manifest.sourceAepPath}\`
`;
}

function renderScript(manifest: EnginePackageManifest): string {
  return `# Render Instructions

This package contains the editable After Effects source AEP and import metadata.

Source AEP:
${manifest.sourceAepPath}

Comp:
${manifest.compName}

Recommended render targets:
- PNG sequence folder: ${manifest.renderTargets.pngSequenceFolder ?? "not requested"}
- Sprite sheet path: ${manifest.renderTargets.spriteSheetPath ?? "not requested"}
- Preview video path: ${manifest.renderTargets.previewPath}

Recommended render settings:
- ${manifest.renderSettings.width}x${manifest.renderSettings.height}
- ${manifest.renderSettings.fps} FPS
- ${manifest.renderSettings.duration}s
- Straight alpha
- Blend mode in engine: ${manifest.renderSettings.blendMode}

After rendering a PNG sequence, pack it into a sprite sheet using your engine pipeline
or a texture packer. Preserve frame order from frame_0000 upward.
`;
}

export async function writeEnginePackage(opts: EnginePackageOptions): Promise<EnginePackageManifest> {
  const engine = inferEngine(opts.prompt, opts.engine);
  const requestedC4d = inferC4dRequested(opts.prompt, opts.c4dMode, opts.c4dScenePath);
  const exportsDir = path.join(opts.outputFolder, "exports");
  const framesDir = path.join(exportsDir, "frames");
  const docsDir = path.join(opts.outputFolder, "docs");
  await fs.mkdir(exportsDir, { recursive: true });
  await fs.mkdir(docsDir, { recursive: true });
  if (opts.exportKind === "pngSequence" || opts.exportKind === "both") {
    await fs.mkdir(framesDir, { recursive: true });
  }

  const manifestPath = path.join(opts.outputFolder, "manifest.json");
  const frameCount = Math.round(opts.duration * opts.fps);
  const grid = spriteGrid(frameCount, opts.frameWidth, opts.frameHeight);
  const engineMapping = buildEngineMapping(opts.plan);
  const manifest: EnginePackageManifest = {
    packageType: "motionpilot_game_engine_vfx",
    prompt: opts.prompt,
    engine,
    exportKind: opts.exportKind,
    sourceAepPath: opts.aepPath,
    compName: opts.compName,
    renderTargets: {
      pngSequenceFolder: opts.exportKind === "pngSequence" || opts.exportKind === "both" ? framesDir : null,
      spriteSheetPath:
        opts.exportKind === "spritesheet" || opts.exportKind === "both"
          ? path.join(exportsDir, "flipbook_spritesheet.png")
          : null,
      previewPath: path.join(exportsDir, "preview.mov"),
    },
    renderSettings: {
      width: opts.frameWidth,
      height: opts.frameHeight,
      fps: opts.fps,
      duration: opts.duration,
      frameCount,
      loop: opts.loop,
      alpha: "straight",
      blendMode: opts.blendMode,
      recommendedPivot: [0.5, 0.5],
      spriteSheet: grid,
    },
    engineMapping,
    c4d: {
      requested: requestedC4d,
      mode: opts.c4dMode,
      scenePath: opts.c4dScenePath ?? null,
      notes: requestedC4d
        ? [
            "Cinema 4D/Cineware was requested. If a c4dScenePath was provided, the AEP creation step attempts to import it through After Effects/Cineware.",
            "For final engine exports, render passes should still be flattened to PNG sequence or sprite sheet with alpha.",
          ]
        : ["Cinema 4D/Cineware was not requested."],
    },
    vfxPlan: opts.plan,
    files: {
      manifest: manifestPath,
      renderScript: path.join(docsDir, "render-instructions.md"),
    },
  };

  if (engine === "unity" || engine === "both") {
    manifest.files.unityNotes = path.join(docsDir, "unity-import-notes.md");
    await fs.writeFile(manifest.files.unityNotes, unityNotes(manifest), "utf8");
  }
  if (engine === "unreal" || engine === "both") {
    manifest.files.unrealNotes = path.join(docsDir, "unreal-niagara-notes.md");
    await fs.writeFile(manifest.files.unrealNotes, unrealNotes(manifest), "utf8");
  }

  await fs.writeFile(manifest.files.renderScript, renderScript(manifest), "utf8");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}
