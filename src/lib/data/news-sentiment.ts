// News Sentiment Analyzer
// AI-powered sentiment analysis on financial news

export interface SentimentAnalysis {
  id: string;
  headline: string;
  source: string;
  date: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to +1
  confidence: number; // 0 to 1
  keywords: string[];
  relatedStocks: string[];
}

export const SENTIMENT_DATA: SentimentAnalysis[] = [
  { id: '1', headline: 'Banking Sector Shows Strong Q1 Growth Amid Rising Interest Rates', source: 'Bloomberg', date: '2026-04-11', sentiment: 'bullish', score: 0.75, confidence: 0.88, keywords: ['banking', 'growth', 'interest rates'], relatedStocks: ['BBCA', 'BBRI', 'BMRI'] },
  { id: '2', headline: 'Coal Prices Decline as Global Demand Weakens', source: 'Reuters', date: '2026-04-10', sentiment: 'bearish', score: -0.65, confidence: 0.82, keywords: ['coal', 'demand', 'decline'], relatedStocks: ['ADRO', 'ITMG', 'UNTR'] },
  { id: '3', headline: 'Technology Stocks Surge on AI Investment Boom', source: 'CNBC', date: '2026-04-10', sentiment: 'bullish', score: 0.82, confidence: 0.91, keywords: ['technology', 'AI', 'investment'], relatedStocks: ['GOTO', 'BUKA', 'MTDL'] },
  { id: '4', headline: 'Property Sector Faces Headwinds from Rising Mortgage Rates', source: 'Kontan', date: '2026-04-09', sentiment: 'bearish', score: -0.55, confidence: 0.78, keywords: ['property', 'mortgage', 'rates'], relatedStocks: ['BSDE', 'SMRA', 'CTRA'] },
  { id: '5', headline: 'Consumer Goods Neutral as Inflation Data Mixed', source: 'Bisnis Indonesia', date: '2026-04-09', sentiment: 'neutral', score: 0.05, confidence: 0.65, keywords: ['consumer', 'inflation'], relatedStocks: ['UNVR', 'ICBP', 'INDF'] },
];

export function calculateAvgSentiment(stock: string): { score: number; trend: 'improving' | 'declining' | 'stable' } {
  const related = SENTIMENT_DATA.filter(s => s.relatedStocks.includes(stock));
  if (related.length === 0) return { score: 0, trend: 'stable' };
  const avg = related.reduce((sum, s) => sum + s.score, 0) / related.length;
  return {
    score: avg,
    trend: avg > 0.3 ? 'improving' : avg < -0.3 ? 'declining' : 'stable',
  };
}
