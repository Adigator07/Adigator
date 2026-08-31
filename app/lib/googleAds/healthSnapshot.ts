import { searchGoogleAdsSafe } from "@/app/lib/googleAds/client";
import type { CampaignHealthSnapshot } from "@/app/lib/campaignHealth/types";

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return String(value || "").trim();
}

function firstUrl(value: unknown): string | undefined {
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0].trim();
  return undefined;
}

async function probeLandingUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "AdigatorCampaignHealth/1.0" },
    });
    clearTimeout(timer);
    if (response.status >= 400) return `HTTP ${response.status}`;
    return null;
  } catch (error) {
    return error instanceof Error ? error.message.slice(0, 120) : "Unreachable";
  }
}

export async function getGoogleAdsCampaignHealthSnapshot(input: {
  accessToken: string;
  customerId: string;
  campaignId: string;
  loginCustomerId?: string;
  accountName?: string;
}): Promise<CampaignHealthSnapshot> {
  const customerId = String(input.customerId || "").replace(/\D/g, "");
  const campaignId = String(input.campaignId || "").replace(/\D/g, "");
  const login = input.loginCustomerId;

  const [campaignRows, metricRows, yesterdayRows, adRows, trackingRows] = await Promise.all([
    searchGoogleAdsSafe(input.accessToken, customerId, [
      "SELECT",
      "campaign.id,",
      "campaign.name,",
      "campaign.status,",
      "campaign.primary_status,",
      "campaign.primary_status_reasons,",
      "campaign.advertising_channel_type,",
      "campaign_budget.amount_micros",
      "FROM campaign",
      `WHERE campaign.id = ${campaignId}`,
      "LIMIT 1",
    ].join(" "), login, "health campaign"),
    searchGoogleAdsSafe(input.accessToken, customerId, [
      "SELECT",
      "campaign.id,",
      "metrics.impressions,",
      "metrics.clicks,",
      "metrics.conversions,",
      "metrics.cost_micros",
      "FROM campaign",
      `WHERE campaign.id = ${campaignId} AND segments.date DURING LAST_7_DAYS`,
    ].join(" "), login, "health metrics 7d"),
    searchGoogleAdsSafe(input.accessToken, customerId, [
      "SELECT",
      "campaign.id,",
      "metrics.conversions,",
      "metrics.cost_micros",
      "FROM campaign",
      `WHERE campaign.id = ${campaignId} AND segments.date DURING YESTERDAY`,
    ].join(" "), login, "health metrics yesterday"),
    searchGoogleAdsSafe(input.accessToken, customerId, [
      "SELECT",
      "ad_group_ad.status,",
      "ad_group_ad.policy_summary.approval_status,",
      "ad_group_ad.ad.final_urls",
      "FROM ad_group_ad",
      `WHERE campaign.id = ${campaignId} AND ad_group_ad.status != 'REMOVED'`,
      "LIMIT 80",
    ].join(" "), login, "health ads"),
    searchGoogleAdsSafe(input.accessToken, customerId, [
      "SELECT",
      "customer.conversion_tracking_setting.conversion_tracking_status",
      "FROM customer",
      "LIMIT 1",
    ].join(" "), login, "health tracking"),
  ]);

  const campaign = (campaignRows[0]?.campaign || {}) as Record<string, unknown>;
  const budget = (campaignRows[0]?.campaignBudget || {}) as Record<string, unknown>;
  const reasons = Array.isArray(campaign.primaryStatusReasons)
    ? campaign.primaryStatusReasons.map((reason) => String(reason))
    : [];

  let impressions7d = 0;
  let clicks7d = 0;
  let conversions7d = 0;
  let costMicros7d = 0;
  for (const row of metricRows) {
    const metrics = (row.metrics || {}) as Record<string, unknown>;
    impressions7d += num(metrics.impressions);
    clicks7d += num(metrics.clicks);
    conversions7d += num(metrics.conversions);
    costMicros7d += num(metrics.costMicros);
  }

  let conversionsYesterday = 0;
  let costMicrosYesterday = 0;
  for (const row of yesterdayRows) {
    const metrics = (row.metrics || {}) as Record<string, unknown>;
    conversionsYesterday += num(metrics.conversions);
    costMicrosYesterday += num(metrics.costMicros);
  }

  let enabledAdCount = 0;
  let disapprovedAdCount = 0;
  let limitedAdCount = 0;
  let underReviewAdCount = 0;
  const landingUrls: string[] = [];
  for (const row of adRows) {
    const adGroupAd = (row.adGroupAd || {}) as Record<string, unknown>;
    const ad = (adGroupAd.ad || {}) as Record<string, unknown>;
    const policy = (adGroupAd.policySummary || {}) as Record<string, unknown>;
    const adStatus = text(adGroupAd.status).toUpperCase();
    const approval = text(policy.approvalStatus).toUpperCase();
    if (adStatus === "ENABLED") enabledAdCount += 1;
    if (approval.includes("DISAPPROVED")) disapprovedAdCount += 1;
    if (approval.includes("AREA_OF_INTEREST_ONLY") || approval.includes("APPROVED_LIMITED")) limitedAdCount += 1;
    if (approval.includes("UNDER_REVIEW") || approval.includes("REVIEW")) underReviewAdCount += 1;
    const url = firstUrl(ad.finalUrls);
    if (url && !landingUrls.includes(url)) landingUrls.push(url);
  }

  const tracking = (trackingRows[0]?.customer as { conversionTrackingSetting?: { conversionTrackingStatus?: string } } | undefined)
    ?.conversionTrackingSetting?.conversionTrackingStatus || "";

  const landingPageErrors: CampaignHealthSnapshot["landingPageErrors"] = [];
  for (const url of landingUrls.slice(0, 3)) {
    const error = await probeLandingUrl(url);
    if (error) landingPageErrors.push({ url, error });
  }

  return {
    campaignId,
    campaignName: text(campaign.name) || `Campaign ${campaignId}`,
    customerId,
    accountName: input.accountName,
    status: text(campaign.status),
    primaryStatus: text(campaign.primaryStatus),
    primaryStatusReasons: reasons,
    channelType: text(campaign.advertisingChannelType),
    budgetAmountMicros: num(budget.amountMicros),
    impressions7d,
    clicks7d,
    conversions7d,
    costMicros7d,
    conversionsYesterday,
    costMicrosYesterday,
    enabledAdCount,
    disapprovedAdCount,
    limitedAdCount,
    underReviewAdCount,
    conversionTrackingStatus: text(tracking),
    landingUrls,
    landingPageErrors,
    checkedAt: new Date().toISOString(),
  };
}
