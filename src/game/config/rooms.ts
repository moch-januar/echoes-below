// ── Room and Map Definitions ───────────────────────────────────────────────

export interface DoorDef {
  id: string;
  x: number; // tile x
  y: number; // tile y
  width: number; // tiles wide
  orientation: 'horizontal' | 'vertical';
  locked: boolean;
  lockType: 'none' | 'key' | 'puzzle' | 'power';
  lockKey?: string; // item template id or puzzle id
  requiresPower: boolean;
  isSecret: boolean;
  targetRoom: string;
  targetX: number; // where player ends up
  targetY: number;
  label: string;
}

export interface RoomDef {
  id: string;
  name: string;
  description: string;
  tiles: number[][]; // 2D array: 0=empty, 1=floor, 2=wall, 3=water, 4=spore, 5=debris
  width: number; // in tiles
  height: number;
  doors: DoorDef[];
  ambientLight: number; // 0-1
  ambience: string; // audio cue id
  safeRoom: boolean;
}

// ── Tile Legend ─────────────────────────────────────────────────────────────
// 0 = void/outside
// 1 = floor
// 2 = wall
// 3 = water (slows movement)
// 4 = spore growth (damages over time)
// 5 = debris (blocked)
// 6 = carpet/office floor
// 7 = metal grating

// ── Room Definitions ────────────────────────────────────────────────────────

const T = 20; // tile size in pixels for editor reference

export const ROOMS: Record<string, RoomDef> = {
  // ─── 1. Emergency Intake Chamber ──────────────────────────────────────────
  intake: {
    id: 'intake',
    name: 'Emergency Intake Chamber',
    description: 'A dimly lit receiving area. Emergency lights cast long shadows across the cracked floor tiles. The air smells of ozone and rust.',
    width: 20,
    height: 15,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 15; y++) {
        g[y] = [];
        for (let x = 0; x < 20; x++) {
          // Walls on edges
          if (x === 0 || x === 19 || y === 0 || y === 14) g[y][x] = 2;
          else g[y][x] = 1;
        }
      }
      // Entrance door area (south)
      g[14][9] = 1; g[14][10] = 1;
      // Some wall features
      g[2][2] = 2; g[2][3] = 2; g[3][2] = 2; // console
      g[2][16] = 2; g[2][17] = 2; g[3][17] = 2; // locker
      g[4][10] = 5; g[4][11] = 5; // debris
      g[6][5] = 5; // debris
      return g;
    })(),
    doors: [
      {
        id: 'door_intake_east',
        x: 19, y: 7, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'security', targetX: 2, targetY: 7,
        label: 'Corridor to Security Office',
      },
    ],
    ambientLight: 0.3,
    ambience: 'hum_low',
    safeRoom: false,
  },

  // ─── 2. Security Office ───────────────────────────────────────────────────
  security: {
    id: 'security',
    name: 'Security Office',
    description: 'The security center is in disarray. Monitors flicker with static. A chair lies overturned near the desk. Coffee cups and papers scatter the floor.',
    width: 18,
    height: 14,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 14; y++) {
        g[y] = [];
        for (let x = 0; x < 18; x++) {
          if (x === 0 || x === 17 || y === 0 || y === 13) g[y][x] = 2;
          else g[y][x] = 6; // carpet
        }
      }
      // Desk
      g[4][7] = 5; g[4][8] = 5; g[4][9] = 5;
      g[5][7] = 5; g[5][8] = 5; g[5][9] = 5;
      // Server rack
      g[7][2] = 2; g[7][3] = 2;
      g[8][2] = 2; g[8][3] = 2;
      // Lockers
      g[2][14] = 2; g[2][15] = 2;
      g[3][14] = 2; g[3][15] = 2;
      return g;
    })(),
    doors: [
      {
        id: 'door_sec_west',
        x: 0, y: 7, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'intake', targetX: 18, targetY: 7,
        label: 'Back to Intake',
      },
      {
        id: 'door_sec_north',
        x: 8, y: 0, width: 1, orientation: 'horizontal',
        locked: true, lockType: 'key', lockKey: 'keycard_cafeteria',
        requiresPower: false, isSecret: false,
        targetRoom: 'cafeteria', targetX: 8, targetY: 13,
        label: 'Cafeteria (Locked — Blue Keycard Required)',
      },
    ],
    ambientLight: 0.25,
    ambience: 'electronics_hum',
    safeRoom: false,
  },

  // ─── 3. Cafeteria ─────────────────────────────────────────────────────────
  cafeteria: {
    id: 'cafeteria',
    name: 'Cafeteria & Mess Hall',
    description: 'Long tables are still set for a meal that was never served. The kitchen door hangs open, revealing darkness beyond. A strange organic smell lingers.',
    width: 22,
    height: 16,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 16; y++) {
        g[y] = [];
        for (let x = 0; x < 22; x++) {
          if (x === 0 || x === 21 || y === 0 || y === 15) g[y][x] = 2;
          else g[y][x] = 6;
        }
      }
      // Tables
      for (let tx = 4; tx <= 16; tx += 6) {
        for (let ty = 3; ty <= 10; ty += 4) {
          g[ty][tx] = 5; g[ty][tx+1] = 5;
          g[ty+1][tx] = 5; g[ty+1][tx+1] = 5;
        }
      }
      // Kitchen counter
      g[2][17] = 5; g[2][18] = 5; g[2][19] = 5;
      g[3][19] = 5;
      return g;
    })(),
    doors: [
      {
        id: 'door_cafe_south',
        x: 8, y: 15, width: 1, orientation: 'horizontal',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'security', targetX: 8, targetY: 1,
        label: 'Back to Security',
      },
      {
        id: 'door_cafe_east',
        x: 21, y: 7, width: 1, orientation: 'vertical',
        locked: true, lockType: 'key', lockKey: 'keycard_lab',
        requiresPower: false, isSecret: false,
        targetRoom: 'medlab', targetX: 2, targetY: 7,
        label: 'Medical Laboratory (Green Keycard Required)',
      },
    ],
    ambientLight: 0.2,
    ambience: 'distant_drip',
    safeRoom: false,
  },

  // ─── 4. Medical Laboratory ────────────────────────────────────────────────
  medlab: {
    id: 'medlab',
    name: 'Biomedical Laboratory',
    description: 'Sterile white tiles and stainless steel surfaces. Incubators hum against the far wall. A laboratory terminal displays rows of incomprehensible data.',
    width: 20,
    height: 18,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 18; y++) {
        g[y] = [];
        for (let x = 0; x < 20; x++) {
          if (x === 0 || x === 19 || y === 0 || y === 17) g[y][x] = 2;
          else g[y][x] = 1;
        }
      }
      // Lab benches
      g[3][3] = 5; g[3][4] = 5; g[3][5] = 5;
      g[4][3] = 5; g[4][4] = 5; g[4][5] = 5;
      g[3][13] = 5; g[3][14] = 5; g[3][15] = 5;
      g[4][13] = 5; g[4][14] = 5; g[4][15] = 5;
      // Incubators
      g[5][1] = 2; g[5][2] = 2;
      g[6][1] = 2; g[6][2] = 2;
      // Storage cabinet
      g[8][1] = 2; g[8][2] = 2;
      g[9][1] = 2; g[9][2] = 2;
      // Spore contamination in one corner
      g[12][16] = 4; g[12][17] = 4;
      g[13][16] = 4; g[13][17] = 4;
      return g;
    })(),
    doors: [
      {
        id: 'door_lab_west',
        x: 0, y: 7, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'cafeteria', targetX: 20, targetY: 7,
        label: 'Back to Cafeteria',
      },
      {
        id: 'door_lab_east',
        x: 19, y: 9, width: 1, orientation: 'vertical',
        locked: true, lockType: 'puzzle', lockKey: 'puzzle_neutralize',
        requiresPower: false, isSecret: false,
        targetRoom: 'corridor', targetX: 2, targetY: 9,
        label: 'Maintenance Corridor (Chemical Lock)',
      },
    ],
    ambientLight: 0.35,
    ambience: 'lab_hum',
    safeRoom: false,
  },

  // ─── 5. Maintenance Corridor ──────────────────────────────────────────────
  corridor: {
    id: 'corridor',
    name: 'Flooded Maintenance Corridor',
    description: 'Water covers the floor to ankle depth. Pipes along the ceiling groan and drip. Emergency lights barely penetrate the gloom. Something moves in the distance.',
    width: 24,
    height: 10,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 10; y++) {
        g[y] = [];
        for (let x = 0; x < 24; x++) {
          if (x === 0 || x === 23 || y === 0 || y === 9) g[y][x] = 2;
          else g[y][x] = (y >= 2 && y <= 7) ? 3 : 7; // flooded center
        }
      }
      // Some debris
      g[4][10] = 5; g[4][11] = 5;
      g[5][16] = 5;
      return g;
    })(),
    doors: [
      {
        id: 'door_corr_west',
        x: 0, y: 5, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'medlab', targetX: 18, targetY: 9,
        label: 'Back to Laboratory',
      },
      {
        id: 'door_corr_east',
        x: 23, y: 5, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'storage', targetX: 2, targetY: 8,
        label: 'Specimen Storage',
      },
      {
        id: 'door_corr_north',
        x: 12, y: 0, width: 1, orientation: 'horizontal',
        locked: true, lockType: 'power', lockKey: 'power_main',
        requiresPower: true, isSecret: false,
        targetRoom: 'power', targetX: 10, targetY: 15,
        label: 'Power Control Room (Requires Main Power)',
      },
    ],
    ambientLight: 0.15,
    ambience: 'water_drip',
    safeRoom: false,
  },

  // ─── 6. Specimen Storage ──────────────────────────────────────────────────
  storage: {
    id: 'storage',
    name: 'Specimen Storage Bay B',
    description: 'Refrigerated storage units line the walls. Most have been forced open. Glass vials lie shattered on the floor. A warning siren beeps intermittently.',
    width: 18,
    height: 16,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 16; y++) {
        g[y] = [];
        for (let x = 0; x < 18; x++) {
          if (x === 0 || x === 17 || y === 0 || y === 15) g[y][x] = 2;
          else g[y][x] = 1;
        }
      }
      // Storage units
      for (let sy = 2; sy <= 12; sy += 3) {
        g[sy][1] = 2; g[sy][2] = 2;
        g[sy][15] = 2; g[sy][16] = 2;
      }
      // Central table
      g[7][7] = 5; g[7][8] = 5; g[7][9] = 5;
      g[8][7] = 5; g[8][8] = 5; g[8][9] = 5;
      // Spore contamination
      g[4][4] = 4; g[4][5] = 4;
      g[5][4] = 4; g[5][5] = 4;
      return g;
    })(),
    doors: [
      {
        id: 'door_stor_west',
        x: 0, y: 8, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'corridor', targetX: 22, targetY: 5,
        label: 'Back to Maintenance Corridor',
      },
      {
        id: 'door_stor_hidden',
        x: 6, y: 0, width: 1, orientation: 'horizontal',
        locked: true, lockType: 'key', lockKey: 'signal_decoder',
        requiresPower: false, isSecret: true,
        targetRoom: 'observation', targetX: 5, targetY: 13,
        label: 'Hidden Passage (Signal Required)',
      },
    ],
    ambientLight: 0.2,
    ambience: 'alarm_beep',
    safeRoom: false,
  },

  // ─── 7. Power Control Room ────────────────────────────────────────────────
  power: {
    id: 'power',
    name: 'Main Power Control',
    description: 'The heart of the facility\'s electrical system. Massive circuit breakers and fuse panels cover the walls. The main bus lies inert, waiting for restoration.',
    width: 18,
    height: 16,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 16; y++) {
        g[y] = [];
        for (let x = 0; x < 18; x++) {
          if (x === 0 || x === 17 || y === 0 || y === 15) g[y][x] = 2;
          else g[y][x] = 7;
        }
      }
      // Main panel
      g[4][7] = 2; g[4][8] = 2; g[4][9] = 2;
      g[5][7] = 2; g[5][8] = 2; g[5][9] = 2;
      g[6][7] = 2; g[6][8] = 2; g[6][9] = 2;
      // Secondary panels
      g[8][2] = 2; g[8][3] = 2;
      g[8][14] = 2; g[8][15] = 2;
      return g;
    })(),
    doors: [
      {
        id: 'door_power_south',
        x: 10, y: 15, width: 1, orientation: 'horizontal',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'corridor', targetX: 12, targetY: 1,
        label: 'Back to Maintenance Corridor',
      },
      {
        id: 'door_power_east',
        x: 17, y: 4, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'saferoom', targetX: 2, targetY: 5,
        label: 'Safe Room',
      },
    ],
    ambientLight: 0.3,
    ambience: 'electrical_hum',
    safeRoom: false,
  },

  // ─── 8. Safe Room ─────────────────────────────────────────────────────────
  saferoom: {
    id: 'saferoom',
    name: 'Staff Rest Area',
    description: 'A small break room with a worn couch, a coffee machine, and a corkboard covered in memos. A save terminal glows in the corner. Here, at least, you can breathe.',
    width: 12,
    height: 10,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 10; y++) {
        g[y] = [];
        for (let x = 0; x < 12; x++) {
          if (x === 0 || x === 11 || y === 0 || y === 9) g[y][x] = 2;
          else g[y][x] = 6;
        }
      }
      // Furniture
      g[3][4] = 5; g[3][5] = 5; g[4][4] = 5; g[4][5] = 5; // couch
      g[6][8] = 5; // coffee machine
      g[7][2] = 5; g[7][3] = 5; // table
      return g;
    })(),
    doors: [
      {
        id: 'door_safe_west',
        x: 0, y: 5, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'power', targetX: 16, targetY: 4,
        label: 'Back to Power Control',
      },
      {
        id: 'door_safe_north',
        x: 6, y: 0, width: 1, orientation: 'horizontal',
        locked: true, lockType: 'key', lockKey: 'keycard_storage',
        requiresPower: false, isSecret: false,
        targetRoom: 'storage', targetX: 10, targetY: 14,
        label: 'Specimen Storage (Orange Keycard Required)',
      },
    ],
    ambientLight: 0.4,
    ambience: 'safe_hum',
    safeRoom: true,
  },

  // ─── 9. Hidden Observation Room ───────────────────────────────────────────
  observation: {
    id: 'observation',
    name: 'Observation Room (Hidden)',
    description: 'A concealed monitoring station behind mirrored glass. Research terminals display the original containment protocols. Documents here reveal the truth about the experiment.',
    width: 12,
    height: 14,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 14; y++) {
        g[y] = [];
        for (let x = 0; x < 12; x++) {
          if (x === 0 || x === 11 || y === 0 || y === 13) g[y][x] = 2;
          else g[y][x] = 6;
        }
      }
      // Terminals
      g[3][3] = 2; g[3][4] = 2;
      g[4][3] = 2; g[4][4] = 2;
      g[7][7] = 2; g[7][8] = 2;
      g[8][7] = 2; g[8][8] = 2;
      return g;
    })(),
    doors: [
      {
        id: 'door_obs_east',
        x: 11, y: 6, width: 1, orientation: 'vertical',
        locked: false, lockType: 'none', requiresPower: false, isSecret: false,
        targetRoom: 'storage', targetX: 6, targetY: 1,
        label: 'Back to Storage',
      },
    ],
    ambientLight: 0.35,
    ambience: 'terminal_hum',
    safeRoom: false,
  },

  // ─── 10. Escape Platform ──────────────────────────────────────────────────
  escape: {
    id: 'escape',
    name: 'Emergency Evacuation Platform',
    description: 'The emergency elevator to the surface. A massive blast door stands between you and escape. The automated sterilization countdown ticks overhead.',
    width: 16,
    height: 12,
    tiles: (() => {
      const g: number[][] = [];
      for (let y = 0; y < 12; y++) {
        g[y] = [];
        for (let x = 0; x < 16; x++) {
          if (x === 0 || x === 15 || y === 0 || y === 11) g[y][x] = 2;
          else g[y][x] = 7;
        }
      }
      // Elevator platform
      for (let ex = 6; ex <= 9; ex++) {
        for (let ey = 5; ey <= 7; ey++) {
          g[ey][ex] = 1;
        }
      }
      return g;
    })(),
    doors: [],
    ambientLight: 0.25,
    ambience: 'alarm_loop',
    safeRoom: false,
  },
};

// ── Room Connections (for map) ──────────────────────────────────────────────

export interface RoomConnection {
  from: string;
  to: string;
  doorId: string;
  label: string;
}

export function getRoomConnections(): RoomConnection[] {
  const conns: RoomConnection[] = [];
  for (const room of Object.values(ROOMS)) {
    for (const door of room.doors) {
      conns.push({
        from: room.id,
        to: door.targetRoom,
        doorId: door.id,
        label: door.label,
      });
    }
  }
  return conns;
}

// ── Player Start Positions ──────────────────────────────────────────────────

export const START_POSITIONS: Record<string, { x: number; y: number }> = {
  intake: { x: 160, y: 260 },
};

// ── Room Order (progression) ────────────────────────────────────────────────

export const ROOM_ORDER = [
  'intake',
  'security',
  'cafeteria',
  'medlab',
  'corridor',
  'storage',
  'observation',
  'power',
  'saferoom',
  'escape',
] as const;
