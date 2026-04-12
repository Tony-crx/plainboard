"use client";

import { useState } from 'react';
import type { SectorInfo, MostActiveStock } from '@/lib/data/sectors';
import { calculateSectorPerformance, fetchMostActiveStocks } from '@/lib/data/sectors';

interface SectorsTabProps {
  sectors: SectorInfo[];
  loading: boolean;
}

interface MostActiveTabProps {
  stocks: MostActiveStock[];
  loading: boolean;
}

// Heatmap color scale
function getHeatmapColor(percent: number): string {
  if (percent > 3) return 'bg-emerald-500';
  if (percent > 2) return 'bg-emerald-400';
  if (percent > 1) return 'bg-emerald-400/80';
  if (percent > 0.5) return 'bg-emerald-400/60';
  if (percent > 0) return 'bg-emerald-400/40';
  if (percent > -0.5) return 'bg-[#ff1a1a]/40';
  if (percent > -1) return 'bg-[#ff1a1a]/60';
  if (percent > -2) return 'bg-[#ff1a1a]/80';
  if (percent > -3) return 'bg-[#ff1a1a]';
  return 'bg-[#ff1a1a]';
}

export function SectorsHeatmap({ sectors, loading }: SectorsTabProps) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'list'>('heatmap');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading sector data...</div>;
  }

  if (sectors.length === 0) {
    return <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No sector data available</div>;
  }

  const selected = sectors.find(s => s.name === selectedSector);

  return (
    <div className="p-2 space-y-1">
      {/* View mode toggle */}
      <div className="flex justify-end mb-1">
        <div className="flex gap-0.5">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm ${viewMode === 'heatmap' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-black/30 text-gray-600'}`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-1.5 py-0.5 text-[7px] font-mono rounded-sm ${viewMode === 'list' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-black/30 text-gray-600'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="grid grid-cols-3 gap-1">
          {sectors.map(sector => (
            <div
              key={sector.name}
              className={`${getHeatmapColor(sector.changePercent)} border border-red-900/20 px-2 py-2 cursor-pointer hover:border-red-900/50 transition-all hover:scale-[1.02]`}
              onClick={() => setSelectedSector(sector.name === selectedSector ? null : sector.name)}
            >
              <div className="text-[8px] font-bold text-white font-mono uppercase truncate">
                {sector.name}
              </div>
              <div className={`text-[12px] font-black font-mono ${sector.changePercent >= 0 ? 'text-white' : 'text-white'}`}>
                {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
              </div>
              <div className="text-[6px] text-white/70 font-mono">
                {sector.stocks.length} stocks
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-0.5">
          {sectors.map(sector => (
            <div
              key={sector.name}
              className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer"
              onClick={() => setSelectedSector(sector.name === selectedSector ? null : sector.name)}
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold text-gray-200 font-mono">{sector.name}</div>
                <div className={`text-[10px] font-mono font-bold ${sector.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {sector.stocks.slice(0, 6).map(stock => (
                  <span key={stock} className="px-1 py-0.5 text-[7px] font-mono bg-black/30 text-gray-500 rounded-sm">
                    {stock}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected sector detail */}
      {selected && (
        <div className="mt-2 bg-black/60 border border-red-900/30 px-3 py-2">
          <div className="text-[9px] font-bold text-[#ff1a1a] font-mono mb-2">{selected.name} Sector</div>
          <div className="grid grid-cols-3 gap-2 text-[8px] font-mono mb-2">
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Performance</div>
              <div className={`${selected.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold text-[14px]`}>
                {selected.changePercent >= 0 ? '+' : ''}{selected.changePercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Stocks</div>
              <div className="text-gray-200 font-bold text-[14px]">{selected.stocks.length}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Trend</div>
              <div className={`${selected.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold text-[14px]`}>
                {selected.changePercent >= 0 ? '▲ Bullish' : '▼ Bearish'}
              </div>
            </div>
          </div>
          {/* Constituent stocks */}
          <div className="text-[8px] text-gray-600 font-mono mb-1">Constituent Stocks:</div>
          <div className="grid grid-cols-2 gap-0.5">
            {selected.stocks.map(stock => (
              <div key={stock} className="bg-black/30 border border-red-900/10 px-1.5 py-1 flex items-center justify-between">
                <span className="text-[9px] text-gray-200 font-mono font-bold">{stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: Yahoo Finance via /api/stocks
      </div>
    </div>
  );
}

export function MostActiveStocks({ stocks, loading }: MostActiveTabProps) {
  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading most active stocks...</div>;
  }

  if (stocks.length === 0) {
    return <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No active stock data</div>;
  }

  return (
    <div className="p-2 space-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1 border-b border-red-900/20 mb-1">
        <div className="text-[8px] text-gray-600 font-mono uppercase tracking-wider">Top {stocks.length} by Volume</div>
        <div className="text-[7px] text-gray-700 font-mono">Vol Ratio = Volume / Avg</div>
      </div>

      {/* Stock list */}
      {stocks.map((stock, idx) => (
        <div
          key={stock.symbol}
          className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-[8px] text-gray-600 font-mono w-4">#{idx + 1}</div>
              <div>
                <div className="text-[10px] font-bold text-gray-200 font-mono">{stock.symbol}</div>
                <div className="text-[7px] text-gray-600 font-mono truncate max-w-[120px]">{stock.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-gray-200 font-mono">{stock.price.toLocaleString('id-ID')}</div>
                <div className={`text-[8px] font-mono ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-gray-400 font-mono">
                  Vol: {(stock.volume / 1000000).toFixed(1)}M
                </div>
                <div className={`text-[8px] font-mono font-bold ${stock.unusualVolume ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {stock.volumeRatio.toFixed(1)}x
                </div>
              </div>
            </div>
          </div>
          {/* Unusual volume alert */}
          {stock.unusualVolume && (
            <div className="mt-1 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-[7px] text-yellow-400 font-mono">
              ⚠️ Unusual Volume ({stock.volumeRatio.toFixed(1)}x average)
            </div>
          )}
        </div>
      ))}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Auto-refresh every 60 seconds · Source: Yahoo Finance
      </div>
    </div>
  );
}
