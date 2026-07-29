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
});
