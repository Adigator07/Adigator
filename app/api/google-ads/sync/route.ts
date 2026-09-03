import { NextRequest, NextResponse } from "next/server";
import { resolveGoogleAdsWorkspace } from "@/app/lib/googleAds/resolveAccount";
import {
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import {
  clearGoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";
import { buildGoogleAdsImportedSnapshot } from "@/app/lib/googleAds/importSnapshot";
import { persistImportedGoogleAdsCampaign } from "@/app/lib/googleAds/persistImportedCampaign";
import {
  createWritableSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
  isSupabaseConfigured,
} from "@/app/lib/supabaseServer";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";

export const runtime = "nodejs";

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) {
    return { accessToken: null as string | null, session, refreshedSession: null as typeof session | null };
  }

  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon || !session.refreshToken) {
    return { accessToken: session.accessToken, session, refreshedSession: null };
  }

  const refreshed = await refreshGoogleAdsAccessToken(session.refreshToken);
  return {
    accessToken: refreshed.access_token,
    session,
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

/**
 * Sync all published + draft Google Ads campaigns into Adigator.
 * Persists to Supabase when configured and returns snapshots for local storage.
 */
export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const requestedCustomerId = String(body.customerId || request.nextUrl.searchParams.get("customerId") || "").trim();
    const limitParam = Number(body.limit ?? request.nextUrl.searchParams.get("limit") ?? 100);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 100;

    const { accessToken, session, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) {
      return json(false, null, "Google Ads is not connected. Connect Google Ads in Settings first.", 401);
    }

    const workspace = await resolveGoogleAdsWorkspace(accessToken, requestedCustomerId, limit);
    const customerId = workspace.customerId || requestedCustomerId;
    if (!customerId && !workspace.campaigns.length) {
      return json(false, null, workspace.error || "No accessible Google Ads customer account was found.", 400);
    }

    const account = workspace.account;
    const uniqueCampaigns = workspace.campaigns;

    const supabase = isSupabaseConfigured() ? createWritableSupabaseClient(token) : null;
    const snapshots: CampaignSnapshot[] = [];
    const persistErrors: string[] = [];
    let persisted = 0;

    for (const campaign of uniqueCampaigns) {
      const campaignCustomerId = campaign.customerId || customerId;
      const snapshot = buildGoogleAdsImportedSnapshot(campaign, user.id, campaignCustomerId, {});
      snapshots.push(snapshot);

      if (supabase) {
        const result = await persistImportedGoogleAdsCampaign(supabase, user.id, snapshot);
        if (result.ok) {
          persisted += 1;
        } else if (result.error) {
          persistErrors.push(`${snapshot.campaignName}: ${result.error}`);
        }
      }
    }

    const response = json(
      true,
      {
        customerId: account?.customerId || customerId,
        account: account
          ? {
              name: account.name,
              currencyCode: account.currencyCode,
              timeZone: account.timeZone,
            }
          : null,
        email: (refreshedSession || session)?.email || null,
        total: snapshots.length,
        published: snapshots.filter((item) => item.googleAdsCampaignSource !== "draft").length,
        drafts: snapshots.filter((item) => item.googleAdsCampaignSource === "draft").length,
        persisted,
        campaigns: snapshots,
        persistErrors: persistErrors.slice(0, 10),
        googleAdsError: workspace.error || null,
        message: snapshots.length
          ? `Synced ${snapshots.length} Google Ads campaign${snapshots.length === 1 ? "" : "s"} into Adigator IQ (${snapshots.filter((item) => item.googleAdsCampaignSource === "draft").length} draft${snapshots.filter((item) => item.googleAdsCampaignSource === "draft").length === 1 ? "" : "s"}).`
          : (workspace.error || "No live or draft campaigns were returned by Google Ads."),
      },
      null,
      200,
    );

    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync Google Ads campaigns.";
    if (/invalid_grant|unauthorized|401/i.test(message)) {
      const response = json(false, null, "Google Ads connection expired. Please reconnect.", 401);
      clearGoogleAdsSession(response);
      return response;
    }
    return json(false, null, message, 500);
  }
}
