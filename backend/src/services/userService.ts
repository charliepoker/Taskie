import { PrismaClient, User } from '@prisma/client';
import { PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export class UserService {
  /**
   * Get paginated list of users with optional search and sorting
   */
  async getUsers(
    options: GetUsersOptions
  ): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { username: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with pagination and sorting
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

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
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
        // Include related data for profile view
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

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserData
  ): Promise<Omit<User, 'password'>> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user
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

  /**
   * Delete user account with proper data cleanup
   */
  async deleteUser(userId: string): Promise<void> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Use transaction to ensure data consistency during deletion
    await prisma.$transaction(async (tx) => {
      // Delete user comments first (due to foreign key constraints)
      await tx.comment.deleteMany({
        where: { authorId: userId },
      });

      // Update tasks to remove assignee (don't delete tasks, just unassign)
      await tx.task.updateMany({
        where: { assigneeId: userId },
        data: { assigneeId: null },
      });

      // Remove user from project memberships
      await tx.projectMember.deleteMany({
        where: { userId: userId },
      });

      // Handle projects owned by the user
      // Option 1: Delete projects owned by the user (if no other members)
      // Option 2: Transfer ownership to another admin/member
      // For now, we'll delete projects with no other members and transfer others
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
          // No other members, delete the project and its tasks
          await tx.comment.deleteMany({
            where: { task: { projectId: project.id } },
          });
          await tx.task.deleteMany({
            where: { projectId: project.id },
          });
          await tx.project.delete({
            where: { id: project.id },
          });
        } else {
          // Transfer ownership to the first member (oldest member)
          const newOwner = project.members[0];
          await tx.project.update({
            where: { id: project.id },
            data: { ownerId: newOwner.userId },
          });
          // Update the new owner's role to OWNER
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

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    projectsCount: number;
    tasksCount: number;
    commentsCount: number;
  } | null> {
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
