"use client";

import { useState } from 'react';
import { AlertTriangle, Shield, TrendingDown } from 'lucide-react';
import type { StressTestScenario } from '@/lib/data/risk-management';
import { STRESS_TEST_SCENARIOS, calculateVaR, calculateSharpeRatio } from '@/lib/data/risk-management';

interface RiskManagementDashboardProps { loading: boolean; }

export function RiskManagementDashboard({ loading }: RiskManagementDashboardProps) {
  const [view, setView] = useState<'overview' | 'stress' | 'drawdown'>('overview');

  if (loading) return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>;

  const portfolioValue = 100000000000;
  const dailyVaR95 = calculateVaR(portfolioValue, 0.18, 0.95);
  const dailyVaR99 = calculateVaR(portfolioValue, 0.18, 0.99);
  const sharpeRatio = calculateSharpeRatio(Array.from({length: 252}, () => (Math.random() - 0.45) * 0.02));

  return (
    <div className="p-2 space-y-1">
      <div className="flex border-b border-red-900/20 mb-2">{['overview', 'stress', 'drawdown'].map(v => (
        <button key={v} onClick={() => setView(v as any)} className={`flex-1 px-2 py-1 text-[8px] font-bold font-mono uppercase transition-colors ${view === v ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]' : 'text-gray-600'}`}>{v}</button>
      ))}</div>
      {view === 'overview' && (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono">
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Portfolio Value</div><div className="text-gray-200 font-bold text-[12px]">Rp {(portfolioValue/1e9).toFixed(0)}B</div></div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600">Sharpe Ratio</div><div className={`text-[12px] font-bold ${sharpeRatio > 1 ? 'text-emerald-400' : sharpeRatio > 0 ? 'text-yellow-400' : 'text-[#ff1a1a]'}`}>{sharpeRatio.toFixed(2)}</div></div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600 flex items-center gap-0.5"><AlertTriangle size={8}/>VaR 95%</div><div className="text-yellow-400 font-bold text-[12px]">Rp {(dailyVaR95/1e9).toFixed(1)}B</div></div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1.5"><div className="text-gray-600 flex items-center gap-0.5"><Shield size={8}/>VaR 99%</div><div className="text-[#ff1a1a] font-bold text-[12px]">Rp {(dailyVaR99/1e9).toFixed(1)}B</div></div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 px-2 py-1.5 text-[8px] text-yellow-400 font-mono"><AlertTriangle size={8} className="inline mr-1"/>95% VaR means 5% chance daily loss exceeds Rp {(dailyVaR95/1e9).toFixed(1)}B</div>
        </div>
      )}
      {view === 'stress' && (
        <div className="space-y-0.5">{STRESS_TEST_SCENARIOS.map(s => (
          <div key={s.name} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="flex items-center justify-between mb-0.5"><div className="flex items-center gap-1"><TrendingDown size={10} className="text-[#ff1a1a]"/><div className="text-[10px] font-bold text-gray-200 font-mono">{s.name}</div></div><div className="text-[#ff1a1a] font-bold text-[10px] font-mono">{s.impact}%</div></div>
            <div className="text-[7px] text-gray-600 font-mono mb-0.5">{s.description}</div>
            <div className="grid grid-cols-3 gap-1 text-[7px] font-mono"><div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">Loss</div><div className="text-[#ff1a1a] font-bold">Rp {(s.portfolioLoss/1e9).toFixed(1)}B</div></div><div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">Worst</div><div className="text-gray-300 font-bold">{s.worstSector}</div></div><div className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center"><div className="text-gray-600">Recovery</div><div className="text-gray-300 font-bold">{s.recoveryTime}</div></div></div>
          </div>
        ))}</div>
      )}
      {view === 'drawdown' && (
        <div className="bg-black/40 border border-red-900/15 px-3 py-2 text-center"><div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Maximum Drawdown</div><div className="text-[24px] font-black text-[#ff1a1a] font-mono">-18.5%</div><div className="text-[7px] text-gray-600 font-mono">From peak Rp 122.5B to trough Rp 99.8B</div></div>
      )}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">Risk metrics calculated from portfolio volatility</div>
    </div>
  );
}
