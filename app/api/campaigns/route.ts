import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
  isSupabaseConfigured,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";
import {
  getGoogleAdsCampaignImportDetails,
  listAccessibleCustomerResourceNames,
  listGoogleAdsCampaigns,
  listGoogleAdsDraftCampaigns,
  refreshGoogleAdsAccessToken,
  type GoogleAdsCampaign,
} from "@/app/lib/googleAds/client";
import {
  type GoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";
import type { CampaignSnapshot, CampaignIdOption } from "@/app/lib/campaignSnapshot";

export const runtime = "nodejs";

const VALID_PLATFORMS = new Set(["google_ads", "meta_ads", "programmatic"]);

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

function normalizePlatform(value: unknown): string {
  const platform = String(value || "programmatic");
  return VALID_PLATFORMS.has(platform) ? platform : "programmatic";
}

function mapGoogleAdsChannelToCampaignType(channelType: string): "display" | "video" {
  return channelType === "VIDEO" ? "video" : "display";
}

function inferVerticalFromGoogleCampaignName(campaignName: string): string {
  const normalized = campaignName.toLowerCase();
  if (/health|medical|clinic|pharma/.test(normalized)) return "healthcare";
  if (/travel|hotel|trip|tour/.test(normalized)) return "travel";
  if (/fashion|apparel|clothing|style/.test(normalized)) return "fashion";
  if (/shop|store|retail|ecom|sale|product/.test(normalized)) return "ecommerce";
  if (/finance|bank|loan|credit|fintech/.test(normalized)) return "finance";
  if (/food|restaurant|delivery|cafe/.test(normalized)) return "food";
  if (/game|gaming|esports/.test(normalized)) return "gaming";
  if (/education|course|school|edtech/.test(normalized)) return "education";
  if (/car|auto|automotive/.test(normalized)) return "automotive";
  if (/real estate|property|housing/.test(normalized)) return "real_estate";
  return "technology";
}

function inferProductFocusFromGoogleCampaignName(campaignName: string): string {
  return campaignName
    .replace(/\b(q[1-4]|awareness|traffic|conversion|leads?|campaign|google ads|display|video|search)\b/gi, "")
    .replace(/[\-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function buildGoogleAdsImportedSnapshot(
  campaign: GoogleAdsCampaign,
  userId: string,
  customerId: string,
  details: { landingUrl?: string; adGroupCount?: number },
): CampaignSnapshot {
  const timestamp = new Date().toISOString();
  const inferredVertical = inferVerticalFromGoogleCampaignName(campaign.name);
  const inferredProductFocus = inferProductFocusFromGoogleCampaignName(campaign.name);

  return {
    id: campaign.id,
    platform: "google_ads",
    ownerId: userId,
    campaignName: campaign.name,
    campaignBrief: "",
    vertical: inferredVertical,
    landingUrl: details.landingUrl || "",
    campaignGoal: campaign.suggestedGoal || "awareness",
    campaignAudienceStage: "cold",
    campaignProductFocus: inferredProductFocus,
    campaignTaskType: "campaign_setup",
    creatives: [],
    analysisResult: null,
    urlValidation: null,
    viewMode: "multiple",
    showSlotLabels: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    googleCampaignType: mapGoogleAdsChannelToCampaignType(campaign.channelType),
    googleAdGroupCount: details.adGroupCount ?? "",
    googleAdsCustomerId: customerId,
    googleAdsCampaignStatus: campaign.status,
    googleAdsChannelType: campaign.channelType,
    googleAdsChannelSummary: campaign.channelSummary || campaign.channelType,
    googleAdsCampaignSource: campaign.sourceType || "published",
    googleAdsDraftId: campaign.draftId,
    googleAdsBudgetAmountMicros: campaign.budgetAmountMicros,
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

async function resolveGoogleAdsAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) {
    return { accessToken: null as string | null, refreshedSession: null as typeof session | null };
  }

  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon || !session.refreshToken) {
    return { accessToken: session.accessToken, refreshedSession: null };
  }

  const refreshed = await refreshGoogleAdsAccessToken(session.refreshToken);
  return {
    accessToken: refreshed.access_token,
    refreshedSession: {
      ...session,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || session.refreshToken,
      expiryAt: Date.now() + ((refreshed.expires_in || 3600) * 1000),
      scope: refreshed.scope || session.scope,
      tokenType: refreshed.token_type || session.tokenType,
    },
  };
}

async function findGoogleAdsCampaignByNameOrId(request: NextRequest, campaignName: string, campaignId = "") {
  const { accessToken, refreshedSession } = await resolveGoogleAdsAccessToken(request);
  if (!accessToken) return { campaign: null, refreshedSession, customerId: "", accessToken: "" };

  let customerId = String(request.nextUrl.searchParams.get("customerId") || "").trim();
  if (!customerId) {
    const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
    customerId = resourceNames[0]?.split("/")[1] || "";
  }
  if (!customerId) return { campaign: null as GoogleAdsCampaign | null, refreshedSession: null as GoogleAdsSession | null, customerId: "", accessToken };

  const campaigns = await listGoogleAdsCampaigns(accessToken, customerId, 200);
  const drafts = await listGoogleAdsDraftCampaigns(accessToken, customerId, 200);
  const campaign = selectGoogleAdsCampaignCandidate(campaigns, drafts, campaignName, campaignId);

  return { campaign, refreshedSession, customerId, accessToken };
}

async function listGoogleAdsCampaignIdOptions(request: NextRequest, campaignName: string) {
  const { accessToken, refreshedSession } = await resolveGoogleAdsAccessToken(request);
  if (!accessToken) return { options: [], refreshedSession };

  let customerId = String(request.nextUrl.searchParams.get("customerId") || "").trim();
  if (!customerId) {
    const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
    customerId = resourceNames[0]?.split("/")[1] || "";
  }
  if (!customerId) return { options: [] as CampaignIdOption[], refreshedSession };

  const normalizedName = campaignName.trim().toLowerCase();
  const campaigns = await listGoogleAdsCampaigns(accessToken, customerId, 200);
  const drafts = await listGoogleAdsDraftCampaigns(accessToken, customerId, 200);
  const options = [...campaigns, ...drafts]
    .filter((campaign) => campaign.name.trim().toLowerCase().includes(normalizedName))
    .map((campaign) => ({
      id: campaign.id,
      campaignName: campaign.name,
      platform: "google_ads",
      updatedAt: new Date().toISOString(),
    }));

  return { options, refreshedSession };
}

async function persistImportedGoogleAdsCampaign(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  snapshot: CampaignSnapshot,
) {
  const { data: existing } = await supabase
    .from("campaigns")
    .select("id")
    .eq("user_id", userId)
    .eq("id", snapshot.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("campaigns")
      .update({
        platform: "google_ads",
        campaign_name: snapshot.campaignName,
        snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", snapshot.id)
      .eq("user_id", userId);
    return;
  }

  await supabase.from("campaigns").insert({
    id: snapshot.id,
    user_id: userId,
    platform: "google_ads",
    campaign_name: snapshot.campaignName,
    snapshot,
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const campaignName = String(request.nextUrl.searchParams.get("campaign_name") || "").trim();
    const campaignId = String(request.nextUrl.searchParams.get("campaign_id") || "").trim();
    const platformFilter = request.nextUrl.searchParams.get("platform");
    const platform = platformFilter ? normalizePlatform(platformFilter) : null;

    const supabaseReady = isSupabaseConfigured();
    const supabase = supabaseReady ? createServerSupabaseClient(token) : null;
    let refreshedGoogleAdsSession: GoogleAdsSession | null = null;

    if (campaignId && campaignName) {
      if (!supabase && platform === "google_ads") {
        const { campaign, refreshedSession, customerId, accessToken } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
        refreshedGoogleAdsSession = refreshedSession;
        if (campaign) {
          const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id);
          const imported = buildGoogleAdsImportedSnapshot(campaign, user.id, customerId, importDetails);
          const response = json(true, imported, null, 200);
          if (refreshedGoogleAdsSession) {
            writeGoogleAdsSession(response, refreshedGoogleAdsSession);
          }
          return response;
        }
        return json(true, null, null, 200);
      }

      let data: Awaited<ReturnType<NonNullable<typeof supabase>["from"]>> extends never ? never : any = null;
      if (supabase) {
        let query = supabase
          .from("campaigns")
          .select("id, platform, campaign_name, snapshot, created_at, updated_at")
          .eq("user_id", user.id)
          .eq("id", campaignId)
          .ilike("campaign_name", campaignName);

        if (platform) query = query.eq("platform", platform);

        const { data: dbData, error } = await query.maybeSingle();

        if (error) {
          if (isSchemaUnavailableError(error)) {
            return json(true, null, null, 200);
          }
          return json(false, null, error.message, 400);
        }
        data = dbData;
      }

      if (!data && platform === "google_ads") {
        const { campaign, refreshedSession, customerId, accessToken } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
        refreshedGoogleAdsSession = refreshedSession;
        if (campaign) {
          const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id);
          const imported = buildGoogleAdsImportedSnapshot(campaign, user.id, customerId, importDetails);
          if (supabase) {
            await persistImportedGoogleAdsCampaign(supabase, user.id, imported);
          }
          console.info("[Adigator] Google Ads campaign imported", {
            source: imported.googleAdsCampaignSource || "published",
            campaignId: imported.id,
            campaignName: imported.campaignName,
          });
          const response = json(true, imported, null, 200);
          if (refreshedGoogleAdsSession) {
            writeGoogleAdsSession(response, refreshedGoogleAdsSession);
          }
          return response;
        }
      }

      if (!data) return json(true, null, null, 200);
      return json(true, {
        ...(data.snapshot as Record<string, unknown>),
        id: data.id,
        platform: data.platform,
        campaignName: data.campaign_name,
        ownerId: user.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }, null, 200);
    }

    if (platform === "google_ads" && (campaignId || campaignName)) {
      const resolvedAccess = await resolveGoogleAdsAccessToken(request);
      if (!resolvedAccess.accessToken) {
        return json(false, null, "Google Ads account is not connected. Connect Google Ads and try again.", 400);
      }

      const { campaign, refreshedSession, customerId, accessToken } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
      refreshedGoogleAdsSession = refreshedSession;
      if (!campaign) {
        const response = json(true, null, null, 200);
        if (refreshedGoogleAdsSession) {
          writeGoogleAdsSession(response, refreshedGoogleAdsSession);
        }
        return response;
      }

      const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id);
      const imported = buildGoogleAdsImportedSnapshot(campaign, user.id, customerId, importDetails);
      if (supabase) {
        await persistImportedGoogleAdsCampaign(supabase, user.id, imported);
      }
      console.info("[Adigator] Google Ads campaign imported", {
        source: imported.googleAdsCampaignSource || "published",
        campaignId: imported.id,
        campaignName: imported.campaignName,
      });
      const response = json(true, imported, null, 200);
      if (refreshedGoogleAdsSession) {
        writeGoogleAdsSession(response, refreshedGoogleAdsSession);
      }
      return response;
    }

    if (!campaignName) {
      return json(false, null, "campaign_name is required", 400);
    }

    let options: CampaignIdOption[] = [];
    if (supabase) {
      let listQuery = supabase
        .from("campaigns")
        .select("id, platform, campaign_name, updated_at")
        .eq("user_id", user.id)
        .ilike("campaign_name", campaignName)
        .order("updated_at", { ascending: false });

      if (platform) listQuery = listQuery.eq("platform", platform);

      const { data, error } = await listQuery;

      if (error) {
        if (isSchemaUnavailableError(error)) {
          return json(true, [], null, 200);
        }
        return json(false, null, error.message, 400);
      }

      options = (data || []).map((row) => ({
        id: row.id,
        campaignName: row.campaign_name,
        platform: row.platform,
        updatedAt: row.updated_at,
      }));
    }

    if (platform === "google_ads") {
      const { options: googleAdsOptions, refreshedSession } = await listGoogleAdsCampaignIdOptions(request, campaignName);
      refreshedGoogleAdsSession = refreshedSession;
      const merged = new Map<string, CampaignIdOption>();
      [...options, ...googleAdsOptions].forEach((option) => {
        merged.set(option.id, option);
      });
      options = Array.from(merged.values());
    }

    const response = json(true, options, null, 200);
    if (refreshedGoogleAdsSession) {
      writeGoogleAdsSession(response, refreshedGoogleAdsSession);
    }
    return response;
  } catch (error) {
    return json(false, null, error instanceof Error ? error.message : "Request failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const platform = normalizePlatform(body.platform);
    const campaignName = String(body.campaign_name || body.campaignName || "").trim();
    const snapshot = body.snapshot;

    if (!campaignName || !snapshot || typeof snapshot !== "object") {
      return json(false, null, "campaign_name and snapshot are required", 400);
    }

    const snapshotId = String((snapshot as Record<string, unknown>).id || "").trim();

    if (!isSupabaseConfigured()) {
      return json(true, {
        id: snapshotId || campaignName,
        platform,
        campaignName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, null, 200);
    }

    const supabase = createServerSupabaseClient(token);

    if (snapshotId) {
      const { data: existing } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", snapshotId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("campaigns")
          .update({
            platform,
            campaign_name: campaignName,
            snapshot,
            updated_at: new Date().toISOString(),
          })
          .eq("id", snapshotId)
          .eq("user_id", user.id)
          .select("id, platform, campaign_name, created_at, updated_at")
          .single();

        if (error) {
          if (isSchemaUnavailableError(error)) return json(true, snapshot, null, 200);
          return json(false, null, error.message, 400);
        }

        return json(true, {
          id: data.id,
          platform: data.platform,
          campaignName: data.campaign_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }, null, 200);
      }
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        platform,
        campaign_name: campaignName,
        snapshot: { ...snapshot, platform, ownerId: user.id },
      })
      .select("id, platform, campaign_name, created_at, updated_at")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) return json(true, snapshot, null, 200);
      return json(false, null, error.message, 400);
    }

    return json(true, {
      id: data.id,
      platform: data.platform,
      campaignName: data.campaign_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, null, 201);
  } catch (error) {
    return json(false, null, error instanceof Error ? error.message : "Request failed", 500);
  }
}
