export interface HoldToggleIntentInput {
  holdMode: boolean;
  isHeld: boolean;
  justPressed: boolean;
  latched: boolean;
}

export interface HoldToggleIntentResult {
  active: boolean;
  latched: boolean;
}

export function resolveHoldToggleIntent(input: HoldToggleIntentInput): HoldToggleIntentResult {
  if (input.holdMode) {
    return { active: input.isHeld, latched: false };
  }

  const latched = input.justPressed ? !input.latched : input.latched;
  return { active: latched, latched };
}
