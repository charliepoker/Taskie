import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        IN_REVIEW: "IN_REVIEW";
        DONE: "DONE";
    }>>;
    priority: z.ZodDefault<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    projectId: z.ZodString;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
}, z.core.$strip>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        IN_REVIEW: "IN_REVIEW";
        DONE: "DONE";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
}, z.core.$strip>;
export declare const taskQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        IN_REVIEW: "IN_REVIEW";
        DONE: "DONE";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    dueBefore: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
    dueAfter: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
    createdBefore: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
    createdAfter: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<Date, string | Date>>>>;
}, z.core.$strip>;
export declare const taskIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const updateTaskStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        IN_REVIEW: "IN_REVIEW";
        DONE: "DONE";
    }>;
}, z.core.$strip>;
export declare const assignTaskSchema: z.ZodObject<{
    assigneeId: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
//# sourceMappingURL=task.d.ts.map