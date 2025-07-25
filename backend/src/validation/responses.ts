import { z } from 'zod';
import { TaskStatus, TaskPriority, ProjectRole } from '@prisma/client';

// User Response Schema
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatar: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Project Response Schema
export const projectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  ownerId: z.string().uuid(),
  owner: userResponseSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  members: z.array(
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      projectId: z.string().uuid(),
      role: z.nativeEnum(ProjectRole),
      joinedAt: z.string().datetime(),
      user: userResponseSchema,
    })
  ),
  taskCounts: z.object({
    total: z.number(),
    todo: z.number(),
    inProgress: z.number(),
    inReview: z.number(),
    done: z.number(),
  }),
});

// Task Response Schema
export const taskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  assigneeId: z.string().uuid().nullable(),
  projectId: z.string().uuid(),
  dueDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  assignee: userResponseSchema.nullable(),
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
  }),
  comments: z.array(
    z.object({
      id: z.string().uuid(),
      content: z.string(),
      authorId: z.string().uuid(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      author: userResponseSchema,
    })
  ),
});

// Comment Response Schema
export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  taskId: z.string().uuid(),
  authorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  author: userResponseSchema,
  task: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
});

// Auth Response Schema
export const authResponseSchema = z.object({
  user: userResponseSchema,
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

// Paginated Response Schema
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  });

// API Response Schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// Error Response Schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().datetime(),
    path: z.string(),
    fields: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
          value: z.any().optional(),
        })
      )
      .optional(),
  }),
});

// Export types
export type UserResponse = z.infer<typeof userResponseSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type PaginatedResponse<T> = z.infer<
  ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>
>;
export type ApiResponse<T> = z.infer<
  ReturnType<typeof apiResponseSchema<z.ZodType<T>>>
>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
