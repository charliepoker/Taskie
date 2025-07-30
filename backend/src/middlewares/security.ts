import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';
import securityConfig from '../config/security';

const prisma = new PrismaClient();

// Configure security audit logger
const securityLogger = winston.createLogger({
  level: securityConfig.auditLog.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'security-audit' },
  transports: [
    new winston.transports.File({
      filename: securityConfig.auditLog.filename,
      maxsize: securityConfig.auditLog.maxsize,
      maxFiles: securityConfig.auditLog.maxFiles,
      tailable: securityConfig.auditLog.tailable,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Rate limiting configurations
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response) => {
      // Log rate limit violations
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    },
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: securityConfig.rateLimits.auth.windowMs,
  max: securityConfig.rateLimits.auth.max,
  message: 'Too many authentication attempts, please try again in 15 minutes',
});

export const apiRateLimit = createRateLimit({
  windowMs: securityConfig.rateLimits.api.windowMs,
  max: securityConfig.rateLimits.api.max,
  message: 'Too many API requests, please try again later',
});

export const strictRateLimit = createRateLimit({
  windowMs: securityConfig.rateLimits.strict.windowMs,
  max: securityConfig.rateLimits.strict.max,
  message: 'Too many requests to this endpoint, please try again later',
});

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potential XSS patterns using config
      let sanitized = value;
      securityConfig.xssPatterns.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, '');
      });
      return sanitized.trim();
    }

    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }

    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters (create new object to avoid read-only issues)
  if (req.query && Object.keys(req.query).length > 0) {
    try {
      const sanitizedQuery = sanitizeValue(req.query);
      // Only replace if sanitization was successful
      if (sanitizedQuery && typeof sanitizedQuery === 'object') {
        Object.assign(req.query, sanitizedQuery);
      }
    } catch (error) {
      // Log error but don't fail the request
      console.warn('Query sanitization failed:', error);
    }
  }

  next();
};

// Security headers middleware (enhanced helmet configuration)
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Content Security Policy from config
  const cspDirectives = Object.entries(securityConfig.csp.directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Additional security headers from config
  Object.entries(securityConfig.headers).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
};

// Security audit logging middleware
export const securityAuditLog = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log security-relevant events
  const logSecurityEvent = (event: string, details: any = {}) => {
    securityLogger.info(event, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id,
      ...details,
    });
  };

  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logSecurityEvent('AUTH_ATTEMPT', {
      endpoint: req.path,
      email: req.body?.email,
    });
  }

  // Log sensitive operations
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    logSecurityEvent('SENSITIVE_OPERATION', {
      operation: `${req.method} ${req.path}`,
    });
  }

  // Override res.json to log response status
  const originalJson = res.json;
  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log failed authentication
    if (
      req.path.includes('/auth/') &&
      (!body.success || res.statusCode >= 400)
    ) {
      logSecurityEvent('AUTH_FAILURE', {
        statusCode: res.statusCode,
        responseTime,
        error: body.error,
      });
    }

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', {
        statusCode: res.statusCode,
        responseTime,
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

// SQL injection prevention middleware (additional layer beyond Prisma)
export const sqlInjectionProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const checkForSqlInjection = (value: any): boolean => {
    if (typeof value !== 'string') return false;

    return securityConfig.sqlInjectionPatterns.some((pattern) =>
      pattern.test(value)
    );
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkForSqlInjection(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }

    return false;
  };

  // Check request body and query parameters
  if (checkObject(req.body) || checkObject(req.query)) {
    securityLogger.warn('SQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString(),
    });

    res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      code: 'INVALID_INPUT',
    });
    return;
  }

  next();
};

// Request size limiting middleware
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('content-length');

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        securityLogger.warn('Request size limit exceeded', {
          ip: req.ip,
          path: req.path,
          contentLength: sizeInBytes,
          maxAllowed: maxSizeInBytes,
          timestamp: new Date().toISOString(),
        });

        res.status(413).json({
          success: false,
          error: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE',
        });
        return;
      }
    }

    next();
  };
};

// Helper function to parse size strings
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * (units[unit] || 1);
};

// IP whitelist/blacklist middleware
export const ipFilter = (options: {
  whitelist?: string[];
  blacklist?: string[];
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress || '';

    // Check blacklist first
    if (options.blacklist && options.blacklist.includes(clientIp)) {
      securityLogger.warn('Blocked IP attempted access', {
        ip: clientIp,
        path: req.path,
        timestamp: new Date().toISOString(),
      });

      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'IP_BLOCKED',
      });
      return;
    }

    // Check whitelist if provided
    if (options.whitelist && options.whitelist.length > 0) {
      if (!options.whitelist.includes(clientIp)) {
        securityLogger.warn('Non-whitelisted IP attempted access', {
          ip: clientIp,
          path: req.path,
          timestamp: new Date().toISOString(),
        });

        res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'IP_NOT_WHITELISTED',
        });
        return;
      }
    }

    next();
  };
};

export { securityLogger };
