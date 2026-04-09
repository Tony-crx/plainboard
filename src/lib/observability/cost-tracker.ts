const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-instruct': { input: 0.0007, output: 0.0007 },
  'gemini-2.5-pro-exp': { input: 0, output: 0 }, 
  'mistral-nemo': { input: 0.00035, output: 0.00035 }
};

export class CostTracker {
  private totalCost: number = 0;
  private costByAgent: Map<string, number> = new Map();
  private costByModel: Map<string, number> = new Map();

  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    agentName: string
  ): void {
    const modelKey = Object.keys(MODEL_COSTS).find(k => model.includes(k)) || 'gemini-2.5-pro-exp';
    const costs = MODEL_COSTS[modelKey] || { input: 0, output: 0 };
    const cost = (inputTokens * costs.input + outputTokens * costs.output) / 1000;

    this.totalCost += cost;

    const agentCost = this.costByAgent.get(agentName) || 0;
    this.costByAgent.set(agentName, agentCost + cost);

    const modelCost = this.costByModel.get(model) || 0;
    this.costByModel.set(model, modelCost + cost);
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getCostByAgent(agentName: string): number {
    return this.costByAgent.get(agentName) || 0;
  }

  getCostByModel(model: string): number {
    return this.costByModel.get(model) || 0;
  }

  getBreakdown(): {
    total: number;
    byAgent: Map<string, number>;
    byModel: Map<string, number>;
  } {
    return {
      total: this.totalCost,
      byAgent: this.costByAgent,
      byModel: this.costByModel
    };
  }
}

export const globalCostTracker = new CostTracker();
