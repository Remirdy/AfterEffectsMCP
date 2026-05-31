# Example motion directions

## Full end-to-end direction

> Analyze this PSD first. Look at the design, layer structure, text, mockups,
> background, icons, and visual hierarchy. Then create a professional After
> Effects animation where the title comes in smoothly, mockups slide with depth,
> UI cards appear one by one, background has subtle parallax, and the project is
> saved as an AEP file. Render an MP4 preview if possible.
>
> Rules: Do not rewrite, regenerate, translate, or change any text. Text layers
> must stay readable and sharp and may only animate via position, opacity, scale,
> mask reveal, or text animator range selector. Keep it elegant, premium, and
> Behance-ready. Avoid excessive effects. Use smooth easing and clean timing.
> Create a 10-second 9:16 composition at 1080x1920 at 30 FPS.

## Tool-call sequence

1. `analyze_psd_visuals`
   ```json
   {
     "psdPath": "/Users/me/designs/app_promo.psd",
     "outputAnalysisFolder": "/Users/me/designs/app_promo_analysis",
     "includeLayerThumbnails": true,
     "includeFlattenedPreview": true,
     "includeTextLayerInfo": true
   }
   ```

## Professional direction variants

Use directions like these in `create_motion_plan_from_analysis.userPrompt`:

```text
Cinematic premium app launch animation. Add subtle camera push, layered depth,
soft parallax, elegant text reveal, light sweep on the hero mockup, and
Behance-ready timing. Keep text unchanged and readable.
```

```text
Fast social ad for Reels/TikTok. Snappy product reveal, energetic staggered UI
cards, bold headline animation, punchy button pop, clean loop-ready ambient
motion. No text rewriting.
```

```text
Minimal luxury portfolio motion. Slow elegant fades, restrained parallax, no
excessive effects, subtle glow only on the logo, refined commercial timing.
```

   → returns `analysisJsonPath` + preview/thumbnail paths for visual inspection.

2. `create_motion_plan_from_analysis`
   ```json
   {
     "analysisJsonPath": "/Users/me/designs/app_promo_analysis/analysis.json",
     "userPrompt": "premium Behance-ready promo, title first, mockup with depth, staggered cards, subtle bg parallax",
     "duration": 10,
     "fps": 30,
     "style": "premium"
   }
   ```

   → returns `motionPlanJsonPath`.

3. `import_psd_to_after_effects`
   ```json
   {
     "psdPath": "/Users/me/designs/app_promo.psd",
     "outputAepPath": "/Users/me/designs/app_promo.aep",
     "width": 1080,
     "height": 1920,
     "duration": 10,
     "fps": 30,
     "importMode": "composition_retained_layer_sizes",
     "approveOverwrite": true
   }
   ```

4. `animate_after_effects_project`
   ```json
   {
     "aepPath": "/Users/me/designs/app_promo.aep",
     "motionPlanJsonPath": "/Users/me/designs/app_promo_analysis/motion-plan.json",
     "outputAepPath": "/Users/me/designs/app_promo_animated.aep",
     "preserveTextContent": true,
     "approveOverwrite": true
   }
   ```

5. `render_preview`
   ```json
   {
     "aepPath": "/Users/me/designs/app_promo_animated.aep",
     "compName": "MotionPilot_Main",
     "outputVideoPath": "/Users/me/designs/app_promo_preview.mp4",
     "format": "mp4",
     "approveOverwrite": true
   }
   ```

## Prompt-to-game VFX

Create a standalone game VFX element from a natural-language prompt:

```json
{
  "prompt": "devasa mor portal açılışı, lightning arcs, shockwave, horizontal",
  "outputAepPath": "/Users/me/vfx/purple_portal.aep",
  "outputPlanJsonPath": "/Users/me/vfx/purple_portal_plan.json",
  "duration": 5,
  "fps": 30,
  "approveOverwrite": true
}
```

Apply prompt-generated VFX to an existing comp:

```json
{
  "prompt": "mavi elektrikli kalkan darbesi, küçük kıvılcımlar",
  "aepPath": "/Users/me/game_scene/game_scene.aep",
  "outputAepPath": "/Users/me/game_scene/game_scene_vfx.aep",
  "compName": "Main",
  "targetLayer": "Hero_",
  "position": [960, 540],
  "approveOverwrite": true
}
```

## Unity / Unreal VFX package

Create a Unity-ready package when the user asks for VFX Graph, URP/HDRP,
sprite sheets or flipbooks:

```json
{
  "prompt": "looping cyan shield impact for Unity VFX Graph, additive flipbook",
  "outputFolder": "/Users/me/vfx/cyan_shield_unity",
  "engine": "auto",
  "exportKind": "both",
  "frameWidth": 1024,
  "frameHeight": 1024,
  "duration": 2,
  "fps": 30,
  "loop": true,
  "blendMode": "additive",
  "approveOverwrite": true
}
```

Create an Unreal/Niagara package with optional C4D/Cineware support when the
user explicitly asks for it:

```json
{
  "prompt": "Unreal Niagara lava portal, use Cinema 4D geometry if available, AE glow compositing",
  "outputFolder": "/Users/me/vfx/lava_portal_unreal",
  "engine": "unreal",
  "exportKind": "pngSequence",
  "c4dMode": "use",
  "c4dScenePath": "/Users/me/scenes/lava_portal.c4d",
  "duration": 2.5,
  "fps": 30,
  "approveOverwrite": true
}
```
