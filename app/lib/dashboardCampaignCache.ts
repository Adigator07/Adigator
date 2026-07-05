import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import {
  getProgrammaticCampaignById,
  patchProgrammaticCampaignFields,
} from "@/app/lib/programmaticCampaignStore";
import {
  buildDashboardPreviewContext,
  computeDashboardCampaignOverview,
  labelDashboardGoal,
  labelDashboardVertical,
} from "@/app/lib/dashboardCampaignContext";

export type DashboardOverviewCache = {
  overview: Record<string, unknown>;
  goalText: string;
  verticalText: string;
  platform: string;
  campaignBrief: string;
  generatedAt: string;
  sourceFingerprint: string;
};

export type DashboardPreviewContextCache = {
  platform: string;
  vertical: string;
  goal: string;
  previewEngineCreatives: Record<string, unknown>[];
  sourceCreatives: Record<string, unknown>[];
  brandName: string;
  targetAudience: string;
  tone: string;
  keyMessage: string;
  imageUrls: string[];
};

export type DashboardPreviewCache = {
  previewContext: DashboardPreviewContextCache;
  generatedAt: string;
  sourceFingerprint: string;
};

export function buildDashboardCacheFingerprint(
  snapshot: ProgrammaticCampaignSnapshot,
): string {
  const creativeIds = (snapshot.creatives || [])
    .map((item) => String(item.id || ""))
    .sort()
    .join(",");
  const analysisCount = Array.isArray(snapshot.analysisResult) ? snapshot.analysisResult.length : 0;
  const previewFlags = (snapshot.creatives || [])
    .map((item) => (item.previewDataUrl || item.url ? "1" : "0"))
    .join("");

  return [
    analysisCount,
    creativeIds,
    previewFlags,
    snapshot.campaignBrief || "",
    snapshot.campaignIntentFingerprint || snapshot.campaignIntent || "",
    snapshot.campaignGoal || "",
    snapshot.vertical || "",
    snapshot.campaignProductFocus || "",
    snapshot.landingUrl || "",
    String(snapshot.urlValidation?.checked_at || ""),
    snapshot.campaignAlignmentReport?.sourceFingerprint || "",
  ].join("|");
}

function isOverviewCacheValid(
  snapshot: ProgrammaticCampaignSnapshot,
  fingerprint: string,
): snapshot is ProgrammaticCampaignSnapshot & { dashboardOverviewCache: DashboardOverviewCache } {
  const cache = snapshot.dashboardOverviewCache;
  return Boolean(
    cache
    && cache.sourceFingerprint === fingerprint
    && cache.overview
    && typeof cache.overview === "object",
  );
}

function isPreviewCacheValid(
  snapshot: ProgrammaticCampaignSnapshot,
  fingerprint: string,
): snapshot is ProgrammaticCampaignSnapshot & { dashboardPreviewCache: DashboardPreviewCache } {
  const cache = snapshot.dashboardPreviewCache;
  return Boolean(
    cache
    && cache.sourceFingerprint === fingerprint
    && cache.previewContext?.sourceCreatives?.length,
  );
}

export function readDashboardOverviewCache(
  snapshot: ProgrammaticCampaignSnapshot | null,
): DashboardOverviewCache | null {
  if (!snapshot) return null;
  const fingerprint = buildDashboardCacheFingerprint(snapshot);
  if (isOverviewCacheValid(snapshot, fingerprint)) {
    return snapshot.dashboardOverviewCache;
  }
  return null;
}

export function readDashboardPreviewCache(
  snapshot: ProgrammaticCampaignSnapshot | null,
): DashboardPreviewContextCache | null {
  if (!snapshot) return null;
  const fingerprint = buildDashboardCacheFingerprint(snapshot);
  if (isPreviewCacheValid(snapshot, fingerprint)) {
    return snapshot.dashboardPreviewCache.previewContext;
  }
  return null;
}

export function getCachedDashboardOverview(
  snapshot: ProgrammaticCampaignSnapshot | null,
  campaign: AdvertiserCampaign,
): DashboardOverviewCache | null {
  if (!snapshot) return null;

  const cached = readDashboardOverviewCache(snapshot);
  if (cached) return cached;

  const fingerprint = buildDashboardCacheFingerprint(snapshot);

  const overview = computeDashboardCampaignOverview(snapshot, campaign);
  if (!overview) return null;

  const cache: DashboardOverviewCache = {
    overview: overview as Record<string, unknown>,
    goalText: labelDashboardGoal(snapshot.campaignGoal || campaign.campaignGoal),
    verticalText: labelDashboardVertical(snapshot.vertical || campaign.vertical),
    platform: campaign.platform || "programmatic",
    campaignBrief: snapshot.campaignBrief || campaign.campaignBrief || "",
    generatedAt: new Date().toISOString(),
    sourceFingerprint: fingerprint,
  };

  persistDashboardOverviewCache(snapshot.id, snapshot.ownerId, cache);
  return cache;
}

export function getCachedDashboardPreviewContext(
  snapshot: ProgrammaticCampaignSnapshot | null,
  hydratedCreatives: Record<string, unknown>[],
  campaign: AdvertiserCampaign,
): DashboardPreviewContextCache | null {
  if (!snapshot) return null;

  const cached = readDashboardPreviewCache(snapshot);
  if (cached) return cached;

  const fingerprint = buildDashboardCacheFingerprint(snapshot);

  const previewContext = buildDashboardPreviewContext(snapshot, hydratedCreatives, campaign);
  if (!previewContext.sourceCreatives.length) return null;

  const cache: DashboardPreviewCache = {
    previewContext,
    generatedAt: new Date().toISOString(),
    sourceFingerprint: fingerprint,
  };

  persistDashboardPreviewCache(snapshot.id, snapshot.ownerId, cache);
  return previewContext;
}

export function persistDashboardOverviewCache(
  campaignId: string,
  ownerId: string,
  cache: DashboardOverviewCache,
): void {
  if (!campaignId || !ownerId || typeof window === "undefined") return;

  const existing = getProgrammaticCampaignById(campaignId, ownerId);
  if (!existing) return;

  patchProgrammaticCampaignFields(campaignId, ownerId, {
    dashboardOverviewCache: cache,
  });
}

export function persistDashboardPreviewCache(
  campaignId: string,
  ownerId: string,
  cache: DashboardPreviewCache,
): void {
  if (!campaignId || !ownerId || typeof window === "undefined") return;

  const existing = getProgrammaticCampaignById(campaignId, ownerId);
  if (!existing) return;

  patchProgrammaticCampaignFields(campaignId, ownerId, {
    dashboardPreviewCache: cache,
  });
}

/** Creatives from snapshot that already include persisted preview URLs — skip IndexedDB hydration. */
export function creativesWithPersistedPreviews(
  creatives: Record<string, unknown>[],
): Record<string, unknown>[] {
  return creatives
    .filter((item) => item?.valid !== false)
    .map((creative) => {
      const previewDataUrl = typeof creative.previewDataUrl === "string" ? creative.previewDataUrl : "";
      const url = typeof creative.url === "string" ? creative.url : "";
      const resolvedUrl = previewDataUrl || url;
      if (!resolvedUrl) return creative;
      return {
        ...creative,
        url: resolvedUrl,
        hasStoredAssets: true,
      };
    })
    .filter((creative) => Boolean(creative.url || creative.previewDataUrl));
}

export function snapshotCreativesReadyForPreview(
  creatives: Record<string, unknown>[],
): boolean {
  const valid = creatives.filter((item) => item?.valid !== false);
  if (!valid.length) return false;
  return valid.every((creative) => {
    const previewDataUrl = typeof creative.previewDataUrl === "string" ? creative.previewDataUrl : "";
    const url = typeof creative.url === "string" ? creative.url : "";
    return Boolean(previewDataUrl || url);
  });
}

function campaignFromSnapshot(snapshot: ProgrammaticCampaignSnapshot): AdvertiserCampaign {
  return {
    id: snapshot.id,
    name: snapshot.campaignName,
    platform: "programmatic",
    validated: Boolean(snapshot.analysisResult?.length),
    updatedAt: snapshot.updatedAt,
    adGroups: [],
    campaignBrief: snapshot.campaignBrief,
    campaignGoal: snapshot.campaignGoal,
    vertical: snapshot.vertical,
  };
}

/** Pre-compute dashboard caches when a campaign snapshot is saved in Preview Tool. */
export function warmDashboardCampaignCaches(snapshot: ProgrammaticCampaignSnapshot): void {
  if (typeof window === "undefined" || !snapshot.ownerId) return;

  const campaign = campaignFromSnapshot(snapshot);
  getCachedDashboardOverview(snapshot, campaign);

  const creatives = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
  if (!creatives.length) return;

  const readyCreatives = snapshotCreativesReadyForPreview(creatives)
    ? creativesWithPersistedPreviews(creatives)
    : [];

  if (readyCreatives.length) {
    getCachedDashboardPreviewContext(snapshot, readyCreatives, campaign);
  }
}
