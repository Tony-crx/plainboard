// Free News Data Engine -- no paid APIs
// Sources: NewsAPI (free tier), RSS feeds, public APIs, GitHub trending, Hacker News

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  summary?: string;
  publishedAt: string;
  category: string;
  relevanceScore?: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  price?: string;
  change?: string;
  changePercent?: string;
}

// ============ NEWSAPI (Free Tier: 100 req/day) ============
export async function fetchNewsAPI(query: string, apiKey: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&sortBy=publishedAt&apiKey=${apiKey}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a: any, i: number) => ({
      id: `newsapi-${i}`,
      title: a.title || 'Untitled',
      source: a.source?.name || a.source || 'Unknown',
      url: a.url || '#',
      summary: a.description,
      publishedAt: a.publishedAt,
      category: 'news',
    }));
  } catch {
    return [];
  }
}

// ============ HACKER NEWS (Free, no API key) ============
export async function fetchHackerNews(storyCount = 10): Promise<NewsArticle[]> {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!idsRes.ok) return [];
    const ids: number[] = await idsRes.json();

    const items = await Promise.all(
      ids.slice(0, storyCount).map(async (id, i) => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          const item = await res.json();
          return {
            id: `hn-${id}`,
            title: item.title || 'Untitled',
            source: 'Hacker News',
            url: item.url || `https://news.ycombinator.com/item?id=${id}`,
            publishedAt: new Date(item.time * 1000).toISOString(),
            category: 'tech',
            relevanceScore: item.score,
          };
        } catch {
          return null;
        }
      })
    );

    return items.filter(Boolean) as NewsArticle[];
  } catch {
    return [];
  }
}

// ============ GITHUB TRENDING (Free, scraped via public API) ============
export async function fetchGitHubTrending(): Promise<NewsArticle[]> {
  try {
    // Use a free GitHub API endpoint (no auth needed for public data)
    const res = await fetch('https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=10');
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || []).map((repo: any, i: number) => ({
      id: `gh-${i}`,
      title: `${repo.full_name} (${repo.stargazers_count} ⭐)`,
      source: 'GitHub',
      url: repo.html_url,
      summary: repo.description || '',
      publishedAt: repo.created_at,
      category: 'dev',
    }));
  } catch {
    return [];
  }
}

// ============ OPEN NEWS RSS FEEDS (Free) ============
export async function fetchRSSFeed(url: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();

    // Simple XML parsing (no external dependency)
    const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
    return items.slice(0, 10).map((item, i) => {
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Untitled';
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '#';
      const desc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
      const date = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || new Date().toISOString();

      return {
        id: `rss-${i}-${Date.now()}`,
        title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
        source: new URL(link).hostname,
        url: link,
        summary: desc.replace(/<[^>]*>/g, '').substring(0, 200),
        publishedAt: new Date(date).toISOString(),
        category: 'rss',
      };
    });
  } catch {
    return [];
  }
}

// ============ CRYPTO MARKET DATA (Free: CoinGecko) ============
export async function fetchCryptoPrices(): Promise<MarketData[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=usd&include_24hr_change=true'
    );
    if (!res.ok) return [];
    const data = await res.json();

    const symbols: Record<string, { symbol: string; name: string }> = {
      bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
      ethereum: { symbol: 'ETH', name: 'Ethereum' },
      solana: { symbol: 'SOL', name: 'Solana' },
      dogecoin: { symbol: 'DOGE', name: 'Dogecoin' },
    };

    return Object.entries(data).map(([key, val]: [string, any]) => ({
      symbol: symbols[key]?.symbol || key,
      name: symbols[key]?.name || key,
      price: `$${val.usd?.toLocaleString()}`,
      change: val.usd_24h_change ? `${val.usd_24h_change > 0 ? '+' : ''}${val.usd_24h_change.toFixed(2)}%` : 'N/A',
      changePercent: val.usd_24h_change?.toFixed(2),
    }));
  } catch {
    return [];
  }
}

// ============ COMBINED NEWS FEED ============
export async function fetchAllNews(sources: {
  newsAPIKey?: string;
  rssFeeds?: string[];
  includeHN?: boolean;
  includeGitHub?: boolean;
  includeCrypto?: boolean;
}): Promise<{
  articles: NewsArticle[];
  market: MarketData[];
  sources: string[];
}> {
  const articles: NewsArticle[] = [];
  const market: MarketData[] = [];
  const loadedSources: string[] = [];

  const promises: Promise<void>[] = [];

  if (sources.newsAPIKey) {
    promises.push(
      fetchNewsAPI('AI OR artificial intelligence OR LLM OR technology', sources.newsAPIKey)
        .then(a => { articles.push(...a); loadedSources.push('NewsAPI'); })
        .catch(() => { })
    );
  }

  if (sources.includeHN) {
    promises.push(
      fetchHackerNews(15)
        .then(a => { articles.push(...a); loadedSources.push('HackerNews'); })
        .catch(() => { })
    );
  }

  if (sources.includeGitHub) {
    promises.push(
      fetchGitHubTrending()
        .then(a => { articles.push(...a); loadedSources.push('GitHub'); })
        .catch(() => { })
    );
  }

  if (sources.rssFeeds && sources.rssFeeds.length > 0) {
    for (const feed of sources.rssFeeds) {
      promises.push(
        fetchRSSFeed(feed)
          .then(a => { articles.push(...a); loadedSources.push('RSS'); })
          .catch(() => { })
      );
    }
  }

  if (sources.includeCrypto) {
    promises.push(
      fetchCryptoPrices()
        .then(m => { market.push(...m); loadedSources.push('CoinGecko'); })
        .catch(() => { })
    );
  }

  await Promise.allSettled(promises);

  // Sort by date (newest first)
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { articles, market, sources: loadedSources };
}
