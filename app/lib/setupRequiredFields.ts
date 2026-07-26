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

export function isSetupComplete(context: SetupFieldContext): boolean {
  return getMissingSetupFields(context).length === 0;
}

/** Soft prompts on Step 2 — improve readiness but do not block upload flow. */
export function getRecommendedCampaignDetailFields(context: SetupFieldContext): SetupMissingField[] {
  const recommended: SetupMissingField[] = [];
  const adapter = getPlatformAdapter(context.platform);

  if (!context.campaignName.trim()) {
    recommended.push({
      key: "campaignName",
      label: "Campaign name",
      prompt: "Add a name so reports and exports are easy to identify.",
      inputType: "text",
      placeholder: "e.g. Q2 Brand Awareness",
      required: false,
    });
  }

  if (!context.campaignBrief.trim()) {
    recommended.push({
      key: "campaignBrief",
      label: "Campaign brief",
      prompt: "A brief improves readiness scoring, alignment checks, and analysis quality.",
      inputType: "textarea",
      placeholder: "Describe goals, offer, audience, and requirements.",
      required: false,
    });
  }

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
