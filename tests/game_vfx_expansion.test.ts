import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { createUnityVfxToolkitPackage } from "../src/engine/unityVfxToolkit.js";
import { LiveUnityBridge } from "../src/engine/liveUnityBridge.js";
import { OpLog } from "../src/util.js";

const testDir = path.join(process.cwd(), "tests_temp_game_vfx_expansion");

describe("game VFX market expansion tools", () => {
  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
  });

  it("creates Unreal Niagara, Godot, Effekseer, and engine-agnostic exports", async () => {
    const unreal = await createUnityVfxToolkitPackage("build_unreal_niagara_pack", {
      outputFolder: testDir,
      packageName: "PlasmaBurst",
      prompt: "sci-fi plasma burst",
    });
    const godot = await createUnityVfxToolkitPackage("build_godot_particles_pack", {
      outputFolder: testDir,
      packageName: "Fireflies",
      prompt: "ambient fireflies",
    });
    const effekseer = await createUnityVfxToolkitPackage("export_effekseer_project", {
      outputFolder: testDir,
      packageName: "SlashImpact",
      prompt: "anime slash impact",
    });
    const agnostic = await createUnityVfxToolkitPackage("build_engine_agnostic_vfx_manifest", {
      outputFolder: testDir,
      packageName: "UniversalImpact",
    });

    expect(unreal.files.some((f) => f.endsWith("NS_PlasmaBurst.niagara.json"))).toBe(true);
    expect(godot.files.some((f) => f.endsWith("Fireflies_spawner.gd"))).toBe(true);
    expect(effekseer.files.some((f) => f.endsWith("SlashImpact.efkefc.json"))).toBe(true);
    expect(agnostic.files.some((f) => f.endsWith("engine-agnostic.vfx.json"))).toBe(true);
  });

  it("creates juice, flowmap, ability timeline, animation events, sfx, and art direction metadata", async () => {
    const juice = await createUnityVfxToolkitPackage("build_game_feel_juice_pack", {
      outputFolder: testDir,
      packageName: "JuicyHits",
    });
    const flow = await createUnityVfxToolkitPackage("generate_motion_vector_flowmap", {
      outputFolder: testDir,
      packageName: "FlowBurst",
    });
    const ability = await createUnityVfxToolkitPackage("build_ability_timeline", {
      outputFolder: testDir,
      packageName: "MeteorStrike",
      abilityName: "MeteorStrike",
    });
    const events = await createUnityVfxToolkitPackage("bind_vfx_to_animation_events", {
      outputFolder: testDir,
      packageName: "SwordSlashEvents",
    });
    const sfx = await createUnityVfxToolkitPackage("pair_vfx_with_sfx", {
      outputFolder: testDir,
      packageName: "PairedImpact",
    });
    const art = await createUnityVfxToolkitPackage("match_game_art_direction", {
      outputFolder: testDir,
      packageName: "ArtMatchedPack",
    });

    expect((juice.manifest.elements as string[])).toContain("damage_numbers");
    expect(flow.files.some((f) => f.endsWith("flowmap-spec.json"))).toBe(true);
    expect(ability.files.some((f) => f.endsWith("ability-timeline.json"))).toBe(true);
    expect(events.files.some((f) => f.endsWith("animation-events.json"))).toBe(true);
    expect(sfx.files.some((f) => f.endsWith("sfx-pairing.json"))).toBe(true);
    expect(art.files.some((f) => f.endsWith("art-direction-profile.json"))).toBe(true);
  });

  it("compiles live Unity VFX graph data for editor preview handoff", async () => {
    const bridge = new LiveUnityBridge();
    const compiled = await bridge.compileVfxGraph("LiveFire", "fire vortex", testDir);
    const preview = await bridge.previewInUnity("LiveFire", compiled.compiledData, new OpLog());

    expect(compiled.compiledData.nodes.find((node) => node.id === "node_spawn")?.properties.rate).toBe(150);
    expect(preview.ok).toBe(true);
  });
});
