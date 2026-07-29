// ── Helper Utilities ────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function tileToWorld(tx: number, ty: number, tileSize: number = 20): { x: number; y: number } {
  return { x: tx * tileSize + tileSize / 2, y: ty * tileSize + tileSize / 2 };
}

export function worldToTile(x: number, y: number, tileSize: number = 20): { tx: number; ty: number } {
  return { tx: Math.floor(x / tileSize), ty: Math.floor(y / tileSize) };
}

export function isWalkableTile(tile: number): boolean {
  return tile === 1 || tile === 6 || tile === 7;
}

export function isHazardTile(tile: number): boolean {
  return tile === 3 || tile === 4;
}

export function getTileSpeedModifier(tile: number): number {
  if (tile === 3) return 0.5; // water slows
  if (tile === 4) return 0.7; // spores slow
  return 1;
}
