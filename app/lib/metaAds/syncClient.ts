import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import { upsertCampaign } from "@/app/lib/campaignStore";
import { persistAdvertiserCampaignSelection } from "@/app/lib/advertiserStore";

export type MetaAdsSyncResult = {
  adAccountId: string;
  account: { name?: string; currency?: string; timeZone?: string } | null;
  email: string | null;
  total: number;
  persisted: number;
  campaigns: CampaignSnapshot[];
  persistErrors?: string[];
  message?: string;
};

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function syncMetaAdsIntoAdigator(options: {
  accessToken: string;
  ownerId: string;
  adAccountId?: string;
  advertiserName?: string;
  advertiserId?: string;
  limit?: number;
}): Promise<MetaAdsSyncResult> {
  const { accessToken, ownerId } = options;
  if (!accessToken) throw new Error("Sign in is required to sync Meta Ads.");
  if (!ownerId) throw new Error("Missing Adigator user id for sync.");

  const response = await fetch("/api/meta-ads/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      adAccountId: options.adAccountId || undefined,
      limit: options.limit || 100,
    }),
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Meta Ads sync failed (${response.status}).`);
  }

  const data = payload.data as MetaAdsSyncResult;
  const advertiserName = (options.advertiserName || data.account?.name || "Meta Ads").trim() || "Meta Ads";

  for (const snapshot of data.campaigns || []) {
    const owned: CampaignSnapshot = {
      ...snapshot,
      ownerId,
      platform: "meta_ads",
      importSource: "meta_ads",
    };
    upsertCampaign(owned);
    persistAdvertiserCampaignSelection({
      ownerId,
      advertiserName,
      advertiserId: options.advertiserId,
      campaign: {
        id: owned.id,
        name: owned.campaignName,
        platform: "meta_ads",
        validated: false,
        adGroups: (owned.programmaticAdGroups || []).map((group) => ({
          id: group.id,
          name: group.name?.trim() || "Unnamed Ad Set",
          objective: group.objective || "",
          objectiveLabel: group.objective || "",
          creatives: [],
        })),
        updatedAt: owned.updatedAt,
      },
    });
  }

  return data;
}
