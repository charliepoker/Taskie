export const securityConfig = {
  // Rate limiting configuration
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
    strict: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window
    },
  },

  // CORS configuration
  cors: {
    allowedOrigins: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000',
    ],
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
    json: '10mb',
    urlencoded: '10mb',
    parameterLimit: 1000,
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
    whitelist: process.env.IP_WHITELIST?.split(',') || [],
    blacklist: process.env.IP_BLACKLIST?.split(',') || [],
  },

  // Audit logging configuration
  auditLog: {
    level: 'info',
    filename: 'logs/security-audit.log',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  },
};

export default securityConfig;
