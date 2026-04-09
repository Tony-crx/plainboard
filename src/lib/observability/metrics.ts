interface MetricData {
  count: number;
  sum: number;
  min: number;
  max: number;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();

  record(metricName: string, value: number): void {
    const existing = this.metrics.get(metricName);

    if (existing) {
      existing.count++;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
    } else {
      this.metrics.set(metricName, {
        count: 1,
        sum: value,
        min: value,
        max: value
      });
    }
  }

  getMetrics(metricName: string): MetricData | undefined {
    return this.metrics.get(metricName);
  }

  getAllMetrics(): Map<string, MetricData> {
    return new Map(this.metrics);
  }

  getAverage(metricName: string): number | undefined {
    const metric = this.metrics.get(metricName);
    return metric ? metric.sum / metric.count : undefined;
  }
}

export const globalMetrics = new MetricsCollector();
