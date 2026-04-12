// Economic Calendar & BI Rate Tracker
// Upcoming economic data releases, BI rate decisions, currency strength

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: 'ID' | 'US' | 'Global';
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
  category: 'inflation' | 'employment' | 'gdp' | 'trade' | 'rate' | 'consumer' | 'manufacturing';
}

export interface BIRateDecision {
  date: string;
  rate: number;
  change: number;
  meetingType: 'RDG' | 'Extraordinary';
  decision: 'hold' | 'hike' | 'cut';
  nextMeetingDate?: string;
}

// Upcoming economic events for Indonesia
export const UPCOMING_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'bi-rate-apr',
    date: '2026-04-17',
    time: '14:00',
    country: 'ID',
    event: 'BI 7-Day Reverse Repo Rate',
    impact: 'high',
    forecast: '5.75%',
    previous: '5.75%',
    category: 'rate',
  },
  {
    id: 'cpi-mar',
    date: '2026-04-01',
    time: '08:00',
    country: 'ID',
    event: 'Consumer Price Index (MoM)',
    impact: 'high',
    actual: '0.32%',
    forecast: '0.28%',
    previous: '0.15%',
    category: 'inflation',
  },
  {
    id: 'trade-balance-feb',
    date: '2026-03-17',
    time: '08:00',
    country: 'ID',
    event: 'Trade Balance',
    impact: 'medium',
    actual: '$3.12B',
    forecast: '$2.85B',
    previous: '$2.95B',
    category: 'trade',
  },
  {
    id: 'gdp-q4',
    date: '2026-02-05',
    time: '08:00',
    country: 'ID',
    event: 'GDP Growth (YoY)',
    impact: 'high',
    actual: '5.05%',
    forecast: '4.95%',
    previous: '5.11%',
    category: 'gdp',
  },
  {
    id: 'unemployment-feb',
    date: '2026-05-05',
    time: '08:00',
    country: 'ID',
    event: 'Unemployment Rate',
    impact: 'medium',
    forecast: '5.32%',
    previous: '5.45%',
    category: 'employment',
  },
  {
    id: 'us-cpi-mar',
    date: '2026-04-10',
    time: '20:30',
    country: 'US',
    event: 'US CPI (MoM)',
    impact: 'high',
    actual: '0.3%',
    forecast: '0.2%',
    previous: '0.4%',
    category: 'inflation',
  },
  {
    id: 'us-fed-rate',
    date: '2026-05-01',
    time: '02:00',
    country: 'US',
    event: 'FOMC Rate Decision',
    impact: 'high',
    forecast: '4.50%',
    previous: '4.50%',
    category: 'rate',
  },
];

// Bank Indonesia rate history
export const BI_RATE_HISTORY: BIRateDecision[] = [
  { date: '2026-02-20', rate: 5.75, change: 0, meetingType: 'RDG', decision: 'hold', nextMeetingDate: '2026-04-17' },
  { date: '2025-12-19', rate: 5.75, change: 0, meetingType: 'RDG', decision: 'hold' },
  { date: '2025-10-17', rate: 5.75, change: 0, meetingType: 'RDG', decision: 'hold' },
  { date: '2025-08-16', rate: 6.00, change: -0.25, meetingType: 'RDG', decision: 'cut' },
  { date: '2025-06-20', rate: 6.25, change: 0, meetingType: 'RDG', decision: 'hold' },
  { date: '2025-04-18', rate: 6.25, change: 0, meetingType: 'RDG', decision: 'hold' },
  { date: '2025-02-21', rate: 6.25, change: 0, meetingType: 'RDG', decision: 'hold' },
  { date: '2024-12-20', rate: 6.00, change: 0.25, meetingType: 'RDG', decision: 'hike' },
];

// Days until next BI meeting
export function daysUntilNextBIMeeting(): number {
  const nextMeeting = BI_RATE_HISTORY.find(r => r.nextMeetingDate);
  if (!nextMeeting?.nextMeetingDate) return -1;

  const today = new Date();
  const meeting = new Date(nextMeeting.nextMeetingDate);
  const diff = meeting.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Filter events by date range
export function filterEventsByDateRange(events: EconomicEvent[], startDate: string, endDate: string): EconomicEvent[] {
  return events.filter(e => {
    const d = e.date;
    return d >= startDate && d <= endDate;
  });
}

// Get upcoming events (future dates only)
export function getUpcomingEvents(events: EconomicEvent[]): EconomicEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return events.filter(e => e.date >= today || !e.actual);
}

// Get past events with actual data
export function getPastEventsWithActuals(events: EconomicEvent[]): EconomicEvent[] {
  return events.filter(e => e.actual !== undefined);
}

// Calculate event impact score
export function getImpactScore(impact: 'high' | 'medium' | 'low'): number {
  switch (impact) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}
