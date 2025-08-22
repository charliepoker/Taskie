"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("../utils/redis");
const prisma = new client_1.PrismaClient();
class AnalyticsService {
    constructor() {
        this.CACHE_TTL = 300;
    }
    async getDashboardMetrics(userId, dateRange) {
        const cacheKey = `dashboard:${userId}:${JSON.stringify(dateRange)}`;
        const cached = await redis_1.redisService.getJSON(cacheKey);
        if (cached) {
            return cached;
        }
        const dateFilter = this.buildDateFilter(dateRange);
        const userProjects = await this.getUserAccessibleProjects(userId);
        const projectIds = userProjects.map((p) => p.id);
        if (projectIds.length === 0) {
            const emptyMetrics = {
                totalProjects: 0,
                totalTasks: 0,
                completedTasks: 0,
                overdueTasks: 0,
                activeUsers: 0,
                tasksByStatus: [],
                tasksByPriority: [],
                recentActivity: [],
            };
            await redis_1.redisService.setJSON(cacheKey, emptyMetrics, this.CACHE_TTL);
            return emptyMetrics;
        }
        const [totalProjects, totalTasks, completedTasks, overdueTasks, activeUsers, tasksByStatus, tasksByPriority, recentActivity,] = await Promise.all([
            this.getTotalProjects(projectIds, dateFilter),
            this.getTotalTasks(projectIds, dateFilter),
            this.getCompletedTasks(projectIds, dateFilter),
            this.getOverdueTasks(projectIds),
            this.getActiveUsers(projectIds, dateFilter),
            this.getTaskStatusDistribution(projectIds, dateFilter),
            this.getTasksByPriority(projectIds, dateFilter),
            this.getRecentActivity(projectIds, dateFilter),
        ]);
        const metrics = {
            totalProjects,
            totalTasks,
            completedTasks,
            overdueTasks,
            activeUsers,
            tasksByStatus,
            tasksByPriority,
            recentActivity,
        };
        await redis_1.redisService.setJSON(cacheKey, metrics, this.CACHE_TTL);
        return metrics;
    }
    async getTasksByStatus(userId, dateRange) {
        const cacheKey = `tasks-by-status:${userId}:${JSON.stringify(dateRange)}`;
        const cached = await redis_1.redisService.getJSON(cacheKey);
        if (cached) {
            return cached;
        }
        const userProjects = await this.getUserAccessibleProjects(userId);
        const projectIds = userProjects.map((p) => p.id);
        if (projectIds.length === 0) {
            const emptyResponse = {
                totalTasks: 0,
                distribution: [],
                trends: [],
            };
            await redis_1.redisService.setJSON(cacheKey, emptyResponse, this.CACHE_TTL);
            return emptyResponse;
        }
        const dateFilter = this.buildDateFilter(dateRange);
        const distribution = await this.getTaskStatusDistribution(projectIds, dateFilter);
        const totalTasks = distribution.reduce((sum, item) => sum + item.count, 0);
        const trends = await this.getTaskStatusTrends(projectIds, dateRange);
        const response = {
            totalTasks,
            distribution,
            trends,
        };
        await redis_1.redisService.setJSON(cacheKey, response, this.CACHE_TTL);
        return response;
    }
    async getUserProductivity(userId, dateRange) {
        const cacheKey = `user-productivity:${userId}:${JSON.stringify(dateRange)}`;
        const cached = await redis_1.redisService.getJSON(cacheKey);
        if (cached) {
            return cached;
        }
        const userProjects = await this.getUserAccessibleProjects(userId);
        const projectIds = userProjects.map((p) => p.id);
        if (projectIds.length === 0) {
            const emptyResponse = {
                users: [],
                summary: {
                    totalUsers: 0,
                    averageCompletionRate: 0,
                    mostProductiveUser: '',
                    leastProductiveUser: '',
                },
            };
            await redis_1.redisService.setJSON(cacheKey, emptyResponse, this.CACHE_TTL);
            return emptyResponse;
        }
        const dateFilter = this.buildDateFilter(dateRange);
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
        const userMetrics = await Promise.all(projectUsers.map((user) => this.calculateUserMetrics(user, projectIds, dateFilter)));
        const totalUsers = userMetrics.length;
        const averageCompletionRate = totalUsers > 0
            ? userMetrics.reduce((sum, user) => sum + user.completionRate, 0) /
                totalUsers
            : 0;
        const sortedByCompletion = [...userMetrics].sort((a, b) => b.completionRate - a.completionRate);
        const mostProductiveUser = sortedByCompletion[0]?.userName || '';
        const leastProductiveUser = sortedByCompletion[sortedByCompletion.length - 1]?.userName || '';
        const response = {
            users: userMetrics,
            summary: {
                totalUsers,
                averageCompletionRate,
                mostProductiveUser,
                leastProductiveUser,
            },
        };
        await redis_1.redisService.setJSON(cacheKey, response, this.CACHE_TTL);
        return response;
    }
    async clearUserCache(userId) {
        await redis_1.redisService.deletePattern(`dashboard:${userId}:*`);
        await redis_1.redisService.deletePattern(`tasks-by-status:${userId}:*`);
        await redis_1.redisService.deletePattern(`user-productivity:${userId}:*`);
    }
    buildDateFilter(dateRange) {
        if (!dateRange)
            return {};
        const filter = {};
        if (dateRange.startDate) {
            filter.gte = dateRange.startDate;
        }
        if (dateRange.endDate) {
            filter.lte = dateRange.endDate;
        }
        return Object.keys(filter).length > 0 ? filter : {};
    }
    async getUserAccessibleProjects(userId) {
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
    async getTotalProjects(projectIds, dateFilter) {
        return await prisma.project.count({
            where: {
                id: { in: projectIds },
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            },
        });
    }
    async getTotalTasks(projectIds, dateFilter) {
        return await prisma.task.count({
            where: {
                projectId: { in: projectIds },
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            },
        });
    }
    async getCompletedTasks(projectIds, dateFilter) {
        return await prisma.task.count({
            where: {
                projectId: { in: projectIds },
                status: client_1.TaskStatus.DONE,
                ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
            },
        });
    }
    async getOverdueTasks(projectIds) {
        const now = new Date();
        return await prisma.task.count({
            where: {
                projectId: { in: projectIds },
                status: { not: client_1.TaskStatus.DONE },
                dueDate: { lt: now },
            },
        });
    }
    async getActiveUsers(projectIds, dateFilter) {
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
    async getTaskStatusDistribution(projectIds, dateFilter) {
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
        const totalTasks = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
        return statusCounts.map((item) => ({
            status: item.status,
            count: item._count.id,
            percentage: totalTasks > 0 ? (item._count.id / totalTasks) * 100 : 0,
        }));
    }
    async getTasksByPriority(projectIds, dateFilter) {
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
        const totalTasks = priorityCounts.reduce((sum, item) => sum + item._count.id, 0);
        return priorityCounts.map((item) => ({
            priority: item.priority,
            count: item._count.id,
            percentage: totalTasks > 0 ? (item._count.id / totalTasks) * 100 : 0,
        }));
    }
    async getRecentActivity(projectIds, dateFilter) {
        const activities = [];
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
        return activities
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20);
    }
    async getTaskStatusTrends(projectIds, dateRange) {
        const endDate = dateRange?.endDate || new Date();
        const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
        const trendsMap = new Map();
        tasks.forEach((task) => {
            const dateKey = task.createdAt.toISOString().split('T')[0];
            if (!trendsMap.has(dateKey)) {
                trendsMap.set(dateKey, new Map());
            }
            const statusMap = trendsMap.get(dateKey);
            statusMap.set(task.status, (statusMap.get(task.status) || 0) + 1);
        });
        const trends = [];
        trendsMap.forEach((statusMap, date) => {
            statusMap.forEach((count, status) => {
                trends.push({ date, status, count });
            });
        });
        return trends.sort((a, b) => a.date.localeCompare(b.date));
    }
    async calculateUserMetrics(user, projectIds, dateFilter) {
        const [tasksCreated, tasksCompleted, tasksInProgress, projectsInvolved, commentsCount, completedTasksWithDates, lastActivity,] = await Promise.all([
            prisma.task.count({
                where: {
                    assigneeId: user.id,
                    projectId: { in: projectIds },
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                },
            }),
            prisma.task.count({
                where: {
                    assigneeId: user.id,
                    projectId: { in: projectIds },
                    status: client_1.TaskStatus.DONE,
                    ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
                },
            }),
            prisma.task.count({
                where: {
                    assigneeId: user.id,
                    projectId: { in: projectIds },
                    status: client_1.TaskStatus.IN_PROGRESS,
                },
            }),
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
            prisma.comment.count({
                where: {
                    authorId: user.id,
                    task: {
                        projectId: { in: projectIds },
                    },
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                },
            }),
            prisma.task.findMany({
                where: {
                    assigneeId: user.id,
                    projectId: { in: projectIds },
                    status: client_1.TaskStatus.DONE,
                    ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter }),
                },
                select: {
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.$queryRaw `
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
        let averageCompletionTime = 0;
        if (completedTasksWithDates.length > 0) {
            const totalCompletionTime = completedTasksWithDates.reduce((sum, task) => {
                const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
                return sum + completionTime;
            }, 0);
            averageCompletionTime =
                totalCompletionTime / completedTasksWithDates.length / (1000 * 60 * 60);
        }
        const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
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
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analyticsService.js.map