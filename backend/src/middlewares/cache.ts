import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

// Redis client for caching
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis
redis.connect().catch(console.error);

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  skipCache?: boolean;
  varyBy?: string[]; // Headers to vary cache by
}

/**
 * Cache middleware for API responses
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api',
    skipCache = false,
    varyBy = [],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipCache || req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req, keyPrefix, varyBy);

      // Try to get from cache
      const cachedResponse = await redis.get(cacheKey);

      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);

        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`,
          ETag: parsed.etag,
        });

        return res.status(parsed.status).json(parsed.data);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function (data: any) {
        const status = res.statusCode;

        // Only cache successful responses
        if (status >= 200 && status < 300) {
          const etag = generateETag(data);
          const cacheData = {
            status,
            data,
            etag,
            timestamp: Date.now(),
          };

          // Cache the response asynchronously
          redis
            .setEx(cacheKey, ttl, JSON.stringify(cacheData))
            .catch(console.error);

          // Set cache headers
          res.set({
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}`,
            ETag: etag,
          });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Generate cache key based on request
 */
function generateCacheKey(
  req: Request,
  prefix: string,
  varyBy: string[]
): string {
  const url = req.originalUrl || req.url;
  const method = req.method;
  const userId = (req as any).user?.id || 'anonymous';

  let key = `${prefix}:${method}:${url}:${userId}`;

  // Add vary headers to key
  for (const header of varyBy) {
    const value = req.get(header) || '';
    key += `:${header}:${value}`;
  }

  return key;
}

/**
 * Generate ETag for response data
 */
function generateETag(data: any): string {
  const crypto = require('crypto');
  const content = JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Cache invalidation utilities
 */
export class CacheManager {
  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate user-specific cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidatePattern(`api:*:${userId}*`);
  }

  /**
   * Invalidate project-related cache
   */
  static async invalidateProjectCache(projectId: string): Promise<void> {
    await this.invalidatePattern(`api:*project*${projectId}*`);
  }

  /**
   * Invalidate task-related cache
   */
  static async invalidateTaskCache(taskId?: string): Promise<void> {
    const pattern = taskId ? `api:*task*${taskId}*` : 'api:*task*';
    await this.invalidatePattern(pattern);
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      await redis.flushAll();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: number;
    misses: number;
  }> {
    try {
      const info = await redis.info('stats');
      const keyspace = await redis.info('keyspace');

      // Parse Redis info
      const stats = {
        keys: 0,
        memory: '0B',
        hits: 0,
        misses: 0,
      };

      // Extract key count
      const keyspaceMatch = keyspace.match(/keys=(\d+)/);
      if (keyspaceMatch) {
        stats.keys = parseInt(keyspaceMatch[1]);
      }

      // Extract hit/miss stats
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);

      if (hitsMatch) stats.hits = parseInt(hitsMatch[1]);
      if (missesMatch) stats.misses = parseInt(missesMatch[1]);

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: '0B', hits: 0, misses: 0 };
    }
  }
}

/**
 * Conditional cache based on user role or data sensitivity
 */
export function conditionalCache(
  condition: (req: Request) => boolean,
  options: CacheOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return cache(options)(req, res, next);
    }
    return next();
  };
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm cache for common queries
   */
  static async warmCommonQueries(): Promise<void> {
    // This would typically make requests to common endpoints
    // to populate the cache during application startup
    console.log('Cache warming not implemented yet');
  }
}
