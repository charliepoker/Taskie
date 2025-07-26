import { Response } from 'express';
import {
  AnalyticsService,
  DateRangeFilter,
} from '../services/analyticsService';
import { AuthRequest } from '../types';
import { z } from 'zod';

const analyticsService = new AnalyticsService();

// Validation schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export class AnalyticsController {
  /**
   * Get dashboard metrics with aggregated data
   */
  async getDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
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
      const queryResult = analyticsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'INVALID_QUERY_PARAMS',
          details: queryResult.error.issues,
        });
        return;
      }

      // Build date range filter
      const dateRange: DateRangeFilter | undefined =
        queryResult.data.startDate || queryResult.data.endDate
          ? {
              startDate: queryResult.data.startDate
                ? new Date(queryResult.data.startDate)
                : undefined,
              endDate: queryResult.data.endDate
                ? new Date(queryResult.data.endDate)
                : undefined,
            }
          : undefined;

      // Validate date range
      if (
        dateRange?.startDate &&
        dateRange?.endDate &&
        dateRange.startDate > dateRange.endDate
      ) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
        });
        return;
      }

      // Get dashboard metrics
      const metrics = await analyticsService.getDashboardMetrics(
        req.user.id,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          dateRange: dateRange || null,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get dashboard metrics',
        code: 'DASHBOARD_METRICS_FAILED',
      });
    }
  }

  /**
   * Get tasks distribution by status with statistics
   */
  async getTasksByStatus(req: AuthRequest, res: Response): Promise<void> {
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
      const queryResult = analyticsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'INVALID_QUERY_PARAMS',
          details: queryResult.error.issues,
        });
        return;
      }

      // Build date range filter
      const dateRange: DateRangeFilter | undefined =
        queryResult.data.startDate || queryResult.data.endDate
          ? {
              startDate: queryResult.data.startDate
                ? new Date(queryResult.data.startDate)
                : undefined,
              endDate: queryResult.data.endDate
                ? new Date(queryResult.data.endDate)
                : undefined,
            }
          : undefined;

      // Validate date range
      if (
        dateRange?.startDate &&
        dateRange?.endDate &&
        dateRange.startDate > dateRange.endDate
      ) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
        });
        return;
      }

      // Get tasks by status
      const result = await analyticsService.getTasksByStatus(
        req.user.id,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          dateRange: dateRange || null,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Tasks by status error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get tasks by status',
        code: 'TASKS_BY_STATUS_FAILED',
      });
    }
  }

  /**
   * Get user productivity metrics with performance data
   */
  async getUserProductivity(req: AuthRequest, res: Response): Promise<void> {
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
      const queryResult = analyticsQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'INVALID_QUERY_PARAMS',
          details: queryResult.error.issues,
        });
        return;
      }

      // Build date range filter
      const dateRange: DateRangeFilter | undefined =
        queryResult.data.startDate || queryResult.data.endDate
          ? {
              startDate: queryResult.data.startDate
                ? new Date(queryResult.data.startDate)
                : undefined,
              endDate: queryResult.data.endDate
                ? new Date(queryResult.data.endDate)
                : undefined,
            }
          : undefined;

      // Validate date range
      if (
        dateRange?.startDate &&
        dateRange?.endDate &&
        dateRange.startDate > dateRange.endDate
      ) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE',
        });
        return;
      }

      // Get user productivity metrics
      const result = await analyticsService.getUserProductivity(
        req.user.id,
        dateRange
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          dateRange: dateRange || null,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('User productivity error:', error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get user productivity metrics',
        code: 'USER_PRODUCTIVITY_FAILED',
      });
    }
  }

  /**
   * Clear analytics cache for the current user
   */
  async clearCache(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      await analyticsService.clearUserCache(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Analytics cache cleared successfully',
      });
    } catch (error) {
      console.error('Clear cache error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
        code: 'CLEAR_CACHE_FAILED',
      });
    }
  }
}
