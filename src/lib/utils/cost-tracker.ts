import { useEffect, useState } from 'react';

interface CostEntry {
  timestamp: number;
  agent: string;
  tokens: number;
  cost: number;
  model: string;
}

// Approximate costs per 1K tokens (varies by model)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3': { input: 0.008, output: 0.024 },
  'llama-3': { input: 0.0002, output: 0.0002 },
  'gemma': { input: 0.0001, output: 0.0001 },
  'mistral': { input: 0.0002, output: 0.0002 },
};

export function estimateCost(tokens: number, model: string, isOutput = false): number {
  const costModel = Object.entries(MODEL_COSTS).find(([key]) => model.includes(key));
  if (!costModel) return 0.0001 * (tokens / 1000); // Default fallback

  const rate = isOutput ? costModel[1].output : costModel[1].input;
  return (tokens / 1000) * rate;
}

export function useCostTracking(agentMemories: Record<string, any[]>) {
  const [costHistory, setCostHistory] = useState<CostEntry[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [todayCost, setTodayCost] = useState(0);

  useEffect(() => {
    let total = 0;
    let today = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const entries: CostEntry[] = [];

    Object.entries(agentMemories).forEach(([agent, messages]) => {
      messages.forEach(msg => {
        if (msg.role === 'assistant' && msg.content) {
          const tokens = msg.content.length / 4; // Rough estimate
          const model = msg.model || 'gpt-3.5-turbo';
          const cost = estimateCost(tokens, model, true);
          const timestamp = Date.now();

          total += cost;
          if (timestamp >= todayStart.getTime()) {
            today += cost;
          }

          entries.push({
            timestamp,
            agent,
            tokens: Math.round(tokens),
            cost,
            model
          });
        }
      });
    });

    setTotalCost(total);
    setTodayCost(today);
    setCostHistory(entries);
  }, [agentMemories]);

  return { totalCost, todayCost, costHistory };
}

interface BudgetAlert {
  limit: number;
  current: number;
  percentage: number;
}

export function checkBudget(currentCost: number, budgetLimit: number): BudgetAlert | null {
  if (budgetLimit <= 0) return null;

  const percentage = (currentCost / budgetLimit) * 100;
  
  if (percentage >= 90) {
    return { limit: budgetLimit, current: currentCost, percentage };
  }

  return null;
}
