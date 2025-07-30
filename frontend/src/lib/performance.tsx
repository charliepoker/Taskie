import React from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    this.recordMetric(`render.${componentName}`, end - start);
  }

  // Measure API call duration
  async measureApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      this.recordMetric(`api.${endpoint}`, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      this.recordMetric(`api.${endpoint}.error`, end - start);
      throw error;
    }
  }

  // Record custom metrics
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements to prevent memory leaks
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get performance statistics
  getStats(metricName: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) return null;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  // Get all metrics
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Log performance report to console (development only)
  logReport(): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🚀 Performance Report');
    const stats = this.getAllStats();

    Object.entries(stats).forEach(([name, stat]) => {
      if (stat) {
        console.log(
          `${name}: avg=${stat.avg.toFixed(2)}ms, min=${stat.min.toFixed(2)}ms, max=${stat.max.toFixed(2)}ms (${stat.count} samples)`
        );
      }
    });
    console.groupEnd();
  }
}

// Web Vitals monitoring
export function measureWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Measure Core Web Vitals
  const observer = new PerformanceObserver(list => {
    const monitor = PerformanceMonitor.getInstance();

    for (const entry of list.getEntries()) {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          monitor.recordMetric('webvitals.lcp', entry.startTime);
          break;
        case 'first-input':
          monitor.recordMetric(
            'webvitals.fid',
            (entry as any).processingStart - entry.startTime
          );
          break;
        case 'layout-shift':
          if (!(entry as any).hadRecentInput) {
            monitor.recordMetric('webvitals.cls', (entry as any).value);
          }
          break;
      }
    }
  });

  // Observe Core Web Vitals
  try {
    observer.observe({
      entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
    });
  } catch (e) {
    // Fallback for browsers that don't support all entry types
    console.warn('Some performance metrics not supported in this browser');
  }

  // Measure navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    const monitor = PerformanceMonitor.getInstance();

    monitor.recordMetric(
      'navigation.domContentLoaded',
      navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart
    );
    monitor.recordMetric(
      'navigation.load',
      navigation.loadEventEnd - navigation.loadEventStart
    );
    monitor.recordMetric(
      'navigation.ttfb',
      navigation.responseStart - navigation.requestStart
    );
  });
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  return {
    measureRender: monitor.measureRender.bind(monitor),
    measureApiCall: monitor.measureApiCall.bind(monitor),
    recordMetric: monitor.recordMetric.bind(monitor),
    getStats: monitor.getStats.bind(monitor),
    getAllStats: monitor.getAllStats.bind(monitor),
    logReport: monitor.logReport.bind(monitor),
  };
}

// HOC for measuring component performance
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const monitor = PerformanceMonitor.getInstance();

    React.useEffect(() => {
      const start = performance.now();
      return () => {
        const end = performance.now();
        monitor.recordMetric(`component.${componentName}.mount`, end - start);
      };
    }, [monitor]);

    return <WrappedComponent {...props} />;
  };
}

// Initialize performance monitoring
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  measureWebVitals();
}
