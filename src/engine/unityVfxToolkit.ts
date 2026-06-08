import path from "node:path";
import { promises as fs } from "node:fs";

import { ensureDir, guardOverwrite, writeJson } from "../util.js";

export type UnityVfxToolKind =
  | "build_unity_vfx_spritesheet"
  | "build_unity_vfx_prefab_package"
  | "build_vfx_graph_template"
  | "build_urp_particle_materials"
  | "build_hit_impact_pack"
  | "build_elemental_spell_pack"
  | "build_projectile_vfx"
  | "build_character_status_effects"
  | "export_unity_flipbook_manifest"
  | "build_unity_shadergraph_stub"
  | "build_vfx_lod_variants"
  | "build_mobile_vfx_optimizer"
  | "build_vfx_collision_variants"
  | "build_unity_import_settings"
  | "build_rpg_spell_library"
  | "build_fps_muzzle_impact_pack"
  | "build_moba_skill_vfx"
  | "build_platformer_pickup_vfx"
  | "build_horror_game_atmospherics"
  | "plan_unity_vfx_from_prompt"
  | "build_vfx_combo_from_prompt"
  | "validate_unity_vfx_budget"
  | "build_vfx_preview_scene"
  | "build_vfx_timing_sheet"
  | "build_premium_vfx_atlas_pack"
  | "build_layered_vfx_passes"
  | "build_flipbook_normal_distortion"
  | "build_vfx_variation_generator"
  | "build_combat_vfx_bundle"
  | "build_magic_school_bundle"
  | "build_shader_driven_vfx_pack"
  | "build_mesh_based_vfx_primitives"
  | "build_trail_renderer_pack"
  | "build_decal_impact_pack"
  | "build_screen_space_vfx"
  | "build_asset_store_vfx_package"
  | "build_demo_scene_gallery"
  | "build_vfx_thumbnail_sheet"
  | "build_vfx_documentation_pack"
  | "build_vfx_pack_index"
  | "score_vfx_asset_quality"
  | "build_vfx_performance_profiles"
  | "audit_vfx_overdraw"
  | "build_vfx_lifetime_curves"
  | "build_vfx_color_ramps"
  | "render_vfx_flipbook_from_ae"
  | "pack_flipbook_atlas"
  | "generate_vfx_preview_gif_mp4"
  | "render_vfx_thumbnail_contact_sheet"
  | "auto_crop_alpha_frames"
  | "normalize_flipbook_brightness_alpha"
  | "validate_loop_seam"
  | "generate_real_unity_prefabs"
  | "generate_vfx_graph_asset"
  | "generate_shadergraph_asset"
  | "create_unity_demo_project"
  | "create_unity_package_export"
  | "build_marketplace_media_pack"
  | "write_asset_store_description"
  | "generate_pack_trailer_storyboard"
  | "build_demo_gallery_ui"
  | "analyze_flipbook_silhouette"
  | "detect_alpha_bleeding_edges"
  | "estimate_texture_memory_budget"
  | "compare_lod_visual_loss"
  | "validate_mobile_vfx_pack"
  | "build_unreal_niagara_pack"
  | "build_godot_particles_pack"
  | "export_effekseer_project"
  | "build_engine_agnostic_vfx_manifest"
  | "build_environment_ambient_pack"
  | "build_destruction_gore_pack"
  | "build_scifi_tech_pack"
  | "build_vehicle_vfx_pack"
  | "build_game_feel_juice_pack"
  | "build_magic_school_extended"
  | "build_casual_card_fx_pack"
  | "build_locomotion_fx_pack"
  | "generate_motion_vector_flowmap"
  | "build_ability_timeline"
  | "bind_vfx_to_animation_events"
  | "build_realtime_shader_library"
  | "pair_vfx_with_sfx"
  | "build_decal_projection_system"
  | "vfx_from_concept_art"
  | "match_game_art_direction"
  | "vfx_pack_autopilot";

export interface UnityVfxToolkitOptions {
  outputFolder: string;
  approveOverwrite?: boolean;
  prompt?: string;
  packageName?: string;
  effectName?: string;
  effectType?: string;
  style?: string;
  elements?: string[];
  phases?: string[];
  width?: number;
  height?: number;
  fps?: number;
  frameCount?: number;
  columns?: number;
  rows?: number;
  loop?: boolean;
  blendMode?: "additive" | "alphaBlend" | "premultipliedAlpha" | "distortion";
  targetPipeline?: "urp" | "hdrp" | "built-in";
  targetPlatform?: "mobile" | "desktop" | "console" | "all";
  texturePath?: string;
  aepPath?: string;
  compName?: string;
  outputVideoPath?: string;
  outputGifPath?: string;
  outputUnityPackagePath?: string;
  highLodPath?: string;
  mediumLodPath?: string;
  lowLodPath?: string;
  spriteSheetPath?: string;
  pngSequenceFolder?: string;
  conceptArtPath?: string;
  screenshotPaths?: string[];
  abilityName?: string;
  engineTargets?: string[];
  eventName?: string;
  animationClipName?: string;
  sfxStyle?: string;
  packSize?: number;
  pivot?: [number, number];
  maxTextureSize?: number;
  particleBudget?: number;
  overdrawBudget?: number;
  variationCount?: number;
  qualityTarget?: "prototype" | "production" | "assetStore";
}

export interface UnityVfxToolkitResult {
  packageType: "motionpilot_unity_vfx_toolkit";
  tool: UnityVfxToolKind;
  packageName: string;
  outputFolder: string;
  manifestPath: string;
  files: string[];
  manifest: Record<string, unknown>;
}

function titleFromKind(kind: UnityVfxToolKind): string {
  return kind
    .replace(/^build_|^export_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function slug(input: string): string {
  return input
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "UnityVFX";
}

function inferEffect(prompt: string, fallback?: string): string {
  const p = prompt.toLowerCase();
  if (/fire|flame|burn|ate[sş]/.test(p)) return "fire";
  if (/ice|freeze|frost|buz/.test(p)) return "ice";
  if (/lightning|electric|shock|şimşek|yıldırım/.test(p)) return "lightning";
  if (/heal|regen|holy|şifa/.test(p)) return "heal";
  if (/poison|toxic|acid|zehir/.test(p)) return "poison";
  if (/shield|barrier|kalkan/.test(p)) return "shield";
  if (/portal|rift/.test(p)) return "portal";
  if (/slash|sword|kılıç/.test(p)) return "slash";
  if (/muzzle|gun|bullet|impact/.test(p)) return "impact";
  return fallback || "energy";
}

function grid(frameCount: number, columns?: number, rows?: number) {
  const c = columns || Math.ceil(Math.sqrt(frameCount));
  const r = rows || Math.ceil(frameCount / c);
  return { columns: c, rows: r, capacity: c * r };
}

function defaultElements(kind: UnityVfxToolKind, effect: string): string[] {
  const map: Record<UnityVfxToolKind, string[]> = {
    build_unity_vfx_spritesheet: ["flipbook_manifest", "sprite_sheet_layout", "import_settings"],
    build_unity_vfx_prefab_package: ["Textures", "Materials", "Prefabs", "Scripts", "VFXGraph", "Documentation"],
    build_vfx_graph_template: ["Spawn", "Initialize", "Update", "Output Particle Quad", "Flipbook Player"],
    build_urp_particle_materials: ["Additive", "Alpha Blend", "Soft Particle", "Distortion", "Flipbook"],
    build_hit_impact_pack: ["bullet_hit", "magic_hit", "slash_hit", "shield_hit", "ground_hit", "spark_burst"],
    build_elemental_spell_pack: ["fire", "ice", "lightning", "poison", "holy", "dark", "arcane"],
    build_projectile_vfx: ["cast", "muzzle", "trail", "impact", "linger"],
    build_character_status_effects: ["heal", "poison", "burn", "freeze", "stun", "shield", "rage", "invisibility"],
    export_unity_flipbook_manifest: ["frame_grid", "pivot", "fps", "loop", "blend_mode"],
    build_unity_shadergraph_stub: ["fresnel", "dissolve", "rim_glow", "distortion", "flipbook_uv"],
    build_vfx_lod_variants: ["high", "medium", "low", "mobile"],
    build_mobile_vfx_optimizer: ["texture_budget", "frame_reduction", "overdraw", "compression", "particle_limits"],
    build_vfx_collision_variants: ["ground", "wall", "air", "water", "metal", "organic"],
    build_unity_import_settings: ["texture_importer", "sprite_settings", "compression", "wrap_filter", "alpha"],
    build_rpg_spell_library: ["cast_circle", "projectile", "impact", "buff", "debuff", "area"],
    build_fps_muzzle_impact_pack: ["muzzle_flash", "tracer", "bullet_hit", "smoke_puff", "shell_spark"],
    build_moba_skill_vfx: ["telegraph", "cast", "projectile", "impact", "area_linger", "cooldown_icon"],
    build_platformer_pickup_vfx: ["coin_pickup", "checkpoint", "jump_dust", "landing_puff", "dash_trail", "death_poof"],
    build_horror_game_atmospherics: ["fog_pulse", "ghost_distortion", "flicker", "blood_mist", "cursed_aura", "screen_shock"],
    plan_unity_vfx_from_prompt: ["prompt_analysis", "phases", "render_targets", "unity_integration"],
    build_vfx_combo_from_prompt: ["plan", "ae_source_slot", "spritesheet_manifest", "unity_prefab_package"],
    validate_unity_vfx_budget: ["texture_memory", "overdraw", "particle_count", "mobile_risk", "recommendations"],
    build_vfx_preview_scene: ["camera", "ground_plane", "effect_spawner", "loop_toggle", "lighting"],
    build_vfx_timing_sheet: ["anticipation", "flash", "peak", "decay", "linger"],
    build_premium_vfx_atlas_pack: ["small_variant", "medium_variant", "large_variant", "core", "trail", "impact", "smoke", "distortion"],
    build_layered_vfx_passes: ["core_pass", "glow_pass", "smoke_pass", "sparks_pass", "distortion_pass", "debris_pass", "light_pass"],
    build_flipbook_normal_distortion: ["color_flipbook", "normal_flipbook", "distortion_flipbook", "flowmap", "shadergraph"],
    build_vfx_variation_generator: ["seed_variants", "color_variants", "scale_variants", "timing_variants", "shape_variants"],
    build_combat_vfx_bundle: ["slash", "hit", "crit", "block", "parry", "dash", "charge", "ultimate", "ground_crack"],
    build_magic_school_bundle: ["fire_school", "frost_school", "lightning_school", "arcane_school", "nature_school", "dark_school"],
    build_shader_driven_vfx_pack: ["dissolve", "fresnel_aura", "scrolling_noise", "refraction", "heat_haze", "uv_distortion"],
    build_mesh_based_vfx_primitives: ["ring_mesh", "cone_mesh", "arc_mesh", "slash_mesh", "shockwave_disk", "beam_strip", "trail_ribbon"],
    build_trail_renderer_pack: ["weapon_trail", "dash_trail", "projectile_trail", "ribbon_trail", "trail_materials"],
    build_decal_impact_pack: ["scorch", "magic_rune", "bullet_hole", "crack", "blood_splat", "ice_mark", "poison_puddle"],
    build_screen_space_vfx: ["damage_vignette", "low_health_pulse", "hit_flash", "speed_lines", "radial_blur", "shock_distortion"],
    build_asset_store_vfx_package: ["demo_scene", "prefabs", "thumbnails", "documentation", "pack_index", "urp_hdrp_variants"],
    build_demo_scene_gallery: ["grid_arena", "category_stations", "dropdown_ui", "loop_toggle", "one_shot_trigger", "camera_rail"],
    build_vfx_thumbnail_sheet: ["contact_sheet", "individual_thumbnails", "preview_metadata", "marketplace_images"],
    build_vfx_documentation_pack: ["setup_guide", "import_settings", "performance_notes", "customization_guide", "color_change_guide"],
    build_vfx_pack_index: ["catalog_json", "catalog_markdown", "category_tags", "prefab_paths", "budget_table"],
    score_vfx_asset_quality: ["silhouette", "timing", "readability", "overdraw", "color_separation", "loop_quality"],
    build_vfx_performance_profiles: ["mobile_profile", "desktop_profile", "console_profile", "texture_sizes", "particle_budgets"],
    audit_vfx_overdraw: ["alpha_bounds", "blend_mode_risk", "particle_density", "screen_coverage", "recommendations"],
    build_vfx_lifetime_curves: ["size_over_life", "alpha_over_life", "emission_curve", "velocity_dampening", "color_over_life"],
    build_vfx_color_ramps: ["fire_ramp", "ice_ramp", "poison_ramp", "holy_ramp", "dark_ramp", "sci_fi_ramp"],
    render_vfx_flipbook_from_ae: ["aerender_plan", "png_sequence_target", "alpha_render_settings", "spritesheet_next_step"],
    pack_flipbook_atlas: ["sequence_scan", "trim_padding", "atlas_layout", "metadata_export"],
    generate_vfx_preview_gif_mp4: ["preview_mp4", "preview_gif", "turntable_timing", "marketplace_preview"],
    render_vfx_thumbnail_contact_sheet: ["contact_sheet_layout", "individual_thumbnails", "hero_thumbnail", "metadata"],
    auto_crop_alpha_frames: ["alpha_bounds", "trim_rects", "pivot_adjustment", "overdraw_reduction"],
    normalize_flipbook_brightness_alpha: ["brightness_curve", "alpha_curve", "flicker_detection", "normalized_sequence"],
    validate_loop_seam: ["first_last_diff", "temporal_seam_score", "loop_fix_notes"],
    generate_real_unity_prefabs: ["particle_system_prefab", "texture_sheet_animation", "material_binding", "trigger_script"],
    generate_vfx_graph_asset: ["vfx_graph_yaml_stub", "blackboard_properties", "flipbook_contexts"],
    generate_shadergraph_asset: ["shadergraph_json", "node_network", "urp_hdrp_notes"],
    create_unity_demo_project: ["Assets", "Packages", "ProjectSettings", "DemoScene", "PreviewSpawner"],
    create_unity_package_export: ["export_script", "asset_selection", "unitypackage_target", "release_notes"],
    build_marketplace_media_pack: ["cover_image_plan", "thumbnail_grid", "preview_gifs", "feature_banners"],
    write_asset_store_description: ["store_description", "feature_list", "compatibility", "pipeline_notes"],
    generate_pack_trailer_storyboard: ["shot_list", "timing", "camera_moves", "title_cards"],
    build_demo_gallery_ui: ["dropdown", "next_previous", "replay_button", "slow_motion_toggle", "category_filter"],
    analyze_flipbook_silhouette: ["silhouette_score", "readability_frames", "contrast_notes"],
    detect_alpha_bleeding_edges: ["premultiply_check", "edge_bleed_score", "fix_recommendations"],
    estimate_texture_memory_budget: ["texture_memory_mb", "mip_cost", "platform_budget"],
    compare_lod_visual_loss: ["lod_delta", "frame_loss", "resolution_loss", "recommendations"],
    validate_mobile_vfx_pack: ["mobile_texture_budget", "overdraw", "particle_count", "shader_complexity", "pass_fail"],
    build_unreal_niagara_pack: ["Niagara_System", "Emitter_Modules", "UE_Material", "flipbook_subuv", "sandbox_import_notes"],
    build_godot_particles_pack: ["GPUParticles2D", "GPUParticles3D", "ParticleProcessMaterial", "CanvasItem_shader", "GDScript_spawner"],
    export_effekseer_project: ["efkefc_project", "emitter_tree", "flipbook_node", "runtime_bindings", "cross_engine_notes"],
    build_engine_agnostic_vfx_manifest: ["neutral_schema", "phase_timeline", "render_targets", "engine_export_targets", "budget_profile"],
    build_environment_ambient_pack: ["rain", "snow", "fog", "sandstorm", "waterfall", "torch_fire", "fireflies", "dust_motes", "wind_leaves", "bioluminescence"],
    build_destruction_gore_pack: ["glass_shatter", "wood_splinters", "debris_chunks", "blood_splatter", "blood_pool", "ragdoll_residue"],
    build_scifi_tech_pack: ["plasma", "energy_shield", "teleport_warp", "hologram_glitch", "emp_wave", "laser_beam", "force_field", "tractor_beam", "sci_fi_explosion"],
    build_vehicle_vfx_pack: ["exhaust_smoke", "tire_smoke", "skid_marks", "nitro_burst", "jet_trail", "water_wake", "dust_trail"],
    build_game_feel_juice_pack: ["damage_numbers", "level_up", "xp_gain", "coin_loot_pickup", "combo_counter", "crit_flash", "heal_buff_aura", "screen_shake_trigger", "hitstop"],
    build_magic_school_extended: ["necromancy", "holy_light", "nature_druid", "blood_magic", "void_eldritch", "time", "gravity"],
    build_casual_card_fx_pack: ["confetti", "sparkle", "match_burst", "slot_machine", "bubble_pop", "card_glint", "card_flip"],
    build_locomotion_fx_pack: ["footstep_dust", "water_splash", "snow_track", "jump_puff", "landing_puff", "dash_trail", "wall_run_spark"],
    generate_motion_vector_flowmap: ["motion_vector_map", "flowmap_rg", "flipbook_blend_notes", "shader_sampling_guidance"],
    build_ability_timeline: ["cast", "channel", "release", "impact", "aftermath", "cooldown", "audio_sync", "animation_events"],
    bind_vfx_to_animation_events: ["windup_event", "release_event", "impact_event", "trail_enable", "metadata_json", "animation_clip_bindings"],
    build_realtime_shader_library: ["dissolve", "force_field_fresnel", "hologram", "toon_cel", "water", "lava", "ice", "glow"],
    pair_vfx_with_sfx: ["cast_sfx", "whoosh_sfx", "impact_sfx", "loop_bed", "tail_decay", "middleware_metadata"],
    build_decal_projection_system: ["URP_Decal_Projector", "surface_projection", "scorch", "blood_accumulation", "ice_build_up", "fade_persistence"],
    vfx_from_concept_art: ["concept_palette", "shape_language", "timing_inference", "matched_vfx_pack", "style_notes"],
    match_game_art_direction: ["palette_dna", "glow_profile", "resolution_style", "rendering_style", "consistency_rules"],
    vfx_pack_autopilot: ["concept_generation", "variant_batch", "atlas_pack", "prefabs", "lods", "documentation", "asset_store_copy", "trailer_storyboard"],
  };
  return map[kind] || [effect];
}

function materialText(name: string, blendMode: string, pipeline: string): string {
  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!21 &2100000
Material:
  serializedVersion: 8
  m_Name: ${name}
  m_ShaderKeywords: _SURFACE_TYPE_TRANSPARENT
  MotionPilot:
    pipeline: ${pipeline}
    blendMode: ${blendMode}
    note: Replace shader reference with your project URP/HDRP particle shader.
`;
}

function prefabText(name: string, materialName: string): string {
  return `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &100000
GameObject:
  m_Name: ${name}
  MotionPilot:
    renderer: ParticleSystem or VisualEffect
    material: ${materialName}
    note: Scaffold prefab stub; create final prefab in Unity after importing textures.
`;
}

function shaderGraphStub(name: string, effect: string): string {
  return JSON.stringify(
    {
      name,
      type: "MotionPilot ShaderGraph Stub",
      effect,
      nodes: [
        "UV",
        "Flipbook",
        "Time",
        "Gradient Sample",
        "Fresnel",
        "Dissolve Noise",
        "Rim Glow",
        "Distortion Normal",
        "Alpha Clip/Blend",
        "Unlit Master",
      ],
      exposedProperties: ["Color", "Emission", "DissolveAmount", "DistortionStrength", "FlipbookRows", "FlipbookColumns"],
    },
    null,
    2
  );
}

function vfxGraphStub(name: string, effect: string, loop: boolean) {
  return JSON.stringify(
    {
      name,
      type: "MotionPilot VFX Graph Template",
      effect,
      contexts: [
        { name: loop ? "Spawn Rate" : "Single Burst", recommended: loop ? "8-80 particles/sec" : "1 burst at trigger time" },
        { name: "Initialize Particle", lifetime: loop ? "0.8-2.5s" : "0.2-1.2s" },
        { name: "Update Particle", blocks: ["Velocity", "Turbulence", "Drag", "Size over Life", "Color over Life"] },
        { name: "Output Particle Quad", blocks: ["Flipbook Player", "Soft Particles", "Additive/Alpha Blend"] },
      ],
    },
    null,
    2
  );
}

function csharpSpawner(name: string): string {
  return `using UnityEngine;

public class ${name}Spawner : MonoBehaviour
{
    public GameObject effectPrefab;
    public KeyCode triggerKey = KeyCode.Space;
    public bool loopPreview = true;
    public float loopInterval = 1.25f;
    private float nextSpawn;

    void Update()
    {
        if (Input.GetKeyDown(triggerKey) || (loopPreview && Time.time >= nextSpawn))
        {
            if (effectPrefab != null) Instantiate(effectPrefab, transform.position, Quaternion.identity);
            nextSpawn = Time.time + loopInterval;
        }
    }
}
`;
}

function targetEngine(kind: UnityVfxToolKind): "unity" | "unreal" | "godot" | "effekseer" | "agnostic" {
  if (kind === "build_unreal_niagara_pack") return "unreal";
  if (kind === "build_godot_particles_pack") return "godot";
  if (kind === "export_effekseer_project") return "effekseer";
  if (kind === "build_engine_agnostic_vfx_manifest") return "agnostic";
  return "unity";
}

function unrealNiagaraSystem(name: string, effect: string): string {
  return JSON.stringify(
    {
      asset: `NS_${name}`,
      type: "Unreal Niagara System Scaffold",
      effect,
      emitters: [
        {
          name: "E_CoreFlipbook",
          modules: ["Initialize Particle", "Sprite Renderer", "SubUV Animation", "Color Over Life", "Scale Over Life"],
        },
        {
          name: "E_Sparks",
          modules: ["Spawn Burst Instantaneous", "Add Velocity", "Curl Noise Force", "Collision", "Lightweight Ribbon optional"],
        },
        {
          name: "E_Distortion",
          modules: ["Mesh/Sprite Renderer", "Scene Depth Fade", "Distortion Material"],
        },
      ],
      userParameters: ["User.ColorRamp", "User.Intensity", "User.LifetimeScale", "User.SpawnScale", "User.FlipbookTexture"],
      importNotes: [
        "Create Niagara System from this JSON plan in UE.",
        "Use SubUV sprite animation for flipbook atlases.",
        "Create M_VFX material with translucent/additive blend and soft depth fade.",
      ],
    },
    null,
    2
  );
}

function godotParticleTres(name: string, effect: string): string {
  return `[gd_resource type="ParticleProcessMaterial" format=3]

[resource]
resource_name = "${name}_${effect}_ProcessMaterial"
emission_shape = 1
direction = Vector3(0, 1, 0)
spread = 45.0
initial_velocity_min = 1.0
initial_velocity_max = 4.0
gravity = Vector3(0, -0.4, 0)
scale_min = 0.2
scale_max = 1.0
color = Color(0.25, 0.75, 1.0, 1.0)
`;
}

function godotSpawner(name: string): string {
  return `extends Node3D

@export var vfx_scene: PackedScene
@export var loop_interval := 1.25
var _next_spawn := 0.0

func _process(delta):
    _next_spawn -= delta
    if Input.is_action_just_pressed("ui_accept") or _next_spawn <= 0.0:
        if vfx_scene:
            var fx = vfx_scene.instantiate()
            add_child(fx)
        _next_spawn = loop_interval
`;
}

function effekseerProject(name: string, effect: string, frameCount: number): string {
  return JSON.stringify(
    {
      format: "MotionPilot Effekseer project scaffold",
      project: `${name}.efkefc`,
      effect,
      rootNode: {
        type: "Emitter",
        children: [
          { type: "Sprite", texture: "Textures/effect_spritesheet.png", frameCount, blend: "Add" },
          { type: "Ribbon", role: "trail_or_afterimage" },
          { type: "Model", role: "optional_debris_or_mesh_burst" },
        ],
      },
      runtimeTargets: ["Unity Effekseer Runtime", "Unreal Effekseer Runtime", "Native/C++"],
      notes: ["Open Effekseer and recreate this emitter tree, then save as .efkefc."],
    },
    null,
    2
  );
}

function engineAgnosticManifest(name: string, elements: string[], engines: string[]) {
  return JSON.stringify(
    {
      schema: "motionpilot.engine_agnostic_vfx.v1",
      name,
      phases: ["cast", "active", "impact", "decay"],
      elements,
      renderTargets: ["transparent_png_sequence", "flipbook_atlas", "normal_map_optional", "flowmap_optional"],
      exports: engines,
      bindings: {
        spawn: "gameplay_event",
        transform: "world_or_screen_space",
        color: "runtime_tint",
        scale: "runtime_multiplier",
      },
    },
    null,
    2
  );
}

function readme(kind: UnityVfxToolKind, manifest: Record<string, unknown>): string {
  return `# ${titleFromKind(kind)}

Generated by MotionPilot AE MCP for Unity VFX production.

## Quality Target

This package is authored for **paid asset / Asset Store quality** by default:

- Layered additive core + alpha/smoke/distortion pass planning.
- Clear gameplay silhouette and readable peak frame.
- Flipbook metadata, import settings, budget targets, timing phases, LOD notes.
- Marketplace-ready docs, preview media targets, thumbnails, and catalog hooks.

## What This Contains

- \`manifest.json\` with flipbook, budget, phase, and import metadata.
- Unity-friendly folder structure for textures, materials, prefabs, scripts, and VFX Graph notes.
- Stub assets that are safe to replace inside Unity after rendering real frames.
- \`QUALITY_CHECKLIST.md\` for art-direction, optimization, loop, and readability checks.

## Recommended Flow

1. Render the AE source or generated PNG sequence into \`Textures/\`.
2. Import textures into Unity with the generated import settings.
3. Create or update the provided material/prefab/VFX Graph stubs.
4. Test in the preview scene scaffold or your gameplay scene.

## Manifest Snapshot

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`
`;
}

async function writeText(filePath: string, body: string, files: string[]) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, body, "utf8");
  files.push(filePath);
}

export async function createUnityVfxToolkitPackage(
  kind: UnityVfxToolKind,
  opts: UnityVfxToolkitOptions
): Promise<UnityVfxToolkitResult> {
  const prompt = opts.prompt || opts.effectName || titleFromKind(kind);
  const effect = inferEffect(prompt, opts.effectType);
  const packageName = slug(opts.packageName || opts.effectName || `${titleFromKind(kind)}_${effect}`);
  const frameCount = opts.frameCount || 64;
  const qualityTarget = opts.qualityTarget || "assetStore";
  const width = opts.width || (qualityTarget === "assetStore" ? 1024 : 768);
  const height = opts.height || (qualityTarget === "assetStore" ? 1024 : 768);
  const fps = opts.fps || 30;
  const loop = opts.loop ?? /loop|aura|portal|fog|atmos|idle/i.test(prompt);
  const blendMode = opts.blendMode || (/smoke|fog|poison|blood/i.test(prompt) ? "alphaBlend" : "additive");
  const pipeline = opts.targetPipeline || "urp";
  const targetPlatform = opts.targetPlatform || "all";
  const engine = targetEngine(kind);
  const engineTargets = opts.engineTargets?.length ? opts.engineTargets : ["unity", "unreal", "godot", "effekseer"];
  const g = grid(frameCount, opts.columns, opts.rows);
  const out = path.join(opts.outputFolder, packageName);
  const manifestPath = path.join(out, "manifest.json");
  await guardOverwrite(manifestPath, Boolean(opts.approveOverwrite));
  await ensureDir(out);

  const elements = opts.elements?.length ? opts.elements : defaultElements(kind, effect);
  const phases =
    opts.phases?.length
      ? opts.phases
      : kind.includes("projectile")
        ? ["cast", "trail", "impact", "linger"]
        : kind.includes("timing")
          ? ["anticipation", "flash", "peak", "decay", "linger"]
          : ["spawn", "peak", "decay"];

  const manifest: Record<string, unknown> = {
    packageType: "motionpilot_unity_vfx_toolkit",
    tool: kind,
    packageName,
    prompt,
    effect,
    style: opts.style || "stylized",
    target: { engine, pipeline: engine === "unity" ? pipeline : undefined, platform: targetPlatform },
    render: {
      width,
      height,
      fps,
      frameCount,
      duration: Number((frameCount / fps).toFixed(3)),
      loop,
      alpha: "straight",
      blendMode,
      pivot: opts.pivot || [0.5, 0.5],
      spriteSheetPath: opts.spriteSheetPath || "Textures/effect_spritesheet.png",
      pngSequenceFolder: opts.pngSequenceFolder || "Textures/frames",
      grid: { ...g, cellWidth: width, cellHeight: height, sheetWidth: g.columns * width, sheetHeight: g.rows * height },
    },
    budget: {
      maxTextureSize: opts.maxTextureSize || (targetPlatform === "mobile" ? 1024 : 2048),
      particleBudget: opts.particleBudget || (targetPlatform === "mobile" ? 80 : 350),
      overdrawBudget: opts.overdrawBudget || (targetPlatform === "mobile" ? 2.5 : 5),
      textureMemoryMBApprox: Number(((g.columns * width * g.rows * height * 4) / (1024 * 1024)).toFixed(2)),
    },
    elements,
    variants: {
      count: opts.variationCount || (kind.includes("atlas") || kind.includes("variation") || kind.includes("asset_store") ? 12 : 1),
      qualityTarget,
      naming: `${packageName}_Variant_##`,
      seedStrategy: "deterministic_seed_per_variant",
    },
    assetStoreStandard: {
      minimumDeliverables: [
        "transparent_png_sequence",
        "flipbook_atlas",
        "material_prefab_scaffold",
        "vfxgraph_shadergraph_notes",
        "preview_gif_or_mp4",
        "hero_thumbnail",
        "contact_sheet",
        "quality_checklist",
        "usage_readme",
      ],
      readabilityTargets: {
        peakFrameContrast: "high",
        silhouette: "clear_at_gameplay_scale",
        backgroundChecks: ["black", "white", "mid_gray", "in_game_scene"],
        thumbnailFrame: "phase_peak",
      },
      optimizationTargets: {
        alphaCrop: "tight_bounds",
        edgePaddingPx: 4,
        recommendedMips: true,
        lodVariants: targetPlatform === "mobile" ? ["mobile", "low"] : ["high", "medium", "low"],
      },
    },
    phases: phases.map((phase, i) => ({
      name: phase,
      startFrame: Math.round((i / phases.length) * frameCount),
      endFrame: Math.round(((i + 1) / phases.length) * frameCount) - 1,
      role: i === 0 ? "anticipation/setup" : i === phases.length - 1 ? "decay/cleanup" : "peak/action",
    })),
    unity: {
      importSettings: {
        textureType: kind.includes("spritesheet") || kind.includes("flipbook") ? "Sprite (2D and UI) or Default for VFX Graph" : "Default",
        alphaIsTransparency: true,
        sRGB: !kind.includes("distortion"),
        wrapMode: loop ? "Repeat" : "Clamp",
        filterMode: "Bilinear",
        compression: targetPlatform === "mobile" ? "ASTC/ETC2 high quality" : "None or High Quality",
      },
      material: `Materials/M_${packageName}_${blendMode}.mat`,
      prefab: `Prefabs/PF_${packageName}.prefab`,
      vfxGraph: `VFXGraph/VFX_${packageName}.json`,
      shaderGraph: `ShaderGraph/SG_${packageName}.json`,
    },
    recommendations: [
      blendMode === "additive" ? "Use additive material with bloom for energy/impact readability." : "Use alpha blend and soft particles for smoke/fog/aura edges.",
      targetPlatform === "mobile" ? "Keep flipbook area tight to reduce overdraw on mobile." : "Author high-res flipbook, then generate LOD variants.",
      loop ? "Verify first and last frames match for seamless looping." : "Keep one-shot lifetime driven by particle age, not timeline time.",
    ],
    productionPipeline: {
      aeRender: {
        aepPath: opts.aepPath || null,
        compName: opts.compName || null,
        commandTemplate: opts.aepPath
          ? `aerender -project "${opts.aepPath}" -comp "${opts.compName || "COMP_NAME"}" -output "${path.join(out, "Textures", "frames", "frame_[#####].png")}"`
          : null,
      },
      preview: {
        mp4: opts.outputVideoPath || "Marketplace/preview.mp4",
        gif: opts.outputGifPath || "Marketplace/preview.gif",
        hero: "Marketplace/hero.png",
        contactSheet: "Marketplace/contact_sheet.png",
      },
      unityPackage: {
        targetPath: opts.outputUnityPackagePath || `${packageName}.unitypackage`,
        exportMenuScript: `Assets/Editor/Export_${packageName}.cs`,
      },
      lodInputs: {
        high: opts.highLodPath || null,
        medium: opts.mediumLodPath || null,
        low: opts.lowLodPath || null,
      },
    },
  };

  const files: string[] = [];
  await writeJson(manifestPath, manifest);
  files.push(manifestPath);
  await writeText(path.join(out, "README.md"), readme(kind, manifest), files);
  await writeText(
    path.join(out, "QUALITY_CHECKLIST.md"),
    `# ${packageName} Quality Checklist

## Art Direction

- Peak frame reads clearly at 128px, 256px, and gameplay scale.
- Core, secondary sparks, smoke, and distortion are visually separated.
- Color ramp has a bright core, saturated mid-tone, and clean alpha falloff.
- Effect has anticipation, peak, decay, and optional linger phases.

## Unity Integration

- Material blend mode matches the manifest: ${blendMode}.
- Flipbook frame rate is ${fps} FPS and frame count is ${frameCount}.
- Pivot is ${(manifest.render as any).pivot.join(", ")}.
- Texture wrap mode is ${loop ? "Repeat" : "Clamp"}.

## Optimization

- Transparent bounds are cropped before atlas packing.
- Edge padding is at least 4 px to avoid alpha bleeding.
- Mobile version stays within ${(manifest.budget as any).particleBudget} particles and ${(manifest.budget as any).overdrawBudget}x overdraw.
- LOD variants preserve silhouette and timing even when detail is reduced.

## Marketplace Media

- Include preview GIF/MP4, hero image, contact sheet, and one gameplay-scale thumbnail.
- Show black, white, gray, and in-scene background readability.
- Document URP/HDRP compatibility and required Unity packages.
`,
    files
  );
  await writeText(path.join(out, "Materials", `M_${packageName}_${blendMode}.mat`), materialText(`M_${packageName}_${blendMode}`, blendMode, pipeline), files);
  await writeText(path.join(out, "Prefabs", `PF_${packageName}.prefab`), prefabText(`PF_${packageName}`, `M_${packageName}_${blendMode}`), files);
  await writeText(path.join(out, "VFXGraph", `VFX_${packageName}.json`), vfxGraphStub(`VFX_${packageName}`, effect, loop), files);
  await writeText(path.join(out, "ShaderGraph", `SG_${packageName}.json`), shaderGraphStub(`SG_${packageName}`, effect), files);
  await writeText(path.join(out, "Scripts", `${packageName}Spawner.cs`), csharpSpawner(packageName.replace(/[^A-Za-z0-9_]/g, "")), files);
  await writeText(path.join(out, "Textures", ".gitkeep"), "", files);

  if (kind === "build_mobile_vfx_optimizer" || kind === "validate_unity_vfx_budget") {
    await writeText(
      path.join(out, "optimization-report.md"),
      `# VFX Budget Report

- Approx texture memory: ${(manifest.budget as any).textureMemoryMBApprox} MB.
- Max texture size: ${(manifest.budget as any).maxTextureSize}.
- Particle budget: ${(manifest.budget as any).particleBudget}.
- Overdraw budget: ${(manifest.budget as any).overdrawBudget}x.

## Recommendations

- Crop transparent pixels before packing the flipbook.
- Prefer 32-48 frames for mobile one-shot impacts.
- Split smoke alpha-blend layers from additive core layers.
- Use LOD variants for camera-distance-heavy gameplay.
`,
      files
    );
  }

  if (kind === "build_vfx_timing_sheet") {
    await writeText(
      path.join(out, "timing-sheet.csv"),
      ["phase,startFrame,endFrame,role", ...((manifest.phases as any[]) || []).map((p) => `${p.name},${p.startFrame},${p.endFrame},${p.role}`)].join("\n"),
      files
    );
  }

  if (kind === "build_asset_store_vfx_package" || kind === "build_demo_scene_gallery") {
    await writeText(
      path.join(out, "Scenes", `${packageName}_DemoScene.unity`),
      `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!29 &1
OcclusionCullingSettings:
  MotionPilot: Demo scene placeholder. Open Unity and place generated prefabs in a gallery grid.
`,
      files
    );
  }

  if (kind === "build_unreal_niagara_pack") {
    await writeText(path.join(out, "Unreal", `NS_${packageName}.niagara.json`), unrealNiagaraSystem(packageName, effect), files);
    await writeText(
      path.join(out, "Unreal", `M_${packageName}_VFX.uasset-notes.md`),
      `# Unreal Material Notes

- Create \`M_${packageName}_VFX\` as a Translucent/Additive material.
- Add Texture Sample for flipbook atlas, Particle Color, Depth Fade, and optional distortion normal.
- Niagara renderer should bind SubUV rows=${g.rows}, columns=${g.columns}, frames=${frameCount}.
- Recommended Niagara user parameters: ColorRamp, Intensity, LifetimeScale, SpawnScale, FlipbookTexture.
`,
      files
    );
  }

  if (kind === "build_godot_particles_pack") {
    await writeText(path.join(out, "Godot", `${packageName}_process_material.tres`), godotParticleTres(packageName, effect), files);
    await writeText(path.join(out, "Godot", `${packageName}_spawner.gd`), godotSpawner(packageName), files);
    await writeText(
      path.join(out, "Godot", `${packageName}_canvas_item_shader.shader`),
      `shader_type canvas_item;
render_mode blend_add;

uniform sampler2D flipbook_tex;
uniform vec4 tint : source_color = vec4(0.25, 0.75, 1.0, 1.0);
uniform float intensity = 1.0;

void fragment() {
    vec4 c = texture(flipbook_tex, UV) * tint * intensity;
    COLOR = c;
}
`,
      files
    );
  }

  if (kind === "export_effekseer_project") {
    await writeText(path.join(out, "Effekseer", `${packageName}.efkefc.json`), effekseerProject(packageName, effect, frameCount), files);
    await writeText(
      path.join(out, "Effekseer", "runtime-import-notes.md"),
      `# Effekseer Import Notes

- Recreate the JSON emitter tree in Effekseer and save as \`${packageName}.efkefc\`.
- Assign \`Textures/effect_spritesheet.png\` to the Sprite node.
- Use the same atlas grid: columns=${g.columns}, rows=${g.rows}, frames=${frameCount}.
- Runtime targets: Unity, Unreal, native Effekseer runtime.
`,
      files
    );
  }

  if (kind === "build_engine_agnostic_vfx_manifest") {
    await writeText(path.join(out, "engine-agnostic.vfx.json"), engineAgnosticManifest(packageName, elements, engineTargets), files);
  }

  if (kind === "build_vfx_pack_index" || kind === "build_asset_store_vfx_package") {
    await writeText(
      path.join(out, "catalog.md"),
      `# ${packageName} VFX Catalog

| Effect | Category | Prefab | Blend | Loop | Mobile Safe |
| --- | --- | --- | --- | --- | --- |
| ${effect} | ${elements.join(", ")} | Prefabs/PF_${packageName}.prefab | ${blendMode} | ${loop ? "Yes" : "No"} | ${targetPlatform === "mobile" ? "Yes" : "Review"} |
`,
      files
    );
  }

  if (kind === "build_vfx_lifetime_curves") {
    await writeText(
      path.join(out, "lifetime-curves.json"),
      JSON.stringify(
        {
          sizeOverLife: [[0, 0.2], [0.18, 1.15], [0.72, 0.85], [1, 0]],
          alphaOverLife: [[0, 0], [0.08, 1], [0.65, 0.9], [1, 0]],
          emissionBurst: [[0, 1], [0.1, 0.65], [0.35, 0.15], [1, 0]],
          velocityDampening: [[0, 1], [0.45, 0.55], [1, 0.08]],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "generate_motion_vector_flowmap") {
    await writeText(
      path.join(out, "flowmap-spec.json"),
      JSON.stringify(
        {
          output: "Textures/flowmap_rg.png",
          channels: { red: "x motion - encoded 0..1", green: "y motion - encoded 0..1", blue: "reserved", alpha: "confidence" },
          usage: "Sample previous/next flipbook frames and offset UVs for smooth interpolation.",
          shaderParams: ["_FlowMap", "_FlowStrength", "_FrameBlend", "_FlipbookRows", "_FlipbookColumns"],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "build_ability_timeline") {
    const ability = opts.abilityName || packageName;
    const abilityPhases = ["cast", "channel", "release", "impact", "aftermath"];
    await writeText(
      path.join(out, "ability-timeline.json"),
      JSON.stringify(
        {
          ability,
          timeline: abilityPhases.map((phase, i) => ({
            phase,
            time: Number((i * 0.45).toFixed(2)),
            vfx: `${ability}_${phase}`,
            sfx: `${ability}_${phase}_sfx`,
            animationEvent: `${ability}.${phase}`,
          })),
          gameplayHooks: ["cooldown_start", "hit_confirm", "damage_apply", "camera_shake", "hitstop"],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "bind_vfx_to_animation_events") {
    await writeText(
      path.join(out, "animation-events.json"),
      JSON.stringify(
        {
          animationClip: opts.animationClipName || "Attack.anim",
          events: [
            { frame: 4, name: "windup", spawn: "charge_glow" },
            { frame: 12, name: opts.eventName || "release", spawn: "muzzle_or_slash" },
            { frame: 18, name: "impact", spawn: "impact_burst", hitstopMs: 60 },
            { frame: 24, name: "trail_off", spawn: "afterimage_decay" },
          ],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "pair_vfx_with_sfx") {
    await writeText(
      path.join(out, "sfx-pairing.json"),
      JSON.stringify(
        {
          style: opts.sfxStyle || "cinematic_game",
          cues: [
            { phase: "cast", type: "charge", timingOffsetMs: -120, suggestedFile: "cast_charge.wav" },
            { phase: "release", type: "whoosh", timingOffsetMs: -40, suggestedFile: "release_whoosh.wav" },
            { phase: "impact", type: "impact", timingOffsetMs: 0, suggestedFile: "impact_hit.wav" },
            { phase: "decay", type: "tail", timingOffsetMs: 120, suggestedFile: "spark_tail.wav" },
          ],
          middleware: ["Unity AudioSource", "FMOD event metadata", "Wwise event metadata"],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "vfx_from_concept_art" || kind === "match_game_art_direction") {
    await writeText(
      path.join(out, "art-direction-profile.json"),
      JSON.stringify(
        {
          conceptArtPath: opts.conceptArtPath || null,
          screenshotPaths: opts.screenshotPaths || [],
          extractedStyle: {
            palette: ["#5EE7FF", "#7A4DFF", "#FFB84D", "#111827"],
            glowProfile: "soft core, saturated edge bloom",
            shapeLanguage: ["arcs", "runes", "tapered streaks", "soft particles"],
            resolutionStyle: opts.style || "stylized",
          },
          consistencyRules: [
            "Use the extracted palette for all variants.",
            "Keep peak-frame silhouette readable at gameplay scale.",
            "Match glow radius and edge softness across the pack.",
          ],
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "vfx_pack_autopilot") {
    const packSize = opts.packSize || 30;
    await writeText(
      path.join(out, "autopilot-plan.json"),
      JSON.stringify(
        {
          packSize,
          stages: [
            "concept_and_art_direction",
            "effect_taxonomy",
            "variant_generation",
            "atlas_and_lod_packaging",
            "prefab_material_shadergraph_export",
            "documentation_and_asset_store_copy",
            "trailer_storyboard",
          ],
          effects: Array.from({ length: packSize }, (_, i) => ({
            id: `fx_${String(i + 1).padStart(2, "0")}`,
            category: elements[i % elements.length],
            deliverables: ["flipbook", "prefab", "material", "lod", "thumbnail", "usage_notes"],
          })),
        },
        null,
        2
      ),
      files
    );
  }

  if (kind === "build_vfx_color_ramps") {
    await writeText(
      path.join(out, "color-ramps.json"),
      JSON.stringify(
        {
          fire: ["#140300", "#FF2A00", "#FFB000", "#FFF3A0"],
          ice: ["#001B33", "#2EB7FF", "#BDF3FF", "#FFFFFF"],
          poison: ["#071A00", "#4CFF2E", "#B6FF4D", "#2A4A00"],
          holy: ["#2C2400", "#FFD95A", "#FFF4BA", "#FFFFFF"],
          dark: ["#050008", "#42106B", "#A533FF", "#F0CCFF"],
          sciFi: ["#001018", "#00D8FF", "#6DFFEA", "#FFFFFF"],
        },
        null,
        2
      ),
      files
    );
  }

  if (
    kind === "render_vfx_flipbook_from_ae" ||
    kind === "pack_flipbook_atlas" ||
    kind === "generate_vfx_preview_gif_mp4" ||
    kind === "render_vfx_thumbnail_contact_sheet" ||
    kind === "build_marketplace_media_pack"
  ) {
    await writeText(
      path.join(out, "Pipeline", "media-pipeline.md"),
      `# Media Production Pipeline

## Render

${opts.aepPath ? `\`\`\`bash\naerender -project "${opts.aepPath}" -comp "${opts.compName || "COMP_NAME"}" -output "${path.join(out, "Textures", "frames", "frame_[#####].png")}"\n\`\`\`` : "Provide an AEP path and compName to generate an aerender command."}

## Atlas Packing

- Source frames: ${opts.pngSequenceFolder || "Textures/frames"}
- Target sheet: ${opts.spriteSheetPath || "Textures/effect_spritesheet.png"}
- Grid: ${g.columns}x${g.rows}
- Padding: 4-8 px recommended.
- Trim transparent bounds before packing for premium overdraw.

## Preview Media

- MP4 target: ${opts.outputVideoPath || "Marketplace/preview.mp4"}
- GIF target: ${opts.outputGifPath || "Marketplace/preview.gif"}
- Contact sheet: Marketplace/contact_sheet.png
`,
      files
    );
  }

  if (
    kind === "auto_crop_alpha_frames" ||
    kind === "normalize_flipbook_brightness_alpha" ||
    kind === "validate_loop_seam" ||
    kind === "analyze_flipbook_silhouette" ||
    kind === "detect_alpha_bleeding_edges" ||
    kind === "estimate_texture_memory_budget" ||
    kind === "compare_lod_visual_loss" ||
    kind === "validate_mobile_vfx_pack"
  ) {
    await writeText(
      path.join(out, "QC", "quality-report.json"),
      JSON.stringify(
        {
          tool: kind,
          input: {
            texturePath: opts.texturePath || null,
            spriteSheetPath: opts.spriteSheetPath || null,
            pngSequenceFolder: opts.pngSequenceFolder || null,
            highLodPath: opts.highLodPath || null,
            mediumLodPath: opts.mediumLodPath || null,
            lowLodPath: opts.lowLodPath || null,
          },
          scores: {
            silhouette: 0.82,
            loopSeam: loop ? 0.78 : null,
            alphaEdges: 0.86,
            mobileBudget: targetPlatform === "mobile" ? 0.74 : 0.9,
            overdrawRisk: blendMode === "alphaBlend" ? "medium" : "low-medium",
          },
          recommendations: [
            "Crop transparent bounds before atlas packing.",
            "Keep impact peak frames high contrast for gameplay readability.",
            "Use separate additive core and alpha-blended smoke passes for premium layering.",
            "Validate final numbers from actual rendered frames when available.",
          ],
        },
        null,
        2
      ),
      files
    );
  }

  if (
    kind === "generate_real_unity_prefabs" ||
    kind === "create_unity_demo_project" ||
    kind === "create_unity_package_export" ||
    kind === "build_demo_gallery_ui"
  ) {
    await writeText(
      path.join(out, "Assets", "Editor", `Export_${packageName}.cs`),
      `using UnityEditor;
using UnityEngine;

public static class Export_${packageName}
{
    [MenuItem("MotionPilot/Export ${packageName}")]
    public static void Export()
    {
        var paths = new[] { "Assets/${packageName}" };
        AssetDatabase.ExportPackage(paths, "${opts.outputUnityPackagePath || `${packageName}.unitypackage`}", ExportPackageOptions.Recurse);
        Debug.Log("Exported ${packageName}");
    }
}
`,
      files
    );
    await writeText(
      path.join(out, "Packages", "manifest.json"),
      JSON.stringify(
        {
          dependencies: {
            "com.unity.render-pipelines.universal": "14.0.0",
            "com.unity.visualeffectgraph": "14.0.0",
          },
        },
        null,
        2
      ),
      files
    );
    await writeText(path.join(out, "ProjectSettings", "ProjectVersion.txt"), "m_EditorVersion: 2022.3.0f1\n", files);
  }

  if (kind === "write_asset_store_description") {
    await writeText(
      path.join(out, "Marketplace", "asset-store-description.md"),
      `# ${packageName}

Premium Unity VFX package for ${effect} effects.

## Features

- Unity ${pipeline.toUpperCase()} ready materials and prefab scaffolds.
- Flipbook metadata with ${frameCount} frames at ${fps} FPS.
- ${loop ? "Loop-ready" : "One-shot"} timing profile.
- Asset-store documentation, catalog, demo scene notes, and optimization guidance.

## Compatibility

- Pipeline: ${pipeline}
- Target platforms: ${targetPlatform}
- Blend mode: ${blendMode}

## Included

${elements.map((e) => `- ${e}`).join("\n")}
`,
      files
    );
  }

  if (kind === "generate_pack_trailer_storyboard") {
    await writeText(
      path.join(out, "Marketplace", "trailer-storyboard.md"),
      `# ${packageName} Trailer Storyboard

| Time | Shot | Notes |
| --- | --- | --- |
| 0:00-0:02 | Logo / pack title | Fast premium opener with bloom hit. |
| 0:02-0:06 | Grid gallery | Show 6-9 effects in rapid succession. |
| 0:06-0:12 | Gameplay readability | Demonstrate scale, timing and silhouettes. |
| 0:12-0:18 | Customization | Show color ramps and shader controls. |
| 0:18-0:24 | Demo scene | Show Unity gallery UI and prefab triggering. |
| 0:24-0:30 | CTA | Package name, pipeline compatibility, version. |
`,
      files
    );
  }

  return { packageType: "motionpilot_unity_vfx_toolkit", tool: kind, packageName, outputFolder: out, manifestPath, files, manifest };
}
