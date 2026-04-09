export class AgentError extends Error {
  constructor(
    message: string,
    public readonly agentName: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class RateLimitError extends AgentError {
  constructor(agentName: string, public readonly retryAfter: number) {
    super('Rate limit exceeded', agentName, 'RATE_LIMIT', true);
  }
}

export class ModelError extends AgentError {
  constructor(agentName: string, message: string) {
    super(message, agentName, 'MODEL_ERROR', false);
  }
}

export class TimeoutError extends AgentError {
  constructor(agentName: string) {
    super('Request timeout', agentName, 'TIMEOUT', true);
  }
}
