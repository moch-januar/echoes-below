import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './GameEngine';
import { InputManager } from './systems/InputManager';

interface GameViewProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  inputRef: React.MutableRefObject<InputManager | null>;
  onReady?: () => void | Promise<void>;
}

export default function GameView({ engineRef, inputRef, onReady }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = useCallback(() => {
    // Lock pointer on click for mouse look
    if (canvasRef.current && canvasRef.current !== document.pointerLockElement && window.matchMedia('(pointer: fine)').matches) {
      canvasRef.current.requestPointerLock();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    inputRef.current = engine.getInput();

    void (async () => {
      await engine.init();
      if (cancelled) {
        engine.destroy();
        return;
      }
      await onReady?.();
      if (cancelled) {
        engine.destroy();
        return;
      }
      engine.start();
    })();

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      engine.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair',
        background: '#000',
        touchAction: 'none',
      }}
    />
  );
}
