"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const cache_1 = require("../middlewares/cache");
const security_1 = require("../middlewares/security");
const task_1 = require("../validation/task");
const comment_1 = require("../validation/comment");
const router = (0, express_1.Router)();
const taskController = new taskController_1.TaskController();
router.use(auth_1.authenticateToken);
router.get('/', (0, cache_1.cache)({ ttl: 300, keyPrefix: 'tasks' }), (0, validation_1.validateRequest)({ query: task_1.taskQuerySchema }), taskController.getTasks.bind(taskController));
router.post('/', (0, validation_1.validateRequest)({ body: task_1.createTaskSchema }), taskController.createTask.bind(taskController));
router.get('/:id', (0, cache_1.cache)({ ttl: 600, keyPrefix: 'task' }), (0, validation_1.validateRequest)({ params: task_1.taskIdSchema }), taskController.getTaskById.bind(taskController));
router.put('/:id', (0, validation_1.validateRequest)({
    params: task_1.taskIdSchema,
    body: task_1.updateTaskSchema,
}), taskController.updateTask.bind(taskController));
router.delete('/:id', security_1.strictRateLimit, (0, validation_1.validateRequest)({ params: task_1.taskIdSchema }), taskController.deleteTask.bind(taskController));
router.post('/:id/comments', (0, validation_1.validateRequest)({
    params: task_1.taskIdSchema,
    body: comment_1.createCommentSchema.omit({ taskId: true }),
}), taskController.addTaskComment.bind(taskController));
router.get('/:id/comments', (0, cache_1.cache)({ ttl: 180, keyPrefix: 'task-comments' }), (0, validation_1.validateRequest)({
    params: task_1.taskIdSchema,
    query: comment_1.commentQuerySchema.omit({ taskId: true }),
}), taskController.getTaskComments.bind(taskController));
exports.default = router;
//# sourceMappingURL=tasks.js.map