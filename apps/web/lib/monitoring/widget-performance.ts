/**
 * UltimateWidget Performance Monitoring
 * 
 * Tracks widget-specific performance metrics and enforces SLO budgets.
 * Integrates with the main telemetry system.
 */

interface WidgetPerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface WidgetPerformanceConfig {
  enableLogging: boolean;
  enableTelemetry: boolean;
  sampleRate: number;
  budgets: {
    initTime: number;
    mountTime: number;
    postMessageLatency: number;
  };
}

class WidgetPerformanceMonitor {
  private config: WidgetPerformanceConfig;
  private metrics: WidgetPerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();

  constructor(config: Partial<WidgetPerformanceConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableTelemetry: true,
      sampleRate: 1.0,
      budgets: {
        initTime: 400,      // SLO: widget init < 400ms
        mountTime: 300,     // SLO: widget mount < 300ms
        postMessageLatency: 200, // SLO: postMessage < 200ms
      },
      ...config,
    };
  }

  /**
   * Start timing a widget operation
   */
  startTiming(operation: string): void {
    this.startTimes.set(operation, performance.now());
    
    if (this.config.enableLogging) {
      console.debug(`[WIDGET-PERF] Started timing: ${operation}`);
    }
  }

  /**
   * End timing and record metric
   */
  endTiming(operation: string, context?: Record<string, any>): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`[WIDGET-PERF] No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);

    // Record the metric
    this.recordMetric({
      name: operation,
      value: duration,
      timestamp: Date.now(),
      context,
    });

    // Check against budget
    this.checkBudget(operation, duration);

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: WidgetPerformanceMetric): void {
    // Sample based on configuration
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.metrics.push(metric);

    if (this.config.enableLogging) {
      console.debug(`[WIDGET-PERF] Recorded metric:`, metric);
    }

    // Send to telemetry if enabled
    if (this.config.enableTelemetry && typeof window !== 'undefined') {
      this.sendToTelemetry(metric);
    }

    // Trim old metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Check if metric violates budget
   */
  private checkBudget(operation: string, value: number): void {
    const budgetKey = this.getBudgetKey(operation);
    const budget = this.config.budgets[budgetKey as keyof typeof this.config.budgets];
    
    if (!budget) return;

    if (value > budget) {
      const violation = {
        operation,
        value: Math.round(value),
        budget,
        severity: value > budget * 1.5 ? 'critical' : 'warning',
      };

      console.warn(`[WIDGET-PERF] Budget violation:`, violation);

      // Send violation to telemetry
      if (this.config.enableTelemetry) {
        this.sendToTelemetry({
          name: 'budget_violation',
          value,
          timestamp: Date.now(),
          context: violation,
        });
      }
    }
  }

  /**
   * Map operation names to budget keys
   */
  private getBudgetKey(operation: string): string {
    const mapping: Record<string, string> = {
      'widget_init': 'initTime',
      'widget_mount': 'mountTime',
      'postmessage_roundtrip': 'postMessageLatency',
    };
    
    return mapping[operation] || operation;
  }

  /**
   * Send metric to telemetry endpoint
   */
  private sendToTelemetry(metric: WidgetPerformanceMetric): void {
    const payload = {
      metric: `widget_${metric.name}`,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.value,
      id: `widget-${metric.name}-${Date.now()}`,
      url: window.location.href,
      timestamp: metric.timestamp,
      context: metric.context,
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry/vitals', JSON.stringify(payload));
    } else {
      fetch('/api/telemetry/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => {
        console.debug('[WIDGET-PERF] Failed to send telemetry:', err);
      });
    }
  }

  /**
   * Get performance rating based on thresholds
   */
  private getRating(operation: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const budgetKey = this.getBudgetKey(operation);
    const budget = this.config.budgets[budgetKey as keyof typeof this.config.budgets];
    
    if (!budget) return 'good';

    if (value <= budget) return 'good';
    if (value <= budget * 1.5) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    for (const [name, values] of Object.entries(grouped)) {
      if (values.length === 0) continue;

      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.startTimes.clear();
  }
}

// Global instance
let widgetPerformanceMonitor: WidgetPerformanceMonitor | null = null;

/**
 * Get or create the global widget performance monitor
 */
export function getWidgetPerformanceMonitor(config?: Partial<WidgetPerformanceConfig>): WidgetPerformanceMonitor {
  if (!widgetPerformanceMonitor) {
    widgetPerformanceMonitor = new WidgetPerformanceMonitor(config);
  }
  return widgetPerformanceMonitor;
}

/**
 * Convenience functions for common widget operations
 */
export const widgetPerf = {
  startInit: () => getWidgetPerformanceMonitor().startTiming('widget_init'),
  endInit: (context?: Record<string, any>) => getWidgetPerformanceMonitor().endTiming('widget_init', context),
  
  startMount: () => getWidgetPerformanceMonitor().startTiming('widget_mount'),
  endMount: (context?: Record<string, any>) => getWidgetPerformanceMonitor().endTiming('widget_mount', context),
  
  measurePostMessage: (startTime: number) => {
    const latency = performance.now() - startTime;
    getWidgetPerformanceMonitor().recordMetric({
      name: 'postmessage_roundtrip',
      value: latency,
      timestamp: Date.now(),
    });
    return latency;
  },
  
  recordCustom: (name: string, value: number, context?: Record<string, any>) => {
    getWidgetPerformanceMonitor().recordMetric({
      name,
      value,
      timestamp: Date.now(),
      context,
    });
  },
  
  getSummary: () => getWidgetPerformanceMonitor().getSummary(),
  clear: () => getWidgetPerformanceMonitor().clear(),
};

// Export types
export type { WidgetPerformanceMetric, WidgetPerformanceConfig };
