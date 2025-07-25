import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../types';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  UpdateUserProfileInput,
  ChangePasswordInput,
} from '../validation/auth';

const authService = new AuthService();

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData: RegisterInput = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('already exists') ||
          error.message.includes('already taken')
        ) {
          res.status(409).json({
            success: false,
            error: error.message,
            code: 'USER_EXISTS',
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        code: 'REGISTRATION_FAILED',
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData: LoginInput = loginSchema.parse(req.body);

      // Authenticate user
      const result = await authService.login(validatedData);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Invalid email or password')
      ) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        code: 'LOGIN_FAILED',
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData: RefreshTokenInput = refreshTokenSchema.parse(
        req.body
      );

      // Refresh tokens
      const tokens = await authService.refreshToken(validatedData.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        code: 'TOKEN_REFRESH_FAILED',
      });
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get user profile',
        code: 'GET_USER_FAILED',
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      // Validate request body
      const validatedData: UpdateUserProfileInput =
        updateUserProfileSchema.parse(req.body);

      // Update profile
      const user = await authService.updateProfile(req.user.id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
        code: 'UPDATE_PROFILE_FAILED',
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
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

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Current password is incorrect')
      ) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INCORRECT_PASSWORD',
        });
        return;
      }

      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Password change failed',
        code: 'CHANGE_PASSWORD_FAILED',
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the tokens from storage. We just return a success response.
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      await authService.deleteAccount(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Account deletion failed',
        code: 'DELETE_ACCOUNT_FAILED',
      });
    }
  }
}
