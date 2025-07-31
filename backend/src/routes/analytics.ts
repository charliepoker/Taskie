import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all analytics routes
router.use(authenticateToken);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard metrics with aggregated data
 * @access Private
 * @query startDate - Optional start date filter (ISO string)
 * @query endDate - Optional end date filter (ISO string)
 */
router.get('/dashboard', (req, res) =>
  analyticsController.getDashboardMetrics(req, res)
);

/**
 * @route GET /api/analytics/tasks-by-status
 * @desc Get tasks distribution by status with statistics and trends
 * @access Private
 * @query startDate - Optional start date filter (ISO string)
 * @query endDate - Optional end date filter (ISO string)
 */
router.get('/tasks-by-status', (req, res) =>
  analyticsController.getTasksByStatus(req, res)
);

/**
 * @route GET /api/analytics/user-productivity
 * @desc Get user productivity metrics with performance data
 * @access Private
 * @query startDate - Optional start date filter (ISO string)
 * @query endDate - Optional end date filter (ISO string)
 */
router.get('/user-productivity', (req, res) =>
  analyticsController.getUserProductivity(req, res)
);

/**
 * @route DELETE /api/analytics/cache
 * @desc Clear analytics cache for the current user
 * @access Private
 */
router.delete('/cache', (req, res) => analyticsController.clearCache(req, res));

export default router;
