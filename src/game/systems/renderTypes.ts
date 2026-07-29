// ── Renderer Contracts ─────────────────────────────────────────────────────
// Shared renderer-facing data contracts. Gameplay systems write RenderState;
// renderer backends consume it without owning gameplay, saves, AI, or puzzles.

import type { RoomDef } from '../config/rooms';
import type { EnemyInstance } from '../config/enemies';

export interface RenderState {
  playerX: number;
  playerY: number;
  playerAngle: number;
  playerHealth: number;
  playerHealthState: string;
  playerFlashlightOn: boolean;
  currentRoom: RoomDef | null;
  enemies: EnemyInstance[];
  interactableObjects: Array<{
    x: number;
    y: number;
    radius: number;
    type: string;
    label: string;
  }>;
  cameraShake: number;
  isAiming: boolean;
  isCrouching: boolean;
  staggerTimer: number;
  screenWidth: number;
  screenHeight: number;
  gameTime: number;
  playerMoveSpeed: number;
  bobPhase: number;
}

export interface GameRenderBackend {
  resize: (width: number, height: number) => void;
  render: (state: RenderState) => void;
  destroy?: () => void;
}
