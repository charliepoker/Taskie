import { z } from 'zod';

// Get Users Query Schema
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine(
      (val) => !val || val.length >= 2,
      'Search term must be at least 2 characters'
    ),
  sortBy: z
    .enum(['createdAt', 'firstName', 'lastName', 'email'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Update User Schema
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim()
    .optional(),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
});

// User ID Parameter Schema
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Export types
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
