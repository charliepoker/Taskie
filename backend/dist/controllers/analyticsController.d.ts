import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class AnalyticsController {
    getDashboardMetrics(req: AuthRequest, res: Response): Promise<void>;
    getTasksByStatus(req: AuthRequest, res: Response): Promise<void>;
    getUserProductivity(req: AuthRequest, res: Response): Promise<void>;
    clearCache(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=analyticsController.d.ts.map