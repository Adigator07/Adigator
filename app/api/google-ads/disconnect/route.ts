import { NextResponse } from "next/server";
import { clearGoogleAdsSession } from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    connected: false,
    expired: true,
    message: "Google Ads connection removed.",
    email: null,
    customerId: null,
    account: null,
    campaigns: [],
  });
  clearGoogleAdsSession(response);
  return response;
}
