"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.redisService = exports.SessionManager = exports.RedisService = void 0;
const database_1 = require("./database");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [new winston_1.default.transports.Console()],
});
class RedisService {
    constructor() {
        this.client = null;
    }
    async getClient() {
        if (!this.client) {
            this.client = await (0, database_1.getRedisClient)();
        }
        return this.client;
    }
    async set(key, value, expirationInSeconds) {
        try {
            const client = await this.getClient();
            if (expirationInSeconds) {
                await client.setEx(key, expirationInSeconds, value);
            }
            else {
                await client.set(key, value);
            }
            logger.debug(`Redis SET: ${key}`);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async get(key) {
        try {
            const client = await this.getClient();
            const value = await client.get(key);
            logger.debug(`Redis GET: ${key} = ${value ? 'found' : 'not found'}`);
            return value;
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async del(key) {
        try {
            const client = await this.getClient();
            const result = await client.del(key);
            logger.debug(`Redis DEL: ${key}`);
            return result;
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async exists(key) {
        try {
            const client = await this.getClient();
            const result = await client.exists(key);
            return result === 1;
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async expire(key, seconds) {
        try {
            const client = await this.getClient();
            const result = await client.expire(key, seconds);
            return result === 1;
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async ttl(key) {
        try {
            const client = await this.getClient();
            return await client.ttl(key);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async setJSON(key, value, expirationInSeconds) {
        const jsonString = JSON.stringify(value);
        await this.set(key, jsonString, expirationInSeconds);
    }
    async getJSON(key) {
        const value = await this.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            logger.error(`Failed to parse JSON for key ${key}:`, error);
            return null;
        }
    }
    async incr(key) {
        try {
            const client = await this.getClient();
            return await client.incr(key);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async incrBy(key, increment) {
        try {
            const client = await this.getClient();
            return await client.incrBy(key, increment);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async sadd(key, ...members) {
        try {
            const client = await this.getClient();
            return await client.sAdd(key, members);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async smembers(key) {
        try {
            const client = await this.getClient();
            return await client.sMembers(key);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async srem(key, ...members) {
        try {
            const client = await this.getClient();
            return await client.sRem(key, members);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async sismember(key, member) {
        try {
            const client = await this.getClient();
            const result = await client.sIsMember(key, member);
            return Boolean(result);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async keys(pattern) {
        try {
            const client = await this.getClient();
            return await client.keys(pattern);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async deletePattern(pattern) {
        try {
            const keys = await this.keys(pattern);
            if (keys.length === 0)
                return 0;
            const client = await this.getClient();
            return await client.del(keys);
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
    async flushAll() {
        try {
            const client = await this.getClient();
            await client.flushAll();
            logger.info('Redis: All data flushed');
        }
        catch (error) {
            throw (0, database_1.handleRedisError)(error);
        }
    }
}
exports.RedisService = RedisService;
class SessionManager {
    constructor() {
        this.SESSION_PREFIX = 'session:';
        this.USER_SESSIONS_PREFIX = 'user_sessions:';
        this.DEFAULT_EXPIRATION = 24 * 60 * 60;
        this.redis = new RedisService();
    }
    async createSession(sessionId, userId, data, expirationInSeconds) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
        const sessionData = {
            userId,
            createdAt: new Date().toISOString(),
            ...data,
        };
        await Promise.all([
            this.redis.setJSON(sessionKey, sessionData, expirationInSeconds || this.DEFAULT_EXPIRATION),
            this.redis.sadd(userSessionsKey, sessionId),
            this.redis.expire(userSessionsKey, expirationInSeconds || this.DEFAULT_EXPIRATION),
        ]);
    }
    async getSession(sessionId) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        return await this.redis.getJSON(sessionKey);
    }
    async updateSession(sessionId, data, expirationInSeconds) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const existingSession = await this.redis.getJSON(sessionKey);
        if (!existingSession) {
            throw new Error('Session not found');
        }
        const updatedSession = {
            ...existingSession,
            ...data,
            updatedAt: new Date().toISOString(),
        };
        await this.redis.setJSON(sessionKey, updatedSession, expirationInSeconds || this.DEFAULT_EXPIRATION);
    }
    async deleteSession(sessionId) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const session = await this.redis.getJSON(sessionKey);
        if (session) {
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
            await Promise.all([
                this.redis.del(sessionKey),
                this.redis.srem(userSessionsKey, sessionId),
            ]);
        }
    }
    async deleteUserSessions(userId) {
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
        const sessionIds = await this.redis.smembers(userSessionsKey);
        if (sessionIds.length > 0) {
            const sessionKeys = sessionIds.map((id) => `${this.SESSION_PREFIX}${id}`);
            await Promise.all([
                ...sessionKeys.map((key) => this.redis.del(key)),
                this.redis.del(userSessionsKey),
            ]);
        }
    }
    async getUserSessions(userId) {
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
        return await this.redis.smembers(userSessionsKey);
    }
    async extendSession(sessionId, expirationInSeconds) {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        await this.redis.expire(sessionKey, expirationInSeconds || this.DEFAULT_EXPIRATION);
    }
}
exports.SessionManager = SessionManager;
exports.redisService = new RedisService();
exports.sessionManager = new SessionManager();
//# sourceMappingURL=redis.js.map