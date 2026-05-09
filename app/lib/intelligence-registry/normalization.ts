import { CAMPAIGN_GOALS, GOAL_ALIASES, VERTICAL_ALIASES, VERTICALS } from "./taxonomy";
import type { CampaignGoal, IntelligenceProfileKey, ProfileLookupInput, VerticalKey } from "./types";

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[/\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function normalizeCampaignGoal(value: string): CampaignGoal {
  const token = normalizeToken(value);
  const goal = GOAL_ALIASES[token] ?? GOAL_ALIASES[token.replace(/_/g, "")];
  if (goal) return goal;
  if ((CAMPAIGN_GOALS as string[]).includes(token)) return token as CampaignGoal;
  throw new Error(`Unsupported campaign goal: ${value}`);
}

export function normalizeVertical(value: string): VerticalKey {
  const token = normalizeToken(value);
  const compact = token.replace(/_/g, "");
  const vertical = VERTICAL_ALIASES[token] ?? VERTICAL_ALIASES[compact];
  if (vertical) return vertical;
  if ((VERTICALS as string[]).includes(token)) return token as VerticalKey;
  throw new Error(`Unsupported vertical: ${value}`);
}

export function makeProfileKey(goal: CampaignGoal, vertical: VerticalKey): IntelligenceProfileKey {
  return `${goal}:${vertical}`;
}

export function normalizeProfileLookup(input: ProfileLookupInput): {
  goal: CampaignGoal;
  vertical: VerticalKey;
  key: IntelligenceProfileKey;
} {
  const goal = normalizeCampaignGoal(input.campaignGoal);
  const vertical = normalizeVertical(input.vertical);
  return {
    goal,
    vertical,
    key: makeProfileKey(goal, vertical),
  };
}
