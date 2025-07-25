// Export all validation schemas and types
export * from './auth';
export * from './project';
export * from './task';
export * from './comment';
export * from './responses';

// Common validation schemas
import { z } from 'zod';

// UUID Parameter Schema (reusable)
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

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

// Pagination Schema (reusable)
export const paginationSchema = z.object({
  page: createPaginationField(1, 1000),
  limit: createPaginationField(10, 100),
});

// Search Schema (reusable)
export const searchSchema = z.object({
  search: z
    .string()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
});

// Date Range Schema (reusable)
export const dateRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime('Start date must be a valid ISO datetime')
      .transform((str) => new Date(str))
      .optional(),
    endDate: z
      .string()
      .datetime('End date must be a valid ISO datetime')
      .transform((str) => new Date(str))
      .optional(),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.startDate <= data.endDate,
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  );

// Export types for common schemas
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
