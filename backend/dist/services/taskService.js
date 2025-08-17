"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const client_1 = require("@prisma/client");
const userSelect = {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    avatar: true,
    createdAt: true,
    updatedAt: true,
};
const prisma = new client_1.PrismaClient();
class TaskService {
    async getTasks(options) {
        const { page = 1, limit = 10, search, projectId, assigneeId, status, priority, dueBefore, dueAfter, createdBefore, createdAfter, userId, } = options;
        const skip = (page - 1) * limit;
        const whereClause = {
            project: {
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
        };
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (projectId) {
            whereClause.projectId = projectId;
        }
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
        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where: whereClause,
                include: {
                    assignee: {
                        select: userSelect,
                    },
                    project: {
                        include: {
                            owner: {
                                select: userSelect,
                            },
                        },
                    },
                    comments: {
                        include: {
                            author: {
                                select: userSelect,
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 5,
                    },
                    _count: {
                        select: {
                            comments: true,
                        },
                    },
                },
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
        const project = await prisma.project.findFirst({
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
        });
        if (!project) {
            throw new Error('Project not found or insufficient permissions');
        }
        if (data.assigneeId) {
            const assigneeHasAccess = await prisma.project.findFirst({
                where: {
                    id: data.projectId,
                    OR: [
                        { ownerId: data.assigneeId },
                        {
                            members: {
                                some: {
                                    userId: data.assigneeId,
                                },
                            },
                        },
                    ],
                },
            });
            if (!assigneeHasAccess) {
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
                    include: {
                        owner: {
                            select: userSelect,
                        },
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: userSelect,
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
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
    async getTaskById(taskId, userId) {
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                project: {
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
            },
            include: {
                assignee: {
                    select: userSelect,
                },
                project: {
                    include: {
                        owner: {
                            select: userSelect,
                        },
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: userSelect,
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
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
    async updateTask(taskId, data, userId) {
        const existingTask = await this.getTaskById(taskId, userId);
        if (!existingTask) {
            throw new Error('Task not found or insufficient permissions');
        }
        if (data.assigneeId !== undefined && data.assigneeId !== null) {
            const assigneeHasAccess = await prisma.project.findFirst({
                where: {
                    id: existingTask.projectId,
                    OR: [
                        { ownerId: data.assigneeId },
                        {
                            members: {
                                some: {
                                    userId: data.assigneeId,
                                },
                            },
                        },
                    ],
                },
            });
            if (!assigneeHasAccess) {
                throw new Error('Assignee does not have access to this project');
            }
        }
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.priority !== undefined && { priority: data.priority }),
                ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
                ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
            },
            include: {
                assignee: {
                    select: userSelect,
                },
                project: {
                    include: {
                        owner: {
                            select: userSelect,
                        },
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: userSelect,
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
        return updatedTask;
    }
    async deleteTask(taskId, userId) {
        const existingTask = await this.getTaskById(taskId, userId);
        if (!existingTask) {
            throw new Error('Task not found or insufficient permissions');
        }
        const canDelete = existingTask.project.ownerId === userId ||
            existingTask.assigneeId === userId ||
            (await prisma.projectMember.findFirst({
                where: {
                    projectId: existingTask.projectId,
                    userId: userId,
                    role: {
                        in: [client_1.ProjectRole.ADMIN],
                    },
                },
            }));
        if (!canDelete) {
            throw new Error('Insufficient permissions to delete this task');
        }
        await prisma.task.delete({
            where: { id: taskId },
        });
    }
    async addComment(data) {
        const task = await this.getTaskById(data.taskId, data.authorId);
        if (!task) {
            throw new Error('Task not found or insufficient permissions');
        }
        const comment = await prisma.comment.create({
            data: {
                content: data.content,
                taskId: data.taskId,
                authorId: data.authorId,
            },
            include: {
                author: {
                    select: userSelect,
                },
            },
        });
        return comment;
    }
    async getTaskComments(taskId, userId, page = 1, limit = 20) {
        const task = await this.getTaskById(taskId, userId);
        if (!task) {
            throw new Error('Task not found or insufficient permissions');
        }
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: { taskId },
                include: {
                    author: {
                        select: userSelect,
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
                skip,
                take: limit,
            }),
            prisma.comment.count({ where: { taskId } }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: comments,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=taskService.js.map