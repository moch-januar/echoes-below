import { useMemo, useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { ROOMS, getRoomConnections } from '../game/config/rooms';
import { DOCUMENTS } from '../game/config/documents';

interface MapScreenProps {
  currentRoomId: string;
}

const ROOM_POSITIONS: Record<string, { x: number; y: number; floor: string }> = {
  intake: { x: 12, y: 54, floor: 'B3' },
  security: { x: 28, y: 54, floor: 'B3' },
  cafeteria: { x: 28, y: 34, floor: 'B3' },
  medlab: { x: 48, y: 34, floor: 'B3' },
  corridor: { x: 66, y: 34, floor: 'B3' },
  storage: { x: 84, y: 34, floor: 'B3' },
  power: { x: 66, y: 14, floor: 'B4' },
  saferoom: { x: 84, y: 14, floor: 'B4' },
  observation: { x: 84, y: 56, floor: 'B3' },
  escape: { x: 50, y: 14, floor: 'SURFACE' },
};

const ROOM_COLORS: Record<string, string> = {
  intake: '#4b634f',
  security: '#626147',
  cafeteria: '#664d4a',
  medlab: '#4a536b',
  corridor: '#3f6669',
  storage: '#664f69',
  power: '#777143',
  saferoom: '#3f6b51',
  observation: '#704f3b',
  escape: '#45677b',
};

export default function MapScreen({ currentRoomId }: MapScreenProps) {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const flags = useGameStore((s) => s.flags);
  const documents = useGameStore((s) => s.documents);
  const currentObjective = useGameStore((s) => s.currentObjective);
  const [zoom, setZoom] = useState(1);
  const [floor, setFloor] = useState<'ALL' | 'B3' | 'B4' | 'SURFACE'>('ALL');

  const visitedRooms = useMemo(() => {
    const visited = new Set<string>([currentRoomId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const roomId of Array.from(visited)) {
        const room = ROOMS[roomId];
        if (!room) continue;
        for (const door of room.doors) {
          if (!door.locked || flags.has(`door_unlocked_${door.id}`) || door.targetRoom === currentRoomId) {
            if (!visited.has(door.targetRoom)) {
              visited.add(door.targetRoom);
              changed = true;
            }
          }
        }
      }
    }

    for (const doc of Object.values(DOCUMENTS)) {
      if (documents.includes(doc.id)) visited.add(doc.location);
    }
    return visited;
  }, [currentRoomId, documents, flags]);

  if (screen !== 'map') return null;

  const connections = getRoomConnections();
  const visibleRooms = Object.entries(ROOMS).filter(([id]) => floor === 'ALL' || ROOM_POSITIONS[id]?.floor === floor);

  return (
    <div className="screen map-screen screen-overlay">
      <div className="map-header">
        <div>
          <p className="screen-kicker">Kestrel Biomedical Research Station</p>
          <h2>FACILITY MAP</h2>
        </div>
        <button className="btn-close" onClick={() => setScreen('playing')} aria-label="Close map">✕</button>
      </div>

      <div className="map-toolbar">
        {(['ALL', 'B3', 'B4', 'SURFACE'] as const).map((f) => (
          <button key={f} className={`map-tool-btn ${floor === f ? 'active' : ''}`} onClick={() => setFloor(f)}>{f}</button>
        ))}
        <span className="map-toolbar-spacer" />
        <button className="map-tool-btn" onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}>−</button>
        <span className="map-zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="map-tool-btn" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}>+</button>
      </div>

      <div className="map-container tactical-map">
        <div className="map-canvas" style={{ transform: `scale(${zoom})` }}>
          <svg className="map-lines" viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
            {connections.map((conn) => {
              const from = ROOM_POSITIONS[conn.from];
              const to = ROOM_POSITIONS[conn.to];
              if (!from || !to) return null;
              if ((floor !== 'ALL' && from.floor !== floor) || (floor !== 'ALL' && to.floor !== floor)) return null;
              const known = visitedRooms.has(conn.from) && visitedRooms.has(conn.to);
              return (
                <line
                  key={`${conn.from}-${conn.to}-${conn.doorId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={known ? 'known' : 'unknown'}
                />
              );
            })}
          </svg>

          {visibleRooms.map(([id, room]) => {
            const pos = ROOM_POSITIONS[id];
            if (!pos) return null;
            const discovered = visitedRooms.has(id);
            const isCurrent = id === currentRoomId;
            const docCount = Object.values(DOCUMENTS).filter((doc) => doc.location === id && documents.includes(doc.id)).length;
            const totalDocs = Object.values(DOCUMENTS).filter((doc) => doc.location === id).length;
            const hasPuzzle = id === 'power' || id === 'medlab' || id === 'corridor' || id === 'storage';
            const complete = discovered && totalDocs > 0 && docCount === totalDocs;

            return (
              <button
                key={id}
                className={`map-room-node ${discovered ? 'discovered' : 'hidden'} ${isCurrent ? 'current' : ''} ${complete ? 'complete' : ''}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, background: discovered ? ROOM_COLORS[id] : '#111' }}
                disabled={!discovered}
              >
                <span className="map-room-floor">{pos.floor}</span>
                <span className="map-room-name">{discovered ? room.name : 'Unknown Area'}</span>
                {isCurrent && <span className="map-room-status current">YOU</span>}
                {room.safeRoom && discovered && <span className="map-room-status safe">SAVE</span>}
                {hasPuzzle && discovered && <span className="map-room-status puzzle">PUZZLE</span>}
                {totalDocs > 0 && discovered && <span className="map-room-status docs">DOCS {docCount}/{totalDocs}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="map-intel-panel">
        <h3>Current Objective</h3>
        <p>{currentObjective}</p>
        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot current-dot" /> Your Position</div>
          <div className="legend-item"><span className="legend-dot safe-dot" /> Save Room</div>
          <div className="legend-item"><span className="legend-dot puzzle-dot" /> Puzzle / Lock</div>
          <div className="legend-item"><span className="legend-dot complete-dot" /> Room Complete</div>
        </div>
      </aside>
    </div>
  );
}
