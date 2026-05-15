/**
 * Advertising Intelligence Orchestrator
 *
 * POST /api/analyze-creative
 *
 * Architecture:
 * 1) Extraction Layer (OpenAI multimodal extraction only)
 * 2) Attention Analysis Layer (deterministic)
 * 3) Psychology Layer (deterministic)
 * 4) Audience Response Layer (deterministic)
 * 5) Behavioral Response Layer (deterministic)
 * 6) Campaign Alignment Layer (deterministic)
 * 7) Business Consequence Layer (deterministic)
 * 8) Strategic Recommendation Layer (deterministic)
 * 9) Weighted Scoring Layer (deterministic)
 * 10) Final Decision Intelligence Layer (deterministic)
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildBehavioralResponse } from "../../lib/behavioralResponse";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

type SignalLevel = "low" | "moderate" | "high";
type CtaPressure = "soft" | "moderate" | "aggressive";
type CampaignGoal = "awareness" | "traffic" | "conversion" | "lead_generation" | "engagement" | "app_installs" | "video_views" | "retargeting" | "consideration";
type GoalStage = "awareness" | "consideration" | "conversion";
type PlatformContext = "google_ads" | "meta_ads" | "programmatic";
type AlignmentStatus = "aligned" | "partially_aligned" | "misaligned";
type Severity = "low" | "medium" | "high";

interface ExtractionSignals {
  headline: string;
  cta: string;
  primary_message: string;
  visual_elements: string[];
  dominant_colors: string[];
  text_density: SignalLevel;
  layout_structure: string;
  brand_presence: SignalLevel;
  emotional_cues: string[];
  readability: SignalLevel;
  hierarchy_observations: string;
  trust_markers: string[];
  urgency_signals: string[];
  audience_clues: string[];
}

interface AttentionAnalysis {
  first_focus: string;
  attention_path: string;
  friction_points: string[];
  cta_visibility: string;
  mobile_attention_risk: string;
  attention_retention_risk: string;
  scan_stages: string[];
  attention_conflict: string;
  viewing_psychology: string;
}

interface PsychologyAnalysis {
  emotional_trigger: string;
  persuasion_style: string;
  psychological_conflict: string;
  trust_signal_strength: string;
  urgency_fit: string;
  audience_resistance: string;
}

interface AudienceResponse {
  likely_perception: string;
  emotional_reaction: string;
  motivation_match: string;
  resistance_reason: string;
  engagement_barrier: string;
}

interface CampaignAlignment {
  alignment_status: AlignmentStatus;
  strategic_conflict: string;
  reasoning: string;
  severity: Severity;
}

interface PlatformAlignment {
  platform: PlatformContext;
  platform_label: string;
  bmi_style: string;
  expected_attention_behavior: string;
  layout_expectation: string;
  engagement_pattern: string;
  is_aligned: boolean;
  reasoning: string;
  conflicts: string[];
  recommendations: string[];
}

interface GoogleDisplayIntelligence {
  campaign_goal: CampaignGoal;
  objective_priorities: string[];
  ecosystem_focus: string[];
  inventory_profile: {
    size: string;
    size_tier: "tier1" | "tier2" | "non_core";
    inventory_class: "desktop_inventory" | "mobile_inventory" | "universal_inventory" | "premium_inventory" | "non_core_inventory";
    likely_environments: string[];
  };
  viewability_analysis: {
    likely_visible_area: string;
    fold_visibility: string;
    clutter_risk: string;
    attention_survival: string;
  };
  visual_hierarchy_analysis: {
    expected_order: string[];
    status: "strong" | "mixed" | "weak";
    issues: string[];
  };
  cta_strength_analysis: {
    status: "strong" | "moderate" | "weak";
    visibility: string;
    clarity: string;
    urgency_fit: string;
  };
  mobile_cropping_risk: {
    risk_level: "low" | "medium" | "high";
    issues: string[];
  };
  responsive_safety_analysis: {
    status: "safe" | "watch" | "risky";
    risks: string[];
  };
  banner_blindness_detection: {
    risk_level: "low" | "medium" | "high";
    reason: string;
  };
  display_attention_analysis: {
    focal_intensity: string;
    contrast_energy: string;
    interruption_power: string;
  };
  branding_speed_analysis: {
    recognition_speed: "fast" | "moderate" | "slow";
    brand_recall_probability: string;
  };
  text_density_analysis: {
    classification: "optimal" | "slightly_overloaded" | "text_heavy" | "unreadable";
    impact: string;
  };
  auction_readiness_impact: string;
}

interface MetaFeedIntelligence {
  campaign_goal: CampaignGoal;
  objective_priorities: string[];
  ecosystem_focus: string[];
  placement_profile: {
    size: string;
    tier: "tier1" | "tier2" | "non_core";
    dominant_placement: "feed" | "story" | "reels" | "carousel" | "mixed";
  };
  thumb_stop_analysis: {
    predicted_strength: "strong" | "moderate" | "weak";
    reason: string;
    first_second_engagement_probability: string;
  };
  hook_strength_analysis: {
    status: "strong" | "moderate" | "weak";
    emotional_trigger: string;
    curiosity_gap: string;
  };
  mobile_cropping_analysis: {
    risk_level: "low" | "medium" | "high";
    issues: string[];
  };
  safe_zone_analysis: {
    status: "safe" | "watch" | "risky";
    overlays: string[];
    guidance: string;
  };
  visual_hierarchy_analysis: {
    expected_order: string[];
    status: "strong" | "mixed" | "weak";
    issues: string[];
  };
  social_native_feel_analysis: {
    status: "authentic" | "mixed" | "banner_like";
    reason: string;
  };
  reels_story_immersion_analysis: {
    status: "immersive" | "partial" | "weak";
    fullscreen_utilization: string;
    edge_safety: string;
  };
  cta_visibility_analysis: {
    status: "strong" | "moderate" | "weak";
    tap_likelihood: string;
    conflict_note: string;
  };
  text_density_analysis: {
    classification: "clean" | "balanced" | "slightly_overloaded" | "cluttered";
    impact: string;
  };
  creative_fatigue_analysis: {
    risk_level: "low" | "medium" | "high";
    reason: string;
  };
  emotional_trigger_analysis: {
    detected_triggers: string[];
    goal_fit: string;
  };
  platform_behavior_fit: string;
}

interface BusinessImpact {
  likely_effects: string[];
  affected_metrics: string[];
  funnel_risk: string;
  engagement_risk: string;
  conversion_risk: string;
  brand_perception_risk: string;
}

interface StrategicRecommendation {
  issue: string;
  why_it_hurts: string;
  recommended_change: string;
  expected_outcome: string;
  audience_reaction: string;
  emotional_barrier: string;
  missing_belief: string;
  trust_signal_gap: string;
  behavior_change_after_intervention: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

interface BehavioralResponse {
  perceived_message: string;
  emotional_state: string;
  likely_objection: string;
  trust_gap: string;
  identity_alignment: string;
  commitment_readiness: string;
  resistance_trigger: string;
  likely_behavior: string;
  curiosity_vs_intent_balance: string;
  risk_aversion: string;
  confidence_building: string;
  commitment_pressure: string;
}

interface StrategicScore {
  value: number;
  rationale: string;
}

interface ExtractionMeta {
  ocr_failed: boolean;
  ocr_error: string | null;
  extracted_text: string;
  cta_text: string;
  retry_count: number;
  timed_out: boolean;
  text_available: boolean;
}

interface FinalDecisionIntelligence {
  main_strategic_problem: string;
  why_audience_may_resist: string;
  business_consequence: string;
  what_should_change_now: string;
  expected_improvement: string;
  decision_summary: string;
}

interface ProductCategoryDetection {
  id: string;
  label: string;
  fitScore: number;
  evidence: string[];
}

interface AdvertisingBehaviorDetection {
  label: string;
  evidence: string[];
}

interface VerticalIntelligence {
  productCategory: ProductCategoryDetection;
  advertisingBehavior: AdvertisingBehaviorDetection;
  strategicInterpretation: string;
  behaviorAlignedToGoal: boolean;
  behaviorAlignmentReason: string;
}

const KNOWN_GOALS = new Set<CampaignGoal>([
  "awareness",
  "traffic",
  "conversion",
  "lead_generation",
  "engagement",
  "app_installs",
  "video_views",
  "retargeting",
  "consideration",
]);

const GOAL_ALIASES: Record<string, CampaignGoal> = {
  conversions: "conversion",
  leads: "lead_generation",
};

const GOAL_INTELLIGENCE_PROFILE: Record<CampaignGoal, {
  stage: GoalStage;
  expectedCtaPressure: CtaPressure;
  urgencyTolerance: SignalLevel;
  preferredEmotions: string[];
  creativeBehavior: string[];
  aiPriorities: string[];
  trustWeighted?: boolean;
}> = {
  awareness: {
    stage: "awareness",
    expectedCtaPressure: "soft",
    urgencyTolerance: "low",
    preferredEmotions: ["emotional", "curiosity", "trust", "aspiration"],
    creativeBehavior: ["emotional", "memorable", "broad appeal", "strong visual interruption"],
    aiPriorities: ["attention", "branding speed", "emotional impact"],
  },
  traffic: {
    stage: "consideration",
    expectedCtaPressure: "moderate",
    urgencyTolerance: "moderate",
    preferredEmotions: ["curiosity", "clarity", "confidence"],
    creativeBehavior: ["curiosity-driven", "value-focused", "click motivation"],
    aiPriorities: ["clarity", "click intent", "visual hierarchy"],
  },
  conversion: {
    stage: "conversion",
    expectedCtaPressure: "aggressive",
    urgencyTolerance: "high",
    preferredEmotions: ["trust", "confidence", "urgency", "action"],
    creativeBehavior: ["trust", "action readiness", "product clarity"],
    aiPriorities: ["conversion clarity", "confidence", "CTA visibility", "friction reduction"],
    trustWeighted: true,
  },
  lead_generation: {
    stage: "consideration",
    expectedCtaPressure: "moderate",
    urgencyTolerance: "moderate",
    preferredEmotions: ["trust", "authority", "confidence"],
    creativeBehavior: ["trust-heavy", "low friction", "authority signals"],
    aiPriorities: ["simplicity", "credibility", "value communication"],
    trustWeighted: true,
  },
  engagement: {
    stage: "awareness",
    expectedCtaPressure: "soft",
    urgencyTolerance: "low",
    preferredEmotions: ["emotional", "curiosity", "relatability"],
    creativeBehavior: ["social-native", "emotional", "comment/share triggers"],
    aiPriorities: ["thumb-stop power", "curiosity", "relatability"],
  },
  app_installs: {
    stage: "conversion",
    expectedCtaPressure: "aggressive",
    urgencyTolerance: "moderate",
    preferredEmotions: ["clarity", "confidence", "action"],
    creativeBehavior: ["UI showcase", "feature visualization", "mobile-first flow"],
    aiPriorities: ["app visibility", "usability communication", "mobile immersion"],
    trustWeighted: true,
  },
  video_views: {
    stage: "awareness",
    expectedCtaPressure: "soft",
    urgencyTolerance: "moderate",
    preferredEmotions: ["curiosity", "emotional", "surprise"],
    creativeBehavior: ["hook-first", "movement-heavy", "curiosity-driven"],
    aiPriorities: ["first-frame strength", "motion cues", "emotional interruption"],
  },
  retargeting: {
    stage: "conversion",
    expectedCtaPressure: "moderate",
    urgencyTolerance: "high",
    preferredEmotions: ["trust", "confidence", "familiarity"],
    creativeBehavior: ["familiarity", "urgency", "trust reinforcement"],
    aiPriorities: ["recognition speed", "direct clarity", "lower cognitive load"],
    trustWeighted: true,
  },
  consideration: {
    stage: "consideration",
    expectedCtaPressure: "moderate",
    urgencyTolerance: "moderate",
    preferredEmotions: ["trust", "confidence", "authority", "clarity"],
    creativeBehavior: ["evaluation", "value explanation", "moderate persuasion"],
    aiPriorities: ["clarity", "proof", "structured comparison"],
    trustWeighted: true,
  },
};

const PLATFORM_BMI_PROFILE: Record<PlatformContext, {
  label: string;
  bmiStyle: string;
  attentionBehavior: string;
  layoutExpectation: string;
  engagementPattern: string;
  standards: string[];
}> = {
  google_ads: {
    label: "Google Ads",
    bmiStyle: "Intent-led clarity and frictionless information hierarchy.",
    attentionBehavior: "Users scan quickly for relevance, claim clarity, and direct action utility.",
    layoutExpectation: "Readable headline + clear value proposition + high-legibility CTA above clutter.",
    engagementPattern: "Search/display intent conversion from relevance and message precision.",
    standards: [
      "Concise value-first headline",
      "Legible copy at glance speed",
      "Clear CTA-action relationship",
      "Low visual clutter for display contexts",
    ],
  },
  meta_ads: {
    label: "Meta Ads",
    bmiStyle: "Mobile-first emotional hook with social-feed rhythm.",
    attentionBehavior: "Users decide in-feed within seconds based on visual hook and emotional resonance.",
    layoutExpectation: "Strong first-frame visual with thumb-stop contrast and concise action framing.",
    engagementPattern: "Feed/story interaction improves when emotional trigger and CTA timing are balanced.",
    standards: [
      "Mobile-first visual dominance",
      "Fast emotional hook in first glance",
      "Clear social-feed CTA timing",
      "Text density optimized for scroll-speed readability",
    ],
  },
  programmatic: {
    label: "Programmatic / DSP",
    bmiStyle: "Placement-agnostic clarity with robust hierarchy across mixed inventory.",
    attentionBehavior: "Users encounter varied publisher contexts; hierarchy must survive context switching.",
    layoutExpectation: "Adaptive headline-visual-CTA hierarchy that stays legible across size variants.",
    engagementPattern: "Consistent response quality depends on scalable readability and trust cues.",
    standards: [
      "Cross-size hierarchy resilience",
      "Publisher-safe readability",
      "Trust and brand anchor consistency",
      "CTA prominence without crowding",
    ],
  },
};

const PRODUCT_CATEGORY_HINTS: Record<string, string[]> = {
  healthcare: ["hospital", "clinic", "doctor", "medical", "patient", "wellness", "care", "treatment", "pharma", "health"],
  technology: ["software", "saas", "platform", "cloud", "ai", "app", "tech", "automation", "digital"],
  automotive: ["car", "vehicle", "suv", "sedan", "drive", "engine", "mileage", "dealership", "auto"],
  news_media: ["news", "headline", "breaking", "journal", "editorial", "media", "publisher"],
  sports: ["sports", "team", "match", "league", "athlete", "fitness", "score", "stadium"],
  finance: ["finance", "investment", "portfolio", "market", "enterprise", "profit", "revenue"],
  luxury: ["luxury", "premium", "exclusive", "craftsmanship", "heritage", "elite", "high-end"],
  travel: ["travel", "destination", "trip", "vacation", "holiday", "flight", "journey", "tour"],
  hotels: ["hotel", "resort", "suite", "booking", "stay", "hospitality", "check-in"],
  food: ["restaurant", "food", "menu", "dining", "meal", "chef", "delivery", "cuisine", "coffee", "cafe", "latte", "espresso", "beverage", "cup"],
  banking: ["bank", "fintech", "account", "loan", "credit", "debit", "secure", "payment", "wallet"],
  real_estate: ["real estate", "property", "home", "mortgage", "apartment", "listing", "broker", "rent"],
  education: ["education", "course", "learn", "student", "academy", "school", "training", "certification"],
  gaming: ["game", "gaming", "play", "level", "esports", "console", "battle", "stream"],
  entertainment: ["streaming", "ott", "entertainment", "show", "movie", "series", "music", "watch"],
  ecommerce: ["shop", "store", "cart", "checkout", "sale", "discount", "buy", "purchase"],
};

const GOOGLE_TIER1_SIZES = new Set(["300x250", "728x90", "160x600", "300x600", "320x50", "970x250"]);
const GOOGLE_TIER2_SIZES = new Set(["336x280", "970x90", "320x100", "468x60", "250x250", "200x200"]);
const META_TIER1_SIZES = new Set(["1080x1080", "1080x1350", "1080x1920"]);
const META_TIER2_SIZES = new Set(["1200x628", "1200x1200"]);

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  healthcare: "Healthcare / Medical Services",
  technology: "Technology / Software",
  automotive: "Automotive / Vehicles",
  news_media: "News / Media",
  sports: "Sports / Fitness",
  finance: "Business / Finance",
  luxury: "Luxury / Premium Goods",
  travel: "Travel / Hospitality",
  hotels: "Hotels / Accommodation",
  food: "Restaurants / Food",
  banking: "Banking / Fintech",
  real_estate: "Real Estate / Property",
  education: "Higher Education / Professional Certification",
  gaming: "Gaming / Entertainment",
  entertainment: "Entertainment / OTT",
  ecommerce: "Retail / E-commerce",
  unknown: "Unclear / Mixed Category",
};

const PRODUCT_CATEGORY_GROUNDING_RULES = `## PRODUCT CATEGORY DETECTION - GROUNDING RULES

Before assigning a Product Category, you must cross-reference ALL of the following signals together. Never assign category from a single visual element alone.

SIGNAL CHECKLIST (run all four before deciding):

1. TEXT SIGNALS
Read every visible word in the creative.
Words like "coffee", "burger", "register", "enroll", "drive", "skin", "invest" are primary category anchors.
Text signals override visual ambiguity. Always.

2. PRODUCT VISUAL SIGNALS
Identify the physical object shown.
A glass with liquid + brown tones + cafe context = Beverage / Coffee.
Do NOT abstract a product visual into a metaphor.
A coffee glass is NOT a technology signal.
A burger is NOT a lifestyle signal.
Read objects literally before reading them symbolically.

3. PRICE + OFFER SIGNALS
If price badges, discount percentages, or "GET X% OFF" language appears:
- The creative is performing direct-response or ecommerce behavior
- This does NOT change the product category - it changes the Advertising Behavior only

4. CTA SIGNALS
"ORDER NOW" -> Ecommerce / food ordering behavior
"REGISTER NOW" -> Education / enrollment behavior
"BOOK NOW" -> Hospitality / travel behavior
"SHOP NOW" -> Retail / ecommerce behavior
CTA language confirms Advertising Behavior, not Product Category.

## CONFLICT PREVENTION RULE

If your detected Product Category does NOT match any of the following:
- The primary text headline
- The physical product shown
- The price/offer context

Then your category detection is WRONG. Re-evaluate.

## FINAL RULE

Product Category = what is literally being sold (read text + product visual together)
Advertising Behavior = how it is being sold (read offer structure + CTA + persuasion pattern)

These are two separate decisions. Never let Advertising Behavior contaminate Product Category detection.`;

const KNOWN_VERTICALS = new Set(Object.keys(PRODUCT_CATEGORY_HINTS));

const AGGRESSIVE_CTA_PATTERN = /\b(buy now|buy|book now|book today|claim (deal|offer|now)?|shop now|order now|checkout|subscribe now|apply now|enroll now|start now|join now|get started now|download now|reserve now|sign up now|register now)\b/;
const MODERATE_CTA_PATTERN = /\b(learn more|learn about|explore|discover|compare|compare options|compare plans|see pricing|view pricing|pricing|view details|details|view features|features|read reviews|reviews|view reviews|check availability|availability|view inventory|view models|view curriculum|view instructors|see outcomes|get quote|request demo|book demo|schedule|watch demo|view plans|view services|view tools|view offers|see performance|check fees|explore solutions|explore services|explore program|sign up|register|get started|start free trial|try free)\b/;

function inferDetectedGoalFromSignals(
  extraction: ExtractionSignals,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
  behaviorLabel: string,
): CampaignGoal {
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.urgency_signals.join(" "),
    extraction.trust_markers.join(" "),
    extraction.visual_elements.join(" "),
  ].join(" ").toLowerCase();

  const behavior = behaviorLabel.toLowerCase();
  const conversionLike = /conversion|direct-response|discount|impulse-purchase/.test(behavior);
  const awarenessLike = /awareness|storytelling|aspirational|lifestyle branding/.test(behavior);
  const hasStrongTransactionalIntent = /\b(buy now|order now|shop now|checkout|claim deal|claim offer|apply now|enroll now|subscribe now|book now)\b/.test(corpus);
  const hasPromoPressure = /\b(discount|%\s*off|sale|promo|deal|save)\b/.test(corpus);
  const hasEvaluationIntent = /\b(compare|comparison|pricing|features|details|spec|specification|reviews|ratings|outcomes|curriculum|plans?|options?|demo|quote)\b/.test(corpus);
  const hasTrustIntent = /\b(trust|secure|security|compliance|certification|warranty|proof|testimonial|case study|credential|verified|accredited)\b/.test(corpus);
  const hasAwarenessIntent = /\b(discover|explore|story|journey|experience|introducing|new|launch|awareness|brand|lifestyle|inspiration)\b/.test(corpus);

  const awarenessScore =
    (ctaPressure === "soft" ? 3 : 0) +
    (urgencyLevel === "low" ? 2 : 0) +
    (hasAwarenessIntent ? 2 : 0) +
    (awarenessLike ? 1 : 0) +
    (hasStrongTransactionalIntent ? -3 : 0) +
    (hasPromoPressure ? -2 : 0);

  const considerationScore =
    (ctaPressure === "moderate" ? 3 : 0) +
    (urgencyLevel === "moderate" ? 2 : 0) +
    (hasEvaluationIntent ? 2 : 0) +
    (hasTrustIntent ? 2 : 0) +
    (extraction.trust_markers.length > 0 ? 1 : 0) +
    (ctaPressure === "soft" && hasEvaluationIntent ? 1 : 0) +
    (ctaPressure === "aggressive" ? -2 : 0) +
    (urgencyLevel === "high" ? -1 : 0);

  const conversionScore =
    (ctaPressure === "aggressive" ? 4 : 0) +
    (urgencyLevel === "high" ? 3 : 0) +
    (hasStrongTransactionalIntent ? 3 : 0) +
    (hasPromoPressure ? 2 : 0) +
    (conversionLike ? 1 : 0) +
    (urgencyLevel === "low" ? -2 : 0) +
    (ctaPressure === "soft" ? -2 : 0);

  // Deterministic guardrails first.
  if (ctaPressure === "aggressive" && (urgencyLevel === "high" || hasStrongTransactionalIntent || hasPromoPressure)) {
    return "conversion";
  }
  if (ctaPressure === "soft" && urgencyLevel === "low" && !hasStrongTransactionalIntent && !hasPromoPressure) {
    return "awareness";
  }

  if (conversionScore > considerationScore && conversionScore > awarenessScore) {
    return "conversion";
  }
  if (awarenessScore > considerationScore && awarenessScore > conversionScore) {
    return "awareness";
  }

  // Tie-breakers prevent consideration from becoming a catch-all stage.
  if (conversionScore === considerationScore && ctaPressure === "aggressive") {
    return "conversion";
  }
  if (awarenessScore === considerationScore && ctaPressure === "soft" && urgencyLevel !== "high") {
    return "awareness";
  }

  return "consideration";
}

function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function normalizeGoal(goal: string): CampaignGoal {
  const cleaned = (goal || "").toLowerCase().trim();
  if (GOAL_ALIASES[cleaned]) return GOAL_ALIASES[cleaned];
  return KNOWN_GOALS.has(cleaned as CampaignGoal) ? (cleaned as CampaignGoal) : "awareness";
}

function getGoalStage(goal: CampaignGoal): GoalStage {
  return GOAL_INTELLIGENCE_PROFILE[goal].stage;
}

function normalizePlatform(platform: string): PlatformContext {
  const cleaned = (platform || "").toLowerCase().trim();
  if (cleaned === "google" || cleaned === "google_ads" || cleaned === "gdn") return "google_ads";
  if (cleaned === "meta" || cleaned === "meta_ads" || cleaned === "facebook" || cleaned === "instagram") return "meta_ads";
  if (cleaned === "programmatic" || cleaned === "dsp" || cleaned === "display_ads") return "programmatic";
  return "programmatic";
}

function normalizeVertical(vertical: string): string {
  const cleaned = (vertical || "").toLowerCase().trim();
  return KNOWN_VERTICALS.has(cleaned) ? cleaned : "technology";
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function traceStrategicValidation(payload: Record<string, unknown>): void {
  const behavioral = payload.behavioral_response as Record<string, unknown> | undefined;
  const attention = payload.attention_analysis as Record<string, unknown> | undefined;
  const strategicScore = payload.strategic_alignment_score as Record<string, unknown> | undefined;

  const validations = [
    {
      field: "main_strategic_problem",
      value: payload.main_strategic_problem,
      passed: isNonEmptyString(payload.main_strategic_problem),
    },
    {
      field: "why_audience_may_resist",
      value: payload.why_audience_may_resist,
      passed: isNonEmptyString(payload.why_audience_may_resist),
    },
    {
      field: "business_consequence",
      value: payload.business_consequence,
      passed: isNonEmptyString(payload.business_consequence),
    },
    {
      field: "campaign_alignment",
      value: payload.campaign_alignment,
      passed: Boolean(payload.campaign_alignment && typeof payload.campaign_alignment === "object"),
    },
    {
      field: "platform_alignment",
      value: payload.platform_alignment,
      passed: Boolean(payload.platform_alignment && typeof payload.platform_alignment === "object"),
    },
    {
      field: "goal_alignment",
      value: payload.goal_alignment,
      passed: Boolean(payload.goal_alignment && typeof payload.goal_alignment === "object"),
    },
    {
      field: "vertical_alignment",
      value: payload.vertical_alignment,
      passed: Boolean(payload.vertical_alignment && typeof payload.vertical_alignment === "object"),
    },
    {
      field: "business_impact",
      value: payload.business_impact,
      passed: Boolean(payload.business_impact && typeof payload.business_impact === "object"),
    },
    {
      field: "attention_analysis",
      value: payload.attention_analysis,
      passed: Boolean(payload.attention_analysis && typeof payload.attention_analysis === "object"),
    },
    {
      field: "attention_analysis.friction_points",
      value: attention?.friction_points,
      passed: Array.isArray(attention?.friction_points),
    },
    {
      field: "strategic_recommendations",
      value: payload.strategic_recommendations,
      passed: Array.isArray(payload.strategic_recommendations),
    },
    {
      field: "expected_improvement",
      value: payload.expected_improvement,
      passed: isNonEmptyString(payload.expected_improvement),
    },
    {
      field: "strategic_alignment_score",
      value: payload.strategic_alignment_score,
      passed: Boolean(payload.strategic_alignment_score && typeof payload.strategic_alignment_score === "object"),
    },
    {
      field: "strategic_alignment_score.value",
      value: strategicScore?.value,
      passed: Number.isFinite(Number(strategicScore?.value)),
    },
    {
      field: "behavioral_response",
      value: payload.behavioral_response,
      passed: Boolean(payload.behavioral_response && typeof payload.behavioral_response === "object"),
    },
    {
      field: "behavioral_response.perceived_message",
      value: behavioral?.perceived_message,
      passed: isNonEmptyString(behavioral?.perceived_message),
    },
    {
      field: "behavioral_response.emotional_state",
      value: behavioral?.emotional_state,
      passed: isNonEmptyString(behavioral?.emotional_state),
    },
    {
      field: "behavioral_response.likely_objection",
      value: behavioral?.likely_objection,
      passed: isNonEmptyString(behavioral?.likely_objection),
    },
    {
      field: "behavioral_response.trust_gap",
      value: behavioral?.trust_gap,
      passed: isNonEmptyString(behavioral?.trust_gap),
    },
    {
      field: "behavioral_response.identity_alignment",
      value: behavioral?.identity_alignment,
      passed: isNonEmptyString(behavioral?.identity_alignment),
    },
    {
      field: "behavioral_response.commitment_readiness",
      value: behavioral?.commitment_readiness,
      passed: isNonEmptyString(behavioral?.commitment_readiness),
    },
    {
      field: "behavioral_response.resistance_trigger",
      value: behavioral?.resistance_trigger,
      passed: isNonEmptyString(behavioral?.resistance_trigger),
    },
    {
      field: "behavioral_response.likely_behavior",
      value: behavioral?.likely_behavior,
      passed: isNonEmptyString(behavioral?.likely_behavior),
    },
    {
      field: "behavioral_response.curiosity_vs_intent_balance",
      value: behavioral?.curiosity_vs_intent_balance,
      passed: isNonEmptyString(behavioral?.curiosity_vs_intent_balance),
    },
    {
      field: "behavioral_response.risk_aversion",
      value: behavioral?.risk_aversion,
      passed: isNonEmptyString(behavioral?.risk_aversion),
    },
    {
      field: "behavioral_response.confidence_building",
      value: behavioral?.confidence_building,
      passed: isNonEmptyString(behavioral?.confidence_building),
    },
    {
      field: "behavioral_response.commitment_pressure",
      value: behavioral?.commitment_pressure,
      passed: isNonEmptyString(behavioral?.commitment_pressure),
    },
  ];

  validations.forEach((entry) => {
    console.log("[validation]", entry);
  });

  const failedFields = validations
    .filter((entry) => !entry.passed)
    .map((entry) => entry.field);

  console.log("[validateStrategicResponse] FINAL RESULT", {
    passed: failedFields.length === 0,
    failedFields,
  });
}

function normalizeSignalLevel(value: unknown, fallback: SignalLevel = "moderate"): SignalLevel {
  return value === "low" || value === "moderate" || value === "high" ? value : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function normalizeExtraction(raw: Record<string, unknown>): ExtractionSignals {
  return {
    headline: typeof raw.headline === "string" ? raw.headline : "",
    cta: typeof raw.cta === "string" ? raw.cta : "",
    primary_message: typeof raw.primary_message === "string" ? raw.primary_message : "",
    visual_elements: normalizeStringArray(raw.visual_elements),
    dominant_colors: normalizeStringArray(raw.dominant_colors),
    text_density: normalizeSignalLevel(raw.text_density),
    layout_structure: typeof raw.layout_structure === "string" ? raw.layout_structure : "",
    brand_presence: normalizeSignalLevel(raw.brand_presence),
    emotional_cues: normalizeStringArray(raw.emotional_cues),
    readability: normalizeSignalLevel(raw.readability),
    hierarchy_observations: typeof raw.hierarchy_observations === "string" ? raw.hierarchy_observations : "",
    trust_markers: normalizeStringArray(raw.trust_markers),
    urgency_signals: normalizeStringArray(raw.urgency_signals),
    audience_clues: normalizeStringArray(raw.audience_clues),
  };
}

function fallbackExtractionSignals(reason: string): ExtractionSignals {
  return {
    headline: "",
    cta: "",
    primary_message: "",
    visual_elements: ["creative_asset"],
    dominant_colors: [],
    text_density: "moderate",
    layout_structure: `Fallback extraction used: ${reason}`,
    brand_presence: "moderate",
    emotional_cues: [],
    readability: "moderate",
    hierarchy_observations: "Layout hierarchy inferred without OCR text extraction.",
    trust_markers: [],
    urgency_signals: [],
    audience_clues: [],
  };
}

async function normalizeImageForVision(buffer: Buffer): Promise<{ mimeType: "image/png"; base64: string; width: number; height: number }> {
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();

  const width = metadata.width ?? 0;
  const shouldUpscale = width > 0 && width < 900;
  const transformed = shouldUpscale
    ? pipeline.resize({ width: 900, withoutEnlargement: false })
    : pipeline;

  const png = await transformed.png({ compressionLevel: 9 }).toBuffer();
  const normalizedMeta = await sharp(png).metadata();

  return {
    mimeType: "image/png",
    base64: png.toString("base64"),
    width: normalizedMeta.width ?? width,
    height: normalizedMeta.height ?? (metadata.height ?? 0),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function extractSignalsWithRetry(params: {
  openai: OpenAI;
  mimeType: "image/png";
  base64: string;
  extractionUserPrompt: string;
}): Promise<{ parsed: Record<string, unknown>; meta: ExtractionMeta }> {
  const { openai, mimeType, base64, extractionUserPrompt } = params;
  let lastError: Error | null = null;
  let timedOut = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const completion = await withTimeout(
        openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o",
          max_tokens: 900,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "high",
                  },
                },
                { type: "text", text: extractionUserPrompt },
              ],
            },
          ],
        }),
        10000,
        "OpenAI vision extraction"
      );

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new Error("No extraction output from model");
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const extraction = normalizeExtraction(parsed);
      const extractedText = [extraction.headline, extraction.primary_message, extraction.cta]
        .filter((text) => typeof text === "string" && text.trim().length > 0)
        .join(" ")
        .trim();

      return {
        parsed,
        meta: {
          ocr_failed: false,
          ocr_error: null,
          extracted_text: extractedText,
          cta_text: extraction.cta?.trim() ? extraction.cta : "unavailable",
          retry_count: attempt - 1,
          timed_out: false,
          text_available: extractedText.length > 0,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown OCR extraction error");
      lastError = err;
      timedOut = timedOut || /timed out/i.test(err.message);
      console.error("[ocr] extraction attempt failed", {
        attempt,
        error: err.message,
        stack: err.stack,
      });
    }
  }

  const fallbackMeta: ExtractionMeta = {
    ocr_failed: true,
    ocr_error: lastError?.message || "OCR extraction failed",
    extracted_text: "",
    cta_text: "unavailable",
    retry_count: 1,
    timed_out: timedOut,
    text_available: false,
  };

  return {
    parsed: fallbackExtractionSignals(fallbackMeta.ocr_error || "OCR extraction failed") as unknown as Record<string, unknown>,
    meta: fallbackMeta,
  };
}

function classifyCtaPressure(cta: string): CtaPressure {
  const text = cta.toLowerCase();
  if (AGGRESSIVE_CTA_PATTERN.test(text)) {
    return "aggressive";
  }
  if (MODERATE_CTA_PATTERN.test(text)) {
    return "moderate";
  }
  return "soft";
}

function inferUrgencyLevel(extraction: ExtractionSignals): SignalLevel {
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.urgency_signals.join(" "),
    extraction.emotional_cues.join(" "),
  ].join(" ").toLowerCase();

  if (/\b(limited time|ends today|last chance|hurry|only today|countdown|final hours|expires|act now|while supplies last)\b/.test(corpus)) {
    return "high";
  }
  if (/\b(soon|this week|don.t miss|book early|limited slots|ending soon|today)\b/.test(corpus)) {
    return "moderate";
  }
  return "low";
}

function buildSignalCorpus(extraction: ExtractionSignals): string {
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.visual_elements.join(" "),
    extraction.audience_clues.join(" "),
    extraction.urgency_signals.join(" "),
    extraction.trust_markers.join(" "),
    extraction.emotional_cues.join(" "),
  ].join(" ").toLowerCase();

  return corpus;
}

function deriveProductCategoryLabel(id: string, corpus: string): string {
  if (id === "food") {
    if (/coffee|cafe|latte|espresso|brew|beverage|iced coffee|americano|cappuccino/.test(corpus)) {
      return "Coffee / Beverage";
    }
    if (/burger|fries|combo|meal|sandwich|chicken burger|qsr|fast food/.test(corpus)) {
      return "Quick-Service Restaurant / Burger";
    }
    if (/pizza|slice|pepperoni|margherita/.test(corpus)) {
      return "Quick-Service Restaurant / Pizza";
    }
    return "Restaurants / Food";
  }

  return PRODUCT_CATEGORY_LABELS[id] || PRODUCT_CATEGORY_LABELS.unknown;
}

function detectProductCategoryFromSignals(selectedVertical: string, extraction: ExtractionSignals): ProductCategoryDetection {
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();
  const visualCorpus = [
    extraction.visual_elements.join(" "),
    extraction.audience_clues.join(" "),
    extraction.urgency_signals.join(" "),
    extraction.trust_markers.join(" "),
    extraction.emotional_cues.join(" "),
  ].join(" ").toLowerCase();
  const corpus = `${textCorpus} ${visualCorpus}`;

  let bestVertical = selectedVertical;
  let bestScore = -1;

  for (const [candidate, hints] of Object.entries(PRODUCT_CATEGORY_HINTS)) {
    const score = hints.reduce((acc, keyword) => {
      const textMatch = textCorpus.includes(keyword) ? 3 : 0;
      const visualMatch = visualCorpus.includes(keyword) ? 1 : 0;
      return acc + textMatch + visualMatch;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestVertical = candidate;
    }
  }

  const selectedHints = PRODUCT_CATEGORY_HINTS[selectedVertical] ?? [];
  const matchedEvidence = selectedHints.filter((keyword) => corpus.includes(keyword)).slice(0, 4);
  const fitScore = selectedHints.length === 0
    ? 50
    : Math.round((matchedEvidence.length / selectedHints.length) * 100);

  const detectedId = bestScore <= 0 ? "unknown" : bestVertical;

  return {
    id: detectedId,
    label: deriveProductCategoryLabel(detectedId, corpus),
    fitScore,
    evidence: matchedEvidence,
  };
}

function detectAdvertisingBehaviorFromSignals(
  extraction: ExtractionSignals,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
  goal: CampaignGoal,
  productCategoryId: string
): AdvertisingBehaviorDetection {
  const corpus = buildSignalCorpus(extraction);
  const behaviorEvidence = [extraction.cta, extraction.headline, extraction.primary_message]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .slice(0, 2);

  const hasDiscount = /discount|save|sale|offer|% off|deal|limited/.test(corpus);
  const hasRetailAction = /shop now|buy now|order now|add to cart|checkout|buy|purchase/.test(corpus);
  const hasHospitalityStory = /cafe|coffee|restaurant|dining|chef|ambiance|experience|crafted/.test(corpus);
  const hasAuthoritySignal = /certification|course|academy|expert|professional|credential|enroll/.test(corpus);
  const hasLeadGenSignal = /book demo|request demo|consultation|contact us|talk to|schedule/.test(corpus);

  if (hasDiscount && (ctaPressure === "aggressive" || hasRetailAction)) {
    return {
      label: "Discount-led direct-response promotion",
      evidence: behaviorEvidence,
    };
  }

  if (hasRetailAction || (ctaPressure === "aggressive" && productCategoryId === "ecommerce")) {
    return {
      label: "Retail-style ecommerce conversion advertising",
      evidence: behaviorEvidence,
    };
  }

  if (productCategoryId === "food" && (hasRetailAction || /menu|delivery|order/.test(corpus))) {
    return {
      label: "Impulse-purchase fast-food advertising",
      evidence: behaviorEvidence,
    };
  }

  if ((productCategoryId === "food" || productCategoryId === "hotels" || productCategoryId === "travel") && hasHospitalityStory && ctaPressure !== "aggressive") {
    return {
      label: "Hospitality storytelling and lifestyle branding",
      evidence: behaviorEvidence,
    };
  }

  if (productCategoryId === "education" && (hasAuthoritySignal || urgencyLevel === "high")) {
    return {
      label: urgencyLevel === "high"
        ? "Urgency-driven enrollment marketing"
        : "Authority-led professional education marketing",
      evidence: behaviorEvidence,
    };
  }

  if (hasLeadGenSignal) {
    return {
      label: "Trust-building B2B lead generation",
      evidence: behaviorEvidence,
    };
  }

  if (goal === "awareness") {
    return {
      label: "Aspirational brand awareness advertising",
      evidence: behaviorEvidence,
    };
  }

  return {
    label: "Informational consideration-stage persuasion",
    evidence: behaviorEvidence,
  };
}

function buildBehaviorAlignmentReason(goal: CampaignGoal, behaviorLabel: string): { aligned: boolean; reason: string } {
  const goalStage = getGoalStage(goal);
  const normalized = behaviorLabel.toLowerCase();
  const awarenessLike = /awareness|storytelling|aspirational/.test(normalized);
  const considerationLike = /consideration|authority|trust-building|informational/.test(normalized);
  const conversionLike = /conversion|direct-response|discount|impulse-purchase|enrollment/.test(normalized);

  if (goalStage === "awareness") {
    return awarenessLike
      ? { aligned: true, reason: "Behavior supports top-of-funnel attention building without premature transaction pressure." }
      : { aligned: false, reason: "Behavior is conversion-leaning for an awareness-stage objective." };
  }

  if (goalStage === "consideration") {
    return considerationLike || awarenessLike
      ? { aligned: true, reason: "Behavior supports evaluation and trust-building for mid-funnel audiences." }
      : { aligned: false, reason: "Behavior over-indexes on transaction pressure before evaluation is established." };
  }

  return conversionLike
    ? { aligned: true, reason: "Behavior matches late-stage intent and action-oriented campaign goals." }
    : { aligned: false, reason: "Behavior is too soft for a conversion-stage objective." };
}

function buildStrategicInterpretation(
  extraction: ExtractionSignals,
  productCategory: ProductCategoryDetection,
  behavior: AdvertisingBehaviorDetection,
  behaviorAlignmentReason: string,
  selectedVertical: string
): string {
  const visualEvidence = extraction.visual_elements[0] || extraction.primary_message || extraction.headline || "the creative framing";

  if (productCategory.id !== "unknown" && productCategory.id !== selectedVertical) {
    return `The visual signal \"${visualEvidence}\" indicates a ${productCategory.label.toLowerCase()} category, while campaign setup expects ${selectedVertical.replace(/_/g, " ")}. This creates a category-level identity conflict before persuasion effects are considered.`;
  }

  return `The visual signal \"${visualEvidence}\" frames this as ${behavior.label.toLowerCase()}, and ${behaviorAlignmentReason.toLowerCase()}`;
}

function buildVerticalIntelligence(
  selectedVertical: string,
  extraction: ExtractionSignals,
  goal: CampaignGoal,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel
): VerticalIntelligence {
  const productCategory = detectProductCategoryFromSignals(selectedVertical, extraction);
  const advertisingBehavior = detectAdvertisingBehaviorFromSignals(
    extraction,
    ctaPressure,
    urgencyLevel,
    goal,
    productCategory.id,
  );
  const behaviorAlignment = buildBehaviorAlignmentReason(goal, advertisingBehavior.label);

  return {
    productCategory,
    advertisingBehavior,
    strategicInterpretation: buildStrategicInterpretation(
      extraction,
      productCategory,
      advertisingBehavior,
      behaviorAlignment.reason,
      selectedVertical,
    ),
    behaviorAlignedToGoal: behaviorAlignment.aligned,
    behaviorAlignmentReason: behaviorAlignment.reason,
  };
}

function buildAttentionAnalysis(extraction: ExtractionSignals, goal: CampaignGoal, ctaPressure: CtaPressure): AttentionAnalysis {
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const headline = extraction.headline?.trim();
  const cta = extraction.cta?.trim();
  const visualCue = extraction.visual_elements[0] || "primary visual";

  const firstFocus = headline
    ? "headline"
    : extraction.brand_presence === "high"
      ? "brand block"
      : visualCue;

  const frictionPoints: string[] = [];
  if (extraction.text_density === "high") {
    frictionPoints.push("Competing copy blocks fragment attention before users reach the CTA.");
  }
  if (extraction.readability === "low") {
    frictionPoints.push("Low readability creates early cognitive fatigue on mobile scroll.");
  }
  if (extraction.hierarchy_observations.toLowerCase().includes("unclear")) {
    frictionPoints.push("Hierarchy is unclear, so users cannot identify the next action quickly.");
  }

  const ctaVisibility = ctaPressure === "aggressive" && extraction.readability !== "low"
    ? "CTA is visually assertive, but may feel pushy depending on campaign stage."
    : extraction.readability === "low"
      ? "CTA visibility is weakened by dense text and low legibility around action elements."
      : "CTA is visible but competes with nearby message blocks for attention.";

  const goalCtaContext = goalProfile.expectedCtaPressure === "soft"
    ? "For this objective, CTA absence is acceptable when branding and emotional hook are strong."
    : goalProfile.expectedCtaPressure === "moderate"
      ? "For this objective, CTA should guide intent without over-pressuring the audience."
      : "For this objective, CTA clarity should be explicit and highly visible at decision moment.";

  const mobileRisk = extraction.text_density === "high" || extraction.readability === "low"
    ? "Elevated mobile attention risk: users may drop before understanding the core value proposition."
    : "Contained mobile attention risk: structure is readable enough for feed-speed scanning.";

  const retentionRisk = frictionPoints.length >= 2
    ? "Attention retention risk is significant because users lose directional flow before decision points."
    : frictionPoints.length === 1
      ? "Attention retention risk is moderate with one meaningful break in flow."
      : "Attention retention risk is limited; eye path stays mostly coherent through the CTA.";

  const scanStages = [
    headline
      ? `First glance (~0.3s): the eye lands on "${headline}" before processing anything else.`
      : `First glance (~0.3s): the eye lands on the ${firstFocus}, which sets initial meaning.` ,
    `Meaning pass (~1s): users test whether ${visualCue} and supporting copy tell the same story.`,
    cta
      ? `Decision pass (~2s): users evaluate "${cta}" only after they decide the message feels relevant and credible.`
      : "Decision pass (~2s): users look for an obvious next action after meaning is clear.",
  ];

  const attentionConflict = extraction.text_density === "high"
    ? "Human viewers split attention across too many elements, so the offer meaning arrives late."
    : extraction.readability === "low"
      ? "Human viewers notice the idea but slow down because readability creates friction before intent forms."
      : ctaPressure === "aggressive" && !headline
        ? "The action cue appears before enough context, so viewers may feel pushed before convinced."
        : "Visual hierarchy mostly matches how people naturally scan: hook, meaning, then action.";

  const viewingPsychology = ctaPressure === "aggressive"
    ? "People perceive this as a high-intent ask; if trust cues are thin, they may defer instead of clicking."
    : "People can absorb the core message first, which supports steadier trust-building before action.";

  return {
    first_focus: firstFocus,
    attention_path: `Users are likely to notice the ${firstFocus} first, then scan supporting content, and finally evaluate the CTA once value clarity is established.`,
    friction_points: frictionPoints,
    cta_visibility: ctaVisibility,
    mobile_attention_risk: mobileRisk,
    attention_retention_risk: retentionRisk,
    scan_stages: scanStages,
    attention_conflict: attentionConflict,
    viewing_psychology: `${viewingPsychology} ${goalCtaContext}`,
  };
}

function buildPsychologyAnalysis(
  extraction: ExtractionSignals,
  goal: CampaignGoal,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel
): PsychologyAnalysis {
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const goalStage = goalProfile.stage;
  const emotionalTrigger = extraction.emotional_cues[0] || "neutral";
  const corpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();

  const persuasionStyle = /discount|save|offer|% off/.test(corpus)
    ? "discount-driven transactional persuasion"
    : /premium|exclusive|crafted|signature/.test(corpus)
      ? "aspirational premium persuasion"
      : ctaPressure === "aggressive"
        ? "direct response persuasion"
        : "informational trust-led persuasion";

  let psychologicalConflict = "No major psychological conflict detected.";
  if (goalStage === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    psychologicalConflict = "Awareness intent conflicts with high-pressure action cues, which can feel premature for cold audiences.";
  } else if (goalStage === "consideration" && ctaPressure === "aggressive") {
    psychologicalConflict = "Consideration intent conflicts with high-pressure CTA cues, which can truncate evaluation and trust-building.";
  } else if (goalStage === "consideration" && ctaPressure === "soft") {
    psychologicalConflict = "Consideration intent is underpowered by a soft CTA, which can stall evaluation momentum before decision confidence forms.";
  } else if (goalStage === "conversion" && ctaPressure === "soft") {
    psychologicalConflict = "Conversion intent conflicts with a low-pressure CTA, reducing action momentum at decision stage.";
  }

  if (goal === "retargeting" && extraction.brand_presence === "low") {
    psychologicalConflict = "Retargeting intent is weakened because brand familiarity is too low for quick recognition.";
  }

  const trustSignalStrength = extraction.trust_markers.length >= 3 || extraction.brand_presence === "high"
    ? "Trust signal strength is solid: credibility cues support decision confidence."
    : extraction.trust_markers.length > 0
      ? "Trust signal strength is partial: some reassurance is present but not dominant."
      : "Trust signal strength is weak: audience reassurance cues are limited or missing.";

  const urgencyFit = goalStage === "awareness" && urgencyLevel === "high"
    ? "Urgency is misfit for awareness. Pressure is likely to feel sales-heavy too early."
    : goalStage === "consideration" && urgencyLevel === "high"
      ? "Urgency is too strong for consideration. Evaluation audiences may feel rushed before trust is established."
      : goalStage === "conversion" && urgencyLevel === "low"
      ? "Urgency is underpowered for conversion. Action momentum is likely too weak."
      : "Urgency pressure is broadly compatible with campaign stage.";

  const audienceResistance = extraction.readability === "low"
    ? "Audience may resist because effort-to-understand is high relative to perceived reward."
    : psychologicalConflict !== "No major psychological conflict detected."
      ? "Audience may resist due to stage-message mismatch and psychological timing friction."
      : "Audience resistance is more likely to come from competitive alternatives than message friction.";

  return {
    emotional_trigger: emotionalTrigger,
    persuasion_style: persuasionStyle,
    psychological_conflict: psychologicalConflict,
    trust_signal_strength: trustSignalStrength,
    urgency_fit: urgencyFit,
    audience_resistance: audienceResistance,
  };
}

function buildAudienceResponse(
  extraction: ExtractionSignals,
  psychology: PsychologyAnalysis,
  goal: CampaignGoal
): AudienceResponse {
  const goalStage = getGoalStage(goal);
  const likelyPerception = psychology.persuasion_style.includes("discount")
    ? "The creative is likely perceived as value-seeking and offer-led rather than brand-led."
    : psychology.persuasion_style.includes("premium")
      ? "The creative is likely perceived as premium-oriented if trust and polish remain consistent."
      : "The creative is likely perceived as informational, with moderate persuasive force.";

  const emotionalReaction = psychology.emotional_trigger === "neutral"
    ? "Emotional reaction is likely muted, producing limited memorability."
    : `Primary emotional reaction is likely ${psychology.emotional_trigger}, which shapes early attention and message acceptance.`;

  const motivationMatch = goalStage === "conversion" && extraction.cta
    ? "Motivation match depends on action clarity: users with intent can progress if friction remains low."
    : goalStage === "awareness"
      ? "Motivation match depends on curiosity and message relevance rather than immediate action pressure."
      : "Motivation match depends on trust and evidence depth during evaluation phase.";

  const resistanceReason = psychology.audience_resistance;

  const engagementBarrier = extraction.text_density === "high"
    ? "Dense information creates a scanning barrier before value is internalized."
    : extraction.readability === "low"
      ? "Low readability blocks fluent message uptake, especially in fast-scroll contexts."
      : "No dominant structural barrier detected, but persuasion depth may still limit engagement.";

  return {
    likely_perception: likelyPerception,
    emotional_reaction: emotionalReaction,
    motivation_match: motivationMatch,
    resistance_reason: resistanceReason,
    engagement_barrier: engagementBarrier,
  };
}

function buildCampaignAlignment(
  goal: CampaignGoal,
  selectedVertical: string,
  extraction: ExtractionSignals,
  psychology: PsychologyAnalysis,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
  verticalIntelligence: VerticalIntelligence
): CampaignAlignment {
  const conflicts: string[] = [];
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const goalStage = goalProfile.stage;
  const corpus = [extraction.headline, extraction.primary_message, extraction.cta, extraction.visual_elements.join(" ")].join(" ").toLowerCase();
  const hasAppSignals = /app|ui|screen|mobile|install|ios|android|feature/.test(corpus);
  const hasVideoSignals = /video|watch|reel|motion|frame|play/.test(corpus);

  if (goalProfile.expectedCtaPressure === "soft" && ctaPressure === "aggressive") {
    conflicts.push("CTA pressure is too aggressive for awareness-stage behavior.");
  }
  if (goalProfile.expectedCtaPressure === "moderate" && ctaPressure === "soft") {
    conflicts.push("CTA pressure is too soft for consideration-stage evaluation behavior.");
  }
  if (goalProfile.expectedCtaPressure === "moderate" && ctaPressure === "aggressive") {
    conflicts.push("CTA pressure is too aggressive for consideration-stage trust and comparison behavior.");
  }
  if (goalProfile.expectedCtaPressure === "aggressive" && ctaPressure === "soft") {
    conflicts.push("CTA pressure is too soft for conversion-stage action goals.");
  }
  if (goalProfile.urgencyTolerance === "low" && urgencyLevel === "high") {
    conflicts.push("Urgency cues are too strong for the selected campaign stage.");
  }
  if (goalStage === "consideration" && urgencyLevel === "high") {
    conflicts.push("Urgency cues are too strong for consideration-stage audiences still evaluating trust and fit.");
  }
  if (goalStage === "consideration" && extraction.trust_markers.length === 0) {
    conflicts.push("Consideration-stage creative lacks visible trust signals to support evaluation confidence.");
  }

  if (goal === "conversion" && !extraction.cta?.trim()) {
    conflicts.push("Conversion objective requires explicit action language, but CTA is missing.");
  }
  if (goal === "traffic" && (extraction.readability === "low" || extraction.hierarchy_observations.toLowerCase().includes("unclear"))) {
    conflicts.push("Traffic objective needs clearer hierarchy and readability to drive click intent.");
  }
  if (goal === "lead_generation") {
    if (extraction.trust_markers.length === 0) {
      conflicts.push("Lead objective lacks authority/trust markers needed to reduce form-submit anxiety.");
    }
    if (["finance", "education", "real_estate", "technology"].includes(selectedVertical) && extraction.readability === "low") {
      conflicts.push("Lead objective in trust-heavy vertical needs simpler, higher-credibility message delivery.");
    }
  }
  if (goal === "app_installs" && !hasAppSignals) {
    conflicts.push("App install objective lacks visible app/product UX signals for install confidence.");
  }
  if (goal === "engagement" && extraction.emotional_cues.length === 0) {
    conflicts.push("Engagement objective is underpowered without emotional or social interaction hooks.");
  }
  if (goal === "video_views" && !hasVideoSignals) {
    conflicts.push("Video views objective lacks hook/motion cues to sustain watch intent.");
  }
  if (goal === "retargeting" && extraction.brand_presence === "low") {
    conflicts.push("Retargeting objective needs faster familiarity signals, but brand recognition cues are weak.");
  }
  if (selectedVertical === "luxury" && /discount|save|offer|% off/.test([extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase())) {
    conflicts.push("Luxury positioning conflicts with discount-heavy message behavior.");
  }
  if (
    verticalIntelligence.productCategory.id !== "unknown" &&
    verticalIntelligence.productCategory.id !== selectedVertical &&
    verticalIntelligence.productCategory.fitScore < 50
  ) {
    conflicts.push(
      `Product category appears closer to ${verticalIntelligence.productCategory.label} than ${selectedVertical.replace(/_/g, " ")} context.`
    );
  }
  if (!verticalIntelligence.behaviorAlignedToGoal) {
    conflicts.push(verticalIntelligence.behaviorAlignmentReason);
  }
  if (extraction.readability === "low") {
    conflicts.push("Low readability weakens strategic message delivery for the intended audience.");
  }
  if (psychology.psychological_conflict !== "No major psychological conflict detected.") {
    conflicts.push(psychology.psychological_conflict);
  }

  const alignmentStatus: AlignmentStatus = conflicts.length === 0
    ? "aligned"
    : conflicts.length <= 2
      ? "partially_aligned"
      : "misaligned";

  const severity: Severity = conflicts.length === 0
    ? "low"
    : conflicts.length <= 2
      ? "medium"
      : "high";

  const strategicConflict = conflicts.length > 0
    ? conflicts.slice(0, 2).join(" ")
    : "No major strategic conflict detected between campaign intent and creative behavior.";

  const reasoning = conflicts.length > 0
    ? `Campaign alignment is weakened by ${conflicts.length} conflict signal(s). Primary evidence: ${conflicts.join(" ")}`
    : "Campaign goal, message pressure, and visual behavior are largely consistent with selected context.";

  return {
    alignment_status: alignmentStatus,
    strategic_conflict: strategicConflict,
    reasoning,
    severity,
  };
}

function buildPlatformAlignment(
  platform: PlatformContext,
  extraction: ExtractionSignals,
  goal: CampaignGoal,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
): PlatformAlignment {
  const profile = PLATFORM_BMI_PROFILE[platform];
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const goalStage = goalProfile.stage;
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.visual_elements.join(" "),
    extraction.audience_clues.join(" "),
  ].join(" ").toLowerCase();
  const hasVideoMotionSignals = /video|reel|watch|play|motion|frame/.test(corpus);
  const hasAppSignals = /app|ui|screen|install|ios|android|feature/.test(corpus);
  const hasAuthoritySignals = /expert|certified|trusted|proof|testimonial|case study|secure|verified/.test(corpus);
  const conflicts: string[] = [];
  const recommendations: string[] = [];

  if (platform === "google_ads") {
    if (extraction.readability === "low") {
      conflicts.push("Readability is too low for intent-driven Google display evaluation.");
      recommendations.push("Increase text contrast and simplify copy blocks for faster message decoding.");
    }
    if (!extraction.headline?.trim()) {
      conflicts.push("Google format lacks a clear headline hook for quick relevance matching.");
      recommendations.push("Add a concise benefit-led headline that states value in the first glance.");
    }
    if (goal !== "conversion" && urgencyLevel === "high") {
      conflicts.push("Urgency pressure is stronger than typical early-stage Google objective behavior.");
      recommendations.push("Reduce urgency language unless the objective is conversion-stage action.");
    }
    if (goal === "awareness" && extraction.brand_presence === "low") {
      conflicts.push("Awareness objective in Google display needs faster brand recognition than current creative provides.");
      recommendations.push("Increase brand-anchor visibility in first-scan zone to improve branding speed.");
    }
    if (goal === "traffic" && extraction.hierarchy_observations.toLowerCase().includes("unclear")) {
      conflicts.push("Traffic objective is weakened by unclear hierarchy that slows click-intent decoding.");
      recommendations.push("Strengthen value proposition structure so users discover relevance before CTA.");
    }
    if (goal === "conversion" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
      conflicts.push("Conversion objective in Google display is underpowered by weak or missing direct action cues.");
      recommendations.push("Use high-clarity action CTA with trust reinforcement near decision zone.");
    }
    if (goal === "lead_generation" && !hasAuthoritySignals) {
      conflicts.push("Lead-generation objective requires stronger authority and trust evidence for form intent.");
      recommendations.push("Add authority cues (credentials, proof points, security/trust markers) next to CTA.");
    }
    if (goal === "app_installs" && !hasAppSignals) {
      conflicts.push("App-install objective lacks product UI/feature visibility needed for install confidence.");
      recommendations.push("Show app interface or feature workflow to reduce install uncertainty.");
    }
    if (goal === "video_views" && !hasVideoMotionSignals) {
      conflicts.push("Video-views objective lacks motion/hook indicators needed for first-frame retention.");
      recommendations.push("Add stronger first-frame curiosity and dynamic visual cues.");
    }
    if (goal === "retargeting" && extraction.brand_presence === "low") {
      conflicts.push("Retargeting objective needs stronger familiarity signals for quick recognition in display inventory.");
      recommendations.push("Increase brand continuity and simplify recall cues for returning audiences.");
    }
  }

  if (platform === "meta_ads") {
    if (extraction.text_density === "high") {
      conflicts.push("High text density can underperform in mobile feed/story attention windows.");
      recommendations.push("Shorten copy and prioritize a thumb-stop visual with one dominant message.");
    }
    if (extraction.emotional_cues.length === 0 || extraction.emotional_cues[0] === "neutral") {
      conflicts.push("Meta placement lacks a clear emotional trigger for feed interruption behavior.");
      recommendations.push("Add a stronger emotional hook (aspiration, urgency, trust, curiosity) in visual/message framing.");
    }
    if (goal === "conversion" && ctaPressure === "soft") {
      conflicts.push("Conversion-stage Meta objective is underpowered by a soft CTA ask.");
      recommendations.push("Strengthen CTA pressure with clearer action language and decision clarity.");
    }
    if (goal === "awareness" && extraction.emotional_cues.length === 0) {
      conflicts.push("Awareness objective on Meta requires emotional interruption, but current hook profile is weak.");
      recommendations.push("Use stronger emotional contrast or relatable human cue in first-scroll frame.");
    }
    if (goal === "traffic" && extraction.readability === "low") {
      conflicts.push("Traffic objective on Meta needs faster clarity for click intent, but readability is low.");
      recommendations.push("Reduce copy friction and increase legibility for feed-speed decision making.");
    }
    if (goal === "lead_generation" && extraction.trust_markers.length === 0) {
      conflicts.push("Lead-generation objective on Meta lacks trust/credibility markers for low-friction conversion.");
      recommendations.push("Add proof and authority framing before ask to reduce social-feed skepticism.");
    }
    if (goal === "app_installs" && !hasAppSignals) {
      conflicts.push("App-install objective on Meta needs UI/feature visualization to increase install confidence.");
      recommendations.push("Show app utility quickly with product UI cues in first visual sequence.");
    }
    if (goal === "engagement" && extraction.emotional_cues.length === 0) {
      conflicts.push("Engagement objective on Meta is missing social-native emotional triggers.");
      recommendations.push("Introduce conversation-worthy or relatable cue to improve comment/share propensity.");
    }
    if (goal === "video_views" && !hasVideoMotionSignals) {
      conflicts.push("Video-views objective on Meta needs hook-first motion cues for retention, but signals are weak.");
      recommendations.push("Strengthen first-second visual hook and movement-led continuity.");
    }
    if (goal === "retargeting" && extraction.brand_presence === "low") {
      conflicts.push("Retargeting on Meta should trigger familiarity quickly, but brand recognition is weak.");
      recommendations.push("Use stronger brand continuity and direct reminder framing for warm audiences.");
    }
  }

  if (platform === "programmatic") {
    if (extraction.hierarchy_observations.toLowerCase().includes("unclear")) {
      conflicts.push("Hierarchy is unclear for mixed publisher inventory where scan time is limited.");
      recommendations.push("Rebuild hierarchy so headline, value, and CTA remain ordered across multiple sizes.");
    }
    if (extraction.readability === "low") {
      conflicts.push("Programmatic deployment risks weak readability across varied placements.");
      recommendations.push("Use stronger type contrast and spacing for resilient multi-site readability.");
    }
    if (goal === "awareness" && extraction.brand_presence === "low") {
      conflicts.push("Awareness objective is weakened by low brand presence in scalable display contexts.");
      recommendations.push("Increase brand anchor visibility to improve recall before action cues.");
    }
    if (goalStage === "consideration" && extraction.trust_markers.length === 0) {
      conflicts.push("Consideration objective in programmatic environments lacks trust signals needed for evaluation confidence.");
      recommendations.push("Add concise proof and reassurance cues resilient across varied publisher layouts.");
    }
    if (goal === "conversion" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
      conflicts.push("Conversion objective in programmatic inventory requires clearer action language than current creative provides.");
      recommendations.push("Increase CTA clarity and reduce decision friction for mixed-context placements.");
    }
  }

  const isAligned = conflicts.length === 0;
  const reasoning = isAligned
    ? `Creative behavior is aligned with ${profile.label} BMI style: ${profile.bmiStyle}`
    : `Detected ${conflicts.length} platform conflict signal(s) against ${profile.label} BMI standards.`;

  return {
    platform,
    platform_label: profile.label,
    bmi_style: profile.bmiStyle,
    expected_attention_behavior: profile.attentionBehavior,
    layout_expectation: profile.layoutExpectation,
    engagement_pattern: profile.engagementPattern,
    is_aligned: isAligned,
    reasoning,
    conflicts,
    recommendations: recommendations.length > 0 ? recommendations : ["Maintain current platform-fit structure and iterate with controlled A/B tests."],
  };
}

function buildGoogleDisplayIntelligence(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  extraction: ExtractionSignals;
  attention: AttentionAnalysis;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
  width: number;
  height: number;
}): GoogleDisplayIntelligence | null {
  const {
    platform,
    goal,
    extraction,
    attention,
    ctaPressure,
    urgencyLevel,
    width,
    height,
  } = params;

  if (platform !== "google_ads") return null;

  const size = `${width}x${height}`;
  const ratio = height > 0 ? width / height : 0;
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];

  const sizeTier: "tier1" | "tier2" | "non_core" = GOOGLE_TIER1_SIZES.has(size)
    ? "tier1"
    : GOOGLE_TIER2_SIZES.has(size)
      ? "tier2"
      : "non_core";

  const inventoryClass: "desktop_inventory" | "mobile_inventory" | "universal_inventory" | "premium_inventory" | "non_core_inventory" =
    size === "970x250" || size === "300x600"
      ? "premium_inventory"
      : size === "300x250"
        ? "universal_inventory"
        : size.startsWith("320x")
          ? "mobile_inventory"
          : (GOOGLE_TIER1_SIZES.has(size) || GOOGLE_TIER2_SIZES.has(size))
            ? "desktop_inventory"
            : "non_core_inventory";

  const likelyEnvironments = size.startsWith("320x")
    ? ["mobile_web", "in_app", "gmail_mobile"]
    : size === "970x250"
      ? ["premium_desktop_publishers", "high_viewability_sections"]
      : size === "300x250"
        ? ["article_inline", "sidebar", "in_content_blocks"]
        : ["desktop_publishers", "blog_content", "display_network_inventory"];

  const hierarchyIssues: string[] = [];
  if (extraction.hierarchy_observations.toLowerCase().includes("unclear")) {
    hierarchyIssues.push("Hierarchy is unclear; value proposition and CTA are not discovered quickly.");
  }
  if (extraction.text_density === "high") {
    hierarchyIssues.push("Text density is too high for fast Google display scan behavior.");
  }
  if (!extraction.headline?.trim()) {
    hierarchyIssues.push("Headline hook is weak, reducing immediate value recognition.");
  }

  const ctaMissing = !extraction.cta?.trim();
  const stage = goalProfile.stage;
  const ctaWeakForGoal = (stage === "conversion" && ctaMissing) || (goal === "conversion" && ctaPressure === "soft");
  const ctaStatus: "strong" | "moderate" | "weak" = ctaWeakForGoal
    ? "weak"
    : ctaPressure === "aggressive"
      ? "strong"
      : "moderate";

  const mobileCroppingIssues: string[] = [];
  if (ratio > 3.5 || ratio < 0.5) {
    mobileCroppingIssues.push("Extreme aspect ratio may crop key elements in responsive placements.");
  }
  if (extraction.text_density === "high") {
    mobileCroppingIssues.push("Dense text raises text cutoff risk on narrow placements.");
  }
  if (extraction.brand_presence === "low") {
    mobileCroppingIssues.push("Low brand anchor increases logo cutoff and delayed recognition risk.");
  }

  const responsiveRisks: string[] = [];
  if (!extraction.headline?.trim()) responsiveRisks.push("Headline signal may not survive dynamic responsive recomposition.");
  if (extraction.hierarchy_observations.toLowerCase().includes("unclear")) responsiveRisks.push("Responsive resize may worsen already weak hierarchy.");
  if (extraction.readability === "low") responsiveRisks.push("Small-slot rendering risk: low readability in compressed placements.");

  const blindnessHigh = extraction.emotional_cues.length === 0 && extraction.brand_presence !== "high" && extraction.text_density !== "low";
  const blindnessRisk: "low" | "medium" | "high" = blindnessHigh
    ? "high"
    : extraction.text_density === "high" || extraction.readability === "low"
      ? "medium"
      : "low";

  const textDensityClass: "optimal" | "slightly_overloaded" | "text_heavy" | "unreadable" =
    extraction.readability === "low"
      ? "unreadable"
      : extraction.text_density === "high"
        ? "text_heavy"
        : extraction.text_density === "moderate"
          ? "slightly_overloaded"
          : "optimal";

  const attentionPower = attention.friction_points.length >= 2
    ? "low interruption power"
    : attention.friction_points.length === 1
      ? "moderate interruption power"
      : "strong interruption power";

  const brandingSpeed: "fast" | "moderate" | "slow" = extraction.brand_presence === "high"
    ? "fast"
    : extraction.brand_presence === "moderate"
      ? "moderate"
      : "slow";

  const auctionImpact = attention.friction_points.length >= 2 || ctaWeakForGoal
    ? "Auction readiness at risk: weak hierarchy/CTA fit can suppress qualified CTR and reduce delivery efficiency."
    : sizeTier === "tier1"
      ? "Strong auction readiness baseline: core inventory size + objective-aligned messaging supports CTR competitiveness."
      : "Moderate auction readiness: improve hierarchy and responsive safety to stabilize performance across inventory.";

  return {
    campaign_goal: goal,
    objective_priorities: goalProfile.aiPriorities,
    ecosystem_focus: ["responsive_display_ads", "uploaded_banner_ads"],
    inventory_profile: {
      size,
      size_tier: sizeTier,
      inventory_class: inventoryClass,
      likely_environments: likelyEnvironments,
    },
    viewability_analysis: {
      likely_visible_area: inventoryClass === "premium_inventory"
        ? "High visible area probability in premium desktop placements."
        : inventoryClass === "mobile_inventory"
          ? "Viewability is sensitive to scroll speed and sticky/mobile slot behavior."
          : "Moderate visible area expected in standard display placements.",
      fold_visibility: size === "970x250" || size === "728x90"
        ? "Above-fold potential is strong on desktop homepage and article templates."
        : "Fold position depends on publisher layout and inline injection depth.",
      clutter_risk: extraction.text_density === "high"
        ? "High clutter risk: users may skip before value proposition is decoded."
        : "Controlled clutter profile for display scan behavior.",
      attention_survival: attention.attention_retention_risk,
    },
    visual_hierarchy_analysis: {
      expected_order: ["Main object", "Value proposition", "CTA", "Branding"],
      status: hierarchyIssues.length >= 2 ? "weak" : hierarchyIssues.length === 1 ? "mixed" : "strong",
      issues: hierarchyIssues,
    },
    cta_strength_analysis: {
      status: ctaStatus,
      visibility: attention.cta_visibility,
      clarity: ctaMissing ? "CTA missing or non-distinct in extracted text." : "CTA phrase detected and evaluable.",
      urgency_fit: stage === "awareness" && urgencyLevel === "high"
        ? "Urgency is too strong for awareness objective in display context."
        : stage === "conversion" && urgencyLevel === "low"
          ? "Urgency is underpowered for conversion objective."
          : "Urgency and objective are broadly aligned.",
    },
    mobile_cropping_risk: {
      risk_level: mobileCroppingIssues.length >= 2 ? "high" : mobileCroppingIssues.length === 1 ? "medium" : "low",
      issues: mobileCroppingIssues,
    },
    responsive_safety_analysis: {
      status: responsiveRisks.length >= 2 ? "risky" : responsiveRisks.length === 1 ? "watch" : "safe",
      risks: responsiveRisks,
    },
    banner_blindness_detection: {
      risk_level: blindnessRisk,
      reason: blindnessRisk === "high"
        ? "Creative resembles low-engagement display patterns and may suffer banner blindness."
        : blindnessRisk === "medium"
          ? "Some display-blindness signals detected; differentiation and contrast should be strengthened."
          : "Low banner-blindness risk based on current attention and contrast signals.",
    },
    display_attention_analysis: {
      focal_intensity: extraction.emotional_cues.length > 0 ? "focused" : "neutral",
      contrast_energy: extraction.readability === "low" ? "low" : "moderate_to_high",
      interruption_power: attentionPower,
    },
    branding_speed_analysis: {
      recognition_speed: brandingSpeed,
      brand_recall_probability: brandingSpeed === "fast"
        ? "High"
        : brandingSpeed === "moderate"
          ? "Moderate"
          : "Low",
    },
    text_density_analysis: {
      classification: textDensityClass,
      impact: textDensityClass === "optimal"
        ? "Text density is display-friendly for rapid recognition."
        : textDensityClass === "slightly_overloaded"
          ? "Slight copy compression may reduce scan speed on smaller placements."
          : textDensityClass === "text_heavy"
            ? "High text load likely suppresses CTR in fast-scan inventory."
            : "Unreadable text profile can significantly weaken viewability-to-click conversion.",
    },
    auction_readiness_impact: auctionImpact,
  };
}

function buildMetaFeedIntelligence(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  extraction: ExtractionSignals;
  attention: AttentionAnalysis;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
  width: number;
  height: number;
}): MetaFeedIntelligence | null {
  const {
    platform,
    goal,
    extraction,
    attention,
    ctaPressure,
    urgencyLevel,
    width,
    height,
  } = params;

  if (platform !== "meta_ads") return null;

  const size = `${width}x${height}`;
  const ratio = height > 0 ? width / height : 0;
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const stage = goalProfile.stage;

  const tier: "tier1" | "tier2" | "non_core" = META_TIER1_SIZES.has(size)
    ? "tier1"
    : META_TIER2_SIZES.has(size)
      ? "tier2"
      : "non_core";

  const dominantPlacement: "feed" | "story" | "reels" | "carousel" | "mixed" =
    size === "1080x1920"
      ? (goal === "video_views" ? "reels" : "story")
      : size === "1080x1080"
        ? "carousel"
        : size === "1080x1350" || size === "1200x628"
          ? "feed"
          : "mixed";

  const hierarchyIssues: string[] = [];
  if (extraction.hierarchy_observations.toLowerCase().includes("unclear")) {
    hierarchyIssues.push("Thumb-stop visual is not clearly prioritized before message and CTA.");
  }
  if (extraction.text_density === "high") {
    hierarchyIssues.push("Text-heavy frame reduces fast feed comprehension.");
  }

  const hookWeak = extraction.emotional_cues.length === 0 && extraction.brand_presence !== "high";
  const thumbStopStrength: "strong" | "moderate" | "weak" = hookWeak
    ? "weak"
    : extraction.emotional_cues.length > 0 && attention.friction_points.length === 0
      ? "strong"
      : "moderate";

  const croppingIssues: string[] = [];
  if (!(ratio >= 0.55 && ratio <= 1.05)) {
    croppingIssues.push("Non-native Meta ratio increases dynamic crop risk across placements.");
  }
  if (extraction.text_density === "high") {
    croppingIssues.push("High text density risks truncation on mobile feed and reels overlays.");
  }
  if (extraction.brand_presence === "low") {
    croppingIssues.push("Low brand anchoring increases logo cutoff/familiarity risk.");
  }

  const safeOverlay = dominantPlacement === "reels" || dominantPlacement === "story"
    ? ["top_ui", "bottom_cta", "caption_overlay"]
    : ["feed_caption", "cta_button", "profile_line"];

  const socialNativeStatus: "authentic" | "mixed" | "banner_like" =
    extraction.emotional_cues.length > 0 && extraction.text_density !== "high"
      ? "authentic"
      : extraction.readability === "low" || extraction.text_density === "high"
        ? "banner_like"
        : "mixed";

  const immersionStatus: "immersive" | "partial" | "weak" =
    dominantPlacement === "reels" && extraction.readability !== "low"
      ? "immersive"
      : dominantPlacement === "reels" || dominantPlacement === "story"
        ? "partial"
        : "weak";

  const ctaWeak = (stage === "conversion" && !extraction.cta?.trim()) || (stage === "conversion" && ctaPressure === "soft");
  const ctaStatus: "strong" | "moderate" | "weak" = ctaWeak
    ? "weak"
    : ctaPressure === "aggressive"
      ? "strong"
      : "moderate";

  const textClass: "clean" | "balanced" | "slightly_overloaded" | "cluttered" =
    extraction.readability === "low"
      ? "cluttered"
      : extraction.text_density === "high"
        ? "slightly_overloaded"
        : extraction.text_density === "moderate"
          ? "balanced"
          : "clean";

  const fatigueRisk: "low" | "medium" | "high" =
    socialNativeStatus === "banner_like"
      ? "high"
      : extraction.text_density === "high" || extraction.emotional_cues.length === 0
        ? "medium"
        : "low";

  const triggers = extraction.emotional_cues.length > 0
    ? extraction.emotional_cues.slice(0, 4)
    : ["neutral"]; 

  return {
    campaign_goal: goal,
    objective_priorities: goalProfile.aiPriorities,
    ecosystem_focus: ["feed_ads", "story_ads", "reels_ads", "carousel_ads"],
    placement_profile: {
      size,
      tier,
      dominant_placement: dominantPlacement,
    },
    thumb_stop_analysis: {
      predicted_strength: thumbStopStrength,
      reason: thumbStopStrength === "strong"
        ? "Creative has emotional/visual interruption traits that can pause scrolling."
        : thumbStopStrength === "moderate"
          ? "Creative has partial interruption signals but may blend in crowded feeds."
          : "Creative lacks strong interruption cues for high-speed feed environments.",
      first_second_engagement_probability: thumbStopStrength === "strong" ? "High" : thumbStopStrength === "moderate" ? "Moderate" : "Low",
    },
    hook_strength_analysis: {
      status: thumbStopStrength,
      emotional_trigger: triggers[0] || "neutral",
      curiosity_gap: extraction.headline?.trim()
        ? "Headline present; hook quality depends on emotional tension and novelty."
        : "No clear hook headline detected, reducing first-impression pull.",
    },
    mobile_cropping_analysis: {
      risk_level: croppingIssues.length >= 2 ? "high" : croppingIssues.length === 1 ? "medium" : "low",
      issues: croppingIssues,
    },
    safe_zone_analysis: {
      status: croppingIssues.length >= 2 ? "risky" : croppingIssues.length === 1 ? "watch" : "safe",
      overlays: safeOverlay,
      guidance: "Keep branding, hook text, and CTA within center-safe zones to avoid Meta UI collisions.",
    },
    visual_hierarchy_analysis: {
      expected_order: ["Thumb-stop visual", "Main message", "Emotional cue", "CTA", "Branding"],
      status: hierarchyIssues.length >= 2 ? "weak" : hierarchyIssues.length === 1 ? "mixed" : "strong",
      issues: hierarchyIssues,
    },
    social_native_feel_analysis: {
      status: socialNativeStatus,
      reason: socialNativeStatus === "authentic"
        ? "Creative feels feed-native and emotionally readable in mobile contexts."
        : socialNativeStatus === "banner_like"
          ? "Creative resembles display-style banners and may underperform in social-native feeds."
          : "Creative has mixed social-native signals; authenticity can be improved.",
    },
    reels_story_immersion_analysis: {
      status: immersionStatus,
      fullscreen_utilization: dominantPlacement === "reels" || dominantPlacement === "story"
        ? "Vertical format supports immersive occupancy when edge-safe design is maintained."
        : "Non-vertical format limits immersive full-screen behavior for reels/story contexts.",
      edge_safety: croppingIssues.length > 0 ? "Edge safety requires improvement." : "Edge safety appears controlled.",
    },
    cta_visibility_analysis: {
      status: ctaStatus,
      tap_likelihood: ctaStatus === "strong" ? "High" : ctaStatus === "moderate" ? "Moderate" : "Low",
      conflict_note: ctaStatus === "weak"
        ? "CTA competes with headline/visual context or is too soft for action objective."
        : "CTA visibility is generally compatible with feed-speed decision behavior.",
    },
    text_density_analysis: {
      classification: textClass,
      impact: textClass === "clean"
        ? "Text load supports fast mobile comprehension."
        : textClass === "balanced"
          ? "Text is acceptable but can be tightened for better scroll retention."
          : textClass === "slightly_overloaded"
            ? "Text density may reduce thumb-stop conversion into deeper engagement."
            : "Cluttered text profile likely harms feed readability and retention.",
    },
    creative_fatigue_analysis: {
      risk_level: fatigueRisk,
      reason: fatigueRisk === "high"
        ? "Creative resembles repetitive ad patterns and may suffer feed fatigue/ad blindness."
        : fatigueRisk === "medium"
          ? "Some repetitive or low-novelty traits may reduce sustained engagement over frequency."
          : "Creative has enough novelty/emotional signal to resist immediate fatigue patterns.",
    },
    emotional_trigger_analysis: {
      detected_triggers: triggers,
      goal_fit: stage === "awareness" && triggers.includes("neutral")
        ? "Awareness objective needs stronger emotional interruption for discovery-mode users."
        : stage === "conversion" && (triggers.includes("trust") || triggers.includes("urgency"))
          ? "Emotional trigger aligns with conversion-stage action psychology."
          : "Trigger-goal fit is partial; refine emotional framing to objective priorities.",
    },
    platform_behavior_fit: urgencyLevel === "high" && stage === "awareness"
      ? "Meta discovery-mode behavior conflicts with heavy urgency at awareness stage."
      : "Creative is generally aligned to Meta's fast-scroll, emotional, mobile-first behavior model.",
  };
}

function buildBusinessImpact(alignment: CampaignAlignment, attention: AttentionAnalysis): BusinessImpact {
  const likelyEffects: string[] = [];
  const metrics = new Set<string>();

  if (alignment.alignment_status !== "aligned") {
    likelyEffects.push("Message-market mismatch can lower qualified engagement and reduce downstream conversion efficiency.");
    metrics.add("CTR quality");
    metrics.add("Landing page conversion rate");
  }
  if (attention.friction_points.length > 0) {
    likelyEffects.push("Attention drop before CTA can reduce click-through consistency across placements.");
    metrics.add("Scroll stop rate");
    metrics.add("CTA interaction rate");
  }
  if (alignment.severity === "high") {
    likelyEffects.push("Strategic conflict can increase wasted spend by attracting low-intent traffic.");
    metrics.add("CPA");
    metrics.add("ROAS stability");
  }

  return {
    likely_effects: likelyEffects.length > 0 ? likelyEffects : ["No major negative business consequence detected from current signal set."],
    affected_metrics: Array.from(metrics),
    funnel_risk: alignment.alignment_status === "misaligned"
      ? "High funnel risk: creative behavior is out of sync with campaign-stage intent."
      : alignment.alignment_status === "partially_aligned"
        ? "Moderate funnel risk: partial mismatch may reduce stage progression consistency."
        : "Low funnel risk: creative-stage behavior is mostly coherent.",
    engagement_risk: attention.friction_points.length >= 2
      ? "Elevated engagement risk: multiple attention breaks can suppress qualified interactions."
      : attention.friction_points.length === 1
        ? "Moderate engagement risk: one key friction point may reduce response quality."
        : "Contained engagement risk based on current attention-path evidence.",
    conversion_risk: alignment.alignment_status === "misaligned"
      ? "Conversion risk is substantial due to strategic and message-pressure conflicts."
      : "Conversion risk is present but manageable if top friction points are corrected.",
    brand_perception_risk: alignment.strategic_conflict.toLowerCase().includes("luxury")
      ? "Brand perception risk is elevated because offer language can dilute premium positioning."
      : "Brand perception risk is moderate and tied to consistency of trust and message clarity.",
  };
}

function buildStrategicRecommendations(params: {
  alignment: CampaignAlignment;
  attention: AttentionAnalysis;
  psychology: PsychologyAnalysis;
  extraction: ExtractionSignals;
  behavioralResponse: BehavioralResponse;
}): StrategicRecommendation[] {
  const { alignment, attention, psychology, extraction, behavioralResponse } = params;
  const recommendations: StrategicRecommendation[] = [];

  if (alignment.alignment_status !== "aligned") {
    recommendations.push({
      issue: "Campaign-to-creative strategic mismatch",
      why_it_hurts: `Detected mismatch: ${alignment.strategic_conflict} Evidence from audience modeling indicates ${behavioralResponse.likely_objection.toLowerCase()}.`,
      recommended_change: `Recommendation: Review campaign-goal and vertical alignment before launch, then adjust CTA pressure, urgency cues, and message framing so audiences can reach ${behavioralResponse.commitment_readiness.toLowerCase()} before a direct ask.`,
      expected_outcome: `Expected impact based on behavioral evidence: ${behavioralResponse.confidence_building} This should improve stage-fit consistency and reduce resistance.`,
      audience_reaction: behavioralResponse.emotional_state,
      emotional_barrier: behavioralResponse.risk_aversion,
      missing_belief: behavioralResponse.trust_gap,
      trust_signal_gap: behavioralResponse.trust_gap,
      behavior_change_after_intervention: behavioralResponse.likely_behavior,
      priority: "HIGH",
    });
  }

  if (attention.friction_points.length > 0) {
    recommendations.push({
      issue: "Attention flow breaks before CTA",
      why_it_hurts: `Observed attention friction: ${attention.friction_points.join(" ")} This increases the likelihood of ${behavioralResponse.resistance_trigger.toLowerCase()}.`,
      recommended_change: "Recommendation: Consider simplifying competing copy, tightening hierarchy, and isolating one value claim near the CTA so viewers can evaluate the message with less cognitive load.",
      expected_outcome: "Research-backed expectation: cleaner visual hierarchy generally improves scan continuity, helping users move from perception to evaluation with fewer drop-offs.",
      audience_reaction: behavioralResponse.emotional_state,
      emotional_barrier: behavioralResponse.risk_aversion,
      missing_belief: "The audience does not yet believe the message is worth the cognitive effort.",
      trust_signal_gap: behavioralResponse.trust_gap,
      behavior_change_after_intervention: "The audience is more likely to keep scanning, reach the core claim, and evaluate the CTA with less friction.",
      priority: "HIGH",
    });
  }

  if (extraction.readability === "low") {
    recommendations.push({
      issue: "Low readability undercuts persuasion",
      why_it_hurts: `Readability is currently constraining message uptake. Audience evidence suggests ${behavioralResponse.likely_objection.toLowerCase()}.`,
      recommended_change: "Recommendation: Consider increasing text contrast, shortening copy blocks, and prioritizing one dominant claim per frame before scaling spend.",
      expected_outcome: "Expected impact from readability improvements: faster comprehension, lower cognitive fatigue, and stronger confidence before action.",
      audience_reaction: behavioralResponse.emotional_state,
      emotional_barrier: "Cognitive effort is becoming the emotional barrier.",
      missing_belief: "The audience does not yet believe the message is easy enough to process quickly.",
      trust_signal_gap: behavioralResponse.trust_gap,
      behavior_change_after_intervention: "The audience is more likely to read the message, retain the value proposition, and continue toward the next action.",
      priority: "MEDIUM",
    });
  }

  if (psychology.trust_signal_strength.toLowerCase().includes("weak")) {
    recommendations.push({
      issue: "Insufficient trust reinforcement",
      why_it_hurts: `Trust signals appear weak for this category and stage. Behavioral evidence points to ${behavioralResponse.trust_gap.toLowerCase()}.`,
      recommended_change: "Recommendation: Review trust gaps and add proof elements (credentials, social proof, or reliability markers) near the CTA to support decision confidence.",
      expected_outcome: "Expected impact from trust reinforcement: stronger perceived credibility and improved transition from evaluation to action.",
      audience_reaction: behavioralResponse.emotional_state,
      emotional_barrier: behavioralResponse.risk_aversion,
      missing_belief: "The audience still needs a stronger belief that the message is credible and safe to trust.",
      trust_signal_gap: behavioralResponse.trust_gap,
      behavior_change_after_intervention: behavioralResponse.confidence_building,
      priority: "MEDIUM",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      issue: "No critical structural issue detected",
      why_it_hurts: `No high-severity mismatch is detected, but there is still optimization potential around ${behavioralResponse.commitment_pressure.toLowerCase()}.`,
      recommended_change: "Recommendation: Consider controlled A/B tests on headline framing, proof placement, and CTA microcopy to validate lift before broad rollout.",
      expected_outcome: "Expected impact: incremental lift with more stable audience progression from curiosity to intent.",
      audience_reaction: behavioralResponse.emotional_state,
      emotional_barrier: behavioralResponse.risk_aversion,
      missing_belief: behavioralResponse.trust_gap,
      trust_signal_gap: behavioralResponse.trust_gap,
      behavior_change_after_intervention: behavioralResponse.likely_behavior,
      priority: "LOW",
    });
  }

  return recommendations.slice(0, 5);
}

function scoreBehavioralReadiness(commitmentReadiness: string): number {
  const value = commitmentReadiness.toLowerCase();
  if (value.includes("high")) return 90;
  if (value.includes("moderate")) return 70;
  if (value.includes("low")) return 44;
  return 60;
}

function scoreLevel(level: SignalLevel, positive = true): number {
  if (positive) {
    return level === "high" ? 90 : level === "moderate" ? 70 : 45;
  }
  return level === "high" ? 45 : level === "moderate" ? 70 : 90;
}

function scoreCtaPressureFit(goal: CampaignGoal, ctaPressure: CtaPressure): number {
  const expected = GOAL_INTELLIGENCE_PROFILE[goal].expectedCtaPressure;
  if (expected === ctaPressure) return 92;
  if ((expected === "moderate" && ctaPressure !== "moderate") || (expected !== "moderate" && ctaPressure === "moderate")) return 68;
  return 42;
}

function scoreEmotionalAlignment(goal: CampaignGoal, emotionalCues: string[]): number {
  const desired = GOAL_INTELLIGENCE_PROFILE[goal].preferredEmotions.map((e) => e.toLowerCase());
  const normalized = emotionalCues.map((e) => e.toLowerCase());
  const matches = desired.filter((item) => normalized.some((cue) => cue.includes(item))).length;
  if (matches >= 2) return 88;
  if (matches === 1) return 70;
  return 52;
}

function buildStrategicScore(params: {
  extraction: ExtractionSignals;
  goal: CampaignGoal;
  ctaPressure: CtaPressure;
  attention: AttentionAnalysis;
  alignment: CampaignAlignment;
  behavioralResponse: BehavioralResponse;
  goalAligned: boolean;
  verticalAligned: boolean;
  textAvailable: boolean;
}): StrategicScore {
  const {
    extraction,
    goal,
    ctaPressure,
    attention,
    alignment,
    behavioralResponse,
    goalAligned,
    verticalAligned,
    textAvailable,
  } = params;

  const visualClarity = Math.round((scoreLevel(extraction.brand_presence, true) + scoreLevel(extraction.text_density, false)) / 2);
  const ctaPressureFit = textAvailable ? scoreCtaPressureFit(goal, ctaPressure) : 0;
  const readability = textAvailable ? scoreLevel(extraction.readability, true) : 0;
  const emotionalAlignment = textAvailable ? scoreEmotionalAlignment(goal, extraction.emotional_cues) : 0;
  const audienceFit = alignment.alignment_status === "aligned" ? 90 : alignment.alignment_status === "partially_aligned" ? 68 : 42;
  const attentionRetention = attention.friction_points.length === 0 ? 88 : attention.friction_points.length === 1 ? 68 : 45;
  const hierarchyQuality = extraction.hierarchy_observations.toLowerCase().includes("strong") ? 88 : extraction.hierarchy_observations ? 68 : 55;
  const behavioralReadiness = scoreBehavioralReadiness(behavioralResponse.commitment_readiness);
  const alignmentTier = goalAligned && verticalAligned
    ? 3
    : goalAligned || verticalAligned
      ? 2
      : 1;

  const score = Math.round(
    visualClarity * 0.13 +
      ctaPressureFit * 0.12 +
      readability * 0.10 +
      emotionalAlignment * 0.10 +
      audienceFit * 0.10 +
      attentionRetention * 0.10 +
      hierarchyQuality * 0.07 +
      behavioralReadiness * 0.13 +
      (alignmentTier === 3 ? 100 : alignmentTier === 2 ? 60 : 20) * 0.15
  );

  // Alignment-first normalization so numeric scores always respect campaign fit priority.
  // Tier 3: both goal + vertical aligned, Tier 2: one aligned, Tier 1: none aligned.
  const boundedScore = Math.max(0, Math.min(100, score));
  const normalized = boundedScore / 100;
  const bandedScore = alignmentTier === 3
    ? Math.round(70 + normalized * 30)
    : alignmentTier === 2
      ? Math.round(45 + normalized * 24)
      : Math.round(20 + normalized * 24);

  const alignmentBand = alignmentTier === 3
    ? "Tier 3 (goal + vertical aligned, score band 70-100)"
    : alignmentTier === 2
      ? "Tier 2 (partial alignment, score band 45-69)"
      : "Tier 1 (misaligned, score band 20-44)";

  const rationale = textAvailable
    ? `Strategic Alignment Score uses ${alignmentBand}. Within this band, score is driven by visual clarity (${visualClarity}), CTA pressure fit (${ctaPressureFit}), readability (${readability}), emotional alignment (${emotionalAlignment}), audience fit (${audienceFit}), attention retention (${attentionRetention}), hierarchy quality (${hierarchyQuality}), and behavioral readiness (${behavioralReadiness}).`
    : `Strategic Alignment Score uses ${alignmentBand}. Text-dependent subscores are set to 0 because OCR extraction was unavailable; remaining inputs are visual clarity (${visualClarity}), audience fit (${audienceFit}), attention retention (${attentionRetention}), hierarchy quality (${hierarchyQuality}), and behavioral readiness (${behavioralReadiness}).`;

  return {
    value: Math.max(0, Math.min(100, bandedScore)),
    rationale,
  };
}

function buildCreativeTopicSummary(
  extraction: ExtractionSignals,
  productCategory: ProductCategoryDetection,
  goal: CampaignGoal
): string {
  const headline = extraction.headline?.trim();
  const cta = extraction.cta?.trim();
  const primary = extraction.primary_message?.trim();
  const categoryName = productCategory?.label || null;

  if (headline && productCategory.id !== "unknown" && categoryName) {
    return `This creative presents ${categoryName.toLowerCase()} cues${primary ? ` — "${primary}"` : ""}. Headline: "${headline}".${cta ? ` CTA: "${cta}".` : ""}`;
  }

  if (headline && cta) {
    return `This creative features "${headline}" as the primary headline, with "${cta}" as the call-to-action.${primary ? ` Core message: ${primary}.` : ""}`;
  }

  if (headline) {
    return `Creative headline: "${headline}".${primary ? ` Core message: ${primary}.` : ""} Campaign intent: ${goal}.`;
  }

  if (primary) {
    return `Core message: "${primary}". Campaign intent: ${goal}.`;
  }

  return "No clear content signal extracted from this creative.";
}

function buildFinalDecisionIntelligence(params: {
  alignment: CampaignAlignment;
  audienceResponse: AudienceResponse;
  businessImpact: BusinessImpact;
  recommendations: StrategicRecommendation[];
  strategicScore: StrategicScore;
  behavioralResponse: BehavioralResponse;
}): FinalDecisionIntelligence {
  const { alignment, audienceResponse, businessImpact, recommendations, strategicScore, behavioralResponse } = params;

  const mainProblem = alignment.alignment_status === "aligned"
    ? "No major strategic conflict; optimization opportunity is primarily incremental."
    : alignment.strategic_conflict;

  const topRecommendation = recommendations[0]?.recommended_change || "Run iterative headline and CTA refinement tests.";

  const expectedImprovement = strategicScore.value < 55
    ? "Correcting high-priority issues should stabilize message-market fit and reduce wasted spend from low-intent responses."
    : strategicScore.value < 75
      ? "Addressing medium-priority friction points should improve response quality and increase qualified engagement consistency."
      : "Focused iterative optimization should deliver incremental lift while preserving current strategic strengths.";

  return {
    main_strategic_problem: mainProblem,
    why_audience_may_resist: behavioralResponse.likely_objection || audienceResponse.resistance_reason,
    business_consequence: businessImpact.likely_effects[0] || "No significant downside detected from current evidence.",
    what_should_change_now: topRecommendation,
    expected_improvement: expectedImprovement,
    decision_summary: `Current strategic alignment score is ${strategicScore.value}/100. The audience appears ${behavioralResponse.commitment_readiness.toLowerCase()} and the priority should be ${recommendations[0]?.priority || "LOW"}, with intervention focused on the behavioral barrier before scaling spend.`,
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are an advertising signal extraction engine.

Extract observations only.
Do not generate final scores.
Do not generate confidence percentages.
Do not generate forecasts.
Do not generate final recommendations.
Do not generate grades.

Return only valid JSON with this schema:
{
  "headline": "",
  "cta": "",
  "primary_message": "",
  "visual_elements": [""],
  "dominant_colors": [""],
  "text_density": "low|moderate|high",
  "layout_structure": "",
  "brand_presence": "low|moderate|high",
  "emotional_cues": [""],
  "readability": "low|moderate|high",
  "hierarchy_observations": "",
  "trust_markers": [""],
  "urgency_signals": [""],
  "audience_clues": [""]
}`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const openai = createOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "Server misconfiguration: OPENAI_API_KEY is missing." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const goal = normalizeGoal((formData.get("goal") as string) || "awareness");
    const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
    const vertical = normalizeVertical((formData.get("vertical") as string) || "technology");
    const platform = normalizePlatform((formData.get("platform") as string) || "programmatic");
    const platformProfile = PLATFORM_BMI_PROFILE[platform];

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Upload an image." }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Max 20MB." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const normalized = await normalizeImageForVision(inputBuffer);

    const extractionUserPrompt = `Extract structured advertising signals from this creative.

Campaign goal: ${goal}
Goal stage: ${goalProfile.stage}
Creative behavior target: ${goalProfile.creativeBehavior.join("; ")}
AI optimization priorities: ${goalProfile.aiPriorities.join("; ")}
Campaign vertical: ${vertical}
Platform context: ${platformProfile.label}
Platform BMI style: ${platformProfile.bmiStyle}
Expected attention behavior: ${platformProfile.attentionBehavior}
Layout expectation: ${platformProfile.layoutExpectation}
Engagement pattern: ${platformProfile.engagementPattern}
Platform standards: ${platformProfile.standards.join("; ")}

  ${PRODUCT_CATEGORY_GROUNDING_RULES}

Return JSON only.`;

    const extractionResult = await extractSignalsWithRetry({
      openai,
      mimeType: normalized.mimeType,
      base64: normalized.base64,
      extractionUserPrompt,
    });

    const extraction = normalizeExtraction(extractionResult.parsed);
    const ocrMeta = extractionResult.meta;
    const ctaPressure = classifyCtaPressure(extraction.cta);
    const urgencyLevel = inferUrgencyLevel(extraction);
    const verticalIntelligence = buildVerticalIntelligence(vertical, extraction, goal, ctaPressure, urgencyLevel);

    const detectedGoal = inferDetectedGoalFromSignals(
      extraction,
      ctaPressure,
      urgencyLevel,
      verticalIntelligence.advertisingBehavior.label,
    );
    const goalAligned = detectedGoal === goalProfile.stage;
    const verticalAligned = verticalIntelligence.productCategory.id === vertical;

    const attentionAnalysis = buildAttentionAnalysis(extraction, goal, ctaPressure);
    const platformAlignment = buildPlatformAlignment(platform, extraction, goal, ctaPressure, urgencyLevel);
    const psychologyAnalysis = buildPsychologyAnalysis(extraction, goal, ctaPressure, urgencyLevel);
    const googleDisplayIntelligence = buildGoogleDisplayIntelligence({
      platform,
      goal,
      extraction,
      attention: attentionAnalysis,
      ctaPressure,
      urgencyLevel,
      width: normalized.width,
      height: normalized.height,
    });
    const metaFeedIntelligence = buildMetaFeedIntelligence({
      platform,
      goal,
      extraction,
      attention: attentionAnalysis,
      ctaPressure,
      urgencyLevel,
      width: normalized.width,
      height: normalized.height,
    });
    const audienceResponse = buildAudienceResponse(extraction, psychologyAnalysis, goal);
    const campaignAlignment = buildCampaignAlignment(
      goal,
      vertical,
      extraction,
      psychologyAnalysis,
      ctaPressure,
      urgencyLevel,
      verticalIntelligence,
    );
    const behavioralResponse = buildBehavioralResponse({
      goal,
      vertical,
      ctaPressure,
      urgencyLevel,
      extraction,
      psychology: psychologyAnalysis,
      audienceResponse,
      attention: attentionAnalysis,
      alignment: campaignAlignment,
    });
    const businessImpact = buildBusinessImpact(campaignAlignment, attentionAnalysis);
    const strategicRecommendations = buildStrategicRecommendations({
      alignment: campaignAlignment,
      attention: attentionAnalysis,
      psychology: psychologyAnalysis,
      extraction,
      behavioralResponse,
    });
    const strategicAlignmentScore = buildStrategicScore({
      extraction,
      goal,
      ctaPressure,
      attention: attentionAnalysis,
      alignment: campaignAlignment,
      behavioralResponse,
      goalAligned,
      verticalAligned,
      textAvailable: ocrMeta.text_available,
    });
    const decisionIntelligence = buildFinalDecisionIntelligence({
      alignment: campaignAlignment,
      audienceResponse,
      businessImpact,
      recommendations: strategicRecommendations,
      strategicScore: strategicAlignmentScore,
      behavioralResponse,
    });
    const goalAlignment = {
      selected_goal: goal,
      selected_stage: goalProfile.stage,
      detected_goal_stage: detectedGoal,
      is_aligned: detectedGoal === goalProfile.stage,
      reason: detectedGoal === goalProfile.stage
        ? "Creative pressure and urgency cues align with selected campaign objective stage."
        : "Creative pressure and urgency cues indicate a different stage intent than selected objective.",
      objective_priorities: goalProfile.aiPriorities,
      objective_behavior: goalProfile.creativeBehavior,
    };

    const verticalAlignment = {
      selected_vertical: vertical,
      detected_vertical: verticalIntelligence.productCategory.id,
      is_aligned: verticalIntelligence.productCategory.id === "unknown"
        ? null
        : verticalIntelligence.productCategory.id === vertical,
      reason: verticalIntelligence.productCategory.id === "unknown"
        ? "Product category confidence is limited; no contradictory category detected."
        : verticalIntelligence.productCategory.id === vertical
          ? "Product category aligns with selected vertical context."
          : `Product category reads as ${verticalIntelligence.productCategory.label} instead of ${vertical.replace(/_/g, " ")}.`,
      evidence: [
        ...verticalIntelligence.productCategory.evidence,
        ...verticalIntelligence.advertisingBehavior.evidence,
      ].filter(Boolean).slice(0, 6),
      fit_score: verticalIntelligence.productCategory.fitScore,
      product_category: verticalIntelligence.productCategory.label,
      advertising_behavior: verticalIntelligence.advertisingBehavior.label,
      strategic_interpretation: verticalIntelligence.strategicInterpretation,
      behavior_goal_alignment: {
        is_aligned: verticalIntelligence.behaviorAlignedToGoal,
        reason: verticalIntelligence.behaviorAlignmentReason,
      },
      vertical_intelligence_block: `PRODUCT CATEGORY:\n${verticalIntelligence.productCategory.label}\n\nADVERTISING BEHAVIOR:\n${verticalIntelligence.advertisingBehavior.label}\n\nSTRATEGIC INTERPRETATION:\n${verticalIntelligence.strategicInterpretation}`,
    };

    const responsePayload = {
      main_strategic_problem: decisionIntelligence.main_strategic_problem,
      why_audience_may_resist: decisionIntelligence.why_audience_may_resist,
      business_consequence: decisionIntelligence.business_consequence,
      attention_analysis: attentionAnalysis,
      behavioral_response: behavioralResponse,
      strategic_recommendations: strategicRecommendations,
      expected_improvement: decisionIntelligence.expected_improvement,
      strategic_alignment_score: strategicAlignmentScore,
      campaign_alignment: campaignAlignment,
      platform_alignment: platformAlignment,
      google_display_intelligence: googleDisplayIntelligence,
      meta_feed_intelligence: metaFeedIntelligence,
      goal_alignment: goalAlignment,
      vertical_alignment: verticalAlignment,
      business_impact: businessImpact,
      extraction_signals: {
        headline: extraction.headline,
        cta: extraction.cta,
        brand_presence: extraction.brand_presence,
        layout_structure: extraction.layout_structure,
        hierarchy_observations: extraction.hierarchy_observations,
        dominant_colors: extraction.dominant_colors,
        text_density: extraction.text_density,
        readability: extraction.readability,
        dominant_visual_cue: extraction.visual_elements[0] || "",
        persuasion_style: psychologyAnalysis.persuasion_style,
        platform_context: platformProfile.label,
        objective_context: goal,
        objective_stage: goalProfile.stage,
        detected_vertical: verticalIntelligence.productCategory.id,
        product_category: verticalIntelligence.productCategory.label,
        advertising_behavior: verticalIntelligence.advertisingBehavior.label,
        strategic_interpretation: verticalIntelligence.strategicInterpretation,
        topic_summary: buildCreativeTopicSummary(extraction, verticalIntelligence.productCategory, goal),
      },
      cta_text: ocrMeta.cta_text,
      extracted_text: ocrMeta.extracted_text,
      ocr_status: {
        failed: ocrMeta.ocr_failed,
        error: ocrMeta.ocr_error,
        retry_count: ocrMeta.retry_count,
        timed_out: ocrMeta.timed_out,
        normalized_image: {
          mime_type: normalized.mimeType,
          width: normalized.width,
          height: normalized.height,
        },
      },
    };

    traceStrategicValidation(responsePayload as Record<string, unknown>);

    return NextResponse.json(responsePayload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("[analyze-creative orchestrator]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}