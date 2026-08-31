import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import { getPlatformAdapter } from "@/app/lib/platforms/registry";
import { isCampaignSetupTask } from "@/app/lib/platforms/sharedTaskTypes";

export type SetupFieldKey =
  | "platform"
  | "advertiserName"
  | "campaignVertical"
  | "campaignGoal"
  | "googleCampaignType"
  | "programmaticTaskType"
  | "programmaticAdGroupCount"
  | "adGroupConfig"
  | "adGroupSelection"
  | "campaignBrief"
  | "campaignName"
  | "landingUrl"
  | "adType"
  | "lookupCampaign"
  | "creativeAdditionMode"
  | "renewalReference"
  | "urlUtmReference";

export type SetupMissingField = {
  key: SetupFieldKey;
  label: string;
  prompt: string;
  inputType: "text" | "textarea" | "url" | "select" | "info";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  scrollTargetId?: string;
  required?: boolean;
};

export type SetupFieldContext = {
  platform: string | null;
  advertiserName: string;
  campaignVertical: string | null;
  campaignGoal: string | null;
  campaignProductFocus?: string;
  googleCampaignType?: string;
  campaignBrief: string;
  campaignName: string;
  adType?: "display" | "video" | "" | null;
  landingUrl: string;
  /** Shared task type field — used by all platforms (stored as programmaticTaskType for backward compat) */
  programmaticTaskType: string;
  programmaticAdGroupCount: number | "";
  programmaticAdGroups: ProgrammaticAdGroup[];
  selectedProgrammaticAdGroupIds: string[];
  applyProgrammaticAdGroupsToAll: boolean;
  loadedCampaignSnapshot: { id?: string } | null;
  creativeAdditionMode: string;
  renewalReferenceSnapshot: { id?: string } | null;
  urlUtmReferenceSnapshot: { id?: string } | null;
  lookupCampaignId: string;
  renewalUsesAdGroups: boolean;
};

export function getMissingSetupFields(context: SetupFieldContext): SetupMissingField[] {
  const missing: SetupMissingField[] = [];
  const adapter = getPlatformAdapter(context.platform);

  if (!context.platform) {
    missing.push({
      key: "platform",
      label: "Advertising platform",
      prompt: "Choose where this campaign will run (Google Ads, Meta, or Programmatic).",
      inputType: "info",
      scrollTargetId: "setup-platform-section",
    });
  }

  if (!context.advertiserName.trim()) {
    missing.push({
      key: "advertiserName",
      label: "Advertiser name",
      prompt: "Enter the brand or client this campaign belongs to.",
      inputType: "text",
      placeholder: "e.g. Acme Travel",
      scrollTargetId: "campaign-advertiser-name",
    });
  }

  missing.push(...adapter.getMissingSetupFields(context));

  if (!context.campaignVertical && context.platform) {
    missing.push({
      key: "campaignVertical",
      label: "Industry vertical",
      prompt: "Select the industry vertical for this campaign.",
      inputType: "select",
      scrollTargetId: "campaign-vertical",
    });
  }

  return missing;
}

const REQUIRED_VERTICAL_IDS = new Set([
  "healthcare",
  "technology",
  "automotive",
  "news_media",
  "sports",
  "fitness",
  "finance",
  "luxury",
  "travel",
  "hotels",
  "food",
  "banking",
  "real_estate",
  "education",
  "gaming",
  "entertainment",
  "ecommerce",
  "fashion",
]);

/** Blocking Campaign Details fields (Step 2) — name, brief, ad type, and vertical. */
export function getMissingCampaignDetailFields(context: SetupFieldContext): SetupMissingField[] {
  const missing: SetupMissingField[] = [];

  if (!context.campaignName.trim()) {
    missing.push({
      key: "campaignName",
      label: "Campaign name",
      prompt: "Enter the campaign name.",
      inputType: "text",
      placeholder: "e.g. Q2 Brand Awareness",
      scrollTargetId: "campaign-name",
      required: true,
    });
  }

  if (!context.campaignBrief.trim()) {
    missing.push({
      key: "campaignBrief",
      label: "Campaign brief",
      prompt: "Add the campaign brief before continuing.",
      inputType: "textarea",
      placeholder: "Describe goals, offer, audience, and requirements.",
      scrollTargetId: "campaign-brief",
      required: true,
    });
  }

  if (context.adType !== "display" && context.adType !== "video") {
    missing.push({
      key: "adType",
      label: "Ad type",
      prompt: "Select Display Ads or Video Ads.",
      inputType: "select",
      options: [
        { value: "display", label: "Display Ads" },
        { value: "video", label: "Video Ads" },
      ],
      scrollTargetId: "campaign-ad-type",
      required: true,
    });
  }

  if (!REQUIRED_VERTICAL_IDS.has(String(context.campaignVertical || ""))) {
    missing.push({
      key: "campaignVertical",
      label: "Vertical",
      prompt: "Select the industry vertical for this campaign.",
      inputType: "select",
      scrollTargetId: "programmatic-campaign-vertical",
      required: true,
    });
  }

  return missing;
}

export function isSetupComplete(context: SetupFieldContext): boolean {
  return getMissingSetupFields(context).length === 0;
}

/** Soft prompts on Step 2 — improve readiness but do not block upload flow. */
export function getRecommendedCampaignDetailFields(context: SetupFieldContext): SetupMissingField[] {
  const recommended: SetupMissingField[] = [];
  const adapter = getPlatformAdapter(context.platform);

  if (adapter.validationRules.landingUrlRequired && !context.landingUrl.trim() && context.platform) {
    recommended.push({
      key: "landingUrl",
      label: "Landing page URL",
      prompt: `Required for ${adapter.label} URL validation.`,
      inputType: "url",
      placeholder: "https://www.example.com/landing",
      required: false,
    });
  }

  return recommended;
}

export { isCampaignSetupTask };
