import { useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { SaveManager } from '../game/saves/SaveManager';
import type { SaveData } from '../game/saves/SaveManager';
import { formatTime } from '../utils/helpers';

interface SaveLoadScreenProps {
  onLoadSave: (slot: number) => void;
  onSave: (slot: number) => void;
  currentRoomId: string;
  fromPause?: boolean;
}

export default function SaveLoadScreen({ onLoadSave, onSave, currentRoomId, fromPause }: SaveLoadScreenProps) {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const flags = useGameStore((s) => s.flags);
  const [message, setMessage] = useState<string | null>(null);

  if (screen !== 'saveLoad') return null;

  const allSaves = SaveManager.getAllSaves();
  const slots = [0, 1, 2];

  const isSafeRoom = fromPause || ROOM_IS_SAFE[currentRoomId];

  const handleSave = (slot: number) => {
    if (!isSafeRoom && !fromPause) {
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

    if (fromPause && !window.confirm('Load game? Unsaved progress will be lost.')) return;

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
    setScreen(fromPause ? 'pause' : 'playing');
  };

  return (
    <div className="screen save-load-screen screen-overlay">
      <div className="save-load-content">
        <h2>{fromPause ? 'SAVE / LOAD GAME' : 'LOAD GAME'}</h2>

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
                      {fromPause && (
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
                    {fromPause && (
                      <button
                        className="btn-action"
                        onClick={() => handleSave(slot)}
                        disabled={!isSafeRoom}
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
