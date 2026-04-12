"use client";

import { useState, useEffect, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, RefreshCw, ArrowUpRight, ArrowDownRight,
  DollarSign, BarChart3, Activity, Zap, Clock,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pct(v: number | undefined) {
  if (v === undefined || isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function num(v: number | string | undefined, dec = 2) {
  if (v === undefined || v === null) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function isUp(v: number | string | undefined) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && n > 0;
}
function isDown(v: number | string | undefined) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && n < 0;
}
function colorFor(v: number | string | undefined) {
  if (isUp(v)) return '#00e676';
  if (isDown(v)) return '#ff3333';
  return '#444';
}
function pctOf(v?: string | number) {
  if (!v) return 0;
  const n = typeof v === 'string' ? parseFloat(v.replace(/[^-\d.]/g, '')) : v;
  return isNaN(n) ? 0 : n;
}

// ─── IHSG Hero Panel ──────────────────────────────────────────────────────────
interface IHSGHeroProps {
  ihsg: any[];
  loading: boolean;
}
export const IHSGHero = memo(function IHSGHero({ ihsg, loading }: IHSGHeroProps) {
  const h = ihsg[0];

  if (loading || !h) {
    return (
      <div className="p-4 flex flex-col justify-center" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="text-[7px] font-mono text-[#222] tracking-[0.4em] mb-3">JAKARTA COMPOSITE</div>
        <div className="text-[32px] font-black font-mono text-[#ff3333]/20">——.——</div>
        {loading && <RefreshCw size={10} className="text-[#333] animate-spin mt-2" />}
      </div>
    );
  }

  const up = h.change >= 0;
  const color = up ? '#00e676' : '#ff3333';

  return (
    <div className="p-4 flex flex-col justify-between" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[7px] font-mono tracking-[0.3em] text-[#444]">JAKARTA COMPOSITE</span>
          <span className="text-[6px] font-black font-mono px-1.5 py-0.5 text-black" style={{ background: color }}>
            {up ? 'BULL' : 'BEAR'}
          </span>
        </div>
        <div className="text-[38px] font-black font-mono leading-none" style={{ color, textShadow: `0 0 30px ${color}40` }}>
          {h.value?.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1" style={{ color }}>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span className="text-[14px] font-black font-mono">
              {up ? '+' : ''}{h.change?.toFixed(2)}
            </span>
          </div>
          <span className="text-[12px] font-bold font-mono" style={{ color }}>
            ({up ? '+' : ''}{h.changePercent?.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Session indicators */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: 'OPEN', val: h.open?.toLocaleString('id-ID') || '—' },
          { label: 'HIGH', val: h.high?.toLocaleString('id-ID') || '—' },
          { label: 'LOW', val: h.low?.toLocaleString('id-ID') || '—' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-[6px] text-[#222] font-mono tracking-wider">{s.label}</div>
            <div className="text-[9px] font-bold font-mono text-white/50">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Volume bar */}
      {h.volume && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[6px] font-mono text-[#222] tracking-wider">VOLUME</span>
            <span className="text-[8px] font-mono text-white/40">{h.volume}</span>
          </div>
          <div className="w-full h-0.5 bg-[#0a0a0a]">
            <motion.div
              className="h-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Global Indices Grid ──────────────────────────────────────────────────────
const WORLD_MARKETS = [
  { symbol: '^GSPC',  label: 'S&P 500',  region: 'US', flag: '🇺🇸' },
  { symbol: '^IXIC',  label: 'NASDAQ',   region: 'US', flag: '🇺🇸' },
  { symbol: '^DJI',   label: 'DOW',      region: 'US', flag: '🇺🇸' },
  { symbol: '^DAX',   label: 'DAX',      region: 'DE', flag: '🇩🇪' },
  { symbol: '^FTSE',  label: 'FTSE 100', region: 'GB', flag: '🇬🇧' },
  { symbol: '^N225',  label: 'NIKKEI',   region: 'JP', flag: '🇯🇵' },
  { symbol: '^HSI',   label: 'HANG SENG',region: 'HK', flag: '🇭🇰' },
  { symbol: '^STI',   label: 'STI',      region: 'SG', flag: '🇸🇬' },
  { symbol: '^AXJO',  label: 'ASX 200',  region: 'AU', flag: '🇦🇺' },
  { symbol: '^CAC40', label: 'CAC 40',   region: 'FR', flag: '🇫🇷' },
];

interface GlobalIndicesProps {
  globalData: any[];
  loading: boolean;
}
export const GlobalIndicesGrid = memo(function GlobalIndicesGrid({ globalData, loading }: GlobalIndicesProps) {
  const map = new Map(globalData.map((d: any) => [d.symbol, d]));

  return (
    <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Globe size={10} className="text-[#00aaff]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#00aaff]/70">WORLD MARKETS</span>
      </div>
      <div className="space-y-0.5">
        {WORLD_MARKETS.map(mkt => {
          const d = map.get(mkt.symbol);
          const chg = d?.changePercent;
          const color = colorFor(typeof chg === 'number' ? chg : parseFloat(chg || '0'));

          return (
            <div
              key={mkt.symbol}
              className="flex items-center justify-between py-1 px-1.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[8px]">{mkt.flag}</span>
                <span className="text-[8px] font-black font-mono text-white/60">{mkt.label}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-[8px] font-mono text-white/50">
                  {d?.price ? num(d.price, 0) : '—'}
                </span>
                <span className="text-[8px] font-black font-mono w-14 text-right" style={{ color }}>
                  {d?.changePercent ? pct(typeof d.changePercent === 'number' ? d.changePercent : parseFloat(d.changePercent)) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Top Movers Panel ─────────────────────────────────────────────────────────
interface TopMoversProps {
  stocks: any[];
  mostActive: any[];
  loading: boolean;
}
export const TopMoversPanel = memo(function TopMoversPanel({ stocks, mostActive, loading }: TopMoversProps) {
  const [view, setView] = useState<'gainers' | 'losers' | 'active'>('gainers');

  const sorted = [...stocks].sort((a, b) => {
    const pa = pctOf(a.changePercent);
    const pb = pctOf(b.changePercent);
    return view === 'gainers' ? pb - pa : pa - pb;
  });

  const displayed = view === 'active' ? mostActive.slice(0, 8) : sorted.slice(0, 8);

  return (
    <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={10} className="text-[#ffaa00]/70" />
          <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#ffaa00]/70">MOVERS</span>
        </div>
        <div className="flex gap-1">
          {(['gainers', 'losers', 'active'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="text-[6px] font-black font-mono px-1.5 py-0.5 transition-all tracking-wider"
              style={{
                background: view === v ? '#ffaa00' : 'rgba(255,255,255,0.03)',
                color: view === v ? '#000' : '#333',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {v === 'gainers' ? '▲' : v === 'losers' ? '▼' : '≡'} {v.slice(0, 3).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-0.5">
        {loading && <div className="text-center py-4 text-[#222] text-[7px] font-mono">LOADING...</div>}
        {displayed.slice(0, 7).map((s: any, i: number) => {
          const sym = (s.symbol || s.ticker || '').replace('.JK', '');
          const chg = s.changePercent || s.change_percent;
          const price = s.price || s.lastPrice;
          const color = colorFor(pctOf(chg));

          return (
            <div
              key={sym + i}
              className="flex items-center justify-between py-1 px-1.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[7px] text-[#333] font-mono w-3">{i + 1}</span>
                <span className="text-[8px] font-black font-mono text-white/70">{sym || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-white/40">{price ? num(price, 0) : '—'}</span>
                <span className="text-[8px] font-black font-mono w-14 text-right" style={{ color }}>
                  {chg ? pct(pctOf(chg)) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── FX Rates Panel ───────────────────────────────────────────────────────────
const KEY_PAIRS = [
  { pair: 'USD/IDR', sym: 'IDR', base: 'USD' },
  { pair: 'EUR/USD', sym: 'EUR', base: 'EUR' },
  { pair: 'GBP/USD', sym: 'GBP', base: 'GBP' },
  { pair: 'USD/JPY', sym: 'JPY', base: 'JPY' },
  { pair: 'USD/SGD', sym: 'SGD', base: 'SGD' },
  { pair: 'AUD/USD', sym: 'AUD', base: 'AUD' },
  { pair: 'USD/CNY', sym: 'CNY', base: 'CNY' },
  { pair: 'USD/MYR', sym: 'MYR', base: 'MYR' },
];

interface FXPanelProps {
  fxData: any[];
  loading: boolean;
}
export const FXRatesPanel = memo(function FXRatesPanel({ fxData, loading }: FXPanelProps) {
  const rates = fxData[0]?.rates || {};

  return (
    <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={10} className="text-[#00ff88]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#00ff88]/70">FX RATES</span>
        <span className="text-[6px] font-mono text-[#222]">(USD BASE)</span>
      </div>
      <div className="space-y-0.5">
        {KEY_PAIRS.map(pair => {
          const rate = rates[pair.sym];
          return (
            <div
              key={pair.pair}
              className="flex items-center justify-between py-1 px-1.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
            >
              <span className="text-[8px] font-black font-mono text-white/60">{pair.pair}</span>
              <span className="text-[8px] font-mono text-white/50">
                {rate ? (typeof rate === 'number' ? rate.toLocaleString('en-US', { maximumFractionDigits: 4 }) : rate) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Commodities Panel ───────────────────────────────────────────────────────
const KEY_COMMODITIES = ['Gold', 'Silver', 'Oil', 'Natural Gas', 'Copper', 'Wheat', 'Corn'];

interface CommoditiesProps {
  commodities: any[];
  loading: boolean;
}
export const CommoditiesPanel = memo(function CommoditiesPanel({ commodities, loading }: CommoditiesProps) {
  const relevant = commodities.filter(c =>
    KEY_COMMODITIES.some(k => (c.name || '').toLowerCase().includes(k.toLowerCase()))
  );

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={10} className="text-[#ffdd00]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#ffdd00]/70">COMMODITIES</span>
      </div>
      <div className="space-y-0.5">
        {(relevant.length > 0 ? relevant : KEY_COMMODITIES.map(n => ({ name: n }))).slice(0, 8).map((c: any, i: number) => {
          const color = colorFor(c.change);
          return (
            <div
              key={c.name || i}
              className="flex items-center justify-between py-1 px-1.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
            >
              <span className="text-[8px] font-black font-mono text-white/60 truncate max-w-[90px]">{c.name || '—'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-white/40">{c.price ? `$${num(c.price)}` : '—'}</span>
                <span className="text-[8px] font-black font-mono w-14 text-right" style={{ color }}>
                  {c.change ? pct(c.change) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Crypto Mini Panel ────────────────────────────────────────────────────────
const TOP_CRYPTO = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano'];

interface CryptoPanelProps {
  cryptoData: any[];
  loading: boolean;
}
export const CryptoPanel = memo(function CryptoPanel({ cryptoData, loading }: CryptoPanelProps) {
  const relevant = cryptoData.filter(c => TOP_CRYPTO.includes((c.id || '').toLowerCase())).slice(0, 6);
  const fallback = TOP_CRYPTO.slice(0, 6).map(id => ({ id, name: id, price: undefined, change24h: undefined }));
  const display = relevant.length > 0 ? relevant : fallback;

  return (
    <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={10} className="text-[#00aaff]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#00aaff]/70">CRYPTO</span>
      </div>
      <div className="space-y-0.5">
        {display.map((c: any, i: number) => {
          const color = colorFor(c.change24h);
          return (
            <div
              key={c.id || i}
              className="flex items-center justify-between py-1 px-1.5 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
            >
              <span className="text-[8px] font-black font-mono text-white/60 uppercase">{c.id?.slice(0, 7) || '—'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-white/40">
                  {c.price ? `$${c.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
                </span>
                <span className="text-[8px] font-black font-mono w-14 text-right" style={{ color }}>
                  {c.change24h !== undefined ? pct(c.change24h) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Economic Events Widget ───────────────────────────────────────────────────
const UPCOMING_EVENTS = [
  { time: '08:00', event: 'ID CPI YoY',            country: '🇮🇩', impact: 'high' },
  { time: '14:00', event: 'US Non-Farm Payrolls',   country: '🇺🇸', impact: 'high' },
  { time: '15:30', event: 'ECB Rate Decision',       country: '🇪🇺', impact: 'high' },
  { time: '19:00', event: 'Fed FOMC Minutes',        country: '🇺🇸', impact: 'medium' },
  { time: '21:00', event: 'US Initial Jobless Claims',country: '🇺🇸', impact: 'medium' },
];

export function EconEventsWidget() {
  return (
    <div className="p-3" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={10} className="text-[#aa44ff]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#aa44ff]/70">ECON EVENTS</span>
        <span className="text-[6px] font-mono text-[#222]">TODAY</span>
      </div>
      <div className="space-y-0.5">
        {UPCOMING_EVENTS.map((ev, i) => {
          const impactColor = ev.impact === 'high' ? '#ff3333' : ev.impact === 'medium' ? '#ffaa00' : '#555';
          return (
            <div
              key={i}
              className="flex items-start gap-2 py-1.5 px-1.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
            >
              <div
                className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: impactColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[6px] font-mono text-[#333]">{ev.time}</span>
                  <span className="text-[7px]">{ev.country}</span>
                </div>
                <span className="text-[8px] font-mono text-white/50 truncate block">{ev.event}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sector Heatmap Mini ──────────────────────────────────────────────────────
const SECTORS = [
  { name: 'FINANCE',   key: 'finance',   abbrev: 'FIN' },
  { name: 'ENERGY',    key: 'energy',    abbrev: 'ENE' },
  { name: 'TECH',      key: 'tech',      abbrev: 'TEC' },
  { name: 'CONSUMER',  key: 'consumer',  abbrev: 'CON' },
  { name: 'INFRA',     key: 'infra',     abbrev: 'INF' },
  { name: 'PROPERTY',  key: 'property',  abbrev: 'PRO' },
  { name: 'HEALTH',    key: 'health',    abbrev: 'HLT' },
  { name: 'MINING',    key: 'mining',    abbrev: 'MIN' },
  { name: 'AGRI',      key: 'agri',      abbrev: 'AGR' },
];

interface SectorMiniProps {
  sectorData: any[];
  loading: boolean;
}
export const SectorHeatmapMini = memo(function SectorHeatmapMini({ sectorData, loading }: SectorMiniProps) {
  // Compute derived values in useMemo — deterministic, no Math.random in render
  const cells = useMemo(() => {
    return SECTORS.map(s => {
      const d = sectorData.find((sd: any) =>
        (sd.name || '').toLowerCase().includes(s.key) ||
        (sd.sector || '').toLowerCase().includes(s.key)
      );
      const chg = d?.changePercent || d?.change;
      const n = chg ? pctOf(chg) : 0; // 0 = neutral when no real data
      const hasData = !!chg;
      const intensity = Math.min(Math.abs(n) / 3, 1);
      const bgColor = !hasData
        ? 'rgba(255,255,255,0.02)'
        : n > 0
          ? `rgba(0,230,118,${0.08 + intensity * 0.25})`
          : `rgba(255,51,51,${0.08 + intensity * 0.25})`;
      const borderColor = !hasData
        ? 'rgba(255,255,255,0.04)'
        : n > 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,51,51,0.12)';
      const textColor = !hasData ? '#333' : n > 0 ? '#00e676' : '#ff3333';
      return { s, n, hasData, bgColor, borderColor, textColor, chg };
    });
  }, [sectorData]);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={10} className="text-[#ff44aa]/70" />
        <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#ff44aa]/70">SECTOR HEATMAP</span>
        {loading && <RefreshCw size={7} className="text-[#ff44aa]/30 animate-spin" />}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {cells.map(({ s, n, hasData, bgColor, borderColor, textColor, chg }) => (
          <div
            key={s.key}
            className="p-2 text-center cursor-default"
            style={{ background: bgColor, border: `1px solid ${borderColor}` }}
          >
            <div className="text-[6px] font-black font-mono text-white/40 tracking-wider">{s.abbrev}</div>
            <div className="text-[8px] font-black font-mono" style={{ color: textColor }}>
              {hasData ? pct(n) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Market Status Strip (always above main content) ─────────────────────────
const STRIP_INDICES = [
  { label: 'IHSG',    sym: 'ihsg', flag: '🇮🇩' },
  { label: 'S&P 500', sym: 'sp500', flag: '🇺🇸' },
  { label: 'NASDAQ',  sym: 'nasdaq', flag: '🇺🇸' },
  { label: 'DAX',     sym: 'dax', flag: '🇩🇪' },
  { label: 'NIKKEI',  sym: 'nikkei', flag: '🇯🇵' },
  { label: 'HSI',     sym: 'hsi', flag: '🇭🇰' },
  { label: 'BTC',     sym: 'btc', flag: '₿' },
  { label: 'GOLD',    sym: 'gold', flag: '🥇' },
  { label: 'OIL',     sym: 'oil', flag: '🛢' },
  { label: 'DXY',     sym: 'dxy', flag: '💵' },
];

interface MarketStripProps {
  data: Record<string, any[]>;
  loading: boolean;
}
export function MarketStatusStrip({ data, loading }: MarketStripProps) {
  // Extract values from data
  const getVal = (sym: string): { price?: number; change?: number; changePct?: number } => {
    if (sym === 'ihsg') {
      const h = data.ihsg?.[0];
      return { price: h?.value, change: h?.change, changePct: h?.changePercent };
    }
    if (sym === 'btc') {
      const c = (data.crypto || []).find((c: any) => c.id === 'bitcoin');
      return { price: c?.price, changePct: c?.change24h };
    }
    if (sym === 'gold') {
      const co = (data.commodities || []).find((c: any) => (c.name || '').toLowerCase().includes('gold'));
      return { price: co?.price, changePct: co?.change };
    }
    if (sym === 'oil') {
      const co = (data.commodities || []).find((c: any) => (c.name || '').toLowerCase().includes('oil'));
      return { price: co?.price, changePct: co?.change };
    }
    // Try global markets
    const g = (data.global || []).find((g: any) =>
      (g.symbol || g.label || '').toLowerCase().includes(sym)
    );
    return { price: g?.price, changePct: g?.changePercent };
  };

  return (
    <div
      className="h-8 shrink-0 flex items-center border-b overflow-x-auto"
      style={{
        borderColor: 'rgba(255,51,51,0.08)',
        background: 'rgba(0,0,0,0.8)',
        scrollbarWidth: 'none',
      }}
    >
      {loading && <RefreshCw size={8} className="ml-3 text-[#ff3333]/30 animate-spin flex-shrink-0" />}
      {STRIP_INDICES.map((idx, i) => {
        const v = getVal(idx.sym);
        const up = (v.changePct || v.change || 0) >= 0;
        const color = v.changePct !== undefined || v.change !== undefined
          ? (up ? '#00e676' : '#ff3333')
          : '#333';

        return (
          <div
            key={idx.sym}
            className="flex items-center gap-2 px-3 flex-shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.03)', height: '100%' }}
          >
            <span className="text-[8px]">{idx.flag}</span>
            <div>
              <div className="text-[6px] text-[#333] font-mono tracking-wider leading-none">{idx.label}</div>
              <div className="flex items-center gap-1.5 leading-none mt-0.5">
                <span className="text-[8px] font-bold font-mono" style={{ color: '#666' }}>
                  {v.price ? (v.price > 1000 ? v.price.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.price.toFixed(2)) : '—'}
                </span>
                <span className="text-[7px] font-black font-mono" style={{ color }}>
                  {v.changePct !== undefined ? pct(v.changePct) : v.change !== undefined ? pct(v.change) : '—'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bloomberg Home View (6-panel matrix) ────────────────────────────────────
interface HomeViewProps {
  data: Record<string, any[]>;
  loading: boolean;
  commodities: any[];
  mostActive: any[];
  sectors: any[];
}
export function BloombergHomeView({ data, loading, commodities, mostActive, sectors }: HomeViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Top row: 3 panels */}
      <div className="flex-1 grid grid-cols-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', minHeight: 0 }}>
        {/* Panel 1: IHSG Hero */}
        <div className="overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <IHSGHero ihsg={data.ihsg || []} loading={loading} />
        </div>
        {/* Panel 2: Top Movers */}
        <div className="overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <TopMoversPanel stocks={data.idx || []} mostActive={mostActive} loading={loading} />
        </div>
        {/* Panel 3: Sector Heatmap */}
        <div className="overflow-y-auto">
          <SectorHeatmapMini sectorData={sectors} loading={loading} />
        </div>
      </div>

      {/* Bottom row: 4 panels */}
      <div className="flex-1 grid grid-cols-4" style={{ minHeight: 0 }}>
        {/* Panel 4: Global Indices */}
        <div className="overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <GlobalIndicesGrid globalData={data.global || []} loading={loading} />
        </div>
        {/* Panel 5: FX */}
        <div className="overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <FXRatesPanel fxData={data.fx || []} loading={loading} />
        </div>
        {/* Panel 6: Commodities */}
        <div className="overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          <CommoditiesPanel commodities={commodities} loading={loading} />
        </div>
        {/* Panel 7: Crypto */}
        <div className="overflow-y-auto">
          <CryptoPanel cryptoData={data.crypto || []} loading={loading} />
        </div>
      </div>
    </div>
  );
}
