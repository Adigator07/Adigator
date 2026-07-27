import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildGoogleAdsAuthUrl } from "@/app/lib/googleAds/client";
import { writeGoogleAdsState } from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const forceAccountSelect = request.nextUrl.searchParams.get("useDifferent") === "1";
    const state = randomUUID();
    const authUrl = buildGoogleAdsAuthUrl(request.nextUrl.origin, state, forceAccountSelect);

    const response = NextResponse.redirect(authUrl, { status: 302 });
    writeGoogleAdsState(response, state);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Google Ads OAuth.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
