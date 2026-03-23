const cache = new Map<string, { data: unknown; timestamp: number }>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttl?: number) {
  cache.set(key, { data, timestamp: Date.now() });
  if (ttl) {
    setTimeout(() => cache.delete(key), ttl);
  }
}

export function clearCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}
