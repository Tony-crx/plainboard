// IPO Calendar Data Integration
// IDX IPO data: upcoming, recent, and performance tracking

export interface IPOInfo {
  company: string;
  symbol: string;
  sector: string;
  ipoDate: string;
  offeringPrice: number;
  shares: number;
  marketCap: number;
  underwriter: string;
  status: 'upcoming' | 'listed' | 'cancelled';
  listingDate?: string;
  listingPrice?: number;
  currentPrice?: number;
  firstDayReturn?: number;
  totalReturn?: number;
}

// Upcoming IDX IPOs (manually curated / scraped from idx.co.id)
export const UPCOMING_IPOS: IPOInfo[] = [
  {
    company: 'PT Sample Company Tbk',
    symbol: 'SAMPLE',
    sector: 'Technology',
    ipoDate: '2026-04-20',
    offeringPrice: 250,
    shares: 500000000,
    marketCap: 125000000000,
    underwriter: 'Sample Sekuritas',
    status: 'upcoming',
  },
];

// Recent IPO performance data
export const RECENT_IPOS: IPOInfo[] = [
  {
    company: 'PT GoTo Gojek Tokopedia Tbk',
    symbol: 'GOTO',
    sector: 'Technology',
    ipoDate: '2022-04-11',
    offeringPrice: 326,
    shares: 242166732000,
    marketCap: 78946274032000,
    underwriter: 'Multiple',
    status: 'listed',
    listingDate: '2022-04-11',
    listingPrice: 326,
    currentPrice: 82,
    firstDayReturn: -22.70,
    totalReturn: -74.85,
  },
  {
    company: 'PT Bukalapak.com Tbk',
    symbol: 'BUKA',
    sector: 'Technology',
    ipoDate: '2021-08-06',
    offeringPrice: 850,
    shares: 112000000000,
    marketCap: 95200000000000,
    underwriter: 'Multiple',
    status: 'listed',
    listingDate: '2021-08-06',
    listingPrice: 850,
    currentPrice: 178,
    firstDayReturn: -28.82,
    totalReturn: -79.06,
  },
  {
    company: 'PT Emdek Cipta Solusindo Tbk',
    symbol: 'EMDE',
    sector: 'Technology',
    ipoDate: '2021-07-08',
    offeringPrice: 500,
    shares: 2275000000,
    marketCap: 1137500000000,
    underwriter: 'Sample',
    status: 'listed',
    listingDate: '2021-07-08',
    listingPrice: 500,
    currentPrice: 385,
    firstDayReturn: -10.00,
    totalReturn: -23.00,
  },
];

// Fetch upcoming IPOs from IDX website (via proxy)
export async function fetchUpcomingIPOs(): Promise<IPOInfo[]> {
  // In production, this would scrape idx.co.id or use an official API
  // For now, return curated data
  return UPCOMING_IPOS;
}

// Fetch recent IPO performance
export async function fetchRecentIPOs(): Promise<IPOInfo[]> {
  // Fetch current prices for listed IPOs
  const ipos = [...RECENT_IPOS];

  // Update with current prices from Yahoo Finance
  for (const ipo of ipos) {
    if (ipo.status === 'listed') {
      try {
        const res = await fetch(`/api/stocks?symbol=${ipo.symbol}.JK`);
        if (res.ok) {
          const data = await res.json();
          const meta = data.chart?.result?.[0]?.meta;
          if (meta) {
            ipo.currentPrice = meta.regularMarketPrice || ipo.currentPrice;
            ipo.totalReturn = ipo.offeringPrice > 0 && ipo.currentPrice !== undefined
              ? ((ipo.currentPrice - ipo.offeringPrice) / ipo.offeringPrice) * 100
              : 0;
          }
        }
      } catch {
        // Keep existing data
      }
    }
  }

  return ipos;
}

// Calculate IPO statistics
export function getIPOStats(ipos: IPOInfo[]) {
  const listed = ipos.filter(i => i.status === 'listed');
  const upcoming = ipos.filter(i => i.status === 'upcoming');

  const avgFirstDayReturn = listed.length > 0
    ? listed.reduce((sum, i) => sum + (i.firstDayReturn || 0), 0) / listed.length
    : 0;

  const avgTotalReturn = listed.length > 0
    ? listed.reduce((sum, i) => sum + (i.totalReturn || 0), 0) / listed.length
    : 0;

  const winners = listed.filter(i => (i.totalReturn || 0) > 0).length;
  const losers = listed.length - winners;

  return {
    totalListed: listed.length,
    totalUpcoming: upcoming.length,
    avgFirstDayReturn,
    avgTotalReturn,
    winners,
    losers,
    winRate: listed.length > 0 ? (winners / listed.length) * 100 : 0,
  };
}
