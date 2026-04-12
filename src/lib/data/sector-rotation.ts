// Sector Rotation Model
// Track money flow between sectors, performance ranking, early warning signals

export interface SectorRotation {
  sector: string;
  performance: { '1D': number; '1W': number; '1M': number; '3M': number };
  rank: number;
  previousRank: number;
  moneyFlow: 'inflow' | 'outflow' | 'neutral';
  momentum: 'strengthening' | 'weakening' | 'stable';
  earlyWarning?: string;
}

export const SECTOR_ROTATION_DATA: SectorRotation[] = [
  { sector: 'Banking', performance: { '1D': 0.8, '1W': 2.5, '1M': 5.2, '3M': 12.8 }, rank: 1, previousRank: 2, moneyFlow: 'inflow', momentum: 'strengthening' },
  { sector: 'Mining', performance: { '1D': 1.5, '1W': 3.2, '1M': 8.5, '3M': 18.2 }, rank: 2, previousRank: 1, moneyFlow: 'inflow', momentum: 'strengthening', earlyWarning: 'Money moving from Banking to Mining' },
  { sector: 'Consumer Goods', performance: { '1D': -0.3, '1W': 0.5, '1M': 2.1, '3M': 6.5 }, rank: 3, previousRank: 3, moneyFlow: 'neutral', momentum: 'stable' },
  { sector: 'Technology', performance: { '1D': 2.1, '1W': 4.5, '1M': 10.2, '3M': 22.5 }, rank: 4, previousRank: 6, moneyFlow: 'inflow', momentum: 'strengthening', earlyWarning: 'Strong momentum — Money rapidly entering Tech' },
  { sector: 'Infrastructure', performance: { '1D': -0.5, '1W': -1.2, '1M': 0.8, '3M': 3.2 }, rank: 5, previousRank: 4, moneyFlow: 'outflow', momentum: 'weakening' },
  { sector: 'Property', performance: { '1D': -0.8, '1W': -2.1, '1M': -1.5, '3M': -2.8 }, rank: 6, previousRank: 5, moneyFlow: 'outflow', momentum: 'weakening' },
  { sector: 'Energy', performance: { '1D': 0.5, '1W': 1.8, '1M': 4.2, '3M': 9.5 }, rank: 7, previousRank: 8, moneyFlow: 'inflow', momentum: 'strengthening' },
  { sector: 'Materials', performance: { '1D': 0.2, '1W': 0.8, '1M': 3.5, '3M': 7.2 }, rank: 8, previousRank: 7, moneyFlow: 'neutral', momentum: 'stable' },
  { sector: 'Finance', performance: { '1D': 0.6, '1W': 1.5, '1M': 3.8, '3M': 8.8 }, rank: 9, previousRank: 9, moneyFlow: 'neutral', momentum: 'stable' },
  { sector: 'Healthcare', performance: { '1D': -0.2, '1W': 0.3, '1M': 1.5, '3M': 4.2 }, rank: 10, previousRank: 10, moneyFlow: 'neutral', momentum: 'stable' },
];

export function getSectorRotationByPeriod(period: '1D' | '1W' | '1M' | '3M'): SectorRotation[] {
  return [...SECTOR_ROTATION_DATA].sort((a, b) => b.performance[period] - a.performance[period]);
}

export function getEarlyWarnings(): SectorRotation[] {
  return SECTOR_ROTATION_DATA.filter(s => s.earlyWarning);
}
