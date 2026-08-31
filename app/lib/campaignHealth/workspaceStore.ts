import type { CampaignHealthWorkspace } from "@/app/lib/campaignHealth/types";

const STORAGE_PREFIX = "adigator_campaign_health_v1:";

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}${ownerId || "guest"}`;
}

export function emptyCampaignHealthWorkspace(ownerId: string): CampaignHealthWorkspace {
  return {
    ownerId,
    intervalMinutes: 60,
    notifyInWorkspace: true,
    monitors: [],
    alerts: [],
    audit: [],
    reports: {},
    updatedAt: new Date().toISOString(),
  };
}

export function readCampaignHealthWorkspace(ownerId: string): CampaignHealthWorkspace {
  if (typeof window === "undefined") return emptyCampaignHealthWorkspace(ownerId);
  try {
    const raw = localStorage.getItem(storageKey(ownerId));
    if (!raw) return emptyCampaignHealthWorkspace(ownerId);
    const parsed = JSON.parse(raw) as CampaignHealthWorkspace;
    return {
      ...emptyCampaignHealthWorkspace(ownerId),
      ...parsed,
      monitors: Array.isArray(parsed.monitors) ? parsed.monitors : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      reports: parsed.reports && typeof parsed.reports === "object" ? parsed.reports : {},
    };
  } catch {
    return emptyCampaignHealthWorkspace(ownerId);
  }
}

export function writeCampaignHealthWorkspace(workspace: CampaignHealthWorkspace) {
  if (typeof window === "undefined") return;
  const next = { ...workspace, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(next.ownerId), JSON.stringify(next));
  window.dispatchEvent(new Event("adigator-campaign-health-updated"));
}

export function monitorKey(customerId: string, campaignId: string) {
  return `${String(customerId || "").replace(/\D/g, "")}:${String(campaignId || "").replace(/\D/g, "")}`;
}
