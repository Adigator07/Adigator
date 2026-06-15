export type ValidationSeverity = "pass" | "warning" | "error";
export type ValidationModule =
  | "creative"
  | "url"
  | "landing_page"
  | "alignment"
  | "placement";
export type ValidationPlatform = "programmatic" | "meta" | "google" | "all";

export interface ValidationFlag {
  id: string;
  severity: ValidationSeverity;
  module: ValidationModule;
  platform: ValidationPlatform;
  message: string;
  detail?: string;
  recommendation?: string;
}

export interface ModuleResult {
  status: "pass" | "warning" | "error" | "skipped";
  label: string;
  flags: ValidationFlag[];
  error?: string;
}

export type ReadinessLevel = "ready" | "review_needed" | "not_ready";

export interface CampaignReadinessReport {
  session_id: string;
  platform: string;
  timestamp: string;
  overall_score: number;
  readiness_level: ReadinessLevel;
  flags: ValidationFlag[];
  modules: {
    creative_validation: ModuleResult;
    url_health: ModuleResult;
    landing_page: ModuleResult;
    campaign_alignment: ModuleResult;
    placement_simulation?: ModuleResult;
    asset_coverage?: ModuleResult;
    duplicate_detection?: ModuleResult;
  };
  summary: string;
  top_recommendations: string[];
}

export interface CreativeValidationInput {
  id: string;
  name: string;
  size?: string;
  fileSize?: number;
  mimeType?: string;
  contentHash?: string;
  perceptualHash?: string;
  validation?: {
    valid?: boolean;
    score?: number;
    status?: string;
    issues?: Array<{
      type?: string;
      severity?: string;
      message?: string;
      recommendation?: string;
    }>;
  };
}

export interface ValidateRequestBody {
  platform: "programmatic" | "google_ads" | "meta_ads";
  url?: string;
  objective: string;
  campaignName?: string;
  vertical?: string;
  creatives: CreativeValidationInput[];
  headlines?: string[];
  descriptions?: string[];
}

export interface DuplicatePair {
  creativeAId: string;
  creativeBId: string;
  creativeAName: string;
  creativeBName: string;
  distance: number;
  type: "exact" | "near";
}
