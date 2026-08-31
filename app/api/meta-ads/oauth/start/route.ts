import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildMetaAdsAuthUrl } from "@/app/lib/metaAds/client";
import { writeMetaAdsState } from "@/app/lib/metaAds/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const useLoginConfig = request.nextUrl.searchParams.get("loginConfig") === "1";
    const returnTo = request.nextUrl.searchParams.get("returnTo") || "/preview-tool?step=campaign-setup";
    const popup = request.nextUrl.searchParams.get("popup") !== "0";
    const nonce = randomUUID();
    const authUrl = buildMetaAdsAuthUrl(request.nextUrl.origin, nonce, {
      rerequest: true,
      useLoginConfig,
    });

    const response = NextResponse.redirect(authUrl, { status: 302 });
    writeMetaAdsState(response, JSON.stringify({ nonce, returnTo, popup }));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Meta Ads OAuth.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
