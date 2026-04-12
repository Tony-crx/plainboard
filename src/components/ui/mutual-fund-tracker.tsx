"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Calendar, Clock } from 'lucide-react';
import type { MutualFund } from '@/lib/data/mutual-funds';
import { MUTUAL_FUNDS, sortFundsByReturn, filterFundsByCategory, getFundStatistics, formatAum, getRiskColor, FUND_CATEGORIES } from '@/lib/data/mutual-funds';

interface MutualFundTrackerProps {
  loading: boolean;
}

export function MutualFundTracker({ loading }: MutualFundTrackerProps) {
  const [funds] = useState<MutualFund[]>(MUTUAL_FUNDS);
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'1Y' | '3Y' | '5Y' | 'YTD'>('1Y');
  const [selectedFund, setSelectedFund] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading mutual fund data...</div>;
  }

  const filtered = filterFundsByCategory(funds, category);
  const sorted = sortFundsByReturn(filtered, sortBy);
  const stats = getFundStatistics(funds);
  const selected = funds.find(f => f.id === selectedFund);

  const getCategoryLabel = (cat: string) => {
    const c = FUND_CATEGORIES.find(x => x.key === cat);
    return c ? c.label : cat;
  };

  return (
    <div className="p-2 space-y-1">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-1 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Avg 1Y Return</div>
          <div className="text-emerald-400 font-bold text-[12px]">{stats.avgReturn1Y.toFixed(1)}%</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Best 1Y</div>
          <div className="text-emerald-400 font-bold text-[12px]">{stats.best1Y.return1Y}%</div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">Best 3Y</div>
          <div className="text-emerald-400 font-bold text-[12px]">{stats.best3Y.return3Y}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-1">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
        >
          <option value="all">All Categories</option>
          {FUND_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="flex-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono focus:outline-none focus:border-[#ff1a1a]/50"
        >
          <option value="1Y">1Y Return</option>
          <option value="3Y">3Y Return</option>
          <option value="5Y">5Y Return</option>
          <option value="YTD">YTD Return</option>
        </select>
      </div>

      {/* Fund list */}
      <div className="space-y-0.5">
        {sorted.map(fund => (
          <div
            key={fund.id}
            className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer"
            onClick={() => setSelectedFund(fund.id === selectedFund ? null : fund.id)}
          >
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <div className="text-[10px] font-bold text-gray-200 font-mono">{fund.id}</div>
                <div className={`text-[7px] font-mono font-bold uppercase ${getRiskColor(fund.risk)}`}>
                  {fund.risk}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-mono font-bold ${(fund as any)[`return${sortBy}`] >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {(fund as any)[`return${sortBy}`]}%
                </div>
                <div className="text-[7px] text-gray-600 font-mono">{sortBy}</div>
              </div>
            </div>
            <div className="text-[7px] text-gray-600 font-mono truncate">{fund.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[7px] text-gray-600 font-mono">NAV: {fund.nav.toLocaleString('id-ID')}</span>
              <span className="text-[7px] text-gray-600 font-mono">AUM: {formatAum(fund.aum)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected fund detail */}
      {selected && (
        <div className="mt-2 bg-black/60 border border-red-900/30 px-3 py-2">
          <div className="text-[9px] font-bold text-[#ff1a1a] font-mono mb-2">{selected.id} - {selected.name}</div>
          <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono mb-2">
            {[
              { label: '1M', value: selected.return1M },
              { label: '3M', value: selected.return3M },
              { label: '6M', value: selected.return6M },
              { label: '1Y', value: selected.return1Y },
              { label: '3Y', value: selected.return3Y },
              { label: '5Y', value: selected.return5Y },
              { label: 'YTD', value: selected.returnYTD },
              { label: 'AUM', value: formatAum(selected.aum).replace('Rp ', '') },
            ].map(item => (
              <div key={item.label} className="bg-black/40 border border-red-900/15 px-1.5 py-1 text-center">
                <div className="text-gray-600">{item.label}</div>
                <div className={`${typeof item.value === 'number' && item.value >= 0 ? 'text-emerald-400' : 'text-gray-300'} font-bold`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[7px] text-gray-600 font-mono">
            Manager: {selected.fundManager} · Min: Rp {selected.minInvestment.toLocaleString('id-ID')} · Benchmark: {selected.benchmark}
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Sample data for demonstration · Connect to OJK/e-Bareksa API for live data
      </div>
    </div>
  );
}
