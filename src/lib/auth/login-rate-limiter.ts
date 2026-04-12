// Login-specific rate limiter to prevent brute force attacks

interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

class LoginRateLimiter {
  private attempts: Map<string, LoginAttempt[]> = new Map(); // IP -> attempts
  private readonly windowMs: number;
  private readonly maxAttempts: number;
  private readonly blockDurationMs: number;

  constructor(windowMs = 60000, maxAttempts = 5, blockDurationMs = 300000) {
    this.windowMs = windowMs; // 1 minute window
    this.maxAttempts = maxAttempts; // 5 attempts
    this.blockDurationMs = blockDurationMs; // 5 minute block
  }

  isBlocked(ip: string): { blocked: boolean; retryAfter?: number } {
    const now = Date.now();
    const userAttempts = this.attempts.get(ip) || [];

    // Check if currently blocked
    const recentFailures = userAttempts.filter(
      a => !a.success && now - a.timestamp < this.blockDurationMs
    );

    if (recentFailures.length >= this.maxAttempts) {
      const oldestFailure = recentFailures[0].timestamp;
      const retryAfter = this.blockDurationMs - (now - oldestFailure);
      return { blocked: true, retryAfter: Math.ceil(retryAfter / 1000) };
    }

    return { blocked: false };
  }

  recordAttempt(ip: string, success: boolean): void {
    const now = Date.now();
    const userAttempts = this.attempts.get(ip) || [];
    userAttempts.push({ timestamp: now, success });

    // Clean old attempts (keep only last hour)
    const recentAttempts = userAttempts.filter(a => now - a.timestamp < 3600000);
    this.attempts.set(ip, recentAttempts);
  }

  reset(ip: string): void {
    this.attempts.delete(ip);
  }
}

export const loginRateLimiter = new LoginRateLimiter();
