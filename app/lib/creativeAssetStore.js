/**
 * Offloads creative binary data from localStorage / React state.
 * - Full-quality blobs live in IndexedDB
 * - UI uses small preview blobs via object URLs (fast decode)
 * - Workflow persistence stores metadata only (no base64 url fields)
 */

import { compressDrawable, yieldToMain } from "./imageCompression";

const DB_NAME = "adigator-creative-assets";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

let dbPromise = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb() {
  if (!isBrowser()) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }
  return dbPromise;
}

function withStore(mode, fn) {
  return openDb().then((db) => {
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = fn(store);

      if (request && typeof request === "object" && "onsuccess" in request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
      } else {
        tx.oncomplete = () => resolve(null);
      }

      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    });
  });
}

export function previewKey(creativeId) {
  return `${creativeId}:preview`;
}

export async function putCreativeBlob(key, blob) {
  if (!blob) return;
  await withStore("readwrite", (store) => store.put(blob, key));
}

export async function getCreativeBlob(key) {
  const record = await withStore("readonly", (store) => store.get(key));
  return record instanceof Blob ? record : null;
}

export async function deleteCreativeBlob(key) {
  await withStore("readwrite", (store) => store.delete(key));
}

export async function deleteCreativeAssets(creativeId) {
  await Promise.all([
    deleteCreativeBlob(creativeId),
    deleteCreativeBlob(previewKey(creativeId)),
  ]);
}

export function revokeObjectUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function revokeCreativeObjectUrls(creative) {
  if (!creative) return;
  revokeObjectUrl(creative.url);
  revokeObjectUrl(creative.fullUrl);
}

export async function createPreviewBlob(source, maxEdge = 420) {
  const bitmap = await createImageBitmap(source);
  try {
    const longest = Math.max(bitmap.width, bitmap.height, 1);
    const scale = Math.min(1, maxEdge / longest);
    const encoded = await compressDrawable(bitmap, {
      outputType: "image/jpeg",
      quality: 0.76,
      scale,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
      includeDataUrl: false,
    });
    return encoded.blob;
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

export async function storeUploadedCreativeFile(creativeId, file) {
  const previewBlob = await createPreviewBlob(file);
  await putCreativeBlob(creativeId, file);
  await putCreativeBlob(previewKey(creativeId), previewBlob);
  return {
    displayUrl: URL.createObjectURL(previewBlob),
    fullUrl: URL.createObjectURL(file),
  };
}

export async function storeCompressedCreativeBlobs(creativeId, fullBlob) {
  const previewBlob = await createPreviewBlob(fullBlob);
  await putCreativeBlob(creativeId, fullBlob);
  await putCreativeBlob(previewKey(creativeId), previewBlob);
  return {
    displayUrl: URL.createObjectURL(previewBlob),
    fullUrl: URL.createObjectURL(fullBlob),
  };
}

export async function getCreativeFullBlob(creative) {
  if (!creative) return null;
  const fromDb = await getCreativeBlob(creative.id);
  if (fromDb) return fromDb;
  if (creative.fullUrl) {
    const response = await fetch(creative.fullUrl);
    if (response.ok) return response.blob();
  }
  if (creative.url) {
    const response = await fetch(creative.url);
    if (response.ok) return response.blob();
  }
  return null;
}

/** Restore display URLs from IndexedDB (metadata persisted without url). */
export async function hydrateCreativeRecord(meta) {
  if (!meta?.id) return meta;

  if (meta.url && String(meta.url).startsWith("data:")) {
    try {
      const response = await fetch(meta.url);
      if (response.ok) {
        const blob = await response.blob();
        await putCreativeBlob(meta.id, blob);
        const previewBlob = await createPreviewBlob(blob);
        await putCreativeBlob(previewKey(meta.id), previewBlob);
        const { url: _legacyUrl, fullUrl: _legacyFullUrl, ...rest } = meta;
        return {
          ...rest,
          url: URL.createObjectURL(previewBlob),
          fullUrl: URL.createObjectURL(blob),
          hasStoredAssets: true,
        };
      }
    } catch {
      return meta;
    }
  }

  if (meta.url && String(meta.url).startsWith("blob:")) {
    return meta;
  }

  const previewBlob = await getCreativeBlob(previewKey(meta.id));
  const fullBlob = await getCreativeBlob(meta.id);
  const displayBlob = previewBlob || fullBlob;

  if (!displayBlob) {
    return { ...meta, url: meta.url || null };
  }

  return {
    ...meta,
    url: URL.createObjectURL(displayBlob),
    fullUrl: fullBlob && fullBlob !== displayBlob ? URL.createObjectURL(fullBlob) : undefined,
    hasStoredAssets: true,
  };
}

export function stripCreativeForPersistence(creative) {
  if (!creative || typeof creative !== "object") return creative;
  const { url, fullUrl, ...rest } = creative;
  return {
    ...rest,
    hasStoredAssets: Boolean(rest.hasStoredAssets || rest.id),
  };
}

export async function hydrateCreativesList(metas, concurrency = 4) {
  const list = Array.isArray(metas) ? metas : [];
  if (!list.length) return [];

  const results = new Array(list.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, list.length);

  const worker = async () => {
    while (nextIndex < list.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await hydrateCreativeRecord(list[index]);
      await yieldToMain();
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
