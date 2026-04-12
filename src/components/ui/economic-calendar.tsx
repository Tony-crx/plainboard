"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { EconomicEvent, BIRateDecision } from '@/lib/data/economic-calendar';
import {
  UPCOMING_ECONOMIC_EVENTS,
  BI_RATE_HISTORY,
  daysUntilNextBIMeeting,
  getUpcomingEvents,
  getPastEventsWithActuals,
} from '@/lib/data/economic-calendar';

interface EconomicCalendarTabProps {
  loading: boolean;
}

interface BIRateTrackerProps {
  loading: boolean;
}

// Economic Calendar Component
export function EconomicCalendarTab({ loading }: EconomicCalendarTabProps) {
  const [view, setView] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading economic calendar...</div>;
  }

  let events = view === 'upcoming' ? getUpcomingEvents(UPCOMING_ECONOMIC_EVENTS)
    : view === 'past' ? getPastEventsWithActuals(UPCOMING_ECONOMIC_EVENTS)
    : UPCOMING_ECONOMIC_EVENTS;

  if (impactFilter !== 'all') {
    events = events.filter(e => e.impact === impactFilter);
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-[#ff1a1a]';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-emerald-400';
      default: return 'text-gray-500';
    }
  };

  const getImpactBg = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-[#ff1a1a]/30 bg-[#ff1a1a]/5';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'low': return 'border-emerald-500/30 bg-emerald-500/5';
      default: return 'border-gray-500/30';
    }
  };

  return (
    <div className="p-2 space-y-1">
      {/* View selector */}
      <div className="flex border-b border-red-900/20 mb-2">
        {['upcoming', 'past', 'all'].map(v => (
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

      {/* Impact filter */}
      <div className="flex gap-1 mb-2">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setImpactFilter(f as any)}
            className={`flex-1 px-2 py-0.5 text-[7px] font-bold font-mono uppercase rounded-sm ${
              impactFilter === f
                ? `${getImpactBg(f)} border ${getImpactColor(f)}`
                : 'bg-black/30 text-gray-600 border border-red-900/15'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-0.5">
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No events match filters</div>
        )}
        {events.map(event => {
          const daysUntil = Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isFuture = !event.actual;

          return (
            <div key={event.id} className={`bg-black/40 border border-red-900/15 px-2 py-1.5 ${getImpactBg(event.impact)}`}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
                  <span className={`text-[7px] font-bold font-mono uppercase px-1 py-0.5 rounded-sm ${getImpactColor(event.impact)} bg-black/30`}>
                    {event.impact}
                  </span>
                  <span className="text-[8px] text-gray-600 font-mono">{event.country === 'ID' ? '🇮🇩' : '🇺🇸'}</span>
                  <div className="text-[9px] font-bold text-gray-200 font-mono">{event.event}</div>
                </div>
                {isFuture && daysUntil >= 0 && (
                  <div className="flex items-center gap-0.5 text-[7px] text-yellow-400 font-mono">
                    <Clock size={8} />
                    {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[8px] font-mono">
                <div className="text-gray-600 flex items-center gap-0.5"><Calendar size={8} />{event.date}</div>
                <div className="text-gray-600">{event.time}</div>
              </div>
              {/* Actual vs Forecast vs Previous */}
              <div className="grid grid-cols-3 gap-1 mt-1 text-[8px] font-mono">
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Actual</div>
                  <div className={`font-bold ${event.actual ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {event.actual || '—'}
                  </div>
                </div>
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Forecast</div>
                  <div className="text-gray-300 font-bold">{event.forecast || '—'}</div>
                </div>
                <div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                  <div className="text-gray-600">Previous</div>
                  <div className="text-gray-300 font-bold">{event.previous || '—'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: Curated economic data · Real-time via BI & BPS APIs in production
      </div>
    </div>
  );
}

// BI Rate Tracker Component
export function BIRateTrackerTab({ loading }: BIRateTrackerProps) {
  const daysUntil = daysUntilNextBIMeeting();
  const currentRate = BI_RATE_HISTORY[0];
  const nextMeeting = BI_RATE_HISTORY.find(r => r.nextMeetingDate);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading BI rate data...</div>;
  }

  return (
    <div className="p-2 space-y-1">
      {/* Current rate display */}
      <div className="bg-black/40 border border-red-900/15 px-3 py-2 text-center mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mb-1">Current BI 7-Day Rate</div>
        <div className={`text-[32px] font-black font-mono ${currentRate.change > 0 ? 'text-[#ff1a1a]' : currentRate.change < 0 ? 'text-emerald-400' : 'text-gray-200'}`}>
          {currentRate.rate}%
        </div>
        {currentRate.change !== 0 && (
          <div className={`text-[10px] font-mono font-bold flex items-center justify-center gap-0.5 ${currentRate.change > 0 ? 'text-[#ff1a1a]' : 'text-emerald-400'}`}>
            {currentRate.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {currentRate.change > 0 ? '+' : ''}{currentRate.change.toFixed(2)}%
          </div>
        )}
        <div className="text-[7px] text-gray-600 font-mono mt-1">{currentRate.date} · {currentRate.meetingType}</div>
      </div>

      {/* Next meeting countdown */}
      {nextMeeting?.nextMeetingDate && (
        <div className={`bg-black/40 border px-3 py-2 text-center mb-2 ${daysUntil <= 7 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-900/15'}`}>
          <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mb-1">Next RDG Meeting</div>
          <div className={`text-[20px] font-black font-mono ${daysUntil <= 7 ? 'text-yellow-400' : 'text-gray-200'}`}>
            {daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'TODAY' : 'Passed'}
          </div>
          <div className="text-[8px] text-gray-600 font-mono">{nextMeeting.nextMeetingDate}</div>
        </div>
      )}

      {/* Rate history */}
      <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Rate History</div>
      <div className="space-y-0.5">
        {BI_RATE_HISTORY.map((decision, idx) => (
          <div key={idx} className="flex items-center justify-between bg-black/40 border border-red-900/15 px-2 py-1">
            <div className="flex items-center gap-1">
              <div className="text-[8px] text-gray-600 font-mono">{decision.date}</div>
              <div className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded-sm ${
                decision.decision === 'hike' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' :
                decision.decision === 'cut' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-gray-500/20 text-gray-500'
              }`}>
                {decision.decision}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="text-[10px] text-gray-200 font-mono font-bold">{decision.rate}%</div>
              {decision.change !== 0 && (
                <div className={`text-[8px] font-mono ${decision.change > 0 ? 'text-[#ff1a1a]' : 'text-emerald-400'}`}>
                  {decision.change > 0 ? '+' : ''}{decision.change.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: Bank Indonesia (bi.go.id)
      </div>
    </div>
  );
}
