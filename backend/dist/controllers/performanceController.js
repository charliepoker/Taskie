"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceController = void 0;
const performanceMonitoringService_1 = require("../services/performanceMonitoringService");
class PerformanceController {
    async getDashboard(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                });
                return;
            }
            const dashboardData = await performanceMonitoringService_1.performanceMonitor.getDashboardData();
            res.status(200).json({
                success: true,
                data: dashboardData,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to get performance data',
                code: 'PERFORMANCE_DATA_FAILED',
            });
        }
    }
    async getMetrics(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
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
            const metrics = await performanceMonitoringService_1.performanceMonitor.getMetrics(metricName, parseInt(startTime), parseInt(endTime));
            res.status(200).json({
                success: true,
                data: metrics,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get metrics',
                code: 'GET_METRICS_FAILED',
            });
        }
    }
    async getAggregatedMetrics(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
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
            const aggregatedMetrics = await performanceMonitoringService_1.performanceMonitor.getAggregatedMetrics(metricName, parseInt(startTime), parseInt(endTime));
            res.status(200).json({
                success: true,
                data: aggregatedMetrics,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to get aggregated metrics',
                code: 'GET_AGGREGATED_METRICS_FAILED',
            });
        }
    }
}
exports.PerformanceController = PerformanceController;
//# sourceMappingURL=performanceController.js.map