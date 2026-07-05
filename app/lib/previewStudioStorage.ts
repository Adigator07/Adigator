import type { PreviewStudioCache } from "@/app/lib/previewStudioPersistence";

const DB_NAME = "adigator-preview-studio";
const DB_VERSION = 1;
const STORE_NAME = "caches";

let storageScope = "default";

export function setPreviewStudioStorageScope(scope: string) {
  storageScope = String(scope || "default");
}

function scopedKey(campaignId: string): string {
  return `${storageScope}::${campaignId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error("Preview studio IndexedDB open failed"));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }
  return dbPromise;
}

export async function loadPreviewStudioCacheFromStorage(
  campaignId: string,
): Promise<PreviewStudioCache | null> {
  if (!campaignId || !isBrowser()) return null;

  try {
    const db = await openDb();
    if (!db) return null;

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(scopedKey(campaignId));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const value = request.result;
        resolve(value && typeof value === "object" ? value as PreviewStudioCache : null);
      };
    });
  } catch (error) {
    console.warn("[previewStudioStorage] load failed:", error);
    return null;
  }
}

export async function savePreviewStudioCacheToStorage(
  campaignId: string,
  cache: PreviewStudioCache,
): Promise<void> {
  if (!campaignId || !cache || !isBrowser()) return;

  try {
    const db = await openDb();
    if (!db) return;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(cache, scopedKey(campaignId));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn("[previewStudioStorage] save failed:", error);
  }
}

export function mergePreviewStudioCaches(
  primary: PreviewStudioCache | null | undefined,
  secondary: PreviewStudioCache | null | undefined,
): PreviewStudioCache | null {
  if (!primary && !secondary) return null;
  if (!primary) return secondary ?? null;
  if (!secondary) return primary;

  if (primary.sourceFingerprint !== secondary.sourceFingerprint) {
    const primaryTime = Date.parse(primary.updatedAt || "") || 0;
    const secondaryTime = Date.parse(secondary.updatedAt || "") || 0;
    return primaryTime >= secondaryTime ? primary : secondary;
  }

  return {
    sourceFingerprint: primary.sourceFingerprint,
    updatedAt: pickLatestTimestamp(primary.updatedAt, secondary.updatedAt),
    entries: {
      ...secondary.entries,
      ...primary.entries,
    },
  };
}

function pickLatestTimestamp(a: string, b: string): string {
  const aTime = Date.parse(a || "") || 0;
  const bTime = Date.parse(b || "") || 0;
  return aTime >= bTime ? a : b;
}
