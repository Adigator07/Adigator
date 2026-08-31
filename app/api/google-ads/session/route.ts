import { NextRequest, NextResponse } from "next/server";
import { refreshGoogleAdsAccessToken } from "@/app/lib/googleAds/client";
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
    campaigns?: Array<{
      id: string;
      name: string;
      status: string;
      suggestedGoal?: string;
      sourceType?: "published" | "draft";
      channelType?: string;
    }>;
    error?: string;
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
    error: details?.error || null,
  };
}

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, session, refreshedSession: null as typeof session };

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

    const activeSession = refreshedSession
      ? { ...session, ...refreshedSession, email: refreshedSession.email || session.email }
      : session;

    const response = NextResponse.json(buildGoogleAdsSessionPayload(activeSession));
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to refresh Google Ads status.";
    const isAuthFailure = /invalid_grant|unauthenticated|invalid_token/i.test(message)
      && !/developer.?token|permission.?denied|403/i.test(message);

    if (isAuthFailure) {
      const response = NextResponse.json({
        connected: false,
        expired: true,
        message: "Google Ads connection expired. Please reconnect.",
        email: null,
        customerId: null,
        account: null,
        campaigns: [],
        error: message,
      });
      clearGoogleAdsSession(response);
      return response;
    }

    const response = NextResponse.json(
      buildGoogleAdsSessionPayload(session, {
        campaigns: [],
        error: message,
      }),
    );
    return response;
  }
}
