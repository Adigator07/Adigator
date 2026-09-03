import { readMetaEnv, requiredMetaEnv } from "@/app/lib/metaAds/env";

const META_GRAPH_VERSION = readMetaEnv("META_GRAPH_API_VERSION") || "v21.0";
const META_AUTH_BASE = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`;
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export const DEFAULT_SCOPES = [
  "ads_management",
  "ads_read",
  "business_management",
];

const REQUIRED_ADS_PERMISSIONS = ["ads_read", "ads_management"];

export function missingMetaAdsPermissions(granted: string[]): string[] {
  const set = new Set(granted.map((value) => String(value || "").trim().toLowerCase()).filter(Boolean));
  if (set.has("ads_management") || set.has("ads_read")) return [];
  return REQUIRED_ADS_PERMISSIONS.filter((permission) => !set.has(permission));
}

export function metaAdsMissingPermissionMessage(detail = "", granted: string[] = []): string {
  const prefix = detail.trim() ? `${detail.trim()} ` : "";
  const grantedText = granted.length
    ? ` Current token permissions: ${granted.join(", ")}.`
    : "";
  const onlyProfile = granted.length > 0
    && granted.every((value) => ["public_profile", "email"].includes(value.toLowerCase()));
  if (onlyProfile) {
    return `${prefix}Meta signed you in, but it did not grant Ads Manager access (only ${granted.join(", ")}). Reconnect and wait until the Facebook screen lists Ads management / Ads read, then approve those. If that screen never appears, open App Dashboard → Permissions and features and add ads_read plus ads_management, then edit the Login for Business configuration and check those same permissions (or create a new configuration). The Facebook user must be an Admin/Developer/Tester on the app and an Admin on the ad account.`;
  }
  return `${prefix}Add ads_read, ads_management, and business_management to the Facebook Login for Business configuration, then Reconnect and approve every permission Meta shows. In App Dashboard → Marketing API, add the ad account while the app is in Development mode.${grantedText}`;
}

export type MetaAdsTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type MetaAdsAccount = {
  id: string;
  accountId: string;
  name: string;
  currency?: string;
  timeZone?: string;
  accountStatus?: number;
  businessId?: string;
  businessName?: string;
};

export type MetaAdsCampaign = {
  id: string;
  name: string;
  status: string;
  effectiveStatus?: string;
  objective?: string;
  adAccountId: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  startTime?: string;
  stopTime?: string;
  sourceType?: "published" | "draft";
};

export type MetaAdsImportedAdSet = {
  id: string;
  name: string;
  status?: string;
  optimizationGoal?: string;
  landingUrl?: string;
};

export type MetaAdsImportedCreative = {
  id: string;
  name: string;
  type: "text" | "image" | "video";
  previewUrl?: string;
  headline?: string;
  description?: string;
  adSetId?: string;
  landingUrl?: string;
  source: "meta_ads";
};

export type MetaAdsCampaignImportDetails = {
  landingUrl?: string;
  adSetCount?: number;
  adSets?: MetaAdsImportedAdSet[];
  creatives?: MetaAdsImportedCreative[];
  adCopyDescriptions?: string[];
  adCopyHeadlines?: string[];
  verticalSignals?: string[];
};

export type MetaAdsCreateCampaignInput = {
  adAccountId: string;
  campaignName: string;
  objective?: string;
  status?: "PAUSED" | "ACTIVE";
};

type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
  };
};

function getMetaAppId(): string {
  return requiredMetaEnv("META_APP_ID");
}

function getMetaAppSecret(): string {
  return requiredMetaEnv("META_APP_SECRET");
}

export function normalizeAdAccountId(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const digits = raw.replace(/^act_/i, "").replace(/\D/g, "");
  return digits ? `act_${digits}` : "";
}

export function adAccountDigits(value: string): string {
  return normalizeAdAccountId(value).replace(/^act_/i, "");
}

function extractGraphError(body: string): string {
  try {
    const parsed = JSON.parse(body) as GraphErrorBody;
    const err = parsed?.error;
    if (!err) return body.slice(0, 240);
    return err.error_user_msg || err.message || body.slice(0, 240);
  } catch {
    return body.slice(0, 240);
  }
}

async function graphRequest<T>(
  accessToken: string,
  path: string,
  options: {
    method?: "GET" | "POST";
    search?: Record<string, string>;
    body?: Record<string, string>;
    jsonBody?: Record<string, unknown>;
    wrapPermissionErrors?: boolean;
  } = {},
): Promise<T> {
  const url = new URL(`${META_GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(options.search || {})) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: options.jsonBody
      ? { "Content-Type": "application/json" }
      : options.method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : undefined,
    body: options.jsonBody
      ? JSON.stringify(options.jsonBody)
      : options.method === "POST" && options.body
        ? new URLSearchParams(options.body).toString()
        : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = extractGraphError(text);
    const prefix = `Meta Ads request failed (${response.status}) on ${path}: ${detail}`;
    if (
      options.wrapPermissionErrors !== false
      && (response.status === 403 || /#200|Missing Permissions/i.test(detail))
    ) {
      throw new Error(metaAdsMissingPermissionMessage(prefix));
    }
    throw new Error(prefix);
  }
  return JSON.parse(text) as T;
}

async function graphGetAll<T>(
  accessToken: string,
  path: string,
  search: Record<string, string>,
  limit = 80,
  wrapPermissionErrors = true,
): Promise<T[]> {
  const rows: T[] = [];
  let nextPath = path;
  let nextSearch: Record<string, string> | undefined = { ...search, limit: String(Math.min(limit, 100)) };

  while (nextPath && rows.length < limit) {
    const page: { data?: T[]; paging?: { next?: string } } = await graphRequest(accessToken, nextPath, {
      search: nextSearch,
      wrapPermissionErrors,
    });
    rows.push(...(page.data || []));
    if (!page.paging?.next || rows.length >= limit) break;
    const nextUrl: URL = new URL(page.paging.next);
    nextPath = nextUrl.pathname.replace(/^\/v\d+\.\d+/, "") || nextPath;
    nextSearch = Object.fromEntries(nextUrl.searchParams.entries());
    delete nextSearch.access_token;
  }

  return rows.slice(0, limit);
}

export function getMetaRedirectUri(origin: string): string {
  return readMetaEnv("META_REDIRECT_URI") || `${origin}/api/meta-ads/oauth/callback`;
}

export function buildMetaAdsAuthUrl(
  origin: string,
  state: string,
  options: { rerequest?: boolean; useLoginConfig?: boolean } = {},
): string {
  const clientId = getMetaAppId();
  const redirectUri = getMetaRedirectUri(origin);
  const configId = readMetaEnv("META_LOGIN_CONFIG_ID");
  const useLoginConfig = options.useLoginConfig === true;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: DEFAULT_SCOPES.join(","),
    auth_type: "rerequest",
  });
  // Login configurations that omit ads_* produce a public_profile-only token.
  // Adigator always requests Ads scopes. Attach config_id only when explicitly requested.
  if (useLoginConfig && configId) {
    params.set("config_id", configId);
    params.set("override_default_response_type", "true");
  }
  return `${META_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeMetaAdsCode(code: string, origin: string): Promise<MetaAdsTokenResponse> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", getMetaAppId());
  url.searchParams.set("client_secret", getMetaAppSecret());
  url.searchParams.set("redirect_uri", getMetaRedirectUri(origin));
  url.searchParams.set("code", code);
  const response = await fetch(url.toString());
  const text = await response.text();
  if (!response.ok) throw new Error(`Meta token exchange failed (${response.status}): ${extractGraphError(text)}`);
  return JSON.parse(text) as MetaAdsTokenResponse;
}

export async function exchangeMetaLongLivedToken(shortLivedToken: string): Promise<MetaAdsTokenResponse> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", getMetaAppId());
  url.searchParams.set("client_secret", getMetaAppSecret());
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const response = await fetch(url.toString());
  const text = await response.text();
  if (!response.ok) throw new Error(`Meta long-lived token exchange failed (${response.status}): ${extractGraphError(text)}`);
  return JSON.parse(text) as MetaAdsTokenResponse;
}

export async function fetchMetaProfile(accessToken: string): Promise<{ id: string; name?: string; email?: string }> {
  return graphRequest(accessToken, "/me", { search: { fields: "id,name" } });
}

export async function fetchMetaGrantedPermissions(accessToken: string): Promise<string[]> {
  const payload = await graphRequest<{ data?: Array<{ permission?: string; status?: string }> }>(
    accessToken,
    "/me/permissions",
    { wrapPermissionErrors: false },
  );
  return (payload.data || [])
    .filter((row) => String(row.status || "").toLowerCase() === "granted")
    .map((row) => String(row.permission || "").trim())
    .filter(Boolean);
}

async function grantedPermissionHint(accessToken: string): Promise<string[]> {
  try {
    return await fetchMetaGrantedPermissions(accessToken);
  } catch {
    return [];
  }
}

export async function assertMetaAdsApiPermissions(accessToken: string): Promise<string[]> {
  const granted = await fetchMetaGrantedPermissions(accessToken);
  const missing = missingMetaAdsPermissions(granted);
  if (missing.length) {
    throw new Error(metaAdsMissingPermissionMessage(`Missing Meta permissions: ${missing.join(", ")}.`));
  }
  return granted;
}

type MetaAdAccountRow = {
  id?: string;
  account_id?: string;
  name?: string;
  currency?: string;
  timezone_name?: string;
  account_status?: number;
  business?: { id?: string; name?: string };
};

function mapMetaAdAccount(row: MetaAdAccountRow, businessId?: string): MetaAdsAccount | null {
  const accountId = normalizeAdAccountId(row.id || row.account_id || "");
  if (!accountId) return null;
  return {
    id: accountId,
    accountId: adAccountDigits(accountId),
    name: String(row.name || accountId || "Meta ad account"),
    currency: row.currency,
    timeZone: row.timezone_name,
    accountStatus: row.account_status,
    businessId: row.business?.id || businessId,
    businessName: row.business?.name,
  };
}

async function listOwnedAdAccounts(accessToken: string, businessId: string): Promise<MetaAdsAccount[]> {
  const owned = await graphGetAll<MetaAdAccountRow>(accessToken, `/${businessId}/owned_ad_accounts`, {
    fields: "id,account_id,name,currency,timezone_name,account_status",
  }, 30, false);
  return owned.map((row) => mapMetaAdAccount(row, businessId)).filter((account): account is MetaAdsAccount => Boolean(account));
}

export async function listMetaAdAccounts(accessToken: string): Promise<MetaAdsAccount[]> {
  const preferred = normalizeAdAccountId(readMetaEnv("META_TEST_AD_ACCOUNT_ID"));
  const testBusinessId = readMetaEnv("META_TEST_BUSINESS_ID");
  const accounts: MetaAdsAccount[] = [];
  const seen = new Set<string>();

  const pushAll = (next: MetaAdsAccount[]) => {
    for (const account of next) {
      if (!account.id || seen.has(account.id)) continue;
      seen.add(account.id);
      accounts.push(account);
    }
  };

  let adAccountsError = "";
  try {
    const rows = await graphGetAll<MetaAdAccountRow>(accessToken, "/me/adaccounts", {
      fields: "id,account_id,name,currency,timezone_name,account_status",
    }, 50, false);
    pushAll(rows.map((row) => mapMetaAdAccount(row)).filter((account): account is MetaAdsAccount => Boolean(account)));
  } catch (error) {
    adAccountsError = error instanceof Error ? error.message : "GET /me/adaccounts failed.";
  }

  try {
    const businesses = await graphGetAll<{ id?: string }>(accessToken, "/me/businesses", { fields: "id" }, 20, false);
    const ids = [
      ...businesses.map((business) => String(business.id || "")).filter(Boolean),
      testBusinessId,
    ].filter((id, index, all) => id && all.indexOf(id) === index);
    for (const businessId of ids.slice(0, 8)) {
      try {
        pushAll(await listOwnedAdAccounts(accessToken, businessId));
      } catch {
        // Skip businesses this token cannot read.
      }
    }
  } catch {
    if (testBusinessId) {
      try {
        pushAll(await listOwnedAdAccounts(accessToken, testBusinessId));
      } catch {
        // Owned-account fallback is optional.
      }
    }
  }

  if (preferred && !seen.has(preferred)) {
    try {
      const row = await graphRequest<MetaAdAccountRow>(accessToken, `/${preferred}`, {
        search: { fields: "id,account_id,name,currency,timezone_name,account_status" },
        wrapPermissionErrors: false,
      });
      const mapped = mapMetaAdAccount(row);
      if (mapped) pushAll([mapped]);
    } catch {
      // Test ad account is only used when this user can actually read it.
    }
  }

  if (!accounts.length) {
    const granted = await grantedPermissionHint(accessToken);
    throw new Error(metaAdsMissingPermissionMessage(
      adAccountsError || "Meta returned no ad accounts for this login.",
      granted,
    ));
  }

  if (!preferred) return accounts;
  return [...accounts].sort((a, b) => Number(a.id === preferred) * -1 - Number(b.id === preferred) * -1);
}

const META_CAMPAIGN_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "PENDING_REVIEW",
  "DISAPPROVED",
  "PREAPPROVED",
  "PENDING_BILLING_INFO",
  "CAMPAIGN_PAUSED",
  "ARCHIVED",
  "ADSET_PAUSED",
  "IN_PROCESS",
  "WITH_ISSUES",
];

export function isMetaDraftCampaign(status?: string, configuredStatus?: string): boolean {
  const value = `${status || ""} ${configuredStatus || ""}`.toUpperCase();
  return /PAUSED|IN_PROCESS|PENDING_REVIEW|PREAPPROVED|WITH_ISSUES|DRAFT/.test(value);
}

function campaignFromGraphRow(
  row: {
    id?: string;
    name?: string;
    status?: string;
    effective_status?: string;
    objective?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
    stop_time?: string;
    configured_status?: string;
  },
  accountId: string,
): MetaAdsCampaign | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  const status = String(row.effective_status || row.status || "");
  return {
    id,
    name: String(row.name || "Untitled campaign"),
    status,
    effectiveStatus: row.effective_status,
    objective: row.objective,
    adAccountId: accountId,
    dailyBudget: row.daily_budget,
    lifetimeBudget: row.lifetime_budget,
    startTime: row.start_time,
    stopTime: row.stop_time,
    sourceType: isMetaDraftCampaign(status, row.configured_status) ? "draft" : "published",
  };
}

export function parseMetaDraftObjective(values: unknown): string | undefined {
  if (values == null) return undefined;
  if (typeof values === "string") {
    const text = values.trim();
    if (!text) return undefined;
    try {
      return parseMetaDraftObjective(JSON.parse(text));
    } catch {
      return undefined;
    }
  }
  if (typeof values !== "object") return undefined;
  const record = values as Record<string, unknown>;
  const nested = record.objective ?? record.campaign_objective ?? (record.campaign as Record<string, unknown> | undefined)?.objective;
  return nested ? String(nested) : undefined;
}

async function listPublishedMetaCampaigns(
  accessToken: string,
  accountId: string,
  limit: number,
): Promise<MetaAdsCampaign[]> {
  const fields = "id,name,status,effective_status,configured_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time";
  const attempts: Record<string, string>[] = [
    { fields, include_drafts: "true" },
    { fields },
    { fields, effective_status: JSON.stringify(META_CAMPAIGN_STATUSES), include_drafts: "true" },
  ];

  for (const search of attempts) {
    try {
      const rows = await graphGetAll<Parameters<typeof campaignFromGraphRow>[0]>(
        accessToken,
        `/${accountId}/campaigns`,
        search,
        limit,
        false,
      );
      return rows.map((row) => campaignFromGraphRow(row, accountId)).filter((campaign): campaign is MetaAdsCampaign => Boolean(campaign));
    } catch {
      // Try the next campaigns query shape.
    }
  }
  return [];
}

async function listUnpublishedMetaDraftCampaigns(
  accessToken: string,
  accountId: string,
): Promise<MetaAdsCampaign[]> {
  let drafts: Array<{ id?: string; name?: string; ad_object_id?: string }> = [];
  try {
    drafts = await graphGetAll(accessToken, `/${accountId}/addrafts`, {
      fields: "id,name,ad_object_id",
    }, 20, false);
  } catch {
    return [];
  }

  const campaigns: MetaAdsCampaign[] = [];
  const seen = new Set<string>();

  const pushDraft = (campaign: MetaAdsCampaign) => {
    const key = campaign.id || campaign.name;
    if (!key || seen.has(key)) return;
    seen.add(key);
    campaigns.push(campaign);
  };

  for (const draft of drafts.slice(0, 8)) {
    if (!draft.id) continue;
    let foundCampaignFragment = false;
    try {
      const fragments = await graphGetAll<{
        id?: string;
        name?: string;
        ad_object_id?: string;
        ad_object_type?: string;
        ad_object_name?: string;
        values?: unknown;
      }>(accessToken, `/${draft.id}/addraft_fragments`, {
        fields: "id,name,ad_object_id,ad_object_type,ad_object_name,values",
      }, 80, false);

      for (const fragment of fragments) {
        const type = String(fragment.ad_object_type || "").toUpperCase();
        if (type && !type.includes("CAMPAIGN")) continue;
        foundCampaignFragment = true;
        const id = String(fragment.ad_object_id || fragment.id || draft.ad_object_id || draft.id);
        pushDraft({
          id,
          name: String(fragment.ad_object_name || fragment.name || draft.name || "Untitled draft"),
          status: "DRAFT",
          objective: parseMetaDraftObjective(fragment.values),
          adAccountId: accountId,
          sourceType: "draft",
        });
      }
    } catch {
      foundCampaignFragment = false;
    }

    if (!foundCampaignFragment) {
      pushDraft({
        id: String(draft.ad_object_id || draft.id),
        name: String(draft.name || "Untitled draft"),
        status: "DRAFT",
        adAccountId: accountId,
        sourceType: "draft",
      });
    }
  }

  return campaigns;
}

export async function listMetaCampaigns(accessToken: string, adAccountId: string, limit = 80): Promise<MetaAdsCampaign[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  if (!accountId) throw new Error("adAccountId is required.");

  const published = await listPublishedMetaCampaigns(accessToken, accountId, limit);
  const unpublished = await listUnpublishedMetaDraftCampaigns(accessToken, accountId);
  const merged: MetaAdsCampaign[] = [];
  const seen = new Set<string>();
  for (const campaign of [...unpublished, ...published]) {
    if (!campaign.id || seen.has(campaign.id)) continue;
    seen.add(campaign.id);
    merged.push(campaign);
  }
  return merged.slice(0, limit);
}

export async function listMetaCampaignsAcrossAccounts(
  accessToken: string,
  preferredAdAccountId: string,
  limit = 80,
): Promise<{ adAccountId: string; campaigns: MetaAdsCampaign[] }> {
  const accounts = await listMetaAdAccounts(accessToken);
  const preferred = normalizeAdAccountId(preferredAdAccountId);
  const ordered = [
    ...accounts.filter((account) => account.id === preferred),
    ...accounts.filter((account) => account.id !== preferred),
  ];

  let lastReadable: { adAccountId: string; campaigns: MetaAdsCampaign[] } | null = null;
  let lastPermissionError: Error | null = null;
  for (const account of ordered.slice(0, 12)) {
    try {
      const campaigns = await listMetaCampaigns(accessToken, account.id, limit);
      lastReadable = { adAccountId: account.id, campaigns };
      if (campaigns.length) return lastReadable;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/#200|Missing Permissions/i.test(message)) throw error;
      lastPermissionError = error instanceof Error ? error : new Error(message);
    }
  }

  if (lastReadable) return lastReadable;
  if (lastPermissionError) throw lastPermissionError;
  return { adAccountId: ordered[0]?.id || "", campaigns: [] };
}

export async function getMetaCampaign(
  accessToken: string,
  adAccountId: string,
  campaignId: string,
): Promise<MetaAdsCampaign | null> {
  const campaigns = await listMetaCampaigns(accessToken, adAccountId, 120);
  return campaigns.find((campaign) => campaign.id === String(campaignId).trim()) || null;
}

function pushUnique(target: string[], value?: string | null) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return;
  if (target.some((item) => item.toLowerCase() === text.toLowerCase())) return;
  target.push(text);
}

function extractLandingUrl(creative: Record<string, unknown>): string {
  const story = (creative.object_story_spec || {}) as Record<string, unknown>;
  const linkData = (story.link_data || {}) as Record<string, unknown>;
  const videoData = (story.video_data || {}) as Record<string, unknown>;
  const callToAction = ((videoData.call_to_action || linkData.call_to_action || {}) as Record<string, unknown>).value as Record<string, unknown> | undefined;
  const feed = (creative.asset_feed_spec || {}) as Record<string, unknown>;
  const linkUrls = Array.isArray(feed.link_urls) ? feed.link_urls as Array<Record<string, unknown>> : [];
  return String(
    linkData.link
    || callToAction?.link
    || linkUrls[0]?.website_url
    || creative.link_url
    || "",
  ).trim();
}

export async function getMetaCampaignImportDetails(
  accessToken: string,
  campaignId: string,
): Promise<MetaAdsCampaignImportDetails> {
  const adSets = await graphGetAll<{
    id?: string;
    name?: string;
    status?: string;
    optimization_goal?: string;
    promoted_object?: { object_store_url?: string; page_id?: string };
  }>(accessToken, `/${campaignId}/adsets`, {
    fields: "id,name,status,optimization_goal,promoted_object",
  }, 50);

  const ads = await graphGetAll<{
    id?: string;
    name?: string;
    status?: string;
    adset_id?: string;
    creative?: Record<string, unknown>;
  }>(accessToken, `/${campaignId}/ads`, {
    fields: "id,name,status,adset_id,creative{id,name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,video_id}",
  }, 50);

  const adCopyHeadlines: string[] = [];
  const adCopyDescriptions: string[] = [];
  const verticalSignals: string[] = [];
  const creatives: MetaAdsImportedCreative[] = [];
  let landingUrl = "";

  const mappedAdSets: MetaAdsImportedAdSet[] = adSets.map((adSet) => {
    pushUnique(verticalSignals, adSet.name);
    return {
      id: String(adSet.id || ""),
      name: String(adSet.name || "Ad set"),
      status: adSet.status,
      optimizationGoal: adSet.optimization_goal,
      landingUrl: adSet.promoted_object?.object_store_url,
    };
  }).filter((adSet) => adSet.id);

  for (const ad of ads) {
    const creative = (ad.creative || {}) as Record<string, unknown>;
    const feed = (creative.asset_feed_spec || {}) as Record<string, unknown>;
    const titles = Array.isArray(feed.titles) ? feed.titles as Array<Record<string, unknown>> : [];
    const bodies = Array.isArray(feed.bodies) ? feed.bodies as Array<Record<string, unknown>> : [];
    const headline = String(creative.title || titles[0]?.text || ad.name || "").trim();
    const description = String(creative.body || bodies[0]?.text || "").trim();
    const previewUrl = String(creative.image_url || creative.thumbnail_url || "").trim();
    const url = extractLandingUrl(creative);
    if (!landingUrl && url) landingUrl = url;
    pushUnique(adCopyHeadlines, headline);
    pushUnique(adCopyDescriptions, description);
    pushUnique(verticalSignals, headline);
    pushUnique(verticalSignals, description);
    creatives.push({
      id: String(ad.id || creative.id || `meta-ad-${creatives.length + 1}`),
      name: String(ad.name || headline || "Meta ad"),
      type: creative.video_id ? "video" : previewUrl ? "image" : "text",
      previewUrl,
      headline,
      description,
      adSetId: String(ad.adset_id || ""),
      landingUrl: url,
      source: "meta_ads",
    });
  }

  if (!landingUrl) {
    landingUrl = mappedAdSets.find((adSet) => adSet.landingUrl)?.landingUrl || "";
  }

  return {
    landingUrl,
    adSetCount: mappedAdSets.length,
    adSets: mappedAdSets,
    creatives,
    adCopyDescriptions,
    adCopyHeadlines,
    verticalSignals,
  };
}

export function mapAdigatorObjectiveToMeta(objective?: string): string {
  switch (String(objective || "").trim()) {
    case "meta_traffic":
      return "OUTCOME_TRAFFIC";
    case "meta_engagement":
    case "meta_video_views":
      return "OUTCOME_ENGAGEMENT";
    case "meta_leads":
      return "OUTCOME_LEADS";
    case "meta_app_promotion":
      return "OUTCOME_APP_PROMOTION";
    case "meta_sales":
      return "OUTCOME_SALES";
    default:
      return "OUTCOME_AWARENESS";
  }
}

export async function createMetaCampaign(accessToken: string, input: MetaAdsCreateCampaignInput): Promise<MetaAdsCampaign> {
  const accountId = normalizeAdAccountId(input.adAccountId);
  const name = input.campaignName.trim();
  if (!accountId) throw new Error("adAccountId is required.");
  if (!name) throw new Error("campaignName is required.");

  const created = await graphRequest<{ id?: string }>(accessToken, `/${accountId}/campaigns`, {
    method: "POST",
    jsonBody: {
      name,
      objective: mapAdigatorObjectiveToMeta(input.objective),
      status: input.status || "PAUSED",
      special_ad_categories: [],
    },
  });
  const id = String(created.id || "");
  if (!id) throw new Error("Meta campaign creation returned no id.");

  return {
    id,
    name,
    status: input.status || "PAUSED",
    objective: mapAdigatorObjectiveToMeta(input.objective),
    adAccountId: accountId,
    sourceType: "draft",
  };
}
