import { useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const loadingProgress = useGameStore((s) => s.loadingProgress);
  const loadingMessage = useGameStore((s) => s.loadingMessage);

  useEffect(() => {
    // Simulate loading
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
      useGameStore.getState().setLoading(
        Math.min(progress, 100),
        progress < 30 ? 'Initializing systems...' :
        progress < 60 ? 'Loading facility map...' :
        progress < 85 ? 'Preparing entities...' :
        'Ready.'
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="screen loading-screen">
      <div className="loading-content">
        <h2 className="loading-title">ECHOES BELOW</h2>
        <div className="loading-bar-container">
          <div
            className="loading-bar-fill"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="loading-text">{loadingMessage}</p>
        <p className="loading-hint">Something stirs in the dark...</p>
      </div>
    </div>
  );
}
