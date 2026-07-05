import type { UtmParameterKey } from "@/app/lib/utmManagement";
import type { ValidationContextGap } from "@/app/components/preview-tool/ValidationContextPanel";

type BuildValidationContextGapsInput = {
  isProgrammatic: boolean;
  isProgrammaticUrlUtmFlow: boolean;
  platform: string | null;
  campaignName: string;
  campaignBrief: string;
  landingUrl: string;
  destinationUrl: string;
  utmParameters: Record<UtmParameterKey, string>;
  activeCampaignId: string;
  needsOrchestratorCampaignId: boolean;
};

export function buildValidationContextGaps(input: BuildValidationContextGapsInput): ValidationContextGap[] {
  const gaps: ValidationContextGap[] = [];

  if (!input.campaignName.trim()) {
    gaps.push({
      id: "campaign_name",
      label: "Campaign name",
      severity: input.isProgrammatic ? "required" : "recommended",
    });
  }

  if (!input.campaignBrief.trim()) {
    gaps.push({
      id: "campaign_brief",
      label: "Campaign brief",
      severity: "recommended",
    });
  }

  if (input.needsOrchestratorCampaignId && !input.activeCampaignId.trim()) {
    gaps.push({
      id: "campaign_id",
      label: "Campaign ID",
      severity: "required",
    });
  }

  const landingRequired = input.platform !== "meta_ads";
  const urlToCheck = input.isProgrammaticUrlUtmFlow || input.isProgrammatic
    ? input.destinationUrl
    : input.landingUrl;

  if (landingRequired && !urlToCheck.trim()) {
    gaps.push({
      id: "landing_url",
      label: input.isProgrammaticUrlUtmFlow ? "Destination URL" : "Landing page URL",
      severity: input.isProgrammaticUrlUtmFlow ? "required" : "recommended",
    });
  }

  if (input.isProgrammaticUrlUtmFlow || urlToCheck.trim()) {
    const requiredUtms: Array<{ key: UtmParameterKey; label: string }> = [
      { key: "utm_source", label: "UTM source" },
      { key: "utm_medium", label: "UTM medium" },
      { key: "utm_campaign", label: "UTM campaign" },
    ];
    for (const utm of requiredUtms) {
      if (!String(input.utmParameters[utm.key] || "").trim()) {
        gaps.push({
          id: utm.key,
          label: utm.label,
          severity: input.isProgrammaticUrlUtmFlow ? "required" : "recommended",
        });
      }
    }
  }

  return gaps;
}

export function hasBlockingValidationContextGaps(gaps: ValidationContextGap[]): boolean {
  return gaps.some((gap) => gap.severity === "required");
}
