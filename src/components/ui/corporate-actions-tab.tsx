"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import type { CorporateAction, DividendInfo } from '@/lib/data/corporate-actions';
import { getCorporateActions, daysUntilExDate, calculatePortfolioDividendYield } from '@/lib/data/corporate-actions';

interface CorporateActionsTabProps {
  loading: boolean;
}

export function CorporateActionsTab({ loading }: CorporateActionsTabProps) {
  const [view, setView] = useState<'upcoming' | 'calendar' | 'portfolio'>('upcoming');
  const [filter, setFilter] = useState<'all' | 'dividend' | 'stock-split'>('all');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading corporate actions...</div>;
  }

  const actions = getCorporateActions();
  const filtered = filter === 'all' ? actions : actions.filter(a => a.type === filter);

  // Sample portfolio for dividend calculator
  const samplePortfolio = [
    { symbol: 'BBCA', shares: 1000, currentPrice: 10750 },
    { symbol: 'BBRI', shares: 1500, currentPrice: 9800 },
    { symbol: 'BMRI', shares: 800, currentPrice: 10450 },
    { symbol: 'TLKM', shares: 2000, currentPrice: 3450 },
  ];

  const portfolioDividends = calculatePortfolioDividendYield(samplePortfolio);

  return (
    <div className="p-2 space-y-1">
      {/* View selector */}
      <div className="flex border-b border-red-900/20 mb-2">
        {[
          { key: 'upcoming' as const, label: 'Upcoming' },
          { key: 'calendar' as const, label: 'Calendar' },
          { key: 'portfolio' as const, label: 'Portfolio' },
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
            {v.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-1 mb-2">
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'dividend' as const, label: '💰 Div' },
          { key: 'stock-split' as const, label: '🔀 Split' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 px-2 py-0.5 text-[7px] font-bold font-mono uppercase rounded-sm transition-colors ${
              filter === f.key
                ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30'
                : 'bg-black/30 text-gray-600 border border-red-900/15'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Upcoming Actions */}
      {view === 'upcoming' && (
        <div className="space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No upcoming corporate actions</div>
          )}
          {filtered.map(action => {
            const daysUntil = daysUntilExDate(action.exDate);
            const statusColor = action.status === 'cum' ? 'text-emerald-400' : action.status === 'ex' ? 'text-yellow-400' : action.status === 'announced' ? 'text-blue-400' : 'text-gray-500';

            return (
              <div key={action.id} className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] font-bold text-gray-200 font-mono">{action.symbol}</div>
                    <div className={`text-[7px] font-mono uppercase font-bold px-1 py-0.5 rounded-sm ${
                      action.type === 'dividend' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {action.type === 'dividend' ? 'DIV' : 'SPLIT'}
                    </div>
                  </div>
                  <div className={`text-[8px] font-mono font-bold uppercase ${statusColor}`}>
                    {action.status}
                  </div>
                </div>
                <div className="text-[8px] text-gray-400 font-mono mb-1 truncate">{action.description}</div>
                <div className="grid grid-cols-3 gap-1 text-[7px] font-mono">
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600 flex items-center gap-0.5"><Calendar size={7} /> Ex-Date</div>
                    <div className="text-gray-200 font-bold">{new Date(action.exDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Countdown</div>
                    <div className={`font-bold ${daysUntil <= 7 ? 'text-yellow-400' : daysUntil <= 0 ? 'text-[#ff1a1a]' : 'text-emerald-400'}`}>
                      {daysUntil > 0 ? `${daysUntil}d` : daysUntil === 0 ? 'Today' : 'Passed'}
                    </div>
                  </div>
                  <div className="bg-black/30 border border-red-900/10 px-1.5 py-1">
                    <div className="text-gray-600">Value</div>
                    <div className="text-gray-200 font-bold">
                      {action.value ? `${action.currency} ${action.value.toLocaleString('id-ID')}` : action.ratio || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="space-y-0.5">
          {/* Group by month */}
          {(() => {
            const grouped: Record<string, typeof actions> = {};
            filtered.forEach(action => {
              const month = new Date(action.exDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              if (!grouped[month]) grouped[month] = [];
              grouped[month].push(action);
            });

            return Object.entries(grouped).map(([month, monthActions]) => (
              <div key={month} className="mb-2">
                <div className="text-[8px] font-bold text-[#ff1a1a] font-mono uppercase tracking-wider mb-1 px-1">{month}</div>
                <div className="space-y-0.5">
                  {monthActions.sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime()).map(action => (
                    <div key={action.id} className="bg-black/40 border border-red-900/15 px-2 py-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`text-[9px] font-bold font-mono ${action.type === 'dividend' ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {new Date(action.exDate).getDate()}
                        </div>
                        <div>
                          <div className="text-[9px] text-gray-200 font-mono font-bold">{action.symbol}</div>
                          <div className="text-[7px] text-gray-600 font-mono truncate max-w-[150px]">{action.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {action.type === 'dividend' && action.value && (
                          <div className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                            <DollarSign size={8} />
                            {action.value.toLocaleString('id-ID')}
                          </div>
                        )}
                        {action.type === 'stock-split' && action.ratio && (
                          <div className="text-[8px] text-blue-400 font-mono font-bold flex items-center gap-0.5">
                            <TrendingUp size={8} />
                            {action.ratio}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Portfolio Dividend Calculator */}
      {view === 'portfolio' && (
        <div className="space-y-1">
          <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Sample Portfolio Dividends</div>
            <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono mb-2">
              <div className="bg-black/30 border border-red-900/10 px-2 py-1">
                <div className="text-gray-600">Total Dividend</div>
                <div className="text-emerald-400 font-bold text-[14px]">
                  Rp {portfolioDividends.totalDividend.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-black/30 border border-red-900/10 px-2 py-1">
                <div className="text-gray-600">Avg Yield</div>
                <div className="text-emerald-400 font-bold text-[14px]">
                  {portfolioDividends.avgYield.toFixed(2)}%
                </div>
              </div>
            </div>
            {/* By stock breakdown */}
            <div className="space-y-0.5">
              {portfolioDividends.byStock.map(stock => (
                <div key={stock.symbol} className="flex items-center justify-between bg-black/30 border border-red-900/10 px-2 py-1">
                  <div className="text-[9px] text-gray-200 font-mono font-bold">{stock.symbol}</div>
                  <div className="text-right">
                    <div className="text-[8px] text-gray-300 font-mono">Rp {stock.dividend.toLocaleString('id-ID')}</div>
                    <div className="text-[7px] text-emerald-400 font-mono">{stock.yield.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: IDX Corporate Actions & Company Announcements
      </div>
    </div>
  );
}
