// Mutual Fund (Reksadana) Tracker
// Top performing mutual funds with returns by period

export interface MutualFund {
  id: string;
  name: string;
  category: 'equity' | 'fixed_income' | 'money_market' | 'mixed';
  fundManager: string;
  nav: number; // Net Asset Value per unit
  navDate: string;
  return1M: number;
  return3M: number;
  return6M: number;
  return1Y: number;
  return3Y: number;
  return5Y: number;
  returnYTD: number;
  aum: number; // Asset Under Management in IDR
  risk: 'low' | 'medium' | 'high';
  minInvestment: number;
  benchmark: string;
}

// Sample mutual fund data (in production, would use API from bareksa.com or ipm.investree.id)
export const MUTUAL_FUNDS: MutualFund[] = [
  {
    id: 'SUCORSHA',
    name: 'SucorShares LQ45 Exchange Traded Fund',
    category: 'equity',
    fundManager: 'Sucor Asset Management',
    nav: 1245.50,
    navDate: '2026-04-10',
    return1M: 3.2,
    return3M: 8.5,
    return6M: 12.3,
    return1Y: 18.7,
    return3Y: 45.2,
    return5Y: 78.5,
    returnYTD: 5.8,
    aum: 2500000000000,
    risk: 'high',
    minInvestment: 50000,
    benchmark: 'LQ45',
  },
  {
    id: 'MANULFE',
    name: 'Manulife Dana Maksima',
    category: 'equity',
    fundManager: 'Manulife Asset Management',
    nav: 3875.25,
    navDate: '2026-04-10',
    return1M: 2.8,
    return3M: 7.2,
    return6M: 10.5,
    return1Y: 15.3,
    return3Y: 38.7,
    return5Y: 65.2,
    returnYTD: 4.5,
    aum: 1800000000000,
    risk: 'high',
    minInvestment: 100000,
    benchmark: 'IHSG',
  },
  {
    id: 'SCHD',
    name: 'Schroder Dana Prestasi Plus',
    category: 'mixed',
    fundManager: 'Schroder Investment Management',
    nav: 2150.75,
    navDate: '2026-04-10',
    return1M: 2.1,
    return3M: 5.8,
    return6M: 8.2,
    return1Y: 12.5,
    return3Y: 30.5,
    return5Y: 52.3,
    returnYTD: 3.8,
    aum: 3200000000000,
    risk: 'medium',
    minInvestment: 100000,
    benchmark: '60% IHSG + 40% SBI',
  },
  {
    id: 'BATAVIA',
    name: 'Batavia Dana Obligasi',
    category: 'fixed_income',
    fundManager: 'Batavia Prosperindo Asset Management',
    nav: 1580.30,
    navDate: '2026-04-10',
    return1M: 0.8,
    return3M: 2.5,
    return6M: 5.1,
    return1Y: 9.8,
    return3Y: 28.5,
    return5Y: 55.2,
    returnYTD: 2.2,
    aum: 5600000000000,
    risk: 'low',
    minInvestment: 50000,
    benchmark: 'Indonesian Bond Index',
  },
  {
    id: 'MONEY',
    name: 'BNI-AM Kas Market',
    category: 'money_market',
    fundManager: 'BNI Asset Management',
    nav: 1250.00,
    navDate: '2026-04-10',
    return1M: 0.4,
    return3M: 1.2,
    return6M: 2.5,
    return1Y: 5.2,
    return3Y: 15.8,
    return5Y: 28.5,
    returnYTD: 1.0,
    aum: 8500000000000,
    risk: 'low',
    minInvestment: 10000,
    benchmark: 'JIBOR 1M',
  },
  {
    id: 'DANAREKS',
    name: 'Danareksa Saham Unggulan',
    category: 'equity',
    fundManager: 'Danareksa Investment Management',
    nav: 4250.80,
    navDate: '2026-04-10',
    return1M: 4.1,
    return3M: 9.8,
    return6M: 15.2,
    return1Y: 22.5,
    return3Y: 52.3,
    return5Y: 85.7,
    returnYTD: 7.2,
    aum: 1200000000000,
    risk: 'high',
    minInvestment: 100000,
    benchmark: 'IHSG',
  },
  {
    id: 'PRINCIP',
    name: 'Principal Fixed Income Plus',
    category: 'fixed_income',
    fundManager: 'Principal Asset Management',
    nav: 1320.45,
    navDate: '2026-04-10',
    return1M: 0.9,
    return3M: 2.8,
    return6M: 5.5,
    return1Y: 10.2,
    return3Y: 29.8,
    return5Y: 56.8,
    returnYTD: 2.5,
    aum: 4200000000000,
    risk: 'low',
    minInvestment: 50000,
    benchmark: 'Indonesian Bond Index',
  },
  {
    id: 'EASTSPR',
    name: 'Eastspring Investments Indonesia Equity',
    category: 'equity',
    fundManager: 'Eastspring Investments',
    nav: 2850.60,
    navDate: '2026-04-10',
    return1M: 3.5,
    return3M: 8.2,
    return6M: 11.8,
    return1Y: 17.2,
    return3Y: 42.5,
    return5Y: 72.3,
    returnYTD: 5.5,
    aum: 2100000000000,
    risk: 'high',
    minInvestment: 100000,
    benchmark: 'IHSG',
  },
];

export const FUND_CATEGORIES = [
  { key: 'equity' as const, label: 'Equity (Saham)', risk: 'high', expectedReturn: '15-25%/yr' },
  { key: 'mixed' as const, label: 'Mixed (Campuran)', risk: 'medium', expectedReturn: '10-15%/yr' },
  { key: 'fixed_income' as const, label: 'Fixed Income (Obligasi)', risk: 'low', expectedReturn: '8-12%/yr' },
  { key: 'money_market' as const, label: 'Money Market (Pasar Uang)', risk: 'low', expectedReturn: '5-7%/yr' },
];

// Sort funds by return period
export function sortFundsByReturn(funds: MutualFund[], period: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'YTD'): MutualFund[] {
  const key = `return${period}` as keyof MutualFund;
  return [...funds].sort((a, b) => (b[key] as number) - (a[key] as number));
}

// Filter funds by category
export function filterFundsByCategory(funds: MutualFund[], category: string): MutualFund[] {
  if (category === 'all') return funds;
  return funds.filter(f => f.category === category);
}

// Calculate fund statistics
export function getFundStatistics(funds: MutualFund[]) {
  const avgReturn1Y = funds.reduce((sum, f) => sum + f.return1Y, 0) / funds.length;
  const avgReturn3Y = funds.reduce((sum, f) => sum + f.return3Y, 0) / funds.length;
  const avgAum = funds.reduce((sum, f) => sum + f.aum, 0) / funds.length;
  const best1Y = funds.reduce((best, f) => f.return1Y > best.return1Y ? f : best, funds[0]);
  const best3Y = funds.reduce((best, f) => f.return3Y > best.return3Y ? f : best, funds[0]);
  const largestAum = funds.reduce((largest, f) => f.aum > largest.aum ? f : largest, funds[0]);

  return {
    avgReturn1Y,
    avgReturn3Y,
    avgAum,
    best1Y,
    best3Y,
    largestAum,
  };
}

// Format AUM for display
export function formatAum(value: number): string {
  if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// Get risk color
export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'high': return 'text-[#ff1a1a]';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-emerald-400';
    default: return 'text-gray-500';
  }
}
