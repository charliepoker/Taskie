import {
  PrismaClient,
  Task,
  TaskStatus,
  TaskPriority,
  User,
  Project,
  Comment,
  ProjectRole,
} from '@prisma/client';
import { PaginatedResponse } from '../types';

const prisma = new PrismaClient();

// Optimized user selection for consistent author/assignee data
const userSelect = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

// Optimized project selection
const projectSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
  includeComments?: boolean;
}

export interface TaskWithDetails extends Task {
  assignee: Omit<User, 'password'> | null;
  project: Project & {
    owner: Omit<User, 'password'>;
  };
  comments?: (Comment & {
    author: Omit<User, 'password'>;
  })[];
  _count: {
    comments: number;
  };
}

export class OptimizedTaskService {
  /**
   * Get user's accessible project IDs with caching
   */
  private async getUserAccessibleProjectIds(userId: string): Promise<string[]> {
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

  /**
   * Optimized task query with better indexing usage
   */
  async getTasks(
    options: GetTasksOptions
  ): Promise<PaginatedResponse<TaskWithDetails>> {
    const {
      page = 1,
      limit = 10,
      search,
      projectId,
      assigneeId,
      status,
      priority,
      dueBefore,
      dueAfter,
      createdBefore,
      createdAfter,
      userId,
      includeComments = false,
    } = options;

    const skip = (page - 1) * limit;

    // Get accessible project IDs first for better query performance
    const accessibleProjectIds = projectId
      ? [projectId]
      : await this.getUserAccessibleProjectIds(userId);

    if (accessibleProjectIds.length === 0) {
      return {
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Build optimized where clause
    const whereClause: any = {
      projectId: { in: accessibleProjectIds },
    };

    // Add filters in order of selectivity (most selective first)
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

    // Use full-text search for better performance
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

    // Optimized include based on needs
    const include: any = {
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
        take: 5, // Limit comments in list view
      };
    }

    // Execute optimized queries in parallel
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
      data: tasks as unknown as TaskWithDetails[],
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Optimized task creation with minimal queries
   */
  async createTask(
    data: {
      title: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string | null;
      projectId: string;
      dueDate?: Date | null;
    },
    userId: string
  ): Promise<TaskWithDetails> {
    // Single query to verify project access and assignee access
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
                    ProjectRole.OWNER,
                    ProjectRole.ADMIN,
                    ProjectRole.MEMBER,
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

    // If assignee is specified, verify access in a single query
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

    // Create task with optimized include
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || TaskPriority.MEDIUM,
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

    return task as TaskWithDetails;
  }

  /**
   * Optimized task retrieval by ID
   */
  async getTaskById(
    taskId: string,
    userId: string,
    includeComments: boolean = true
  ): Promise<TaskWithDetails | null> {
    const include: any = {
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

    return task as TaskWithDetails | null;
  }

  /**
   * Batch task operations for better performance
   */
  async batchUpdateTaskStatus(
    taskIds: string[],
    status: TaskStatus,
    userId: string
  ): Promise<number> {
    // Verify user has access to all tasks
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
                      ProjectRole.OWNER,
                      ProjectRole.ADMIN,
                      ProjectRole.MEMBER,
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

    // Batch update
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

  /**
   * Get task statistics for analytics with optimized queries
   */
  async getTaskStatistics(
    projectIds?: string[],
    userId?: string
  ): Promise<{
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    tasksByPriority: Record<TaskPriority, number>;
    overdueTasks: number;
  }> {
    let whereClause: any = {};

    if (projectIds && projectIds.length > 0) {
      whereClause.projectId = { in: projectIds };
    }

    if (userId) {
      const accessibleProjectIds =
        await this.getUserAccessibleProjectIds(userId);
      whereClause.projectId = { in: accessibleProjectIds };
    }

    // Execute all statistics queries in parallel
    const [totalTasks, statusCounts, priorityCounts, overdueTasks] =
      await Promise.all([
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
            status: { not: TaskStatus.DONE },
          },
        }),
      ]);

    // Transform results
    const tasksByStatus = Object.values(TaskStatus).reduce(
      (acc, status) => {
        acc[status] =
          statusCounts.find((s) => s.status === status)?._count.status || 0;
        return acc;
      },
      {} as Record<TaskStatus, number>
    );

    const tasksByPriority = Object.values(TaskPriority).reduce(
      (acc, priority) => {
        acc[priority] =
          priorityCounts.find((p) => p.priority === priority)?._count
            .priority || 0;
        return acc;
      },
      {} as Record<TaskPriority, number>
    );

    return {
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
    };
  }
}

export const optimizedTaskService = new OptimizedTaskService();
