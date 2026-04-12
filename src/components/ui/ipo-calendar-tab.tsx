"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar, Clock } from 'lucide-react';
import type { IPOInfo } from '@/lib/data/ipo-calendar';
import { getIPOStats } from '@/lib/data/ipo-calendar';

interface IPOCalendarProps {
  upcoming: IPOInfo[];
  recent: IPOInfo[];
  loading: boolean;
}

export function IPOCalendarTab({ upcoming, recent, loading }: IPOCalendarProps) {
  const [view, setView] = useState<'upcoming' | 'recent' | 'stats'>('upcoming');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading IPO data...</div>;
  }

  const stats = getIPOStats([...upcoming, ...recent]);

  return (
    <div className="p-2 space-y-1">
      {/* View selector */}
      <div className="flex border-b border-red-900/20 mb-2">
        {[
          { key: 'upcoming' as const, label: 'Upcoming', count: upcoming.length },
          { key: 'recent' as const, label: 'Recent', count: recent.length },
          { key: 'stats' as const, label: 'Stats', count: 0 },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex-1 px-2 py-1 text-[8px] font-bold font-mono uppercase tracking-wider transition-colors ${
              view === v.key
                ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {v.label}{v.count > 0 && <span className="ml-1 px-1 py-0.5 text-[7px] bg-[#ff1a1a]/20 rounded-sm">{v.count}</span>}
          </button>
        ))}
      </div>

      {/* Upcoming IPOs */}
      {view === 'upcoming' && (
        <div className="space-y-0.5">
          {upcoming.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No upcoming IPOs</div>
          )}
          {upcoming.map((ipo, idx) => {
            const daysUntil = Math.ceil((new Date(ipo.ipoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={idx} className="bg-black/40 border border-yellow-500/20 px-2 py-1.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-bold text-yellow-400 font-mono">{ipo.symbol}</div>
                  <div className="flex items-center gap-1 text-[7px] text-yellow-400 font-mono bg-yellow-500/10 px-1.5 py-0.5 rounded-sm">
                    <Clock size={8} />
                    {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today' : 'Passed'}
                  </div>
                </div>
                <div className="text-[8px] text-gray-300 font-mono mb-0.5">{ipo.company}</div>
                <div className="text-[7px] text-gray-600 font-mono">{ipo.sector}</div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[8px] font-mono">
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Offering</div>
                    <div className="text-gray-200 font-bold">Rp {ipo.offeringPrice.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Date</div>
                    <div className="text-gray-200 font-bold flex items-center gap-0.5">
                      <Calendar size={8} />
                      {new Date(ipo.ipoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Underwriter</div>
                    <div className="text-gray-200 font-bold truncate">{ipo.underwriter}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent IPO Performance */}
      {view === 'recent' && (
        <div className="space-y-0.5">
          {recent.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No recent IPO data</div>
          )}
          {recent.map((ipo, idx) => {
            const totalReturn = ipo.totalReturn || 0;
            const firstDayReturn = ipo.firstDayReturn || 0;
            return (
              <div key={idx} className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-bold text-gray-200 font-mono">{ipo.symbol}</div>
                  <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                    {totalReturn >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </div>
                </div>
                <div className="text-[8px] text-gray-300 font-mono mb-0.5">{ipo.company}</div>
                <div className="grid grid-cols-4 gap-1 mt-1 text-[7px] font-mono">
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">IPO Price</div>
                    <div className="text-gray-200 font-bold">Rp {ipo.offeringPrice.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Current</div>
                    <div className="text-gray-200 font-bold">Rp {ipo.currentPrice?.toLocaleString('id-ID') || 'N/A'}</div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">1st Day</div>
                    <div className={`font-bold ${firstDayReturn >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                      {firstDayReturn >= 0 ? '+' : ''}{firstDayReturn.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Total Return</div>
                    <div className={`font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                      {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IPO Statistics */}
      {view === 'stats' && (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono">
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Total Listed</div>
              <div className="text-[16px] font-black text-gray-200">{stats.totalListed}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Upcoming</div>
              <div className="text-[16px] font-black text-yellow-400">{stats.totalUpcoming}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Winners</div>
              <div className="text-[16px] font-black text-emerald-400">{stats.winners}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Losers</div>
              <div className="text-[16px] font-black text-[#ff1a1a]">{stats.losers}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Win Rate</div>
              <div className={`text-[16px] font-black ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="text-gray-600">Avg 1st Day</div>
              <div className={`text-[16px] font-black ${stats.avgFirstDayReturn >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                {stats.avgFirstDayReturn >= 0 ? '+' : ''}{stats.avgFirstDayReturn.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="text-gray-600 text-[8px]">Avg Total Return</div>
            <div className={`text-[20px] font-black ${stats.avgTotalReturn >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
              {stats.avgTotalReturn >= 0 ? '+' : ''}{stats.avgTotalReturn.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: IDX (Indonesia Stock Exchange) - idx.co.id
      </div>
    </div>
  );
}
