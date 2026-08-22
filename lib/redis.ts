import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

export const CACHE_TTL = 86400 * 7; // 7 days cache for active cards
export const cacheKey = (slug: string) => `card:${slug}`;

export type CachedCard = {
  google_review_url: string;
  business_name: string;
  card_id: string;
};

// Ultra-fast cached card getter
export async function getCachedCard(slug: string): Promise<CachedCard | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const data = await client.get<CachedCard | string>(cacheKey(slug));
    if (!data) return null;
    if (typeof data === 'string') {
      return JSON.parse(data) as CachedCard;
    }
    return data as CachedCard;
  } catch (err) {
    console.error('Redis get error:', err);
    return null;
  }
}

// Proactive cache warmer / setter
export async function setCachedCard(slug: string, data: CachedCard): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(cacheKey(slug), data, { ex: CACHE_TTL });
  } catch (err) {
    console.error('Redis set error:', err);
  }
}

// Cache invalidation
export async function deleteCachedCard(slug: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(cacheKey(slug));
  } catch (err) {
    console.error('Redis del error:', err);
  }
}

// Lazy proxy for direct redis calls
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis();
    if (!client) {
      throw new Error('Upstash Redis is not configured in environment variables');
    }
    return (client as any)[prop];
  },
});
