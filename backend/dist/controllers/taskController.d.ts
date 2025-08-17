import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class TaskController {
    getTasks(req: AuthRequest, res: Response): Promise<void>;
    createTask(req: AuthRequest, res: Response): Promise<void>;
    getTaskById(req: AuthRequest, res: Response): Promise<void>;
    updateTask(req: AuthRequest, res: Response): Promise<void>;
    deleteTask(req: AuthRequest, res: Response): Promise<void>;
    addTaskComment(req: AuthRequest, res: Response): Promise<void>;
    getTaskComments(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=taskController.d.ts.map