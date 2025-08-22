import { RedisClientType } from 'redis';
import { performance } from 'perf_hooks';
import { getRedisClient, handleRedisError } from '../utils/database';

// Redis client wrapper for performance monitoring
class RedisClientWrapper {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async getClient(): Promise<RedisClientType | null> {
    if (!this.client && !this.isConnected) {
      try {
        this.client = await getRedisClient();
        this.isConnected = true;
        return this.client;
      } catch (error) {
        console.warn('Redis not available for performance monitoring:', error);
        this.isConnected = false;
        return null;
      }
    }
    return this.client;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) return 0;
      return await client.zAdd(key, { score, value: member });
    } catch (error) {
      console.warn('Redis ZADD failed:', error);
      return 0;
    }
  }

  async zrangebyscore(
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    try {
      const client = await this.getClient();
      if (!client) return [];
      return await client.zRangeByScore(key, min, max);
    } catch (error) {
      console.warn('Redis ZRANGEBYSCORE failed:', error);
      return [];
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;
      const result = await client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.warn('Redis EXPIRE failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        // Note: We don't disconnect the shared Redis client here
        // as it's managed by the database utility
        this.client = null;
        this.isConnected = false;
      }
    } catch (error) {
      console.warn('Redis disconnect failed:', error);
    }
  }
}

const redis = new RedisClientWrapper();

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

export interface AlertRule {
  metricName: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number; // seconds
  enabled: boolean;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alertRules: AlertRule[] = [];
  private alertStates: Map<string, { triggered: boolean; since: number }> =
    new Map();
  private metricsCollectionInterval: NodeJS.Timeout | null = null;

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance =
        new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.initializeDefaultAlerts();

    // Only start metrics collection if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startMetricsCollection();
    }
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Store in memory for immediate access
      if (!this.metrics.has(metric.name)) {
        this.metrics.set(metric.name, []);
      }

      const metricArray = this.metrics.get(metric.name)!;
      metricArray.push(metric);

      // Keep only last 1000 metrics per type
      if (metricArray.length > 1000) {
        metricArray.shift();
      }

      // Store in Redis for persistence (gracefully handle Redis unavailability)
      try {
        const key = `metrics:${metric.name}`;
        await redis.zadd(key, metric.timestamp, JSON.stringify(metric));
        await redis.expire(key, 86400); // Set expiration to 24 hours
      } catch (redisError) {
        // Log Redis error but don't fail the entire operation
        console.warn('Failed to store metric in Redis:', redisError);
      }

      // Check alert rules
      this.checkAlerts(metric);
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Record API response time
   */
  async recordApiResponseTime(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    await this.recordMetric({
      name: 'api.response_time',
      value: responseTime,
      timestamp: Date.now(),
      tags: {
        endpoint,
        method,
        status_code: statusCode.toString(),
      },
      unit: 'ms',
    });
  }

  /**
   * Record database query time
   */
  async recordDatabaseQueryTime(
    query: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    await this.recordMetric({
      name: 'database.query_time',
      value: duration,
      timestamp: Date.now(),
      tags: {
        query_type: this.extractQueryType(query),
        success: success.toString(),
      },
      unit: 'ms',
    });
  }

  /**
   * Record memory usage
   */
  async recordMemoryUsage(): Promise<void> {
    const memUsage = process.memoryUsage();

    await Promise.all([
      this.recordMetric({
        name: 'system.memory.heap_used',
        value: memUsage.heapUsed,
        timestamp: Date.now(),
        unit: 'bytes',
      }),
      this.recordMetric({
        name: 'system.memory.heap_total',
        value: memUsage.heapTotal,
        timestamp: Date.now(),
        unit: 'bytes',
      }),
      this.recordMetric({
        name: 'system.memory.rss',
        value: memUsage.rss,
        timestamp: Date.now(),
        unit: 'bytes',
      }),
    ]);
  }

  /**
   * Record CPU usage
   */
  async recordCpuUsage(): Promise<void> {
    const cpuUsage = process.cpuUsage();

    await Promise.all([
      this.recordMetric({
        name: 'system.cpu.user',
        value: cpuUsage.user,
        timestamp: Date.now(),
        unit: 'microseconds',
      }),
      this.recordMetric({
        name: 'system.cpu.system',
        value: cpuUsage.system,
        timestamp: Date.now(),
        unit: 'microseconds',
      }),
    ]);
  }

  /**
   * Get metrics for a time range
   */
  async getMetrics(
    metricName: string,
    startTime: number,
    endTime: number
  ): Promise<PerformanceMetric[]> {
    try {
      const key = `metrics:${metricName}`;
      const results = await redis.zrangebyscore(key, startTime, endTime);

      if (!Array.isArray(results)) {
        return [];
      }

      return results
        .filter((result): result is string => typeof result === 'string')
        .map((result) => {
          try {
            return JSON.parse(result);
          } catch (parseError) {
            console.warn('Failed to parse metric data:', parseError);
            return null;
          }
        })
        .filter((metric): metric is PerformanceMetric => metric !== null);
    } catch (error) {
      console.warn(
        'Error getting metrics from Redis, falling back to memory:',
        error
      );

      // Fallback to in-memory metrics if Redis fails
      const memoryMetrics = this.metrics.get(metricName) || [];
      return memoryMetrics.filter(
        (metric) => metric.timestamp >= startTime && metric.timestamp <= endTime
      );
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(
    metricName: string,
    startTime: number,
    endTime: number
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
    p95: number;
    p99: number;
  }> {
    const metrics = await this.getMetrics(metricName, startTime, endTime);

    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metric: PerformanceMetric): void {
    const relevantRules = this.alertRules.filter(
      (rule) => rule.enabled && rule.metricName === metric.name
    );

    for (const rule of relevantRules) {
      const alertKey = `${rule.metricName}_${rule.threshold}_${rule.operator}`;
      const currentState = this.alertStates.get(alertKey) || {
        triggered: false,
        since: 0,
      };

      const shouldTrigger = this.evaluateAlertCondition(metric.value, rule);

      if (shouldTrigger && !currentState.triggered) {
        // Alert triggered
        this.alertStates.set(alertKey, { triggered: true, since: Date.now() });
        this.sendAlert(rule, metric);
      } else if (!shouldTrigger && currentState.triggered) {
        // Alert resolved
        this.alertStates.set(alertKey, { triggered: false, since: 0 });
        this.sendAlertResolved(rule, metric);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Send alert notification
   */
  private sendAlert(rule: AlertRule, metric: PerformanceMetric): void {
    console.warn(
      `🚨 ALERT: ${rule.metricName} ${rule.operator} ${rule.threshold}`,
      {
        currentValue: metric.value,
        timestamp: new Date(metric.timestamp).toISOString(),
        tags: metric.tags,
      }
    );

    // Here you would integrate with your alerting system
    // (Slack, PagerDuty, email, etc.)
  }

  /**
   * Send alert resolved notification
   */
  private sendAlertResolved(rule: AlertRule, metric: PerformanceMetric): void {
    console.info(`✅ RESOLVED: ${rule.metricName} alert resolved`, {
      currentValue: metric.value,
      timestamp: new Date(metric.timestamp).toISOString(),
    });
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.addAlertRule({
      metricName: 'api.response_time',
      threshold: 5000, // 5 seconds
      operator: 'gt',
      duration: 60,
      enabled: true,
    });

    this.addAlertRule({
      metricName: 'database.query_time',
      threshold: 10000, // 10 seconds
      operator: 'gt',
      duration: 30,
      enabled: true,
    });

    this.addAlertRule({
      metricName: 'system.memory.heap_used',
      threshold: 1024 * 1024 * 1024, // 1GB
      operator: 'gt',
      duration: 300,
      enabled: true,
    });
  }

  /**
   * Start collecting system metrics
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.recordMemoryUsage();
        await this.recordCpuUsage();
      } catch (error) {
        console.warn('System metrics collection failed:', error);
      }
    }, 30000);
  }

  /**
   * Extract query type from SQL
   */
  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(): Promise<{
    apiMetrics: any;
    databaseMetrics: any;
    systemMetrics: any;
    activeAlerts: any[];
  }> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const [apiMetrics, databaseMetrics, memoryMetrics, cpuMetrics] =
      await Promise.all([
        this.getAggregatedMetrics('api.response_time', oneHourAgo, now),
        this.getAggregatedMetrics('database.query_time', oneHourAgo, now),
        this.getAggregatedMetrics('system.memory.heap_used', oneHourAgo, now),
        this.getAggregatedMetrics('system.cpu.user', oneHourAgo, now),
      ]);

    const activeAlerts = Array.from(this.alertStates.entries())
      .filter(([_, state]) => state.triggered)
      .map(([key, state]) => ({
        rule: key,
        since: new Date(state.since).toISOString(),
      }));

    return {
      apiMetrics,
      databaseMetrics,
      systemMetrics: {
        memory: memoryMetrics,
        cpu: cpuMetrics,
      },
      activeAlerts,
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Cleanup resources (for testing)
   */
  async cleanup(): Promise<void> {
    try {
      this.clearMetrics();
      this.alertStates.clear();

      // Clear metrics collection interval
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
        this.metricsCollectionInterval = null;
      }

      await redis.disconnect();
    } catch (error) {
      console.warn('Performance monitoring cleanup failed:', error);
    }
  }
}

// Middleware to measure API response times
export function performanceMiddleware() {
  const monitor = PerformanceMonitoringService.getInstance();

  return async (req: any, res: any, next: any) => {
    // Skip performance monitoring in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const start = performance.now();

    res.on('finish', async () => {
      try {
        const duration = performance.now() - start;
        await monitor.recordApiResponseTime(
          req.route?.path || req.path,
          req.method,
          res.statusCode,
          duration
        );
      } catch (error) {
        // Silently handle performance monitoring errors
        console.warn('Performance monitoring error:', error);
      }
    });

    next();
  };
}

export const performanceMonitor = PerformanceMonitoringService.getInstance();
