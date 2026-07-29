import { useGameStore } from '../game/state/gameStore';
import { SaveManager } from '../game/saves/SaveManager';
import { formatTime } from '../utils/helpers';

export default function MainMenu() {
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);
  const hasSaves = SaveManager.hasAnySave();

  const handleNewGame = () => {
    resetGame();
    setScreen('newGame');
  };

  const handleContinue = () => {
    const saves = SaveManager.getAllSaves();
    const slots = Object.keys(saves).map(Number).sort((a, b) => (saves[b]?.timestamp || 0) - (saves[a]?.timestamp || 0));
    if (slots.length > 0) {
      // Load most recent save directly
      const data = SaveManager.load(slots[0]);
      if (data) {
        resetGame();
        setScreen('loading');
        // The loading screen will pick this up via a custom event
        window.dispatchEvent(new CustomEvent('load-save', { detail: { slot: slots[0] } }));
      }
    }
  };

  return (
    <div className="screen main-menu">
      <div className="menu-bg" />
      <div className="menu-content">
        <div className="menu-title-block">
          <h1 className="menu-title">ECHOES BELOW</h1>
          <p className="menu-subtitle">A Survival-Horror Experience</p>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={handleNewGame}>
            NEW GAME
          </button>

          {hasSaves && (
            <button className="menu-btn" onClick={handleContinue}>
              CONTINUE
            </button>
          )}

          <button className="menu-btn" onClick={() => setScreen('saveLoad')}>
            LOAD GAME
          </button>

          <button className="menu-btn" onClick={() => setScreen('settings')}>
            SETTINGS
          </button>

          <button className="menu-btn" onClick={() => setScreen('controls')}>
            CONTROLS
          </button>
        </div>

        <div className="menu-footer">
          <p>An original survival-horror game</p>
          <p className="menu-version">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
