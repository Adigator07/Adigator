/**
 * Lightweight in-memory cache for localStorage reads — avoids re-parsing large JSON
 * on every list/get during dashboard interactions.
 */

type StorageCacheEntry<T> = {
  raw: string | null;
  data: T;
};

const caches = new Map<string, StorageCacheEntry<unknown>>();

export function readCachedJson<T>(
  key: string,
  parse: (raw: string | null) => T,
  fallback: T,
): T {
  if (typeof window === "undefined") return fallback;

  const raw = localStorage.getItem(key);
  const hit = caches.get(key) as StorageCacheEntry<T> | undefined;
  if (hit && hit.raw === raw) return hit.data;

  const data = parse(raw);
  caches.set(key, { raw, data });
  return data;
}

export function writeCachedJson<T>(key: string, data: T, serialize: (data: T) => string): string {
  const raw = serialize(data);
  if (typeof window !== "undefined") {
    localStorage.setItem(key, raw);
  }
  caches.set(key, { raw, data });
  return raw;
}

export function invalidateStorageCache(key?: string): void {
  if (key) {
    caches.delete(key);
    return;
  }
  caches.clear();
}
