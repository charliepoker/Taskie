import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

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

// Project Creation Schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Color must be a valid hex color'
    )
    .default('#0D65F2'),
});

// Project Update Schema
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Color must be a valid hex color'
    )
    .optional(),
});

// Project Query Parameters Schema
export const projectQuerySchema = z.object({
  page: createPaginationField(1, 1000),
  limit: createPaginationField(10, 100),
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
});

// Project Member Management Schema
export const addProjectMemberSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export const updateProjectMemberSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

// Project ID Parameter Schema
export const projectIdSchema = z.object({
  id: z.string().uuid('Project ID must be a valid UUID'),
});

// Project Member ID Parameter Schema
export const projectMemberIdSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
});

// Export types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberSchema
>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type ProjectMemberIdInput = z.infer<typeof projectMemberIdSchema>;
