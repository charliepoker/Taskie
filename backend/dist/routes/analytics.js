"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const analyticsController = new analyticsController_1.AnalyticsController();
router.use(auth_1.authenticateToken);
router.get('/dashboard', (req, res) => analyticsController.getDashboardMetrics(req, res));
router.get('/tasks-by-status', (req, res) => analyticsController.getTasksByStatus(req, res));
router.get('/user-productivity', (req, res) => analyticsController.getUserProductivity(req, res));
router.delete('/cache', (req, res) => analyticsController.clearCache(req, res));
exports.default = router;
//# sourceMappingURL=analytics.js.map