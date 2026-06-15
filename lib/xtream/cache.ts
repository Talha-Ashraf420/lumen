// Tiny in-memory TTL cache for catalog JSON. Xtream catalogs are large and slow
// to fetch (the full VOD list can take 20s+); caching makes repeat loads instant.
// Single-user server, so a process-level Map is fine.

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();
const DEFAULT_TTL = 10 * 60 * 1000; // 10 min

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): void {
  store.set(key, { value, expires: Date.now() + ttl });
}

/** Wrap an async producer with cache. */
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await fn();
  cacheSet(key, value, ttl);
  return value;
}
