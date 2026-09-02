const cache = new Map<string, unknown>();

export const getClientCache = <T>(key: string) => cache.get(key) as T | undefined;

export const setClientCache = <T>(key: string, value: T) => cache.set(key, value);

export const clearClientCache = () => cache.clear();
