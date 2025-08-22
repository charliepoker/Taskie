import { z } from 'zod';
export declare const getUsersQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | undefined, string | undefined>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        email: "email";
        firstName: "firstName";
        lastName: "lastName";
        createdAt: "createdAt";
    }>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParamInput = z.infer<typeof userIdParamSchema>;
//# sourceMappingURL=user.d.ts.map