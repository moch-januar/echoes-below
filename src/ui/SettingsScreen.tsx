import { useGameStore } from '../game/state/gameStore';
import type { RendererMode } from '../game/state/gameStore';

export default function SettingsScreen() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  if (screen !== 'settings') return null;

  const handleBack = () => {
    setScreen('title');
  };

  return (
    <div className="screen settings-screen screen-overlay">
      <div className="settings-content">
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
