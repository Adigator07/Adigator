import type {
  CampaignAssistantMergeResult,
  CampaignAssistantQuestion,
} from "@/app/lib/campaignAssistant/types";

function cleanAnswer(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const GOAL_ALIASES: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "awareness", patterns: [/awareness/i, /brand reach/i, /visibility/i] },
  { id: "consideration", patterns: [/consideration/i, /learn more/i, /research/i] },
  { id: "conversion", patterns: [/conversion/i, /purchase/i, /sales/i, /buy/i, /checkout/i] },
  { id: "traffic", patterns: [/traffic/i, /website visit/i, /click through/i] },
  { id: "lead_generation", patterns: [/lead/i, /demo/i, /sign up/i, /register/i] },
  { id: "engagement", patterns: [/engagement/i, /social interaction/i] },
  { id: "app_installs", patterns: [/app install/i, /download app/i] },
  { id: "retargeting", patterns: [/retarget/i, /remarketing/i] },
];

function normalizeGoalAnswer(answer: string): string | null {
  for (const item of GOAL_ALIASES) {
    if (item.patterns.some((pattern) => pattern.test(answer))) return item.id;
  }
  return null;
}

function normalizeVerticalAnswer(answer: string): string | null {
  return answer.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || null;
}

export function mergeAssistantAnswers({
  campaignBrief = "",
  campaignProductFocus = "",
  campaignAudienceStage = "",
  campaignGoal = "",
  campaignVertical = "",
  landingUrl = "",
  advertiserName = "",
  questions = [],
  answers = {},
}: {
  campaignBrief?: string;
  campaignProductFocus?: string;
  campaignAudienceStage?: string;
  campaignGoal?: string;
  campaignVertical?: string;
  landingUrl?: string;
  advertiserName?: string;
  questions?: CampaignAssistantQuestion[];
  answers?: Record<string, string>;
}): CampaignAssistantMergeResult & {
  campaignGoal?: string;
  campaignVertical?: string;
  landingUrl?: string;
  advertiserName?: string;
} {
  const lines: string[] = [];
  let productFocus = campaignProductFocus;
  let audienceStage = campaignAudienceStage;
  let goal = campaignGoal;
  let vertical = campaignVertical;
  let landing = landingUrl;
  let advertiser = advertiserName;
  let brief = campaignBrief;

  for (const question of questions) {
    const answer = cleanAnswer(answers[question.id]);
    if (!answer) continue;

    switch (question.mapsTo) {
      case "campaign_brief":
      case "general":
      case "offer":
        lines.push(`${question.prompt} ${answer}`);
        break;
      case "product_focus":
        productFocus = productFocus ? `${productFocus}. ${answer}` : answer;
        lines.push(`Product/service: ${answer}`);
        break;
      case "audience":
        audienceStage = answer;
        lines.push(`Target audience: ${answer}`);
        break;
      case "campaign_goal": {
        const normalizedGoal = normalizeGoalAnswer(answer);
        if (normalizedGoal) goal = normalizedGoal;
        lines.push(`Primary goal: ${answer}`);
        break;
      }
      case "campaign_vertical": {
        const normalizedVertical = normalizeVerticalAnswer(answer);
        if (normalizedVertical) vertical = normalizedVertical;
        lines.push(`Vertical: ${answer}`);
        break;
      }
      case "landing_url":
        landing = answer;
        lines.push(`Landing URL: ${answer}`);
        break;
      case "advertiser":
        advertiser = answer;
        lines.push(`Advertiser/brand: ${answer}`);
        break;
      default:
        lines.push(`${question.prompt} ${answer}`);
    }
  }

  const supplement = lines.join("\n");
  if (supplement) {
    const marker = "Assistant clarifications:";
    brief = brief.includes(marker)
      ? brief
      : `${brief.trim()}\n\n${marker}\n${supplement}`.trim();
  }

  return {
    campaignBrief: brief,
    campaignProductFocus: productFocus,
    campaignAudienceStage: audienceStage,
    supplement,
    campaignGoal: goal,
    campaignVertical: vertical,
    landingUrl: landing,
    advertiserName: advertiser,
  };
}
