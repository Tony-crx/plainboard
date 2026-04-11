// Context-Aware Delegation -- learn from past handoffs to improve routing
// Tracks which handoff patterns lead to successful task completion

export interface DelegationRecord {
  id: string;
  fromAgent: string;
  toAgent: string;
  promptSnippet: string;
  handoffReason: string;
  taskCompleted: boolean;
  turnsAfterHandoff: number;
  timestamp: number;
}

class ContextAwareDelegator {
  private records: DelegationRecord[] = [];
  private patterns: Map<string, { toAgent: string; successRate: number; count: number }> = new Map();
  private maxRecords = 500;

  recordDelegation(
    fromAgent: string,
    toAgent: string,
    promptSnippet: string,
    handoffReason: string,
    taskCompleted: boolean,
    turnsAfterHandoff: number
  ): void {
    const record: DelegationRecord = {
      id: crypto.randomUUID(),
      fromAgent,
      toAgent,
      promptSnippet: promptSnippet.substring(0, 200),
      handoffReason,
      taskCompleted,
      turnsAfterHandoff,
      timestamp: Date.now(),
    };

    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    // Update pattern stats
    const patternKey = this.extractPattern(promptSnippet);
    const existing = this.patterns.get(patternKey) || { toAgent, successRate: 0.5, count: 0 };
    existing.count++;
    existing.toAgent = toAgent;
    // Moving average
    existing.successRate = 0.3 * (taskCompleted ? 1 : 0) + 0.7 * existing.successRate;
    this.patterns.set(patternKey, existing);
  }

  suggestTarget(prompt: string, availableAgents: string[]): { agent: string; confidence: number } {
    const pattern = this.extractPattern(prompt);
    const patternData = this.patterns.get(pattern);

    if (!patternData || patternData.count < 3) {
      return { agent: availableAgents[0] || 'Coordinator', confidence: 0.5 };
    }

    return {
      agent: patternData.toAgent,
      confidence: patternData.successRate,
    };
  }

  getStats(): {
    totalDelegations: number;
    overallSuccessRate: number;
    avgTurnsAfterHandoff: number;
    topPatterns: Array<{ pattern: string; agent: string; successRate: number; count: number }>;
  } {
    if (this.records.length === 0) {
      return { totalDelegations: 0, overallSuccessRate: 0, avgTurnsAfterHandoff: 0, topPatterns: [] };
    }

    const successRate = this.records.filter(r => r.taskCompleted).length / this.records.length;
    const avgTurns = this.records.reduce((s, r) => s + r.turnsAfterHandoff, 0) / this.records.length;

    const topPatterns = Array.from(this.patterns.entries())
      .map(([pattern, data]) => ({ pattern, agent: data.toAgent, successRate: data.successRate, count: data.count }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      totalDelegations: this.records.length,
      overallSuccessRate: successRate,
      avgTurnsAfterHandoff: avgTurns,
      topPatterns,
    };
  }

  private extractPattern(prompt: string): string {
    // Extract first 3 meaningful words as pattern key
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3);
    return words.join(' ');
  }
}

export const globalContextAwareDelegator = new ContextAwareDelegator();
