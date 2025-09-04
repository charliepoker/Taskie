import { User } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { LoginCredentials, RegisterData, TokenPair } from '../types';
import { prisma } from '../utils/database';
import {
  AuthLogger,
  AuthLogContext,
  AuthErrorContext,
} from '../utils/authLogger';
import { randomBytes } from 'crypto';

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    userData: RegisterData,
    requestId?: string
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      email: userData.email,
      action: 'register',
      success: false,
    };

    try {
      // Check if user already exists
      const dbStartTime = Date.now();
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }],
        },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation(
        'user_existence_check',
        true,
        dbDuration,
        {
          requestId,
          email: userData.email,
          query: 'findFirst with OR condition',
        }
      );

      if (existingUser) {
        const errorMessage =
          existingUser.email === userData.email
            ? 'User with this email already exists'
            : 'Username is already taken';

        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          error: new Error(errorMessage),
          errorCode: 'USER_EXISTS',
          additionalData: {
            conflictField:
              existingUser.email === userData.email ? 'email' : 'username',
            existingUserId: existingUser.id,
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error(errorMessage);
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password, requestId);

      // Create the user
      const createStartTime = Date.now();
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: hashedPassword,
        },
      });
      const createDuration = Date.now() - createStartTime;

      AuthLogger.logDatabaseOperation('user_creation', true, createDuration, {
        requestId,
        email: userData.email,
        userId: user.id,
        query: 'create user',
      });

      // Generate tokens
      const tokens = generateTokens(user, requestId);

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: user.id,
        duration: totalDuration,
      };

      AuthLogger.logAuthAttempt(successContext);

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorContext: AuthErrorContext = {
        ...logContext,
        success: false,
        error:
          error instanceof Error ? error : new Error('Registration failed'),
        duration: totalDuration,
        errorCode:
          error instanceof Error && error.message.includes('exists')
            ? 'USER_EXISTS'
            : 'REGISTRATION_FAILED',
      };

      AuthLogger.logAuthError(errorContext);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(
    credentials: LoginCredentials,
    requestId?: string
  ): Promise<{ user: Omit<User, 'password'>; tokens: TokenPair }> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      email: credentials.email,
      action: 'login',
      success: false,
    };

    try {
      // Find user by email
      const dbStartTime = Date.now();
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation('user_lookup', !!user, dbDuration, {
        requestId,
        email: credentials.email,
        userId: user?.id,
        query: 'findUnique by email',
      });

      if (!user) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          error: new Error('Invalid email or password'),
          errorCode: 'USER_NOT_FOUND',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'User not found in database',
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await comparePassword(
        credentials.password,
        user.password,
        requestId
      );

      if (!isPasswordValid) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          userId: user.id,
          error: new Error('Invalid email or password'),
          errorCode: 'INVALID_PASSWORD',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'Password comparison failed',
            userId: user.id,
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = generateTokens(user, requestId);

      // Return user without password
      const { password, ...userWithoutPassword } = user;

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: user.id,
        duration: totalDuration,
      };

      AuthLogger.logAuthAttempt(successContext);

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      // Only log if we haven't already logged this error
      if (
        !(
          error instanceof Error &&
          error.message === 'Invalid email or password'
        )
      ) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          error: error instanceof Error ? error : new Error('Login failed'),
          duration: totalDuration,
          errorCode: 'LOGIN_FAILED',
        };

        AuthLogger.logAuthError(errorContext);
      }

      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    requestId?: string
  ): Promise<TokenPair> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      action: 'refresh_token',
      success: false,
    };

    try {
      // Verify refresh token
      const decoded = await verifyRefreshToken(refreshToken, requestId);

      // Find user to ensure they still exist
      const dbStartTime = Date.now();
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation(
        'user_lookup_for_refresh',
        !!user,
        dbDuration,
        {
          requestId,
          userId: decoded.userId,
          query: 'findUnique by id for token refresh',
        }
      );

      if (!user) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          userId: decoded.userId,
          error: new Error('User not found'),
          errorCode: 'USER_NOT_FOUND',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'User no longer exists in database',
            decodedUserId: decoded.userId,
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens(user, requestId);

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: user.id,
        email: user.email,
        duration: totalDuration,
      };

      AuthLogger.logAuthAttempt(successContext);

      return tokens;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorContext: AuthErrorContext = {
        ...logContext,
        success: false,
        error:
          error instanceof Error ? error : new Error('Invalid refresh token'),
        duration: totalDuration,
        errorCode: 'TOKEN_REFRESH_FAILED',
      };

      AuthLogger.logAuthError(errorContext);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      avatar?: string | null;
    }
  ): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Request password reset - generates and stores a reset token
   */
  async requestPasswordReset(email: string, requestId?: string): Promise<void> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      email,
      action: 'password_reset_request',
      success: false,
    };

    try {
      // Find user by email
      const dbStartTime = Date.now();
      const user = await prisma.user.findUnique({
        where: { email },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation(
        'user_lookup_for_reset',
        !!user,
        dbDuration,
        {
          requestId,
          email,
          userId: user?.id,
          query: 'findUnique by email for password reset',
        }
      );

      if (!user) {
        // For security, don't reveal if email exists or not
        // Log the attempt but return success to prevent email enumeration
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          error: new Error('User not found for password reset'),
          errorCode: 'USER_NOT_FOUND_RESET',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'Email not found in database',
          },
        };

        AuthLogger.logAuthError(errorContext);
        return; // Return success to prevent email enumeration
      }

      // Generate secure reset token
      const resetToken = randomBytes(32).toString('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Clean up any existing unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      // Create new reset token
      const createTokenStartTime = Date.now();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });
      const createTokenDuration = Date.now() - createTokenStartTime;

      AuthLogger.logDatabaseOperation(
        'password_reset_token_creation',
        true,
        createTokenDuration,
        {
          requestId,
          email,
          userId: user.id,
          query: 'create password reset token',
        }
      );

      // TODO: Send email with reset link containing the token
      // For now, we'll just log the token (remove this in production)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: user.id,
        duration: totalDuration,
      };

      AuthLogger.logAuthAttempt(successContext);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorContext: AuthErrorContext = {
        ...logContext,
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Password reset request failed'),
        duration: totalDuration,
        errorCode: 'PASSWORD_RESET_REQUEST_FAILED',
      };

      AuthLogger.logAuthError(errorContext);
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Reset password using a valid reset token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    requestId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      action: 'password_reset_confirm',
      success: false,
    };

    try {
      // Find and validate reset token
      const dbStartTime = Date.now();
      const resetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation(
        'password_reset_token_lookup',
        !!resetTokenRecord,
        dbDuration,
        {
          requestId,
          query: 'findUnique password reset token with user',
        }
      );

      if (!resetTokenRecord) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          error: new Error('Invalid or expired reset token'),
          errorCode: 'INVALID_RESET_TOKEN',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'Reset token not found in database',
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid or expired reset token');
      }

      // Check if token has already been used
      if (resetTokenRecord.used) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          userId: resetTokenRecord.userId,
          email: resetTokenRecord.user.email,
          error: new Error('Reset token has already been used'),
          errorCode: 'TOKEN_ALREADY_USED',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'Token marked as used',
            tokenId: resetTokenRecord.id,
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid or expired reset token');
      }

      // Check if token has expired
      if (resetTokenRecord.expiresAt < new Date()) {
        const errorContext: AuthErrorContext = {
          ...logContext,
          success: false,
          userId: resetTokenRecord.userId,
          email: resetTokenRecord.user.email,
          error: new Error('Reset token has expired'),
          errorCode: 'TOKEN_EXPIRED',
          duration: Date.now() - startTime,
          additionalData: {
            reason: 'Token past expiration time',
            tokenId: resetTokenRecord.id,
            expiresAt: resetTokenRecord.expiresAt.toISOString(),
          },
        };

        AuthLogger.logAuthError(errorContext);
        throw new Error('Invalid or expired reset token');
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword, requestId);

      // Update user password and mark token as used in a transaction
      const updateStartTime = Date.now();
      await prisma.$transaction([
        // Update user password
        prisma.user.update({
          where: { id: resetTokenRecord.userId },
          data: { password: hashedPassword },
        }),
        // Mark token as used
        prisma.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { used: true },
        }),
      ]);
      const updateDuration = Date.now() - updateStartTime;

      AuthLogger.logDatabaseOperation(
        'password_reset_completion',
        true,
        updateDuration,
        {
          requestId,
          userId: resetTokenRecord.userId,
          email: resetTokenRecord.user.email,
          query: 'transaction: update password and mark token used',
        }
      );

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: resetTokenRecord.userId,
        email: resetTokenRecord.user.email,
        duration: totalDuration,
      };

      AuthLogger.logAuthAttempt(successContext);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorContext: AuthErrorContext = {
        ...logContext,
        success: false,
        error:
          error instanceof Error ? error : new Error('Password reset failed'),
        duration: totalDuration,
        errorCode: 'PASSWORD_RESET_FAILED',
      };

      AuthLogger.logAuthError(errorContext);
      throw error;
    }
  }

  /**
   * Validate a password reset token without using it
   */
  async validateResetToken(
    token: string,
    requestId?: string
  ): Promise<boolean> {
    const startTime = Date.now();
    const logContext: AuthLogContext = {
      requestId,
      action: 'password_reset_token_validation',
      success: false,
    };

    try {
      const dbStartTime = Date.now();
      const resetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
      });
      const dbDuration = Date.now() - dbStartTime;

      AuthLogger.logDatabaseOperation(
        'password_reset_token_validation',
        !!resetTokenRecord,
        dbDuration,
        {
          requestId,
          query: 'findUnique password reset token for validation',
        }
      );

      if (!resetTokenRecord) {
        return false;
      }

      // Check if token has been used or expired
      const isValid =
        !resetTokenRecord.used && resetTokenRecord.expiresAt > new Date();

      const totalDuration = Date.now() - startTime;
      const successContext: AuthLogContext = {
        ...logContext,
        success: true,
        userId: resetTokenRecord.userId,
        duration: totalDuration,
        additionalData: {
          tokenValid: isValid,
          tokenUsed: resetTokenRecord.used,
          tokenExpired: resetTokenRecord.expiresAt <= new Date(),
        },
      };

      AuthLogger.logAuthAttempt(successContext);

      return isValid;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorContext: AuthErrorContext = {
        ...logContext,
        success: false,
        error:
          error instanceof Error ? error : new Error('Token validation failed'),
        duration: totalDuration,
        errorCode: 'TOKEN_VALIDATION_FAILED',
      };

      AuthLogger.logAuthError(errorContext);
      return false;
    }
  }
}
