import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';

describe('gameStore renderer settings', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('defaults to automatic renderer selection', () => {
    expect(useGameStore.getState().settings.rendererMode).toBe('auto');
  });

  it('allows forcing the legacy 2D renderer for compatibility testing', () => {
    useGameStore.getState().updateSettings({ rendererMode: '2d' });

    expect(useGameStore.getState().settings.rendererMode).toBe('2d');
  });

  it('respects the camera shake accessibility setting at runtime', () => {
    useGameStore.getState().updateSettings({ cameraShakeEnabled: false });
    useGameStore.getState().triggerShake(0.5);

    expect(useGameStore.getState().cameraShake).toBe(0);
  });

  it('reduces damage flash intensity when reduced flashing is enabled', () => {
    useGameStore.getState().updateSettings({ reducedFlashing: true });
    useGameStore.getState().damagePlayer(10);

    expect(useGameStore.getState().effects.damageFlash).toBeLessThan(0.4);
  });

  it('updates and resets custom key bindings through settings state', () => {
    useGameStore.getState().updateKeyBindings({ interact: ['KeyZ'] });

    expect(useGameStore.getState().settings.keyBindings.interact).toEqual(['KeyZ']);

    useGameStore.getState().resetKeyBindings();

    expect(useGameStore.getState().settings.keyBindings.interact).toEqual(['KeyE']);
  });
});
