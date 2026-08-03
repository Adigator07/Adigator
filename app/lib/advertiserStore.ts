import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import { getProgrammaticAdGroupObjectiveLabel } from "@/app/lib/programmaticWorkflow";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import {
  getProgrammaticCampaignById,
  listProgrammaticCampaigns,
  patchProgrammaticCampaignFields,
} from "@/app/lib/programmaticCampaignStore";
import {
  buildAnalysisReportsFromResults,
  type AdvertiserAnalysisReport,
} from "@/app/lib/advertiserAnalysisReports";
import {
  buildBriefIntentSummary,
  resolveCampaignBriefContext,
  resolveCampaignIntentForBrief,
  type BriefIntentSummary,
} from "@/app/lib/campaignBriefValidation";
import { notifyAdvertisersUpdated } from "@/app/lib/downloadHistoryStore";
import { readCachedJson, writeCachedJson } from "@/app/lib/clientStorageCache";

export type { AdvertiserAnalysisReport };

export const ADVERTISERS_STORAGE_KEY = "adigator_advertisers_v1";

export type AdvertiserCreativeRef = {
  id: string;
  name: string;
  size?: string;
  valid?: boolean;
  previewUrl?: string;
  fullUrl?: string;
  mediaType?: string;
};

export type AdvertiserAdGroup = {
  id: string;
  name: string;
  objective: string;
  objectiveLabel: string;
  creatives: AdvertiserCreativeRef[];
};

export type AdvertiserCampaign = {
  id: string;
  name: string;
  platform: string;
  taskType?: string;
  validated: boolean;
  updatedAt: string;
  adGroups: AdvertiserAdGroup[];
  analysisReports?: AdvertiserAnalysisReport[];
  campaignBrief?: string;
  campaignIntent?: string;
  campaignIntentFingerprint?: string;
  campaignGoal?: string;
  vertical?: string;
};

export type Advertiser = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  campaigns: AdvertiserCampaign[];
};

function parseAdvertisers(raw: string | null): Advertiser[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readAllAdvertisers(): Advertiser[] {
  if (typeof window === "undefined") return [];
  return readCachedJson(ADVERTISERS_STORAGE_KEY, parseAdvertisers, []);
}

function writeAllAdvertisers(advertisers: Advertiser[]) {
  if (typeof window === "undefined") return;
  writeCachedJson(ADVERTISERS_STORAGE_KEY, advertisers, (data) => JSON.stringify(data));
  notifyAdvertisersUpdated();
}

export function slugifyAdvertiserName(name: string): string {
  const slug = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.slice(0, 16) || "BRAND";
}

export function generateAdvertiserId(name: string, ownerId: string): string {
  const slug = slugifyAdvertiserName(name);
  const existing = listAdvertisers(ownerId);
  const maxSeq = existing.reduce((max, advertiser) => {
    const match = /^(\d+)-AD-/.exec(advertiser.id);
    const seq = match ? Number(match[1]) : 0;
    return Math.max(max, Number.isFinite(seq) ? seq : 0);
  }, 0);
  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  let candidate = `${nextSeq}-AD-${slug}`;
  let suffix = 1;
  while (existing.some((item) => item.id === candidate)) {
    candidate = `${nextSeq}-AD-${slug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function listAdvertisers(ownerId: string): Advertiser[] {
  if (!ownerId) return [];
  return readAllAdvertisers()
    .filter((advertiser) => advertiser.ownerId === ownerId && advertiser.campaigns.length > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function findAdvertiserByName(name: string, ownerId: string): Advertiser | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized || !ownerId) return null;
  return listAdvertisers(ownerId).find((item) => item.name.trim().toLowerCase() === normalized) || null;
}

export function findAdvertiserById(advertiserId: string, ownerId: string): Advertiser | null {
  const normalized = advertiserId.trim().toUpperCase();
  if (!normalized || !ownerId) return null;
  return listAdvertisers(ownerId).find((item) => item.id.toUpperCase() === normalized) || null;
}

export function getAdvertiserCampaigns(advertiserId: string, ownerId: string): AdvertiserCampaign[] {
  const advertiser = findAdvertiserById(advertiserId, ownerId);
  if (!advertiser) return [];
  return [...advertiser.campaigns].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );
}

export function createOrGetAdvertiser(name: string, ownerId: string): Advertiser {
  const trimmed = name.trim();
  if (!trimmed || !ownerId) {
    throw new Error("Advertiser name and owner are required");
  }

  const existing = findAdvertiserByName(trimmed, ownerId);
  if (existing) return existing;

  if (isBlockedAdvertiserName(trimmed)) {
    throw new Error("Invalid advertiser name");
  }

  const now = new Date().toISOString();
  const advertiser: Advertiser = {
    id: generateAdvertiserId(trimmed, ownerId),
    name: trimmed,
    ownerId,
    createdAt: now,
    updatedAt: now,
    campaigns: [],
  };

  const all = readAllAdvertisers();
  writeAllAdvertisers([advertiser, ...all]);
  return advertiser;
}

function mapCreativesFromSnapshot(creatives: Record<string, unknown>[], adGroupId?: string): AdvertiserCreativeRef[] {
  return creatives
    .filter((creative) => !adGroupId || creative.adGroupId === adGroupId)
    .map((creative) => ({
      id: String(creative.id || ""),
      name: String(creative.name || creative.originalFile || "Creative"),
      size: typeof creative.size === "string" ? creative.size : undefined,
      valid: typeof creative.valid === "boolean" ? creative.valid : undefined,
      previewUrl: resolveStoredCreativePreviewUrl(creative),
      fullUrl: typeof creative.fullUrl === "string" ? creative.fullUrl : undefined,
      mediaType: typeof creative.mediaType === "string" ? creative.mediaType : undefined,
    }))
    .filter((creative) => creative.id);
}

/** Resolve a displayable preview URL from persisted creative metadata. */
export function resolveStoredCreativePreviewUrl(creative: Record<string, unknown>): string | undefined {
  const candidates = [
    creative.previewUrl,
    creative.url,
    creative.previewDataUrl,
    creative.imageDataUrl,
    creative.image,
  ];

  for (const value of candidates) {
    if (typeof value !== "string" || !value.trim()) continue;
    if (value.startsWith("data:") || /^https?:\/\//i.test(value) || value.startsWith("blob:")) {
      return value;
    }
  }

  return undefined;
}

function mapAdGroupsFromSnapshot(
  adGroups: ProgrammaticAdGroup[],
  creatives: Record<string, unknown>[],
): AdvertiserAdGroup[] {
  if (adGroups.length) {
    return adGroups.map((group) => ({
      id: group.id,
      name: group.name?.trim() || "Unnamed Ad Group",
      objective: group.objective || "",
      objectiveLabel: getProgrammaticAdGroupObjectiveLabel(group),
      creatives: mapCreativesFromSnapshot(creatives, group.id),
    }));
  }

  if (!creatives.length) return [];

  return [{
    id: "default-ad-group",
    name: "Creatives",
    objective: "",
    objectiveLabel: "Not set",
    creatives: mapCreativesFromSnapshot(creatives),
  }];
}

export function countValidatedCampaigns(advertiser: Advertiser): number {
  return advertiser.campaigns.filter((campaign) => campaign.validated).length;
}

/** Exact names that should never appear (autocomplete typos / partial entries). */
const BLOCKED_ADVERTISER_NAMES = new Set(["burger", "burger kin"]);

export function isBlockedAdvertiserName(name: string): boolean {
  return BLOCKED_ADVERTISER_NAMES.has(name.trim().toLowerCase());
}

/**
 * Remove junk advertisers (blocked names, empty prefix duplicates of real brands).
 * Persists the cleaned list and returns valid advertisers for the owner.
 */
export function pruneInvalidAdvertisers(ownerId: string): Advertiser[] {
  if (!ownerId) return [];

  const all = readAllAdvertisers();
  const ownerAdvertisers = all.filter((item) => item.ownerId === ownerId);
  const removeIds = new Set<string>();

  ownerAdvertisers.forEach((advertiser) => {
    if (isBlockedAdvertiserName(advertiser.name)) {
      removeIds.add(advertiser.id);
      return;
    }
    if (advertiser.campaigns.length === 0) {
      removeIds.add(advertiser.id);
    }
  });

  if (removeIds.size === 0) return listAdvertisers(ownerId);

  writeAllAdvertisers(all.filter((item) => !(item.ownerId === ownerId && removeIds.has(item.id))));
  return listAdvertisers(ownerId);
}

export function persistAdvertiserCampaignSelection(options: {
  ownerId: string;
  advertiserId?: string;
  advertiserName: string;
  campaign: Omit<AdvertiserCampaign, "updatedAt"> & {
    updatedAt?: string;
    adGroups?: AdvertiserAdGroup[];
    creatives?: Array<Record<string, unknown>>;
  };
}): Advertiser {
  const { ownerId, advertiserName, campaign } = options;
  const trimmedAdvertiserName = advertiserName.trim();
  const resolvedAdvertiserId = options.advertiserId?.trim();

  if (!ownerId || !trimmedAdvertiserName || !campaign.id) {
    throw new Error("Invalid advertiser campaign selection payload");
  }

  const resolvedAdvertiser = resolvedAdvertiserId
    ? findAdvertiserById(resolvedAdvertiserId, ownerId) || createOrGetAdvertiser(trimmedAdvertiserName, ownerId)
    : createOrGetAdvertiser(trimmedAdvertiserName, ownerId);

  return syncAdvertiserCampaign({
    ownerId,
    advertiserId: resolvedAdvertiser.id,
    advertiserName: trimmedAdvertiserName,
    campaign: {
      ...campaign,
      adGroups: campaign.adGroups || [],
      updatedAt: campaign.updatedAt || new Date().toISOString(),
    },
  });
}

export function syncAdvertiserCampaign(options: {
  ownerId: string;
  advertiserId: string;
  advertiserName: string;
  campaign: Omit<AdvertiserCampaign, "updatedAt"> & { updatedAt?: string };
}): Advertiser {
  const { ownerId, advertiserId, advertiserName, campaign } = options;
  if (!ownerId || !advertiserId || !advertiserName.trim() || !campaign.id) {
    throw new Error("Invalid advertiser campaign sync payload");
  }

  const all = readAllAdvertisers();
  const index = all.findIndex((item) => item.ownerId === ownerId && item.id === advertiserId);
  const now = new Date().toISOString();

  const nextCampaign: AdvertiserCampaign = {
    ...campaign,
    updatedAt: campaign.updatedAt || now,
  };

  if (index < 0) {
    const created: Advertiser = {
      id: advertiserId,
      name: advertiserName.trim(),
      ownerId,
      createdAt: now,
      updatedAt: now,
      campaigns: [nextCampaign],
    };
    writeAllAdvertisers([created, ...all]);
    return created;
  }

  const current = all[index];
  const campaignIndex = current.campaigns.findIndex((item) => item.id === nextCampaign.id);
  const campaigns = [...current.campaigns];
  if (campaignIndex >= 0) {
    campaigns[campaignIndex] = nextCampaign;
  } else {
    campaigns.unshift(nextCampaign);
  }

  const updated: Advertiser = {
    ...current,
    name: advertiserName.trim(),
    updatedAt: now,
    campaigns,
  };

  const nextAll = [...all];
  nextAll[index] = updated;
  writeAllAdvertisers(nextAll);
  return updated;
}

export function resolveCampaignBriefAndIntent(
  campaign: AdvertiserCampaign,
  ownerId?: string,
  options?: { readOnly?: boolean },
): { brief: string; intentSummary: BriefIntentSummary | null; intentLine: string } {
  const readOnly = options?.readOnly ?? false;
  const snapshot = ownerId && !readOnly
    ? listProgrammaticCampaigns(ownerId).find((item) => item.id === campaign.id) || null
    : null;

  const context = resolveCampaignBriefContext(campaign, snapshot);
  const { brief, goal, vertical, storedIntent, storedFingerprint } = context;

  if (!brief) {
    return { brief: "", intentSummary: null, intentLine: "" };
  }

  const intentOptions = { campaignGoal: goal, vertical };
  const resolved = resolveCampaignIntentForBrief(brief, {
    ...intentOptions,
    storedIntent: storedIntent || campaign.campaignIntent,
    storedFingerprint: storedFingerprint || campaign.campaignIntentFingerprint,
  });

  if (!readOnly && resolved.regenerated && resolved.intent && ownerId) {
    if (snapshot) {
      patchProgrammaticCampaignFields(snapshot.id, ownerId, {
        campaignIntent: resolved.intent,
        campaignIntentFingerprint: resolved.fingerprint,
        dashboardOverviewCache: null,
      });
    }

    const advertiser = listAdvertisers(ownerId).find((item) =>
      item.campaigns.some((entry) => entry.id === campaign.id),
    );
    if (advertiser) {
      syncAdvertiserCampaign({
        ownerId,
        advertiserId: advertiser.id,
        advertiserName: advertiser.name,
        campaign: {
          ...campaign,
          campaignBrief: brief,
          campaignIntent: resolved.intent,
          campaignIntentFingerprint: resolved.fingerprint,
          campaignGoal: goal,
          vertical,
        },
      });
    }
  }

  return {
    brief,
    intentSummary: buildBriefIntentSummary(brief, intentOptions),
    intentLine: resolved.intent,
  };
}

export function syncAdvertiserFromProgrammaticSnapshot(
  snapshot: ProgrammaticCampaignSnapshot & { advertiserId?: string; advertiserName?: string },
): Advertiser | null {
  const advertiserId = snapshot.advertiserId?.trim();
  const advertiserName = snapshot.advertiserName?.trim();
  if (!advertiserId || !advertiserName || !snapshot.ownerId) return null;

  const validated = Array.isArray(snapshot.analysisResult) && snapshot.analysisResult.length > 0;
  const brief = snapshot.campaignBrief?.trim() || "";
  const resolved = resolveCampaignIntentForBrief(brief, {
    campaignGoal: snapshot.campaignGoal,
    vertical: snapshot.vertical,
    storedIntent: snapshot.campaignIntent,
    storedFingerprint: snapshot.campaignIntentFingerprint,
  });
  const intent = resolved.intent;

  if (resolved.regenerated && intent && snapshot.ownerId) {
    patchProgrammaticCampaignFields(snapshot.id, snapshot.ownerId, {
      campaignIntent: intent,
      campaignIntentFingerprint: resolved.fingerprint,
      dashboardOverviewCache: null,
    });
  }

  return syncAdvertiserCampaign({
    ownerId: snapshot.ownerId,
    advertiserId,
    advertiserName,
    campaign: {
      id: snapshot.id,
      name: snapshot.campaignName,
      platform: "programmatic",
      taskType: snapshot.programmaticTaskType,
      validated,
      updatedAt: snapshot.updatedAt,
      adGroups: mapAdGroupsFromSnapshot(snapshot.programmaticAdGroups || [], snapshot.creatives || []),
      analysisReports: buildAnalysisReportsFromResults(
        snapshot.analysisResult,
        snapshot.creatives || [],
        snapshot.updatedAt,
      ),
      campaignBrief: brief || undefined,
      campaignIntent: intent || undefined,
      campaignIntentFingerprint: intent ? resolved.fingerprint : undefined,
      campaignGoal: snapshot.campaignGoal,
      vertical: snapshot.vertical,
    },
  });
}

export function syncAdvertiserFromGenericSession(options: {
  ownerId: string;
  advertiserId: string;
  advertiserName: string;
  campaignId: string;
  campaignName: string;
  platform: string;
  campaignGoal?: string;
  validated: boolean;
  creatives: Array<{
    id: string;
    name?: string;
    size?: string;
    valid?: boolean;
    url?: string;
    fullUrl?: string;
    mediaType?: string;
    adGroupId?: string | null;
    adGroupName?: string | null;
    adGroupObjective?: string | null;
  }>;
}): Advertiser {
  const adGroupMap = new Map<string, AdvertiserAdGroup>();

  (options.creatives || []).forEach((creative) => {
    const groupId = creative.adGroupId || "default-ad-group";
    const groupName = creative.adGroupName?.trim() || "Creatives";
    const objective = creative.adGroupObjective || options.campaignGoal || "";
    if (!adGroupMap.has(groupId)) {
      adGroupMap.set(groupId, {
        id: groupId,
        name: groupName,
        objective,
        objectiveLabel: objective || "Not set",
        creatives: [],
      });
    }
    adGroupMap.get(groupId)!.creatives.push({
      id: creative.id,
      name: creative.name || "Creative",
      size: creative.size,
      valid: creative.valid,
      previewUrl: resolveStoredCreativePreviewUrl(creative as Record<string, unknown>),
      fullUrl: creative.fullUrl,
      mediaType: creative.mediaType,
    });
  });

  return syncAdvertiserCampaign({
    ownerId: options.ownerId,
    advertiserId: options.advertiserId,
    advertiserName: options.advertiserName,
    campaign: {
      id: options.campaignId,
      name: options.campaignName,
      platform: options.platform,
      validated: options.validated,
      adGroups: [...adGroupMap.values()],
    },
  });
}

/** Rebuild advertiser records from stored programmatic campaigns (migration / repair). */
export function rebuildAdvertisersFromProgrammaticCampaigns(ownerId: string): Advertiser[] {
  if (!ownerId) return [];

  const campaigns = listProgrammaticCampaigns(ownerId);
  campaigns.forEach((snapshot) => {
    const extended = snapshot as ProgrammaticCampaignSnapshot & { advertiserId?: string; advertiserName?: string };
    if (extended.advertiserId && extended.advertiserName) {
      syncAdvertiserFromProgrammaticSnapshot(extended);
    }
  });

  return listAdvertisers(ownerId);
}
