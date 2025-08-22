import {
  DatabaseConfig,
  RedisConfig,
  SecurityConfig,
  AppConfig,
} from './types';

/**
 * Environment detection utility
 */
export class EnvironmentDetector {
  static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  static isDevelopmentEnvironment(): boolean {
    return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  }

  static isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static getCurrentEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }
}

/**
 * Configuration Manager
 * Loads environment-specific configurations
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): AppConfig {
    const environment = EnvironmentDetector.getCurrentEnvironment();

    console.log(`🔧 Loading configuration for environment: ${environment}`);

    // Import config loaders dynamically to avoid circular dependencies
    const { loadDatabaseConfig } = require('./database');
    const { loadRedisConfig } = require('./redis');
    const { loadSecurityConfig } = require('./security');

    return {
      environment,
      isTest: EnvironmentDetector.isTestEnvironment(),
      isDevelopment: EnvironmentDetector.isDevelopmentEnvironment(),
      isProduction: EnvironmentDetector.isProductionEnvironment(),
      port: parseInt(process.env.PORT || '5000', 10),
      database: loadDatabaseConfig(),
      redis: loadRedisConfig(),
      security: loadSecurityConfig(),
      logging: this.loadLoggingConfig(),
      cors: this.loadCorsConfig(),
    };
  }

  private loadLoggingConfig() {
    const isTest = EnvironmentDetector.isTestEnvironment();

    return {
      level: isTest ? 'error' : process.env.LOG_LEVEL || 'info',
      silent: isTest,
      format: isTest ? 'simple' : 'combined',
      enableConsole: !isTest,
      enableFile: !isTest,
      filename: process.env.LOG_FILE || 'logs/app.log',
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10), // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
    };
  }

  private loadCorsConfig() {
    const isTest = EnvironmentDetector.isTestEnvironment();

    if (isTest) {
      return {
        origin: true, // Allow all origins in test
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400,
      };
    }

    return {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'https://localhost:3000',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400,
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  isTestEnvironment(): boolean {
    return this.config.isTest;
  }

  isDevelopmentEnvironment(): boolean {
    return this.config.isDevelopment;
  }

  isProductionEnvironment(): boolean {
    return this.config.isProduction;
  }

  reload(): void {
    this.config = this.loadConfiguration();
    console.log('🔄 Configuration reloaded');
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Export individual configs for convenience
export const config = configManager.getConfig();
export const databaseConfig = configManager.getDatabaseConfig();
export const redisConfig = configManager.getRedisConfig();
export const securityConfig = configManager.getSecurityConfig();

// Export environment detection utilities
export const isTestEnvironment = EnvironmentDetector.isTestEnvironment;
export const isDevelopmentEnvironment =
  EnvironmentDetector.isDevelopmentEnvironment;
export const isProductionEnvironment =
  EnvironmentDetector.isProductionEnvironment;
export const getCurrentEnvironment = EnvironmentDetector.getCurrentEnvironment;
