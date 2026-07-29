import { useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import type { Screen } from '../game/state/gameStore';
import { SaveManager } from '../game/saves/SaveManager';
import { formatTime } from '../utils/helpers';

interface SaveLoadScreenProps {
  onLoadSave: (slot: number) => void;
  onSave: (slot: number) => void;
  currentRoomId: string;
  gameReady: boolean;
  returnScreen: Screen;
}

export default function SaveLoadScreen({ onLoadSave, onSave, currentRoomId, gameReady, returnScreen }: SaveLoadScreenProps) {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const [message, setMessage] = useState<string | null>(null);

  if (screen !== 'saveLoad') return null;

  const allSaves = SaveManager.getAllSaves();
  const slots = [0, 1, 2];

  const isSafeRoom = ROOM_IS_SAFE[currentRoomId] === true;
  const canSave = gameReady && isSafeRoom;

  const handleSave = (slot: number) => {
    if (!canSave) {
      setMessage('You can only save in safe rooms. Find the save terminal.');
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const existing = allSaves[slot];
    if (existing && !window.confirm(`Overwrite save in slot ${slot + 1}? (Played: ${formatTime(existing.playTime)})`)) {
      return;
    }

    onSave(slot);
    setMessage(`✓ Saved to slot ${slot + 1}`);
    setTimeout(() => setMessage(null), 1500);
  };

  const handleLoad = (slot: number) => {
    const data = allSaves[slot];
    if (!data) return;

    if (gameReady && !window.confirm('Load game? Unsaved progress will be lost.')) return;

    onLoadSave(slot);
    setScreen('loading');
    window.dispatchEvent(new CustomEvent('load-save', { detail: { slot } }));
  };

  const handleDelete = (slot: number) => {
    if (window.confirm(`Delete save in slot ${slot + 1}?`)) {
      SaveManager.deleteSave(slot);
      setMessage('✓ Save deleted');
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const handleClose = () => {
    setScreen(returnScreen);
  };

  return (
    <div className="screen save-load-screen screen-overlay">
      <div className="save-load-content">
        <h2>{gameReady ? 'SAVE / LOAD GAME' : 'LOAD GAME'}</h2>

        {gameReady && !isSafeRoom && (
          <p className="save-message warning">Manual saving is available only at safe-room terminals.</p>
        )}

        {message && <p className="save-message">{message}</p>}

        <div className="save-slots">
          {slots.map((slot) => {
            const data = allSaves[slot];
            return (
              <div key={slot} className={`save-slot ${data ? 'has-data' : 'empty'}`}>
                <div className="save-slot-header">
                  <span className="save-slot-number">SLOT {slot + 1}</span>
                  {data && (
                    <span className="save-slot-time">
                      {new Date(data.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>

                {data ? (
                  <div className="save-slot-data">
                    <p>Play Time: {formatTime(data.playTime)}</p>
                    <p>Location: {data.currentRoom}</p>
                    <p>Objective: {data.objective}</p>
                    <div className="save-slot-actions">
                      {gameReady && (
                        <button className="btn-action" onClick={() => handleSave(slot)}>
                          Overwrite
                        </button>
                      )}
                      <button className="btn-action primary" onClick={() => handleLoad(slot)}>
                        Load
                      </button>
                      <button className="btn-action danger" onClick={() => handleDelete(slot)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="save-slot-empty">
                    <p>Empty slot</p>
                    {gameReady && (
                      <button
                        className="btn-action"
                        onClick={() => handleSave(slot)}
                        disabled={!canSave}
                        title={!isSafeRoom ? 'Must be in safe room' : ''}
                      >
                        Save Here
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="menu-btn" onClick={handleClose}>
          BACK
        </button>
      </div>
    </div>
  );
}

const ROOM_IS_SAFE: Record<string, boolean> = {
  saferoom: true,
};
