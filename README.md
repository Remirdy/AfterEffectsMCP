# motionpilot-ae-mcp

<p align="center">
  <img src="https://raw.githubusercontent.com/Remirdy/AfterEffectsMCP/main/assets/before-after.gif" alt="MotionPilot AE MCP before and after" width="760">
</p>

A **local MCP server** for analyzing **PSD** files and building animated
**Adobe After Effects** projects, with saved `.aep` output and optional
`.mp4`/`.mov` previews.

The intended workflow: provide a PSD and a motion direction like *"Build a
premium After Effects animation where the title fades in, the mockup slides with
depth, UI cards stagger in, and the background has subtle parallax."* The server
then runs the tools below.

---

## How it works

```
PSD ──▶ analyze_psd_visuals ──▶ analysis.json + preview.png + thumbnails/
                                    │
               inspect preview + structure
                                    │
        create_motion_plan_from_analysis ──▶ motion-plan.json
                                    │
         import_psd_to_after_effects ──▶ project.aep  (PSD as comp, retained layer sizes)
                                    │
       animate_after_effects_project ──▶ project_animated.aep  (keyframes + easing)
                                    │
                  render_preview ──▶ preview.mp4   (optional)
```

PSD parsing/preview/thumbnails happen in Node (`ag-psd` + `sharp`) — no
Photoshop required. After Effects is driven via generated **ExtendScript (JSX)**
run by the AE binary (`aerender` for headless rendering when available).

---

## MCP tools

| Tool | Purpose |
| --- | --- |
| `analyze_psd_visuals` | Flattened preview + per-layer thumbnails; extract name/order/bounds/opacity/visibility/type; detect naming patterns (`BG_`, `Text_`, `Title_`, `Subtitle_`, `Phone_`, `Mockup_`, `Card_`, `Button_`, `Icon_`, `Logo_`, `Particle_`, `Character_`, `LOCKED`); suggest a role + animation per layer; return structured JSON + image paths. |
| `create_motion_plan_from_analysis` | Turn the analysis + motion direction into a structured, hierarchy-aware motion plan. Never changes text; locked/text layers animate via transform/mask/range-selector only. |
| `import_psd_to_after_effects` | Open AE, import the PSD as a composition retaining layer sizes, set duration/FPS, save a new `.aep`. |
| `animate_after_effects_project` | Apply the motion plan as keyframes + easing (position, scale, opacity, rotation, blur, masks, parallax, stagger, light sweep) and save a new animated `.aep`. |
| `render_preview` | Render a comp to `.mp4`/`.mov` via `aerender` (or the AE render queue) and return logs + path. |
| `check_after_effects_setup` | Validate local `AE_BINARY` / `AERENDER_BINARY` resolution without launching After Effects. Good first smoke test after install. |
| `execute_after_effects_actions` | General AE control: create/list compositions, read project info, create text/shape/solid/adjustment/camera/null layers, edit layer properties/timing, toggle 2D/3D, set blend modes and track mattes, duplicate/delete layers, create masks, set keyframes, apply expressions, and batch-set properties. |

### Direction-driven professional motion

`create_motion_plan_from_analysis` reads the animation direction and detects
cues like:

- `cinematic`, `camera`, `trailer` -> subtle AE camera push
- `depth`, `parallax`, `3D` -> stronger layered parallax/depth drift
- `kinetic typography`, `headline`, `type` -> text-safe range reveals
- `glow`, `shine`, `light sweep`, `neon` -> glow and sweep accents
- `app`, `SaaS`, `dashboard`, `UI`, `product promo` -> staggered product/UI hierarchy
- `Reels`, `TikTok`, `Shorts`, `fast`, `energetic` -> tighter, faster timing
- `minimal`, `clean`, `subtle` -> restrained density
- `Behance`, `portfolio`, `commercial`, `advert`, `launch` -> richer professional polish

The generated motion plan includes a `promptProfile` with inferred `tempo`,
`density`, `direction`, and `professionalTouches`.

Additional animation types available to generated plans:
`blurFade`, `overshootPop`, `rotateIn`, `depthDrift`, `scalePulse`,
`ambientGlow`, and `cameraPush`.

### General AE actions

`execute_after_effects_actions` runs a batch of actions against either a new
project or an existing `.aep`. Mutating actions require `outputAepPath`; the
source project is opened and a new copy is saved.

Example:

```json
{
  "outputAepPath": "/tmp/motionpilot-demo.aep",
  "actions": [
    {
      "type": "createComposition",
      "name": "Main",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "duration": 8,
      "backgroundColor": [0.02, 0.02, 0.025]
    },
    {
      "type": "createTextLayer",
      "compName": "Main",
      "name": "Title",
      "text": "MotionPilot",
      "fontSize": 96,
      "color": [1, 1, 1],
      "position": [960, 420]
    },
    {
      "type": "createShapeLayer",
      "compName": "Main",
      "name": "Accent Star",
      "shapeType": "star",
      "points": 5,
      "outerRadius": 80,
      "innerRadius": 36,
      "fillColor": [0.2, 0.75, 1],
      "position": [960, 560]
    },
    {
      "type": "setKeyframes",
      "compName": "Main",
      "layerName": "Title",
      "property": "opacity",
      "keyframes": [
        { "time": 0, "value": 0 },
        { "time": 1, "value": 100 }
      ],
      "ease": "expoOut"
    }
  ]
}
```

Inspection-only calls can omit `outputAepPath`:

```json
{
  "aepPath": "/tmp/motionpilot-demo.aep",
  "actions": [{ "type": "getProjectInfo" }, { "type": "listCompositions" }]
}
```

### JSX helper library

Generated scripts include these ExtendScript helpers (`src/ae/jsxHelpers.ts`):
`findLayersByPattern`, `setEase`, `addPositionAnimation`, `addScaleAnimation`,
`addOpacityAnimation`, `addRotationAnimation`, `addBlurAnimation`,
`addMaskReveal`, `addTextRangeReveal`, `addParallax`, `addStaggeredReveal`,
`addLightSweep`, `protectTextLayer`, `saveProject`.

---

## Safety rules (enforced)

- **Never modifies the source PSD** — it is opened read-only.
- **Never overwrites files** unless you pass `approveOverwrite: true`.
- **Never deletes files.**
- **Always saves a new AEP** rather than editing in place.
- **Preserves text content** — when `preserveTextContent` is true, `sourceText`
  is never touched; text layers animate only via transform/mask/range selector.
- Returns clear logs after every operation and a clear error if After Effects
  cannot be found.

---

## Requirements

- **Node.js ≥ 18**
- **Adobe After Effects** (2023 or newer) installed locally, for the AE-driven
  tools. The analysis + motion-plan tools work without AE.
- macOS or Windows.

---

## Install & build

```bash
cd motionpilot-ae-mcp
npm install
npm run build        # compiles TypeScript to dist/
npm run ci           # typecheck + build, same checks used by GitHub Actions
```

If `sharp` fails to install on your platform, see https://sharp.pixelplumbing.com/install.

### Point the server at After Effects

The server auto-detects common install paths. If yours differs, set env vars:

```bash
# macOS
export AE_BINARY="/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app"
export AERENDER_BINARY="/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app/Contents/aerender"

# Windows (PowerShell)
$env:AE_BINARY="C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.exe"
$env:AERENDER_BINARY="C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\aerender.exe"
```

> In After Effects, enable **Preferences → Scripting & Expressions → Allow
> Scripts to Write Files and Access Network** so generated JSX can save projects.

---

## MCP host configuration

Add this server to an MCP host config. A ready
example is in [`claude_desktop_config.example.json`](./claude_desktop_config.example.json):

```json
{
  "mcpServers": {
    "motionpilot-ae": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/motionpilot-ae-mcp/dist/index.js"],
      "env": {
        "AE_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app"
      }
    }
  }
}
```

Restart the host application; the tools appear automatically.

Run `check_after_effects_setup` first. It should return the resolved After
Effects app path and `aerender` path before you run import/animate/render tools.

---

## Example outputs & motion directions

- [`examples/analysis.example.json`](./examples/analysis.example.json)
- [`examples/motion-plan.example.json`](./examples/motion-plan.example.json)
- [`examples/prompts.md`](./examples/prompts.md) — full end-to-end direction and the
  exact tool-call sequence.

---

## Naming conventions in your PSD (recommended)

Prefix layers so role detection is exact (otherwise heuristics are used):

```
BG_*        background (parallax)
Title_*     / Text_Title_*    title
Subtitle_*  / Text_Subtitle_* subtitle
Text_*      generic text
Phone_*     phone mockup       Mockup_*  main mockup
Card_*      UI card (staggered) Button_* button (bounce)
Icon_*      icon (float)        Logo_*   logo (soft reveal)
Particle_*  / decorative        Character_* character
*LOCKED*    protect text — transform-only animation
```

---

## Project layout

```
src/
  index.ts              MCP server, registers all tools
  schemas.ts            Zod input schemas
  types.ts              Shared domain types
  util.ts               Logging, fs guards, overwrite protection
  psd/
    roles.ts            Naming-pattern + role + animation detection
    analyzer.ts         PSD read, preview/thumbnail export, report
  motion/
    planner.ts          Hierarchy-aware motion plan builder
  ae/
    jsxHelpers.ts       Embedded ExtendScript helper library
    jsxGenerator.ts     Import / animate / render JSX generators
    runner.ts           Resolves & runs AE / aerender, parses results
examples/               Example JSON + prompts
claude_desktop_config.example.json
```

## License

MIT
