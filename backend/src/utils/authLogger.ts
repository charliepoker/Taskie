import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Configure authentication-specific logger
const authLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : '';
          return `${timestamp} [AUTH] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
    // File transport for production logging
    new winston.transports.File({
      filename: 'logs/auth.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Separate file for auth errors
    new winston.transports.File({
      filename: 'logs/auth-errors.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export interface AuthLogContext {
  requestId?: string;
  email?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  action: string;
  success: boolean;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
  additionalData?: Record<string, any>;
}

export interface AuthErrorContext extends AuthLogContext {
  success: false;
  error: Error;
  stackTrace?: string;
  debugInfo?: Record<string, any>;
}

export class AuthLogger {
  /**
   * Generate a unique request ID for tracing
   */
  static generateRequestId(): string {
    return uuidv4();
  }

  /**
   * Log authentication attempt
   */
  static logAuthAttempt(context: AuthLogContext): void {
    const logData = {
      ...context,
      timestamp: new Date().toISOString(),
    };

    if (context.success) {
      authLogger.info('Authentication attempt', logData);
    } else {
      authLogger.warn('Authentication failed', logData);
    }
  }

  /**
   * Log authentication error with detailed context
   */
  static logAuthError(context: AuthErrorContext): void {
    const logData = {
      ...context,
      errorMessage: context.error.message,
      stackTrace: context.error.stack,
      timestamp: new Date().toISOString(),
    };

    authLogger.error('Authentication error', logData);
  }

  /**
   * Log password operation (hashing/comparison)
   */
  static logPasswordOperation(
    operation: 'hash' | 'compare',
    success: boolean,
    duration: number,
    context?: {
      requestId?: string;
      userId?: string;
      errorMessage?: string;
    }
  ): void {
    const logData = {
      operation,
      success,
      duration,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (success) {
      authLogger.debug('Password operation completed', logData);
    } else {
      authLogger.warn('Password operation failed', logData);
    }
  }

  /**
   * Log JWT token operation
   */
  static logTokenOperation(
    operation:
      | 'generate'
      | 'verify'
      | 'refresh'
      | 'blacklist'
      | 'blacklist_check'
      | 'blacklist_all'
      | 'cleanup',
    success: boolean,
    context?: {
      requestId?: string;
      userId?: string;
      tokenType?: 'access' | 'refresh';
      errorMessage?: string;
      expiresIn?: string;
      additionalData?: Record<string, any>;
    }
  ): void {
    const logData = {
      operation,
      success,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (success) {
      authLogger.debug('Token operation completed', logData);
    } else {
      authLogger.warn('Token operation failed', logData);
    }
  }

  /**
   * Log database operation related to authentication
   */
  static logDatabaseOperation(
    operation: string,
    success: boolean,
    duration: number,
    context?: {
      requestId?: string;
      query?: string;
      userId?: string;
      email?: string;
      errorMessage?: string;
    }
  ): void {
    const logData = {
      operation,
      success,
      duration,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (success) {
      authLogger.debug('Database operation completed', logData);
    } else {
      authLogger.error('Database operation failed', logData);
    }
  }

  /**
   * Log security event
   */
  static logSecurityEvent(
    event:
      | 'suspicious_activity'
      | 'rate_limit_exceeded'
      | 'invalid_token'
      | 'brute_force_attempt'
      | 'user_tokens_revoked',
    context: {
      requestId?: string;
      ipAddress?: string;
      userAgent?: string;
      email?: string;
      attemptCount?: number;
      additionalData?: Record<string, any>;
    }
  ): void {
    const logData = {
      event,
      severity: 'high',
      timestamp: new Date().toISOString(),
      ...context,
    };

    authLogger.warn('Security event detected', logData);
  }

  /**
   * Log performance metrics
   */
  static logPerformanceMetrics(
    operation: string,
    duration: number,
    context?: {
      requestId?: string;
      success?: boolean;
      additionalMetrics?: Record<string, number>;
    }
  ): void {
    const logData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (duration > 1000) {
      // Log slow operations (>1s)
      authLogger.warn('Slow authentication operation', logData);
    } else {
      authLogger.debug('Performance metrics', logData);
    }
  }
}
