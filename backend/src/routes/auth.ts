import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { authRateLimit, strictRateLimit } from '../middlewares/security';
import { RateLimitingService } from '../services/rateLimitingService';
import rateLimitingConfig from '../config/rateLimiting';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from '../validation/auth';

const rateLimitingService = new RateLimitingService();

const router = Router();
const authController = new AuthController();

// Enhanced rate limiting configurations from config
const loginRateLimit = rateLimitingService.createAuthRateLimit(
  rateLimitingConfig.login
);
const registerRateLimit = rateLimitingService.createAuthRateLimit(
  rateLimitingConfig.register
);
const passwordResetRateLimit =
  rateLimitingService.createPasswordResetRateLimit();
const tokenRefreshRateLimit = rateLimitingService.createAuthRateLimit(
  rateLimitingConfig.tokenRefresh
);
const changePasswordRateLimit = rateLimitingService.createAuthRateLimit(
  rateLimitingConfig.changePassword
);

// Public routes with enhanced rate limiting
router.post(
  '/register',
  registerRateLimit,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  loginRateLimit,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  tokenRefreshRateLimit,
  validateBody(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

// Password reset routes with specific rate limiting
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validateBody(passwordResetRequestSchema),
  authController.requestPasswordReset.bind(authController)
);

router.post(
  '/reset-password',
  authRateLimit, // Use standard auth rate limit for password reset confirmation
  validateBody(passwordResetConfirmSchema),
  authController.resetPassword.bind(authController)
);

router.get(
  '/validate-reset-token/:token',
  authController.validateResetToken.bind(authController)
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

router.post(
  '/change-password',
  authenticateToken,
  changePasswordRateLimit,
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

// Monitoring routes (admin only - TODO: add admin middleware)
router.get(
  '/metrics',
  authenticateToken,
  authController.getAuthMetrics.bind(authController)
);

router.get(
  '/rates',
  authenticateToken,
  authController.getAuthRatesOverTime.bind(authController)
);

export default router;
