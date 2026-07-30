import { describe, expect, it } from 'vitest';
import { InputManager } from './InputManager';

describe('InputManager frame edges', () => {
  it('reports virtual mouse just-pressed only on the first held frame', () => {
    const input = new InputManager();

    input.setVirtualMouseButton(0, true);
    input.update();
    expect(input.isMouseJustPressed(0)).toBe(true);

    input.resetFrame();
    input.update();
    expect(input.isMouseJustPressed(0)).toBe(false);

    input.setVirtualMouseButton(0, false);
    input.resetFrame();
    input.update();
    expect(input.isMouseJustPressed(0)).toBe(false);

    input.setVirtualMouseButton(0, true);
    input.update();
    expect(input.isMouseJustPressed(0)).toBe(true);
  });

  it('applies invert-Y to virtual aim deltas', () => {
    const input = new InputManager();

    input.setMousePosition(100, 100);
    input.setInvertY(true);
    input.addVirtualAimDelta(0, 12);
    expect(input.getMousePosition().y).toBe(88);

    input.setInvertY(false);
    input.addVirtualAimDelta(0, 12);
    expect(input.getMousePosition().y).toBe(100);
  });

  it('accepts sanitized custom action bindings and can reset them', () => {
    const input = new InputManager();

    input.setActionBindings({ interact: ['KeyZ'], run: [] });
    expect(input.getActionBindings().interact).toEqual(['KeyZ']);
    expect(input.getActionBindings().run).toEqual(['ShiftLeft', 'ShiftRight']);

    input.resetActionBindings();
    expect(input.getActionBindings().interact).toEqual(['KeyE']);
  });
});
