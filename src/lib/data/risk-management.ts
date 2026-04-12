// Risk Management Dashboard
// Portfolio VaR, Beta-weighted exposure, Stress tests, Max drawdown

export interface RiskMetrics {
  portfolioValue: number;
  dailyVaR95: number;
  dailyVaR99: number;
  betaWeightedExposure: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  correlation: number;
}

export interface StressTestScenario {
  name: string;
  description: string;
  impact: number;
  portfolioLoss: number;
  worstSector: string;
  recoveryTime: string;
}

export const STRESS_TEST_SCENARIOS: StressTestScenario[] = [
  { name: '2008 Crisis', description: 'Global Financial Crisis', impact: -45, portfolioLoss: -28500000000, worstSector: 'Banking', recoveryTime: '18 months' },
  { name: '2020 Pandemic', description: 'COVID-19 Market Crash', impact: -35, portfolioLoss: -22100000000, worstSector: 'Consumer Goods', recoveryTime: '8 months' },
  { name: '2015 China Slowdown', description: 'Chinese Economic Slowdown', impact: -15, portfolioLoss: -9500000000, worstSector: 'Materials', recoveryTime: '6 months' },
  { name: '2013 Taper Tantrum', description: 'Fed QE Tapering', impact: -20, portfolioLoss: -12600000000, worstSector: 'Finance', recoveryTime: '10 months' },
  { name: 'Rate Hike +2%', description: 'BI Rate increases 200bps', impact: -12, portfolioLoss: -7600000000, worstSector: 'Property', recoveryTime: '12 months' },
];

export function calculateVaR(portfolioValue: number, volatility: number, confidence: number): number {
  const zScore = confidence === 0.95 ? 1.645 : 1.96;
  return portfolioValue * volatility * zScore / Math.sqrt(252);
}

export function calculateMaxDrawdown(values: number[]): { drawdown: number; peakDate: string; troughDate: string } {
  let peak = values[0];
  let maxDrawdown = 0;
  for (const value of values) {
    if (value > peak) peak = value;
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return { drawdown: maxDrawdown * 100, peakDate: 'N/A', troughDate: 'N/A' };
}

export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.05): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
  return stdDev > 0 ? (avgReturn - riskFreeRate / 252) / stdDev * Math.sqrt(252) : 0;
}
