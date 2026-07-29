// ── Enemy Definitions ───────────────────────────────────────────────────────

export type EnemyBehaviour = 'idle' | 'patrol' | 'investigate' | 'chase' | 'attack' | 'stagger' | 'return' | 'dead';

export interface EnemyDef {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  speed: number; // pixels per second
  chaseSpeed: number;
  damage: number; // per hit
  attackRange: number; // pixels
  detectionRange: number; // pixels
  hearingRange: number; // pixels
  color: string; // canvas color
  size: number; // radius in pixels
  dropsOnDeath?: string[]; // item templates
  description: string;
}

export interface EnemyInstance {
  id: string;
  templateId: string;
  x: number;
  y: number;
  angle: number;
  roomId: string;
  health: number;
  state: EnemyBehaviour;
  patrolPath: { x: number; y: number }[];
  patrolIndex: number;
  lastKnownPlayerPos: { x: number; y: number } | null;
  investigateTimer: number;
  staggerTimer: number;
  attackCooldown: number;
  alertCooldown: number;
  respawnable: boolean;
  dead: boolean;
}

// ── Enemy Templates ─────────────────────────────────────────────────────────

export const ENEMY_TEMPLATES: Record<string, EnemyDef> = {
  hollow: {
    id: 'hollow',
    name: 'The Hollow',
    health: 80,
    maxHealth: 80,
    speed: 30,
    chaseSpeed: 60,
    damage: 15,
    attackRange: 25,
    detectionRange: 180,
    hearingRange: 300,
    color: '#4a6a5a',
    size: 14,
    description: 'A former facility worker. Pale skin, vacant eyes. Filament-like tendrils move beneath the surface. Moves with an unnatural gait.',
  },
  listener: {
    id: 'listener',
    name: 'The Listener',
    health: 50,
    maxHealth: 50,
    speed: 0, // stationary when idle, fast when alerted
    chaseSpeed: 90,
    damage: 20,
    attackRange: 20,
    detectionRange: 120,
    hearingRange: 400,
    color: '#5a6a8a',
    size: 12,
    description: 'A blind organism that navigates by sound. It stands motionless in dark corners, waiting for footsteps.',
  },
  bloom: {
    id: 'bloom',
    name: 'The Bloom',
    health: 120,
    maxHealth: 120,
    speed: 0, // stationary
    chaseSpeed: 0,
    damage: 5, // continuous damage from spores (handled separately)
    attackRange: 60,
    detectionRange: 80,
    hearingRange: 50,
    color: '#8a5a4a',
    size: 20,
    description: 'A pulsating organic growth on the wall. It releases clouds of toxic spores when threatened.',
    dropsOnDeath: ['chemical_stabilizer'],
  },
};

// ── Enemy Placements ────────────────────────────────────────────────────────

export interface EnemyPlacement {
  templateId: string;
  roomId: string;
  x: number;
  y: number;
  patrolPath?: { x: number; y: number }[];
  respawnable?: boolean;
}

export function getEnemyPlacements(): EnemyPlacement[] {
  return [
    // Intake — one hollow patrolling
    { templateId: 'hollow', roomId: 'intake', x: 300, y: 200, patrolPath: [{ x: 300, y: 200 }, { x: 100, y: 200 }, { x: 100, y: 50 }] },

    // Security — one listener in the corner
    { templateId: 'listener', roomId: 'security', x: 320, y: 240 },

    // Corridor — two hollows in the water
    { templateId: 'hollow', roomId: 'corridor', x: 200, y: 100, patrolPath: [{ x: 200, y: 100 }, { x: 350, y: 100 }] },
    { templateId: 'hollow', roomId: 'corridor', x: 350, y: 150, patrolPath: [{ x: 350, y: 150 }, { x: 450, y: 150 }] },

    // Storage — one bloom blocking the hidden door
    { templateId: 'bloom', roomId: 'storage', x: 120, y: 50 },

    // Power — one listener guarding the panel
    { templateId: 'listener', roomId: 'power', x: 200, y: 100 },
  ];
}
