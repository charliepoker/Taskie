import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import winston from 'winston';
import {
  prisma,
  getRedisClient,
  connectDatabase,
  disconnectDatabase,
  disconnectRedis,
  healthCheck,
  DatabaseError,
  RedisError,
  handlePrismaError,
  handleRedisError,
} from '../database';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('redis');
jest.mock('winston');

const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
};

const mockRedisClient = {
  connect: jest.fn(),
  quit: jest.fn(),
  ping: jest.fn(),
  on: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MockedPrismaClient = PrismaClient as jest.MockedClass<
  typeof PrismaClient
>;
const mockedCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockedWinston = winston as jest.Mocked<typeof winston>;

describe('Database Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedPrismaClient.mockImplementation(() => mockPrismaClient as any);
    mockedCreateClient.mockReturnValue(mockRedisClient as any);
    mockedWinston.createLogger.mockReturnValue(mockLogger as any);
    mockedWinston.format = {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    } as any;
    mockedWinston.transports = {
      Console: jest.fn(),
      File: jest.fn(),
    } as any;
  });

  describe('connectDatabase', () => {
    it('should connect to database successfully', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await connectDatabase();

      expect(mockPrismaClient.$connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database connected successfully'
      );
    });

    it('should throw error when database connection fails', async () => {
      const error = new Error('Connection failed');
      mockPrismaClient.$connect.mockRejectedValue(error);

      await expect(connectDatabase()).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to database:',
        error
      );
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect from database successfully', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await disconnectDatabase();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database disconnected successfully'
      );
    });

    it('should handle disconnect errors gracefully', async () => {
      const error = new Error('Disconnect failed');
      mockPrismaClient.$disconnect.mockRejectedValue(error);

      await disconnectDatabase();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error disconnecting from database:',
        error
      );
    });
  });

  describe('getRedisClient', () => {
    it('should create and connect Redis client', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);

      const client = await getRedisClient();

      expect(mockedCreateClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'ready',
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'end',
        expect.any(Function)
      );
      expect(client).toBe(mockRedisClient);
    });

    it('should use REDIS_URL environment variable when provided', async () => {
      const originalEnv = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://custom:6380';
      mockRedisClient.connect.mockResolvedValue(undefined);

      await getRedisClient();

      expect(mockedCreateClient).toHaveBeenCalledWith({
        url: 'redis://custom:6380',
      });

      process.env.REDIS_URL = originalEnv;
    });
  });

  describe('disconnectRedis', () => {
    it('should disconnect from Redis successfully', async () => {
      mockRedisClient.quit.mockResolvedValue(undefined);
      // First get a client to initialize it
      await getRedisClient();

      await disconnectRedis();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Redis disconnected successfully'
      );
    });

    it('should handle Redis disconnect errors gracefully', async () => {
      const error = new Error('Redis disconnect failed');
      mockRedisClient.quit.mockRejectedValue(error);
      // First get a client to initialize it
      await getRedisClient();

      await disconnectRedis();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error disconnecting from Redis:',
        error
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status for both services', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.connect.mockResolvedValue(undefined);

      const health = await healthCheck();

      expect(health).toEqual({
        database: true,
        redis: true,
      });
    });

    it('should return unhealthy status when database fails', async () => {
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('DB Error'));
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.connect.mockResolvedValue(undefined);

      const health = await healthCheck();

      expect(health).toEqual({
        database: false,
        redis: true,
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error)
      );
    });

    it('should return unhealthy status when Redis fails', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisClient.ping.mockRejectedValue(new Error('Redis Error'));
      mockRedisClient.connect.mockResolvedValue(undefined);

      const health = await healthCheck();

      expect(health).toEqual({
        database: true,
        redis: false,
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Redis health check failed:',
        expect.any(Error)
      );
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with default values', () => {
      const error = new DatabaseError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DatabaseError');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should create DatabaseError with custom values', () => {
      const error = new DatabaseError('Custom error', 'CUSTOM_CODE', 400);

      expect(error.message).toBe('Custom error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('handlePrismaError', () => {
    it('should handle P2002 unique constraint violation', () => {
      const prismaError = { code: 'P2002' };
      const error = handlePrismaError(prismaError);

      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe(
        'A record with this information already exists'
      );
    });

    it('should handle P2025 record not found', () => {
      const prismaError = { code: 'P2025' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('RECORD_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Record not found');
    });

    it('should handle P2003 foreign key violation', () => {
      const prismaError = { code: 'P2003' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Foreign key constraint violation');
    });

    it('should handle P2014 invalid ID', () => {
      const prismaError = { code: 'P2014' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('INVALID_ID');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid ID provided');
    });

    it('should handle P1001 connection error', () => {
      const prismaError = { code: 'P1001' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('CONNECTION_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Cannot reach database server');
    });

    it('should handle P1008 timeout error', () => {
      const prismaError = { code: 'P1008' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
      expect(error.message).toBe('Operations timed out');
    });

    it('should handle unknown error codes', () => {
      const prismaError = { code: 'UNKNOWN_CODE' };
      const error = handlePrismaError(prismaError);

      expect(error.code).toBe('UNKNOWN_DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('An unexpected database error occurred');
    });
  });

  describe('RedisError', () => {
    it('should create RedisError with default values', () => {
      const error = new RedisError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('RedisError');
      expect(error.code).toBe('REDIS_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should create RedisError with custom values', () => {
      const error = new RedisError('Custom error', 'CUSTOM_CODE', 400);

      expect(error.message).toBe('Custom error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('handleRedisError', () => {
    it('should handle ECONNREFUSED error', () => {
      const redisError = { code: 'ECONNREFUSED' };
      const error = handleRedisError(redisError);

      expect(error).toBeInstanceOf(RedisError);
      expect(error.code).toBe('REDIS_CONNECTION_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Cannot connect to Redis server');
    });

    it('should handle ETIMEDOUT error', () => {
      const redisError = { code: 'ETIMEDOUT' };
      const error = handleRedisError(redisError);

      expect(error.code).toBe('REDIS_TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
      expect(error.message).toBe('Redis operation timed out');
    });

    it('should handle unknown error codes', () => {
      const redisError = { code: 'UNKNOWN_CODE' };
      const error = handleRedisError(redisError);

      expect(error.code).toBe('UNKNOWN_REDIS_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('An unexpected Redis error occurred');
    });
  });
});
