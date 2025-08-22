"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const security_1 = require("../middlewares/security");
const user_1 = require("../validation/user");
const router = (0, express_1.Router)();
const userController = new userController_1.UserController();
router.use(auth_1.authenticateToken);
router.get('/', userController.getUsers.bind(userController));
router.get('/:id', (0, validation_1.validateParams)(user_1.userIdParamSchema), userController.getUserById.bind(userController));
router.put('/:id', (0, validation_1.validateParams)(user_1.userIdParamSchema), (0, validation_1.validateBody)(user_1.updateUserSchema), userController.updateUser.bind(userController));
router.delete('/:id', security_1.strictRateLimit, (0, validation_1.validateParams)(user_1.userIdParamSchema), userController.deleteUser.bind(userController));
exports.default = router;
//# sourceMappingURL=users.js.map