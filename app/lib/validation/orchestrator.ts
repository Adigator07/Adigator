import type { ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";
import type {
  CampaignBrain,
  CreativeBrain,
  LandingPageBrain,
  ValidationBrain,
  ValidationEngineId,
  ValidationQuality,
  ValidationRunStatus,
  ValidationVersion,
} from "@/app/lib/brains/types";
import {
  buildStalenessPlan,
  type BuildStalenessPlanInput,
  type CreativeStalenessItem,
} from "@/app/lib/brains/staleness";
import type {
  EngineExecutionRecord,
  ValidationEngineRegistry,
} from "@/app/lib/validation/engineContracts";

const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 500;

export type ValidationOrchestratorInput = BuildStalenessPlanInput & {
  ownerId: string;
  campaignId: string;
  taskType: ProgrammaticTaskTypeId | string;
  engines: ValidationEngineRegistry;
  existingVersionNumber?: number;
};

export type ValidationOrchestratorResult = {
  version: ValidationVersion;
  campaignBrain: CampaignBrain | null;
  creativeBrains: CreativeBrain[];
  landingBrain: LandingPageBrain | null;
  validationBrain: ValidationBrain | null;
  engineRecords: EngineExecutionRecord[];
  stalenessPlan: Awaited<ReturnType<typeof buildStalenessPlan>>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(
  engineId: ValidationEngineId,
  runner: () => Promise<{ status: "success" | "failed"; data: T | null; error?: string }>,
): Promise<{ status: "success" | "degraded" | "failed"; data: T | null; error?: string; retriesUsed: number }> {
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await runner();
      if (result.status === "success") {
        return { status: "success", data: result.data, retriesUsed: attempt };
      }
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_BACKOFF_MS * 2 ** attempt);
    }
  }
  const isFoundation = engineId === "campaign";
  return {
    status: isFoundation ? "failed" : "degraded",
    data: null,
    error: lastError,
    retriesUsed: MAX_RETRIES,
  };
}

function deriveRunStatus(
  records: EngineExecutionRecord[],
  campaignBrain: CampaignBrain | null,
): { status: ValidationRunStatus; quality: ValidationQuality; missing: ValidationEngineId[] } {
  const missing = records
    .filter((record) => record.status === "degraded" || record.status === "failed")
    .map((record) => record.engineId);

  if (!campaignBrain) {
    return { status: "failed", quality: "degraded", missing };
  }
  if (missing.length > 0) {
    return { status: "partial_success", quality: "degraded", missing };
  }
  return { status: "success", quality: "full", missing: [] };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `val-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Validation Orchestrator — application code that decides which engines run,
 * reuses stored brains when hashes match, and creates immutable validation versions.
 */
export async function runValidationOrchestrator(
  input: ValidationOrchestratorInput,
): Promise<ValidationOrchestratorResult> {
  const stalenessPlan = await buildStalenessPlan(input);
  const engineRecords: EngineExecutionRecord[] = [];
  const now = new Date().toISOString();

  let campaignBrain: CampaignBrain | null = input.campaign.storedCampaignBrain ?? null;
  let landingBrain: LandingPageBrain | null = input.landing.storedLandingBrain ?? null;
  const creativeBrains: CreativeBrain[] = [];
  let validationBrain: ValidationBrain | null = null;

  const shouldRun = (engineId: ValidationEngineId) =>
    stalenessPlan.enginesToRun.includes(engineId);

  // ── Campaign Brain ─────────────────────────────────────────────────────────
  if (shouldRun("campaign") && input.engines.campaign) {
    const result = await runWithRetry("campaign", async () => {
      const engineResult = await input.engines.campaign!.generate({
        campaignId: input.campaignId,
        briefText: input.campaign.briefText,
        campaignGoal: input.campaign.campaignGoal,
        vertical: input.campaign.vertical,
        targetAudience: input.campaign.targetAudience,
        offer: input.campaign.offer,
        cta: input.campaign.cta,
        platform: input.campaign.platform,
        objectiveMapping: input.campaign.platformConfig as CampaignBrain["objectiveMapping"] | undefined,
        landingUrl: input.campaign.landingUrl,
      });
      if (engineResult.status === "success" && engineResult.data) {
        return { status: "success" as const, data: engineResult.data };
      }
      return { status: "failed" as const, data: null, error: engineResult.error };
    });
    engineRecords.push({
      engineId: "campaign",
      status: result.status,
      error: result.error,
      retriesUsed: result.retriesUsed,
    });
    if (result.data) campaignBrain = result.data;
  } else if (campaignBrain) {
    engineRecords.push({ engineId: "campaign", status: "skipped", retriesUsed: 0 });
  }

  // Campaign Brain is required for downstream engines.
  if (!campaignBrain && shouldRun("creative")) {
    const version = buildValidationVersion({
      input,
      stalenessPlan,
      engineRecords,
      campaignBrain: null,
      creativeBrains: [],
      landingBrain: null,
      validationBrain: null,
      now,
    });
    return {
      version,
      campaignBrain: null,
      creativeBrains: [],
      landingBrain: null,
      validationBrain: null,
      engineRecords,
      stalenessPlan,
    };
  }

  // ── Creative Brains ────────────────────────────────────────────────────────
  if (shouldRun("creative") && input.engines.creative && campaignBrain) {
    const staleSet = new Set(stalenessPlan.staleCreativeIds);
    for (const creative of input.creatives) {
      if (!staleSet.has(creative.creativeId) && creative.storedCreativeBrain) {
        creativeBrains.push(creative.storedCreativeBrain);
        continue;
      }

      const result = await runWithRetry("creative", async () => {
        const engineResult = await input.engines.creative!.generate({
          creativeId: creative.creativeId,
          campaignBrainId: campaignBrain!.id,
          imageBytesHash: creative.imageBytesHash,
          overlayText: creative.overlayText,
        });
        if (engineResult.status === "success" && engineResult.data) {
          return { status: "success" as const, data: engineResult.data };
        }
        return { status: "failed" as const, data: null, error: engineResult.error };
      });

      if (!engineRecords.some((r) => r.engineId === "creative")) {
        engineRecords.push({
          engineId: "creative",
          status: result.status,
          error: result.error,
          retriesUsed: result.retriesUsed,
        });
      }

      if (result.data) {
        creativeBrains.push(result.data);
      } else if (creative.storedCreativeBrain) {
        creativeBrains.push(creative.storedCreativeBrain);
      }
    }
  } else {
    for (const creative of input.creatives) {
      if (creative.storedCreativeBrain) {
        creativeBrains.push(creative.storedCreativeBrain);
      }
    }
    if (creativeBrains.length > 0) {
      engineRecords.push({ engineId: "creative", status: "skipped", retriesUsed: 0 });
    }
  }

  // ── Landing Page Brain ───────────────────────────────────────────────────────
  if (shouldRun("landing_page") && input.engines.landing_page && input.hasLandingUrl) {
    const result = await runWithRetry("landing_page", async () => {
      const engineResult = await input.engines.landing_page!.generate({
        landingUrl: input.landing.landingUrl,
        fetchedContentHash: input.landing.fetchedContentHash,
      });
      if (engineResult.status === "success" && engineResult.data) {
        return { status: "success" as const, data: engineResult.data };
      }
      return { status: "failed" as const, data: null, error: engineResult.error };
    });
    engineRecords.push({
      engineId: "landing_page",
      status: result.status,
      error: result.error,
      retriesUsed: result.retriesUsed,
    });
    if (result.data) landingBrain = result.data;
  } else if (landingBrain) {
    engineRecords.push({ engineId: "landing_page", status: "skipped", retriesUsed: 0 });
  }

  // ── Technical Validation ─────────────────────────────────────────────────────
  if (shouldRun("technical") && input.engines.technical) {
    const result = await runWithRetry("technical", async () => {
      const engineResult = await input.engines.technical!.validate({
        campaignId: input.campaignId,
        platform: input.campaign.platform,
        landingUrl: input.campaign.landingUrl,
        creatives: input.creatives.map((c: CreativeStalenessItem) => ({
          id: c.creativeId,
          name: c.creativeId,
          contentHash: c.imageBytesHash,
        })),
      });
      if (engineResult.status === "success") {
        return { status: "success" as const, data: engineResult.data };
      }
      return { status: "failed" as const, data: null, error: engineResult.error };
    });
    engineRecords.push({
      engineId: "technical",
      status: result.status,
      error: result.error,
      retriesUsed: result.retriesUsed,
    });
  }

  // ── Alignment Engine ─────────────────────────────────────────────────────────
  if (
    shouldRun("alignment")
    && input.engines.alignment
    && campaignBrain
    && landingBrain
    && creativeBrains.length > 0
  ) {
    const result = await runWithRetry("alignment", async () => {
      const engineResult = await input.engines.alignment!.align({
        campaignBrainId: campaignBrain!.id,
        creativeBrainIds: creativeBrains.map((b) => b.id),
        landingBrainId: landingBrain!.id,
        campaignBrain,
        creativeBrains,
        landingBrain,
      });
      if (engineResult.status === "success" && engineResult.data) {
        return { status: "success" as const, data: engineResult.data };
      }
      return { status: "failed" as const, data: null, error: engineResult.error };
    });
    engineRecords.push({
      engineId: "alignment",
      status: result.status,
      error: result.error,
      retriesUsed: result.retriesUsed,
    });
    if (result.data) validationBrain = result.data;
  }

  const version = buildValidationVersion({
    input,
    stalenessPlan,
    engineRecords,
    campaignBrain,
    creativeBrains,
    landingBrain,
    validationBrain,
    now,
  });

  return {
    version,
    campaignBrain,
    creativeBrains,
    landingBrain,
    validationBrain,
    engineRecords,
    stalenessPlan,
  };
}

function buildValidationVersion(args: {
  input: ValidationOrchestratorInput;
  stalenessPlan: Awaited<ReturnType<typeof buildStalenessPlan>>;
  engineRecords: EngineExecutionRecord[];
  campaignBrain: CampaignBrain | null;
  creativeBrains: CreativeBrain[];
  landingBrain: LandingPageBrain | null;
  validationBrain: ValidationBrain | null;
  now: string;
}): ValidationVersion {
  const { status, quality, missing } = deriveRunStatus(
    args.engineRecords,
    args.campaignBrain,
  );

  return {
    id: newId(),
    campaignId: args.input.campaignId,
    ownerId: args.input.ownerId,
    versionNumber: (args.input.existingVersionNumber ?? 0) + 1,
    taskType: args.input.taskType,
    triggerReason: args.stalenessPlan.triggerReason,
    campaignBrainId: args.campaignBrain?.id ?? null,
    creativeBrainIds: args.creativeBrains.map((b) => b.id),
    landingBrainId: args.landingBrain?.id ?? null,
    validationBrainId: args.validationBrain?.id ?? null,
    status,
    validationQuality: quality,
    missingModules: missing,
    createdAt: args.now,
  };
}
