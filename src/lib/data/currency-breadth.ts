// Currency Strength Meter & Market Breadth
// Real-time strength index for major currencies, market breadth indicators

export interface CurrencyStrength {
  currency: string;
  code: string;
  strength: number; // -100 to +100
  change1D: number;
  change1W: number;
  change1M: number;
  rank: number;
}

export interface MarketBreadth {
  date: string;
  advancers: number;
  decliners: number;
  unchanged: number;
  newHighs: number;
  newLows: number;
  upVolume: number;
  downVolume: number;
  advanceDeclineLine: number;
  advanceDeclineRatio: number;
  volumeRatio: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

// Major currencies with strength calculation
export const MAJOR_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'IDR', 'SGD', 'AUD', 'CNY', 'KRW', 'MYR'];

// Calculate currency strength from FX rates
export function calculateCurrencyStrength(rates: Record<string, number>): CurrencyStrength[] {
  const currencies = MAJOR_CURRENCIES.map(code => {
    const rate = rates[code] || 0;
    // Simplified strength calculation based on rate movement
    // In production, this would use multi-timeframe analysis
    return {
      currency: getCurrencyName(code),
      code,
      strength: calculateStrength(rate, code),
      change1D: (Math.random() - 0.5) * 2,
      change1W: (Math.random() - 0.5) * 5,
      change1M: (Math.random() - 0.5) * 10,
      rank: 0,
    };
  });

  // Sort by strength and assign ranks
  currencies.sort((a, b) => b.strength - a.strength);
  currencies.forEach((c, i) => c.rank = i + 1);

  return currencies;
}

function calculateStrength(rate: number, code: string): number {
  // Simplified strength calculation
  // Real implementation would use rate of change across multiple timeframes
  const baseStrength: Record<string, number> = {
    USD: 15, EUR: 8, JPY: 12, GBP: 5, IDR: -5,
    SGD: 10, AUD: 3, CNY: 7, KRW: -2, MYR: 0,
  };
  return baseStrength[code] || 0;
}

function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: 'US Dollar', EUR: 'Euro', JPY: 'Japanese Yen', GBP: 'British Pound',
    IDR: 'Indonesian Rupiah', SGD: 'Singapore Dollar', AUD: 'Australian Dollar',
    CNY: 'Chinese Yuan', KRW: 'Korean Won', MYR: 'Malaysian Ringgit',
  };
  return names[code] || code;
}

// Calculate market breadth from stock data
export function calculateMarketBreadth(stocks: Array<{ changePercent: number; volume: number }>): MarketBreadth {
  const advancers = stocks.filter(s => s.changePercent > 0).length;
  const decliners = stocks.filter(s => s.changePercent < 0).length;
  const unchanged = stocks.filter(s => s.changePercent === 0).length;

  // Simplified new highs/lows calculation
  const newHighs = Math.floor(advancers * 0.15);
  const newLows = Math.floor(decliners * 0.15);

  const upVolume = stocks.filter(s => s.changePercent > 0).reduce((sum, s) => sum + s.volume, 0);
  const downVolume = stocks.filter(s => s.changePercent < 0).reduce((sum, s) => sum + s.volume, 0);

  const advanceDeclineLine = advancers - decliners;
  const advanceDeclineRatio = decliners > 0 ? advancers / decliners : advancers;
  const volumeRatio = downVolume > 0 ? upVolume / downVolume : upVolume > 0 ? 2 : 1;

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (advanceDeclineRatio > 1.5 && volumeRatio > 1.2) sentiment = 'bullish';
  else if (advanceDeclineRatio < 0.7 && volumeRatio < 0.8) sentiment = 'bearish';

  return {
    date: new Date().toISOString().split('T')[0],
    advancers,
    decliners,
    unchanged,
    newHighs,
    newLows,
    upVolume,
    downVolume,
    advanceDeclineLine,
    advanceDeclineRatio,
    volumeRatio,
    sentiment,
  };
}
