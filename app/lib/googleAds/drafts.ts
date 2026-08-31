export function withGoogleAdsDrafts(query: string): string {
  const trimmed = String(query || "").trim();
  if (!trimmed) return trimmed;
  if (/PARAMETERS\s+include_drafts\s*=/i.test(trimmed)) return trimmed;
  if (!/\bFROM\s+(campaign|ad_group|ad_group_ad|ad_group_ad_asset_view|asset_group|asset_group_asset)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} PARAMETERS include_drafts=true`;
}

export function isGoogleAdsDraftCampaign(campaign: {
  status?: string;
  sourceType?: string;
  experimentType?: string;
  primaryStatus?: string;
}): boolean {
  const source = String(campaign.sourceType || "").toLowerCase();
  const status = String(campaign.status || "").toUpperCase();
  const experimentType = String(campaign.experimentType || "").toUpperCase();
  const primaryStatus = String(campaign.primaryStatus || "").toUpperCase();
  return source === "draft"
    || status === "DRAFT"
    || experimentType === "DRAFT"
    || primaryStatus === "CAMPAIGN_DRAFT";
}
