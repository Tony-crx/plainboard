"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';
import type { VolatilityData, TechnicalSignal, SupportResistance } from '@/lib/data/volatility-technical';
import {
  IDX_VIX_HISTORY,
  getVolatilityLevel,
  getFearGreed,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculatePivotPoints,
  generateTechnicalSignals,
} from '@/lib/data/volatility-technical';

interface VolatilityIndexProps {
  loading: boolean;
}

interface TechnicalAnalysisPanelProps {
  loading: boolean;
}

// Volatility Index Component
export function VolatilityIndexTab({ loading }: VolatilityIndexProps) {
  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading volatility data...</div>;
  }

  const latest = IDX_VIX_HISTORY[0];
  const level = getVolatilityLevel(latest.value);
  const fearGreed = getFearGreed(latest.value);

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'low': return 'text-emerald-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-[#ff1a1a]';
      default: return 'text-gray-500';
    }
  };

  const getGreedColor = (fg: string) => {
    switch (fg) {
      case 'Greed': return 'text-emerald-400';
      case 'Fear': return 'text-[#ff1a1a]';
      default: return 'text-gray-400';
    }
  };

  // Mini sparkline
  const sparkData = IDX_VIX_HISTORY.slice(0, 10).map(d => d.value).reverse();
  const min = Math.min(...sparkData);
  const max = Math.max(...sparkData);
  const width = 200;
  const height = 40;

  const points = sparkData.map((val, i) => {
    const x = (i / (sparkData.length - 1)) * width;
    const y = height - ((val - min) / (max - min || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-2 space-y-1">
      {/* Current VIX */}
      <div className="bg-black/40 border border-red-900/15 px-3 py-2 text-center mb-1">
        <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider mb-1">IDX Volatility Index</div>
        <div className={`text-[36px] font-black font-mono ${getLevelColor(level)}`}>
          {latest.value.toFixed(2)}
        </div>
        <div className={`flex items-center justify-center gap-0.5 text-[10px] font-mono font-bold ${latest.change >= 0 ? 'text-[#ff1a1a]' : 'text-emerald-400'}`}>
          {latest.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {latest.change >= 0 ? '+' : ''}{latest.change.toFixed(2)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm ${getLevelColor(level)} bg-black/30`}>
            {level}
          </span>
          <span className={`text-[8px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm ${getGreedColor(fearGreed)} bg-black/30`}>
            {fearGreed}
          </span>
        </div>
      </div>

      {/* Sparkline chart */}
      <div className="bg-black/40 border border-red-900/15 px-2 py-2 mb-1">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">10-Day Trend</div>
        <svg width={width} height={height} className="w-full">
          <polyline points={points} fill="none" stroke={latest.change >= 0 ? '#ff1a1a' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {sparkData.map((val, i) => (
            <circle
              key={i}
              cx={(i / (sparkData.length - 1)) * width}
              cy={height - ((val - min) / (max - min || 1)) * (height - 4) - 2}
              r="2"
              fill={latest.change >= 0 ? '#ff1a1a' : '#10b981'}
            />
          ))}
        </svg>
      </div>

      {/* Historical data */}
      <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">History</div>
      <div className="space-y-0.5">
        {IDX_VIX_HISTORY.slice(0, 7).map((v, idx) => (
          <div key={idx} className="flex items-center justify-between bg-black/40 border border-red-900/15 px-2 py-1">
            <div className="flex items-center gap-1">
              <div className="text-[8px] text-gray-600 font-mono">{v.date}</div>
              <div className={`text-[7px] font-mono font-bold uppercase px-1 py-0.5 rounded-sm ${getLevelColor(v.level)} bg-black/30`}>
                {v.level}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`text-[10px] font-mono font-bold ${getLevelColor(v.level)}`}>{v.value.toFixed(2)}</div>
              <div className={`text-[8px] font-mono ${v.change >= 0 ? 'text-[#ff1a1a]' : 'text-emerald-400'}`}>
                {v.change >= 0 ? '+' : ''}{v.change.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Estimated from IDX options data · Real-time via IDX API in production
      </div>
    </div>
  );
}

// Technical Analysis Panel
export function TechnicalAnalysisPanel({ loading }: TechnicalAnalysisPanelProps) {
  const [selectedSymbol, setSelectedSymbol] = useState('BBCA');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading technical analysis...</div>;
  }

  // Sample price data for calculation
  const samplePrices = [8900, 9100, 9250, 9150, 9300, 9500, 9650, 9600, 9750, 9800, 10750];
  const currentPrice = 10750;

  const rsi = calculateRSI(samplePrices);
  const macd = calculateMACD(samplePrices);
  const bollinger = calculateBollingerBands(samplePrices);
  const pivot = calculatePivotPoints(10800, 10600, currentPrice);

  const signals = generateTechnicalSignals(selectedSymbol, currentPrice, rsi, macd, bollinger);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-emerald-400';
      case 'sell': return 'text-[#ff1a1a]';
      default: return 'text-gray-500';
    }
  };

  const getSignalBg = (signal: string) => {
    switch (signal) {
      case 'buy': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'sell': return 'border-[#ff1a1a]/30 bg-[#ff1a1a]/5';
      default: return 'border-gray-500/30';
    }
  };

  return (
    <div className="p-2 space-y-1">
      {/* Symbol selector */}
      <div className="flex gap-1 mb-2">
        {['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO'].map(sym => (
          <button
            key={sym}
            onClick={() => setSelectedSymbol(sym)}
            className={`flex-1 px-2 py-0.5 text-[8px] font-bold font-mono rounded-sm ${
              selectedSymbol === sym
                ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30'
                : 'bg-black/30 text-gray-600 border border-red-900/15'
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono mb-2">
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">RSI (14)</div>
          <div className={`text-[14px] font-bold ${rsi > 70 ? 'text-[#ff1a1a]' : rsi < 30 ? 'text-emerald-400' : 'text-gray-200'}`}>
            {rsi.toFixed(1)}
          </div>
          <div className="text-[7px] text-gray-600">
            {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
          </div>
        </div>
        <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
          <div className="text-gray-600">MACD</div>
          <div className={`text-[14px] font-bold ${macd.histogram > 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
            {macd.macd.toFixed(2)}
          </div>
          <div className="text-[7px] text-gray-600">
            {macd.histogram > 0 ? 'Bullish' : 'Bearish'}
          </div>
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5 mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Bollinger Bands</div>
        <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
          <div className="text-center">
            <div className="text-gray-600">Upper</div>
            <div className="text-[#ff1a1a] font-bold">{bollinger.upper.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Middle</div>
            <div className="text-gray-200 font-bold">{bollinger.middle.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Lower</div>
            <div className="text-emerald-400 font-bold">{bollinger.lower.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Support/Resistance */}
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5 mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Support/Resistance</div>
        <div className="grid grid-cols-4 gap-1 text-[7px] font-mono">
          <div className="text-center">
            <div className="text-emerald-400">S3</div>
            <div className="text-gray-200 font-bold">{pivot.support3.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-emerald-400">S2</div>
            <div className="text-gray-200 font-bold">{pivot.support2.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-[#ff1a1a]">R1</div>
            <div className="text-gray-200 font-bold">{pivot.resistance1.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="text-[#ff1a1a]">R2</div>
            <div className="text-gray-200 font-bold">{pivot.resistance2.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Signals */}
      <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Signals</div>
      <div className="space-y-0.5">
        {signals.map((signal, idx) => (
          <div key={idx} className={`bg-black/40 border px-2 py-1.5 ${getSignalBg(signal.signal)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className={`text-[8px] font-bold font-mono uppercase px-1 py-0.5 rounded-sm ${getSignalColor(signal.signal)} bg-black/30`}>
                  {signal.signal}
                </div>
                <div className="text-[9px] text-gray-200 font-mono font-bold">{signal.indicator}</div>
              </div>
              <div className={`text-[8px] font-mono ${getSignalColor(signal.signal)}`}>
                {signal.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Technical indicators calculated from price data
      </div>
    </div>
  );
}
