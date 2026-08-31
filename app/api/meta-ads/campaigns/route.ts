import { NextRequest, NextResponse } from "next/server";
import {
  createMetaCampaign,
  getMetaCampaign,
  getMetaCampaignImportDetails,
  listMetaAdAccounts,
  listMetaCampaigns,
  listMetaCampaignsAcrossAccounts,
  normalizeAdAccountId,
} from "@/app/lib/metaAds/client";
import { buildMetaAdsImportedSnapshot } from "@/app/lib/metaAds/importSnapshot";
import { readMetaEnv } from "@/app/lib/metaAds/env";
import { resolveMetaAccessToken } from "@/app/lib/metaAds/resolveToken";

export const runtime = "nodejs";

async function resolveAdAccountId(accessToken: string, requested: string) {
  const accounts = await listMetaAdAccounts(accessToken);
  const requestedId = normalizeAdAccountId(requested);
  if (requestedId && accounts.some((account) => account.id === requestedId)) return requestedId;
  const preferred = normalizeAdAccountId(readMetaEnv("META_TEST_AD_ACCOUNT_ID"));
  if (preferred && accounts.some((account) => account.id === preferred)) return preferred;
  return accounts[0]?.id || "";
}

export async function GET(request: NextRequest) {
  try {
    const { accessToken } = resolveMetaAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Meta Ads is not connected." }, { status: 401 });

    const requestedAccountId = request.nextUrl.searchParams.get("adAccountId")
      || request.nextUrl.searchParams.get("accountId")
      || "";
    const campaignId = String(request.nextUrl.searchParams.get("campaignId") || "").trim();
    const campaignName = String(request.nextUrl.searchParams.get("campaignName") || "").trim().toLowerCase();
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || "80");
    const limit = Number.isFinite(limitParam) ? limitParam : 80;

    if (campaignId) {
      const adAccountId = await resolveAdAccountId(accessToken, requestedAccountId);
      if (!adAccountId) return NextResponse.json({ error: "No Meta ad account was found for this login." }, { status: 400 });
      let campaign = await getMetaCampaign(accessToken, adAccountId, campaignId);
      if (!campaign) {
        const accounts = await listMetaAdAccounts(accessToken);
        for (const account of accounts.slice(0, 12)) {
          campaign = await getMetaCampaign(accessToken, account.id, campaignId);
          if (campaign) break;
        }
      }
      if (!campaign) return NextResponse.json({ error: "That Meta campaign was not found for this ad account." }, { status: 404 });
      let details = {};
      try {
        details = await getMetaCampaignImportDetails(accessToken, campaign.id);
      } catch {
        details = {};
      }
      const snapshot = buildMetaAdsImportedSnapshot(campaign, "meta-ads", campaign.adAccountId || adAccountId, details);
      return NextResponse.json({ adAccountId: campaign.adAccountId || adAccountId, campaign: snapshot, data: snapshot });
    }

    const listed = requestedAccountId
      ? await (async () => {
          const adAccountId = await resolveAdAccountId(accessToken, requestedAccountId);
          if (!adAccountId) return { adAccountId: "", campaigns: [] as Awaited<ReturnType<typeof listMetaCampaigns>> };
          return {
            adAccountId,
            campaigns: await listMetaCampaigns(accessToken, adAccountId, limit),
          };
        })()
      : await listMetaCampaignsAcrossAccounts(
          accessToken,
          await resolveAdAccountId(accessToken, ""),
          limit,
        );
    const adAccountId = listed.adAccountId;
    if (!adAccountId) return NextResponse.json({ error: "No Meta ad account was found for this login." }, { status: 400 });
    const campaigns = listed.campaigns;
    if (campaignName) {
      const campaign = campaigns.find((entry) => entry.name.trim().toLowerCase() === campaignName) || null;
      if (!campaign) return NextResponse.json({ error: "That Meta campaign was not found for this login." }, { status: 404 });
      let namedDetails = {};
      try {
        namedDetails = await getMetaCampaignImportDetails(accessToken, campaign.id);
      } catch {
        namedDetails = {};
      }
      const snapshot = buildMetaAdsImportedSnapshot(campaign, "meta-ads", adAccountId, namedDetails);
      return NextResponse.json({ adAccountId, campaign: snapshot, data: snapshot });
    }

    return NextResponse.json({ adAccountId, campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Meta Ads campaigns.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const campaignName = typeof body?.campaignName === "string" ? body.campaignName.trim() : "";
    const objective = typeof body?.objective === "string" ? body.objective.trim() : "";
    const { accessToken } = resolveMetaAccessToken(request);
    if (!accessToken) return NextResponse.json({ error: "Meta Ads is not connected." }, { status: 401 });
    if (!campaignName) return NextResponse.json({ error: "campaignName is required." }, { status: 400 });

    const adAccountId = await resolveAdAccountId(
      accessToken,
      typeof body?.adAccountId === "string" ? body.adAccountId : "",
    );
    if (!adAccountId) return NextResponse.json({ error: "No Meta ad account was found for this login." }, { status: 400 });

    const campaign = await createMetaCampaign(accessToken, {
      adAccountId,
      campaignName,
      objective,
      status: "PAUSED",
    });
    return NextResponse.json({ campaign, adAccountId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Meta Ads campaign.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
