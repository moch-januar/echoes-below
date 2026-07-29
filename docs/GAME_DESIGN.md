# Game Design

## Concept

**ECHOES BELOW** is a browser-based survival-horror game set in an abandoned underground biomedical research station. Players explore dark corridors, solve environmental puzzles, manage limited resources, and survive encounters with strange organisms.

## Core Loop

1. Explore facility rooms
2. Find items and documents
3. Solve puzzles to unlock progression
4. Conserve ammunition and health
5. Save progress at safe room terminals
6. Uncover story through discovered documents
7. Escape before sterilization

## Room Progression

```
Intake Chamber
    ↓
Security Office (find clues)
    ↓ (need Blue Keycard)
Cafeteria
    ↓ (need Green Keycard)
Medical Laboratory
    ↓ (solve chemical puzzle)
Flooded Corridor
    ↓ (solve valve puzzle)
Specimen Storage ← → Hidden Observation
    ↓ (need Orange Keycard / solve symbol puzzle)
Safe Room (save terminal)
    ↓
Power Control Room (restore power)
    ↓
Escape Platform
```

## Puzzles

1. **Power Restoration** (Power Control): Insert 2 fuses + 1 battery
2. **Chemical Decontamination** (Medical Lab): Unlocks corridor
3. **Flood Control Valves** (Corridor): Drains water
4. **Symbol Alignment** (Storage): Unlocks hidden compartment → Security Badge

## Enemies

| Type | Behavior | Health | Damage | Notes |
|---|---|---|---|---|
| The Hollow | Patrols, chases, attacks | 80 | 15 | Slow, persistent |
| The Listener | Senses sound, fast when alerted | 50 | 20 | Blind, reacts to footsteps |
| The Bloom | Stationary, spore damage in AoE | 120 | 5/s | Blocks passages |

## Endings

1. **Escape** (default): Escape without research data
2. **Research** (found lab data): Escape with evidence
3. **Secret** (all documents found): The full truth revealed

## Items

Weapons: Service Pistol, Flare Launcher, Utility Knife
Healing: Medical Sealant, Antiseptic, Sterile Sealant (combined)
Key Items: Battery Cell, Maintenance Fuse, Security Badge, 3 Keycards, Valve Handle, Chemical Stabilizer, Facility Map, Signal Decoder

## Design Principles

- Atmosphere over action: limited visibility, constrained resources
- Fair but dangerous combat
- Puzzles with environmental clues
- Story through exploration
- Player choice affects ending
