const cache = new Map<string, unknown>();

export const getClientCache = <T>(key: string) => cache.get(key) as T | undefined;

export const setClientCache = <T>(key: string, value: T) => cache.set(key, value);

export const removeClientCache = (key: string) => cache.delete(key);

export const invalidateClientCachePrefix = (prefix: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

export const clearClientCache = () => cache.clear();

