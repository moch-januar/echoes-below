import { describe, expect, it } from 'vitest';
import { ROOMS, START_POSITIONS } from './rooms';
import { isWalkableTile } from '../../utils/helpers';

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
});
