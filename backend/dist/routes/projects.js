"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const security_1 = require("../middlewares/security");
const project_1 = require("../validation/project");
const router = (0, express_1.Router)();
const projectController = new projectController_1.ProjectController();
router.use(auth_1.authenticateToken);
router.get('/', (0, validation_1.validateRequest)({ query: project_1.projectQuerySchema }), projectController.getProjects.bind(projectController));
router.post('/', (0, validation_1.validateRequest)({ body: project_1.createProjectSchema }), projectController.createProject.bind(projectController));
router.get('/:id', (0, validation_1.validateRequest)({ params: project_1.projectIdSchema }), projectController.getProjectById.bind(projectController));
router.put('/:id', (0, validation_1.validateRequest)({
    params: project_1.projectIdSchema,
    body: project_1.updateProjectSchema,
}), projectController.updateProject.bind(projectController));
router.delete('/:id', security_1.strictRateLimit, (0, validation_1.validateRequest)({ params: project_1.projectIdSchema }), projectController.deleteProject.bind(projectController));
router.post('/:projectId/members', (0, validation_1.validateRequest)({
    params: zod_1.z.object({
        projectId: zod_1.z.string().uuid('Project ID must be a valid UUID'),
    }),
    body: project_1.addProjectMemberSchema,
}), projectController.addProjectMember.bind(projectController));
router.put('/:projectId/members/:userId', (0, validation_1.validateRequest)({
    params: project_1.projectMemberIdSchema,
    body: project_1.updateProjectMemberSchema,
}), projectController.updateProjectMember.bind(projectController));
router.delete('/:projectId/members/:userId', security_1.strictRateLimit, (0, validation_1.validateRequest)({ params: project_1.projectMemberIdSchema }), projectController.removeProjectMember.bind(projectController));
exports.default = router;
//# sourceMappingURL=projects.js.map