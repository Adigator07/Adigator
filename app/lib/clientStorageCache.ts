/**
 * Lightweight in-memory cache for localStorage reads — avoids re-parsing large JSON
 * on every list/get during dashboard interactions.
 */

type StorageCacheEntry<T> = {
  raw: string | null;
  data: T;
};

const caches = new Map<string, StorageCacheEntry<unknown>>();

// Keys (or key prefixes) that hold rebuildable caches and can be evicted first
// when localStorage runs out of space, before we risk dropping source data.
const VOLATILE_STORAGE_KEY_PREFIXES = [
  "adigator_dashboard_",
  "adigator_preview_studio_cache",
  "adigator_report_cache",
  "adigator_download_history_cache",
];

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
}

function freeVolatileStorage(preserveKey: string): boolean {
  if (typeof window === "undefined") return false;
  let freed = false;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || key === preserveKey) continue;
      if (VOLATILE_STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    keys.forEach((key) => {
      localStorage.removeItem(key);
      caches.delete(key);
      freed = true;
    });
  } catch {
    /* noop — best effort */
  }
  return freed;
}

function setItemSafe(key: string, raw: string): void {
  try {
    localStorage.setItem(key, raw);
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
    // Free rebuildable caches and retry once before giving up.
    if (freeVolatileStorage(key)) {
      try {
        localStorage.setItem(key, raw);
        return;
      } catch (retryError) {
        if (!isQuotaExceededError(retryError)) throw retryError;
      }
    }
    // Keep the value in the in-memory cache so the current session still works,
    // but do not crash the app when persistence is impossible.
    console.warn(
      `[storage] "${key}" kept in memory only — localStorage quota exceeded and could not be freed.`,
    );
  }
}

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
    setItemSafe(key, raw);
  }
  caches.set(key, { raw, data });
  return raw;
}

// Rebuildable caches/assets that are persisted separately (IndexedDB / per-campaign caches)
// and must NOT bloat any localStorage campaign list, which is bounded by the ~5MB quota.
const HEAVY_REBUILDABLE_FIELDS = new Set([
  "previewStudioCache",
  "dashboardOverviewCache",
  "dashboardPreviewCache",
  "previewDataUrl",
  "fullUrl",
  "thumbnailDataUrl",
]);

function isHeavyDataUrl(value: unknown): boolean {
  return typeof value === "string" && value.startsWith("data:") && value.length > 4_000;
}

/**
 * JSON serializer that strips rebuildable caches and heavy base64 assets so campaign
 * lists stay well under the localStorage quota. Previews are re-hydrated from IndexedDB.
 */
export function serializeWithoutHeavyFields<T>(data: T): string {
  return JSON.stringify(data, (key, value) => {
    if (HEAVY_REBUILDABLE_FIELDS.has(key)) return undefined;
    if (isHeavyDataUrl(value)) return undefined;
    return value;
  });
}

export function invalidateStorageCache(key?: string): void {
  if (key) {
    caches.delete(key);
    return;
  }
  caches.clear();
}
