import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map