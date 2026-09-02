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
export const ADMIN_CACHE_TTL = 30;
export const TEMPLATES_CACHE_KEY = 'admin:templates';
const CARD_QUERY_VERSION_KEY = 'admin:cards:version';
export const cacheKey = (slug: string) => `card:${slug}`;

export type CachedCard = {
  google_review_url: string;
  business_name: string;
  card_id: string;
};

export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    const data = await client.get<T | string>(key);
    if (!data) return null;
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }
    return data as T;
  } catch (err) {
    console.error(`Redis get error for "${key}":`, err);
    return null;
  }
}

export async function setCachedValue<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(key, data, { ex: ttl });
  } catch (err) {
    console.error(`Redis set error for "${key}":`, err);
  }
}

export async function deleteCachedValue(...keys: string[]): Promise<void> {
  try {
    const client = getRedis();
    if (!client || keys.length === 0) return;
    await client.del(...keys);
  } catch (err) {
    console.error('Redis del error:', err);
  }
}

export async function getCardQueryCacheVersion(): Promise<number> {
  try {
    const client = getRedis();
    if (!client) return 0;
    return Number(await client.get<number | string>(CARD_QUERY_VERSION_KEY)) || 0;
  } catch (err) {
    console.error('Redis card cache version error:', err);
    return 0;
  }
}

export async function invalidateCardQueries(): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.incr(CARD_QUERY_VERSION_KEY);
  } catch (err) {
    console.error('Redis card cache invalidation error:', err);
  }
}

export const getCachedCard = (slug: string) =>
  getCachedValue<CachedCard>(cacheKey(slug));

export const setCachedCard = (slug: string, data: CachedCard) =>
  setCachedValue(cacheKey(slug), data, CACHE_TTL);

export const deleteCachedCard = (slug: string) =>
  deleteCachedValue(cacheKey(slug));
