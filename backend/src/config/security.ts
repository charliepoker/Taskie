import { SecurityConfig } from './types';

/**
 * Load security configuration based on environment
 */
export function loadSecurityConfig(): SecurityConfig {
  const isTest = process.env.NODE_ENV === 'test';
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  // Rate limiting configuration - more lenient in test environment
  const rateLimits = {
    auth: {
      windowMs: isTest ? 60 * 1000 : 15 * 60 * 1000, // 1 min in test, 15 min otherwise
      max: isTest ? 1000 : parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
      skipSuccessfulRequests: isTest,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    },
    api: {
      windowMs: isTest ? 60 * 1000 : 15 * 60 * 1000, // 1 min in test, 15 min otherwise
      max: isTest
        ? 10000
        : parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10),
      skipSuccessfulRequests: isTest,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    },
    strict: {
      windowMs: isTest ? 60 * 1000 : 15 * 60 * 1000, // 1 min in test, 15 min otherwise
      max: isTest
        ? 1000
        : parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10', 10),
      skipSuccessfulRequests: isTest,
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    },
  };

  const config: SecurityConfig = {
    rateLimits,

    // CORS configuration
    cors: {
      origin: isTest
        ? true
        : [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'https://localhost:3000',
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400, // 24 hours
    },

    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:'],
        connectSrc: ["'self'", 'https:'],
        frameAncestors: ["'none'"],
      },
    },

    // Request size limits
    requestLimits: {
      json: process.env.REQUEST_SIZE_LIMIT || '10mb',
      urlencoded: process.env.REQUEST_SIZE_LIMIT || '10mb',
      parameterLimit: parseInt(
        process.env.REQUEST_PARAMETER_LIMIT || '1000',
        10
      ),
    },

    // Security headers
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },

    // SQL injection patterns to detect
    sqlInjectionPatterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;|'|"|`)/g,
      /(\bOR\b|\bAND\b).*?[=<>]/gi,
      /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b/gi,
    ],

    // XSS patterns to sanitize
    xssPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ],

    // IP filtering (can be configured via environment variables)
    ipFilter: {
      whitelist: process.env.IP_WHITELIST?.split(',').filter(Boolean) || [],
      blacklist: process.env.IP_BLACKLIST?.split(',').filter(Boolean) || [],
    },

    // Audit logging configuration
    auditLog: {
      level: process.env.AUDIT_LOG_LEVEL || 'info',
      filename: process.env.AUDIT_LOG_FILE || 'logs/security-audit.log',
      maxsize: parseInt(process.env.AUDIT_LOG_MAX_SIZE || '10485760', 10), // 10MB
      maxFiles: parseInt(process.env.AUDIT_LOG_MAX_FILES || '5', 10),
      tailable: true,
      enabled: !isTest && process.env.AUDIT_LOG_ENABLED !== 'false',
    },

    // JWT configuration
    jwt: {
      secret:
        process.env.JWT_SECRET ||
        (isTest ? 'test-jwt-secret' : 'your-secret-key'),
      refreshSecret:
        process.env.JWT_REFRESH_SECRET ||
        (isTest ? 'test-refresh-secret' : 'your-refresh-secret'),
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      algorithm: 'HS256',
    },

    // Bcrypt configuration
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS || (isTest ? '4' : '12'), 10),
    },

    // Disable rate limiting in test environment
    disableRateLimit: isTest || process.env.DISABLE_RATE_LIMIT === 'true',
  };

  // Validate required configuration
  if (
    !isTest &&
    (!config.jwt.secret || config.jwt.secret === 'your-secret-key')
  ) {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (
    !isTest &&
    (!config.jwt.refreshSecret ||
      config.jwt.refreshSecret === 'your-refresh-secret')
  ) {
    throw new Error('JWT_REFRESH_SECRET must be set in production environment');
  }

  // Log configuration (but not in test environment)
  if (!isTest) {
    console.log('🔒 Security configuration loaded:', {
      rateLimitsDisabled: config.disableRateLimit,
      authRateLimit: config.rateLimits.auth.max,
      apiRateLimit: config.rateLimits.api.max,
      auditLogEnabled: config.auditLog.enabled,
      bcryptRounds: config.bcrypt.rounds,
    });
  }

  return config;
}

// Export the legacy default export for backward compatibility
export const securityConfig = loadSecurityConfig();
export default securityConfig;
