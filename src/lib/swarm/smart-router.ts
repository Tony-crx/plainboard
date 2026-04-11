// Smart Router -- auto-learn which agent handles which task best
// Tracks handoff success rates and suggests optimal routing

import { Message } from '@/lib/swarm/types';

export interface RoutingRecord {
  id: string;
  promptKeywords: string[];
  suggestedAgent: string;
  actualAgent: string;
  successScore: number; // 0-1 (based on completion, no errors, no re-routing)
  turnCount: number;
  tokenUsage: number;
  timestamp: number;
}

class SmartRouter {
  private records: RoutingRecord[] = [];
  private agentScores: Map<string, Map<string, number>> = new Map(); // keyword -> agent -> score
  private maxRecords = 1000;

  recordOutcome(
    prompt: string,
    suggestedAgent: string,
    actualAgent: string,
    successScore: number,
    turnCount: number,
    tokenUsage: number
  ): void {
    const keywords = this.extractKeywords(prompt);

    const record: RoutingRecord = {
      id: crypto.randomUUID(),
      promptKeywords: keywords,
      suggestedAgent,
      actualAgent,
      successScore,
      turnCount,
      tokenUsage,
      timestamp: Date.now(),
    };

    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    // Update keyword -> agent scores
    for (const kw of keywords) {
      if (!this.agentScores.has(kw)) {
        this.agentScores.set(kw, new Map());
      }
      const agentScoreMap = this.agentScores.get(kw)!;
      const prevScore = agentScoreMap.get(actualAgent) || 0.5;
      // Exponential moving average
      const newScore = 0.3 * successScore + 0.7 * prevScore;
      agentScoreMap.set(actualAgent, newScore);
    }
  }

  suggestAgent(prompt: string, availableAgents: string[]): string {
    const keywords = this.extractKeywords(prompt);

    if (keywords.length === 0) {
      return availableAgents[0] || 'Triage';
    }

    // Score each agent based on keyword history
    const agentScores = new Map<string, number>();

    for (const agent of availableAgents) {
      let totalScore = 0;
      let keywordCount = 0;

      for (const kw of keywords) {
        const agentMap = this.agentScores.get(kw);
        if (agentMap && agentMap.has(agent)) {
          totalScore += agentMap.get(agent)!;
          keywordCount++;
        }
      }

      if (keywordCount > 0) {
        agentScores.set(agent, totalScore / keywordCount);
      }
    }

    // Return highest scoring agent
    let bestAgent = availableAgents[0] || 'Triage';
    let bestScore = -1;

    for (const [agent, score] of agentScores) {
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  getConfidence(prompt: string, agent: string): number {
    const keywords = this.extractKeywords(prompt);
    if (keywords.length === 0) return 0.5;

    const agentMap = this.agentScores.get(keywords[0]);
    if (!agentMap) return 0.5;
    return agentMap.get(agent) || 0.5;
  }

  getStatistics(): {
    totalRouting: number;
    avgSuccessScore: number;
    avgTurnCount: number;
    bestAgents: Array<{ agent: string; avgScore: number; count: number }>;
  } {
    if (this.records.length === 0) {
      return { totalRouting: 0, avgSuccessScore: 0, avgTurnCount: 0, bestAgents: [] };
    }

    const avgSuccessScore = this.records.reduce((s, r) => s + r.successScore, 0) / this.records.length;
    const avgTurnCount = this.records.reduce((s, r) => s + r.turnCount, 0) / this.records.length;

    // Best agents
    const agentStats = new Map<string, { totalScore: number; count: number }>();
    for (const record of this.records) {
      const stats = agentStats.get(record.actualAgent) || { totalScore: 0, count: 0 };
      stats.totalScore += record.successScore;
      stats.count++;
      agentStats.set(record.actualAgent, stats);
    }

    const bestAgents = Array.from(agentStats.entries())
      .map(([agent, stats]) => ({
        agent,
        avgScore: stats.totalScore / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalRouting: this.records.length,
      avgSuccessScore,
      avgTurnCount,
      bestAgents,
    };
  }

  getRecords(limit = 50): RoutingRecord[] {
    return this.records.slice(-limit);
  }

  clear(): void {
    this.records = [];
    this.agentScores.clear();
  }

  private extractKeywords(prompt: string): string[] {
    // Simple keyword extraction: lowercase, remove stop words
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their']);

    return prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }
}

export const globalSmartRouter = new SmartRouter();
