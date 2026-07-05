import { compactAnalyzerOutputForPreview } from "@/app/lib/previewAnalyzerCompact";
import { yieldToMain } from "@/app/lib/imageCompression";
import {
  resolveCreativePreviewContext,
  type ProgrammaticPreviewTemplate,
} from "@/app/lib/creativePreviewContext";
import type { PreviewEngineOutput } from "@/app/lib/preview-engine/types";
import {
  buildPreviewStudioEntryKey,
  buildPreviewStudioSourceFingerprint,
  readPreviewStudioCacheEntry,
  writePreviewStudioCacheEntry,
  type PreviewStudioCache,
  type PreviewStudioSourceInput,
} from "@/app/lib/previewStudioPersistence";

export type PreviewPrewarmCreative = {
  id: string | number;
  name?: string;
  url: string;
  size: string;
  analyzerOutput?: Record<string, unknown>;
  ctaText?: string;
  headline?: string;
  previewVertical?: string;
  previewTemplate?: ProgrammaticPreviewTemplate;
};

export type PreviewPrewarmInput = PreviewStudioSourceInput & {
  goal: string;
  campaignVertical: string;
  creatives: PreviewPrewarmCreative[];
  devices?: Array<"desktop" | "mobile">;
  previewStudioCache?: PreviewStudioCache | null;
  campaignBrief?: string;
  campaignIntent?: string;
  advertiserName?: string;
  brandName?: string;
  campaignName?: string;
  campaignProductFocus?: string;
};

async function fetchPreviewOutput(
  creative: PreviewPrewarmCreative,
  input: PreviewPrewarmInput,
  templateId: ProgrammaticPreviewTemplate,
  device: "desktop" | "mobile",
  creativeVertical: string,
): Promise<PreviewEngineOutput | null> {
  if (!creative.url || !input.goal || !creativeVertical) return null;

  try {
    const response = await fetch("/api/preview-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vertical: creativeVertical,
        campaignVertical: input.campaignVertical,
        goal: input.goal,
        templateId,
        preferredEnvironment: templateId,
        device,
        creativeSize: creative.size,
        creativeId: String(creative.id ?? ""),
        creativeType: "display",
        analyzerOutput: compactAnalyzerOutputForPreview(creative.analyzerOutput ?? {}),
        ctaText: creative.ctaText,
        headline: creative.headline,
        logoPresent: true,
        riskFlags: [],
        campaignBrief: input.campaignBrief,
        campaignIntent: input.campaignIntent,
        advertiserName: input.advertiserName,
        brandName: input.brandName,
        campaignName: input.campaignName,
        campaignProductFocus: input.campaignProductFocus,
      }),
    });

    if (!response.ok) return null;
    return await response.json() as PreviewEngineOutput;
  } catch (error) {
    console.warn("[previewStudioPrewarm] fetch failed:", error);
    return null;
  }
}

/**
 * Pre-generate preview outputs for each creative using its own vertical + template.
 * Skips entries that are already cached for the current source fingerprint.
 */
export async function prewarmPreviewStudioCache(
  input: PreviewPrewarmInput,
): Promise<PreviewStudioCache | null> {
  if (!input.creatives.length || typeof window === "undefined") return input.previewStudioCache ?? null;

  const sourceFingerprint = buildPreviewStudioSourceFingerprint(input);
  let cache = input.previewStudioCache?.sourceFingerprint === sourceFingerprint
    ? { ...input.previewStudioCache, entries: { ...input.previewStudioCache.entries } }
    : { entries: {}, sourceFingerprint, updatedAt: new Date().toISOString() };

  const devices = input.devices?.length ? input.devices : (["desktop"] as const);

  for (const creative of input.creatives) {
    const context = resolveCreativePreviewContext(
      creative.analyzerOutput,
      input.campaignVertical,
    );
    const templateId = creative.previewTemplate || context.templateId;
    const creativeVertical = creative.previewVertical || context.creativeVertical;

    for (const device of devices) {
      const entryKey = buildPreviewStudioEntryKey({
        templateId,
        device,
        creativeId: String(creative.id ?? ""),
        creativeSize: creative.size,
        goal: input.goal,
        creativeVertical,
      });

      if (readPreviewStudioCacheEntry(cache, sourceFingerprint, entryKey)) {
        continue;
      }

      const output = await fetchPreviewOutput(creative, input, templateId, device, creativeVertical);
      if (!output) continue;

      cache = writePreviewStudioCacheEntry(cache, sourceFingerprint, entryKey, output);
      await yieldToMain();
    }
  }

  return cache;
}

export function countMissingPreviewEntries(
  input: PreviewPrewarmInput,
): number {
  const sourceFingerprint = buildPreviewStudioSourceFingerprint(input);
  const cache = input.previewStudioCache;
  const devices = input.devices?.length ? input.devices : (["desktop"] as const);
  let missing = 0;

  input.creatives.forEach((creative) => {
    const context = resolveCreativePreviewContext(creative.analyzerOutput, input.campaignVertical);
    const templateId = creative.previewTemplate || context.templateId;
    const creativeVertical = creative.previewVertical || context.creativeVertical;

    devices.forEach((device) => {
      const entryKey = buildPreviewStudioEntryKey({
        templateId,
        device,
        creativeId: String(creative.id ?? ""),
        creativeSize: creative.size,
        goal: input.goal,
        creativeVertical,
      });
      if (!readPreviewStudioCacheEntry(cache, sourceFingerprint, entryKey)) {
        missing += 1;
      }
    });
  });

  return missing;
}
