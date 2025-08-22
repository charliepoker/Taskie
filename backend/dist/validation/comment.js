"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCommentParamsSchema = exports.commentIdSchema = exports.commentQuerySchema = exports.updateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const createPaginationField = (defaultValue, max = 100) => zod_1.z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : defaultValue))
    .refine((val) => val > 0 && val <= max, `Must be between 1 and ${max}`)
    .refine((val) => Number.isInteger(val), 'Must be an integer');
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .min(1, 'Comment content is required')
        .max(1000, 'Comment content must be less than 1000 characters')
        .trim(),
    taskId: zod_1.z.string().uuid('Task ID must be a valid UUID'),
});
exports.updateCommentSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .min(1, 'Comment content is required')
        .max(1000, 'Comment content must be less than 1000 characters')
        .trim(),
});
exports.commentQuerySchema = zod_1.z.object({
    page: createPaginationField(1, 1000),
    limit: createPaginationField(20, 50),
    taskId: zod_1.z.string().uuid('Task ID must be a valid UUID'),
});
exports.commentIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Comment ID must be a valid UUID'),
});
exports.taskCommentParamsSchema = zod_1.z.object({
    taskId: zod_1.z.string().uuid('Task ID must be a valid UUID'),
    commentId: zod_1.z.string().uuid('Comment ID must be a valid UUID'),
});
//# sourceMappingURL=comment.js.map