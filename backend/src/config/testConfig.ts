/**
 * Test-specific configuration overrides
 * This file contains configurations that are specifically for the test environment
 */

import { AppConfig } from './types';

/**
 * Get test-specific configuration overrides
 */
export function getTestConfigOverrides(): Partial<AppConfig> {
  return {
    logging: {
      level: 'error',
      silent: true,
      format: 'simple',
      enableConsole: false,
      enableFile: false,
      filename: 'logs/test.log',
      maxsize: 1048576, // 1MB
      maxFiles: 1,
    },
    database: {
      url:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5433/taskie_test',
      maxConnections: 5,
      connectionTimeout: 5000,
      queryTimeout: 5000,
      resetBetweenTests: true,
      runMigrations: true,
      enableLogging: false,
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6380',
      host: 'localhost',
      port: 6380,
      db: 1,
      connectTimeout: 5000,
      commandTimeout: 2000,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      mockMode: true,
      enableOfflineQueue: false,
    },
    security: {
      disableRateLimit: true,
      rateLimits: {
        auth: {
          windowMs: 60 * 1000, // 1 minute
          max: 1000,
          skipSuccessfulRequests: true,
          skipFailedRequests: false,
          standardHeaders: true,
          legacyHeaders: false,
        },
        api: {
          windowMs: 60 * 1000, // 1 minute
          max: 10000,
          skipSuccessfulRequests: true,
          skipFailedRequests: false,
          standardHeaders: true,
          legacyHeaders: false,
        },
        strict: {
          windowMs: 60 * 1000, // 1 minute
          max: 1000,
          skipSuccessfulRequests: true,
          skipFailedRequests: false,
          standardHeaders: true,
          legacyHeaders: false,
        },
      },
      cors: {
        origin: true, // Allow all origins in test
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400,
      },
      csp: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:'],
          connectSrc: ["'self'", 'https:'],
          frameAncestors: ["'none'"],
        },
      },
      requestLimits: {
        json: '10mb',
        urlencoded: '10mb',
        parameterLimit: 1000,
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      },
      sqlInjectionPatterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(--|\/\*|\*\/|;|'|"|`)/g,
        /(\bOR\b|\bAND\b).*?[=<>]/gi,
        /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b/gi,
      ],
      xssPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
      ],
      ipFilter: {
        whitelist: [],
        blacklist: [],
      },
      auditLog: {
        level: 'error',
        filename: 'logs/test-security-audit.log',
        maxsize: 1048576, // 1MB
        maxFiles: 1,
        tailable: false,
        enabled: false,
      },
      jwt: {
        secret: 'test-jwt-secret-key-for-testing-only',
        refreshSecret: 'test-jwt-refresh-secret-key-for-testing-only',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        algorithm: 'HS256',
      },
      bcrypt: {
        rounds: 4, // Lower rounds for faster tests
      },
    },
    cors: {
      origin: true, // Allow all origins in test
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400,
    },
  };
}

/**
 * Test environment detection utilities
 */
export const testUtils = {
  isTestEnvironment: () => process.env.NODE_ENV === 'test',
  getTestDatabaseUrl: () =>
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/taskie_test',
  getTestRedisUrl: () => process.env.REDIS_URL || 'redis://localhost:6380',
  shouldMockRedis: () => process.env.REDIS_MOCK_MODE !== 'false',
  shouldDisableRateLimit: () => true,
  getTestJwtSecret: () => 'test-jwt-secret-key-for-testing-only',
  getTestRefreshSecret: () => 'test-jwt-refresh-secret-key-for-testing-only',
};
