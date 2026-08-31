import { NextRequest, NextResponse } from "next/server";
import { refreshGoogleAdsAccessToken } from "@/app/lib/googleAds/client";
import {
  clearGoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";
import { loadHealthAccountCampaigns, loadHealthAccounts } from "@/app/lib/campaignHealth/catalog";

export const runtime = "nodejs";

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, refreshedSession: null as typeof session };

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

export async function GET(request: NextRequest) {
  try {
    const session = readGoogleAdsSession(request);
    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ connected: false, accounts: [], error: "Connect Google Ads to choose campaigns to monitor." }, { status: 401 });
    }

    const customerId = String(request.nextUrl.searchParams.get("customerId") || "").replace(/\D/g, "");
    const loginCustomerId = String(request.nextUrl.searchParams.get("loginCustomerId") || "").replace(/\D/g, "") || undefined;

    if (customerId) {
      const campaigns = await loadHealthAccountCampaigns(accessToken, customerId, loginCustomerId);
      const response = NextResponse.json({ connected: true, customerId, campaigns });
      if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
      return response;
    }

    const accounts = await loadHealthAccounts(accessToken);
    const response = NextResponse.json({
      connected: true,
      email: session?.email || null,
      accounts,
    });
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Google Ads campaigns.";
    const response = NextResponse.json({ connected: false, accounts: [], error: message }, { status: 500 });
    if (/invalid_grant|unauthorized|401/i.test(message)) clearGoogleAdsSession(response);
    return response;
  }
}
