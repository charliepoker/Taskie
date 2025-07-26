import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

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

// Helper function for date validation with future date requirement
const createFutureDateField = () =>
  z
    .union([
      z.string().datetime('Due date must be a valid ISO datetime'),
      z.date(),
    ])
    .transform((val) => {
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .refine((date) => date > new Date(), 'Due date must be in the future')
    .optional()
    .nullable();

// Helper function for date validation without future requirement
const createDateField = () =>
  z
    .union([z.string().datetime('Date must be a valid ISO datetime'), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .optional()
    .nullable();

// Task Creation Schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assigneeId: z
    .string()
    .uuid('Assignee ID must be a valid UUID')
    .optional()
    .nullable(),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  dueDate: createFutureDateField(),
});

// Task Update Schema
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z
    .string()
    .uuid('Assignee ID must be a valid UUID')
    .optional()
    .nullable(),
  dueDate: createDateField(), // No future requirement for updates
});

// Task Query Parameters Schema
export const taskQuerySchema = z.object({
  page: createPaginationField(1, 1000),
  limit: createPaginationField(10, 100),
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
  projectId: z.string().uuid('Project ID must be a valid UUID').optional(),
  assigneeId: z.string().uuid('Assignee ID must be a valid UUID').optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueBefore: createDateField(),
  dueAfter: createDateField(),
  createdBefore: createDateField(),
  createdAfter: createDateField(),
});

// Task ID Parameter Schema
export const taskIdSchema = z.object({
  id: z.string().uuid('Task ID must be a valid UUID'),
});

// Task Status Update Schema (for quick status changes)
export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

// Task Assignment Schema
export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid('Assignee ID must be a valid UUID').nullable(),
});

// Export types
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
