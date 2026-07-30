export const ACTION_NAMES = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'run',
  'crouch',
  'interact',
  'reload',
  'inventory',
  'map',
  'pause',
  'useItem',
  'heal',
  'slot1',
  'slot2',
  'slot3',
  'slot4',
  'slot5',
] as const;

export type ActionName = typeof ACTION_NAMES[number];
export type KeyBindings = Record<ActionName, string[]>;
export type PartialKeyBindings = Partial<Record<ActionName, string[]>>;

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveUp: ['KeyW', 'ArrowUp'],
  moveDown: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  crouch: ['ControlLeft', 'ControlRight', 'KeyC'],
  interact: ['KeyE'],
  reload: ['KeyR'],
  inventory: ['Tab'],
  map: ['KeyM'],
  pause: ['Escape'],
  useItem: ['KeyF'],
  heal: ['KeyQ'],
  slot1: ['Digit1'],
  slot2: ['Digit2'],
  slot3: ['Digit3'],
  slot4: ['Digit4'],
  slot5: ['Digit5'],
};

const KEY_LABELS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  ControlLeft: 'Left Ctrl',
  ControlRight: 'Right Ctrl',
  Escape: 'Esc',
  Space: 'Space',
  Tab: 'Tab',
};

export function cloneKeyBindings(bindings: KeyBindings): KeyBindings {
  return Object.fromEntries(
    ACTION_NAMES.map((action) => [action, [...bindings[action]]]),
  ) as KeyBindings;
}

export function normalizeKeyBindings(bindings?: PartialKeyBindings): KeyBindings {
  const normalized = cloneKeyBindings(DEFAULT_KEY_BINDINGS);
  if (!bindings) return normalized;

  for (const action of ACTION_NAMES) {
    const custom = bindings[action];
    if (!custom) continue;
    const cleaned = Array.from(new Set(custom.map((key) => key.trim()).filter(Boolean)));
    if (cleaned.length > 0) normalized[action] = cleaned;
  }

  return normalized;
}

export function formatKeyCode(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function formatActionBinding(bindings: KeyBindings, action: ActionName): string {
  return bindings[action].map(formatKeyCode).join(' / ');
}
