import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import type { GoogleCampaignType } from "@/app/lib/googleCampaignTypes";
import type {
  GoogleAdsCampaign,
  GoogleAdsCampaignImportDetails,
  GoogleAdsImportedAdGroup,
} from "@/app/lib/googleAds/client";
import { mapGoogleAdsImportedCreativesToTool } from "@/app/lib/googleAds/importedCreatives";
import {
  buildVerticalInferenceCorpus,
  inferVerticalFromGoogleCampaignSignals,
} from "@/app/lib/googleAds/inferVertical";
import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import { MAX_PROGRAMMATIC_AD_GROUPS } from "@/app/lib/programmaticWorkflow";

export { inferVerticalFromGoogleCampaignSignals };

export function mapGoogleAdsChannelToCampaignType(
  channelType: string,
  channelSubType = "",
): GoogleCampaignType {
  const channel = String(channelType || "").toUpperCase();
  const subType = String(channelSubType || "").toUpperCase();
  if (channel === "DEMAND_GEN" || channel === "VIDEO") return "demand_gen";
  if (channel === "PERFORMANCE_MAX") return "responsive_display";
  if (channel === "DISPLAY" && /RESPONSIVE|SMART/.test(subType)) return "responsive_display";
  return "display";
}

export function mapGoogleAdsChannelToObjective(channelType: string): string {
  switch (String(channelType || "").toUpperCase()) {
    case "SEARCH":
      return "google_traffic";
    case "DISPLAY":
      return "google_brand_awareness";
    case "VIDEO":
      return "google_video_views";
    case "PERFORMANCE_MAX":
    case "SHOPPING":
      return "google_sales";
    case "DEMAND_GEN":
      return "google_consideration";
    default:
      return "google_brand_awareness";
  }
}

export function mapGoogleAdsGoalToObjective(suggestedGoal: string, channelType = ""): string {
  const goal = String(suggestedGoal || "").trim();
  if (goal.startsWith("google_")) return goal;
  switch (goal.toLowerCase()) {
    case "traffic":
      return "google_traffic";
    case "awareness":
      return "google_brand_awareness";
    case "video_views":
      return "google_video_views";
    case "conversion":
      return "google_sales";
    case "consideration":
      return "google_consideration";
    case "lead_generation":
      return "google_leads";
    default:
      return mapGoogleAdsChannelToObjective(channelType);
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

export function inferVerticalFromGoogleCampaignName(campaignName: string): string {
  return inferVerticalFromGoogleCampaignSignals(campaignName);
}

export function buildGoogleAdsCampaignBrief(
  details: GoogleAdsCampaignImportDetails = {},
): string {
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

export function inferProductFocusFromGoogleCampaignName(campaignName: string): string {
  return campaignName
    .replace(/\b(q[1-4]|awareness|traffic|conversion|leads?|campaign|google ads|display|video|search)\b/gi, "")
    .replace(/[\-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function mapGoogleAdsAdGroupTypeToObjective(type: string, campaignGoal: string): string {
  const groupType = String(type || "").toUpperCase();
  if (groupType.includes("VIDEO")) return "google_video_views";
  if (groupType.includes("SEARCH")) return "google_traffic";
  if (groupType.includes("SHOPPING")) return "google_sales";
  if (groupType.includes("DISPLAY")) return "google_brand_awareness";
  return campaignGoal || "";
}

export function ensureAdGroupsForImportedCreatives(
  adGroups: ProgrammaticAdGroup[] = [],
  creatives: Array<{ adGroupId?: string | null; adGroupName?: string; adGroupObjective?: string }> = [],
  fallbackObjective = "",
): ProgrammaticAdGroup[] {
  const byId = new Map(adGroups.map((group) => [String(group.id), group]));
  for (const creative of creatives) {
    const id = String(creative.adGroupId || "").trim();
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      name: String(creative.adGroupName || "").trim() || `Ad group ${id}`,
      objective: String(creative.adGroupObjective || fallbackObjective || ""),
    });
  }
  if (byId.size > 0) return Array.from(byId.values()).slice(0, MAX_PROGRAMMATIC_AD_GROUPS);
  if (creatives.length > 0) {
    return [{
      id: "google-ads-imported",
      name: "Imported creatives",
      objective: fallbackObjective || "",
    }];
  }
  return adGroups;
}

export function mapGoogleAdsAdGroupsToProgrammatic(
  adGroups: GoogleAdsImportedAdGroup[] = [],
  objective: string,
): ProgrammaticAdGroup[] {
  return adGroups
    .filter((group) => String(group.id || "").trim() || String(group.name || "").trim())
    .slice(0, MAX_PROGRAMMATIC_AD_GROUPS)
    .map((group, index) => ({
      id: String(group.id || "").trim() || `google-ad-group-${index + 1}`,
      name: String(group.name || "").trim(),
      objective: mapGoogleAdsAdGroupTypeToObjective(group.type || "", objective),
    }));
}

export function buildGoogleAdsImportedSnapshot(
  campaign: GoogleAdsCampaign,
  userId: string,
  customerId: string,
  details: GoogleAdsCampaignImportDetails = {},
): CampaignSnapshot {
  const timestamp = new Date().toISOString();
  const inferredProductFocus = inferProductFocusFromGoogleCampaignName(campaign.name);
  const campaignGoal = mapGoogleAdsGoalToObjective(campaign.suggestedGoal, campaign.channelType);
  const mappedAdGroups = mapGoogleAdsAdGroupsToProgrammatic(details.adGroups || [], campaignGoal);
  const importedCreatives = mapGoogleAdsImportedCreativesToTool(details.creatives || [], mappedAdGroups);
  const programmaticAdGroups = ensureAdGroupsForImportedCreatives(
    mappedAdGroups,
    importedCreatives,
    campaignGoal,
  );
  const fallbackGroupId = programmaticAdGroups[0]?.id || "google-ads-imported";
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
  const adGroupCount = programmaticAdGroups.length || details.adGroupCount || 0;
  const landingUrl = details.landingUrl
    || details.adGroups?.find((group) => group.landingUrl)?.landingUrl
    || "";
  const stableId =
    String(campaign.id || "").trim()
    || (campaign.draftId ? `draft-${campaign.draftId}` : "")
    || `google-${customerId}-${campaign.name}`.toLowerCase().replace(/\s+/g, "-");
  const campaignBrief = buildGoogleAdsCampaignBrief(details);
  const inferredVertical = inferVerticalFromGoogleCampaignSignals(
    ...buildVerticalInferenceCorpus({
      campaignName: campaign.name,
      landingUrl,
      campaignBrief,
      channelType: campaign.channelType,
      channelSubType: details.channelSubType || campaign.advertisingChannelSubType,
      channelSummary: campaign.channelSummary,
      adGroupNames: [
        ...(details.adGroups || []).map((group) => group.name),
        ...programmaticAdGroups.map((group) => group.name),
      ],
      headlines: [
        ...(details.adCopyHeadlines || []),
        ...(details.creatives || []).flatMap((creative) => [creative.headline, creative.name].filter((value): value is string => Boolean(value))),
      ],
      descriptions: [
        ...(details.adCopyDescriptions || []),
        ...(details.creatives || []).map((creative) => creative.description).filter((value): value is string => Boolean(value)),
      ],
      verticalSignals: details.verticalSignals,
      productFocus: [inferredProductFocus],
    }),
  );

  return {
    id: stableId,
    platform: "google_ads",
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
    googleCampaignType: mapGoogleAdsChannelToCampaignType(
      campaign.channelType,
      details.channelSubType || campaign.advertisingChannelSubType,
    ),
    googleAdGroupCount: programmaticAdGroups.length || adGroupCount || "",
    googleAdsCustomerId: customerId,
    googleAdsCampaignStatus: campaign.status,
    googleAdsChannelType: campaign.channelType,
    googleAdsChannelSummary: campaign.channelSummary || campaign.channelType,
    googleAdsCampaignSource: campaign.sourceType || "published",
    googleAdsDraftId: campaign.draftId,
    googleAdsBudgetAmountMicros: details.budgetAmountMicros || campaign.budgetAmountMicros,
    googleAdsStartDate: campaign.startDate,
    googleAdsEndDate: campaign.endDate,
    importSource: "google_ads",
  };
}

export function selectGoogleAdsCampaignCandidate(
  published: GoogleAdsCampaign[],
  drafts: GoogleAdsCampaign[],
  campaignName: string,
  campaignId = "",
): GoogleAdsCampaign | null {
  const normalizedName = campaignName.trim().toLowerCase();
  const normalizedId = campaignId.trim();
  const hasId = normalizedId.length > 0;
  const hasName = normalizedName.length > 0;

  const matcher = (entry: GoogleAdsCampaign) => {
    const sameId = hasId ? entry.id === normalizedId : true;
    const sameName = hasName ? entry.name.trim().toLowerCase() === normalizedName : true;
    return (hasId || hasName) && sameId && sameName;
  };

  const publishedMatches = published.filter(matcher);
  if (!hasId && hasName && publishedMatches.length > 1) {
    console.warn("[Adigator] Multiple published Google campaigns matched by name. Using newest candidate.", {
      campaignName,
      matches: publishedMatches.map((entry) => entry.id),
    });
  }
  if (publishedMatches.length > 0) return publishedMatches[0];

  const draftMatches = drafts.filter(matcher);
  if (!hasId && hasName && draftMatches.length > 1) {
    console.warn("[Adigator] Multiple draft Google campaigns matched by name. Using newest candidate.", {
      campaignName,
      matches: draftMatches.map((entry) => entry.id),
    });
  }
  return draftMatches[0] || null;
}
