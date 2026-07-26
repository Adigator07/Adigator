import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreativeBrain } from "@/app/lib/brains/types";
import type { EngineResult } from "@/app/lib/validation/engineContracts";
import type { CreativeBrainInput } from "@/app/lib/brains/types";
import {
  normalizeExtraction,
  type ExtractionSignals,
  type ExtractionMeta,
} from "@/app/lib/engines/creativeExtraction";
import { runAnalyzeCreative, type AnalyzeCreativeRunInput } from "@/app/api/analyze-creative/route";
import {
  findCreativeBrainByContentHash,
  getAnalysisPayloadFromBrain,
  insertCreativeBrain,
  type CampaignBrainStubInput,
} from "@/app/lib/brains/creativeBrainPersistence";
import { generateCampaignBrain } from "@/app/lib/engines/campaignIntelligence";
import { hashCreativeInputs } from "@/app/lib/brains/hashing";

export type CreativeIntelligenceContext = CampaignBrainStubInput & {
  audienceStage: string;
  campaignProductFocus?: string;
  landingUrl?: string;
};

export type GenerateCreativeBrainParams = {
  supabase: SupabaseClient;
  context: CreativeIntelligenceContext;
  input: CreativeBrainInput;
  imageFile: File;
  imageBytesHash: string;
  overlayText?: string;
};

export type CreativeIntelligenceResult = {
  brain: CreativeBrain;
  reused: boolean;
  extraction: ExtractionSignals;
  extractionMeta?: ExtractionMeta;
  analysisPayload: Record<string, unknown>;
};

function extractionFromBrain(brain: CreativeBrain): ExtractionSignals {
  const stored = brain.visualAnalysis?.extraction;
  if (stored && typeof stored === "object") {
    return normalizeExtraction(stored as Record<string, unknown>);
  }

  return normalizeExtraction({
    headline: brain.extractedText,
    primary_message: brain.extractedText,
    cta: "",
    visual_elements: brain.detectedObjects,
    dominant_colors: [],
    text_density: "moderate",
    layout_structure: "",
    brand_presence: "moderate",
    emotional_cues: brain.emotionalTriggers || [],
    readability: "moderate",
    hierarchy_observations: "",
    trust_markers: brain.detectedBrands,
    urgency_signals: [],
    audience_clues: [],
  });
}

function buildAnalyzeInput(
  context: CreativeIntelligenceContext,
  imageFile: File,
): AnalyzeCreativeRunInput {
  return {
    file: imageFile,
    goal: context.campaignGoal,
    audienceStage: context.audienceStage,
    vertical: context.vertical,
    platform: context.platform,
    campaignBrief: context.briefText,
    campaignProductFocus: context.campaignProductFocus,
    landingUrl: context.landingUrl,
  };
}

/**
 * Creative Intelligence Engine — generates or reuses Creative Brain objects.
 * OpenAI is only invoked when no matching content hash exists in storage.
 */
export async function generateCreativeBrain(
  params: GenerateCreativeBrainParams,
): Promise<CreativeIntelligenceResult> {
  const { supabase, context, input, imageFile, imageBytesHash } = params;
  const contentHash = await hashCreativeInputs({
    creativeId: input.creativeId,
    imageBytesHash,
    overlayText: params.overlayText,
    campaignProductFocus: context.campaignProductFocus,
    platform: context.platform,
    campaignGoal: context.campaignGoal,
  });

  const existing = await findCreativeBrainByContentHash(
    supabase,
    context.userId,
    context.campaignId,
    input.creativeId,
    contentHash,
  );

  if (existing) {
    const cachedPayload = getAnalysisPayloadFromBrain(existing);
    if (cachedPayload) {
      return {
        brain: existing,
        reused: true,
        extraction: extractionFromBrain(existing),
        analysisPayload: cachedPayload,
      };
    }
  }

  const analysisPayload = await runAnalyzeCreative(buildAnalyzeInput(context, imageFile));
  const signalSource = analysisPayload.extraction_signals;
  const extraction = signalSource && typeof signalSource === "object"
    ? normalizeExtraction(signalSource as Record<string, unknown>)
    : normalizeExtraction({
        headline: String(analysisPayload.extracted_text || ""),
        primary_message: String(analysisPayload.extracted_text || ""),
        cta: String(analysisPayload.cta_text || ""),
        visual_elements: [],
        dominant_colors: [],
        text_density: "moderate",
        layout_structure: "",
        brand_presence: "moderate",
        emotional_cues: [],
        readability: "moderate",
        hierarchy_observations: "",
        trust_markers: [],
        urgency_signals: [],
        audience_clues: [],
      });

  const campaignResult = await generateCampaignBrain(supabase, {
    userId: context.userId,
    campaignId: context.campaignId,
  }, {
    campaignId: context.campaignId,
    briefText: context.briefText,
    campaignGoal: context.campaignGoal,
    vertical: context.vertical,
    targetAudience: context.targetAudience,
    offer: context.offer,
    cta: context.cta,
    platform: context.platform,
    landingUrl: context.landingUrl,
  });
  const campaignBrainId = input.campaignBrainId || campaignResult.brain.id;

  const brain = await insertCreativeBrain(supabase, {
    userId: context.userId,
    campaignId: context.campaignId,
    creativeId: input.creativeId,
    campaignBrainId,
    contentHash,
    extraction,
    analysisPayload,
  });

  return {
    brain,
    reused: false,
    extraction,
    analysisPayload,
  };
}

export function createCreativeIntelligenceEngine(
  supabase: SupabaseClient,
  context: CreativeIntelligenceContext,
  fileResolver: (creativeId: string) => Promise<{ file: File; imageBytesHash: string; overlayText?: string } | null>,
) {
  return {
    engineId: "creative" as const,
    async generate(input: CreativeBrainInput): Promise<EngineResult<CreativeBrain>> {
      try {
        const resolved = await fileResolver(input.creativeId);
        if (!resolved) {
          return {
            status: "failed",
            data: null,
            error: `Could not resolve image for creative ${input.creativeId}`,
            retriesUsed: 0,
          };
        }

        const result = await generateCreativeBrain({
          supabase,
          context,
          input,
          imageFile: resolved.file,
          imageBytesHash: resolved.imageBytesHash,
          overlayText: resolved.overlayText,
        });

        return {
          status: "success",
          data: result.brain,
          retriesUsed: result.reused ? 0 : 0,
        };
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

export type { CreativeIntelligenceResult as CreativeBrainGenerationResult };
