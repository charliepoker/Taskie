"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const health_1 = __importDefault(require("./health"));
const users_1 = __importDefault(require("./users"));
const projects_1 = __importDefault(require("./projects"));
const tasks_1 = __importDefault(require("./tasks"));
const analytics_1 = __importDefault(require("./analytics"));
const router = (0, express_1.Router)();
router.use('/health', health_1.default);
router.use('/auth', auth_1.default);
router.use('/users', users_1.default);
router.use('/projects', projects_1.default);
router.use('/tasks', tasks_1.default);
router.use('/analytics', analytics_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map