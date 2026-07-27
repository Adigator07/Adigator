import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAdsAccountDetails,
  listAccessibleCustomerResourceNames,
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import {
  clearGoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

function extractCustomerId(resourceName: string): string {
  const parts = String(resourceName || "").split("/");
  return parts[1] || "";
}

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, refreshedSession: null as any };

  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon) {
    return { accessToken: session.accessToken, refreshedSession: null };
  }

  if (!session.refreshToken) return { accessToken: session.accessToken, refreshedSession: null };

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
    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Google Ads is not connected." }, { status: 401 });

    const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
    const customerIds = resourceNames.map(extractCustomerId).filter(Boolean).slice(0, 20);
    const accounts = await Promise.all(customerIds.map((id) => getGoogleAdsAccountDetails(accessToken, id)));

    const response = NextResponse.json({
      accounts,
      connectedEmail: refreshedSession?.email || readGoogleAdsSession(request)?.email || null,
    });

    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Google Ads accounts.";
    const response = NextResponse.json({ error: message }, { status: 500 });
    if (/invalid_grant|unauthorized|401/i.test(message)) {
      clearGoogleAdsSession(response);
    }
    return response;
  }
}
