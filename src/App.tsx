import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './game/state/gameStore';
import { useInventoryStore } from './game/state/inventoryStore';
import { GameEngine } from './game/GameEngine';
import { InputManager } from './game/systems/InputManager';
import { SaveManager } from './game/saves/SaveManager';
import type { SaveData } from './game/saves/SaveManager';

import GameView from './game/GameView';
import MainMenu from './ui/MainMenu';
import LoadingScreen from './ui/LoadingScreen';
import HUD from './ui/HUD';
import PauseMenu from './ui/PauseMenu';
import InventoryScreen from './ui/InventoryScreen';
import MapScreen from './ui/MapScreen';
import DocumentViewer from './ui/DocumentViewer';
import SaveLoadScreen from './ui/SaveLoadScreen';
import SettingsScreen from './ui/SettingsScreen';
import ControlsScreen from './ui/ControlsScreen';
import DeathScreen from './ui/DeathScreen';
import EndingScreen from './ui/EndingScreen';

import './styles.css';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);

  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState('intake');
  const [loadingSave, setLoadingSave] = useState<number | null>(null);

  // ── Loading completion ────────────────────────────────────────────────────
  const handleLoadingComplete = useCallback(() => {
    setGameReady(true);
    setScreen('playing');
    // Lock pointer
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) canvas.requestPointerLock();
    }, 200);
  }, [setScreen]);

  // ── New game ──────────────────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    resetGame();
    setScreen('loading');
    setLoadingSave(null);
  }, [resetGame, setScreen]);

  // ── Save/Load callbacks ──────────────────────────────────────────────────
  const handleSave = useCallback((slot: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const data = engine.createSaveData();
    const success = SaveManager.save(slot, data);
    if (success) {
      setScreen('saveLoad');
    }
  }, []);

  const handleLoadSave = useCallback((slot: number) => {
    setLoadingSave(slot);
    setScreen('loading');
  }, []);

  // ── Quit to menu ─────────────────────────────────────────────────────────
  const handleQuit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (inputRef.current) {
      inputRef.current = null;
    }
    setGameReady(false);
    resetGame();
    setScreen('title');
  }, [resetGame, setScreen]);

  // ── Listen for load-save events from other components ─────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.slot !== undefined) {
        setLoadingSave(detail.slot);
      }
    };
    window.addEventListener('load-save', handler);
    return () => window.removeEventListener('load-save', handler);
  }, []);

  // ── Background polling for room ID ────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing') return;
    const interval = setInterval(() => {
      if (engineRef.current) {
        setCurrentRoomId(engineRef.current.getCurrentRoomId());
      }
    }, 500);
    return () => clearInterval(interval);
  }, [screen]);

  return (
    <div className="app">
      {/* Game Canvas — always mounted when playing/loading */}
      {(screen === 'playing' || screen === 'loading' || screen === 'pause' ||
        screen === 'inventory' || screen === 'map' || screen === 'document' ||
        screen === 'saveLoad' || screen === 'death' || screen === 'ending') && (
        <div className="game-layer">
          <GameView
            engineRef={engineRef}
            inputRef={inputRef}
            onReady={() => {
              // If loading from save, init with save data
              if (loadingSave !== null) {
                const data = SaveManager.load(loadingSave);
                if (data && engineRef.current) {
                  engineRef.current.init(data);
                }
                setLoadingSave(null);
              }
            }}
          />
        </div>
      )}

      {/* Screens */}
      {screen === 'title' && !gameReady && <MainMenu />}

      {screen === 'newGame' && !gameReady && (
        <div className="screen new-game screen-overlay">
          <div className="new-game-content">
            <h2>NEW GAME</h2>
            <div className="story-intro">
              <p className="intro-text">
                The emergency lights flicker. A metallic taste hangs in the air.
              </p>
              <p className="intro-text">
                You are Mara Vey, a systems engineer assigned to the Kestrel Biomedical Research Station — a classified facility built beneath the coastal city of Anson's Reach.
              </p>
              <p className="intro-text">
                Your transport crashed on approach. The facility has lost main power. The emergency doors are sealed. And you're not alone down here.
              </p>
              <p className="intro-text dim">
                Find power. Uncover the truth. Escape the depths.
              </p>
            </div>
            <button className="menu-btn primary" onClick={handleNewGame}>
              BEGIN
            </button>
            <button className="menu-btn" onClick={() => setScreen('title')}>
              BACK
            </button>
          </div>
        </div>
      )}

      {screen === 'loading' && !gameReady && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {/* Playing HUD and overlays */}
      {gameReady && (
        <>
          {screen === 'playing' && <HUD />}
          {screen === 'pause' && <HUD />}
          <PauseMenu onQuit={handleQuit} />
          <InventoryScreen />
          <MapScreen currentRoomId={currentRoomId} />
          <DocumentViewer />
          <SaveLoadScreen
            onLoadSave={handleLoadSave}
            onSave={handleSave}
            currentRoomId={currentRoomId}
            fromPause={screen === 'pause' || screen === 'saveLoad'}
          />
          <DeathScreen />
          <EndingScreen />
        </>
      )}

      {/* Settings & Controls (available from menus before game starts) */}
      {!gameReady && (
        <>
          <SettingsScreen />
          <ControlsScreen />
        </>
      )}
    </div>
  );
}
