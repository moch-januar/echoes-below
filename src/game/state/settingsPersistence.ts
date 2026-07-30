import { DEFAULT_KEY_BINDINGS, normalizeKeyBindings } from '../systems/inputBindings';
import type { PartialKeyBindings } from '../systems/inputBindings';
import type { GameSettings, RendererMode } from './gameStore';

export const SETTINGS_STORAGE_KEY = 'echoes-below-settings';
const SETTINGS_VERSION = 1;

type StoredSettingsPayload = {
  version: number;
  settings: Partial<GameSettings>;
};

const hasLocalStorage = () => typeof localStorage !== 'undefined';

const numberInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

const booleanValue = (value: unknown) => typeof value === 'boolean' ? value : undefined;

const stringOption = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined =>
  typeof value === 'string' && allowed.includes(value as T) ? value as T : undefined;

function sanitizeSettings(raw: unknown): Partial<GameSettings> | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Partial<StoredSettingsPayload>;
  const source = payload.settings && typeof payload.settings === 'object' ? payload.settings as Record<string, unknown> : raw as Record<string, unknown>;
  const settings: Partial<GameSettings> = {};

  if (numberInRange(source.masterVolume, 0, 1)) settings.masterVolume = source.masterVolume;
  if (numberInRange(source.musicVolume, 0, 1)) settings.musicVolume = source.musicVolume;
  if (numberInRange(source.sfxVolume, 0, 1)) settings.sfxVolume = source.sfxVolume;
  if (numberInRange(source.mouseSensitivity, 0.1, 2)) settings.mouseSensitivity = source.mouseSensitivity;
  if (numberInRange(source.hudScale, 0.75, 1.4)) settings.hudScale = source.hudScale;
  if (numberInRange(source.touchOpacity, 0.35, 1)) settings.touchOpacity = source.touchOpacity;
  if (numberInRange(source.touchScale, 0.75, 1.35)) settings.touchScale = source.touchScale;
  if (numberInRange(source.touchLookSensitivity, 0.3, 1.8)) settings.touchLookSensitivity = source.touchLookSensitivity;
  if (numberInRange(source.gamepadDeadZone, 0.01, 0.6)) settings.gamepadDeadZone = source.gamepadDeadZone;

  for (const key of [
    'invertY',
    'cameraShakeEnabled',
    'subtitlesEnabled',
    'reducedFlashing',
    'holdAim',
    'holdSprint',
    'hudAutoHide',
    'immersiveHud',
    'highContrast',
    'reducedMotion',
    'touchControlsEnabled',
    'leftHandedTouch',
  ] as const) {
    const value = booleanValue(source[key]);
    if (value !== undefined) settings[key] = value;
  }

  const subtitleSize = stringOption(source.subtitleSize, ['small', 'medium', 'large'] as const);
  if (subtitleSize) settings.subtitleSize = subtitleSize;

  const qualityPreset = stringOption(source.qualityPreset, ['low', 'medium', 'high'] as const);
  if (qualityPreset) settings.qualityPreset = qualityPreset;

  const rendererMode = stringOption<RendererMode>(source.rendererMode, ['auto', '3d', '2d'] as const);
  if (rendererMode) settings.rendererMode = rendererMode;

  const colorBlindMode = stringOption(source.colorBlindMode, ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const);
  if (colorBlindMode) settings.colorBlindMode = colorBlindMode;

  if (source.keyBindings && typeof source.keyBindings === 'object') {
    settings.keyBindings = normalizeKeyBindings(source.keyBindings as PartialKeyBindings);
  } else if ('keyBindings' in source) {
    settings.keyBindings = normalizeKeyBindings(DEFAULT_KEY_BINDINGS);
  }

  return settings;
}

export function loadStoredSettings(): Partial<GameSettings> | null {
  if (!hasLocalStorage()) return null;

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStoredSettings(settings: GameSettings): boolean {
  if (!hasLocalStorage()) return false;

  try {
    const payload: StoredSettingsPayload = {
      version: SETTINGS_VERSION,
      settings,
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
