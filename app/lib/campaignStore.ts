import type { CampaignSnapshot, CampaignIdOption } from "@/app/lib/campaignSnapshot";
import type { AnalyzerPlatform } from "@/app/lib/platforms/types";
import { notifyAdvertisersUpdated } from "@/app/lib/downloadHistoryStore";
import { readCachedJson, writeCachedJson, serializeWithoutHeavyFields } from "@/app/lib/clientStorageCache";
import {
  getProgrammaticCampaignById,
  upsertProgrammaticCampaign,
  PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY,
  type ProgrammaticCampaignSnapshot,
} from "@/app/lib/programmaticCampaignStore";

export const CAMPAIGNS_STORAGE_KEY = "adigator_campaigns_v2";

const SILENT_PATCH_FIELDS = new Set([
  "dashboardOverviewCache",
  "dashboardPreviewCache",
  "previewStudioCache",
]);

function parseCampaigns(raw: string | null): CampaignSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function migrateProgrammaticSnapshot(snapshot: ProgrammaticCampaignSnapshot): CampaignSnapshot {
  return {
    ...(snapshot as unknown as CampaignSnapshot),
    platform: "programmatic",
    campaignTaskType: snapshot.programmaticTaskType || "campaign_setup",
  };
}

function loadAllCampaigns(ownerId?: string): CampaignSnapshot[] {
  const unified = readCachedJson(CAMPAIGNS_STORAGE_KEY, parseCampaigns, []);
  if (unified.length) {
    return ownerId ? unified.filter((item) => item.ownerId === ownerId) : unified;
  }

  const legacy = readCachedJson(
    PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY,
    (raw) => parseCampaigns(raw) as unknown as ProgrammaticCampaignSnapshot[],
    [],
  );
  const migrated = legacy.map(migrateProgrammaticSnapshot);
  if (migrated.length) {
    writeCachedJson(CAMPAIGNS_STORAGE_KEY, migrated, serializeWithoutHeavyFields);
  }
  return ownerId ? migrated.filter((item) => item.ownerId === ownerId) : migrated;
}

function saveAllCampaigns(campaigns: CampaignSnapshot[]): void {
  writeCachedJson(CAMPAIGNS_STORAGE_KEY, campaigns, serializeWithoutHeavyFields);
  notifyAdvertisersUpdated();
}

export function getCampaignById(id: string, ownerId: string): CampaignSnapshot | null {
  if (!id || !ownerId) return null;
  const match = loadAllCampaigns(ownerId).find((item) => item.id === id);
  if (match) return match;
  const legacy = getProgrammaticCampaignById(id, ownerId);
  return legacy ? migrateProgrammaticSnapshot(legacy) : null;
}

export function listCampaignsByPlatform(ownerId: string, platform?: AnalyzerPlatform): CampaignSnapshot[] {
  const all = loadAllCampaigns(ownerId);
  if (!platform) return all;
  return all.filter((item) => item.platform === platform);
}

export function listCampaignIdOptions(
  ownerId: string,
  campaignName: string,
  platform?: AnalyzerPlatform,
): CampaignIdOption[] {
  const trimmed = campaignName.trim().toLowerCase();
  if (!trimmed) return [];
  return loadAllCampaigns(ownerId)
    .filter((item) => {
      if (platform && item.platform !== platform) return false;
      return item.campaignName.trim().toLowerCase().includes(trimmed);
    })
    .map((item) => ({
      id: item.id,
      campaignName: item.campaignName,
      platform: item.platform,
      updatedAt: item.updatedAt,
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export function upsertCampaign(snapshot: CampaignSnapshot): CampaignSnapshot {
  const all = loadAllCampaigns();
  const index = all.findIndex((item) => item.id === snapshot.id && item.ownerId === snapshot.ownerId);
  const next = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    all[index] = { ...all[index], ...next };
  } else {
    all.push({
      ...next,
      createdAt: next.createdAt || next.updatedAt,
    });
  }
  saveAllCampaigns(all);

  if (snapshot.platform === "programmatic") {
    upsertProgrammaticCampaign(snapshot as unknown as ProgrammaticCampaignSnapshot);
  }

  return index >= 0 ? all[index] : all[all.length - 1];
}

export function patchCampaign(
  id: string,
  ownerId: string,
  patch: Partial<CampaignSnapshot>,
): CampaignSnapshot | null {
  const existing = getCampaignById(id, ownerId);
  if (!existing) return null;
  return upsertCampaign({ ...existing, ...patch, updatedAt: new Date().toISOString() });
}

export function deleteCampaign(id: string, ownerId: string): boolean {
  const all = loadAllCampaigns();
  const next = all.filter((item) => !(item.id === id && item.ownerId === ownerId));
  if (next.length === all.length) return false;
  saveAllCampaigns(next);
  return true;
}
