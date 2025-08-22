import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
    };
}
export declare const testDb: PrismaClient<{
    datasources: {
        db: {
            url: string | undefined;
        };
    };
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const generateMockUserData: () => {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
};
export declare const mockUserData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
};
export declare const mockProjectData: {
    name: string;
    description: string;
    color: string;
};
export declare const mockTaskData: {
    title: string;
    description: string;
    status: "TODO";
    priority: "MEDIUM";
};
export declare const cleanupDatabase: () => Promise<void>;
export declare const createTestUser: (userData?: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
}) => Promise<{
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const createTestProject: (ownerId: string, projectData?: {
    name: string;
    description: string;
    color: string;
}) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    color: string;
    ownerId: string;
}>;
export declare const createTestTask: (projectId: string, assigneeId?: string, taskData?: {
    title: string;
    description: string;
    status: "TODO";
    priority: "MEDIUM";
}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    projectId: string;
    title: string;
    status: import(".prisma/client").$Enums.TaskStatus;
    priority: import(".prisma/client").$Enums.TaskPriority;
    assigneeId: string | null;
    dueDate: Date | null;
}>;
export declare const generateTestToken: (userId: string) => string;
export declare const createMockRequest: (overrides?: Partial<AuthenticatedRequest>) => Partial<AuthenticatedRequest>;
export declare const createMockResponse: () => Partial<Response>;
export declare const setupTestDatabase: () => Promise<void>;
export declare const teardownTestDatabase: () => Promise<void>;
export declare const createAuthenticatedRequest: (overrides?: Partial<AuthenticatedRequest>) => Promise<Partial<AuthenticatedRequest>>;
export {};
//# sourceMappingURL=test-helpers.d.ts.map