import type {
  CampaignAssistantQuestion,
  CampaignContextAssessmentInput,
  CampaignContextAssessmentResult,
} from "@/app/lib/campaignAssistant/types";

const CONFIDENCE_THRESHOLD = 0.72;

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function buildQuestion(
  id: string,
  prompt: string,
  whyNeeded: string,
  mapsTo: CampaignAssistantQuestion["mapsTo"],
  placeholder?: string,
): CampaignAssistantQuestion {
  return { id, prompt, whyNeeded, mapsTo, placeholder };
}

export function runDeterministicCampaignAssessment(
  input: CampaignContextAssessmentInput,
): CampaignContextAssessmentResult {
  const brief = (input.campaignBrief || "").trim();
  const briefWords = wordCount(brief);
  const questions: CampaignAssistantQuestion[] = [];
  const missingAreas: string[] = [];
  let score = 1;

  if (!input.campaignGoal || input.campaignGoal === "unknown") {
    score -= 0.25;
    missingAreas.push("campaign goal");
    questions.push(buildQuestion(
      "primary_goal",
      "What is the primary goal of this campaign?",
      "The analyzer needs a clear objective to score alignment and recommendations.",
      "campaign_goal",
      "e.g. drive sign-ups, brand awareness, product sales",
    ));
  }

  if (!input.campaignVertical || input.campaignVertical === "unknown") {
    score -= 0.2;
    missingAreas.push("vertical");
    questions.push(buildQuestion(
      "vertical_context",
      "Which industry or vertical best describes this campaign?",
      "Vertical context drives platform-specific validation rules.",
      "campaign_vertical",
      "e.g. healthcare, ecommerce, finance",
    ));
  }

  if (briefWords < 12) {
    score -= briefWords < 4 ? 0.35 : 0.2;
    missingAreas.push("campaign brief");
    questions.push(buildQuestion(
      "campaign_context",
      "Describe what this campaign is promoting and who it is for.",
      "A concise brief helps the analyzer interpret creative messaging accurately.",
      "campaign_brief",
      "Product/service, audience, and desired action",
    ));
  } else if (briefWords < 25) {
    score -= 0.08;
    missingAreas.push("brief depth");
  }

  if (!input.campaignProductFocus?.trim() && briefWords < 30) {
    score -= 0.12;
    missingAreas.push("product or service");
    questions.push(buildQuestion(
      "product_service",
      "What product or service is being promoted?",
      "Product clarity improves brief-to-creative alignment checks.",
      "product_focus",
      "Specific product line, SKU, or service name",
    ));
  }

  if (!input.campaignAudienceStage?.trim() && briefWords < 35) {
    score -= 0.1;
    missingAreas.push("target audience");
    questions.push(buildQuestion(
      "target_audience",
      "Which audience are you targeting?",
      "Audience context improves goal and messaging validation.",
      "audience",
      "e.g. new customers, lapsed users, decision-makers",
    ));
  }

  const conversionGoals = new Set(["conversion", "lead_generation", "app_installs", "traffic"]);
  if (conversionGoals.has(input.campaignGoal || "") && !input.landingUrl?.trim()) {
    score -= 0.1;
    missingAreas.push("landing URL");
    questions.push(buildQuestion(
      "landing_url",
      "What landing page URL should this campaign drive to?",
      "Destination context is required for conversion-oriented validation.",
      "landing_url",
      "https://",
    ));
  }

  if (!input.advertiserName?.trim() && !input.campaignName?.trim()) {
    score -= 0.08;
    missingAreas.push("advertiser identity");
    questions.push(buildQuestion(
      "advertiser_brand",
      "Which advertiser or brand is running this campaign?",
      "Brand context helps interpret creative and preview outputs.",
      "advertiser",
      "Brand or advertiser name",
    ));
  }

  if ((input.creativeCount || 0) === 0) {
    score -= 0.15;
    missingAreas.push("creatives");
  }

  if (input.hasPriorClarifications) {
    score += 0.12;
  }

  const confidence = Math.max(0, Math.min(1, score));
  const uniqueQuestions = questions.slice(0, 5);

  return {
    confidence,
    shouldAsk: confidence < CONFIDENCE_THRESHOLD && uniqueQuestions.length > 0,
    reasoning: confidence >= CONFIDENCE_THRESHOLD
      ? "Campaign inputs include enough structured context for high-confidence analysis."
      : `Campaign context appears incomplete (${missingAreas.join(", ") || "ambiguous brief"}).`,
    missingAreas,
    questions: uniqueQuestions,
    provider: "deterministic",
  };
}

export { CONFIDENCE_THRESHOLD };
