import type { CampaignAlignmentReport } from "@/app/lib/campaignAlignmentValidation";
import {
  resolveCampaignIntentForBrief,
} from "@/app/lib/campaignBriefValidation";
import { computeCampaignAlignmentReport } from "@/app/lib/campaignAlignmentValidation";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import { listProgrammaticCampaigns, patchProgrammaticCampaignFields } from "@/app/lib/programmaticCampaignStore";
import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import { computeCampaignOverview } from "@/app/lib/analyzerInsights";
import { getEntryPayload } from "@/app/lib/strategicPresentation";
import { resolveCreativePreviewContext } from "@/app/lib/creativePreviewContext";

const VERTICAL_LABELS: Record<string, string> = {
  healthcare: "Healthcare",
  technology: "Technology",
  automotive: "Automotive",
  news_media: "News / Media",
  sports: "Sports",
  fitness: "Fitness",
  finance: "Business / Finance",
  luxury: "Luxury",
  travel: "Travel",
  hotels: "Hotels",
  food: "Restaurants / Food",
  banking: "Banking / FinTech",
  real_estate: "Real Estate",
  education: "Education / EdTech",
  gaming: "Gaming",
  entertainment: "Entertainment / OTT",
  ecommerce: "E-commerce / Retail",
  fashion: "Fashion",
};

const GOAL_LABELS: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
  traffic: "Traffic",
  lead_generation: "Lead Generation",
  engagement: "Engagement",
  app_installs: "App Installs",
  retargeting: "Retargeting",
};

export function labelDashboardVertical(id?: string | null): string {
  if (!id) return "Unknown";
  return VERTICAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

export function labelDashboardGoal(id?: string | null): string {
  if (!id) return "Unknown";
  return GOAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

export function findDashboardCampaignSnapshot(
  campaignId: string,
  ownerId?: string,
): ProgrammaticCampaignSnapshot | null {
  if (!ownerId || !campaignId) return null;
  return listProgrammaticCampaigns(ownerId).find((item) => item.id === campaignId) || null;
}

export function normalizeAnalysisEntries(snapshot: ProgrammaticCampaignSnapshot): Record<string, unknown>[] {
  const results = Array.isArray(snapshot.analysisResult) ? snapshot.analysisResult : [];
  const creatives = Array.isArray(snapshot.creatives) ? snapshot.creatives : [];
  const creativesById = new Map(creatives.map((item) => [String(item.id || ""), item]));

  return results.map((entry, index) => {
    const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    if (record.creative && typeof record.creative === "object") return record;

    const creativeId = String(record.creativeId || creatives[index]?.id || "");
    const creative = creativeId ? creativesById.get(creativeId) : creatives[index];
    return creative ? { ...record, creative } : record;
  });
}

export function computeDashboardCampaignOverview(
  snapshot: ProgrammaticCampaignSnapshot | null,
  campaign: AdvertiserCampaign,
  options: { readOnly?: boolean } = {},
) {
  if (!snapshot) return null;
  const readOnly = options.readOnly === true;

  const entries = normalizeAnalysisEntries(snapshot);
  if (!entries.length) return null;

  const platform = campaign.platform || "programmatic";
  const brief = snapshot.campaignBrief || campaign.campaignBrief || "";
  const resolvedIntent = resolveCampaignIntentForBrief(brief, {
    campaignGoal: snapshot.campaignGoal || campaign.campaignGoal,
    vertical: snapshot.vertical || campaign.vertical,
    storedIntent: snapshot.campaignIntent,
    storedFingerprint: snapshot.campaignIntentFingerprint,
  });
  const campaignIntent = readOnly
    ? (snapshot.campaignIntent?.trim() || resolvedIntent.intent)
    : resolvedIntent.intent;

  if (!readOnly && resolvedIntent.regenerated && campaignIntent && snapshot.ownerId) {
    patchProgrammaticCampaignFields(snapshot.id, snapshot.ownerId, {
      campaignIntent,
      campaignIntentFingerprint: resolvedIntent.fingerprint,
      dashboardOverviewCache: null,
    });
  }

  let campaignAlignmentReport: CampaignAlignmentReport | null = snapshot.campaignAlignmentReport || null;
  if (
    campaignAlignmentReport
    && campaignAlignmentReport.sourceFingerprint
    && brief
  ) {
    const expectedFingerprint = [
      brief.trim(),
      campaignIntent,
      snapshot.campaignGoal || campaign.campaignGoal || "",
      snapshot.vertical || campaign.vertical || "",
      snapshot.landingUrl || "",
      entries.length,
      String(snapshot.urlValidation?.checked_at || ""),
    ].join("|");
    if (campaignAlignmentReport.sourceFingerprint !== expectedFingerprint) {
      campaignAlignmentReport = null;
    }
  }

  if (!campaignAlignmentReport && brief && !readOnly) {
    campaignAlignmentReport = computeCampaignAlignmentReport({
      campaignBrief: brief,
      campaignIntent,
      campaignGoal: snapshot.campaignGoal || campaign.campaignGoal || "awareness",
      campaignVertical: snapshot.vertical || campaign.vertical || "technology",
      platform: platform as "google_ads" | "meta_ads" | "programmatic",
      analysisEntries: entries,
      urlValidation: snapshot.urlValidation,
    });
    if (campaignAlignmentReport && snapshot.ownerId && !readOnly) {
      patchProgrammaticCampaignFields(snapshot.id, snapshot.ownerId, {
        campaignAlignmentReport,
        ...(campaignIntent && resolvedIntent.regenerated ? {
          campaignIntent,
          campaignIntentFingerprint: resolvedIntent.fingerprint,
        } : {}),
      });
    }
  }

  return computeCampaignOverview(
    entries,
    platform as "google_ads" | "meta_ads" | "programmatic",
    snapshot.campaignGoal || campaign.campaignGoal || "awareness",
    snapshot.vertical || campaign.vertical || "technology",
    labelDashboardVertical,
    labelDashboardGoal,
    {
      campaignBrief: brief,
      campaignProductFocus: snapshot.campaignProductFocus || "",
      campaignIntent,
      urlValidation: snapshot.urlValidation,
      campaignAlignmentReport,
    },
  );
}

export function buildDashboardPreviewContext(
  snapshot: ProgrammaticCampaignSnapshot | null,
  hydratedCreatives: Record<string, unknown>[],
  campaign: AdvertiserCampaign,
) {
  const validCreatives = hydratedCreatives.filter((item) => item.valid !== false);
  const entries = snapshot ? normalizeAnalysisEntries(snapshot) : [];

  const campaignVertical = snapshot?.vertical || campaign.vertical || "technology";

  const previewEngineCreatives = validCreatives.map((creative, index) => {
    const matchedEntry = entries.find((entry) => {
      const entryCreative = entry.creative as Record<string, unknown> | undefined;
      return entryCreative?.id === creative.id;
    }) || entries[index];
    const payload = getEntryPayload(matchedEntry) || {};

    const payloadRecord = payload as Record<string, unknown>;
    const signals = payloadRecord.signals as Record<string, unknown> | undefined;
    const extractionSignals = payloadRecord.extraction_signals as Record<string, unknown> | undefined;
    const previewContext = resolveCreativePreviewContext(payloadRecord, campaignVertical);

    return {
      id: String(creative.id || ""),
      name: String(creative.name || "Creative"),
      url: String(creative.url || creative.previewDataUrl || ""),
      size: typeof creative.size === "string" ? creative.size : undefined,
      analyzerOutput: payload,
      ctaText: String(signals?.cta || extractionSignals?.cta || ""),
      headline: String(
        signals?.headline
        || extractionSignals?.headline
        || payloadRecord.main_strategic_problem
        || creative.name
        || "",
      ),
      previewVertical: previewContext.creativeVertical,
      previewTemplate: previewContext.templateId,
    };
  });

  const primaryPayload = getEntryPayload(entries[0]) || {};
  const primaryRecord = primaryPayload as Record<string, unknown>;
  const signals = primaryRecord.signals as Record<string, unknown> | undefined;
  const goal = snapshot?.campaignGoal || campaign.campaignGoal || "awareness";

  return {
    platform: campaign.platform || "programmatic",
    vertical: campaignVertical,
    goal,
    previewEngineCreatives,
    sourceCreatives: validCreatives.map((creative) => ({
      id: String(creative.id || ""),
      name: String(creative.name || "Creative"),
      url: String(creative.url || creative.previewDataUrl || ""),
      fullUrl: typeof creative.fullUrl === "string" ? creative.fullUrl : undefined,
      size: typeof creative.size === "string" ? creative.size : undefined,
    })),
    brandName: String(signals?.brand || validCreatives[0]?.name || campaign.name || "Brand"),
    targetAudience: snapshot?.campaignAudienceStage || "Prospective customers",
    tone: goal === "awareness"
      ? "Brand-forward and scroll-stopping"
      : goal === "consideration"
        ? "Credible and persuasive"
        : "Direct and conversion-focused",
    keyMessage: String(signals?.primary_message || signals?.headline || primaryRecord.main_strategic_problem || ""),
    imageUrls: validCreatives
      .map((creative) => String(creative.url || creative.previewDataUrl || ""))
      .filter(Boolean),
  };
}
