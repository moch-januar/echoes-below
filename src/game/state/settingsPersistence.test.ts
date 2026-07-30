import { beforeEach, describe, expect, it } from 'vitest';
import { loadStoredSettings, saveStoredSettings, SETTINGS_STORAGE_KEY } from './settingsPersistence';
import { DEFAULT_KEY_BINDINGS } from '../systems/inputBindings';
import type { GameSettings } from './gameStore';

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

function makeSettings(): GameSettings {
  return {
    masterVolume: 0.7,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    mouseSensitivity: 1,
    invertY: false,
    cameraShakeEnabled: true,
    subtitlesEnabled: true,
    subtitleSize: 'medium',
    reducedFlashing: false,
    holdAim: false,
    holdSprint: false,
    qualityPreset: 'medium',
    rendererMode: 'auto',
    hudScale: 1,
    hudAutoHide: false,
    immersiveHud: false,
    highContrast: false,
    colorBlindMode: 'none',
    reducedMotion: false,
    touchControlsEnabled: false,
    leftHandedTouch: false,
    touchOpacity: 0.72,
    touchScale: 1,
    touchLookSensitivity: 0.9,
    gamepadDeadZone: 0.18,
    keyBindings: { ...DEFAULT_KEY_BINDINGS, interact: ['KeyZ'] },
  };
}

describe('settings persistence', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('round-trips safe user settings and key bindings through localStorage', () => {
    const settings = makeSettings();
    settings.rendererMode = '2d';
    settings.invertY = true;

    expect(saveStoredSettings(settings)).toBe(true);

    const loaded = loadStoredSettings();
    expect(loaded?.rendererMode).toBe('2d');
    expect(loaded?.invertY).toBe(true);
    expect(loaded?.keyBindings?.interact).toEqual(['KeyZ']);
  });

  it('ignores malformed stored settings without throwing', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 1, settings: { rendererMode: 'invalid', hudScale: 99, keyBindings: { interact: [] } } }));

    const loaded = loadStoredSettings();

    expect(loaded?.rendererMode).toBeUndefined();
    expect(loaded?.hudScale).toBeUndefined();
    expect(loaded?.keyBindings?.interact).toEqual(['KeyE']);
  });
});
