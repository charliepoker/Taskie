import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

/**
 * Authentication middleware to verify JWT tokens
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    // Verify the token
    const decoded = await verifyAccessToken(token);

    // Fetch the user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Attach user to request object
    req.user = user as any;
    next();
  } catch (error) {
    let errorMessage = 'Invalid token';
    let errorCode = 'INVALID_TOKEN';

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token has expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Invalid token format';
        errorCode = 'INVALID_TOKEN_FORMAT';
      }
    }

    res.status(401).json({
      success: false,
      error: errorMessage,
      code: errorCode,
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Verify the token
    const decoded = await verifyAccessToken(token);

    // Fetch the user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      req.user = user as any;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user (don't fail the request)
    next();
  }
}

/**
 * Authorization middleware to check if user has required permissions
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }
  next();
}
