"use client";

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { BondYield } from '@/lib/data/bonds';
import { generateYieldCurveData, calculateYieldSpread } from '@/lib/data/bonds';

interface BondsTabProps {
  idBonds: BondYield[];
  usBonds: BondYield[];
  loading: boolean;
}

// Yield Curve SVG Chart
function YieldCurveChart({ data, color = '#10b981', height = 80 }: { data: Array<{ tenor: string; yield: number; tenorNum: number }>; color?: string; height?: number }) {
  if (data.length < 2) return null;

  const width = 280;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minYield = Math.min(...data.map(d => d.yield)) - 0.5;
  const maxYield = Math.max(...data.map(d => d.yield)) + 0.5;
  const yieldRange = maxYield - minYield || 1;

  const points = data.map(d => {
    const x = padding + (Math.log(d.tenorNum + 1) / Math.log(30 + 1)) * chartWidth;
    const y = padding + chartHeight - ((d.yield - minYield) / yieldRange) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line
          key={pct}
          x1={padding}
          y1={padding + chartHeight * pct}
          x2={width - padding}
          y2={padding + chartHeight * pct}
          stroke="#8b000020"
          strokeWidth="0.5"
        />
      ))}
      {/* Area fill */}
      <path d={areaD} fill={`url(#gradient-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="#050000" strokeWidth="1" />
          <text x={p.x} y={height - 5} textAnchor="middle" className="text-[6px]" fill="#6b7280" fontSize="6" fontFamily="monospace">
            {p.tenor}
          </text>
        </g>
      ))}
      {/* Yield labels */}
      {[0, 0.5, 1].map(pct => {
        const yieldVal = maxYield - (yieldRange * pct);
        return (
          <text
            key={pct}
            x={padding - 3}
            y={padding + chartHeight * pct + 3}
            textAnchor="end"
            fill="#6b7280"
            fontSize="6"
            fontFamily="monospace"
          >
            {yieldVal.toFixed(1)}%
          </text>
        );
      })}
    </svg>
  );
}

export function BondsTab({ idBonds, usBonds, loading }: BondsTabProps) {
  const [activeTab, setActiveTab] = useState<'id' | 'us' | 'spread'>('id');

  if (loading) {
    return <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading bond data...</div>;
  }

  const idData = generateYieldCurveData(idBonds, 'ID');
  const usData = generateYieldCurveData(usBonds, 'US');
  const spread10Y = calculateYieldSpread([...idBonds, ...usBonds], '10Y', '10Y');

  return (
    <div className="p-2 space-y-1">
      {/* Tab selector */}
      <div className="flex border-b border-red-900/20 mb-2">
        {[
          { key: 'id' as const, label: '🇮🇩 Indonesia SUN' },
          { key: 'us' as const, label: '🇺🇸 US Treasury' },
          { key: 'spread' as const, label: '📊 Spread ID-US' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-1 text-[8px] font-bold font-mono uppercase tracking-wider transition-colors ${
              activeTab === tab.key
                ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indonesia Bonds */}
      {activeTab === 'id' && (
        <div className="space-y-1">
          {idBonds.length === 0 && (
            <div className="text-center py-4 text-gray-600 text-[9px] font-mono">
              No Indonesia bond data
            </div>
          )}
          {idBonds.map(bond => (
            <div key={bond.tenor} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between">
              <div className="text-[10px] font-bold text-gray-200 font-mono">{bond.tenor}</div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-gray-200 font-mono font-bold">{bond.yield.toFixed(2)}%</div>
                  <div className="text-[7px] text-gray-600 font-mono">{bond.date}</div>
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${bond.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {bond.change > 0 ? <ArrowUpRight size={9} /> : bond.change < 0 ? <ArrowDownRight size={9} /> : <Minus size={9} />}
                  {bond.change >= 0 ? '+' : ''}{bond.change.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          {/* Yield Curve Chart */}
          {idData.length >= 2 && (
            <div className="mt-2 bg-black/30 border border-red-900/15 px-2 py-2">
              <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Yield Curve</div>
              <YieldCurveChart data={idData} color="#10b981" />
            </div>
          )}
        </div>
      )}

      {/* US Treasuries */}
      {activeTab === 'us' && (
        <div className="space-y-1">
          {usBonds.length === 0 && (
            <div className="text-center py-4 text-gray-600 text-[9px] font-mono">
              No US Treasury data (set FRED API key)
            </div>
          )}
          {usBonds.map(bond => (
            <div key={bond.tenor} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between">
              <div className="text-[10px] font-bold text-gray-200 font-mono">{bond.tenor}</div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-gray-200 font-mono font-bold">{bond.yield.toFixed(2)}%</div>
                  <div className="text-[7px] text-gray-600 font-mono">{bond.date}</div>
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${bond.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {bond.change > 0 ? <ArrowUpRight size={9} /> : bond.change < 0 ? <ArrowDownRight size={9} /> : <Minus size={9} />}
                  {bond.change >= 0 ? '+' : ''}{bond.change.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
          {/* Yield Curve Chart */}
          {usData.length >= 2 && (
            <div className="mt-2 bg-black/30 border border-red-900/15 px-2 py-2">
              <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">Yield Curve</div>
              <YieldCurveChart data={usData} color="#3b82f6" />
            </div>
          )}
        </div>
      )}

      {/* Spread Analysis */}
      {activeTab === 'spread' && (
        <div className="space-y-1">
          <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="text-[9px] font-bold text-gray-200 font-mono mb-1">10Y Government Bond Spread</div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <div>
                <div className="text-gray-600">🇮🇩 Indonesia 10Y</div>
                <div className="text-emerald-400 font-bold">
                  {idBonds.find(b => b.tenor === '10Y')?.yield.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">🇺🇸 US 10Y</div>
                <div className="text-blue-400 font-bold">
                  {usBonds.find(b => b.tenor === '10Y')?.yield.toFixed(2)}%
                </div>
              </div>
            </div>
            {spread10Y !== null && (
              <div className="mt-2 pt-2 border-t border-red-900/15">
                <div className="text-[8px] text-gray-600 font-mono">Spread (ID - US)</div>
                <div className={`text-[16px] font-black font-mono ${spread10Y >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {spread10Y >= 0 ? '+' : ''}{spread10Y.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
          {/* All tenors comparison */}
          <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
            <div className="text-[8px] text-gray-600 font-mono uppercase mb-1">All Tenors Comparison</div>
            {['1Y', '2Y', '5Y', '10Y', '30Y'].map(tenor => {
              const idBond = idBonds.find(b => b.tenor === tenor);
              const usBond = usBonds.find(b => b.tenor === tenor);
              if (!idBond || !usBond) return null;

              const spread = idBond.yield - usBond.yield;
              return (
                <div key={tenor} className="flex items-center justify-between py-1 border-b border-red-900/10 last:border-0">
                  <div className="text-[9px] font-bold text-gray-200 font-mono w-12">{tenor}</div>
                  <div className="text-[9px] text-emerald-400 font-mono">{idBond.yield.toFixed(2)}%</div>
                  <div className="text-[9px] text-blue-400 font-mono">{usBond.yield.toFixed(2)}%</div>
                  <div className={`text-[9px] font-mono font-bold ${spread >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                    {spread >= 0 ? '+' : ''}{spread.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Source attribution */}
      <div className="px-1 py-1 text-[7px] text-gray-700 font-mono text-center">
        Source: Bank Indonesia & FRED (Federal Reserve Economic Data)
      </div>
    </div>
  );
}
