import { z } from 'zod';
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    taskId: z.ZodString;
}, z.core.$strip>;
export declare const updateCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
export declare const commentQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    taskId: z.ZodString;
}, z.core.$strip>;
export declare const commentIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const taskCommentParamsSchema: z.ZodObject<{
    taskId: z.ZodString;
    commentId: z.ZodString;
}, z.core.$strip>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type CommentIdInput = z.infer<typeof commentIdSchema>;
export type TaskCommentParamsInput = z.infer<typeof taskCommentParamsSchema>;
//# sourceMappingURL=comment.d.ts.map