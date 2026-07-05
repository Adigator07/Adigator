export type ReportExportKind = "analysis" | "preview_studio";

export type CachedReportExport = {
  fingerprint: string;
  kind: ReportExportKind;
  filename: string;
  generatedAt: string;
  blob: Blob;
};

const DB_NAME = "adigator-report-exports";
const DB_VERSION = 1;
const STORE_NAME = "reports";

let storageScope = "default";

export function setReportExportStorageScope(scope: string) {
  storageScope = String(scope || "default");
}

function scopedKey(fingerprint: string): string {
  return `${storageScope}::${fingerprint}`;
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
      request.onerror = () => reject(request.error || new Error("Report export cache open failed"));
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

export async function getCachedReportExport(
  fingerprint: string,
): Promise<CachedReportExport | null> {
  if (!fingerprint || !isBrowser()) return null;
  try {
    const db = await openDb();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(scopedKey(fingerprint));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const value = request.result;
        resolve(value && value.blob instanceof Blob ? value as CachedReportExport : null);
      };
    });
  } catch {
    return null;
  }
}

export async function saveCachedReportExport(entry: CachedReportExport): Promise<void> {
  if (!entry?.fingerprint || !entry.blob || !isBrowser()) return;
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const request = tx.objectStore(STORE_NAME).put(entry, scopedKey(entry.fingerprint));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn("[reportExportCache] save failed:", error);
  }
}

export async function deleteCachedReportExport(fingerprint: string): Promise<void> {
  if (!fingerprint || !isBrowser()) return;
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const request = tx.objectStore(STORE_NAME).delete(scopedKey(fingerprint));
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // ignore
  }
}

/** Stable IndexedDB key tied to a Download Center row — survives fingerprint scheme changes. */
export function buildDownloadEntryFingerprint(entryId: string): string {
  return `download-entry::${entryId}`;
}

/** Persist exported PDF for Download Center one-click reopen (by entry id + optional content fingerprint). */
export async function saveDownloadEntryReport(
  entryId: string,
  blob: Blob,
  meta: {
    filename: string;
    kind: ReportExportKind;
    fingerprint?: string;
  },
): Promise<void> {
  if (!entryId || !blob) return;

  const generatedAt = new Date().toISOString();
  const base = {
    kind: meta.kind,
    filename: meta.filename,
    generatedAt,
    blob,
  };

  await saveCachedReportExport({
    ...base,
    fingerprint: buildDownloadEntryFingerprint(entryId),
  });

  if (meta.fingerprint && meta.fingerprint !== buildDownloadEntryFingerprint(entryId)) {
    await saveCachedReportExport({
      ...base,
      fingerprint: meta.fingerprint,
    });
  }
}

export function buildAnalysisReportFingerprint(input: {
  campaignId?: string;
  platform?: string;
  campaignGoal?: string;
  campaignVertical?: string;
  creativeFingerprint?: string;
  analysisVersion?: string;
  exportScope?: string;
  selectedCreativeId?: string;
}): string {
  return [
    "analysis-v4-static",
    input.exportScope || "overview",
    input.selectedCreativeId || "",
    input.campaignId || "local",
    input.platform || "",
    input.campaignGoal || "",
    input.campaignVertical || "",
    input.creativeFingerprint || "",
    input.analysisVersion || "",
  ].join("|");
}

export function buildPreviewStudioReportFingerprint(input: {
  campaignId?: string;
  previewStudioUpdatedAt?: string;
  creativeFingerprint?: string;
  templateId?: string;
  device?: string;
  creativeId?: string;
  placement?: string;
}): string {
  return [
    "preview-v4-static",
    input.campaignId || "local",
    input.templateId || input.placement || "",
    input.device || "",
    input.creativeId || "",
    input.previewStudioUpdatedAt || "",
    input.creativeFingerprint || "",
  ].join("|");
}
