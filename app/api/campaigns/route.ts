import { NextRequest, NextResponse } from "next/server";
import {
  createWritableSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
  isSupabaseConfigured,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";
import {
  getGoogleAdsCampaignImportDetails,
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import { resolveGoogleAdsWorkspace } from "@/app/lib/googleAds/resolveAccount";
import {
  type GoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";
import type { CampaignIdOption } from "@/app/lib/campaignSnapshot";
import { isAnalyzerPlatform, type AnalyzerPlatform } from "@/app/lib/platforms/types";
import {
  buildGoogleAdsImportedSnapshot,
  selectGoogleAdsCampaignCandidate,
} from "@/app/lib/googleAds/importSnapshot";
import { persistImportedGoogleAdsCampaign } from "@/app/lib/googleAds/persistImportedCampaign";

export const runtime = "nodejs";

export {
  buildGoogleAdsImportedSnapshot,
  mapGoogleAdsChannelToCampaignType,
  selectGoogleAdsCampaignCandidate,
} from "@/app/lib/googleAds/importSnapshot";

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

function normalizePlatform(value: unknown): AnalyzerPlatform {
  const platform = String(value || "programmatic");
  return isAnalyzerPlatform(platform) ? platform : "programmatic";
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
  if (!accessToken) return { campaign: null, refreshedSession, customerId: "", accessToken: "", loginCustomerId: undefined as string | undefined };

  const preferredCustomerId = String(request.nextUrl.searchParams.get("customerId") || "").trim();
  const workspace = await resolveGoogleAdsWorkspace(accessToken, preferredCustomerId, 200);
  const published = workspace.campaigns.filter((entry) => entry.sourceType !== "draft");
  const drafts = workspace.campaigns.filter((entry) => entry.sourceType === "draft");
  const campaign = selectGoogleAdsCampaignCandidate(published, drafts, campaignName, campaignId);
  const customerId = campaign?.customerId || workspace.customerId || preferredCustomerId;

  return {
    campaign,
    refreshedSession,
    customerId,
    accessToken,
    loginCustomerId: campaign?.loginCustomerId || workspace.loginCustomerId,
  };
}

async function listGoogleAdsCampaignIdOptions(request: NextRequest, campaignName: string) {
  const { accessToken, refreshedSession } = await resolveGoogleAdsAccessToken(request);
  if (!accessToken) return { options: [], refreshedSession };

  const preferredCustomerId = String(request.nextUrl.searchParams.get("customerId") || "").trim();
  const workspace = await resolveGoogleAdsWorkspace(accessToken, preferredCustomerId, 200);
  const normalizedName = campaignName.trim().toLowerCase();
  const options: CampaignIdOption[] = workspace.campaigns
    .filter((campaign) => campaign.name.trim().toLowerCase().includes(normalizedName))
    .map((campaign) => ({
      id: campaign.id,
      campaignName: campaign.name,
      platform: "google_ads" as const,
      updatedAt: new Date().toISOString(),
    }));

  return { options, refreshedSession };
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
    const supabase = supabaseReady ? createWritableSupabaseClient(token) : null;
    let refreshedGoogleAdsSession: GoogleAdsSession | null = null;

    if (campaignId && campaignName) {
      if (!supabase && platform === "google_ads") {
        const { campaign, refreshedSession, customerId, accessToken, loginCustomerId } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
        refreshedGoogleAdsSession = refreshedSession;
        if (campaign) {
          const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id, loginCustomerId);
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
        const { campaign, refreshedSession, customerId, accessToken, loginCustomerId } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
        refreshedGoogleAdsSession = refreshedSession;
        if (campaign) {
          const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id, loginCustomerId);
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

      const { campaign, refreshedSession, customerId, accessToken, loginCustomerId } = await findGoogleAdsCampaignByNameOrId(request, campaignName, campaignId);
      refreshedGoogleAdsSession = refreshedSession;
      if (!campaign) {
        const response = json(true, null, null, 200);
        if (refreshedGoogleAdsSession) {
          writeGoogleAdsSession(response, refreshedGoogleAdsSession);
        }
        return response;
      }

      const importDetails = await getGoogleAdsCampaignImportDetails(accessToken, customerId, campaign.id, loginCustomerId);
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
        platform: normalizePlatform(row.platform),
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

    const supabase = createWritableSupabaseClient(token);

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
