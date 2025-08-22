import { TaskStatus, TaskPriority } from '@prisma/client';
export interface DateRangeFilter {
    startDate?: Date;
    endDate?: Date;
}
export interface DashboardMetrics {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeUsers: number;
    tasksByStatus: TaskStatusDistribution[];
    tasksByPriority: TaskPriorityDistribution[];
    recentActivity: RecentActivity[];
}
export interface TaskStatusDistribution {
    status: TaskStatus;
    count: number;
    percentage: number;
}
export interface TaskPriorityDistribution {
    priority: TaskPriority;
    count: number;
    percentage: number;
}
export interface RecentActivity {
    id: string;
    type: 'task_created' | 'task_updated' | 'task_completed' | 'project_created';
    title: string;
    description: string;
    userId: string;
    userName: string;
    projectId?: string;
    projectName?: string;
    createdAt: Date;
}
export interface TasksByStatusResponse {
    totalTasks: number;
    distribution: TaskStatusDistribution[];
    trends: TaskStatusTrend[];
}
export interface TaskStatusTrend {
    date: string;
    status: TaskStatus;
    count: number;
}
export interface UserProductivityMetrics {
    userId: string;
    userName: string;
    email: string;
    tasksCreated: number;
    tasksCompleted: number;
    tasksInProgress: number;
    averageCompletionTime: number;
    completionRate: number;
    projectsInvolved: number;
    commentsCount: number;
    lastActivity: Date | null;
}
export interface UserProductivityResponse {
    users: UserProductivityMetrics[];
    summary: {
        totalUsers: number;
        averageCompletionRate: number;
        mostProductiveUser: string;
        leastProductiveUser: string;
    };
}
export declare class AnalyticsService {
    private readonly CACHE_TTL;
    getDashboardMetrics(userId: string, dateRange?: DateRangeFilter): Promise<DashboardMetrics>;
    getTasksByStatus(userId: string, dateRange?: DateRangeFilter): Promise<TasksByStatusResponse>;
    getUserProductivity(userId: string, dateRange?: DateRangeFilter): Promise<UserProductivityResponse>;
    clearUserCache(userId: string): Promise<void>;
    private buildDateFilter;
    private getUserAccessibleProjects;
    private getTotalProjects;
    private getTotalTasks;
    private getCompletedTasks;
    private getOverdueTasks;
    private getActiveUsers;
    private getTaskStatusDistribution;
    private getTasksByPriority;
    private getRecentActivity;
    private getTaskStatusTrends;
    private calculateUserMetrics;
}
//# sourceMappingURL=analyticsService.d.ts.map