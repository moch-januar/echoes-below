// ── Save/Load Manager ───────────────────────────────────────────────────────

const SAVE_KEY = 'echoes-below-save';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  slot: number;
  playTime: number;
  player: {
    x: number;
    y: number;
    health: number;
    infected: number;
    currentRoom: string;
  };
  inventory: Array<{
    id: string;
    templateId: string;
    gridX: number;
    gridY: number;
    width: number;
    height: number;
    rotated: boolean;
    quantity: number;
    maxStack: number;
  }>;
  storage: Array<{
    id: string;
    templateId: string;
    gridX: number;
    gridY: number;
    width: number;
    height: number;
    rotated: boolean;
    quantity: number;
    maxStack: number;
  }>;
  equippedWeapon: string | null;
  ammo: Record<string, number>;
  reserveAmmo: Record<string, number>;
  flags: string[];
  documents: string[];
  gameTime: number;
  endingFlags: Record<string, boolean>;
  currentEnding: string | null;
  objective: string;
  puzzleStates: Record<string, { state: string; data: Record<string, unknown> }>;
  enemyStates: Record<string, { health: number; dead: boolean; state: string }>;
  doorStates: Record<string, boolean>; // door id -> open
  currentRoom: string;
}

export class SaveManager {
  static save(slot: number, data: Omit<SaveData, 'version' | 'timestamp'>): boolean {
    try {
      const saveData: SaveData = {
        ...data,
        version: SAVE_VERSION,
        timestamp: Date.now(),
        slot,
      };
      const allSaves = this.getAllSaves();
      allSaves[slot] = saveData;
      localStorage.setItem(SAVE_KEY, JSON.stringify(allSaves));
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  }

  static load(slot: number): SaveData | null {
    try {
      const allSaves = this.getAllSaves();
      const data = allSaves[slot];
      if (!data) return null;

      // Version migration
      if (data.version < SAVE_VERSION) {
        return this.migrate(data);
      }

      return data;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  }

  static getAllSaves(): Record<number, SaveData> {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static deleteSave(slot: number): boolean {
    try {
      const allSaves = this.getAllSaves();
      delete allSaves[slot];
      localStorage.setItem(SAVE_KEY, JSON.stringify(allSaves));
      return true;
    } catch {
      return false;
    }
  }

  static deleteAllSaves(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  static getSlotInfo(slot: number): { exists: boolean; timestamp?: number; playTime?: number; objective?: string } {
    const data = this.getAllSaves()[slot];
    if (!data) return { exists: false };
    return {
      exists: true,
      timestamp: data.timestamp,
      playTime: data.playTime,
      objective: data.objective,
    };
  }

  static migrate(data: SaveData): SaveData {
    // Future migration logic
    return { ...data, version: SAVE_VERSION };
  }

  static async exportSave(): Promise<string> {
    const allSaves = this.getAllSaves();
    return JSON.stringify(allSaves, null, 2);
  }

  static importSave(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (typeof data !== 'object') return false;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  static hasAnySave(): boolean {
    return Object.keys(this.getAllSaves()).length > 0;
  }
}
