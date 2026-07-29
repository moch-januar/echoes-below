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
│  Zustand    │  Renderer.ts  │  Input    │
│  Stores     │  Canvas 2D    │  Manager  │
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
- Canvas 2D with dirty rectangles
- Offscreen canvas for lighting layer
