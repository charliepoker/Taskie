"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class UserService {
    async getUsers(options) {
        const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', } = options;
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const total = await prisma.user.count({ where });
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        projects: true,
                        assignedTasks: true,
                        comments: true,
                    },
                },
            },
        });
        return user;
    }
    async updateUser(userId, updateData) {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    async deleteUser(userId) {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        await prisma.$transaction(async (tx) => {
            await tx.comment.deleteMany({
                where: { authorId: userId },
            });
            await tx.task.updateMany({
                where: { assigneeId: userId },
                data: { assigneeId: null },
            });
            await tx.projectMember.deleteMany({
                where: { userId: userId },
            });
            const ownedProjects = await tx.project.findMany({
                where: { ownerId: userId },
                include: {
                    members: {
                        where: { userId: { not: userId } },
                        orderBy: { joinedAt: 'asc' },
                    },
                },
            });
            for (const project of ownedProjects) {
                if (project.members.length === 0) {
                    await tx.comment.deleteMany({
                        where: { task: { projectId: project.id } },
                    });
                    await tx.task.deleteMany({
                        where: { projectId: project.id },
                    });
                    await tx.project.delete({
                        where: { id: project.id },
                    });
                }
                else {
                    const newOwner = project.members[0];
                    await tx.project.update({
                        where: { id: project.id },
                        data: { ownerId: newOwner.userId },
                    });
                    await tx.projectMember.update({
                        where: {
                            userId_projectId: {
                                userId: newOwner.userId,
                                projectId: project.id,
                            },
                        },
                        data: { role: 'OWNER' },
                    });
                }
            }
            await tx.user.delete({
                where: { id: userId },
            });
        });
    }
    async getUserStats(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        projects: true,
                        assignedTasks: true,
                        comments: true,
                    },
                },
            },
        });
        if (!user) {
            return null;
        }
        return {
            projectsCount: user._count.projects,
            tasksCount: user._count.assignedTasks,
            commentsCount: user._count.comments,
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map