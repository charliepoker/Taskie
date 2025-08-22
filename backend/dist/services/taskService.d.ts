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
}
export interface CreateTaskData {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    projectId: string;
    dueDate?: Date | null;
}
export interface UpdateTaskData {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string | null;
    dueDate?: Date | null;
}
export interface TaskWithDetails extends Task {
    assignee: Omit<User, 'password'> | null;
    project: Project & {
        owner: Omit<User, 'password'>;
    };
    comments: (Comment & {
        author: Omit<User, 'password'>;
    })[];
    _count: {
        comments: number;
    };
}
export interface CreateCommentData {
    content: string;
    taskId: string;
    authorId: string;
}
export declare class TaskService {
    getTasks(options: GetTasksOptions): Promise<PaginatedResponse<TaskWithDetails>>;
    createTask(data: CreateTaskData, userId: string): Promise<TaskWithDetails>;
    getTaskById(taskId: string, userId: string): Promise<TaskWithDetails | null>;
    updateTask(taskId: string, data: UpdateTaskData, userId: string): Promise<TaskWithDetails>;
    deleteTask(taskId: string, userId: string): Promise<void>;
    addComment(data: CreateCommentData): Promise<Comment & {
        author: Omit<User, 'password'>;
    }>;
    getTaskComments(taskId: string, userId: string, page?: number, limit?: number): Promise<PaginatedResponse<Comment & {
        author: Omit<User, 'password'>;
    }>>;
}
//# sourceMappingURL=taskService.d.ts.map