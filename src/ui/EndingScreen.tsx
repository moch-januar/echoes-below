import { useGameStore } from '../game/state/gameStore';

export default function EndingScreen() {
  const currentEnding = useGameStore((s) => s.currentEnding);
  const screen = useGameStore((s) => s.screen);
  const gameTime = useGameStore((s) => s.gameTime);
  const documents = useGameStore((s) => s.documents);
  const endingFlags = useGameStore((s) => s.endingFlags);
  const setScreen = useGameStore((s) => s.setScreen);
  const resetGame = useGameStore((s) => s.resetGame);

  if (screen !== 'ending') return null;

  const endings: Record<string, { title: string; description: string; color: string }> = {
    escape: {
      title: 'ENDING: MERE SURVIVAL',
      description: `You escaped the facility with your life, but the research — and the truth — remain buried beneath the coastal city. The sterilization sequence completed behind you, incinerating all evidence of the organism and the station's dark secrets.

The surface is cold and quiet. You stand alone at the edge of the access shaft, watching steam rise from the vents below.

Somewhere in the dark, you wonder: was the organism truly destroyed? Or did it simply retreat deeper?

You survived. But the answers you sought remain in the depths.

Time survived: ${Math.floor(gameTime / 60)} minutes. Documents found: ${documents.length}.`,
      color: '#6a8a6a',
    },
    research: {
      title: 'ENDING: RESEARCH PRESERVED',
      description: `You escaped with Dr. Rook's research data. The organism's secrets are now in your hands.

The sterilization sequence initiated, but the data you recovered contains years of research into neural interface technology. The potential for medicine is extraordinary.

But as you watch the facility burn from the surface, you can't shake the feeling that you've brought something with you. The organism's communication logs suggest it was aware. It knew someone would try to preserve its legacy.

The research may save lives. Or it may doom humanity to repeat the same mistakes.

The choice of what to do with this knowledge... is yours.

Time survived: ${Math.floor(gameTime / 60)} minutes. Documents found: ${documents.length}.`,
      color: '#8a8a6a',
    },
    secret: {
      title: 'ENDING: THE FULL PICTURE',
      description: `You found every document. You know the complete truth.

The organism was not a monster. It was a messenger.

Dr. Rook's final logs reveal that the organism was attempting communication — not conquest. The Hollow subjects were not weapons, but relay points for a consciousness trying to bridge the gap between species.

The Warden AI knew this. That's why it tried to destroy everything. Not to protect humanity, but to protect the research program's secrets.

You stand on the surface with all the evidence. The organism's signals continue to echo through the facility's data network.

What will you tell the world?

The truth? Or a comfortable lie?

SOME TRUTHS ARE BETTER LEFT BURIED. OTHERS DEMAND TO BE HEARD.

Time survived: ${Math.floor(gameTime / 60)} minutes. All ${documents.length} documents collected.`,
      color: '#8a6a8a',
    },
    sterilization: {
      title: 'ENDING: STERILIZATION COMPLETE',
      description: `The countdown reached zero. The facility's emergency sterilization sequence activated.

You did not escape.

The heat, the light, the silence.

The organism, the research, the secrets — all reduced to ash.

But in the facility's backup systems, buried deep in redundant storage, a copy of the organism's communication logs survives. Waiting. Echoing.

The story is not over.

GAME OVER`,
      color: '#6a4a4a',
    },
  };

  const ending = endings[currentEnding || 'escape'] || endings.escape;
  const formatTime2 = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}m ${sec}s`;
  };

  const handleRestart = () => {
    resetGame();
    setScreen('title');
  };

  return (
    <div className="screen ending-screen screen-overlay">
      <div className="ending-content" style={{ borderColor: ending.color }}>
        <div className="ending-header">
          <h1 className="ending-title" style={{ color: ending.color }}>
            {ending.title}
          </h1>
          <div className="ending-divider" style={{ background: ending.color }} />
        </div>

        <div className="ending-description">
          {ending.description.split('\n').map((line, i) => (
            <p key={i} className="ending-line">{line}</p>
          ))}
        </div>

        <div className="ending-stats">
          <p>⏱ {formatTime2(gameTime)} | 📄 {documents.length} documents | 🏁 {currentEnding?.toUpperCase()}</p>
        </div>

        {endingFlags.research_saved && (
          <p className="ending-bonus">✦ Research data recovered</p>
        )}
        {endingFlags.sterilization_avoided && (
          <p className="ending-bonus">✦ Sterilization sequence interrupted</p>
        )}

        <button className="menu-btn primary" onClick={handleRestart}>
          BACK TO MAIN MENU
        </button>
      </div>
    </div>
  );
}
