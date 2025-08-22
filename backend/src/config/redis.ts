import { RedisConfig } from './types';

/**
 * Load Redis configuration based on environment
 */
export function loadRedisConfig(): RedisConfig {
  const isTest = process.env.NODE_ENV === 'test';

  // Parse Redis URL or use individual components
  const redisUrl =
    process.env.REDIS_URL ||
    (isTest ? 'redis://localhost:6380' : 'redis://localhost:6379');

  let host = 'localhost';
  let port = isTest ? 6380 : 6379;
  let db = isTest ? 1 : 0;
  let password: string | undefined;

  // Parse Redis URL if provided
  if (redisUrl.startsWith('redis://')) {
    try {
      const url = new URL(redisUrl);
      host = url.hostname;
      port = parseInt(url.port, 10) || port;
      password = url.password || undefined;

      // Extract database number from pathname
      const pathname = url.pathname.slice(1); // Remove leading slash
      if (pathname && !isNaN(parseInt(pathname, 10))) {
        db = parseInt(pathname, 10);
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse REDIS_URL, using defaults:', error);
    }
  }

  const config: RedisConfig = {
    url: redisUrl,
    host: process.env.REDIS_HOST || host,
    port: parseInt(process.env.REDIS_PORT || port.toString(), 10),
    db: parseInt(process.env.REDIS_DB || db.toString(), 10),
    password: process.env.REDIS_PASSWORD || password,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000', 10),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
    maxRetriesPerRequest: parseInt(
      process.env.REDIS_MAX_RETRIES || (isTest ? '1' : '3'),
      10
    ),
    mockMode: isTest && process.env.REDIS_MOCK_MODE !== 'false',
    enableOfflineQueue:
      !isTest && process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
  };

  // Log configuration (but not in test environment)
  if (!isTest) {
    console.log('🔴 Redis configuration loaded:', {
      host: config.host,
      port: config.port,
      db: config.db,
      connectTimeout: config.connectTimeout,
      commandTimeout: config.commandTimeout,
      mockMode: config.mockMode,
    });
  }

  return config;
}
