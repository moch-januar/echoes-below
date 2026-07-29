import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MutableRefObject, PointerEvent } from 'react';
import type { InputManager } from '../game/systems/InputManager';
import { useGameStore } from '../game/state/gameStore';
import type { PlatformProfile } from './usePlatformProfile';

interface TouchControlsProps {
  inputRef: MutableRefObject<InputManager | null>;
  platform: PlatformProfile;
}

const ACTION_BUTTONS = [
  { action: 'interact', label: 'Interact', short: 'E' },
  { action: 'reload', label: 'Reload', short: 'R' },
  { action: 'heal', label: 'Heal', short: 'Q' },
  { action: 'run', label: 'Sprint', short: 'RUN' },
  { action: 'crouch', label: 'Crouch', short: 'C' },
] as const;

export default function TouchControls({ inputRef, platform }: TouchControlsProps) {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const settings = useGameStore((s) => s.settings);
  const [stick, setStick] = useState({ active: false, x: 0, y: 0 });
  const stickBase = useRef<HTMLDivElement>(null);
  const cameraPointer = useRef<{ id: number; x: number; y: number } | null>(null);

  const visible = screen === 'playing' && (platform.isTouchPreferred || settings.touchControlsEnabled);
  const leftHanded = settings.leftHandedTouch;
  const opacity = settings.touchOpacity;
  const scale = settings.touchScale;

  useEffect(() => {
    if (!visible) {
      inputRef.current?.setVirtualMovement(0, 0);
      inputRef.current?.clearVirtualInputs();
      setStick({ active: false, x: 0, y: 0 });
    }
  }, [inputRef, visible]);

  const rootStyle = useMemo(
    () => ({ '--touch-opacity': opacity, '--touch-scale': scale } as CSSProperties),
    [opacity, scale]
  );

  if (!visible) return null;

  const updateStick = (clientX: number, clientY: number) => {
    const base = stickBase.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.38;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const mag = Math.hypot(dx, dy);
    const nx = mag > max ? (dx / mag) * max : dx;
    const ny = mag > max ? (dy / mag) * max : dy;
    const vx = Math.max(-1, Math.min(1, dx / max));
    const vy = Math.max(-1, Math.min(1, dy / max));
    setStick({ active: true, x: nx, y: ny });
    inputRef.current?.setVirtualMovement(vx, vy);
  };

  const stopStick = () => {
    setStick({ active: false, x: 0, y: 0 });
    inputRef.current?.setVirtualMovement(0, 0);
  };

  const bindAction = (action: string, active: boolean) => {
    inputRef.current?.setVirtualAction(action, active);
  };

  const bindMouse = (button: number, active: boolean) => {
    inputRef.current?.setVirtualMouseButton(button, active);
  };

  const handleCameraDown = (e: PointerEvent<HTMLDivElement>) => {
    cameraPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCameraMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!cameraPointer.current || cameraPointer.current.id !== e.pointerId) return;
    const dx = e.clientX - cameraPointer.current.x;
    const dy = e.clientY - cameraPointer.current.y;
    cameraPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    inputRef.current?.addVirtualAimDelta(dx * settings.touchLookSensitivity, dy * settings.touchLookSensitivity);
  };

  const handleCameraUp = (e: PointerEvent<HTMLDivElement>) => {
    if (cameraPointer.current?.id === e.pointerId) cameraPointer.current = null;
  };

  return (
    <div className={`touch-controls ${leftHanded ? 'left-handed' : ''}`} style={rootStyle}>
      <div
        className="touch-camera-pad"
        aria-label="Swipe camera area"
        onPointerDown={handleCameraDown}
        onPointerMove={handleCameraMove}
        onPointerUp={handleCameraUp}
        onPointerCancel={handleCameraUp}
      />

      <div
        ref={stickBase}
        className={`touch-joystick ${stick.active ? 'active' : ''}`}
        aria-label="Virtual movement joystick"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => updateStick(e.clientX, e.clientY)}
        onPointerUp={stopStick}
        onPointerCancel={stopStick}
      >
        <div className="touch-joystick-ring" />
        <div
          className="touch-joystick-thumb"
          style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }}
        />
      </div>

      <div className="touch-action-cluster primary-actions">
        <button
          className="touch-btn fire"
          aria-label="Fire weapon"
          onPointerDown={() => bindMouse(0, true)}
          onPointerUp={() => bindMouse(0, false)}
          onPointerCancel={() => bindMouse(0, false)}
        >
          FIRE
        </button>
        <button
          className="touch-btn aim"
          aria-label="Aim weapon"
          onPointerDown={() => bindMouse(2, true)}
          onPointerUp={() => bindMouse(2, false)}
          onPointerCancel={() => bindMouse(2, false)}
        >
          AIM
        </button>
      </div>

      <div className="touch-action-cluster secondary-actions">
        {ACTION_BUTTONS.map((button) => (
          <button
            key={button.action}
            className={`touch-btn ${button.action}`}
            aria-label={button.label}
            onPointerDown={() => bindAction(button.action, true)}
            onPointerUp={() => bindAction(button.action, false)}
            onPointerCancel={() => bindAction(button.action, false)}
          >
            {button.short}
          </button>
        ))}
      </div>

      <div className="touch-menu-strip">
        <button className="touch-chip" onClick={() => setScreen('inventory')}>Inventory</button>
        <button className="touch-chip" onClick={() => setScreen('map')}>Map</button>
        <button className="touch-chip" onClick={() => setScreen('pause')}>Pause</button>
      </div>
    </div>
  );
}
