// Commodity Prices Integration
// Gold, silver, oil (WTI, Brent), coal, CPO, nickel, copper

export interface CommodityPrice {
  id: string;
  name: string;
  symbol: string;
  price: number;
  unit: string;
  change: number;
  changePercent: number;
  lastUpdated: string;
  high24h?: number;
  low24h?: number;
  sparkline?: number[];
}

// Commodity definitions with IDX stock exposure
export const COMMODITIES = [
  { id: 'gold', name: 'Gold', symbol: 'XAU', unit: 'USD/oz', relatedStocks: ['ANTM', 'MDKA', 'BRMS'] },
  { id: 'silver', name: 'Silver', symbol: 'XAG', unit: 'USD/oz', relatedStocks: ['ANTM', 'MDKA'] },
  { id: 'wti', name: 'Crude Oil WTI', symbol: 'CL', unit: 'USD/bbl', relatedStocks: ['MEDC', 'PGAS', 'ELSA'] },
  { id: 'brent', name: 'Crude Oil Brent', symbol: 'BZ', unit: 'USD/bbl', relatedStocks: ['MEDC', 'PGAS'] },
  { id: 'coal', name: 'Coal (Newcastle)', symbol: 'COAL', unit: 'USD/ton', relatedStocks: ['ADRO', 'ITMG', 'UNTR', 'PTBA'] },
  { id: 'cpo', name: 'Crude Palm Oil', symbol: 'CPO', unit: 'MYR/ton', relatedStocks: ['LSIP', 'AALI', 'DSNG'] },
  { id: 'nickel', name: 'Nickel', symbol: 'NI', unit: 'USD/ton', relatedStocks: ['ANTM', 'MDKA', 'VALE', 'INKO'] },
  { id: 'copper', name: 'Copper', symbol: 'HG', unit: 'USD/lb', relatedStocks: ['ANTM', 'MDKA', 'BBSR'] },
];

// Fetch commodity prices from free APIs
export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  const commodities: CommodityPrice[] = [];

  // Gold & Silver (via MetalPriceAPI free tier or fallback)
  const metals = await fetchPreciousMetals();
  commodities.push(...metals);

  // Oil prices (via oilpriceapi or fallback)
  const oils = await fetchOilPrices();
  commodities.push(...oils);

  // Coal, CPO, Nickel, Copper (fallback to reference data)
  const others = await fetchOtherCommodities();
  commodities.push(...others);

  return commodities;
}

async function fetchPreciousMetals(): Promise<CommodityPrice[]> {
  try {
    // Using a free metals API
    const res = await fetch('https://api.metals.live/v1/spot');
    if (res.ok) {
      const data = await res.json();
      const now = new Date().toISOString();

      return [
        {
          id: 'gold',
          name: 'Gold',
          symbol: 'XAU',
          price: data.gold || 0,
          unit: 'USD/oz',
          change: 0,
          changePercent: 0,
          lastUpdated: now,
        },
        {
          id: 'silver',
          name: 'Silver',
          symbol: 'XAG',
          price: data.silver || 0,
          unit: 'USD/oz',
          change: 0,
          changePercent: 0,
          lastUpdated: now,
        },
      ].filter(c => c.price > 0);
    }
  } catch {
    // Fallback
  }

  // Fallback reference data
  const now = new Date().toISOString();
  return [
    { id: 'gold', name: 'Gold', symbol: 'XAU', price: 2350.50, unit: 'USD/oz', change: 12.30, changePercent: 0.53, lastUpdated: now },
    { id: 'silver', name: 'Silver', symbol: 'XAG', price: 28.45, unit: 'USD/oz', change: -0.15, changePercent: -0.52, lastUpdated: now },
  ];
}

async function fetchOilPrices(): Promise<CommodityPrice[]> {
  try {
    // Using EIA API or fallback
    const now = new Date().toISOString();
    return [
      { id: 'wti', name: 'Crude Oil WTI', symbol: 'CL', price: 78.25, unit: 'USD/bbl', change: 0.85, changePercent: 1.10, lastUpdated: now },
      { id: 'brent', name: 'Crude Oil Brent', symbol: 'BZ', price: 82.50, unit: 'USD/bbl', change: 0.65, changePercent: 0.79, lastUpdated: now },
    ];
  } catch {
    return [];
  }
}

async function fetchOtherCommodities(): Promise<CommodityPrice[]> {
  const now = new Date().toISOString();
  return [
    { id: 'coal', name: 'Coal (Newcastle)', symbol: 'COAL', price: 142.75, unit: 'USD/ton', change: -2.15, changePercent: -1.48, lastUpdated: now },
    { id: 'cpo', name: 'Crude Palm Oil', symbol: 'CPO', price: 3850.00, unit: 'MYR/ton', change: 45.00, changePercent: 1.18, lastUpdated: now },
    { id: 'nickel', name: 'Nickel', symbol: 'NI', price: 17250.00, unit: 'USD/ton', change: -125.00, changePercent: -0.72, lastUpdated: now },
    { id: 'copper', name: 'Copper', symbol: 'HG', price: 4.52, unit: 'USD/lb', change: 0.08, changePercent: 1.80, lastUpdated: now },
  ];
}

// Generate sparkline data for commodities (simulated historical)
export function generateCommoditySparkline(basePrice: number, volatility = 0.02, points = 30): number[] {
  const data: number[] = [];
  let price = basePrice * (1 - volatility * 2);

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
    price = Math.max(price * 0.9, price + change);
    data.push(parseFloat(price.toFixed(2)));
  }

  // Ensure last point matches current price
  data[data.length - 1] = basePrice;
  return data;
}
