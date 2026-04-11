# CortisolBoard — 50 Phase Massive Expansion Plan

> **Target:** Transform The Board into a real Bloomberg Terminal experience
> **Status:** Planning Document — Each phase is self-contained and buildable
> **Created:** 2026-04-12

---

## Phase 1: IDX Real-Time Stock Ticker ✅
**Status:** DONE
- Scrolling ticker tape with live IDX stock prices
- Color-coded: green (▲) / red (▼)
- Auto-refresh every 2 minutes
- Yahoo Finance proxy via `/api/stocks`

## Phase 2: Crypto Prices Tab ✅
**Status:** DONE
- Top 15 cryptocurrencies by market cap
- 24h price change, volume, market cap
- CoinGecko API via `/api/crypto` proxy

## Phase 3: FX Exchange Rates Tab ✅
**Status:** DONE
- 10 major currency pairs (IDR, EUR, GBP, JPY, SGD, AUD, CNY, MYR, KRW, INR)
- ExchangeRate-API via `/api/fx` proxy

## Phase 4: Dev.to News Tab ✅
**Status:** DONE
- Top programming articles from Dev.to
- Author, reactions, comments, tags
- No API key needed

## Phase 5: Reddit Sentiment Tab ✅
**Status:** DONE
- r/wallstreetbets hot posts
- Score, comment count, subreddit
- No API key needed

## Phase 6: FRED Economic Data Tab ✅
**Status:** DONE
- 5 economic indicators: Unemployment, CPI, Fed Rate, 10Y Treasury, GDP
- Server-side proxy `/api/fred` to avoid CORS
- Trend arrows (up/down/flat)

## Phase 7: News Aggregator Tab ✅
**Status:** DONE
- MarketAux + NewsAPI integration
- Combined feed sorted by date
- Requires API keys

## Phase 8: World Bank Data Tab
**Status:** PLANNED
- GDP, population, inflation, trade balance for Indonesia
- World Bank Open Data API (free, no key)
- Historical charts with sparklines

## Phase 9: Stock Watchlist Builder
**Status:** PLANNED
- Custom watchlist: add/remove IDX stocks
- Pin favorite stocks to top
- Persistent watchlist in localStorage
- Click to expand: full quote (OHLCV, market cap, PE ratio)

## Phase 10: IHSG Index Tracker
**Status:** PLANNED
- Real-time IHSG (^JKSE) index value
- Daily high/low, YTD performance
- Mini sparkline chart (last 30 days)
- Color-coded: green above previous close, red below

## Phase 11: Sector Heatmap
**Status:** PLANNED
- IDX sectors: Banking, Mining, Consumer, Infrastructure, etc.
- Heatmap colored by sector performance (%)
- Click sector → expand to see constituent stocks
- Data from Yahoo Finance sector indices

## Phase 12: Most Active Stocks
**Status:** PLANNED
- Top 10 most traded stocks by volume
- Auto-refresh every 60 seconds
- Volume vs average volume ratio
- Unusual volume detection (>3x average)

## Phase 13: Stock Screener Panel
**Status:** PLANNED
- Filter: P/E ratio, PBV, ROE, dividend yield, market cap
- Sort by any metric
- Pre-built screens: "High Dividend", "Undervalued", "Growth"
- Results in sortable table

## Phase 14: Bond & Treasury Tab
**Status:** PLANNED
- Indonesian government bond yields (FR, SUN series)
- Yield curve visualization (1Y, 2Y, 5Y, 10Y, 20Y)
- US Treasury yields via FRED
- Spread calculator (ID-US yield differential)

## Phase 15: Commodity Prices Tab
**Status:** PLANNED
- Gold, silver, oil (WTI, Brent), coal, CPO, nickel, copper
- Real-time prices from free APIs
- Commodity-exposed IDX stocks (ANTM, ADRO, UNTR, PGAS)
- Price chart (30-day mini sparkline)

## Phase 16: IPO Calendar
**Status:** PLANNED
- Upcoming IDX IPOs with date, price, sector
- Recent IPO performance (listing price vs current)
- Data scraped from idx.co.id public pages via server proxy
- Subscribe to IPO alerts

## Phase 17: Corporate Actions Feed
**Status:** PLANNED
- Stock splits, dividends, rights issues
- Cum/Ex-dividend dates
- Dividend yield calculator
- Historical corporate actions per stock

## Phase 18: Mutual Fund Tracker
**Status:** PLANNED
- Top performing mutual funds (reksadana)
- 1M, 3M, 6M, 1Y, 3Y returns
- Fund category filter (equity, fixed income, money market)
- AUM (Asset Under Management) ranking

## Phase 19: Options & Futures Dashboard
**Status:** PLANNED
- IDX LQ45 futures prices
- Put/Call ratio for available options
- Open interest heatmap
- Expiration calendar

## Phase 20: Economic Calendar
**Status:** PLANNED
- Upcoming economic data releases (BI rate, CPI, GDP, trade balance)
- Actual vs Forecast vs Previous
- Market impact rating (high/medium/low)
- Countdown timer to next release

## Phase 21: BI Rate Decision Tracker
**Status:** PLANNED
- Bank Indonesia rate history chart
- Next RDG meeting date countdown
- Rate change probability (based on analyst consensus)
- Historical impact on IHSG and IDR

## Phase 22: Currency Strength Meter
**Status:** PLANNED
- Real-time strength index for major currencies
- USD, EUR, JPY, GBP, IDR strength bars
- Cross-currency correlation matrix
- Strength change over time (1D, 1W, 1M)

## Phase 23: Market Breadth Dashboard
**Status:** PLANNED
- Advancers vs Decliners count
- New highs vs New lows
- Volume ratio (up volume / down volume)
- Advance-Decline Line chart (cumulative)

## Phase 24: Volatility Index (VIX Equivalent)
**Status:** PLANNED
- IDX volatility estimation from option prices
- Historical VIX chart
- Fear/Greed indicator gauge
- Correlation with IHSG movements

## Phase 25: Money Flow Analysis
**Status:** PLANNED
- Foreign net buy/sell per stock
- Foreign cumulative flow (YTD)
- Top 10 foreign accumulation stocks
- Domestic vs institutional flow

## Phase 26: Technical Analysis Panel
**Status:** PLANNED
- RSI, MACD, Bollinger Bands, Moving Averages
- Auto-generated signals: "BBCA: RSI oversold (28.5)"
- Support/Resistance levels
- Chart pattern detection (head & shoulders, double top)

## Phase 27: Portfolio Simulator
**Status:** PLANNED
- Create virtual portfolio with virtual money
- Track P&L in real-time
- Performance vs IHSG benchmark
- Share portfolio with others (export JSON)

## Phase 28: Alert System
**Status:** PLANNED
- Price alerts: "Notify me when BBCA > 9,500"
- Volume alerts: "Unusual volume detected"
- News alerts: "Keyword match in headlines"
- Browser notifications + sound

## Phase 29: Dark Mode / Light Mode Toggle ✅
**Status:** DONE (partial — needs full implementation)
- Complete theme system
- Persist preference in localStorage
- Smooth transition animation

## Phase 30: Full Keyboard Navigation
**Status:** PLANNED
- Tab-based navigation between all tabs
- Arrow keys to scroll through lists
- Enter to select/open detail
- Escape to close modals
- Command palette (Cmd+K) for quick actions

## Phase 31: Multi-Workspace System
**Status:** PLANNED
- Create multiple workspaces (Personal, Trading, Research)
- Each workspace has own layout and tabs
- Switch workspaces with dropdown
- Share workspace config with team

## Phase 32: Real-Time Chat Integration
**Status:** PLANNED
- WebSocket-based chat between users
- Share stock picks, analysis, alerts
- Pin messages to workspace
- @mention to notify specific users

## Phase 33: Screen Sharing / Co-Viewing
**Status:** PLANNED
- Real-time screen sync with another user
- Both users see same data, same scroll position
- Voice chat overlay
- "Watch me trade" mode

## Phase 34: Automated Report Generator
**Status:** PLANNED
- Daily/weekly market summary report
- PDF export with charts, tables, analysis
- Auto-email to configured address
- Scheduled via cron system

## Phase 35: AI Market Analysis Bot
**Status:** PLANNED
- Use swarm agents to analyze market conditions
- Auto-generate daily market outlook
- Sector rotation analysis
- Risk assessment score

## Phase 36: Earnings Calendar
**Status:** PLANNED
- Upcoming earnings releases for IDX stocks
- EPS estimates vs actual
- Earnings surprise history
- Post-earnings price movement tracker

## Phase 37: Analyst Consensus Tracker
**Status:** PLANNED
- Analyst buy/hold/sell ratings per stock
- Price target consensus
- Rating changes history
- Analyst accuracy scorecard

## Phase 38: Insider Trading Tracker
**Status:** PLANNED
- Director/commissioner stock transactions
- Insider buying/selling patterns
- Significant shareholder changes
- Time correlation with price moves

## Phase 39: Global Markets Overview
**Status:** PLANNED
- S&P 500, NASDAQ, Nikkei, Hang Seng, Shanghai
- European markets: FTSE, DAX, CAC 40
- Global market heatmap
- Overnight correlation analysis

## Phase 40: Commodities Correlation Matrix
**Status:** PLANNED
- How commodity prices affect IDX stocks
- Oil → ADRO, UNTR correlation
- Coal → ITMG, ADRO correlation
- Gold → ANTM, MDKA correlation
- Live correlation coefficient

## Phase 41: Sector Rotation Model
**Status:** PLANNED
- Track money flow between sectors
- Sector performance ranking (1D, 1W, 1M, 3M)
- Early warning: "Money moving from Banking to Mining"
- Historical sector cycle visualization

## Phase 42: Risk Management Dashboard
**Status:** PLANNED
- Portfolio VaR (Value at Risk) calculator
- Beta-weighted exposure analysis
- Stress test scenarios (2008 crash, 2020 pandemic)
- Maximum drawdown calculator

## Phase 43: Options Strategy Builder
**Status:** PLANNED
- Build options strategies visually
- Payoff diagram generator
- Risk/reward analysis
- Strategy backtesting

## Phase 44: Dividend Calendar
**Status:** PLANNED
- Upcoming dividend payments by date
- Dividend yield ranking
- Ex-dividend date countdown
- Dividend reinvestment calculator

## Phase 45: Market Maker Activity
**Status:** PLANNED
- Track market maker orders
- Bid-ask spread analysis
- Order book depth visualization
- Unusual options activity detection

## Phase 46: News Sentiment Analyzer
**Status:** PLANNED
- AI-powered sentiment analysis on financial news
- Bullish/Bearish/Neutral classification
- Sentiment score trending per stock
- Correlation between sentiment and price movement

## Phase 47: Social Media Sentiment
**Status:** PLANNED
- Twitter/X stock mentions tracking
- Reddit sentiment (beyond WSB: Indonesia investing subreddits)
- StockTwits trending stocks
- Sentiment vs price overlay chart

## Phase 48: AI Trading Signals
**Status:** PLANNED
- ML-based buy/sell signals
- Pattern recognition (candlestick patterns)
- Volume anomaly detection
- Signal accuracy tracking

## Phase 49: Backtesting Engine
**Status:** PLANNED
- Test strategies on historical data
- Walk-forward analysis
- Performance metrics: Sharpe ratio, max drawdown, win rate
- Strategy optimization

## Phase 50: Mobile Responsive Bloomberg Layout
**Status:** PLANNED
- Single-column layout for mobile
- Swipe between tabs
- Touch-optimized controls
- PWA installable as mobile app

---

## Current Progress: 8/50 Phases Complete (16%)

| Category | Done | Planned |
|----------|------|---------|
| Data Sources | 7 (IDX, Crypto, FX, Dev, Reddit, FRED, News) | 1 (World Bank) |
| Market Analysis | 0 | 20 |
| Trading Tools | 0 | 10 |
| Collaboration | 0 | 3 |
| AI/ML Features | 0 | 3 |
| UX/Platform | 1 (Theme) | 3 |

---

## Priority Recommendation (Next 10 Phases to Build)

### Wave 1: More Data (Phases 8-12)
8. World Bank Data
9. Stock Watchlist
10. IHSG Index
11. Sector Heatmap
12. Most Active Stocks

### Wave 2: Analysis Tools (Phases 13-17)
13. Stock Screener
14. Bonds & Treasury
15. Commodities
16. IPO Calendar
17. Corporate Actions

### Wave 3: Advanced Features (Phases 18-22)
18. Mutual Funds
19. Economic Calendar
20. BI Rate Tracker
21. Currency Strength
22. Market Breadth

### Wave 4: Technical & Trading (Phases 23-27)
23. Volatility Index
24. Money Flow
25. Technical Analysis
26. Portfolio Simulator
27. Alert System

### Wave 5: Collaboration & AI (Phases 28-35)
28. Multi-Workspace
29. Real-Time Chat
30. Report Generator
31. AI Market Bot
32. Screen Sharing
33. Earnings Calendar
34. Analyst Consensus
35. Insider Trading

---

**Total: 50 Phases. Each phase is scoped to 1-4 files max. No breaking changes. Incremental builds.**
