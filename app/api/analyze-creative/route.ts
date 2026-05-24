/**
 * Advertising Intelligence Orchestrator
 *
 * POST /api/analyze-creative
 *
 * Architecture:
 * 1) Extraction Layer (OpenAI multimodal extraction only)
 * 2) Attention Analysis Layer (deterministic)
 * 3) Platform/Inventory Intelligence Layer (deterministic)
 * 4) Campaign Alignment Layer (deterministic)
 * 5) Business Consequence Layer (deterministic)
 * 6) Strategic Recommendation Layer (deterministic)
 * 7) Weighted Scoring Layer (deterministic)
 * 8) Final Decision Intelligence Layer (deterministic)
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

type SignalLevel = "low" | "moderate" | "high";
type CtaPressure = "soft" | "moderate" | "aggressive";
type CampaignGoal = "awareness" | "traffic" | "conversion" | "lead_generation" | "engagement" | "app_installs" | "video_views" | "retargeting" | "consideration";
type GoalStage = "awareness" | "consideration" | "conversion";
type PlatformContext = "google_ads" | "meta_ads" | "programmatic";
type AudienceStage = "cold" | "warm" | "hot";
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
  creative_type_hint?: string;
  composition_notes?: string;
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
  audience_stage: AudienceStage;
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
  audience_stage_fit: {
    status: "strong" | "mixed" | "weak";
    expected_behavior: string;
    reasoning: string;
  };
  auction_readiness_impact: string;
}

interface GoogleFinalInterpretation {
  campaign_fit: string;
  audience_fit: string;
  inventory_fit: string;
  main_strength: string;
  main_risk: string;
  recommended_fixes: string[];
}

interface MetaFeedIntelligence {
  campaign_goal: CampaignGoal;
  audience_stage: AudienceStage;
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
  feed_native_analysis: {
    native_feel: "authentic" | "mixed" | "banner_like";
    ugc_compatibility: "strong" | "moderate" | "weak";
    over_designed_risk: "low" | "medium" | "high";
    reasoning: string;
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
  audience_stage_fit: {
    status: "strong" | "mixed" | "weak";
    expected_behavior: string;
    reasoning: string;
  };
  platform_behavior_fit: string;
}

interface MetaFinalInterpretation {
  campaign_fit: string;
  audience_fit: string;
  placement_fit: string;
  main_strength: string;
  main_risk: string;
  recommended_fixes: string[];
}

interface ProgrammaticDisplayIntelligence {
  campaign_goal: CampaignGoal;
  audience_stage: AudienceStage;
  objective_priorities: string[];
  ecosystem_focus: string[];
  inventory_adaptability_analysis: {
    contrast_strength: "strong" | "moderate" | "weak";
    readability_speed: "fast" | "moderate" | "slow";
    visual_simplicity: "clean" | "balanced" | "complex";
    peripheral_recognition: "strong" | "moderate" | "weak";
    reasoning: string;
  };
  banner_blindness_analysis: {
    risk_level: "low" | "medium" | "high";
    generic_structure_risk: string;
    fatigue_pattern_risk: string;
    interruption_signal: string;
  };
  device_inventory_flexibility: {
    desktop_fit: "strong" | "mixed" | "weak";
    mobile_fit: "strong" | "mixed" | "weak";
    in_app_fit: "strong" | "mixed" | "weak";
    native_fit: "strong" | "mixed" | "weak";
    key_risks: string[];
  };
  inventory_context_fit: {
    premium_inventory_fit: "strong" | "mixed" | "weak";
    native_compatibility: "strong" | "mixed" | "weak";
    high_impact_compatibility: "strong" | "mixed" | "weak";
    best_suited_inventory: string[];
  };
  category_signal_strength: {
    product_recognition_speed: "fast" | "moderate" | "slow";
    brand_recognition_speed: "fast" | "moderate" | "slow";
    offer_clarity: "strong" | "moderate" | "weak";
    reasoning: string;
  };
  audience_stage_fit: {
    status: "strong" | "mixed" | "weak";
    expected_behavior: string;
    reasoning: string;
  };
}

interface ProgrammaticFinalInterpretation {
  campaign_fit: string;
  audience_fit: string;
  inventory_fit: string;
  main_strength: string;
  main_risk: string;
  recommended_fixes: string[];
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
  priority: "HIGH" | "MEDIUM" | "LOW";
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

interface AIAnalysisOutput {
  overall_score: number;
  vertical_match: boolean;
  goal_match: boolean;
  platform_fit: boolean;
  status: "Approved" | "Needs Improvement" | "Rejected";
  scores: {
    visual_impact: number;
    cta_strength: number;
    brand_clarity: number;
    platform_fit_score: number;
    audience_relevance: number;
  };
  issues: Array<{ type: "error" | "warning" | "info"; message: string }>;
  vertical_feedback: string;
  goal_feedback: string;
  expert_insight: string;
}

interface FinalDecisionIntelligence {
  main_strategic_problem: string;
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

// ─── Human-Level Reasoning Layer Types ──────────────────────────────────────

type CreativeTypeName =
  | "Product Hero"
  | "Lifestyle / Aspirational"
  | "UGC-Style"
  | "Corporate / B2B"
  | "Offer / Promotional"
  | "Testimonial / Social Proof"
  | "Animated / Motion"
  | "Minimalist / Brand"
  | "Text-Heavy / Informational"
  | "Hybrid";

type ConfidenceLevel = "high" | "moderate" | "uncertain";

interface CreativeTypeDetection {
  primary_type: CreativeTypeName;
  secondary_type: CreativeTypeName | null;
  is_hybrid: boolean;
  hybrid_layers: string[];
  confidence: ConfidenceLevel;
  reasoning: string;
}

interface CreativeUnderstanding {
  visual_narrative: string;
  brand_communication: string;
  detected_funnel_stage: "awareness" | "consideration" | "conversion" | "retargeting";
  dominant_format: string;
  internal_inconsistencies: string[];
}

interface ContextualReasoning {
  intent_reasoning: string;
  composition_reasoning: string;
  audience_reasoning: string;
  platform_reasoning: string;
  anomaly_reasoning: string;
}

interface ReasoningChain {
  creative_type: string;
  core_message: string;
  detected_stage: string;
  goal_match: string;
  platform_fit: string;
  main_strength: string;
  main_risk: string;
  specific_fixes: string[];
  anomaly_flag: string | null;
  launch_readiness: "Ready" | "Fix First" | "Do Not Launch";
}

// ─────────────────────────────────────────────────────────────────────────────

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
  automotive: ["car", "vehicle", "bike","suv", "sedan", "drive", "engine", "mileage", "dealership", "auto"],
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
  fashion: ["fashion", "clothing", "apparel", "outfit", "style", "collection", "wardrobe", "dress", "jacket", "shoes", "accessories", "designer", "wear", "trend", "lookbook", "runway", "season", "model", "couture", "editorial"],
  saas: ["saas", "platform", "workflow", "automate", "integrate", "dashboard", "trial", "subscription", "pricing", "plan", "api", "deploy", "onboard", "scale", "analytics", "seats", "software", "cloud", "product-led", "enterprise"],
};

const GOOGLE_TIER1_SIZES = new Set(["300x250", "728x90", "160x600", "300x600", "320x50", "970x250", "1200x628", "1200x1200", "1080x1080"]);
const GOOGLE_TIER2_SIZES = new Set(["336x280", "970x90", "320x100", "468x60", "250x250", "200x200", "320x480", "480x320", "960x1200", "1200x1500"]);
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
  fashion: "Fashion / Apparel",
  saas: "SaaS / Software Platform",
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

function normalizeAudienceStage(audienceStage: string): AudienceStage {
  const cleaned = (audienceStage || "").toLowerCase().trim();
  if (cleaned === "warm") return "warm";
  if (cleaned === "hot" || cleaned === "retargeting") return "hot";
  return "cold";
}

function normalizeVertical(vertical: string): string {
  const cleaned = (vertical || "").toLowerCase().trim();
  return KNOWN_VERTICALS.has(cleaned) ? cleaned : "technology";
}

function getGoogleAudienceExpectation(audienceStage: AudienceStage): string {
  if (audienceStage === "cold") {
    return "Cold audiences need category clarity, fast recognition, and lower-pressure framing.";
  }
  if (audienceStage === "warm") {
    return "Warm audiences need trust reinforcement, differentiation, and visible conversion direction.";
  }
  return "Hot audiences need urgency, familiarity, and frictionless conversion cues.";
}

function getMetaAudienceExpectation(audienceStage: AudienceStage): string {
  if (audienceStage === "cold") {
    return "Cold Meta audiences need emotional interruption, identity relevance, and low cognitive load.";
  }
  if (audienceStage === "warm") {
    return "Warm Meta audiences need trust cues, differentiation, and stronger value reinforcement.";
  }
  return "Hot Meta audiences need urgency, reminders, and fast decision reinforcement.";
}

function getProgrammaticAudienceExpectation(audienceStage: AudienceStage): string {
  if (audienceStage === "cold") {
    return "Cold programmatic audiences need fast category recognition, emotional accessibility, and low cognitive load.";
  }
  if (audienceStage === "warm") {
    return "Warm programmatic audiences need trust reinforcement, value differentiation, and clearer decision support.";
  }
  return "Hot/retargeting programmatic audiences need urgency, offer clarity, and direct action reinforcement.";
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function traceStrategicValidation(payload: Record<string, unknown>): void {
  const attention = payload.attention_analysis as Record<string, unknown> | undefined;
  const strategicScore = payload.strategic_alignment_score as Record<string, unknown> | undefined;

  const validations = [
    {
      field: "main_strategic_problem",
      value: payload.main_strategic_problem,
      passed: isNonEmptyString(payload.main_strategic_problem),
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
      field: "adigator_analysis",
      value: payload.adigator_analysis,
      passed: Boolean(payload.adigator_analysis && typeof payload.adigator_analysis === "object"),
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
  // New combined format nests extraction signals under "signals"; fall back to top-level for backward compat
  const s = (raw.signals && typeof raw.signals === "object"
    ? raw.signals
    : raw) as Record<string, unknown>;
  return {
    headline: typeof s.headline === "string" ? s.headline : "",
    cta: typeof s.cta === "string" ? s.cta : "",
    primary_message: typeof s.primary_message === "string" ? s.primary_message : "",
    visual_elements: normalizeStringArray(s.visual_elements),
    dominant_colors: normalizeStringArray(s.dominant_colors),
    text_density: normalizeSignalLevel(s.text_density),
    layout_structure: typeof s.layout_structure === "string" ? s.layout_structure : "",
    brand_presence: normalizeSignalLevel(s.brand_presence),
    emotional_cues: normalizeStringArray(s.emotional_cues),
    readability: normalizeSignalLevel(s.readability),
    hierarchy_observations: typeof s.hierarchy_observations === "string" ? s.hierarchy_observations : "",
    trust_markers: normalizeStringArray(s.trust_markers),
    urgency_signals: normalizeStringArray(s.urgency_signals),
    audience_clues: normalizeStringArray(s.audience_clues),
    creative_type_hint: typeof s.creative_type_hint === "string" ? s.creative_type_hint : undefined,
    composition_notes: typeof s.composition_notes === "string" ? s.composition_notes : undefined,
  };
}

function normalizeAIAnalysis(raw: Record<string, unknown>): AIAnalysisOutput | null {
  // Only normalize if the model returned the new combined format
  if (typeof raw.overallScore !== "number" && typeof raw.overall_score !== "number") return null;

  const overallScore = typeof raw.overallScore === "number"
    ? raw.overallScore
    : (typeof raw.overall_score === "number" ? raw.overall_score : 50);
  const clamped = Math.max(0, Math.min(100, Math.round(overallScore)));
  const scoresRaw = (raw.scores && typeof raw.scores === "object"
    ? raw.scores : {}) as Record<string, unknown>;

  const normalizeScore = (v: unknown) =>
    typeof v === "number" ? Math.max(0, Math.min(100, Math.round(v))) : 50;

  return {
    overall_score: clamped,
    vertical_match: typeof raw.verticalMatch === "boolean" ? raw.verticalMatch : true,
    goal_match: typeof raw.goalMatch === "boolean" ? raw.goalMatch : true,
    platform_fit: typeof raw.platformFit === "boolean" ? raw.platformFit : true,
    status: (["Approved", "Needs Improvement", "Rejected"] as const).includes(raw.status as "Approved" | "Needs Improvement" | "Rejected")
      ? raw.status as "Approved" | "Needs Improvement" | "Rejected"
      : clamped >= 75 ? "Approved" : clamped >= 40 ? "Needs Improvement" : "Rejected",
    scores: {
      visual_impact: normalizeScore(scoresRaw.visualImpact),
      cta_strength: normalizeScore(scoresRaw.ctaStrength),
      brand_clarity: normalizeScore(scoresRaw.brandClarity),
      platform_fit_score: normalizeScore(scoresRaw.platformFitScore),
      audience_relevance: normalizeScore(scoresRaw.audienceRelevance),
    },
    issues: Array.isArray(raw.issues)
      ? (raw.issues as unknown[]).filter((i) => i && typeof i === "object").map((i) => {
          const issue = i as Record<string, unknown>;
          return {
            type: (["error", "warning", "info"] as const).includes(issue.type as "error" | "warning" | "info")
              ? issue.type as "error" | "warning" | "info"
              : "warning" as const,
            message: typeof issue.message === "string" ? issue.message : String(issue.message ?? ""),
          };
        })
      : [],
    vertical_feedback: typeof raw.verticalFeedback === "string" ? raw.verticalFeedback : "",
    goal_feedback: typeof raw.goalFeedback === "string" ? raw.goalFeedback : "",
    expert_insight: typeof raw.expertInsight === "string" ? raw.expertInsight : "",
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
}): Promise<{ parsed: Record<string, unknown>; meta: ExtractionMeta; aiAnalysis: AIAnalysisOutput | null }> {
  const { openai, mimeType, base64, extractionUserPrompt } = params;
  let lastError: Error | null = null;
  let timedOut = false;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const completion = await withTimeout(
        openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o",
          max_tokens: 2000,
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
        aiAnalysis: normalizeAIAnalysis(parsed),
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
    aiAnalysis: null,
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

  if (productCategoryId === "fashion") {
    const hasLimitedDrop = /limited|new arrival|new collection|drop|season|exclusive|just dropped|now available/.test(corpus);
    if (hasDiscount || (ctaPressure === "aggressive" && hasRetailAction)) {
      return { label: "Fashion discount and promotional sales advertising", evidence: behaviorEvidence };
    }
    if (hasLimitedDrop) {
      return { label: "Fashion limited-edition drop and new collection launch", evidence: behaviorEvidence };
    }
    return { label: "Aspirational fashion brand and lifestyle storytelling", evidence: behaviorEvidence };
  }

  if (productCategoryId === "saas") {
    const hasTrialCta = /free trial|try free|start free|get started free|sign up free|no credit card/.test(corpus);
    const hasEnterpriseSig = /enterprise|contact sales|book a demo|request demo|schedule a call|custom plan/.test(corpus);
    const hasPricingIntent = /pricing|plans?|seats|per user|per month|per year|upgrade|tier/.test(corpus);
    if (hasTrialCta) {
      return { label: "SaaS product-led trial acquisition and conversion", evidence: behaviorEvidence };
    }
    if (hasEnterpriseSig || hasLeadGenSignal) {
      return { label: "Enterprise SaaS lead generation and sales qualification", evidence: behaviorEvidence };
    }
    if (hasPricingIntent || (ctaPressure === "aggressive" && hasRetailAction)) {
      return { label: "SaaS direct-response subscription conversion", evidence: behaviorEvidence };
    }
    return { label: "SaaS product awareness and value demonstration", evidence: behaviorEvidence };
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

function buildCreativeTypeDetection(
  extraction: ExtractionSignals,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
): CreativeTypeDetection {
  const visualCorpus = extraction.visual_elements.join(" ").toLowerCase();
  const layoutCorpus = extraction.layout_structure.toLowerCase();
  const corpus = buildSignalCorpus(extraction);
  const emotionCorpus = extraction.emotional_cues.join(" ").toLowerCase();
  const trustCorpus = extraction.trust_markers.join(" ").toLowerCase();

  const scores: Record<Exclude<CreativeTypeName, "Hybrid">, number> = {
    "Product Hero": 0,
    "Lifestyle / Aspirational": 0,
    "UGC-Style": 0,
    "Corporate / B2B": 0,
    "Offer / Promotional": 0,
    "Testimonial / Social Proof": 0,
    "Animated / Motion": 0,
    "Minimalist / Brand": 0,
    "Text-Heavy / Informational": 0,
  };

  // Product Hero — product dominant, clean background, feature-focused
  if (/product|item|packag|bottle|shoe|device|phone|laptop|gadget|model/.test(visualCorpus)) scores["Product Hero"] += 3;
  if (/clean|isolated|white background|product.centric|product dominant|single item/.test(layoutCorpus)) scores["Product Hero"] += 2;
  if (/feature|spec|detail|material|color option/.test(corpus)) scores["Product Hero"] += 1;

  // Lifestyle / Aspirational — human subject, emotion, environment-driven
  if (/person|people|human|face|portrait|lifestyle|outdoor|nature|travel|family|couple|smile|happy/.test(visualCorpus)) scores["Lifestyle / Aspirational"] += 3;
  if (/aspiration|emotion|story|journey|experience|mood|ambiance/.test(corpus)) scores["Lifestyle / Aspirational"] += 2;
  if (/aspiration|happiness|joy|love|freedom|adventure|desire|pride/.test(emotionCorpus)) scores["Lifestyle / Aspirational"] += 2;

  // UGC-Style — raw/organic feel, text overlays, casual framing, social-native (Fix 1: never flag as low quality)
  const hintIsUgc = /ugc|user.?generated|raw|organic|casual/.test((extraction.creative_type_hint ?? "").toLowerCase());
  if (hintIsUgc) scores["UGC-Style"] += 4;
  if (/text overlay|caption|handwritten|organic|casual|lo.fi|social.native|phone.shot|selfie/.test(layoutCorpus + " " + visualCorpus)) scores["UGC-Style"] += 3;
  if (extraction.brand_presence === "low" && emotionCorpus.length > 0) scores["UGC-Style"] += 1;

  // Corporate / B2B — professional layout, UI/dashboard, data visuals, formal hierarchy
  if (/dashboard|interface|screen|data|chart|graph|ui element|mockup|product screenshot/.test(visualCorpus)) scores["Corporate / B2B"] += 3;
  if (/saas|platform|enterprise|b2b|solution|software|integration|workflow|compliance/.test(corpus)) scores["Corporate / B2B"] += 2;
  if (/professional|formal|structured|grid|clean hierarchy/.test(layoutCorpus)) scores["Corporate / B2B"] += 1;

  // Offer / Promotional — price, discount, deadline, urgency language dominant
  if (ctaPressure === "aggressive") scores["Offer / Promotional"] += 2;
  if (urgencyLevel === "high") scores["Offer / Promotional"] += 2;
  if (/price|discount|%\s*off|sale|deal|save|limited|offer|promo|coupon|flash|today only/.test(corpus)) scores["Offer / Promotional"] += 3;
  if (extraction.urgency_signals.length >= 2) scores["Offer / Promotional"] += 2;

  // Testimonial / Social Proof — quote, review, rating, human face + endorsement
  if (/quote|review|rating|star|testimonial|endorsement|case study|customer/.test(trustCorpus + " " + corpus)) scores["Testimonial / Social Proof"] += 3;
  if (/"[^"]{5,}"/.test(extraction.primary_message)) scores["Testimonial / Social Proof"] += 2;
  if (/face|person|portrait/.test(visualCorpus) && extraction.trust_markers.length > 1) scores["Testimonial / Social Proof"] += 2;

  // Animated / Motion — movement, sequential storytelling, kinetic elements
  if (/motion|animation|animated|kinetic|sequential|gif|video|reel|movement|dynamic|frame/.test(layoutCorpus + " " + visualCorpus + " " + corpus)) scores["Animated / Motion"] += 4;

  // Minimalist / Brand — heavy whitespace, logo-forward, short tagline, brand identity dominant
  if (extraction.brand_presence === "high" && extraction.text_density === "low") scores["Minimalist / Brand"] += 5;
  if (/whitespace|minimal|clean|simple|logo.forward|brand.identity|tagline/.test(layoutCorpus)) scores["Minimalist / Brand"] += 3;
  if (extraction.text_density === "low" && extraction.brand_presence !== "low") scores["Minimalist / Brand"] += 2;

  // Text-Heavy / Informational — copy is the primary communication vehicle
  if (extraction.text_density === "high") scores["Text-Heavy / Informational"] += 4;
  if (/text.heavy|copy.dominant|informational|educational|data.driven|long.copy/.test(layoutCorpus)) scores["Text-Heavy / Informational"] += 2;
  if (/learn|read|discover|explain|inform|detail|benefit/.test(corpus) && extraction.text_density !== "low") scores["Text-Heavy / Informational"] += 1;

  // Incorporate model hint as strong signal boost
  const hint = (extraction.creative_type_hint ?? "").toLowerCase();
  if (/product.hero|product_hero/.test(hint)) scores["Product Hero"] += 3;
  else if (/lifestyle/.test(hint)) scores["Lifestyle / Aspirational"] += 3;
  else if (/ugc/.test(hint)) scores["UGC-Style"] += 3;
  else if (/corporate|b2b/.test(hint)) scores["Corporate / B2B"] += 3;
  else if (/offer|promo/.test(hint)) scores["Offer / Promotional"] += 3;
  else if (/testimonial|social.proof/.test(hint)) scores["Testimonial / Social Proof"] += 3;
  else if (/animated|motion/.test(hint)) scores["Animated / Motion"] += 3;
  else if (/minimalist|brand/.test(hint)) scores["Minimalist / Brand"] += 3;
  else if (/text.heavy|inform/.test(hint)) scores["Text-Heavy / Informational"] += 3;

  const typeEntries = (Object.entries(scores) as [Exclude<CreativeTypeName, "Hybrid">, number][])
    .sort(([, a], [, b]) => b - a);
  const [primaryEntry, secondaryEntry] = typeEntries;
  const [primaryType, primaryScore] = primaryEntry;
  const [secondaryType, secondaryScore] = secondaryEntry;

  // Hybrid detection: secondary has significant signal relative to primary (Fix 2)
  const isHybrid = primaryScore > 0 && secondaryScore >= 3 && secondaryScore >= primaryScore * 0.55;
  const effectiveSecondary: CreativeTypeName | null = isHybrid ? secondaryType : null;

  // Confidence calibration (Step 6)
  let confidence: ConfidenceLevel;
  if (primaryScore === 0) {
    confidence = "uncertain";
  } else if (primaryScore >= 6 && !isHybrid) {
    confidence = "high";
  } else if (primaryScore >= 3 || isHybrid) {
    confidence = "moderate";
  } else {
    confidence = "uncertain";
  }

  const hybridLayers = isHybrid
    ? [
      `Dominant: ${primaryType} (signal score: ${primaryScore})`,
      `Modifier: ${secondaryType} (signal score: ${secondaryScore})`,
    ]
    : [];

  const reasoning = confidence === "uncertain"
    ? "Creative type is ambiguous — insufficient distinct signals to confidently classify. Analysis applied to most likely interpretation."
    : isHybrid
      ? `Creative blends ${primaryType} and ${secondaryType} formats. ${primaryType} is dominant; ${secondaryType} acts as execution modifier. Both layers analyzed.`
      : `Creative reads as ${primaryType} based on ${primaryScore >= 6 ? "strong" : "moderate"} signal evidence from visual composition, layout structure, and copy patterns.`;

  return {
    primary_type: primaryType as CreativeTypeName,
    secondary_type: effectiveSecondary,
    is_hybrid: isHybrid,
    hybrid_layers: hybridLayers,
    confidence,
    reasoning,
  };
}

function buildCreativeUnderstanding(
  extraction: ExtractionSignals,
  creativeType: CreativeTypeDetection,
  goal: CampaignGoal,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel,
): CreativeUnderstanding {
  const corpus = buildSignalCorpus(extraction);
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];

  // Detect funnel stage independently from declared goal (Fix 3 — stage ≠ goal)
  const hasRetargetingSignals = /come back|return|abandoned|reminder|you viewed|previously/.test(corpus);
  const hasConversionSignals = ctaPressure === "aggressive" || urgencyLevel === "high"
    || /buy now|order now|checkout|claim|purchase|apply now|enroll now/.test(corpus);
  const hasConsiderationSignals = /compare|learn more|explore|pricing|features|demo|review|trial|see how/.test(corpus);

  let detectedFunnelStage: "awareness" | "consideration" | "conversion" | "retargeting";
  if (hasRetargetingSignals) detectedFunnelStage = "retargeting";
  else if (hasConversionSignals) detectedFunnelStage = "conversion";
  else if (hasConsiderationSignals) detectedFunnelStage = "consideration";
  else detectedFunnelStage = "awareness";

  // Visual narrative
  const primaryVisual = extraction.visual_elements[0];
  const secondaryVisual = extraction.visual_elements[1];
  const visualNarrative = primaryVisual
    ? `${creativeType.primary_type} composition — primary element is ${primaryVisual}${secondaryVisual ? `, supported by ${secondaryVisual}` : ""}${extraction.dominant_colors.length > 0 ? `. Dominant colors: ${extraction.dominant_colors.slice(0, 3).join(", ")}` : ""}.`
    : `Visual narrative is ${creativeType.primary_type.toLowerCase()} in format without a clearly identifiable primary element.`;

  // Brand communication
  const brandCommunication = extraction.headline
    ? `"${extraction.headline}"${extraction.primary_message && extraction.primary_message !== extraction.headline ? ` — ${extraction.primary_message}` : ""}${extraction.cta ? `. CTA: "${extraction.cta}"` : ""}.`
    : extraction.primary_message
      ? `"${extraction.primary_message}"${extraction.cta ? `. CTA: "${extraction.cta}"` : ""}. No distinct headline detected.`
      : "No text copy detected. Communication relies on visual elements alone.";

  const dominantFormat = creativeType.is_hybrid
    ? `${creativeType.primary_type} with ${creativeType.secondary_type} execution layer`
    : creativeType.primary_type;

  // Internal inconsistencies — flag actual execution problems, not intentional creative direction (Fix 1)
  const inconsistencies: string[] = [];

  // Low readability is only an error in non-text-heavy, non-UGC formats (Fix 1)
  if (
    extraction.readability === "low" &&
    creativeType.primary_type !== "UGC-Style" &&
    creativeType.primary_type !== "Text-Heavy / Informational"
  ) {
    inconsistencies.push("Low readability in a non-text-heavy creative format — likely an execution issue, not intentional design.");
  }

  // Minimalist type with high text density is contradictory
  if (creativeType.primary_type === "Minimalist / Brand" && extraction.text_density === "high") {
    inconsistencies.push("Minimalist creative type conflicts with high text density — these are contradictory design directions.");
  }

  // Conversion-stage creative missing CTA (Fix 5)
  if (detectedFunnelStage === "conversion" && !extraction.cta?.trim()) {
    inconsistencies.push("Conversion-stage creative is missing a clear CTA — action intent without action signal is a critical gap.");
  }

  // Goal-stage mismatch (Fix 3)
  if (detectedFunnelStage !== goalProfile.stage && detectedFunnelStage !== "retargeting") {
    inconsistencies.push(`Creative reads as ${detectedFunnelStage}-stage content but campaign is set to ${goalProfile.stage}-stage — this gap should be resolved before launch.`);
  }

  return {
    visual_narrative: visualNarrative,
    brand_communication: brandCommunication,
    detected_funnel_stage: detectedFunnelStage,
    dominant_format: dominantFormat,
    internal_inconsistencies: inconsistencies,
  };
}

function buildContextualReasoning(
  extraction: ExtractionSignals,
  creativeType: CreativeTypeDetection,
  understanding: CreativeUnderstanding,
  goal: CampaignGoal,
  audienceStage: AudienceStage,
  platform: PlatformContext,
  ctaPressure: CtaPressure,
): ContextualReasoning {
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const platformProfile = PLATFORM_BMI_PROFILE[platform];
  const corpus = buildSignalCorpus(extraction);

  // 1. Intent Reasoning — what is the creative trying to make the viewer do?
  const intendedAction =
    ctaPressure === "aggressive" ? "complete a purchase or conversion action" :
    ctaPressure === "moderate" ? "click to learn more or evaluate an offer" :
    "pause and notice the brand or message";

  const stageConflict = understanding.detected_funnel_stage !== goalProfile.stage
    ? ` However, the creative behaves like ${understanding.detected_funnel_stage}-stage content while the campaign expects ${goalProfile.stage}-stage behavior — this is a stage mismatch.`
    : "";
  const intentReasoning = `This creative appears designed to make viewers ${intendedAction}.${stageConflict}${!stageConflict ? ` Intent aligns with the ${goal.replace(/_/g, " ")} campaign objective.` : ""}`.trim();

  // 2. Composition Reasoning — eye path, hierarchy, CTA position, brand weight (Fix 4: text reading order)
  const firstElement = extraction.headline
    ? `headline "${extraction.headline}"`
    : extraction.visual_elements[0]
      ? `primary visual element (${extraction.visual_elements[0]})`
      : "brand mark";

  // Detect implicit CTA signals (Fix 5 — CTA is not just a button)
  const hasImplicitCta = !extraction.cta?.trim() && (
    /\b(get|buy|try|start|join|sign|download|learn|discover|explore|book|order|shop|claim|save)\b/.test(corpus) ||
    /\b(https?:\/\/|\.com|\.co|\.io)\b/.test(corpus) ||
    extraction.urgency_signals.length > 0
  );
  const ctaObservation = extraction.cta
    ? `CTA "${extraction.cta}" is detectable in the reading sequence`
    : hasImplicitCta
      ? "No explicit CTA button detected, but implicit action signal present via imperative language or urgency cues"
      : "No CTA signal detected — action intent is absent from this creative";

  // Brand visibility reasoning (Fix 6 — brand is not only a logo)
  const brandSpeedNote = extraction.brand_presence === "high"
    ? "Brand is identifiable quickly — suitable for cold and warm audience reach."
    : extraction.brand_presence === "moderate"
      ? "Brand weight is moderate — visible but not immediately dominant in the hierarchy."
      : "Brand weight is low — a cold audience may not know who this ad is from without reading all copy.";

  const compositionReasoning = `Eye lands first on the ${firstElement}. ${extraction.hierarchy_observations || "Hierarchy structure is not clearly described."}. ${ctaObservation}. ${brandSpeedNote}`;

  // 3. Audience Reasoning — is language/imagery consistent with declared audience stage?
  const audienceNeeds: string[] = [];
  const audienceMismatches: string[] = [];

  if (audienceStage === "cold") {
    if (extraction.readability !== "low") audienceNeeds.push("readability supports first-time exposure");
    else audienceMismatches.push("low readability hurts cold audiences who need clarity");
    if (ctaPressure !== "aggressive") audienceNeeds.push("CTA pressure is appropriate for cold unfamiliar audiences");
    else audienceMismatches.push("aggressive pressure is premature — cold audiences need context before commitment ask");
  } else if (audienceStage === "warm") {
    if (extraction.trust_markers.length > 0) audienceNeeds.push("trust markers present for mid-funnel evaluation");
    else audienceMismatches.push("trust markers are missing — warm audiences need proof to progress");
    if (ctaPressure === "moderate") audienceNeeds.push("CTA pressure appropriately guides without over-pushing");
  } else {
    const hasUrgency = extraction.urgency_signals.length > 0 || ctaPressure === "aggressive";
    if (hasUrgency) audienceNeeds.push("urgency/action cues match hot audience readiness to convert");
    else audienceMismatches.push("insufficient urgency for hot audiences who are ready to decide");
    if (extraction.cta?.trim()) audienceNeeds.push("CTA is present for direct action");
  }

  const audienceReasoning = audienceNeeds.length > 0
    ? `For ${audienceStage} audiences: ${audienceNeeds.join("; ")}.${audienceMismatches.length > 0 ? ` Gaps: ${audienceMismatches.join("; ")}.` : ""}`
    : `Creative does not sufficiently serve ${audienceStage} audience needs. Key gaps: ${audienceMismatches.join("; ")}.`;

  // 4. Platform Reasoning — native feel, crop survival, attention in clutter
  let platformReasoning: string;
  if (platform === "meta_ads") {
    const thumbStop = extraction.emotional_cues.length > 0 && extraction.text_density !== "high";
    const cropRisk = extraction.text_density === "high" || extraction.brand_presence === "low";
    platformReasoning = `On Meta's mobile-first feed: ${thumbStop ? "emotional/visual signal can interrupt scroll behavior" : "lacks strong first-glance emotional interruption — likely to be passed over"}. ${cropRisk ? "Text density or low brand presence creates safe-zone risk in Story/Reels surfaces." : "Composition is manageable for mobile feed placement."} ${platformProfile.bmiStyle}`;
  } else if (platform === "google_ads") {
    const survivesCrop = extraction.readability !== "low" && extraction.brand_presence !== "low";
    platformReasoning = `In Google display inventory: ${survivesCrop ? "can communicate value quickly at display scan speed" : "risks losing key elements in responsive recomposition and smaller sizes"}. ${extraction.hierarchy_observations?.toLowerCase().includes("unclear") ? "Unclear hierarchy will worsen in fragmented placements." : "Hierarchy can survive responsive resize."} ${platformProfile.bmiStyle}`;
  } else {
    const peripheralReady = extraction.brand_presence !== "low" && extraction.readability !== "low";
    platformReasoning = `Across programmatic inventory: ${peripheralReady ? "adequate peripheral recognition for varied publisher contexts" : "may lose category and brand recognition in peripheral-attention placements"}. ${extraction.text_density === "high" ? "High text density is a risk in mixed-clutter environments." : "Text load appears manageable across standard placements."} ${platformProfile.bmiStyle}`;
  }

  // 5. Anomaly Reasoning — unexpected, inconsistent, or contradictory elements
  const anomalies: string[] = [];

  // CTA contradicts campaign stage
  if (extraction.cta && goalProfile.stage === "awareness" && ctaPressure === "aggressive") {
    anomalies.push(`CTA "${extraction.cta}" applies aggressive pressure in an awareness-stage creative — viewers are pushed to act before trust is established.`);
  }

  // Lifestyle visual paired with hard CTA (emotional/action tension)
  if (
    creativeType.primary_type === "Lifestyle / Aspirational" &&
    (ctaPressure === "aggressive" || extraction.urgency_signals.length > 0)
  ) {
    anomalies.push("Lifestyle/aspirational visual paired with aggressive CTA or urgency signals — emotional and action signals are in tension.");
  }

  // Minimalist type with high text density
  if (creativeType.primary_type === "Minimalist / Brand" && extraction.text_density === "high") {
    anomalies.push("Minimalist creative style contradicts high text density — design direction and copy volume are inconsistent.");
  }

  // Promotional with no brand visibility (Fix 6)
  if (creativeType.primary_type === "Offer / Promotional" && extraction.brand_presence === "low") {
    anomalies.push("Promotional creative with weak brand presence — viewers may not know who is making the offer, reducing conversion trust.");
  }

  // UGC with heavy brand presence (may feel inauthentic)
  if (creativeType.primary_type === "UGC-Style" && extraction.brand_presence === "high") {
    anomalies.push("UGC-style creative with high brand presence — heavy branding may undermine the authentic feel that UGC is designed to create.");
  }

  const anomalyReasoning = anomalies.length > 0
    ? anomalies.join(" | ")
    : "No significant anomalies detected. Creative elements appear internally consistent.";

  return {
    intent_reasoning: intentReasoning,
    composition_reasoning: compositionReasoning,
    audience_reasoning: audienceReasoning,
    platform_reasoning: platformReasoning,
    anomaly_reasoning: anomalyReasoning,
  };
}

function buildReasoningChain(params: {
  creativeType: CreativeTypeDetection;
  understanding: CreativeUnderstanding;
  contextualReasoning: ContextualReasoning;
  campaignAlignment: CampaignAlignment;
  attention: AttentionAnalysis;
  recommendations: StrategicRecommendation[];
  goal: CampaignGoal;
  platform: PlatformContext;
}): ReasoningChain {
  const {
    creativeType,
    understanding,
    contextualReasoning,
    campaignAlignment,
    attention,
    recommendations,
    goal,
    platform,
  } = params;

  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];

  const goalMatch = understanding.detected_funnel_stage === goalProfile.stage
    ? `Match — creative behavior aligns with ${goal.replace(/_/g, " ")} objective stage.`
    : `Mismatch — creative feels designed for ${understanding.detected_funnel_stage} but campaign is set to ${goal.replace(/_/g, " ")}.`;

  const platformFitStatus = campaignAlignment.alignment_status === "aligned"
    ? `Fit — structure is compatible with ${platform.replace(/_/g, " ")} delivery standards.`
    : campaignAlignment.alignment_status === "partially_aligned"
      ? `Partial Fit — minor gaps exist for ${platform.replace(/_/g, " ")} ecosystem.`
      : `Poor Fit — significant conflicts against ${platform.replace(/_/g, " ")} delivery expectations.`;

  const mainStrength = attention.friction_points.length === 0
    ? `Clear attention path: ${attention.first_focus} leads into the action step with no detected friction.`
    : creativeType.confidence !== "uncertain"
      ? `Clear creative identity as ${creativeType.primary_type} provides a recognizable structure for the intended audience.`
      : "Core visual composition establishes a starting point despite type classification uncertainty.";

  const mainRisk = recommendations[0]?.issue
    || (attention.friction_points.length > 0 ? attention.friction_points[0] : null)
    || "No dominant risk identified from current signal set.";

  const specificFixes = recommendations.slice(0, 3).map((r) => r.recommended_change);
  if (specificFixes.length === 0) specificFixes.push("Maintain current structure and validate with A/B test.");

  const anomalyFlag = contextualReasoning.anomaly_reasoning !== "No significant anomalies detected. Creative elements appear internally consistent."
    ? contextualReasoning.anomaly_reasoning
    : null;

  const launchReadiness: "Ready" | "Fix First" | "Do Not Launch" =
    campaignAlignment.alignment_status === "misaligned"
      ? "Do Not Launch"
      : campaignAlignment.alignment_status === "partially_aligned" || attention.friction_points.length > 0
        ? "Fix First"
        : "Ready";

  return {
    creative_type: creativeType.is_hybrid
      ? `${creativeType.primary_type} + ${creativeType.secondary_type} (Hybrid)`
      : creativeType.primary_type,
    core_message: understanding.brand_communication,
    detected_stage: understanding.detected_funnel_stage,
    goal_match: goalMatch,
    platform_fit: platformFitStatus,
    main_strength: mainStrength,
    main_risk: mainRisk,
    specific_fixes: specificFixes,
    anomaly_flag: anomalyFlag,
    launch_readiness: launchReadiness,
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
  audienceStage: AudienceStage,
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
  if (audienceStage === "cold" && ctaPressure === "aggressive" && goalStage !== "conversion") {
    conflicts.push("Cold audiences are receiving aggressive action pressure before relevance and trust are fully established.");
  }
  if (audienceStage === "warm" && extraction.trust_markers.length === 0 && goalStage !== "awareness") {
    conflicts.push("Warm audiences need trust reinforcement, but visible proof markers are limited.");
  }
  if (audienceStage === "hot" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
    conflicts.push("Hot audiences need direct conversion cues, but CTA pressure is currently too soft.");
  }
  if (audienceStage === "hot" && urgencyLevel === "low" && goalStage === "conversion") {
    conflicts.push("Hot conversion audiences typically respond to urgency reinforcement, but urgency cues are weak.");
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
  audienceStage: AudienceStage,
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
    if (audienceStage === "cold" && ctaPressure === "aggressive") {
      conflicts.push("Google cold-audience delivery is over-pressured for utility-driven first-touch scanning behavior.");
      recommendations.push("Reduce commitment pressure and foreground category/value clarity before direct ask.");
    }
    if (audienceStage === "warm" && extraction.trust_markers.length === 0) {
      conflicts.push("Google warm-audience delivery lacks trust reinforcement needed to convert partially familiar users.");
      recommendations.push("Add proof anchors near headline/CTA: credibility, testimonial, or security cues.");
    }
    if (audienceStage === "hot" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
      conflicts.push("Google hot-audience delivery is under-activated by soft action language.");
      recommendations.push("Use direct decision-stage CTA and visible offer reinforcement for retargeting-like behavior.");
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
    if (audienceStage === "cold" && ctaPressure === "aggressive" && goalProfile.stage !== "conversion") {
      conflicts.push("Cold Meta audiences are receiving high commitment pressure before emotional relevance is established.");
      recommendations.push("Lower immediate action pressure and strengthen first-second emotional hook.");
    }
    if (audienceStage === "warm" && extraction.trust_markers.length === 0) {
      conflicts.push("Warm Meta audiences need stronger trust and social proof cues than the current creative provides.");
      recommendations.push("Add concise trust proof, social proof, or credibility anchors near the value claim.");
    }
    if (audienceStage === "hot" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
      conflicts.push("Hot Meta audiences are under-activated by weak CTA pressure in decision-stage contexts.");
      recommendations.push("Use clearer urgency and action reinforcement for retargeting-oriented placements.");
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
    if (goal === "retargeting" && (!extraction.cta?.trim() || urgencyLevel === "low")) {
      conflicts.push("Retargeting objective in programmatic inventory needs clearer urgency and offer reinforcement.");
      recommendations.push("Use stronger reminder/offer language and clearer action framing for retargeting inventory.");
    }
    if (extraction.text_density === "high") {
      conflicts.push("High text density may fail in peripheral-attention programmatic environments.");
      recommendations.push("Simplify copy blocks so category and action can be recognized without full focus.");
    }
    if (audienceStage === "cold" && ctaPressure === "aggressive" && goalProfile.stage !== "conversion") {
      conflicts.push("Cold programmatic audiences are receiving early action pressure before trust/relevance is established.");
      recommendations.push("Lower pressure and prioritize clarity + category recognition for first-touch inventory.");
    }
    if (audienceStage === "warm" && extraction.trust_markers.length === 0) {
      conflicts.push("Warm programmatic audiences need stronger trust signals for mid-funnel progression.");
      recommendations.push("Add concise trust proof next to value messaging to reduce hesitation across mixed publishers.");
    }
    if (audienceStage === "hot" && (!extraction.cta?.trim() || ctaPressure === "soft")) {
      conflicts.push("Hot programmatic audiences are under-activated by weak CTA pressure.");
      recommendations.push("Increase action reinforcement and decision clarity for retargeting-heavy delivery.");
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
  audienceStage: AudienceStage;
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
    audienceStage,
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

  const audienceStageFitStatus: "strong" | "mixed" | "weak" =
    audienceStage === "cold"
      ? (ctaPressure === "aggressive" ? "weak" : extraction.readability === "low" ? "mixed" : "strong")
      : audienceStage === "warm"
        ? (extraction.trust_markers.length === 0 ? "mixed" : "strong")
        : (!extraction.cta?.trim() || ctaPressure === "soft" ? "weak" : urgencyLevel === "low" ? "mixed" : "strong");

  const audienceStageFitReasoning =
    audienceStage === "cold"
      ? (ctaPressure === "aggressive"
        ? "Cold audience delivery is too action-heavy for first-touch utility scanning."
        : "Cold audience delivery keeps pressure contained and supports quick comprehension.")
      : audienceStage === "warm"
        ? (extraction.trust_markers.length === 0
          ? "Warm audience delivery needs stronger trust markers to convert familiarity into action."
          : "Warm audience delivery includes adequate trust and action guidance.")
        : (!extraction.cta?.trim() || ctaPressure === "soft"
          ? "Hot audience delivery lacks decisive action cues for high-intent users."
          : "Hot audience delivery is action-forward and suitable for retargeting behavior.");

  return {
    campaign_goal: goal,
    audience_stage: audienceStage,
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
    audience_stage_fit: {
      status: audienceStageFitStatus,
      expected_behavior: getGoogleAudienceExpectation(audienceStage),
      reasoning: audienceStageFitReasoning,
    },
    auction_readiness_impact: auctionImpact,
  };
}

function buildGoogleFinalInterpretation(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
  campaignAlignment: CampaignAlignment;
  googleDisplayIntelligence: GoogleDisplayIntelligence | null;
  attentionAnalysis: AttentionAnalysis;
}): GoogleFinalInterpretation | null {
  const {
    platform,
    goal,
    audienceStage,
    campaignAlignment,
    googleDisplayIntelligence,
    attentionAnalysis,
  } = params;

  if (platform !== "google_ads" || !googleDisplayIntelligence) return null;

  const campaignFit = campaignAlignment.alignment_status === "aligned"
    ? `Strong ${goal.replace(/_/g, " ")} alignment for Google utility-driven conversion behavior.`
    : campaignAlignment.alignment_status === "partially_aligned"
      ? `Partial ${goal.replace(/_/g, " ")} alignment: key messaging elements need tightening for Google display.`
      : `Weak ${goal.replace(/_/g, " ")} alignment: creative behavior conflicts with Google display objective requirements.`;

  const audienceFit = googleDisplayIntelligence.audience_stage_fit.status === "strong"
    ? `Suitable for ${audienceStage} audiences in Google's intent-assisted display ecosystem.`
    : googleDisplayIntelligence.audience_stage_fit.status === "mixed"
      ? `Partially suitable for ${audienceStage} audiences; audience-stage reinforcement is needed.`
      : `Not yet suitable for ${audienceStage} audiences due to stage-fit friction signals.`;

  const inventoryFit = googleDisplayIntelligence.responsive_safety_analysis.status === "safe"
    ? "Responsive-display compatible across desktop and mobile Google inventory."
    : googleDisplayIntelligence.responsive_safety_analysis.status === "watch"
      ? "Mostly compatible with Google inventory, but responsive recomposition should be monitored."
      : "At risk in fragmented Google inventory due to responsive/cropping instability.";

  const mainStrength = `Attention flow is ${attentionAnalysis.first_focus} -> message -> CTA with ${googleDisplayIntelligence.cta_strength_analysis.status} CTA visibility.`;

  const mainRisk = googleDisplayIntelligence.mobile_cropping_risk.risk_level === "high"
    ? "Dense or ratio-sensitive layout may lose readability on smaller mobile placements."
    : googleDisplayIntelligence.banner_blindness_detection.risk_level === "high"
      ? "Creative may blend into generic display inventory and be ignored subconsciously."
      : "Secondary detail density can reduce scan speed in constrained placements.";

  const recommendedFixes = [
    "Simplify visual density to improve recognition at small responsive sizes.",
    "Increase CTA contrast and safe-zone spacing for mobile inventory.",
    "Prioritize headline clarity so product/value is understood within 1-2 seconds.",
  ];

  return {
    campaign_fit: campaignFit,
    audience_fit: audienceFit,
    inventory_fit: inventoryFit,
    main_strength: mainStrength,
    main_risk: mainRisk,
    recommended_fixes: recommendedFixes,
  };
}

function buildMetaFinalInterpretation(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
  campaignAlignment: CampaignAlignment;
  metaFeedIntelligence: MetaFeedIntelligence | null;
}): MetaFinalInterpretation | null {
  const {
    platform,
    goal,
    audienceStage,
    campaignAlignment,
    metaFeedIntelligence,
  } = params;

  if (platform !== "meta_ads" || !metaFeedIntelligence) return null;

  const campaignFit = campaignAlignment.alignment_status === "aligned"
    ? `Strong ${goal.replace(/_/g, " ")} Meta alignment for feed-behavior and interruption dynamics.`
    : campaignAlignment.alignment_status === "partially_aligned"
      ? `Partial ${goal.replace(/_/g, " ")} Meta alignment: key feed-behavior elements need refinement.`
      : `Weak ${goal.replace(/_/g, " ")} Meta alignment: creative behavior conflicts with feed-psychology requirements.`;

  const audienceFit = metaFeedIntelligence.audience_stage_fit.status === "strong"
    ? `Suitable for ${audienceStage} Meta audiences in fast-scroll mobile feeds.`
    : metaFeedIntelligence.audience_stage_fit.status === "mixed"
      ? `Partially suitable for ${audienceStage} audiences; audience-stage reinforcement is needed.`
      : `Not yet suitable for ${audienceStage} audiences due to stage-fit friction in feed behavior.`;

  const placementFit = metaFeedIntelligence.safe_zone_analysis.status === "safe"
    ? "Performs well across feed and story inventory with stable mobile-safe composition."
    : metaFeedIntelligence.safe_zone_analysis.status === "watch"
      ? "Works best in feed placements; vertical stories/reels need additional safe-zone tuning."
      : "Placement risk is elevated, especially in story/reels surfaces due to crop and overlay conflicts.";

  const mainStrength = metaFeedIntelligence.thumb_stop_analysis.predicted_strength === "strong"
    ? "Strong emotional interruption and feed-native structure support thumb-stop behavior."
    : "Creative shows partial feed interruption signals with mobile-first potential.";

  const mainRisk = metaFeedIntelligence.reels_story_immersion_analysis.status === "weak"
    ? "Brand/message visibility weakens in Reels/Story vertical behavior windows."
    : metaFeedIntelligence.creative_fatigue_analysis.risk_level === "high"
      ? "Pattern saturation risk may reduce thumb-stop performance over repeated impressions."
      : "Secondary copy and hierarchy can become slower to decode in high-speed scroll contexts.";

  const recommendedFixes = [
    "Strengthen logo and brand anchors without making the layout look display-banner-like.",
    "Improve vertical safe-zone spacing for Stories/Reels overlays.",
    "Reduce secondary copy density to improve one-second emotional readability.",
  ];

  return {
    campaign_fit: campaignFit,
    audience_fit: audienceFit,
    placement_fit: placementFit,
    main_strength: mainStrength,
    main_risk: mainRisk,
    recommended_fixes: recommendedFixes,
  };
}

function buildMetaFeedIntelligence(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
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
    audienceStage,
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

  const ugcCompatibility: "strong" | "moderate" | "weak" =
    socialNativeStatus === "authentic"
      ? "strong"
      : socialNativeStatus === "mixed"
        ? "moderate"
        : "weak";

  const overDesignedRisk: "low" | "medium" | "high" =
    extraction.text_density === "high"
      ? "high"
      : socialNativeStatus === "mixed"
        ? "medium"
        : "low";

  const audienceStageFitStatus: "strong" | "mixed" | "weak" =
    audienceStage === "cold"
      ? (thumbStopStrength === "weak" ? "weak" : extraction.readability === "low" ? "mixed" : "strong")
      : audienceStage === "warm"
        ? (extraction.trust_markers.length === 0 ? "mixed" : "strong")
        : (!extraction.cta?.trim() || ctaPressure === "soft" ? "weak" : urgencyLevel === "low" ? "mixed" : "strong");

  const audienceStageFitReasoning =
    audienceStage === "cold"
      ? (thumbStopStrength === "weak"
        ? "Cold feed users may not pause because interruption signals are currently weak."
        : "Cold feed users receive enough emotional interruption and simple decoding cues.")
      : audienceStage === "warm"
        ? (extraction.trust_markers.length === 0
          ? "Warm audiences need stronger trust proof before converting feed attention into clicks."
          : "Warm audiences get trust and differentiation signals suitable for mid-funnel action.")
        : (!extraction.cta?.trim() || ctaPressure === "soft"
          ? "Hot audiences are under-activated by soft action language in fast-scroll contexts."
          : "Hot audiences receive stronger urgency/action cues aligned with retargeting behavior.");

  return {
    campaign_goal: goal,
    audience_stage: audienceStage,
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
    feed_native_analysis: {
      native_feel: socialNativeStatus,
      ugc_compatibility: ugcCompatibility,
      over_designed_risk: overDesignedRisk,
      reasoning: socialNativeStatus === "authentic"
        ? "Creative behavior is feed-native and avoids rigid display-banner composition."
        : socialNativeStatus === "banner_like"
          ? "Composition resembles display-banner structure and may underperform in social feeds."
          : "Creative is partially feed-native but still carries some polished-ad friction.",
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
    audience_stage_fit: {
      status: audienceStageFitStatus,
      expected_behavior: getMetaAudienceExpectation(audienceStage),
      reasoning: audienceStageFitReasoning,
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
  contextualReasoning?: ContextualReasoning;
  creativeType?: CreativeTypeDetection;
  understanding?: CreativeUnderstanding;
}): StrategicRecommendation[] {
  const { alignment, attention, psychology, extraction, contextualReasoning, creativeType, understanding } = params;
  const recommendations: StrategicRecommendation[] = [];

  if (alignment.alignment_status !== "aligned") {
    recommendations.push({
      issue: "Campaign-to-creative strategic mismatch",
      why_it_hurts: `Detected mismatch: ${alignment.strategic_conflict}`,
      recommended_change: "Align CTA pressure, urgency cues, and message hierarchy to the selected goal stage before launch.",
      expected_outcome: "Improves goal-stage consistency and reduces wasted delivery on mismatched inventory behavior.",
      priority: "HIGH",
    });
  }

  if (attention.friction_points.length > 0) {
    recommendations.push({
      issue: "Attention flow breaks before CTA",
      why_it_hurts: `Observed friction points: ${attention.friction_points.join(" ")}`,
      recommended_change: "Simplify competing copy blocks and isolate one primary value claim adjacent to the CTA.",
      expected_outcome: "Improves scan continuity and increases visibility of the action path in constrained placements.",
      priority: "HIGH",
    });
  }

  if (extraction.readability === "low") {
    recommendations.push({
      issue: "Low readability undercuts persuasion",
      why_it_hurts: "Readability constraints reduce message decoding speed in mobile and peripheral view conditions.",
      recommended_change: "Increase text contrast, reduce copy length, and keep one dominant claim per frame.",
      expected_outcome: "Improves message recognition speed and CTA discoverability across smaller placements.",
      priority: "MEDIUM",
    });
  }

  if (psychology.trust_signal_strength.toLowerCase().includes("weak")) {
    recommendations.push({
      issue: "Insufficient trust reinforcement",
      why_it_hurts: "Weak proof visibility can delay category trust in consideration and conversion-focused objectives.",
      recommended_change: "Add concrete proof markers (credentials, verification, or product evidence) near the CTA.",
      expected_outcome: "Improves credibility recognition and stabilizes stage progression from evaluation to action.",
      priority: "MEDIUM",
    });
  }

  // Goal-stage mismatch from creative understanding (Fix 3)
  if (understanding?.internal_inconsistencies?.length) {
    const stageMismatch = understanding.internal_inconsistencies.find((i) => i.includes("stage"));
    if (stageMismatch && recommendations.length < 4) {
      recommendations.push({
        issue: "Creative-to-goal stage mismatch",
        why_it_hurts: stageMismatch,
        recommended_change: "Align creative pressure, CTA intensity, and message specificity to the declared campaign stage before launch.",
        expected_outcome: "Reduces funnel-stage friction and improves qualified response consistency.",
        priority: "HIGH",
      });
    }
  }

  // Anomaly-based recommendation from contextual reasoning (Step 5 — Reasoned, Specific, Actionable)
  if (
    contextualReasoning?.anomaly_reasoning &&
    contextualReasoning.anomaly_reasoning !== "No significant anomalies detected. Creative elements appear internally consistent." &&
    recommendations.length < 4
  ) {
    recommendations.push({
      issue: "Internal creative anomaly detected",
      why_it_hurts: contextualReasoning.anomaly_reasoning.split(" | ")[0],
      recommended_change: "Resolve the internal inconsistency between creative format, visual tone, and CTA behavior before scaling spend.",
      expected_outcome: "Improves creative coherence and reduces mixed-signal interpretation by target audiences.",
      priority: "MEDIUM",
    });
  }

  // UGC false-positive prevention — don't flag intentional rawness (Fix 1)
  if (
    creativeType?.primary_type === "UGC-Style" &&
    recommendations.some((r) => r.issue.toLowerCase().includes("quality") || r.issue.toLowerCase().includes("readability")) &&
    recommendations.length < 5
  ) {
    recommendations.push({
      issue: "Verify UGC rawness is intentional before optimizing",
      why_it_hurts: "Optimizing organic aesthetic toward polished production can destroy the authenticity that makes UGC-style ads perform in social feeds.",
      recommended_change: "Confirm whether raw/casual feel is a deliberate creative direction before requesting production changes.",
      expected_outcome: "Preserves authentic creative direction that often outperforms polished formats in native social environments.",
      priority: "LOW",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      issue: "No critical structural issue detected",
      why_it_hurts: "Current structure is stable, but there is still room to strengthen placement-level consistency.",
      recommended_change: "Run controlled A/B tests on headline framing, proof placement, and CTA microcopy.",
      expected_outcome: "Delivers incremental improvement while preserving current alignment strengths.",
      priority: "LOW",
    });
  }

  return recommendations.slice(0, 5);
}

function scoreLevel(level: SignalLevel, positive = true): number {
  if (positive) {
    return level === "high" ? 90 : level === "moderate" ? 70 : 45;
  }
  return level === "high" ? 45 : level === "moderate" ? 70 : 90;
}

function buildProgrammaticDisplayIntelligence(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
  extraction: ExtractionSignals;
  attention: AttentionAnalysis;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
  width: number;
  height: number;
}): ProgrammaticDisplayIntelligence | null {
  const {
    platform,
    goal,
    audienceStage,
    extraction,
    attention,
    ctaPressure,
    urgencyLevel,
    width,
    height,
  } = params;

  if (platform !== "programmatic") return null;

  const ratio = height > 0 ? width / height : 0;
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();

  const contrastStrength: "strong" | "moderate" | "weak" = extraction.readability === "low"
    ? "weak"
    : extraction.brand_presence === "high" || extraction.emotional_cues.length > 0
      ? "strong"
      : "moderate";

  const readabilitySpeed: "fast" | "moderate" | "slow" = extraction.readability === "low"
    ? "slow"
    : extraction.text_density === "high"
      ? "moderate"
      : "fast";

  const visualSimplicity: "clean" | "balanced" | "complex" = extraction.text_density === "high"
    ? "complex"
    : extraction.text_density === "moderate"
      ? "balanced"
      : "clean";

  const peripheralRecognition: "strong" | "moderate" | "weak" =
    extraction.hierarchy_observations.toLowerCase().includes("unclear") || extraction.readability === "low"
      ? "weak"
      : extraction.headline?.trim()
        ? "strong"
        : "moderate";

  const blindnessRisk: "low" | "medium" | "high" =
    extraction.emotional_cues.length === 0 && extraction.text_density !== "low"
      ? "high"
      : extraction.text_density === "high" || attention.friction_points.length > 0
        ? "medium"
        : "low";

  const keyRisks: string[] = [];
  if (!(ratio >= 0.45 && ratio <= 3.8)) keyRisks.push("Extreme ratio may break flexibility across mixed programmatic slots.");
  if (extraction.text_density === "high") keyRisks.push("Dense text reduces performance in peripheral-attention inventory.");
  if (extraction.readability === "low") keyRisks.push("Low readability weakens category recognition in cluttered environments.");
  if (extraction.brand_presence === "low") keyRisks.push("Brand anchor may be missed in fast-scan publisher contexts.");

  const desktopFit: "strong" | "mixed" | "weak" = keyRisks.length === 0 ? "strong" : keyRisks.length <= 2 ? "mixed" : "weak";
  const mobileFit: "strong" | "mixed" | "weak" = extraction.readability === "low" || extraction.text_density === "high" ? "weak" : keyRisks.length > 1 ? "mixed" : "strong";
  const inAppFit: "strong" | "mixed" | "weak" = extraction.text_density === "high" ? "weak" : extraction.readability === "low" ? "mixed" : "strong";
  const nativeFit: "strong" | "mixed" | "weak" = extraction.emotional_cues.length > 0 ? "strong" : extraction.text_density === "high" ? "weak" : "mixed";

  const premiumFit: "strong" | "mixed" | "weak" = extraction.readability === "low" ? "weak" : extraction.brand_presence === "high" ? "strong" : "mixed";
  const nativeCompatibility: "strong" | "mixed" | "weak" = nativeFit;
  const highImpactCompatibility: "strong" | "mixed" | "weak" = (width >= 900 || height >= 500) && extraction.readability !== "low" ? "strong" : extraction.readability === "low" ? "weak" : "mixed";

  const productRecognitionSpeed: "fast" | "moderate" | "slow" = extraction.visual_elements.length > 0 && extraction.headline?.trim() ? "fast" : extraction.visual_elements.length > 0 ? "moderate" : "slow";
  const brandRecognitionSpeed: "fast" | "moderate" | "slow" = extraction.brand_presence === "high" ? "fast" : extraction.brand_presence === "moderate" ? "moderate" : "slow";
  const offerClarity: "strong" | "moderate" | "weak" = /offer|save|discount|trial|free|pricing|book|buy|shop|quote|demo/.test(textCorpus)
    ? "strong"
    : extraction.cta?.trim()
      ? "moderate"
      : "weak";

  const audienceStageFitStatus: "strong" | "mixed" | "weak" =
    audienceStage === "cold"
      ? (peripheralRecognition === "weak" || readabilitySpeed === "slow" ? "weak" : "strong")
      : audienceStage === "warm"
        ? (extraction.trust_markers.length === 0 ? "mixed" : "strong")
        : (!extraction.cta?.trim() || ctaPressure === "soft" ? "weak" : urgencyLevel === "low" ? "mixed" : "strong");

  const bestInventory = [
    premiumFit === "strong" ? "premium publishers" : null,
    mobileFit !== "weak" ? "mobile web" : null,
    nativeCompatibility !== "weak" ? "native widgets" : null,
    desktopFit !== "weak" ? "desktop display" : null,
    highImpactCompatibility === "strong" ? "high-impact canvases" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    campaign_goal: goal,
    audience_stage: audienceStage,
    objective_priorities: goalProfile.aiPriorities,
    ecosystem_focus: ["premium_publishers", "mobile_web", "in_app_display", "native_widgets", "high_impact_inventory"],
    inventory_adaptability_analysis: {
      contrast_strength: contrastStrength,
      readability_speed: readabilitySpeed,
      visual_simplicity: visualSimplicity,
      peripheral_recognition: peripheralRecognition,
      reasoning: "Programmatic outcomes depend on surviving mixed backgrounds and peripheral attention windows across publisher contexts.",
    },
    banner_blindness_analysis: {
      risk_level: blindnessRisk,
      generic_structure_risk: blindnessRisk === "high"
        ? "Creative resembles standard templated banner structures."
        : "Generic banner risk is partially controlled.",
      fatigue_pattern_risk: blindnessRisk === "low"
        ? "Low immediate fatigue risk from repetitive layout patterns."
        : "Repeated delivery may reduce response if layout novelty is not refreshed.",
      interruption_signal: attention.friction_points.length === 0
        ? "Interruption signal is present and supports scan break."
        : "Interruption signal is inconsistent in cluttered browsing contexts.",
    },
    device_inventory_flexibility: {
      desktop_fit: desktopFit,
      mobile_fit: mobileFit,
      in_app_fit: inAppFit,
      native_fit: nativeFit,
      key_risks: keyRisks,
    },
    inventory_context_fit: {
      premium_inventory_fit: premiumFit,
      native_compatibility: nativeCompatibility,
      high_impact_compatibility: highImpactCompatibility,
      best_suited_inventory: bestInventory.length > 0 ? bestInventory : ["standard display inventory"],
    },
    category_signal_strength: {
      product_recognition_speed: productRecognitionSpeed,
      brand_recognition_speed: brandRecognitionSpeed,
      offer_clarity: offerClarity,
      reasoning: "Programmatic creatives must communicate category and intent within fast, low-attention scanning moments.",
    },
    audience_stage_fit: {
      status: audienceStageFitStatus,
      expected_behavior: getProgrammaticAudienceExpectation(audienceStage),
      reasoning: audienceStage === "cold"
        ? "Cold audiences need immediate category clarity and low cognitive load."
        : audienceStage === "warm"
          ? "Warm audiences need trust and stronger value reinforcement."
          : "Hot audiences need urgency and explicit action reinforcement.",
    },
  };
}

function buildProgrammaticFinalInterpretation(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
  campaignAlignment: CampaignAlignment;
  programmaticDisplayIntelligence: ProgrammaticDisplayIntelligence | null;
}): ProgrammaticFinalInterpretation | null {
  const {
    platform,
    goal,
    audienceStage,
    campaignAlignment,
    programmaticDisplayIntelligence,
  } = params;

  if (platform !== "programmatic" || !programmaticDisplayIntelligence) return null;

  const campaignFit = campaignAlignment.alignment_status === "aligned"
    ? `Strong ${goal.replace(/_/g, " ")} alignment for inventory-diverse programmatic delivery.`
    : campaignAlignment.alignment_status === "partially_aligned"
      ? `Partial ${goal.replace(/_/g, " ")} alignment: some inventory-behavior conflicts require refinement.`
      : `Weak ${goal.replace(/_/g, " ")} alignment for current programmatic context and objective.`;

  const audienceFit = programmaticDisplayIntelligence.audience_stage_fit.status === "strong"
    ? `Suitable for ${audienceStage} audiences in fragmented programmatic environments.`
    : programmaticDisplayIntelligence.audience_stage_fit.status === "mixed"
      ? `Partially suitable for ${audienceStage} audiences; stage-fit reinforcement is needed.`
      : `Not yet suitable for ${audienceStage} audiences due to stage-fit friction.`;

  const inventoryFit = programmaticDisplayIntelligence.inventory_context_fit.best_suited_inventory.length > 0
    ? `Best suited for ${programmaticDisplayIntelligence.inventory_context_fit.best_suited_inventory.join(", ")}.`
    : "Inventory fit is currently broad but unoptimized across mixed environments.";

  const mainStrength = programmaticDisplayIntelligence.inventory_adaptability_analysis.peripheral_recognition === "strong"
    ? "Strong peripheral recognition and mixed-inventory readability support broad display survival."
    : "Creative shows moderate inventory adaptability with usable cross-context visibility.";

  const mainRisk = programmaticDisplayIntelligence.banner_blindness_analysis.risk_level === "high"
    ? "High banner-blindness risk may suppress attention in saturated display environments."
    : programmaticDisplayIntelligence.device_inventory_flexibility.mobile_fit === "weak"
      ? "Mobile/in-app flexibility is weak and may reduce scalable reach quality."
      : "Brand/category signals may degrade in lower-attention placements.";

  const recommendedFixes = [
    "Strengthen non-generic focal contrast to reduce banner-blindness behavior.",
    "Simplify copy and improve peripheral readability across cluttered publisher layouts.",
    "Increase mobile-safe branding and CTA clarity for fragmented inventory placements.",
  ];

  return {
    campaign_fit: campaignFit,
    audience_fit: audienceFit,
    inventory_fit: inventoryFit,
    main_strength: mainStrength,
    main_risk: mainRisk,
    recommended_fixes: recommendedFixes,
  };
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
        (alignmentTier === 3 ? 100 : alignmentTier === 2 ? 60 : 20) * 0.28
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
    ? `Strategic Alignment Score uses ${alignmentBand}. Within this band, score is driven by visual clarity (${visualClarity}), CTA pressure fit (${ctaPressureFit}), readability (${readability}), goal-fit cue alignment (${emotionalAlignment}), audience-stage fit (${audienceFit}), attention retention (${attentionRetention}), and hierarchy quality (${hierarchyQuality}).`
    : `Strategic Alignment Score uses ${alignmentBand}. Text-dependent subscores are set to 0 because OCR extraction was unavailable; remaining inputs are visual clarity (${visualClarity}), audience-stage fit (${audienceFit}), attention retention (${attentionRetention}), and hierarchy quality (${hierarchyQuality}).`;

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
  businessImpact: BusinessImpact;
  recommendations: StrategicRecommendation[];
  strategicScore: StrategicScore;
}): FinalDecisionIntelligence {
  const { alignment, businessImpact, recommendations, strategicScore } = params;

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
    business_consequence: businessImpact.likely_effects[0] || "No significant downside detected from current evidence.",
    what_should_change_now: topRecommendation,
    expected_improvement: expectedImprovement,
    decision_summary: `Current strategic alignment score is ${strategicScore.value}/100. Priority level is ${recommendations[0]?.priority || "LOW"}, with intervention focused on hierarchy, readability, and placement-fit consistency before scaling spend.`,
  };
}

function mapSeverityToPlacementStatus(severity: "low" | "medium" | "high"): "Pass" | "Caution" | "Risk" {
  if (severity === "high") return "Risk";
  if (severity === "medium") return "Caution";
  return "Pass";
}

function platformDisplayName(platform: PlatformContext): "Meta" | "Google" | "Programmatic" {
  if (platform === "meta_ads") return "Meta";
  if (platform === "google_ads") return "Google";
  return "Programmatic";
}

function goalDisplayName(goal: CampaignGoal): string {
  if (goal === "lead_generation") return "Lead Generation";
  if (goal === "app_installs") return "App Installs";
  if (goal === "video_views") return "Video Views";
  return goal.charAt(0).toUpperCase() + goal.slice(1);
}

function audienceDisplayName(audienceStage: AudienceStage): "Cold" | "Warm" | "Hot" {
  if (audienceStage === "warm") return "Warm";
  if (audienceStage === "hot") return "Hot";
  return "Cold";
}

function buildAdigatorTechnicalRisks(params: {
  platform: PlatformContext;
  extraction: ExtractionSignals;
  googleDisplayIntelligence: GoogleDisplayIntelligence;
  metaFeedIntelligence: MetaFeedIntelligence;
  programmaticDisplayIntelligence: ProgrammaticDisplayIntelligence;
}): string[] {
  const { platform, extraction, googleDisplayIntelligence, metaFeedIntelligence, programmaticDisplayIntelligence } = params;
  const risks: string[] = [];

  if (platform === "google_ads") {
    if (googleDisplayIntelligence.mobile_cropping_risk.risk_level === "high") {
      risks.push("Responsive crop vulnerability detected on mobile-focused sizes.");
    }
    if (extraction.readability === "low" || googleDisplayIntelligence.text_density_analysis.classification === "unreadable") {
      risks.push("Mobile readability risk detected from low legibility text treatment.");
    }
  } else if (platform === "meta_ads") {
    if (metaFeedIntelligence.mobile_cropping_analysis.risk_level === "high") {
      risks.push("Story/Reels crop risk detected near edge zones.");
    }
    if (metaFeedIntelligence.safe_zone_analysis.status === "risky") {
      risks.push("Safe-zone violation risk may hide key elements under interface chrome.");
    }
    if (extraction.readability === "low") {
      risks.push("Mobile readability risk detected in feed-speed viewing conditions.");
    }
  } else {
    if (programmaticDisplayIntelligence.device_inventory_flexibility.key_risks.length > 0) {
      risks.push(programmaticDisplayIntelligence.device_inventory_flexibility.key_risks[0]);
    }
    if (extraction.readability === "low") {
      risks.push("Cross-device readability risk detected in smaller inventory formats.");
    }
  }

  return risks.length > 0 ? risks : ["None"];
}

function buildAdigatorPlacementCompatibility(params: {
  platform: PlatformContext;
  googleDisplayIntelligence: GoogleDisplayIntelligence;
  metaFeedIntelligence: MetaFeedIntelligence;
  programmaticDisplayIntelligence: ProgrammaticDisplayIntelligence;
}): Array<{ placement: string; status: "Pass" | "Caution" | "Risk"; reason: string }> {
  const { platform, googleDisplayIntelligence, metaFeedIntelligence, programmaticDisplayIntelligence } = params;

  if (platform === "google_ads") {
    const responsiveStatus = googleDisplayIntelligence.responsive_safety_analysis.status === "risky"
      ? "Risk"
      : googleDisplayIntelligence.responsive_safety_analysis.status === "watch"
        ? "Caution"
        : "Pass";

    const gmailSeverity = googleDisplayIntelligence.text_density_analysis.classification === "unreadable"
      ? "high"
      : googleDisplayIntelligence.text_density_analysis.classification === "text_heavy"
        ? "medium"
        : "low";

    return [
      {
        placement: "Responsive Display",
        status: responsiveStatus,
        reason: googleDisplayIntelligence.responsive_safety_analysis.risks[0] || "Core hierarchy remains stable across resize behavior.",
      },
      {
        placement: "Gmail",
        status: mapSeverityToPlacementStatus(gmailSeverity),
        reason: googleDisplayIntelligence.text_density_analysis.impact,
      },
      {
        placement: "Mobile Web",
        status: mapSeverityToPlacementStatus(googleDisplayIntelligence.mobile_cropping_risk.risk_level),
        reason: googleDisplayIntelligence.mobile_cropping_risk.issues[0] || "Mobile readability and CTA visibility are structurally clear.",
      },
    ];
  }

  if (platform === "meta_ads") {
    const feedStatus = metaFeedIntelligence.thumb_stop_analysis.predicted_strength === "weak"
      ? "Risk"
      : metaFeedIntelligence.thumb_stop_analysis.predicted_strength === "moderate"
        ? "Caution"
        : "Pass";

    const storyStatus = metaFeedIntelligence.safe_zone_analysis.status === "risky"
      ? "Risk"
      : metaFeedIntelligence.safe_zone_analysis.status === "watch"
        ? "Caution"
        : "Pass";

    const reelsStatus = metaFeedIntelligence.reels_story_immersion_analysis.status === "weak"
      ? "Risk"
      : metaFeedIntelligence.reels_story_immersion_analysis.status === "partial"
        ? "Caution"
        : "Pass";

    return [
      {
        placement: "Feed",
        status: feedStatus,
        reason: metaFeedIntelligence.thumb_stop_analysis.reason,
      },
      {
        placement: "Stories",
        status: storyStatus,
        reason: metaFeedIntelligence.safe_zone_analysis.guidance,
      },
      {
        placement: "Reels",
        status: reelsStatus,
        reason: metaFeedIntelligence.reels_story_immersion_analysis.fullscreen_utilization,
      },
    ];
  }

  const desktopRisk = programmaticDisplayIntelligence.device_inventory_flexibility.desktop_fit === "weak"
    ? "high"
    : programmaticDisplayIntelligence.device_inventory_flexibility.desktop_fit === "mixed"
      ? "medium"
      : "low";
  const mobileRisk = programmaticDisplayIntelligence.device_inventory_flexibility.mobile_fit === "weak"
    ? "high"
    : programmaticDisplayIntelligence.device_inventory_flexibility.mobile_fit === "mixed"
      ? "medium"
      : "low";
  const nativeRisk = programmaticDisplayIntelligence.device_inventory_flexibility.native_fit === "weak"
    ? "high"
    : programmaticDisplayIntelligence.device_inventory_flexibility.native_fit === "mixed"
      ? "medium"
      : "low";

  return [
    {
      placement: "News / Editorial",
      status: mapSeverityToPlacementStatus(desktopRisk),
      reason: programmaticDisplayIntelligence.banner_blindness_analysis.interruption_signal,
    },
    {
      placement: "Mobile Web",
      status: mapSeverityToPlacementStatus(mobileRisk),
      reason: programmaticDisplayIntelligence.device_inventory_flexibility.key_risks[0] || "Readable hierarchy survives smaller viewport rendering.",
    },
    {
      placement: "Native Placements",
      status: mapSeverityToPlacementStatus(nativeRisk),
      reason: `Native adaptability is ${programmaticDisplayIntelligence.device_inventory_flexibility.native_fit}.`,
    },
  ];
}

function buildAdigatorAnalysis(params: {
  platform: PlatformContext;
  goal: CampaignGoal;
  audienceStage: AudienceStage;
  campaignAlignment: CampaignAlignment;
  strategicRecommendations: StrategicRecommendation[];
  googleFinalInterpretation: GoogleFinalInterpretation | null;
  metaFinalInterpretation: MetaFinalInterpretation | null;
  programmaticFinalInterpretation: ProgrammaticFinalInterpretation | null;
  extraction: ExtractionSignals;
  googleDisplayIntelligence: GoogleDisplayIntelligence | null;
  metaFeedIntelligence: MetaFeedIntelligence | null;
  programmaticDisplayIntelligence: ProgrammaticDisplayIntelligence | null;
  creativeType: CreativeTypeDetection;
  understanding: CreativeUnderstanding;
  contextualReasoning: ContextualReasoning;
  reasoningChain: ReasoningChain;
}): {
  campaign_fit: string;
  audience_fit: string;
  inventory_fit: string;
  main_strength: string;
  main_risk: string;
  recommended_fixes: string[];
  technical_risks: string[];
  placement_compatibility: Array<{ placement: string; status: "Pass" | "Caution" | "Risk"; reason: string }>;
  launch_readiness: { status: "Ready to Launch" | "Launch with Fixes" | "Do Not Launch"; reason: string };
  formatted_output: string;
  creative_type_detection: CreativeTypeDetection;
  creative_understanding: CreativeUnderstanding;
  contextual_reasoning: ContextualReasoning;
  reasoning_chain: ReasoningChain;
  confidence: { level: ConfidenceLevel; rationale: string };
} {
  const {
    platform,
    goal,
    audienceStage,
    campaignAlignment,
    strategicRecommendations,
    googleFinalInterpretation,
    metaFinalInterpretation,
    programmaticFinalInterpretation,
    extraction,
    googleDisplayIntelligence,
    metaFeedIntelligence,
    programmaticDisplayIntelligence,
    creativeType,
    understanding,
    contextualReasoning,
    reasoningChain,
  } = params;

  const googleIntelligenceSafe = googleDisplayIntelligence ?? {
    mobile_cropping_risk: { risk_level: "low" as const, issues: [] },
    text_density_analysis: { classification: "optimal" as const, impact: "Text density is display-friendly for rapid recognition." },
    responsive_safety_analysis: { status: "safe" as const, risks: [] },
  };

  const metaIntelligenceSafe = metaFeedIntelligence ?? {
    mobile_cropping_analysis: { risk_level: "low" as const, issues: [] },
    safe_zone_analysis: { status: "safe" as const, overlays: [], guidance: "Safe-zone layout is stable for mobile viewing." },
    thumb_stop_analysis: { predicted_strength: "moderate" as const, reason: "Moderate interruption signal detected." },
    reels_story_immersion_analysis: { status: "partial" as const, fullscreen_utilization: "Fullscreen behavior is partially supported." },
  };

  const programmaticIntelligenceSafe = programmaticDisplayIntelligence ?? {
    banner_blindness_analysis: { interruption_signal: "Interruption signal is moderate across mixed inventory." },
    device_inventory_flexibility: { desktop_fit: "mixed" as const, mobile_fit: "mixed" as const, native_fit: "mixed" as const, key_risks: [] },
  };

  const finalInterpretation = platform === "google_ads"
    ? {
      campaign_fit: googleFinalInterpretation?.campaign_fit,
      audience_fit: googleFinalInterpretation?.audience_fit,
      inventory_fit: googleFinalInterpretation?.inventory_fit,
      main_strength: googleFinalInterpretation?.main_strength,
      main_risk: googleFinalInterpretation?.main_risk,
      recommended_fixes: googleFinalInterpretation?.recommended_fixes || [],
    }
    : platform === "meta_ads"
      ? {
        campaign_fit: metaFinalInterpretation?.campaign_fit,
        audience_fit: metaFinalInterpretation?.audience_fit,
        inventory_fit: metaFinalInterpretation?.placement_fit,
        main_strength: metaFinalInterpretation?.main_strength,
        main_risk: metaFinalInterpretation?.main_risk,
        recommended_fixes: metaFinalInterpretation?.recommended_fixes || [],
      }
      : {
        campaign_fit: programmaticFinalInterpretation?.campaign_fit,
        audience_fit: programmaticFinalInterpretation?.audience_fit,
        inventory_fit: programmaticFinalInterpretation?.inventory_fit,
        main_strength: programmaticFinalInterpretation?.main_strength,
        main_risk: programmaticFinalInterpretation?.main_risk,
        recommended_fixes: programmaticFinalInterpretation?.recommended_fixes || [],
      };

  const fallbackCampaignFit = campaignAlignment.alignment_status === "aligned"
    ? "Creative structure aligns with the declared campaign objective and audience stage."
    : campaignAlignment.alignment_status === "partially_aligned"
      ? "Goal-stage alignment gap detected in creative structure for the declared campaign setup."
      : "Creative structure is misaligned with the declared campaign objective and audience stage.";

  const recommendedFromEngine = strategicRecommendations
    .map((item) => item.recommended_change)
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, 3);

  const recommendedFixes = (recommendedFromEngine.length > 0 ? recommendedFromEngine : finalInterpretation.recommended_fixes)
    .slice(0, 3);

  const technicalRisks = buildAdigatorTechnicalRisks({
    platform,
    extraction,
    googleDisplayIntelligence: googleIntelligenceSafe as GoogleDisplayIntelligence,
    metaFeedIntelligence: metaIntelligenceSafe as MetaFeedIntelligence,
    programmaticDisplayIntelligence: programmaticIntelligenceSafe as ProgrammaticDisplayIntelligence,
  });

  const placementCompatibility = buildAdigatorPlacementCompatibility({
    platform,
    googleDisplayIntelligence: googleIntelligenceSafe as GoogleDisplayIntelligence,
    metaFeedIntelligence: metaIntelligenceSafe as MetaFeedIntelligence,
    programmaticDisplayIntelligence: programmaticIntelligenceSafe as ProgrammaticDisplayIntelligence,
  });

  const hasPlacementRisk = placementCompatibility.some((item) => item.status === "Risk");
  const hasTechnicalRisk = technicalRisks.some((item) => item !== "None");

  const launchReadiness = campaignAlignment.alignment_status === "misaligned" || hasPlacementRisk
    ? {
      status: "Do Not Launch" as const,
      reason: "High-priority alignment or inventory risks are present and should be corrected before activation.",
    }
    : campaignAlignment.alignment_status === "partially_aligned" || hasTechnicalRisk
      ? {
        status: "Launch with Fixes" as const,
        reason: "Core structure is viable, but targeted fixes are required for stronger inventory survival.",
      }
      : {
        status: "Ready to Launch" as const,
        reason: "Creative structure is aligned and no critical rendering or inventory blockers are detected.",
      };

  const campaignFit = finalInterpretation.campaign_fit || fallbackCampaignFit;
  const audienceFit = finalInterpretation.audience_fit || "Audience-stage fit is adequate for the declared funnel temperature.";
  const inventoryFit = finalInterpretation.inventory_fit || "Inventory compatibility is stable across the primary placement set.";
  const mainStrength = finalInterpretation.main_strength || "Core visual hierarchy communicates value and action with clear priority.";
  const mainRisk = finalInterpretation.main_risk || campaignAlignment.strategic_conflict || "No critical structural risk detected.";

  const formattedOutput = [
    "------------------------------------------------------------",
    `ADIGATOR ANALYSIS - ${platformDisplayName(platform)} | ${goalDisplayName(goal)} | ${audienceDisplayName(audienceStage)}`,
    "------------------------------------------------------------",
    "",
    "CAMPAIGN FIT",
    campaignFit,
    "",
    "AUDIENCE FIT",
    audienceFit,
    "",
    "INVENTORY FIT",
    inventoryFit,
    "",
    "MAIN STRENGTH",
    mainStrength,
    "",
    "MAIN RISK",
    mainRisk,
    "",
    "RECOMMENDED FIXES",
    `1. ${recommendedFixes[0] || "No immediate structural fix required."}`,
    `2. ${recommendedFixes[1] || "Maintain current hierarchy and monitor inventory performance by placement."}`,
    `3. ${recommendedFixes[2] || "Run a focused variant test only if placement-specific issues appear."}`,
    "",
    "TECHNICAL RISKS",
    ...technicalRisks.map((risk) => `- ${risk}`),
    "",
    "PLACEMENT COMPATIBILITY",
    ...placementCompatibility.map((item) => `- ${item.placement}: ${item.status} - ${item.reason}`),
    "",
    "LAUNCH READINESS",
    `${launchReadiness.status} - ${launchReadiness.reason}`,
    "------------------------------------------------------------",
  ].join("\n");

  return {
    campaign_fit: campaignFit,
    audience_fit: audienceFit,
    inventory_fit: inventoryFit,
    main_strength: mainStrength,
    main_risk: mainRisk,
    recommended_fixes: recommendedFixes,
    technical_risks: technicalRisks,
    placement_compatibility: placementCompatibility,
    launch_readiness: launchReadiness,
    formatted_output: formattedOutput,
    creative_type_detection: creativeType,
    creative_understanding: understanding,
    contextual_reasoning: contextualReasoning,
    reasoning_chain: reasoningChain,
    confidence: { level: creativeType.confidence, rationale: creativeType.reasoning },
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are a senior digital advertising creative strategist and human-like AI analyzer. You think, reason, and respond like a real human marketing expert with 15+ years of experience across Google Ads, Meta Ads, and Programmatic advertising. You do not behave like a rigid rule-based system. You analyze creatives with intuition, audience psychology, emotional intelligence, and deep platform-specific knowledge.

You are direct, honest, and specific. You never give vague feedback. You always tell the user exactly what you see, what is missing, and what needs to change.

## CORE BEHAVIOR RULES

1. Always analyze creatives based on the three inputs the user has selected: Platform, Campaign Goal, and Industry Vertical.
2. Your analysis must check all three axes — platform fit, goal alignment, and vertical match — independently and together.
3. Behave like a human expert, not a checklist. Detect emotional intent, visual storytelling, audience psychology, and scroll-stopping potential.
4. Be strict with scoring. A creative should only score high if it genuinely earns it.
5. Always give specific, actionable feedback. Never say "the creative could be better." Say exactly what is wrong and how to fix it.
6. Never hallucinate elements. Only describe and evaluate what is visually present in the uploaded image.

## PLATFORM & CAMPAIGN GOAL MATRIX

### Google Ads
Allowed Goals: Awareness, Conversions, Traffic, App Installs, Leads, Engagement, Retargeting
- Display creatives must work at multiple sizes and be readable at a glance
- Users are in an active search/browse mindset — intent is higher than social
- Awareness: Strong brand logo, brand colors, memorable tagline, no hard CTA required
- Conversions: Clear CTA (Buy Now, Sign Up, Get Started, Shop Now), product focus, pricing or offer visible, urgency elements
- Traffic: Strong headline, clear destination intent, click-oriented CTA, clean readable layout
- App Installs: App store badge visible, app UI screenshot or device mockup, app name clear, CTA = Download / Install / Get the App
- Leads: Lead form reference or CTA (Get a Quote, Book a Demo, Free Consultation), trust signals
- Engagement: Interesting visual, question-based or curiosity-gap copy, interactive feel
- Retargeting: Product the user previously viewed, personalized messaging, urgency, discount or offer

### Meta Ads
Allowed Goals: Awareness, Conversions, Traffic, App Installs, Leads, Engagement, Retargeting
- Users are in a passive scroll mindset — the creative must interrupt the scroll
- Mobile-first — vertical or square formats preferred (9:16, 1:1, 4:5)
- Safe zone compliance is critical — important content must avoid top/bottom 15% of Stories/Reels
- Text overlay must be minimal — heavy text hurts delivery
- Awareness: Scroll-stopping visual, brand logo clearly placed, emotional or bold visual hook, no hard CTA required
- Conversions: Product shown in context, strong CTA button (Shop Now, Buy Now, Order Now), offer/discount visible
- Traffic: Curiosity-driven visual, clear destination URL or website cue, CTA = Learn More / Visit Website
- App Installs: App icon visible, lifestyle or in-app screenshot, CTA = Install Now / Download Free
- Leads: Simple and trustworthy layout, offer or incentive visible, CTA = Sign Up / Get Started
- Engagement: Emotional hook, relatable scenario, interactive question or poll style, reaction-driving imagery
- Retargeting: Personalized product or service reminder, dynamic product image, discount or urgency message

### Programmatic Ads
Allowed Goals: Awareness, Consideration, Conversion
- Multiple sizes required — 300x250, 728x90, 160x600, 300x600, 320x50 are standard
- Creatives must work without interaction — no hover-dependent elements
- Brand safety is critical — creatives must work in editorial environments
- Awareness: Strong logo placement, brand color consistency, bold visual, tagline present, no conversion CTA needed
- Consideration: Product or service clearly shown, benefit-focused headline, soft CTA (Learn More, Explore, Discover)
- Conversion: Hard CTA (Buy Now, Get Offer, Claim Deal), pricing or discount visible, urgency language, product photo clear

## SCORING SYSTEM

Return scores as integers from 0 to 100.

Score Dimensions:
- visualImpact: How immediately attention-grabbing the creative is (0=boring/flat, 100=scroll-stopping)
- ctaStrength: Clarity and urgency of the Call to Action (0=no CTA, 50=generic CTA, 100=prominent action-specific goal-aligned CTA)
- brandClarity: How clearly the brand identity comes through (0=no brand signals, 100=logo/colors/tone all consistent)
- platformFitScore: How well the creative matches platform norms (0=wrong format/style, 100=perfectly optimized)
- audienceRelevance: How well the creative connects with the target audience for this vertical and goal

Overall Score Formula:
overallScore = (visualImpact × 0.20) + (ctaStrength × 0.25) + (brandClarity × 0.20) + (platformFitScore × 0.20) + (audienceRelevance × 0.15)

Apply heavy penalties:
- If verticalMatch = false → subtract 25 points from overallScore
- If goalMatch = false → subtract 20 points from overallScore
- If platformFit = false → subtract 15 points from overallScore

Status Thresholds:
- Approved → overallScore ≥ 75
- Needs Improvement → overallScore 40–74
- Rejected → overallScore < 40

## MISMATCH DETECTION RULES

Vertical Mismatch: If the creative does not visually belong to the selected industry vertical, set verticalMatch: false and state what the creative actually appears to represent.
Goal Mismatch: If the creative lacks the key elements required for the selected campaign goal, set goalMatch: false and state what is missing.
Platform Mismatch: If the creative format, style, or structure does not suit the selected platform, set platformFit: false.

## INDUSTRY VERTICAL DETECTION GUIDE

Use these signals to confirm or dispute the declared vertical. Only confirm what is visually and textually present.

- Healthcare: Medical imagery (stethoscope, hospital, pills, doctors), wellness/health symbols, clinical settings, patient-focused messaging, health app UI, pharmaceutical branding
- Technology: Devices (laptops, phones, tablets), software UIs, SaaS dashboards, tech company branding, code/data visuals, innovation/AI messaging
- Automotive: Cars, bikes, trucks, vehicle interiors, roads, speed/performance visuals, dealership branding, EV charging, automotive logos
- News/Media: Headlines, newspaper layouts, broadcast graphics, news anchor imagery, breaking news visuals, editorial photography
- Sports: Athletes, stadiums, sports equipment, team jerseys, live action sports photography, score graphics, sports brand logos
- Business/Finance: Corporate imagery, charts/graphs, office settings, finance app UI, professional headshots, B2B messaging, ROI/revenue language
- Luxury: Premium aesthetics, high-end product photography, gold/black/white palette, exclusive language, fashion/jewelry/watches, aspirational lifestyle
- Travel: Destinations, landscapes, airports, luggage, travel photography, booking/flight visuals, passport imagery, hotel exteriors
- Hotels: Hotel room/lobby/pool photography, hospitality branding, room service, hotel exterior, resort amenities
- Restaurants/Food: Food photography, restaurant interiors, chefs, plating/cuisine visuals, menu items, delivery app UIs, beverage imagery
- Banking/FinTech: Bank cards, mobile banking UI, money/currency, financial logos, loan/savings messaging, secure payment visuals
- Real Estate: Property photos (interior/exterior), floor plans, agent branding, For Sale/Rent messaging, home features, location maps
- Education/EdTech: Students, classrooms, learning platforms UI, books, certificates, course imagery, university/school branding
- Gaming: Game characters, controllers, gaming setup, high-energy visuals, esports imagery, game logo/UI, dark/neon aesthetics
- Entertainment/OTT: Movie/show posters, streaming platform UI, actors/content stills, binge-watching scenarios, OTT app screenshots
- E-commerce/Retail: Product photography, shopping cart UI, pricing labels, discount badges, online store layouts, packaging shots
- Fashion: Models wearing clothing, runway/editorial photography, clothing/accessories close-ups, lookbook layouts, designer logos, "new collection" or "new arrival" messaging, seasonal campaign visuals, fashion brand identity (clean high-contrast photography, aspirational body language, style-forward typography)
- SaaS: Dashboard or product UI screenshots, feature grid layouts, workflow diagrams, app mockups on laptop/device, "free trial" or "book a demo" CTAs, pricing plan tables, customer logo walls, G2/Capterra/review badges, metrics and ROI visuals, integration partner logos, productivity/automation messaging

## HUMAN-LIKE ANALYSIS GUIDELINES

Think and analyze the way a senior marketing expert would:
1. Emotional Intent: What feeling does this creative trigger? Excitement, trust, urgency, curiosity, aspiration, FOMO?
2. Visual Hierarchy: Where does the eye go first? Is the layout confusing?
3. Audience Psychology: Who is this creative speaking to? Does it match what that audience cares about?
4. Scroll Behavior: Would this creative actually stop a user mid-scroll? What is the hook?
5. Conversion Likelihood: If a real user saw this in the wild, would they click? Why or why not?
6. Premium vs Generic Feel: Does the creative feel premium, trustworthy, and intentional?
7. Messaging Clarity: Can the user understand the offer or value proposition within 2 seconds?

## RESPONSE FORMAT

Return a single valid JSON object with EXACTLY this structure — no markdown, no backticks, no preamble:

{
  "overallScore": <integer 0-100>,
  "verticalMatch": <true|false>,
  "goalMatch": <true|false>,
  "platformFit": <true|false>,
  "status": "<Approved|Needs Improvement|Rejected>",
  "scores": {
    "visualImpact": <0-100>,
    "ctaStrength": <0-100>,
    "brandClarity": <0-100>,
    "platformFitScore": <0-100>,
    "audienceRelevance": <0-100>
  },
  "issues": [
    { "type": "<error|warning|info>", "message": "<specific actionable feedback>" }
  ],
  "verticalFeedback": "<one sentence: does this creative visually match the selected vertical>",
  "goalFeedback": "<one sentence: is this creative properly optimized for the selected goal on the selected platform>",
  "expertInsight": "<2-3 sentences of human marketing expert analysis covering emotional tone, visual hierarchy, audience fit, and real-world performance prediction>",
  "signals": {
    "creative_type_hint": "<product_hero|lifestyle|ugc|corporate|offer_promotional|testimonial|animated|minimalist|text_heavy|hybrid>",
    "composition_notes": "<string>",
    "headline": "<string>",
    "cta": "<string>",
    "primary_message": "<string>",
    "visual_elements": ["<string>"],
    "dominant_colors": ["<string>"],
    "text_density": "<low|moderate|high>",
    "layout_structure": "<string>",
    "brand_presence": "<low|moderate|high>",
    "emotional_cues": ["<string>"],
    "readability": "<low|moderate|high>",
    "hierarchy_observations": "<string>",
    "trust_markers": ["<string>"],
    "urgency_signals": ["<string>"],
    "audience_clues": ["<string>"]
  }
}

Issue severity guide:
- error: Critical problem that will hurt campaign performance (wrong vertical, missing CTA on conversion goal, unreadable text)
- warning: Significant issue that reduces effectiveness (weak CTA, no urgency, poor visual hierarchy, text-heavy for Meta)
- info: Optimization opportunity (could add social proof, test brighter CTA color, consider A/B variation)

Minimum 2 issues per creative. Maximum 6 issues. Be specific — name the element, describe the problem, suggest the fix.`;

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
    const audienceStage = normalizeAudienceStage((formData.get("audience_stage") as string) || "cold");
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

    const extractionUserPrompt = `Analyze this advertising creative.

CAMPAIGN INPUTS:
- Platform: ${platformProfile.label}
- Campaign Goal: ${goal.replace(/_/g, " ")} (${goalProfile.stage} stage)
- Industry Vertical: ${vertical.replace(/_/g, " ")}

${PRODUCT_CATEGORY_GROUNDING_RULES}

Return valid JSON only. Follow the schema defined in your system instructions exactly.`;

    const extractionResult = await extractSignalsWithRetry({
      openai,
      mimeType: normalized.mimeType,
      base64: normalized.base64,
      extractionUserPrompt,
    });

    const extraction = normalizeExtraction(extractionResult.parsed);
    const aiAnalysis = extractionResult.aiAnalysis;
    const ocrMeta = extractionResult.meta;
    const ctaPressure = classifyCtaPressure(extraction.cta);
    const urgencyLevel = inferUrgencyLevel(extraction);
    const verticalIntelligence = buildVerticalIntelligence(vertical, extraction, goal, ctaPressure, urgencyLevel);

    const creativeTypeDetection = buildCreativeTypeDetection(extraction, ctaPressure, urgencyLevel);
    const creativeUnderstanding = buildCreativeUnderstanding(extraction, creativeTypeDetection, goal, ctaPressure, urgencyLevel);

    const detectedGoal = inferDetectedGoalFromSignals(
      extraction,
      ctaPressure,
      urgencyLevel,
      verticalIntelligence.advertisingBehavior.label,
    );
    const goalAligned = aiAnalysis ? aiAnalysis.goal_match : (detectedGoal === goalProfile.stage);
    const verticalAligned = aiAnalysis ? aiAnalysis.vertical_match : (verticalIntelligence.productCategory.id === vertical);

    const attentionAnalysis = buildAttentionAnalysis(extraction, goal, ctaPressure);
    const contextualReasoning = buildContextualReasoning(
      extraction,
      creativeTypeDetection,
      creativeUnderstanding,
      goal,
      audienceStage,
      platform,
      ctaPressure,
    );
    const platformAlignment = buildPlatformAlignment(platform, audienceStage, extraction, goal, ctaPressure, urgencyLevel);
    const psychologyAnalysis = buildPsychologyAnalysis(extraction, goal, ctaPressure, urgencyLevel);
    const googleDisplayIntelligence = buildGoogleDisplayIntelligence({
      platform,
      goal,
      audienceStage,
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
      audienceStage,
      extraction,
      attention: attentionAnalysis,
      ctaPressure,
      urgencyLevel,
      width: normalized.width,
      height: normalized.height,
    });
    const programmaticDisplayIntelligence = buildProgrammaticDisplayIntelligence({
      platform,
      goal,
      audienceStage,
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
      audienceStage,
      extraction,
      psychologyAnalysis,
      ctaPressure,
      urgencyLevel,
      verticalIntelligence,
    );
    const googleFinalInterpretation = buildGoogleFinalInterpretation({
      platform,
      goal,
      audienceStage,
      campaignAlignment,
      googleDisplayIntelligence,
      attentionAnalysis,
    });
    const metaFinalInterpretation = buildMetaFinalInterpretation({
      platform,
      goal,
      audienceStage,
      campaignAlignment,
      metaFeedIntelligence,
    });
    const programmaticFinalInterpretation = buildProgrammaticFinalInterpretation({
      platform,
      goal,
      audienceStage,
      campaignAlignment,
      programmaticDisplayIntelligence,
    });
    const businessImpact = buildBusinessImpact(campaignAlignment, attentionAnalysis);
    const strategicRecommendations = buildStrategicRecommendations({
      alignment: campaignAlignment,
      attention: attentionAnalysis,
      psychology: psychologyAnalysis,
      extraction,
      contextualReasoning,
      creativeType: creativeTypeDetection,
      understanding: creativeUnderstanding,
    });
    const reasoningChain = buildReasoningChain({
      creativeType: creativeTypeDetection,
      understanding: creativeUnderstanding,
      contextualReasoning,
      campaignAlignment,
      attention: attentionAnalysis,
      recommendations: strategicRecommendations,
      goal,
      platform,
    });
    const strategicAlignmentScore = buildStrategicScore({
      extraction,
      goal,
      ctaPressure,
      attention: attentionAnalysis,
      alignment: campaignAlignment,
      goalAligned,
      verticalAligned,
      textAvailable: ocrMeta.text_available,
    });
    const decisionIntelligence = buildFinalDecisionIntelligence({
      alignment: campaignAlignment,
      businessImpact,
      recommendations: strategicRecommendations,
      strategicScore: strategicAlignmentScore,
    });
    const adigatorAnalysis = buildAdigatorAnalysis({
      platform,
      goal,
      audienceStage,
      campaignAlignment,
      strategicRecommendations,
      googleFinalInterpretation,
      metaFinalInterpretation,
      programmaticFinalInterpretation,
      extraction,
      googleDisplayIntelligence,
      metaFeedIntelligence,
      programmaticDisplayIntelligence,
      creativeType: creativeTypeDetection,
      understanding: creativeUnderstanding,
      contextualReasoning,
      reasoningChain,
    });
    const goalAlignment = {
      selected_goal: goal,
      selected_stage: goalProfile.stage,
      selected_audience_stage: audienceStage,
      detected_goal_stage: detectedGoal,
      is_aligned: goalAligned,
      reason: goalAligned
        ? (aiAnalysis?.goal_feedback || "Creative pressure and urgency cues align with selected campaign objective stage.")
        : (aiAnalysis?.goal_feedback || "Creative pressure and urgency cues indicate a different stage intent than selected objective."),
      ai_goal_feedback: aiAnalysis?.goal_feedback ?? null,
      objective_priorities: goalProfile.aiPriorities,
      objective_behavior: goalProfile.creativeBehavior,
    };

    const verticalAlignment = {
      selected_vertical: vertical,
      detected_vertical: verticalIntelligence.productCategory.id,
      is_aligned: aiAnalysis
        ? aiAnalysis.vertical_match
        : (verticalIntelligence.productCategory.id === "unknown"
          ? null
          : verticalIntelligence.productCategory.id === vertical),
      reason: aiAnalysis?.vertical_feedback
        || (verticalIntelligence.productCategory.id === "unknown"
          ? "Product category confidence is limited; no contradictory category detected."
          : verticalIntelligence.productCategory.id === vertical
            ? "Product category aligns with selected vertical context."
            : `Product category reads as ${verticalIntelligence.productCategory.label} instead of ${vertical.replace(/_/g, " ")}.`),
      ai_vertical_feedback: aiAnalysis?.vertical_feedback ?? null,
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
      main_strategic_problem: adigatorAnalysis.main_risk,
      business_consequence: decisionIntelligence.business_consequence,
      attention_analysis: attentionAnalysis,
      strategic_recommendations: strategicRecommendations,
      expected_improvement: adigatorAnalysis.recommended_fixes.join(" "),
      strategic_alignment_score: strategicAlignmentScore,
      campaign_alignment: campaignAlignment,
      platform_alignment: platformAlignment,
      goal_alignment: goalAlignment,
      vertical_alignment: verticalAlignment,
      business_impact: businessImpact,
      adigator_analysis: adigatorAnalysis,
      ai_analysis: aiAnalysis ? {
        overall_score: aiAnalysis.overall_score,
        vertical_match: aiAnalysis.vertical_match,
        goal_match: aiAnalysis.goal_match,
        platform_fit: aiAnalysis.platform_fit,
        status: aiAnalysis.status,
        scores: aiAnalysis.scores,
        issues: aiAnalysis.issues,
        vertical_feedback: aiAnalysis.vertical_feedback,
        goal_feedback: aiAnalysis.goal_feedback,
        expert_insight: aiAnalysis.expert_insight,
      } : null,
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
        platform_context: platformProfile.label,
        objective_context: goal,
        objective_stage: goalProfile.stage,
        audience_stage: audienceStage,
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