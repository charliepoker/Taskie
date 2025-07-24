import { RedisClientType } from 'redis';
import { getRedisClient, handleRedisError } from './database';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export class RedisService {
  private client: RedisClientType | null = null;

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = await getRedisClient();
    }
    return this.client;
  }

  /**
   * Set a key-value pair with optional expiration
   */
  async set(
    key: string,
    value: string,
    expirationInSeconds?: number
  ): Promise<void> {
    try {
      const client = await this.getClient();
      if (expirationInSeconds) {
        await client.setEx(key, expirationInSeconds, value);
      } else {
        await client.set(key, value);
      }
      logger.debug(`Redis SET: ${key}`);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const client = await this.getClient();
      const value = await client.get(key);
      logger.debug(`Redis GET: ${key} = ${value ? 'found' : 'not found'}`);
      return value;
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      const result = await client.del(key);
      logger.debug(`Redis DEL: ${key}`);
      return result;
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.ttl(key);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Store JSON object
   */
  async setJSON(
    key: string,
    value: any,
    expirationInSeconds?: number
  ): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, expirationInSeconds);
  }

  /**
   * Get JSON object
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.incr(key);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Increment by a specific amount
   */
  async incrBy(key: string, increment: number): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.incrBy(key, increment);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Add items to a set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.sAdd(key, members);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      return await client.sMembers(key);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Remove items from a set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const client = await this.getClient();
      return await client.sRem(key, members);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.sIsMember(key, member);
      return Boolean(result);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = await this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;

      const client = await this.getClient();
      return await client.del(keys);
    } catch (error) {
      throw handleRedisError(error);
    }
  }

  /**
   * Flush all data from Redis
   */
  async flushAll(): Promise<void> {
    try {
      const client = await this.getClient();
      await client.flushAll();
      logger.info('Redis: All data flushed');
    } catch (error) {
      throw handleRedisError(error);
    }
  }
}

// Session management utilities
export class SessionManager {
  private redis: RedisService;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_EXPIRATION = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new RedisService();
  }

  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    userId: string,
    data: any,
    expirationInSeconds?: number
  ): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    };

    await Promise.all([
      this.redis.setJSON(
        sessionKey,
        sessionData,
        expirationInSeconds || this.DEFAULT_EXPIRATION
      ),
      this.redis.sadd(userSessionsKey, sessionId),
      this.redis.expire(
        userSessionsKey,
        expirationInSeconds || this.DEFAULT_EXPIRATION
      ),
    ]);
  }

  /**
   * Get session data
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    return await this.redis.getJSON<T>(sessionKey);
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    data: any,
    expirationInSeconds?: number
  ): Promise<void> {
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

    await this.redis.setJSON(
      sessionKey,
      updatedSession,
      expirationInSeconds || this.DEFAULT_EXPIRATION
    );
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const session = await this.redis.getJSON<{ userId: string }>(sessionKey);

    if (session) {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
      await Promise.all([
        this.redis.del(sessionKey),
        this.redis.srem(userSessionsKey, sessionId),
      ]);
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map((id) => `${this.SESSION_PREFIX}${id}`);
      // Delete sessions one by one to avoid spread operator issues
      await Promise.all([
        ...sessionKeys.map((key) => this.redis.del(key)),
        this.redis.del(userSessionsKey),
      ]);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    return await this.redis.smembers(userSessionsKey);
  }

  /**
   * Extend session expiration
   */
  async extendSession(
    sessionId: string,
    expirationInSeconds?: number
  ): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redis.expire(
      sessionKey,
      expirationInSeconds || this.DEFAULT_EXPIRATION
    );
  }
}

// Export instances
export const redisService = new RedisService();
export const sessionManager = new SessionManager();
