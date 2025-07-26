import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
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
  validateRequest({
    params: taskIdSchema,
    query: commentQuerySchema.omit({ taskId: true }), // taskId comes from params
  }),
  taskController.getTaskComments.bind(taskController)
);

export default router;
