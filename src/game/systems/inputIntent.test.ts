import { describe, expect, it } from 'vitest';
import { resolveHoldToggleIntent } from './inputIntent';

describe('resolveHoldToggleIntent', () => {
  it('uses held state directly in hold mode', () => {
    expect(resolveHoldToggleIntent({ holdMode: true, isHeld: true, justPressed: true, latched: false })).toEqual({ active: true, latched: false });
    expect(resolveHoldToggleIntent({ holdMode: true, isHeld: false, justPressed: false, latched: true })).toEqual({ active: false, latched: false });
  });

  it('toggles latched state only on just-pressed frames in toggle mode', () => {
    expect(resolveHoldToggleIntent({ holdMode: false, isHeld: true, justPressed: true, latched: false })).toEqual({ active: true, latched: true });
    expect(resolveHoldToggleIntent({ holdMode: false, isHeld: true, justPressed: false, latched: true })).toEqual({ active: true, latched: true });
    expect(resolveHoldToggleIntent({ holdMode: false, isHeld: true, justPressed: true, latched: true })).toEqual({ active: false, latched: false });
  });
});
