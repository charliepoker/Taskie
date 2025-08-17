"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateUserProfileSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .min(1, 'Email is required')
        .max(255, 'Email must be less than 255 characters'),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    firstName: zod_1.z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters')
        .trim(),
    lastName: zod_1.z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters')
        .trim(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format').min(1, 'Email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.updateUserProfileSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(1, 'First name is required')
        .max(100, 'First name must be less than 100 characters')
        .trim()
        .optional(),
    lastName: zod_1.z
        .string()
        .min(1, 'Last name is required')
        .max(100, 'Last name must be less than 100 characters')
        .trim()
        .optional(),
    avatar: zod_1.z.string().url('Avatar must be a valid URL').optional().nullable(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .max(128, 'New password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
});
//# sourceMappingURL=auth.js.map