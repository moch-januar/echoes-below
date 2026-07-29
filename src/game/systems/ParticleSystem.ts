// ── Particle System ─────────────────────────────────────────────────────────
// Handles spawning, updating, and rendering of particles for atmosphere & FX.

import { useGameStore, type Particle } from '../state/gameStore';
import { randomRange } from '../../utils/helpers';

export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /** Spawn ambient particles based on room type */
  emitAmbient(roomId: string, roomPx: number, roomPy: number, roomW: number, roomH: number) {
    const store = useGameStore.getState();
    const { player } = store;
    const dt = 0.016; // approximate frame

    // Dust motes in all rooms
    if (Math.random() < 0.05) {
      const particles: Particle[] = [];
      for (let i = 0; i < 2; i++) {
        const x = player.x + randomRange(-150, 150);
        const y = player.y + randomRange(-100, 100);
        if (x < roomPx || x > roomPx + roomW || y < roomPy || y > roomPy + roomH) continue;
        particles.push({
          x, y,
          vx: randomRange(-3, 3),
          vy: randomRange(-1, -5),
          life: randomRange(2, 5),
          maxLife: 5,
          size: randomRange(1, 2.5),
          color: 'rgba(180,170,150,',
          alpha: randomRange(0.1, 0.3),
          type: 'dust',
        });
      }
      if (particles.length > 0) store.addParticles(particles);
    }

    // Water drips in flooded areas
    if (roomId === 'corridor' && Math.random() < 0.08) {
      const particles: Particle[] = [];
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: player.x + randomRange(-200, 200),
          y: randomRange(roomPy, roomPy + 30),
          vx: randomRange(-2, 2),
          vy: randomRange(40, 80),
          life: randomRange(0.5, 1.5),
          maxLife: 1.5,
          size: randomRange(1, 2),
          color: 'rgba(130,180,220,',
          alpha: 0.5,
          type: 'water',
        });
      }
      if (particles.length > 0) store.addParticles(particles);
    }

    // Spores in contaminated areas
    if (roomId === 'storage' && Math.random() < 0.06) {
      store.addParticles([{
        x: player.x + randomRange(-100, 100),
        y: player.y + randomRange(-80, 80),
        vx: randomRange(-8, 8),
        vy: randomRange(-12, -4),
        life: randomRange(2, 4),
        maxLife: 4,
        size: randomRange(2, 4),
        color: 'rgba(140,100,60,',
        alpha: 0.4,
        type: 'spore',
      }]);
    }
  }

  /** Spawn blood particles on hit */
  emitBlood(x: number, y: number, direction: number, count: number = 8) {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const spread = randomRange(-0.8, 0.8);
      const speed = randomRange(30, 80);
      particles.push({
        x, y,
        vx: Math.cos(direction + spread) * speed,
        vy: Math.sin(direction + spread) * speed - randomRange(10, 30),
        life: randomRange(0.5, 1.5),
        maxLife: 1.5,
        size: randomRange(2, 5),
        color: 'rgba(120,20,10,',
        alpha: 0.8,
        type: 'blood',
      });
    }
    useGameStore.getState().addParticles(particles);
  }

  /** Spawn spark particles on bullet impact */
  emitSparks(x: number, y: number) {
    const particles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const speed = randomRange(40, 100);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.1, 0.3),
        maxLife: 0.3,
        size: randomRange(1, 2),
        color: 'rgba(255,200,100,',
        alpha: 1,
        type: 'spark',
      });
    }
    useGameStore.getState().addParticles(particles);
  }

  /** Render all particles relative to camera */
  render(camX: number, camY: number) {
    const { ctx } = this;
    const particles = useGameStore.getState().particles;

    for (const p of particles) {
      const sx = p.x - camX + this.canvas.width / 2;
      const sy = p.y - camY + this.canvas.height / 2;

      // Skip offscreen
      if (sx < -20 || sx > this.canvas.width + 20 || sy < -20 || sy > this.canvas.height + 20) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      switch (p.type) {
        case 'dust':
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'blood':
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * (1 - p.life / p.maxLife * 0.3), 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'spore':
          ctx.fillStyle = p.color + (p.alpha * 0.6) + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Glow
          ctx.fillStyle = p.color + (p.alpha * 0.15) + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'water':
          ctx.fillStyle = p.color + (p.alpha * 0.6) + ')';
          ctx.beginPath();
          ctx.ellipse(sx, sy, p.size * 0.5, p.size * 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'spark':
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * (p.life / p.maxLife) * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }
  }
}
