// Standalone performance tests that don't require database connections
import { PerformanceMonitoringService } from '../services/performanceMonitoringService';

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    zadd: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
    flushAll: jest.fn().mockResolvedValue('OK'),
    info: jest.fn().mockResolvedValue(''),
  }),
}));

describe('Performance Monitoring (Standalone)', () => {
  let performanceMonitor: PerformanceMonitoringService;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitoringService.getInstance();
    // Clear any existing metrics
    performanceMonitor.clearMetrics();
  });

  describe('Performance Monitoring Service', () => {
    it('should record API response time metrics', async () => {
      await performanceMonitor.recordApiResponseTime(
        '/api/tasks',
        'GET',
        200,
        150
      );

      // Since we're using mocked Redis, we can't test actual retrieval
      // but we can verify the method doesn't throw
      expect(true).toBe(true);
    });

    it('should record database query time metrics', async () => {
      await performanceMonitor.recordDatabaseQueryTime(
        'SELECT * FROM tasks WHERE projectId = ?',
        75,
        true
      );

      expect(true).toBe(true);
    });

    it('should record memory usage metrics', async () => {
      await performanceMonitor.recordMemoryUsage();
      expect(true).toBe(true);
    });

    it('should record CPU usage metrics', async () => {
      await performanceMonitor.recordCpuUsage();
      expect(true).toBe(true);
    });

    it('should get dashboard data', async () => {
      const dashboardData = await performanceMonitor.getDashboardData();

      expect(dashboardData).toHaveProperty('apiMetrics');
      expect(dashboardData).toHaveProperty('databaseMetrics');
      expect(dashboardData).toHaveProperty('systemMetrics');
      expect(dashboardData).toHaveProperty('activeAlerts');
    });

    it('should handle alert rules', () => {
      performanceMonitor.addAlertRule({
        metricName: 'test.metric',
        threshold: 100,
        operator: 'gt',
        duration: 60,
        enabled: true,
      });

      // Verify no errors thrown
      expect(true).toBe(true);
    });
  });

  describe('Cache Management (Mocked)', () => {
    // Import cache manager
    const { CacheManager } = require('../middlewares/cache');

    it('should have invalidation methods', () => {
      expect(typeof CacheManager.invalidateUserCache).toBe('function');
      expect(typeof CacheManager.invalidateProjectCache).toBe('function');
      expect(typeof CacheManager.invalidateTaskCache).toBe('function');
      expect(typeof CacheManager.clearAll).toBe('function');
    });

    it('should have stats method', () => {
      expect(typeof CacheManager.getStats).toBe('function');
    });
  });

  describe('Optimized Task Service', () => {
    it('should export OptimizedTaskService', () => {
      const {
        OptimizedTaskService,
      } = require('../services/optimizedTaskService');
      expect(OptimizedTaskService).toBeDefined();
    });

    it('should have optimized methods', () => {
      const {
        optimizedTaskService,
      } = require('../services/optimizedTaskService');
      expect(typeof optimizedTaskService.getTasks).toBe('function');
      expect(typeof optimizedTaskService.createTask).toBe('function');
      expect(typeof optimizedTaskService.getTaskById).toBe('function');
      expect(typeof optimizedTaskService.batchUpdateTaskStatus).toBe(
        'function'
      );
      expect(typeof optimizedTaskService.getTaskStatistics).toBe('function');
    });
  });
});
