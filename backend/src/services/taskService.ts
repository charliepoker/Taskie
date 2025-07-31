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

// User selection for consistent author/assignee data
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

const prisma = new PrismaClient();

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
  userId: string; // Current user ID for access control
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  projectId: string;
  dueDate?: Date | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

export interface TaskWithDetails extends Task {
  assignee: Omit<User, 'password'> | null;
  project: Project & {
    owner: Omit<User, 'password'>;
  };
  comments: (Comment & {
    author: Omit<User, 'password'>;
  })[];
  _count: {
    comments: number;
  };
}

export interface CreateCommentData {
  content: string;
  taskId: string;
  authorId: string;
}

export class TaskService {
  /**
   * Get paginated list of tasks with filtering and access control
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
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause with access control
    const whereClause: any = {
      // User must be a member of the project or the project owner
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

    // Add filters
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

    // Get tasks with pagination
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
            take: 5, // Limit comments in list view
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
      data: tasks as TaskWithDetails[],
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Create a new task with project access validation
   */
  async createTask(
    data: CreateTaskData,
    userId: string
  ): Promise<TaskWithDetails> {
    // Verify user has access to the project
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
    });

    if (!project) {
      throw new Error('Project not found or insufficient permissions');
    }

    // If assigneeId is provided, verify the assignee has access to the project
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

    // Create the task
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

    return task as TaskWithDetails;
  }

  /**
   * Get task by ID with access control
   */
  async getTaskById(
    taskId: string,
    userId: string
  ): Promise<TaskWithDetails | null> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        // User must be a member of the project or the project owner
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

    return task as TaskWithDetails | null;
  }

  /**
   * Update task with access control and validation
   */
  async updateTask(
    taskId: string,
    data: UpdateTaskData,
    userId: string
  ): Promise<TaskWithDetails> {
    // First, verify the task exists and user has access
    const existingTask = await this.getTaskById(taskId, userId);
    if (!existingTask) {
      throw new Error('Task not found or insufficient permissions');
    }

    // If assigneeId is being updated, verify the new assignee has access to the project
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

    // Update the task
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

    return updatedTask as TaskWithDetails;
  }

  /**
   * Delete task with access control
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    // First, verify the task exists and user has access
    const existingTask = await this.getTaskById(taskId, userId);
    if (!existingTask) {
      throw new Error('Task not found or insufficient permissions');
    }

    // Check if user has permission to delete (project owner/admin or task assignee)
    const canDelete =
      existingTask.project.ownerId === userId ||
      existingTask.assigneeId === userId ||
      (await prisma.projectMember.findFirst({
        where: {
          projectId: existingTask.projectId,
          userId: userId,
          role: {
            in: [ProjectRole.ADMIN],
          },
        },
      }));

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this task');
    }

    // Delete the task (comments will be cascade deleted)
    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  /**
   * Add comment to task
   */
  async addComment(
    data: CreateCommentData
  ): Promise<Comment & { author: Omit<User, 'password'> }> {
    // Verify user has access to the task
    const task = await this.getTaskById(data.taskId, data.authorId);
    if (!task) {
      throw new Error('Task not found or insufficient permissions');
    }

    // Create the comment
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

  /**
   * Get comments for a task with pagination
   */
  async getTaskComments(
    taskId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Comment & { author: Omit<User, 'password'> }>> {
    // Verify user has access to the task
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
