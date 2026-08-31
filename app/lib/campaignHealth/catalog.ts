import {
  getGoogleAdsAccountDetails,
  listAccessibleCustomerResourceNames,
  listGoogleAdsCampaigns,
  listGoogleAdsCustomerClients,
} from "@/app/lib/googleAds/client";
import { runWithConcurrency } from "@/app/lib/googleAds/resolveAccount";
import type { HealthCatalogAccount, HealthCatalogCampaign } from "@/app/lib/campaignHealth/types";

export type { HealthCatalogAccount, HealthCatalogCampaign };

const CATALOG_TTL_MS = 45_000;
const catalogCache = new Map<string, { expiresAt: number; value: unknown }>();

function cacheGet<T>(key: string): T | null {
  const entry = catalogCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) catalogCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function cacheSet<T>(key: string, value: T) {
  catalogCache.set(key, { expiresAt: Date.now() + CATALOG_TTL_MS, value });
}

function tokenKey(accessToken: string) {
  return accessToken.slice(-24);
}

function extractCustomerId(resourceName: string): string {
  return String(resourceName || "").split("/")[1] || "";
}

export async function loadHealthAccounts(accessToken: string): Promise<HealthCatalogAccount[]> {
  const cacheKey = `accounts:${tokenKey(accessToken)}`;
  const cached = cacheGet<HealthCatalogAccount[]>(cacheKey);
  if (cached) return cached;

  const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
  const rootIds = resourceNames.map(extractCustomerId).filter(Boolean).slice(0, 5);

  const nested = await runWithConcurrency(rootIds, 4, async (customerId) => {
    let details;
    try {
      details = await getGoogleAdsAccountDetails(accessToken, customerId);
    } catch {
      return [] as HealthCatalogAccount[];
    }

    if (!details.manager) {
      return [{
        customerId: details.customerId,
        name: details.name,
        manager: false,
        campaigns: [],
      }];
    }

    const clients = (await listGoogleAdsCustomerClients(accessToken, customerId).catch(() => []))
      .filter((item) => !item.manager)
      .slice(0, 8);

    if (!clients.length) {
      return [{
        customerId: details.customerId,
        name: details.name,
        manager: true,
        loginCustomerId: customerId,
        campaigns: [],
      }];
    }

    return clients.map((account) => ({
      customerId: account.customerId,
      name: account.name,
      manager: false,
      loginCustomerId: customerId,
      campaigns: [],
    }));
  });

  const accounts = nested.flat();
  cacheSet(cacheKey, accounts);
  return accounts;
}

export async function loadHealthAccountCampaigns(
  accessToken: string,
  customerId: string,
  loginCustomerId?: string,
): Promise<HealthCatalogCampaign[]> {
  const cid = String(customerId || "").replace(/\D/g, "");
  const login = String(loginCustomerId || "").replace(/\D/g, "") || undefined;
  const cacheKey = `campaigns:${tokenKey(accessToken)}:${cid}:${login || ""}`;
  const cached = cacheGet<HealthCatalogCampaign[]>(cacheKey);
  if (cached) return cached;

  const campaigns = await listGoogleAdsCampaigns(accessToken, cid, 25, login).catch(() => []);
  const mapped = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    channelType: campaign.channelType,
    budgetAmountMicros: campaign.budgetAmountMicros,
    customerId: cid,
    loginCustomerId: login,
  }));
  cacheSet(cacheKey, mapped);
  return mapped;
}

export async function loadCampaignHealthCatalog(accessToken: string): Promise<{
  accounts: HealthCatalogAccount[];
}> {
  const accounts = await loadHealthAccounts(accessToken);
  return { accounts };
}
