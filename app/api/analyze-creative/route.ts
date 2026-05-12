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
type CampaignGoal = "awareness" | "consideration" | "conversion";
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
  image_dominance?: string;
  visual_contrast?: string;
  object_scale?: string;
  cta_placement?: string;
  typography_weight?: string;
  framing?: string;
  whitespace_balance?: string;
  directional_hierarchy?: string;
  confidence?: "strong" | "moderate" | "weak";
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

interface BusinessImpact {
  likely_effects: string[];
  affected_metrics: string[];
  funnel_risk: string;
  engagement_risk: string;
  conversion_risk: string;
  brand_perception_risk: string;
}

interface StrategicRecommendation {
  core_problem: string;
  why_it_happens: string;
  business_risk: string;
  exact_fix: string;
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
  confidence: "strong" | "moderate" | "weak";
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

interface ProductCategory {
  label: string;
  confidence: "strong" | "moderate" | "weak";
  evidence: string[];
}

interface AdvertisingBehavior {
  label: string;
  confidence: "strong" | "moderate" | "weak";
  reason: string;
}

interface AudienceInterpretationBlock {
  likely_interpretation: string;
  readiness_stage: string;
  trust_perception: string;
  confidence: "strong" | "moderate" | "weak";
}

const KNOWN_GOALS = new Set<CampaignGoal>(["awareness", "consideration", "conversion"]);

const VERTICAL_DETECTION_HINTS: Record<string, string[]> = {
  healthcare: ["hospital", "clinic", "doctor", "medical", "patient", "wellness", "care", "treatment", "pharma", "health"],
  technology: ["software", "saas", "platform", "cloud", "ai", "app", "tech", "automation", "digital"],
  automotive: ["car", "vehicle", "suv", "sedan", "drive", "engine", "mileage", "dealership", "auto"],
  news_media: ["news", "headline", "breaking", "journal", "editorial", "media", "publisher"],
  sports: ["sports", "team", "match", "league", "athlete", "fitness", "score", "stadium"],
  finance: ["finance", "investment", "portfolio", "market", "enterprise", "profit", "revenue"],
  luxury: ["luxury", "premium", "exclusive", "craftsmanship", "heritage", "elite", "high-end"],
  travel: ["travel", "destination", "trip", "vacation", "holiday", "flight", "journey", "tour"],
  hotels: ["hotel", "resort", "suite", "booking", "stay", "hospitality", "check-in"],
  food: ["restaurant", "food", "menu", "dining", "meal", "chef", "delivery", "cuisine"],
  banking: ["bank", "fintech", "account", "loan", "credit", "debit", "secure", "payment", "wallet"],
  real_estate: ["real estate", "property", "home", "mortgage", "apartment", "listing", "broker", "rent"],
  education: ["education", "course", "learn", "student", "academy", "school", "training", "certification"],
  gaming: ["game", "gaming", "play", "level", "esports", "console", "battle", "stream"],
  entertainment: ["streaming", "ott", "entertainment", "show", "movie", "series", "music", "watch"],
  ecommerce: ["shop", "store", "cart", "checkout", "sale", "discount", "product", "retail", "buy"],
};

const KNOWN_VERTICALS = new Set(Object.keys(VERTICAL_DETECTION_HINTS));

const PRODUCT_CATEGORY_HINTS: Record<string, string[]> = {
  beverage: ["coffee", "drink", "beverage", "latte", "espresso", "tea", "smoothie"],
  restaurants_food: ["burger", "pizza", "restaurant", "menu", "dining", "food", "chef"],
  education: ["course", "academy", "student", "certification", "learn", "education", "training"],
  fashion: ["fashion", "style", "outfit", "wear", "apparel", "wardrobe"],
  travel: ["travel", "trip", "destination", "hotel", "flight", "vacation"],
  automotive: ["car", "vehicle", "suv", "drive", "auto", "dealership"],
  finance: ["bank", "loan", "credit", "account", "payment", "portfolio", "fintech"],
  software: ["saas", "platform", "software", "dashboard", "workflow", "automation", "app"],
};

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  beverage: "Coffee / Beverage",
  restaurants_food: "Restaurants / Food",
  education: "Education",
  fashion: "Fashion",
  travel: "Travel",
  automotive: "Automotive",
  finance: "Finance / Banking",
  software: "Software / SaaS",
};

const GOAL_INTELLIGENCE_PROFILE: Record<CampaignGoal, { expectedCtaPressure: CtaPressure; urgencyTolerance: SignalLevel; preferredEmotions: string[] }> = {
  awareness: {
    expectedCtaPressure: "soft",
    urgencyTolerance: "low",
    preferredEmotions: ["curiosity", "trust", "aspiration", "confidence"],
  },
  consideration: {
    expectedCtaPressure: "moderate",
    urgencyTolerance: "moderate",
    preferredEmotions: ["trust", "confidence", "authority", "clarity"],
  },
  conversion: {
    expectedCtaPressure: "aggressive",
    urgencyTolerance: "high",
    preferredEmotions: ["urgency", "confidence", "trust", "action"],
  },
};

function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function normalizeGoal(goal: string): CampaignGoal {
  const cleaned = (goal || "").toLowerCase().trim();
  return KNOWN_GOALS.has(cleaned as CampaignGoal) ? (cleaned as CampaignGoal) : "awareness";
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
  if (/buy|book|claim|get started|sign up|download now|shop now|apply now/.test(text)) {
    return "aggressive";
  }
  if (/view|compare|see pricing|check|try demo|learn how/.test(text)) {
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

  if (/limited|ends today|last chance|hurry|only today|countdown|now/.test(corpus)) {
    return "high";
  }
  if (/soon|this week|don.t miss|book early/.test(corpus)) {
    return "moderate";
  }
  return "low";
}

function detectVerticalFromSignals(selectedVertical: string, extraction: ExtractionSignals): { detectedVertical: string; fitScore: number; evidence: string[] } {
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.visual_elements.join(" "),
    extraction.audience_clues.join(" "),
  ].join(" ").toLowerCase();

  let bestVertical = selectedVertical;
  let bestScore = -1;

  for (const [candidate, hints] of Object.entries(VERTICAL_DETECTION_HINTS)) {
    const score = hints.reduce((acc, keyword) => acc + (corpus.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestVertical = candidate;
    }
  }

  const selectedHints = VERTICAL_DETECTION_HINTS[selectedVertical] ?? [];
  const matchedEvidence = selectedHints.filter((keyword) => corpus.includes(keyword)).slice(0, 4);
  const fitScore = selectedHints.length === 0
    ? 50
    : Math.round((matchedEvidence.length / selectedHints.length) * 100);

  return {
    detectedVertical: bestScore <= 0 ? "unknown" : bestVertical,
    fitScore,
    evidence: matchedEvidence,
  };
}

function confidenceFromEvidence(evidenceCount: number, score?: number): "strong" | "moderate" | "weak" {
  if (typeof score === "number" && score >= 75) return "strong";
  if (typeof score === "number" && score >= 45) return "moderate";
  if (evidenceCount >= 3) return "strong";
  if (evidenceCount >= 1) return "moderate";
  return "weak";
}

function detectProductCategory(extraction: ExtractionSignals, selectedVertical: string): ProductCategory {
  const corpus = [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.visual_elements.join(" "),
    extraction.audience_clues.join(" "),
  ].join(" ").toLowerCase();

  let bestKey = "";
  let bestScore = 0;
  const evidenceByKey: Record<string, string[]> = {};

  for (const [key, hints] of Object.entries(PRODUCT_CATEGORY_HINTS)) {
    const evidence = hints.filter((hint) => corpus.includes(hint));
    evidenceByKey[key] = evidence;
    if (evidence.length > bestScore) {
      bestScore = evidence.length;
      bestKey = key;
    }
  }

  const verticalFallback: Record<string, string> = {
    food: "restaurants_food",
    hotels: "travel",
    travel: "travel",
    education: "education",
    automotive: "automotive",
    finance: "finance",
    banking: "finance",
    technology: "software",
    ecommerce: "fashion",
  };

  const selectedFallback = verticalFallback[selectedVertical] || "software";
  const finalKey = bestScore > 0 ? bestKey : selectedFallback;
  const evidence = (evidenceByKey[finalKey] || []).slice(0, 4);

  return {
    label: PRODUCT_CATEGORY_LABELS[finalKey] || "General Consumer Product",
    confidence: confidenceFromEvidence(evidence.length),
    evidence,
  };
}

function detectAdvertisingBehavior(params: {
  extraction: ExtractionSignals;
  goal: CampaignGoal;
  ctaPressure: CtaPressure;
  selectedVertical: string;
  productCategory: ProductCategory;
}): AdvertisingBehavior {
  const { extraction, goal, ctaPressure, selectedVertical, productCategory } = params;
  const corpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();
  const hasDiscount = /discount|save|offer|% off|sale|deal/.test(corpus);
  const hasUrgency = /limited|today|now|last chance|hurry/.test(corpus);
  const hasAuthority = /certified|trusted|expert|official|award|proven/.test(corpus) || extraction.trust_markers.length >= 2;
  const hasLifestyle = /premium|exclusive|crafted|signature|lifestyle/.test(corpus);

  if (hasDiscount && (ctaPressure === "aggressive" || hasUrgency)) {
    return {
      label: "Discount-led DTC promotion",
      confidence: "strong",
      reason: "Offer-first and urgency cues dominate the hierarchy.",
    };
  }

  if (goal === "conversion" && ctaPressure === "aggressive") {
    return {
      label: "Ecommerce conversion advertising",
      confidence: "strong",
      reason: "Direct response CTA pressure drives immediate transaction behavior.",
    };
  }

  if ((selectedVertical === "food" || selectedVertical === "hotels" || selectedVertical === "travel") && ctaPressure !== "aggressive") {
    return {
      label: "Hospitality storytelling",
      confidence: "moderate",
      reason: "Category cues are foregrounded before direct transactional pressure.",
    };
  }

  if ((selectedVertical === "education" || selectedVertical === "finance" || selectedVertical === "banking") && hasAuthority) {
    return {
      label: "Authority-led education marketing",
      confidence: "moderate",
      reason: "Trust markers and credibility framing lead the message behavior.",
    };
  }

  if (hasLifestyle && selectedVertical === "luxury") {
    return {
      label: "Lifestyle aspiration advertising",
      confidence: "moderate",
      reason: "Premium identity framing is prioritized over direct transaction messaging.",
    };
  }

  if (productCategory.label === "Coffee / Beverage" && ctaPressure === "aggressive") {
    return {
      label: "Impulse-purchase promotion",
      confidence: "moderate",
      reason: "Product appetite cues are paired with immediate action pressure.",
    };
  }

  return {
    label: "Informational category promotion",
    confidence: "weak",
    reason: "Creative signals do not strongly resolve to a single commercial behavior type.",
  };
}

function buildAttentionAnalysis(extraction: ExtractionSignals, ctaPressure: CtaPressure): AttentionAnalysis {
  const visualCorpus = extraction.visual_elements.join(" ").toLowerCase();
  const hierarchyCorpus = extraction.hierarchy_observations.toLowerCase();
  const layoutCorpus = extraction.layout_structure.toLowerCase();
  const ctaLower = extraction.cta.toLowerCase();

  const imageDominance = visualCorpus.includes("hero") || visualCorpus.includes("product") || visualCorpus.includes("close")
    ? "Primary product image dominates first fixation."
    : extraction.headline
      ? "Headline block is the first dominant anchor."
      : "No clear dominant element; entry point is split.";

  const visualContrast = extraction.dominant_colors.length >= 3
    ? "High contrast palette creates multiple competing anchors."
    : "Contrast profile is restrained and supports single-path scanning.";

  const objectScale = /close|macro|large|full/i.test(visualCorpus)
    ? "Object scale is oversized relative to supporting copy."
    : "Object scale is balanced with surrounding copy blocks.";

  const ctaPlacement = /top|above/i.test(`${hierarchyCorpus} ${layoutCorpus}`)
    ? "CTA appears early in the scan path."
    : /bottom|footer|below/i.test(`${hierarchyCorpus} ${layoutCorpus}`)
      ? "CTA appears after message framing."
      : ctaPressure === "aggressive" || /buy|shop|claim|apply|sign up|book/.test(ctaLower)
        ? "CTA behaves as a high-salience conversion anchor."
        : "CTA is present but not clearly anchored to the primary focal zone.";

  const typographyWeight = extraction.text_density === "high"
    ? "Typography weight is heavy and competes with imagery."
    : extraction.text_density === "low"
      ? "Typography footprint is light and image-led."
      : "Typography and imagery are in moderate balance.";

  const framing = /circle|frame|boxed|card/i.test(layoutCorpus)
    ? "Framing creates contained attention pockets."
    : "Open framing with broader visual spread.";

  const whitespace = extraction.text_density === "high"
    ? "Whitespace is compressed, reducing scan recovery."
    : extraction.text_density === "low"
      ? "Whitespace supports clear scanning lanes."
      : "Whitespace is serviceable but not strongly directional.";

  const directionalHierarchy = hierarchyCorpus.includes("unclear")
    ? "Directional hierarchy is fragmented."
    : hierarchyCorpus.includes("strong")
      ? "Directional hierarchy is coherent from anchor to action."
      : "Directional hierarchy is moderate with minor scan detours.";

  const firstFocus = imageDominance.toLowerCase().includes("headline")
    ? "headline"
    : imageDominance.toLowerCase().includes("product")
      ? "product image"
      : "mixed entry point";

  const frictionPoints: string[] = [];
  if (extraction.text_density === "high") frictionPoints.push("Copy density fragments hierarchy.");
  if (extraction.readability === "low") frictionPoints.push("Low legibility slows scanning.");
  if (ctaPlacement.includes("early") && ctaPressure !== "soft") frictionPoints.push("CTA pressure appears before message context.");
  if (directionalHierarchy.includes("fragmented")) frictionPoints.push("Directional flow is inconsistent.");

  const ctaVisibility = ctaPlacement;
  const mobileRisk = extraction.readability === "low" || extraction.text_density === "high"
    ? "Mobile scan risk is elevated due to compressed readability."
    : "Mobile scan risk is controlled.";
  const retentionRisk = frictionPoints.length >= 3
    ? "Retention risk is high; multiple hierarchy breaks appear before action."
    : frictionPoints.length >= 1
      ? "Retention risk is moderate; one or more hierarchy breaks reduce continuity."
      : "Retention risk is low; scan continuity is stable.";

  return {
    first_focus: firstFocus,
    attention_path: `${imageDominance} ${visualContrast} ${ctaPlacement}`,
    friction_points: frictionPoints,
    cta_visibility: ctaVisibility,
    mobile_attention_risk: mobileRisk,
    attention_retention_risk: retentionRisk,
    image_dominance: imageDominance,
    visual_contrast: visualContrast,
    object_scale: objectScale,
    cta_placement: ctaPlacement,
    typography_weight: typographyWeight,
    framing,
    whitespace_balance: whitespace,
    directional_hierarchy: directionalHierarchy,
    confidence: confidenceFromEvidence(3 - Math.min(2, frictionPoints.length)),
  } as AttentionAnalysis;
}

function buildPsychologyAnalysis(
  extraction: ExtractionSignals,
  goal: CampaignGoal,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel
): PsychologyAnalysis {
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
  if (goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    psychologicalConflict = "Awareness intent conflicts with high-pressure action cues, which can feel premature for cold audiences.";
  } else if (goal === "conversion" && ctaPressure === "soft") {
    psychologicalConflict = "Conversion intent conflicts with a low-pressure CTA, reducing action momentum at decision stage.";
  }

  const trustSignalStrength = extraction.trust_markers.length >= 3 || extraction.brand_presence === "high"
    ? "Trust signal strength is solid: credibility cues support decision confidence."
    : extraction.trust_markers.length > 0
      ? "Trust signal strength is partial: some reassurance is present but not dominant."
      : "Trust signal strength is weak: audience reassurance cues are limited or missing.";

  const urgencyFit = goal === "awareness" && urgencyLevel === "high"
    ? "Urgency is misfit for awareness. Pressure is likely to feel sales-heavy too early."
    : goal === "conversion" && urgencyLevel === "low"
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
  const likelyPerception = psychology.persuasion_style.includes("discount")
    ? "Reads as discount-first conversion advertising."
    : psychology.persuasion_style.includes("premium")
      ? "Reads as premium-positioned brand advertising."
      : "Reads as informational promotion with moderate action pressure.";

  const emotionalReaction = psychology.emotional_trigger === "neutral"
    ? "Interpretation is functional, not emotionally differentiated."
    : `Interpretation is anchored by ${psychology.emotional_trigger} cues.`;

  const motivationMatch = goal === "conversion" && extraction.cta
    ? "Cold audiences will read this as action-oriented if proof appears early."
    : goal === "awareness"
      ? "Cold audiences will read this as early-stage discovery if CTA pressure stays controlled."
      : "Cold audiences will read this as evaluation-stage messaging.";

  const resistanceReason = extraction.readability === "low"
    ? "Interpretation weakens because message decoding effort is high."
    : psychology.audience_resistance;

  const engagementBarrier = extraction.text_density === "high"
    ? "High text load breaks scan continuity."
    : extraction.readability === "low"
      ? "Low readability blocks fast comprehension."
      : "Primary barrier is persuasion clarity, not layout breakdown.";

  return {
    likely_perception: likelyPerception,
    emotional_reaction: emotionalReaction,
    motivation_match: motivationMatch,
    resistance_reason: resistanceReason,
    engagement_barrier: engagementBarrier,
  };
}

function buildAudienceInterpretation(params: {
  extraction: ExtractionSignals;
  goal: CampaignGoal;
  advertisingBehavior: AdvertisingBehavior;
  productCategory: ProductCategory;
  alignment: CampaignAlignment;
}): AudienceInterpretationBlock {
  const { extraction, goal, advertisingBehavior, productCategory, alignment } = params;
  const ctaAggressive = /buy|shop|claim|book|apply|sign up|get started/.test(extraction.cta.toLowerCase());

  const likelyInterpretation = `${productCategory.label} creative behaving as ${advertisingBehavior.label.toLowerCase()}.`;
  const readinessStage = goal === "awareness"
    ? (ctaAggressive ? "Cold traffic sees conversion pressure before category framing." : "Cold traffic sees top-funnel category framing.")
    : goal === "consideration"
      ? "Cold traffic sees evaluation-stage messaging with moderate action expectation."
      : "Cold traffic sees transaction-ready messaging.";
  const trustPerception = extraction.trust_markers.length >= 2 || extraction.brand_presence === "high"
    ? "Trust cues are visible enough to support first-pass evaluation."
    : "Trust cues are limited; interpretation relies on offer framing more than proof.";

  return {
    likely_interpretation: likelyInterpretation,
    readiness_stage: readinessStage,
    trust_perception: trustPerception,
    confidence: confidenceFromEvidence(
      (productCategory.evidence?.length || 0) + (alignment.alignment_status === "aligned" ? 1 : 0)
    ),
  };
}

function buildPersuasionFriction(params: {
  extraction: ExtractionSignals;
  goal: CampaignGoal;
  alignment: CampaignAlignment;
  attention: AttentionAnalysis;
  advertisingBehavior: AdvertisingBehavior;
}): { primary: string; items: string[]; confidence: "strong" | "moderate" | "weak" } {
  const { extraction, goal, alignment, attention, advertisingBehavior } = params;
  const items: string[] = [];
  const ctaAggressive = /buy|shop|claim|book|apply|sign up|get started/.test(extraction.cta.toLowerCase());

  if (goal === "awareness" && ctaAggressive) items.push("CTA introduced too early for awareness-stage sequencing.");
  if (alignment.alignment_status === "misaligned") items.push("Campaign intent and message behavior are misaligned.");
  if (attention.friction_points.length > 0) items.push(...attention.friction_points);
  if (extraction.readability === "low") items.push("Typography clarity is insufficient at feed-speed scanning.");
  if (advertisingBehavior.label.includes("Discount-led") && /luxury/.test(advertisingBehavior.reason.toLowerCase())) {
    items.push("Discount framing conflicts with premium identity expectations.");
  }
  if (items.length === 0) items.push("No major persuasion friction detected.");

  return {
    primary: items[0],
    items: items.slice(0, 5),
    confidence: confidenceFromEvidence(Math.min(3, items.length)),
  };
}

function buildCampaignAlignment(
  goal: CampaignGoal,
  selectedVertical: string,
  extraction: ExtractionSignals,
  psychology: PsychologyAnalysis,
  ctaPressure: CtaPressure,
  urgencyLevel: SignalLevel
): CampaignAlignment {
  const conflicts: string[] = [];
  const verticalDetection = detectVerticalFromSignals(selectedVertical, extraction);
  const goalProfile = GOAL_INTELLIGENCE_PROFILE[goal];

  if (goalProfile.expectedCtaPressure === "soft" && ctaPressure === "aggressive") {
    conflicts.push("CTA pressure is too aggressive for awareness-stage behavior.");
  }
  if (goalProfile.expectedCtaPressure === "aggressive" && ctaPressure === "soft") {
    conflicts.push("CTA pressure is too soft for conversion-stage action goals.");
  }
  if (goalProfile.urgencyTolerance === "low" && urgencyLevel === "high") {
    conflicts.push("Urgency cues are too strong for the selected campaign stage.");
  }
  if (selectedVertical === "luxury" && /discount|save|offer|% off/.test([extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase())) {
    conflicts.push("Luxury positioning conflicts with discount-heavy message behavior.");
  }
  if (verticalDetection.detectedVertical !== "unknown" && verticalDetection.detectedVertical !== selectedVertical && verticalDetection.fitScore < 40) {
    conflicts.push(`Creative signals resemble ${verticalDetection.detectedVertical} more than ${selectedVertical}.`);
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
  audienceInterpretation: AudienceInterpretationBlock;
  advertisingBehavior: AdvertisingBehavior;
  productCategory: ProductCategory;
  persuasionFriction: { primary: string; items: string[]; confidence: "strong" | "moderate" | "weak" };
}): StrategicRecommendation[] {
  const {
    alignment,
    attention,
    extraction,
    behavioralResponse,
    audienceInterpretation,
    advertisingBehavior,
    productCategory,
    persuasionFriction,
  } = params;

  const coreProblem = alignment.alignment_status === "aligned"
    ? `${productCategory.label} creative needs structural optimization for cleaner execution.`
    : `Creative behaves as ${advertisingBehavior.label.toLowerCase()} instead of selected campaign intent.`;
  const whyItHappens = `${attention.image_dominance || "Visual entry point is mixed."} ${attention.cta_placement || "CTA placement is unclear."} ${persuasionFriction.primary}`;
  const businessRisk = alignment.alignment_status === "misaligned"
    ? "Risk of low-quality traffic and weaker launch-readiness confidence."
    : attention.friction_points.length > 0
      ? "Risk of drop-off before the action moment, reducing efficient spend."
      : "Risk is moderate and tied to incremental hierarchy inefficiencies.";
  const exactFix = extraction.readability === "low"
    ? "Reduce text density, strengthen contrast on headline/CTA, and keep CTA adjacent to the strongest visual anchor."
    : attention.cta_placement?.includes("early")
      ? "Delay CTA salience until category framing and value proof are established in the first scan zone."
      : "Unify the visual anchor, remove competing copy blocks, and keep one dominant action path.";

  const confidence = confidenceFromEvidence(
    (attention.friction_points.length > 0 ? 1 : 0) +
    (alignment.alignment_status !== "aligned" ? 1 : 0) +
    (productCategory.evidence?.length || 0)
  );

  return [{
    core_problem: coreProblem,
    why_it_happens: whyItHappens,
    business_risk: businessRisk,
    exact_fix: exactFix,
    issue: coreProblem,
    why_it_hurts: whyItHappens,
    recommended_change: exactFix,
    expected_outcome: audienceInterpretation.readiness_stage,
    audience_reaction: audienceInterpretation.likely_interpretation,
    emotional_barrier: persuasionFriction.primary,
    missing_belief: audienceInterpretation.trust_perception,
    trust_signal_gap: behavioralResponse.trust_gap,
    behavior_change_after_intervention: "Cleaner stage fit and more consistent progression into action.",
    priority: alignment.alignment_status === "misaligned" ? "HIGH" : attention.friction_points.length > 0 ? "MEDIUM" : "LOW",
    confidence,
  }];
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
  textAvailable: boolean;
}): StrategicScore {
  const { extraction, goal, ctaPressure, attention, alignment, behavioralResponse, textAvailable } = params;

  const visualClarity = Math.round((scoreLevel(extraction.brand_presence, true) + scoreLevel(extraction.text_density, false)) / 2);
  const ctaPressureFit = textAvailable ? scoreCtaPressureFit(goal, ctaPressure) : 0;
  const readability = textAvailable ? scoreLevel(extraction.readability, true) : 0;
  const emotionalAlignment = textAvailable ? scoreEmotionalAlignment(goal, extraction.emotional_cues) : 0;
  const audienceFit = alignment.alignment_status === "aligned" ? 90 : alignment.alignment_status === "partially_aligned" ? 68 : 42;
  const attentionRetention = attention.friction_points.length === 0 ? 88 : attention.friction_points.length === 1 ? 68 : 45;
  const hierarchyQuality = extraction.hierarchy_observations.toLowerCase().includes("strong") ? 88 : extraction.hierarchy_observations ? 68 : 55;
  const behavioralReadiness = scoreBehavioralReadiness(behavioralResponse.commitment_readiness);

  let score = Math.round(
    visualClarity * 0.15 +
      ctaPressureFit * 0.15 +
      readability * 0.11 +
      emotionalAlignment * 0.14 +
      audienceFit * 0.12 +
      attentionRetention * 0.10 +
      hierarchyQuality * 0.08 +
      behavioralReadiness * 0.15
  );

  if (alignment.alignment_status === "misaligned") score -= 16;
  else if (alignment.alignment_status === "partially_aligned") score -= 7;
  if (attention.friction_points.length >= 3) score -= 10;
  else if (attention.friction_points.length === 2) score -= 5;
  if (goal === "conversion" && ctaPressure === "soft") score -= 8;
  if (goal === "awareness" && ctaPressure === "aggressive") score -= 8;
  if (textAvailable && extraction.readability === "high" && extraction.text_density !== "high") score += 4;

  const rationale = textAvailable
    ? `Score factors — visual clarity ${visualClarity}, CTA-stage fit ${ctaPressureFit}, readability ${readability}, emotional alignment ${emotionalAlignment}, audience fit ${audienceFit}, retention ${attentionRetention}, hierarchy ${hierarchyQuality}, readiness ${behavioralReadiness}.`
    : `Text extraction unavailable; score based on visual/layout + readiness signals only. Visual clarity ${visualClarity}, audience fit ${audienceFit}, retention ${attentionRetention}, hierarchy ${hierarchyQuality}, readiness ${behavioralReadiness}.`;

  return {
    value: Math.max(0, Math.min(100, score)),
    rationale,
  };
}

function buildCreativeTopicSummary(
  extraction: ExtractionSignals,
  detectedVertical: string,
  goal: CampaignGoal
): string {
  const headline = extraction.headline?.trim();
  const cta = extraction.cta?.trim();
  const primary = extraction.primary_message?.trim();
  const verticalName = VERTICAL_DETECTION_HINTS[detectedVertical]
    ? detectedVertical.replace(/_/g, " ")
    : null;

  if (headline && detectedVertical !== "unknown" && verticalName) {
    return `This creative promotes ${verticalName} content${primary ? ` — "${primary}"` : ""}. Headline: "${headline}".${cta ? ` CTA: "${cta}".` : ""}`;
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

  const mainProblem = recommendations[0]?.core_problem || alignment.strategic_conflict || "No major strategic conflict detected.";
  const topRecommendation = recommendations[0]?.exact_fix || recommendations[0]?.recommended_change || "Run controlled hierarchy optimization test.";

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
    decision_summary: `Strategic alignment score ${strategicScore.value}/100. Priority ${recommendations[0]?.priority || "LOW"} intervention should target the primary persuasion friction before scaling spend.`,
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
    const vertical = normalizeVertical((formData.get("vertical") as string) || "technology");
    const platform = ((formData.get("platform") as string) || "display_ads").toLowerCase();

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
Campaign vertical: ${vertical}
Platform context: ${platform}

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

    const attentionAnalysis = buildAttentionAnalysis(extraction, ctaPressure);
    const psychologyAnalysis = buildPsychologyAnalysis(extraction, goal, ctaPressure, urgencyLevel);
    const campaignAlignment = buildCampaignAlignment(goal, vertical, extraction, psychologyAnalysis, ctaPressure, urgencyLevel);
    const productCategory = detectProductCategory(extraction, vertical);
    const advertisingBehavior = detectAdvertisingBehavior({
      extraction,
      goal,
      ctaPressure,
      selectedVertical: vertical,
      productCategory,
    });
    const audienceResponse = buildAudienceResponse(extraction, psychologyAnalysis, goal);
    const audienceInterpretation = buildAudienceInterpretation({
      extraction,
      goal,
      advertisingBehavior,
      productCategory,
      alignment: campaignAlignment,
    });
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
    const persuasionFriction = buildPersuasionFriction({
      extraction,
      goal,
      alignment: campaignAlignment,
      attention: attentionAnalysis,
      advertisingBehavior,
    });
    const businessImpact = buildBusinessImpact(campaignAlignment, attentionAnalysis);
    const strategicRecommendations = buildStrategicRecommendations({
      alignment: campaignAlignment,
      attention: attentionAnalysis,
      psychology: psychologyAnalysis,
      extraction,
      behavioralResponse,
      audienceInterpretation,
      advertisingBehavior,
      productCategory,
      persuasionFriction,
    });
    const strategicAlignmentScore = buildStrategicScore({
      extraction,
      goal,
      ctaPressure,
      attention: attentionAnalysis,
      alignment: campaignAlignment,
      behavioralResponse,
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
    const detectedVertical = detectVerticalFromSignals(vertical, extraction);
    const detectedGoal = ctaPressure === "aggressive" || urgencyLevel === "high"
      ? "conversion"
      : ctaPressure === "moderate"
        ? "consideration"
        : "awareness";

    const goalAlignment = {
      selected_goal: goal,
      detected_goal: detectedGoal,
      is_aligned: detectedGoal === goal,
      confidence: confidenceFromEvidence(
        (goal === detectedGoal ? 2 : 1) + (ocrMeta.text_available ? 1 : 0)
      ),
      alignment_level: detectedGoal === goal ? "aligned" : "misaligned",
      business_impact: detectedGoal === goal
        ? "Goal-stage behavior is consistent with selected objective."
        : "Goal-stage mismatch can reduce qualified response quality.",
      reason: detectedGoal === goal
        ? "Creative pressure and urgency cues align with selected campaign goal."
        : "Creative pressure and urgency cues indicate a different campaign-stage intent than selected.",
    };

    const verticalAlignment = {
      selected_vertical: vertical,
      detected_vertical: detectedVertical.detectedVertical,
      is_aligned: detectedVertical.detectedVertical === "unknown" || detectedVertical.detectedVertical === vertical,
      confidence: confidenceFromEvidence(detectedVertical.evidence.length, detectedVertical.fitScore),
      reason: detectedVertical.detectedVertical === "unknown"
        ? "Vertical signal confidence is limited; no contradictory vertical detected."
        : detectedVertical.detectedVertical === vertical
          ? "Creative signals align with selected vertical context."
          : `Creative signals resemble ${detectedVertical.detectedVertical} more than ${vertical}.`,
      evidence: detectedVertical.evidence,
      fit_score: detectedVertical.fitScore,
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
      goal_alignment: goalAlignment,
      vertical_alignment: verticalAlignment,
      business_impact: businessImpact,
      product_category: productCategory,
      advertising_behavior: advertisingBehavior,
      audience_interpretation: audienceInterpretation,
      persuasion_friction: persuasionFriction,
      insight_confidence: {
        goal_alignment: goalAlignment.confidence,
        product_category: productCategory.confidence,
        advertising_behavior: advertisingBehavior.confidence,
        audience_interpretation: audienceInterpretation.confidence,
        attention_flow: attentionAnalysis.confidence || "moderate",
        persuasion_friction: persuasionFriction.confidence,
      },
      extraction_signals: {
        headline: extraction.headline,
        cta: extraction.cta,
        brand_presence: extraction.brand_presence,
        dominant_visual_cue: extraction.visual_elements[0] || "",
        persuasion_style: psychologyAnalysis.persuasion_style,
        detected_vertical: detectedVertical.detectedVertical,
        topic_summary: buildCreativeTopicSummary(extraction, detectedVertical.detectedVertical, goal),
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
