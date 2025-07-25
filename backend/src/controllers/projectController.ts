import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { AuthRequest } from '../types';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  projectIdSchema,
  projectMemberIdSchema,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryInput,
  AddProjectMemberInput,
  UpdateProjectMemberInput,
} from '../validation/project';

const projectService = new ProjectService();

export class ProjectController {
  /**
   * Get paginated list of projects with filtering
   */
  async getProjects(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate query parameters
      const validatedQuery: ProjectQueryInput = projectQuerySchema.parse(
        req.query
      );

      // Add current user ID to filter projects they have access to
      const options = {
        ...validatedQuery,
        userId: req.user.id,
      };

      // Get projects with pagination
      const result = await projectService.getProjects(options);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get projects',
        code: 'GET_PROJECTS_FAILED',
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate request body
      const validatedData: CreateProjectInput = createProjectSchema.parse(
        req.body
      );

      // Create project
      const project = await projectService.createProject(
        validatedData,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { project },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error:
          error instanceof Error ? error.message : 'Project creation failed',
        code: 'CREATE_PROJECT_FAILED',
      });
    }
  }

  /**
   * Get project by ID with member details
   */
  async getProjectById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate project ID
      const { id } = projectIdSchema.parse(req.params);

      // Get project with access check
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get project',
        code: 'GET_PROJECT_FAILED',
      });
    }
  }

  /**
   * Update project with authorization
   */
  async updateProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate project ID and request body
      const { id } = projectIdSchema.parse(req.params);
      const validatedData: UpdateProjectInput = updateProjectSchema.parse(
        req.body
      );

      // Update project
      const project = await projectService.updateProject(
        id,
        validatedData,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: { project },
      });
    } catch (error) {
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

  /**
   * Delete project with cascade handling
   */
  async deleteProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate project ID
      const { id } = projectIdSchema.parse(req.params);

      // Delete project
      await projectService.deleteProject(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
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
        error:
          error instanceof Error ? error.message : 'Project deletion failed',
        code: 'DELETE_PROJECT_FAILED',
      });
    }
  }

  /**
   * Add member to project
   */
  async addProjectMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate project ID and request body
      const { projectId } = req.params; // This should already be validated by middleware
      const validatedData: AddProjectMemberInput = addProjectMemberSchema.parse(
        req.body
      );

      // Add member to project
      const member = await projectService.addProjectMember(
        projectId,
        validatedData.userId,
        validatedData.role,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Member added to project successfully',
        data: { member },
      });
    } catch (error) {
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

  /**
   * Update project member role
   */
  async updateProjectMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate parameters and request body
      const { projectId, userId } = projectMemberIdSchema.parse(req.params);
      const validatedData: UpdateProjectMemberInput =
        updateProjectMemberSchema.parse(req.body);

      // Update member role
      const member = await projectService.updateProjectMember(
        projectId,
        userId,
        validatedData.role,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: { member },
      });
    } catch (error) {
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
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
        code: 'UPDATE_MEMBER_FAILED',
      });
    }
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Validate parameters
      const { projectId, userId } = projectMemberIdSchema.parse(req.params);

      // Remove member from project
      await projectService.removeProjectMember(projectId, userId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Member removed from project successfully',
      });
    } catch (error) {
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
        error:
          error instanceof Error ? error.message : 'Failed to remove member',
        code: 'REMOVE_MEMBER_FAILED',
      });
    }
  }
}
