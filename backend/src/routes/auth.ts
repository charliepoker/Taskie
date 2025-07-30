import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { authRateLimit, strictRateLimit } from '../middlewares/security';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateUserProfileSchema,
  changePasswordSchema,
} from '../validation/auth';

const router = Router();
const authController = new AuthController();

// Public routes with strict rate limiting
router.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh-token',
  strictRateLimit,
  validateBody(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

// Protected routes
router.get(
  '/me',
  authenticateToken,
  authController.getCurrentUser.bind(authController)
);

router.put(
  '/profile',
  authenticateToken,
  validateBody(updateUserProfileSchema),
  authController.updateProfile.bind(authController)
);

router.put(
  '/change-password',
  authenticateToken,
  strictRateLimit,
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);

router.post(
  '/logout',
  authenticateToken,
  authController.logout.bind(authController)
);

router.delete(
  '/account',
  authenticateToken,
  strictRateLimit,
  authController.deleteAccount.bind(authController)
);

export default router;
