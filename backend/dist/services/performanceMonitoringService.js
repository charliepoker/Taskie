"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.PerformanceMonitoringService = void 0;
exports.performanceMiddleware = performanceMiddleware;
const redis_1 = require("redis");
const perf_hooks_1 = require("perf_hooks");
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
redis.connect().catch(console.error);
class PerformanceMonitoringService {
    static getInstance() {
        if (!PerformanceMonitoringService.instance) {
            PerformanceMonitoringService.instance =
                new PerformanceMonitoringService();
        }
        return PerformanceMonitoringService.instance;
    }
    constructor() {
        this.metrics = new Map();
        this.alertRules = [];
        this.alertStates = new Map();
        this.initializeDefaultAlerts();
        this.startMetricsCollection();
    }
    async recordMetric(metric) {
        try {
            if (!this.metrics.has(metric.name)) {
                this.metrics.set(metric.name, []);
            }
            const metricArray = this.metrics.get(metric.name);
            metricArray.push(metric);
            if (metricArray.length > 1000) {
                metricArray.shift();
            }
            const key = `metrics:${metric.name}`;
            await redis.zadd(key, metric.timestamp, JSON.stringify(metric));
            await redis.expire(key, 86400);
            this.checkAlerts(metric);
        }
        catch (error) {
            console.error('Error recording metric:', error);
        }
    }
    async recordApiResponseTime(endpoint, method, statusCode, responseTime) {
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
    async recordDatabaseQueryTime(query, duration, success) {
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
    async recordMemoryUsage() {
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
    async recordCpuUsage() {
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
    async getMetrics(metricName, startTime, endTime) {
        try {
            const key = `metrics:${metricName}`;
            const results = await redis.zrangebyscore(key, startTime, endTime);
            if (!Array.isArray(results)) {
                return [];
            }
            return results
                .filter((result) => typeof result === 'string')
                .map((result) => JSON.parse(result));
        }
        catch (error) {
            console.error('Error getting metrics:', error);
            return [];
        }
    }
    async getAggregatedMetrics(metricName, startTime, endTime) {
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
    addAlertRule(rule) {
        this.alertRules.push(rule);
    }
    checkAlerts(metric) {
        const relevantRules = this.alertRules.filter((rule) => rule.enabled && rule.metricName === metric.name);
        for (const rule of relevantRules) {
            const alertKey = `${rule.metricName}_${rule.threshold}_${rule.operator}`;
            const currentState = this.alertStates.get(alertKey) || {
                triggered: false,
                since: 0,
            };
            const shouldTrigger = this.evaluateAlertCondition(metric.value, rule);
            if (shouldTrigger && !currentState.triggered) {
                this.alertStates.set(alertKey, { triggered: true, since: Date.now() });
                this.sendAlert(rule, metric);
            }
            else if (!shouldTrigger && currentState.triggered) {
                this.alertStates.set(alertKey, { triggered: false, since: 0 });
                this.sendAlertResolved(rule, metric);
            }
        }
    }
    evaluateAlertCondition(value, rule) {
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
    sendAlert(rule, metric) {
        console.warn(`🚨 ALERT: ${rule.metricName} ${rule.operator} ${rule.threshold}`, {
            currentValue: metric.value,
            timestamp: new Date(metric.timestamp).toISOString(),
            tags: metric.tags,
        });
    }
    sendAlertResolved(rule, metric) {
        console.info(`✅ RESOLVED: ${rule.metricName} alert resolved`, {
            currentValue: metric.value,
            timestamp: new Date(metric.timestamp).toISOString(),
        });
    }
    initializeDefaultAlerts() {
        this.addAlertRule({
            metricName: 'api.response_time',
            threshold: 5000,
            operator: 'gt',
            duration: 60,
            enabled: true,
        });
        this.addAlertRule({
            metricName: 'database.query_time',
            threshold: 10000,
            operator: 'gt',
            duration: 30,
            enabled: true,
        });
        this.addAlertRule({
            metricName: 'system.memory.heap_used',
            threshold: 1024 * 1024 * 1024,
            operator: 'gt',
            duration: 300,
            enabled: true,
        });
    }
    startMetricsCollection() {
        setInterval(async () => {
            await this.recordMemoryUsage();
            await this.recordCpuUsage();
        }, 30000);
    }
    extractQueryType(query) {
        const trimmed = query.trim().toLowerCase();
        if (trimmed.startsWith('select'))
            return 'SELECT';
        if (trimmed.startsWith('insert'))
            return 'INSERT';
        if (trimmed.startsWith('update'))
            return 'UPDATE';
        if (trimmed.startsWith('delete'))
            return 'DELETE';
        return 'OTHER';
    }
    async getDashboardData() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const [apiMetrics, databaseMetrics, memoryMetrics, cpuMetrics] = await Promise.all([
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
    clearMetrics() {
        this.metrics.clear();
    }
}
exports.PerformanceMonitoringService = PerformanceMonitoringService;
function performanceMiddleware() {
    const monitor = PerformanceMonitoringService.getInstance();
    return async (req, res, next) => {
        const start = perf_hooks_1.performance.now();
        res.on('finish', async () => {
            const duration = perf_hooks_1.performance.now() - start;
            await monitor.recordApiResponseTime(req.route?.path || req.path, req.method, res.statusCode, duration);
        });
        next();
    };
}
exports.performanceMonitor = PerformanceMonitoringService.getInstance();
//# sourceMappingURL=performanceMonitoringService.js.map