"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
const zod_1 = require("zod");
const analyticsService = new analyticsService_1.AnalyticsService();
const analyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
class AnalyticsController {
    async getDashboardMetrics(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
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
            const dateRange = queryResult.data.startDate || queryResult.data.endDate
                ? {
                    startDate: queryResult.data.startDate
                        ? new Date(queryResult.data.startDate)
                        : undefined,
                    endDate: queryResult.data.endDate
                        ? new Date(queryResult.data.endDate)
                        : undefined,
                }
                : undefined;
            if (dateRange?.startDate &&
                dateRange?.endDate &&
                dateRange.startDate > dateRange.endDate) {
                res.status(400).json({
                    success: false,
                    error: 'Start date must be before end date',
                    code: 'INVALID_DATE_RANGE',
                });
                return;
            }
            const metrics = await analyticsService.getDashboardMetrics(req.user.id, dateRange);
            res.status(200).json({
                success: true,
                data: metrics,
                meta: {
                    dateRange: dateRange || null,
                    generatedAt: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.error('Dashboard metrics error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to get dashboard metrics',
                code: 'DASHBOARD_METRICS_FAILED',
            });
        }
    }
    async getTasksByStatus(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
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
            const dateRange = queryResult.data.startDate || queryResult.data.endDate
                ? {
                    startDate: queryResult.data.startDate
                        ? new Date(queryResult.data.startDate)
                        : undefined,
                    endDate: queryResult.data.endDate
                        ? new Date(queryResult.data.endDate)
                        : undefined,
                }
                : undefined;
            if (dateRange?.startDate &&
                dateRange?.endDate &&
                dateRange.startDate > dateRange.endDate) {
                res.status(400).json({
                    success: false,
                    error: 'Start date must be before end date',
                    code: 'INVALID_DATE_RANGE',
                });
                return;
            }
            const result = await analyticsService.getTasksByStatus(req.user.id, dateRange);
            res.status(200).json({
                success: true,
                data: result,
                meta: {
                    dateRange: dateRange || null,
                    generatedAt: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.error('Tasks by status error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to get tasks by status',
                code: 'TASKS_BY_STATUS_FAILED',
            });
        }
    }
    async getUserProductivity(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
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
            const dateRange = queryResult.data.startDate || queryResult.data.endDate
                ? {
                    startDate: queryResult.data.startDate
                        ? new Date(queryResult.data.startDate)
                        : undefined,
                    endDate: queryResult.data.endDate
                        ? new Date(queryResult.data.endDate)
                        : undefined,
                }
                : undefined;
            if (dateRange?.startDate &&
                dateRange?.endDate &&
                dateRange.startDate > dateRange.endDate) {
                res.status(400).json({
                    success: false,
                    error: 'Start date must be before end date',
                    code: 'INVALID_DATE_RANGE',
                });
                return;
            }
            const result = await analyticsService.getUserProductivity(req.user.id, dateRange);
            res.status(200).json({
                success: true,
                data: result,
                meta: {
                    dateRange: dateRange || null,
                    generatedAt: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            console.error('User productivity error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to get user productivity metrics',
                code: 'USER_PRODUCTIVITY_FAILED',
            });
        }
    }
    async clearCache(req, res) {
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
        }
        catch (error) {
            console.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear cache',
                code: 'CLEAR_CACHE_FAILED',
            });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analyticsController.js.map