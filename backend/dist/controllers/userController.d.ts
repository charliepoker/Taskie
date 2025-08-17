import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare class UserController {
    getUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    updateUser(req: AuthRequest, res: Response): Promise<void>;
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map