"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ShieldAlert, Code2, Calculator, Flame, Database, Network,
  UserCog, BookOpen, Terminal, Zap, Layers, Globe, TrendingUp,
  TrendingDown, Minus, Bell, Settings, X, ArrowUpRight, ArrowDownRight,
  RefreshCw, Cpu, Hash, AlertTriangle, Key, Play, Pause, BarChart3,
  FileText, Command, ChevronDown, Eye, ExternalLink, Star, Trash2, Plus,
  Search, EyeOff, Maximize2, Minimize2, BookmarkPlus, BookmarkCheck,
  Clock, Radio, Monitor, Lock, Shield,
} from 'lucide-react';
import {
  getApiKeys, fetchAllData, ApiKeys,
  getWatchlist, saveWatchlist, removeFromWatchlist, addToWatchlist, WatchlistItem,
  fetchStockDetail,
} from '@/lib/news/api-integrations';
import { globalTaskStore } from '@/lib/tasks/task-store';
import { globalWorkerLogStore } from '@/lib/communication/worker-live-logs';
import { globalSmartRouter } from '@/lib/swarm/smart-router';
import { globalCronScheduler } from '@/lib/queue/cron-scheduler';
import { parseNaturalLanguage } from '@/lib/utils/natural-commands';
import { ApiKeyManager } from '@/components/ui/api-key-manager';

const BOARD_AGENTS = [
  { name: 'Coordinator', icon: Network, desc: 'Master swarm orchestrator' },
  { name: 'Triage', icon: ShieldAlert, desc: 'Main coordinator routing' },
  { name: 'Coder', icon: Code2, desc: 'Software engineering logic' },
  { name: 'Math', icon: Calculator, desc: 'Complex computations' },
  { name: 'Cyn', icon: UserCog, desc: 'Anomaly/Cyberops Hacker' },
  { name: 'Adso', icon: BookOpen, desc: 'Clerical Observer/Archivist' },
];

// ===================== TICKER TAPE =====================
function TickerTape({ stocks, loading }: { stocks: any[]; loading: boolean }) {
  const items = stocks.length > 0 ? stocks.map((s: any) => ({
    symbol: s.symbol?.replace('.JK', ''),
    price: s.price,
    change: s.changePercent,
    up: (s.changePercent || '').includes('+'),
  })) : [
    { symbol: 'BBCA', price: '—', change: '—', up: true },
    { symbol: 'BBRI', price: '—', change: '—', up: true },
    { symbol: 'BMRI', price: '—', change: '—', up: true },
    { symbol: 'TLKM', price: '—', change: '—', up: false },
    { symbol: 'ASII', price: '—', change: '—', up: true },
    { symbol: 'GOTO', price: '—', change: '—', up: false },
  ];
  return (
    <div className="overflow-hidden bg-[#0a0000] border-b border-red-900/30 h-7 flex items-center relative">
      {loading && <div className="absolute right-2 top-1/2 -translate-y-1/2"><RefreshCw size={10} className="text-gray-600 animate-spin" /></div>}
      <div className="flex animate-ticker whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 px-4 border-r border-red-900/15">
            <span className={`text-[10px] font-bold font-mono ${item.up ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{item.symbol}</span>
            <span className="text-[9px] text-gray-300 font-mono">{item.price}</span>
            <span className={`text-[9px] font-bold font-mono ${item.up ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
              {item.up ? '▲' : '▼'} {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== TOP BAR =====================
function TopBar({ onOpenSettings, onNavigateHome, alertCount, darkMode, onToggleTheme }: {
  onOpenSettings: () => void; onNavigateHome: () => void; alertCount: number;
  darkMode: boolean; onToggleTheme: () => void;
}) {
  const [time, setTime] = useState('00:00:00');
  useEffect(() => { const i = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000); return () => clearInterval(i); }, []);
  return (
    <div className={`h-11 border-b border-red-900/30 flex items-center justify-between px-4 shrink-0 ${darkMode ? 'bg-[#0a0000]' : 'bg-gray-100 border-gray-300'}`}>
      <div className="flex items-center gap-3">
        <button onClick={onNavigateHome} className="flex items-center gap-2 text-[#ff1a1a] hover:text-red-400 transition-colors">
          <Flame size={14} className="drop-shadow-[0_0_5px_#ff1a1a]" />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase glow-text-sm">CORTISOL</span>
        </button>
        <span className="text-[8px] text-gray-600 font-mono">|</span>
        <span className="text-[9px] font-bold text-yellow-500 font-mono tracking-[0.2em] uppercase">THE BOARD</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onToggleTheme} className="p-1 hover:bg-white/10 rounded-sm transition-colors">
          {darkMode ? <Eye size={13} className="text-gray-400 hover:text-yellow-400" /> : <EyeOff size={13} className="text-gray-600 hover:text-gray-400" />}
        </button>
        <div className="cursor-pointer" onClick={onOpenSettings}><Key size={13} className="text-gray-500 hover:text-[#ff1a1a] transition-colors" /></div>
        <div className="relative"><Bell size={13} className="text-gray-500" />
          {alertCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#ff1a1a] rounded-full text-[7px] text-white flex items-center justify-center font-bold animate-pulse">{alertCount > 9 ? '9+' : alertCount}</span>}
        </div>
        <Settings size={13} className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors" onClick={onOpenSettings} />
        <span className="text-[10px] font-bold text-[#ff1a1a] font-mono tracking-wider">{time}</span>
      </div>
    </div>
  );
}

// ===================== LEFT RAIL: AGENT MATRIX =====================
function AgentMatrix() {
  const [agents, setAgents] = useState<Record<string, { status: string; tasks: number; tokens: number }>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      const tasks = globalTaskStore.list();
      const updated: Record<string, { status: string; tasks: number; tokens: number }> = {};
      for (const a of BOARD_AGENTS) {
        const at = tasks.filter(t => t.agentName === a.name);
        updated[a.name] = { status: at.some(t => t.status === 'running') ? 'running' : 'idle', tasks: at.length, tokens: at.reduce((s, t) => s + t.progress.tokenUsage.totalTokens, 0) };
      }
      setAgents(updated);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="h-full flex flex-col bg-[#050000] border-r border-red-900/30">
      <div className="px-3 py-2 border-b border-red-900/20 bg-[#0a0000]">
        <div className="text-[9px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono flex items-center gap-1.5"><Layers size={12} /> AGENT MATRIX</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {BOARD_AGENTS.map(a => {
          const Icon = a.icon;
          const d = agents[a.name] || { status: 'idle', tasks: 0, tokens: 0 };
          const active = d.status === 'running';
          return (
            <div key={a.name} className={`flex items-center gap-2 px-2 py-1.5 border rounded-sm transition-all ${active ? 'border-[#ff1a1a]/50 bg-[#ff1a1a]/5' : 'border-red-900/15 bg-black/30 hover:border-red-900/30'}`}>
              <div className="relative"><Icon size={14} className={active ? 'text-[#ff1a1a]' : 'text-gray-600'} /><div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${active ? 'bg-[#ff1a1a] animate-pulse' : 'bg-gray-600'}`} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold font-mono truncate text-gray-200">{a.name}</div>
                <div className="text-[8px] text-gray-600 font-mono">{d.tasks} tasks · {(d.tokens / 1000).toFixed(1)}k tok</div>
              </div>
              <span className={`text-[7px] font-mono uppercase font-bold px-1 py-0.5 rounded-sm ${active ? 'bg-[#ff1a1a]/20 text-[#ff1a1a]' : 'bg-gray-900/30 text-gray-600'}`}>{d.status}</span>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t border-red-900/20 bg-[#0a0000]">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1 tracking-wider">Quick Actions</div>
        <div className="grid grid-cols-2 gap-1">
          {[{ icon: Play, label: 'Start', c: 'text-emerald-400' }, { icon: Pause, label: 'Pause', c: 'text-yellow-400' }, { icon: X, label: 'Kill', c: 'text-[#ff1a1a]' }, { icon: RefreshCw, label: 'Restart', c: 'text-cyan-400' }].map(a => (
            <button key={a.label} className={`flex items-center gap-1 px-1.5 py-1 text-[8px] font-bold bg-black/40 border border-red-900/20 rounded-sm hover:bg-white/5 ${a.c} font-mono uppercase`}><a.icon size={10} />{a.label}</button>
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-red-900/20 bg-[#050000]">
        <div className="text-[8px] text-gray-600 font-mono uppercase mb-1 tracking-wider">Function Keys</div>
        <div className="grid grid-cols-4 gap-0.5">{['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map(k => (<button key={k} className="px-1 py-0.5 text-[7px] font-mono bg-black/40 border border-red-900/15 text-gray-500 hover:text-[#ff1a1a] hover:border-[#ff1a1a]/50 rounded-sm">{k}</button>))}</div>
      </div>
    </div>
  );
}

// ===================== STOCK DETAIL MODAL =====================
function StockDetailModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStockDetail(symbol).then(d => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [symbol]);

  const fmt = (v: number) => v ? (v > 1e12 ? `${(v / 1e12).toFixed(1)}T` : v > 1e9 ? `${(v / 1e9).toFixed(1)}B` : v > 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString()) : 'N/A';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-lg bg-[#050000] border border-red-900/50 rounded-none clip-angled shadow-[0_0_40px_rgba(200,0,0,0.15)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/30 bg-[#0a0000]">
          <div className="text-[10px] font-black text-[#ff1a1a] tracking-[0.2em] uppercase font-mono">{symbol.replace('.JK', '')} Detail</div>
          <button onClick={onClose} className="p-1 hover:bg-[#ff1a1a]/10 rounded-sm"><X size={14} className="text-gray-500 hover:text-[#ff1a1a]" /></button>
        </div>
        <div className="p-4">
          {loading && <div className="text-center py-8 text-gray-700 text-[9px] font-mono animate-pulse">Loading...</div>}
          {detail && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-[28px] font-black font-mono text-white">{detail.price.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</div>
                <div className={`text-[14px] font-bold font-mono ${detail.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>
                  {detail.change >= 0 ? '+' : ''}{detail.change.toFixed(2)} ({detail.changePercent >= 0 ? '+' : ''}{detail.changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                {[
                  { label: 'Open', value: detail.open?.toLocaleString() },
                  { label: 'High', value: detail.high?.toLocaleString() },
                  { label: 'Low', value: detail.low?.toLocaleString() },
                  { label: 'Prev Close', value: detail.prevClose?.toLocaleString() },
                  { label: 'Volume', value: fmt(detail.volume) },
                  { label: 'Avg Volume', value: fmt(detail.avgVolume) },
                  { label: 'Market Cap', value: fmt(detail.marketCap) },
                  { label: '52W High', value: detail.fiftyTwoWeekHigh?.toLocaleString() },
                  { label: '52W Low', value: detail.fiftyTwoWeekLow?.toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
                    <div className="text-gray-600">{item.label}</div>
                    <div className="text-gray-200 font-bold">{item.value || 'N/A'}</div>
                  </div>
                ))}
              </div>
              {/* Volume ratio */}
              {detail.avgVolume > 0 && (
                <div className="bg-black/40 border border-red-900/15 px-2 py-1.5">
                  <div className="text-gray-600">Volume Ratio</div>
                  <div className={`text-emerald-400 font-bold`}>{detail.volume > 0 ? `${(detail.volume / detail.avgVolume).toFixed(1)}x` : 'N/A'}</div>
                </div>
              )}
            </div>
          )}
          {!loading && !detail && <div className="text-center py-8 text-gray-600 text-[9px] font-mono">No data available</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===================== RIGHT RAIL: DATA CENTER =====================
function RightRail({ apiKeys, darkMode }: { apiKeys: ApiKeys; darkMode: boolean }) {
  const [tab, setTab] = useState<'ihsg' | 'stocks' | 'watchlist' | 'crypto' | 'fx' | 'dev' | 'reddit' | 'news' | 'fred' | 'wb'>('ihsg');
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setWatchlist(getWatchlist()); }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const { results, errors } = await fetchAllData(apiKeys);
    setData(results);
    if (errors.length > 0) setError(errors.join(', '));
    setLoading(false);
  }, [apiKeys]);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 180000); return () => clearInterval(i); }, [fetchAll]);

  const refreshWatchlist = useCallback(() => setWatchlist(getWatchlist()), []);

  const tabs = [
    { key: 'ihsg' as const, label: 'IHSG', count: (data.ihsg || []).length },
    { key: 'stocks' as const, label: 'IDX', count: (data.idx || []).length },
    { key: 'watchlist' as const, label: '★WL', count: watchlist.length },
    { key: 'crypto' as const, label: 'Crypto', count: (data.crypto || []).length },
    { key: 'fx' as const, label: 'FX', count: (data.fx || []).length },
    { key: 'dev' as const, label: 'Dev', count: (data.devto || []).length },
    { key: 'reddit' as const, label: 'Reddit', count: (data.reddit || []).length },
    { key: 'news' as const, label: 'News', count: ((data.news || []).length + (data.news2 || []).length) },
    { key: 'fred' as const, label: 'FRED', count: (data.fred || []).length },
    { key: 'wb' as const, label: 'WB', count: (data.wb || []).length },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#050000] border-l border-red-900/30">
      <div className="px-3 py-2 border-b border-red-900/20 bg-[#0a0000] flex items-center justify-between">
        <div className="text-[9px] font-black text-[#ff1a1a] tracking-[0.3em] uppercase font-mono flex items-center gap-1.5"><Globe size={12} /> DATA CENTER</div>
        <button onClick={fetchAll} className="p-0.5 hover:bg-[#ff1a1a]/10 rounded-sm"><RefreshCw size={10} className={`text-gray-500 hover:text-[#ff1a1a] ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="flex border-b border-red-900/20 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-shrink-0 px-2 py-1.5 text-[8px] font-bold font-mono uppercase tracking-wider transition-colors ${tab === t.key ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]' : 'text-gray-600 hover:text-gray-400'}`}>
            {t.label}{t.count > 0 && <span className="ml-1 px-1 py-0.5 text-[7px] bg-[#ff1a1a]/20 rounded-sm">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#8b0000 transparent' }}>
        {loading && <div className="text-center py-4 text-gray-700 text-[9px] font-mono animate-pulse">Loading all sources...</div>}
        {error && <div className="px-2 py-1 text-[8px] text-yellow-400/60 font-mono border-b border-yellow-900/10 bg-yellow-500/5 truncate">{error}</div>}

        {/* Search Bar */}
        {(tab === 'stocks' || tab === 'watchlist' || tab === 'crypto' || tab === 'dev' || tab === 'reddit' || tab === 'news') && (
          <div className="px-2 py-1.5 border-b border-red-900/20">
            <div className="relative">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter..." className="w-full bg-black/30 border border-red-900/30 rounded-sm pl-6 pr-2 py-1 text-[9px] text-gray-300 font-mono placeholder-gray-700 focus:outline-none focus:border-[#ff1a1a]/50" />
            </div>
          </div>
        )}

        {/* IHSG Index */}
        {tab === 'ihsg' && <div className="p-3">
          {(data.ihsg || []).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No IHSG data</div>}
          {(data.ihsg || []).map((h: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">Jakarta Composite Index</div>
              <div className={`text-[28px] font-black font-mono ${h.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{h.value.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</div>
              <div className={`text-[14px] font-bold font-mono ${h.change >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{h.change >= 0 ? '+' : ''}{h.change.toFixed(2)} ({h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%)</div>
              <div className="text-[8px] text-gray-700 font-mono mt-1">Prev Close: {h.prevClose?.toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>}

        {/* IDX Stocks */}
        {tab === 'stocks' && <div className="p-2 space-y-1">
          {(data.idx || []).filter((s: any) => !searchQuery || s.symbol?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No stock data</div>}
          {(data.idx || []).filter((s: any) => !searchQuery || s.symbol?.toLowerCase().includes(searchQuery.toLowerCase())).map((s: any) => (
            <div key={s.symbol} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between hover:border-red-900/40 transition-colors cursor-pointer group" onClick={() => setSelectedStock(s.symbol)}>
              <div><div className="text-[10px] font-bold text-gray-200 font-mono">{s.symbol?.replace('.JK', '')}</div><div className="text-[7px] text-gray-600 font-mono truncate max-w-[120px]">{s.name}</div></div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); addToWatchlist(s.symbol); refreshWatchlist(); }} className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-yellow-400"><Star size={10} className="text-gray-600" /></button>
                <div className="text-right"><div className="text-[10px] text-gray-200 font-mono">{s.price}</div><div className={`text-[8px] font-mono flex items-center gap-0.5 justify-end ${(s.changePercent || '').includes('+') ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{(s.changePercent || '').includes('+') ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{s.changePercent}</div></div>
              </div>
            </div>
          ))}
        </div>}

        {/* Watchlist */}
        {tab === 'watchlist' && <div className="p-2 space-y-1">
          {watchlist.length === 0 && <div className="text-center py-8 text-gray-600 text-[9px] font-mono">Watchlist empty — click ★ on any stock to add</div>}
          {watchlist.map((w: WatchlistItem) => (
            <div key={w.symbol} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between hover:border-yellow-500/30 transition-colors cursor-pointer" onClick={() => setSelectedStock(w.symbol)}>
              <div className="text-[10px] font-bold text-yellow-500 font-mono">{w.symbol}</div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-gray-600 font-mono">{new Date(w.addedAt).toLocaleDateString()}</span>
                <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(w.symbol); refreshWatchlist(); }} className="p-0.5 hover:text-red-400"><X size={10} className="text-gray-600" /></button>
              </div>
            </div>
          ))}
        </div>}

        {/* Crypto */}
        {tab === 'crypto' && <div className="p-2 space-y-1">
          {(data.crypto || []).filter((c: any) => !searchQuery || c.id?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No crypto data</div>}
          {(data.crypto || []).filter((c: any) => !searchQuery || c.id?.toLowerCase().includes(searchQuery.toLowerCase())).map((c: any, i: number) => (
            <div key={c.id || i} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between">
              <div><div className="text-[10px] font-bold text-gray-200 font-mono uppercase">{c.id?.substring(0, 6) || 'CRYPTO'}</div><div className="text-[7px] text-gray-600 font-mono">{c.name}</div></div>
              <div className="text-right"><div className="text-[10px] text-gray-200 font-mono">${c.price?.toLocaleString()}</div><div className={`text-[8px] font-mono flex items-center gap-0.5 justify-end ${c.change24h >= 0 ? 'text-emerald-400' : 'text-[#ff1a1a]'}`}>{c.change24h >= 0 ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{c.change24h?.toFixed(2)}%</div></div>
            </div>
          ))}
        </div>}

        {/* FX Rates */}
        {tab === 'fx' && <div className="p-2 space-y-1">
          {(data.fx || []).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No FX data</div>}
          {(data.fx || []).map((fx: any, i: number) => (
            <div key={i} className="space-y-0.5">
              {Object.entries(fx.rates || {}).filter(([k]) => ['IDR', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CNY', 'MYR', 'KRW', 'INR'].includes(k)).map(([k, v]: [string, any]) => (
                <div key={k} className="flex items-center justify-between bg-black/40 border border-red-900/15 px-2 py-1">
                  <span className="text-[10px] font-bold text-gray-200 font-mono">{k}</span>
                  <span className="text-[10px] text-gray-300 font-mono">{typeof v === 'number' ? v.toFixed(2) : v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>}

        {/* Dev.to */}
        {tab === 'dev' && <div className="p-2 space-y-1">
          {(data.devto || []).filter((a: any) => !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No articles</div>}
          {(data.devto || []).filter((a: any) => !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((a: any) => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-[#ff1a1a]/30 transition-colors group">
              <div className="text-[9px] font-bold text-gray-200 font-mono group-hover:text-[#ff1a1a] truncate">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5"><span className="text-[7px] text-gray-600 font-mono">{a.author}</span><span className="text-[7px] text-gray-700 font-mono">❤️ {a.positiveReactionsCount}</span><span className="text-[7px] text-gray-700 font-mono">💬 {a.commentsCount}</span></div>
              <div className="flex gap-1 mt-0.5">{(a.tags || []).slice(0, 3).map((t: string) => <span key={t} className="px-1 py-0.5 text-[7px] font-mono bg-red-900/10 text-gray-500 rounded-sm">{t}</span>)}</div>
            </a>
          ))}
        </div>}

        {/* Reddit */}
        {tab === 'reddit' && <div className="p-2 space-y-1">
          {(data.reddit || []).filter((p: any) => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No posts</div>}
          {(data.reddit || []).filter((p: any) => !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((p: any) => (
            <a key={p.id} href={`https://reddit.com${p.url}`} target="_blank" rel="noopener noreferrer" className="block bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-[#ff1a1a]/30 transition-colors group">
              <div className="text-[9px] font-bold text-gray-200 font-mono group-hover:text-[#ff1a1a] truncate">{p.title}</div>
              <div className="flex items-center gap-2 mt-0.5"><span className="text-[7px] text-gray-600 font-mono">r/{p.subreddit}</span><span className="text-[7px] text-gray-700 font-mono">⬆ {p.score > 1000 ? `${(p.score / 1000).toFixed(1)}k` : p.score}</span><span className="text-[7px] text-gray-700 font-mono">💬 {p.numComments}</span></div>
            </a>
          ))}
        </div>}

        {/* News */}
        {tab === 'news' && <div className="p-2 space-y-1">
          {[...(data.news || []), ...(data.news2 || [])].filter((a: any) => !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">{!apiKeys.marketAux && !apiKeys.newsAPI ? 'Set API keys in ⚙ Settings' : 'No articles'}</div>}
          {[...(data.news || []), ...(data.news2 || [])].filter((a: any) => !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((a: any, i: number) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block bg-black/40 border border-red-900/15 px-2 py-1.5 hover:border-[#ff1a1a]/30 transition-colors group">
              <div className="text-[9px] font-bold text-gray-200 font-mono group-hover:text-[#ff1a1a] truncate">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5"><span className="text-[7px] text-gray-600 font-mono">{a.sourceLabel || a.source || ''}</span><span className="text-[7px] text-gray-700 font-mono">{a.publishedAt ? new Date(a.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
            </a>
          ))}
        </div>}

        {/* FRED */}
        {tab === 'fred' && <div className="p-2 space-y-1">
          {!apiKeys.fred && <div className="text-center py-4 text-gray-700 text-[9px] font-mono">Set FRED API key in ⚙</div>}
          {(data.fred || []).length === 0 && !loading && apiKeys.fred && <div className="text-center py-4 text-red-400/60 text-[9px] font-mono">No data — check key</div>}
          {(data.fred || []).map((d: any) => (
            <div key={d.id} className="bg-black/40 border border-red-900/15 px-2 py-1.5">
              <div className="flex items-center justify-between"><div className="text-[10px] font-bold text-gray-200 font-mono">{d.title}</div><span className={`flex items-center gap-0.5 text-[9px] font-mono ${d.trend === 'up' ? 'text-emerald-400' : d.trend === 'down' ? 'text-[#ff1a1a]' : 'text-gray-500'}`}>{d.trend === 'up' ? <ArrowUpRight size={10} /> : d.trend === 'down' ? <ArrowDownRight size={10} /> : <Minus size={10} />}{d.value}</span></div>
              <div className="text-[7px] text-gray-600 font-mono">{d.date}</div>
            </div>
          ))}
        </div>}

        {/* World Bank */}
        {tab === 'wb' && <div className="p-2 space-y-1">
          {(data.wb || []).length === 0 && !loading && <div className="text-center py-4 text-gray-600 text-[9px] font-mono">No World Bank data</div>}
          {(data.wb || []).map((d: any) => (
            <div key={d.id} className="bg-black/40 border border-red-900/15 px-2 py-1.5 flex items-center justify-between">
              <div><div className="text-[9px] font-bold text-gray-200 font-mono truncate max-w-[200px]">{d.name}</div><div className="text-[7px] text-gray-600 font-mono">{d.date}</div></div>
              <div className="text-[11px] text-gray-200 font-mono font-bold">{d.value ? (typeof d.value === 'number' ? d.value.toLocaleString() : d.value) : 'N/A'}</div>
            </div>
          ))}
        </div>}
      </div>
      <div className="px-2 py-1.5 border-t border-red-900/20 bg-[#0a0000]">
        <div className="flex flex-wrap gap-1">
          <span className="px-1 py-0.5 text-[7px] font-mono bg-red-900/20 text-gray-500 rounded-sm">Yahoo</span>
          <span className="px-1 py-0.5 text-[7px] font-mono bg-orange-500/10 text-orange-400 rounded-sm">CoinGecko</span>
          <span className="px-1 py-0.5 text-[7px] font-mono bg-blue-500/10 text-blue-400 rounded-sm">ExchangeRate</span>
          <span className="px-1 py-0.5 text-[7px] font-mono bg-emerald-500/10 text-emerald-400 rounded-sm">Dev.to</span>
          <span className="px-1 py-0.5 text-[7px] font-mono bg-orange-500/10 text-orange-400 rounded-sm">Reddit</span>
          {apiKeys.fred && <span className="px-1 py-0.5 text-[7px] font-mono bg-orange-500/10 text-orange-400 rounded-sm">FRED</span>}
          {apiKeys.marketAux && <span className="px-1 py-0.5 text-[7px] font-mono bg-emerald-500/10 text-emerald-400 rounded-sm">MarketAux</span>}
          {apiKeys.newsAPI && <span className="px-1 py-0.5 text-[7px] font-mono bg-blue-500/10 text-blue-400 rounded-sm">NewsAPI</span>}
          <span className="px-1 py-0.5 text-[7px] font-mono bg-purple-500/10 text-purple-400 rounded-sm">WorldBank</span>
        </div>
      </div>

      {/* Stock Detail Modal */}
      <AnimatePresence>
        {selectedStock && <StockDetailModal symbol={selectedStock} onClose={() => setSelectedStock(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ===================== BOTTOM PANEL =====================
function BottomPanel() {
  const [tab, setTab] = useState<'tasks' | 'logs' | 'metrics'>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    const i = setInterval(() => { setTasks(globalTaskStore.list()); setLogs(globalWorkerLogStore.getGlobalLogs(undefined, 50)); }, 2000);
    return () => clearInterval(i);
  }, []);
  const stats = globalSmartRouter.getStatistics();
  return (
    <div className="h-full flex flex-col bg-[#050000] border-t border-red-900/30">
      <div className="flex border-b border-red-900/20 bg-[#0a0000]">
        {[{ key: 'tasks' as const, label: 'Tasks', icon: Zap, count: tasks.length }, { key: 'logs' as const, label: 'Logs', icon: FileText, count: logs.length }, { key: 'metrics' as const, label: 'Metrics', icon: BarChart3, count: 0 }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1 px-3 py-1 text-[9px] font-bold font-mono uppercase tracking-wider transition-colors ${tab === t.key ? 'bg-[#ff1a1a]/15 text-[#ff1a1a] border-b-2 border-[#ff1a1a]' : 'text-gray-600 hover:text-gray-400'}`}><t.icon size={10} />{t.label}{t.count > 0 && <span className="px-1 py-0.5 text-[7px] bg-[#ff1a1a]/20 rounded-sm font-mono">{t.count}</span>}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'tasks' && <div className="space-y-0.5">
          {tasks.length === 0 && <div className="text-center py-4 text-gray-700 text-[9px] font-mono">No tasks</div>}
          {tasks.map(t => (<div key={t.id} className="flex items-center gap-2 bg-black/40 border border-red-900/15 px-2 py-1"><div className={`w-1.5 h-1.5 rounded-full ${t.status === 'running' ? 'bg-[#ff1a1a] animate-pulse' : t.status === 'completed' ? 'bg-emerald-500' : t.status === 'failed' ? 'bg-orange-500' : 'bg-gray-600'}`} /><span className="text-[9px] font-mono text-gray-300 flex-1 truncate">{t.agentName}</span><span className="text-[8px] font-mono text-gray-600">{t.status}</span><span className="text-[8px] font-mono text-gray-600">{t.progress.toolCallCount} tools</span><span className="text-[8px] font-mono text-gray-600">{(t.progress.tokenUsage.totalTokens / 1000).toFixed(1)}k tok</span></div>))}
        </div>}
        {tab === 'logs' && <div className="space-y-0.5">
          {logs.length === 0 && <div className="text-center py-4 text-gray-700 text-[9px] font-mono">No logs</div>}
          {logs.map(l => (<div key={l.id} className="flex items-start gap-2 bg-black/40 border border-red-900/15 px-2 py-1"><span className="text-[7px] text-gray-600 font-mono flex-shrink-0 mt-0.5">{new Date(l.timestamp).toLocaleTimeString()}</span><span className={`text-[8px] font-bold font-mono flex-shrink-0 ${l.level === 'error' ? 'text-[#ff1a1a]' : l.level === 'warn' ? 'text-yellow-400' : 'text-gray-400'}`}>[{l.level.toUpperCase()}]</span><span className="text-[8px] text-gray-500 font-mono">{l.agentName}</span><span className="text-[8px] text-gray-400 font-mono truncate">{l.message}</span></div>))}
        </div>}
        {tab === 'metrics' && <div className="grid grid-cols-4 gap-2">
          {[{ label: 'Routes', value: stats.totalRouting.toString(), color: 'text-[#ff1a1a]' }, { label: 'Success', value: `${(stats.avgSuccessScore * 100).toFixed(0)}%`, color: 'text-emerald-400' }, { label: 'Turns', value: stats.avgTurnCount.toFixed(1), color: 'text-cyan-400' }, { label: 'Best', value: stats.bestAgents[0]?.agent || 'N/A', color: 'text-yellow-400' }, { label: 'Tasks', value: tasks.length.toString(), color: 'text-[#ff1a1a]' }, { label: 'Running', value: tasks.filter(t => t.status === 'running').length.toString(), color: 'text-orange-400' }, { label: 'Logs', value: logs.length.toString(), color: 'text-cyan-400' }, { label: 'Cron', value: globalCronScheduler.getJobs().length.toString(), color: 'text-yellow-400' }].map(m => (<div key={m.label} className="bg-black/40 border border-red-900/20 p-2 text-center"><div className={`text-[16px] font-bold font-mono ${m.color}`}>{m.value}</div><div className="text-[7px] text-gray-600 font-mono uppercase">{m.label}</div></div>))}
        </div>}
      </div>
    </div>
  );
}

// ===================== COMMAND BAR =====================
function CommandBar() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = parseNaturalLanguage(input);
    setHistory(prev => [input, ...prev]);
    setHistoryIdx(-1);
    setLastResult(result?.responseMessage || `Executed: ${input}`);
    setInput('');
    setTimeout(() => setLastResult(null), 3000);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (historyIdx < history.length - 1) { const n = historyIdx + 1; setHistoryIdx(n); setInput(history[n]); } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setInput(history[historyIdx - 1]); } else { setHistoryIdx(-1); setInput(''); } }
  };
  return (
    <div className="h-9 bg-[#0a0000] border-t border-red-900/30 flex items-center px-3 gap-2 shrink-0">
      <Command size={13} className="text-[#ff1a1a] flex-shrink-0" />
      <form onSubmit={handleSubmit} className="flex-1 flex items-center">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Command: /tasks, @agent, #session, $model, !tool, ?help..." className="flex-1 bg-transparent text-[10px] text-gray-200 font-mono placeholder-gray-700 focus:outline-none" autoFocus />
      </form>
      {lastResult && <span className="text-[8px] text-emerald-400 font-mono animate-pulse">{lastResult}</span>}
      <span className="text-[7px] text-gray-700 font-mono">↑↓ history · Enter</span>
    </div>
  );
}

// ===================== MAIN BOARD =====================
export default function TheBoard() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showSettings, setShowSettings] = useState(false);
  const [tickerStocks, setTickerStocks] = useState<any[]>([]);
  const [tickerLoading, setTickerLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('board_api_keys');
      if (s) try { setApiKeys(JSON.parse(s)); } catch { }
      const theme = localStorage.getItem('board_theme');
      if (theme === 'light') setDarkMode(false);
    }
    const fetchTickers = async () => {
      try {
        const { results } = await fetchAllData(undefined);
        setTickerStocks(results.idx || []);
        setTickerLoading(false);
      } catch { setTickerLoading(false); }
    };
    fetchTickers();
    const i = setInterval(fetchTickers, 120000);
    return () => clearInterval(i);
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('board_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${darkMode ? 'bg-black' : 'bg-gray-50'}`} style={{ fontFamily: 'var(--font-mono)' }}>
      <TickerTape stocks={tickerStocks} loading={tickerLoading} />
      <TopBar onOpenSettings={() => setShowSettings(true)} onNavigateHome={() => window.location.href = '/swarm'} alertCount={0} darkMode={darkMode} onToggleTheme={toggleTheme} />
      <div className="flex-1 grid grid-cols-[260px_1fr_340px] min-h-0">
        <AgentMatrix />
        <div className="flex flex-col bg-[#000000] min-h-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Flame size={40} className="text-[#ff1a1a]/20 mx-auto mb-3" />
              <div className="text-[12px] font-black text-gray-600 tracking-[0.3em] uppercase font-mono">THE BOARD</div>
              <div className="text-[9px] text-gray-700 font-mono mt-1">Bloomberg Terminal for AI Swarm Operations</div>
              <div className="mt-4 flex gap-2 justify-center">
                <a href="/swarm" className="px-3 py-1.5 text-[9px] font-bold bg-[#ff1a1a]/15 text-[#ff1a1a] rounded-sm hover:bg-[#ff1a1a]/25 transition-colors border border-[#ff1a1a]/20 font-mono uppercase tracking-wider">← Swarm Chat</a>
                <button onClick={() => setShowSettings(true)} className="px-3 py-1.5 text-[9px] font-bold bg-black/40 text-gray-400 rounded-sm hover:bg-white/5 transition-colors border border-red-900/20 font-mono uppercase tracking-wider flex items-center gap-1"><Key size={10} /> API Keys</button>
              </div>
            </div>
          </div>
          <div className="h-48 shrink-0"><BottomPanel /></div>
        </div>
        <RightRail apiKeys={apiKeys} darkMode={darkMode} />
      </div>
      <CommandBar />
      <ApiKeyManager isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={() => { const s = localStorage.getItem('board_api_keys'); if (s) try { setApiKeys(JSON.parse(s)); } catch { } }} />
    </div>
  );
}
