# Save Format

## Overview

Save data is stored in `localStorage` under the key `echoes-below-save`.

The stored value is a JSON object mapping save slot numbers to save data objects.

## Schema (Version 1)

```typescript
interface SaveData {
  version: number;           // Schema version (currently 1)
  timestamp: number;         // Unix timestamp of save
  slot: number;              // Save slot (0-2)
  playTime: number;          // Seconds of play time
  player: {
    x: number;               // World position X
    y: number;               // World position Y
    health: number;          // Current health (0-100)
    infected: number;        // Contamination level (0-100)
    currentRoom: string;     // Room identifier
  };
  inventory: InventoryItem[];
  storage: InventoryItem[];
  equippedWeapon: string | null;
  ammo: Record<string, number>;       // Weapon -> loaded ammo
  reserveAmmo: Record<string, number>;
  flags: string[];                    // Game flags (door states, puzzle states, etc.)
  documents: string[];                // Collected document IDs
  gameTime: number;
  endingFlags: Record<string, boolean>;
  currentEnding: string | null;
  objective: string;                  // Current objective text
  puzzleStates: Record<string, PuzzleStateData>;
  enemyStates: Record<string, EnemyStateData>;
  doorStates: Record<string, boolean>;
  currentRoom: string;
}

interface InventoryItem {
  id: string;
  templateId: string;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  rotated: boolean;
  quantity: number;
  maxStack: number;
}
```

## Migration

When the schema version increases, `SaveManager.migrate()` handles upgrading older saves. Currently at version 1 with no migration steps needed.

## Export/Import

Saves can be exported via `SaveManager.exportSave()` which returns the full JSON string. Use `SaveManager.importSave(json)` to restore.
