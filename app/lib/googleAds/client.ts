const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v21";
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
};

export type GoogleAdsCampaign = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budgetAmountMicros: number;
  startDate: string;
  endDate: string;
  suggestedGoal: string;
  sourceType?: "published" | "draft";
  draftId?: string;
  channelSummary?: string;
};

export type GoogleAdsCampaignImportDetails = {
  landingUrl?: string;
  adGroupCount?: number;
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

function optionalLoginCustomerId(): string | undefined {
  const value = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim();
  if (!value) return undefined;
  return value.replace(/-/g, "");
}

function cleanCustomerId(input: string): string {
  return String(input || "").replace(/[^0-9]/g, "");
}

function ensureOk(response: Response, body: string) {
  if (!response.ok) {
    throw new Error(`Google Ads request failed (${response.status}): ${body.slice(0, 400)}`);
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

function buildGoogleAdsHeaders(accessToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": requiredEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
    "Content-Type": "application/json",
  };

  const loginCustomerId = optionalLoginCustomerId();
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

export async function listAccessibleCustomerResourceNames(accessToken: string): Promise<string[]> {
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers`, {
    method: "GET",
    headers: buildGoogleAdsHeaders(accessToken),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as { resourceNames?: string[] };
  return Array.isArray(payload.resourceNames) ? payload.resourceNames : [];
}

export async function getGoogleAdsAccountDetails(accessToken: string, customerId: string): Promise<GoogleAdsAccount> {
  const cid = cleanCustomerId(customerId);
  const query = "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1";
  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
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
  };
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

export async function listGoogleAdsCampaigns(accessToken: string, customerId: string, limit = 50): Promise<GoogleAdsCampaign[]> {
  const cid = cleanCustomerId(customerId);
  const query = [
    "SELECT",
    "campaign.id,",
    "campaign.name,",
    "campaign.status,",
    "campaign.advertising_channel_type,",
    "campaign.start_date,",
    "campaign.end_date,",
    "campaign_budget.amount_micros",
    "FROM campaign",
    `ORDER BY campaign.id DESC LIMIT ${Math.max(1, Math.min(limit, 200))}`,
  ].join(" ");

  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as {
    results?: Array<{
      campaign?: Record<string, unknown>;
      campaignBudget?: Record<string, unknown>;
    }>;
  };

  const rows = Array.isArray(payload.results) ? payload.results : [];
  return rows.map((row) => {
    const campaign = row.campaign || {};
    const budget = row.campaignBudget || {};
    const channel = String((campaign.advertisingChannelType as string) || "");
    return {
      id: String((campaign.id as string) || ""),
      name: String((campaign.name as string) || "Untitled Campaign"),
      status: String((campaign.status as string) || ""),
      channelType: channel,
      budgetAmountMicros: Number((budget.amountMicros as number) || 0),
      startDate: String((campaign.startDate as string) || ""),
      endDate: String((campaign.endDate as string) || ""),
      suggestedGoal: mapChannelToGoal(channel),
      sourceType: "published",
      channelSummary: buildChannelSummary(channel),
    };
  });
}

export async function listGoogleAdsDraftCampaigns(accessToken: string, customerId: string, limit = 50): Promise<GoogleAdsCampaign[]> {
  const cid = cleanCustomerId(customerId);
  const query = [
    "SELECT",
    "campaign_draft.id,",
    "campaign_draft.name,",
    "campaign_draft.draft_campaign,",
    "campaign_draft.base_campaign",
    "FROM campaign_draft",
    `ORDER BY campaign_draft.id DESC LIMIT ${Math.max(1, Math.min(limit, 200))}`,
  ].join(" ");

  const response = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  ensureOk(response, text);
  const payload = JSON.parse(text) as {
    results?: Array<{
      campaignDraft?: Record<string, unknown>;
    }>;
  };

  const publishedCampaigns = await listGoogleAdsCampaigns(accessToken, cid, limit);
  const publishedById = new Map(publishedCampaigns.map((campaign) => [campaign.id, campaign]));
  const rows = Array.isArray(payload.results) ? payload.results : [];

  return rows.map((row) => {
    const draft = row.campaignDraft || {};
    const draftCampaignId = parseResourceId(draft.draftCampaign);
    const baseCampaignId = parseResourceId(draft.baseCampaign);
    const linkedPublished = publishedById.get(draftCampaignId) || publishedById.get(baseCampaignId);
    const channelType = linkedPublished?.channelType || "";

    return {
      id: draftCampaignId || String((draft.id as string) || ""),
      name: String((draft.name as string) || linkedPublished?.name || "Untitled Draft Campaign"),
      status: "Draft",
      channelType,
      budgetAmountMicros: Number(linkedPublished?.budgetAmountMicros || 0),
      startDate: String(linkedPublished?.startDate || ""),
      endDate: String(linkedPublished?.endDate || ""),
      suggestedGoal: mapChannelToGoal(channelType),
      sourceType: "draft",
      draftId: String((draft.id as string) || ""),
      channelSummary: buildChannelSummary(channelType),
    };
  });
}

export async function getGoogleAdsCampaignImportDetails(
  accessToken: string,
  customerId: string,
  campaignId: string,
): Promise<GoogleAdsCampaignImportDetails> {
  const cid = cleanCustomerId(customerId);
  const campaignKey = String(campaignId || "").trim();
  if (!cid || !campaignKey) return {};

  const adGroupQuery = [
    "SELECT",
    "ad_group.id",
    "FROM ad_group",
    `WHERE campaign.id = ${campaignKey}`,
    "ORDER BY ad_group.id DESC LIMIT 500",
  ].join(" ");

  const adGroupResponse = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({ query: adGroupQuery }),
  });
  const adGroupText = await adGroupResponse.text();
  ensureOk(adGroupResponse, adGroupText);
  const adGroupPayload = JSON.parse(adGroupText) as {
    results?: Array<{ adGroup?: Record<string, unknown> }>;
  };

  const adGroupCount = Array.isArray(adGroupPayload.results) ? adGroupPayload.results.length : 0;

  const landingUrlQuery = [
    "SELECT",
    "ad_group_ad.ad.final_urls",
    "FROM ad_group_ad",
    `WHERE campaign.id = ${campaignKey}`,
    "ORDER BY ad_group_ad.ad.id DESC LIMIT 20",
  ].join(" ");

  const landingResponse = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${cid}/googleAds:search`, {
    method: "POST",
    headers: buildGoogleAdsHeaders(accessToken),
    body: JSON.stringify({ query: landingUrlQuery }),
  });
  const landingText = await landingResponse.text();
  ensureOk(landingResponse, landingText);
  const landingPayload = JSON.parse(landingText) as {
    results?: Array<{ adGroupAd?: { ad?: Record<string, unknown> } }>;
  };

  const landingUrl = (landingPayload.results || [])
    .map((row) => row?.adGroupAd?.ad?.finalUrls)
    .find((value) => Array.isArray(value) && value[0])?.[0];

  return {
    landingUrl: typeof landingUrl === "string" ? landingUrl : undefined,
    adGroupCount,
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
