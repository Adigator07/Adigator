/**
 * Creative category vs selected vertical validation.
 * Detection is unbiased by the user's selected vertical — selection is only used for comparison.
 */

import {
  keywordMatchesInCorpus,
  scoreCategoryKeywords,
} from "./analyzer/alignmentReasons.js";

export type CreativeCategoryId =
  | "healthcare"
  | "technology"
  | "automotive"
  | "news_media"
  | "sports"
  | "fitness"
  | "finance"
  | "luxury"
  | "travel"
  | "hotels"
  | "food"
  | "banking"
  | "real_estate"
  | "education"
  | "gaming"
  | "entertainment"
  | "ecommerce"
  | "consumer_products"
  | "fashion"
  | "unknown";

export const CREATIVE_CATEGORY_LABELS: Record<CreativeCategoryId, string> = {
  healthcare: "Healthcare / Medical Services",
  technology: "Technology / Software",
  automotive: "Automotive / Vehicles",
  news_media: "News / Media",
  sports: "Sports",
  fitness: "Fitness / Health & Wellness",
  finance: "Business / Finance",
  luxury: "Luxury / Premium Goods",
  travel: "Travel / Hospitality",
  hotels: "Hotels / Accommodation",
  food: "Restaurants / Food",
  banking: "Banking / Fintech",
  real_estate: "Real Estate / Property",
  education: "Education / Professional Training",
  gaming: "Gaming",
  entertainment: "Entertainment / OTT",
  ecommerce: "Retail / E-commerce",
  consumer_products: "Consumer Products / CPG",
  fashion: "Fashion / Apparel",
  unknown: "Unclear / Mixed Category",
};

/** Maps a detected creative category to the closest campaign vertical setting. */
export const CATEGORY_TO_SUGGESTED_VERTICAL: Record<string, string> = {
  consumer_products: "ecommerce",
  ecommerce: "ecommerce",
  fashion: "fashion",
  healthcare: "healthcare",
  technology: "technology",
  automotive: "automotive",
  news_media: "news_media",
  sports: "sports",
  fitness: "fitness",
  finance: "finance",
  luxury: "luxury",
  travel: "travel",
  hotels: "hotels",
  food: "food",
  banking: "banking",
  real_estate: "real_estate",
  education: "education",
  gaming: "gaming",
  entertainment: "entertainment",
  unknown: "unknown",
};

const CATEGORY_HINTS: Record<string, string[]> = {
  healthcare: ["hospital", "clinic", "doctor", "medical", "patient", "wellness", "care", "treatment", "pharma", "health"],
  technology: ["software", "saas", "platform", "cloud", " ai ", "app", "tech", "automation", "workflow", "trial", "subscription", "dashboard", "integrate", "api", "developer", "code"],
  automotive: ["car", "vehicle", "bike", "suv", "sedan", "drive", "engine", "mileage", "dealership", "auto"],
  news_media: ["news", "headline", "breaking", "journal", "editorial", "media", "publisher"],
  sports: ["sports", "team", "match", "league", "athlete", "score", "stadium"],
  fitness: ["fitness", "gym", "workout", "training", "exercise", "yoga", "pilates", "crossfit", "personal trainer", "membership", "strength", "cardio", "wellness club"],
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
  ecommerce: ["shop", "store", "cart", "checkout", "sale", "discount", "buy", "purchase", "retail"],
  consumer_products: [
    "consumer product", "consumer goods", "cpg", "household", "cleaning", "detergent", "soap",
    "shampoo", "toiletry", "personal care", "home care", "packaged goods", "appliance",
    "gadget", "electronics", "kitchen", "home goods", "groceries", "snacks", "pantry",
    "bottle", "jar", "tube", "packaging", "unboxing", "white background", "product shot",
    "household item", "daily essentials", "grocery", "pantry staple",
  ],
  fashion: [
    "fashion", "clothing", "apparel", "outfit", "style", "collection", "wardrobe", "dress",
    "jacket", "shoes", "accessories", "designer", "wear", "trend", "lookbook", "runway",
    "season", "model", "couture", "editorial", "streetwear", "denim", "sneaker", "handbag",
  ],
};

const KNOWN_CATEGORY_IDS = new Set(Object.keys(CATEGORY_HINTS));

export interface ExtractionSignalsLike {
  headline?: string;
  primary_message?: string;
  cta?: string;
  visual_elements?: string[];
  audience_clues?: string[];
  urgency_signals?: string[];
  trust_markers?: string[];
  emotional_cues?: string[];
  inferred_vertical?: string | null;
}

export interface CreativeCategoryDetection {
  id: CreativeCategoryId;
  label: string;
  confidence: "high" | "moderate" | "low";
  evidence: string[];
  detection_score: number;
}

export interface CreativeVerticalAlignment {
  selected_vertical: string;
  detected_category_id: string;
  detected_category_label: string;
  detected_vertical: string;
  suggested_vertical: string;
  suggested_vertical_label: string;
  is_aligned: boolean;
  alignment_status: "aligned" | "partially_aligned" | "misaligned" | "unknown";
  confidence: "high" | "moderate" | "low";
  fit_score: number;
  evidence: string[];
  mismatch_reason: string;
  recommendation: string;
  ai_category_feedback?: string;
}

function buildCorpus(extraction: ExtractionSignalsLike) {
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const visualCorpus = [
    ...(extraction.visual_elements || []),
    ...(extraction.audience_clues || []),
    ...(extraction.urgency_signals || []),
    ...(extraction.trust_markers || []),
    ...(extraction.emotional_cues || []),
  ].join(" ").toLowerCase();
  return { textCorpus, visualCorpus, fullCorpus: `${textCorpus} ${visualCorpus}`.trim() };
}

function scoreConfidence(score: number): "high" | "moderate" | "low" {
  if (score >= 6) return "high";
  if (score >= 3) return "moderate";
  return "low";
}

/** Detect creative category without biasing toward the user's selected vertical. */
export function detectCreativeCategoryUnbiased(
  extraction: ExtractionSignalsLike,
  aiInferredVertical?: string | null,
  aiCreativeCategory?: string | null,
): CreativeCategoryDetection {
  const { textCorpus, visualCorpus, fullCorpus } = buildCorpus(extraction);

  let bestId: CreativeCategoryId = "unknown";
  let bestScore = 0;

  for (const [candidate, hints] of Object.entries(CATEGORY_HINTS)) {
    const score = scoreCategoryKeywords(hints, textCorpus, visualCorpus, 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = candidate as CreativeCategoryId;
    }
  }

  if (aiInferredVertical && KNOWN_CATEGORY_IDS.has(aiInferredVertical)) {
    const aiHints = CATEGORY_HINTS[aiInferredVertical] ?? [];
    const aiScore = scoreCategoryKeywords(aiHints, textCorpus, visualCorpus, 0);
    if (aiScore >= 2 && aiScore >= bestScore - 1) {
      bestId = aiInferredVertical as CreativeCategoryId;
      bestScore = Math.max(bestScore, aiScore);
    }
  }

  if (aiCreativeCategory) {
    const normalized = aiCreativeCategory.toLowerCase();
    if (/consumer|cpg|household|packaged goods/.test(normalized)) {
      const cpScore = scoreCategoryKeywords(CATEGORY_HINTS.consumer_products, textCorpus, visualCorpus, 0);
      if (cpScore >= 2) {
        bestId = "consumer_products";
        bestScore = Math.max(bestScore, cpScore + 1);
      }
    }
  }

  const hints = CATEGORY_HINTS[bestId] ?? [];
  const evidence = hints
    .filter((keyword) => keywordMatchesInCorpus(keyword, fullCorpus))
    .slice(0, 5);

  return {
    id: bestScore <= 0 ? "unknown" : bestId,
    label: CREATIVE_CATEGORY_LABELS[bestScore <= 0 ? "unknown" : bestId],
    confidence: bestScore <= 0 ? "low" : scoreConfidence(bestScore),
    evidence,
    detection_score: bestScore,
  };
}

function scoreSelectedVerticalFit(selectedVertical: string, fullCorpus: string): number {
  const hints = CATEGORY_HINTS[selectedVertical] ?? [];
  if (!hints.length) return 50;
  const hits = hints.filter((keyword) => keywordMatchesInCorpus(keyword, fullCorpus)).length;
  return Math.min(100, Math.round((hits / Math.min(4, hints.length)) * 100));
}

function formatVerticalName(id: string): string {
  return CREATIVE_CATEGORY_LABELS[id as CreativeCategoryId]
    || id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildMismatchReason(
  selectedVertical: string,
  detected: CreativeCategoryDetection,
  suggestedVertical: string,
): string {
  const selectedLabel = formatVerticalName(selectedVertical);
  if (detected.id === "unknown") {
    return `Creative category is unclear — weak ${selectedLabel} signals in copy and visuals. Confirm this asset belongs in your ${selectedLabel} campaign.`;
  }
  if (detected.id === selectedVertical) {
    return `Creative reads as ${detected.label}, consistent with your ${selectedLabel} vertical.`;
  }
  const suggestedLabel = formatVerticalName(suggestedVertical);
  const evidenceText = detected.evidence.length
    ? ` Detected cues: ${detected.evidence.join(", ")}.`
    : "";
  return `Creative presents as ${detected.label}, not ${selectedLabel}. It likely belongs under ${suggestedLabel} instead.${evidenceText}`;
}

function buildRecommendation(
  isAligned: boolean,
  selectedVertical: string,
  detected: CreativeCategoryDetection,
  suggestedVertical: string,
): string {
  if (isAligned) return "";
  const selectedLabel = formatVerticalName(selectedVertical);
  const suggestedLabel = formatVerticalName(suggestedVertical);
  if (detected.id === "consumer_products" && selectedVertical === "fashion") {
    return "Swap this asset for fashion apparel/accessory creative, or change the campaign vertical to E-commerce / Retail if you intend to promote consumer goods.";
  }
  return `Remove or replace this creative, or update the campaign vertical to ${suggestedLabel} if ${detected.label} is the intended focus.`;
}

export function evaluateCreativeVerticalAlignment(params: {
  selectedVertical: string;
  extraction: ExtractionSignalsLike;
  aiInferredVertical?: string | null;
  aiCreativeCategory?: string | null;
  aiVerticalFeedback?: string | null;
  aiVerticalMatch?: boolean | null;
  aiExplicitVerticalMatch?: boolean | null;
}): CreativeVerticalAlignment {
  const {
    selectedVertical,
    extraction,
    aiInferredVertical,
    aiCreativeCategory,
    aiVerticalFeedback,
    aiVerticalMatch,
    aiExplicitVerticalMatch,
  } = params;

  const detected = detectCreativeCategoryUnbiased(extraction, aiInferredVertical, aiCreativeCategory);
  const { fullCorpus } = buildCorpus(extraction);
  const fitScore = scoreSelectedVerticalFit(selectedVertical, fullCorpus);
  const suggestedVertical = CATEGORY_TO_SUGGESTED_VERTICAL[detected.id] || detected.id;
  const suggestedVerticalLabel = formatVerticalName(suggestedVertical);

  let isAligned = false;
  let alignmentStatus: CreativeVerticalAlignment["alignment_status"] = "unknown";

  if (detected.id === selectedVertical) {
    isAligned = true;
    alignmentStatus = "aligned";
  } else if (detected.id === "unknown") {
    if (fitScore >= 65) {
      isAligned = true;
      alignmentStatus = "aligned";
    } else if (fitScore >= 45) {
      isAligned = false;
      alignmentStatus = "partially_aligned";
    } else {
      isAligned = false;
      alignmentStatus = "misaligned";
    }
  } else {
    // Different category detected — strict mismatch unless AI explicitly confirms vertical match with high fit
    const aiConfirmsSelected = aiVerticalMatch === true && aiExplicitVerticalMatch !== false && fitScore >= 70;
    isAligned = aiConfirmsSelected;
    alignmentStatus = aiConfirmsSelected ? "partially_aligned" : "misaligned";
  }

  if (aiExplicitVerticalMatch === false || aiVerticalMatch === false) {
    isAligned = false;
    alignmentStatus = "misaligned";
  }

  // Consumer products vs fashion is always a mismatch
  if (
    selectedVertical === "fashion"
    && (detected.id === "consumer_products" || detected.id === "ecommerce")
    && detected.confidence !== "low"
  ) {
    const { textCorpus, visualCorpus } = buildCorpus(extraction);
    const fashionScore = scoreCategoryKeywords(CATEGORY_HINTS.fashion, textCorpus, visualCorpus, 0);
    if (fashionScore < 2) {
      isAligned = false;
      alignmentStatus = "misaligned";
    }
  }

  const mismatchReason = aiVerticalFeedback && !/largely consistent|no major/i.test(aiVerticalFeedback)
    ? aiVerticalFeedback
    : buildMismatchReason(selectedVertical, detected, suggestedVertical);

  return {
    selected_vertical: selectedVertical,
    detected_category_id: detected.id,
    detected_category_label: detected.label,
    detected_vertical: suggestedVertical,
    suggested_vertical: suggestedVertical,
    suggested_vertical_label: suggestedVerticalLabel,
    is_aligned: isAligned === true,
    alignment_status: alignmentStatus,
    confidence: detected.confidence,
    fit_score: fitScore,
    evidence: detected.evidence,
    mismatch_reason: mismatchReason,
    recommendation: buildRecommendation(isAligned === true, selectedVertical, detected, suggestedVertical),
    ai_category_feedback: aiVerticalFeedback || undefined,
  };
}

export function parseAICreativeCategory(raw: Record<string, unknown>): {
  creativeCategory?: string;
  suggestedVertical?: string;
} {
  const category = raw.creativeCategory || raw.creative_category;
  const suggested = raw.suggestedVertical || raw.suggested_vertical;
  return {
    creativeCategory: typeof category === "string" ? category : undefined,
    suggestedVertical: typeof suggested === "string" ? suggested : undefined,
  };
}
