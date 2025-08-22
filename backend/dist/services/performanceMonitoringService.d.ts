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
    duration: number;
    enabled: boolean;
}
export declare class PerformanceMonitoringService {
    private static instance;
    private metrics;
    private alertRules;
    private alertStates;
    static getInstance(): PerformanceMonitoringService;
    constructor();
    recordMetric(metric: PerformanceMetric): Promise<void>;
    recordApiResponseTime(endpoint: string, method: string, statusCode: number, responseTime: number): Promise<void>;
    recordDatabaseQueryTime(query: string, duration: number, success: boolean): Promise<void>;
    recordMemoryUsage(): Promise<void>;
    recordCpuUsage(): Promise<void>;
    getMetrics(metricName: string, startTime: number, endTime: number): Promise<PerformanceMetric[]>;
    getAggregatedMetrics(metricName: string, startTime: number, endTime: number): Promise<{
        avg: number;
        min: number;
        max: number;
        count: number;
        p95: number;
        p99: number;
    }>;
    addAlertRule(rule: AlertRule): void;
    private checkAlerts;
    private evaluateAlertCondition;
    private sendAlert;
    private sendAlertResolved;
    private initializeDefaultAlerts;
    private startMetricsCollection;
    private extractQueryType;
    getDashboardData(): Promise<{
        apiMetrics: any;
        databaseMetrics: any;
        systemMetrics: any;
        activeAlerts: any[];
    }>;
    clearMetrics(): void;
}
export declare function performanceMiddleware(): (req: any, res: any, next: any) => Promise<void>;
export declare const performanceMonitor: PerformanceMonitoringService;
//# sourceMappingURL=performanceMonitoringService.d.ts.map