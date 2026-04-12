// Sector Heatmap & Market Data Utilities
// IDX sectors, most active stocks, stock screener

export interface SectorInfo {
  name: string;
  change: number;
  changePercent: number;
  stocks: string[];
}

export interface StockScreenerResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  roe: number | null;
  dividendYield: number | null;
  sector: string;
}

export interface MostActiveStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  unusualVolume: boolean;
}

// IDX Sector definitions with representative stocks
export const IDX_SECTORS: SectorInfo[] = [
  { name: 'Banking', change: 0, changePercent: 0, stocks: ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'BREN', 'BBRI'] },
  { name: 'Mining', change: 0, changePercent: 0, stocks: ['ADRO', 'ITMG', 'UNTR', 'PTBA', 'BUMI', 'MBAP'] },
  { name: 'Consumer Goods', change: 0, changePercent: 0, stocks: ['UNVR', 'ICBP', 'INDF', 'KLBF', 'MYOR', 'ULTJ'] },
  { name: 'Infrastructure', change: 0, changePercent: 0, stocks: ['TLKM', 'ISAT', 'EXCL', 'FREN', 'TOWR', 'MKPI'] },
  { name: 'Property', change: 0, changePercent: 0, stocks: ['BSDE', 'SMRA', 'CTRA', 'PWON', 'LPKR', 'DILD'] },
  { name: 'Finance', change: 0, changePercent: 0, stocks: ['BRIS', 'MEGA', 'BTPS', 'PNBN', 'BNGA', 'BJBR'] },
  { name: 'Energy', change: 0, changePercent: 0, stocks: ['PGAS', 'MEDC', 'ELSA', 'ENRG', 'PGEO', 'NRCA'] },
  { name: 'Materials', change: 0, changePercent: 0, stocks: ['ANTM', 'MDKA', 'VALE', 'TINS', 'BBSR', 'SMRA'] },
  { name: 'Technology', change: 0, changePercent: 0, stocks: ['GOTO', 'BUKA', 'EMTE', 'MTDL', 'KBLV', 'DNET'] },
  { name: 'Healthcare', change: 0, changePercent: 0, stocks: ['KAEF', 'PYFA', 'DVLA', 'SIDO', 'KLBF', 'MERK'] },
];

// Calculate sector performance
export async function calculateSectorPerformance(): Promise<SectorInfo[]> {
  const sectors = IDX_SECTORS.map(s => ({ ...s }));

  for (const sector of sectors) {
    const stockChanges: number[] = [];

    for (const symbol of sector.stocks) {
      try {
        const res = await fetch(`/api/stocks?symbol=${symbol}.JK`);
        if (res.ok) {
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          if (meta) {
            const price = meta.regularMarketPrice || 0;
            const prev = meta.chartPreviousClose || 0;
            const change = prev > 0 ? ((price - prev) / prev) * 100 : 0;
            stockChanges.push(change);
          }
        }
      } catch {
        // Skip failed fetch
      }
    }

    if (stockChanges.length > 0) {
      sector.change = stockChanges.reduce((a, b) => a + b, 0) / stockChanges.length;
      sector.changePercent = sector.change;
    }
  }

  return sectors.sort((a, b) => b.changePercent - a.changePercent);
}

// Fetch most active stocks
export async function fetchMostActiveStocks(limit = 10): Promise<MostActiveStock[]> {
  const allStocks = [
    'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'UNVR', 'GOTO',
    'ANTM', 'PGAS', 'INDF', 'KLBF', 'ICBP', 'UNTR', 'ADRO', 'BUMI',
    'BREN', 'MDKA', 'TINS', 'GGRM', 'HMSP', 'INTP', 'SMGR', 'WSKT',
  ];

  const stocks: MostActiveStock[] = [];

  for (const symbol of allStocks) {
    try {
      const res = await fetch(`/api/stocks?symbol=${symbol}.JK`);
      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta) {
          const price = meta.regularMarketPrice || 0;
          const prev = meta.chartPreviousClose || 0;
          const volume = meta.regularMarketVolume || 0;
          const avgVolume = meta.fiftyDayAverageVolume || volume;
          const changePercent = prev > 0 ? ((price - prev) / prev) * 100 : 0;
          const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;

          stocks.push({
            symbol,
            name: meta.shortName || symbol,
            price,
            changePercent,
            volume,
            avgVolume,
            volumeRatio,
            unusualVolume: volumeRatio > 3,
          });
        }
      }
    } catch {
      continue;
    }
  }

  // Sort by volume and return top N
  return stocks.sort((a, b) => b.volume - a.volume).slice(0, limit);
}

// Stock screener with filters
export function screenStocks(
  stocks: StockScreenerResult[],
  filters: {
    minPe?: number;
    maxPe?: number;
    minPb?: number;
    maxPb?: number;
    minRoe?: number;
    minDividendYield?: number;
    minMarketCap?: number;
    sector?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): StockScreenerResult[] {
  let filtered = [...stocks];

  if (filters.minPe !== undefined) filtered = filtered.filter(s => s.peRatio !== null && s.peRatio >= filters.minPe!);
  if (filters.maxPe !== undefined) filtered = filtered.filter(s => s.peRatio !== null && s.peRatio <= filters.maxPe!);
  if (filters.minPb !== undefined) filtered = filtered.filter(s => s.pbRatio !== null && s.pbRatio >= filters.minPb!);
  if (filters.maxPb !== undefined) filtered = filtered.filter(s => s.pbRatio !== null && s.pbRatio <= filters.maxPb!);
  if (filters.minRoe !== undefined) filtered = filtered.filter(s => s.roe !== null && s.roe >= filters.minRoe!);
  if (filters.minDividendYield !== undefined) filtered = filtered.filter(s => s.dividendYield !== null && s.dividendYield >= filters.minDividendYield!);
  if (filters.minMarketCap !== undefined) filtered = filtered.filter(s => s.marketCap >= filters.minMarketCap!);
  if (filters.sector) filtered = filtered.filter(s => s.sector === filters.sector);

  // Sort
  if (filters.sortBy) {
    const key = filters.sortBy as keyof StockScreenerResult;
    filtered.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }

  return filtered;
}

// Pre-built screens
export const PREBUILT_SCREENS = {
  'High Dividend': {
    minDividendYield: 4,
    sortBy: 'dividendYield',
    sortOrder: 'desc' as const,
  },
  'Undervalued': {
    maxPe: 10,
    maxPb: 1,
    sortBy: 'peRatio',
    sortOrder: 'asc' as const,
  },
  'Growth': {
    minRoe: 15,
    minMarketCap: 10000000000000,
    sortBy: 'roe',
    sortOrder: 'desc' as const,
  },
};

// Generate mock screener data (for demonstration)
export function generateMockScreenerData(): StockScreenerResult[] {
  return [
    { symbol: 'BBCA', name: 'Bank Central Asia', price: 10750, changePercent: 1.2, volume: 25000000, avgVolume: 20000000, marketCap: 1300000000000000, peRatio: 25.3, pbRatio: 5.8, roe: 22.5, dividendYield: 4.2, sector: 'Banking' },
    { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', price: 9800, changePercent: -0.5, volume: 35000000, avgVolume: 30000000, marketCap: 1200000000000000, peRatio: 18.2, pbRatio: 4.5, roe: 24.8, dividendYield: 5.8, sector: 'Banking' },
    { symbol: 'BMRI', name: 'Bank Mandiri', price: 10450, changePercent: 0.8, volume: 28000000, avgVolume: 25000000, marketCap: 1050000000000000, peRatio: 15.8, pbRatio: 3.9, roe: 25.2, dividendYield: 6.1, sector: 'Banking' },
    { symbol: 'TLKM', name: 'Telkom Indonesia', price: 3450, changePercent: -1.2, volume: 45000000, avgVolume: 40000000, marketCap: 340000000000000, peRatio: 14.5, pbRatio: 2.8, roe: 19.3, dividendYield: 4.5, sector: 'Infrastructure' },
    { symbol: 'ASII', name: 'Astra International', price: 5125, changePercent: 0.3, volume: 18000000, avgVolume: 22000000, marketCap: 210000000000000, peRatio: 10.2, pbRatio: 1.5, roe: 14.8, dividendYield: 3.8, sector: 'Consumer Goods' },
    { symbol: 'UNVR', name: 'Unilever Indonesia', price: 32800, changePercent: -0.8, volume: 5000000, avgVolume: 6000000, marketCap: 250000000000000, peRatio: 42.5, pbRatio: 12.3, roe: 28.5, dividendYield: 3.8, sector: 'Consumer Goods' },
    { symbol: 'ADRO', name: 'Adaro Energy', price: 2850, changePercent: 2.1, volume: 65000000, avgVolume: 55000000, marketCap: 85000000000000, peRatio: 6.8, pbRatio: 1.2, roe: 18.2, dividendYield: 8.5, sector: 'Mining' },
    { symbol: 'ANTM', name: 'Aneka Tambang', price: 1685, changePercent: 1.5, volume: 55000000, avgVolume: 45000000, marketCap: 65000000000000, peRatio: 12.3, pbRatio: 1.8, roe: 15.5, dividendYield: 2.1, sector: 'Materials' },
    { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', price: 82, changePercent: -2.4, volume: 250000000, avgVolume: 200000000, marketCap: 95000000000000, peRatio: null, pbRatio: 2.5, roe: -15.2, dividendYield: null, sector: 'Technology' },
    { symbol: 'ICBP', name: 'Indofood CBP', price: 11200, changePercent: 0.5, volume: 8000000, avgVolume: 7000000, marketCap: 130000000000000, peRatio: 22.1, pbRatio: 5.2, roe: 23.8, dividendYield: 3.5, sector: 'Consumer Goods' },
  ];
}
