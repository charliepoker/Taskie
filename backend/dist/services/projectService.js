"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProjectService {
    async getProjects(options) {
        const { page = 1, limit = 10, search, ownerId, userId } = options;
        const skip = (page - 1) * limit;
        const where = {};
        const conditions = [];
        if (userId) {
            conditions.push({ ownerId: userId }, { members: { some: { userId: userId } } });
        }
        if (ownerId) {
            where.ownerId = ownerId;
        }
        if (search) {
            const searchConditions = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
            if (conditions.length > 0) {
                where.AND = [{ OR: conditions }, { OR: searchConditions }];
            }
            else {
                where.OR = searchConditions;
            }
        }
        else if (conditions.length > 0) {
            where.OR = conditions;
        }
        const total = await prisma.project.count({ where });
        const projects = await prisma.project.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                owner: {
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
                },
                members: {
                    include: {
                        user: {
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
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data: projects,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async getProjectById(projectId, userId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: {
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
                },
                members: {
                    include: {
                        user: {
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
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
        });
        if (!project) {
            return null;
        }
        if (userId) {
            const hasAccess = project.ownerId === userId ||
                project.members.some((member) => member.userId === userId);
            if (!hasAccess) {
                return null;
            }
        }
        return project;
    }
    async createProject(projectData, ownerId) {
        const project = await prisma.project.create({
            data: {
                ...projectData,
                ownerId,
            },
            include: {
                owner: {
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
                },
                members: {
                    include: {
                        user: {
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
                        },
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
        });
        return project;
    }
    async updateProject(projectId, updateData, userId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const isOwner = project.ownerId === userId;
        const isAdmin = project.members.some((member) => member.userId === userId && member.role === client_1.ProjectRole.ADMIN);
        if (!isOwner && !isAdmin) {
            throw new Error('Insufficient permissions to update project');
        }
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                owner: {
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
                },
                members: {
                    include: {
                        user: {
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
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                    },
                },
            },
        });
        return updatedProject;
    }
    async deleteProject(projectId, userId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        if (project.ownerId !== userId) {
            throw new Error('Only project owner can delete the project');
        }
        await prisma.$transaction(async (tx) => {
            await tx.comment.deleteMany({
                where: {
                    task: {
                        projectId: projectId,
                    },
                },
            });
            await tx.task.deleteMany({
                where: { projectId: projectId },
            });
            await tx.projectMember.deleteMany({
                where: { projectId: projectId },
            });
            await tx.project.delete({
                where: { id: projectId },
            });
        });
    }
    async addProjectMember(projectId, targetUserId, role, requestingUserId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId: requestingUserId },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const isOwner = project.ownerId === requestingUserId;
        const isAdmin = project.members.some((member) => member.userId === requestingUserId && member.role === client_1.ProjectRole.ADMIN);
        if (!isOwner && !isAdmin) {
            throw new Error('Insufficient permissions to add members');
        }
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new Error('User not found');
        }
        const existingMember = await prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: targetUserId,
                    projectId: projectId,
                },
            },
        });
        if (existingMember) {
            throw new Error('User is already a member of this project');
        }
        const member = await prisma.projectMember.create({
            data: {
                userId: targetUserId,
                projectId: projectId,
                role: role,
            },
            include: {
                user: {
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
                },
            },
        });
        return member;
    }
    async updateProjectMember(projectId, targetUserId, newRole, requestingUserId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId: requestingUserId },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const isOwner = project.ownerId === requestingUserId;
        const isAdmin = project.members.some((member) => member.userId === requestingUserId && member.role === client_1.ProjectRole.ADMIN);
        if (!isOwner && !isAdmin) {
            throw new Error('Insufficient permissions to update member roles');
        }
        if (project.ownerId === targetUserId) {
            throw new Error('Cannot change project owner role');
        }
        const member = await prisma.projectMember.update({
            where: {
                userId_projectId: {
                    userId: targetUserId,
                    projectId: projectId,
                },
            },
            data: { role: newRole },
            include: {
                user: {
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
                },
            },
        });
        return member;
    }
    async removeProjectMember(projectId, targetUserId, requestingUserId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId: requestingUserId },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const isOwner = project.ownerId === requestingUserId;
        const isAdmin = project.members.some((member) => member.userId === requestingUserId && member.role === client_1.ProjectRole.ADMIN);
        const isSelf = targetUserId === requestingUserId;
        if (!isOwner && !isAdmin && !isSelf) {
            throw new Error('Insufficient permissions to remove member');
        }
        if (project.ownerId === targetUserId) {
            throw new Error('Cannot remove project owner');
        }
        await prisma.$transaction(async (tx) => {
            await tx.task.updateMany({
                where: {
                    projectId: projectId,
                    assigneeId: targetUserId,
                },
                data: {
                    assigneeId: null,
                },
            });
            await tx.projectMember.delete({
                where: {
                    userId_projectId: {
                        userId: targetUserId,
                        projectId: projectId,
                    },
                },
            });
        });
    }
    async hasProjectAccess(projectId, userId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!project) {
            return false;
        }
        return project.ownerId === userId || project.members.length > 0;
    }
    async getUserProjectRole(projectId, userId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: {
                    where: { userId },
                },
            },
        });
        if (!project) {
            return null;
        }
        if (project.ownerId === userId) {
            return client_1.ProjectRole.OWNER;
        }
        if (project.members.length > 0) {
            return project.members[0].role;
        }
        return null;
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=projectService.js.map