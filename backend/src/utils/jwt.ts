import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { User } from '@prisma/client';
import { TokenPair } from '../types';
import { AuthLogger } from './authLogger';
import { prisma } from './database';

// JWT configuration with validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate JWT configuration on startup
function validateJWTConfig(): void {
  const errors: string[] = [];

  if (!JWT_SECRET) {
    errors.push('JWT_SECRET environment variable is required');
  } else if (JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  } else if (JWT_SECRET === 'your-secret-key') {
    errors.push('JWT_SECRET must not use the default value');
  }

  if (!JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET environment variable is required');
  } else if (JWT_REFRESH_SECRET.length < 32) {
    errors.push(
      'JWT_REFRESH_SECRET must be at least 32 characters long for security'
    );
  } else if (JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
    errors.push('JWT_REFRESH_SECRET must not use the default value');
  }

  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (errors.length > 0) {
    const errorMessage = `JWT Configuration Errors:\n${errors.map((e) => `- ${e}`).join('\n')}`;
    console.error(errorMessage);
    throw new Error(
      'Invalid JWT configuration. Please check your environment variables.'
    );
  }
}

// Validate configuration on module load
validateJWTConfig();

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number; // issued at
  exp?: number; // expires at
  jti?: string; // JWT ID for blacklisting
}

export interface TokenBlacklistReason {
  LOGOUT: 'logout';
  PASSWORD_CHANGE: 'password_change';
  SECURITY_BREACH: 'security_breach';
  ADMIN_REVOKE: 'admin_revoke';
}

export const TOKEN_BLACKLIST_REASONS: TokenBlacklistReason = {
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  SECURITY_BREACH: 'security_breach',
  ADMIN_REVOKE: 'admin_revoke',
};

/**
 * Generate JWT access and refresh tokens for a user
 */
export function generateTokens(user: User, requestId?: string): TokenPair {
  try {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenId = `${user.id}_${now}_access`;
    const refreshTokenId = `${user.id}_${now}_refresh`;

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as StringValue,
      issuer: 'taskie-api',
      audience: 'taskie-app',
      jwtid: accessTokenId,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: JWT_REFRESH_EXPIRES_IN as StringValue,
      issuer: 'taskie-api',
      audience: 'taskie-app',
      jwtid: refreshTokenId,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET!, accessTokenOptions);
    const refreshToken = jwt.sign(
      payload,
      JWT_REFRESH_SECRET!,
      refreshTokenOptions
    );

    AuthLogger.logTokenOperation('generate', true, {
      requestId,
      userId: user.id,
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Token generation failed';

    AuthLogger.logTokenOperation('generate', false, {
      requestId,
      userId: user.id,
      errorMessage,
    });

    throw new Error('Failed to generate tokens');
  }
}

/**
 * Verify and decode JWT access token
 */
export async function verifyAccessToken(
  token: string,
  requestId?: string
): Promise<JwtPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, {
      issuer: 'taskie-api',
      audience: 'taskie-app',
    }) as JwtPayload;

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token, 'access');
    if (isBlacklisted) {
      AuthLogger.logTokenOperation('verify', false, {
        requestId,
        userId: decoded.userId,
        tokenType: 'access',
        errorMessage: 'Token is blacklisted',
      });
      throw new Error('Access token has been revoked');
    }

    AuthLogger.logTokenOperation('verify', true, {
      requestId,
      userId: decoded.userId,
      tokenType: 'access',
    });

    return decoded;
  } catch (error) {
    let errorMessage = 'Token verification failed';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Access token has expired';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid access token';
    } else if (error instanceof Error && error.message.includes('revoked')) {
      errorMessage = error.message;
    }

    AuthLogger.logTokenOperation('verify', false, {
      requestId,
      tokenType: 'access',
      errorMessage,
    });

    throw new Error(errorMessage);
  }
}

/**
 * Verify and decode JWT refresh token
 */
export async function verifyRefreshToken(
  token: string,
  requestId?: string
): Promise<JwtPayload> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET!, {
      issuer: 'taskie-api',
      audience: 'taskie-app',
    }) as JwtPayload;

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token, 'refresh');
    if (isBlacklisted) {
      AuthLogger.logTokenOperation('verify', false, {
        requestId,
        userId: decoded.userId,
        tokenType: 'refresh',
        errorMessage: 'Token is blacklisted',
      });
      throw new Error('Refresh token has been revoked');
    }

    AuthLogger.logTokenOperation('verify', true, {
      requestId,
      userId: decoded.userId,
      tokenType: 'refresh',
    });

    return decoded;
  } catch (error) {
    let errorMessage = 'Refresh token verification failed';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Refresh token has expired';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid refresh token';
    } else if (error instanceof Error && error.message.includes('revoked')) {
      errorMessage = error.message;
    }

    AuthLogger.logTokenOperation('verify', false, {
      requestId,
      tokenType: 'refresh',
      errorMessage,
    });

    throw new Error(errorMessage);
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Generate a hash of the token for blacklisting
 */
function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Blacklist a token
 */
export async function blacklistToken(
  token: string,
  tokenType: 'access' | 'refresh',
  reason: string,
  requestId?: string
): Promise<void> {
  try {
    // Decode token to get expiration and user info
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp || !decoded.userId) {
      throw new Error('Invalid token format');
    }

    const tokenHash = hashToken(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await prisma.blacklistedToken.create({
      data: {
        tokenHash,
        userId: decoded.userId,
        tokenType,
        expiresAt,
        reason,
      },
    });

    AuthLogger.logTokenOperation('blacklist', true, {
      requestId,
      userId: decoded.userId,
      tokenType,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Token blacklisting failed';

    AuthLogger.logTokenOperation('blacklist', false, {
      requestId,
      tokenType,
      errorMessage,
    });

    throw new Error('Failed to blacklist token');
  }
}

/**
 * Check if a token is blacklisted
 */
export async function isTokenBlacklisted(
  token: string,
  tokenType: 'access' | 'refresh'
): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);

    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { tokenHash },
    });

    return (
      blacklistedToken !== null && blacklistedToken.tokenType === tokenType
    );
  } catch (error) {
    // Log error but don't throw - fail open for availability
    AuthLogger.logTokenOperation('blacklist_check', false, {
      tokenType,
      errorMessage:
        error instanceof Error ? error.message : 'Blacklist check failed',
    });
    return false;
  }
}

/**
 * Blacklist all tokens for a user (e.g., on password change)
 */
export async function blacklistAllUserTokens(
  userId: string,
  reason: string,
  requestId?: string
): Promise<void> {
  try {
    // We can't blacklist all existing tokens without knowing them,
    // but we can record a security event and future token verification
    // should check against user's last password change timestamp

    AuthLogger.logSecurityEvent('user_tokens_revoked', {
      requestId,
      additionalData: {
        userId,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    // TODO: Implement user-level token invalidation timestamp
    // This would require adding a field to the User model
  } catch (error) {
    AuthLogger.logTokenOperation('blacklist_all', false, {
      requestId,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Failed to blacklist user tokens',
    });
    throw new Error('Failed to blacklist user tokens');
  }
}

/**
 * Clean up expired blacklisted tokens (should be run periodically)
 */
export async function cleanupExpiredBlacklistedTokens(): Promise<number> {
  try {
    const result = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    AuthLogger.logTokenOperation('cleanup', true, {
      additionalData: {
        deletedCount: result.count,
      },
    });

    return result.count;
  } catch (error) {
    AuthLogger.logTokenOperation('cleanup', false, {
      errorMessage: error instanceof Error ? error.message : 'Cleanup failed',
    });
    throw new Error('Failed to cleanup expired tokens');
  }
}

/**
 * Get JWT configuration status for health checks
 */
export function getJWTConfigStatus(): {
  configured: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET not properly configured');
  }

  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
    issues.push('JWT_REFRESH_SECRET not properly configured');
  }

  if (JWT_SECRET === JWT_REFRESH_SECRET) {
    issues.push('JWT secrets should be different');
  }

  return {
    configured: issues.length === 0,
    issues,
  };
}
