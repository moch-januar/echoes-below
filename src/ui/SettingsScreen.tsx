import { useRef } from 'react';
import { useGameStore } from '../game/state/gameStore';
import type { RendererMode } from '../game/state/gameStore';
import { useMenuKeyboardNavigation } from './useMenuKeyboardNavigation';

export default function SettingsScreen() {
  const settingsRef = useRef<HTMLDivElement>(null);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const prevScreen = useGameStore((s) => s.prevScreen);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  useMenuKeyboardNavigation(settingsRef, screen === 'settings');

  if (screen !== 'settings') return null;

  const handleBack = () => {
    setScreen(prevScreen === 'pause' ? 'pause' : prevScreen === 'playing' ? 'playing' : 'title');
  };

  return (
    <div className="screen settings-screen screen-overlay">
      <div className="settings-content" ref={settingsRef}>
        <h2>SETTINGS</h2>

        <div className="settings-group">
          <h3>Audio</h3>
          <div className="setting-row">
            <label>Master Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.masterVolume * 100)}
              onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) / 100 })}
            />
            <span>{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          <div className="setting-row">
            <label>Music Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) / 100 })}
            />
            <span>{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <div className="setting-row">
            <label>SFX Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) / 100 })}
            />
            <span>{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
        </div>

        <div className="settings-group">
          <h3>Display</h3>
          <div className="setting-row">
            <label>Quality Preset</label>
            <select
              value={settings.qualityPreset}
              onChange={(e) => updateSettings({ qualityPreset: e.target.value as 'low' | 'medium' | 'high' })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Renderer</label>
            <select
              value={settings.rendererMode}
              onChange={(e) => updateSettings({ rendererMode: e.target.value as RendererMode })}
            >
              <option value="auto">Auto (3D with fallback)</option>
              <option value="3d">Prefer 3D</option>
              <option value="2d">Legacy 2D</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Reduced Flashing</label>
            <input
              type="checkbox"
              checked={settings.reducedFlashing}
              onChange={(e) => updateSettings({ reducedFlashing: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Camera Shake</label>
            <input
              type="checkbox"
              checked={settings.cameraShakeEnabled}
              onChange={(e) => updateSettings({ cameraShakeEnabled: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Reduced Motion</label>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>High Contrast</label>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Color-Blind Mode</label>
            <select
              value={settings.colorBlindMode}
              onChange={(e) => updateSettings({ colorBlindMode: e.target.value as typeof settings.colorBlindMode })}
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </div>
        </div>

        <div className="settings-group">
          <h3>Accessibility</h3>
          <div className="setting-row">
            <label>Subtitles</label>
            <input
              type="checkbox"
              checked={settings.subtitlesEnabled}
              onChange={(e) => updateSettings({ subtitlesEnabled: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Subtitle Size</label>
            <select
              value={settings.subtitleSize}
              onChange={(e) => updateSettings({ subtitleSize: e.target.value as 'small' | 'medium' | 'large' })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Hold to Aim</label>
            <input
              type="checkbox"
              checked={settings.holdAim}
              onChange={(e) => updateSettings({ holdAim: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Hold to Sprint</label>
            <input
              type="checkbox"
              checked={settings.holdSprint}
              onChange={(e) => updateSettings({ holdSprint: e.target.checked })}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>HUD</h3>
          <div className="setting-row">
            <label>HUD Scale: {settings.hudScale.toFixed(1)}x</label>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={settings.hudScale}
              onChange={(e) => updateSettings({ hudScale: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label>Auto-hide HUD</label>
            <input
              type="checkbox"
              checked={settings.hudAutoHide}
              onChange={(e) => updateSettings({ hudAutoHide: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Immersive HUD</label>
            <input
              type="checkbox"
              checked={settings.immersiveHud}
              onChange={(e) => updateSettings({ immersiveHud: e.target.checked })}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Touch / Controller</h3>
          <div className="setting-row">
            <label>Force Touch Controls</label>
            <input
              type="checkbox"
              checked={settings.touchControlsEnabled}
              onChange={(e) => updateSettings({ touchControlsEnabled: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Left-Handed Touch Layout</label>
            <input
              type="checkbox"
              checked={settings.leftHandedTouch}
              onChange={(e) => updateSettings({ leftHandedTouch: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <label>Touch Opacity: {Math.round(settings.touchOpacity * 100)}%</label>
            <input
              type="range"
              min="0.35"
              max="1"
              step="0.05"
              value={settings.touchOpacity}
              onChange={(e) => updateSettings({ touchOpacity: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label>Touch Scale: {settings.touchScale.toFixed(1)}x</label>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={settings.touchScale}
              onChange={(e) => updateSettings({ touchScale: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label>Look Sensitivity: {settings.touchLookSensitivity.toFixed(1)}x</label>
            <input
              type="range"
              min="0.3"
              max="1.8"
              step="0.1"
              value={settings.touchLookSensitivity}
              onChange={(e) => updateSettings({ touchLookSensitivity: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label>Controller Dead Zone: {settings.gamepadDeadZone.toFixed(2)}</label>
            <input
              type="range"
              min="0.05"
              max="0.35"
              step="0.01"
              value={settings.gamepadDeadZone}
              onChange={(e) => updateSettings({ gamepadDeadZone: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Mouse</h3>
          <div className="setting-row">
            <label>Sensitivity: {settings.mouseSensitivity.toFixed(1)}x</label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) => updateSettings({ mouseSensitivity: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label>Invert Y-Axis</label>
            <input
              type="checkbox"
              checked={settings.invertY}
              onChange={(e) => updateSettings({ invertY: e.target.checked })}
            />
          </div>
        </div>

        <button className="menu-btn primary" onClick={handleBack}>
          BACK
        </button>
      </div>
    </div>
  );
}
