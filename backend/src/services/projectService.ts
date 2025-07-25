import {
  PrismaClient,
  Project,
  ProjectMember,
  ProjectRole,
  User,
} from '@prisma/client';
import { PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export interface GetProjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: string;
  userId?: string; // For filtering projects where user is a member
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  color?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  color?: string;
}

export interface ProjectWithDetails extends Project {
  owner: Omit<User, 'password'>;
  members: (ProjectMember & {
    user: Omit<User, 'password'>;
  })[];
  _count: {
    tasks: number;
    members: number;
  };
}

export class ProjectService {
  /**
   * Get paginated list of projects with optional filtering
   */
  async getProjects(
    options: GetProjectsOptions
  ): Promise<PaginatedResponse<ProjectWithDetails>> {
    const { page = 1, limit = 10, search, ownerId, userId } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    const conditions: any[] = [];

    // User membership filter (always applied when userId is provided)
    if (userId) {
      conditions.push(
        { ownerId: userId },
        { members: { some: { userId: userId } } }
      );
    }

    // Owner filter
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Search filter
    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];

      if (conditions.length > 0) {
        // Combine user access with search: user must have access AND match search
        where.AND = [{ OR: conditions }, { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    } else if (conditions.length > 0) {
      where.OR = conditions;
    }

    // Get total count for pagination
    const total = await prisma.project.count({ where });

    // Get projects with details
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

  /**
   * Get project by ID with full details
   */
  async getProjectById(
    projectId: string,
    userId?: string
  ): Promise<ProjectWithDetails | null> {
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

    // Check if user has access to this project
    if (userId) {
      const hasAccess =
        project.ownerId === userId ||
        project.members.some((member) => member.userId === userId);

      if (!hasAccess) {
        return null;
      }
    }

    return project;
  }

  /**
   * Create a new project
   */
  async createProject(
    projectData: CreateProjectData,
    ownerId: string
  ): Promise<ProjectWithDetails> {
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

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    updateData: UpdateProjectData,
    userId: string
  ): Promise<ProjectWithDetails> {
    // Check if user has permission to update (owner or admin)
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
    const isAdmin = project.members.some(
      (member) => member.userId === userId && member.role === ProjectRole.ADMIN
    );

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

  /**
   * Delete project with cascade handling
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check if user is the owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new Error('Only project owner can delete the project');
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete comments on tasks in this project
      await tx.comment.deleteMany({
        where: {
          task: {
            projectId: projectId,
          },
        },
      });

      // Delete tasks in this project
      await tx.task.deleteMany({
        where: { projectId: projectId },
      });

      // Delete project members
      await tx.projectMember.deleteMany({
        where: { projectId: projectId },
      });

      // Delete the project
      await tx.project.delete({
        where: { id: projectId },
      });
    });
  }

  /**
   * Add member to project
   */
  async addProjectMember(
    projectId: string,
    targetUserId: string,
    role: ProjectRole,
    requestingUserId: string
  ): Promise<ProjectMember & { user: Omit<User, 'password'> }> {
    // Check if requesting user has permission (owner or admin)
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
    const isAdmin = project.members.some(
      (member) =>
        member.userId === requestingUserId && member.role === ProjectRole.ADMIN
    );

    if (!isOwner && !isAdmin) {
      throw new Error('Insufficient permissions to add members');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if user is already a member
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

    // Add member
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

  /**
   * Update project member role
   */
  async updateProjectMember(
    projectId: string,
    targetUserId: string,
    newRole: ProjectRole,
    requestingUserId: string
  ): Promise<ProjectMember & { user: Omit<User, 'password'> }> {
    // Check if requesting user has permission (owner or admin)
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
    const isAdmin = project.members.some(
      (member) =>
        member.userId === requestingUserId && member.role === ProjectRole.ADMIN
    );

    if (!isOwner && !isAdmin) {
      throw new Error('Insufficient permissions to update member roles');
    }

    // Cannot change owner role
    if (project.ownerId === targetUserId) {
      throw new Error('Cannot change project owner role');
    }

    // Update member role
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

  /**
   * Remove member from project
   */
  async removeProjectMember(
    projectId: string,
    targetUserId: string,
    requestingUserId: string
  ): Promise<void> {
    // Check if requesting user has permission (owner, admin, or removing themselves)
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
    const isAdmin = project.members.some(
      (member) =>
        member.userId === requestingUserId && member.role === ProjectRole.ADMIN
    );
    const isSelf = targetUserId === requestingUserId;

    if (!isOwner && !isAdmin && !isSelf) {
      throw new Error('Insufficient permissions to remove member');
    }

    // Cannot remove project owner
    if (project.ownerId === targetUserId) {
      throw new Error('Cannot remove project owner');
    }

    // Use transaction to handle task reassignment
    await prisma.$transaction(async (tx) => {
      // Unassign tasks assigned to the member being removed
      await tx.task.updateMany({
        where: {
          projectId: projectId,
          assigneeId: targetUserId,
        },
        data: {
          assigneeId: null,
        },
      });

      // Remove member
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

  /**
   * Check if user has access to project
   */
  async hasProjectAccess(projectId: string, userId: string): Promise<boolean> {
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

  /**
   * Get user's role in project
   */
  async getUserProjectRole(
    projectId: string,
    userId: string
  ): Promise<ProjectRole | null> {
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
      return ProjectRole.OWNER;
    }

    if (project.members.length > 0) {
      return project.members[0].role;
    }

    return null;
  }
}
