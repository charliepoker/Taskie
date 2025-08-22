"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTaskSchema = exports.updateTaskStatusSchema = exports.taskIdSchema = exports.taskQuerySchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createPaginationField = (defaultValue, max = 100) => zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : defaultValue))
    .refine((val) => val > 0 && val <= max, `Must be between 1 and ${max}`)
    .refine((val) => Number.isInteger(val), 'Must be an integer');
const createFutureDateField = () => zod_1.z
    .union([
    zod_1.z.string().datetime('Due date must be a valid ISO datetime'),
    zod_1.z.date(),
])
    .transform((val) => {
    if (val instanceof Date)
        return val;
    return new Date(val);
})
    .refine((date) => date > new Date(), 'Due date must be in the future')
    .optional()
    .nullable();
const createDateField = () => zod_1.z
    .union([zod_1.z.string().datetime('Date must be a valid ISO datetime'), zod_1.z.date()])
    .transform((val) => {
    if (val instanceof Date)
        return val;
    return new Date(val);
})
    .optional()
    .nullable();
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must be less than 200 characters')
        .trim(),
    description: zod_1.z
        .string()
        .max(2000, 'Description must be less than 2000 characters')
        .trim()
        .optional()
        .nullable(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus).default(client_1.TaskStatus.TODO),
    priority: zod_1.z.nativeEnum(client_1.TaskPriority).default(client_1.TaskPriority.MEDIUM),
    assigneeId: zod_1.z
        .string()
        .uuid('Assignee ID must be a valid UUID')
        .optional()
        .nullable(),
    projectId: zod_1.z.string().uuid('Project ID must be a valid UUID'),
    dueDate: createFutureDateField(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must be less than 200 characters')
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .max(2000, 'Description must be less than 2000 characters')
        .trim()
        .optional()
        .nullable(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus).optional(),
    priority: zod_1.z.nativeEnum(client_1.TaskPriority).optional(),
    assigneeId: zod_1.z
        .string()
        .uuid('Assignee ID must be a valid UUID')
        .optional()
        .nullable(),
    dueDate: createDateField(),
});
exports.taskQuerySchema = zod_1.z.object({
    page: createPaginationField(1, 1000),
    limit: createPaginationField(10, 100),
    search: zod_1.z
        .string()
        .max(100, 'Search term must be less than 100 characters')
        .optional(),
    projectId: zod_1.z.string().uuid('Project ID must be a valid UUID').optional(),
    assigneeId: zod_1.z.string().uuid('Assignee ID must be a valid UUID').optional(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus).optional(),
    priority: zod_1.z.nativeEnum(client_1.TaskPriority).optional(),
    dueBefore: createDateField(),
    dueAfter: createDateField(),
    createdBefore: createDateField(),
    createdAfter: createDateField(),
});
exports.taskIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Task ID must be a valid UUID'),
});
exports.updateTaskStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TaskStatus),
});
exports.assignTaskSchema = zod_1.z.object({
    assigneeId: zod_1.z.string().uuid('Assignee ID must be a valid UUID').nullable(),
});
//# sourceMappingURL=task.js.map