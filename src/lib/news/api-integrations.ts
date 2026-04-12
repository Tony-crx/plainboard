// Multi-source API Integration Engine
// MarketAux, NewsAPI, Alpha Vantage, FRED -- all free tiers

// ============ CONFIGURABLE API KEYS (stored in localStorage) ============
export interface ApiKeys {
  marketAux?: string;
  newsAPI?: string;
  alphaVantage?: string;
  fred?: string;
}

export function getApiKeys(): ApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('board_api_keys');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('board_api_keys', JSON.stringify(keys));
}

export function clearApiKeys(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('board_api_keys');
}

// ============ MARKETAUX (Free: 200 req/day) ============
export interface MarketAuxArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  sourceLogo: string;
  image: string;
  language: string;
  published: string;
  sentiment: string;
  sentimentScore: number;
  category?: string;
}

export async function fetchMarketAux(query: string, apiKey: string, maxResults = 10): Promise<MarketAuxArticle[]> {
  try {
    const params = new URLSearchParams({
      api_token: apiKey,
      q: query,
      language: 'en',
      limit: maxResults.toString(),
      sort: 'relevancy',
    });

    const res = await fetch(`https://api.marketaux.com/api/v1/articles?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((a: any, i: number) => ({
      id: `ma-${i}`,
      title: a.title || '',
      description: a.description || '',
      content: a.content || '',
      url: a.url || '',
      source: a.source || 'MarketAux',
      sourceLogo: a.source_logo_url || '',
      image: a.image || '',
      language: a.language || 'en',
      published: a.published_at || '',
      sentiment: a.sentiment || '',
      sentimentScore: a.sentiment_score || 0,
      category: a.category || '',
    }));
  } catch {
    return [];
  }
}

// ============ NEWSAPI (Free: 100 req/day) ============
export interface NewsApiArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

export async function fetchNewsAPI(query: string, apiKey: string, maxResults = 10): Promise<NewsApiArticle[]> {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${maxResults}&sortBy=publishedAt&apiKey=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a: any, i: number) => ({
      id: `na-${i}`,
      title: a.title || 'Untitled',
      description: a.description || '',
      url: a.url || '#',
      source: a.source?.name || a.source || 'NewsAPI',
      publishedAt: a.publishedAt || '',
      image: a.urlToImage || '',
    }));
  } catch {
    return [];
  }
}

// ============ ALPHA VANTAGE (Free: 25 req/day) ============
export interface StockQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  high: string;
  low: string;
  open: string;
  previousClose: string;
  timestamp: string;
}

export interface StockTimeSeries {
  symbol: string;
  intervals: Array<{ time: string; open: string; high: string; low: string; close: string; volume: string }>;
}

export async function fetchStockQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = data['Global Quote'] || {};
    if (!q['01. symbol']) return null;
    return {
      symbol: q['01. symbol'] || symbol,
      name: symbol,
      price: q['05. price'] || '0',
      change: q['09. change'] || '0',
      changePercent: q['10. change percent'] || '0%',
      volume: q['06. volume'] || '0',
      high: q['03. high'] || '0',
      low: q['04. low'] || '0',
      open: q['02. open'] || '0',
      previousClose: q['08. previous close'] || '0',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchStockTimeSeries(symbol: string, apiKey: string, interval = 'daily'): Promise<StockTimeSeries | null> {
  try {
    const fn = interval === 'intraday' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
    const url = interval === 'intraday'
      ? `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&interval=60min&apikey=${apiKey}&outputsize=compact`
      : `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const key = Object.keys(data).find(k => k.includes('Time Series'));
    if (!key) return null;

    const timeSeries = data[key];
    const intervals = Object.entries(timeSeries).slice(0, 30).map(([time, values]: [string, any]) => ({
      time,
      open: values['1. open'] || '0',
      high: values['2. high'] || '0',
      low: values['3. low'] || '0',
      close: values['4. close'] || '0',
      volume: values['5. volume'] || '0',
    }));

    return { symbol, intervals };
  } catch {
    return null;
  }
}

// ============ FRED (Federal Reserve Economic Data, Free: 120 req/min) ============
export interface FredSeries {
  id: string;
  title: string;
  value: string;
  date: string;
  unit: string;
  frequency: string;
  trend: 'up' | 'down' | 'flat';
  observations: Array<{ date: string; value: string }>;
}

export async function fetchFredSeries(seriesId: string, apiKey: string): Promise<FredSeries | null> {
  try {
    // Use local API proxy to avoid CORS
    const url = `/api/fred?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}&limit=10`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[FRED] ${seriesId} error: ${err.error_message || res.statusText}`);
      return null;
    }

    const data = await res.json();

    if (data.error_code) {
      console.warn(`[FRED] ${seriesId} error: ${data.error_code} - ${data.error_message}`);
      return null;
    }

    const observations = (data.observations || []).map((o: any) => ({
      date: o.date,
      value: o.value === '.' ? 'N/A' : o.value,
    }));

    const latest = observations[0];
    const prev = observations[1];
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (latest && prev && latest.value !== 'N/A' && prev.value !== 'N/A') {
      const curr = parseFloat(latest.value);
      const prevVal = parseFloat(prev.value);
      if (!isNaN(curr) && !isNaN(prevVal)) {
        trend = curr > prevVal ? 'up' : curr < prevVal ? 'down' : 'flat';
      }
    }

    // Try to get series metadata from our proxy (separate call)
    let title = seriesId;
    try {
      const metaRes = await fetch(`/api/fred/series?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        title = meta.title || seriesId;
      }
    } catch { /* metadata optional */ }

    return {
      id: seriesId,
      title,
      value: latest?.value || 'N/A',
      date: latest?.date || '',
      unit: '',
      frequency: '',
      trend,
      observations,
    };
  } catch (err: any) {
    console.warn(`[FRED] ${seriesId} fetch error:`, err.message);
    return null;
  }
}

// Common FRED series IDs
export const FRED_SERIES = {
  GDP: 'GDP',
  UNEMPLOYMENT: 'UNRATE',
  CPI: 'CPIAUCSL',
  FED_RATE: 'FEDFUNDS',
  TREASURY_10Y: 'DGS10',
  TREASURY_2Y: 'DGS2',
  M2_MONEY_SUPPLY: 'M2SL',
  CONSUMER_SENTIMENT: 'UMCSENT',
  INITIAL_CLAIMS: 'ICSA',
  HOUSING_STARTS: 'HOUST',
  RETAIL_SALES: 'RSAFS',
  TRADE_WEIGHTED_USD: 'DTWEXBGS',
};

// ============ IDX STOCK DATA (Yahoo Finance -- Free) ============
export interface IdxStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  marketCap?: string;
}

export async function fetchIdxStock(symbol: string): Promise<IdxStock | null> {
  try {
    const res = await fetch(`/api/stocks?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const result = data.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.chartPreviousClose || 0;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    return {
      symbol: meta.symbol || symbol,
      name: meta.shortName || symbol,
      price: `Rp ${currentPrice.toLocaleString('id-ID')}`,
      change: `${change >= 0 ? '+' : ''}${change.toLocaleString('id-ID')}`,
      changePercent: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      volume: (meta.regularMarketVolume || 0).toLocaleString('id-ID'),
      marketCap: meta.marketCap ? `${(meta.marketCap / 1e12).toFixed(1)}T` : undefined,
    };
  } catch { return null; }
}

export async function fetchMultipleIdxStocks(symbols: string[]): Promise<IdxStock[]> {
  const results = await Promise.allSettled(
    symbols.map(sym => fetchIdxStock(sym).catch(() => null))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<IdxStock | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(Boolean) as IdxStock[];
}

// Popular IDX stocks
export const IDX_WATCHLIST = [
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'GOTO',
  'ANTM', 'PGAS', 'INDF', 'KLBF', 'ICBP', 'UNTR', 'ADRO', 'BUMI',
];

export const FRED_IDS = ['UNRATE', 'CPIAUCSL', 'FEDFUNDS', 'DGS10', 'GDP'];

// ============ DEV.TO (Free, no API key) ============
export interface DevArticle {
  id: string; title: string; description: string; url: string;
  author: string; tags: string[]; publishedAt: string;
  positiveReactionsCount: number; commentsCount: number;
}

export async function fetchDevTo(tag = 'programming', page = 1, perPage = 15): Promise<DevArticle[]> {
  try {
    const q = `?tag=${encodeURIComponent(tag)}&page=${page}&per_page=${perPage}`;
    const res = await fetch(`https://dev.to/api/articles${q}`);
    if (!res.ok) return [];
    return (await res.json()).map((a: any, i: number) => ({
      id: `dev-${a.id || i}`, title: a.title || '', description: a.description || '',
      url: a.url || '#', author: a.user?.name || 'Unknown', tags: a.tag_list || [],
      publishedAt: a.published_at || '', positiveReactionsCount: a.positive_reactions_count || 0, commentsCount: a.comments_count || 0,
    }));
  } catch { return []; }
}

// ============ REDDIT (Free, JSON) ============
export interface RedditPost {
  id: string; title: string; url: string; subreddit: string;
  author: string; score: number; numComments: number; created: string;
}

export async function fetchReddit(subreddit: string, limit = 15): Promise<RedditPost[]> {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`);
    if (!res.ok) return [];
    return (await res.json()).data?.children?.map((c: any) => ({
      id: `reddit-${c.data.id}`, title: c.data.title || '', url: c.data.url || `https://reddit.com${c.data.permalink}`,
      subreddit: c.data.subreddit, author: c.data.author, score: c.data.score || 0,
      numComments: c.data.num_comments || 0, created: new Date(c.data.created_utc * 1000).toISOString(),
    })) || [];
  } catch { return []; }
}

// ============ EXCHANGE RATES (Free, no key) ============
export async function fetchExchangeRates(base = 'USD'): Promise<{ rates: Record<string, number>; date: string } | null> {
  try {
    const res = await fetch(`/api/fx?base=${encodeURIComponent(base)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { rates: data.rates, date: data.date };
  } catch { return null; }
}

// ============ WORLD BANK (Free, no key) ============
export async function fetchWorldBank(indicator: string, country = 'ID'): Promise<Array<{ id: string; name: string; value: string | null; date: string }>> {
  try {
    const res = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=5&date=2019:2024`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data[1] || []).map((item: any) => ({
      id: `${indicator}-${item.date}`, name: item.indicator?.value || indicator,
      value: item.value, date: item.date,
    }));
  } catch { return []; }
}

// ============ COINGECKO (Free, no key) ============
export async function fetchCryptoPrices(): Promise<Array<{ id: string; symbol: string; name: string; price: number; change24h: number; marketCap: number; volume24h: number }>> {
  try {
    const res = await fetch('/api/crypto?vs=usd');
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error) return [];
    const coinIds = Object.keys(data);
    return coinIds.map(id => {
      const c = data[id];
      return {
        id, symbol: id.substring(0, 4).toUpperCase(), name: id, price: c.usd || 0,
        change24h: c.usd_24h_change || 0, marketCap: c.usd_market_cap || 0, volume24h: c.usd_24h_vol || 0,
      };
    });
  } catch { return []; }
}

// ============ IHSG INDEX (Yahoo Finance) ============
export async function fetchIHSG(): Promise<{ value: number; change: number; changePercent: number; prevClose: number } | null> {
  try {
    const res = await fetch(`/api/stocks?symbol=^JKSE`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.chart?.result?.[0]) return null;
    const meta = data.chart.result[0].meta;
    const price = meta.regularMarketPrice || 0;
    const prev = meta.chartPreviousClose || 0;
    const change = price - prev;
    return { value: price, change, changePercent: prev > 0 ? (change / prev) * 100 : 0, prevClose: prev };
  } catch { return null; }
}

// ============ STOCK DETAILS (with volume, market cap, etc) ============
export async function fetchStockDetail(symbol: string): Promise<{
  symbol: string; price: number; change: number; changePercent: number;
  volume: number; avgVolume: number; marketCap: number; high: number; low: number;
  open: number; prevClose: number; fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
} | null> {
  try {
    const sym = symbol.includes('.JK') ? symbol : `${symbol}.JK`;
    const res = await fetch(`/api/stocks?symbol=${encodeURIComponent(sym)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.chart?.result?.[0]) return null;
    const r = data.chart.result[0];
    const meta = r.meta;
    const price = meta.regularMarketPrice || 0;
    const prev = meta.chartPreviousClose || 0;
    const change = price - prev;
    return {
      symbol: meta.symbol || symbol, price, change,
      changePercent: prev > 0 ? (change / prev) * 100 : 0,
      volume: meta.regularMarketVolume || 0,
      avgVolume: meta.fiftyDayAverageVolume || 0,
      marketCap: meta.marketCap || 0,
      high: meta.regularMarketDayHigh || 0,
      low: meta.regularMarketDayLow || 0,
      open: meta.regularMarketOpen || 0,
      prevClose: prev,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
    };
  } catch { return null; }
}

// ============ WATCHLIST MANAGEMENT (localStorage) ============
export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('board_watchlist');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('board_watchlist', JSON.stringify(items));
}

export function addToWatchlist(symbol: string): void {
  const list = getWatchlist();
  if (list.some(i => i.symbol === symbol)) return;
  list.push({ symbol, addedAt: Date.now() });
  saveWatchlist(list);
}

export function removeFromWatchlist(symbol: string): void {
  saveWatchlist(getWatchlist().filter(i => i.symbol !== symbol));
}

// ============ COMBINED DATA FETCH ============
export async function fetchAllData(apiKeys?: ApiKeys) {
  const results: Record<string, any[]> = {};
  const errors: string[] = [];
  const tasks: Promise<any>[] = [];

  tasks.push(fetchMultipleIdxStocks(IDX_WATCHLIST.slice(0, 15)).then(d => { results.idx = d; }).catch(() => { }));
  tasks.push(fetchIHSG().then(d => { if (d) results.ihsg = [d]; }).catch(() => { }));
  tasks.push(fetchCryptoPrices().then(d => { results.crypto = d; }).catch(() => { }));
  tasks.push(fetchExchangeRates('USD').then(d => { if (d) results.fx = [d]; }).catch(() => { }));
  tasks.push(fetchDevTo('programming', 1, 10).then(d => { results.devto = d; }).catch(() => { }));
  tasks.push(fetchReddit('wallstreetbets', 10).then(d => { results.reddit = d; }).catch(() => { }));

  // World Bank - multiple indicators
  const wbIndicators = ['NY.GDP.MKTP.CD', 'FP.CPI.TOTL.ZG', 'SP.POP.TOTL', 'SL.UEM.TOTL.ZS', 'BX.KLT.DINV.CD.WD'];
  tasks.push(Promise.all(wbIndicators.map(id => fetchWorldBank(id, 'ID'))).then(arrays => {
    results.wb = arrays.flat();
  }).catch(() => { results.wb = []; }));

  if (apiKeys?.fred) {
    tasks.push(Promise.all(FRED_IDS.map(id => fetchFredSeries(id, apiKeys.fred!))).then(d => { results.fred = d.filter(Boolean); }).catch(e => errors.push(`FRED: ${e.message}`)));
  }
  if (apiKeys?.marketAux) {
    tasks.push(fetchMarketAux('AI OR technology', apiKeys.marketAux!, 10).then(d => { results.news = d; }).catch(() => { }));
  }
  if (apiKeys?.newsAPI) {
    tasks.push(fetchNewsAPI('AI OR technology', apiKeys.newsAPI!, 10).then(d => { results.news2 = d; }).catch(() => { }));
  }

  await Promise.allSettled(tasks);
  return { results, errors };
}
