import type { CampaignSnapshot, CampaignIdOption } from "@/app/lib/campaignSnapshot";
import type { AnalyzerPlatform } from "@/app/lib/platforms/types";
import { isAuthenticatedOwnerId } from "@/app/lib/campaignOwnerScope";

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function stripSnapshotForRemotePersistence(snapshot: CampaignSnapshot): CampaignSnapshot {
  const creatives = (Array.isArray(snapshot.creatives) ? snapshot.creatives : []).map((creative) => {
    if (!creative || typeof creative !== "object") return creative;
    const record = creative as Record<string, unknown>;
    const {
      url: _url,
      fullUrl: _fullUrl,
      previewDataUrl: _previewDataUrl,
      ...rest
    } = record;
    return {
      ...rest,
      hasStoredAssets: Boolean(rest.hasStoredAssets || rest.id),
    };
  });

  return {
    ...snapshot,
    creatives,
    dashboardOverviewCache: null,
    dashboardPreviewCache: null,
    previewStudioCache: snapshot.platform === "programmatic" ? null : snapshot.previewStudioCache,
    campaignAssistantContext: null,
  };
}

export async function fetchCampaignIdsByName(
  campaignName: string,
  accessToken: string,
  platform?: AnalyzerPlatform,
): Promise<CampaignIdOption[]> {
  const trimmed = campaignName.trim();
  if (!trimmed || !accessToken) return [];

  try {
    const params = new URLSearchParams({ campaign_name: trimmed });
    if (platform) params.set("platform", platform);
    const response = await fetch(`/api/campaigns?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload?.success) return [];
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    console.warn("[Adigator] Campaign ID lookup failed:", error);
    return [];
  }
}

export async function fetchCampaignFromApi({
  campaignName,
  campaignId,
  accessToken,
  platform,
}: {
  campaignName: string;
  campaignId: string;
  accessToken: string;
  platform?: AnalyzerPlatform;
}): Promise<CampaignSnapshot | null> {
  const name = campaignName.trim();
  const id = campaignId.trim();
  if (!name || !id || !accessToken) return null;

  try {
    const params = new URLSearchParams({
      campaign_name: name,
      campaign_id: id,
    });
    if (platform) params.set("platform", platform);
    const response = await fetch(`/api/campaigns?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload?.success || !payload.data) return null;
    return payload.data as CampaignSnapshot;
  } catch (error) {
    console.warn("[Adigator] Campaign fetch failed:", error);
    return null;
  }
}

export async function persistCampaignToApi(
  snapshot: CampaignSnapshot,
  accessToken: string,
): Promise<CampaignSnapshot | null> {
  if (!accessToken || !isAuthenticatedOwnerId(snapshot.ownerId)) return snapshot;

  try {
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform: snapshot.platform,
        campaign_name: snapshot.campaignName,
        snapshot: stripSnapshotForRemotePersistence(snapshot),
      }),
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload?.success) return snapshot;
    return payload.data ? { ...snapshot, ...payload.data } : snapshot;
  } catch (error) {
    console.warn("[Adigator] Campaign remote persistence failed:", error);
    return snapshot;
  }
}

/** Backward-compatible wrapper for programmatic-only callers */
export async function persistProgrammaticCampaignToApi(
  snapshot: CampaignSnapshot,
  accessToken: string,
): Promise<CampaignSnapshot | null> {
  return persistCampaignToApi({ ...snapshot, platform: "programmatic" }, accessToken);
}

/** Backward-compatible programmatic fetch — tries unified API, then legacy route. */
export async function fetchProgrammaticCampaignFromApi({
  campaignName,
  campaignId,
  accessToken,
}: {
  campaignName: string;
  campaignId: string;
  accessToken: string;
}): Promise<CampaignSnapshot | null> {
  const unified = await fetchCampaignFromApi({
    campaignName,
    campaignId,
    accessToken,
    platform: "programmatic",
  });
  if (unified) return unified;

  const name = campaignName.trim();
  const id = campaignId.trim();
  if (!name || !id || !accessToken) return null;

  try {
    const response = await fetch(
      `/api/programmatic-campaigns?campaign_name=${encodeURIComponent(name)}&campaign_id=${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const payload = await parseJsonResponse(response);
    if (!response.ok || !payload?.success || !payload.data) return null;
    return { ...(payload.data as CampaignSnapshot), platform: "programmatic" };
  } catch (error) {
    console.warn("[Adigator] Legacy programmatic campaign fetch failed:", error);
    return null;
  }
}

export { fetchCampaignIdsByName as fetchProgrammaticCampaignIdsByName };
