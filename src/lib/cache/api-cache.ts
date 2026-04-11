interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; entries: number } {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry.data).length;
    }
    return {
      size,
      entries: this.cache.size
    };
  }
}

export const apiCache = new RequestCache();

// Cache helper for API calls
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  
  const cached = apiCache.get<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  apiCache.set(cacheKey, data, ttl);
  
  return data;
}

// Decorator for caching API route responses
export function withCache<T>(
  handler: (req: Request) => Promise<T>,
  ttl?: number
) {
  return async (req: Request): Promise<Response> => {
    const cacheKey = `${req.url}:${req.method}`;
    
    // Only cache GET requests
    if (req.method === 'GET') {
      const cached = apiCache.get<T>(cacheKey);
      if (cached) {
        return Response.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-TTL': String(ttl || 5 * 60 * 1000)
          }
        });
      }
    }

    const result = await handler(req);

    if (req.method === 'GET') {
      apiCache.set(cacheKey, result, ttl);
    }

    return Response.json(result, {
      headers: {
        'X-Cache': 'MISS'
      }
    });
  };
}

export default apiCache;
