import type { ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";
import type {
  CampaignBrain,
  CreativeBrain,
  LandingPageBrain,
  ValidationEngineId,
} from "@/app/lib/brains/types";
import {
  hashCampaignInputs,
  hashCreativeInputs,
  hashLandingPageInputs,
  type CampaignHashInput,
  type CreativeHashInput,
  type LandingPageHashInput,
} from "@/app/lib/brains/hashing";

export type CampaignStalenessInput = CampaignHashInput & {
  storedCampaignBrain?: CampaignBrain | null;
};

export type CreativeStalenessItem = CreativeHashInput & {
  storedCreativeBrain?: CreativeBrain | null;
};

export type LandingStalenessInput = LandingPageHashInput & {
  storedLandingBrain?: LandingPageBrain | null;
};

export type StalenessPlan = {
  enginesToRun: ValidationEngineId[];
  campaignStale: boolean;
  staleCreativeIds: string[];
  landingStale: boolean;
  triggerReason: string;
};

const URL_ONLY_TASKS: ProgrammaticTaskTypeId[] = ["url_validation_utm_update"];

const CREATIVE_ONLY_TASKS: ProgrammaticTaskTypeId[] = [
  "creative_addition",
  "creative_swap",
];

/**
 * Campaign-level fields that invalidate the Campaign Brain.
 */
export async function isCampaignBrainStale(input: CampaignStalenessInput): Promise<boolean> {
  if (!input.storedCampaignBrain) return true;
  const nextHash = await hashCampaignInputs(input);
  return nextHash !== input.storedCampaignBrain.hash;
}

/**
 * Creative-level staleness for a single creative.
 */
export async function isCreativeBrainStale(input: CreativeStalenessItem): Promise<boolean> {
  if (!input.storedCreativeBrain) return true;
  const nextHash = await hashCreativeInputs(input);
  return nextHash !== input.storedCreativeBrain.hash;
}

/**
 * Landing page staleness (URL + fetched content).
 */
export async function isLandingBrainStale(input: LandingStalenessInput): Promise<boolean> {
  if (!input.storedLandingBrain) return true;
  const nextHash = await hashLandingPageInputs(input);
  return nextHash !== input.storedLandingBrain.hash;
}

export type BuildStalenessPlanInput = {
  taskType: ProgrammaticTaskTypeId | string;
  campaign: CampaignStalenessInput;
  creatives: CreativeStalenessItem[];
  landing: LandingStalenessInput;
  hasLandingUrl: boolean;
};

/**
 * Determines which engines the Validation Orchestrator should invoke.
 * Routing is campaign-change-driven, not user-session-driven.
 */
export async function buildStalenessPlan(input: BuildStalenessPlanInput): Promise<StalenessPlan> {
  const taskType = input.taskType as ProgrammaticTaskTypeId;
  const engines = new Set<ValidationEngineId>();
  const reasons: string[] = [];

  const campaignStale = await isCampaignBrainStale(input.campaign);
  if (campaignStale) {
    engines.add("campaign");
    reasons.push("campaign context changed");
  }

  const staleCreativeIds: string[] = [];
  for (const creative of input.creatives) {
    const stale = await isCreativeBrainStale(creative);
    if (stale) {
      staleCreativeIds.push(creative.creativeId);
    }
  }

  const landingStale = input.hasLandingUrl
    ? await isLandingBrainStale(input.landing)
    : false;

  if (URL_ONLY_TASKS.includes(taskType)) {
    engines.clear();
    engines.add("technical");
    if (input.hasLandingUrl && landingStale) {
      engines.add("landing_page");
      reasons.push("landing page changed");
    }
    return {
      enginesToRun: [...engines],
      campaignStale,
      staleCreativeIds,
      landingStale,
      triggerReason: reasons.join("; ") || "url/utm validation",
    };
  }

  if (CREATIVE_ONLY_TASKS.includes(taskType)) {
    if (staleCreativeIds.length > 0) {
      engines.add("creative");
      reasons.push(`${staleCreativeIds.length} creative(s) changed`);
    }
    engines.add("technical");
    if (input.hasLandingUrl && landingStale) {
      engines.add("landing_page");
      reasons.push("landing page changed");
    }
    if (engines.has("campaign") || engines.has("creative") || engines.has("landing_page")) {
      engines.add("alignment");
    }
    return {
      enginesToRun: [...engines],
      campaignStale,
      staleCreativeIds,
      landingStale,
      triggerReason: reasons.join("; ") || "no changes detected",
    };
  }

  // Campaign setup, renewal, and default full-validation paths.
  if (staleCreativeIds.length > 0) {
    engines.add("creative");
    reasons.push(`${staleCreativeIds.length} creative(s) changed`);
  }
  if (input.hasLandingUrl && landingStale) {
    engines.add("landing_page");
    reasons.push("landing page changed");
  }

  engines.add("technical");

  if (engines.has("campaign") || engines.has("creative") || engines.has("landing_page")) {
    engines.add("alignment");
  } else if (!input.campaign.storedCampaignBrain) {
    engines.add("campaign");
    engines.add("creative");
    if (input.hasLandingUrl) engines.add("landing_page");
    engines.add("alignment");
    reasons.push("initial validation");
  }

  return {
    enginesToRun: [...engines],
    campaignStale,
    staleCreativeIds,
    landingStale,
    triggerReason: reasons.join("; ") || "incremental validation",
  };
}
