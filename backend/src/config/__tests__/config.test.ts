/**
 * Configuration system tests
 */

import { EnvironmentDetector, ConfigManager } from '../index';
import { loadConfig, loadTestConfig, getConfigForEnvironment } from '../loader';
import { testUtils } from '../testConfig';

describe('Configuration System', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('EnvironmentDetector', () => {
    it('should detect test environment correctly', () => {
      process.env.NODE_ENV = 'test';
      expect(EnvironmentDetector.isTestEnvironment()).toBe(true);
      expect(EnvironmentDetector.isDevelopmentEnvironment()).toBe(false);
      expect(EnvironmentDetector.isProductionEnvironment()).toBe(false);
      expect(EnvironmentDetector.getCurrentEnvironment()).toBe('test');
    });

    it('should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development';
      expect(EnvironmentDetector.isTestEnvironment()).toBe(false);
      expect(EnvironmentDetector.isDevelopmentEnvironment()).toBe(true);
      expect(EnvironmentDetector.isProductionEnvironment()).toBe(false);
      expect(EnvironmentDetector.getCurrentEnvironment()).toBe('development');
    });

    it('should detect production environment correctly', () => {
      process.env.NODE_ENV = 'production';
      expect(EnvironmentDetector.isTestEnvironment()).toBe(false);
      expect(EnvironmentDetector.isDevelopmentEnvironment()).toBe(false);
      expect(EnvironmentDetector.isProductionEnvironment()).toBe(true);
      expect(EnvironmentDetector.getCurrentEnvironment()).toBe('production');
    });

    it('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(EnvironmentDetector.isDevelopmentEnvironment()).toBe(true);
      expect(EnvironmentDetector.getCurrentEnvironment()).toBe('development');
    });
  });

  describe('ConfigManager', () => {
    it('should create singleton instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should load configuration for current environment', () => {
      process.env.NODE_ENV = 'test';
      const configManager = ConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.environment).toBe('test');
      expect(config.isTest).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
    });

    it('should provide individual config accessors', () => {
      process.env.NODE_ENV = 'test';
      const configManager = ConfigManager.getInstance();

      expect(configManager.getDatabaseConfig()).toBeDefined();
      expect(configManager.getRedisConfig()).toBeDefined();
      expect(configManager.getSecurityConfig()).toBeDefined();
      expect(configManager.isTestEnvironment()).toBe(true);
    });
  });

  describe('Test Configuration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should load test-specific configuration', () => {
      const config = loadTestConfig();

      expect(config.isTest).toBe(true);
      expect(config.logging.silent).toBe(true);
      expect(config.logging.level).toBe('error');
      expect(config.security.disableRateLimit).toBe(true);
      expect(config.redis.mockMode).toBe(true);
      expect(config.database.resetBetweenTests).toBe(true);
    });

    it('should have test-specific rate limiting configuration', () => {
      const config = loadTestConfig();

      expect(config.security.rateLimits.auth.max).toBe(1000);
      expect(config.security.rateLimits.api.max).toBe(10000);
      expect(config.security.rateLimits.auth.skipSuccessfulRequests).toBe(true);
    });

    it('should have test-specific database configuration', () => {
      const config = loadTestConfig();

      expect(config.database.maxConnections).toBe(5);
      expect(config.database.connectionTimeout).toBe(5000);
      expect(config.database.resetBetweenTests).toBe(true);
      expect(config.database.enableLogging).toBe(false);
    });

    it('should have test-specific Redis configuration', () => {
      const config = loadTestConfig();

      expect(config.redis.mockMode).toBe(true);
      expect(config.redis.port).toBe(6380);
      expect(config.redis.db).toBe(1);
      expect(config.redis.maxRetriesPerRequest).toBe(1);
    });

    it('should have test-specific security configuration', () => {
      const config = loadTestConfig();

      expect(config.security.disableRateLimit).toBe(true);
      expect(config.security.auditLog.enabled).toBe(false);
      expect(config.security.bcrypt.rounds).toBe(4);
      expect(config.security.jwt.secret).toBe(
        'test-jwt-secret-key-for-testing-only'
      );
    });

    it('should have permissive CORS configuration for tests', () => {
      const config = loadTestConfig();

      expect(config.cors.origin).toBe(true);
      expect(config.security.cors.origin).toBe(true);
    });
  });

  describe('Environment-specific Configuration Loading', () => {
    it('should load different configurations for different environments', () => {
      // Set required environment variables for development
      process.env.JWT_SECRET = 'dev-jwt-secret';
      process.env.JWT_REFRESH_SECRET = 'dev-jwt-refresh-secret';

      // Clear test-specific environment variables
      const originalDisableRateLimit = process.env.DISABLE_RATE_LIMIT;
      delete process.env.DISABLE_RATE_LIMIT;

      const testConfig = getConfigForEnvironment('test');
      const devConfig = getConfigForEnvironment('development');

      expect(testConfig.isTest).toBe(true);
      expect(devConfig.isDevelopment).toBe(true);

      expect(testConfig.logging.silent).toBe(true);
      expect(devConfig.logging.silent).toBe(false);

      expect(testConfig.security.disableRateLimit).toBe(true);
      // Development environment should not disable rate limit by default
      expect(devConfig.security.disableRateLimit).toBe(false);

      // Clean up
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      if (originalDisableRateLimit) {
        process.env.DISABLE_RATE_LIMIT = originalDisableRateLimit;
      }
    });
  });

  describe('Test Utilities', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should provide test environment detection', () => {
      expect(testUtils.isTestEnvironment()).toBe(true);
    });

    it('should provide test-specific URLs', () => {
      expect(testUtils.getTestDatabaseUrl()).toContain('taskie_test');
      expect(testUtils.getTestRedisUrl()).toContain('6380');
    });

    it('should provide test-specific settings', () => {
      expect(testUtils.shouldMockRedis()).toBe(true);
      expect(testUtils.shouldDisableRateLimit()).toBe(true);
      expect(testUtils.getTestJwtSecret()).toBe(
        'test-jwt-secret-key-for-testing-only'
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => {
        const configManager = ConfigManager.getInstance();
        configManager.reload();
      }).toThrow();
    });

    it('should not require secrets in test environment', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => {
        const config = loadTestConfig();
        expect(config.security.jwt.secret).toBe(
          'test-jwt-secret-key-for-testing-only'
        );
      }).not.toThrow();
    });
  });

  describe('Configuration Reloading', () => {
    it('should reload configuration when requested', () => {
      process.env.NODE_ENV = 'test';
      const configManager = ConfigManager.getInstance();
      const config1 = configManager.getConfig();

      // Set required environment variables for development
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'dev-jwt-secret';
      process.env.JWT_REFRESH_SECRET = 'dev-jwt-refresh-secret';

      configManager.reload();
      const config2 = configManager.getConfig();

      expect(config1.environment).toBe('test');
      expect(config2.environment).toBe('development');

      // Clean up
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
    });
  });
});
