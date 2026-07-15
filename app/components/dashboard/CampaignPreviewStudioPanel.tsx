"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, MonitorPlay } from "lucide-react";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { DashboardPreviewContextCache } from "@/app/lib/dashboardCampaignCache";
import type { PreviewStudioCache } from "@/app/lib/previewStudioPersistence";
import {
  creativesWithPersistedPreviews,
  getCachedDashboardPreviewContext,
  readDashboardPreviewCache,
  snapshotCreativesReadyForPreview,
} from "@/app/lib/dashboardCampaignCache";
import { findDashboardCampaignSnapshot } from "@/app/lib/dashboardCampaignContext";
import {
  hydrateCreativesList,
  setCreativeStorageScope,
} from "@/app/lib/creativeAssetStore";
import { getCreativeValidationFingerprint } from "@/app/lib/urlValidationClient";
import {
  loadPreviewStudioCacheFromStorage,
  mergePreviewStudioCaches,
  savePreviewStudioCacheToStorage,
  setPreviewStudioStorageScope,
} from "@/app/lib/previewStudioStorage";
import { patchProgrammaticCampaignFields } from "@/app/lib/programmaticCampaignStore";
import {
  resolveCampaignIntentForBrief,
} from "@/app/lib/campaignBriefValidation";

const PreviewStudio = dynamic(() => import("@/app/components/PreviewStudio"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16 text-sm text-white/45">
      <Loader2 size={22} className="mr-2 animate-spin" />
      Loading Preview Studio…
    </div>
  ),
}) as ComponentType<{
  platform: string;
  creatives?: Record<string, unknown>[];
  sourceCreatives?: Record<string, unknown>[];
  brandName: string;
  keyMessage: string;
  vertical: string;
  goal: string;
  targetAudience?: string;
  tone?: string;
  imageUrls?: string[];
  campaignBrief?: string;
  campaignIntent?: string;
  campaignIntentFingerprint?: string;
  advertiserName?: string;
  campaignName?: string;
  campaignProductFocus?: string;
  advertiserId?: string;
  campaignId?: string;
  creativeFingerprint?: string;
  previewStudioCache?: PreviewStudioCache | null;
  onPreviewCacheUpdate?: (cache: PreviewStudioCache) => void;
  cacheOnly?: boolean;
}>;

type CampaignPreviewStudioPanelProps = {
  campaign: AdvertiserCampaign;
  ownerId: string;
  advertiserName: string;
};

export default function CampaignPreviewStudioPanel({
  campaign,
  ownerId,
  advertiserName,
}: CampaignPreviewStudioPanelProps) {
  const [hydratedPreview, setHydratedPreview] = useState<DashboardPreviewContextCache | null>(null);
  const [previewStudioCache, setPreviewStudioCache] = useState<PreviewStudioCache | null>(null);
  const [cacheReady, setCacheReady] = useState(false);
  const [hydrating, setHydrating] = useState(false);

  const snapshot = useMemo(
    () => findDashboardCampaignSnapshot(campaign.id, ownerId),
    [campaign.id, ownerId],
  );

  const storedPreview = useMemo(() => {
    if (!snapshot) return null;

    const cached = readDashboardPreviewCache(snapshot);
    if (cached) return cached;

    const creatives = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
    if (!snapshotCreativesReadyForPreview(creatives)) return null;

    return getCachedDashboardPreviewContext(
      snapshot,
      creativesWithPersistedPreviews(creatives),
      campaign,
    );
  }, [snapshot, campaign]);

  const previewContext = hydratedPreview || storedPreview;

  useEffect(() => {
    let active = true;

    if (!snapshot?.id || !ownerId) {
      setPreviewStudioCache(snapshot?.previewStudioCache || null);
      setCacheReady(true);
      return undefined;
    }

    setPreviewStudioStorageScope(ownerId);
    const initialCache = mergePreviewStudioCaches(snapshot.previewStudioCache, null);
    setPreviewStudioCache(initialCache);
    setCacheReady(false);

    void loadPreviewStudioCacheFromStorage(snapshot.id).then((storedCache) => {
      if (!active) return;
      setPreviewStudioCache(
        mergePreviewStudioCaches(snapshot.previewStudioCache, storedCache) || snapshot.previewStudioCache || null,
      );
      setCacheReady(true);
    });

    return () => {
      active = false;
    };
  }, [snapshot?.id, snapshot?.previewStudioCache, ownerId]);

  useEffect(() => {
    let active = true;

    if (!snapshot || !ownerId || storedPreview) {
      setHydrating(false);
      return undefined;
    }

    const creatives = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
    if (!creatives.length) {
      setHydrating(false);
      return undefined;
    }

    setHydrating(true);
    setCreativeStorageScope(ownerId);

    void hydrateCreativesList(
      creatives.map((item) => ({ ...item, hasStoredAssets: true })),
      3,
    ).then((hydrated) => {
      if (!active) return;

      const resolved = getCachedDashboardPreviewContext(
        snapshot,
        hydrated.filter((item) => item?.valid !== false),
        campaign,
      );
      setHydratedPreview(resolved);
      setHydrating(false);
    });

    return () => {
      active = false;
    };
  }, [snapshot, ownerId, campaign, storedPreview]);

  useEffect(() => {
    setHydratedPreview(null);
    setHydrating(false);
  }, [campaign.id, ownerId]);

  const handlePreviewCacheUpdate = useCallback((cache: PreviewStudioCache) => {
    if (!snapshot?.id || !ownerId || !cache) return;
    setPreviewStudioCache(cache);
    setPreviewStudioStorageScope(ownerId);
    void savePreviewStudioCacheToStorage(snapshot.id, cache);
    patchProgrammaticCampaignFields(snapshot.id, ownerId, {
      previewStudioCache: cache,
    });
  }, [snapshot?.id, ownerId]);

  const campaignIntent = useMemo(() => {
    if (snapshot?.campaignIntent?.trim()) return snapshot.campaignIntent.trim();
    const resolved = resolveCampaignIntentForBrief(snapshot?.campaignBrief || campaign.campaignBrief || "", {
      campaignGoal: snapshot?.campaignGoal || campaign.campaignGoal,
      vertical: snapshot?.vertical || campaign.vertical,
      storedIntent: snapshot?.campaignIntent,
      storedFingerprint: snapshot?.campaignIntentFingerprint,
    });
    return resolved.intent || "";
  }, [snapshot, campaign]);

  const creativeFingerprint = useMemo(
    () => getCreativeValidationFingerprint(snapshot?.creatives || []),
    [snapshot?.creatives],
  );

  const loading = !previewContext && hydrating;
  const waitingForCache = Boolean(snapshot?.id) && !cacheReady;

  if (loading || waitingForCache) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/20 py-16 text-sm text-white/45">
        <Loader2 size={22} className="mr-2 animate-spin" />
        Loading saved previews…
      </div>
    );
  }

  if (!previewContext?.sourceCreatives.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
        <MonitorPlay size={28} className="mx-auto text-white/25" />
        <p className="mt-3 text-sm font-semibold text-white">No preview assets for this campaign</p>
        <p className="mt-1 text-xs text-white/45">
          Upload and validate creatives for {advertiserName} · {campaign.name} in Campaign Intelligence Studio.
        </p>
        <Link
          href="/preview-tool?step=preview-studio"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20"
        >
          Open Preview Studio
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b12] p-4 md:p-6">
      <PreviewStudio
        platform={previewContext.platform}
        creatives={previewContext.previewEngineCreatives}
        sourceCreatives={previewContext.sourceCreatives}
        vertical={previewContext.vertical}
        goal={previewContext.goal}
        brandName={previewContext.brandName}
        targetAudience={previewContext.targetAudience}
        tone={previewContext.tone}
        keyMessage={previewContext.keyMessage}
        imageUrls={previewContext.imageUrls}
        campaignBrief={snapshot?.campaignBrief || campaign.campaignBrief || ""}
        campaignIntent={campaignIntent}
        campaignIntentFingerprint={snapshot?.campaignIntentFingerprint || ""}
        advertiserName={advertiserName}
        campaignName={snapshot?.campaignName || campaign.name}
        campaignProductFocus={snapshot?.campaignProductFocus || ""}
        advertiserId={snapshot?.advertiserId || ""}
        campaignId={snapshot?.id || campaign.id}
        creativeFingerprint={creativeFingerprint}
        previewStudioCache={previewStudioCache}
        onPreviewCacheUpdate={handlePreviewCacheUpdate}
        cacheOnly
      />
    </div>
  );
}
