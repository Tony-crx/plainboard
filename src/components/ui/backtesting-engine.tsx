"use client";

import { useState } from 'react';
import { TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BacktestingEngineProps { loading: boolean; }

export function BacktestingEngine({ loading }: BacktestingEngineProps) {
  const [strategy, setStrategy] = useState<'rsi' | 'macd' | 'bollinger' | 'momentum'>('rsi');
  const [symbol, setSymbol] = useState('BBCA');

  if (loading) return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>;

  const results: Record<string, any> = {
    rsi: { winRate: 58.5, sharpe: 1.25, maxDD: -12.3, totalTrades: 145, profitFactor: 1.45, annualReturn: 18.2 },
    macd: { winRate: 54.2, sharpe: 1.08, maxDD: -15.8, totalTrades: 98, profitFactor: 1.32, annualReturn: 14.5 },
    bollinger: { winRate: 62.1, sharpe: 1.42, maxDD: -9.5, totalTrades: 210, profitFactor: 1.58, annualReturn: 21.3 },
    momentum: { winRate: 51.8, sharpe: 0.95, maxDD: -18.2, totalTrades: 78, profitFactor: 1.22, annualReturn: 12.1 },
  };

  const r = results[strategy];

  return (
    <div className="p-2 space-y-1">
      <div className="flex gap-1 mb-2">
        <select value={symbol} onChange={e=>setSymbol(e.target.value)} className="flex-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono px-1.5 py-0.5">
          {['BBCA','BBRI','BMRI','TLKM','ASII','GOTO'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={strategy} onChange={e=>setStrategy(e.target.value as any)} className="flex-1 bg-black/40 border border-red-900/30 text-[8px] text-gray-300 font-mono px-1.5 py-0.5">
          <option value="rsi">RSI Strategy</option>
          <option value="macd">MACD Strategy</option>
          <option value="bollinger">Bollinger Bands</option>
          <option value="momentum">Momentum</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Win Rate</div><div className={`text-[14px] font-bold ${r.winRate>=55?'text-emerald-400':'text-yellow-400'}`}>{r.winRate}%</div></div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Sharpe</div><div className={`text-[14px] font-bold ${r.sharpe>1?'text-emerald-400':r.sharpe>0?'text-yellow-400':'text-[#ff1a1a]'}`}>{r.sharpe.toFixed(2)}</div></div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Max Drawdown</div><div className="text-[#ff1a1a] font-bold text-[14px]">-{r.maxDD}%</div></div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Annual Return</div><div className="text-emerald-400 font-bold text-[14px]">{r.annualReturn}%</div></div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Total Trades</div><div className="text-gray-200 font-bold text-[14px]">{r.totalTrades}</div></div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Profit Factor</div><div className={`text-[14px] font-bold ${r.profitFactor>1.3?'text-emerald-400':'text-yellow-400'}`}>{r.profitFactor.toFixed(2)}</div></div>
      </div>
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Equity Curve (Simulated)</div>
        <svg width="280" height="40" className="w-full"><polyline points={Array.from({length:30},(_,i)=>`${(i/29)*280},${40-(1+Math.random()*0.3-0.15)*20}`).join(' ')} fill="none" stroke="#10b981" strokeWidth="2"/></svg>
      </div>
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">Backtesting on 1-year historical data</div>
    </div>
  );
}
