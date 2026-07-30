import { useGameStore } from '../game/state/gameStore';
import { useInventoryStore, ITEM_TEMPLATES } from '../game/state/inventoryStore';
import { formatKeyCode } from '../game/systems/inputBindings';

export default function HUD() {
  const player = useGameStore((s) => s.player);
  const screen = useGameStore((s) => s.screen);
  const ammo = useGameStore((s) => s.ammo);
  const reserveAmmo = useGameStore((s) => s.reserveAmmo);
  const interactionPrompt = useGameStore((s) => s.interactionPrompt);
  const subtitleText = useGameStore((s) => s.subtitleText);
  const currentObjective = useGameStore((s) => s.currentObjective);
  const settings = useGameStore((s) => s.settings);
  const activeInputMethod = useGameStore((s) => s.activeInputMethod);
  const rendererActive = useGameStore((s) => s.rendererActive);

  const equippedWeapon = useInventoryStore((s) => s.equippedWeapon);
  const items = useInventoryStore((s) => s.items);
  const equippedItem = equippedWeapon ? items.find((item) => item.id === equippedWeapon) : null;
  const quickItems = items.slice(0, 4);

  if (screen !== 'playing') return null;

  const healthPercent = (player.health / player.maxHealth) * 100;
  const healthStateClass = healthPercent > 50 ? 'fine' : healthPercent > 25 ? 'injured' : 'critical';
  const weaponType = equippedItem?.templateId === 'flaregun' ? 'flaregun' : 'pistol';
  const weaponTemplate = equippedItem ? ITEM_TEMPLATES[equippedItem.templateId] : null;
  const subtitleClass = `subtitle-${settings.subtitleSize}`;
  const promptMatch = interactionPrompt?.match(/^\[([^\]]+)\]\s*(.*)$/);
  const promptKey = promptMatch?.[1] ?? 'E';
  const promptText = promptMatch?.[2] ?? interactionPrompt;
  const inputHint = activeInputMethod === 'gamepad'
    ? 'Left Stick Move · Right Stick Aim · RT Fire · LT Aim · A Interact · Menu Pause'
    : activeInputMethod === 'touch'
      ? 'Stick Move · Swipe Look · FIRE/AIM Buttons · Tap Inventory/Map/Pause'
      : `${formatKeyCode(settings.keyBindings.moveUp[0])}/${formatKeyCode(settings.keyBindings.moveLeft[0])}/${formatKeyCode(settings.keyBindings.moveDown[0])}/${formatKeyCode(settings.keyBindings.moveRight[0])} Move · Mouse Aim · ${formatKeyCode(settings.keyBindings.interact[0])} Interact · ${formatKeyCode(settings.keyBindings.inventory[0])} Inventory · ${formatKeyCode(settings.keyBindings.map[0])} Map · ${formatKeyCode(settings.keyBindings.pause[0])} Pause`;

  return (
    <div className={`hud hud-modern ${settings.hudAutoHide ? 'auto-hide' : ''} ${settings.immersiveHud ? 'immersive' : ''}`}>
      <section className={`hud-panel hud-vitals ${healthStateClass}`} aria-label="Player status">
        <div className="hud-panel-label">MARA VEY</div>
        <div className="hud-health-row">
          <span className="hud-status-text">{player.healthState.toUpperCase()}</span>
          <span className="hud-health-number">{Math.round(player.health)} / {player.maxHealth}</span>
        </div>
        <div className="hud-health-bar">
          <div className="hud-health-fill" style={{ width: `${healthPercent}%` }} />
        </div>
        <div className="hud-condition-row">
          <span>Infection {Math.round(player.infected)}%</span>
          <span>{player.isCrouching ? 'Crouched' : player.isRunning ? 'Sprinting' : 'Steady'}</span>
        </div>
      </section>

      <section className="hud-panel hud-weapon" aria-label="Equipped weapon">
        <div className="hud-panel-label">WEAPON</div>
        {equippedItem && weaponTemplate ? (
          <>
            <div className="hud-weapon-main">
              <span className="hud-weapon-icon">{weaponTemplate.icon}</span>
              <span className="hud-weapon-name">{weaponTemplate.name}</span>
            </div>
            <div className="hud-ammo-readout">
              <span className="hud-ammo-count">{ammo[weaponType] ?? 0}</span>
              <span className="hud-ammo-max">/ {weaponType === 'pistol' ? 12 : 1}</span>
              <span className="hud-ammo-reserve">Reserve {reserveAmmo[weaponType] ?? 0}</span>
            </div>
          </>
        ) : (
          <div className="hud-weapon-empty">No weapon equipped</div>
        )}
      </section>

      <section className="hud-panel hud-objective" aria-label="Current objective">
        <div className="hud-panel-label">OBJECTIVE</div>
        <p>{currentObjective}</p>
      </section>

      <section className="hud-quickslots" aria-label="Inventory shortcuts">
        {quickItems.map((item, index) => {
          const template = ITEM_TEMPLATES[item.templateId];
          return (
            <div key={item.id} className={`hud-quickslot ${equippedWeapon === item.id ? 'equipped' : ''}`}>
              <span className="quickslot-key">{index + 1}</span>
              <span className="quickslot-icon">{template?.icon ?? '?'}</span>
              {item.quantity > 1 && <span className="quickslot-count">{item.quantity}</span>}
            </div>
          );
        })}
      </section>

      {interactionPrompt && (
        <div className="hud-interaction modern-prompt">
          <span className="prompt-key">{promptKey}</span>
          <span>{promptText}</span>
        </div>
      )}

      {subtitleText && settings.subtitlesEnabled && (
        <div className={`hud-subtitle ${subtitleClass}`}>{subtitleText}</div>
      )}

      <div className="hud-crosshair">
        <div className="crosshair-h" />
        <div className="crosshair-v" />
        <div className="crosshair-dot" />
      </div>

      <div className="hud-hints input-hints">
        {inputHint}
      </div>

      {/* Diagnostic: show current renderer mode */}
      <div style={{
        position: 'absolute', bottom: 4, right: 4,
        fontSize: 10, color: 'rgba(100,100,100,0.4)',
        fontFamily: 'monospace', pointerEvents: 'none',
        zIndex: 999,
      }}>
        RENDERER: {rendererActive.toUpperCase()} (set: {settings.rendererMode.toUpperCase()})
      </div>
    </div>
  );
}
