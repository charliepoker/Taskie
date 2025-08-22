import { z } from 'zod';
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    avatar: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const projectResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    color: z.ZodString;
    ownerId: z.ZodString;
    owner: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        avatar: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    members: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        projectId: z.ZodString;
        role: z.ZodEnum<{
            OWNER: "OWNER";
            ADMIN: "ADMIN";
            MEMBER: "MEMBER";
            VIEWER: "VIEWER";
        }>;
        joinedAt: z.ZodString;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            username: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            avatar: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    taskCounts: z.ZodObject<{
        total: z.ZodNumber;
        todo: z.ZodNumber;
        inProgress: z.ZodNumber;
        inReview: z.ZodNumber;
        done: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const taskResponseSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        IN_REVIEW: "IN_REVIEW";
        DONE: "DONE";
    }>;
    priority: z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>;
    assigneeId: z.ZodNullable<z.ZodString>;
    projectId: z.ZodString;
    dueDate: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    assignee: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        avatar: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>>;
    project: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        color: z.ZodString;
    }, z.core.$strip>;
    comments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        authorId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        author: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            username: z.ZodString;
            firstName: z.ZodString;
            lastName: z.ZodString;
            avatar: z.ZodNullable<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const commentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    taskId: z.ZodString;
    authorId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    author: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        avatar: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    task: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const authResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        avatar: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        refreshToken: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const paginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T>;
    meta: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        limit: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const apiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const errorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        timestamp: z.ZodString;
        path: z.ZodString;
        fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            message: z.ZodString;
            value: z.ZodOptional<z.ZodAny>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type PaginatedResponse<T> = z.infer<ReturnType<typeof paginatedResponseSchema<z.ZodType<T>>>>;
export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodType<T>>>>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
//# sourceMappingURL=responses.d.ts.map