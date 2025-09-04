import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthMonitoringService } from '../services/authMonitoringService';
import { AuthRequest } from '../types';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  UpdateUserProfileInput,
  ChangePasswordInput,
  PasswordResetRequestInput,
  PasswordResetConfirmInput,
} from '../validation/auth';
import { AuthLogger, AuthErrorContext } from '../utils/authLogger';

const authService = new AuthService();
const authMonitoringService = new AuthMonitoringService();

export class AuthController {
  /**
   * Extract client information from request for logging
   */
  private getClientInfo(req: Request) {
    return {
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };
  }

  /**
   * Create standardized error response with debugging context
   */
  private createErrorResponse(
    error: unknown,
    requestId: string,
    duration: number,
    defaultCode: string,
    defaultMessage: string,
    clientInfo?: { ipAddress: string; userAgent: string }
  ) {
    const errorMessage =
      error instanceof Error ? error.message : defaultMessage;

    // Log error with context for debugging
    const errorContext: AuthErrorContext = {
      requestId,
      action: 'controller_error',
      success: false,
      error: error instanceof Error ? error : new Error(defaultMessage),
      duration,
      errorCode: defaultCode,
      additionalData: {
        ...clientInfo,
        originalError: errorMessage,
      },
    };

    AuthLogger.logAuthError(errorContext);

    return {
      success: false,
      error: errorMessage,
      code: defaultCode,
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    };
  }
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      // Validate request body
      const validatedData: RegisterInput = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData, requestId);

      const duration = Date.now() - startTime;

      // Record successful registration attempt
      await authMonitoringService.recordAuthAttempt(
        validatedData.email,
        clientInfo.ipAddress,
        clientInfo.userAgent,
        true,
        undefined,
        requestId
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      let errorCode = 'REGISTRATION_FAILED';

      // Enhanced error categorization
      if (error instanceof Error) {
        if (
          error.message.includes('already exists') ||
          error.message.includes('already taken')
        ) {
          errorCode = 'USER_EXISTS';
          // Record failed registration attempt
          await authMonitoringService.recordAuthAttempt(
            req.body?.email || 'unknown',
            clientInfo.ipAddress,
            clientInfo.userAgent,
            false,
            errorCode,
            requestId
          );

          res
            .status(409)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                errorCode,
                'Registration failed',
                clientInfo
              )
            );
          return;
        }

        // Validation errors
        if (error.message.includes('validation') || error.name === 'ZodError') {
          errorCode = 'VALIDATION_ERROR';
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                errorCode,
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      // Record failed registration attempt
      await authMonitoringService.recordAuthAttempt(
        req.body?.email || 'unknown',
        clientInfo.ipAddress,
        clientInfo.userAgent,
        false,
        errorCode,
        requestId
      );

      // Generic registration failure
      res
        .status(400)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            errorCode,
            'Registration failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      // Check if IP is blocked due to suspicious activity
      const isBlocked = await authMonitoringService.isIPBlocked(
        clientInfo.ipAddress
      );
      if (isBlocked) {
        const duration = Date.now() - startTime;

        // Record blocked attempt
        await authMonitoringService.recordAuthAttempt(
          req.body?.email || 'unknown',
          clientInfo.ipAddress,
          clientInfo.userAgent,
          false,
          'IP_BLOCKED',
          requestId
        );

        res.status(429).json({
          success: false,
          error: 'Too many failed attempts. Please try again later.',
          code: 'IP_BLOCKED',
          requestId,
          duration,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate request body
      const validatedData: LoginInput = loginSchema.parse(req.body);

      // Authenticate user
      const result = await authService.login(validatedData, requestId);

      const duration = Date.now() - startTime;

      // Record successful login attempt
      await authMonitoringService.recordAuthAttempt(
        validatedData.email,
        clientInfo.ipAddress,
        clientInfo.userAgent,
        true,
        undefined,
        requestId
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      let errorCode = 'LOGIN_FAILED';

      // Enhanced error categorization for login
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          errorCode = 'INVALID_CREDENTIALS';

          // Record failed login attempt
          await authMonitoringService.recordAuthAttempt(
            req.body?.email || 'unknown',
            clientInfo.ipAddress,
            clientInfo.userAgent,
            false,
            errorCode,
            requestId
          );

          // Log security event for failed login
          AuthLogger.logSecurityEvent('brute_force_attempt', {
            requestId,
            ...clientInfo,
            email: req.body?.email,
            additionalData: {
              reason: 'Invalid credentials provided',
            },
          });

          res
            .status(401)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                errorCode,
                'Invalid email or password',
                clientInfo
              )
            );
          return;
        }

        // Validation errors
        if (error.message.includes('validation') || error.name === 'ZodError') {
          errorCode = 'VALIDATION_ERROR';
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                errorCode,
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      // Record failed login attempt
      await authMonitoringService.recordAuthAttempt(
        req.body?.email || 'unknown',
        clientInfo.ipAddress,
        clientInfo.userAgent,
        false,
        errorCode,
        requestId
      );

      // Generic login failure
      res
        .status(400)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            errorCode,
            'Login failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      // Validate request body
      const validatedData: RefreshTokenInput = refreshTokenSchema.parse(
        req.body
      );

      // Refresh tokens
      const tokens = await authService.refreshToken(
        validatedData.refreshToken,
        requestId
      );

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error categorization for token refresh
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res
            .status(401)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'TOKEN_EXPIRED',
                'Refresh token has expired',
                clientInfo
              )
            );
          return;
        }

        if (error.message.includes('Invalid')) {
          // Log security event for invalid token
          AuthLogger.logSecurityEvent('invalid_token', {
            requestId,
            ...clientInfo,
            additionalData: {
              tokenType: 'refresh',
              reason: 'Invalid refresh token provided',
            },
          });

          res
            .status(401)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'INVALID_TOKEN',
                'Invalid refresh token',
                clientInfo
              )
            );
          return;
        }
      }

      // Generic token refresh failure
      res
        .status(401)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'TOKEN_REFRESH_FAILED',
            'Token refresh failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        const duration = Date.now() - startTime;
        res
          .status(404)
          .json(
            this.createErrorResponse(
              new Error('User not found'),
              requestId,
              duration,
              'USER_NOT_FOUND',
              'User not found',
              clientInfo
            )
          );
        return;
      }

      const duration = Date.now() - startTime;
      res.status(200).json({
        success: true,
        data: { user },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      res
        .status(500)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'GET_USER_FAILED',
            'Failed to get user profile',
            clientInfo
          )
        );
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      // Validate request body
      const validatedData: UpdateUserProfileInput =
        updateUserProfileSchema.parse(req.body);

      // Update profile
      const user = await authService.updateProfile(req.user.id, validatedData);

      const duration = Date.now() - startTime;
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error categorization for profile update
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.name === 'ZodError') {
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'VALIDATION_ERROR',
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      res
        .status(400)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'UPDATE_PROFILE_FAILED',
            'Profile update failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      // Validate request body
      const validatedData: ChangePasswordInput = changePasswordSchema.parse(
        req.body
      );

      // Change password
      await authService.changePassword(
        req.user.id,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      const duration = Date.now() - startTime;
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error categorization for password change
      if (error instanceof Error) {
        if (error.message.includes('Current password is incorrect')) {
          // Log security event for incorrect password
          AuthLogger.logSecurityEvent('brute_force_attempt', {
            requestId,
            ...clientInfo,
            email: req.user?.email,
            additionalData: {
              reason: 'Incorrect current password during password change',
              userId: req.user?.id,
            },
          });

          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'INCORRECT_PASSWORD',
                'Current password is incorrect',
                clientInfo
              )
            );
          return;
        }

        if (error.message.includes('validation') || error.name === 'ZodError') {
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'VALIDATION_ERROR',
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      res
        .status(400)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'CHANGE_PASSWORD_FAILED',
            'Password change failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Logout user (blacklist current tokens)
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      // Extract and blacklist the current access token
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const {
          extractTokenFromHeader,
          blacklistToken,
          TOKEN_BLACKLIST_REASONS,
        } = await import('../utils/jwt');
        const token = extractTokenFromHeader(authHeader);

        if (token) {
          await blacklistToken(
            token,
            'access',
            TOKEN_BLACKLIST_REASONS.LOGOUT,
            requestId
          );
        }
      }

      // TODO: Also blacklist refresh token if provided in request body
      // This would require the client to send the refresh token in the logout request

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Even if blacklisting fails, we should still return success
      // as the client will remove tokens locally
      res.status(200).json({
        success: true,
        message: 'Logout successful',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      await authService.deleteAccount(req.user.id);

      const duration = Date.now() - startTime;
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      res
        .status(500)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'DELETE_ACCOUNT_FAILED',
            'Account deletion failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      // Validate request body
      const validatedData: PasswordResetRequestInput =
        passwordResetRequestSchema.parse(req.body);

      // Request password reset
      await authService.requestPasswordReset(validatedData.email, requestId);

      const duration = Date.now() - startTime;

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error categorization for password reset request
      if (error instanceof Error) {
        if (error.message.includes('validation') || error.name === 'ZodError') {
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'VALIDATION_ERROR',
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      // For security, always return success even on errors to prevent email enumeration
      res.status(200).json({
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
        requestId,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      // Validate request body
      const validatedData: PasswordResetConfirmInput =
        passwordResetConfirmSchema.parse(req.body);

      // Reset password
      await authService.resetPassword(
        validatedData.token,
        validatedData.newPassword,
        requestId
      );

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully',
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Enhanced error categorization for password reset
      if (error instanceof Error) {
        if (error.message.includes('Invalid or expired reset token')) {
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'INVALID_RESET_TOKEN',
                'Invalid or expired reset token',
                clientInfo
              )
            );
          return;
        }

        if (error.message.includes('validation') || error.name === 'ZodError') {
          res
            .status(400)
            .json(
              this.createErrorResponse(
                error,
                requestId,
                duration,
                'VALIDATION_ERROR',
                'Invalid input data',
                clientInfo
              )
            );
          return;
        }
      }

      res
        .status(400)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'PASSWORD_RESET_FAILED',
            'Password reset failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(req: Request, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      const { token } = req.params;

      if (!token) {
        const duration = Date.now() - startTime;
        res
          .status(400)
          .json(
            this.createErrorResponse(
              new Error('Reset token is required'),
              requestId,
              duration,
              'MISSING_TOKEN',
              'Reset token is required',
              clientInfo
            )
          );
        return;
      }

      // Validate token
      const isValid = await authService.validateResetToken(token, requestId);

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: { valid: isValid },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      res
        .status(500)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'TOKEN_VALIDATION_FAILED',
            'Token validation failed',
            clientInfo
          )
        );
    }
  }

  /**
   * Get authentication metrics (admin only)
   */
  async getAuthMetrics(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      // Get date range from query params (default to last 24 hours)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const metrics = await authMonitoringService.getAuthMetrics(
        startDate,
        endDate
      );
      const suspiciousActivities =
        await authMonitoringService.getRecentSuspiciousActivities(10);

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: {
          metrics,
          suspiciousActivities,
          timeRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      res
        .status(500)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'METRICS_FAILED',
            'Failed to get authentication metrics',
            clientInfo
          )
        );
    }
  }

  /**
   * Get authentication rates over time (admin only)
   */
  async getAuthRatesOverTime(req: AuthRequest, res: Response): Promise<void> {
    const requestId = AuthLogger.generateRequestId();
    const startTime = Date.now();
    const clientInfo = this.getClientInfo(req);

    try {
      if (!req.user) {
        const duration = Date.now() - startTime;
        res
          .status(401)
          .json(
            this.createErrorResponse(
              new Error('User not authenticated'),
              requestId,
              duration,
              'NOT_AUTHENTICATED',
              'User not authenticated',
              clientInfo
            )
          );
        return;
      }

      // Get parameters from query
      const hours = parseInt(req.query.hours as string) || 24;
      const intervalMinutes = parseInt(req.query.interval as string) || 60;

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

      const rates = await authMonitoringService.getAuthRatesOverTime(
        startDate,
        endDate,
        intervalMinutes
      );

      const duration = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: {
          rates,
          timeRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          intervalMinutes,
        },
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      res
        .status(500)
        .json(
          this.createErrorResponse(
            error,
            requestId,
            duration,
            'RATES_FAILED',
            'Failed to get authentication rates',
            clientInfo
          )
        );
    }
  }
}
