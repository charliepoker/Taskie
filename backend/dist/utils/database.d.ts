import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
declare class DatabaseConnection {
    private static instance;
    private static redisClient;
    static getInstance(): PrismaClient;
    static getRedisClient(): Promise<RedisClientType>;
    static connectDatabase(): Promise<void>;
    static disconnectDatabase(): Promise<void>;
    static disconnectRedis(): Promise<void>;
    static healthCheck(): Promise<{
        database: boolean;
        redis: boolean;
    }>;
}
export declare class DatabaseError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code?: string, statusCode?: number);
}
export declare const handlePrismaError: (error: any) => DatabaseError;
export declare class RedisError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code?: string, statusCode?: number);
}
export declare const handleRedisError: (error: any) => RedisError;
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const getRedisClient: typeof DatabaseConnection.getRedisClient;
export declare const connectDatabase: typeof DatabaseConnection.connectDatabase;
export declare const disconnectDatabase: typeof DatabaseConnection.disconnectDatabase;
export declare const disconnectRedis: typeof DatabaseConnection.disconnectRedis;
export declare const healthCheck: typeof DatabaseConnection.healthCheck;
export {};
//# sourceMappingURL=database.d.ts.map