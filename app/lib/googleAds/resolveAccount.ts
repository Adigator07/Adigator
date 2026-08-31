import type { GoogleAdsAccount, GoogleAdsCampaign } from "@/app/lib/googleAds/client";
import {
  getGoogleAdsAccountDetails,
  getGoogleAdsLoginCustomerId,
  listAccessibleCustomerResourceNames,
  listGoogleAdsCampaigns,
  listGoogleAdsCustomerClients,
  listGoogleAdsDraftCampaigns,
} from "@/app/lib/googleAds/client";

export type GoogleAdsResolvedWorkspace = {
  customerId: string;
  loginCustomerId?: string;
  account: GoogleAdsAccount | null;
  campaigns: GoogleAdsCampaign[];
  error?: string;
};

const WORKSPACE_CACHE_TTL_MS = 20_000;
const MAX_ACCESSIBLE_ACCOUNTS = 8;
const MAX_MCC_CLIENTS = 12;
const ACCOUNT_CONCURRENCY = 4;

type WorkspaceCacheEntry = {
  expiresAt: number;
  value: GoogleAdsResolvedWorkspace;
};

const workspaceCache = new Map<string, WorkspaceCacheEntry>();

function extractCustomerId(resourceName: string): string {
  return String(resourceName || "").split("/")[1] || "";
}

function isPermissionDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /USER_PERMISSION_DENIED|PERMISSION_DENIED|does not have permission|LOGIN_CUSTOMER/i.test(message);
}

export function clearGoogleAdsWorkspaceCache() {
  workspaceCache.clear();
}

export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => run()));
  return results;
}

function workspaceCacheKey(accessToken: string, preferredCustomerId: string, limit: number): string {
  return `${accessToken.slice(-18)}:${preferredCustomerId || "*"}:${limit}`;
}

async function getAccountDetailsSafe(
  accessToken: string,
  customerId: string,
  loginCustomerId?: string,
): Promise<GoogleAdsAccount> {
  try {
    return await getGoogleAdsAccountDetails(accessToken, customerId, loginCustomerId);
  } catch (error) {
    const managerId = getGoogleAdsLoginCustomerId();
    if (managerId && managerId !== customerId && managerId !== loginCustomerId && isPermissionDenied(error)) {
      return getGoogleAdsAccountDetails(accessToken, customerId, managerId);
    }
    throw error;
  }
}

async function loadCampaignsForCustomer(
  accessToken: string,
  customerId: string,
  loginCustomerId: string | undefined,
  limit: number,
  knownAccount?: GoogleAdsAccount | null,
): Promise<{ account: GoogleAdsAccount; campaigns: GoogleAdsCampaign[] }> {
  const account = knownAccount?.customerId
    ? knownAccount
    : await getAccountDetailsSafe(accessToken, customerId, loginCustomerId);
  const preferredLogin = loginCustomerId || (account.manager ? account.customerId : undefined);
  const fallbackLogin = getGoogleAdsLoginCustomerId();

  const loadLists = async (loginId?: string) => {
    const [publishedResult, draftsResult] = await Promise.allSettled([
      listGoogleAdsCampaigns(accessToken, customerId, limit, loginId),
      listGoogleAdsDraftCampaigns(accessToken, customerId, limit, loginId),
    ]);
    const published = publishedResult.status === "fulfilled" ? publishedResult.value : [] as GoogleAdsCampaign[];
    const drafts = draftsResult.status === "fulfilled" ? draftsResult.value : [] as GoogleAdsCampaign[];
    const permissionDenied = [publishedResult, draftsResult].some((result) => (
      result.status === "rejected" && isPermissionDenied(result.reason)
    ));
    if (publishedResult.status === "rejected") {
      console.warn("[Adigator] Google Ads campaign listing failed:", customerId, publishedResult.reason);
    }
    if (draftsResult.status === "rejected") {
      console.warn("[Adigator] Google Ads draft campaign listing failed:", customerId, draftsResult.reason);
    }
    return { published, drafts, loginId, permissionDenied };
  };

  let loaded = await loadLists(preferredLogin);
  if (
    loaded.permissionDenied
    && fallbackLogin
    && fallbackLogin !== preferredLogin
  ) {
    loaded = await loadLists(fallbackLogin);
  }

  return {
    account,
    campaigns: [
      ...loaded.published.map((campaign) => ({
        ...campaign,
        customerId,
        loginCustomerId: loaded.loginId,
        sourceType: campaign.sourceType || "published" as const,
      })),
      ...loaded.drafts.map((campaign) => ({
        ...campaign,
        customerId,
        loginCustomerId: loaded.loginId,
        sourceType: "draft" as const,
      })),
    ],
  };
}

export async function resolveGoogleAdsWorkspace(
  accessToken: string,
  preferredCustomerId = "",
  limit = 80,
): Promise<GoogleAdsResolvedWorkspace> {
  const cacheKey = workspaceCacheKey(accessToken, preferredCustomerId, limit);
  const cached = workspaceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const errors: string[] = [];
  const campaigns: GoogleAdsCampaign[] = [];
  const seenCampaignKeys = new Set<string>();
  let account: GoogleAdsAccount | null = null;
  let customerId = "";
  let loginCustomerId: string | undefined;

  const rememberCampaign = (entry: GoogleAdsCampaign) => {
    const key = String(entry.id || entry.draftId || entry.name);
    if (!key || seenCampaignKeys.has(key)) return;
    seenCampaignKeys.add(key);
    campaigns.push(entry);
  };

  const adoptAccount = (nextAccount: GoogleAdsAccount, nextLogin?: string, force = false) => {
    if (!account || force || nextAccount.customerId === preferredCustomerId) {
      account = nextAccount;
      customerId = nextAccount.customerId;
      loginCustomerId = nextLogin;
    }
  };

  try {
    const resourceNames = await listAccessibleCustomerResourceNames(accessToken);
    const accessibleIds = resourceNames.map(extractCustomerId).filter(Boolean);
    const queued = (
      preferredCustomerId
        ? [preferredCustomerId]
        : accessibleIds
    ).filter((id, index, list) => id && list.indexOf(id) === index)
      .slice(0, preferredCustomerId ? 1 : MAX_ACCESSIBLE_ACCOUNTS);

    if (!queued.length) {
      const empty = {
        customerId: preferredCustomerId,
        account: null,
        campaigns: [],
        error: "This Google login has no Google Ads accounts the API can read. Sign in with the Google account that has access to the Ads account, or add this Gmail under Google Ads → Tools → Access and security.",
      };
      workspaceCache.set(cacheKey, { expiresAt: Date.now() + WORKSPACE_CACHE_TTL_MS, value: empty });
      return empty;
    }

    await runWithConcurrency(queued, ACCOUNT_CONCURRENCY, async (candidateId) => {
      try {
        const details = await getAccountDetailsSafe(accessToken, candidateId);
        if (details.manager) {
          const clients = (await listGoogleAdsCustomerClients(accessToken, candidateId))
            .filter((client) => client.customerId && !client.manager)
            .slice(0, MAX_MCC_CLIENTS);
          await runWithConcurrency(clients, ACCOUNT_CONCURRENCY, async (client) => {
            try {
              const loaded = await loadCampaignsForCustomer(
                accessToken,
                client.customerId,
                candidateId,
                limit,
                client,
              );
              loaded.campaigns.forEach(rememberCampaign);
              adoptAccount(loaded.account, candidateId, client.customerId === preferredCustomerId);
            } catch (clientError) {
              errors.push(clientError instanceof Error ? clientError.message : String(clientError));
            }
          });
          return;
        }

        const loaded = await loadCampaignsForCustomer(accessToken, candidateId, undefined, limit, details);
        loaded.campaigns.forEach(rememberCampaign);
        adoptAccount(loaded.account, undefined, candidateId === preferredCustomerId);
      } catch (accountError) {
        errors.push(accountError instanceof Error ? accountError.message : String(accountError));
      }
    });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  const permissionError = errors.find((entry) => isPermissionDenied(entry));
  const value: GoogleAdsResolvedWorkspace = {
    customerId: customerId || preferredCustomerId,
    loginCustomerId,
    account,
    campaigns,
    error: campaigns.length || account
      ? undefined
      : permissionError
        || errors[0]
        || "Google Ads did not return any campaigns for this login.",
  };
  workspaceCache.set(cacheKey, { expiresAt: Date.now() + WORKSPACE_CACHE_TTL_MS, value });
  return value;
}
