"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const projectService_1 = require("../services/projectService");
const project_1 = require("../validation/project");
const projectService = new projectService_1.ProjectService();
class ProjectController {
    async getProjects(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const validatedQuery = project_1.projectQuerySchema.parse(req.query);
            const options = {
                ...validatedQuery,
                userId: req.user.id,
            };
            const result = await projectService.getProjects(options);
            res.status(200).json({
                success: true,
                data: result.data,
                meta: result.meta,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get projects',
                code: 'GET_PROJECTS_FAILED',
            });
        }
    }
    async createProject(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const validatedData = project_1.createProjectSchema.parse(req.body);
            const project = await projectService.createProject(validatedData, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: { project },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Project creation failed',
                code: 'CREATE_PROJECT_FAILED',
            });
        }
    }
    async getProjectById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = project_1.projectIdSchema.parse(req.params);
            const project = await projectService.getProjectById(id, req.user.id);
            if (!project) {
                res.status(404).json({
                    success: false,
                    error: 'Project not found or access denied',
                    code: 'PROJECT_NOT_FOUND',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { project },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get project',
                code: 'GET_PROJECT_FAILED',
            });
        }
    }
    async updateProject(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = project_1.projectIdSchema.parse(req.params);
            const validatedData = project_1.updateProjectSchema.parse(req.body);
            const project = await projectService.updateProject(id, validatedData, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Project updated successfully',
                data: { project },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Project not found',
                        code: 'PROJECT_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('permissions')) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions to update project',
                        code: 'INSUFFICIENT_PERMISSIONS',
                    });
                    return;
                }
            }
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Project update failed',
                code: 'UPDATE_PROJECT_FAILED',
            });
        }
    }
    async deleteProject(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { id } = project_1.projectIdSchema.parse(req.params);
            await projectService.deleteProject(id, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Project deleted successfully',
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Project not found',
                        code: 'PROJECT_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('owner')) {
                    res.status(403).json({
                        success: false,
                        error: 'Only project owner can delete the project',
                        code: 'INSUFFICIENT_PERMISSIONS',
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Project deletion failed',
                code: 'DELETE_PROJECT_FAILED',
            });
        }
    }
    async addProjectMember(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { projectId } = req.params;
            const validatedData = project_1.addProjectMemberSchema.parse(req.body);
            const member = await projectService.addProjectMember(projectId, validatedData.userId, validatedData.role, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Member added to project successfully',
                data: { member },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Project not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Project not found',
                        code: 'PROJECT_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('User not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'User not found',
                        code: 'USER_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('already a member')) {
                    res.status(409).json({
                        success: false,
                        error: 'User is already a member of this project',
                        code: 'USER_ALREADY_MEMBER',
                    });
                    return;
                }
                if (error.message.includes('permissions')) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions to add members',
                        code: 'INSUFFICIENT_PERMISSIONS',
                    });
                    return;
                }
            }
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add member',
                code: 'ADD_MEMBER_FAILED',
            });
        }
    }
    async updateProjectMember(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { projectId, userId } = project_1.projectMemberIdSchema.parse(req.params);
            const validatedData = project_1.updateProjectMemberSchema.parse(req.body);
            const member = await projectService.updateProjectMember(projectId, userId, validatedData.role, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Member role updated successfully',
                data: { member },
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Project not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Project not found',
                        code: 'PROJECT_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('owner role')) {
                    res.status(400).json({
                        success: false,
                        error: 'Cannot change project owner role',
                        code: 'CANNOT_CHANGE_OWNER_ROLE',
                    });
                    return;
                }
                if (error.message.includes('permissions')) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions to update member roles',
                        code: 'INSUFFICIENT_PERMISSIONS',
                    });
                    return;
                }
            }
            res.status(400).json({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : 'Failed to update member role',
                code: 'UPDATE_MEMBER_FAILED',
            });
        }
    }
    async removeProjectMember(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
                return;
            }
            const { projectId, userId } = project_1.projectMemberIdSchema.parse(req.params);
            await projectService.removeProjectMember(projectId, userId, req.user.id);
            res.status(200).json({
                success: true,
                message: 'Member removed from project successfully',
            });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Project not found')) {
                    res.status(404).json({
                        success: false,
                        error: 'Project not found',
                        code: 'PROJECT_NOT_FOUND',
                    });
                    return;
                }
                if (error.message.includes('Cannot remove project owner')) {
                    res.status(400).json({
                        success: false,
                        error: 'Cannot remove project owner',
                        code: 'CANNOT_REMOVE_OWNER',
                    });
                    return;
                }
                if (error.message.includes('permissions')) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions to remove member',
                        code: 'INSUFFICIENT_PERMISSIONS',
                    });
                    return;
                }
            }
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to remove member',
                code: 'REMOVE_MEMBER_FAILED',
            });
        }
    }
}
exports.ProjectController = ProjectController;
//# sourceMappingURL=projectController.js.map