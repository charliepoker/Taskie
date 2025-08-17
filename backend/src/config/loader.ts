/**
 * Configuration loader utility
 * Provides a clean way to load configurations in different environments
 */

import { AppConfig } from './types';
import { ConfigManager, EnvironmentDetector } from './index';
import { getTestConfigOverrides } from './testConfig';

/**
 * Load configuration for the current environment
 */
export function loadConfig(): AppConfig {
  const configManager = ConfigManager.getInstance();
  let config = configManager.getConfig();

  // Apply test-specific overrides if in test environment
  if (EnvironmentDetector.isTestEnvironment()) {
    const testOverrides = getTestConfigOverrides();
    config = mergeConfigs(config, testOverrides);
  }

  return config;
}

/**
 * Deep merge two configuration objects
 */
function mergeConfigs(
  base: AppConfig,
  overrides: Partial<AppConfig>
): AppConfig {
  const merged = JSON.parse(JSON.stringify(base)); // Deep clone

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        (merged as any)[key] = {
          ...(merged as any)[key],
          ...value,
        };
      } else {
        (merged as any)[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Get configuration for specific environment
 */
export function getConfigForEnvironment(
  env: 'test' | 'development' | 'production'
): AppConfig {
  const originalEnv = process.env.NODE_ENV;

  try {
    // Temporarily set environment
    process.env.NODE_ENV = env;

    // Create new config manager instance
    const configManager = ConfigManager.getInstance();
    configManager.reload();

    let config = configManager.getConfig();

    // Apply test overrides if needed
    if (env === 'test') {
      const testOverrides = getTestConfigOverrides();
      config = mergeConfigs(config, testOverrides);
    }

    return config;
  } finally {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  }
}

/**
 * Test-specific configuration loader
 */
export function loadTestConfig(): AppConfig {
  return getConfigForEnvironment('test');
}

/**
 * Development-specific configuration loader
 */
export function loadDevelopmentConfig(): AppConfig {
  return getConfigForEnvironment('development');
}

/**
 * Production-specific configuration loader
 */
export function loadProductionConfig(): AppConfig {
  return getConfigForEnvironment('production');
}
