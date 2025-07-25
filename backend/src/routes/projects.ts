import { Router } from 'express';
import { z } from 'zod';
import { ProjectController } from '../controllers/projectController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  addProjectMemberSchema,
  updateProjectMemberSchema,
  projectIdSchema,
  projectMemberIdSchema,
} from '../validation/project';

const router = Router();
const projectController = new ProjectController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Project CRUD routes
router.get(
  '/',
  validateRequest({ query: projectQuerySchema }),
  projectController.getProjects.bind(projectController)
);

router.post(
  '/',
  validateRequest({ body: createProjectSchema }),
  projectController.createProject.bind(projectController)
);

router.get(
  '/:id',
  validateRequest({ params: projectIdSchema }),
  projectController.getProjectById.bind(projectController)
);

router.put(
  '/:id',
  validateRequest({
    params: projectIdSchema,
    body: updateProjectSchema,
  }),
  projectController.updateProject.bind(projectController)
);

router.delete(
  '/:id',
  validateRequest({ params: projectIdSchema }),
  projectController.deleteProject.bind(projectController)
);

// Project member management routes
router.post(
  '/:projectId/members',
  validateRequest({
    params: z.object({
      projectId: z.string().uuid('Project ID must be a valid UUID'),
    }),
    body: addProjectMemberSchema,
  }),
  projectController.addProjectMember.bind(projectController)
);

router.put(
  '/:projectId/members/:userId',
  validateRequest({
    params: projectMemberIdSchema,
    body: updateProjectMemberSchema,
  }),
  projectController.updateProjectMember.bind(projectController)
);

router.delete(
  '/:projectId/members/:userId',
  validateRequest({ params: projectMemberIdSchema }),
  projectController.removeProjectMember.bind(projectController)
);

export default router;
