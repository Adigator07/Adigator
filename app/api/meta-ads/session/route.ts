import { NextRequest, NextResponse } from "next/server";
import { resolveMetaAccessToken } from "@/app/lib/metaAds/resolveToken";
import { clearMetaAdsSession } from "@/app/lib/metaAds/session";

export const runtime = "nodejs";

export function buildMetaAdsSessionPayload(
  session: { accessToken?: string; email?: string; userName?: string } | null,
  details?: {
    adAccountId?: string;
    account?: { name?: string; currency?: string; timeZone?: string };
    accounts?: Array<{ id: string; name: string }>;
    campaigns?: Array<{ id: string; name: string; status: string; objective?: string }>;
    error?: string;
  },
) {
  const connected = Boolean(session?.accessToken);
  return {
    connected,
    expired: false,
    message: connected
      ? `Meta Ads connected for ${session?.email || session?.userName || "your account"}.`
      : "No Meta Ads account connected yet.",
    email: session?.email || session?.userName || null,
    adAccountId: details?.adAccountId || null,
    account: details?.account || null,
    accounts: details?.accounts || [],
    campaigns: details?.campaigns || [],
    error: details?.error || null,
  };
}

export async function GET(request: NextRequest) {
  const { accessToken, session } = resolveMetaAccessToken(request);
  if (!accessToken) {
    if (session?.accessToken) {
      const response = NextResponse.json({
        connected: false,
        expired: true,
        message: "Meta Ads connection expired. Please reconnect.",
        email: null,
        adAccountId: null,
        account: null,
        accounts: [],
        campaigns: [],
      });
      clearMetaAdsSession(response);
      return response;
    }
    return NextResponse.json(buildMetaAdsSessionPayload(session));
  }

  return NextResponse.json(buildMetaAdsSessionPayload(session));
}
