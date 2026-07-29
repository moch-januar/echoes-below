// ── Lighting System ─────────────────────────────────────────────────────────
// Dynamic lighting with realistic falloff, shadow casting, and ambient glow.

import { distance, angleBetween } from '../../utils/helpers';
import { useGameStore } from '../state/gameStore';

interface LightConfig {
  /** Player/camera position */
  px: number;
  py: number;
  /** Player facing angle */
  angle: number;
  /** Is player aiming? (cone narrows) */
  isAiming: boolean;
  /** Is player crouching? (light lowers) */
  isCrouching: boolean;
  /** Ambient light level for current room (0-1) */
  ambient: number;
  /** Screen dimensions */
  w: number;
  /** Screen height */
  h: number;
  /** Camera shake intensity */
  shake: number;
  /** Muzzle flash brightness (0-1) */
  muzzleFlash: number;
  /** Game time for animated flickering */
  gameTime: number;
  /** Damage flash (0-1) */
  damageFlash: number;
  /** Quality preset */
  quality: 'low' | 'medium' | 'high';
}

export class LightingSystem {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(cfg: LightConfig) {
    const { ctx } = this;
    const { px, py, angle, isAiming, ambient, w, h, shake, muzzleFlash, gameTime, damageFlash, quality } = cfg;

    // ── Main darkness overlay ──────────────────────────────────────────
    const darkAlpha = 0.88 - ambient * 0.55;
    ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // ── Flashlight / Visibility cone ───────────────────────────────────
    ctx.globalCompositeOperation = 'destination-out';

    const baseRadius = quality === 'high' ? 160 : quality === 'medium' ? 140 : 120;
    const crouchMult = cfg.isCrouching ? 0.75 : 1;
    const aimMult = cfg.isAiming ? 1.1 : 1;
    const lightRadius = baseRadius * crouchMult * aimMult;

    // Player position on screen
    const screenX = w / 2;
    const screenY = h / 2;

    if (cfg.isAiming) {
      // Directional cone for aiming
      const coneLength = lightRadius * 1.8;
      const coneWidth = 0.35 + shake * 0.05;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.arc(screenX, screenY, coneLength, angle - coneWidth, angle + coneWidth);
      ctx.closePath();

      const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, coneLength);
      grad.addColorStop(0, 'rgba(0,0,0,0.95)');
      grad.addColorStop(0.3, 'rgba(0,0,0,0.8)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.5)');
      grad.addColorStop(0.85, 'rgba(0,0,0,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Subtle warm cone overlay
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.arc(screenX, screenY, coneLength * 0.9, angle - coneWidth * 0.8, angle + coneWidth * 0.8);
      ctx.closePath();
      ctx.fillStyle = `rgba(200,200,160,${0.02 + muzzleFlash * 0.1})`;
      ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      // Radial light
      const revealGrad = ctx.createRadialGradient(screenX, screenY, 5, screenX, screenY, lightRadius);
      const flicker = Math.sin(gameTime * 3.7) * 0.03 + Math.sin(gameTime * 7.2) * 0.02;
      const flickerOffset = 1 + flicker;

      revealGrad.addColorStop(0, 'rgba(0,0,0,0.98)');
      revealGrad.addColorStop(0.3 * flickerOffset, 'rgba(0,0,0,0.7)');
      revealGrad.addColorStop(0.55 * flickerOffset, 'rgba(0,0,0,0.4)');
      revealGrad.addColorStop(0.8 * flickerOffset, 'rgba(0,0,0,0.15)');
      revealGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = revealGrad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'source-over';

    // ── Muzzle flash ───────────────────────────────────────────────────
    if (muzzleFlash > 0.01) {
      const mfGrad = ctx.createRadialGradient(
        screenX + Math.cos(angle) * 20,
        screenY + Math.sin(angle) * 20,
        0,
        screenX + Math.cos(angle) * 20,
        screenY + Math.sin(angle) * 20,
        30 + muzzleFlash * 40
      );
      mfGrad.addColorStop(0, `rgba(255,220,150,${muzzleFlash * 0.6})`);
      mfGrad.addColorStop(0.5, `rgba(255,200,100,${muzzleFlash * 0.3})`);
      mfGrad.addColorStop(1, `rgba(255,200,100,0)`);
      ctx.fillStyle = mfGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Damage flash ───────────────────────────────────────────────────
    if (damageFlash > 0.01) {
      ctx.fillStyle = `rgba(180,20,10,${damageFlash * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Vignette ───────────────────────────────────────────────────────
    const vigIntensity = 0.5;
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    vigGrad.addColorStop(0.8, `rgba(0,0,0,${0.2 * vigIntensity})`);
    vigGrad.addColorStop(1, `rgba(0,0,0,${0.5 * vigIntensity})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Blood overlay edges ────────────────────────────────────────────
    const blood = useGameStore.getState().effects.bloodIntensity;
    if (blood > 0.01) {
      // Bottom blood pool
      const bGrad = ctx.createRadialGradient(w / 2, h + 40, 0, w / 2, h + 40, h * 0.7);
      bGrad.addColorStop(0, `rgba(120,15,10,${blood * 0.15})`);
      bGrad.addColorStop(0.6, `rgba(100,10,8,${blood * 0.08})`);
      bGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, w, h);

      // Top blood streaks
      for (let i = 0; i < 3; i++) {
        const bx = w * (0.2 + i * 0.3) + Math.sin(gameTime * 0.5 + i) * 10;
        const by = h * 0.05;
        const streakGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 30 + blood * 40);
        streakGrad.addColorStop(0, `rgba(120,15,10,${blood * 0.1})`);
        streakGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = streakGrad;
        ctx.fillRect(bx - 30, 0, 60, 100);
      }
    }

    // ── Scanlines (very subtle) ────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // ── Film grain ─────────────────────────────────────────────────────
    if (quality !== 'low') {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.012})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}
