import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";
import type { ValidationEngineId } from "@/app/lib/brains/types";
import { runValidationOrchestrator } from "@/app/lib/validation/orchestrator";
import {
  getLatestCampaignBrain,
  getLatestCreativeBrainForCreative,
  getLatestLandingPageBrain,
  getLatestValidationVersionNumber,
  insertValidationBrain,
  insertValidationVersion,
  linkValidationVersionToCampaign,
} from "@/app/lib/brains/brainPersistence";
import { extractLandingPageSignals } from "@/app/lib/engines/landingPageExtraction";
import { createCampaignIntelligenceEngine } from "@/app/lib/engines/campaignIntelligence";
import { createCreativeIntelligenceEngine, type CreativeIntelligenceContext } from "@/app/lib/engines/creativeIntelligence";
import { createLandingPageIntelligenceEngine } from "@/app/lib/engines/landingPageIntelligence";
import { createAlignmentEngine } from "@/app/lib/engines/alignmentIntelligence";
import { createTechnicalValidationEngine } from "@/app/lib/engines/technicalValidationEngine";
import { getAnalysisPayloadFromBrain } from "@/app/lib/brains/creativeBrainPersistence";

export type OrchestratorRunContext = CreativeIntelligenceContext & {
  taskType: ProgrammaticTaskTypeId | string;
  audienceStage: string;
  campaignProductFocus?: string;
  platformConfig?: Record<string, unknown>;
  utmParameters?: Record<string, string>;
};

export type CreativeFileResolver = (
  creativeId: string,
) => Promise<{ file: File; imageBytesHash: string; overlayText?: string } | null>;

export type OrchestratorRunResult = {
  creativeBrainId: string;
  campaignBrainId: string | null;
  landingBrainId: string | null;
  validationBrainId: string | null;
  reused: boolean;
  analysis: Record<string, unknown> | null;
  validationVersion: number;
  enginesRun: ValidationEngineId[];
  triggerReason: string;
  launchReadiness: string | null;
  alignmentScore: number | null;
};

function enginesActuallyRan(
  engineRecords: Array<{ engineId: ValidationEngineId; status: string }>,
  stalenessEngines: ValidationEngineId[],
): ValidationEngineId[] {
  return engineRecords
    .filter((record) => {
      if (!stalenessEngines.includes(record.engineId)) return false;
      return record.status === "success" || record.status === "degraded";
    })
    .map((record) => record.engineId);
}

/**
 * Runs the full Validation Orchestrator with engine registry, persistence,
 * and immutable validation version linking.
 */
export async function runCampaignValidation(params: {
  supabase: SupabaseClient;
  context: OrchestratorRunContext;
  creativeId: string;
  imageBytesHash: string;
  imageFile: File;
  overlayText?: string;
}): Promise<OrchestratorRunResult> {
  const { supabase, context, creativeId, imageBytesHash, imageFile } = params;
  const hasLandingUrl = Boolean(context.landingUrl?.trim());

  const storedCampaignBrain = await getLatestCampaignBrain(
    supabase,
    context.userId,
    context.campaignId,
  );
  const storedCreativeBrain = await getLatestCreativeBrainForCreative(
    supabase,
    context.userId,
    context.campaignId,
    creativeId,
  );
  const storedLandingBrain = hasLandingUrl && context.landingUrl
    ? await getLatestLandingPageBrain(
        supabase,
        context.userId,
        context.campaignId,
        context.landingUrl,
      )
    : null;

  let landingContentHash = "";
  if (hasLandingUrl && context.landingUrl) {
    const normalizedUrl = context.landingUrl.trim();
    const storedSeo = storedLandingBrain?.seoSignals as {
      extraction?: { fetchedContentHash?: string };
    } | undefined;
    const cachedContentHash = storedSeo?.extraction?.fetchedContentHash;

    if (
      storedLandingBrain
      && storedLandingBrain.landingUrl === normalizedUrl
      && cachedContentHash
    ) {
      landingContentHash = cachedContentHash;
    } else {
      const landingSignals = await extractLandingPageSignals(
        normalizedUrl,
        context.campaignGoal,
      );
      landingContentHash = landingSignals.fetchedContentHash;
    }
  }

  const latestVersionNumber = await getLatestValidationVersionNumber(
    supabase,
    context.userId,
    context.campaignId,
  );

  const fileResolver: CreativeFileResolver = async (id) => {
    if (id !== creativeId) return null;
    return {
      file: imageFile,
      imageBytesHash,
      overlayText: params.overlayText,
    };
  };

  const campaignEngineContext = {
    userId: context.userId,
    campaignId: context.campaignId,
    landingContentHash,
  };

  const orchestratorResult = await runValidationOrchestrator({
    ownerId: context.userId,
    campaignId: context.campaignId,
    taskType: context.taskType,
    existingVersionNumber: latestVersionNumber,
    campaign: {
      briefText: context.briefText,
      campaignGoal: context.campaignGoal,
      vertical: context.vertical,
      targetAudience: context.targetAudience,
      offer: context.offer,
      cta: context.cta,
      platform: context.platform,
      platformConfig: context.platformConfig,
      landingUrl: context.landingUrl,
      storedCampaignBrain,
    },
    creatives: [{
      creativeId,
      imageBytesHash,
      overlayText: params.overlayText,
      storedCreativeBrain,
    }],
    landing: {
      landingUrl: context.landingUrl || "",
      fetchedContentHash: landingContentHash,
      storedLandingBrain,
    },
    hasLandingUrl,
    engines: {
      campaign: createCampaignIntelligenceEngine(supabase, campaignEngineContext),
      creative: createCreativeIntelligenceEngine(supabase, context, fileResolver),
      landing_page: createLandingPageIntelligenceEngine(supabase, {
        userId: context.userId,
        campaignId: context.campaignId,
        campaignGoal: context.campaignGoal,
      }),
      alignment: createAlignmentEngine(),
      technical: createTechnicalValidationEngine(),
    },
  });

  const { version, campaignBrain, creativeBrains, landingBrain, validationBrain, engineRecords, stalenessPlan } =
    orchestratorResult;

  const primaryCreative = creativeBrains.find((b) => b.creativeId === creativeId) ?? creativeBrains[0];
  const creativeReused = Boolean(
    storedCreativeBrain
    && primaryCreative
    && storedCreativeBrain.id === primaryCreative.id
    && storedCreativeBrain.hash === primaryCreative.hash,
  );

  const enginesRun = enginesActuallyRan(engineRecords, stalenessPlan.enginesToRun);

  let persistedValidationBrainId: string | null = null;
  if (validationBrain && campaignBrain && landingBrain && creativeBrains.length > 0) {
    const persisted = await insertValidationBrain(supabase, {
      userId: context.userId,
      campaignId: context.campaignId,
      campaignBrainId: campaignBrain.id,
      creativeBrainIds: creativeBrains.map((b) => b.id),
      landingBrainId: landingBrain.id,
      validationResults: validationBrain.validationResults,
      overallScore: validationBrain.overallScore,
      launchReadiness: validationBrain.launchReadiness,
      recommendations: validationBrain.recommendations,
      warningFlags: validationBrain.warningFlags,
      optimizationSuggestions: validationBrain.optimizationSuggestions,
    });
    persistedValidationBrainId = persisted.id;
  }

  const shouldCreateVersion = enginesRun.some(
    (id) => id === "campaign" || id === "creative" || id === "landing_page" || id === "alignment",
  );

  let validationVersionNumber = latestVersionNumber;
  if (shouldCreateVersion) {
    validationVersionNumber = version.versionNumber;
    const versionId = await insertValidationVersion(supabase, {
      userId: context.userId,
      campaignId: context.campaignId,
      versionNumber: validationVersionNumber,
      taskType: context.taskType,
      triggerReason: version.triggerReason,
      campaignBrainId: campaignBrain?.id ?? null,
      creativeBrainIds: creativeBrains.map((b) => b.id),
      landingBrainId: landingBrain?.id ?? null,
      validationBrainId: persistedValidationBrainId,
      status: version.status,
      validationQuality: version.validationQuality,
      missingModules: version.missingModules,
    });

    if (versionId) {
      await linkValidationVersionToCampaign(supabase, context.userId, context.campaignId, versionId);
    }
  }

  const analysis = primaryCreative ? getAnalysisPayloadFromBrain(primaryCreative) : null;

  const substantiveEnginesRun = enginesRun.filter(
    (id) => id === "campaign" || id === "creative" || id === "landing_page" || id === "alignment",
  );

  return {
    creativeBrainId: primaryCreative?.id ?? "",
    campaignBrainId: campaignBrain?.id ?? null,
    landingBrainId: landingBrain?.id ?? null,
    validationBrainId: persistedValidationBrainId,
    reused: creativeReused && substantiveEnginesRun.length === 0,
    analysis,
    validationVersion: validationVersionNumber,
    enginesRun,
    triggerReason: version.triggerReason,
    launchReadiness: validationBrain?.launchReadiness ?? null,
    alignmentScore: validationBrain?.overallScore ?? null,
  };
}
