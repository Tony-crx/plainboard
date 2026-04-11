// Health Checks -- monitor LLM API uptime and auto-switch providers

export interface HealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: number;
  responseTime: number;
  successRate: number;
  consecutiveFailures: number;
}

class HealthMonitor {
  private status: Map<string, HealthStatus> = new Map();
  private failureThreshold = 3;
  private checkInterval = 30000;

  async checkHealth(provider: string, checkFn: () => Promise<number>): Promise<HealthStatus> {
    const existing = this.status.get(provider) || {
      provider,
      status: 'healthy',
      lastCheck: 0,
      responseTime: 0,
      successRate: 1,
      consecutiveFailures: 0,
    };

    try {
      const startTime = Date.now();
      await checkFn();
      const responseTime = Date.now() - startTime;

      existing.consecutiveFailures = 0;
      existing.successRate = Math.min(1, existing.successRate + 0.1);
      existing.responseTime = existing.responseTime * 0.8 + responseTime * 0.2;
      existing.status = existing.successRate > 0.7 ? 'healthy' : 'degraded';
      existing.lastCheck = Date.now();
    } catch {
      existing.consecutiveFailures++;
      existing.successRate = Math.max(0, existing.successRate - 0.2);
      existing.lastCheck = Date.now();

      if (existing.consecutiveFailures >= this.failureThreshold) {
        existing.status = 'down';
      } else if (existing.successRate < 0.7) {
        existing.status = 'degraded';
      }
    }

    this.status.set(provider, existing);
    return existing;
  }

  getStatus(provider: string): HealthStatus {
    return this.status.get(provider) || {
      provider,
      status: 'healthy',
      lastCheck: 0,
      responseTime: 0,
      successRate: 1,
      consecutiveFailures: 0,
    };
  }

  getAllStatus(): HealthStatus[] {
    return Array.from(this.status.values());
  }

  getHealthyProviders(): string[] {
    return Array.from(this.status.values())
      .filter(s => s.status === 'healthy' || s.status === 'degraded')
      .map(s => s.provider);
  }

  isProviderHealthy(provider: string): boolean {
    const status = this.getStatus(provider);
    return status.status !== 'down';
  }

  recordSuccess(provider: string): void {
    const existing = this.status.get(provider);
    if (existing) {
      existing.consecutiveFailures = Math.max(0, existing.consecutiveFailures - 1);
      existing.successRate = Math.min(1, existing.successRate + 0.05);
    }
  }

  recordFailure(provider: string): void {
    const existing = this.status.get(provider);
    if (existing) {
      existing.consecutiveFailures++;
      existing.successRate = Math.max(0, existing.successRate - 0.1);
      if (existing.consecutiveFailures >= this.failureThreshold) {
        existing.status = 'down';
      }
    }
  }
}

export const globalHealthMonitor = new HealthMonitor();
