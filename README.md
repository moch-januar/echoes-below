# ECHOES BELOW — A Survival-Horror Game

An original browser-based survival-horror game built with React, TypeScript, and HTML5 Canvas 2D.

**Playable chapter:** ~20 minutes of tense exploration, puzzles, combat, and narrative discovery.

## Quick Start

```bash
npm install
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
```

## Controls

| Key | Action |
|---|---|
| **WASD** | Move |
| **Mouse** | Look / Aim |
| **Left Click** | Fire weapon |
| **Right Click** | Aim (hold) |
| **Shift** | Run |
| **Ctrl / C** | Crouch |
| **E** | Interact |
| **R** | Reload |
| **Q** | Use healing item |
| **Tab** | Inventory |
| **M** | Map |
| **Esc** | Pause |

See `docs/CONTROLS.md` for full details.

## Story

You awaken inside an abandoned biomedical research station. The facility has lost power, emergency doors are sealed, and the staff are gone. An experimental organism has spread through the ventilation system.

As **Mara Vey**, a systems engineer, you must restore power, uncover what happened, and escape before the facility enters an automated sterilization cycle.

**Original characters:**
- Mara Vey — Emergency systems engineer (player character)
- Dr. Ilyan Rook — Lead researcher of the CNO project
- Sera Noll — Security officer (contact via facility network)
- The Warden — Unreliable facility AI

## Features

- **Exploration**: 10 connected rooms including safe rooms, laboratories, and flooded corridors
- **Puzzles**: Power restoration, chemical decontamination, flood control, symbol alignment
- **Combat**: Limited ammunition, weapon reloading, three enemy types with different AI behaviors
- **Inventory**: Grid-based inventory system with item rotation, stacking, and combining
- **Save/Load**: 3 save slots, manual saves at terminals in safe rooms
- **Map**: Progressive map discovery as you explore
- **Story**: 9 documents revealing the facility's secrets, with 3 possible endings
- **Accessibility**: Subtitles, reduced flashing, camera shake toggle, adjustable sensitivity

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **HTML5 Canvas 2D** for game rendering
- **Zustand** for state management
- **localStorage** for save persistence

## Project Structure

```
echoes-below/
├── src/
│   ├── game/
│   │   ├── GameEngine.ts       # Main game loop and world simulation
│   │   ├── GameView.tsx        # React wrapper for canvas
│   │   ├── state/              # Zustand stores
│   │   ├── config/             # Room, item, enemy, puzzle, document data
│   │   ├── systems/            # Input, rendering
│   │   └── saves/              # Save/Load manager
│   ├── ui/                     # React UI components
│   ├── utils/                  # Math and game utilities
│   ├── audio/                  # Audio manager (procedural)
│   ├── App.tsx                 # Main app with screen routing
│   └── styles.css              # All game styles
├── docs/                       # Documentation
├── public/                     # Static assets
└── tests/                      # Tests
```

## Deployment

The production build produces a static site in `dist/`. Deploy to any static host:

- **Cloudflare Pages**: Connect repo, build command `npm run build`, output `dist`
- **Nginx**: Copy `dist/` to web root
- **GitHub Pages**: Deploy `dist/` folder

See `docs/DEPLOYMENT.md` for full details.

## Development

```bash
npm run dev       # Hot-reload dev server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build locally
```

## License

Original game. All code, story, characters, and assets are original works.

No copyrighted commercial game assets, characters, or music are included.
