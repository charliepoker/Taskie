"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const redis_1 = require("../utils/redis");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        let health = { database: false, redis: false };
        try {
            const healthPromise = (0, database_1.healthCheck)();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ database: false, redis: false }), 1000));
            health = (await Promise.race([healthPromise, timeoutPromise]));
        }
        catch (error) {
        }
        const healthStatus = {
            status: 'healthy',
            timestamp,
            server: 'running',
            services: {
                database: {
                    status: health.database ? 'up' : 'checking',
                    type: 'PostgreSQL',
                },
                redis: {
                    status: health.redis ? 'up' : 'checking',
                    type: 'Redis',
                },
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
        res.status(200).json(healthStatus);
    }
    catch (error) {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: 'running',
            message: 'Server is operational',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        });
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const health = await (0, database_1.healthCheck)();
        const timestamp = new Date().toISOString();
        let redisOperational = false;
        try {
            await redis_1.redisService.set('health_check', timestamp, 60);
            const testValue = await redis_1.redisService.get('health_check');
            redisOperational = testValue === timestamp;
            await redis_1.redisService.del('health_check');
        }
        catch (error) {
            redisOperational = false;
        }
        const detailedHealth = {
            status: health.database && health.redis && redisOperational
                ? 'healthy'
                : 'unhealthy',
            timestamp,
            services: {
                database: {
                    status: health.database ? 'up' : 'down',
                    type: 'PostgreSQL',
                    connection: health.database ? 'active' : 'failed',
                },
                redis: {
                    status: health.redis ? 'up' : 'down',
                    type: 'Redis',
                    connection: health.redis ? 'active' : 'failed',
                    operations: redisOperational ? 'working' : 'failed',
                },
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                platform: process.platform,
            },
            application: {
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 5000,
            },
        };
        const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(detailedHealth);
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map