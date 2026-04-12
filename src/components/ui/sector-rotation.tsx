"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { SectorRotation } from '@/lib/data/sector-rotation';
import { SECTOR_ROTATION_DATA, getSectorRotationByPeriod, getEarlyWarnings } from '@/lib/data/sector-rotation';

interface SectorRotationModelProps { loading: boolean; }

export function SectorRotationModelTab({ loading }: SectorRotationModelProps) {
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | '3M'>('1M');

  if (loading) return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>;

  const sorted = getSectorRotationByPeriod(period);
  const warnings = getEarlyWarnings();

  return (
    <div className="p-2 space-y-1">
      <div className="flex gap-1 mb-2">
        {(['1D', '1W', '1M', '3M'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 px-2 py-0.5 text-[8px] font-bold font-mono rounded-sm ${period === p ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30' : 'bg-black/30 text-gray-600 border border-red-900/15'}`}>{p}</button>
        ))}
      </div>
      <div className="space-y-0.5">
        {sorted.map(s => (
          <div key={s.sector} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <div className="text-[8px] text-gray-600 font-mono w-4">#{s.rank}</div>
                <div className="text-[10px] font-bold text-gray-200 font-mono">{s.sector}</div>
                {s.rank < s.previousRank && <span className="text-[7px] text-emerald-400 font-mono">↑{s.previousRank - s.rank}</span>}
                {s.rank > s.previousRank && <span className="text-[7px] text-[#ff1a1a] font-mono">↓{s.rank - s.previousRank}</span>}
              </div>
              <div className="flex items-center gap-1">
                <div className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded-sm ${s.moneyFlow === 'inflow' ? 'bg-emerald-500/20 text-emerald-400' : s.moneyFlow === 'outflow' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-gray-500/20 text-gray-500'}`}>{s.moneyFlow}</div>
                <div className={`text-[10px] font-mono font-bold ${s.performance[period] >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{s.performance[period] >= 0 ? '+' : ''}{s.performance[period].toFixed(1)}%</div>
              </div>
            </div>
            {s.earlyWarning && <div className="mt-1 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-[7px] text-yellow-400 font-mono flex items-center gap-0.5"><AlertTriangle size={8} />{s.earlyWarning}</div>}
          </div>
        ))}
      </div>
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">Sector performance ranking with money flow detection</div>
    </div>
  );
}
