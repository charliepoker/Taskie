import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import app from '../app';
import {
  AuthLogger,
  AuthLogContext,
  AuthErrorContext,
} from '../utils/authLogger';
import { AuthDebugger } from '../utils/authDebugger';
import { PerformanceMonitoringService } from '../services/performanceMonitoringService';
import {
  setupTestDatabase,
  cleanupDatabase,
  teardownTestDatabase,
} from '../utils/test-helpers';
import { hashPassword } from '../utils/password';
import * as winston from 'winston';

describe('Authentication Debugging and Monitoring Tests', () => {
  let prisma: PrismaClient;
  let performanceMonitor: PerformanceMonitoringService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(async () => {
    await setupTestDatabase();
    prisma = new PrismaClient();
    performanceMonitor = PerformanceMonitoringService.getInstance();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupDatabase();

    // Setup logging spies to capture log output
    logSpy = jest.spyOn(winston.Logger.prototype, 'info').mockImplementation();
    warnSpy = jest.spyOn(winston.Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest
      .spyOn(winston.Logger.prototype, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    // Restore logging spies
    logSpy?.mockRestore();
    warnSpy?.mockRestore();
    errorSpy?.mockRestore();
  });

  describe('Error Logging and Context Capture', () => {
    describe('AuthLogger Error Context Capture', () => {
      it('should capture comprehensive context for authentication attempts', () => {
        const context: AuthLogContext = {
          requestId: 'test-req-123',
          email: 'test@example.com',
          userId: 'user-123',
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.100',
          action: 'login',
          success: true,
          duration: 150,
        };

        AuthLogger.logAuthAttempt(context);

        expect(logSpy).toHaveBeenCalledWith(
          'Authentication attempt',
          expect.objectContaining({
            requestId: 'test-req-123',
            email: 'test@example.com',
            userId: 'user-123',
            userAgent: 'Mozilla/5.0 Test Browser',
            ipAddress: '192.168.1.100',
            action: 'login',
            success: true,
            duration: 150,
            timestamp: expect.any(String),
          })
        );
      });

      it('should capture detailed error context for failed authentication', () => {
        const error = new Error('Invalid password');
        const context: AuthErrorContext = {
          requestId: 'test-req-456',
          email: 'test@example.com',
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '192.168.1.100',
          action: 'login',
          success: false,
          error,
          errorCode: 'INVALID_CREDENTIALS',
          debugInfo: {
            passwordHashExists: true,
            userFound: true,
            comparisonFailed: true,
          },
        };

        AuthLogger.logAuthError(context);

        expect(errorSpy).toHaveBeenCalledWith(
          'Authentication error',
          expect.objectContaining({
            requestId: 'test-req-456',
            email: 'test@example.com',
            action: 'login',
            success: false,
            errorMessage: 'Invalid password',
            stackTrace: expect.any(String),
            errorCode: 'INVALID_CREDENTIALS',
            debugInfo: {
              passwordHashExists: true,
              userFound: true,
              comparisonFailed: true,
            },
            timestamp: expect.any(String),
          })
        );
      });

      it('should log password operations with performance metrics', () => {
        AuthLogger.logPasswordOperation('hash', true, 85, {
          requestId: 'test-req-789',
          userId: 'user-123',
        });

        expect(logSpy).toHaveBeenCalledWith(
          'Password operation completed',
          expect.objectContaining({
            operation: 'hash',
            success: true,
            duration: 85,
            requestId: 'test-req-789',
            userId: 'user-123',
            timestamp: expect.any(String),
          })
        );
      });

      it('should log JWT token operations with context', () => {
        AuthLogger.logTokenOperation('generate', true, {
          requestId: 'test-req-101',
          userId: 'user-123',
          tokenType: 'access',
          expiresIn: '15m',
        });

        expect(logSpy).toHaveBeenCalledWith(
          'Token operation completed',
          expect.objectContaining({
            operation: 'generate',
            success: true,
            requestId: 'test-req-101',
            userId: 'user-123',
            tokenType: 'access',
            expiresIn: '15m',
            timestamp: expect.any(String),
          })
        );
      });

      it('should log database operations with query context', () => {
        AuthLogger.logDatabaseOperation('user_lookup', true, 45, {
          requestId: 'test-req-202',
          query: 'findUnique by email',
          email: 'test@example.com',
        });

        expect(logSpy).toHaveBeenCalledWith(
          'Database operation completed',
          expect.objectContaining({
            operation: 'user_lookup',
            success: true,
            duration: 45,
            requestId: 'test-req-202',
            query: 'findUnique by email',
            email: 'test@example.com',
            timestamp: expect.any(String),
          })
        );
      });

      it('should log security events with threat context', () => {
        AuthLogger.logSecurityEvent('brute_force_attempt', {
          requestId: 'test-req-303',
          ipAddress: '192.168.1.100',
          userAgent: 'Suspicious Bot',
          email: 'test@example.com',
          attemptCount: 15,
          additionalData: {
            timeWindow: '5 minutes',
            blocked: true,
          },
        });

        expect(warnSpy).toHaveBeenCalledWith(
          'Security event detected',
          expect.objectContaining({
            event: 'brute_force_attempt',
            severity: 'high',
            requestId: 'test-req-303',
            ipAddress: '192.168.1.100',
            userAgent: 'Suspicious Bot',
            email: 'test@example.com',
            attemptCount: 15,
            additionalData: {
              timeWindow: '5 minutes',
              blocked: true,
            },
            timestamp: expect.any(String),
          })
        );
      });
    });

    describe('Integration Error Logging', () => {
      it('should log authentication errors during actual login attempts', async () => {
        // Create a test user
        const userData = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        };

        await prisma.user.create({
          data: {
            ...userData,
            password: await hashPassword(userData.password),
          },
        });

        // Attempt login with wrong password
        const response = await request(app).post('/api/auth/login').send({
          email: userData.email,
          password: 'WrongPassword123!',
        });

        expect(response.status).toBe(401);

        // Verify that authentication failure was logged
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Authentication failed'),
          expect.objectContaining({
            action: 'login',
            success: false,
            email: userData.email,
          })
        );
      });

      it('should log context for registration validation errors', async () => {
        const invalidUserData = {
          email: 'invalid-email',
          username: 'ab', // too short
          password: 'weak',
          firstName: '',
          lastName: 'User',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidUserData);

        expect(response.status).toBe(400);

        // Verify validation errors are logged with context
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Authentication failed'),
          expect.objectContaining({
            action: 'register',
            success: false,
          })
        );
      });
    });
  });

  describe('Authentication Performance Testing', () => {
    describe('Password Operations Performance', () => {
      it('should measure password hashing performance', async () => {
        const testPassword = 'TestPassword123!';
        const requestId = AuthLogger.generateRequestId();

        const result = await AuthDebugger.testPasswordHashing(
          testPassword,
          requestId
        );

        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
        expect(result.details?.isValidBcryptFormat).toBe(true);
        expect(result.details?.canCompareSuccessfully).toBe(true);
      });

      it('should measure password comparison performance', async () => {
        const testPassword = 'TestPassword123!';
        const hashedPassword = await hashPassword(testPassword);
        const requestId = AuthLogger.generateRequestId();

        const result = await AuthDebugger.testPasswordComparison(
          testPassword,
          hashedPassword,
          requestId
        );

        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(2000); // Should complete within 2 seconds
        expect(result.details?.passwordsMatch).toBe(true);
        expect(result.details?.resultsConsistent).toBe(true);
      });

      it('should test complete password flow performance', async () => {
        const testPassword = 'TestPassword123!';
        const requestId = AuthLogger.generateRequestId();

        const result = await AuthDebugger.testCompletePasswordFlow(
          testPassword,
          requestId
        );

        expect(result.overallSuccess).toBe(true);
        expect(result.hashTest.success).toBe(true);
        expect(result.compareTest.success).toBe(true);

        // Total time should be reasonable
        const totalTime =
          result.hashTest.duration + result.compareTest.duration;
        expect(totalTime).toBeLessThan(7000); // Should complete within 7 seconds
      });

      it('should handle performance under concurrent password operations', async () => {
        const testPassword = 'TestPassword123!';
        const concurrentOperations = 10;

        const startTime = Date.now();

        // Run multiple password operations concurrently
        const promises = Array.from({ length: concurrentOperations }, () =>
          AuthDebugger.testCompletePasswordFlow(testPassword)
        );

        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;

        // All operations should succeed
        results.forEach((result) => {
          expect(result.overallSuccess).toBe(true);
        });

        // Concurrent operations should not take excessively long
        expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds

        // Average time per operation should be reasonable
        const avgTimePerOperation = totalTime / concurrentOperations;
        expect(avgTimePerOperation).toBeLessThan(3000);
      });
    });

    describe('Database Operations Performance', () => {
      it('should measure user lookup performance', async () => {
        // Create a test user
        const userData = {
          email: 'perf-test@example.com',
          username: 'perfuser',
          password: await hashPassword('TestPassword123!'),
          firstName: 'Performance',
          lastName: 'Test',
        };

        await prisma.user.create({ data: userData });

        const requestId = AuthLogger.generateRequestId();
        const result = await AuthDebugger.testUserLookup(
          userData.email,
          requestId
        );

        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(1000); // Should complete within 1 second
        expect(result.result).toBeTruthy();
        expect(result.result.email).toBe(userData.email);
      });

      it('should test performance with non-existent user lookup', async () => {
        const requestId = AuthLogger.generateRequestId();
        const result = await AuthDebugger.testUserLookup(
          'nonexistent@example.com',
          requestId
        );

        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.duration).toBeLessThan(500); // Should be faster for non-existent users
        expect(result.result).toBeNull();
      });

      it('should handle concurrent database lookups', async () => {
        // Create multiple test users
        const userPromises = Array.from({ length: 5 }, async (_, i) => {
          const userData = {
            email: `concurrent-test-${i}@example.com`,
            username: `concurrentuser${i}`,
            password: await hashPassword('TestPassword123!'),
            firstName: 'Concurrent',
            lastName: `Test${i}`,
          };
          return prisma.user.create({ data: userData });
        });

        const users = await Promise.all(userPromises);

        const startTime = Date.now();

        // Perform concurrent lookups
        const lookupPromises = users.map((user) =>
          AuthDebugger.testUserLookup(user.email)
        );

        const results = await Promise.all(lookupPromises);
        const totalTime = Date.now() - startTime;

        // All lookups should succeed
        results.forEach((result, index) => {
          expect(result.success).toBe(true);
          expect(result.result?.email).toBe(users[index].email);
        });

        // Concurrent lookups should be efficient
        expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      });
    });

    describe('JWT Operations Performance', () => {
      it('should measure JWT generation and verification performance', async () => {
        const mockUser = {
          id: 'perf-test-user',
          email: 'jwt-perf@example.com',
          username: 'jwtperfuser',
        };

        const requestId = AuthLogger.generateRequestId();
        const result = await AuthDebugger.testJWTFlow(mockUser, requestId);

        expect(result.overallSuccess).toBe(true);
        expect(result.generateTest.success).toBe(true);
        expect(result.verifyAccessTest.success).toBe(true);
        expect(result.verifyRefreshTest.success).toBe(true);

        // JWT operations should be fast
        expect(result.generateTest.duration).toBeLessThan(100);
        expect(result.verifyAccessTest.duration).toBeLessThan(50);
        expect(result.verifyRefreshTest.duration).toBeLessThan(50);
      });

      it('should handle concurrent JWT operations', async () => {
        const mockUsers = Array.from({ length: 10 }, (_, i) => ({
          id: `concurrent-jwt-user-${i}`,
          email: `jwt-concurrent-${i}@example.com`,
          username: `jwtconcurrent${i}`,
        }));

        const startTime = Date.now();

        // Generate tokens concurrently
        const jwtPromises = mockUsers.map((user) =>
          AuthDebugger.testJWTFlow(user)
        );

        const results = await Promise.all(jwtPromises);
        const totalTime = Date.now() - startTime;

        // All JWT operations should succeed
        results.forEach((result) => {
          expect(result.overallSuccess).toBe(true);
        });

        // Concurrent JWT operations should be very fast
        expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });

    describe('End-to-End Authentication Performance', () => {
      it('should measure complete authentication flow performance', async () => {
        // Create test user
        const userData = {
          email: 'e2e-perf@example.com',
          username: 'e2eperfuser',
          password: 'TestPassword123!',
          firstName: 'E2E',
          lastName: 'Performance',
        };

        await request(app).post('/api/auth/register').send(userData);

        // Measure login performance
        const startTime = Date.now();

        const response = await request(app).post('/api/auth/login').send({
          email: userData.email,
          password: userData.password,
        });

        const loginTime = Date.now() - startTime;

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(loginTime).toBeLessThan(3000); // Should complete within 3 seconds

        // Measure token verification performance
        const accessToken = response.body.data.tokens.accessToken;
        const verifyStartTime = Date.now();

        const meResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        const verifyTime = Date.now() - verifyStartTime;

        expect(meResponse.status).toBe(200);
        expect(verifyTime).toBeLessThan(500); // Should be very fast
      });

      it('should handle concurrent authentication requests', async () => {
        // Create test user
        const userData = {
          email: 'concurrent-auth@example.com',
          username: 'concurrentauth',
          password: 'TestPassword123!',
          firstName: 'Concurrent',
          lastName: 'Auth',
        };

        await request(app).post('/api/auth/register').send(userData);

        const concurrentRequests = 5;
        const startTime = Date.now();

        // Perform concurrent login requests
        const loginPromises = Array.from({ length: concurrentRequests }, () =>
          request(app).post('/api/auth/login').send({
            email: userData.email,
            password: userData.password,
          })
        );

        const responses = await Promise.all(loginPromises);
        const totalTime = Date.now() - startTime;

        // All requests should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });

        // Concurrent requests should complete in reasonable time
        expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      });
    });
  });

  describe('Security Measures and Rate Limiting Effectiveness', () => {
    describe('Rate Limiting Detection', () => {
      it('should verify rate limiting is disabled in test environment', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.DISABLE_RATE_LIMIT).toBe('true');
      });

      it('should allow multiple rapid authentication requests in test mode', async () => {
        // Create test user
        const userData = {
          email: 'rate-limit-test@example.com',
          username: 'ratelimituser',
          password: 'TestPassword123!',
          firstName: 'Rate',
          lastName: 'Limit',
        };

        await request(app).post('/api/auth/register').send(userData);

        // Make multiple rapid login requests
        const rapidRequests = Array.from({ length: 15 }, () =>
          request(app).post('/api/auth/login').send({
            email: userData.email,
            password: userData.password,
          })
        );

        const responses = await Promise.all(rapidRequests);

        // In test environment, none should be rate limited
        const rateLimitedResponses = responses.filter(
          (response) => response.status === 429
        );

        expect(rateLimitedResponses).toHaveLength(0);

        // All should succeed (200) since credentials are valid
        const successfulResponses = responses.filter(
          (response) => response.status === 200
        );

        expect(successfulResponses).toHaveLength(15);
      });
    });

    describe('Security Event Logging', () => {
      it('should log failed authentication attempts', async () => {
        // Create test user
        const userData = {
          email: 'security-test@example.com',
          username: 'securityuser',
          password: 'TestPassword123!',
          firstName: 'Security',
          lastName: 'Test',
        };

        await request(app).post('/api/auth/register').send(userData);

        // Attempt login with wrong password multiple times
        const failedAttempts = Array.from({ length: 3 }, () =>
          request(app).post('/api/auth/login').send({
            email: userData.email,
            password: 'WrongPassword123!',
          })
        );

        const responses = await Promise.all(failedAttempts);

        // All should fail with 401
        responses.forEach((response) => {
          expect(response.status).toBe(401);
          expect(response.body.code).toBe('INVALID_CREDENTIALS');
        });

        // Verify failed attempts were logged
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Authentication failed'),
          expect.objectContaining({
            action: 'login',
            success: false,
            email: userData.email,
          })
        );
      });

      it('should log suspicious registration attempts', async () => {
        const suspiciousData = {
          email: 'suspicious@example.com',
          username: '<script>alert("xss")</script>',
          password: 'TestPassword123!',
          firstName: 'Suspicious',
          lastName: 'User',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(suspiciousData);

        // Should either sanitize input or reject request
        expect([400, 201]).toContain(response.status);

        // Security events should be logged
        expect(warnSpy).toHaveBeenCalled();
      });
    });

    describe('Input Validation and Sanitization', () => {
      it('should handle malicious input in authentication requests', async () => {
        const maliciousInputs = [
          {
            email: '<script>alert("xss")</script>@example.com',
            password: 'TestPassword123!',
          },
          {
            email: 'test@example.com',
            password: '<iframe src="evil.com"></iframe>password',
          },
          {
            email: "'; DROP TABLE users; --",
            password: 'TestPassword123!',
          },
        ];

        for (const maliciousInput of maliciousInputs) {
          const response = await request(app)
            .post('/api/auth/login')
            .send(maliciousInput);

          // Should either sanitize and process or reject
          expect([400, 401]).toContain(response.status);

          // Should not cause server errors
          expect(response.status).not.toBe(500);
        }
      });

      it('should validate password strength requirements', async () => {
        const weakPasswords = [
          'weak',
          '123456',
          'password',
          'abc123',
          'qwerty',
        ];

        for (const weakPassword of weakPasswords) {
          const response = await request(app).post('/api/auth/register').send({
            email: 'weak-password-test@example.com',
            username: 'weakpassuser',
            password: weakPassword,
            firstName: 'Weak',
            lastName: 'Password',
          });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        }
      });
    });

    describe('Token Security', () => {
      it('should reject invalid JWT tokens', async () => {
        const invalidTokens = [
          'invalid-token',
          'Bearer invalid-token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
          '',
          null,
        ];

        for (const token of invalidTokens) {
          const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', token ? `Bearer ${token}` : '');

          expect(response.status).toBe(401);
          expect(response.body.success).toBe(false);
        }
      });

      it('should handle expired tokens gracefully', async () => {
        // This would require creating an expired token
        // For now, we'll test with an obviously invalid token structure
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.invalid';

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Comprehensive Security Test', () => {
      it('should run comprehensive authentication security test', async () => {
        const requestId = AuthLogger.generateRequestId();

        // Test password security
        const passwordResult = await AuthDebugger.testCompletePasswordFlow(
          'TestPassword123!',
          requestId
        );

        // Test database security
        const dbResult = await AuthDebugger.testUserLookup(
          'security-comprehensive@example.com',
          requestId
        );

        // Test JWT security
        const jwtResult = await AuthDebugger.testJWTFlow(
          {
            id: 'security-test-user',
            email: 'security-comprehensive@example.com',
            username: 'securityuser',
          },
          requestId
        );

        // All security components should function correctly
        expect(passwordResult.overallSuccess).toBe(true);
        expect(dbResult.success).toBe(true);
        expect(jwtResult.overallSuccess).toBe(true);

        // Verify security logging occurred
        expect(logSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should record authentication performance metrics', async () => {
      const startTime = Date.now();

      // Create and login user
      const userData = {
        email: 'metrics-test@example.com',
        username: 'metricsuser',
        password: 'TestPassword123!',
        firstName: 'Metrics',
        lastName: 'Test',
      };

      await request(app).post('/api/auth/register').send(userData);

      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(loginResponse.status).toBe(200);

      // Record the performance metric
      await performanceMonitor.recordApiResponseTime(
        '/api/auth/login',
        'POST',
        200,
        duration
      );

      // Verify metrics were recorded
      const metrics = await performanceMonitor.getMetrics(
        'api.response_time',
        startTime - 1000,
        endTime + 1000
      );

      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should track authentication error rates', async () => {
      const startTime = Date.now();

      // Create test user
      const userData = {
        email: 'error-rate-test@example.com',
        username: 'errorrateuser',
        password: 'TestPassword123!',
        firstName: 'Error',
        lastName: 'Rate',
      };

      await request(app).post('/api/auth/register').send(userData);

      // Generate some failed attempts
      const failedAttempts = Array.from({ length: 3 }, () =>
        request(app).post('/api/auth/login').send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
      );

      // Generate some successful attempts
      const successfulAttempts = Array.from({ length: 2 }, () =>
        request(app).post('/api/auth/login').send({
          email: userData.email,
          password: userData.password,
        })
      );

      const allResponses = await Promise.all([
        ...failedAttempts,
        ...successfulAttempts,
      ]);

      const endTime = Date.now();

      // Record metrics for all attempts
      for (const response of allResponses) {
        await performanceMonitor.recordApiResponseTime(
          '/api/auth/login',
          'POST',
          response.status,
          100 // Mock duration
        );
      }

      // Calculate error rate
      const totalAttempts = allResponses.length;
      const failedCount = allResponses.filter((r) => r.status !== 200).length;
      const errorRate = (failedCount / totalAttempts) * 100;

      expect(errorRate).toBe(60); // 3 failed out of 5 total = 60%
      expect(totalAttempts).toBe(5);
    });
  });
});
