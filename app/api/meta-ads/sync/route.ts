import { NextRequest, NextResponse } from "next/server";
import {
  listMetaAdAccounts,
  listMetaCampaigns,
  normalizeAdAccountId,
} from "@/app/lib/metaAds/client";
import { buildMetaAdsImportedSnapshot } from "@/app/lib/metaAds/importSnapshot";
import { persistImportedMetaAdsCampaign } from "@/app/lib/metaAds/persistImportedCampaign";
import { readMetaEnv } from "@/app/lib/metaAds/env";
import { resolveMetaAccessToken } from "@/app/lib/metaAds/resolveToken";
import { clearMetaAdsSession } from "@/app/lib/metaAds/session";
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

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const { accessToken, session } = resolveMetaAccessToken(request);
    if (!accessToken) {
      return json(false, null, "Meta Ads is not connected. Connect Meta Ads first.", 401);
    }

    const accounts = await listMetaAdAccounts(accessToken);
    const requestedAccountId = normalizeAdAccountId(String(body.adAccountId || ""));
    const preferred = requestedAccountId
      || normalizeAdAccountId(readMetaEnv("META_TEST_AD_ACCOUNT_ID"))
      || accounts[0]?.id
      || "";
    if (!preferred) return json(false, null, "No accessible Meta ad account was found.", 400);

    const account = accounts.find((item) => item.id === preferred) || accounts[0] || null;
    const limitParam = Number(body.limit ?? 100);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 100;
    const campaigns = await listMetaCampaigns(accessToken, preferred, limit);

    const supabase = isSupabaseConfigured() ? createWritableSupabaseClient(token) : null;
    const snapshots: CampaignSnapshot[] = [];
    const persistErrors: string[] = [];
    let persisted = 0;

    for (const campaign of campaigns) {
      const snapshot = buildMetaAdsImportedSnapshot(campaign, user.id, preferred, {});
      snapshots.push(snapshot);
      if (supabase) {
        const result = await persistImportedMetaAdsCampaign(supabase, user.id, snapshot);
        if (result.ok) persisted += 1;
        else if (result.error) persistErrors.push(`${snapshot.campaignName}: ${result.error}`);
      }
    }

    return json(true, {
      adAccountId: preferred,
      account: account
        ? { name: account.name, currency: account.currency, timeZone: account.timeZone }
        : null,
      email: session?.email || session?.userName || null,
      total: snapshots.length,
      persisted,
      campaigns: snapshots,
      persistErrors: persistErrors.slice(0, 10),
      message: snapshots.length
        ? `Synced ${snapshots.length} Meta Ads campaign${snapshots.length === 1 ? "" : "s"} into Adigator IQ.`
        : "No campaigns were returned by Meta Ads for this ad account.",
    }, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync Meta Ads campaigns.";
    if (/invalid.?token|oauth|401|session has expired/i.test(message)) {
      const response = json(false, null, "Meta Ads connection expired. Please reconnect.", 401);
      clearMetaAdsSession(response);
      return response;
    }
    return json(false, null, message, 500);
  }
}
