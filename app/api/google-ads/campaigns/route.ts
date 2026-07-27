import { NextRequest, NextResponse } from "next/server";
import {
  listGoogleAdsCampaigns,
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import {
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, refreshedSession: null as any };

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
    const customerId = request.nextUrl.searchParams.get("customerId") || "";
    if (!customerId.trim()) return NextResponse.json({ error: "customerId is required." }, { status: 400 });

    const limitParam = Number(request.nextUrl.searchParams.get("limit") || "25");
    const limit = Number.isFinite(limitParam) ? limitParam : 25;

    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Google Ads is not connected." }, { status: 401 });

    const campaigns = await listGoogleAdsCampaigns(accessToken, customerId, limit);
    const response = NextResponse.json({ campaigns });
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Google Ads campaigns.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
