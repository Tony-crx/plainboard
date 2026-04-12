// Earnings Calendar
// Upcoming earnings releases, EPS estimates vs actual, surprise history

export interface EarningEvent {
  id: string;
  symbol: string;
  companyName: string;
  reportDate: string;
  reportTime: 'before-market' | 'after-market' | 'during-market';
  fiscalQuarter: string;
  fiscalYear: number;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  surprisePercent: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  postEarningsPriceChange: number | null;
  surpriseHistory: Array<{ quarter: string; epsEstimate: number; epsActual: number; surprisePercent: number }>;
}

export const EARNINGS_CALENDAR: EarningEvent[] = [
  {
    id: 'bbc-q1-2026',
    symbol: 'BBCA',
    companyName: 'Bank Central Asia Tbk',
    reportDate: '2026-04-25',
    reportTime: 'after-market',
    fiscalQuarter: 'Q1',
    fiscalYear: 2026,
    epsEstimate: 1250,
    epsActual: null,
    epsSurprise: null,
    surprisePercent: null,
    revenueEstimate: 28500000000000,
    revenueActual: null,
    postEarningsPriceChange: null,
    surpriseHistory: [
      { quarter: 'Q4 2025', epsEstimate: 1180, epsActual: 1225, surprisePercent: 3.81 },
      { quarter: 'Q3 2025', epsEstimate: 1150, epsActual: 1190, surprisePercent: 3.48 },
      { quarter: 'Q2 2025', epsEstimate: 1120, epsActual: 1105, surprisePercent: -1.34 },
      { quarter: 'Q1 2025', epsEstimate: 1080, epsActual: 1145, surprisePercent: 6.02 },
    ],
  },
  {
    id: 'bbri-q1-2026',
    symbol: 'BBRI',
    companyName: 'Bank Rakyat Indonesia Tbk',
    reportDate: '2026-04-22',
    reportTime: 'after-market',
    fiscalQuarter: 'Q1',
    fiscalYear: 2026,
    epsEstimate: 1580,
    epsActual: null,
    epsSurprise: null,
    surprisePercent: null,
    revenueEstimate: 45200000000000,
    revenueActual: null,
    postEarningsPriceChange: null,
    surpriseHistory: [
      { quarter: 'Q4 2025', epsEstimate: 1520, epsActual: 1595, surprisePercent: 4.93 },
      { quarter: 'Q3 2025', epsEstimate: 1480, epsActual: 1510, surprisePercent: 2.03 },
      { quarter: 'Q2 2025', epsEstimate: 1450, epsActual: 1420, surprisePercent: -2.07 },
      { quarter: 'Q1 2025', epsEstimate: 1400, epsActual: 1465, surprisePercent: 4.64 },
    ],
  },
  {
    id: 'tlkm-q1-2026',
    symbol: 'TLKM',
    companyName: 'Telkom Indonesia Tbk',
    reportDate: '2026-04-18',
    reportTime: 'before-market',
    fiscalQuarter: 'Q1',
    fiscalYear: 2026,
    epsEstimate: 425,
    epsActual: null,
    epsSurprise: null,
    surprisePercent: null,
    revenueEstimate: 35800000000000,
    revenueActual: null,
    postEarningsPriceChange: null,
    surpriseHistory: [
      { quarter: 'Q4 2025', epsEstimate: 410, epsActual: 418, surprisePercent: 1.95 },
      { quarter: 'Q3 2025', epsEstimate: 395, epsActual: 388, surprisePercent: -1.77 },
      { quarter: 'Q2 2025', epsEstimate: 380, epsActual: 392, surprisePercent: 3.16 },
      { quarter: 'Q1 2025', epsEstimate: 370, epsActual: 378, surprisePercent: 2.16 },
    ],
  },
];

export function getEarningsByDate(date: string): EarningEvent[] {
  return EARNINGS_CALENDAR.filter(e => e.reportDate === date);
}

export function getUpcomingEarnings(): EarningEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return EARNINGS_CALENDAR.filter(e => e.reportDate >= today || !e.epsActual);
}

export function getAvgSurprisePercent(event: EarningEvent): number | null {
  if (event.surpriseHistory.length === 0) return null;
  return event.surpriseHistory.reduce((sum, s) => sum + s.surprisePercent, 0) / event.surpriseHistory.length;
}
