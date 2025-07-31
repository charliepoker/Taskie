import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';
import { validateBody, validateParams } from '../middlewares/validation';
import { strictRateLimit } from '../middlewares/security';
import { updateUserSchema, userIdParamSchema } from '../validation/user';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/users - Get paginated list of users
router.get('/', userController.getUsers.bind(userController));

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  validateParams(userIdParamSchema),
  userController.getUserById.bind(userController)
);

// PUT /api/users/:id - Update user profile
router.put(
  '/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  userController.updateUser.bind(userController)
);

// DELETE /api/users/:id - Delete user account
router.delete(
  '/:id',
  strictRateLimit,
  validateParams(userIdParamSchema),
  userController.deleteUser.bind(userController)
);

export default router;
