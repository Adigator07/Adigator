/**
 * Campaign Brief validation — primary source for creative + settings alignment.
 * Used across Google Ads, Meta Ads, and Programmatic analysis flows.
 */

import type { AnalyzerPlatform } from "./analyzers/platformBrain";

export type BriefAlignmentStatus = "aligned" | "partially_aligned" | "misaligned" | "not_evaluated";

export interface BriefCreativeMismatch {
  element: string;
  brief_expectation: string;
  creative_reality: string;
  severity: "critical" | "moderate" | "minor";
}

export interface BriefAlignmentPayload {
  brief_provided: boolean;
  alignment_status: BriefAlignmentStatus;
  alignment_score: number | null;
  summary: string;
  creative_matches_brief: boolean | null;
  aligned_elements: string[];
  misaligned_elements: BriefCreativeMismatch[];
  missing_from_creative: string[];
  unexpected_in_creative: string[];
  goal_settings_check: {
    selected_goal: string;
    brief_implied_goal: string | null;
    is_aligned: boolean | null;
    explanation: string;
  };
  vertical_settings_check: {
    selected_vertical: string;
    brief_implied_vertical: string | null;
    is_aligned: boolean | null;
    explanation: string;
  };
  platform_requirements_check: {
    platform: string;
    status: BriefAlignmentStatus;
    findings: string[];
  };
  ai_brief_feedback: string;
  recommendations: string[];
  product_focus?: {
    expected_focus: string;
    detected_product: string;
    is_aligned: boolean | null;
    reason: string;
  };
}

const GOAL_KEYWORDS: Record<string, string[]> = {
  awareness: [
    "brand awareness", "awareness", "introduce", "launch", "visibility", "reach",
    "top of funnel", "tof", "brand recall", "discover", "new audience",
  ],
  consideration: [
    "consideration", "learn more", "compare", "evaluate", "research", "middle funnel",
    "mof", "education", "product tour", "features", "benefits",
  ],
  conversion: [
    "conversion", "conversions", "purchase", "buy", "sale", "sales", "checkout",
    "order", "convert", "revenue", "bottom of funnel", "bof", "promo", "discount offer",
  ],
  traffic: [
    "traffic", "drive visits", "website clicks", "click through", "site visits", "landing page traffic",
  ],
  lead_generation: [
    "lead", "leads", "lead gen", "demo", "book a demo", "form fill", "quote", "contact us",
    "sign up for", "register for", "webinar registration", "download whitepaper",
  ],
  engagement: [
    "engagement", "comments", "shares", "community", "social engagement", "interact",
  ],
  app_installs: [
    "app install", "install app", "download app", "mobile app", "app download",
  ],
  retargeting: [
    "retarget", "remarketing", "cart abandon", "win back", "returning users", "past visitors",
  ],
};

const VERTICAL_KEYWORDS: Record<string, string[]> = {
  healthcare: ["healthcare", "health", "medical", "pharma", "hospital", "wellness", "clinic"],
  technology: ["technology", "tech", "saas", "software", "ai", "platform", "cloud", "app"],
  automotive: ["automotive", "auto", "car", "vehicle", "bike", "motorcycle", "dealership"],
  fashion: ["fashion", "apparel", "clothing", "collection", "runway", "style"],
  ecommerce: ["ecommerce", "e-commerce", "retail", "shop", "store", "online store"],
  finance: ["finance", "financial", "investment", "wealth", "b2b finance"],
  banking: ["banking", "bank", "fintech", "loan", "credit card"],
  travel: ["travel", "tourism", "flight", "vacation", "destination"],
  hotels: ["hotel", "hospitality", "resort", "accommodation"],
  food: ["restaurant", "food", "dining", "cafe", "menu", "delivery"],
  luxury: ["luxury", "premium", "high-end", "exclusive", "couture"],
  real_estate: ["real estate", "property", "apartment", "home buying"],
  education: ["education", "edtech", "course", "university", "learning"],
  gaming: ["gaming", "game", "esports", "gamer"],
  entertainment: ["entertainment", "streaming", "ott", "movie", "show"],
  sports: ["sports", "athlete", "fitness brand", "team"],
  fitness: ["fitness", "gym", "workout", "training"],
  news_media: ["news", "media", "publisher", "journalism", "broadcast"],
};

const PLATFORM_BRIEF_HINTS: Record<AnalyzerPlatform, string[]> = {
  google_ads: [
    "search intent", "display", "responsive", "keyword", "high-intent", "landing page clarity",
  ],
  meta_ads: [
    "feed", "reels", "stories", "thumb-stop", "social", "instagram", "facebook", "ugc",
  ],
  programmatic: [
    "display banner", "publisher", "viewability", "open exchange", "dsp", "banner", "native",
  ],
};

function normalizeText(value: string): string {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreKeywordHits(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = keyword.includes(" ")
      ? new RegExp(escaped, "i")
      : new RegExp(`\\b${escaped}\\b`, "i");
    return count + (re.test(text) ? 1 : 0);
  }, 0);
}

/** Infer the campaign goal the brief most strongly implies. */
export function inferCampaignGoalFromBrief(brief: string): string | null {
  const text = normalizeText(brief);
  if (!text) return null;

  const scores = Object.entries(GOAL_KEYWORDS)
    .map(([goal, keywords]) => ({ goal, score: scoreKeywordHits(text, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) return null;
  if (scores.length > 1 && scores[0].score === scores[1].score) return null;
  return scores[0].goal;
}

/** Infer vertical from brief text when explicitly stated. */
export function inferVerticalFromBrief(brief: string): string | null {
  const text = normalizeText(brief);
  if (!text) return null;

  const scores = Object.entries(VERTICAL_KEYWORDS)
    .map(([vertical, keywords]) => ({ vertical, score: scoreKeywordHits(text, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) return null;
  if (scores.length > 1 && scores[0].score === scores[1].score) return null;
  return scores[0].vertical;
}

const GOAL_STAGE_MAP: Record<string, string> = {
  awareness: "awareness",
  engagement: "awareness",
  video_views: "awareness",
  consideration: "consideration",
  traffic: "consideration",
  lead_generation: "consideration",
  conversion: "conversion",
  app_installs: "conversion",
  retargeting: "conversion",
};

function goalsShareStage(selected: string, implied: string): boolean {
  return GOAL_STAGE_MAP[selected] === GOAL_STAGE_MAP[implied];
}

const GOAL_DISPLAY_LABELS: Record<string, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
  traffic: "Traffic",
  lead_generation: "Lead Generation",
  engagement: "Engagement",
  app_installs: "App Installs",
  retargeting: "Retargeting",
};

/** Bump when generation rules change so stored intents are regenerated. */
export const CAMPAIGN_INTENT_GENERATOR_VERSION = "v2";

const LABELED_GOAL_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  { pattern: /\bprimary kpi[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bprimary objective[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bcampaign goal[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bmain objective[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bsecondary kpi[:\s-]+([^.;\n]+)/i, priority: 2 },
  { pattern: /\bobjective[:\s-]+([^.;\n]+)/i, priority: 2 },
  { pattern: /\bsupporting kpi[:\s-]+([^.;\n]+)/i, priority: 3 },
];

const LABELED_ACTION_PATTERNS: Array<{ pattern: RegExp; priority: number }> = [
  { pattern: /\bprimary kpi[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bsecondary kpi[:\s-]+([^.;\n]+)/i, priority: 2 },
  { pattern: /\bsupporting kpi[:\s-]+([^.;\n]+)/i, priority: 3 },
  { pattern: /\bdesired (?:user )?action[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\btarget action[:\s-]+([^.;\n]+)/i, priority: 1 },
  { pattern: /\bcta[:\s-]+([^.;\n]+)/i, priority: 2 },
];

function formatGoalLabel(goal: string): string {
  return GOAL_DISPLAY_LABELS[goal] || goal.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function goalArticle(goalLabel: string): string {
  return /^[aeiou]/i.test(goalLabel.trim()) ? "an" : "a";
}

const USER_ACTION_PATTERNS: Array<{ pattern: RegExp; action: string; priority: number }> = [
  { pattern: /\b(sign up|register|subscribe|join|enroll)\b/i, action: "sign up", priority: 1 },
  { pattern: /\b(purchase|buy|order|checkout|convert|sales)\b/i, action: "complete a purchase", priority: 1 },
  { pattern: /\b(download|install|get the app|app install)\b/i, action: "download or install the app", priority: 1 },
  { pattern: /\b(book|schedule|request a demo|get a quote|contact us|lead|leads)\b/i, action: "request information or a demo", priority: 1 },
  { pattern: /\b(learn more|discover|explore|read|watch|research)\b/i, action: "learn more about the offer", priority: 2 },
  { pattern: /\b(click|visit|browse|shop|view)\b/i, action: "visit and explore the offer", priority: 2 },
  { pattern: /\b(engage|share|comment|follow|like)\b/i, action: "engage with the brand", priority: 3 },
  { pattern: /\b(awareness|introduce|reach|discover the brand)\b/i, action: "discover the brand and offering", priority: 3 },
];

function extractPrimaryUserAction(brief: string): string | null {
  const matches = USER_ACTION_PATTERNS
    .filter(({ pattern }) => pattern.test(brief))
    .sort((a, b) => a.priority - b.priority);
  return matches[0]?.action || null;
}

function resolveFunnelStageLabel(goal: string | null): string {
  const stage = goal ? GOAL_STAGE_MAP[goal] : null;
  switch (stage) {
    case "awareness":
      return "top-of-funnel awareness";
    case "consideration":
      return "mid-funnel consideration";
    case "conversion":
      return "bottom-funnel conversion";
    default:
      return goal ? `${formatGoalLabel(goal).toLowerCase()} stage` : "the intended funnel stage";
  }
}

function extractLabeledValues(
  brief: string,
  patterns: Array<{ pattern: RegExp; priority: number }>,
): string[] {
  return patterns
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(({ pattern }) => brief.match(pattern)?.[1]?.trim().replace(/[.,;]+$/, "") || "")
    .filter(Boolean);
}

/** Resolve campaign goal — Primary KPI and labeled objectives take precedence over body keyword hits. */
function resolveCampaignGoalForIntent(
  brief: string,
  options: { campaignGoal?: string; vertical?: string } = {},
): string | null {
  for (const labeled of extractLabeledValues(brief, LABELED_GOAL_PATTERNS)) {
    const fromLabel = inferCampaignGoalFromBrief(labeled);
    if (fromLabel) return fromLabel;
  }

  const fromBrief = inferCampaignGoalFromBrief(brief);
  if (fromBrief) return fromBrief;

  return options.campaignGoal || null;
}

function kpiPhraseToUserAction(phrase: string): string | null {
  const normalized = phrase.trim().replace(/[.,;]+$/, "");
  if (!normalized) return null;

  const fromPatterns = extractPrimaryUserAction(normalized);
  if (fromPatterns) return fromPatterns;

  const lower = normalized.toLowerCase();
  if (/\b(app install|installs|downloads?)\b/i.test(lower)) return "download or install the app";
  if (/\b(leads?|lead gen)\b/i.test(lower)) return "submit a lead or request information";
  if (/\b(conversions?|sales|purchases?|revenue)\b/i.test(lower)) return "complete a purchase or conversion";
  if (/\b(traffic|clicks|visits)\b/i.test(lower)) return "visit and explore the offer";
  if (/\b(awareness|reach|impressions)\b/i.test(lower)) return "discover the brand and offering";
  if (/\b(engagement|shares|comments)\b/i.test(lower)) return "engage with the brand";

  if (normalized.length > 3 && normalized.length < 80) {
    return `achieve ${normalized.toLowerCase()}`;
  }
  return null;
}

function extractPrioritizedUserAction(brief: string): string | null {
  for (const labeled of extractLabeledValues(brief, LABELED_ACTION_PATTERNS)) {
    const action = kpiPhraseToUserAction(labeled);
    if (action) return action;
  }
  return extractPrimaryUserAction(brief);
}

function extractDesiredOutcome(
  brief: string,
  goal: string | null,
  primaryAction: string | null,
): string | null {
  for (const labeled of extractLabeledValues(brief, LABELED_GOAL_PATTERNS)) {
    const action = kpiPhraseToUserAction(labeled);
    if (action) return action;
  }

  const metricOutcome = brief.match(
    /\b(?:increase|grow|drive|boost|generate|achieve|improve|maximize|reduce)\s+([^.;\n]{4,80})/i,
  );
  if (metricOutcome?.[1]) {
    const value = metricOutcome[1].trim().replace(/[.,;]+$/, "");
    if (!/^traffic to\b/i.test(value)) {
      return value;
    }
  }

  const businessOutcome = brief.match(
    /\b(?:business outcome|desired outcome|success metric)[:\s-]+([^.;\n]+)/i,
  );
  if (businessOutcome?.[1]) {
    return businessOutcome[1].trim().replace(/[.,;]+$/, "");
  }

  if (primaryAction) return primaryAction;
  if (goal) return `${formatGoalLabel(goal).toLowerCase()} results`;
  return null;
}

function padIntentToMinWords(text: string, minWords = 25, maxWords = 45): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= minWords) {
    return words.length <= maxWords
      ? text.replace(/\s+/g, " ").trim()
      : `${words.slice(0, maxWords).join(" ").replace(/[.,;]+$/, "")}.`;
  }

  const padding = "while keeping messaging consistent with the campaign brief and landing experience";
  const expanded = `${text.replace(/\s+/g, " ").trim()} ${padding}`;
  return padIntentToMinWords(expanded, minWords, maxWords);
}

function clampIntentWordCount(text: string, minWords = 25, maxWords = 45): string {
  return padIntentToMinWords(text.replace(/\s+/g, " ").trim(), minWords, maxWords);
}

/** Check whether user-selected goal/vertical match what the brief describes. */
export function evaluateBriefSettingsAlignment(params: {
  brief: string;
  selectedGoal: string;
  selectedVertical: string;
  platform: AnalyzerPlatform;
}): Pick<
  BriefAlignmentPayload,
  "goal_settings_check" | "vertical_settings_check" | "platform_requirements_check"
> {
  const { brief, selectedGoal, selectedVertical, platform } = params;
  const text = normalizeText(brief);

  const impliedGoal = resolveCampaignGoalForIntent(brief, { campaignGoal: selectedGoal });
  const impliedVertical = inferVerticalFromBrief(brief);

  let goalAligned: boolean | null = null;
  let goalExplanation = "";

  if (!text) {
    goalExplanation = "No campaign brief provided — goal alignment against brief was not evaluated.";
  } else if (!impliedGoal) {
    goalExplanation = `The brief does not clearly state a funnel objective. Selected goal "${formatGoalLabel(selectedGoal)}" was accepted, but add explicit objective language (e.g. awareness, leads, conversions) for tighter validation.`;
    goalAligned = null;
  } else if (impliedGoal === selectedGoal) {
    goalAligned = true;
    goalExplanation = `Campaign brief explicitly supports a ${formatGoalLabel(selectedGoal)} objective — settings match user requirements.`;
  } else if (goalsShareStage(selectedGoal, impliedGoal)) {
    goalAligned = null;
    goalExplanation = `Brief implies ${formatGoalLabel(impliedGoal)} while you selected ${formatGoalLabel(selectedGoal)}. Both sit in a similar funnel stage — review whether the creative tone matches your exact objective.`;
  } else {
    goalAligned = false;
    goalExplanation = `Brief describes a ${formatGoalLabel(impliedGoal)} campaign, but you selected ${formatGoalLabel(selectedGoal)}. This mismatch will skew analysis — update the campaign goal in Step 1 or revise the brief so they agree.`;
  }

  let verticalAligned: boolean | null = null;
  let verticalExplanation = "";

  if (!text) {
    verticalExplanation = "No campaign brief provided — vertical alignment against brief was not evaluated.";
  } else if (!impliedVertical) {
    verticalExplanation = `Brief does not name a specific industry vertical. Selected vertical "${selectedVertical.replace(/_/g, " ")}" will be used as the primary frame.`;
    verticalAligned = null;
  } else if (impliedVertical === selectedVertical) {
    verticalAligned = true;
    verticalExplanation = `Brief and selected vertical both target ${selectedVertical.replace(/_/g, " ")} — settings are consistent.`;
  } else {
    verticalAligned = false;
    verticalExplanation = `Brief signals ${impliedVertical.replace(/_/g, " ")} content, but the campaign vertical is set to ${selectedVertical.replace(/_/g, " ")}. Update one of them before trusting alignment scores.`;
  }

  const platformHints = PLATFORM_BRIEF_HINTS[platform] || [];
  const platformMentions = platformHints.filter((hint) => text.includes(hint.toLowerCase()));
  const platformFindings: string[] = [];

  if (platformMentions.length > 0) {
    platformFindings.push(`Brief references ${platform.replace(/_/g, " ")}-relevant delivery context: ${platformMentions.join(", ")}.`);
  }

  const platformLabel = platform.replace(/_/g, " ");
  if (platform === "google_ads") {
    platformFindings.push("Validate message clarity, offer visibility, and intent-led CTA against brief promises.");
  } else if (platform === "meta_ads") {
    platformFindings.push("Validate thumb-stop hook, emotional story, and feed-native composition against brief audience and tone.");
  } else {
    platformFindings.push("Validate banner scan speed, hierarchy, and CTA survival in cluttered inventory against brief message.");
  }

  return {
    goal_settings_check: {
      selected_goal: selectedGoal,
      brief_implied_goal: impliedGoal,
      is_aligned: goalAligned,
      explanation: goalExplanation,
    },
    vertical_settings_check: {
      selected_vertical: selectedVertical,
      brief_implied_vertical: impliedVertical,
      is_aligned: verticalAligned,
      explanation: verticalExplanation,
    },
    platform_requirements_check: {
      platform: platformLabel,
      status: goalAligned === false || verticalAligned === false ? "misaligned" : "aligned",
      findings: platformFindings,
    },
  };
}

export function buildCampaignBriefSystemPromptSection(
  platform: AnalyzerPlatform,
  goal: string,
  vertical: string,
  brief: string,
): string {
  if (!brief.trim()) return "";

  const platformLabel = platform.replace(/_/g, " ");
  return `
## CAMPAIGN BRIEF — PRIMARY VALIDATION AUTHORITY (mandatory when brief is provided)

The Client Brief below is the **single source of truth** for whether this creative and campaign settings are correct.
All alignment judgments (creative ↔ brief, goal ↔ brief, vertical ↔ brief, platform fit ↔ brief) must be grounded in the brief first, then cross-checked against visible creative evidence.

**Client Brief:**
"${brief.trim()}"

**Declared campaign settings:**
- Platform: ${platformLabel}
- Campaign Goal: ${goal.replace(/_/g, " ")}
- Industry Vertical: ${vertical.replace(/_/g, " ")}

### Brief validation protocol (apply for ${platformLabel} only)

1. **Creative ↔ Brief alignment** — Does the image/copy deliver what the brief promises (product, audience, offer, tone, geography, season, brand rules)? If the brief says "bike launch" but the visual shows a car, set creativeMatchesBrief: false and explain precisely.
2. **Goal ↔ Brief alignment** — Does the selected campaign goal match the brief's stated objective? If the brief says "drive app installs" but goal is Awareness, flag goalSettingsMismatch and explain why settings are wrong.
3. **Vertical ↔ Brief alignment** — Does the selected vertical match the brief's industry/product context?
4. **Platform ↔ Brief alignment** — Would this creative satisfy ${platformLabel} delivery requirements for the brief's audience and objective (not generic advice)?

### Mismatch reporting rules

- Name the **specific brief requirement** that fails and the **specific creative or setting element** that conflicts.
- Provide at least one **actionable recommendation** per critical mismatch.
- Never mark aligned if a core brief promise (product, offer, audience, objective) is visibly violated.
- Populate briefAlignment in JSON with full detail — do not collapse into generic "looks good" language.
`.trim();
}

interface RawAIBriefAlignment {
  creativeMatchesBrief?: boolean;
  briefMatchScore?: number;
  briefSummary?: string;
  alignedElements?: string[];
  misalignedElements?: Array<{
    element?: string;
    briefExpectation?: string;
    brief_expectation?: string;
    creativeReality?: string;
    creative_reality?: string;
    severity?: string;
  }>;
  missingFromCreative?: string[];
  missing_from_creative?: string[];
  unexpectedInCreative?: string[];
  unexpected_in_creative?: string[];
  goalSettingsMismatch?: boolean;
  goal_settings_mismatch?: boolean;
  briefImpliedGoal?: string;
  brief_implied_goal?: string;
  goalConflictExplanation?: string;
  goal_conflict_explanation?: string;
  verticalSettingsMismatch?: boolean;
  vertical_settings_mismatch?: boolean;
  briefImpliedVertical?: string;
  brief_implied_vertical?: string;
  verticalConflictExplanation?: string;
  vertical_conflict_explanation?: string;
  platformRequirementsStatus?: string;
  platform_requirements_status?: string;
  platformFindings?: string[];
  platform_findings?: string[];
  briefFeedback?: string;
  brief_feedback?: string;
  recommendations?: string[];
}

function normalizeMismatch(raw: NonNullable<RawAIBriefAlignment["misalignedElements"]>[number]): BriefCreativeMismatch {
  return {
    element: String(raw.element || "Creative element"),
    brief_expectation: String(raw.briefExpectation || raw.brief_expectation || ""),
    creative_reality: String(raw.creativeReality || raw.creative_reality || ""),
    severity: (["critical", "moderate", "minor"] as const).includes(raw.severity as "critical")
      ? (raw.severity as BriefCreativeMismatch["severity"])
      : "moderate",
  };
}

function deriveBriefStatus(
  creativeMatches: boolean | null,
  settingsGoalAligned: boolean | null,
  settingsVerticalAligned: boolean | null,
  score: number | null,
): BriefAlignmentStatus {
  if (creativeMatches === false || settingsGoalAligned === false || settingsVerticalAligned === false) {
    return "misaligned";
  }
  if (score !== null && score < 55) return "misaligned";
  if (score !== null && score < 75) return "partially_aligned";
  if (creativeMatches === true) {
    return "aligned";
  }
  return "partially_aligned";
}

/** Merge AI brief output with deterministic settings checks. */
export function buildBriefAlignmentPayload(params: {
  brief: string;
  selectedGoal: string;
  selectedVertical: string;
  platform: AnalyzerPlatform;
  aiBrief?: RawAIBriefAlignment | null;
  productFocusBlock?: BriefAlignmentPayload["product_focus"];
}): BriefAlignmentPayload {
  const { brief, selectedGoal, selectedVertical, platform, aiBrief, productFocusBlock } = params;
  const trimmed = brief.trim();

  if (!trimmed) {
    return {
      brief_provided: false,
      alignment_status: "not_evaluated",
      alignment_score: null,
      summary: "Add a Campaign Brief in Step 1 to enable brief-first validation.",
      creative_matches_brief: null,
      aligned_elements: [],
      misaligned_elements: [],
      missing_from_creative: [],
      unexpected_in_creative: [],
      goal_settings_check: {
        selected_goal: selectedGoal,
        brief_implied_goal: null,
        is_aligned: null,
        explanation: "No brief provided.",
      },
      vertical_settings_check: {
        selected_vertical: selectedVertical,
        brief_implied_vertical: null,
        is_aligned: null,
        explanation: "No brief provided.",
      },
      platform_requirements_check: {
        platform: platform.replace(/_/g, " "),
        status: "not_evaluated",
        findings: [],
      },
      ai_brief_feedback: "",
      recommendations: [],
      ...(productFocusBlock ? { product_focus: productFocusBlock } : {}),
    };
  }

  const settings = evaluateBriefSettingsAlignment({
    brief: trimmed,
    selectedGoal,
    selectedVertical,
    platform,
  });

  const impliedGoalFromAi = aiBrief?.briefImpliedGoal || aiBrief?.brief_implied_goal || null;
  const impliedVerticalFromAi = aiBrief?.briefImpliedVertical || aiBrief?.brief_implied_vertical || null;

  const goalSettingsAligned = aiBrief?.goalSettingsMismatch === true || aiBrief?.goal_settings_mismatch === true
    ? false
    : aiBrief?.goalSettingsMismatch === false || aiBrief?.goal_settings_mismatch === false
      ? true
      : settings.goal_settings_check.is_aligned;

  const verticalSettingsAligned = aiBrief?.verticalSettingsMismatch === true || aiBrief?.vertical_settings_mismatch === true
    ? false
    : aiBrief?.verticalSettingsMismatch === false || aiBrief?.vertical_settings_mismatch === false
      ? true
      : settings.vertical_settings_check.is_aligned;

  const goalExplanation = aiBrief?.goalConflictExplanation
    || aiBrief?.goal_conflict_explanation
    || settings.goal_settings_check.explanation;

  const verticalExplanation = aiBrief?.verticalConflictExplanation
    || aiBrief?.vertical_conflict_explanation
    || settings.vertical_settings_check.explanation;

  const creativeMatches = typeof aiBrief?.creativeMatchesBrief === "boolean"
    ? aiBrief.creativeMatchesBrief
    : productFocusBlock?.is_aligned === false
      ? false
      : null;

  const score = typeof aiBrief?.briefMatchScore === "number"
    ? Math.max(0, Math.min(100, Math.round(aiBrief.briefMatchScore)))
    : null;

  const misaligned = (aiBrief?.misalignedElements || [])
    .filter(Boolean)
    .map(normalizeMismatch);

  const alignedElements = (aiBrief?.alignedElements || []).map(String).filter(Boolean);
  const missing = (aiBrief?.missingFromCreative || aiBrief?.missing_from_creative || []).map(String).filter(Boolean);
  const unexpected = (aiBrief?.unexpectedInCreative || aiBrief?.unexpected_in_creative || []).map(String).filter(Boolean);
  const recommendations = (aiBrief?.recommendations || []).map(String).filter(Boolean).slice(0, 6);

  const platformStatusRaw = aiBrief?.platformRequirementsStatus || aiBrief?.platform_requirements_status;
  const platformFindings = [
    ...(aiBrief?.platformFindings || aiBrief?.platform_findings || []),
    ...settings.platform_requirements_check.findings,
  ].filter(Boolean);

  const status = deriveBriefStatus(creativeMatches, goalSettingsAligned, verticalSettingsAligned, score);

  let summary = aiBrief?.briefSummary || aiBrief?.brief_feedback || aiBrief?.briefFeedback || "";
  if (!summary) {
    if (status === "aligned") {
      summary = "Creative and campaign settings align with the campaign brief.";
    } else if (status === "misaligned") {
      summary = "Critical gaps exist between the campaign brief and the creative or campaign settings.";
    } else {
      summary = "Partial alignment with the campaign brief — review flagged elements before launch.";
    }
  }

  if (productFocusBlock?.is_aligned === false && !misaligned.length) {
    misaligned.push({
      element: "Product / subject",
      brief_expectation: productFocusBlock.reason,
      creative_reality: `Creative reads as ${productFocusBlock.detected_product}`,
      severity: "critical",
    });
  }

  return {
    brief_provided: true,
    alignment_status: status,
    alignment_score: score,
    summary,
    creative_matches_brief: creativeMatches,
    aligned_elements: alignedElements,
    misaligned_elements: misaligned,
    missing_from_creative: missing,
    unexpected_in_creative: unexpected,
    goal_settings_check: {
      selected_goal: selectedGoal,
      brief_implied_goal: impliedGoalFromAi || settings.goal_settings_check.brief_implied_goal,
      is_aligned: goalSettingsAligned,
      explanation: goalExplanation,
    },
    vertical_settings_check: {
      selected_vertical: selectedVertical,
      brief_implied_vertical: impliedVerticalFromAi || settings.vertical_settings_check.brief_implied_vertical,
      is_aligned: verticalSettingsAligned,
      explanation: verticalExplanation,
    },
    platform_requirements_check: {
      platform: platform.replace(/_/g, " "),
      status: (["aligned", "partially_aligned", "misaligned"] as const).includes(platformStatusRaw as "aligned")
        ? (platformStatusRaw as BriefAlignmentStatus)
        : settings.platform_requirements_check.status,
      findings: [...new Set(platformFindings)].slice(0, 6),
    },
    ai_brief_feedback: aiBrief?.briefFeedback || aiBrief?.brief_feedback || "",
    recommendations,
    ...(productFocusBlock ? { product_focus: productFocusBlock } : {}),
  };
}

export function parseAIBriefAlignment(raw: Record<string, unknown>): RawAIBriefAlignment | null {
  const block = raw.briefAlignment || raw.brief_alignment;
  if (!block || typeof block !== "object") return null;
  return block as RawAIBriefAlignment;
}

export type BriefIntentSummary = {
  campaignObjective: string;
  tryingToAchieve: string;
  productOrService: string;
  targetAudience: string;
  overallPurpose: string;
  narrative: string;
};

const AUDIENCE_PATTERNS = [
  /\btarget audience[:\s-]+([^.;\n]+)/i,
  /\baudience[:\s-]+([^.;\n]+)/i,
  /\baimed at ([^.;\n]+)/i,
  /\bfor ([^.;\n]{8,120}(?:users|customers|shoppers|buyers|professionals|parents|athletes|consumers))/i,
];

const PRODUCT_PATTERNS = [
  /\bpromot(?:e|ing|es)\s+(?:the\s+|our\s+|a\s+)?([^.;\n]+)/i,
  /\blaunch(?:ing)?\s+(?:the\s+|our\s+|a\s+)?([^.;\n]+)/i,
  /\bfor\s+(?:the\s+|our\s+)?([^.;\n]{4,80}?)\s+(?:campaign|collection|product|service|line|platform)/i,
  /\b(?:product|service|brand)[:\s-]+([^.;\n]+)/i,
];

function extractFirstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim().replace(/\s+/g, " ");
    if (value && value.length > 3) return value.replace(/[.,;]+$/, "");
  }
  return null;
}

function summarizeSentences(brief: string, maxSentences = 2): string {
  const sentences = brief
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ");
}

/** Derive a concise intent summary from the brief without echoing raw input. */
export function buildBriefIntentSummary(
  brief: string,
  options: { campaignGoal?: string; vertical?: string } = {},
): BriefIntentSummary | null {
  const text = brief.trim();
  if (!text) return null;

  const impliedGoal = resolveCampaignGoalForIntent(brief, options);
  const impliedVertical = inferVerticalFromBrief(brief);
  const resolvedGoal = impliedGoal || options.campaignGoal || null;
  const resolvedVertical = impliedVertical || options.vertical || null;

  const campaignObjective = resolvedGoal
    ? `Drive ${formatGoalLabel(resolvedGoal)} outcomes`
    : "Establish a clear marketing objective from the brief's stated goals";

  const productOrService = extractFirstMatch(text, PRODUCT_PATTERNS)
    || (resolvedVertical ? `${resolvedVertical.replace(/_/g, " ")} offering` : "The product or service described in the brief");

  const targetAudience = extractFirstMatch(text, AUDIENCE_PATTERNS)
    || "The audience segment referenced in the brief";

  const tryingToAchieve = resolvedGoal
    ? `Move the audience toward ${formatGoalLabel(resolvedGoal)} by delivering a message that supports that funnel stage.`
    : "Achieve the business outcome described in the brief through the proposed creative and media approach.";

  const overallPurpose = summarizeSentences(text, 1)
    || "Support the campaign's commercial or brand-building goals as outlined in the brief.";

  const narrativeParts = [
    resolvedGoal
      ? `This campaign is oriented toward ${formatGoalLabel(resolvedGoal)}.`
      : "The brief defines a campaign with a specific commercial or brand outcome.",
    `It focuses on ${productOrService.toLowerCase()}.`,
    `The intended audience appears to be ${targetAudience.toLowerCase()}.`,
    tryingToAchieve,
  ];

  return {
    campaignObjective,
    tryingToAchieve,
    productOrService,
    targetAudience,
    overallPurpose,
    narrative: narrativeParts.join(" "),
  };
}

export function buildCampaignIntentFingerprint(
  brief: string,
  options: { campaignGoal?: string; vertical?: string } = {},
): string {
  return [
    CAMPAIGN_INTENT_GENERATOR_VERSION,
    brief.trim(),
    options.campaignGoal || "",
    options.vertical || "",
  ].join("|");
}

export type ResolvedCampaignIntent = {
  intent: string;
  fingerprint: string;
  /** True when the brief (or goal/vertical) changed and intent was regenerated. */
  regenerated: boolean;
};

/**
 * Return persisted intent when the brief fingerprint matches; otherwise regenerate.
 */
export function resolveCampaignIntentForBrief(
  brief: string,
  options: {
    campaignGoal?: string;
    vertical?: string;
    storedIntent?: string;
    storedFingerprint?: string;
  } = {},
): ResolvedCampaignIntent {
  const trimmed = brief.trim();
  const fingerprint = trimmed
    ? buildCampaignIntentFingerprint(trimmed, options)
    : "";

  if (!trimmed) {
    return { intent: "", fingerprint: "", regenerated: false };
  }

  const stored = options.storedIntent?.trim();
  const hasStructuredFormat = Boolean(stored && stored.includes(" · ") && stored.split(" · ").length >= 3);
  if (stored && hasStructuredFormat && options.storedFingerprint === fingerprint) {
    return { intent: stored, fingerprint, regenerated: false };
  }

  const intent = buildCampaignIntentFromBrief(trimmed, options) || "";
  return { intent, fingerprint, regenerated: true };
}

function pickStoredIntentForFingerprint(
  fingerprint: string,
  ...sources: Array<{
    campaignIntent?: string;
    campaignIntentFingerprint?: string;
  } | null | undefined>
): string | undefined {
  for (const source of sources) {
    const intent = source?.campaignIntent?.trim();
    if (intent && source?.campaignIntentFingerprint === fingerprint) {
      return intent;
    }
  }
  return undefined;
}

export function resolveCampaignBriefContext(
  campaign: {
    id: string;
    campaignBrief?: string;
    campaignGoal?: string;
    vertical?: string;
    campaignIntent?: string;
    campaignIntentFingerprint?: string;
    updatedAt?: string;
  },
  snapshot: {
    campaignBrief?: string;
    campaignGoal?: string;
    vertical?: string;
    campaignIntent?: string;
    campaignIntentFingerprint?: string;
    updatedAt?: string;
  } | null,
): {
  brief: string;
  goal?: string;
  vertical?: string;
  storedIntent?: string;
  storedFingerprint?: string;
} {
  const snapBrief = snapshot?.campaignBrief?.trim() || "";
  const campBrief = campaign.campaignBrief?.trim() || "";

  const snapshotIsNewer = Boolean(
    snapshot?.updatedAt
    && campaign.updatedAt
    && new Date(snapshot.updatedAt).getTime() > new Date(campaign.updatedAt).getTime(),
  );

  const useSnapshotBrief = Boolean(snapBrief) && (
    !campBrief
    || snapBrief !== campBrief
    || snapshotIsNewer
  );

  const brief = useSnapshotBrief ? snapBrief : (campBrief || snapBrief);
  const goal = (useSnapshotBrief ? snapshot?.campaignGoal : undefined)
    || campaign.campaignGoal
    || snapshot?.campaignGoal;
  const vertical = (useSnapshotBrief ? snapshot?.vertical : undefined)
    || campaign.vertical
    || snapshot?.vertical;

  const fingerprint = brief
    ? buildCampaignIntentFingerprint(brief, { campaignGoal: goal, vertical })
    : "";

  const storedIntent = pickStoredIntentForFingerprint(
    fingerprint,
    useSnapshotBrief ? snapshot : null,
    campaign,
    useSnapshotBrief ? null : snapshot,
  );

  return {
    brief,
    goal,
    vertical,
    storedIntent,
    storedFingerprint: storedIntent ? fingerprint : undefined,
  };
}

/**
 * Generate a 25–45 word Campaign Intent from the brief using the standard three-part structure.
 * Wording adapts to brief content — nothing is invented beyond what can be inferred.
 */
export function buildCampaignIntentFromBrief(
  brief: string,
  options: { campaignGoal?: string; vertical?: string } = {},
): string | null {
  const text = brief.trim();
  if (!text) return null;

  const resolvedGoal = resolveCampaignGoalForIntent(text, options);
  const goalLabel = resolvedGoal ? formatGoalLabel(resolvedGoal).toLowerCase() : "campaign";
  const goalArticleWord = goalArticle(resolvedGoal ? formatGoalLabel(resolvedGoal) : "Campaign");

  const product = extractFirstMatch(text, PRODUCT_PATTERNS);
  const primaryAction = extractPrioritizedUserAction(text);
  const funnelStage = resolveFunnelStageLabel(resolvedGoal);
  const desiredOutcome = extractDesiredOutcome(text, resolvedGoal, primaryAction);

  const sentence1 = `Drive ${goalLabel} outcomes`;

  let sentence2: string;
  if (primaryAction) {
    sentence2 = `Promote ${goalArticleWord} ${goalLabel}-focused campaign to ${primaryAction}`;
  } else if (product) {
    sentence2 = `Promote ${goalArticleWord} ${goalLabel}-focused campaign for ${product.toLowerCase()}`;
  } else {
    sentence2 = `Promote ${goalArticleWord} ${goalLabel}-focused campaign aligned with the stated brief objectives`;
  }

  let sentence3: string;
  const outcomeForSentence3 = desiredOutcome && primaryAction && desiredOutcome === primaryAction
    ? `${goalLabel} results`
    : desiredOutcome;
  if (outcomeForSentence3) {
    sentence3 = `Move the audience toward ${outcomeForSentence3} by delivering messaging that supports ${funnelStage}`;
  } else {
    sentence3 = `Move the audience toward ${goalLabel} results by delivering messaging that supports ${funnelStage}`;
  }

  return clampIntentWordCount([sentence1, sentence2, sentence3].join(" · "));
}

/** Medium-length intent line for dashboard tables — delegates to structured generator. */
export function buildBriefIntentLine(
  brief: string,
  options: { campaignGoal?: string; vertical?: string } = {},
): string {
  return buildCampaignIntentFromBrief(brief, options) || "";
}
