import { isGoogleAdsDraftCampaign, withGoogleAdsDrafts } from "@/app/lib/googleAds/drafts";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v25";
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export type GoogleAdsTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type GoogleAdsAccount = {
  customerId: string;
  resourceName: string;
  name: string;
  currencyCode: string;
  timeZone: string;
  manager?: boolean;
};

export type GoogleAdsCampaign = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  advertisingChannelSubType?: string;
  budgetAmountMicros: number;
  startDate: string;
  endDate: string;
  suggestedGoal: string;
  sourceType?: "published" | "draft";
  draftId?: string;
  channelSummary?: string;
  experimentType?: string;
  primaryStatus?: string;
  customerId?: string;
  loginCustomerId?: string;
};

export type GoogleAdsImportedAdGroup = {
  id: string;
  name: string;
  status?: string;
  type?: string;
  landingUrl?: string;
};

export type GoogleAdsImportedCreative = {
  id: string;
  name: string;
  type: "text" | "image" | "video";
  previewUrl?: string;
  headline?: string;
  description?: string;
  adGroupId?: string;
  landingUrl?: string;
  width?: number;
  height?: number;
  source: "google_ads";
};

export type GoogleAdsCampaignImportDetails = {
  landingUrl?: string;
  adGroupCount?: number;
  adGroups?: GoogleAdsImportedAdGroup[];
  creatives?: GoogleAdsImportedCreative[];
  channelSubType?: string;
  budgetAmountMicros?: number;
  /** RSA / RDA / Demand Gen / asset description lines from the selected campaign. */
  adCopyDescriptions?: string[];
  /** Headlines and long headlines from the selected campaign. */
  adCopyHeadlines?: string[];
  /** Keywords, topics, and other targeting labels used to infer vertical. */
  verticalSignals?: string[];
};

export type GoogleAdsCreateCampaignInput = {
  customerId: string;
  campaignName: string;
  amountMicros: number;
  advertisingChannelType?: "SEARCH" | "DISPLAY" | "VIDEO" | "PERFORMANCE_MAX";
  status?: "PAUSED" | "ENABLED";
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getGoogleAdsLoginCustomerId(): string | undefined {
  const value = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim();
  if (!value) return undefined;
  return value.replace(/-/g, "");
}

function cleanCustomerId(input: string): string {
  return String(input || "").replace(/[^0-9]/g, "");
}

function extractGoogleAdsFailureMessage(body: string): string {
  try {
    const payload = JSON.parse(body) as {
      error?: {
        message?: string;
        details?: Array<{
          "@type"?: string;
          errors?: Array<{ message?: string; errorCode?: Record<string, string> }>;
        }>;
      };
    };
    const failure = (payload.error?.details || []).find((detail) =>
      String(detail["@type"] || "").includes("GoogleAdsFailure"),
    );
    const first = failure?.errors?.[0];
    const code = first?.errorCode ? Object.values(first.errorCode).filter(Boolean)[0] : "";
    const message = String(first?.message || payload.error?.message || "").trim();
    if (message && code) return `${code}: ${message}`;
    if (message) return message;
  } catch {
    // Fall through to the raw body.
  }
  return body.replace(/\s+/g, " ").trim().slice(0, 280);
}

function ensureOk(response: Response, body: string) {
  if (!response.ok) {
    throw new Error(`Google Ads request failed (${response.status}): ${extractGoogleAdsFailureMessage(body)}`);
  }
}

export function buildGoogleAdsAuthUrl(
  origin: string,
  state: string,
  forceAccountSelect = false,
  loginHint?: string,
): string {
  const clientId = requiredEnv("GOOGLE_ADS_CLIENT_ID");
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI?.trim() || `${origin}/api/google-ads/oauth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/adwords",
      "openid",
      "email",
      "profile",
    ].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: forceAccountSelect ? "select_account consent" : "consent",
    state,
  });

  const resolvedLoginHint = String(loginHint || "").trim();
  if (resolvedLoginHint) {
    params.set("login_hint", resolvedLoginHint);
  }

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeGoogleAdsCode(code: string, origin: string): Promise<GoogleAdsTokenResponse> {
  const clientId = requiredEnv("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_ADS_CLIENT_SECRET");
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI?.trim() || `${origin}/api/google-ads/oauth/callback`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const text = await response.text();
  ensureOk(response, text);
  return JSON.parse(text) as GoogleAdsTokenResponse;
}

export async function refreshGoogleAdsAccessToken(refreshToken: string): Promise<GoogleAdsTokenResponse> {
  const clientId = requiredEnv("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_ADS_CLIENT_SECRET");

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const text = await response.text();
  ensureOk(response, text);
  return JSON.parse(text) as GoogleAdsTokenResponse;
}

export async function fetchGoogleProfileEmail(accessToken: string): Promise<string | undefined> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return undefined;
  const payload = await response.json() as { email?: string };
  return payload.email;
}

function buildGoogleAdsHeaders(accessToken: string, loginCustomerId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": requiredEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    "Content-Type": "application/json",
  };

  const loginId = loginCustomerId === null
    ? ""
    : cleanCustomerId(loginCustomerId || "");
  if (loginId) headers["login-customer-id"] = loginId;
  return headers;
}

export async function listAccessibleCustomerResourceNames(accessToken: string): Promise<string[]> {
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers`, {
    method: "GET",
    headers: buildGoogleAdsHeaders(accessToken, null),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { resourceNames?: string[] };
  return Array.isArray(payload.resourceNames) ? payload.resourceNames : [];
}

export async function getGoogleAdsAccountDetails(
  accessToken: string,
  customerId: string,
  loginCustomerId?: string,
): Promise<GoogleAdsAccount> {
  const cid = cleanCustomerId(customerId);
  const query = "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer LIMIT 1";
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken, loginCustomerId),
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { results?: Array<{ customer?: Record<string, unknown> }> };
  const row = Array.isArray(payload.results) ? payload.results[0]?.customer || {} : {};

  return {
    customerId: String((row.id as string) || cid),
    resourceName: `customers/${cid}`,
    name: String((row.descriptiveName as string) || `Customer ${cid}`),
    currencyCode: String((row.currencyCode as string) || ""),
    timeZone: String((row.timeZone as string) || ""),
    manager: Boolean(row.manager),
  };
}

export async function listGoogleAdsCustomerClients(
  accessToken: string,
  managerCustomerId: string,
): Promise<GoogleAdsAccount[]> {
  const cid = cleanCustomerId(managerCustomerId);
  const query = [
    "SELECT",
    "customer_client.id,",
    "customer_client.descriptive_name,",
    "customer_client.manager,",
    "customer_client.status",
    "FROM customer_client",
    "WHERE customer_client.level <= 1",
    "ORDER BY customer_client.id DESC LIMIT 50",
  ].join(" ");

  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken, cid),
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as {
    results?: Array<{ customerClient?: Record<string, unknown> }>;
  };

  return (payload.results || []).map((row) => {
    const client = row.customerClient || {};
    const id = String(client.id || "");
    return {
      customerId: id,
      resourceName: `customers/${id}`,
      name: String(client.descriptiveName || `Customer ${id}`),
      currencyCode: "",
      timeZone: "",
      manager: Boolean(client.manager),
    };
  }).filter((account) => account.customerId);
}

function mapChannelToGoal(channel: string): string {
  switch (channel) {
    case "SEARCH":
      return "traffic";
    case "DISPLAY":
      return "awareness";
    case "VIDEO":
      return "video_views";
    case "PERFORMANCE_MAX":
      return "conversion";
    case "DEMAND_GEN":
      return "consideration";
    case "SHOPPING":
      return "conversion";
    default:
      return "awareness";
  }
}

function buildChannelSummary(channel: string): string {
  if (!channel) return "Unknown";
  return channel.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function parseResourceId(resourceName: unknown): string {
  const value = String(resourceName || "").trim();
  if (!value) return "";
  return value.split("/").pop() || "";
}

function mapCampaignSearchRow(
  row: {
    campaign?: Record<string, unknown>;
    campaignBudget?: Record<string, unknown>;
  },
  accountContext?: { customerId?: string; loginCustomerId?: string },
): GoogleAdsCampaign {
  const campaign = row.campaign || {};
  const budget = row.campaignBudget || {};
  const channel = String((campaign.advertisingChannelType as string) || "");
  const experimentType = String((campaign.experimentType as string) || "");
  const primaryStatus = String((campaign.primaryStatus as string) || "");
  const status = String((campaign.status as string) || "");
  const mapped: GoogleAdsCampaign = {
    id: String((campaign.id as string) || ""),
    name: String((campaign.name as string) || "Untitled Campaign"),
    status,
    channelType: channel,
    advertisingChannelSubType: String((campaign.advertisingChannelSubType as string) || ""),
    budgetAmountMicros: Number((budget.amountMicros as number) || 0),
    startDate: String((campaign.startDateTime as string) || (campaign.startDate as string) || ""),
    endDate: String((campaign.endDateTime as string) || (campaign.endDate as string) || ""),
    suggestedGoal: mapChannelToGoal(channel),
    sourceType: "published",
    channelSummary: buildChannelSummary(channel),
    experimentType,
    primaryStatus,
    customerId: accountContext?.customerId,
    loginCustomerId: accountContext?.loginCustomerId,
  };
  if (isGoogleAdsDraftCampaign(mapped)) {
    mapped.sourceType = "draft";
    if (!mapped.status || mapped.status === "ENABLED" || mapped.status === "PAUSED") {
      mapped.status = "Draft";
    }
  }
  return mapped;
}

export async function listGoogleAdsCampaigns(
  accessToken: string,
  customerId: string,
  limit = 50,
  loginCustomerId?: string,
): Promise<GoogleAdsCampaign[]> {
  const cid = cleanCustomerId(customerId);
  const query = withGoogleAdsDrafts([
    "SELECT",
    "campaign.id,",
    "campaign.name,",
    "campaign.status,",
    "campaign.advertising_channel_type,",
    "campaign.experiment_type,",
    "campaign.primary_status,",
    "campaign.start_date_time,",
    "campaign.end_date_time",
    "FROM campaign",
    `ORDER BY campaign.id DESC LIMIT ${Math.max(1, Math.min(limit, 200))}`,
  ].join(" "));

  const rows = await searchGoogleAds(accessToken, cid, query, loginCustomerId);
  return rows
    .map((row) => mapCampaignSearchRow(row as {
      campaign?: Record<string, unknown>;
      campaignBudget?: Record<string, unknown>;
    }, { customerId: cid, loginCustomerId }))
    .filter((campaign) => String(campaign.status || "").toUpperCase() !== "REMOVED");
}

export async function getGoogleAdsCampaign(
  accessToken: string,
  customerId: string,
  campaignId: string,
  loginCustomerId?: string,
): Promise<GoogleAdsCampaign | null> {
  const cid = cleanCustomerId(customerId);
  const campaignKey = String(campaignId || "").replace(/[^0-9]/g, "");
  if (!cid || !campaignKey) return null;
  try {
    const rows = await searchGoogleAds(accessToken, cid, withGoogleAdsDrafts([
      "SELECT",
      "campaign.id,",
      "campaign.name,",
      "campaign.status,",
      "campaign.advertising_channel_type,",
      "campaign.advertising_channel_sub_type,",
      "campaign.experiment_type,",
      "campaign.primary_status,",
      "campaign.start_date_time,",
      "campaign.end_date_time",
      "FROM campaign",
      `WHERE campaign.id = ${campaignKey}`,
      "LIMIT 1",
    ].join(" ")), loginCustomerId);
    const mapped = rows
      .map((row) => mapCampaignSearchRow(row as {
        campaign?: Record<string, unknown>;
        campaignBudget?: Record<string, unknown>;
      }, { customerId: cid, loginCustomerId }))
      .find((campaign) => campaign.id === campaignKey);
    return mapped || null;
  } catch (error) {
    console.warn("[Adigator] Google Ads campaign lookup failed:", campaignKey, error);
    return null;
  }
}

export async function listGoogleAdsDraftCampaigns(
  accessToken: string,
  customerId: string,
  limit = 50,
  loginCustomerId?: string,
): Promise<GoogleAdsCampaign[]> {
  const cid = cleanCustomerId(customerId);
  const safeLimit = Math.max(1, Math.min(limit, 200));
  let rows: Array<Record<string, unknown>> = [];
  try {
    rows = await searchGoogleAds(accessToken, cid, [
      "SELECT",
      "campaign_draft.draft_id,",
      "campaign_draft.name,",
      "campaign_draft.status,",
      "campaign_draft.draft_campaign,",
      "campaign_draft.base_campaign",
      "FROM campaign_draft",
      "WHERE campaign_draft.status != 'REMOVED'",
      `ORDER BY campaign_draft.draft_id DESC LIMIT ${safeLimit}`,
    ].join(" "), loginCustomerId);
  } catch (error) {
    console.warn("[Adigator] Google Ads campaign_draft lookup failed:", cid, error);
    return [];
  }

  const draftRows = rows.map((row) => (row.campaignDraft || {}) as Record<string, unknown>);
  const draftCampaignIds = Array.from(new Set(
    draftRows
      .map((draft) => parseResourceId(draft.draftCampaign) || parseResourceId(draft.baseCampaign))
      .filter(Boolean),
  ));

  const detailsById = new Map<string, GoogleAdsCampaign>();
  if (draftCampaignIds.length) {
    try {
      const detailRows = await searchGoogleAds(accessToken, cid, withGoogleAdsDrafts([
        "SELECT",
        "campaign.id,",
        "campaign.name,",
        "campaign.status,",
        "campaign.advertising_channel_type,",
        "campaign.experiment_type,",
        "campaign.primary_status,",
        "campaign.start_date_time,",
        "campaign.end_date_time",
        "FROM campaign",
        `WHERE campaign.id IN (${draftCampaignIds.join(", ")})`,
        `LIMIT ${safeLimit}`,
      ].join(" ")), loginCustomerId);
      for (const row of detailRows) {
        const mapped = mapCampaignSearchRow(row as {
          campaign?: Record<string, unknown>;
          campaignBudget?: Record<string, unknown>;
        }, { customerId: cid, loginCustomerId });
        if (mapped.id) detailsById.set(mapped.id, mapped);
      }
    } catch (error) {
      console.warn("[Adigator] Google Ads draft campaign details lookup failed:", cid, error);
    }
  }

  return draftRows.map((draft) => {
    const draftCampaignId = parseResourceId(draft.draftCampaign);
    const baseCampaignId = parseResourceId(draft.baseCampaign);
    const linked = detailsById.get(draftCampaignId) || detailsById.get(baseCampaignId);
    const channelType = linked?.channelType || "";
    return {
      id: draftCampaignId || linked?.id || String((draft.draftId as string) || (draft.id as string) || ""),
      name: String((draft.name as string) || linked?.name || "Untitled Draft Campaign"),
      status: "Draft",
      channelType,
      advertisingChannelSubType: linked?.advertisingChannelSubType || "",
      budgetAmountMicros: Number(linked?.budgetAmountMicros || 0),
      startDate: String(linked?.startDate || ""),
      endDate: String(linked?.endDate || ""),
      suggestedGoal: mapChannelToGoal(channelType),
      sourceType: "draft" as const,
      draftId: String((draft.draftId as string) || (draft.id as string) || ""),
      channelSummary: buildChannelSummary(channelType),
      experimentType: linked?.experimentType || "DRAFT",
      primaryStatus: linked?.primaryStatus || "CAMPAIGN_DRAFT",
      customerId: cid,
      loginCustomerId,
    };
  });
}

async function searchGoogleAds(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId?: string,
): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken, loginCustomerId),
    body: JSON.stringify({ query: withGoogleAdsDrafts(query) }),
  });
  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { results?: Array<Record<string, unknown>> };
  return Array.isArray(payload.results) ? payload.results : [];
}

export async function searchGoogleAdsSafe(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId: string | undefined,
  label: string,
): Promise<Array<Record<string, unknown>>> {
  try {
    return await searchGoogleAds(accessToken, customerId, query, loginCustomerId);
  } catch (error) {
    console.warn(`[Adigator] Google Ads ${label} lookup failed:`, customerId, error);
    return [];
  }
}

async function searchGoogleAdsAttempt(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId: string | undefined,
  label: string,
): Promise<{ rows: Array<Record<string, unknown>>; failed: boolean }> {
  try {
    return { rows: await searchGoogleAds(accessToken, customerId, query, loginCustomerId), failed: false };
  } catch (error) {
    console.warn(`[Adigator] Google Ads ${label} lookup failed:`, customerId, error);
    return { rows: [], failed: true };
  }
}

function firstUrl(value: unknown): string | undefined {
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return undefined;
}

function assetTexts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object" && "text" in entry) {
        return String((entry as { text?: string }).text || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function pushUniqueCopy(target: string[], value: unknown) {
  const text = assetText(value);
  if (!text) return;
  const key = text.toLowerCase();
  if (target.some((item) => item.toLowerCase() === key)) return;
  target.push(text);
}

function assetText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "text" in value) {
    return String((value as { text?: string }).text || "").trim();
  }
  return "";
}

function pushImportedCreative(
  creatives: GoogleAdsImportedCreative[],
  seen: Set<string>,
  creative: GoogleAdsImportedCreative,
) {
  if (seen.has(creative.id)) return;
  seen.add(creative.id);
  creatives.push(creative);
}

function parseImportedAdRow(row: Record<string, unknown>): GoogleAdsImportedCreative | null {
  const adGroup = (row.adGroup || {}) as Record<string, unknown>;
  const ad = ((row.adGroupAd || {}) as { ad?: Record<string, unknown> }).ad || {};
  const adId = String(ad.id || "").trim();
  if (!adId) return null;

  const adType = String(ad.type || "").toUpperCase();
  const rsa = (ad.responsiveSearchAd || {}) as Record<string, unknown>;
  const eta = (ad.expandedTextAd || {}) as Record<string, unknown>;
  const imageAd = (ad.imageAd || {}) as Record<string, unknown>;
  const rda = (ad.responsiveDisplayAd || {}) as Record<string, unknown>;
  const demand = (ad.demandGenMultiAssetAd || {}) as Record<string, unknown>;
  const landingUrl = firstUrl(ad.finalUrls);
  const headlines = [
    ...assetTexts(rsa.headlines),
    String(eta.headlinePart1 || "").trim(),
    String(eta.headlinePart2 || "").trim(),
    ...assetTexts(rda.headlines),
    assetText(rda.longHeadline),
    ...assetTexts(demand.headlines),
  ].filter(Boolean);
  const descriptions = [
    ...assetTexts(rsa.descriptions),
    String(eta.description || "").trim(),
    ...assetTexts(rda.descriptions),
    ...assetTexts(demand.descriptions),
  ].filter(Boolean);
  const imageUrl = String(imageAd.imageUrl || imageAd.previewImageUrl || "").trim();
  const adGroupId = String(adGroup.id || "").trim() || undefined;
  const name = String(ad.name || headlines[0] || `Google ad ${adId}`).trim();

  if (imageUrl) {
    return {
      id: `gads-ad-${adId}`,
      name,
      type: "image",
      previewUrl: imageUrl,
      headline: headlines.slice(0, 5).join(" | ") || undefined,
      description: descriptions.slice(0, 3).join(" | ") || undefined,
      adGroupId,
      landingUrl,
      width: Number(imageAd.pixelWidth || 0) || undefined,
      height: Number(imageAd.pixelHeight || 0) || undefined,
      source: "google_ads",
    };
  }

  if (headlines.length || descriptions.length) {
    return {
      id: `gads-ad-${adId}`,
      name,
      type: "text",
      headline: headlines.slice(0, 5).join(" | ") || undefined,
      description: descriptions.slice(0, 3).join(" | ") || undefined,
      adGroupId,
      landingUrl,
      source: "google_ads",
    };
  }

  if (adType.includes("VIDEO") || adType.includes("DEMAND_GEN")) {
    return {
      id: `gads-ad-${adId}`,
      name,
      type: adType.includes("VIDEO") ? "video" : "image",
      headline: headlines.slice(0, 5).join(" | ") || undefined,
      description: descriptions.slice(0, 3).join(" | ") || undefined,
      adGroupId,
      landingUrl,
      source: "google_ads",
    };
  }

  if (name) {
    return {
      id: `gads-ad-${adId}`,
      name,
      type: "text",
      headline: headlines.slice(0, 5).join(" | ") || name,
      description: descriptions.slice(0, 3).join(" | ") || undefined,
      adGroupId,
      landingUrl,
      source: "google_ads",
    };
  }

  return null;
}

export async function getGoogleAdsCampaignImportDetails(
  accessToken: string,
  customerId: string,
  campaignId: string,
  loginCustomerId?: string,
): Promise<GoogleAdsCampaignImportDetails> {
  const cid = cleanCustomerId(customerId);
  const campaignKey = String(campaignId || "").replace(/[^0-9]/g, "");
  if (!cid || !campaignKey) return {};

  const adGroupsById = new Map<string, GoogleAdsImportedAdGroup>();
  const creatives: GoogleAdsImportedCreative[] = [];
  const seenCreativeIds = new Set<string>();
  const adCopyDescriptions: string[] = [];
  const adCopyHeadlines: string[] = [];
  const verticalSignals: string[] = [];
  let landingUrl: string | undefined;
  let channelSubType: string | undefined;
  let budgetAmountMicros: number | undefined;

  const adQueryVariants = [
    [
      "SELECT",
      "ad_group.id,",
      "ad_group_ad.ad.id,",
      "ad_group_ad.ad.name,",
      "ad_group_ad.ad.type,",
      "ad_group_ad.ad.final_urls,",
      "ad_group_ad.ad.responsive_search_ad.headlines,",
      "ad_group_ad.ad.responsive_search_ad.descriptions,",
      "ad_group_ad.ad.expanded_text_ad.headline_part1,",
      "ad_group_ad.ad.expanded_text_ad.headline_part2,",
      "ad_group_ad.ad.expanded_text_ad.description,",
      "ad_group_ad.ad.image_ad.image_url,",
      "ad_group_ad.ad.image_ad.preview_image_url,",
      "ad_group_ad.ad.image_ad.pixel_width,",
      "ad_group_ad.ad.image_ad.pixel_height,",
      "ad_group_ad.ad.responsive_display_ad.headlines,",
      "ad_group_ad.ad.responsive_display_ad.descriptions,",
      "ad_group_ad.ad.responsive_display_ad.long_headline,",
      "ad_group_ad.ad.demand_gen_multi_asset_ad.headlines,",
      "ad_group_ad.ad.demand_gen_multi_asset_ad.descriptions",
      "FROM ad_group_ad",
      `WHERE campaign.id = ${campaignKey} AND ad_group_ad.status != 'REMOVED'`,
      "ORDER BY ad_group_ad.ad.id DESC LIMIT 80",
    ].join(" "),
    [
      "SELECT",
      "ad_group.id,",
      "ad_group_ad.ad.id,",
      "ad_group_ad.ad.name,",
      "ad_group_ad.ad.type,",
      "ad_group_ad.ad.final_urls,",
      "ad_group_ad.ad.responsive_search_ad.headlines,",
      "ad_group_ad.ad.responsive_search_ad.descriptions,",
      "ad_group_ad.ad.image_ad.image_url,",
      "ad_group_ad.ad.image_ad.preview_image_url",
      "FROM ad_group_ad",
      `WHERE campaign.id = ${campaignKey} AND ad_group_ad.status != 'REMOVED'`,
      "ORDER BY ad_group_ad.ad.id DESC LIMIT 80",
    ].join(" "),
    [
      "SELECT",
      "ad_group.id,",
      "ad_group_ad.ad.id,",
      "ad_group_ad.ad.final_urls,",
      "ad_group_ad.ad.responsive_search_ad.headlines,",
      "ad_group_ad.ad.responsive_search_ad.descriptions",
      "FROM ad_group_ad",
      `WHERE campaign.id = ${campaignKey}`,
      "ORDER BY ad_group_ad.ad.id DESC LIMIT 80",
    ].join(" "),
  ];

  const loadAds = async () => {
    for (const query of adQueryVariants) {
      const attempt = await searchGoogleAdsAttempt(accessToken, cid, query, loginCustomerId, "ad creative");
      if (!attempt.failed) return attempt.rows;
    }
    return [] as Array<Record<string, unknown>>;
  };

  const loadCampaignMeta = async () => {
    const variants = [
      [
        "SELECT",
        "campaign.advertising_channel_sub_type,",
        "campaign.advertising_channel_type,",
        "campaign.shopping_setting.merchant_id,",
        "campaign.hotel_setting.hotel_center_id,",
        "campaign_budget.amount_micros",
        "FROM campaign",
        `WHERE campaign.id = ${campaignKey}`,
        "LIMIT 1",
      ].join(" "),
      [
        "SELECT",
        "campaign.advertising_channel_sub_type,",
        "campaign_budget.amount_micros",
        "FROM campaign",
        `WHERE campaign.id = ${campaignKey}`,
        "LIMIT 1",
      ].join(" "),
    ];
    for (const query of variants) {
      const attempt = await searchGoogleAdsAttempt(accessToken, cid, query, loginCustomerId, "campaign metadata");
      if (!attempt.failed) return attempt.rows;
    }
    return [] as Array<Record<string, unknown>>;
  };

  const loadCriteria = async () => {
    const variants = [
      [
        "SELECT",
        "campaign_criterion.type,",
        "campaign_criterion.display_name,",
        "campaign_criterion.keyword.text,",
        "campaign_criterion.topic.path,",
        "campaign_criterion.user_interest.user_interest_category",
        "FROM campaign_criterion",
        `WHERE campaign.id = ${campaignKey} AND campaign_criterion.negative = FALSE`,
        "LIMIT 40",
      ].join(" "),
      [
        "SELECT",
        "campaign_criterion.type,",
        "campaign_criterion.keyword.text,",
        "campaign_criterion.topic.path,",
        "campaign_criterion.user_interest.user_interest_category",
        "FROM campaign_criterion",
        `WHERE campaign.id = ${campaignKey} AND campaign_criterion.negative = FALSE`,
        "LIMIT 40",
      ].join(" "),
    ];
    for (const query of variants) {
      const attempt = await searchGoogleAdsAttempt(accessToken, cid, query, loginCustomerId, "campaign criterion");
      if (!attempt.failed) return attempt.rows;
    }
    return [] as Array<Record<string, unknown>>;
  };

  const [campaignMetaRows, adGroupRows, adRows, assetGroupRows, assetRows, adAssetRows, criterionRows] = await Promise.all([
    loadCampaignMeta(),
    searchGoogleAdsSafe(accessToken, cid, [
      "SELECT",
      "ad_group.id,",
      "ad_group.name,",
      "ad_group.status,",
      "ad_group.type",
      "FROM ad_group",
      `WHERE campaign.id = ${campaignKey} AND ad_group.status != 'REMOVED'`,
      "ORDER BY ad_group.id DESC LIMIT 200",
    ].join(" "), loginCustomerId, "ad group"),
    loadAds(),
    searchGoogleAdsSafe(accessToken, cid, [
      "SELECT",
      "asset_group.id,",
      "asset_group.name,",
      "asset_group.status,",
      "asset_group.final_urls",
      "FROM asset_group",
      `WHERE campaign.id = ${campaignKey} AND asset_group.status != 'REMOVED'`,
      "ORDER BY asset_group.id DESC LIMIT 50",
    ].join(" "), loginCustomerId, "asset group"),
    searchGoogleAdsSafe(accessToken, cid, [
      "SELECT",
      "asset_group.id,",
      "asset_group_asset.field_type,",
      "asset.id,",
      "asset.name,",
      "asset.text_asset.text,",
      "asset.image_asset.full_size.url,",
      "asset.youtube_video_asset.youtube_video_id",
      "FROM asset_group_asset",
      `WHERE campaign.id = ${campaignKey}`,
      "ORDER BY asset.id DESC LIMIT 80",
    ].join(" "), loginCustomerId, "asset"),
    searchGoogleAdsSafe(accessToken, cid, [
      "SELECT",
      "ad_group.id,",
      "ad_group.name,",
      "ad_group_ad.ad.id,",
      "ad_group_ad.ad.name,",
      "ad_group_ad.ad.final_urls,",
      "ad_group_ad_asset_view.field_type,",
      "asset.id,",
      "asset.name,",
      "asset.text_asset.text,",
      "asset.image_asset.full_size.url,",
      "asset.youtube_video_asset.youtube_video_id",
      "FROM ad_group_ad_asset_view",
      `WHERE campaign.id = ${campaignKey} AND ad_group_ad.status != 'REMOVED'`,
      "ORDER BY asset.id DESC LIMIT 120",
    ].join(" "), loginCustomerId, "ad asset view"),
    loadCriteria(),
  ]);

  for (const row of campaignMetaRows) {
    const campaign = (row.campaign || {}) as Record<string, unknown>;
    const budget = (row.campaignBudget || {}) as Record<string, unknown>;
    channelSubType = String(campaign.advertisingChannelSubType || "").trim() || undefined;
    const amount = Number(budget.amountMicros || 0);
    if (amount > 0) budgetAmountMicros = amount;
    const shopping = (campaign.shoppingSetting || {}) as { merchantId?: string | number };
    const hotel = (campaign.hotelSetting || {}) as { hotelCenterId?: string | number };
    if (shopping.merchantId) pushUniqueCopy(verticalSignals, "shopping retail ecommerce merchant");
    if (hotel.hotelCenterId) pushUniqueCopy(verticalSignals, "hotels hospitality lodging");
    pushUniqueCopy(verticalSignals, campaign.advertisingChannelType);
    pushUniqueCopy(verticalSignals, campaign.advertisingChannelSubType);
  }

  for (const row of adGroupRows) {
    const adGroup = (row.adGroup || {}) as Record<string, unknown>;
    const id = String(adGroup.id || "").trim();
    if (!id) continue;
    adGroupsById.set(id, {
      id,
      name: String(adGroup.name || "").trim() || `Ad group ${id}`,
      status: String(adGroup.status || ""),
      type: String(adGroup.type || ""),
    });
    pushUniqueCopy(verticalSignals, adGroup.name);
  }

  for (const row of adRows) {
    const parsed = parseImportedAdRow(row);
    if (!parsed) continue;
    if (parsed.landingUrl) {
      if (!landingUrl) landingUrl = parsed.landingUrl;
      const existing = parsed.adGroupId ? adGroupsById.get(parsed.adGroupId) : undefined;
      if (existing && !existing.landingUrl) {
        adGroupsById.set(parsed.adGroupId!, { ...existing, landingUrl: parsed.landingUrl });
      }
    }
    pushImportedCreative(creatives, seenCreativeIds, parsed);
    String(parsed.description || "").split(" | ").forEach((part) => pushUniqueCopy(adCopyDescriptions, part));
    String(parsed.headline || "").split(" | ").forEach((part) => pushUniqueCopy(adCopyHeadlines, part));
  }

  for (const row of assetGroupRows) {
    const assetGroup = (row.assetGroup || {}) as Record<string, unknown>;
    const id = String(assetGroup.id || "").trim();
    if (!id) continue;
    const url = firstUrl(assetGroup.finalUrls);
    if (!landingUrl && url) landingUrl = url;
    const existing = adGroupsById.get(id);
    adGroupsById.set(id, {
      id,
      name: String(assetGroup.name || existing?.name || "").trim() || `Asset group ${id}`,
      status: String(assetGroup.status || existing?.status || ""),
      type: existing?.type || "ASSET_GROUP",
      landingUrl: existing?.landingUrl || url,
    });
  }

  for (const row of assetRows) {
    const assetGroup = (row.assetGroup || {}) as Record<string, unknown>;
    const asset = (row.asset || {}) as Record<string, unknown>;
    const link = (row.assetGroupAsset || {}) as Record<string, unknown>;
    const fieldType = String(link.fieldType || "").toUpperCase();
    const assetId = String(asset.id || "").trim();
    const textAsset = (asset.textAsset || {}) as { text?: string };
    const imageAsset = (asset.imageAsset || {}) as { fullSize?: { url?: string } };
    const youtube = (asset.youtubeVideoAsset || {}) as { youtubeVideoId?: string };
    const text = String(textAsset.text || "").trim();
    const imageUrl = String(imageAsset.fullSize?.url || "").trim();
    const youtubeId = String(youtube.youtubeVideoId || "").trim();
    const adGroupId = String(assetGroup.id || "").trim() || undefined;

    if (text && /HEADLINE|DESCRIPTION|BUSINESS/.test(fieldType)) {
      if (fieldType.includes("DESCRIPTION")) pushUniqueCopy(adCopyDescriptions, text);
      else pushUniqueCopy(adCopyHeadlines, text);
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-asset-${assetId || creatives.length + 1}`,
        name: text,
        type: "text",
        headline: /HEADLINE|BUSINESS/.test(fieldType) ? text : undefined,
        description: fieldType.includes("DESCRIPTION") ? text : undefined,
        adGroupId,
        source: "google_ads",
      });
    } else if (imageUrl) {
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-image-${assetId || creatives.length + 1}`,
        name: String(asset.name || fieldType || `Image ${assetId}`),
        type: "image",
        previewUrl: imageUrl,
        adGroupId,
        source: "google_ads",
      });
    } else if (youtubeId) {
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-video-${youtubeId}`,
        name: String(asset.name || "YouTube video"),
        type: "video",
        previewUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        adGroupId,
        source: "google_ads",
      });
    }
  }

  for (const row of adAssetRows) {
    const adGroup = (row.adGroup || {}) as Record<string, unknown>;
    const ad = ((row.adGroupAd || {}) as { ad?: Record<string, unknown> }).ad || {};
    const asset = (row.asset || {}) as Record<string, unknown>;
    const link = (row.adGroupAdAssetView || {}) as Record<string, unknown>;
    const fieldType = String(link.fieldType || "").toUpperCase();
    const adGroupId = String(adGroup.id || "").trim();
    if (adGroupId && !adGroupsById.has(adGroupId)) {
      adGroupsById.set(adGroupId, {
        id: adGroupId,
        name: String(adGroup.name || "").trim() || `Ad group ${adGroupId}`,
        type: String(adGroup.type || ""),
      });
    }
    const url = firstUrl(ad.finalUrls);
    if (url) {
      if (!landingUrl) landingUrl = url;
      const existing = adGroupId ? adGroupsById.get(adGroupId) : undefined;
      if (existing && !existing.landingUrl) {
        adGroupsById.set(adGroupId, { ...existing, landingUrl: url });
      }
    }

    const assetId = String(asset.id || "").trim();
    const textAsset = (asset.textAsset || {}) as { text?: string };
    const imageAsset = (asset.imageAsset || {}) as { fullSize?: { url?: string } };
    const youtube = (asset.youtubeVideoAsset || {}) as { youtubeVideoId?: string };
    const text = String(textAsset.text || "").trim();
    const imageUrl = String(imageAsset.fullSize?.url || "").trim();
    const youtubeId = String(youtube.youtubeVideoId || "").trim();

    if (imageUrl) {
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-image-${assetId || creatives.length + 1}`,
        name: String(asset.name || fieldType || `Image ${assetId}`),
        type: "image",
        previewUrl: imageUrl,
        adGroupId: adGroupId || undefined,
        landingUrl: url,
        source: "google_ads",
      });
    } else if (youtubeId) {
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-video-${youtubeId}`,
        name: String(asset.name || "YouTube video"),
        type: "video",
        previewUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        adGroupId: adGroupId || undefined,
        source: "google_ads",
      });
    } else if (text && /HEADLINE|DESCRIPTION|BUSINESS/.test(fieldType) && !creatives.some((item) => item.adGroupId === adGroupId && item.type === "text")) {
      if (fieldType.includes("DESCRIPTION")) pushUniqueCopy(adCopyDescriptions, text);
      else pushUniqueCopy(adCopyHeadlines, text);
      pushImportedCreative(creatives, seenCreativeIds, {
        id: `gads-ad-asset-${assetId || creatives.length + 1}`,
        name: text,
        type: "text",
        headline: /HEADLINE|BUSINESS/.test(fieldType) ? text : undefined,
        description: fieldType.includes("DESCRIPTION") ? text : undefined,
        adGroupId: adGroupId || undefined,
        landingUrl: url,
        source: "google_ads",
      });
    }
  }

  for (const row of criterionRows) {
    const criterion = (row.campaignCriterion || {}) as Record<string, unknown>;
    const keyword = (criterion.keyword || {}) as { text?: string };
    const topic = (criterion.topic || {}) as { path?: unknown };
    const interest = (criterion.userInterest || {}) as { userInterestCategory?: string };
    pushUniqueCopy(verticalSignals, keyword.text);
    pushUniqueCopy(verticalSignals, criterion.displayName);
    if (Array.isArray(topic.path)) {
      pushUniqueCopy(verticalSignals, topic.path.map((part) => String(part || "")).filter(Boolean).join(" "));
    }
    pushUniqueCopy(verticalSignals, interest.userInterestCategory);
  }

  const adGroups = Array.from(adGroupsById.values());
  return {
    landingUrl,
    adGroupCount: adGroups.length,
    adGroups,
    creatives,
    channelSubType,
    budgetAmountMicros,
    adCopyDescriptions,
    adCopyHeadlines,
    verticalSignals,
  };
}

async function createGoogleAdsBudget(accessToken: string, customerId: string, campaignName: string, amountMicros: number) {
  const cid = cleanCustomerId(customerId);
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/campaignBudgets:mutate`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({
      operations: [
        {
          create: {
            name: `${campaignName} Budget ${Date.now()}`,
            amountMicros: Math.max(50_000, Math.floor(amountMicros)),
            deliveryMethod: "STANDARD",
          },
        },
      ],
    }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { results?: Array<{ resourceName?: string }> };
  const resourceName = payload?.results?.[0]?.resourceName || "";
  if (!resourceName) throw new Error("Google Ads budget creation returned no resource name.");
  return resourceName;
}

export async function createGoogleAdsCampaign(accessToken: string, input: GoogleAdsCreateCampaignInput): Promise<GoogleAdsCampaign> {
  const cid = cleanCustomerId(input.customerId);
  const name = input.campaignName.trim();
  if (!name) throw new Error("campaignName is required.");

  const budgetResourceName = await createGoogleAdsBudget(accessToken, cid, name, input.amountMicros);
  const advertisingChannelType = input.advertisingChannelType || "DISPLAY";
  const status = input.status || "PAUSED";

  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/campaigns:mutate`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({
      operations: [
        {
          create: {
            name,
            status,
            advertisingChannelType,
            campaignBudget: budgetResourceName,
            targetSpend: {},
          },
        },
      ],
    }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { results?: Array<{ resourceName?: string }> };
  const resourceName = payload?.results?.[0]?.resourceName || "";
  const id = resourceName.split("/").pop() || "";

  return {
    id,
    name,
    status,
    channelType: advertisingChannelType,
    budgetAmountMicros: Math.max(50_000, Math.floor(input.amountMicros)),
    startDate: "",
    endDate: "",
    suggestedGoal: mapChannelToGoal(advertisingChannelType),
  };
}
