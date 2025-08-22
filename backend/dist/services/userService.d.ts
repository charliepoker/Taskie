import { User } from '@prisma/client';
import { PaginatedResponse } from '../types';
export interface GetUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
    sortOrder?: 'asc' | 'desc';
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
}
export declare class UserService {
    getUsers(options: GetUsersOptions): Promise<PaginatedResponse<Omit<User, 'password'>>>;
    getUserById(userId: string): Promise<Omit<User, 'password'> | null>;
    updateUser(userId: string, updateData: UpdateUserData): Promise<Omit<User, 'password'>>;
    deleteUser(userId: string): Promise<void>;
    getUserStats(userId: string): Promise<{
        projectsCount: number;
        tasksCount: number;
        commentsCount: number;
    } | null>;
}
//# sourceMappingURL=userService.d.ts.map