import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
} from '@prisma/client';
import { redisService } from '../utils/redis';

const prisma = new PrismaClient();

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
  averageCompletionTime: number; // in hours
  completionRate: number; // percentage
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

export class AnalyticsService {
  private readonly CACHE_TTL = 300; // 5 minutes cache

  /**
   * Get dashboard metrics with caching
   */
  async getDashboardMetrics(
    userId: string,
    dateRange?: DateRangeFilter
  ): Promise<DashboardMetrics> {
    const cacheKey = `dashboard:${userId}:${JSON.stringify(dateRange)}`;

    // Try to get from cache first
    const cached = await redisService.getJSON<DashboardMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build date filter
    const dateFilter = this.buildDateFilter(dateRange);

    // Get user's accessible projects
    const userProjects = await this.getUserAccessibleProjects(userId);
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      const emptyMetrics: DashboardMetrics = {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        activeUsers: 0,
        tasksByStatus: [],
        tasksByPriority: [],
        recentActivity: [],
      };
      await redisService.setJSON(cacheKey, emptyMetrics, this.CACHE_TTL);
      return emptyMetrics;
    }

    // Execute all queries in parallel
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      activeUsers,
      tasksByStatus,
      tasksByPriority,
      recentActivity,
    ] = await Promise.all([
      this.getTotalProjects(projectIds, dateFilter),
      this.getTotalTasks(projectIds, dateFilter),
      this.getCompletedTasks(projectIds, dateFilter),
      this.getOverdueTasks(projectIds),
      this.getActiveUsers(projectIds, dateFilter),
      this.getTaskStatusDistribution(projectIds, dateFilter),
      this.getTasksByPriority(projectIds, dateFilter),
      this.getRecentActivity(projectIds, dateFilter),
    ]);

    const metrics: DashboardMetrics = {
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      activeUsers,
      tasksByStatus,
      tasksByPriority,
      recentActivity,
    };

    // Cache the result
    await redisService.setJSON(cacheKey, metrics, this.CACHE_TTL);

    return metrics;
  }

  /**
   * Get tasks by status with statistics and trends
   */
  async getTasksByStatus(
    userId: string,
    dateRange?: DateRangeFilter
  ): Promise<TasksByStatusResponse> {
    const cacheKey = `tasks-by-status:${userId}:${JSON.stringify(dateRange)}`;

    // Try to get from cache first
    const cached = await redisService.getJSON<TasksByStatusResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's accessible projects
    const userProjects = await this.getUserAccessibleProjects(userId);
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      const emptyResponse: TasksByStatusResponse = {
        totalTasks: 0,
        distribution: [],
        trends: [],
      };
      await redisService.setJSON(cacheKey, emptyResponse, this.CACHE_TTL);
      return emptyResponse;
    }

    const dateFilter = this.buildDateFilter(dateRange);

    // Get current distribution
    const distribution = await this.getTaskStatusDistribution(
      projectIds,
      dateFilter
    );
    const totalTasks = distribution.reduce((sum, item) => sum + item.count, 0);

    // Get trends (last 30 days)
    const trends = await this.getTaskStatusTrends(projectIds, dateRange);

    const response: TasksByStatusResponse = {
      totalTasks,
      distribution,
      trends,
    };

    // Cache the result
    await redisService.setJSON(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Get user productivity metrics
   */
  async getUserProductivity(
    userId: string,
    dateRange?: DateRangeFilter
  ): Promise<UserProductivityResponse> {
    const cacheKey = `user-productivity:${userId}:${JSON.stringify(dateRange)}`;

    // Try to get from cache first
    const cached =
      await redisService.getJSON<UserProductivityResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's accessible projects
    const userProjects = await this.getUserAccessibleProjects(userId);
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      const emptyResponse: UserProductivityResponse = {
        users: [],
        summary: {
          totalUsers: 0,
          averageCompletionRate: 0,
          mostProductiveUser: '',
          leastProductiveUser: '',
        },
      };
      await redisService.setJSON(cacheKey, emptyResponse, this.CACHE_TTL);
      return emptyResponse;
    }

    const dateFilter = this.buildDateFilter(dateRange);

    // Get all users involved in these projects
    const projectUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            ownedProjects: {
              some: {
                id: { in: projectIds },
              },
            },
          },
          {
            projects: {
              some: {
                projectId: { in: projectIds },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    // Calculate metrics for each user
    const userMetrics = await Promise.all(
      projectUsers.map((user) =>
        this.calculateUserMetrics(user, projectIds, dateFilter)
      )
    );

    // Calculate summary statistics
    const totalUsers = userMetrics.length;
    const averageCompletionRate =
      totalUsers > 0
        ? userMetrics.reduce((sum, user) => sum + user.completionRate, 0) /
          totalUsers
        : 0;

    const sortedByCompletion = [...userMetrics].sort(
      (a, b) => b.completionRate - a.completionRate
    );
    const mostProductiveUser = sortedByCompletion[0]?.userName || '';
    const leastProductiveUser =
      sortedByCompletion[sortedByCompletion.length - 1]?.userName || '';

    const response: UserProductivityResponse = {
      users: userMetrics,
      summary: {
        totalUsers,
        averageCompletionRate,
        mostProductiveUser,
        leastProductiveUser,
      },
    };

    // Cache the result
    await redisService.setJSON(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Clear analytics cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    await redisService.deletePattern(`dashboard:${userId}:*`);
    await redisService.deletePattern(`tasks-by-status:${userId}:*`);
    await redisService.deletePattern(`user-productivity:${userId}:*`);
  }

  // Private helper methods

  private buildDateFilter(dateRange?: DateRangeFilter) {
    if (!dateRange) return {};

    const filter: any = {};
    if (dateRange.startDate) {
      filter.gte = dateRange.startDate;
    }
    if (dateRange.endDate) {
      filter.lte = dateRange.endDate;
    }
    return Object.keys(filter).length > 0 ? filter : {};
  }

  private async getUserAccessibleProjects(userId: string) {
    return await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private async getTotalProjects(
    projectIds: string[],
    dateFilter: any
  ): Promise<number> {
    return await prisma.project.count({
      where: {
        id: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    });
  }

  private async getTotalTasks(
    projectIds: string[],
    dateFilter: any
  ): Promise<number> {
    return await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    });
  }

  private async getCompletedTasks(
    projectIds: string[],
    dateFilter: any
  ): Promise<number> {
    return await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: TaskStatus.DONE,
        ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
      },
    });
  }

  private async getOverdueTasks(projectIds: string[]): Promise<number> {
    const now = new Date();
    return await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now },
      },
    });
  }

  private async getActiveUsers(
    projectIds: string[],
    dateFilter: any
  ): Promise<number> {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            assignedTasks: {
              some: {
                projectId: { in: projectIds },
                ...(Object.keys(dateFilter).length > 0 && {
                  updatedAt: dateFilter,
                }),
              },
            },
          },
          {
            comments: {
              some: {
                task: {
                  projectId: { in: projectIds },
                },
                ...(Object.keys(dateFilter).length > 0 && {
                  createdAt: dateFilter,
                }),
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return users.length;
  }

  private async getTaskStatusDistribution(
    projectIds: string[],
    dateFilter: any
  ): Promise<TaskStatusDistribution[]> {
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _count: {
        id: true,
      },
    });

    const totalTasks = statusCounts.reduce(
      (sum, item) => sum + item._count.id,
      0
    );

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
      percentage: totalTasks > 0 ? (item._count.id / totalTasks) * 100 : 0,
    }));
  }

  private async getTasksByPriority(
    projectIds: string[],
    dateFilter: any
  ): Promise<TaskPriorityDistribution[]> {
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        projectId: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _count: {
        id: true,
      },
    });

    const totalTasks = priorityCounts.reduce(
      (sum, item) => sum + item._count.id,
      0
    );

    return priorityCounts.map((item) => ({
      priority: item.priority,
      count: item._count.id,
      percentage: totalTasks > 0 ? (item._count.id / totalTasks) * 100 : 0,
    }));
  }

  private async getRecentActivity(
    projectIds: string[],
    dateFilter: any
  ): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Add task activities
    recentTasks.forEach((task) => {
      activities.push({
        id: task.id,
        type: 'task_created',
        title: task.title,
        description: `Task created in ${task.project.name}`,
        userId: task.assignee?.id || '',
        userName: task.assignee
          ? `${task.assignee.firstName} ${task.assignee.lastName}`
          : 'Unassigned',
        projectId: task.project.id,
        projectName: task.project.name,
        createdAt: task.createdAt,
      });
    });

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Add project activities
    recentProjects.forEach((project) => {
      activities.push({
        id: project.id,
        type: 'project_created',
        title: project.name,
        description: `Project created by ${project.owner.firstName} ${project.owner.lastName}`,
        userId: project.owner.id,
        userName: `${project.owner.firstName} ${project.owner.lastName}`,
        projectId: project.id,
        projectName: project.name,
        createdAt: project.createdAt,
      });
    });

    // Sort by date and return top 20
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  }

  private async getTaskStatusTrends(
    projectIds: string[],
    dateRange?: DateRangeFilter
  ): Promise<TaskStatusTrend[]> {
    // Get data for the last 30 days or specified range
    const endDate = dateRange?.endDate || new Date();
    const startDate =
      dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Group by date and status
    const trendsMap = new Map<string, Map<TaskStatus, number>>();

    tasks.forEach((task) => {
      const dateKey = task.createdAt.toISOString().split('T')[0];
      if (!trendsMap.has(dateKey)) {
        trendsMap.set(dateKey, new Map());
      }
      const statusMap = trendsMap.get(dateKey)!;
      statusMap.set(task.status, (statusMap.get(task.status) || 0) + 1);
    });

    // Convert to array format
    const trends: TaskStatusTrend[] = [];
    trendsMap.forEach((statusMap, date) => {
      statusMap.forEach((count, status) => {
        trends.push({ date, status, count });
      });
    });

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateUserMetrics(
    user: any,
    projectIds: string[],
    dateFilter: any
  ): Promise<UserProductivityMetrics> {
    const [
      tasksCreated,
      tasksCompleted,
      tasksInProgress,
      projectsInvolved,
      commentsCount,
      completedTasksWithDates,
      lastActivity,
    ] = await Promise.all([
      // Tasks created (assigned to user)
      prisma.task.count({
        where: {
          assigneeId: user.id,
          projectId: { in: projectIds },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
      }),
      // Tasks completed
      prisma.task.count({
        where: {
          assigneeId: user.id,
          projectId: { in: projectIds },
          status: TaskStatus.DONE,
          ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
        },
      }),
      // Tasks in progress
      prisma.task.count({
        where: {
          assigneeId: user.id,
          projectId: { in: projectIds },
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      // Projects involved
      prisma.project.count({
        where: {
          id: { in: projectIds },
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: { userId: user.id },
              },
            },
          ],
        },
      }),
      // Comments count
      prisma.comment.count({
        where: {
          authorId: user.id,
          task: {
            projectId: { in: projectIds },
          },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
      }),
      // Completed tasks with creation and completion dates for average calculation
      prisma.task.findMany({
        where: {
          assigneeId: user.id,
          projectId: { in: projectIds },
          status: TaskStatus.DONE,
          ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Last activity (most recent task update or comment)
      prisma.$queryRaw<{ lastActivity: Date }[]>`
        SELECT MAX(activity_date) as "lastActivity"
        FROM (
          SELECT MAX(t."updatedAt") as activity_date
          FROM tasks t
          WHERE t."assigneeId" = ${user.id} AND t."projectId" = ANY(${projectIds})
          UNION ALL
          SELECT MAX(c."createdAt") as activity_date
          FROM comments c
          JOIN tasks t ON c."taskId" = t.id
          WHERE c."authorId" = ${user.id} AND t."projectId" = ANY(${projectIds})
        ) activities
      `,
    ]);

    // Calculate average completion time
    let averageCompletionTime = 0;
    if (completedTasksWithDates.length > 0) {
      const totalCompletionTime = completedTasksWithDates.reduce(
        (sum, task) => {
          const completionTime =
            task.updatedAt.getTime() - task.createdAt.getTime();
          return sum + completionTime;
        },
        0
      );
      averageCompletionTime =
        totalCompletionTime / completedTasksWithDates.length / (1000 * 60 * 60); // Convert to hours
    }

    // Calculate completion rate
    const completionRate =
      tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;

    return {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      tasksCreated,
      tasksCompleted,
      tasksInProgress,
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      projectsInvolved,
      commentsCount,
      lastActivity: lastActivity[0]?.lastActivity || null,
    };
  }
}
