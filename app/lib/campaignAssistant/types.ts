export type CampaignAssistantField =
  | "campaign_brief"
  | "campaign_goal"
  | "campaign_vertical"
  | "product_focus"
  | "audience"
  | "offer"
  | "landing_url"
  | "advertiser"
  | "general";

export type CampaignAssistantQuestion = {
  id: string;
  prompt: string;
  whyNeeded: string;
  mapsTo: CampaignAssistantField;
  placeholder?: string;
};

export type CampaignContextAssessmentInput = {
  platform: string;
  campaignName?: string;
  advertiserName?: string;
  campaignBrief?: string;
  campaignGoal?: string;
  campaignVertical?: string;
  campaignAudienceStage?: string;
  campaignProductFocus?: string;
  landingUrl?: string;
  programmaticTaskType?: string;
  creativeCount?: number;
  creativeNames?: string[];
  hasPriorClarifications?: boolean;
};

export type CampaignContextAssessmentResult = {
  confidence: number;
  shouldAsk: boolean;
  reasoning: string;
  missingAreas: string[];
  questions: CampaignAssistantQuestion[];
  provider: "deterministic" | "openai" | "deepseek" | "gemini";
  skippedAi?: boolean;
};

export type CampaignAssistantClarification = {
  sourceFingerprint: string;
  answers: Record<string, string>;
  mergedBriefSupplement?: string;
  resolvedAt: string;
  provider?: string;
};

export type CampaignAssistantMergeResult = {
  campaignBrief: string;
  campaignProductFocus: string;
  campaignAudienceStage: string;
  supplement: string;
};
