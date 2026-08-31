import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildGoogleAdsAuthUrl } from "@/app/lib/googleAds/client";
import { writeGoogleAdsState } from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const forceAccountSelect = request.nextUrl.searchParams.get("useDifferent") === "1";
    const loginHint = request.nextUrl.searchParams.get("loginHint") || undefined;
    const returnTo = request.nextUrl.searchParams.get("returnTo") || "/preview-tool?step=campaign-setup";
    const popup = request.nextUrl.searchParams.get("popup") !== "0";
    const nonce = randomUUID();
    const authUrl = buildGoogleAdsAuthUrl(request.nextUrl.origin, nonce, forceAccountSelect, loginHint);

    const response = NextResponse.redirect(authUrl, { status: 302 });
    writeGoogleAdsState(response, JSON.stringify({ nonce, returnTo, popup }));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Google Ads OAuth.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
