import { useGameStore } from '../game/state/gameStore';

export default function DeathScreen() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);

  if (screen !== 'death') return null;

  const handleContinue = () => {
    // Load last save
    const saves = localStorage.getItem('echoes-below-save');
    if (saves) {
      try {
        const data = JSON.parse(saves);
        const slots = Object.keys(data).map(Number);
        if (slots.length > 0) {
          const lastSlot = Math.max(...slots);
          resetGame();
          setScreen('loading');
          window.dispatchEvent(new CustomEvent('load-save', { detail: { slot: lastSlot } }));
          return;
        }
      } catch {}
    }
    // No save found
    resetGame();
    setScreen('title');
  };

  const handleQuit = () => {
    resetGame();
    setScreen('title');
  };

  return (
    <div className="screen death-screen screen-overlay">
      <div className="death-content">
        <div className="death-overlay-bg" />

        <div className="death-text-block">
          <h1 className="death-title">YOU DIED</h1>
          <p className="death-subtitle">The facility claims another soul...</p>

          <div className="death-stats">
            <p>The organism spreads. Your consciousness fades.</p>
            <p className="death-hint">There may be a save you can return to.</p>
          </div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={handleContinue}>
            LOAD LAST SAVE
          </button>
          <button className="menu-btn" onClick={handleQuit}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
