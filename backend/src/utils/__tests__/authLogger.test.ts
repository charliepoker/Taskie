import { AuthLogger } from '../authLogger';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
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

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = AuthLogger.generateRequestId();
      const id2 = AuthLogger.generateRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('logAuthAttempt', () => {
    it('should log successful authentication attempt', () => {
      const context = {
        requestId: 'test-request-id',
        email: 'test@example.com',
        userId: 'user-123',
        action: 'login',
        success: true,
        duration: 100,
      };

      expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
    });

    it('should log failed authentication attempt', () => {
      const context = {
        requestId: 'test-request-id',
        email: 'test@example.com',
        action: 'login',
        success: false,
        duration: 50,
        errorCode: 'INVALID_CREDENTIALS',
      };

      expect(() => AuthLogger.logAuthAttempt(context)).not.toThrow();
    });
  });

  describe('logPasswordOperation', () => {
    it('should log successful password operation', () => {
      expect(() =>
        AuthLogger.logPasswordOperation('hash', true, 100, {
          requestId: 'test-request-id',
          userId: 'user-123',
        })
      ).not.toThrow();
    });

    it('should log failed password operation', () => {
      expect(() =>
        AuthLogger.logPasswordOperation('compare', false, 50, {
          requestId: 'test-request-id',
          errorMessage: 'Password comparison failed',
        })
      ).not.toThrow();
    });
  });

  describe('logTokenOperation', () => {
    it('should log successful token operation', () => {
      expect(() =>
        AuthLogger.logTokenOperation('generate', true, {
          requestId: 'test-request-id',
          userId: 'user-123',
          tokenType: 'access',
          expiresIn: '15m',
        })
      ).not.toThrow();
    });

    it('should log failed token operation', () => {
      expect(() =>
        AuthLogger.logTokenOperation('verify', false, {
          requestId: 'test-request-id',
          tokenType: 'refresh',
          errorMessage: 'Token expired',
        })
      ).not.toThrow();
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log successful database operation', () => {
      expect(() =>
        AuthLogger.logDatabaseOperation('user_lookup', true, 25, {
          requestId: 'test-request-id',
          query: 'findUnique by email',
          email: 'test@example.com',
        })
      ).not.toThrow();
    });

    it('should log failed database operation', () => {
      expect(() =>
        AuthLogger.logDatabaseOperation('user_creation', false, 100, {
          requestId: 'test-request-id',
          errorMessage: 'Database connection failed',
        })
      ).not.toThrow();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events', () => {
      expect(() =>
        AuthLogger.logSecurityEvent('brute_force_attempt', {
          requestId: 'test-request-id',
          ipAddress: '192.168.1.1',
          email: 'test@example.com',
          attemptCount: 5,
        })
      ).not.toThrow();
    });
  });

  describe('logPerformanceMetrics', () => {
    it('should log performance metrics', () => {
      expect(() =>
        AuthLogger.logPerformanceMetrics('login', 150, {
          requestId: 'test-request-id',
          success: true,
        })
      ).not.toThrow();
    });
  });
});
