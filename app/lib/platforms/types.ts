import type { SetupFieldContext, SetupMissingField } from "@/app/lib/setupRequiredFields";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";

export type AnalyzerPlatform = "google_ads" | "meta_ads" | "programmatic";

export type CampaignTaskTypeId =
  | "campaign_setup"
  | "creative_addition"
  | "creative_replacement"
  | "creative_swap"
  | "campaign_renewal"
  | "url_validation_utm_update";

export type CampaignTaskType = {
  id: CampaignTaskTypeId;
  label: string;
  description: string;
};

export type PlatformObjective = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  desc: string;
  color: string;
  border: string;
  analyzerGoal: string;
};

export type UploadStrategy = "flat" | "ad-group-folders";

export type PreviewStudioMode = "contextual-ai" | "static-placements";

export type PlatformValidationRules = {
  /** Destination URL required in Step 1 / Step 2 */
  landingUrlRequired: boolean;
  /** Recommended max file size in KB for display creatives */
  defaultMaxFileSizeKb: number;
  /** Minimum creative dimensions (Meta feed etc.) */
  minCreativeDimensions?: { width: number; height: number };
  /** Platform-specific validation notes shown in Step 2 */
  uploadGuidance: string;
};

export type PlatformWorkflowAdapter = {
  id: AnalyzerPlatform;
  label: string;
  shortLabel: string;
  description: string;
  /** Step 1 task types available for this platform */
  taskTypes: CampaignTaskType[];
  /** Whether ad-group / ad-set folder upload is supported */
  uploadStrategy: UploadStrategy;
  /** Campaign objectives shown in Step 1 */
  getObjectives: () => PlatformObjective[];
  /** Resolve UI objective id → analyzer goal slug */
  resolveAnalyzerGoal: (objectiveId: string) => string;
  /** Platform-native validation rules */
  validationRules: PlatformValidationRules;
  /** Preview Studio rendering mode */
  previewStudioMode: PreviewStudioMode;
  /** Default placement / template id for exports */
  defaultPreviewTemplateId: string;
  /** Additional setup fields beyond shared advertiser/vertical/brief */
  getMissingSetupFields: (context: SetupFieldContext) => SetupMissingField[];
  /** Whether this task type is a "new campaign" flow vs update flow */
  isSetupTask: (taskType: string) => boolean;
  isUpdateTask: (taskType: string) => boolean;
  /** Build platform field on campaign snapshot */
  buildSnapshotExtensions: (context: Record<string, unknown>) => Record<string, unknown>;
  /** Analysis platform string sent to /api/analyze-creative */
  analysisPlatform: AnalyzerPlatform;
  /** Intelligence label for Step 3 header */
  intelligenceLabel: string;
  /** Step 4 description copy */
  previewStudioDescription: string;
  /** Report type labels for download history */
  analysisReportLabel: string;
  previewReportLabel: string;
};

export function isAnalyzerPlatform(value: string | null | undefined): value is AnalyzerPlatform {
  return value === "google_ads" || value === "meta_ads" || value === "programmatic";
}

export type PersistCampaignOptions = {
  syncRemote?: boolean;
};

export type CampaignPersistenceResult = CampaignSnapshot | null;
