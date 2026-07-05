import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignBrain, CampaignBrainInput } from "@/app/lib/brains/types";
import type { EngineResult } from "@/app/lib/validation/engineContracts";
import { hashCampaignInputs } from "@/app/lib/brains/hashing";
import {
  findCampaignBrainByContentHash,
  insertCampaignBrain,
} from "@/app/lib/brains/brainPersistence";

export type CampaignIntelligenceContext = {
  userId: string;
  campaignId: string;
  landingContentHash?: string;
};

export type GenerateCampaignBrainResult = {
  brain: CampaignBrain;
  reused: boolean;
};

function buildBriefSummary(briefText: string): string {
  const trimmed = briefText.trim();
  if (!trimmed) return "Campaign brief not provided.";
  if (trimmed.length <= 500) return trimmed;
  return `${trimmed.slice(0, 497)}...`;
}

function buildObjectiveMapping(input: CampaignBrainInput): Record<string, unknown> {
  return {
    platform: input.platform,
    campaignGoal: input.campaignGoal,
    vertical: input.vertical,
    landingUrl: input.landingUrl ?? "",
    ...(input.objectiveMapping ?? {}),
  };
}

function buildRecommendations(input: CampaignBrainInput): string[] {
  const recs: string[] = [];
  if (!input.briefText.trim()) {
    recs.push("Add a campaign brief to improve alignment validation quality.");
  }
  if (!input.landingUrl?.trim()) {
    recs.push("Add a landing page URL to enable destination validation.");
  }
  if (!input.offer.trim()) {
    recs.push("Specify an offer to strengthen message consistency checks.");
  }
  return recs;
}

/**
 * Campaign Intelligence Engine — generates or reuses Campaign Brain objects.
 * Deterministic synthesis from campaign metadata; OpenAI enrichment can layer on later.
 */
export async function generateCampaignBrain(
  supabase: SupabaseClient,
  context: CampaignIntelligenceContext,
  input: CampaignBrainInput,
): Promise<GenerateCampaignBrainResult> {
  const contentHash = await hashCampaignInputs({
    briefText: input.briefText,
    campaignGoal: input.campaignGoal,
    vertical: input.vertical,
    targetAudience: input.targetAudience,
    offer: input.offer,
    cta: input.cta,
    platform: input.platform,
    platformConfig: input.objectiveMapping,
    landingUrl: input.landingUrl,
    landingContentHash: context.landingContentHash,
  });

  const existing = await findCampaignBrainByContentHash(
    supabase,
    context.userId,
    context.campaignId,
    contentHash,
  );

  if (existing) {
    return { brain: existing, reused: true };
  }

  const brain = await insertCampaignBrain(supabase, {
    userId: context.userId,
    campaignId: context.campaignId,
    contentHash,
    briefSummary: buildBriefSummary(input.briefText),
    campaignGoal: input.campaignGoal,
    vertical: input.vertical,
    targetAudience: input.targetAudience,
    offer: input.offer,
    cta: input.cta,
    platform: input.platform,
    objectiveMapping: buildObjectiveMapping(input),
    recommendations: buildRecommendations(input),
  });

  return { brain, reused: false };
}

export function createCampaignIntelligenceEngine(
  supabase: SupabaseClient,
  context: CampaignIntelligenceContext,
) {
  return {
    engineId: "campaign" as const,
    async generate(input: CampaignBrainInput): Promise<EngineResult<CampaignBrain>> {
      try {
        const result = await generateCampaignBrain(supabase, context, input);
        return { status: "success", data: result.brain, retriesUsed: result.reused ? 0 : 0 };
      } catch (error) {
        return {
          status: "failed",
          data: null,
          error: error instanceof Error ? error.message : String(error),
          retriesUsed: 0,
        };
      }
    },
  };
}
