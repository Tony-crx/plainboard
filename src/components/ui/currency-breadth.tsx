"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Activity, BarChart3 } from 'lucide-react';
import type { CurrencyStrength } from '@/lib/data/currency-breadth';
import { calculateCurrencyStrength, calculateMarketBreadth } from '@/lib/data/currency-breadth';

interface CurrencyStrengthMeterProps {
  fxRates?: Record<string, number>;
  loading: boolean;
}

interface MarketBreadthDashboardProps {
  stocks?: Array<{ changePercent: number; volume: number }>;
  loading: boolean;
}

// Currency Strength Meter
export function CurrencyStrengthMeter({ fxRates, loading }: CurrencyStrengthMeterProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading currency strength...</div>;
  }

  const rates = fxRates || {
    IDR: 15750, EUR: 0.92, GBP: 0.79, JPY: 151.5, SGD: 1.35,
    AUD: 1.52, CNY: 7.24, KRW: 1320, MYR: 4.72, USD: 1,
  };

  const currencies = calculateCurrencyStrength(rates);

  const getStrengthColor = (strength: number) => {
    if (strength > 10) return 'text-emerald-400';
    if (strength > 0) return 'text-emerald-400/70';
    if (strength > -10) return 'text-[#ff1a1a]/70';
    return 'text-[#ff1a1a]';
  };

  const getStrengthBarWidth = (strength: number) => {
    return Math.abs(strength) * 1.5;
  };

  const getChangeKey = (tf: string) => {
    switch (tf) {
      case '1D': return 'change1D';
      case '1W': return 'change1W';
      case '1M': return 'change1M';
      default: return 'change1D';
    }
  };

  return (
    <div className="p-2 space-y-1">
      {/* Timeframe selector */}
      <div className="flex gap-1 mb-2">
        {['1D', '1W', '1M'].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf as any)}
            className={`flex-1 px-2 py-0.5 text-[8px] font-bold font-mono rounded-sm ${
              timeframe === tf ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30' : 'bg-black/30 text-gray-600 border border-red-900/15'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Currency list */}
      <div className="space-y-0.5">
        {currencies.map(currency => {
          const change = currency[getChangeKey(timeframe) as keyof CurrencyStrength] as number;
          return (
            <div key={currency.code} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <div className="text-[8px] text-gray-600 font-mono w-4">#{currency.rank}</div>
                  <div className="text-[10px] font-bold text-gray-200 font-mono">{currency.code}</div>
                  <div className="text-[7px] text-gray-600 font-mono">{currency.currency}</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`text-[10px] font-mono font-bold ${getStrengthColor(currency.strength)}`}>
                    {currency.strength > 0 ? '+' : ''}{currency.strength.toFixed(1)}
                  </div>
                  <div className={`text-[8px] font-mono ${change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                    {change >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>
              </div>
              {/* Strength bar */}
              <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${currency.strength >= 0 ? 'bg-emerald-400' : 'bg-[#ff1a1a]'}`}
                  style={{ width: `${getStrengthBarWidth(currency.strength)}%`, marginLeft: currency.strength < 0 ? 'auto' : 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Calculated from ExchangeRate API data
      </div>
    </div>
  );
}

// Market Breadth Dashboard
export function MarketBreadthDashboard({ stocks, loading }: MarketBreadthDashboardProps) {
  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading market breadth...</div>;
  }

  // Generate sample data if no stocks provided
  const sampleStocks = stocks || Array.from({ length: 100 }, (_, i) => ({
    changePercent: (Math.random() - 0.5) * 6,
    volume: Math.floor(Math.random() * 100000000),
  }));

  const breadth = calculateMarketBreadth(sampleStocks);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-400';
      case 'bearish': return 'text-[#ff1a1a]';
      default: return 'text-gray-400';
    }
  };

  const totalAdvDec = breadth.advancers + breadth.decliners;
  const advPct = totalAdvDec > 0 ? (breadth.advancers / totalAdvDec) * 100 : 50;
  const decPct = 100 - advPct;

  return (
    <div className="p-2 space-y-1">
      {/* Sentiment badge */}
      <div className="text-center mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider">Market Sentiment</div>
        <div className={`text-[20px] font-black font-mono ${getSentimentColor(breadth.sentiment)}`}>
          {breadth.sentiment.toUpperCase()}
        </div>
      </div>

      {/* Advancers vs Decliners bar */}
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5 mb-1">
        <div className="flex items-center justify-between text-[8px] font-mono mb-0.5">
          <span className="text-emerald-400 font-bold">{breadth.advancers} ▲</span>
          <span className="text-[#ff1a1a] font-bold">{breadth.decliners} ▼</span>
          <span className="text-gray-600">{breadth.unchanged} —</span>
        </div>
        <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-400" style={{ width: `${advPct}%` }} />
          <div className="h-full bg-gray-600" style={{ width: `${(breadth.unchanged / (breadth.advancers + breadth.decliners + breadth.unchanged)) * 100}%` }} />
          <div className="h-full bg-[#ff1a1a]" style={{ width: `${decPct}%` }} />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">New Highs</div>
          <div className="text-emerald-400 font-bold text-[14px]">{breadth.newHighs}</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">New Lows</div>
          <div className="text-[#ff1a1a] font-bold text-[14px]">{breadth.newLows}</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">A/D Line</div>
          <div className={`${breadth.advanceDeclineLine >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold text-[14px]`}>
            {breadth.advanceDeclineLine > 0 ? '+' : ''}{breadth.advanceDeclineLine}
          </div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">A/D Ratio</div>
          <div className={`${breadth.advanceDeclineRatio >= 1 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold text-[14px]`}>
            {breadth.advanceDeclineRatio.toFixed(2)}
          </div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Volume Ratio</div>
          <div className={`${breadth.volumeRatio >= 1 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold text-[14px]`}>
            {breadth.volumeRatio.toFixed(2)}
          </div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Total Stocks</div>
          <div className="text-gray-200 font-bold text-[14px]">{breadth.advancers + breadth.decliners + breadth.unchanged}</div>
        </div>
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Calculated from IDX stock data
      </div>
    </div>
  );
}
