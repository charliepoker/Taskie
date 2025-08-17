export declare class RedisService {
    private client;
    private getClient;
    set(key: string, value: string, expirationInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    setJSON(key: string, value: any, expirationInSeconds?: number): Promise<void>;
    getJSON<T>(key: string): Promise<T | null>;
    incr(key: string): Promise<number>;
    incrBy(key: string, increment: number): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    srem(key: string, ...members: string[]): Promise<number>;
    sismember(key: string, member: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    deletePattern(pattern: string): Promise<number>;
    flushAll(): Promise<void>;
}
export declare class SessionManager {
    private redis;
    private readonly SESSION_PREFIX;
    private readonly USER_SESSIONS_PREFIX;
    private readonly DEFAULT_EXPIRATION;
    constructor();
    createSession(sessionId: string, userId: string, data: any, expirationInSeconds?: number): Promise<void>;
    getSession<T>(sessionId: string): Promise<T | null>;
    updateSession(sessionId: string, data: any, expirationInSeconds?: number): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    deleteUserSessions(userId: string): Promise<void>;
    getUserSessions(userId: string): Promise<string[]>;
    extendSession(sessionId: string, expirationInSeconds?: number): Promise<void>;
}
export declare const redisService: RedisService;
export declare const sessionManager: SessionManager;
//# sourceMappingURL=redis.d.ts.map