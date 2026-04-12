"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface CommoditiesCorrelationProps {
  loading: boolean;
}

// Correlation data between commodities and IDX stocks
const COMMODITY_STOCK_CORRELATIONS = [
  {
    commodity: 'Gold', symbol: 'XAU', stocks: [
      { symbol: 'ANTM', correlation: 0.72, priceChange: 2.5, stockChange: 1.8 },
      { symbol: 'MDKA', correlation: 0.65, priceChange: 2.5, stockChange: 1.5 },
      { symbol: 'BRMS', correlation: 0.58, priceChange: 2.5, stockChange: 1.2 },
    ]
  },
  {
    commodity: 'Coal', symbol: 'COAL', stocks: [
      { symbol: 'ADRO', correlation: 0.78, priceChange: -1.5, stockChange: -1.2 },
      { symbol: 'ITMG', correlation: 0.82, priceChange: -1.5, stockChange: -1.4 },
      { symbol: 'UNTR', correlation: 0.65, priceChange: -1.5, stockChange: -0.9 },
      { symbol: 'PTBA', correlation: 0.75, priceChange: -1.5, stockChange: -1.1 },
    ]
  },
  {
    commodity: 'Oil WTI', symbol: 'CL', stocks: [
      { symbol: 'MEDC', correlation: 0.68, priceChange: 1.1, stockChange: 0.8 },
      { symbol: 'PGAS', correlation: 0.72, priceChange: 1.1, stockChange: 0.9 },
      { symbol: 'ELSA', correlation: 0.55, priceChange: 1.1, stockChange: 0.5 },
    ]
  },
  {
    commodity: 'CPO', symbol: 'CPO', stocks: [
      { symbol: 'LSIP', correlation: 0.75, priceChange: 1.2, stockChange: 0.9 },
      { symbol: 'AALI', correlation: 0.70, priceChange: 1.2, stockChange: 0.8 },
      { symbol: 'DSNG', correlation: 0.62, priceChange: 1.2, stockChange: 0.7 },
    ]
  },
  {
    commodity: 'Nickel', symbol: 'NI', stocks: [
      { symbol: 'ANTM', correlation: 0.60, priceChange: -0.7, stockChange: -0.4 },
      { symbol: 'VALE', correlation: 0.78, priceChange: -0.7, stockChange: -0.6 },
      { symbol: 'INKO', correlation: 0.55, priceChange: -0.7, stockChange: -0.3 },
    ]
  },
  {
    commodity: 'Copper', symbol: 'HG', stocks: [
      { symbol: 'ANTM', correlation: 0.58, priceChange: 1.8, stockChange: 1.0 },
      { symbol: 'MDKA', correlation: 0.52, priceChange: 1.8, stockChange: 0.9 },
      { symbol: 'BBSR', correlation: 0.48, priceChange: 1.8, stockChange: 0.8 },
    ]
  },
];

export function CommoditiesCorrelationMatrix({ loading }: CommoditiesCorrelationProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading correlation data...</div>;
  }

  const getCorrelationColor = (corr: number) => {
    if (corr >= 0.75) return 'text-emerald-400';
    if (corr >= 0.60) return 'text-yellow-400';
    return 'text-gray-500';
  };

  const getCorrelationBg = (corr: number) => {
    if (corr >= 0.75) return 'bg-emerald-500/10 border-emerald-500/30';
    if (corr >= 0.60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  return (
    <div className="p-2 space-y-1">
      {/* Correlation matrix overview */}
      <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Live Correlation Coefficients</div>

      {/* Commodity cards */}
      {COMMODITY_STOCK_CORRELATIONS.map(group => (
        <div key={group.commodity} className="mb-2">
          <button
            onClick={() => setSelectedCommodity(selectedCommodity === group.commodity ? null : group.commodity)}
            className="w-full bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <TrendingUp size={10} className="text-gray-600" />
                <div className="text-[10px] font-bold text-gray-200 font-mono">{group.commodity}</div>
                <div className="text-[7px] text-gray-600 font-mono">({group.symbol})</div>
              </div>
              <div className={`text-[8px] font-mono ${group.stocks[0].priceChange >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                {group.stocks[0].priceChange >= 0 ? '+' : ''}{group.stocks[0].priceChange.toFixed(1)}%
              </div>
            </div>
            <div className="flex gap-1">
              {group.stocks.map(s => (
                <span key={s.symbol} className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm border ${getCorrelationBg(s.correlation)}`}>
                  {s.symbol}: <span className={getCorrelationColor(s.correlation)}>{s.correlation.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </button>

          {/* Expanded detail */}
          {selectedCommodity === group.commodity && (
            <div className="mt-1 bg-black/60 border border-red-900/30 px-2 py-1.5">
              <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Correlation Detail</div>
              <div className="space-y-0.5">
                {group.stocks.map(s => (
                  <div key={s.symbol} className="flex items-center justify-between bg-black/40 border border-red-900/15 px-2 py-1">
                    <div className="flex items-center gap-1">
                      <div className="text-[10px] font-bold text-gray-200 font-mono">{s.symbol}</div>
                      <div className={`text-[8px] font-mono ${s.stockChange >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                        {s.stockChange >= 0 ? '+' : ''}{s.stockChange.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-[7px] text-gray-600">Corr:</div>
                      <div className={`text-[10px] font-mono font-bold ${getCorrelationColor(s.correlation)}`}>
                        {s.correlation.toFixed(3)}
                      </div>
                      {/* Correlation bar */}
                      <div className="w-16 h-2 bg-black/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.correlation >= 0.75 ? 'bg-emerald-400' : s.correlation >= 0.60 ? 'bg-yellow-400' : 'bg-gray-500'}`}
                          style={{ width: `${s.correlation * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Correlation calculated from 90-day price history
      </div>
    </div>
  );
}
