// ─── Shared Board Types ───────────────────────────────────────────────────────

export interface MarketIndex {
  key: string;
  label: string;
  region: string;
  value?: number;
  change?: number;
  changePct?: number;
  currency?: string;
  session?: 'pre' | 'open' | 'close' | 'after';
}

export interface NewsEntry {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
  category: NewsCategory;
  isBreaking?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags?: string[];
}

export type NewsCategory =
  | 'market'
  | 'macro'
  | 'crypto'
  | 'geopolitical'
  | 'corporate'
  | 'tech'
  | 'commodities'
  | 'fx'
  | 'general';

export interface TabGroup {
  id: string;
  label: string;
  shortKey: string;
  color: string;
  tabs: TabEntry[];
}

export interface TabEntry {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  badge?: string;
}

export interface AgentInfo {
  name: string;
  role: string;
  desc: string;
  status: 'ACTIVE' | 'IDLE' | 'ERROR';
  tasks: number;
  tokens: number;
}

export interface PriceItem {
  symbol: string;
  name?: string;
  price: number | string;
  change?: number | string;
  changePct?: number | string;
  up?: boolean;
  volume?: string;
  mktCap?: string;
}

export interface WatchlistEntry {
  symbol: string;
  addedAt: string;
  notes?: string;
  alertPrice?: number;
}

export interface PanelConfig {
  id: string;
  tab: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  position: 'tl' | 'tr' | 'bl' | 'br';
}
