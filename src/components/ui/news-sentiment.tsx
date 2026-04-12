"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { SentimentAnalysis } from '@/lib/data/news-sentiment';
import { SENTIMENT_DATA, calculateAvgSentiment } from '@/lib/data/news-sentiment';

interface NewsSentimentAnalyzerProps { loading: boolean; }

export function NewsSentimentAnalyzer({ loading }: NewsSentimentAnalyzerProps) {
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  if (loading) return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>;

  const filtered = filter === 'all' ? SENTIMENT_DATA : SENTIMENT_DATA.filter(s => s.sentiment === filter);
  const avgScore = SENTIMENT_DATA.reduce((sum, s) => sum + s.score, 0) / SENTIMENT_DATA.length;

  return (
    <div className="p-2 space-y-1">
      <div className="bg-black/40 border border-red-900/15 px-2 py-1.5 text-center mb-2">
        <div className="text-[8px] text-gray-600 font-mono uppercase">Overall Sentiment</div>
        <div className={`text-[20px] font-black font-mono ${avgScore >= 0.3 ? 'text-emerald-400' : avgScore <= -0.3 ? 'text-[#ff1a1a]' : 'text-gray-400'}`}>{avgScore >= 0 ? '+' : ''}{avgScore.toFixed(2)}</div>
        <div className="text-[7px] text-gray-600 font-mono">{avgScore >= 0.3 ? 'Bullish' : avgScore <= -0.3 ? 'Bearish' : 'Neutral'}</div>
      </div>
      <div className="flex gap-1 mb-2">{['all', 'bullish', 'bearish', 'neutral'].map(f => (
        <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 px-1.5 py-0.5 text-[7px] font-bold font-mono uppercase rounded-sm ${filter === f ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/30' : 'bg-black/30 text-gray-600 border border-red-900/15'}`}>{f}</button>
      ))}</div>
      <div className="space-y-0.5">{filtered.map(s => (
        <div key={s.id} className={`bg-black/40 border px-2 py-1.5 ${s.sentiment === 'bullish' ? 'border-emerald-500/20' : s.sentiment === 'bearish' ? 'border-[#ff1a1a]/20' : 'border-gray-500/20'}`}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              {s.sentiment === 'bullish' ? <ArrowUpRight size={10} className="text-emerald-400"/> : s.sentiment === 'bearish' ? <ArrowDownRight size={10} className="text-[#ff1a1a]"/> : <Minus size={10} className="text-gray-500"/>}
              <div className="text-[9px] font-bold text-gray-200 font-mono truncate max-w-[180px]">{s.headline}</div>
            </div>
            <div className={`text-[9px] font-mono font-bold ${s.sentiment === 'bullish' ? 'text-emerald-400' : s.sentiment === 'bearish' ? 'text-[#ff1a1a]' : 'text-gray-500'}`}>{s.score.toFixed(2)}</div>
          </div>
          <div className="flex items-center justify-between text-[7px] text-gray-600 font-mono"><span>{s.source} · {s.date}</span><span>Confidence: {(s.confidence * 100).toFixed(0)}%</span></div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">{s.relatedStocks.map(st => <span key={st} className="px-1 py-0.5 text-[7px] font-mono bg-black/30 text-gray-400 rounded-sm">{st}</span>)}</div>
        </div>
      ))}</div>
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">AI-powered sentiment analysis on financial news</div>
    </div>
  );
}
