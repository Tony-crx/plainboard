// World Bank Open Data API Integration
// Free, no API key needed -- https://data.worldbank.org/

export interface WorldBankIndicator {
  id: string;
  name: string;
  source: string;
  topics: string[];
}

export interface WorldBankDataPoint {
  indicator: string;
  indicatorName: string;
  country: string;
  value: number | null;
  date: string;
  decimal: number;
}

// Key World Bank indicators for Indonesia
export const WB_INDICATORS: WorldBankIndicator[] = [
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', source: 'World Bank national accounts data', topics: ['Economy', 'GDP'] },
  { id: 'NY.GDP.PCAP.CD', name: 'GDP per capita (US$)', source: 'World Bank national accounts data', topics: ['Economy', 'GDP'] },
  { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP growth (annual %)', source: 'World Bank national accounts data', topics: ['Economy', 'Growth'] },
  { id: 'FP.CPI.TOTL.ZG', name: 'Inflation, consumer prices (annual %)', source: 'World Bank national accounts data', topics: ['Economy', 'Inflation'] },
  { id: 'NE.EXP.GNFS.CD', name: 'Exports of goods and services (current US$)', source: 'World Bank national accounts data', topics: ['Trade', 'Exports'] },
  { id: 'NE.IMP.GNFS.CD', name: 'Imports of goods and services (current US$)', source: 'World Bank national accounts data', topics: ['Trade', 'Imports'] },
  { id: 'BN.CAB.XOKA.CD', name: 'Current account balance (current US$)', source: 'World Bank national accounts data', topics: ['Trade', 'Balance'] },
  { id: 'GC.TAX.TOTL.GD.ZS', name: 'Tax revenue (% of GDP)', source: 'World Bank national accounts data', topics: ['Government', 'Tax'] },
  { id: 'GC.DOD.TOTL.GD.ZS', name: 'Central government debt (% of GDP)', source: 'World Bank national accounts data', topics: ['Government', 'Debt'] },
  { id: 'NY.GNS.INVR.ZS', name: 'Gross savings (% of GDP)', source: 'World Bank national accounts data', topics: ['Economy', 'Savings'] },
  { id: 'SP.POP.TOTL', name: 'Population, total', source: 'World Bank staff estimates', topics: ['Demographics', 'Population'] },
  { id: 'SP.URB.TOTL.IN.ZS', name: 'Urban population (% of total)', source: 'United Nations Population Division', topics: ['Demographics', 'Urban'] },
  { id: 'SI.POV.NAHC', name: 'Poverty headcount ratio (% of population)', source: 'World Bank, Development Research Group', topics: ['Demographics', 'Poverty'] },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment, total (% of labor force)', source: 'International Labour Organization', topics: ['Economy', 'Employment'] },
  { id: 'BX.KLT.DINV.CD.WD', name: 'Foreign direct investment, net inflows (current US$)', source: 'International Monetary Fund', topics: ['Investment', 'FDI'] },
];

export interface WorldBankTimeSeries {
  indicatorId: string;
  indicatorName: string;
  country: string;
  data: Array<{ year: string; value: number | null }>;
  trend: 'up' | 'down' | 'volatile' | 'flat';
  latestValue: number | null;
  latestYear: string;
  change: number | null;
  changePercent: number | null;
}

// Fetch single indicator data for a country
export async function fetchWBIndicator(
  indicatorId: string,
  country = 'ID',
  startYear = 2015,
  endYear = new Date().getFullYear()
): Promise<WorldBankTimeSeries | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicatorId}?format=json&per_page=50&date=${startYear}:${endYear}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const rawData = data[1] || [];

    if (rawData.length === 0) return null;

    const timeSeriesData = rawData
      .filter((item: any) => item.value !== null)
      .map((item: any) => ({
        year: item.date,
        value: typeof item.value === 'number' ? item.value : parseFloat(item.value),
      }))
      .sort((a: { year: string; value: number | null }, b: { year: string; value: number | null }) => b.year.localeCompare(a.year));

    if (timeSeriesData.length === 0) return null;

    // Calculate trend
    const latest = timeSeriesData[0];
    const prev = timeSeriesData[1];
    const oldest = timeSeriesData[timeSeriesData.length - 1];

    let trend: 'up' | 'down' | 'volatile' | 'flat' = 'flat';
    if (latest.value !== null && prev.value !== null && oldest.value !== null) {
      const recentChange = latest.value - prev.value;
      const overallChange = latest.value - oldest.value;

      if (Math.abs(recentChange / (prev.value || 1)) < 0.01) {
        trend = 'flat';
      } else if (recentChange > 0 && overallChange > 0) {
        trend = 'up';
      } else if (recentChange < 0 && overallChange < 0) {
        trend = 'down';
      } else {
        trend = 'volatile';
      }
    }

    const change = prev.value !== null && latest.value !== null ? latest.value - prev.value : null;
    const changePercent = prev.value !== null && latest.value !== null && prev.value !== 0
      ? (change! / Math.abs(prev.value)) * 100
      : null;

    return {
      indicatorId,
      indicatorName: rawData[0]?.indicator?.value || indicatorId,
      country: rawData[0]?.country?.value || country,
      data: timeSeriesData,
      trend,
      latestValue: latest.value,
      latestYear: latest.year,
      change,
      changePercent,
    };
  } catch {
    return null;
  }
}

// Fetch all key indicators
export async function fetchAllWBIndicators(): Promise<WorldBankTimeSeries[]> {
  const results = await Promise.allSettled(
    WB_INDICATORS.map(ind => fetchWBIndicator(ind.id))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<WorldBankTimeSeries | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(Boolean) as WorldBankTimeSeries[];
}

// Format large numbers for display
export function formatWBValue(value: number | null, indicatorId: string): string {
  if (value === null) return 'N/A';

  const percentIndicators = [
    'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG', 'GC.TAX.TOTL.GD.ZS',
    'GC.DOD.TOTL.GD.ZS', 'NY.GNS.INVR.ZS', 'SP.URB.TOTL.IN.ZS',
    'SI.POV.NAHC', 'SL.UEM.TOTL.ZS',
  ];

  if (percentIndicators.includes(indicatorId)) {
    return `${value.toFixed(2)}%`;
  }

  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;

  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

// Simple sparkline data generator
export function generateSparklineData(data: Array<{ year: string; value: number | null }>): number[] {
  return data
    .filter(d => d.value !== null)
    .map(d => d.value as number)
    .reverse()
    .slice(-10);
}
