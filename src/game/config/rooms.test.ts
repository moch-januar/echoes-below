import { describe, expect, it } from 'vitest';
import { ROOMS, START_POSITIONS, getRoomConnections } from './rooms';
import { ITEM_PICKUPS } from './itemPickups';
import { ENEMY_TEMPLATES, getEnemyPlacements } from './enemies';
import { ITEM_TEMPLATES } from '../state/inventoryStore';
import { isHazardTile, isWalkableTile } from '../../utils/helpers';

const TILE = 20;

describe('room spawn positions', () => {
  it('places every configured start position inside a walkable room tile', () => {
    for (const [roomId, pos] of Object.entries(START_POSITIONS)) {
      const room = ROOMS[roomId];
      expect(room, `${roomId} room exists`).toBeDefined();

      const tileX = Math.floor(pos.x / TILE);
      const tileY = Math.floor(pos.y / TILE);
      const tile = room?.tiles[tileY]?.[tileX];

      expect(tileX, `${roomId} start x is inside room`).toBeGreaterThanOrEqual(0);
      expect(tileX, `${roomId} start x is inside room`).toBeLessThan(room!.width);
      expect(tileY, `${roomId} start y is inside room`).toBeGreaterThanOrEqual(0);
      expect(tileY, `${roomId} start y is inside room`).toBeLessThan(room!.height);
      expect(isWalkableTile(tile ?? 0), `${roomId} start tile is walkable`).toBe(true);
    }
  });

  it('keeps every configured pickup tied to a valid item template and room', () => {
    for (const pickup of ITEM_PICKUPS) {
      expect(ROOMS[pickup.roomId], `${pickup.id} room exists`).toBeDefined();
      expect(ITEM_TEMPLATES[pickup.templateId], `${pickup.id} item template exists`).toBeDefined();
      expect(pickup.quantity, `${pickup.id} quantity`).toBeGreaterThan(0);
    }
  });

  it('places every configured pickup on a player-accessible tile', () => {
    for (const pickup of ITEM_PICKUPS) {
      const room = ROOMS[pickup.roomId];
      const tileX = Math.floor(pickup.x / TILE);
      const tileY = Math.floor(pickup.y / TILE);
      const tile = room?.tiles[tileY]?.[tileX] ?? 0;

      expect(
        isWalkableTile(tile) || isHazardTile(tile),
        `${pickup.id} should be on walkable or hazard tile ${tileX},${tileY}`,
      ).toBe(true);
    }
  });

  it('keeps enemy placements stable, unique, and inside valid rooms', () => {
    const ids = new Set<string>();

    for (const placement of getEnemyPlacements()) {
      const room = ROOMS[placement.roomId];
      const tileX = Math.floor(placement.x / TILE);
      const tileY = Math.floor(placement.y / TILE);
      const tile = room?.tiles[tileY]?.[tileX] ?? 0;

      expect(placement.id, `${placement.templateId} placement id`).toMatch(/^enemy_[a-z0-9_]+$/);
      expect(ids.has(placement.id), `${placement.id} is unique`).toBe(false);
      expect(ENEMY_TEMPLATES[placement.templateId], `${placement.id} template exists`).toBeDefined();
      expect(room, `${placement.id} room exists`).toBeDefined();
      expect(
        isWalkableTile(tile) || isHazardTile(tile),
        `${placement.id} should spawn on player-accessible tile ${tileX},${tileY}`,
      ).toBe(true);

      ids.add(placement.id);
    }
  });

  it('provides runtime sources for every key-locked door item', () => {
    const sourcedItems = new Set<string>([
      'utility_knife',
      'pistol',
      'pistol_ammo',
      'security_badge', // reward from the specimen symbol puzzle
      ...ITEM_PICKUPS.map((pickup) => pickup.templateId),
    ]);

    for (const enemy of Object.values(ENEMY_TEMPLATES)) {
      for (const drop of enemy.dropsOnDeath ?? []) sourcedItems.add(drop);
    }

    for (const room of Object.values(ROOMS)) {
      for (const door of room.doors) {
        if (door.lockType === 'key' && door.lockKey) {
          expect(sourcedItems.has(door.lockKey), `${door.id} key source for ${door.lockKey}`).toBe(true);
        }
      }
    }
  });

  it('keeps the power room reachable before power restoration and exposes the escape platform after power is restored', () => {
    const corridorPowerDoor = ROOMS.corridor.doors.find((door) => door.targetRoom === 'power');
    expect(corridorPowerDoor?.lockType).not.toBe('power');

    const connections = getRoomConnections();
    expect(connections.some((conn) => conn.to === 'escape')).toBe(true);
  });
});
