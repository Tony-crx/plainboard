// Volatility Index (VIX) & Technical Analysis
// IDX volatility estimation, technical indicators, trading signals

export interface VolatilityData {
  date: string;
  value: number;
  change: number;
  level: 'low' | 'moderate' | 'high' | 'extreme';
  fearGreed: 'Fear' | 'Neutral' | 'Greed';
}

export interface TechnicalSignal {
  symbol: string;
  indicator: string;
  signal: 'buy' | 'sell' | 'neutral';
  value: number;
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface SupportResistance {
  symbol: string;
  support1: number;
  support2: number;
  support3: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  pivot: number;
}

// Historical VIX-like data for IDX (estimated from options)
export const IDX_VIX_HISTORY: VolatilityData[] = [
  { date: '2026-04-10', value: 18.5, change: -0.8, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-09', value: 19.3, change: 0.5, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-08', value: 18.8, change: -1.2, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-07', value: 20.0, change: 2.3, level: 'moderate', fearGreed: 'Fear' },
  { date: '2026-04-04', value: 17.7, change: -0.5, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-03', value: 18.2, change: 0.3, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-02', value: 17.9, change: -0.7, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-04-01', value: 18.6, change: 1.1, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-03-31', value: 17.5, change: -0.4, level: 'moderate', fearGreed: 'Neutral' },
  { date: '2026-03-28', value: 17.9, change: 0.6, level: 'moderate', fearGreed: 'Neutral' },
];

// Calculate volatility level
export function getVolatilityLevel(value: number): 'low' | 'moderate' | 'high' | 'extreme' {
  if (value < 15) return 'low';
  if (value < 25) return 'moderate';
  if (value < 35) return 'high';
  return 'extreme';
}

// Get fear/greed classification
export function getFearGreed(value: number): 'Fear' | 'Neutral' | 'Greed' {
  if (value > 25) return 'Fear';
  if (value < 15) return 'Greed';
  return 'Neutral';
}

// Technical indicators calculation
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0);
  const losses = recentChanges.filter(c => c < 0);

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0)) / period : 0.001;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // Signal line is 9-period EMA of MACD
  // Simplified: just return macd as signal for demo
  return {
    macd,
    signal: macd * 0.9,
    histogram: macd * 0.1,
  };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;

  const squaredDiffs = slice.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: middle + (stdDev * std),
    middle,
    lower: middle - (stdDev * std),
  };
}

// Calculate support/resistance using pivot points
export function calculatePivotPoints(high: number, low: number, close: number): SupportResistance {
  const pivot = (high + low + close) / 3;
  const range = high - low;

  return {
    symbol: '',
    support1: (2 * pivot) - high,
    support2: pivot - range,
    support3: low - 2 * (high - pivot),
    resistance1: (2 * pivot) - low,
    resistance2: pivot + range,
    resistance3: high + 2 * (pivot - low),
    pivot,
  };
}

// Generate technical signals
export function generateTechnicalSignals(
  symbol: string,
  price: number,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  bollinger: { upper: number; middle: number; lower: number }
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];

  // RSI signals
  if (rsi < 30) {
    signals.push({ symbol, indicator: 'RSI', signal: 'buy', value: rsi, description: 'RSI oversold', strength: 'strong' });
  } else if (rsi > 70) {
    signals.push({ symbol, indicator: 'RSI', signal: 'sell', value: rsi, description: 'RSI overbought', strength: 'strong' });
  } else {
    signals.push({ symbol, indicator: 'RSI', signal: 'neutral', value: rsi, description: 'RSI neutral', strength: 'weak' });
  }

  // MACD signals
  if (macd.histogram > 0) {
    signals.push({ symbol, indicator: 'MACD', signal: 'buy', value: macd.macd, description: 'MACD bullish crossover', strength: 'moderate' });
  } else {
    signals.push({ symbol, indicator: 'MACD', signal: 'sell', value: macd.macd, description: 'MACD bearish crossover', strength: 'moderate' });
  }

  // Bollinger Bands signals
  if (price <= bollinger.lower) {
    signals.push({ symbol, indicator: 'BB', signal: 'buy', value: price, description: 'Price below lower band', strength: 'strong' });
  } else if (price >= bollinger.upper) {
    signals.push({ symbol, indicator: 'BB', signal: 'sell', value: price, description: 'Price above upper band', strength: 'strong' });
  } else {
    signals.push({ symbol, indicator: 'BB', signal: 'neutral', value: price, description: 'Price within bands', strength: 'weak' });
  }

  return signals;
}
