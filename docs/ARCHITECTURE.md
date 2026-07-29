# Architecture

## Overview

```
┌─────────────────────────────────────────┐
│                App.tsx                   │
│  Screen router / game lifecycle          │
├─────────────────────────────────────────┤
│  GameView.tsx                            │
│  Canvas wrapper / engine lifecycle       │
├─────────────────────────────────────────┤
│  GameEngine.ts                           │
│  Game loop, world sim, collision, AI     │
├─────────────┬───────────────┬───────────┤
│  Zustand    │  GameRenderer │  Input    │
│  Stores     │  3D / 2D      │  Manager  │
├─────────────┴───────────────┴───────────┤
│  Config: rooms, items, enemies, puzzles  │
│  Saves: localStorage persistence         │
│  Audio: procedural / Web Audio API       │
└─────────────────────────────────────────┘
```

## State Management

All game state is managed through Zustand stores:

- **gameStore**: Player state, health, flags, objectives, documents, game time, screen routing, settings
- **inventoryStore**: Items, grid, equipment, storage, combining, stacking

## Screen Routing

The app uses a simple screen state machine:

```
title → newGame → loading → playing ↔ pause
                                    ↕ inventory
                                    ↕ map
                                    ↕ document
                                    ↕ saveLoad
                              death → playing (reload save) / title
                              ending → title
```

## Renderer Boundary

`GameEngine.render()` builds a renderer-agnostic `RenderState` from the shared contract in `src/game/systems/renderTypes.ts`. The default renderer is now `GameRenderer3D.ts`, a Three.js/WebGL renderer that procedurally converts existing room tile maps into modular 3D environments. `Renderer.ts` remains available as a Canvas 2D fallback if WebGL initialization fails or when Settings → Display → Renderer is set to Legacy 2D.

The current 3D renderer provides:
- PBR `MeshStandardMaterial` materials
- ACES tone mapping and sRGB output
- Exponential fog
- Soft shadows
- Dynamic player flashlight and muzzle flash lights
- Flickering emergency lights
- Instanced tile geometry
- SSAO and bloom on medium/high quality
- Over-the-shoulder third-person camera

## Room System

Rooms are defined as tilemaps in `game/config/rooms.ts`. Each room has:
- 2D tile array (wall, floor, water, spore, debris)
- Door definitions with target rooms
- Ambient light level
- Safe room flag

## Enemy AI

Three states: idle → investigate → chase → attack → stagger → return → patrol

AI is room-based. Only enemies in the current room are updated.

## Physics

Simple tile-based collision:
- Player radius: 6px
- Walls blocked at tile boundaries
- Water slows movement (50% speed)
- Spore tiles deal damage over time

## Save System

Save data is versioned JSON in localStorage:
- Key: `echoes-below-save`
- Schema version: 1
- 3 manual save slots
- Saves: position, health, inventory, storage, flags, puzzles, enemies, documents, objectives, game time

## Combat

Weapons fire raycasts from player in aiming direction:
- Pistol: 0.35s cooldown, 25 damage, 200 range
- Flaregun: 1s cooldown, 50 damage, 250 range
- Hits detected via point-to-line-segment distance

## Performance

- Fixed timestep with cap at 50ms to prevent spiral-of-death
- Enemies only update in current room
- 3D rooms use instanced tile meshes to reduce draw calls
- Low quality skips 3D post-processing
- Legacy Canvas 2D renderer remains as a fallback
- See `docs/MODERNIZATION_ROADMAP.md` for the 3D optimization plan
