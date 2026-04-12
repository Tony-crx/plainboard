// Global Markets Overview
// S&P 500, NASDAQ, Nikkei, Hang Seng, Shanghai, FTSE, DAX, CAC 40

export interface GlobalIndex {
  id: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
  status: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

export const GLOBAL_INDICES: GlobalIndex[] = [
  {
    id: 'sp500',
    name: 'S&P 500',
    symbol: '^GSPC',
    country: 'US',
    flag: '🇺🇸',
    value: 5285.50,
    change: 25.30,
    changePercent: 0.48,
    high: 5295.20,
    low: 5260.10,
    open: 5265.00,
    previousClose: 5260.20,
    lastUpdated: '2026-04-11T20:00:00Z',
    status: 'closed',
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ Composite',
    symbol: '^IXIC',
    country: 'US',
    flag: '🇺🇸',
    value: 16550.75,
    change: 85.40,
    changePercent: 0.52,
    high: 16580.30,
    low: 16465.20,
    open: 16470.00,
    previousClose: 16465.35,
    lastUpdated: '2026-04-11T20:00:00Z',
    status: 'closed',
  },
  {
    id: 'nikkei',
    name: 'Nikkei 225',
    symbol: '^N225',
    country: 'Japan',
    flag: '🇯🇵',
    value: 38850.25,
    change: -125.50,
    changePercent: -0.32,
    high: 39020.80,
    low: 38780.50,
    open: 38980.00,
    previousClose: 38975.75,
    lastUpdated: '2026-04-12T06:00:00Z',
    status: 'closed',
  },
  {
    id: 'hsi',
    name: 'Hang Seng',
    symbol: '^HSI',
    country: 'Hong Kong',
    flag: '🇭🇰',
    value: 18250.60,
    change: 185.30,
    changePercent: 1.03,
    high: 18320.40,
    low: 18065.20,
    open: 18070.00,
    previousClose: 18065.30,
    lastUpdated: '2026-04-12T08:00:00Z',
    status: 'closed',
  },
  {
    id: 'shanghai',
    name: 'Shanghai Composite',
    symbol: '000001.SS',
    country: 'China',
    flag: '🇨🇳',
    value: 3125.80,
    change: 12.50,
    changePercent: 0.40,
    high: 3135.20,
    low: 3110.50,
    open: 3115.00,
    previousClose: 3113.30,
    lastUpdated: '2026-04-12T07:00:00Z',
    status: 'closed',
  },
  {
    id: 'ftse',
    name: 'FTSE 100',
    symbol: '^FTSE',
    country: 'UK',
    flag: '🇬🇧',
    value: 8125.45,
    change: 35.20,
    changePercent: 0.44,
    high: 8145.60,
    low: 8090.25,
    open: 8095.00,
    previousClose: 8090.25,
    lastUpdated: '2026-04-12T16:30:00Z',
    status: 'open',
  },
  {
    id: 'dax',
    name: 'DAX',
    symbol: '^GDAXI',
    country: 'Germany',
    flag: '🇩🇪',
    value: 18450.30,
    change: 95.80,
    changePercent: 0.52,
    high: 18480.50,
    low: 18355.20,
    open: 18360.00,
    previousClose: 18354.50,
    lastUpdated: '2026-04-12T16:30:00Z',
    status: 'open',
  },
  {
    id: 'cac40',
    name: 'CAC 40',
    symbol: '^FCHI',
    country: 'France',
    flag: '🇫🇷',
    value: 8050.75,
    change: 42.30,
    changePercent: 0.53,
    high: 8075.40,
    low: 8008.50,
    open: 8010.00,
    previousClose: 8008.45,
    lastUpdated: '2026-04-12T16:30:00Z',
    status: 'open',
  },
];

// Calculate overnight correlation with IHSG
export function calculateOvernightCorrelation(ihsgChange: number, usChange: number): number {
  // Simplified correlation calculation
  // In production, this would use historical data
  if ((ihsgChange > 0 && usChange > 0) || (ihsgChange < 0 && usChange < 0)) {
    return 0.75 + Math.random() * 0.20;
  }
  return 0.30 + Math.random() * 0.30;
}

// Get market status by timezone
export function getMarketStatusByTimezone(): Array<{ region: string; status: string; localTime: string }> {
  const now = new Date();
  return [
    { region: 'Asia (Jakarta)', status: 'Closed', localTime: now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) },
    { region: 'Europe (London)', status: 'Open', localTime: now.toLocaleTimeString('id-ID', { timeZone: 'Europe/London' }) },
    { region: 'US (New York)', status: 'Pre-Market', localTime: now.toLocaleTimeString('id-ID', { timeZone: 'America/New_York' }) },
  ];
}
