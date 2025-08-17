import { DatabaseConfig } from './types';

/**
 * Load database configuration based on environment
 */
export function loadDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  // Default database URL
  let defaultUrl = 'postgresql://postgres:postgres@localhost:5433/taskietaskie';

  if (isTest) {
    defaultUrl = 'postgresql://postgres:postgres@localhost:5433/taskie_test';
  }

  const config: DatabaseConfig = {
    url: process.env.DATABASE_URL || defaultUrl,
    maxConnections: parseInt(
      process.env.DB_MAX_CONNECTIONS || (isTest ? '5' : '20'),
      10
    ),
    connectionTimeout: parseInt(
      process.env.DB_CONNECTION_TIMEOUT || (isTest ? '5000' : '10000'),
      10
    ),
    queryTimeout: parseInt(
      process.env.DB_QUERY_TIMEOUT || (isTest ? '5000' : '30000'),
      10
    ),
    resetBetweenTests: isTest,
    runMigrations: isTest || isDev,
    enableLogging:
      !isTest && (process.env.DB_ENABLE_LOGGING === 'true' || isDev),
  };

  // Validate required configuration
  if (!config.url) {
    throw new Error('DATABASE_URL is required');
  }

  // Log configuration (but not in test environment)
  if (!isTest) {
    console.log('📊 Database configuration loaded:', {
      url: config.url.replace(/:[^:@]*@/, ':***@'), // Hide password in logs
      maxConnections: config.maxConnections,
      connectionTimeout: config.connectionTimeout,
      queryTimeout: config.queryTimeout,
      enableLogging: config.enableLogging,
    });
  }

  return config;
}
