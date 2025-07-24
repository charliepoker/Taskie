import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Prisma Client singleton
class DatabaseConnection {
  private static instance: PrismaClient;
  private static redisClient: RedisClientType;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
      });
    }

    return DatabaseConnection.instance;
  }

  public static async getRedisClient(): Promise<RedisClientType> {
    if (!DatabaseConnection.redisClient) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      DatabaseConnection.redisClient = createClient({
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

  public static async connectDatabase(): Promise<void> {
    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw new Error('Database connection failed');
    }
  }

  public static async disconnectDatabase(): Promise<void> {
    try {
      if (DatabaseConnection.instance) {
        await DatabaseConnection.instance.$disconnect();
        logger.info('Database disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  public static async disconnectRedis(): Promise<void> {
    try {
      if (DatabaseConnection.redisClient) {
        await DatabaseConnection.redisClient.quit();
        logger.info('Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  public static async healthCheck(): Promise<{
    database: boolean;
    redis: boolean;
  }> {
    const health = {
      database: false,
      redis: false,
    };

    try {
      const prisma = DatabaseConnection.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      health.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    try {
      const redis = await DatabaseConnection.getRedisClient();
      await redis.ping();
      health.redis = true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    return health;
  }
}

// Database error handling utilities
export class DatabaseError extends Error {
  public code: string;
  public statusCode: number;

  constructor(
    message: string,
    code: string = 'DATABASE_ERROR',
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const handlePrismaError = (error: any): DatabaseError => {
  logger.error('Prisma Error:', error);

  // Handle known Prisma error codes
  switch (error.code) {
    case 'P2002':
      return new DatabaseError(
        'A record with this information already exists',
        'UNIQUE_CONSTRAINT_VIOLATION',
        409
      );
    case 'P2025':
      return new DatabaseError('Record not found', 'RECORD_NOT_FOUND', 404);
    case 'P2003':
      return new DatabaseError(
        'Foreign key constraint violation',
        'FOREIGN_KEY_VIOLATION',
        400
      );
    case 'P2014':
      return new DatabaseError('Invalid ID provided', 'INVALID_ID', 400);
    case 'P1001':
      return new DatabaseError(
        'Cannot reach database server',
        'CONNECTION_ERROR',
        503
      );
    case 'P1008':
      return new DatabaseError('Operations timed out', 'TIMEOUT_ERROR', 408);
    default:
      return new DatabaseError(
        'An unexpected database error occurred',
        'UNKNOWN_DATABASE_ERROR',
        500
      );
  }
};

// Redis error handling utilities
export class RedisError extends Error {
  public code: string;
  public statusCode: number;

  constructor(
    message: string,
    code: string = 'REDIS_ERROR',
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'RedisError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const handleRedisError = (error: any): RedisError => {
  logger.error('Redis Error:', error);

  if (error.code === 'ECONNREFUSED') {
    return new RedisError(
      'Cannot connect to Redis server',
      'REDIS_CONNECTION_ERROR',
      503
    );
  }

  if (error.code === 'ETIMEDOUT') {
    return new RedisError(
      'Redis operation timed out',
      'REDIS_TIMEOUT_ERROR',
      408
    );
  }

  return new RedisError(
    'An unexpected Redis error occurred',
    'UNKNOWN_REDIS_ERROR',
    500
  );
};

// Export the database connection instance
export const prisma = DatabaseConnection.getInstance();
export const getRedisClient = DatabaseConnection.getRedisClient;
export const connectDatabase = DatabaseConnection.connectDatabase;
export const disconnectDatabase = DatabaseConnection.disconnectDatabase;
export const disconnectRedis = DatabaseConnection.disconnectRedis;
export const healthCheck = DatabaseConnection.healthCheck;

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
});
