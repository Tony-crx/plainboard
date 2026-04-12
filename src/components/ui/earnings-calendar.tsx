"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import type { EarningEvent } from '@/lib/data/earnings-calendar';
import { EARNINGS_CALENDAR, getUpcomingEarnings, getAvgSurprisePercent } from '@/lib/data/earnings-calendar';

interface EarningsCalendarTabProps {
  loading: boolean;
}

export function EarningsCalendarTab({ loading }: EarningsCalendarTabProps) {
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedEarning, setSelectedEarning] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading earnings data...</div>;
  }

  const upcoming = getUpcomingEarnings();
  const selected = EARNINGS_CALENDAR.find(e => e.id === selectedEarning);

  return (
    <div className="p-2 space-y-1">
      {/* View selector */}
      <div className="flex border-b border-red-900/20 mb-2">
        {['upcoming', 'history'].map(v => (
          <button
            key={v}
            onClick={() => setView(v as any)}
            className={`flex-1 px-2 py-1 text-[8px] font-bold font-mono uppercase tracking-wider transition-colors ${
              view === v ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Upcoming earnings */}
      {view === 'upcoming' && (
        <div className="space-y-0.5">
          {upcoming.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No upcoming earnings</div>
          )}
          {upcoming.map(earning => {
            const daysUntil = Math.ceil((new Date(earning.reportDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const avgSurprise = getAvgSurprisePercent(earning);

            return (
              <div
                key={earning.id}
                className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer"
                onClick={() => setSelectedEarning(earning.id === selectedEarning ? null : earning.id)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] font-bold text-gray-200 font-mono">{earning.symbol}</div>
                    <div className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded-sm ${
                      earning.reportTime === 'before-market' ? 'bg-emerald-500/20 text-emerald-400' :
                      earning.reportTime === 'after-market' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {earning.reportTime === 'before-market' ? 'BMO' : earning.reportTime === 'after-market' ? 'AMC' : 'DM'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {avgSurprise !== null && (
                      <div className={`text-[7px] font-mono ${avgSurprise >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                        Avg β +{avgSurprise.toFixed(1)}%
                      </div>
                    )}
                    <div className={`text-[7px] font-mono ${daysUntil <= 3 ? 'text-yellow-400' : 'text-gray-600'}`}>
                      {daysUntil > 0 ? `${daysUntil}d` : daysUntil === 0 ? 'Today' : 'Passed'}
                    </div>
                  </div>
                </div>
                <div className="text-[7px] text-gray-600 font-mono">{earning.companyName} · {earning.fiscalQuarter} {earning.fiscalYear}</div>
                <div className="flex items-center gap-2 mt-0.5 text-[8px] font-mono">
                  <div className="text-gray-600">EPS Est: <span className="text-gray-300 font-bold">{earning.epsEstimate?.toLocaleString('id-ID') || '—'}</span></div>
                  <div className="text-gray-600">Rev Est: <span className="text-gray-300 font-bold">{earning.revenueEstimate ? `Rp ${(earning.revenueEstimate / 1e12).toFixed(1)}T` : '—'}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Surprise history */}
      {view === 'history' && selected && (
        <div className="space-y-0.5">
          <div className="text-[9px] font-bold text-[#ff1a1a] font-mono mb-2">{selected.symbol} - Surprise History</div>
          {selected.surpriseHistory.map((h, idx) => (
            <div key={idx} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <div className="text-[9px] font-bold text-gray-200 font-mono">{h.quarter}</div>
                <div className={`text-[9px] font-mono font-bold ${h.surprisePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {h.surprisePercent >= 0 ? '+' : ''}{h.surprisePercent.toFixed(2)}%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Estimate</div>
                  <div className="text-gray-300 font-bold">{h.epsEstimate.toLocaleString('id-ID')}</div>
                </div>
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Actual</div>
                  <div className={`${h.epsActual >= h.epsEstimate ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold`}>
                    {h.epsActual.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Beat/Miss</div>
                  <div className={`${h.surprisePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold`}>
                    {h.surprisePercent >= 0 ? '+' : ''}{h.surprisePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Select prompt for history view */}
      {view === 'history' && !selected && (
        <div className="text-center py-8 text-gray-600 text-[9px] font-mono">
          Click an earnings event to view surprise history
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Sample data · Connect to IDX company filings API for live data
      </div>
    </div>
  );
}
