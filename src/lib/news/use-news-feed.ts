'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAllNews, NewsArticle, MarketData } from '@/lib/news/news-engine';

interface NewsFeedState {
  articles: NewsArticle[];
  market: MarketData[];
  sources: string[];
  loading: boolean;
  lastUpdate: Date | null;
}

export function useNewsFeed(newsAPIKey?: string) {
  const [state, setState] = useState<NewsFeedState>({
    articles: [],
    market: [],
    sources: [],
    loading: false,
    lastUpdate: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await fetchAllNews({
      newsAPIKey: newsAPIKey || undefined,
      includeHN: true,
      includeGitHub: true,
      includeCrypto: true,
      rssFeeds: [
        'https://feeds.bbci.co.uk/technology/rss.xml',
        'https://www.wired.com/feed/rss',
      ],
    });
    setState({
      articles: result.articles,
      market: result.market,
      sources: result.sources,
      loading: false,
      lastUpdate: new Date(),
    });
  }, [newsAPIKey]);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return { ...state, refresh: fetch };
}
