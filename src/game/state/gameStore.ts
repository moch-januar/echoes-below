import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────

export type Screen =
  | 'title'
  | 'newGame'
  | 'loading'
  | 'playing'
  | 'pause'
  | 'inventory'
  | 'map'
  | 'document'
  | 'examine'
  | 'saveLoad'
  | 'settings'
  | 'controls'
  | 'death'
  | 'ending';

export type HealthState = 'fine' | 'injured' | 'critical' | 'dead';

export type GameFlag = string; // e.g. 'door_101_opened', 'puzzle_power_done'

export interface PlayerState {
  x: number;
  y: number;
  angle: number; // radians, direction facing
  health: number;
  maxHealth: number;
  healthState: HealthState;
  infected: number; // 0-100 contamination level
  isRunning: boolean;
  isCrouching: boolean;
  isAiming: boolean;
  staggerTimer: number;
}

export interface GameState {
  // Screen
  screen: Screen;
  prevScreen: Screen | null;
  setScreen: (s: Screen) => void;

  // Player
  player: PlayerState;
  updatePlayer: (partial: Partial<PlayerState>) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setPlayerPosition: (x: number, y: number) => void;

  // Game flags
  flags: Set<GameFlag>;
  setFlag: (flag: GameFlag) => void;
  hasFlag: (flag: GameFlag) => boolean;
  removeFlag: (flag: GameFlag) => void;

  // Objectives
  currentObjective: string;
  setObjective: (obj: string) => void;

  // Documents collected
  documents: string[];
  addDocument: (id: string) => void;
  hasDocument: (id: string) => boolean;
  currentDocument: string | null;
  openDocument: (id: string) => void;
  closeDocument: () => void;

  // Game time (real seconds elapsed)
  gameTime: number;
  tickTime: (dt: number) => void;

  // Ending tracking
  endingFlags: Record<string, boolean>;
  setEndingFlag: (key: string) => void;
  currentEnding: string | null;
  setEnding: (ending: string) => void;

  // Interaction
  interactionPrompt: string | null;
  interactionAction: (() => void) | null;
  setInteraction: (prompt: string | null, action?: (() => void) | null) => void;

  // Subtitles
  subtitleText: string | null;
  subtitleTimer: number;
  showSubtitle: (text: string, duration?: number) => void;

  // Camera shake
  cameraShake: number;
  triggerShake: (intensity: number) => void;

  // Loading
  loadingProgress: number;
  loadingMessage: string;
  setLoading: (progress: number, message: string) => void;

  // Combat
  ammo: Record<string, number>;
  reserveAmmo: Record<string, number>;
  setAmmo: (weapon: string, loaded: number, reserve: number) => void;
  consumeAmmo: (weapon: string) => boolean; // returns false if empty

  // Settings
  settings: GameSettings;
  updateSettings: (partial: Partial<GameSettings>) => void;

  // Reset
  resetGame: () => void;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
  cameraShakeEnabled: boolean;
  subtitlesEnabled: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  reducedFlashing: boolean;
  holdAim: boolean;
  holdSprint: boolean;
  qualityPreset: 'low' | 'medium' | 'high';
}

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_PLAYER: PlayerState = {
  x: 160,
  y: 320,
  angle: 0,
  health: 100,
  maxHealth: 100,
  healthState: 'fine',
  infected: 0,
  isRunning: false,
  isCrouching: false,
  isAiming: false,
  staggerTimer: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  mouseSensitivity: 1.0,
  invertY: false,
  cameraShakeEnabled: true,
  subtitlesEnabled: true,
  subtitleSize: 'medium',
  reducedFlashing: false,
  holdAim: false,
  holdSprint: false,
  qualityPreset: 'medium',
};

const INITIAL_STATE = {
  screen: 'title' as Screen,
  prevScreen: null as Screen | null,
  player: { ...DEFAULT_PLAYER },
  flags: new Set<GameFlag>(),
  currentObjective: 'Find a way to restore power to the facility lift.',
  documents: [] as string[],
  currentDocument: null as string | null,
  gameTime: 0,
  endingFlags: {} as Record<string, boolean>,
  currentEnding: null as string | null,
  interactionPrompt: null as string | null,
  interactionAction: null as (() => void) | null,
  subtitleText: null as string | null,
  subtitleTimer: 0,
  cameraShake: 0,
  loadingProgress: 0,
  loadingMessage: '',
  ammo: { pistol: 12, flaregun: 1 },
  reserveAmmo: { pistol: 36, flaregun: 3 },
  settings: { ...DEFAULT_SETTINGS },
};

// ── Store ───────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setScreen: (s) =>
    set((st) => ({ prevScreen: st.screen, screen: s })),

  updatePlayer: (partial) =>
    set((st) => ({
      player: { ...st.player, ...partial },
    })),

  damagePlayer: (amount) =>
    set((st) => {
      const newHealth = Math.max(0, st.player.health - amount);
      let hs: HealthState = 'fine';
      if (newHealth <= 0) hs = 'dead';
      else if (newHealth <= 25) hs = 'critical';
      else if (newHealth <= 50) hs = 'injured';
      return {
        player: {
          ...st.player,
          health: newHealth,
          healthState: hs,
          staggerTimer: 0.3,
        },
        screen: newHealth <= 0 ? 'death' : st.screen,
      };
    }),

  healPlayer: (amount) =>
    set((st) => {
      const newHealth = Math.min(st.player.maxHealth, st.player.health + amount);
      let hs: HealthState = 'fine';
      if (newHealth <= 25) hs = 'critical';
      else if (newHealth <= 50) hs = 'injured';
      return {
        player: { ...st.player, health: newHealth, healthState: hs },
      };
    }),

  setPlayerPosition: (x, y) =>
    set((st) => ({
      player: { ...st.player, x, y },
    })),

  setFlag: (flag) =>
    set((st) => {
      const newFlags = new Set(st.flags);
      newFlags.add(flag);
      return { flags: newFlags };
    }),

  hasFlag: (flag) => get().flags.has(flag),

  removeFlag: (flag) =>
    set((st) => {
      const newFlags = new Set(st.flags);
      newFlags.delete(flag);
      return { flags: newFlags };
    }),

  setObjective: (obj) => set({ currentObjective: obj }),

  addDocument: (id) =>
    set((st) => {
      if (st.documents.includes(id)) return st;
      return { documents: [...st.documents, id] };
    }),

  hasDocument: (id) => get().documents.includes(id),

  openDocument: (id) => set({ currentDocument: id, screen: 'document', prevScreen: get().screen }),

  closeDocument: () =>
    set((st) => ({
      currentDocument: null,
      screen: st.prevScreen || 'playing',
    })),

  tickTime: (dt) =>
    set((st) => ({
      gameTime: st.gameTime + dt,
      player: {
        ...st.player,
        staggerTimer: Math.max(0, st.player.staggerTimer - dt),
      },
      subtitleTimer: Math.max(0, st.subtitleTimer - dt),
      subtitleText: st.subtitleTimer - dt <= 0 ? null : st.subtitleText,
      cameraShake: Math.max(0, st.cameraShake - dt),
    })),

  setEndingFlag: (key) =>
    set((st) => ({
      endingFlags: { ...st.endingFlags, [key]: true },
    })),

  setEnding: (ending) => set({ currentEnding: ending, screen: 'ending' }),

  setInteraction: (prompt, action = null) =>
    set({ interactionPrompt: prompt, interactionAction: action }),

  showSubtitle: (text, duration = 3) =>
    set({ subtitleText: text, subtitleTimer: duration }),

  triggerShake: (intensity) =>
    set((st) => ({
      cameraShake: Math.max(st.cameraShake, intensity),
    })),

  setLoading: (progress, message) =>
    set({ loadingProgress: progress, loadingMessage: message }),

  setAmmo: (weapon, loaded, reserve) =>
    set((st) => ({
      ammo: { ...st.ammo, [weapon]: loaded },
      reserveAmmo: { ...st.reserveAmmo, [weapon]: reserve },
    })),

  consumeAmmo: (weapon) => {
    const state = get();
    if ((state.ammo[weapon] || 0) <= 0) return false;
    set((st) => ({
      ammo: { ...st.ammo, [weapon]: Math.max(0, (st.ammo[weapon] || 0) - 1) },
    }));
    return true;
  },

  updateSettings: (partial) =>
    set((st) => ({
      settings: { ...st.settings, ...partial },
    })),

  resetGame: () =>
    set({
      ...INITIAL_STATE,
      player: { ...DEFAULT_PLAYER },
      flags: new Set(),
      settings: get().settings,
    }),
}));
