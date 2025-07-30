import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { cache } from '../middlewares/cache';
import { strictRateLimit } from '../middlewares/security';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskIdSchema,
} from '../validation/task';
import { createCommentSchema, commentQuerySchema } from '../validation/comment';

const router = Router();
const taskController = new TaskController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Task CRUD routes
router.get(
  '/',
  cache({ ttl: 300, keyPrefix: 'tasks' }), // 5 minute cache
  validateRequest({ query: taskQuerySchema }),
  taskController.getTasks.bind(taskController)
);

router.post(
  '/',
  validateRequest({ body: createTaskSchema }),
  taskController.createTask.bind(taskController)
);

router.get(
  '/:id',
  cache({ ttl: 600, keyPrefix: 'task' }), // 10 minute cache for individual tasks
  validateRequest({ params: taskIdSchema }),
  taskController.getTaskById.bind(taskController)
);

router.put(
  '/:id',
  validateRequest({
    params: taskIdSchema,
    body: updateTaskSchema,
  }),
  taskController.updateTask.bind(taskController)
);

router.delete(
  '/:id',
  strictRateLimit,
  validateRequest({ params: taskIdSchema }),
  taskController.deleteTask.bind(taskController)
);

// Task comment routes
router.post(
  '/:id/comments',
  validateRequest({
    params: taskIdSchema,
    body: createCommentSchema.omit({ taskId: true }), // taskId comes from params
  }),
  taskController.addTaskComment.bind(taskController)
);

router.get(
  '/:id/comments',
  cache({ ttl: 180, keyPrefix: 'task-comments' }), // 3 minute cache for comments
  validateRequest({
    params: taskIdSchema,
    query: commentQuerySchema.omit({ taskId: true }), // taskId comes from params
  }),
  taskController.getTaskComments.bind(taskController)
);

export default router;
