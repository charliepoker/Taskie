"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.disconnectRedis = exports.disconnectDatabase = exports.connectDatabase = exports.getRedisClient = exports.prisma = exports.handleRedisError = exports.RedisError = exports.handlePrismaError = exports.DatabaseError = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
    ],
});
class DatabaseConnection {
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
            });
        }
        return DatabaseConnection.instance;
    }
    static async getRedisClient() {
        if (!DatabaseConnection.redisClient) {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            DatabaseConnection.redisClient = (0, redis_1.createClient)({
                url: redisUrl,
            });
            DatabaseConnection.redisClient.on('error', (err) => {
                logger.error('Redis Client Error:', err);
            });
            DatabaseConnection.redisClient.on('connect', () => {
                logger.info('Redis Client Connected');
            });
            DatabaseConnection.redisClient.on('ready', () => {
                logger.info('Redis Client Ready');
            });
            DatabaseConnection.redisClient.on('end', () => {
                logger.info('Redis Client Disconnected');
            });
            await DatabaseConnection.redisClient.connect();
        }
        return DatabaseConnection.redisClient;
    }
    static async connectDatabase() {
        try {
            const prisma = DatabaseConnection.getInstance();
            await prisma.$connect();
            logger.info('Database connected successfully');
        }
        catch (error) {
            logger.error('Failed to connect to database:', error);
            throw new Error('Database connection failed');
        }
    }
    static async disconnectDatabase() {
        try {
            if (DatabaseConnection.instance) {
                await DatabaseConnection.instance.$disconnect();
                logger.info('Database disconnected successfully');
            }
        }
        catch (error) {
            logger.error('Error disconnecting from database:', error);
        }
    }
    static async disconnectRedis() {
        try {
            if (DatabaseConnection.redisClient) {
                await DatabaseConnection.redisClient.quit();
                logger.info('Redis disconnected successfully');
            }
        }
        catch (error) {
            logger.error('Error disconnecting from Redis:', error);
        }
    }
    static async healthCheck() {
        const health = {
            database: false,
            redis: false,
        };
        try {
            const prisma = DatabaseConnection.getInstance();
            await prisma.$queryRaw `SELECT 1`;
            health.database = true;
        }
        catch (error) {
            logger.error('Database health check failed:', error);
        }
        try {
            const redis = await DatabaseConnection.getRedisClient();
            await redis.ping();
            health.redis = true;
        }
        catch (error) {
            logger.error('Redis health check failed:', error);
        }
        return health;
    }
}
class DatabaseError extends Error {
    constructor(message, code = 'DATABASE_ERROR', statusCode = 500) {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.DatabaseError = DatabaseError;
const handlePrismaError = (error) => {
    logger.error('Prisma Error:', error);
    switch (error.code) {
        case 'P2002':
            return new DatabaseError('A record with this information already exists', 'UNIQUE_CONSTRAINT_VIOLATION', 409);
        case 'P2025':
            return new DatabaseError('Record not found', 'RECORD_NOT_FOUND', 404);
        case 'P2003':
            return new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY_VIOLATION', 400);
        case 'P2014':
            return new DatabaseError('Invalid ID provided', 'INVALID_ID', 400);
        case 'P1001':
            return new DatabaseError('Cannot reach database server', 'CONNECTION_ERROR', 503);
        case 'P1008':
            return new DatabaseError('Operations timed out', 'TIMEOUT_ERROR', 408);
        default:
            return new DatabaseError('An unexpected database error occurred', 'UNKNOWN_DATABASE_ERROR', 500);
    }
};
exports.handlePrismaError = handlePrismaError;
class RedisError extends Error {
    constructor(message, code = 'REDIS_ERROR', statusCode = 500) {
        super(message);
        this.name = 'RedisError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.RedisError = RedisError;
const handleRedisError = (error) => {
    logger.error('Redis Error:', error);
    if (error.code === 'ECONNREFUSED') {
        return new RedisError('Cannot connect to Redis server', 'REDIS_CONNECTION_ERROR', 503);
    }
    if (error.code === 'ETIMEDOUT') {
        return new RedisError('Redis operation timed out', 'REDIS_TIMEOUT_ERROR', 408);
    }
    return new RedisError('An unexpected Redis error occurred', 'UNKNOWN_REDIS_ERROR', 500);
};
exports.handleRedisError = handleRedisError;
exports.prisma = DatabaseConnection.getInstance();
exports.getRedisClient = DatabaseConnection.getRedisClient;
exports.connectDatabase = DatabaseConnection.connectDatabase;
exports.disconnectDatabase = DatabaseConnection.disconnectDatabase;
exports.disconnectRedis = DatabaseConnection.disconnectRedis;
exports.healthCheck = DatabaseConnection.healthCheck;
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await (0, exports.disconnectDatabase)();
    await (0, exports.disconnectRedis)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await (0, exports.disconnectDatabase)();
    await (0, exports.disconnectRedis)();
    process.exit(0);
});
//# sourceMappingURL=database.js.map