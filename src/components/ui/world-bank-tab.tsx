"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import type { WorldBankTimeSeries } from '@/lib/data/worldbank';
import { formatWBValue, generateSparklineData } from '@/lib/data/worldbank';

interface WorldBankTabProps {
  data: WorldBankTimeSeries[];
  loading: boolean;
}

// Mini sparkline SVG component
function Sparkline({ data, width = 80, height = 20, color = '#10b981' }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorldBankTab({ data, loading }: WorldBankTabProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading World Bank data...</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No World Bank data available</div>;
  }

  const selected = data.find(d => d.indicatorId === selectedIndicator);

  return (
    <div className="p-2 space-y-1">
      {/* View mode toggle */}
      <div className="flex justify-end mb-1">
        <div className="flex gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm ${viewMode === 'grid' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-black/30 text-gray-600'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm ${viewMode === 'list' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-black/30 text-gray-600'}`}
          >
            List
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-1.5">
          {data.map(indicator => {
            const sparklineData = generateSparklineData(indicator.data);
            const trendColor = indicator.trend === 'up' ? 'text-emerald-400' : indicator.trend === 'down' ? 'text-[#ff1a1a]' : indicator.trend === 'volatile' ? 'text-yellow-400' : 'text-gray-500';
            const sparkColor = indicator.trend === 'up' ? '#10b981' : indicator.trend === 'down' ? '#ff1a1a' : '#eab308';

            return (
              <div
                key={indicator.indicatorId}
                className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer group"
                onClick={() => setSelectedIndicator(indicator.indicatorId === selectedIndicator ? null : indicator.indicatorId)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider truncate max-w-[140px]">
                    {indicator.indicatorId}
                  </div>
                  <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${trendColor}`}>
                    {indicator.trend === 'up' ? <ArrowUpRight size={9} /> : indicator.trend === 'down' ? <ArrowDownRight size={9} /> : indicator.trend === 'volatile' ? <TrendingUp size={9} /> : <Minus size={9} />}
                    {formatWBValue(indicator.latestValue, indicator.indicatorId)}
                  </div>
                </div>
                <div className="text-[7px] text-gray-700 font-mono mb-1">
                  {indicator.latestYear} · Δ {indicator.changePercent !== null ? `${indicator.changePercent >= 0 ? '+' : ''}${indicator.changePercent.toFixed(2)}%` : 'N/A'}
                </div>
                {sparklineData.length >= 2 && (
                  <Sparkline data={sparklineData} width={120} height={16} color={sparkColor} />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-0.5">
          {data.map(indicator => (
            <div
              key={indicator.indicatorId}
              className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between hover:border-red-900/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-bold text-gray-200 font-mono truncate max-w-[250px]">
                  {indicator.indicatorName}
                </div>
                <div className="text-[7px] text-gray-600 font-mono">
                  {indicator.country} · {indicator.latestYear}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkline
                  data={generateSparklineData(indicator.data)}
                  width={60}
                  height={14}
                  color={indicator.trend === 'up' ? '#10b981' : indicator.trend === 'down' ? '#ff1a1a' : '#eab308'}
                />
                <div className="text-right">
                  <div className={`text-[10px] font-mono font-bold ${indicator.trend === 'up' ? 'text-emerald-400' : indicator.trend === 'down' ? 'text-[#ff1a1a]' : 'text-gray-500'}`}>
                    {formatWBValue(indicator.latestValue, indicator.indicatorId)}
                  </div>
                  <div className={`text-[7px] font-mono ${indicator.changePercent !== null ? (indicator.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]') : 'text-gray-600'}`}>
                    {indicator.changePercent !== null ? `${indicator.changePercent >= 0 ? '+' : ''}${indicator.changePercent.toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="mt-2 bg-black/60 border border-red-900/30 px-3 py-2">
          <div className="text-[9px] font-bold text-[#ff1a1a] font-mono mb-2">{selected.indicatorName}</div>
          <div className="grid grid-cols-4 gap-2 text-[8px] font-mono mb-2">
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Latest</div>
              <div className="text-gray-200 font-bold">{formatWBValue(selected.latestValue, selected.indicatorId)}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Year</div>
              <div className="text-gray-200 font-bold">{selected.latestYear}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Change</div>
              <div className={`${selected.changePercent !== null ? (selected.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]') : 'text-gray-600'} font-bold`}>
                {selected.changePercent !== null ? `${selected.changePercent >= 0 ? '+' : ''}${selected.changePercent.toFixed(2)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Trend</div>
              <div className="text-gray-200 font-bold uppercase">{selected.trend}</div>
            </div>
          </div>
          {/* Historical data table */}
          <div className="text-[8px] text-gray-600 font-mono mb-1">Historical (Last 10 years):</div>
          <div className="grid grid-cols-5 gap-0.5">
            {selected.data.slice(0, 10).map(d => (
              <div key={d.year} className="bg-black/30 border border-red-900/10 px-1.5 py-1 text-center">
                <div className="text-gray-600">{d.year}</div>
                <div className="text-gray-300 font-bold">{formatWBValue(d.value, selected.indicatorId)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: World Bank Open Data (data.worldbank.org)
      </div>
    </div>
  );
}
