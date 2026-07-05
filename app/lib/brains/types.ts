import type { AnalyzerPlatform } from "@/app/lib/analyzers/platformBrain";
import type { ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";

/** ISO-8601 timestamp string. */
export type BrainTimestamp = string;

export type LaunchReadiness = "ready" | "needs_work" | "not_ready" | "unknown";

export type ValidationRunStatus = "success" | "partial_success" | "failed";
export type ValidationQuality = "full" | "degraded";

export type ValidationEngineId =
  | "campaign"
  | "creative"
  | "landing_page"
  | "technical"
  | "alignment";

export type EngineRunStatus = "success" | "degraded" | "skipped" | "failed";

// ── Campaign Brain ───────────────────────────────────────────────────────────

export type ObjectiveMapping = Record<string, string | number | boolean | null>;

export interface CampaignBrain {
  id: string;
  campaignId: string;
  briefSummary: string;
  campaignGoal: string;
  vertical: string;
  targetAudience: string;
  offer: string;
  cta: string;
  platform: AnalyzerPlatform | string;
  objectiveMapping: ObjectiveMapping;
  hash: string;
  createdAt: BrainTimestamp;
  updatedAt: BrainTimestamp;
  competitorInsights?: Record<string, unknown>;
  audienceInsights?: Record<string, unknown>;
  recommendations?: string[];
}

export type CampaignBrainInput = {
  campaignId: string;
  briefText: string;
  campaignGoal: string;
  vertical: string;
  targetAudience: string;
  offer: string;
  cta: string;
  platform: AnalyzerPlatform | string;
  objectiveMapping?: ObjectiveMapping;
  landingUrl?: string;
};

// ── Creative Brain ───────────────────────────────────────────────────────────

export interface CreativeBrain {
  id: string;
  creativeId: string;
  campaignBrainId: string;
  extractedText: string;
  detectedObjects: string[];
  detectedBrands: string[];
  visualAnalysis: Record<string, unknown>;
  sentiment: string;
  complianceSignals: Record<string, unknown>;
  hash: string;
  createdAt: BrainTimestamp;
  updatedAt: BrainTimestamp;
  emotionalTriggers?: string[];
  attentionScore?: number;
  creativeRecommendations?: string[];
}

export type CreativeBrainInput = {
  creativeId: string;
  campaignBrainId: string;
  imageBytesHash: string;
  overlayText?: string;
};

// ── Landing Page Brain ─────────────────────────────────────────────────────────

export interface LandingPageBrain {
  id: string;
  landingUrl: string;
  headline: string;
  offer: string;
  cta: string;
  pageIntent: string;
  conversionElements: string[];
  trustSignals: string[];
  hash: string;
  createdAt: BrainTimestamp;
  updatedAt: BrainTimestamp;
  pageSpeedInsights?: Record<string, unknown>;
  seoSignals?: Record<string, unknown>;
  mobileExperienceSignals?: Record<string, unknown>;
}

export type LandingPageBrainInput = {
  landingUrl: string;
  fetchedContentHash: string;
};

// ── Validation Brain ─────────────────────────────────────────────────────────

export interface ValidationBrain {
  id: string;
  campaignBrainId: string;
  creativeBrainIds: string[];
  landingBrainId: string;
  validationResults: Record<string, unknown>;
  overallScore: number;
  launchReadiness: LaunchReadiness;
  createdAt: BrainTimestamp;
  recommendations?: string[];
  warningFlags?: string[];
  optimizationSuggestions?: string[];
}

// ── Validation Version ─────────────────────────────────────────────────────────

export interface ValidationVersion {
  id: string;
  campaignId: string;
  ownerId: string;
  versionNumber: number;
  taskType: ProgrammaticTaskTypeId | string;
  triggerReason: string;
  campaignBrainId: string | null;
  creativeBrainIds: string[];
  landingBrainId: string | null;
  validationBrainId: string | null;
  status: ValidationRunStatus;
  validationQuality: ValidationQuality;
  missingModules: ValidationEngineId[];
  createdAt: BrainTimestamp;
}

/** References to the latest stored brains for a campaign (lookup helpers). */
export interface CampaignBrainRefs {
  campaignBrainId: string | null;
  creativeBrainIds: string[];
  landingBrainId: string | null;
  validationBrainId: string | null;
  latestVersionNumber: number;
}
