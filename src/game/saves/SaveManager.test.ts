import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from './SaveManager';
import type { SaveData } from './SaveManager';

const storage = new Map<string, string>();

const localStorageStub = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageStub,
  configurable: true,
});

function makeSaveData(): Omit<SaveData, 'version' | 'timestamp'> {
  return {
    slot: 0,
    playTime: 123,
    player: {
      x: 160,
      y: 320,
      health: 85,
      infected: 4,
      currentRoom: 'intake',
    },
    inventory: [
      {
        id: 'weapon-1',
        templateId: 'pistol',
        gridX: 0,
        gridY: 0,
        width: 3,
        height: 1,
        rotated: false,
        quantity: 1,
        maxStack: 1,
      },
    ],
    storage: [],
    equippedWeapon: 'weapon-1',
    ammo: { pistol: 7 },
    reserveAmmo: { pistol: 12 },
    flags: ['door_unlocked_door_intake_east'],
    documents: ['doc_intro'],
    gameTime: 123,
    endingFlags: {},
    currentEnding: null,
    objective: 'Find a way out.',
    puzzleStates: {},
    enemyStates: {
      intake_300_200: { health: 55, dead: false, state: 'chase' },
    },
    doorStates: { door_intake_east: true },
    currentRoom: 'intake',
  };
}

describe('SaveManager compatibility', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('round-trips the v1 logical gameplay save data without renderer fields', () => {
    expect(SaveManager.save(0, makeSaveData())).toBe(true);

    const loaded = SaveManager.load(0);

    expect(loaded?.version).toBe(1);
    expect(loaded?.currentRoom).toBe('intake');
    expect(loaded?.player).toMatchObject({ x: 160, y: 320, health: 85 });
    expect(loaded?.inventory[0]?.templateId).toBe('pistol');
    expect(loaded?.doorStates.door_intake_east).toBe(true);
    expect(loaded).not.toHaveProperty('rendererMode');
  });

  it('rejects malformed imported saves without replacing existing saves', () => {
    expect(SaveManager.save(0, makeSaveData())).toBe(true);

    expect(SaveManager.importSave('not-json')).toBe(false);

    expect(SaveManager.load(0)?.currentRoom).toBe('intake');
  });
});
