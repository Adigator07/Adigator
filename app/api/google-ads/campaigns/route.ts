import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAdsCampaign,
  getGoogleAdsCampaignImportDetails,
  refreshGoogleAdsAccessToken,
} from "@/app/lib/googleAds/client";
import { buildGoogleAdsImportedSnapshot } from "@/app/lib/googleAds/importSnapshot";
import { resolveGoogleAdsWorkspace } from "@/app/lib/googleAds/resolveAccount";
import {
  readGoogleAdsSession,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, refreshedSession: null as typeof session };

  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon || !session.refreshToken) {
    return { accessToken: session.accessToken, refreshedSession: null };
  }

  const refreshed = await refreshGoogleAdsAccessToken(session.refreshToken);
  return {
    accessToken: refreshed.access_token,
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
  try {
    const requestedCustomerId = request.nextUrl.searchParams.get("customerId") || "";
    const campaignId = String(
      request.nextUrl.searchParams.get("campaignId")
      || request.nextUrl.searchParams.get("campaign_id")
      || "",
    ).trim();
    const campaignName = String(
      request.nextUrl.searchParams.get("campaignName")
      || request.nextUrl.searchParams.get("campaign_name")
      || "",
    ).trim().toLowerCase();
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || "80");
    const limit = Number.isFinite(limitParam) ? limitParam : 80;

    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Google Ads is not connected." }, { status: 401 });

    const requestedLoginCustomerId = String(request.nextUrl.searchParams.get("loginCustomerId") || "").trim() || undefined;

    if (campaignId && requestedCustomerId) {
      const campaign = await getGoogleAdsCampaign(
        accessToken,
        requestedCustomerId,
        campaignId,
        requestedLoginCustomerId,
      );
      if (campaign) {
        const details = await getGoogleAdsCampaignImportDetails(
          accessToken,
          requestedCustomerId,
          campaign.id,
          requestedLoginCustomerId || campaign.loginCustomerId,
        );
        const snapshot = buildGoogleAdsImportedSnapshot(campaign, "google-ads", requestedCustomerId, details);
        const response = NextResponse.json({
          customerId: requestedCustomerId,
          campaign: snapshot,
          data: snapshot,
        });
        if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
        return response;
      }
    }

    const workspace = await resolveGoogleAdsWorkspace(accessToken, requestedCustomerId, limit);
    const campaigns = workspace.campaigns;

    if (campaignId || campaignName) {
      const campaign = campaigns.find((entry) => campaignId && entry.id === campaignId)
        || campaigns.find((entry) => campaignName && entry.name.trim().toLowerCase() === campaignName)
        || null;
      if (!campaign) {
        const response = NextResponse.json({ error: "That Google Ads campaign was not found for this login." }, { status: 404 });
        if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
        return response;
      }

      const customerId = campaign.customerId || workspace.customerId || requestedCustomerId;
      const details = await getGoogleAdsCampaignImportDetails(
        accessToken,
        customerId,
        campaign.id,
        campaign.loginCustomerId || workspace.loginCustomerId,
      );
      const snapshot = buildGoogleAdsImportedSnapshot(campaign, "google-ads", customerId, details);
      const response = NextResponse.json({
        customerId,
        campaign: snapshot,
        data: snapshot,
      });
      if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
      return response;
    }

    const response = NextResponse.json({
      customerId: workspace.customerId || requestedCustomerId || null,
      campaigns,
      publishedCount: campaigns.filter((campaign) => campaign.sourceType !== "draft").length,
      draftCount: campaigns.filter((campaign) => campaign.sourceType === "draft").length,
      error: workspace.error || null,
    });
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Google Ads campaigns.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
