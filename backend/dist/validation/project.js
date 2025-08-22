"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectMemberIdSchema = exports.projectIdSchema = exports.updateProjectMemberSchema = exports.addProjectMemberSchema = exports.projectQuerySchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createPaginationField = (defaultValue, max = 100) => zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : defaultValue))
    .refine((val) => val > 0 && val <= max, `Must be between 1 and ${max}`)
    .refine((val) => Number.isInteger(val), 'Must be an integer');
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Project name is required')
        .max(100, 'Project name must be less than 100 characters')
        .trim(),
    description: zod_1.z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .trim()
        .optional()
        .nullable(),
    color: zod_1.z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color')
        .default('#0D65F2'),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Project name is required')
        .max(100, 'Project name must be less than 100 characters')
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .max(500, 'Description must be less than 500 characters')
        .trim()
        .optional()
        .nullable(),
    color: zod_1.z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color')
        .optional(),
});
exports.projectQuerySchema = zod_1.z.object({
    page: createPaginationField(1, 1000),
    limit: createPaginationField(10, 100),
    search: zod_1.z
        .string()
        .max(100, 'Search term must be less than 100 characters')
        .optional(),
    ownerId: zod_1.z.string().uuid('Owner ID must be a valid UUID').optional(),
});
exports.addProjectMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('User ID must be a valid UUID'),
    role: zod_1.z.nativeEnum(client_1.ProjectRole).default(client_1.ProjectRole.MEMBER),
});
exports.updateProjectMemberSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.ProjectRole),
});
exports.projectIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Project ID must be a valid UUID'),
});
exports.projectMemberIdSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('Project ID must be a valid UUID'),
    userId: zod_1.z.string().uuid('User ID must be a valid UUID'),
});
//# sourceMappingURL=project.js.map