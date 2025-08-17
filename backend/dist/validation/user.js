"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamSchema = exports.updateUserSchema = exports.getUsersQuerySchema = void 0;
const zod_1 = require("zod");
exports.getUsersQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    search: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? val.trim() : undefined))
        .refine((val) => !val || val.length >= 2, 'Search term must be at least 2 characters'),
    sortBy: zod_1.z
        .enum(['createdAt', 'firstName', 'lastName', 'email'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
exports.updateUserSchema = zod_1.z.object({
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
    avatar: zod_1.z
        .string()
        .url('Avatar must be a valid URL')
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
});
exports.userIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid user ID format'),
});
//# sourceMappingURL=user.js.map