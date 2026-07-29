import { useGameStore } from '../game/state/gameStore';
import { DOCUMENTS } from '../game/config/documents';

export default function DocumentViewer() {
  const currentDocument = useGameStore((s) => s.currentDocument);
  const screen = useGameStore((s) => s.screen);
  const closeDocument = useGameStore((s) => s.closeDocument);

  if (screen !== 'document' || !currentDocument) return null;

  const doc = DOCUMENTS[currentDocument];
  if (!doc) return null;

  const typeLabel = doc.type === 'note' ? '📝 Note' :
    doc.type === 'log' ? '📋 Research Log' :
    doc.type === 'terminal' ? '💻 Terminal Output' :
    '✉️ Letter';

  const typeColor = doc.type === 'note' ? '#8a8' :
    doc.type === 'log' ? '#aa8' :
    doc.type === 'terminal' ? '#4a8' : '#a8a';

  return (
    <div className="screen document-viewer screen-overlay">
      <div className="document-container">
        <div className="document-header" style={{ borderColor: typeColor }}>
          <span className="document-type" style={{ color: typeColor }}>{typeLabel}</span>
          <h2 className="document-title">{doc.title}</h2>
          <button className="btn-close" onClick={closeDocument}>✕</button>
        </div>

        <div className="document-content">
          {doc.content.split('\n').map((line, i) => (
            <p key={i} className="document-line">{line}</p>
          ))}
        </div>

        <div className="document-footer">
          <p className="document-found-in">Found in: {doc.location}</p>
          <button className="menu-btn primary" onClick={closeDocument}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
