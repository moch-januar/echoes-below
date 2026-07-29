import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './GameEngine';
import { InputManager } from './systems/InputManager';

interface GameViewProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  inputRef: React.MutableRefObject<InputManager | null>;
  onReady?: () => void;
}

export default function GameView({ engineRef, inputRef, onReady }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasClick = useCallback(() => {
    // Lock pointer on click for mouse look
    if (canvasRef.current && canvasRef.current !== document.pointerLockElement) {
      canvasRef.current.requestPointerLock();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    inputRef.current = engine.getInput();

    engine.init();
    engine.start();
    onReady?.();

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
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
      }}
    />
  );
}
