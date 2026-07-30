import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { ACTION_NAMES, formatActionBinding, formatKeyCode } from '../game/systems/inputBindings';
import type { ActionName } from '../game/systems/inputBindings';
import { useMenuKeyboardNavigation } from './useMenuKeyboardNavigation';

const ACTION_LABELS: Record<ActionName, string> = {
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  run: 'Sprint',
  crouch: 'Crouch',
  interact: 'Interact',
  reload: 'Reload',
  inventory: 'Inventory',
  map: 'Map',
  pause: 'Pause',
  useItem: 'Use Item',
  heal: 'Heal',
  slot1: 'Quick Slot 1',
  slot2: 'Quick Slot 2',
  slot3: 'Quick Slot 3',
  slot4: 'Quick Slot 4',
  slot5: 'Quick Slot 5',
};

export default function ControlsScreen() {
  const controlsRef = useRef<HTMLDivElement>(null);
  const [rebinding, setRebinding] = useState<ActionName | null>(null);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const settings = useGameStore((s) => s.settings);
  const updateKeyBindings = useGameStore((s) => s.updateKeyBindings);
  const resetKeyBindings = useGameStore((s) => s.resetKeyBindings);
  useMenuKeyboardNavigation(controlsRef, screen === 'controls');

  if (screen !== 'controls') return null;

  const handleBack = () => {
    // Return to previous screen
    const prev = useGameStore.getState().prevScreen;
    setScreen(prev === 'controls' ? 'pause' : prev || 'title');
  };

  const captureBinding = (event: KeyboardEvent<HTMLButtonElement>, action: ActionName) => {
    if (rebinding !== action) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.code === 'Escape') {
      setRebinding(null);
      return;
    }
    updateKeyBindings({ [action]: [event.code] });
    setRebinding(null);
  };

  return (
    <div className="screen controls-screen screen-overlay">
      <div className="controls-content" ref={controlsRef}>
        <h2>CONTROLS</h2>

        <div className="controls-grid">
          <div className="control-group">
            <h3>Movement</h3>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'moveUp')}</kbd> <kbd>{formatActionBinding(settings.keyBindings, 'moveLeft')}</kbd> <kbd>{formatActionBinding(settings.keyBindings, 'moveDown')}</kbd> <kbd>{formatActionBinding(settings.keyBindings, 'moveRight')}</kbd> <span>Move</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'run')}</kbd> <span>{settings.holdSprint ? 'Sprint (hold)' : 'Sprint (toggle)'}</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'crouch')}</kbd> <span>Crouch</span></div>
            <div className="control-row"><kbd>Mouse</kbd> <span>Look / Aim</span></div>
          </div>

          <div className="control-group">
            <h3>Combat</h3>
            <div className="control-row"><kbd>Left Click</kbd> <span>Fire Weapon</span></div>
            <div className="control-row"><kbd>Right Click</kbd> <span>{settings.holdAim ? 'Aim (hold)' : 'Aim (toggle)'}</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'reload')}</kbd> <span>Reload</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'heal')}</kbd> <span>Use Healing Item</span></div>
          </div>

          <div className="control-group">
            <h3>Interaction</h3>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'interact')}</kbd> <span>Interact / Open / Read</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'useItem')}</kbd> <span>Use Selected Item</span></div>
          </div>

          <div className="control-group">
            <h3>Menu</h3>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'inventory')}</kbd> <span>Inventory</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'map')}</kbd> <span>Map</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'pause')}</kbd> <span>Pause</span></div>
            <div className="control-row"><kbd>{formatActionBinding(settings.keyBindings, 'slot1')}</kbd>-<kbd>{formatActionBinding(settings.keyBindings, 'slot5')}</kbd> <span>Quick Slots</span></div>
          </div>
        </div>

        <div className="controls-tips">
          <h3>Tips</h3>
          <ul>
            <li>Ammunition is limited. Shoot wisely.</li>
            <li>Enemies can hear you running. Crouch to stay quiet.</li>
            <li>Save at terminals in safe rooms.</li>
            <li>Examine items for hidden clues.</li>
            <li>Combine items to create more effective equipment.</li>
            <li>Read all documents to discover the full story and secret endings.</li>
            <li>The Warden AI may not be trustworthy.</li>
          </ul>
        </div>

        <div className="controls-tips">
          <h3>Keyboard Remapping</h3>
          <p>Choose Rebind, then press a keyboard key. Escape cancels the current capture.</p>
          <div className="controls-grid">
            {ACTION_NAMES.map((action) => (
              <div className="control-row" key={action}>
                <span>{ACTION_LABELS[action]}</span>
                <kbd>{rebinding === action ? 'Press key…' : formatActionBinding(settings.keyBindings, action)}</kbd>
                <button
                  className="btn-action"
                  onClick={() => setRebinding(action)}
                  onKeyDown={(event) => captureBinding(event, action)}
                  aria-label={`Rebind ${ACTION_LABELS[action]}`}
                >
                  {rebinding === action ? 'Listening' : 'Rebind'}
                </button>
              </div>
            ))}
          </div>
          <button className="menu-btn" onClick={resetKeyBindings}>
            Reset Keyboard Bindings
          </button>
          {rebinding && <p>Waiting for a new key for {ACTION_LABELS[rebinding]}. Current key: {formatKeyCode(settings.keyBindings[rebinding][0])}</p>}
        </div>

        <button className="menu-btn primary" onClick={handleBack}>
          BACK
        </button>
      </div>
    </div>
  );
}
