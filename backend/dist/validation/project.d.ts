import { z } from 'zod';
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    color: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const projectQuerySchema: z.ZodObject<{
    page: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    limit: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<number, string | undefined>>;
    search: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const addProjectMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        OWNER: "OWNER";
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
        VIEWER: "VIEWER";
    }>>;
}, z.core.$strip>;
export declare const updateProjectMemberSchema: z.ZodObject<{
    role: z.ZodEnum<{
        OWNER: "OWNER";
        ADMIN: "ADMIN";
        MEMBER: "MEMBER";
        VIEWER: "VIEWER";
    }>;
}, z.core.$strip>;
export declare const projectIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const projectMemberIdSchema: z.ZodObject<{
    projectId: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type ProjectMemberIdInput = z.infer<typeof projectMemberIdSchema>;
//# sourceMappingURL=project.d.ts.map