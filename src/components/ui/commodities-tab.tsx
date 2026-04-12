"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import type { CommodityPrice } from '@/lib/data/commodities';
import { generateCommoditySparkline } from '@/lib/data/commodities';

interface CommoditiesTabProps {
  commodities: CommodityPrice[];
  loading: boolean;
}

// Mini sparkline for commodities
function CommoditySparkline({ data, width = 60, height = 16, color = '#10b981' }: { data: number[]; width?: number; height?: number; color?: string }) {
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
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommoditiesTab({ commodities, loading }: CommoditiesTabProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading commodity data...</div>;
  }

  if (commodities.length === 0) {
    return <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No commodity data available</div>;
  }

  const selected = commodities.find(c => c.id === selectedCommodity);

  return (
    <div className="p-2 space-y-1">
      {/* Commodity list */}
      <div className="space-y-0.5">
        {commodities.map(comm => {
          const sparklineData = comm.sparkline || generateCommoditySparkline(comm.price, 0.02, 30);
          const trendColor = comm.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]';
          const sparkColor = comm.change >= 0 ? '#10b981' : '#ff1a1a';

          return (
            <div
              key={comm.id}
              className="bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-red-900/40 transition-colors cursor-pointer"
              onClick={() => setSelectedCommodity(comm.id === selectedCommodity ? null : comm.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-gray-200 font-mono flex items-center gap-1">
                    {comm.name}
                    <span className="text-[7px] text-gray-600 font-mono">({comm.symbol})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CommoditySparkline data={sparklineData} width={50} height={12} color={sparkColor} />
                  <div className="text-right">
                    <div className="text-[10px] text-gray-200 font-mono font-bold">
                      {comm.unit.includes('USD') && comm.price > 100
                        ? `$${comm.price.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`
                        : comm.price.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[7px] font-mono flex items-center gap-0.5 justify-end ${trendColor}`}>
                      {comm.change > 0 ? <ArrowUpRight size={8} /> : comm.change < 0 ? <ArrowDownRight size={8} /> : <Minus size={8} />}
                      {comm.change >= 0 ? '+' : ''}{comm.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected commodity detail */}
      {selected && (
        <div className="mt-2 bg-black/60 border border-red-900/30 px-3 py-2">
          <div className="text-[9px] font-bold text-[#ff1a1a] font-mono mb-2">
            {selected.name} ({selected.symbol})
          </div>

          <div className="grid grid-cols-3 gap-2 text-[8px] font-mono mb-2">
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Price</div>
              <div className="text-gray-200 font-bold">{selected.price.toLocaleString('id-ID')} {selected.unit.split('/')[0]}</div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Change</div>
              <div className={`${selected.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'} font-bold`}>
                {selected.change >= 0 ? '+' : ''}{selected.change.toFixed(2)} ({selected.changePercent.toFixed(2)}%)
              </div>
            </div>
            <div className="bg-black/40 border border-red-900/15 px-2 py-1">
              <div className="text-gray-600">Updated</div>
              <div className="text-gray-200 font-bold">{new Date(selected.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Related IDX stocks */}
          <div className="text-[8px] text-gray-600 font-mono mb-1">Related IDX Stocks:</div>
          <div className="flex flex-wrap gap-1">
            {['gold', 'silver'].includes(selected.id) && ['ANTM', 'MDKA', 'BRMS'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-sm">
                {stock}
              </span>
            ))}
            {['wti', 'brent'].includes(selected.id) && ['MEDC', 'PGAS', 'ELSA'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-sm">
                {stock}
              </span>
            ))}
            {selected.id === 'coal' && ['ADRO', 'ITMG', 'UNTR', 'PTBA'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-sm">
                {stock}
              </span>
            ))}
            {selected.id === 'cpo' && ['LSIP', 'AALI', 'DSNG'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded-sm">
                {stock}
              </span>
            ))}
            {selected.id === 'nickel' && ['ANTM', 'MDKA', 'VALE', 'INKO'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-sm">
                {stock}
              </span>
            ))}
            {selected.id === 'copper' && ['ANTM', 'MDKA', 'BBSR'].map(stock => (
              <span key={stock} className="px-1.5 py-0.5 text-[7px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-sm">
                {stock}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: Metals.live, EIA, Market Reference Data
      </div>
    </div>
  );
}
