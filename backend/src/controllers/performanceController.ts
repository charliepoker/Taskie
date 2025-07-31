import { Request, Response } from 'express';
import { performanceMonitor } from '../services/performanceMonitoringService';
import { AuthRequest } from '../types';

export class PerformanceController {
  /**
   * Get performance dashboard data
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Only allow authenticated users to access performance data
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const dashboardData = await performanceMonitor.getDashboardData();

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get performance data',
        code: 'PERFORMANCE_DATA_FAILED',
      });
    }
  }

  /**
   * Get specific metrics
   */
  async getMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const { metricName, startTime, endTime } = req.query;

      if (!metricName || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: metricName, startTime, endTime',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const metrics = await performanceMonitor.getMetrics(
        metricName as string,
        parseInt(startTime as string),
        parseInt(endTime as string)
      );

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics',
        code: 'GET_METRICS_FAILED',
      });
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      const { metricName, startTime, endTime } = req.query;

      if (!metricName || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: metricName, startTime, endTime',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const aggregatedMetrics = await performanceMonitor.getAggregatedMetrics(
        metricName as string,
        parseInt(startTime as string),
        parseInt(endTime as string)
      );

      res.status(200).json({
        success: true,
        data: aggregatedMetrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get aggregated metrics',
        code: 'GET_AGGREGATED_METRICS_FAILED',
      });
    }
  }
}
