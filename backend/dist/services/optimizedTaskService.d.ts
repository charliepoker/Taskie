import { Task, TaskStatus, TaskPriority, User, Project, Comment } from '@prisma/client';
import { PaginatedResponse } from '../types';
export interface GetTasksOptions {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueBefore?: Date | null;
    dueAfter?: Date | null;
    createdBefore?: Date | null;
    createdAfter?: Date | null;
    userId: string;
    includeComments?: boolean;
}
export interface TaskWithDetails extends Task {
    assignee: Omit<User, 'password'> | null;
    project: Project & {
        owner: Omit<User, 'password'>;
    };
    comments?: (Comment & {
        author: Omit<User, 'password'>;
    })[];
    _count: {
        comments: number;
    };
}
export declare class OptimizedTaskService {
    private getUserAccessibleProjectIds;
    getTasks(options: GetTasksOptions): Promise<PaginatedResponse<TaskWithDetails>>;
    createTask(data: {
        title: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string | null;
        projectId: string;
        dueDate?: Date | null;
    }, userId: string): Promise<TaskWithDetails>;
    getTaskById(taskId: string, userId: string, includeComments?: boolean): Promise<TaskWithDetails | null>;
    batchUpdateTaskStatus(taskIds: string[], status: TaskStatus, userId: string): Promise<number>;
    getTaskStatistics(projectIds?: string[], userId?: string): Promise<{
        totalTasks: number;
        tasksByStatus: Record<TaskStatus, number>;
        tasksByPriority: Record<TaskPriority, number>;
        overdueTasks: number;
    }>;
}
export declare const optimizedTaskService: OptimizedTaskService;
//# sourceMappingURL=optimizedTaskService.d.ts.map