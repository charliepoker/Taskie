"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const taskService_1 = require("../services/taskService");
const cache_1 = require("../middlewares/cache");
const task_1 = require("../validation/task");
const comment_1 = require("../validation/comment");
const taskService = new taskService_1.TaskService();
class TaskController {
    async getTasks(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const validatedQuery = task_1.taskQuerySchema.parse(req.query);
            const options = {
                ...validatedQuery,
                userId: req.user.id,
            };
            const result = await taskService.getTasks(options);
            res.status(200).json({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get tasks',
                code: 'GET_TASKS_FAILED',
            });
        }
    }
    async createTask(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const validatedData = task_1.createTaskSchema.parse(req.body);
            const task = await taskService.createTask(validatedData, req.user.id);
            await cache_1.CacheManager.invalidateTaskCache();
            await cache_1.CacheManager.invalidateProjectCache(validatedData.projectId);
            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: { task },
            });
        }
        catch (error) {
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
    async getTaskById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = task_1.taskIdSchema.parse(req.params);
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
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get task',
                code: 'GET_TASK_FAILED',
            });
        }
    }
    async updateTask(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = task_1.taskIdSchema.parse(req.params);
            const validatedData = task_1.updateTaskSchema.parse(req.body);
            const task = await taskService.updateTask(id, validatedData, req.user.id);
            await cache_1.CacheManager.invalidateTaskCache(id);
            await cache_1.CacheManager.invalidateProjectCache(task.projectId);
            res.status(200).json({
                success: true,
                message: 'Task updated successfully',
                data: { task },
            });
        }
        catch (error) {
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
    async deleteTask(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = task_1.taskIdSchema.parse(req.params);
            const existingTask = await taskService.getTaskById(id, req.user.id);
            await taskService.deleteTask(id, req.user.id);
            if (existingTask) {
                await cache_1.CacheManager.invalidateTaskCache(id);
                await cache_1.CacheManager.invalidateProjectCache(existingTask.projectId);
            }
            res.status(200).json({
                success: true,
                message: 'Task deleted successfully',
            });
        }
        catch (error) {
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
    async addTaskComment(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id: taskId } = task_1.taskIdSchema.parse(req.params);
            const validatedData = comment_1.createCommentSchema.parse({
                ...req.body,
                taskId,
            });
            const comment = await taskService.addComment({
                content: validatedData.content,
                taskId: validatedData.taskId,
                authorId: req.user.id,
            });
            await cache_1.CacheManager.invalidateTaskCache(validatedData.taskId);
            res.status(201).json({
                success: true,
                message: 'Comment added successfully',
                data: { comment },
            });
        }
        catch (error) {
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
    async getTaskComments(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id: taskId } = task_1.taskIdSchema.parse(req.params);
            const validatedQuery = comment_1.commentQuerySchema.parse({
                ...req.query,
                taskId,
            });
            const result = await taskService.getTaskComments(validatedQuery.taskId, req.user.id, validatedQuery.page, validatedQuery.limit);
            res.status(200).json({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
        catch (error) {
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
                error: error instanceof Error ? error.message : 'Failed to get comments',
                code: 'GET_COMMENTS_FAILED',
            });
        }
    }
}
exports.TaskController = TaskController;
//# sourceMappingURL=taskController.js.map