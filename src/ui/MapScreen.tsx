import { useGameStore } from '../game/state/gameStore';
import { ROOMS } from '../game/config/rooms';
import { DOCUMENTS } from '../game/config/documents';

interface MapScreenProps {
  currentRoomId: string;
}

export default function MapScreen({ currentRoomId }: MapScreenProps) {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const flags = useGameStore((s) => s.flags);
  const documents = useGameStore((s) => s.documents);

  if (screen !== 'map') return null;

  const handleClose = () => setScreen('playing');

  // Determine what rooms the player has visited
  const visitedRooms = new Set<string>();
  visitedRooms.add(currentRoomId); // Current room always visible

  // Rooms connected to visited rooms are also visible
  for (const roomId of visitedRooms) {
    const room = ROOMS[roomId];
    if (room) {
      for (const door of room.doors) {
        if (flags.has(`door_unlocked_${door.id}`)) {
          visitedRooms.add(door.targetRoom);
        }
      }
    }
  }

  // Add rooms where documents have been found
  for (const doc of Object.values(DOCUMENTS)) {
    if (documents.includes(doc.id)) {
      visitedRooms.add(doc.location);
    }
  }

  const roomColors: Record<string, string> = {
    intake: '#3a4a3a',
    security: '#4a4a3a',
    cafeteria: '#4a3a3a',
    medlab: '#3a3a4a',
    corridor: '#3a4a4a',
    storage: '#4a3a4a',
    power: '#4a4a2a',
    saferoom: '#2a4a3a',
    observation: '#5a3a2a',
    escape: '#3a4a5a',
  };

  const roomNames: Record<string, string> = {
    intake: 'Emergency Intake',
    security: 'Security Office',
    cafeteria: 'Cafeteria',
    medlab: 'Bio Lab',
    corridor: 'Maintenance Corridor',
    storage: 'Specimen Storage',
    power: 'Power Control',
    saferoom: 'Safe Room',
    observation: '??? (Hidden)',
    escape: 'Escape Platform',
  };

  return (
    <div className="screen map-screen screen-overlay">
      <div className="map-header">
        <h2>FACILITY MAP</h2>
        <button className="btn-close" onClick={handleClose}>✕</button>
      </div>

      <div className="map-container">
        <div className="map-layout">
          {/* Simplified map layout — a grid of rooms */}
          <div className="map-rooms">
            {Object.entries(ROOMS).map(([id, room]) => {
              const discovered = visitedRooms.has(id);
              const isCurrent = id === currentRoomId;

              return (
                <div
                  key={id}
                  className={`map-room ${discovered ? 'discovered' : 'hidden'} ${isCurrent ? 'current' : ''}`}
                  style={{
                    background: discovered ? (roomColors[id] || '#333') : '#111',
                    borderColor: isCurrent ? '#8a8' : discovered ? '#555' : '#222',
                    borderWidth: isCurrent ? 3 : 1,
                    boxShadow: isCurrent ? '0 0 10px rgba(100,180,100,0.3)' : 'none',
                  }}
                >
                  <span className="map-room-name">
                    {discovered ? roomNames[id] || room.name : '???'}
                  </span>
                  {isCurrent && <span className="map-you-are-here">● YOU ARE HERE</span>}
                  {room.safeRoom && discovered && (
                    <span className="map-room-tag safe">SAFE</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Connections between rooms */}
          <div className="map-connections">
            {Object.entries(ROOMS).map(([id, room]) => {
              if (!visitedRooms.has(id)) return null;
              return room.doors.map((door, di) => {
                if (!visitedRooms.has(door.targetRoom)) return null;
                const unlocked = flags.has(`door_unlocked_${door.id}`);
                return (
                  <div
                    key={`conn-${id}-${di}`}
                    className={`map-connection ${unlocked ? 'unlocked' : 'locked'}`}
                    style={{
                      left: `${10 + Math.random() * 60}%`,
                      top: `${10 + Math.random() * 60}%`,
                    }}
                  />
                );
              });
            })}
          </div>
        </div>

        <div className="map-legend">
          <div className="legend-item"><span className="legend-dot current-dot" /> Your Position</div>
          <div className="legend-item"><span className="legend-dot discovered-dot" /> Explored</div>
          <div className="legend-item"><span className="legend-dot hidden-dot" /> Unexplored</div>
          <div className="legend-item"><span className="legend-dot safe-dot" /> Safe Room</div>
        </div>
      </div>

      <div className="map-footer">
        <p>Press M to close | Explore to reveal more areas</p>
      </div>
    </div>
  );
}
