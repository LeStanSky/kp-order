import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const KEY_PREFIX = 'erpstock';

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(`${KEY_PREFIX}:${key}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(`${KEY_PREFIX}:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(key: string): Promise<void> {
    await redis.del(`${KEY_PREFIX}:${key}`);
  },

  async delByPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${KEY_PREFIX}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Cache invalidated ${keys.length} keys matching ${pattern}`);
    }
  },

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(`${KEY_PREFIX}:${key}`)) === 1;
  },
};
