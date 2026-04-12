// Corporate Actions Feed
// Stock splits, dividends, rights issues for IDX stocks

export interface CorporateAction {
  id: string;
  symbol: string;
  companyName: string;
  type: 'dividend' | 'stock-split' | 'rights-issue' | 'spin-off' | 'merger';
  announcementDate: string;
  exDate: string;
  recordDate: string;
  paymentDate?: string;
  description: string;
  value?: number;
  currency?: string;
  ratio?: string;
  status: 'announced' | 'cum' | 'ex' | 'completed';
}

// Dividend data
export interface DividendInfo {
  symbol: string;
  companyName: string;
  dividendPerShare: number;
  currency: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  announcementDate: string;
  dividendYield: number;
  frequency: 'annual' | 'interim' | 'special';
  status: 'announced' | 'cum' | 'ex' | 'paid';
}

// Stock split data
export interface StockSplitInfo {
  symbol: string;
  companyName: string;
  splitRatio: string;
  exDate: string;
  announcementDate: string;
  status: 'announced' | 'effective' | 'completed';
}

// Recent corporate actions (curated data)
export const RECENT_DIVIDENDS: DividendInfo[] = [
  {
    symbol: 'BBCA',
    companyName: 'Bank Central Asia Tbk',
    dividendPerShare: 451.66,
    currency: 'IDR',
    exDate: '2025-05-15',
    recordDate: '2025-05-16',
    paymentDate: '2025-06-05',
    announcementDate: '2025-03-20',
    dividendYield: 4.2,
    frequency: 'annual',
    status: 'announced',
  },
  {
    symbol: 'BBRI',
    companyName: 'Bank Rakyat Indonesia Tbk',
    dividendPerShare: 565.00,
    currency: 'IDR',
    exDate: '2025-04-10',
    recordDate: '2025-04-11',
    paymentDate: '2025-05-02',
    announcementDate: '2025-02-15',
    dividendYield: 5.8,
    frequency: 'annual',
    status: 'cum',
  },
  {
    symbol: 'BMRI',
    companyName: 'Bank Mandiri Tbk',
    dividendPerShare: 638.00,
    currency: 'IDR',
    exDate: '2025-04-18',
    recordDate: '2025-04-19',
    paymentDate: '2025-05-09',
    announcementDate: '2025-02-20',
    dividendYield: 6.1,
    frequency: 'annual',
    status: 'announced',
  },
  {
    symbol: 'TLKM',
    companyName: 'Telkom Indonesia Tbk',
    dividendPerShare: 156.00,
    currency: 'IDR',
    exDate: '2025-04-05',
    recordDate: '2025-04-06',
    paymentDate: '2025-04-25',
    announcementDate: '2025-02-10',
    dividendYield: 4.5,
    frequency: 'annual',
    status: 'announced',
  },
  {
    symbol: 'UNVR',
    companyName: 'Unilever Indonesia Tbk',
    dividendPerShare: 1245.00,
    currency: 'IDR',
    exDate: '2025-03-20',
    recordDate: '2025-03-21',
    paymentDate: '2025-04-10',
    announcementDate: '2025-01-25',
    dividendYield: 3.8,
    frequency: 'annual',
    status: 'ex',
  },
];

export const RECENT_STOCK_SPLITS: StockSplitInfo[] = [
  {
    symbol: 'GOTO',
    companyName: 'GoTo Gojek Tokopedia Tbk',
    splitRatio: '1:5',
    exDate: '2025-08-15',
    announcementDate: '2025-06-01',
    status: 'announced',
  },
];

// Calculate days until ex-date
export function daysUntilExDate(exDate: string): number {
  const today = new Date();
  const ex = new Date(exDate);
  const diff = ex.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Convert corporate actions to unified format
export function getCorporateActions(): CorporateAction[] {
  const actions: CorporateAction[] = [];

  // Add dividends
  for (const div of RECENT_DIVIDENDS) {
    actions.push({
      id: `div-${div.symbol}-${div.exDate}`,
      symbol: div.symbol,
      companyName: div.companyName,
      type: 'dividend',
      announcementDate: div.announcementDate,
      exDate: div.exDate,
      recordDate: div.recordDate,
      paymentDate: div.paymentDate,
      description: `Dividend ${div.currency} ${div.dividendPerShare.toLocaleString()} per share (${div.dividendYield}% yield)`,
      value: div.dividendPerShare,
      currency: div.currency,
      status: div.status as any,
    });
  }

  // Add stock splits
  for (const split of RECENT_STOCK_SPLITS) {
    actions.push({
      id: `split-${split.symbol}-${split.exDate}`,
      symbol: split.symbol,
      companyName: split.companyName,
      type: 'stock-split',
      announcementDate: split.announcementDate,
      exDate: split.exDate,
      recordDate: split.exDate,
      description: `Stock split ${split.splitRatio}`,
      ratio: split.splitRatio,
      status: split.status as any,
    });
  }

  // Sort by ex-date
  return actions.sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime());
}

// Get dividends for specific symbol
export function getDividendsBySymbol(symbol: string): DividendInfo[] {
  return RECENT_DIVIDENDS.filter(d => d.symbol === symbol);
}

// Calculate cumulative dividend yield for portfolio
export function calculatePortfolioDividendYield(
  holdings: Array<{ symbol: string; shares: number; currentPrice: number }>
): { totalDividend: number; avgYield: number; byStock: Array<{ symbol: string; dividend: number; yield: number }> } {
  const byStock = holdings.map(h => {
    const dividends = getDividendsBySymbol(h.symbol);
    const totalDivPerShare = dividends.reduce((sum, d) => sum + d.dividendPerShare, 0);
    const totalDividend = totalDivPerShare * h.shares;
    const yield_ = h.currentPrice > 0 ? (totalDivPerShare / h.currentPrice) * 100 : 0;

    return {
      symbol: h.symbol,
      dividend: totalDividend,
      yield: yield_,
    };
  });

  const totalDividend = byStock.reduce((sum, s) => sum + s.dividend, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const avgYield = totalValue > 0 ? (totalDividend / totalValue) * 100 : 0;

  return {
    totalDividend,
    avgYield,
    byStock,
  };
}
