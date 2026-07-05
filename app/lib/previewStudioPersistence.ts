import type { PreviewEngineOutput } from "@/app/lib/preview-engine/types";

export type PreviewStudioCacheEntry = {
  output: PreviewEngineOutput;
  generatedAt: string;
  entryKey: string;
};

export type PreviewStudioCache = {
  entries: Record<string, PreviewStudioCacheEntry>;
  sourceFingerprint: string;
  updatedAt: string;
};

export type PreviewStudioSourceInput = {
  advertiserId?: string;
  advertiserName?: string;
  campaignId?: string;
  campaignName?: string;
  campaignBrief?: string;
  campaignIntentFingerprint?: string;
  campaignIntent?: string;
  vertical?: string;
  creativeFingerprint?: string;
};

export type PreviewStudioEntryInput = {
  templateId: string;
  device: string;
  creativeId: string;
  creativeSize: string;
  goal: string;
  creativeVertical?: string;
};

/** Campaign-level fingerprint — invalidates all entries when inputs change. */
export function buildPreviewStudioSourceFingerprint(input: PreviewStudioSourceInput): string {
  return [
    input.advertiserId || input.advertiserName || "",
    input.campaignId || input.campaignName || "",
    (input.campaignBrief || "").trim(),
    input.campaignIntentFingerprint || (input.campaignIntent || "").trim(),
    input.vertical || "",
    input.creativeFingerprint || "",
  ].join("|");
}

export function buildPreviewStudioEntryKey(input: PreviewStudioEntryInput): string {
  return [
    input.templateId,
    input.device,
    input.creativeId,
    input.creativeSize,
    input.goal,
    input.creativeVertical || "",
  ].join("|");
}

export function readPreviewStudioCacheEntry(
  cache: PreviewStudioCache | null | undefined,
  sourceFingerprint: string,
  entryKey: string,
): PreviewStudioCacheEntry | null {
  if (!cache?.entries || cache.sourceFingerprint !== sourceFingerprint) return null;
  const entry = cache.entries[entryKey];
  if (!entry?.output) return null;
  return entry;
}

export function writePreviewStudioCacheEntry(
  cache: PreviewStudioCache | null | undefined,
  sourceFingerprint: string,
  entryKey: string,
  output: PreviewEngineOutput,
): PreviewStudioCache {
  const base: PreviewStudioCache = cache?.sourceFingerprint === sourceFingerprint
    ? { ...cache, entries: { ...cache.entries } }
    : { entries: {}, sourceFingerprint, updatedAt: new Date().toISOString() };

  base.entries[entryKey] = {
    output,
    generatedAt: new Date().toISOString(),
    entryKey,
  };
  base.updatedAt = new Date().toISOString();
  base.sourceFingerprint = sourceFingerprint;
  return base;
}

export function removePreviewStudioCacheEntry(
  cache: PreviewStudioCache | null | undefined,
  sourceFingerprint: string,
  entryKey: string,
): PreviewStudioCache | null {
  if (!cache?.entries || cache.sourceFingerprint !== sourceFingerprint) return cache ?? null;
  const nextEntries = { ...cache.entries };
  delete nextEntries[entryKey];
  return {
    ...cache,
    entries: nextEntries,
    updatedAt: new Date().toISOString(),
  };
}
