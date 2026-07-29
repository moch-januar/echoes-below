// ── 2D Game Renderer ────────────────────────────────────────────────────────

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
}

const TILE = 20; // pixels per tile
const PI2 = Math.PI * 2;

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;

  // Tile colors
  private tileColors: Record<number, string> = {
    0: '#0a0a0f',
    1: '#2a2a30',
    2: '#1a1a22',
    3: '#1a2a3a',
    4: '#3a2a1a',
    5: '#222228',
    6: '#2e2e35',
    7: '#252530',
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d')!;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreen.width = width;
    this.offscreen.height = height;
  }

  render(state: RenderState) {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Camera position (follow player)
    let camX = state.playerX;
    let camY = state.playerY;

    // Camera shake
    if (state.cameraShake > 0) {
      const intensity = state.cameraShake * 4;
      camX += (Math.random() - 0.5) * intensity;
      camY += (Math.random() - 0.5) * intensity;
    }

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 - camX, h / 2 - camY);

    // Draw room
    if (state.currentRoom) {
      this.drawRoom(state.currentRoom);
      this.drawDoors(state.currentRoom);
    }

    // Draw interactable objects
    this.drawInteractables(state.interactableObjects, state.playerX, state.playerY);

    // Draw enemies
    for (const enemy of state.enemies) {
      if (!enemy.dead) {
        this.drawEnemy(enemy, state.gameTime);
      }
    }

    // Draw player
    this.drawPlayer(state);

    ctx.restore();

    // Lighting overlay
    this.drawLighting(state);
    this.drawScanlines(w, h, state.gameTime);
  }

  private drawRoom(room: RoomDef) {
    const { ctx } = this;
    const tileW = room.width;
    const tileH = room.height;

    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        const tile = room.tiles[y]?.[x] ?? 0;
        const px = x * TILE;
        const py = y * TILE;

        ctx.fillStyle = this.tileColors[tile] || '#000';
        ctx.fillRect(px, py, TILE, TILE);

        // Tile details
        if (tile === 1 || tile === 6 || tile === 7) {
          // Floor texture lines
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        }

        if (tile === 3) {
          // Water ripples
          ctx.fillStyle = 'rgba(60, 100, 140, 0.2)';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = 'rgba(100, 160, 200, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 6, 0, PI2);
          ctx.stroke();
        }

        if (tile === 4) {
          // Spore growth
          ctx.fillStyle = 'rgba(80, 50, 30, 0.4)';
          ctx.fillRect(px, py, TILE, TILE);
          // Spore dots
          ctx.fillStyle = 'rgba(120, 80, 40, 0.5)';
          for (let i = 0; i < 3; i++) {
            const sx = px + 4 + Math.sin(i * 2.1) * 6;
            const sy = py + 4 + Math.cos(i * 1.7) * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, PI2);
            ctx.fill();
          }
        }

        if (tile === 5) {
          // Debris pattern
          ctx.fillStyle = 'rgba(60, 40, 30, 0.3)';
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = 'rgba(80, 60, 40, 0.3)';
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        }
      }
    }
  }

  private drawDoors(room: RoomDef) {
    const { ctx } = this;

    for (const door of room.doors) {
      const x = door.x * TILE;
      const y = door.y * TILE;

      if (door.orientation === 'horizontal') {
        // Door across top/bottom of tiles
        ctx.fillStyle = door.isSecret ? '#3a3a2a' : door.locked ? '#4a2a2a' : '#2a3a2a';
        ctx.fillRect(x, y - 2, door.width * TILE, 6);
        // Lock indicator
        if (door.locked) {
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(x + 4, y - 1, 4, 4);
        }
      } else {
        // Vertical door
        ctx.fillStyle = door.isSecret ? '#3a3a2a' : door.locked ? '#4a2a2a' : '#2a3a2a';
        ctx.fillRect(x - 2, y, 6, door.width * TILE);
        if (door.locked) {
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(x - 1, y + 4, 4, 4);
        }
      }

      // Door label (small)
      if (this.ctx.scale.toString()) { /* do nothing */ }
    }
  }

  private drawPlayer(state: RenderState) {
    const { ctx } = this;
    const { playerX: x, playerY: y, playerAngle: angle, isCrouching, staggerTimer, playerHealth } = state;

    ctx.save();
    ctx.translate(x, y);

    // Stagger offset
    if (staggerTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2);
    }

    // Crouch visual
    const heightScale = isCrouching ? 0.6 : 1;

    // Body
    ctx.fillStyle = '#3a5a6a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 10 * heightScale, 0, 0, PI2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#4a6a7a';
    ctx.beginPath();
    ctx.arc(0, -12 * heightScale, 6, 0, PI2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = '#6a9aab';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16 - 4);
    ctx.stroke();

    // Weapon
    if (state.isAiming) {
      ctx.strokeStyle = '#8a8a6a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22 - 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawEnemy(enemy: EnemyInstance, gameTime: number) {
    const { ctx } = this;
    const { x, y, templateId, state: behavior, staggerTimer: st, angle } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Stagger
    if (st > 0) {
      ctx.translate((Math.random() - 0.5) * 3, 0);
    }

    const baseColor = templateId === 'hollow' ? '#4a6a5a' :
      templateId === 'listener' ? '#5a6a8a' : '#8a5a4a';

    if (templateId === 'hollow') {
      // Humanoid shape
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 12, 0, 0, PI2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#5a7a6a';
      ctx.beginPath();
      ctx.arc(0, -14, 6, 0, PI2);
      ctx.fill();
      // Eyes (vacant)
      ctx.fillStyle = '#2a3a2a';
      ctx.beginPath();
      ctx.arc(-3, -15, 2, 0, PI2);
      ctx.arc(3, -15, 2, 0, PI2);
      ctx.fill();
      // Tendrils (animated)
      ctx.strokeStyle = '#3a5a4a';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const tx = -5 + i * 5;
        const ty = -8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
          tx + Math.sin(gameTime * 2 + i) * 4,
          ty - 8,
          tx + Math.sin(gameTime * 2 + i + 0.5) * 6,
          ty - 14
        );
        ctx.stroke();
      }
    } else if (templateId === 'listener') {
      // Strange bulbous form with "ear" cones
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, 0, 0, PI2);
      ctx.fill();
      // "Ears" — two cones that twitch
      ctx.fillStyle = '#6a7a9a';
      const earTwitch = Math.sin(gameTime * 3) * 0.1;
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(-14, -8 + earTwitch * 4);
      ctx.lineTo(-8, -4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.lineTo(14, -8 - earTwitch * 4);
      ctx.lineTo(8, -4);
      ctx.fill();
      // Eye (single, large)
      ctx.fillStyle = '#3a4a6a';
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, PI2);
      ctx.fill();
      ctx.fillStyle = '#1a2a4a';
      ctx.beginPath();
      ctx.arc(0, -2, 2, 0, PI2);
      ctx.fill();
    } else if (templateId === 'bloom') {
      // Stationary organic mass
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 10, 0, 0, PI2);
      ctx.fill();
      // Pulsing center
      const pulse = Math.sin(gameTime * 2) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(180, 100, 60, ${pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, 6 * pulse, 0, PI2);
      ctx.fill();
      // Spore particles
      ctx.fillStyle = 'rgba(180, 120, 60, 0.3)';
      for (let i = 0; i < 5; i++) {
        const px = Math.cos(gameTime * 0.5 + i * 1.3) * (12 + Math.sin(gameTime + i) * 4);
        const py = Math.sin(gameTime * 0.5 + i * 1.3) * (10 + Math.cos(gameTime + i) * 4);
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(gameTime * 3 + i) * 0.5, 0, PI2);
        ctx.fill();
      }
    }

    // Health bar (if damaged)
    const maxHealth = enemy.templateId === 'hollow' ? 80 : enemy.templateId === 'listener' ? 50 : 120;
    if (enemy.health < maxHealth) {
      const barWidth = 20;
      const barHeight = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barWidth / 2, -22, barWidth, barHeight);
      ctx.fillStyle = '#4a4';
      ctx.fillRect(-barWidth / 2, -22, barWidth * (enemy.health / maxHealth), barHeight);
    }

    ctx.restore();
  }

  private drawInteractables(
    objects: RenderState['interactableObjects'],
    playerX: number,
    playerY: number
  ) {
    const { ctx } = this;

    for (const obj of objects) {
      const dx = obj.x - playerX;
      const dy = obj.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only draw if within reasonable range
      if (dist > 300) {
        if (obj.type === 'item' || obj.type === 'document') {
          // Draw a small indicator
          ctx.fillStyle = 'rgba(200, 200, 100, 0.3)';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, PI2);
          ctx.fill();
        }
        continue;
      }

      // Glow effect for nearby objects
      if (dist < 60) {
        ctx.fillStyle = 'rgba(200, 200, 100, 0.1)';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius + 8, 0, PI2);
        ctx.fill();
      }

      // Object itself
      ctx.fillStyle = obj.type === 'item' ? '#8a8a4a' :
        obj.type === 'document' ? '#6a6a4a' :
        obj.type === 'save' ? '#4a8a4a' :
        obj.type === 'door' ? '#5a5a7a' :
        obj.type === 'puzzle' ? '#7a5a5a' : '#555';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, PI2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icon = obj.type === 'item' ? '?' :
        obj.type === 'document' ? '📄' :
        obj.type === 'save' ? '💾' :
        obj.type === 'door' ? '🚪' :
        obj.type === 'puzzle' ? '⚙️' : '·';
      ctx.fillText(icon, obj.x, obj.y);
    }
  }

  private drawLighting(state: RenderState) {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const { playerX: px, playerY: py } = state;

    // Create radial gradient for visibility
    const baseLightRadius = 140;
    const aimMultiplier = state.isAiming ? 0.7 : 1;
    const crouchMultiplier = state.isCrouching ? 0.8 : 1;
    const lightRadius = baseLightRadius * aimMultiplier * crouchMultiplier;

    // Flashlight cone
    const lightGrad = ctx.createRadialGradient(px, py, 0, px, py, lightRadius);
    const ambientLevel = state.currentRoom?.ambientLight ?? 0.2;

    if (state.isAiming) {
      // Directional flashlight cone
      const angle = state.playerAngle;
      lightGrad.addColorStop(0, 'rgba(0,0,0,0)');
      lightGrad.addColorStop(0.3, 'rgba(0,0,0,0)');
      lightGrad.addColorStop(0.6, `rgba(0,0,0,${0.3 + ambientLevel * 0.4})`);
      lightGrad.addColorStop(1, `rgba(0,0,0,${0.7 + ambientLevel * 0.3})`);

      // Cone shape using clip
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, lightRadius * 1.5, angle - 0.6, angle + 0.6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,200,0.03)';
      ctx.fill();
      ctx.restore();
    }

    // Main darkness overlay
    ctx.fillStyle = `rgba(0,0,0,${0.85 - ambientLevel * 0.5})`;
    ctx.fillRect(0, 0, w, h);

    // Light reveal (subtract from darkness)
    ctx.globalCompositeOperation = 'destination-out';
    const revealGrad = ctx.createRadialGradient(px, py, 5, px, py, lightRadius);

    if (state.isAiming) {
      // Directional reveal
      const angle = state.playerAngle;
      const coneLength = lightRadius * 1.8;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, coneLength, angle - 0.5, angle + 0.5);
      ctx.closePath();
      const coneGrad = ctx.createRadialGradient(px, py, 0, px, py, coneLength);
      coneGrad.addColorStop(0, 'rgba(0,0,0,0.9)');
      coneGrad.addColorStop(0.4, 'rgba(0,0,0,0.7)');
      coneGrad.addColorStop(0.8, 'rgba(0,0,0,0.3)');
      coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coneGrad;
      ctx.fill();
      ctx.restore();
    } else {
      revealGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
      revealGrad.addColorStop(0.4, 'rgba(0,0,0,0.6)');
      revealGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
      revealGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = revealGrad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'source-over';

    // Vignette
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
  }

  private drawScanlines(w: number, h: number, gameTime: number) {
    const { ctx } = this;

    // Very subtle scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Slight film grain
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.015})`;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Render a single frame to an offscreen canvas and return the image data
   * for screenshot functionality
   */
  captureFrame(state: RenderState): ImageData {
    this.render(state);
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
}
