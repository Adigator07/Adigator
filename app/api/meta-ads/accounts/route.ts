import { NextRequest, NextResponse } from "next/server";
import { listMetaAdAccounts, normalizeAdAccountId } from "@/app/lib/metaAds/client";
import { readMetaEnv } from "@/app/lib/metaAds/env";
import { resolveMetaAccessToken } from "@/app/lib/metaAds/resolveToken";
import { clearMetaAdsSession } from "@/app/lib/metaAds/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { accessToken, session } = resolveMetaAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Meta Ads is not connected." }, { status: 401 });

    const accounts = await listMetaAdAccounts(accessToken);
    const preferred = normalizeAdAccountId(readMetaEnv("META_TEST_AD_ACCOUNT_ID"));
    return NextResponse.json({
      accounts,
      connectedEmail: session?.email || session?.userName || null,
      preferredAdAccountId: preferred || accounts[0]?.id || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Meta Ads accounts.";
    const response = NextResponse.json({ error: message }, { status: 500 });
    if (/invalid.?token|oauth|401|session has expired/i.test(message)) {
      clearMetaAdsSession(response);
    }
    return response;
  }
}
