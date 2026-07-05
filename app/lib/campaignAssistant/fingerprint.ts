import type { CampaignAssistantClarification } from "@/app/lib/campaignAssistant/types";

export type CampaignAssistantFingerprintInput = {
  advertiserId?: string;
  advertiserName?: string;
  campaignId?: string;
  campaignName?: string;
  campaignBrief?: string;
  campaignGoal?: string;
  campaignVertical?: string;
  campaignProductFocus?: string;
  landingUrl?: string;
  programmaticTaskType?: string;
  creativeFingerprint?: string;
};

export function buildCampaignAssistantFingerprint(
  input: CampaignAssistantFingerprintInput,
): string {
  return [
    input.advertiserId || input.advertiserName || "",
    input.campaignId || input.campaignName || "",
    (input.campaignBrief || "").trim(),
    input.campaignGoal || "",
    input.campaignVertical || "",
    (input.campaignProductFocus || "").trim(),
    (input.landingUrl || "").trim(),
    input.programmaticTaskType || "",
    input.creativeFingerprint || "",
  ].join("|");
}

export function isCampaignAssistantContextValid(
  context: CampaignAssistantClarification | null | undefined,
  fingerprint: string,
): boolean {
  if (!context?.sourceFingerprint || context.sourceFingerprint !== fingerprint) return false;
  return Boolean(context.answers && Object.keys(context.answers).length > 0);
}
