import { NextRequest, NextResponse } from "next/server";
import { readGoogleAdsSession } from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  return NextResponse.json({
    connected: Boolean(session?.accessToken),
    email: session?.email || null,
  });
}
