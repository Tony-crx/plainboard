"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Network, ShieldAlert, Code2, Calculator, UserCog, BookOpen,
  Layers, Globe, Bell, Key, RefreshCw, X, Play, Pause,
  ChevronRight, ChevronDown, ChevronLeft, Terminal,
  BarChart3, DollarSign, LineChart, Briefcase, Clock,
  Newspaper, GitBranch, Database, Activity,
} from 'lucide-react';
import {
  getApiKeys, fetchAllData, ApiKeys,
  getWatchlist, removeFromWatchlist, WatchlistItem,
} from '@/lib/news/api-integrations';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { globalWorkerLogStore } from '@/lib/communication/worker-live-logs';
import { globalSmartRouter } from '@/lib/swarm/smart-router';
import { globalCronScheduler } from '@/lib/queue/cron-scheduler';
import dynamic from 'next/dynamic';
import type { WorldBankTimeSeries } from '@/lib/data/worldbank';
import type { BondYield } from '@/lib/data/bonds';
import type { CommodityPrice } from '@/lib/data/commodities';
import type { IPOInfo } from '@/lib/data/ipo-calendar';
import type { SectorInfo, MostActiveStock } from '@/lib/data/sectors';
import { fetchAllWBIndicators } from '@/lib/data/worldbank';
import { fetchIDBondYields, fetchUSTreasuryYields } from '@/lib/data/bonds';
import { fetchCommodityPrices } from '@/lib/data/commodities';
import { fetchUpcomingIPOs, fetchRecentIPOs } from '@/lib/data/ipo-calendar';
import { calculateSectorPerformance, fetchMostActiveStocks } from '@/lib/data/sectors';
import { NewsRail } from '@/components/board/news-rail';
import {
  BloombergHomeView,
  MarketStatusStrip,
} from '@/components/board/home-view';

// ─── Lazy tabs ────────────────────────────────────────────────────────────────
const ApiKeyManager       = dynamic(() => import('@/components/ui/api-key-manager').then(m => ({ default: m.ApiKeyManager })), { ssr: false });
const WorldBankTab        = dynamic(() => import('@/components/ui/world-bank-tab').then(m => ({ default: m.WorldBankTab })), { loading: () => <LoadingTab /> });
const BondsTab            = dynamic(() => import('@/components/ui/bonds-tab').then(m => ({ default: m.BondsTab })), { loading: () => <LoadingTab /> });
const CommoditiesTab      = dynamic(() => import('@/components/ui/commodities-tab').then(m => ({ default: m.CommoditiesTab })), { loading: () => <LoadingTab /> });
const IPOCalendarTab      = dynamic(() => import('@/components/ui/ipo-calendar-tab').then(m => ({ default: m.IPOCalendarTab })), { loading: () => <LoadingTab /> });
const CorporateActionsTab = dynamic(() => import('@/components/ui/corporate-actions-tab').then(m => ({ default: m.CorporateActionsTab })), { loading: () => <LoadingTab /> });
const SectorsHeatmap      = dynamic(() => import('@/components/ui/sectors-most-active').then(m => ({ default: m.SectorsHeatmap })), { loading: () => <LoadingTab /> });
const MostActiveStocks    = dynamic(() => import('@/components/ui/sectors-most-active').then(m => ({ default: m.MostActiveStocks })), { loading: () => <LoadingTab /> });
const StockScreenerPanel  = dynamic(() => import('@/components/ui/stock-screener-panel').then(m => ({ default: m.StockScreenerPanel })), { loading: () => <LoadingTab /> });
const MutualFundTracker   = dynamic(() => import('@/components/ui/mutual-fund-tracker').then(m => ({ default: m.MutualFundTracker })), { loading: () => <LoadingTab /> });
const EconomicCalendarTab = dynamic(() => import('@/components/ui/economic-calendar').then(m => ({ default: m.EconomicCalendarTab })), { loading: () => <LoadingTab /> });
const BIRateTrackerTab    = dynamic(() => import('@/components/ui/economic-calendar').then(m => ({ default: m.BIRateTrackerTab })), { loading: () => <LoadingTab /> });
const CurrencyStrengthMeter  = dynamic(() => import('@/components/ui/currency-breadth').then(m => ({ default: m.CurrencyStrengthMeter })), { loading: () => <LoadingTab /> });
const MarketBreadthDashboard = dynamic(() => import('@/components/ui/currency-breadth').then(m => ({ default: m.MarketBreadthDashboard })), { loading: () => <LoadingTab /> });
const VolatilityIndexTab     = dynamic(() => import('@/components/ui/volatility-technical').then(m => ({ default: m.VolatilityIndexTab })), { loading: () => <LoadingTab /> });
const TechnicalAnalysisPanel = dynamic(() => import('@/components/ui/volatility-technical').then(m => ({ default: m.TechnicalAnalysisPanel })), { loading: () => <LoadingTab /> });
const PortfolioSimulator     = dynamic(() => import('@/components/ui/portfolio-simulator').then(m => ({ default: m.PortfolioSimulator })), { loading: () => <LoadingTab /> });
const AlertSystem            = dynamic(() => import('@/components/ui/alert-system').then(m => ({ default: m.AlertSystem })), { loading: () => <LoadingTab /> });
const MultiWorkspaceSystem   = dynamic(() => import('@/components/ui/multi-workspace').then(m => ({ default: m.MultiWorkspaceSystem })), { loading: () => <LoadingTab /> });
const EarningsCalendarTab    = dynamic(() => import('@/components/ui/earnings-calendar').then(m => ({ default: m.EarningsCalendarTab })), { loading: () => <LoadingTab /> });
const GlobalMarketsOverview  = dynamic(() => import('@/components/ui/global-markets').then(m => ({ default: m.GlobalMarketsOverview })), { loading: () => <LoadingTab /> });
const CommoditiesCorrelationMatrix = dynamic(() => import('@/components/ui/commodities-correlation').then(m => ({ default: m.CommoditiesCorrelationMatrix })), { loading: () => <LoadingTab /> });
const SectorRotationModelTab = dynamic(() => import('@/components/ui/sector-rotation').then(m => ({ default: m.SectorRotationModelTab })), { loading: () => <LoadingTab /> });
const RiskManagementDashboard = dynamic(() => import('@/components/ui/risk-management').then(m => ({ default: m.RiskManagementDashboard })), { loading: () => <LoadingTab /> });
const NewsSentimentAnalyzer  = dynamic(() => import('@/components/ui/news-sentiment').then(m => ({ default: m.NewsSentimentAnalyzer })), { loading: () => <LoadingTab /> });
const AITradingSignals       = dynamic(() => import('@/components/ui/ai-trading-signals').then(m => ({ default: m.AITradingSignals })), { loading: () => <LoadingTab /> });
const BacktestingEngine      = dynamic(() => import('@/components/ui/backtesting-engine').then(m => ({ default: m.BacktestingEngine })), { loading: () => <LoadingTab /> });

// ─── Constants ────────────────────────────────────────────────────────────────
const BOARD_AGENTS = [
  { name: 'COORD', icon: Network,     desc: 'Swarm Orchestrator',   role: 'MASTER' },
  { name: 'TRIAGE',icon: ShieldAlert, desc: 'Routing & Triage',     role: 'ROUTER' },
  { name: 'CODER', icon: Code2,       desc: 'Software Engineering',  role: 'EXEC'   },
  { name: 'MATH',  icon: Calculator,  desc: 'Computation Engine',    role: 'EXEC'   },
  { name: 'CYN',   icon: UserCog,     desc: 'Cyberops & Anomaly',   role: 'RECON'  },
  { name: 'ADSO',  icon: BookOpen,    desc: 'Archivist & Observer',  role: 'LOG'    },
];

const TAB_GROUPS = [
  {
    id: 'home', label: 'OVERVIEW', shortKey: '`', color: '#ff3333',
    tabs: [
      { key: 'home',      label: 'Market Matrix',       description: 'Bloomberg-style overview' },
      { key: 'ihsg',      label: 'IHSG Detail' },
      { key: 'stocks',    label: 'IDX Stocks' },
      { key: 'watchlist', label: 'Watchlist' },
      { key: 'mostactive',label: 'Most Active' },
      { key: 'global',    label: 'Global Markets' },
    ],
  },
  {
    id: 'asset', label: 'ASSET CLASS', shortKey: '2', color: '#ff8800',
    tabs: [
      { key: 'crypto',      label: 'Crypto' },
      { key: 'fx',          label: 'FX' },
      { key: 'bonds',       label: 'Bonds / Rates' },
      { key: 'commodities', label: 'Commodities' },
      { key: 'correlation', label: 'Correlation' },
    ],
  },
  {
    id: 'analysis', label: 'ANALYSIS', shortKey: '3', color: '#00aaff',
    tabs: [
      { key: 'technical', label: 'Technical Analysis' },
      { key: 'vix',       label: 'Volatility Index' },
      { key: 'sectors',   label: 'Sector Heatmap' },
      { key: 'rotation',  label: 'Sector Rotation' },
      { key: 'breadth',   label: 'Market Breadth' },
      { key: 'currency',  label: 'Currency Strength' },
      { key: 'screener',  label: 'Stock Screener' },
    ],
  },
  {
    id: 'portfolio', label: 'PORTFOLIO', shortKey: '4', color: '#00e676',
    tabs: [
      { key: 'portfolio', label: 'Simulator' },
      { key: 'risk',      label: 'Risk Management' },
      { key: 'backtest',  label: 'Backtesting' },
      { key: 'signals',   label: 'AI Signals' },
      { key: 'alerts',    label: 'Alerts' },
    ],
  },
  {
    id: 'calendar', label: 'CALENDAR', shortKey: '5', color: '#aa44ff',
    tabs: [
      { key: 'econcal',   label: 'Economic Calendar' },
      { key: 'earnings',  label: 'Earnings' },
      { key: 'ipo',       label: 'IPO Calendar' },
      { key: 'birate',    label: 'BI Rate Tracker' },
      { key: 'corporate', label: 'Corporate Actions' },
    ],
  },
  {
    id: 'intel', label: 'INTEL', shortKey: '6', color: '#ffdd00',
    tabs: [
      { key: 'news',      label: 'News Feed' },
      { key: 'sentiment', label: 'Sentiment Analyzer' },
      { key: 'reddit',    label: 'Reddit' },
      { key: 'dev',       label: 'Dev.to' },
      { key: 'fred',      label: 'FRED Data' },
      { key: 'wb',        label: 'World Bank' },
      { key: 'funds',     label: 'Mutual Funds' },
    ],
  },
  {
    id: 'ops', label: 'OPS', shortKey: '7', color: '#ff44aa',
    tabs: [{ key: 'workspace', label: 'Workspace' }],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

// ─── Loading placeholder ──────────────────────────────────────────────────────
function LoadingTab() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="text-center">
        <div className="w-6 h-6 border border-[#ff3333]/30 border-t-[#ff3333] rounded-full animate-spin mx-auto mb-2" />
        <div className="text-[7px] font-mono text-[#333] tracking-[0.4em]">LOADING</div>
      </div>
    </div>
  );
}

// ─── Dual Ticker Tape ─────────────────────────────────────────────────────────
function TickerRow({
  items, reverse, height,
}: {
  items: { label: string; price: string; change: string; up: boolean }[];
  reverse?: boolean;
  height?: string;
}) {
  if (items.length === 0) return null;
  const stacked = [...items, ...items, ...items, ...items];
  return (
    <div
      className="overflow-hidden flex items-center relative"
      style={{ height: height || '26px', borderBottom: '1px solid rgba(255,51,51,0.1)' }}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: `ticker-scroll${reverse ? '-rev' : ''} ${reverse ? 40 : 35}s linear infinite` }}
      >
        {stacked.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 flex-shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.03)' }}
          >
            <span
              className="text-[8px] font-black font-mono tracking-wider"
              style={{ color: item.up ? '#00e676' : '#ff3333' }}
            >
              {item.label}
            </span>
            <span className="text-[8px] font-mono text-[#444]">{item.price}</span>
            <span
              className="text-[7px] font-black font-mono"
              style={{ color: item.up ? '#00e676' : '#ff3333' }}
            >
              {item.up ? '▲' : '▼'} {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DualTicker({ data, loading }: { data: Record<string, any[]>; loading: boolean }) {
  const stocks = (data.idx || []).slice(0, 20).map((s: any) => ({
    label: (s.symbol || '').replace('.JK', ''),
    price: s.price || '—',
    change: s.changePercent || '—',
    up: (s.changePercent || '').includes('+'),
  }));

  const fxCrypto = [
    ...(data.crypto || []).slice(0, 5).map((c: any) => ({
      label: (c.id || '').toUpperCase().slice(0, 5),
      price: c.price ? `$${c.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—',
      change: c.change24h !== undefined ? `${Math.abs(c.change24h).toFixed(2)}%` : '—',
      up: (c.change24h || 0) >= 0,
    })),
    ...(data.fx?.[0]?.rates
      ? Object.entries(data.fx[0].rates as Record<string, number>)
          .filter(([k]) => ['IDR', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD'].includes(k))
          .map(([k, v]) => ({ label: `USD/${k}`, price: v.toLocaleString('en-US', { maximumFractionDigits: 2 }), change: '—', up: true }))
      : []),
  ];

  const fallbackStocks = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'GOTO', 'BYAN', 'MDKA'].map(s => ({
    label: s, price: '—', change: '—', up: true,
  }));

  return (
    <div style={{ background: '#030000' }}>
      <TickerRow items={stocks.length > 0 ? stocks : fallbackStocks} />
      <TickerRow items={fxCrypto.length > 0 ? fxCrypto : [{ label: 'BTC', price: '—', change: '—', up: true }]} reverse />
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ onSettings, onHome }: { onSettings: () => void; onHome: () => void }) {
  const [time, setTime] = useState('--:--:--');
  const [date, setDate] = useState('');
  const [sysStats, setSysStats] = useState({ routes: 0, jobs: 0, tasks: 0, logs: 0 });

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(n.toLocaleTimeString('en-US', { hour12: false }));
      setDate(n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase());
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const update = () => setSysStats({
      routes: globalSmartRouter.getStatistics().totalRouting,
      jobs:   globalCronScheduler.getJobs().length,
      tasks:  globalTaskStore.list().length,
      logs:   globalWorkerLogStore.getGlobalLogs().length,
    });
    update();
    const i = setInterval(update, 5000);
    return () => clearInterval(i);
  }, []);

  const statsArr = [
    { label: 'ROUTES', val: sysStats.routes },
    { label: 'JOBS',   val: sysStats.jobs },
    { label: 'TASKS',  val: sysStats.tasks },
    { label: 'LOGS',   val: sysStats.logs },
  ];

  return (
    <div
      className="h-11 shrink-0 flex items-center justify-between px-4 border-b"
      style={{ borderColor: 'rgba(255,51,51,0.1)', background: 'linear-gradient(180deg,#0d0000,#050000)' }}
    >
      {/* Brand */}
      <button onClick={onHome} className="flex items-center gap-2.5 group">
        <Flame size={15} className="text-[#ff3333]" style={{ filter: 'drop-shadow(0 0 5px #ff3333)' }} />
        <div>
          <div className="text-[10px] font-black tracking-[0.5em] text-[#ff3333] leading-none">CORTISOL</div>
          <div className="text-[6px] tracking-[0.4em] text-[#333] leading-none mt-0.5 font-mono">THE BOARD</div>
        </div>
      </button>

      <div className="w-px h-5 bg-[#ff3333]/10 mx-3" />
      <div className="text-[7px] font-mono text-[#333] tracking-[0.15em] px-2 py-1 border border-[#ff3333]/08">{date}</div>

      {/* System stats */}
      <div className="hidden lg:flex items-center gap-4 ml-6">
        {statsArr.map(s => (
          <div key={s.label} className="text-center">
            <div className="text-[6px] text-[#222] font-mono tracking-[0.2em]">{s.label}</div>
            <div className="text-[10px] font-black font-mono text-[#ff3333]/50">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-[7px] font-mono text-[#00e676]/60 tracking-wider">ONLINE</span>
        </div>
        {[{ icon: Key, action: onSettings }, { icon: Bell, action: () => {} }].map(({ icon: Icon, action }, i) => (
          <button
            key={i}
            onClick={action}
            className="p-1.5 hover:bg-[#ff3333]/06 transition-all"
            style={{ border: '1px solid rgba(255,51,51,0.1)' }}
          >
            <Icon size={11} className="text-[#444] hover:text-[#ff3333] transition-colors" />
          </button>
        ))}
        <div className="w-px h-5 bg-[#ff3333]/10 mx-1" />
        <div
          className="text-[12px] font-black font-mono text-[#ff3333] tracking-[0.08em]"
          style={{ textShadow: '0 0 8px rgba(255,51,51,0.35)' }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

// ─── Left Navigation ──────────────────────────────────────────────────────────
function LeftNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (key: string) => void }) {
  const [openGroup, setOpenGroup] = useState<string>('home');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => setWatchlist(getWatchlist()), []);

  useEffect(() => {
    for (const g of TAB_GROUPS) {
      if (g.tabs.some(t => t.key === activeTab)) { setOpenGroup(g.id); break; }
    }
  }, [activeTab]);

  return (
    <div
      className="w-44 shrink-0 flex flex-col border-r overflow-hidden"
      style={{ borderColor: 'rgba(255,51,51,0.1)', background: 'rgba(4,0,0,0.97)' }}
    >
      {/* Groups */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {TAB_GROUPS.map(group => {
          const Icon = { home: BarChart3, asset: DollarSign, analysis: LineChart, portfolio: Briefcase, calendar: Clock, intel: Newspaper, ops: GitBranch }[group.id] || BarChart3;
          const isOpen = openGroup === group.id;
          const hasActive = group.tabs.some(t => t.key === activeTab);

          return (
            <div key={group.id}>
              <button
                onClick={() => setOpenGroup(isOpen ? '' : group.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left transition-all"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.025)',
                  background: hasActive ? `${group.color}08` : 'transparent',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={9} style={{ color: hasActive ? group.color : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span className="text-[7px] font-black font-mono tracking-[0.2em]" style={{ color: hasActive ? group.color : 'rgba(255,255,255,0.2)' }}>
                    {group.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[6px] font-mono text-[#1a1a1a]">{group.shortKey}</span>
                  <ChevronDown size={8} className="transition-transform" style={{ color: '#1a1a1a', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="overflow-hidden"
                  >
                    {group.tabs.map(tab => {
                      const active = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => onTabChange(tab.key)}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 transition-all"
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.015)',
                            borderLeft: active ? `2px solid ${group.color}` : '2px solid transparent',
                            background: active ? `${group.color}0a` : 'transparent',
                          }}
                        >
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: active ? group.color : 'rgba(255,255,255,0.08)' }} />
                          <span className="text-[7.5px] font-mono truncate" style={{ color: active ? group.color : 'rgba(255,255,255,0.28)', fontWeight: active ? 700 : 400 }}>
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Mini watchlist */}
      {watchlist.length > 0 && (
        <div className="border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-[6px] font-black font-mono tracking-[0.3em] text-[#ffaa00]/50">WATCHLIST</span>
          </div>
          {watchlist.slice(0, 5).map(w => (
            <div
              key={w.symbol}
              className="flex items-center justify-between px-3 py-1 cursor-pointer"
              onClick={() => onTabChange('watchlist')}
              style={{ borderTop: '1px solid rgba(255,255,255,0.02)' }}
            >
              <span className="text-[8px] font-black font-mono text-[#ffaa00]/60">{w.symbol}</span>
            </div>
          ))}
        </div>
      )}

      {/* Back link */}
      <div className="border-t p-3 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <a href="/swarm" className="flex items-center gap-1.5 text-[7px] font-mono text-[#222] hover:text-[#ff3333] transition-colors">
          <Terminal size={9} />← SWARM
        </a>
      </div>
    </div>
  );
}

// ─── Agent Rail ───────────────────────────────────────────────────────────────
function AgentRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [agents, setAgents] = useState<Record<string, { status: string; tasks: number; tokens: number }>>({});

  useEffect(() => {
    const upd = () => {
      const tasks = globalTaskStore.list();
      const map: Record<string, { status: string; tasks: number; tokens: number }> = {};
      for (const a of BOARD_AGENTS) {
        const at = tasks.filter(t => t.agentName === a.name);
        map[a.name] = { status: at.some(t => t.status === 'running') ? 'ACTIVE' : 'IDLE', tasks: at.length, tokens: at.reduce((s, t) => s + t.progress.tokenUsage.totalTokens, 0) };
      }
      setAgents(map);
    };
    upd();
    const i = setInterval(upd, 2000);
    return () => clearInterval(i);
  }, []);

  const active = BOARD_AGENTS.filter(a => agents[a.name]?.status === 'ACTIVE').length;

  if (collapsed) {
    return (
      <div className="w-9 shrink-0 border-l flex flex-col items-center py-2 gap-2.5 cursor-pointer" style={{ borderColor: 'rgba(255,51,51,0.08)', background: 'rgba(4,0,0,0.95)' }} onClick={onToggle}>
        <Layers size={10} className="text-[#ff3333]/40" />
        {active > 0 && <div className="w-4 h-4 rounded-full bg-[#ff3333] flex items-center justify-center"><span className="text-[6px] font-black text-black">{active}</span></div>}
        {BOARD_AGENTS.map(a => {
          const Icon = a.icon;
          const isActive = agents[a.name]?.status === 'ACTIVE';
          return <Icon key={a.name} size={11} style={{ color: isActive ? '#ff3333' : '#1a1a1a' }} />;
        })}
      </div>
    );
  }

  return (
    <div className="w-48 shrink-0 border-l flex flex-col" style={{ borderColor: 'rgba(255,51,51,0.08)', background: 'rgba(4,0,0,0.97)' }}>
      <div className="px-3 py-2 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'rgba(255,255,255,0.03)', background: 'rgba(255,51,51,0.02)' }}>
        <div className="flex items-center gap-1.5">
          <Layers size={9} className="text-[#ff3333]/50" />
          <span className="text-[7px] font-black font-mono tracking-[0.3em] text-[#ff3333]/50">SWARM</span>
          {active > 0 && <span className="text-[6px] px-1 font-black font-mono text-black bg-[#ff3333]">{active} LIVE</span>}
        </div>
        <button onClick={onToggle}><ChevronRight size={9} className="text-[#222]" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {BOARD_AGENTS.map(a => {
          const Icon = a.icon;
          const d = agents[a.name] || { status: 'IDLE', tasks: 0, tokens: 0 };
          const isActive = d.status === 'ACTIVE';
          return (
            <div key={a.name} className="p-2 transition-all" style={{ border: `1px solid ${isActive ? 'rgba(255,51,51,0.3)' : 'rgba(255,255,255,0.03)'}`, background: isActive ? 'rgba(255,51,51,0.05)' : 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={10} style={{ color: isActive ? '#ff3333' : '#1a1a1a' }} />
                  <span className="text-[8px] font-black font-mono text-white/70">{a.name}</span>
                </div>
                <span className="text-[6px] font-black font-mono px-1 py-0.5" style={{ background: isActive ? '#ff3333' : 'rgba(255,255,255,0.04)', color: isActive ? '#000' : '#222' }}>
                  {d.status}
                </span>
              </div>
              <div className="text-[6px] text-[#222] font-mono">{a.role} · {(d.tokens / 1000).toFixed(1)}k tok</div>
              <div className="mt-1.5 h-0.5 bg-[#0a0a0a]">
                <div className="h-full bg-[#ff3333]/30" style={{ width: `${Math.min(d.tasks * 25, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-2 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <div className="text-[6px] text-[#1a1a1a] font-mono tracking-wider mb-1">SWARM CONTROL</div>
        <div className="grid grid-cols-2 gap-1">
          {[{ icon: Play, label: 'START', c: '#00e676' }, { icon: Pause, label: 'PAUSE', c: '#ffaa00' }, { icon: X, label: 'KILL', c: '#ff3333' }, { icon: RefreshCw, label: 'RST', c: '#00aaff' }].map(ac => (
            <button key={ac.label} className="flex items-center justify-center gap-1 py-1 text-[6px] font-black font-mono tracking-wider transition-all" style={{ border: '1px solid rgba(255,255,255,0.04)', color: ac.c }}>
              <ac.icon size={7} />{ac.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Data Viewport ───────────────────────────────────────────────────────
interface ViewportProps {
  apiKeys: ApiKeys;
  activeTab: string;
  onTabChange: (key: string) => void;
  allData: Record<string, any[]>;
  mainLoading: boolean;
  onRefreshAll: () => void;
  commodities: CommodityPrice[];
  mostActive: MostActiveStock[];
  sectors: SectorInfo[];
}

function DataViewport({ apiKeys, activeTab, onTabChange, allData, mainLoading, onRefreshAll, commodities, mostActive, sectors }: ViewportProps) {
  const [wbData, setWbData] = useState<WorldBankTimeSeries[]>([]);
  const [idBonds, setIdBonds] = useState<BondYield[]>([]);
  const [usBonds, setUsBonds] = useState<BondYield[]>([]);
  const [upcomingIPOs, setUpcomingIPOs] = useState<IPOInfo[]>([]);
  const [recentIPOs, setRecentIPOs] = useState<IPOInfo[]>([]);
  const [tabSectors, setTabSectors] = useState<SectorInfo[]>([]);
  const [tabMostActive, setTabMostActive] = useState<MostActiveStock[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => setWatchlist(getWatchlist()), [activeTab]);

  useEffect(() => {
    setTabLoading(true);
    const load = async () => {
      try {
        if (activeTab === 'wb') { const d = await fetchAllWBIndicators(); setWbData(d); }
        if (activeTab === 'bonds') { const [id, us] = await Promise.all([fetchIDBondYields(), apiKeys.fred ? fetchUSTreasuryYields(apiKeys.fred) : Promise.resolve([])]); setIdBonds(id); setUsBonds(us); }
        if (activeTab === 'ipo') { const [u, r] = await Promise.all([fetchUpcomingIPOs(), fetchRecentIPOs()]); setUpcomingIPOs(u); setRecentIPOs(r); }
        if (activeTab === 'sectors') { const d = await calculateSectorPerformance(); setTabSectors(d); }
        if (activeTab === 'mostactive') { const d = await fetchMostActiveStocks(10); setTabMostActive(d); }
      } catch {}
      setTabLoading(false);
    };
    if (['wb', 'bonds', 'ipo', 'sectors', 'mostactive'].includes(activeTab)) load();
    else setTabLoading(false);
  }, [activeTab, apiKeys.fred]);

  const activeGroup = TAB_GROUPS.find(g => g.tabs.some(t => t.key === activeTab));
  const accentColor = activeGroup?.color || '#ff3333';
  const tabLabel = ALL_TABS.find(t => t.key === activeTab)?.label || activeTab.toUpperCase();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Breadcrumb bar */}
      <div className="h-8 shrink-0 flex items-center justify-between px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-2">
          {activeGroup && <span className="text-[7px] font-mono" style={{ color: `${accentColor}60` }}>{activeGroup.label} /</span>}
          <span className="text-[8px] font-black font-mono" style={{ color: accentColor }}>{tabLabel.toUpperCase()}</span>
          {(mainLoading || tabLoading) && <RefreshCw size={8} className="text-[#ff3333]/40 animate-spin" />}
        </div>
        <button onClick={onRefreshAll} className="p-1 hover:bg-[#ff3333]/05 transition-all" style={{ border: '1px solid rgba(255,51,51,0.08)' }}>
          <RefreshCw size={9} className="text-[#222] hover:text-[#ff3333]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${accentColor}30 transparent` }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="h-full">

            {/* HOME — Bloomberg matrix */}
            {activeTab === 'home' && (
              <BloombergHomeView
                data={allData}
                loading={mainLoading}
                commodities={commodities}
                mostActive={mostActive}
                sectors={sectors}
              />
            )}

            {/* IHSG detail */}
            {activeTab === 'ihsg' && (
              <div className="p-6">
                {(allData.ihsg || []).length === 0 && !mainLoading && (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-[#222]">
                    <Database size={28} className="mb-3 opacity-30" />
                    <div className="text-[8px] font-mono tracking-[0.3em]">NO IHSG DATA — CHECK API KEYS</div>
                  </div>
                )}
                {(allData.ihsg || []).map((h: any, i: number) => {
                  const up = h.change >= 0;
                  const color = up ? '#00e676' : '#ff3333';
                  return (
                    <div key={i} className="text-center py-10">
                      <div className="text-[8px] text-[#333] font-mono tracking-[0.5em] mb-3">JAKARTA COMPOSITE INDEX</div>
                      <div className="text-[56px] font-black font-mono" style={{ color, textShadow: `0 0 40px ${color}30` }}>
                        {h.value?.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[22px] font-black font-mono mt-2" style={{ color }}>
                        {up ? '+' : ''}{h.change?.toFixed(2)} ({up ? '+' : ''}{h.changePercent?.toFixed(2)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* IDX Stocks */}
            {activeTab === 'stocks' && (
              <div className="p-4">
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-1.5">
                  {(allData.idx || []).map((s: any) => {
                    const up = (s.changePercent || '').includes('+');
                    return (
                      <div key={s.symbol} className="p-2.5 transition-all cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,51,51,0.25)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black font-mono text-white/80">{(s.symbol || '').replace('.JK', '')}</div>
                            <div className="text-[7px] font-mono text-[#333] truncate max-w-[100px]">{s.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold font-mono text-white/60">{s.price}</div>
                            <div className="text-[8px] font-black font-mono" style={{ color: up ? '#00e676' : '#ff3333' }}>{s.changePercent}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Watchlist */}
            {activeTab === 'watchlist' && (
              <div className="p-4 space-y-1.5">
                {watchlist.length === 0 && <div className="text-center py-16 text-[#1a1a1a] text-[8px] font-mono tracking-[0.3em]">EMPTY — ADD STOCKS FROM IDX TAB</div>}
                {watchlist.map(w => (
                  <div key={w.symbol} className="p-3 flex items-center justify-between" style={{ border: '1px solid rgba(255,170,0,0.1)', background: 'rgba(255,170,0,0.02)' }}>
                    <span className="text-[12px] font-black font-mono text-[#ffaa00]">{w.symbol}</span>
                    <button onClick={() => { removeFromWatchlist(w.symbol); setWatchlist(getWatchlist()); }} className="p-1 text-[#333] hover:text-[#ff3333] transition-colors"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Crypto */}
            {activeTab === 'crypto' && (
              <div className="p-4 grid grid-cols-2 xl:grid-cols-3 gap-1.5">
                {(allData.crypto || []).map((c: any) => (
                  <div key={c.id} className="p-2.5" style={{ border: '1px solid rgba(255,136,0,0.08)', background: 'rgba(255,136,0,0.02)' }}>
                    <div className="flex justify-between">
                      <div><div className="text-[10px] font-black font-mono text-white/80 uppercase">{c.id?.slice(0, 8)}</div><div className="text-[7px] text-[#333] font-mono">{c.name}</div></div>
                      <div className="text-right"><div className="text-[10px] font-mono text-white/60">${c.price?.toLocaleString()}</div><div className="text-[8px] font-black font-mono" style={{ color: c.change24h >= 0 ? '#00e676' : '#ff3333' }}>{c.change24h?.toFixed(2)}%</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FX */}
            {activeTab === 'fx' && (
              <div className="p-4 grid grid-cols-2 xl:grid-cols-4 gap-1.5">
                {(allData.fx || []).flatMap((fx: any) =>
                  Object.entries(fx.rates || {}).filter(([k]) => ['IDR', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CNY', 'MYR', 'KRW', 'INR', 'CHF', 'HKD'].includes(k)).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-2.5 flex items-center justify-between" style={{ border: '1px solid rgba(0,255,136,0.06)', background: 'rgba(0,255,136,0.01)' }}>
                      <span className="text-[10px] font-black font-mono text-white/70">USD/{k}</span>
                      <span className="text-[10px] font-mono text-white/50">{typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 4 }) : v}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* News / Reddit / Dev / Fred */}
            {['news', 'reddit', 'dev', 'fred'].includes(activeTab) && (
              <div className="p-4 space-y-1.5">
                {activeTab === 'news' && [...(allData.news || []), ...(allData.news2 || [])].map((a: any, i: number) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block p-3 transition-all" style={{ border: '1px solid rgba(255,221,0,0.06)', background: 'rgba(255,221,0,0.01)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,221,0,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,221,0,0.06)')}>
                    <div className="text-[9px] font-mono text-white/70 leading-snug">{a.title}</div>
                    <div className="flex gap-3 mt-1 text-[7px] text-[#222] font-mono">
                      <span>{a.sourceLabel || a.source}</span>
                      <span>{a.publishedAt ? new Date(a.publishedAt).toLocaleTimeString() : ''}</span>
                    </div>
                  </a>
                ))}
                {activeTab === 'reddit' && (allData.reddit || []).map((p: any) => (
                  <a key={p.id} href={`https://reddit.com${p.url}`} target="_blank" rel="noopener noreferrer" className="block p-3 transition-all" style={{ border: '1px solid rgba(255,69,0,0.06)', background: 'rgba(255,69,0,0.01)' }}>
                    <div className="text-[9px] font-mono text-white/70 leading-snug">{p.title}</div>
                    <div className="flex gap-3 mt-1 text-[7px] text-[#222] font-mono"><span>r/{p.subreddit}</span><span>⬆ {p.score}</span></div>
                  </a>
                ))}
                {activeTab === 'dev' && (allData.devto || []).map((a: any) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block p-3 transition-all" style={{ border: '1px solid rgba(0,170,255,0.06)', background: 'rgba(0,170,255,0.01)' }}>
                    <div className="text-[9px] font-mono text-white/70 leading-snug">{a.title}</div>
                    <div className="flex gap-3 mt-1 text-[7px] text-[#222] font-mono"><span>{a.author}</span><span>❤ {a.positiveReactionsCount}</span></div>
                  </a>
                ))}
                {activeTab === 'fred' && (allData.fred || []).map((d: any) => (
                  <div key={d.id} className="p-3" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] font-mono text-white/70">{d.title}</div>
                      <span className="text-[10px] font-black font-mono" style={{ color: d.trend === 'up' ? '#00e676' : d.trend === 'down' ? '#ff3333' : '#444' }}>{d.value}</span>
                    </div>
                    <div className="text-[7px] text-[#222] font-mono mt-0.5">{d.date}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic tab components */}
            {activeTab === 'wb'          && <WorldBankTab data={wbData} loading={tabLoading} />}
            {activeTab === 'bonds'       && <BondsTab idBonds={idBonds} usBonds={usBonds} loading={tabLoading} />}
            {activeTab === 'commodities' && <CommoditiesTab commodities={commodities} loading={tabLoading} />}
            {activeTab === 'ipo'         && <IPOCalendarTab upcoming={upcomingIPOs} recent={recentIPOs} loading={tabLoading} />}
            {activeTab === 'corporate'   && <CorporateActionsTab loading={false} />}
            {activeTab === 'sectors'     && <SectorsHeatmap sectors={tabSectors} loading={tabLoading} />}
            {activeTab === 'mostactive'  && <MostActiveStocks stocks={tabMostActive} loading={tabLoading} />}
            {activeTab === 'screener'    && <StockScreenerPanel loading={false} />}
            {activeTab === 'funds'       && <MutualFundTracker loading={false} />}
            {activeTab === 'econcal'     && <EconomicCalendarTab loading={false} />}
            {activeTab === 'birate'      && <BIRateTrackerTab loading={false} />}
            {activeTab === 'currency'    && <CurrencyStrengthMeter loading={false} />}
            {activeTab === 'breadth'     && <MarketBreadthDashboard loading={false} />}
            {activeTab === 'vix'         && <VolatilityIndexTab loading={false} />}
            {activeTab === 'technical'   && <TechnicalAnalysisPanel loading={false} />}
            {activeTab === 'portfolio'   && <PortfolioSimulator loading={false} />}
            {activeTab === 'alerts'      && <AlertSystem loading={false} />}
            {activeTab === 'workspace'   && <MultiWorkspaceSystem currentTab={activeTab} onTabChange={onTabChange} availableTabs={ALL_TABS.map(t => t.key)} />}
            {activeTab === 'earnings'    && <EarningsCalendarTab loading={false} />}
            {activeTab === 'global'      && <GlobalMarketsOverview loading={false} />}
            {activeTab === 'correlation' && <CommoditiesCorrelationMatrix loading={false} />}
            {activeTab === 'rotation'    && <SectorRotationModelTab loading={false} />}
            {activeTab === 'risk'        && <RiskManagementDashboard loading={false} />}
            {activeTab === 'sentiment'   && <NewsSentimentAnalyzer loading={false} />}
            {activeTab === 'signals'     && <AITradingSignals loading={false} />}
            {activeTab === 'backtest'    && <BacktestingEngine loading={false} />}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Status Bar ───────────────────────────────────────────────────────────────
function StatusBar({ error }: { error: string }) {
  const [ts, setTs] = useState('');
  const [stats, setStats] = useState({ routes: 0, jobs: 0, tasks: 0, logs: 0 });

  useEffect(() => {
    setTs(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const i = setInterval(() => setTs(new Date().toLocaleTimeString('en-US', { hour12: false })), 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const update = () => setStats({
      routes: globalSmartRouter.getStatistics().totalRouting,
      jobs:   globalCronScheduler.getJobs().length,
      tasks:  globalTaskStore.list().length,
      logs:   globalWorkerLogStore.getGlobalLogs().length,
    });
    update();
    const i = setInterval(update, 10000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="h-6 shrink-0 flex items-center justify-between px-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.7)' }}>
      <div className="flex items-center gap-4 text-[6px] font-mono text-[#1a1a1a] tracking-wider">
        <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#00e676]" /> SYSTEM ONLINE</span>
        <span>SWARM: {stats.routes} ROUTES</span>
        <span>CRON: {stats.jobs} JOBS</span>
        {error && <span className="text-[#ffaa00]/60 truncate max-w-[240px]">⚠ {error}</span>}
      </div>
      <div className="flex items-center gap-4 text-[6px] font-mono text-[#1a1a1a] tracking-wider">
        <span>TASKS: {stats.tasks}</span>
        <span>LOGS: {stats.logs}</span>
        <span suppressHydrationWarning>{ts}</span>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function TheBoard() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [allData, setAllData] = useState<Record<string, any[]>>({});
  const [mainLoading, setMainLoading] = useState(true);
  const [error, setError] = useState('');
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [mostActive, setMostActive] = useState<MostActiveStock[]>([]);
  const [sectors, setSectors] = useState<SectorInfo[]>([]);
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [newsVisible, setNewsVisible] = useState(true);
  const newsRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('board_api_keys');
      if (s) try { setApiKeys(JSON.parse(s)); } catch {}
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setMainLoading(true); setError('');
    try {
      const { results, errors } = await fetchAllData(apiKeys);
      setAllData(results);
      if (errors.length > 0) setError(errors.slice(0, 2).join(' · '));
    } catch (e: any) {
      setError(e?.message || 'Fetch error');
    }
    setMainLoading(false);
  }, [apiKeys]);

  const fetchSupportData = useCallback(async () => {
    try {
      const [comm, active, sect] = await Promise.all([
        fetchCommodityPrices(),
        fetchMostActiveStocks(10),
        calculateSectorPerformance(),
      ]);
      setCommodities(comm);
      setMostActive(active);
      setSectors(sect);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAll();
    fetchSupportData();
    const i1 = setInterval(fetchAll, 120000);
    const i2 = setInterval(fetchSupportData, 300000);
    // News auto-refresh every 30s
    const i3 = setInterval(() => { newsRefreshRef.current?.(); }, 30000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, [fetchAll, fetchSupportData]);

  const handleNewsRefresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#030000]" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,20,20,0.03) 0%, transparent 60%)' }} />

      {/* Layer stack */}
      <DualTicker data={allData} loading={mainLoading} />
      <TopBar onSettings={() => setShowSettings(true)} onHome={() => setActiveTab('home')} />
      <MarketStatusStrip data={allData} loading={mainLoading} />

      {/* Main body */}
      <div className="flex-1 flex min-h-0 relative z-10">
        <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />
        <DataViewport
          apiKeys={apiKeys}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          allData={allData}
          mainLoading={mainLoading}
          onRefreshAll={fetchAll}
          commodities={commodities}
          mostActive={mostActive}
          sectors={sectors}
        />
        <NewsRail
          newsData={allData}
          loading={mainLoading}
          onRefresh={handleNewsRefresh}
          visible={newsVisible}
          onToggle={() => setNewsVisible(v => !v)}
        />
        <AgentRail collapsed={agentCollapsed} onToggle={() => setAgentCollapsed(v => !v)} />
      </div>

      <StatusBar error={error} />

      <ApiKeyManager
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={() => {
          const s = localStorage.getItem('board_api_keys');
          if (s) try { setApiKeys(JSON.parse(s)); } catch {}
        }}
      />
    </div>
  );
}
