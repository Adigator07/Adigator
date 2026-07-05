import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreativeBrain } from "@/app/lib/brains/types";
import type { ExtractionSignals } from "@/app/lib/engines/creativeExtraction";

export type CreativeBrainRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  creative_id: string;
  campaign_brain_id: string;
  extracted_text: string;
  detected_objects: string[];
  detected_brands: string[];
  visual_analysis: Record<string, unknown>;
  sentiment: string;
  compliance_signals: Record<string, unknown>;
  content_hash: string;
  emotional_triggers: string[] | null;
  attention_score: number | null;
  creative_recommendations: string[] | null;
  created_at: string;
  updated_at: string;
};

export type CampaignBrainStubInput = {
  userId: string;
  campaignId: string;
  briefText: string;
  campaignGoal: string;
  vertical: string;
  targetAudience: string;
  offer: string;
  cta: string;
  platform: string;
  landingUrl?: string;
};

export type PersistCreativeBrainInput = {
  userId: string;
  campaignId: string;
  creativeId: string;
  campaignBrainId: string;
  contentHash: string;
  extraction: ExtractionSignals;
  analysisPayload: Record<string, unknown>;
  dimensions?: { width: number; height: number };
};

export function rowToCreativeBrain(row: CreativeBrainRow): CreativeBrain {
  const visual = row.visual_analysis || {};
  return {
    id: row.id,
    creativeId: row.creative_id,
    campaignBrainId: row.campaign_brain_id,
    extractedText: row.extracted_text,
    detectedObjects: row.detected_objects || [],
    detectedBrands: row.detected_brands || [],
    visualAnalysis: row.visual_analysis || {},
    sentiment: row.sentiment || "",
    complianceSignals: row.compliance_signals || {},
    hash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emotionalTriggers: Array.isArray(row.emotional_triggers) ? row.emotional_triggers : undefined,
    attentionScore: row.attention_score ?? undefined,
    creativeRecommendations: Array.isArray(row.creative_recommendations)
      ? row.creative_recommendations
      : undefined,
    ...(typeof visual.analysisPayload === "object" ? {} : {}),
  };
}

export function getAnalysisPayloadFromBrain(brain: CreativeBrain): Record<string, unknown> | null {
  const payload = brain.visualAnalysis?.analysisPayload;
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
}

export async function findCreativeBrainByContentHash(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  creativeId: string,
  contentHash: string,
): Promise<CreativeBrain | null> {
  const { data, error } = await supabase
    .from("creative_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("creative_id", creativeId)
    .eq("content_hash", contentHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCreativeBrain(data as CreativeBrainRow);
}

export async function getOrCreateCampaignBrainStub(
  supabase: SupabaseClient,
  input: CampaignBrainStubInput,
): Promise<string> {
  const { generateCampaignBrain } = await import("@/app/lib/engines/campaignIntelligence");
  const result = await generateCampaignBrain(supabase, {
    userId: input.userId,
    campaignId: input.campaignId,
  }, {
    campaignId: input.campaignId,
    briefText: input.briefText,
    campaignGoal: input.campaignGoal,
    vertical: input.vertical,
    targetAudience: input.targetAudience,
    offer: input.offer,
    cta: input.cta,
    platform: input.platform,
    landingUrl: input.landingUrl,
  });
  return result.brain.id;
}

export function mapExtractionToBrainFields(extraction: ExtractionSignals, analysisPayload: Record<string, unknown>) {
  const extractedText = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
  ].filter(Boolean).join(" ").trim();

  return {
    extracted_text: extractedText,
    detected_objects: extraction.visual_elements || [],
    detected_brands: extraction.trust_markers || [],
    visual_analysis: {
      extraction,
      analysisPayload,
      dominant_colors: extraction.dominant_colors,
      layout_structure: extraction.layout_structure,
      hierarchy_observations: extraction.hierarchy_observations,
    },
    sentiment: extraction.emotional_cues?.join(", ") || "",
    compliance_signals: {
      trust_markers: extraction.trust_markers,
      urgency_signals: extraction.urgency_signals,
      readability: extraction.readability,
      brand_presence: extraction.brand_presence,
    },
    emotional_triggers: extraction.emotional_cues?.length ? extraction.emotional_cues : null,
    creative_recommendations: Array.isArray(analysisPayload.strategic_recommendations)
      ? (analysisPayload.strategic_recommendations as Array<{ recommended_change?: string }>)
          .map((item) => item.recommended_change)
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 8)
      : null,
  };
}

export async function insertCreativeBrain(
  supabase: SupabaseClient,
  input: PersistCreativeBrainInput,
): Promise<CreativeBrain> {
  const now = new Date().toISOString();
  const mapped = mapExtractionToBrainFields(input.extraction, input.analysisPayload);
  const strategicScore = input.analysisPayload.strategic_alignment_score;
  const attentionScore = typeof strategicScore === "number" ? strategicScore : null;

  const { data, error } = await supabase
    .from("creative_brains")
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      creative_id: input.creativeId,
      campaign_brain_id: input.campaignBrainId,
      content_hash: input.contentHash,
      attention_score: attentionScore,
      created_at: now,
      updated_at: now,
      ...mapped,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to persist creative brain.");
  }

  return rowToCreativeBrain(data as CreativeBrainRow);
}

