import { TaskProgress } from './types';

const MAX_RECENT_ACTIVITIES = 5;

export class ProgressTracker {
  private progress: TaskProgress;

  constructor(agentName: string) {
    const now = Date.now();
    this.progress = {
      toolCallCount: 0,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      recentActivities: [],
      lastActivityAt: now,
      startedAt: now,
    };
  }

  getProgress(): TaskProgress {
    return { ...this.progress };
  }

  recordToolCall(toolName: string): void {
    this.progress.toolCallCount++;
    this.progress.lastActivityAt = Date.now();
    this.addActivity(`Called tool: ${toolName}`);
  }

  recordTokenUsage(promptTokens: number, completionTokens: number): void {
    this.progress.tokenUsage.promptTokens += promptTokens;
    this.progress.tokenUsage.completionTokens += completionTokens;
    this.progress.tokenUsage.totalTokens =
      this.progress.tokenUsage.promptTokens + this.progress.tokenUsage.completionTokens;
  }

  addActivity(description: string): void {
    this.progress.recentActivities.push(description);
    if (this.progress.recentActivities.length > MAX_RECENT_ACTIVITIES) {
      this.progress.recentActivities.shift();
    }
    this.progress.lastActivityAt = Date.now();
  }

  markComplete(): void {
    this.progress.completedAt = Date.now();
  }

  updateFromMessage(tokenUsage?: { promptTokens: number; completionTokens: number }): void {
    if (tokenUsage) {
      this.recordTokenUsage(tokenUsage.promptTokens, tokenUsage.completionTokens);
    }
  }
}
