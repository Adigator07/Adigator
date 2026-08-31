import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import type {
  MetaAdsCampaign,
  MetaAdsCampaignImportDetails,
  MetaAdsImportedAdSet,
} from "@/app/lib/metaAds/client";
import { mapMetaAdsImportedCreativesToTool } from "@/app/lib/metaAds/importedCreatives";
import {
  buildVerticalInferenceCorpus,
  inferVerticalFromGoogleCampaignSignals,
} from "@/app/lib/googleAds/inferVertical";
import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import { MAX_PROGRAMMATIC_AD_GROUPS } from "@/app/lib/programmaticWorkflow";

export function mapMetaObjectiveToAdigator(objective?: string): string {
  switch (String(objective || "").toUpperCase()) {
    case "OUTCOME_TRAFFIC":
    case "LINK_CLICKS":
    case "TRAFFIC":
      return "meta_traffic";
    case "OUTCOME_ENGAGEMENT":
    case "POST_ENGAGEMENT":
    case "VIDEO_VIEWS":
    case "ENGAGEMENT":
      return "meta_engagement";
    case "OUTCOME_LEADS":
    case "LEAD_GENERATION":
    case "LEADS":
      return "meta_leads";
    case "OUTCOME_APP_PROMOTION":
    case "APP_INSTALLS":
      return "meta_app_promotion";
    case "OUTCOME_SALES":
    case "CONVERSIONS":
    case "CATALOG_SALES":
      return "meta_sales";
    case "OUTCOME_AWARENESS":
    case "BRAND_AWARENESS":
    case "REACH":
    default:
      return "meta_awareness";
  }
}

function uniqueCopyLines(values: Array<string | undefined | null> = []): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const value of values) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(text);
  }
  return lines;
}

export function buildMetaAdsCampaignBrief(details: MetaAdsCampaignImportDetails = {}): string {
  const descriptions = uniqueCopyLines([
    ...(details.adCopyDescriptions || []),
    ...(details.creatives || []).map((creative) => creative.description),
  ]);
  if (descriptions.length) return descriptions.join("\n\n");
  return uniqueCopyLines([
    ...(details.adCopyHeadlines || []),
    ...(details.creatives || []).map((creative) => creative.headline),
  ]).join("\n");
}

export function inferProductFocusFromMetaCampaignName(campaignName: string): string {
  return campaignName
    .replace(/\b(q[1-4]|awareness|traffic|conversion|leads?|campaign|meta|facebook|instagram|ads?)\b/gi, "")
    .replace(/[\-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function mapMetaAdSetsToProgrammatic(
  adSets: MetaAdsImportedAdSet[] = [],
  objective: string,
): ProgrammaticAdGroup[] {
  return adSets
    .filter((adSet) => String(adSet.id || "").trim() || String(adSet.name || "").trim())
    .slice(0, MAX_PROGRAMMATIC_AD_GROUPS)
    .map((adSet, index) => ({
      id: String(adSet.id || "").trim() || `meta-adset-${index + 1}`,
      name: String(adSet.name || "").trim(),
      objective,
    }));
}

export function buildMetaAdsImportedSnapshot(
  campaign: MetaAdsCampaign,
  userId: string,
  adAccountId: string,
  details: MetaAdsCampaignImportDetails = {},
): CampaignSnapshot {
  const timestamp = new Date().toISOString();
  const campaignGoal = mapMetaObjectiveToAdigator(campaign.objective);
  const mappedAdSets = mapMetaAdSetsToProgrammatic(details.adSets || [], campaignGoal);
  const importedCreatives = mapMetaAdsImportedCreativesToTool(
    (details.creatives || []) as unknown as Record<string, unknown>[],
    mappedAdSets,
  );
  const programmaticAdGroups = mappedAdSets.length
    ? mappedAdSets
    : importedCreatives.length
      ? [{ id: "meta-ads-imported", name: "Imported ad set", objective: campaignGoal }]
      : [];
  const fallbackGroupId = programmaticAdGroups[0]?.id || "meta-ads-imported";
  const linkedCreatives = importedCreatives.map((creative) => {
    const adGroupId = String(creative.adGroupId || "").trim() || fallbackGroupId;
    const matched = programmaticAdGroups.find((group) => String(group.id) === adGroupId) || programmaticAdGroups[0];
    return {
      ...creative,
      adGroupId,
      adGroupName: matched?.name || creative.adGroupName,
      adGroupObjective: matched?.objective || creative.adGroupObjective,
    };
  });
  const landingUrl = details.landingUrl
    || details.adSets?.find((adSet) => adSet.landingUrl)?.landingUrl
    || details.creatives?.find((creative) => creative.landingUrl)?.landingUrl
    || "";
  const campaignBrief = buildMetaAdsCampaignBrief(details);
  const inferredProductFocus = inferProductFocusFromMetaCampaignName(campaign.name);
  const inferredVertical = inferVerticalFromGoogleCampaignSignals(
    ...buildVerticalInferenceCorpus({
      campaignName: campaign.name,
      landingUrl,
      campaignBrief,
      adGroupNames: programmaticAdGroups.map((group) => group.name),
      headlines: [
        ...(details.adCopyHeadlines || []),
        ...(details.creatives || []).map((creative) => creative.headline),
      ],
      descriptions: [
        ...(details.adCopyDescriptions || []),
        ...(details.creatives || []).map((creative) => creative.description),
      ],
      verticalSignals: details.verticalSignals,
      productFocus: [inferredProductFocus],
    }),
  );
  const stableId = String(campaign.id || "").trim() || `meta-${adAccountId}-${campaign.name}`.toLowerCase().replace(/\s+/g, "-");

  return {
    id: stableId,
    platform: "meta_ads",
    ownerId: userId,
    campaignName: campaign.name,
    campaignBrief,
    vertical: inferredVertical,
    landingUrl,
    campaignGoal,
    campaignAudienceStage: "cold",
    campaignProductFocus: inferredProductFocus,
    campaignTaskType: "campaign_setup",
    creatives: linkedCreatives,
    analysisResult: null,
    urlValidation: null,
    viewMode: "multiple",
    showSlotLabels: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    programmaticAdGroupCount: programmaticAdGroups.length || "",
    programmaticAdGroups,
    selectedProgrammaticAdGroupIds: programmaticAdGroups.map((group) => group.id),
    applyProgrammaticAdGroupsToAll: true,
    metaCampaignType: "manual",
    metaAdSetCount: programmaticAdGroups.length || details.adSetCount || "",
    metaAdsAdAccountId: adAccountId,
    metaAdsCampaignStatus: campaign.status,
    metaAdsObjective: campaign.objective || "",
    metaAdsCampaignSource: campaign.sourceType || "published",
    importSource: "meta_ads",
  };
}
