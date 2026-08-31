import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import { upsertCampaign } from "@/app/lib/campaignStore";
import { persistAdvertiserCampaignSelection } from "@/app/lib/advertiserStore";

export type GoogleAdsSyncResult = {
  customerId: string;
  account: { name?: string; currencyCode?: string; timeZone?: string } | null;
  email: string | null;
  total: number;
  published: number;
  drafts: number;
  persisted: number;
  campaigns: CampaignSnapshot[];
  persistErrors?: string[];
  googleAdsError?: string | null;
  message?: string;
};

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Pull published + draft Google Ads campaigns into Adigator (API + local stores).
 */
export async function syncGoogleAdsIntoAdigator(options: {
  accessToken: string;
  ownerId: string;
  customerId?: string;
  advertiserName?: string;
  advertiserId?: string;
  limit?: number;
}): Promise<GoogleAdsSyncResult> {
  const { accessToken, ownerId } = options;
  if (!accessToken) throw new Error("Sign in is required to sync Google Ads.");
  if (!ownerId) throw new Error("Missing Adigator user id for sync.");

  const response = await fetch("/api/google-ads/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: options.customerId || undefined,
      limit: options.limit || 100,
    }),
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Google Ads sync failed (${response.status}).`);
  }

  const data = payload.data as GoogleAdsSyncResult;
  const advertiserName = (options.advertiserName || data.account?.name || "Google Ads").trim() || "Google Ads";

  for (const snapshot of data.campaigns || []) {
    const owned: CampaignSnapshot = {
      ...snapshot,
      ownerId,
      platform: "google_ads",
      importSource: "google_ads",
    };
    upsertCampaign(owned);
    persistAdvertiserCampaignSelection({
      ownerId,
      advertiserName,
      advertiserId: options.advertiserId,
      campaign: {
        id: owned.id,
        name: owned.campaignName,
        platform: "google_ads",
        validated: false,
        adGroups: (owned.programmaticAdGroups || []).map((group) => ({
          id: group.id,
          name: group.name?.trim() || "Unnamed Ad Group",
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
