import { useMemo, useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { DOCUMENTS } from '../game/config/documents';

export default function DocumentViewer() {
  const currentDocument = useGameStore((s) => s.currentDocument);
  const screen = useGameStore((s) => s.screen);
  const closeDocument = useGameStore((s) => s.closeDocument);
  const [zoom, setZoom] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);

  const doc = currentDocument ? DOCUMENTS[currentDocument] : null;
  const pages = useMemo(() => {
    if (!doc) return [];
    const paragraphs = doc.content.split('\n').filter((line) => line.trim().length > 0);
    const chunkSize = 7;
    const chunks: string[][] = [];
    for (let i = 0; i < paragraphs.length; i += chunkSize) chunks.push(paragraphs.slice(i, i + chunkSize));
    return chunks.length > 0 ? chunks : [[]];
  }, [doc]);
  const [page, setPage] = useState(0);

  if (screen !== 'document' || !doc) return null;

  const safePage = Math.min(page, pages.length - 1);
  const typeLabel = doc.type === 'note' ? 'Note' :
    doc.type === 'log' ? 'Research Log' :
    doc.type === 'terminal' ? 'Terminal Output' :
    'Letter';

  const typeColor = doc.type === 'note' ? '#8a8' :
    doc.type === 'log' ? '#aa8' :
    doc.type === 'terminal' ? '#4a8' : '#a8a';

  return (
    <div className="screen document-viewer screen-overlay">
      <div className="document-container modern-document">
        <div className="document-header" style={{ borderColor: typeColor }}>
          <div>
            <span className="document-type" style={{ color: typeColor }}>{typeLabel}</span>
            <h2 className="document-title">{doc.title}</h2>
          </div>
          <button className="btn-close" onClick={closeDocument} aria-label="Close document">✕</button>
        </div>

        <div className="document-toolbar">
          <button className="map-tool-btn" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>Prev</button>
          <span>Page {safePage + 1} / {pages.length}</span>
          <button className="map-tool-btn" onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))} disabled={safePage >= pages.length - 1}>Next</button>
          <span className="map-toolbar-spacer" />
          <button className="map-tool-btn" onClick={() => setZoom((z) => Math.max(0.85, z - 0.1))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="map-tool-btn" onClick={() => setZoom((z) => Math.min(1.35, z + 0.1))}>+</button>
          <button className={`map-tool-btn ${bookmarked ? 'active' : ''}`} onClick={() => setBookmarked((b) => !b)}>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>

        <div className="document-stage">
          <article className={`document-page ${doc.type}`} style={{ fontSize: `${zoom}rem` }}>
            <div className="document-paper-noise" />
            {pages[safePage].map((line, i) => (
              <p key={`${safePage}-${i}`} className="document-line">{line}</p>
            ))}
          </article>
        </div>

        <div className="document-footer">
          <p className="document-found-in">Found in: {doc.location}</p>
          <button className="menu-btn primary" onClick={closeDocument}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
