/**
 * Configuration integration tests
 * Tests that the configuration system works with the existing application
 */

import { configManager, isTestEnvironment } from '../index';
import { loadConfig } from '../loader';

describe('Configuration Integration', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('should provide configuration that works with the application', () => {
    const config = loadConfig();

    // Verify essential configuration is present
    expect(config.database.url).toBeDefined();
    expect(config.redis.host).toBeDefined();
    expect(config.security.jwt.secret).toBeDefined();
    expect(config.port).toBeGreaterThan(0);
  });

  it('should detect test environment correctly', () => {
    expect(isTestEnvironment()).toBe(true);
  });

  it('should provide test-appropriate configuration', () => {
    const config = loadConfig();

    // Test environment should have specific settings
    expect(config.isTest).toBe(true);
    expect(config.logging.silent).toBe(true);
    expect(config.security.disableRateLimit).toBe(true);
    expect(config.redis.mockMode).toBe(true);
    expect(config.database.resetBetweenTests).toBe(true);
  });

  it('should provide configuration compatible with existing middleware', () => {
    const config = loadConfig();

    // Verify CORS configuration
    expect(config.cors.origin).toBe(true); // Should allow all origins in test
    expect(config.cors.credentials).toBe(true);
    expect(Array.isArray(config.cors.methods)).toBe(true);

    // Verify security configuration
    expect(config.security.rateLimits.auth.max).toBeGreaterThan(0);
    expect(config.security.rateLimits.api.max).toBeGreaterThan(0);
    expect(config.security.headers).toBeDefined();
    expect(Array.isArray(config.security.xssPatterns)).toBe(true);
    expect(Array.isArray(config.security.sqlInjectionPatterns)).toBe(true);
  });

  it('should provide database configuration compatible with Prisma', () => {
    const config = loadConfig();

    expect(config.database.url).toMatch(/^postgresql:\/\//);
    expect(config.database.maxConnections).toBeGreaterThan(0);
    expect(config.database.connectionTimeout).toBeGreaterThan(0);
  });

  it('should provide Redis configuration compatible with Redis client', () => {
    const config = loadConfig();

    expect(config.redis.host).toBeDefined();
    expect(config.redis.port).toBeGreaterThan(0);
    expect(config.redis.db).toBeGreaterThanOrEqual(0);
    expect(config.redis.connectTimeout).toBeGreaterThan(0);
  });

  it('should provide JWT configuration compatible with jsonwebtoken', () => {
    const config = loadConfig();

    expect(config.security.jwt.secret).toBeDefined();
    expect(config.security.jwt.refreshSecret).toBeDefined();
    expect(config.security.jwt.expiresIn).toBeDefined();
    expect(config.security.jwt.refreshExpiresIn).toBeDefined();
    expect(config.security.jwt.algorithm).toBe('HS256');
  });

  it('should provide bcrypt configuration compatible with bcryptjs', () => {
    const config = loadConfig();

    expect(config.security.bcrypt.rounds).toBeGreaterThan(0);
    expect(config.security.bcrypt.rounds).toBeLessThan(20); // Reasonable upper bound
  });

  it('should provide logging configuration compatible with winston', () => {
    const config = loadConfig();

    expect(['error', 'warn', 'info', 'debug']).toContain(config.logging.level);
    expect(typeof config.logging.silent).toBe('boolean');
    expect(config.logging.filename).toBeDefined();
  });

  it('should provide request limits configuration compatible with express', () => {
    const config = loadConfig();

    expect(config.security.requestLimits.json).toBeDefined();
    expect(config.security.requestLimits.urlencoded).toBeDefined();
    expect(config.security.requestLimits.parameterLimit).toBeGreaterThan(0);
  });
});
