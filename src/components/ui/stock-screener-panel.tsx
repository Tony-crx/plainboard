"use client";

import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter, X } from 'lucide-react';
import type { StockScreenerResult } from '@/lib/data/sectors';
import { screenStocks, PREBUILT_SCREENS, generateMockScreenerData } from '@/lib/data/sectors';

interface StockScreenerPanelProps {
  loading: boolean;
}

export function StockScreenerPanel({ loading }: StockScreenerPanelProps) {
  const [stocks] = useState<StockScreenerResult[]>(generateMockScreenerData());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minPe: undefined as number | undefined,
    maxPe: undefined as number | undefined,
    minPb: undefined as number | undefined,
    maxPb: undefined as number | undefined,
    minRoe: undefined as number | undefined,
    minDividendYield: undefined as number | undefined,
    minMarketCap: undefined as number | undefined,
    sortBy: 'marketCap' as string,
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const filteredStocks = useMemo(() => {
    return screenStocks(stocks, filters);
  }, [stocks, filters]);

  const applyPrebuiltScreen = (screenName: string) => {
    const screen = PREBUILT_SCREENS[screenName as keyof typeof PREBUILT_SCREENS];
    if (screen) {
      setFilters(prev => ({ ...prev, ...screen }));
      setSelectedScreen(screenName);
    }
  };

  const clearFilters = () => {
    setFilters({
      minPe: undefined,
      maxPe: undefined,
      minPb: undefined,
      maxPb: undefined,
      minRoe: undefined,
      minDividendYield: undefined,
      minMarketCap: undefined,
      sortBy: 'marketCap',
      sortOrder: 'desc',
    });
    setSelectedScreen(null);
  };

  const fmtMarketCap = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading screener...</div>;
  }

  return (
    <div className="p-2 space-y-1">
      {/* Pre-built screens */}
      <div className="flex gap-1 mb-1">
        {Object.keys(PREBUILT_SCREENS).map(name => (
          <button
            key={name}
            onClick={() => applyPrebuiltScreen(name)}
            className={`flex-1 px-2 py-1 text-[7px] font-bold font-mono uppercase rounded-sm transition-colors ${
              selectedScreen === name
                ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30'
                : 'bg-black/30 text-gray-600 border border-red-900/15 hover:text-gray-400'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-2 py-0.5 bg-black/30 border border-red-900/15 rounded-sm text-[8px] text-gray-400 font-mono hover:text-gray-200"
        >
          <Filter size={8} />
          Filters{showFilters ? ' ▲' : ' ▼'}
        </button>
        <div className="text-[8px] text-gray-600 font-mono">
          {filteredStocks.length} / {stocks.length} stocks
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-black/60 border border-red-900/30 px-2 py-1.5 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[8px] font-bold text-[#ff1a1a] font-mono uppercase">Filters</div>
            <button onClick={clearFilters} className="p-0.5 hover:bg-white/10 rounded-sm">
              <X size={10} className="text-gray-500 hover:text-[#ff1a1a]" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[7px] font-mono">
            <div>
              <label className="text-gray-600">Min P/E</label>
              <input
                type="number"
                value={filters.minPe || ''}
                onChange={e => setFilters(prev => ({ ...prev, minPe: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="text-gray-600">Max P/E</label>
              <input
                type="number"
                value={filters.maxPe || ''}
                onChange={e => setFilters(prev => ({ ...prev, maxPe: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="text-gray-600">Min P/B</label>
              <input
                type="number"
                value={filters.minPb || ''}
                onChange={e => setFilters(prev => ({ ...prev, minPb: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="text-gray-600">Max P/B</label>
              <input
                type="number"
                value={filters.maxPb || ''}
                onChange={e => setFilters(prev => ({ ...prev, maxPb: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="text-gray-600">Min ROE %</label>
              <input
                type="number"
                value={filters.minRoe || ''}
                onChange={e => setFilters(prev => ({ ...prev, minRoe: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="text-gray-600">Min Div Yield %</label>
              <input
                type="number"
                value={filters.minDividendYield || ''}
                onChange={e => setFilters(prev => ({ ...prev, minDividendYield: e.target.value ? parseFloat(e.target.value) : undefined }))}
                className="w-full bg-black/40 border border-red-900/30 px-1 py-0.5 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
                placeholder="Any"
              />
            </div>
          </div>
          {/* Sort controls */}
          <div className="flex gap-1 mt-1">
            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="flex-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
            >
              <option value="marketCap">Market Cap</option>
              <option value="peRatio">P/E Ratio</option>
              <option value="pbRatio">P/B Ratio</option>
              <option value="roe">ROE</option>
              <option value="dividendYield">Div Yield</option>
              <option value="changePercent">Change %</option>
              <option value="volume">Volume</option>
            </select>
            <button
              onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              className="px-2 py-0.5 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono hover:text-[#ff1a1a]"
            >
              {filters.sortOrder === 'asc' ? '▲ ASC' : '▼ DESC'}
            </button>
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="space-y-0.5">
        {/* Table header */}
        <div className="flex items-center justify-between px-2 py-1 bg-black/40 border border-red-900/15 text-[7px] text-gray-600 font-mono uppercase tracking-wider">
          <div className="flex-1">Symbol</div>
          <div className="w-16 text-right">Price</div>
          <div className="w-14 text-right">Change</div>
          <div className="w-12 text-right hidden md:block">P/E</div>
          <div className="w-12 text-right hidden md:block">ROE</div>
          <div className="w-14 text-right">Mkt Cap</div>
        </div>

        {/* Stock rows */}
        {filteredStocks.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No stocks match your filters</div>
        )}

        {filteredStocks.map(stock => (
          <div
            key={stock.symbol}
            className="flex items-center justify-between bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-gray-200 font-mono">{stock.symbol}</div>
              <div className="text-[7px] text-gray-600 font-mono truncate max-w-[120px]">{stock.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right w-16">
                <div className="text-[9px] text-gray-200 font-mono">{stock.price.toLocaleString('id-ID')}</div>
              </div>
              <div className={`text-right w-14 text-[8px] font-mono ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                {stock.changePercent >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
              </div>
              <div className="text-right w-12 hidden md:block">
                <div className="text-[8px] text-gray-400 font-mono">{stock.peRatio?.toFixed(1) || 'N/A'}</div>
              </div>
              <div className="text-right w-12 hidden md:block">
                <div className="text-[8px] text-gray-400 font-mono">{stock.roe?.toFixed(1) || 'N/A'}%</div>
              </div>
              <div className="text-right w-14">
                <div className="text-[8px] text-gray-400 font-mono">{fmtMarketCap(stock.marketCap)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Mock data for demonstration · Connect to live data source for real-time screening
      </div>
    </div>
  );
}
