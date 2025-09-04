import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/database';
import { AuthLogger } from '../utils/authLogger';
import { AuthMonitoringService } from './authMonitoringService';
import rateLimitingConfig from '../config/rateLimiting';

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitRule {
  key: string;
  config: RateLimitConfig;
  type: 'ip' | 'email' | 'combined';
}

export class RateLimitingService {
  private authMonitoringService: AuthMonitoringService;

  constructor() {
    this.authMonitoringService = new AuthMonitoringService();
  }

  /**
   * Create a rate limiting middleware with enhanced authentication-specific logic
   */
  createAuthRateLimit(config: RateLimitConfig) {
    // If rate limiting is disabled, return a no-op middleware
    if (!rateLimitingConfig.enabled) {
      return (req: Request, res: Response, next: NextFunction) => {
        next();
      };
    }

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const email = req.body?.email || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        // Check if IP is already blocked due to suspicious activity
        const isIPBlocked =
          await this.authMonitoringService.isIPBlocked(clientIP);
        if (isIPBlocked) {
          AuthLogger.logSecurityEvent('rate_limit_exceeded', {
            ipAddress: clientIP,
            email,
            userAgent,
            additionalData: {
              reason: 'IP blocked due to suspicious activity',
              endpoint: req.path,
            },
          });

          res.status(429).json({
            success: false,
            error: 'Too many failed attempts. Access temporarily blocked.',
            code: 'IP_BLOCKED',
            retryAfter: 3600, // 1 hour
          });
          return;
        }

        // Check rate limits by IP
        const ipLimitExceeded = await this.checkRateLimit(
          `ip:${clientIP}:${req.path}`,
          config
        );

        // Check rate limits by email for login attempts
        let emailLimitExceeded = false;
        if (email !== 'unknown' && req.path.includes('login')) {
          emailLimitExceeded = await this.checkRateLimit(
            `email:${email}:${req.path}`,
            config
          );
        }

        if (ipLimitExceeded || emailLimitExceeded) {
          const limitType = ipLimitExceeded ? 'IP' : 'email';

          AuthLogger.logSecurityEvent('rate_limit_exceeded', {
            ipAddress: clientIP,
            email,
            userAgent,
            additionalData: {
              limitType,
              endpoint: req.path,
              windowMs: config.windowMs,
              maxAttempts: config.maxAttempts,
            },
          });

          res.status(429).json({
            success: false,
            error: `Too many attempts. Please try again in ${Math.ceil(config.windowMs / 60000)} minutes.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(config.windowMs / 1000),
          });
          return;
        }

        // Record the attempt
        await this.recordAttempt(`ip:${clientIP}:${req.path}`, config);
        if (email !== 'unknown' && req.path.includes('login')) {
          await this.recordAttempt(`email:${email}:${req.path}`, config);
        }

        next();
      } catch (error) {
        // Log error but don't block the request
        AuthLogger.logAuthError({
          action: 'rate_limit_check',
          success: false,
          error:
            error instanceof Error
              ? error
              : new Error('Rate limit check failed'),
          errorCode: 'RATE_LIMIT_ERROR',
        });
        next();
      }
    };
  }

  /**
   * Check if rate limit is exceeded for a given key
   */
  private async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
      const attempts = await prisma.rateLimitAttempt.count({
        where: {
          key,
          timestamp: {
            gte: windowStart,
          },
        },
      });

      return attempts >= config.maxAttempts;
    } catch (error) {
      // Log error but don't block - fail open for availability
      AuthLogger.logAuthError({
        action: 'rate_limit_check',
        success: false,
        error:
          error instanceof Error ? error : new Error('Rate limit check failed'),
        errorCode: 'RATE_LIMIT_CHECK_ERROR',
        additionalData: { key },
      });
      return false;
    }
  }

  /**
   * Record an attempt for rate limiting
   */
  private async recordAttempt(
    key: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      await prisma.rateLimitAttempt.create({
        data: {
          key,
          timestamp: new Date(),
        },
      });

      // Clean up old attempts to prevent database bloat
      const cleanupThreshold = new Date(Date.now() - config.windowMs * 2);
      await prisma.rateLimitAttempt.deleteMany({
        where: {
          key,
          timestamp: {
            lt: cleanupThreshold,
          },
        },
      });
    } catch (error) {
      // Log error but don't throw - this shouldn't block the request
      AuthLogger.logAuthError({
        action: 'record_rate_limit_attempt',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to record rate limit attempt'),
        errorCode: 'RATE_LIMIT_RECORD_ERROR',
        additionalData: { key },
      });
    }
  }

  /**
   * Create password reset rate limiting middleware
   */
  createPasswordResetRateLimit() {
    const config: RateLimitConfig = {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3, // 3 password reset requests per hour per email
    };

    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const email = req.body?.email;
        if (!email) {
          next();
          return;
        }

        const key = `password_reset:${email}`;
        const limitExceeded = await this.checkRateLimit(key, config);

        if (limitExceeded) {
          AuthLogger.logSecurityEvent('rate_limit_exceeded', {
            email,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            additionalData: {
              endpoint: 'password_reset',
              windowMs: config.windowMs,
              maxAttempts: config.maxAttempts,
            },
          });

          res.status(429).json({
            success: false,
            error:
              'Too many password reset requests. Please try again in 1 hour.',
            code: 'PASSWORD_RESET_RATE_LIMIT',
            retryAfter: 3600,
          });
          return;
        }

        await this.recordAttempt(key, config);
        next();
      } catch (error) {
        // Log error but don't block the request
        AuthLogger.logAuthError({
          action: 'password_reset_rate_limit',
          success: false,
          error:
            error instanceof Error
              ? error
              : new Error('Password reset rate limit check failed'),
          errorCode: 'PASSWORD_RESET_RATE_LIMIT_ERROR',
        });
        next();
      }
    };
  }

  /**
   * Get rate limit status for a key
   */
  async getRateLimitStatus(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    attempts: number;
    remaining: number;
    resetTime: Date;
    blocked: boolean;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
      const attempts = await prisma.rateLimitAttempt.count({
        where: {
          key,
          timestamp: {
            gte: windowStart,
          },
        },
      });

      const remaining = Math.max(0, config.maxAttempts - attempts);
      const blocked = attempts >= config.maxAttempts;
      const resetTime = new Date(now.getTime() + config.windowMs);

      return {
        attempts,
        remaining,
        resetTime,
        blocked,
      };
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'get_rate_limit_status',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to get rate limit status'),
        errorCode: 'RATE_LIMIT_STATUS_ERROR',
        additionalData: { key },
      });

      // Return safe defaults
      return {
        attempts: 0,
        remaining: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs),
        blocked: false,
      };
    }
  }

  /**
   * Clear rate limit for a key (admin function)
   */
  async clearRateLimit(key: string): Promise<void> {
    try {
      await prisma.rateLimitAttempt.deleteMany({
        where: { key },
      });

      AuthLogger.logAuthAttempt({
        action: 'clear_rate_limit',
        success: true,
        additionalData: { key },
      });
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'clear_rate_limit',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to clear rate limit'),
        errorCode: 'CLEAR_RATE_LIMIT_ERROR',
        additionalData: { key },
      });
      throw error;
    }
  }

  /**
   * Clean up old rate limit attempts (should be run periodically)
   */
  async cleanupOldAttempts(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      const result = await prisma.rateLimitAttempt.deleteMany({
        where: {
          timestamp: {
            lt: cutoffTime,
          },
        },
      });

      AuthLogger.logAuthAttempt({
        action: 'cleanup_rate_limit_attempts',
        success: true,
        additionalData: {
          deletedCount: result.count,
          olderThanHours,
        },
      });

      return result.count;
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'cleanup_rate_limit_attempts',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to cleanup rate limit attempts'),
        errorCode: 'CLEANUP_RATE_LIMIT_ERROR',
      });
      throw error;
    }
  }
}
