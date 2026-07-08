import type { ProgrammaticAdGroup, ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";
import { generateCampaignId } from "@/app/lib/campaignSnapshot";
import { notifyAdvertisersUpdated } from "@/app/lib/downloadHistoryStore";
import { readCachedJson, writeCachedJson, serializeWithoutHeavyFields } from "@/app/lib/clientStorageCache";

const PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY = "adigator_programmatic_campaigns_v1";

export { PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY };

const SILENT_PATCH_FIELDS = new Set([
  "dashboardOverviewCache",
  "dashboardPreviewCache",
  "previewStudioCache",
]);

export type ProgrammaticCampaignSnapshot = {

  id: string;

  ownerId: string;

  campaignName: string;

  campaignBrief: string;

  vertical: string;

  landingUrl: string;

  campaignGoal: string;

  campaignAudienceStage: string;

  campaignProductFocus: string;

  programmaticTaskType: ProgrammaticTaskTypeId | string;

  programmaticAdGroupCount: number | "";

  programmaticAdGroups: ProgrammaticAdGroup[];

  selectedProgrammaticAdGroupIds?: string[];

  applyProgrammaticAdGroupsToAll?: boolean;

  creatives: Record<string, unknown>[];

  analysisResult: Record<string, unknown>[] | null;

  urlValidation: Record<string, unknown> | null;

  /** Generated campaign intent — persisted until the brief changes. */
  campaignIntent?: string;

  campaignIntentFingerprint?: string;

  /** Step 3 alignment scores — persisted until inputs change. */
  campaignAlignmentReport?: import("@/app/lib/campaignAlignmentValidation").CampaignAlignmentReport | null;

  /** Persisted dashboard Analysis tab payload — avoids recomputing overview on each visit. */
  dashboardOverviewCache?: import("@/app/lib/dashboardCampaignCache").DashboardOverviewCache | null;

  /** Persisted dashboard Preview Studio payload — avoids rehydrating previews on each visit. */
  dashboardPreviewCache?: import("@/app/lib/dashboardCampaignCache").DashboardPreviewCache | null;

  /** Hash-keyed Preview Studio template outputs for programmatic Step 4 reuse. */
  previewStudioCache?: import("@/app/lib/previewStudioPersistence").PreviewStudioCache | null;

  /** Popup assistant clarifications — persisted until campaign inputs change. */
  campaignAssistantContext?: import("@/app/lib/campaignAssistant/types").CampaignAssistantClarification | null;

  destinationUrl?: string;

  utmParameters?: Record<string, string>;

  viewMode: "single" | "multiple";

  showSlotLabels: boolean;

  advertiserId?: string;

  advertiserName?: string;

  createdAt: string;

  updatedAt: string;

};



export type CampaignIdOption = {

  id: string;

  campaignName: string;

  updatedAt?: string;

};



function parseCampaigns(raw: string | null): ProgrammaticCampaignSnapshot[] {

  if (!raw) return [];

  try {

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];

  } catch {

    return [];

  }

}



function readAllCampaigns(): ProgrammaticCampaignSnapshot[] {

  if (typeof window === "undefined") return [];

  return readCachedJson(PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY, parseCampaigns, []);

}



function writeAllCampaigns(
  campaigns: ProgrammaticCampaignSnapshot[],
  options?: { notify?: boolean },
) {

  if (typeof window === "undefined") return;

  writeCachedJson(PROGRAMMATIC_CAMPAIGNS_STORAGE_KEY, campaigns, serializeWithoutHeavyFields);
  if (options?.notify !== false) {
    notifyAdvertisersUpdated();
  }

}



function belongsToOwner(campaign: ProgrammaticCampaignSnapshot, ownerId: string): boolean {

  if (!ownerId) return false;

  return campaign.ownerId === ownerId;

}



export function generateProgrammaticCampaignId(): string {
  return generateCampaignId("programmatic");
}

/** Reuse an existing campaign ID for update flows; only mint a new ID for campaign setup. */
export function resolveProgrammaticCampaignId(options: {
  taskType: string | null | undefined;
  activeCampaignId?: string | null;
  lookupCampaignId?: string | null;
  loadedCampaignId?: string | null;
  referenceCampaignId?: string | null;
}): string {
  const existingId = [
    options.activeCampaignId,
    options.lookupCampaignId,
    options.loadedCampaignId,
    options.referenceCampaignId,
  ]
    .map((id) => id?.trim())
    .find(Boolean);

  if (existingId) return existingId;

  if (options.taskType === "campaign_setup") {
    return generateCampaignId("programmatic");
  }

  return "";
}



export function listProgrammaticCampaigns(ownerId: string): ProgrammaticCampaignSnapshot[] {

  if (!ownerId) return [];

  return readAllCampaigns().filter((campaign) => belongsToOwner(campaign, ownerId));

}



export function listCampaignIdsByName(campaignName: string, ownerId: string): CampaignIdOption[] {

  const normalizedName = campaignName.trim().toLowerCase();

  if (!normalizedName || !ownerId) return [];



  return listProgrammaticCampaigns(ownerId)

    .filter((campaign) => campaign.campaignName.trim().toLowerCase() === normalizedName)

    .map((campaign) => ({

      id: campaign.id,

      campaignName: campaign.campaignName,

      updatedAt: campaign.updatedAt,

    }))

    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

}



export function findProgrammaticCampaign({

  campaignId,

  campaignName,

  ownerId,

}: {

  campaignId: string;

  campaignName: string;

  ownerId: string;

}): ProgrammaticCampaignSnapshot | null {

  const normalizedId = campaignId.trim().toLowerCase();

  const normalizedName = campaignName.trim().toLowerCase();

  if (!normalizedId || !normalizedName || !ownerId) return null;



  return (

    listProgrammaticCampaigns(ownerId).find(

      (campaign) =>

        campaign.id.trim().toLowerCase() === normalizedId

        && campaign.campaignName.trim().toLowerCase() === normalizedName,

    ) || null

  );

}



export function upsertProgrammaticCampaign(snapshot: ProgrammaticCampaignSnapshot): ProgrammaticCampaignSnapshot {

  if (typeof window === "undefined") return snapshot;

  if (!snapshot.ownerId) {

    throw new Error("Campaign snapshot requires ownerId");

  }



  const campaigns = readAllCampaigns();

  const nextSnapshot = {

    ...snapshot,

    updatedAt: new Date().toISOString(),

    createdAt: snapshot.createdAt || new Date().toISOString(),

  };

  const foreignIndex = campaigns.findIndex(

    (campaign) => campaign.id === nextSnapshot.id && campaign.ownerId !== nextSnapshot.ownerId,

  );

  if (foreignIndex >= 0) {

    throw new Error("Campaign ID belongs to another user");

  }



  const index = campaigns.findIndex(

    (campaign) => campaign.id === nextSnapshot.id && campaign.ownerId === nextSnapshot.ownerId,

  );

  const nextCampaigns = [...campaigns];

  if (index >= 0) {

    nextCampaigns[index] = nextSnapshot;

  } else {

    nextCampaigns.unshift(nextSnapshot);

  }



  writeAllCampaigns(nextCampaigns);

  return nextSnapshot;

}



export function patchProgrammaticCampaignFields(
  campaignId: string,
  ownerId: string,
  patch: Partial<Pick<ProgrammaticCampaignSnapshot,
    | "dashboardOverviewCache"
    | "dashboardPreviewCache"
    | "previewStudioCache"
    | "campaignIntent"
    | "campaignIntentFingerprint"
    | "campaignAlignmentReport"
  >>,
): ProgrammaticCampaignSnapshot | null {
  if (typeof window === "undefined" || !campaignId || !ownerId) return null;

  const existing = getProgrammaticCampaignById(campaignId, ownerId);
  if (!existing) return null;

  const campaigns = readAllCampaigns();
  const index = campaigns.findIndex(
    (campaign) => campaign.id === campaignId && campaign.ownerId === ownerId,
  );
  if (index < 0) return null;

  const nextSnapshot = {
    ...existing,
    ...patch,
  };
  campaigns[index] = nextSnapshot;
  const patchKeys = Object.keys(patch);
  const silentOnly = patchKeys.length > 0 && patchKeys.every((key) => SILENT_PATCH_FIELDS.has(key));
  writeAllCampaigns(campaigns, { notify: !silentOnly });
  return nextSnapshot;
}

export function getProgrammaticCampaignById(campaignId: string, ownerId: string): ProgrammaticCampaignSnapshot | null {
  const normalizedId = campaignId.trim().toLowerCase();

  if (!normalizedId || !ownerId) return null;

  return (

    listProgrammaticCampaigns(ownerId).find((campaign) => campaign.id.trim().toLowerCase() === normalizedId) || null

  );

}


