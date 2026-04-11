"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  label?: string;
  unit?: string;
}

export function MiniLineChart({ 
  data, 
  color = '#ff4444', 
  height = 60, 
  label,
  unit 
}: LineChartProps) {
  const [points, setPoints] = useState('');
  const [areaPath, setAreaPath] = useState('');

  useEffect(() => {
    if (data.length < 2) return;

    const padding = 4;
    const chartWidth = 200;
    const chartHeight = height - padding * 2;
    
    const min = Math.min(...data.map(d => d.value));
    const max = Math.max(...data.map(d => d.value));
    const range = max - min || 1;

    const pts = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
      const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    setPoints(pts);

    // Create area path
    const firstX = padding;
    const lastX = padding + chartWidth - padding * 2;
    const areaPoints = `${firstX},${padding + chartHeight} ${pts} ${lastX},${padding + chartHeight}`;
    setAreaPath(areaPoints);
  }, [data, height]);

  const latest = data[data.length - 1]?.value || 0;
  const trend = data.length >= 2 
    ? ((data[data.length - 1].value - data[data.length - 2].value) / (data[data.length - 2].value || 1)) * 100
    : 0;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-200">
              {latest.toFixed(1)}{unit}
            </span>
            {trend !== 0 && (
              <span className={`text-[8px] font-mono ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {trend > 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
      <svg width="200" height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && (
          <polygon
            points={areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
          />
        )}
        {points && (
          <>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.length > 0 && (
              <circle
                cx={200 - 4}
                cy={(() => {
                  const padding = 4;
                  const chartHeight = height - padding * 2;
                  const min = Math.min(...data.map(d => d.value));
                  const max = Math.max(...data.map(d => d.value));
                  const range = max - min || 1;
                  return padding + chartHeight - ((data[data.length - 1].value - min) / range) * chartHeight;
                })()}
                r="3"
                fill={color}
                className="animate-pulse"
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  color?: string;
  data?: DataPoint[];
}

export function MetricCard({ label, value, unit, trend, color = '#ff4444', data }: MetricCardProps) {
  return (
    <div className="border border-red-900/20 bg-black/40 p-3 clip-bottom-right space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-red-600/70 uppercase font-bold tracking-wider">{label}</span>
        {trend !== undefined && (
          <span className={`text-[8px] font-mono ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-lg font-mono text-gray-200">
        <span style={{ color }}>{value}</span>{unit && <span className="text-red-900 ml-1">{unit}</span>}
      </div>
      {data && data.length > 0 && <MiniLineChart data={data} color={color} height={40} />}
    </div>
  );
}

interface TelemetryChartsProps {
  tokenUsage?: DataPoint[];
  responseTime?: DataPoint[];
  costData?: DataPoint[];
}

export function TelemetryCharts({ tokenUsage, responseTime, costData }: TelemetryChartsProps) {
  return (
    <div className="space-y-4">
      {tokenUsage && <MetricCard label="Token Usage" value={tokenUsage[tokenUsage.length - 1]?.value || 0} unit="tokens" data={tokenUsage} color="#ff4444" />}
      {responseTime && <MetricCard label="Response Time" value={(responseTime[responseTime.length - 1]?.value || 0).toFixed(0)} unit="ms" data={responseTime} color="#ff8844" />}
      {costData && <MetricCard label="Cost" value={`$${(costData[costData.length - 1]?.value || 0).toFixed(4)}`} data={costData} color="#ff4488" />}
    </div>
  );
}
