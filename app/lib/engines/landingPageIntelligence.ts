import type { SupabaseClient } from "@supabase/supabase-js";
import type { LandingPageBrain, LandingPageBrainInput } from "@/app/lib/brains/types";
import type { EngineResult } from "@/app/lib/validation/engineContracts";
import { hashLandingPageInputs } from "@/app/lib/brains/hashing";
import {
  findLandingBrainByContentHash,
  insertLandingPageBrain,
} from "@/app/lib/brains/brainPersistence";
import { extractLandingPageSignals } from "@/app/lib/engines/landingPageExtraction";

export type LandingIntelligenceContext = {
  userId: string;
  campaignId: string;
  campaignGoal?: string;
};

export type GenerateLandingBrainResult = {
  brain: LandingPageBrain;
  reused: boolean;
};

/**
 * Landing Page Intelligence Engine — generates or reuses Landing Page Brain objects.
 * Fetches page content deterministically; no AI calls in Phase 4 extraction.
 */
export async function generateLandingBrain(
  supabase: SupabaseClient,
  context: LandingIntelligenceContext,
  input: LandingPageBrainInput,
): Promise<GenerateLandingBrainResult> {
  const extraction = await extractLandingPageSignals(
    input.landingUrl,
    context.campaignGoal,
  );

  const fetchedContentHash = input.fetchedContentHash || extraction.fetchedContentHash;
  const contentHash = await hashLandingPageInputs({
    landingUrl: input.landingUrl,
    fetchedContentHash,
  });

  const existing = await findLandingBrainByContentHash(
    supabase,
    context.userId,
    context.campaignId,
    input.landingUrl,
    contentHash,
  );

  if (existing) {
    return { brain: existing, reused: true };
  }

  const brain = await insertLandingPageBrain(supabase, {
    userId: context.userId,
    campaignId: context.campaignId,
    landingUrl: input.landingUrl,
    contentHash,
    extraction: { ...extraction, fetchedContentHash },
  });

  return { brain, reused: false };
}

export function createLandingPageIntelligenceEngine(
  supabase: SupabaseClient,
  context: LandingIntelligenceContext,
) {
  return {
    engineId: "landing_page" as const,
    async generate(input: LandingPageBrainInput): Promise<EngineResult<LandingPageBrain>> {
      try {
        const result = await generateLandingBrain(supabase, context, input);
        return { status: "success", data: result.brain, retriesUsed: 0 };
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
