# ECHOES BELOW Modernization Roadmap

Date: 2026-07-29  
Scope: Incremental evolution from a finished Canvas 2D browser survival-horror game into a cinematic, browser-deployable 3D survival-horror experience while preserving current saves, story, puzzles, endings, inventory, and progression.

A pre-change source backup was created at:

`/home/Januar/JanFlow/_backups/echoes-below-pre-3d-20260729-154427.tar.gz`

## 1. Current Architecture Review

### 1.1 Project shape

The project is a static Vite/React/TypeScript application deployed under GitHub Pages using `base: '/echoes-below/'` in `vite.config.ts`.

Primary files:

- `src/App.tsx` — screen routing and game lifecycle.
- `src/game/GameView.tsx` — canvas mount point and engine startup.
- `src/game/GameEngine.ts` — main loop, movement, collision, combat, enemy AI, interactions, puzzle resolution, save serialization.
- `src/game/systems/Renderer.ts` — legacy Canvas 2D renderer.
- `src/game/systems/GameRenderer3D.ts` — new Three.js 3D renderer introduced as the first migration milestone.
- `src/game/state/gameStore.ts` — Zustand store for player state, flags, screen routing, documents, objectives, effects, settings.
- `src/game/state/inventoryStore.ts` — grid inventory, item templates, equipment, stacking, combining, storage.
- `src/game/saves/SaveManager.ts` — localStorage save/load/export/import.
- `src/game/config/rooms.ts` — data-driven room tile maps and doors.
- `src/game/config/enemies.ts` — enemy templates and placements.
- `src/game/config/documents.ts` — documents and pickups.

### 1.2 Existing strengths

1. **Playable complete core loop**
   - Exploration, doors, locked progression, puzzles, enemy encounters, combat, documents, endings, inventory, save/load are already wired.

2. **Good preservation layer for migration**
   - The gameplay logic is mostly renderer-agnostic at the `RenderState` boundary in `GameEngine.render()`.
   - This makes a 3D renderer possible without rewriting progression or saves.

3. **Data-driven rooms and enemies**
   - Rooms are declared in `rooms.ts` as tile arrays plus doors.
   - Enemy templates and placements are separate from rendering.
   - These definitions can be converted into 3D modular geometry and future nav meshes.

4. **Save compatibility foundation**
   - Save schema is versioned in `SaveManager.ts`.
   - Current save format stores logical game state, not renderer state, which is ideal for 2D-to-3D migration.

5. **Browser-safe deployment model**
   - No backend, no secrets, no server runtime.
   - GitHub Pages deployment remains simple.

6. **Original IP and procedural content**
   - Current game does not depend on copyrighted commercial assets.
   - The 3D migration can continue using procedural geometry and CC0 assets only.

### 1.3 Current technical debt and limitations

1. **GameEngine is too large**
   - `GameEngine.ts` owns movement, collision, combat, AI, interactions, puzzles, room transitions, save serialization, and rendering orchestration.
   - This is manageable for the current scope but will become a bottleneck for animation, nav mesh, physics, and advanced AI.

2. **Tile collision is simple and 2D-only**
   - Player collision uses a circular footprint against tile boundaries.
   - There is no slope, step, capsule, obstacle height, or physics integration yet.

3. **Enemy AI is direct-line movement**
   - The state machine is valuable and should be preserved.
   - However, movement uses direct steering to a target tile/world coordinate, so enemies can fail around corners and obstacles.

4. **Combat is hitscan only**
   - Current weapons raycast against enemy centers by point-to-line distance.
   - No physical projectile, bullet-wall impact, ricochet, decals, shell ejection, weapon sway, or animation timing yet.

5. **Puzzles resolve instantly**
   - Puzzle logic is present, but presentation is mostly subtitle/flag based.
   - The puzzle layer needs interactive in-world 3D props while preserving current flags.

6. **Inventory UI is functional but flat**
   - Grid inventory, combining, storage, and equipment are strong.
   - It lacks drag-and-drop polish, animated inspection, and 3D item previews.

7. **Audio is procedural but not spatial**
   - Web Audio synthesis exists but is not integrated as true positional audio with room reverb/occlusion.

8. **No automated tests yet**
   - `npm run test` currently exits with “No test files found”.
   - Before deeper migration, save, inventory, room progression, and AI tests should be added.

9. **Bundle growth risk**
   - The first Three.js milestone increases the production JS bundle from about 150 KB gzip to about 296 KB gzip.
   - This is still acceptable for a browser game, but future effects/assets require code splitting and quality controls.

## 2. Rendering Pipeline Decision

### Selected approach

Use **Three.js directly** for the engine renderer.

Reasoning:

- The current gameplay loop is a custom imperative engine, not a React scene graph.
- Direct Three.js integrates cleanly with the existing `GameEngine.render(RenderState)` boundary.
- React Three Fiber is excellent for React-owned 3D scenes, but it would force a larger architectural rewrite and increase regression risk.
- Three.js keeps the current App/GameView/GameEngine lifecycle intact.

### Current first-milestone pipeline

Implemented in `src/game/systems/GameRenderer3D.ts`:

- WebGL renderer on the existing canvas.
- ACES filmic tone mapping.
- sRGB output color space.
- Exponential fog.
- PBR `MeshStandardMaterial` materials for floor, wall, metal, water, organic growth, debris, player, enemies, and interactables.
- Instanced geometry for room tiles to control draw calls.
- Procedural modular 3D room construction from existing `rooms.ts` tile maps.
- Over-the-shoulder perspective camera.
- Dynamic player flashlight using `SpotLight`.
- Dynamic muzzle flash light.
- Flickering emergency point lights.
- Soft shadows via PCF shadow maps.
- SSAO and bloom post-processing on medium/high quality.
- Low-quality fallback path that renders without post-processing.
- Automatic fallback to legacy Canvas 2D renderer if WebGL/Three initialization fails.

### Rendering features still planned

- Decals with proper projection onto walls/floors.
- Texture atlases and procedural normal maps.
- Reflection probes or low-cost environment maps.
- Volumetric light cones and fog shafts.
- GPU particle batches for smoke, spores, steam, sparks.
- Depth of field and stronger color grading as optional quality-tier effects.
- Asset streaming/code splitting for 3D-only chunks.

## 3. Migration Strategy

### Principle

Do not rewrite the whole game at once. Keep the current story/progression/saves as the authoritative gameplay layer and replace presentation/simulation systems behind stable interfaces.

### Stage 0 — Baseline and backup

Status: completed.

- Verified baseline `npm run build` passed before changes.
- Created tar backup before code changes.
- Identified no automated tests exist yet.

### Stage 1 — True 3D rendering shell

Status: completed as first implementation milestone.

Files changed/created:

- `package.json`
- `package-lock.json`
- `src/game/GameEngine.ts`
- `src/game/systems/GameRenderer3D.ts`
- `docs/MODERNIZATION_ROADMAP.md`

Outcome:

- The current game loop now renders through Three.js by default.
- The legacy Canvas 2D renderer remains as a fallback.
- Save format is unchanged.
- Puzzle, inventory, combat, room, door, ending, and AI logic are unchanged.
- GitHub Pages build remains static.

### Stage 2 — Renderer/data separation hardening

Status: completed as the second implementation milestone.

Estimated effort: 1–2 days.

Dependencies: Stage 1.

Tasks:

1. Extract `RenderState` and renderer interface into `src/game/systems/renderTypes.ts`. Completed.
2. Move room-to-geometry conversion into `src/game/world/RoomGeometryBuilder.ts`. Deferred to Stage 3 because the renderer boundary is now explicit and tested.
3. Add a renderer capability flag to settings: `rendererMode: 'auto' | '3d' | '2d'`. Completed.
4. Add tests for save compatibility and inventory operations. Completed.
5. Add a smoke test for `GameEngine.createSaveData()` against the v1 schema. Deferred until a DOM/canvas test environment is added.

### Stage 3 — Performance pass for 3D renderer

Estimated effort: 2–4 days.

Dependencies: Stage 2.

Tasks:

1. Replace per-frame dynamic mesh replacement with object pools for enemies, interactable markers, muzzle flashes, and particles.
2. Convert particles to one or more `InstancedMesh`/`Points` batches.
3. Add quality scaler:
   - low: no SSAO, no bloom, lower pixel ratio, no shadows.
   - medium: bloom, reduced SSAO, limited shadows.
   - high: SSAO, bloom, shadows, higher pixel ratio.
4. Add runtime FPS sampling and automatic downgrade if average FPS drops below target.
5. Code split Three.js renderer if 2D fallback/menu load size becomes a concern.

### Stage 4 — Navigation and AI modernization

Estimated effort: 4–7 days.

Dependencies: Stage 2.

Tasks:

1. Generate a grid nav graph from `rooms.ts` walkable tiles.
2. Add A* pathfinding per room.
3. Preserve existing AI state machine but replace direct movement with path following.
4. Add sensory model:
   - vision cone with line-of-sight tile checks.
   - hearing events from sprinting, firing, doors, item drops.
   - memory timers and last-known-position search.
5. Add patrol route debug overlay in development mode.
6. Add tests for pathfinding around blocked tiles and AI transitions.

### Stage 5 — AAA third-person controller

Estimated effort: 5–10 days.

Dependencies: Stage 4 if physics-driven, Stage 2 if kinematic.

Tasks:

1. Extract movement into `PlayerController`.
2. Convert current velocity logic to a kinematic capsule controller.
3. Add acceleration, braking, inertia, turn smoothing, sprint/crouch modifiers.
4. Add camera collision tests against walls.
5. Add step/obstacle handling using current tile geometry as collision volumes.
6. Evaluate Rapier only after kinematic controller limits are known; do not add physics just for fashion.

### Stage 6 — Animation system

Estimated effort: 7–14 days.

Dependencies: Stage 5.

Tasks:

1. Add procedural placeholder animation states first:
   - idle, walk, run, crouch, aim, shoot, reload, hurt, death, interact.
2. Build an `AnimationStateMachine` independent of rendering.
3. Add procedural IK-like aiming offsets before importing character assets.
4. Later introduce CC0/glTF rigged models only after licensing review.
5. Keep current gameplay timings authoritative to avoid combat regressions.

### Stage 7 — Combat feel

Estimated effort: 4–8 days.

Dependencies: Stage 5 and Stage 6.

Tasks:

1. Keep hitscan pistol behavior initially for save/gameplay compatibility.
2. Add visible bullet traces, muzzle flash geometry/light, bullet impact decals.
3. Add recoil curve, weapon sway, aim tightening, reload timing windows.
4. Add enemy hit reactions by state and body region approximation.
5. Add melee using current utility knife item.
6. Add optional projectile physics for flare launcher first, because it benefits most from visible travel time.

### Stage 8 — Puzzle presentation upgrade

Estimated effort: 4–8 days.

Dependencies: Stage 2 and Stage 3.

Tasks:

1. Keep existing puzzle flags as authoritative.
2. Create 3D interactable prop definitions linked to puzzle IDs:
   - power panel with fuse/battery slots.
   - chemical decontamination unit with animated valves/tubes.
   - flood control valve with rotation animation.
   - specimen container symbol alignment mechanism.
3. Add short in-world animations before flags are set.
4. Add UI fallbacks for accessibility.

### Stage 9 — Spatial audio and horror director

Estimated effort: 5–10 days.

Dependencies: Stage 2.

Tasks:

1. Wrap Web Audio nodes in a `SpatialAudioSystem` with listener updates from the camera/player.
2. Add panners for enemies, doors, machinery, dripping water, vents, and gunshots.
3. Add room profiles for reverb/filtering.
4. Add an adaptive horror director:
   - tension score from health, ammo, enemy state, darkness, recent combat.
   - subtle randomized events: flicker, distant impact, vent rustle, monitor buzz, shadow movement.
5. Ensure events are psychological and low repetition, not cheap jump scares.

### Stage 10 — Inventory and UI modernization

Estimated effort: 5–10 days.

Dependencies: Stage 2.

Tasks:

1. Add drag-and-drop item movement with keyboard/controller parity.
2. Add 3D item preview scene using the same Three.js renderer stack or a lightweight isolated scene.
3. Add item rotation animation and inspect mode.
4. Add quick slots.
5. Improve transitions, readability, scalable UI, subtitles, and controller navigation.

### Stage 11 — Deployment hardening

Estimated effort: 1–2 days.

Dependencies: after each major rendering milestone.

Tasks:

1. Keep `vite.config.ts` GitHub Pages base unchanged.
2. Verify `npm run build` and local preview after each milestone.
3. Add GitHub Actions build workflow.
4. Track compressed bundle budget.
5. Update `docs/ASSET_LICENSES.md` for every added external asset.

## 4. Save Compatibility Strategy

Current save schema remains v1 after Stage 1 because no persistent gameplay data changed.

Rules for future stages:

1. Do not store renderer/camera/animation-only data in saves unless necessary.
2. Preserve existing fields:
   - `player.x`, `player.y`, `currentRoom`, health/infection.
   - inventory/storage/equipped weapon/ammo.
   - flags, documents, puzzle states, enemy states, door states.
3. If 3D-specific progression data becomes necessary, increment `SAVE_VERSION` and implement `SaveManager.migrate()`.
4. Keep old v1 saves loadable by mapping 2D coordinates into 3D room coordinates using the existing tile scale.

## 5. Performance Plan

Current build verification after Stage 1:

- Build passes.
- Production JS bundle: about 1,089.67 KB raw / 296.24 KB gzip.
- CSS remains about 16.71 KB raw / 3.92 KB gzip.
- Vite warns the JS chunk is larger than 500 KB.

Performance controls already included in Stage 1:

- Instanced tile geometry for rooms.
- Quality-aware post-processing: low skips composer, medium/high use SSAO+bloom.
- Pixel ratio capped to avoid runaway high-DPI cost.
- 2D fallback if WebGL initialization fails.

Next required optimizations:

1. Object pools for dynamic props/particles.
2. Particle batching.
3. Room geometry caching.
4. Code splitting for Three.js renderer if initial load becomes too heavy.
5. FPS monitor and automatic quality downgrade.

## 6. Regression Checklist for Every Future Milestone

Run:

```bash
npm run build
npm run test
npm run preview
```

Manual browser checklist:

- Main menu loads under `/echoes-below/`.
- New game starts.
- Player can move, sprint, crouch, aim, shoot, reload, heal.
- Doors transition between rooms.
- Documents open and return to previous screen.
- Inventory opens/closes, item selection works, weapons equip.
- Puzzles still set the same flags and unlock the same doors.
- Enemies spawn in the correct rooms and can damage/be damaged.
- Save terminal opens save/load screen.
- Saving/loading preserves room, position, health, inventory, flags, documents, enemies, doors.
- Endings still trigger.
- Low/medium/high quality modes remain playable.
- GitHub Pages build still uses `/echoes-below/` base.

## 7. Recommended Next Implementation Milestone

The next safest engineering milestone is **Stage 3: 3D performance hardening**.

Focus first on object pools, particle batching, room geometry caching, and optional renderer chunk splitting before adding physics, imported character models, or complex AI. This protects browser performance and keeps GitHub Pages deployment lightweight.
