/**
 * Offloads creative binary data from localStorage / React state.
 * - Full-quality blobs live in IndexedDB
 * - UI uses small preview blobs via object URLs (fast decode)
 * - Workflow persistence stores metadata only (no base64 url fields)
 */

import { compressDrawable, yieldToMain } from "./imageCompression";
import { attachSourceDimensions } from "./creativeValidation";
import { readImageDimensionsFromBlob, isPlausibleCreativeDimension } from "./imageDimensions";
import { resolvePersistedDimensions } from "./creativeFitAnalysis";
import { isVideoFile, createVideoPreviewBlob } from "./video/videoClient";

const DB_NAME = "adigator-creative-assets";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

let creativeStorageScope = "default";

export function setCreativeStorageScope(scope) {
  creativeStorageScope = String(scope || "default");
}

export function getCreativeStorageScope() {
  return creativeStorageScope;
}

function scopedBlobKey(key) {
  return `${creativeStorageScope}::${key}`;
}

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
  await withStore("readwrite", (store) => store.put(blob, scopedBlobKey(key)));
}

export async function getCreativeBlob(key) {
  const record = await withStore("readonly", (store) => store.get(scopedBlobKey(key)));
  return record instanceof Blob ? record : null;
}

export async function deleteCreativeBlob(key) {
  await withStore("readwrite", (store) => store.delete(scopedBlobKey(key)));
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
  let bitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(source);
  }
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
  // Videos can't be decoded with createImageBitmap — capture a poster frame instead.
  const previewBlob = isVideoFile(file)
    ? await createVideoPreviewBlob(file)
    : await createPreviewBlob(file);
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

async function fetchBlobFromUrlSafely(url) {
  if (!url || typeof url !== "string") return null;

  try {
    if (url.startsWith("data:") || url.startsWith("blob:") || /^https?:\/\//i.test(url)) {
      const response = await fetch(url);
      if (response.ok) return response.blob();
    }
  } catch {
    // Blob URLs expire after reload/revoke; network URLs may fail CORS or offline.
  }

  return null;
}

/** Full-resolution blob only — never the scaled preview (used for dimension reads). */
export async function getCreativeSourceBlob(creative) {
  if (!creative) return null;

  const fromDb = await getCreativeBlob(creative.id);
  if (fromDb) return fromDb;

  if (creative.fullUrl) {
    const blob = await fetchBlobFromUrlSafely(creative.fullUrl);
    if (blob) {
      await putCreativeBlob(creative.id, blob);
      return blob;
    }
  }

  return null;
}

export async function getCreativeFullBlob(creative) {
  if (!creative) return null;

  const sourceBlob = await getCreativeSourceBlob(creative);
  if (sourceBlob) return sourceBlob;

  const previewFromDb = await getCreativeBlob(previewKey(creative.id));
  if (previewFromDb) return previewFromDb;

  if (creative.url) {
    const blob = await fetchBlobFromUrlSafely(creative.url);
    if (blob) {
      await putCreativeBlob(creative.id, blob);
      return blob;
    }
  }

  return null;
}

/**
 * Small display/preview blob (scaled image or video poster frame). Never returns the
 * full-resolution asset or raw video — safe for lightweight payloads like URL validation.
 */
export async function getCreativePreviewBlob(creative) {
  if (!creative) return null;

  const previewFromDb = await getCreativeBlob(previewKey(creative.id));
  if (previewFromDb) return previewFromDb;

  // Fall back to the full blob only for images — never send raw video bytes.
  const fullBlob = await getCreativeBlob(creative.id);
  if (fullBlob && !String(fullBlob.type || "").startsWith("video/")) {
    return fullBlob;
  }

  if (creative.url) {
    const blob = await fetchBlobFromUrlSafely(creative.url);
    if (blob && !String(blob.type || "").startsWith("video/")) {
      return blob;
    }
  }

  return null;
}

/** Restore display URLs from IndexedDB (metadata persisted without url). */
export async function hydrateCreativeRecord(meta) {
  if (!meta?.id) return meta;

  const previewBlob = await getCreativeBlob(previewKey(meta.id));
  const fullBlob = await getCreativeBlob(meta.id);
  const displayBlob = previewBlob || fullBlob;

  const applyDimensionsFromFullBlob = async (record, fullBlob) => {
    const fileName = record.originalFile || record.name || "";
    const persisted = resolvePersistedDimensions(record);
    if (
      persisted
      && isPlausibleCreativeDimension(persisted.width, persisted.height)
    ) {
      return attachSourceDimensions(record, persisted.width, persisted.height);
    }

    if (fullBlob) {
      try {
        const detected = await readImageDimensionsFromBlob(fullBlob, { fileName });
        return attachSourceDimensions(record, detected.width, detected.height);
      } catch {
        // Fall through to persisted metadata.
      }
    }

    if (persisted) {
      return attachSourceDimensions(record, persisted.width, persisted.height);
    }

    return record;
  };

  if (displayBlob) {
    return applyDimensionsFromFullBlob({
      ...meta,
      url: URL.createObjectURL(displayBlob),
      fullUrl: fullBlob ? URL.createObjectURL(fullBlob) : undefined,
      hasStoredAssets: true,
    }, fullBlob);
  }

  if (meta.url && String(meta.url).startsWith("data:")) {
    try {
      const blob = await fetchBlobFromUrlSafely(meta.url);
      if (blob) {
        await putCreativeBlob(meta.id, blob);
        const nextPreviewBlob = await createPreviewBlob(blob);
        await putCreativeBlob(previewKey(meta.id), nextPreviewBlob);
        const { url: _legacyUrl, fullUrl: _legacyFullUrl, ...rest } = meta;
        return applyDimensionsFromFullBlob({
          ...rest,
          url: URL.createObjectURL(nextPreviewBlob),
          fullUrl: URL.createObjectURL(blob),
          hasStoredAssets: true,
        }, blob);
      }
    } catch {
      // Fall through — strip unusable legacy payload below.
    }
  }

  if (meta.url && String(meta.url).startsWith("blob:")) {
    const recovered = await fetchBlobFromUrlSafely(meta.url);
    if (recovered) {
      await putCreativeBlob(meta.id, recovered);
      const nextPreviewBlob = await createPreviewBlob(recovered);
      await putCreativeBlob(previewKey(meta.id), nextPreviewBlob);
      return applyDimensionsFromFullBlob({
        ...meta,
        url: URL.createObjectURL(nextPreviewBlob),
        fullUrl: URL.createObjectURL(recovered),
        hasStoredAssets: true,
      }, recovered);
    }

    const { url: _staleUrl, fullUrl: _staleFullUrl, ...rest } = meta;
    return {
      ...rest,
      url: null,
      fullUrl: null,
      hasStoredAssets: false,
    };
  }

  if (meta.url && /^https?:\/\//i.test(meta.url)) {
    const recovered = await fetchBlobFromUrlSafely(meta.url);
    if (recovered) {
      await putCreativeBlob(meta.id, recovered);
      const nextPreviewBlob = await createPreviewBlob(recovered);
      await putCreativeBlob(previewKey(meta.id), nextPreviewBlob);
      return applyDimensionsFromFullBlob({
        ...meta,
        url: URL.createObjectURL(nextPreviewBlob),
        fullUrl: URL.createObjectURL(recovered),
        hasStoredAssets: true,
      }, recovered);
    }
  }

  if (meta.previewDataUrl && typeof meta.previewDataUrl === "string" && meta.previewDataUrl.startsWith("data:")) {
    const persisted = resolvePersistedDimensions(meta);
    const withPreview = {
      ...meta,
      url: meta.previewDataUrl,
      hasStoredAssets: true,
    };
    if (persisted) {
      return attachSourceDimensions(withPreview, persisted.width, persisted.height);
    }
    return withPreview;
  }

  return { ...meta, url: meta.url || null };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

export async function attachPersistedPreviewData(creative) {
  if (!creative || typeof creative !== "object") return creative;
  const stripped = stripCreativeForPersistence(creative);
  if (stripped.previewDataUrl) return stripped;

  try {
    const previewBlob = await getCreativeBlob(previewKey(creative.id));
    const sourceBlob = previewBlob || await getCreativeBlob(creative.id);
    if (!sourceBlob) return stripped;
    const dataUrl = await blobToDataUrl(sourceBlob);
    if (!dataUrl || dataUrl.length > 120_000) return stripped;
    return { ...stripped, previewDataUrl: dataUrl };
  } catch {
    return stripped;
  }
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
