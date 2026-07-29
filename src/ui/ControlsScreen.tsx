import { useGameStore } from '../game/state/gameStore';

export default function ControlsScreen() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  if (screen !== 'controls') return null;

  const handleBack = () => {
    // Return to previous screen
    const prev = useGameStore.getState().prevScreen;
    setScreen(prev === 'controls' ? 'pause' : prev || 'title');
  };

  return (
    <div className="screen controls-screen screen-overlay">
      <div className="controls-content">
        <h2>CONTROLS</h2>

        <div className="controls-grid">
          <div className="control-group">
            <h3>Movement</h3>
            <div className="control-row"><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <span>Move</span></div>
            <div className="control-row"><kbd>Shift</kbd> <span>Run</span></div>
            <div className="control-row"><kbd>Ctrl</kbd> / <kbd>C</kbd> <span>Crouch</span></div>
            <div className="control-row"><kbd>Mouse</kbd> <span>Look / Aim</span></div>
          </div>

          <div className="control-group">
            <h3>Combat</h3>
            <div className="control-row"><kbd>Left Click</kbd> <span>Fire Weapon</span></div>
            <div className="control-row"><kbd>Right Click</kbd> <span>Aim (hold)</span></div>
            <div className="control-row"><kbd>R</kbd> <span>Reload</span></div>
            <div className="control-row"><kbd>Q</kbd> <span>Use Healing Item</span></div>
          </div>

          <div className="control-group">
            <h3>Interaction</h3>
            <div className="control-row"><kbd>E</kbd> <span>Interact / Open / Read</span></div>
            <div className="control-row"><kbd>F</kbd> <span>Use Selected Item</span></div>
          </div>

          <div className="control-group">
            <h3>Menu</h3>
            <div className="control-row"><kbd>Tab</kbd> <span>Inventory</span></div>
            <div className="control-row"><kbd>M</kbd> <span>Map</span></div>
            <div className="control-row"><kbd>Esc</kbd> <span>Pause</span></div>
            <div className="control-row"><kbd>1</kbd>-<kbd>5</kbd> <span>Quick Slots</span></div>
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

        <button className="menu-btn primary" onClick={handleBack}>
          BACK
        </button>
      </div>
    </div>
  );
}
