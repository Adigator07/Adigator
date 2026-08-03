import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAdsAccountDetails,
  listAccessibleCustomerResourceNames,
  listGoogleAdsCampaigns,
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import {
  clearGoogleAdsSession,
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

export function buildGoogleAdsSessionPayload(
  session: { accessToken?: string; email?: string } | null,
  details?: {
    customerId?: string;
    account?: { name?: string; currencyCode?: string; timeZone?: string };
    campaigns?: Array<{ id: string; name: string; status: string; suggestedGoal?: string }>;
  },
) {
  const connected = Boolean(session?.accessToken);
  return {
    connected,
    expired: false,
    message: connected
      ? `Google Ads connected for ${session?.email || "your account"}.`
      : "No Google Ads account connected yet.",
    email: session?.email || null,
    customerId: details?.customerId || null,
    account: details?.account || null,
    campaigns: details?.campaigns || [],
  };
}

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, session, refreshedSession: null as any };

  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon) {
    return { accessToken: session.accessToken, session, refreshedSession: null };
  }

  if (!session.refreshToken) {
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

export async function GET(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) {
    return NextResponse.json(buildGoogleAdsSessionPayload(session));
  }

  try {
    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json(buildGoogleAdsSessionPayload(session));
    }

    const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
    const customerId = resourceNames[0]?.split("/")[1] || "";
    const account = customerId ? await getGoogleAdsAccountDetails(accessToken, customerId) : undefined;
    const campaigns = customerId ? await listGoogleAdsCampaigns(accessToken, customerId, 5) : [];

    const response = NextResponse.json(
      buildGoogleAdsSessionPayload(
        refreshedSession ? { ...session, ...refreshedSession, email: refreshedSession.email || session.email } : session,
        {
          customerId: account?.customerId || customerId || null,
          account: account ? {
            name: account.name,
            currencyCode: account.currencyCode,
            timeZone: account.timeZone,
          } : undefined,
          campaigns,
        },
      ),
    );

    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to refresh Google Ads status.";
    const response = NextResponse.json(
      buildGoogleAdsSessionPayload(session, {
        campaigns: [],
      }),
    );
    if (/invalid_grant|unauthorized|401/i.test(message)) {
      clearGoogleAdsSession(response);
      return NextResponse.json({
        connected: false,
        expired: true,
        message: "Google Ads connection expired. Please reconnect.",
        email: null,
        customerId: null,
        account: null,
        campaigns: [],
      });
    }
    return response;
  }
}
