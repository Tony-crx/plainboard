"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import type { GlobalIndex } from '@/lib/data/global-markets';
import { GLOBAL_INDICES, getMarketStatusByTimezone } from '@/lib/data/global-markets';

interface GlobalMarketsOverviewProps {
  loading: boolean;
}

export function GlobalMarketsOverview({ loading }: GlobalMarketsOverviewProps) {
  const [region, setRegion] = useState<'all' | 'americas' | 'europe' | 'asia'>('all');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading global markets...</div>;
  }

  const marketStatus = getMarketStatusByTimezone();

  const filtered = GLOBAL_INDICES.filter(idx => {
    if (region === 'all') return true;
    if (region === 'americas') return ['US'].includes(idx.country);
    if (region === 'europe') return ['UK', 'Germany', 'France'].includes(idx.country);
    if (region === 'asia') return ['Japan', 'Hong Kong', 'China'].includes(idx.country);
    return true;
  });

  return (
    <div className="p-2 space-y-1">
      {/* Market status */}
      <div className="grid grid-cols-3 gap-1 text-[7px] font-mono mb-2">
        {marketStatus.map((m, i) => (
          <div key={i} className="bg-black/40 border border-red-900/15 px-1.5 py-1 text-center">
            <div className="text-gray-600">{m.region}</div>
            <div className={`font-bold ${m.status === 'Open' ? 'text-emerald-400' : 'text-gray-500'}`}>{m.status}</div>
            <div className="text-gray-700">{m.localTime}</div>
          </div>
        ))}
      </div>

      {/* Region filter */}
      <div className="flex gap-1 mb-2">
        {['all', 'americas', 'europe', 'asia'].map(r => (
          <button
            key={r}
            onClick={() => setRegion(r as any)}
            className={`flex-1 px-2 py-0.5 text-[7px] font-bold font-mono uppercase rounded-sm ${
              region === r ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30' : 'bg-black/30 text-gray-600 border border-red-900/15'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Indices list */}
      <div className="space-y-0.5">
        {filtered.map(idx => (
          <div key={idx.id} className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{idx.flag}</span>
                <div>
                  <div className="text-[10px] font-bold text-gray-200 font-mono">{idx.name}</div>
                  <div className="text-[7px] text-gray-600 font-mono">{idx.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-200 font-mono font-bold">{idx.value.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</div>
                <div className={`flex items-center gap-0.5 text-[8px] font-mono justify-end ${idx.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {idx.changePercent >= 0 ? <ArrowUpRight size={8} /> : <ArrowDownRight size={8} />}
                  {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[7px] font-mono mt-0.5">
              <div className="text-gray-600">Open: <span className="text-gray-400">{idx.open.toLocaleString('id-ID')}</span></div>
              <div className="text-gray-600">High: <span className="text-emerald-400">{idx.high.toLocaleString('id-ID')}</span></div>
              <div className="text-gray-600">Low: <span className="text-[#ff1a1a]">{idx.low.toLocaleString('id-ID')}</span></div>
              <div className="text-gray-600">Status: <span className={`${idx.status === 'open' ? 'text-emerald-400' : 'text-gray-500'}`}>{idx.status}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Sample data · Connect to Yahoo Finance / Bloomberg API for live data
      </div>
    </div>
  );
}
