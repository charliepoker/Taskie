"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
const user_1 = require("../validation/user");
const userService = new userService_1.UserService();
class UserController {
    async getUsers(req, res) {
        try {
            const validatedQuery = user_1.getUsersQuerySchema.parse(req.query);
            const result = await userService.getUsers(validatedQuery);
            res.status(200).json({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get users',
                code: 'GET_USERS_FAILED',
            });
        }
    }
    async getUserById(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get user',
                code: 'GET_USER_FAILED',
            });
        }
    }
    async updateUser(req, res) {
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
            if (id !== currentUserId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only update your own profile',
                    code: 'INSUFFICIENT_PERMISSIONS',
                });
                return;
            }
            const validatedData = user_1.updateUserSchema.parse(req.body);
            const user = await userService.updateUser(id, validatedData);
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: { user },
            });
        }
        catch (error) {
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
    async deleteUser(req, res) {
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
            if (id !== currentUserId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only delete your own account',
                    code: 'INSUFFICIENT_PERMISSIONS',
                });
                return;
            }
            await userService.deleteUser(id);
            res.status(200).json({
                success: true,
                message: 'User deleted successfully',
            });
        }
        catch (error) {
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
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map