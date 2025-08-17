"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizedTaskService = exports.OptimizedTaskService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const userSelect = {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    avatar: true,
};
const projectSelect = {
    id: true,
    name: true,
    description: true,
    color: true,
    ownerId: true,
    createdAt: true,
    updatedAt: true,
};
class OptimizedTaskService {
    async getUserAccessibleProjectIds(userId) {
        const projects = await prisma.project.findMany({
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
            select: { id: true },
        });
        return projects.map((p) => p.id);
    }
    async getTasks(options) {
        const { page = 1, limit = 10, search, projectId, assigneeId, status, priority, dueBefore, dueAfter, createdBefore, createdAfter, userId, includeComments = false, } = options;
        const skip = (page - 1) * limit;
        const accessibleProjectIds = projectId
            ? [projectId]
            : await this.getUserAccessibleProjectIds(userId);
        if (accessibleProjectIds.length === 0) {
            return {
                data: [],
                meta: { page, limit, total: 0, totalPages: 0 },
            };
        }
        const whereClause = {
            projectId: { in: accessibleProjectIds },
        };
        if (assigneeId) {
            whereClause.assigneeId = assigneeId;
        }
        if (status) {
            whereClause.status = status;
        }
        if (priority) {
            whereClause.priority = priority;
        }
        if (dueBefore || dueAfter) {
            whereClause.dueDate = {};
            if (dueBefore && dueBefore instanceof Date) {
                whereClause.dueDate.lte = dueBefore;
            }
            if (dueAfter && dueAfter instanceof Date) {
                whereClause.dueDate.gte = dueAfter;
            }
        }
        if (createdBefore || createdAfter) {
            whereClause.createdAt = {};
            if (createdBefore && createdBefore instanceof Date) {
                whereClause.createdAt.lte = createdBefore;
            }
            if (createdAfter && createdAfter instanceof Date) {
                whereClause.createdAt.gte = createdAfter;
            }
        }
        if (search) {
            whereClause.OR = [
                {
                    title: {
                        search: search.split(' ').join(' & '),
                    },
                },
                {
                    description: {
                        search: search.split(' ').join(' & '),
                    },
                },
            ];
        }
        const include = {
            assignee: {
                select: userSelect,
            },
            project: {
                select: {
                    ...projectSelect,
                    owner: {
                        select: userSelect,
                    },
                },
            },
            _count: {
                select: {
                    comments: true,
                },
            },
        };
        if (includeComments) {
            include.comments = {
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    author: {
                        select: userSelect,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
            };
        }
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where: whereClause,
                include,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
            }),
            prisma.task.count({ where: whereClause }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: tasks,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    async createTask(data, userId) {
        const projectCheck = await prisma.project.findFirst({
            where: {
                id: data.projectId,
                OR: [
                    { ownerId: userId },
                    {
                        members: {
                            some: {
                                userId: userId,
                                role: {
                                    in: [
                                        client_1.ProjectRole.OWNER,
                                        client_1.ProjectRole.ADMIN,
                                        client_1.ProjectRole.MEMBER,
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
            select: { id: true, ownerId: true },
        });
        if (!projectCheck) {
            throw new Error('Project not found or insufficient permissions');
        }
        if (data.assigneeId) {
            const assigneeCheck = await prisma.project.findFirst({
                where: {
                    id: data.projectId,
                    OR: [
                        { ownerId: data.assigneeId },
                        {
                            members: {
                                some: { userId: data.assigneeId },
                            },
                        },
                    ],
                },
                select: { id: true },
            });
            if (!assigneeCheck) {
                throw new Error('Assignee does not have access to this project');
            }
        }
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status || client_1.TaskStatus.TODO,
                priority: data.priority || client_1.TaskPriority.MEDIUM,
                assigneeId: data.assigneeId,
                projectId: data.projectId,
                dueDate: data.dueDate,
            },
            include: {
                assignee: {
                    select: userSelect,
                },
                project: {
                    select: {
                        ...projectSelect,
                        owner: {
                            select: userSelect,
                        },
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
        return task;
    }
    async getTaskById(taskId, userId, includeComments = true) {
        const include = {
            assignee: {
                select: userSelect,
            },
            project: {
                select: {
                    ...projectSelect,
                    owner: {
                        select: userSelect,
                    },
                },
            },
            _count: {
                select: {
                    comments: true,
                },
            },
        };
        if (includeComments) {
            include.comments = {
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    updatedAt: true,
                    author: {
                        select: userSelect,
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            };
        }
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
                    OR: [
                        { ownerId: userId },
                        {
                            members: {
                                some: { userId: userId },
                            },
                        },
                    ],
                },
            },
            include,
        });
        return task;
    }
    async batchUpdateTaskStatus(taskIds, status, userId) {
        const accessibleTasks = await prisma.task.findMany({
            where: {
                id: { in: taskIds },
                project: {
                    OR: [
                        { ownerId: userId },
                        {
                            members: {
                                some: {
                                    userId: userId,
                                    role: {
                                        in: [
                                            client_1.ProjectRole.OWNER,
                                            client_1.ProjectRole.ADMIN,
                                            client_1.ProjectRole.MEMBER,
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            select: { id: true },
        });
        const accessibleTaskIds = accessibleTasks.map((t) => t.id);
        if (accessibleTaskIds.length === 0) {
            return 0;
        }
        const result = await prisma.task.updateMany({
            where: {
                id: { in: accessibleTaskIds },
            },
            data: {
                status,
            },
        });
        return result.count;
    }
    async getTaskStatistics(projectIds, userId) {
        let whereClause = {};
        if (projectIds && projectIds.length > 0) {
            whereClause.projectId = { in: projectIds };
        }
        if (userId) {
            const accessibleProjectIds = await this.getUserAccessibleProjectIds(userId);
            whereClause.projectId = { in: accessibleProjectIds };
        }
        const [totalTasks, statusCounts, priorityCounts, overdueTasks] = await Promise.all([
            prisma.task.count({ where: whereClause }),
            prisma.task.groupBy({
                by: ['status'],
                where: whereClause,
                _count: { status: true },
            }),
            prisma.task.groupBy({
                by: ['priority'],
                where: whereClause,
                _count: { priority: true },
            }),
            prisma.task.count({
                where: {
                    ...whereClause,
                    dueDate: { lt: new Date() },
                    status: { not: client_1.TaskStatus.DONE },
                },
            }),
        ]);
        const tasksByStatus = Object.values(client_1.TaskStatus).reduce((acc, status) => {
            acc[status] =
                statusCounts.find((s) => s.status === status)?._count.status || 0;
            return acc;
        }, {});
        const tasksByPriority = Object.values(client_1.TaskPriority).reduce((acc, priority) => {
            acc[priority] =
                priorityCounts.find((p) => p.priority === priority)?._count
                    .priority || 0;
            return acc;
        }, {});
        return {
            totalTasks,
            tasksByStatus,
            tasksByPriority,
            overdueTasks,
        };
    }
}
exports.OptimizedTaskService = OptimizedTaskService;
exports.optimizedTaskService = new OptimizedTaskService();
//# sourceMappingURL=optimizedTaskService.js.map