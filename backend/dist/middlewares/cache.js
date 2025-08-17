"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmer = exports.CacheManager = void 0;
exports.cache = cache;
exports.conditionalCache = conditionalCache;
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
redis.connect().catch(console.error);
function cache(options = {}) {
    const { ttl = 300, keyPrefix = 'api', skipCache = false, varyBy = [], } = options;
    return async (req, res, next) => {
        if (skipCache || req.method !== 'GET') {
            return next();
        }
        try {
            const cacheKey = generateCacheKey(req, keyPrefix, varyBy);
            const cachedResponse = await redis.get(cacheKey);
            if (cachedResponse) {
                const parsed = JSON.parse(cachedResponse);
                res.set({
                    'X-Cache': 'HIT',
                    'Cache-Control': `public, max-age=${ttl}`,
                    ETag: parsed.etag,
                });
                return res.status(parsed.status).json(parsed.data);
            }
            const originalJson = res.json;
            res.json = function (data) {
                const status = res.statusCode;
                if (status >= 200 && status < 300) {
                    const etag = generateETag(data);
                    const cacheData = {
                        status,
                        data,
                        etag,
                        timestamp: Date.now(),
                    };
                    redis
                        .setEx(cacheKey, ttl, JSON.stringify(cacheData))
                        .catch(console.error);
                    res.set({
                        'X-Cache': 'MISS',
                        'Cache-Control': `public, max-age=${ttl}`,
                        ETag: etag,
                    });
                }
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
}
function generateCacheKey(req, prefix, varyBy) {
    const url = req.originalUrl || req.url;
    const method = req.method;
    const userId = req.user?.id || 'anonymous';
    let key = `${prefix}:${method}:${url}:${userId}`;
    for (const header of varyBy) {
        const value = req.get(header) || '';
        key += `:${header}:${value}`;
    }
    return key;
}
function generateETag(data) {
    const crypto = require('crypto');
    const content = JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
}
class CacheManager {
    static async invalidatePattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
            }
        }
        catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
    static async invalidateUserCache(userId) {
        await this.invalidatePattern(`api:*:${userId}*`);
    }
    static async invalidateProjectCache(projectId) {
        await this.invalidatePattern(`api:*project*${projectId}*`);
    }
    static async invalidateTaskCache(taskId) {
        const pattern = taskId ? `api:*task*${taskId}*` : 'api:*task*';
        await this.invalidatePattern(pattern);
    }
    static async clearAll() {
        try {
            await redis.flushAll();
        }
        catch (error) {
            console.error('Cache clear error:', error);
        }
    }
    static async getStats() {
        try {
            const info = await redis.info('stats');
            const keyspace = await redis.info('keyspace');
            const stats = {
                keys: 0,
                memory: '0B',
                hits: 0,
                misses: 0,
            };
            const keyspaceMatch = keyspace.match(/keys=(\d+)/);
            if (keyspaceMatch) {
                stats.keys = parseInt(keyspaceMatch[1]);
            }
            const hitsMatch = info.match(/keyspace_hits:(\d+)/);
            const missesMatch = info.match(/keyspace_misses:(\d+)/);
            if (hitsMatch)
                stats.hits = parseInt(hitsMatch[1]);
            if (missesMatch)
                stats.misses = parseInt(missesMatch[1]);
            return stats;
        }
        catch (error) {
            console.error('Cache stats error:', error);
            return { keys: 0, memory: '0B', hits: 0, misses: 0 };
        }
    }
}
exports.CacheManager = CacheManager;
function conditionalCache(condition, options = {}) {
    return (req, res, next) => {
        if (condition(req)) {
            return cache(options)(req, res, next);
        }
        return next();
    };
}
class CacheWarmer {
    static async warmCommonQueries() {
        console.log('Cache warming not implemented yet');
    }
}
exports.CacheWarmer = CacheWarmer;
//# sourceMappingURL=cache.js.map