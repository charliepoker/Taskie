import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare class AuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refreshToken(req: Request, res: Response): Promise<void>;
    getCurrentUser(req: AuthRequest, res: Response): Promise<void>;
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
    changePassword(req: AuthRequest, res: Response): Promise<void>;
    logout(req: AuthRequest, res: Response): Promise<void>;
    deleteAccount(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=authController.d.ts.map