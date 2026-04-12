"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss, RefreshCw, ExternalLink, Filter, X, Zap,
  TrendingUp, Globe, Cpu, DollarSign, BarChart3,
  AlertTriangle, Newspaper, ChevronRight,
} from 'lucide-react';
import type { NewsEntry, NewsCategory } from './types';

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<NewsCategory, { label: string; color: string; dot: string }> = {
  market:       { label: 'MKT',  color: '#ff3333', dot: '#ff3333' },
  macro:        { label: 'MACRO',color: '#ffaa00', dot: '#ffaa00' },
  crypto:       { label: 'CRYP', color: '#00aaff', dot: '#00aaff' },
  geopolitical: { label: 'GEO',  color: '#ff44aa', dot: '#ff44aa' },
  corporate:    { label: 'CORP', color: '#aa44ff', dot: '#aa44ff' },
  tech:         { label: 'TECH', color: '#00ccff', dot: '#00ccff' },
  commodities:  { label: 'COMM', color: '#ffdd00', dot: '#ffdd00' },
  fx:           { label: 'FX',   color: '#00ff88', dot: '#00ff88' },
  general:      { label: 'GEN',  color: '#555',    dot: '#555'    },
};

// ─── Helper: classify news from raw data ─────────────────────────────────────
function classifyNews(raw: any[], source: string): NewsEntry[] {
  return raw.map((item: any, idx: number) => {
    const title = (item.title || '').toLowerCase();
    let category: NewsCategory = 'general';
    if (/bitcoin|crypto|eth|btc|defi|nft|blockchain/i.test(title)) category = 'crypto';
    else if (/gold|oil|gas|wheat|copper|lumber|commodit/i.test(title)) category = 'commodities';
    else if (/usd|eur|jpy|fx|currency|rupiah|idr|forex/i.test(title)) category = 'fx';
    else if (/gdp|inflation|fed|rate|central bank|imf|world bank|rbi|bi rate|boe|ecb/i.test(title)) category = 'macro';
    else if (/war|conflict|election|sanctions|nato|geopolit|tension/i.test(title)) category = 'geopolitical';
    else if (/merger|acquisition|ipo|earnings|dividend|profit|revenue/i.test(title)) category = 'corporate';
    else if (/ihsg|saham|idx|bursa|bbca|bbri|bmri|tlkm|stock|market|rally|bearish|bullish/i.test(title)) category = 'market';
    else if (/ai|tech|software|apple|google|meta|microsoft|nvidia/i.test(title)) category = 'tech';

    const isBreaking = /breaking|urgent|alert|flash|developing/i.test(title);

    return {
      id: `${source}-${idx}-${Date.now()}`,
      title: item.title || '',
      source: item.sourceLabel || item.source || item.author || source,
      url: item.url || (item.id ? `https://reddit.com${item.url}` : '#'),
      publishedAt: item.publishedAt || item.created_utc || new Date().toISOString(),
      summary: item.description || item.selftext,
      category,
      isBreaking,
      sentiment: 'neutral',
      tags: [],
    };
  });
}

// ─── Single News Item ─────────────────────────────────────────────────────────
function NewsItemCard({
  item,
  isNew,
}: {
  item: NewsEntry;
  isNew: boolean;
}) {
  const cfg = CAT_CONFIG[item.category];
  const time = item.publishedAt
    ? new Date(item.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={isNew ? { opacity: 0, x: 20, backgroundColor: 'rgba(255,51,51,0.1)' } : { opacity: 1, x: 0 }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: isNew ? 0.5 : 0 }}
      className="block group"
      style={{
        borderLeft: `2px solid ${cfg.dot}`,
        padding: '7px 10px 7px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: item.isBreaking ? 'rgba(255,51,51,0.04)' : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = item.isBreaking ? 'rgba(255,51,51,0.04)' : 'transparent')}
    >
      {/* Category + time */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {item.isBreaking && (
            <span className="text-[6px] font-black font-mono px-1 py-0.5 bg-[#ff3333] text-black tracking-wider">
              LIVE
            </span>
          )}
          <span
            className="text-[7px] font-black font-mono tracking-wider"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <span className="text-[7px] font-mono text-[#333]">{time}</span>
      </div>

      {/* Headline */}
      <div
        className="text-[9px] font-mono leading-[1.4] transition-colors"
        style={{ color: item.isBreaking ? '#fff' : 'rgba(255,255,255,0.65)' }}
      >
        <span className="group-hover:text-white transition-colors">{item.title}</span>
      </div>

      {/* Source */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[7px] text-[#2a2a2a] font-mono truncate">{item.source}</span>
        <ExternalLink size={8} className="text-[#1a1a1a] group-hover:text-[#333] flex-shrink-0 ml-1 transition-colors" />
      </div>
    </motion.a>
  );
}

// ─── Flash Headline ───────────────────────────────────────────────────────────
function FlashHeadline({ items }: { items: NewsEntry[] }) {
  const [idx, setIdx] = useState(0);
  const breaking = items.filter(i => i.isBreaking);
  const pool = breaking.length > 0 ? breaking : items.slice(0, 5);

  useEffect(() => {
    if (pool.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % pool.length), 5000);
    return () => clearInterval(t);
  }, [pool.length]);

  if (pool.length === 0) return null;
  const item = pool[idx];
  const cfg = CAT_CONFIG[item.category];

  return (
    <div
      className="px-3 py-2 border-b shrink-0 relative overflow-hidden"
      style={{ borderColor: 'rgba(255,51,51,0.15)', background: 'rgba(255,51,51,0.04)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[6px] font-black font-mono px-1.5 py-0.5 bg-[#ff3333] text-black tracking-[0.2em] shrink-0">
          FLASH
        </span>
        <AnimatePresence mode="wait">
          <motion.a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-[8px] font-mono text-white/80 hover:text-white transition-colors truncate"
            style={{ textDecoration: 'none' }}
          >
            {item.title}
          </motion.a>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main NewsRail ────────────────────────────────────────────────────────────
interface NewsRailProps {
  newsData: Record<string, any[]>;
  loading: boolean;
  onRefresh: () => void;
  visible: boolean;
  onToggle: () => void;
}

export function NewsRail({ newsData, loading, onRefresh, visible, onToggle }: NewsRailProps) {
  const [filter, setFilter] = useState<NewsCategory | 'all'>('all');
  const [items, setItems] = useState<NewsEntry[]>([]);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [muted, setMuted] = useState(false);

  // Aggregate all news sources
  useEffect(() => {
    const rawNews = [
      ...classifyNews(newsData.news || [], 'News'),
      ...classifyNews(newsData.news2 || [], 'Market'),
      ...classifyNews(newsData.reddit || [], 'Reddit'),
    ];

    // Deduplicate by title similarity (first 60 chars)
    const seen = new Set<string>();
    const deduped = rawNews.filter(n => {
      const key = n.title.slice(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by publishedAt desc
    deduped.sort((a, b) => {
      const ta = new Date(a.publishedAt).getTime() || 0;
      const tb = new Date(b.publishedAt).getTime() || 0;
      return tb - ta;
    });

    // Find new items
    const prevIds = prevIdsRef.current;
    const freshIds = new Set(deduped.filter(n => !prevIds.has(n.id)).map(n => n.id));
    setNewItemIds(freshIds);
    prevIdsRef.current = new Set(deduped.map(n => n.id));

    setItems(deduped);
  }, [newsData]);

  const filtered = items
    .filter(n => filter === 'all' || n.category === filter)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()));

  const catCounts = items.reduce<Record<string, number>>((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {});

  // Collapsed state
  if (!visible) {
    return (
      <div
        className="w-8 shrink-0 flex flex-col items-center border-l border-[#ff3333]/10 py-3 cursor-pointer"
        style={{ background: 'rgba(4,0,0,0.95)' }}
        onClick={onToggle}
      >
        <Newspaper size={12} className="text-[#ff3333]/50 mb-2" />
        <div
          className="text-[6px] font-black font-mono text-[#ff3333]/40 tracking-[0.3em]"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          NEWS
        </div>
        {items.length > 0 && (
          <div className="mt-2 w-4 h-4 rounded-full bg-[#ff3333]/20 flex items-center justify-center">
            <span className="text-[6px] font-black text-[#ff3333]">{items.length > 99 ? '99+' : items.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-72 shrink-0 flex flex-col border-l border-[#ff3333]/10"
      style={{ background: 'rgba(4,0,0,0.97)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b shrink-0 flex items-center justify-between"
        style={{ borderColor: 'rgba(255,51,51,0.1)', background: 'rgba(255,51,51,0.02)' }}
      >
        <div className="flex items-center gap-2">
          <Rss size={10} className="text-[#ff3333]/70" />
          <span className="text-[8px] font-black font-mono tracking-[0.3em] text-[#ff3333]/70">NEWS FEED</span>
          {loading && <RefreshCw size={8} className="text-[#ff3333]/50 animate-spin" />}
          {items.length > 0 && (
            <span
              className="text-[6px] font-black font-mono px-1 py-0.5 text-black"
              style={{ background: '#ff3333' }}
            >
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw size={9} className="text-[#333] hover:text-[#ff3333] transition-colors" />
          </button>
          <button onClick={onToggle} className="p-1 hover:bg-white/5 transition-all">
            <ChevronRight size={9} className="text-[#333]" />
          </button>
        </div>
      </div>

      {/* Flash headline */}
      <FlashHeadline items={filtered} />

      {/* Search */}
      <div className="px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="FILTER NEWS..."
          className="w-full bg-transparent text-[8px] font-mono text-white/50 outline-none placeholder:text-[#1a1a1a] tracking-wider"
          style={{ borderBottom: '1px solid rgba(255,51,51,0.1)', paddingBottom: '2px' }}
        />
      </div>

      {/* Category filter chips */}
      <div
        className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.03)', scrollbarWidth: 'none' }}
      >
        <button
          onClick={() => setFilter('all')}
          className="flex-shrink-0 px-2 py-0.5 text-[6px] font-black font-mono tracking-wider transition-all"
          style={{
            background: filter === 'all' ? '#ff3333' : 'rgba(255,255,255,0.03)',
            color: filter === 'all' ? '#000' : '#444',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          ALL {items.length > 0 && `·${items.length}`}
        </button>
        {(Object.keys(CAT_CONFIG) as NewsCategory[]).map(cat => {
          const c = CAT_CONFIG[cat];
          const count = catCounts[cat] || 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="flex-shrink-0 px-2 py-0.5 text-[6px] font-black font-mono tracking-wider transition-all"
              style={{
                background: filter === cat ? c.color : 'rgba(255,255,255,0.03)',
                color: filter === cat ? '#000' : c.color,
                border: `1px solid ${filter === cat ? c.color : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {c.label} ·{count}
            </button>
          );
        })}
      </div>

      {/* News list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,51,51,0.2) transparent' }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#1a1a1a]">
            <Newspaper size={24} className="mb-3 opacity-30" />
            <div className="text-[8px] font-mono tracking-[0.3em]">
              {loading ? 'LOADING NEWS...' : 'NO NEWS MATCHED'}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map(item => (
            <NewsItemCard
              key={item.id}
              item={item}
              isNew={newItemIds.has(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer: last refresh */}
      <div
        className="px-3 py-1.5 border-t shrink-0 flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.5)' }}
      >
        <span className="text-[6px] font-mono text-[#1a1a1a] tracking-wider">
          {filtered.length} ENTRIES · AUTO-REFRESH 30s
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#00e676] animate-pulse" />
          <span className="text-[6px] font-mono text-[#00e676]/50">LIVE</span>
        </div>
      </div>
    </div>
  );
}
