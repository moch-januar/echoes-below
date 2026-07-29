import { useGameStore } from '../game/state/gameStore';
import { useInventoryStore, ITEM_TEMPLATES } from '../game/state/inventoryStore';

export default function HUD() {
  const player = useGameStore((s) => s.player);
  const screen = useGameStore((s) => s.screen);
  const ammo = useGameStore((s) => s.ammo);
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);
  const subtitleText = useGameStore((s) => s.subtitleText);
  const currentObjective = useGameStore((s) => s.currentObjective);
  const currentDocument = useGameStore((s) => s.currentDocument);

  const equippedWeapon = useInventoryStore((s) => s.equippedWeapon);
  const equippedItem = equippedWeapon ? useInventoryStore((s) => s.getItem(equippedWeapon)) : null;

  if (screen !== 'playing') return null;

  const healthPercent = (player.health / player.maxHealth) * 100;
  const healthColor = healthPercent > 50 ? '#4a4' : healthPercent > 25 ? '#aa4' : '#a44';

  return (
    <div className="hud">
      {/* Health */}
      <div className="hud-health">
        <div className="hud-health-bar">
          <div
            className="hud-health-fill"
            style={{
              width: `${healthPercent}%`,
              background: healthColor,
            }}
          />
        </div>
        <span className="hud-health-text" style={{ color: healthColor }}>
          {player.healthState.toUpperCase()}
        </span>
      </div>

      {/* Ammo */}
      {equippedItem && (
        <div className="hud-ammo">
          <span className="hud-ammo-count">
            {equippedItem.templateId === 'pistol' ? ammo.pistol : ammo.flaregun}
          </span>
          <span className="hud-ammo-max">
            /{equippedItem.templateId === 'pistol' ? '12' : '1'}
          </span>
          <span className="hud-ammo-icon">
            {ITEM_TEMPLATES[equippedItem.templateId]?.icon}
          </span>
        </div>
      )}

      {/* Interaction Prompt */}
      {interactionPrompt && (
        <div className="hud-interaction">
          {interactionPrompt}
        </div>
      )}

      {/* Subtitles */}
      {subtitleText && (
        <div className="hud-subtitle">
          {subtitleText}
        </div>
      )}

      {/* Objective */}
      <div className="hud-objective">
        {currentObjective}
      </div>

      {/* Crosshair */}
      <div className="hud-crosshair">
        <div className="crosshair-h" />
        <div className="crosshair-v" />
        <div className="crosshair-dot" />
      </div>

      {/* Controls hint */}
      <div className="hud-hints">
        WASD: Move | Shift: Run | Ctrl: Crouch | E: Interact | R: Reload
      </div>
    </div>
  );
}
