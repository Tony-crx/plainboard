"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from 'lucide-react';

interface AITradingSignalsProps { loading: boolean; }

const AI_SIGNALS = [
  { symbol: 'BBCA', signal: 'BUY', confidence: 0.85, pattern: 'Bullish Engulfing', entry: 10650, target: 11200, stopLoss: 10400, timeframe: '1D' },
  { symbol: 'BBRI', signal: 'HOLD', confidence: 0.72, pattern: 'Ascending Triangle', entry: 9800, target: 10500, stopLoss: 9500, timeframe: '1D' },
  { symbol: 'TLKM', signal: 'SELL', confidence: 0.78, pattern: 'Head & Shoulders', entry: 3450, target: 3200, stopLoss: 3600, timeframe: '1D' },
  { symbol: 'ADRO', signal: 'BUY', confidence: 0.68, pattern: 'Double Bottom', entry: 2850, target: 3100, stopLoss: 2700, timeframe: '4H' },
  { symbol: 'GOTO', signal: 'SELL', confidence: 0.82, pattern: 'Bear Flag', entry: 82, target: 70, stopLoss: 90, timeframe: '1D' },
];

export function AITradingSignals({ loading }: AITradingSignalsProps) {
  if (loading) return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>;

  return (
    <div className="p-2 space-y-1">
      <div className="grid grid-cols-3 gap-1.5 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-emerald-500/30 px-2 py-1.5 text-center"><div className="text-gray-600">Buy</div><div className="text-emerald-400 font-bold text-[14px]">{AI_SIGNALS.filter(s=>s.signal==='BUY').length}</div></div>
        <div className="bg-black/40 border border-gray-500/30 px-2 py-1.5 text-center"><div className="text-gray-600">Hold</div><div className="text-gray-400 font-bold text-[14px]">{AI_SIGNALS.filter(s=>s.signal==='HOLD').length}</div></div>
        <div className="bg-black/40 border border-[#ff1a1a]/30 px-2 py-1.5 text-center"><div className="text-gray-600">Sell</div><div className="text-[#ff1a1a] font-bold text-[14px]">{AI_SIGNALS.filter(s=>s.signal==='SELL').length}</div></div>
      </div>
      <div className="space-y-0.5">{AI_SIGNALS.map(s => (
        <div key={s.symbol} className={`bg-black/40 border px-2 py-1.5 ${s.signal==='BUY'?'border-emerald-500/20':s.signal==='SELL'?'border-[#ff1a1a]/20':'border-gray-500/20'}`}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <div className="text-[10px] font-bold text-gray-200 font-mono">{s.symbol}</div>
              <div className={`text-[7px] font-bold font-mono uppercase px-1 py-0.5 rounded-sm ${s.signal==='BUY'?'bg-emerald-500/20 text-emerald-400':s.signal==='SELL'?'bg-[#ff1a1a]/20 text-[#ff1a1a]':'bg-gray-500/20 text-gray-500'}`}>{s.signal}</div>
            </div>
            <div className="text-[8px] text-gray-600 font-mono">Confidence: <span className={`${s.confidence>=0.8?'text-emerald-400':'text-yellow-400'}`}>{(s.confidence*100).toFixed(0)}%</span></div>
          </div>
          <div className="text-[7px] text-gray-600 font-mono mb-0.5 flex items-center gap-0.5"><Activity size={8}/>{s.pattern} · {s.timeframe}</div>
          <div className="grid grid-cols-4 gap-1 text-[7px] font-mono"><div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">Entry</div><div className="text-gray-300 font-bold">{s.entry.toLocaleString('id-ID')}</div></div><div className="bg-black/30 border border-emerald-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">Target</div><div className="text-emerald-400 font-bold">{s.target.toLocaleString('id-ID')}</div></div><div className="bg-black/30 border border-[#ff1a1a]/10 px-1.5 py-1 text-center"><div className="text-gray-600">Stop</div><div className="text-[#ff1a1a] font-bold">{s.stopLoss.toLocaleString('id-ID')}</div></div><div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">R:R</div><div className="text-yellow-400 font-bold">{((s.target - s.entry) / (s.entry - s.stopLoss)).toFixed(1)}:1</div></div></div>
        </div>
      ))}</div>
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">AI-generated signals · Not financial advice</div>
    </div>
  );
}
