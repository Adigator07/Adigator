import { NextResponse } from "next/server";
import { clearMetaAdsSession } from "@/app/lib/metaAds/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    connected: false,
    expired: true,
    message: "Meta Ads connection removed.",
    email: null,
    adAccountId: null,
    account: null,
    accounts: [],
    campaigns: [],
  });
  clearMetaAdsSession(response);
  return response;
}
