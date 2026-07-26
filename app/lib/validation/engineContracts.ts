import type {
  CampaignBrain,
  CampaignBrainInput,
  CreativeBrain,
  CreativeBrainInput,
  EngineRunStatus,
  LandingPageBrain,
  LandingPageBrainInput,
  ValidationBrain,
  ValidationEngineId,
} from "@/app/lib/brains/types";

/** Provider-agnostic engine result wrapper. */
export type EngineResult<T> = {
  status: EngineRunStatus;
  data: T | null;
  error?: string;
  retriesUsed: number;
};

export type TechnicalValidationInput = {
  campaignId: string;
  creatives: Array<{
    id: string;
    name: string;
    width?: number;
    height?: number;
    fileSize?: number;
    format?: string;
    assetKind?: "static_image" | "animated_gif" | "html5_zip" | "rich_media";
    contentHash?: string;
  }>;
  landingUrl?: string;
  utmParameters?: Record<string, string>;
  platform: string;
  campaignType?: string;
};

export type TechnicalValidationResult = {
  passed: boolean;
  flags: Array<Record<string, unknown>>;
  score: number;
};

/** Campaign Intelligence engine contract. */
export interface CampaignIntelligenceEngine {
  readonly engineId: "campaign";
  generate(input: CampaignBrainInput): Promise<EngineResult<CampaignBrain>>;
}

/** Creative Intelligence engine contract. */
export interface CreativeIntelligenceEngine {
  readonly engineId: "creative";
  generate(input: CreativeBrainInput): Promise<EngineResult<CreativeBrain>>;
}

/** Landing Page Intelligence engine contract. */
export interface LandingPageIntelligenceEngine {
  readonly engineId: "landing_page";
  generate(input: LandingPageBrainInput): Promise<EngineResult<LandingPageBrain>>;
}

/** Alignment engine contract — consumes brain IDs, produces Validation Brain. */
export interface AlignmentEngine {
  readonly engineId: "alignment";
  align(input: {
    campaignBrainId: string;
    creativeBrainIds: string[];
    landingBrainId: string;
    campaignBrain: CampaignBrain;
    creativeBrains: CreativeBrain[];
    landingBrain: LandingPageBrain;
  }): Promise<EngineResult<ValidationBrain>>;
}

/** Deterministic technical validation — no AI. */
export interface TechnicalValidationEngine {
  readonly engineId: "technical";
  validate(input: TechnicalValidationInput): Promise<EngineResult<TechnicalValidationResult>>;
}

export type ValidationEngineRegistry = {
  campaign?: CampaignIntelligenceEngine;
  creative?: CreativeIntelligenceEngine;
  landing_page?: LandingPageIntelligenceEngine;
  alignment?: AlignmentEngine;
  technical?: TechnicalValidationEngine;
};

export type EngineExecutionRecord = {
  engineId: ValidationEngineId;
  status: EngineRunStatus;
  error?: string;
  retriesUsed: number;
};
