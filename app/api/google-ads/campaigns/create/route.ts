import { NextRequest, NextResponse } from "next/server";
import {
  createGoogleAdsCampaign,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customerId = typeof body?.customerId === "string" ? body.customerId.trim() : "";
    const campaignName = typeof body?.campaignName === "string" ? body.campaignName.trim() : "";
    const amountMicros = Number(body?.amountMicros || 0);

    if (!customerId) return NextResponse.json({ error: "customerId is required." }, { status: 400 });
    if (!campaignName) return NextResponse.json({ error: "campaignName is required." }, { status: 400 });
    if (!Number.isFinite(amountMicros) || amountMicros <= 0) {
      return NextResponse.json({ error: "amountMicros must be a positive number." }, { status: 400 });
    }

    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Google Ads is not connected." }, { status: 401 });

    const campaign = await createGoogleAdsCampaign(accessToken, {
      customerId,
      campaignName,
      amountMicros,
      advertisingChannelType: body?.advertisingChannelType,
      status: body?.status,
    });

    const response = NextResponse.json({ campaign }, { status: 201 });
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Google Ads campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
