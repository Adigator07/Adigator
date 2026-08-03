import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import type { AnalyzerPlatform, CampaignTaskTypeId } from "@/app/lib/platforms/types";
import type { GoogleCampaignType } from "@/app/lib/googleCampaignTypes";

/**
 * Unified campaign snapshot — shared across Google Ads, Meta Ads, and Programmatic.
 * Programmatic-specific fields remain optional for backward compatibility.
 */
export type CampaignSnapshot = {
  id: string;
  platform: AnalyzerPlatform;
  ownerId: string;
  campaignName: string;
  campaignBrief: string;
  vertical: string;
  landingUrl: string;
  campaignGoal: string;
  campaignAudienceStage: string;
  campaignProductFocus: string;
  /** Platform-native task type (shared ids across platforms) */
  campaignTaskType: CampaignTaskTypeId | string;
  creatives: Record<string, unknown>[];
  analysisResult: Record<string, unknown>[] | null;
  urlValidation: Record<string, unknown> | null;
  campaignIntent?: string;
  campaignIntentFingerprint?: string;
  campaignAlignmentReport?: import("@/app/lib/campaignAlignmentValidation").CampaignAlignmentReport | null;
  dashboardOverviewCache?: import("@/app/lib/dashboardCampaignCache").DashboardOverviewCache | null;
  dashboardPreviewCache?: import("@/app/lib/dashboardCampaignCache").DashboardPreviewCache | null;
  previewStudioCache?: import("@/app/lib/previewStudioPersistence").PreviewStudioCache | null;
  campaignAssistantContext?: import("@/app/lib/campaignAssistant/types").CampaignAssistantClarification | null;
  destinationUrl?: string;
  utmParameters?: Record<string, string>;
  viewMode: "single" | "multiple";
  showSlotLabels: boolean;
  advertiserId?: string;
  advertiserName?: string;
  createdAt: string;
  updatedAt: string;
  /** Programmatic-only */
  programmaticAdGroupCount?: number | "";
  programmaticAdGroups?: ProgrammaticAdGroup[];
  selectedProgrammaticAdGroupIds?: string[];
  applyProgrammaticAdGroupsToAll?: boolean;
  /** Google Ads extensions */
  googleCampaignType?: GoogleCampaignType | "";
  googleAdGroupCount?: number | "";
  googleAdsCustomerId?: string;
  googleAdsCampaignStatus?: string;
  googleAdsChannelType?: string;
  googleAdsChannelSummary?: string;
  googleAdsCampaignSource?: "published" | "draft";
  googleAdsDraftId?: string;
  googleAdsBudgetAmountMicros?: number;
  googleAdsStartDate?: string;
  googleAdsEndDate?: string;
  importSource?: "google_ads";
  /** Meta Ads extensions */
  metaCampaignType?: "advantage_plus" | "manual" | "";
  metaAdSetCount?: number | "";
  /** Last selected preview template/placement for Step 4 export context */
  lastPreviewTemplateId?: string;
  lastPreviewDevice?: "desktop" | "mobile";
};

export type CampaignIdOption = {
  id: string;
  campaignName: string;
  platform?: AnalyzerPlatform;
  updatedAt?: string;
};

export function generateCampaignId(platform: AnalyzerPlatform = "programmatic"): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  const prefix =
    platform === "google_ads"
      ? "GGL"
      : platform === "meta_ads"
        ? "META"
        : "PGM";
  return `${prefix}-${stamp}-${random}`.toUpperCase();
}

export function resolveCampaignId(input: {
  platform: AnalyzerPlatform;
  taskType: string;
  activeCampaignId?: string | null;
  lookupCampaignId?: string | null;
  loadedCampaignId?: string | null;
  referenceCampaignId?: string | null;
}): string {
  const existing = input.activeCampaignId
    || input.loadedCampaignId
    || input.lookupCampaignId?.trim()
    || input.referenceCampaignId
    || "";
  if (existing) return existing;
  if (input.taskType && input.taskType !== "campaign_setup") return "";
  return generateCampaignId(input.platform);
}
