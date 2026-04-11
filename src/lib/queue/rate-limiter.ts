// Rate Limiter -- per-user, per-session request throttling

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxConcurrentRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 30,
  maxRequestsPerHour: 200,
  maxConcurrentRequests: 3,
};

interface RequestRecord {
  timestamp: number;
  sessionId: string;
}

class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map(); // userId -> requests
  private concurrent: Map<string, number> = new Map();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  canProceed(userId: string, sessionId: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Clean old requests
    const recentRequests = userRequests.filter(r => now - r.timestamp < 3600000);
    this.requests.set(userId, recentRequests);

    // Check concurrent limit
    const currentConcurrent = this.concurrent.get(userId) || 0;
    if (currentConcurrent >= this.config.maxConcurrentRequests) {
      return { allowed: false, reason: 'Too many concurrent requests', retryAfter: 5000 };
    }

    // Check per-minute limit
    const minuteRequests = recentRequests.filter(r => now - r.timestamp < 60000);
    if (minuteRequests.length >= this.config.maxRequestsPerMinute) {
      const oldestInMinute = minuteRequests[0].timestamp;
      const retryAfter = 60000 - (now - oldestInMinute);
      return { allowed: false, reason: 'Rate limit exceeded (per minute)', retryAfter };
    }

    // Check per-hour limit
    if (recentRequests.length >= this.config.maxRequestsPerHour) {
      const oldest = recentRequests[0].timestamp;
      const retryAfter = 3600000 - (now - oldest);
      return { allowed: false, reason: 'Rate limit exceeded (per hour)', retryAfter };
    }

    return { allowed: true };
  }

  startRequest(userId: string, sessionId: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    userRequests.push({ timestamp: now, sessionId });
    this.requests.set(userId, userRequests);

    const concurrent = this.concurrent.get(userId) || 0;
    this.concurrent.set(userId, concurrent + 1);
  }

  endRequest(userId: string): void {
    const concurrent = this.concurrent.get(userId) || 1;
    this.concurrent.set(userId, Math.max(0, concurrent - 1));
  }

  getStats(userId: string): {
    requestsThisMinute: number;
    requestsThisHour: number;
    concurrentRequests: number;
  } {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(r => now - r.timestamp < 3600000);
    const minuteRequests = recentRequests.filter(r => now - r.timestamp < 60000);

    return {
      requestsThisMinute: minuteRequests.length,
      requestsThisHour: recentRequests.length,
      concurrentRequests: this.concurrent.get(userId) || 0,
    };
  }

  reset(userId: string): void {
    this.requests.delete(userId);
    this.concurrent.delete(userId);
  }
}

export const globalRateLimiter = new RateLimiter();
