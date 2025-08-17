"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = exports.apiResponseSchema = exports.paginatedResponseSchema = exports.authResponseSchema = exports.commentResponseSchema = exports.taskResponseSchema = exports.projectResponseSchema = exports.userResponseSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.userResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    avatar: zod_1.z.string().url().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.projectResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    color: zod_1.z.string(),
    ownerId: zod_1.z.string().uuid(),
    owner: exports.userResponseSchema,
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    members: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        userId: zod_1.z.string().uuid(),
        projectId: zod_1.z.string().uuid(),
        role: zod_1.z.nativeEnum(client_1.ProjectRole),
        joinedAt: zod_1.z.string().datetime(),
        user: exports.userResponseSchema,
    })),
    taskCounts: zod_1.z.object({
        total: zod_1.z.number(),
        todo: zod_1.z.number(),
        inProgress: zod_1.z.number(),
        inReview: zod_1.z.number(),
        done: zod_1.z.number(),
    }),
});
exports.taskResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: zod_1.z.nativeEnum(client_1.TaskStatus),
    priority: zod_1.z.nativeEnum(client_1.TaskPriority),
    assigneeId: zod_1.z.string().uuid().nullable(),
    projectId: zod_1.z.string().uuid(),
    dueDate: zod_1.z.string().datetime().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    assignee: exports.userResponseSchema.nullable(),
    project: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        color: zod_1.z.string(),
    }),
    comments: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        content: zod_1.z.string(),
        authorId: zod_1.z.string().uuid(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
        author: exports.userResponseSchema,
    })),
});
exports.commentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    taskId: zod_1.z.string().uuid(),
    authorId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    author: exports.userResponseSchema,
    task: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        title: zod_1.z.string(),
    }),
});
exports.authResponseSchema = zod_1.z.object({
    user: exports.userResponseSchema,
    tokens: zod_1.z.object({
        accessToken: zod_1.z.string(),
        refreshToken: zod_1.z.string(),
    }),
});
const paginatedResponseSchema = (itemSchema) => zod_1.z.object({
    data: zod_1.z.array(itemSchema),
    meta: zod_1.z.object({
        total: zod_1.z.number(),
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
exports.paginatedResponseSchema = paginatedResponseSchema;
const apiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
exports.apiResponseSchema = apiResponseSchema;
exports.errorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        timestamp: zod_1.z.string().datetime(),
        path: zod_1.z.string(),
        fields: zod_1.z
            .array(zod_1.z.object({
            field: zod_1.z.string(),
            message: zod_1.z.string(),
            value: zod_1.z.any().optional(),
        }))
            .optional(),
    }),
});
//# sourceMappingURL=responses.js.map