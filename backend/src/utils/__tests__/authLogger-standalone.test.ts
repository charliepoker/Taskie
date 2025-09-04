import { AuthLogger } from '../authLogger';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(() => jest.fn()),
    timestamp: jest.fn(() => jest.fn()),
    errors: jest.fn(() => jest.fn()),
    json: jest.fn(() => jest.fn()),
    colorize: jest.fn(() => jest.fn()),
    simple: jest.fn(() => jest.fn()),
    printf: jest.fn(() => jest.fn()),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('AuthLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuthAttempt', () => {
    it('should log successful authentication attempt', () => {
      const context = {
        requestId: 'test-123',
        email: 'test@example.com',
        action: 'login' as const,
        success: true,
        userId: 'user-123',
        duration: 150,
      };

      expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
    });

    it('should log failed authentication attempt', () => {
      const context = {
        requestId: 'test-456',
        email: 'test@example.com',
        action: 'login' as const,
        success: false,
        duration: 200,
      };

      expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
    });

    it('should handle missing optional fields', () => {
      const context = {
        email: 'test@example.com',
        action: 'register' as const,
        success: true,
      };

      expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
    });

    it('should log different action types', () => {
      const actions = [
        'login',
        'register',
        'refresh_token',
        'password_reset_request',
      ] as const;

      actions.forEach((action) => {
        const context = {
          email: 'test@example.com',
          action,
          success: true,
        };

        expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
      });
    });
  });

  describe('logAuthError', () => {
    it('should log authentication error with full context', () => {
      const errorContext = {
        requestId: 'test-789',
        email: 'test@example.com',
        action: 'login' as const,
        success: false,
        error: new Error('Invalid credentials'),
        errorCode: 'INVALID_CREDENTIALS',
        duration: 100,
        additionalData: {
          attemptCount: 3,
          ipAddress: '192.168.1.1',
        },
      };

      expect(() => AuthLogger.logAuthError(errorContext)).not.toThrow();
    });

    it('should handle error without additional data', () => {
      const errorContext = {
        email: 'test@example.com',
        action: 'login' as const,
        success: false,
        error: new Error('Database connection failed'),
        errorCode: 'DATABASE_ERROR',
      };

      expect(() => AuthLogger.logAuthError(errorContext)).not.toThrow();
    });

    it('should handle different error codes', () => {
      const errorCodes = [
        'USER_NOT_FOUND',
        'INVALID_PASSWORD',
        'TOKEN_EXPIRED',
        'RATE_LIMITED',
        'DATABASE_ERROR',
      ];

      errorCodes.forEach((errorCode) => {
        const errorContext = {
          email: 'test@example.com',
          action: 'login' as const,
          success: false,
          error: new Error('Test error'),
          errorCode,
        };

        expect(() => AuthLogger.logAuthError(errorContext)).not.toThrow();
      });
    });

    it('should handle non-Error objects', () => {
      const errorContext = {
        email: 'test@example.com',
        action: 'login' as const,
        success: false,
        error: 'String error message',
        errorCode: 'UNKNOWN_ERROR',
      };

      expect(() => AuthLogger.logAuthError(errorContext as any)).not.toThrow();
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log successful database operation', () => {
      expect(() =>
        AuthLogger.logDatabaseOperation('user_lookup', true, 50, {
          requestId: 'test-db-1',
          query: 'SELECT * FROM users WHERE email = ?',
          userId: 'user-123',
        })
      ).not.toThrow();
    });

    it('should log failed database operation', () => {
      expect(() =>
        AuthLogger.logDatabaseOperation('user_creation', false, 200, {
          requestId: 'test-db-2',
          query: 'INSERT INTO users ...',
          error: 'Duplicate key violation',
        })
      ).not.toThrow();
    });

    it('should handle different operation types', () => {
      const operations = [
        'user_lookup',
        'user_creation',
        'user_update',
        'token_creation',
        'password_reset_token_lookup',
      ];

      operations.forEach((operation) => {
        expect(() =>
          AuthLogger.logDatabaseOperation(operation, true, 100, {
            requestId: 'test-op',
          })
        ).not.toThrow();
      });
    });

    it('should handle operations without context', () => {
      expect(() =>
        AuthLogger.logDatabaseOperation('user_lookup', true, 25)
      ).not.toThrow();
    });
  });

  describe('logPasswordOperation', () => {
    it('should log successful password hashing', () => {
      expect(() =>
        AuthLogger.logPasswordOperation('hash', true, 150, {
          requestId: 'test-pwd-1',
        })
      ).not.toThrow();
    });

    it('should log failed password comparison', () => {
      expect(() =>
        AuthLogger.logPasswordOperation('compare', false, 75, {
          requestId: 'test-pwd-2',
          errorMessage: 'Comparison failed',
        })
      ).not.toThrow();
    });

    it('should handle different password operations', () => {
      const operations = ['hash', 'compare'];

      operations.forEach((operation) => {
        expect(() =>
          AuthLogger.logPasswordOperation(operation, true, 100, {
            requestId: 'test-pwd',
          })
        ).not.toThrow();
      });
    });

    it('should log performance metrics', () => {
      const durations = [50, 100, 200, 500, 1000];

      durations.forEach((duration) => {
        expect(() =>
          AuthLogger.logPasswordOperation('hash', true, duration, {
            requestId: 'perf-test',
          })
        ).not.toThrow();
      });
    });
  });

  describe('logTokenOperation', () => {
    it('should log successful token generation', () => {
      expect(() =>
        AuthLogger.logTokenOperation('generate', true, {
          requestId: 'test-token-1',
          userId: 'user-123',
          expiresIn: '15m',
        })
      ).not.toThrow();
    });

    it('should log failed token verification', () => {
      expect(() =>
        AuthLogger.logTokenOperation('verify', false, {
          requestId: 'test-token-2',
          tokenType: 'access',
          errorMessage: 'Token expired',
        })
      ).not.toThrow();
    });

    it('should handle different token operations', () => {
      const operations = ['generate', 'verify', 'refresh'];

      operations.forEach((operation) => {
        expect(() =>
          AuthLogger.logTokenOperation(operation, true, {
            requestId: 'test-token',
            userId: 'user-123',
          })
        ).not.toThrow();
      });
    });

    it('should handle different token types', () => {
      const tokenTypes = ['access', 'refresh'];

      tokenTypes.forEach((tokenType) => {
        expect(() =>
          AuthLogger.logTokenOperation('verify', true, {
            requestId: 'test-token',
            tokenType,
          })
        ).not.toThrow();
      });
    });
  });

  describe('Performance and Security Monitoring', () => {
    it('should track authentication performance metrics', () => {
      const performanceData = [
        { operation: 'login', duration: 150, success: true },
        { operation: 'login', duration: 200, success: false },
        { operation: 'register', duration: 300, success: true },
        { operation: 'token_refresh', duration: 50, success: true },
      ];

      performanceData.forEach(({ operation, duration, success }) => {
        expect(() =>
          AuthLogger.logAuthAttempt({
            action: operation as any,
            email: 'perf@example.com',
            success,
            duration,
            requestId: 'perf-test',
          })
        ).not.toThrow();
      });
    });

    it('should track security events', () => {
      const securityEvents = [
        {
          event: 'multiple_failed_attempts',
          context: { attemptCount: 5, timeWindow: '5min' },
        },
        {
          event: 'suspicious_login_pattern',
          context: { ipAddress: '192.168.1.1', userAgent: 'suspicious-bot' },
        },
        {
          event: 'password_reset_abuse',
          context: { requestCount: 10, timeWindow: '1hour' },
        },
      ];

      securityEvents.forEach(({ event, context }) => {
        expect(() =>
          AuthLogger.logAuthError({
            action: 'security_event' as any,
            email: 'security@example.com',
            success: false,
            error: new Error(event),
            errorCode: 'SECURITY_EVENT',
            additionalData: context,
          })
        ).not.toThrow();
      });
    });

    it('should handle high-frequency logging without errors', () => {
      // Simulate high-frequency authentication attempts
      for (let i = 0; i < 100; i++) {
        expect(() =>
          AuthLogger.logAuthAttempt({
            action: 'login',
            email: `user${i}@example.com`,
            success: i % 2 === 0,
            duration: Math.random() * 500,
            requestId: `load-test-${i}`,
          })
        ).not.toThrow();
      }
    });

    it('should track rate limiting events', () => {
      const rateLimitEvents = [
        { type: 'login_attempts', limit: 5, window: '15min' },
        { type: 'password_reset', limit: 3, window: '1hour' },
        { type: 'token_refresh', limit: 10, window: '5min' },
      ];

      rateLimitEvents.forEach(({ type, limit, window }) => {
        expect(() =>
          AuthLogger.logAuthError({
            action: 'rate_limit' as any,
            email: 'ratelimit@example.com',
            success: false,
            error: new Error('Rate limit exceeded'),
            errorCode: 'RATE_LIMITED',
            additionalData: { type, limit, window },
          })
        ).not.toThrow();
      });
    });
  });

  describe('Error Context Capture', () => {
    it('should capture detailed error context for debugging', () => {
      const detailedError = {
        requestId: 'debug-test-1',
        email: 'debug@example.com',
        action: 'login' as const,
        success: false,
        error: new Error('Authentication failed'),
        errorCode: 'AUTH_FAILED',
        duration: 250,
        additionalData: {
          userAgent: 'Mozilla/5.0...',
          ipAddress: '192.168.1.100',
          timestamp: new Date().toISOString(),
          sessionId: 'session-123',
          attemptNumber: 3,
          previousAttempts: [
            { timestamp: '2024-01-01T10:00:00Z', result: 'failed' },
            { timestamp: '2024-01-01T10:05:00Z', result: 'failed' },
          ],
        },
      };

      expect(() => AuthLogger.logAuthError(detailedError)).not.toThrow();
    });

    it('should handle stack traces in error objects', () => {
      const errorWithStack = new Error('Database connection timeout');
      errorWithStack.stack = `Error: Database connection timeout
        at AuthService.login (/app/src/services/authService.ts:123:15)
        at AuthController.login (/app/src/controllers/authController.ts:45:20)`;

      const errorContext = {
        action: 'login' as const,
        email: 'stacktrace@example.com',
        success: false,
        error: errorWithStack,
        errorCode: 'DATABASE_TIMEOUT',
      };

      expect(() => AuthLogger.logAuthError(errorContext)).not.toThrow();
    });

    it('should capture performance anomalies', () => {
      const slowOperations = [
        { operation: 'password_hash', duration: 2000 },
        { operation: 'database_query', duration: 5000 },
        { operation: 'token_generation', duration: 1500 },
      ];

      slowOperations.forEach(({ operation, duration }) => {
        expect(() =>
          AuthLogger.logAuthAttempt({
            action: 'performance_anomaly' as any,
            email: 'perf@example.com',
            success: true,
            duration,
            additionalData: {
              operation,
              threshold: 1000,
              severity: 'warning',
            },
          })
        ).not.toThrow();
      });
    });
  });
});
