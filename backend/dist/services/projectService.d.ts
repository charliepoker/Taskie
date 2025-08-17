import { Project, ProjectMember, ProjectRole, User } from '@prisma/client';
import { PaginatedResponse } from '../types';
export interface GetProjectsOptions {
    page?: number;
    limit?: number;
    search?: string;
    ownerId?: string;
    userId?: string;
}
export interface CreateProjectData {
    name: string;
    description?: string | null;
    color?: string;
}
export interface UpdateProjectData {
    name?: string;
    description?: string | null;
    color?: string;
}
export interface ProjectWithDetails extends Project {
    owner: Omit<User, 'password'>;
    members: (ProjectMember & {
        user: Omit<User, 'password'>;
    })[];
    _count: {
        tasks: number;
        members: number;
    };
}
export declare class ProjectService {
    getProjects(options: GetProjectsOptions): Promise<PaginatedResponse<ProjectWithDetails>>;
    getProjectById(projectId: string, userId?: string): Promise<ProjectWithDetails | null>;
    createProject(projectData: CreateProjectData, ownerId: string): Promise<ProjectWithDetails>;
    updateProject(projectId: string, updateData: UpdateProjectData, userId: string): Promise<ProjectWithDetails>;
    deleteProject(projectId: string, userId: string): Promise<void>;
    addProjectMember(projectId: string, targetUserId: string, role: ProjectRole, requestingUserId: string): Promise<ProjectMember & {
        user: Omit<User, 'password'>;
    }>;
    updateProjectMember(projectId: string, targetUserId: string, newRole: ProjectRole, requestingUserId: string): Promise<ProjectMember & {
        user: Omit<User, 'password'>;
    }>;
    removeProjectMember(projectId: string, targetUserId: string, requestingUserId: string): Promise<void>;
    hasProjectAccess(projectId: string, userId: string): Promise<boolean>;
    getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null>;
}
//# sourceMappingURL=projectService.d.ts.map