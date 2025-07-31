import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { AuthRequest } from '../types';
import { CacheManager } from '../middlewares/cache';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskIdSchema,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryInput,
} from '../validation/task';
import {
  createCommentSchema,
  commentQuerySchema,
  CreateCommentInput,
  CommentQueryInput,
} from '../validation/comment';

const taskService = new TaskService();

export class TaskController {
  /**
   * Get paginated list of tasks with advanced filtering
   */
  async getTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate query parameters
      const validatedQuery: TaskQueryInput = taskQuerySchema.parse(req.query);

      // Add current user ID for access control
      const options = {
        ...validatedQuery,
        userId: req.user.id,
      };

      // Get tasks with pagination and filtering
      const result = await taskService.getTasks(options);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tasks',
        code: 'GET_TASKS_FAILED',
      });
    }
  }

  /**
   * Create a new task with project validation
   */
  async createTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate request body
      const validatedData: CreateTaskInput = createTaskSchema.parse(req.body);

      // Create task
      const task = await taskService.createTask(validatedData, req.user.id);

      // Invalidate related cache
      await CacheManager.invalidateTaskCache();
      await CacheManager.invalidateProjectCache(validatedData.projectId);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Project not found')) {
          res.status(404).json({
            success: false,
            error: 'Project not found or insufficient permissions',
            code: 'PROJECT_NOT_FOUND',
          });
          return;
        }
        if (error.message.includes('Assignee does not have access')) {
          res.status(400).json({
            success: false,
            error: 'Assignee does not have access to this project',
            code: 'INVALID_ASSIGNEE',
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Task creation failed',
        code: 'CREATE_TASK_FAILED',
      });
    }
  }

  /**
   * Get task by ID with comments
   */
  async getTaskById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate task ID
      const { id } = taskIdSchema.parse(req.params);

      // Get task with access check
      const task = await taskService.getTaskById(id, req.user.id);

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found or access denied',
          code: 'TASK_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get task',
        code: 'GET_TASK_FAILED',
      });
    }
  }

  /**
   * Update task with status transitions
   */
  async updateTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate task ID and request body
      const { id } = taskIdSchema.parse(req.params);
      const validatedData: UpdateTaskInput = updateTaskSchema.parse(req.body);

      // Update task
      const task = await taskService.updateTask(id, validatedData, req.user.id);

      // Invalidate related cache
      await CacheManager.invalidateTaskCache(id);
      await CacheManager.invalidateProjectCache(task.projectId);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: { task },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Task not found')) {
          res.status(404).json({
            success: false,
            error: 'Task not found or insufficient permissions',
            code: 'TASK_NOT_FOUND',
          });
          return;
        }
        if (error.message.includes('Assignee does not have access')) {
          res.status(400).json({
            success: false,
            error: 'Assignee does not have access to this project',
            code: 'INVALID_ASSIGNEE',
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Task update failed',
        code: 'UPDATE_TASK_FAILED',
      });
    }
  }

  /**
   * Delete task with audit preservation
   */
  async deleteTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate task ID
      const { id } = taskIdSchema.parse(req.params);

      // Get task first to get project ID for cache invalidation
      const existingTask = await taskService.getTaskById(id, req.user.id);

      // Delete task
      await taskService.deleteTask(id, req.user.id);

      // Invalidate related cache
      if (existingTask) {
        await CacheManager.invalidateTaskCache(id);
        await CacheManager.invalidateProjectCache(existingTask.projectId);
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Task not found')) {
          res.status(404).json({
            success: false,
            error: 'Task not found or insufficient permissions',
            code: 'TASK_NOT_FOUND',
          });
          return;
        }
        if (error.message.includes('Insufficient permissions')) {
          res.status(403).json({
            success: false,
            error: 'Insufficient permissions to delete this task',
            code: 'INSUFFICIENT_PERMISSIONS',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Task deletion failed',
        code: 'DELETE_TASK_FAILED',
      });
    }
  }

  /**
   * Add comment to task
   */
  async addTaskComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate task ID from params
      const { id: taskId } = taskIdSchema.parse(req.params);

      // Validate request body and add taskId and authorId
      const validatedData: CreateCommentInput = createCommentSchema.parse({
        ...req.body,
        taskId,
      });

      // Create comment
      const comment = await taskService.addComment({
        content: validatedData.content,
        taskId: validatedData.taskId,
        authorId: req.user.id,
      });

      // Invalidate task cache since comments are included
      await CacheManager.invalidateTaskCache(validatedData.taskId);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Task not found')) {
          res.status(404).json({
            success: false,
            error: 'Task not found or insufficient permissions',
            code: 'TASK_NOT_FOUND',
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment',
        code: 'ADD_COMMENT_FAILED',
      });
    }
  }

  /**
   * Get comments for a task with pagination
   */
  async getTaskComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate task ID from params
      const { id: taskId } = taskIdSchema.parse(req.params);

      // Validate query parameters and add taskId
      const validatedQuery: CommentQueryInput = commentQuerySchema.parse({
        ...req.query,
        taskId,
      });

      // Get comments with pagination
      const result = await taskService.getTaskComments(
        validatedQuery.taskId,
        req.user.id,
        validatedQuery.page,
        validatedQuery.limit
      );

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Task not found')) {
          res.status(404).json({
            success: false,
            error: 'Task not found or insufficient permissions',
            code: 'TASK_NOT_FOUND',
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get comments',
        code: 'GET_COMMENTS_FAILED',
      });
    }
  }
}
