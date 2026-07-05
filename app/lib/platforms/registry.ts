import type { AnalyzerPlatform, PlatformWorkflowAdapter } from "@/app/lib/platforms/types";
import { googleAdsAdapter } from "@/app/lib/platforms/googleAdsAdapter";
import { metaAdsAdapter } from "@/app/lib/platforms/metaAdsAdapter";
import { programmaticAdapter } from "@/app/lib/platforms/programmaticAdapter";
import { PROGRAMMATIC_OBJECTIVES, GOOGLE_OBJECTIVES, META_OBJECTIVES } from "@/app/lib/campaignObjectives";

const ADAPTERS: Record<AnalyzerPlatform, PlatformWorkflowAdapter> = {
  google_ads: googleAdsAdapter,
  meta_ads: metaAdsAdapter,
  programmatic: programmaticAdapter,
};

export function getPlatformAdapter(platform: string | null | undefined): PlatformWorkflowAdapter {
  if (platform === "google_ads") return googleAdsAdapter;
  if (platform === "meta_ads") return metaAdsAdapter;
  return programmaticAdapter;
}

export function getAllPlatformAdapters(): PlatformWorkflowAdapter[] {
  return [googleAdsAdapter, metaAdsAdapter, programmaticAdapter];
}

export function getPlatformObjectives(platform: string | null | undefined) {
  if (platform === "google_ads") return GOOGLE_OBJECTIVES;
  if (platform === "meta_ads") return META_OBJECTIVES;
  return PROGRAMMATIC_OBJECTIVES;
}

export { googleAdsAdapter, metaAdsAdapter, programmaticAdapter, ADAPTERS };
