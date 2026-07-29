import { useGameStore } from '../game/state/gameStore';
import { SaveManager } from '../game/saves/SaveManager';

interface PauseMenuProps {
  onQuit: () => void;
}

export default function PauseMenu({ onQuit }: PauseMenuProps) {
  const setScreen = useGameStore((s) => s.setScreen);
  const screen = useGameStore((s) => s.screen);

  if (screen !== 'pause') return null;

  const handleResume = () => {
    setScreen('playing');
    // Lock pointer back
    const canvas = document.querySelector('canvas');
    if (canvas && window.matchMedia('(pointer: fine)').matches) canvas.requestPointerLock();
  };

  const handleSave = () => {
    setScreen('saveLoad');
  };

  const handleSettings = () => {
    setScreen('settings');
  };

  const handleQuit = () => {
    if (window.confirm('Quit to main menu? Unsaved progress will be lost.')) {
      onQuit();
    }
  };

  return (
    <div className="screen pause-menu screen-overlay">
      <div className="pause-content">
        <h2 className="pause-title">PAUSED</h2>

        <div className="menu-buttons">
          <button className="menu-btn primary" onClick={handleResume}>
            RESUME
          </button>
          <button className="menu-btn" onClick={handleSave}>
            SAVE GAME
          </button>
          <button className="menu-btn" onClick={handleSettings}>
            SETTINGS
          </button>
          <button className="menu-btn" onClick={() => setScreen('controls')}>
            CONTROLS
          </button>
          <button className="menu-btn danger" onClick={handleQuit}>
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
