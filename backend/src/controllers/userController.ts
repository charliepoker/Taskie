import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { AuthRequest } from '../types';
import {
  getUsersQuerySchema,
  updateUserSchema,
  GetUsersQueryInput,
  UpdateUserInput,
} from '../validation/user';

const userService = new UserService();

export class UserController {
  /**
   * Get paginated list of users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery: GetUsersQueryInput = getUsersQuerySchema.parse(
        req.query
      );

      // Get users with pagination
      const result = await userService.getUsers(validatedQuery);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get users',
        code: 'GET_USERS_FAILED',
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      const user = await userService.getUserById(id);

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
        error: error instanceof Error ? error.message : 'Failed to get user',
        code: 'GET_USER_FAILED',
      });
    }
  }

  /**
   * Update user profile (admin or self)
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const { id } = req.params;
      const currentUserId = req.user.id;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // Check if user is updating their own profile or if they have admin rights
      // For now, users can only update their own profiles
      if (id !== currentUserId) {
        res.status(403).json({
          success: false,
          error: 'You can only update your own profile',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      // Validate request body
      const validatedData: UpdateUserInput = updateUserSchema.parse(req.body);

      // Update user
      const user = await userService.updateUser(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'User update failed',
        code: 'UPDATE_USER_FAILED',
      });
    }
  }

  /**
   * Delete user account (admin or self)
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const { id } = req.params;
      const currentUserId = req.user.id;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
          code: 'INVALID_USER_ID',
        });
        return;
      }

      // Check if user is deleting their own account or if they have admin rights
      // For now, users can only delete their own accounts
      if (id !== currentUserId) {
        res.status(403).json({
          success: false,
          error: 'You can only delete your own account',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      // Delete user with data cleanup
      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'User deletion failed',
        code: 'DELETE_USER_FAILED',
      });
    }
  }
}
