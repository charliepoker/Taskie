import { Router, Request, Response } from 'express';
import { healthCheck } from '../utils/database';
import { redisService } from '../utils/redis';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = await healthCheck();
    const timestamp = new Date().toISOString();

    const healthStatus = {
      status: health.database && health.redis ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: {
          status: health.database ? 'up' : 'down',
          type: 'PostgreSQL',
        },
        redis: {
          status: health.redis ? 'up' : 'down',
          type: 'Redis',
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: { status: 'unknown', type: 'PostgreSQL' },
        redis: { status: 'unknown', type: 'Redis' },
      },
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const health = await healthCheck();
    const timestamp = new Date().toISOString();

    // Test Redis operations
    let redisOperational = false;
    try {
      await redisService.set('health_check', timestamp, 60);
      const testValue = await redisService.get('health_check');
      redisOperational = testValue === timestamp;
      await redisService.del('health_check');
    } catch (error) {
      redisOperational = false;
    }

    const detailedHealth = {
      status:
        health.database && health.redis && redisOperational
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
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
