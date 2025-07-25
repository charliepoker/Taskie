import { z } from 'zod';

// Helper function for pagination fields
const createPaginationField = (defaultValue: number, max: number = 100) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : defaultValue))
    .refine(
      (val: number) => val > 0 && val <= max,
      `Must be between 1 and ${max}`
    )
    .refine((val: number) => Number.isInteger(val), 'Must be an integer');

// Comment Creation Schema
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment content must be less than 1000 characters')
    .trim(),
  taskId: z.string().uuid('Task ID must be a valid UUID'),
});

// Comment Update Schema
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment content must be less than 1000 characters')
    .trim(),
});

// Comment Query Parameters Schema
export const commentQuerySchema = z.object({
  page: createPaginationField(1, 1000),
  limit: createPaginationField(20, 50),
  taskId: z.string().uuid('Task ID must be a valid UUID'),
});

// Comment ID Parameter Schema
export const commentIdSchema = z.object({
  id: z.string().uuid('Comment ID must be a valid UUID'),
});

// Task Comment Parameters Schema (for nested routes)
export const taskCommentParamsSchema = z.object({
  taskId: z.string().uuid('Task ID must be a valid UUID'),
  commentId: z.string().uuid('Comment ID must be a valid UUID'),
});

// Export types
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type CommentIdInput = z.infer<typeof commentIdSchema>;
export type TaskCommentParamsInput = z.infer<typeof taskCommentParamsSchema>;
