import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class PerformanceController {
    getDashboard(req: AuthRequest, res: Response): Promise<void>;
    getMetrics(req: AuthRequest, res: Response): Promise<void>;
    getAggregatedMetrics(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=performanceController.d.ts.map