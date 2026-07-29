// ── 2D Game Renderer ────────────────────────────────────────────────────────

import { LightingSystem } from './LightingSystem';
import { ParticleSystem } from './ParticleSystem';
import { useGameStore } from '../state/gameStore';
import type { RenderState } from './renderTypes';
import type { RoomDef } from '../config/rooms';
import type { EnemyInstance } from '../config/enemies';

const TILE = 20;
const PI2 = Math.PI * 2;

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lighting: LightingSystem;
  private particles: ParticleSystem;

  private tileColors: Record<number, Record<string, string>> = {
    0: { fill: '#0a0a0f', edge: '#0a0a0f' },
    1: { fill: '#2a2a30', edge: '#1a1a22' },
    2: { fill: '#1a1a22', edge: '#0e0e15' },
    3: { fill: '#1a2a3a', edge: '#15202e' },
    4: { fill: '#3a2a1a', edge: '#2a1a10' },
    5: { fill: '#222228', edge: '#18181c' },
    6: { fill: '#2e2e35', edge: '#202028' },
    7: { fill: '#252530', edge: '#1a1a22' },
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.lighting = new LightingSystem(this.ctx);
    this.particles = new ParticleSystem(canvas, this.ctx);
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(state: RenderState) {
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const store = useGameStore.getState();

    // Camera
    let camX = state.playerX;
    let camY = state.playerY;

    // Camera shake
    if (state.cameraShake > 0 && store.settings.cameraShakeEnabled) {
      const intensity = state.cameraShake * 4;
      camX += (Math.random() - 0.5) * intensity;
      camY += (Math.random() - 0.5) * intensity;
    }

    // Breath bob
    const bobAmp = state.playerMoveSpeed > 5 ? 1.5 : 0.3;
    const bobX = Math.sin(state.bobPhase) * bobAmp;
    const bobY = Math.abs(Math.cos(state.bobPhase)) * bobAmp * 0.5;
    camX += bobX;
    camY += bobY;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 - camX, h / 2 - camY);

    // Draw room
    if (state.currentRoom) {
      this.drawRoom(state.currentRoom, state.gameTime);
      this.drawDoors(state.currentRoom);
    }

    // Draw interactable objects
    this.drawInteractables(state.interactableObjects, state.playerX, state.playerY, state.gameTime);

    // Draw enemies
    for (const enemy of state.enemies) {
      if (!enemy.dead) {
        this.drawEnemy(enemy, state.gameTime);
      }
    }

    // Draw player
    this.drawPlayer(state);

    ctx.restore();

    // Particles (world space relative to camera)
    this.particles.render(camX, camY);

    // Lighting overlay
    this.lighting.render({
      px: state.playerX, py: state.playerY,
      angle: state.playerAngle,
      isAiming: state.isAiming,
      isCrouching: state.isCrouching,
      ambient: state.currentRoom?.ambientLight ?? 0.2,
      w, h,
      shake: state.cameraShake,
      muzzleFlash: store.effects.muzzleFlash,
      gameTime: state.gameTime,
      damageFlash: store.effects.damageFlash,
      quality: store.settings.qualityPreset,
    });
  }

  private drawRoom(room: RoomDef, gameTime: number) {
    const { ctx } = this;
    const tileW = room.width;
    const tileH = room.height;

    for (let y = 0; y < tileH; y++) {
      for (let x = 0; x < tileW; x++) {
        const tile = room.tiles[y]?.[x] ?? 0;
        const px = x * TILE;
        const py = y * TILE;

        const colors = this.tileColors[tile] || this.tileColors[0];

        // Base fill
        ctx.fillStyle = colors.fill;
        ctx.fillRect(px, py, TILE, TILE);

        // 3D wall bevel
        if (tile === 2) {
          // Wall with subtle lighting from above-left
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(px, py, TILE, 2);
          ctx.fillRect(px, py, 2, TILE);
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(px + TILE - 2, py, 2, TILE);
          ctx.fillRect(px, py + TILE - 2, TILE, 2);
        }

        // Floor textures
        if (tile === 1 || tile === 6 || tile === 7) {
          // Tile grout lines
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);

          // Random floor variation
          if ((x * 7 + y * 13) % 5 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          }
        }

        // Carpet texture (type 6)
        if (tile === 6) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          const cx = px + (x * 3) % 5 + 2;
          const cy = py + (y * 7) % 5 + 2;
          ctx.fillRect(cx, cy, 1, 1);
        }

        if (tile === 3) {
          // Water with animated ripples
          const ripple1 = Math.sin(gameTime * 0.8 + x * 0.5 + y * 0.3) * 0.3 + 0.5;
          const ripple2 = Math.sin(gameTime * 1.2 + x * 0.7 + y * 0.5) * 0.2 + 0.3;
          ctx.fillStyle = `rgba(50, 90, 140, ${0.15 + ripple1 * 0.1})`;
          ctx.fillRect(px, py, TILE, TILE);

          ctx.strokeStyle = `rgba(100, 170, 210, ${0.08 + ripple2 * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(px + TILE / 2 + Math.sin(gameTime + x + y) * 3,
                  py + TILE / 2 + Math.cos(gameTime * 0.7 + x + y) * 3,
                  4 + ripple1 * 3, 0, PI2);
          ctx.stroke();
          // Reflection highlight
          ctx.fillStyle = `rgba(180, 220, 255, ${0.03 + ripple2 * 0.03})`;
          ctx.fillRect(px + 3 + (x * 11) % 7, py + 3 + (y * 13) % 7, 3, 1);
        }

        if (tile === 4) {
          // Spore growth with pulsing
          const pulse = Math.sin(gameTime * 1.5 + x + y) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(80, 50, 30, ${0.25 * pulse})`;
          ctx.fillRect(px, py, TILE, TILE);

          // Spore dots
          ctx.fillStyle = `rgba(140, 90, 40, ${0.35 * pulse})`;
          for (let i = 0; i < 4; i++) {
            const sx = px + 4 + Math.sin(i * 2.1 + x * 7 + y * 3) * 6;
            const sy = py + 4 + Math.cos(i * 1.7 + x * 5 + y * 11) * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5 + Math.sin(gameTime + i) * 0.5, 0, PI2);
            ctx.fill();
          }
          // Edge glow
          ctx.fillStyle = `rgba(120, 80, 40, ${0.1 * pulse})`;
          ctx.fillRect(px, py, TILE, 1);
          ctx.fillRect(px, py, 1, TILE);
        }

        if (tile === 5) {
          // Debris with 3D effect
          ctx.fillStyle = 'rgba(60, 40, 30, 0.25)';
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = 'rgba(80, 50, 35, 0.2)';
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          // Debris highlight
          ctx.fillStyle = 'rgba(100, 70, 50, 0.1)';
          ctx.fillRect(px + 3, py + 2, TILE - 6, 1);
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
    const { playerX: x, playerY: y, playerAngle: angle, isCrouching, staggerTimer, playerHealth, bobPhase, playerMoveSpeed } = state;

    ctx.save();
    ctx.translate(x, y);

    // Stagger offset
    if (staggerTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 3);
    }

    // Walk bob
    const walkBob = bobPhase;
    const bobOffset = playerMoveSpeed > 5 ? Math.sin(walkBob) * 2 : 0;
    ctx.translate(0, bobOffset);

    // Crouch
    const scaleY = isCrouching ? 0.6 : 1;
    const crouchOffset = isCrouching ? 5 : 0;

    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 2, 9, 11 * scaleY, 0, 0, PI2);
    ctx.fill();

    // Body
    const healthColor = playerHealth > 50 ? '#3a5a6a' : playerHealth > 25 ? '#5a4a3a' : '#5a3a3a';
    ctx.fillStyle = healthColor;
    ctx.beginPath();
    ctx.ellipse(0, crouchOffset, 8, 10 * scaleY, 0, 0, PI2);
    ctx.fill();

    // Body highlight
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.ellipse(-2, -2 + crouchOffset, 4, 5 * scaleY, 0, 0, PI2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#4a6a7a';
    ctx.beginPath();
    ctx.arc(0, -12 * scaleY + crouchOffset, 6, 0, PI2);
    ctx.fill();

    // Head highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.arc(-1, -13 * scaleY + crouchOffset, 3, 0, PI2);
    ctx.fill();

    // Weapon arm
    const aimOffset = state.isAiming ? -4 : 0;
    ctx.strokeStyle = state.isAiming ? '#8a8a6a' : '#4a5a4a';
    ctx.lineWidth = state.isAiming ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(5, -1 + crouchOffset);
    ctx.lineTo(Math.cos(angle) * (20 + aimOffset) + 5,
               Math.sin(angle) * (20 + aimOffset) - 1 + crouchOffset);
    ctx.stroke();

    // Direction indicator
    if (!state.isAiming) {
      ctx.strokeStyle = '#6a9aab';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -2 + crouchOffset);
      ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12 - 2 + crouchOffset);
      ctx.stroke();
      ctx.globalAlpha = 1;
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
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(3, 3, 10, 6, 0, 0, PI2);
    ctx.fill();

    const baseColor = templateId === 'hollow' ? '#4a6a5a' :
      templateId === 'listener' ? '#5a6a8a' : '#8a5a4a';

    // Chase state pulsing glow
    if (behavior === 'chase' || behavior === 'attack') {
      const pulse = Math.sin(gameTime * 5) * 0.3 + 0.7;
      ctx.fillStyle = templateId === 'hollow' ? `rgba(60, 100, 60, ${pulse * 0.08})` :
        templateId === 'listener' ? `rgba(80, 100, 140, ${pulse * 0.08})` :
        `rgba(140, 80, 60, ${pulse * 0.08})`;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + pulse * 4, 0, PI2);
      ctx.fill();
    }

    if (templateId === 'hollow') {
      // Body
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 12, 0, 0, PI2);
      ctx.fill();
      // Body highlight
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.ellipse(-2, -2, 4, 6, 0, 0, PI2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#5a7a6a';
      ctx.beginPath();
      ctx.arc(0, -14, 6, 0, PI2);
      ctx.fill();
      // Eyes (vacant, glowing faintly)
      const eyeGlow = Math.sin(gameTime * 0.7) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(40, 60, 40, ${eyeGlow})`;
      ctx.beginPath();
      ctx.arc(-3, -15, 2, 0, PI2);
      ctx.arc(3, -15, 2, 0, PI2);
      ctx.fill();
      // Pupils
      ctx.fillStyle = '#1a2a1a';
      ctx.beginPath();
      ctx.arc(-3 + Math.sin(gameTime) * 0.5, -15, 1, 0, PI2);
      ctx.arc(3 + Math.sin(gameTime) * 0.5, -15, 1, 0, PI2);
      ctx.fill();
      // Tendrils (animated)
      ctx.strokeStyle = '#3a5a4a';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 3; i++) {
        const tx = -5 + i * 5;
        const ty = -8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
          tx + Math.sin(gameTime * 2.5 + i * 1.3) * 5,
          ty - 10 + Math.sin(gameTime * 1.8 + i) * 2,
          tx + Math.sin(gameTime * 2.5 + i * 1.3 + 0.5) * 7,
          ty - 16
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (templateId === 'listener') {
      // Body
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, 0, 0, PI2);
      ctx.fill();
      // "Ears" — two cones that twitch and rotate toward sound
      ctx.fillStyle = '#6a7a9a';
      const earTwitch = Math.sin(gameTime * 4) * 0.15;
      const earAngle = angle !== 0 ? Math.sin(gameTime * 2) * 0.1 : 0;
      ctx.beginPath();
      ctx.moveTo(-10 + earAngle * 3, -2);
      ctx.lineTo(-14 - earTwitch * 2, -8 + earTwitch * 6);
      ctx.lineTo(-8, -4 - earTwitch * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10 + earAngle * 3, -2);
      ctx.lineTo(14 - earTwitch * 2, -8 - earTwitch * 6);
      ctx.lineTo(8, -4 + earTwitch * 2);
      ctx.fill();
      // Eye (large, unblinking)
      ctx.fillStyle = '#3a4a6a';
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0, PI2);
      ctx.fill();
      const pupilSize = behavior === 'chase' ? 1 : 2.5;
      ctx.fillStyle = '#1a2a4a';
      ctx.beginPath();
      ctx.arc(0, -2, pupilSize, 0, PI2);
      ctx.fill();
      // Eye glow
      ctx.fillStyle = `rgba(100, 140, 200, ${0.1 + Math.sin(gameTime * 0.5) * 0.05})`;
      ctx.beginPath();
      ctx.arc(0, -3, 3, 0, PI2);
      ctx.fill();
    } else if (templateId === 'bloom') {
      // Organic mass
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 10, 0, 0, PI2);
      ctx.fill();
      // Veins
      ctx.strokeStyle = '#6a3a2a';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 4; i++) {
        const vAngle = i * Math.PI / 2 + Math.sin(gameTime * 0.3 + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(vAngle) * 10, Math.sin(vAngle) * 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Pulsing center
      const pulse = Math.sin(gameTime * 2.5) * 0.25 + 0.75;
      ctx.fillStyle = `rgba(180, 100, 60, ${pulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, 7 * pulse, 0, PI2);
      ctx.fill();
      // Inner glow
      ctx.fillStyle = `rgba(200, 140, 80, ${pulse * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, 4 * pulse, 0, PI2);
      ctx.fill();
      // Spore particles orbiting
      ctx.fillStyle = 'rgba(180, 120, 60, 0.4)';
      for (let i = 0; i < 6; i++) {
        const px = Math.cos(gameTime * 0.8 + i * 1.05) * (14 + Math.sin(gameTime * 1.5 + i) * 3);
        const py = Math.sin(gameTime * 0.8 + i * 1.05) * (12 + Math.cos(gameTime * 1.5 + i) * 3);
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.sin(gameTime * 4 + i * 2) * 0.8, 0, PI2);
        ctx.fill();
      }
    }

    // Health bar (if damaged)
    const maxHealth = enemy.templateId === 'hollow' ? 80 : enemy.templateId === 'listener' ? 50 : 120;
    if (enemy.health < maxHealth) {
      const barWidth = 22;
      const barHeight = 3;
      const yOffset = templateId === 'bloom' ? -16 : -24;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-barWidth / 2 - 1, yOffset - 1, barWidth + 2, barHeight + 2);
      ctx.fillStyle = '#4a4';
      ctx.fillRect(-barWidth / 2, yOffset, barWidth * (enemy.health / maxHealth), barHeight);
    }

    ctx.restore();
  }

  private drawInteractables(
    objects: RenderState['interactableObjects'],
    playerX: number,
    playerY: number,
    gameTime: number
  ) {
    const { ctx } = this;

    for (const obj of objects) {
      const dx = obj.x - playerX;
      const dy = obj.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only draw if within reasonable range
      if (dist > 300) {
        if (obj.type === 'item' || obj.type === 'document') {
          // Draw a small indicator far away
          ctx.fillStyle = 'rgba(200, 200, 100, 0.15)';
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius * 1.5, 0, PI2);
          ctx.fill();
        }
        continue;
      }

      // Glow effect for nearby objects
      if (dist < 60) {
        const pulse = Math.sin(gameTime * 2 + obj.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(200, 200, 100, ${0.08 * pulse})`;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius + 10 + Math.sin(gameTime * 3 + obj.y) * 2, 0, PI2);
        ctx.fill();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(obj.x + 2, obj.y + 2, obj.radius, obj.radius * 0.6, 0, 0, PI2);
      ctx.fill();

      // Object itself (with 3D-ish highlight)
      ctx.fillStyle = obj.type === 'item' ? '#8a8a4a' :
        obj.type === 'document' ? '#6a6a4a' :
        obj.type === 'save' ? '#4a8a4a' :
        obj.type === 'door' ? '#5a5a7a' :
        obj.type === 'puzzle' ? '#7a5a5a' : '#555';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, PI2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(obj.x - 1, obj.y - 1, obj.radius * 0.5, 0, PI2);
      ctx.fill();

      // Icon
      ctx.fillStyle = '#ddd';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icon = obj.type === 'item' ? '?' :
        obj.type === 'document' ? '📄' :
        obj.type === 'save' ? '💾' :
        obj.type === 'door' ? '🚪' :
        obj.type === 'puzzle' ? '⚙' : '·';
      ctx.fillText(icon, obj.x, obj.y);
    }
  }
}
