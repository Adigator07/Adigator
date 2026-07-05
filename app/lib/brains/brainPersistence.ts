import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CampaignBrain,
  CampaignBrainRefs,
  CreativeBrain,
  LandingPageBrain,
  ValidationBrain,
} from "@/app/lib/brains/types";
import type { ExtractionSignals } from "@/app/lib/engines/creativeExtraction";
import type { LandingPageExtraction } from "@/app/lib/engines/landingPageExtraction";
import {
  rowToCreativeBrain,
  type CreativeBrainRow,
  mapExtractionToBrainFields,
} from "@/app/lib/brains/creativeBrainPersistence";

// ── Row types ──────────────────────────────────────────────────────────────────

export type CampaignBrainRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  brief_summary: string;
  campaign_goal: string;
  vertical: string;
  target_audience: string;
  offer: string;
  cta: string;
  platform: string;
  objective_mapping: Record<string, unknown>;
  content_hash: string;
  competitor_insights: Record<string, unknown> | null;
  audience_insights: Record<string, unknown> | null;
  recommendations: string[] | null;
  created_at: string;
  updated_at: string;
};

export type LandingPageBrainRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  landing_url: string;
  headline: string;
  offer: string;
  cta: string;
  page_intent: string;
  conversion_elements: string[];
  trust_signals: string[];
  content_hash: string;
  page_speed_insights: Record<string, unknown> | null;
  seo_signals: Record<string, unknown> | null;
  mobile_experience_signals: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ValidationBrainRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  campaign_brain_id: string;
  creative_brain_ids: string[];
  landing_brain_id: string;
  validation_results: Record<string, unknown>;
  overall_score: number;
  launch_readiness: string;
  recommendations: string[] | null;
  warning_flags: string[] | null;
  optimization_suggestions: string[] | null;
  created_at: string;
};

// ── Mappers ────────────────────────────────────────────────────────────────────

export function rowToCampaignBrain(row: CampaignBrainRow): CampaignBrain {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    briefSummary: row.brief_summary,
    campaignGoal: row.campaign_goal,
    vertical: row.vertical,
    targetAudience: row.target_audience,
    offer: row.offer,
    cta: row.cta,
    platform: row.platform,
    objectiveMapping: (row.objective_mapping || {}) as CampaignBrain["objectiveMapping"],
    hash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    competitorInsights: row.competitor_insights ?? undefined,
    audienceInsights: row.audience_insights ?? undefined,
    recommendations: Array.isArray(row.recommendations) ? row.recommendations : undefined,
  };
}

export function rowToLandingPageBrain(row: LandingPageBrainRow): LandingPageBrain {
  const seo = row.seo_signals || {};
  return {
    id: row.id,
    landingUrl: row.landing_url,
    headline: row.headline,
    offer: row.offer,
    cta: row.cta,
    pageIntent: row.page_intent,
    conversionElements: row.conversion_elements || [],
    trustSignals: row.trust_signals || [],
    hash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pageSpeedInsights: row.page_speed_insights ?? undefined,
    seoSignals: row.seo_signals ?? undefined,
    mobileExperienceSignals: row.mobile_experience_signals ?? undefined,
    ...(typeof seo.extraction === "object" ? {} : {}),
  };
}

export function rowToValidationBrain(row: ValidationBrainRow): ValidationBrain {
  return {
    id: row.id,
    campaignBrainId: row.campaign_brain_id,
    creativeBrainIds: row.creative_brain_ids || [],
    landingBrainId: row.landing_brain_id,
    validationResults: row.validation_results || {},
    overallScore: Number(row.overall_score) || 0,
    launchReadiness: row.launch_readiness as ValidationBrain["launchReadiness"],
    createdAt: row.created_at,
    recommendations: Array.isArray(row.recommendations) ? row.recommendations : undefined,
    warningFlags: Array.isArray(row.warning_flags) ? row.warning_flags : undefined,
    optimizationSuggestions: Array.isArray(row.optimization_suggestions)
      ? row.optimization_suggestions
      : undefined,
  };
}

// ── Load stored brains (campaign-level invalidation inputs) ──────────────────

export async function getLatestCampaignBrain(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<CampaignBrain | null> {
  const { data } = await supabase
    .from("campaign_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToCampaignBrain(data as CampaignBrainRow) : null;
}

export async function findCampaignBrainByContentHash(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  contentHash: string,
): Promise<CampaignBrain | null> {
  const { data } = await supabase
    .from("campaign_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("content_hash", contentHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToCampaignBrain(data as CampaignBrainRow) : null;
}

export async function getLatestCreativeBrainForCreative(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  creativeId: string,
): Promise<CreativeBrain | null> {
  const { data } = await supabase
    .from("creative_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("creative_id", creativeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToCreativeBrain(data as CreativeBrainRow) : null;
}

export async function getLatestLandingPageBrain(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  landingUrl: string,
): Promise<LandingPageBrain | null> {
  const { data } = await supabase
    .from("landing_page_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("landing_url", landingUrl)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToLandingPageBrain(data as LandingPageBrainRow) : null;
}

export async function findLandingBrainByContentHash(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  landingUrl: string,
  contentHash: string,
): Promise<LandingPageBrain | null> {
  const { data } = await supabase
    .from("landing_page_brains")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .eq("landing_url", landingUrl)
    .eq("content_hash", contentHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToLandingPageBrain(data as LandingPageBrainRow) : null;
}

export async function getCampaignBrainRefs(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<CampaignBrainRefs> {
  const { data: version } = await supabase
    .from("validation_versions")
    .select("version_number, campaign_brain_id, creative_brain_ids, landing_brain_id, validation_brain_id")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    campaignBrainId: version?.campaign_brain_id ?? null,
    creativeBrainIds: version?.creative_brain_ids ?? [],
    landingBrainId: version?.landing_brain_id ?? null,
    validationBrainId: version?.validation_brain_id ?? null,
    latestVersionNumber: version?.version_number ?? 0,
  };
}

// ── Insert brains ──────────────────────────────────────────────────────────────

export type PersistCampaignBrainInput = {
  userId: string;
  campaignId: string;
  contentHash: string;
  briefSummary: string;
  campaignGoal: string;
  vertical: string;
  targetAudience: string;
  offer: string;
  cta: string;
  platform: string;
  objectiveMapping?: Record<string, unknown>;
  recommendations?: string[];
};

export async function insertCampaignBrain(
  supabase: SupabaseClient,
  input: PersistCampaignBrainInput,
): Promise<CampaignBrain> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("campaign_brains")
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      brief_summary: input.briefSummary,
      campaign_goal: input.campaignGoal,
      vertical: input.vertical,
      target_audience: input.targetAudience,
      offer: input.offer,
      cta: input.cta,
      platform: input.platform,
      objective_mapping: input.objectiveMapping ?? {},
      content_hash: input.contentHash,
      recommendations: input.recommendations?.length ? input.recommendations : null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to persist campaign brain.");
  }

  return rowToCampaignBrain(data as CampaignBrainRow);
}

export type PersistLandingPageBrainInput = {
  userId: string;
  campaignId: string;
  landingUrl: string;
  contentHash: string;
  extraction: LandingPageExtraction;
};

export async function insertLandingPageBrain(
  supabase: SupabaseClient,
  input: PersistLandingPageBrainInput,
): Promise<LandingPageBrain> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("landing_page_brains")
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      landing_url: input.landingUrl,
      headline: input.extraction.headline,
      offer: input.extraction.offer,
      cta: input.extraction.cta,
      page_intent: input.extraction.pageIntent,
      conversion_elements: input.extraction.conversionElements,
      trust_signals: input.extraction.trustSignals,
      content_hash: input.contentHash,
      page_speed_insights: input.extraction.pageSpeedInsights ?? null,
      seo_signals: { extraction: input.extraction, urlHealth: input.extraction.urlHealth },
      mobile_experience_signals: input.extraction.mobileExperienceSignals ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to persist landing page brain.");
  }

  return rowToLandingPageBrain(data as LandingPageBrainRow);
}

export type PersistValidationBrainInput = {
  userId: string;
  campaignId: string;
  campaignBrainId: string;
  creativeBrainIds: string[];
  landingBrainId: string;
  validationResults: Record<string, unknown>;
  overallScore: number;
  launchReadiness: string;
  recommendations?: string[];
  warningFlags?: string[];
  optimizationSuggestions?: string[];
};

export async function insertValidationBrain(
  supabase: SupabaseClient,
  input: PersistValidationBrainInput,
): Promise<ValidationBrain> {
  const { data, error } = await supabase
    .from("validation_brains")
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      campaign_brain_id: input.campaignBrainId,
      creative_brain_ids: input.creativeBrainIds,
      landing_brain_id: input.landingBrainId,
      validation_results: input.validationResults,
      overall_score: input.overallScore,
      launch_readiness: input.launchReadiness,
      recommendations: input.recommendations?.length ? input.recommendations : null,
      warning_flags: input.warningFlags?.length ? input.warningFlags : null,
      optimization_suggestions: input.optimizationSuggestions?.length
        ? input.optimizationSuggestions
        : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to persist validation brain.");
  }

  return rowToValidationBrain(data as ValidationBrainRow);
}

export async function insertCreativeBrainFromExtraction(
  supabase: SupabaseClient,
  input: {
    userId: string;
    campaignId: string;
    creativeId: string;
    campaignBrainId: string;
    contentHash: string;
    extraction: ExtractionSignals;
    analysisPayload: Record<string, unknown>;
  },
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

// ── Validation versions ────────────────────────────────────────────────────────

export async function getLatestValidationVersionNumber(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<number> {
  const { data } = await supabase
    .from("validation_versions")
    .select("version_number")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.version_number ?? 0;
}

export async function insertValidationVersion(
  supabase: SupabaseClient,
  input: {
    userId: string;
    campaignId: string;
    versionNumber: number;
    taskType: string;
    triggerReason: string;
    campaignBrainId: string | null;
    creativeBrainIds: string[];
    landingBrainId?: string | null;
    validationBrainId?: string | null;
    status: string;
    validationQuality: string;
    missingModules: string[];
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("validation_versions")
    .insert({
      user_id: input.userId,
      campaign_id: input.campaignId,
      version_number: input.versionNumber,
      task_type: input.taskType,
      trigger_reason: input.triggerReason,
      campaign_brain_id: input.campaignBrainId,
      creative_brain_ids: input.creativeBrainIds,
      landing_brain_id: input.landingBrainId ?? null,
      validation_brain_id: input.validationBrainId ?? null,
      status: input.status,
      validation_quality: input.validationQuality,
      missing_modules: input.missingModules,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[brain-persistence] validation version insert failed:", error.message);
    return null;
  }

  return data?.id ?? null;
}

/** Link programmatic campaign row to the latest validation version (lazy backfill). */
export async function linkValidationVersionToCampaign(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  validationVersionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("programmatic_campaigns")
    .update({ latest_validation_version_id: validationVersionId })
    .eq("user_id", userId)
    .eq("id", campaignId);

  if (error) {
    console.warn("[brain-persistence] programmatic campaign version link failed:", error.message);
  }
}
