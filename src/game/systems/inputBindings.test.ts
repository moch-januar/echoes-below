import { describe, expect, it } from 'vitest';
import { DEFAULT_KEY_BINDINGS, formatKeyCode, normalizeKeyBindings } from './inputBindings';

describe('input key bindings', () => {
  it('normalizes partial custom bindings over defaults without mutating defaults', () => {
    const bindings = normalizeKeyBindings({ interact: ['KeyZ'], run: [] });

    expect(bindings.interact).toEqual(['KeyZ']);
    expect(bindings.run).toEqual(DEFAULT_KEY_BINDINGS.run);
    expect(DEFAULT_KEY_BINDINGS.interact).toEqual(['KeyE']);
  });

  it('formats keyboard codes for controls UI labels', () => {
    expect(formatKeyCode('KeyZ')).toBe('Z');
    expect(formatKeyCode('Digit4')).toBe('4');
    expect(formatKeyCode('ShiftLeft')).toBe('Left Shift');
    expect(formatKeyCode('Escape')).toBe('Esc');
  });
});
