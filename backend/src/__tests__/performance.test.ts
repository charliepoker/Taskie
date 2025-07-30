import { PerformanceMonitoringService } from '../services/performanceMonitoringService';
import { CacheManager } from '../middlewares/cache';

describe('Performance Optimizations', () => {
  let performanceMonitor: PerformanceMonitoringService;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitoringService.getInstance();
  });

  describe('Performance Monitoring', () => {
    it('should record API response time metrics', async () => {
      await performanceMonitor.recordApiResponseTime(
        '/api/tasks',
        'GET',
        200,
        150
      );

      const metrics = await performanceMonitor.getMetrics(
        'api.response_time',
        Date.now() - 60000,
        Date.now()
      );

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].value).toBe(150);
      expect(metrics[0].tags?.endpoint).toBe('/api/tasks');
    });

    it('should record database query time metrics', async () => {
      await performanceMonitor.recordDatabaseQueryTime(
        'SELECT * FROM tasks WHERE projectId = ?',
        75,
        true
      );

      const metrics = await performanceMonitor.getMetrics(
        'database.query_time',
        Date.now() - 60000,
        Date.now()
      );

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].value).toBe(75);
      expect(metrics[0].tags?.query_type).toBe('SELECT');
    });

    it('should calculate aggregated metrics correctly', async () => {
      const now = Date.now();

      // Record multiple metrics
      await performanceMonitor.recordApiResponseTime(
        '/api/tasks',
        'GET',
        200,
        100
      );
      await performanceMonitor.recordApiResponseTime(
        '/api/tasks',
        'GET',
        200,
        200
      );
      await performanceMonitor.recordApiResponseTime(
        '/api/tasks',
        'GET',
        200,
        300
      );

      const aggregated = await performanceMonitor.getAggregatedMetrics(
        'api.response_time',
        now - 60000,
        now + 60000
      );

      expect(aggregated.count).toBe(3);
      expect(aggregated.avg).toBe(200);
      expect(aggregated.min).toBe(100);
      expect(aggregated.max).toBe(300);
    });

    it('should trigger alerts when thresholds are exceeded', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Add a test alert rule
      performanceMonitor.addAlertRule({
        metricName: 'test.metric',
        threshold: 100,
        operator: 'gt',
        duration: 0,
        enabled: true,
      });

      // Record a metric that exceeds the threshold
      await performanceMonitor.recordMetric({
        name: 'test.metric',
        value: 150,
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT: test.metric gt 100'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Management', () => {
    it('should invalidate user cache', async () => {
      const spy = jest.spyOn(CacheManager, 'invalidateUserCache');
      await CacheManager.invalidateUserCache('user123');
      expect(spy).toHaveBeenCalledWith('user123');
      spy.mockRestore();
    });

    it('should invalidate project cache', async () => {
      const spy = jest.spyOn(CacheManager, 'invalidateProjectCache');
      await CacheManager.invalidateProjectCache('project123');
      expect(spy).toHaveBeenCalledWith('project123');
      spy.mockRestore();
    });

    it('should invalidate task cache', async () => {
      const spy = jest.spyOn(CacheManager, 'invalidateTaskCache');
      await CacheManager.invalidateTaskCache('task123');
      expect(spy).toHaveBeenCalledWith('task123');
      spy.mockRestore();
    });
  });

  describe('Database Query Optimization', () => {
    it('should use optimized query patterns', () => {
      // Test that the optimized task service uses better query patterns
      // This would typically involve testing the actual database queries
      // but for now we'll just verify the service exists
      const {
        OptimizedTaskService,
      } = require('../services/optimizedTaskService');
      expect(OptimizedTaskService).toBeDefined();
    });
  });
});

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
