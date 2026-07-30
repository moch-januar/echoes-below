import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useGameStore } from './game/state/gameStore';
import type { Screen } from './game/state/gameStore';
import { GameEngine } from './game/GameEngine';
import { InputManager } from './game/systems/InputManager';
import { SaveManager } from './game/saves/SaveManager';
import { loadStoredSettings } from './game/state/settingsPersistence';

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
import TouchControls from './ui/TouchControls';
import { usePlatformProfile } from './ui/usePlatformProfile';

import './styles.css';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const prevScreen = useGameStore((s) => s.prevScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const settings = useGameStore((s) => s.settings);
  const platform = usePlatformProfile();

  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState('intake');
  const [loadingSave, setLoadingSave] = useState<number | null>(null);

  useEffect(() => {
    const storedSettings = loadStoredSettings();
    if (storedSettings) updateSettings(storedSettings);
  }, [updateSettings]);

  // ── Loading completion ────────────────────────────────────────────────────
  const handleLoadingComplete = useCallback(() => {
    setGameReady(true);
    setScreen('playing');
    // Lock pointer
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas && window.matchMedia('(pointer: fine)').matches) canvas.requestPointerLock();
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

  useEffect(() => {
    if (loadingSave === null || !engineRef.current) return;
    const data = SaveManager.load(loadingSave);
    if (data) {
      engineRef.current.init(data);
      setGameReady(true);
      setScreen('playing');
    } else {
      setScreen(gameReady ? 'pause' : 'title');
    }
    setLoadingSave(null);
  }, [gameReady, loadingSave, setScreen]);

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
    <div
      className={`app ${platform.safeAreaClass} ${platform.isTouchPreferred ? 'input-touch' : 'input-desktop'} ${settings.highContrast ? 'access-high-contrast' : ''} ${settings.reducedMotion ? 'access-reduced-motion' : ''} colorblind-${settings.colorBlindMode}`}
      style={{ '--hud-scale': settings.hudScale } as CSSProperties}
    >
      {/* Game Canvas — always mounted when playing/loading */}
      {(screen === 'loading' || (gameReady && (
        screen === 'playing' || screen === 'pause' || screen === 'inventory' ||
        screen === 'map' || screen === 'document' || screen === 'saveLoad' ||
        screen === 'settings' || screen === 'controls' ||
        screen === 'death' || screen === 'ending'
      ))) && (
        <div className="game-layer">
          <GameView
            engineRef={engineRef}
            inputRef={inputRef}
            onReady={async () => {
              // If loading from save, init with save data
              if (loadingSave !== null) {
                const data = SaveManager.load(loadingSave);
                if (data && engineRef.current) {
                  await engineRef.current.init(data);
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
          <TouchControls inputRef={inputRef} platform={platform} />
          <PauseMenu onQuit={handleQuit} />
          <InventoryScreen />
          <MapScreen currentRoomId={currentRoomId} />
          <DocumentViewer />
          <DeathScreen />
          <EndingScreen />
        </>
      )}

      <SaveLoadScreen
        onLoadSave={handleLoadSave}
        onSave={handleSave}
        currentRoomId={currentRoomId}
        gameReady={gameReady}
        returnScreen={(prevScreen === 'pause' ? 'pause' : gameReady ? 'playing' : 'title') as Screen}
      />
      <SettingsScreen />
      <ControlsScreen />
    </div>
  );
}
