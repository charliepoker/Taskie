import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class ProjectController {
    getProjects(req: AuthRequest, res: Response): Promise<void>;
    createProject(req: AuthRequest, res: Response): Promise<void>;
    getProjectById(req: AuthRequest, res: Response): Promise<void>;
    updateProject(req: AuthRequest, res: Response): Promise<void>;
    deleteProject(req: AuthRequest, res: Response): Promise<void>;
    addProjectMember(req: AuthRequest, res: Response): Promise<void>;
    updateProjectMember(req: AuthRequest, res: Response): Promise<void>;
    removeProjectMember(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=projectController.d.ts.map