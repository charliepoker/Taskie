export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitingConfiguration {
  login: RateLimitConfig;
  register: RateLimitConfig;
  passwordReset: RateLimitConfig;
  tokenRefresh: RateLimitConfig;
  changePassword: RateLimitConfig;
  general: RateLimitConfig;
  enabled: boolean;
}

const rateLimitingConfig: RateLimitingConfiguration = {
  enabled: process.env.NODE_ENV !== 'test', // Disable in test environment

  login: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5'),
    skipSuccessfulRequests: true,
  },

  register: {
    windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
    maxAttempts: parseInt(process.env.REGISTER_RATE_LIMIT_MAX_ATTEMPTS || '3'),
    skipSuccessfulRequests: false,
  },

  passwordReset: {
    windowMs: parseInt(
      process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || '3600000'
    ), // 1 hour
    maxAttempts: parseInt(
      process.env.PASSWORD_RESET_RATE_LIMIT_MAX_ATTEMPTS || '3'
    ),
    skipSuccessfulRequests: false,
  },

  tokenRefresh: {
    windowMs: parseInt(
      process.env.TOKEN_REFRESH_RATE_LIMIT_WINDOW_MS || '300000'
    ), // 5 minutes
    maxAttempts: parseInt(
      process.env.TOKEN_REFRESH_RATE_LIMIT_MAX_ATTEMPTS || '10'
    ),
    skipSuccessfulRequests: true,
  },

  changePassword: {
    windowMs: parseInt(
      process.env.CHANGE_PASSWORD_RATE_LIMIT_WINDOW_MS || '3600000'
    ), // 1 hour
    maxAttempts: parseInt(
      process.env.CHANGE_PASSWORD_RATE_LIMIT_MAX_ATTEMPTS || '5'
    ),
    skipSuccessfulRequests: true,
  },

  general: {
    windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxAttempts: parseInt(process.env.GENERAL_RATE_LIMIT_MAX_ATTEMPTS || '100'),
    skipSuccessfulRequests: false,
  },
};

export default rateLimitingConfig;
