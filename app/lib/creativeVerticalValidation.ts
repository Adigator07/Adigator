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

/** Categories that are close enough to count as aligned with the selected vertical. */
const RELATED_VERTICALS: Record<string, string[]> = {
  consumer_products: ["ecommerce", "fashion"],
  ecommerce: ["consumer_products", "fashion"],
  fashion: ["ecommerce", "consumer_products", "luxury"],
  food: ["hotels", "travel"],
  hotels: ["food", "travel"],
  travel: ["hotels"],
  fitness: ["sports", "healthcare"],
  finance: ["banking", "technology"],
  banking: ["finance", "technology"],
  technology: ["education", "finance"],
  entertainment: ["gaming"],
  gaming: ["entertainment", "technology"],
  sports: ["fitness"],
};

function areRelatedVerticals(left: string, right: string): boolean {
  if (!left || !right || left === right) return left === right;
  return RELATED_VERTICALS[left]?.includes(right) || RELATED_VERTICALS[right]?.includes(left) || false;
}

function categoriesAlignWithSelected(
  selectedVertical: string,
  detected: CreativeCategoryDetection,
  suggestedVertical: string,
  aiInferredVertical?: string | null,
): boolean {
  if (detected.id === selectedVertical) return true;
  if (suggestedVertical === selectedVertical) return true;
  if (aiInferredVertical && aiInferredVertical === selectedVertical) return true;
  if (areRelatedVerticals(detected.id, selectedVertical)) return true;
  return false;
}

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

/** Map a stored product category label back to a category id. */
export function categoryIdFromLabel(label?: string | null): CreativeCategoryId | null {
  if (!label?.trim()) return null;
  const normalized = label.trim().toLowerCase();
  for (const [id, categoryLabel] of Object.entries(CREATIVE_CATEGORY_LABELS)) {
    if (id === "unknown") continue;
    const labelLower = categoryLabel.toLowerCase();
    if (labelLower === normalized || normalized.includes(labelLower) || labelLower.includes(normalized)) {
      return id as CreativeCategoryId;
    }
  }
  return null;
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
  storedDetectedCategoryId?: string | null;
  storedProductCategoryLabel?: string | null;
  storedIsAligned?: boolean | null;
}): CreativeVerticalAlignment {
  const {
    selectedVertical,
    extraction,
    aiInferredVertical,
    aiCreativeCategory,
    aiVerticalFeedback,
    aiVerticalMatch,
    aiExplicitVerticalMatch,
    storedDetectedCategoryId,
    storedProductCategoryLabel,
    storedIsAligned,
  } = params;

  const storedCategoryId = storedDetectedCategoryId && storedDetectedCategoryId !== "unknown"
    ? storedDetectedCategoryId
    : categoryIdFromLabel(storedProductCategoryLabel || aiCreativeCategory);

  const inferredVertical = aiInferredVertical
    || storedCategoryId
    || categoryIdFromLabel(aiCreativeCategory);

  const detected = detectCreativeCategoryUnbiased(extraction, inferredVertical, aiCreativeCategory);
  const resolvedDetected = storedCategoryId
    && storedCategoryId !== "unknown"
    && (detected.id === "unknown" || detected.confidence === "low")
    ? {
        ...detected,
        id: storedCategoryId as CreativeCategoryId,
        label: CREATIVE_CATEGORY_LABELS[storedCategoryId as CreativeCategoryId] || detected.label,
      }
    : detected;
  const { fullCorpus } = buildCorpus(extraction);
  const fitScore = scoreSelectedVerticalFit(selectedVertical, fullCorpus);
  const suggestedVertical = CATEGORY_TO_SUGGESTED_VERTICAL[resolvedDetected.id] || resolvedDetected.id;
  const suggestedVerticalLabel = formatVerticalName(suggestedVertical);

  let isAligned = false;
  let alignmentStatus: CreativeVerticalAlignment["alignment_status"] = "unknown";

  if (aiExplicitVerticalMatch === false || aiVerticalMatch === false) {
    isAligned = false;
    alignmentStatus = "misaligned";
  } else if (categoriesAlignWithSelected(selectedVertical, resolvedDetected, suggestedVertical, inferredVertical)) {
    isAligned = true;
    alignmentStatus = "aligned";
  } else if (aiVerticalMatch === true || storedIsAligned === true) {
    isAligned = true;
    alignmentStatus = "aligned";
  } else if (resolvedDetected.id === "unknown") {
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
  } else if (areRelatedVerticals(resolvedDetected.id, selectedVertical) && fitScore >= 45) {
    isAligned = true;
    alignmentStatus = "aligned";
  } else {
    isAligned = false;
    alignmentStatus = "misaligned";
  }

  // Fashion vs consumer goods only when keyword signals strongly disagree and AI did not confirm.
  if (
    !isAligned
    && selectedVertical === "fashion"
    && (resolvedDetected.id === "consumer_products" || resolvedDetected.id === "ecommerce")
    && resolvedDetected.confidence !== "low"
    && aiVerticalMatch !== true
    && storedIsAligned !== true
  ) {
    const { textCorpus, visualCorpus } = buildCorpus(extraction);
    const fashionScore = scoreCategoryKeywords(CATEGORY_HINTS.fashion, textCorpus, visualCorpus, 0);
    if (fashionScore < 2) {
      isAligned = false;
      alignmentStatus = "misaligned";
    }
  }

  const positiveReason = buildMismatchReason(selectedVertical, resolvedDetected, suggestedVertical);
  const mismatchReason = isAligned
    ? positiveReason
    : (aiVerticalFeedback && !/largely consistent|no major|consistent with/i.test(aiVerticalFeedback)
      ? aiVerticalFeedback
      : positiveReason);

  return {
    selected_vertical: selectedVertical,
    detected_category_id: resolvedDetected.id,
    detected_category_label: resolvedDetected.label,
    detected_vertical: suggestedVertical,
    suggested_vertical: suggestedVertical,
    suggested_vertical_label: suggestedVerticalLabel,
    is_aligned: isAligned === true,
    alignment_status: alignmentStatus,
    confidence: resolvedDetected.confidence,
    fit_score: fitScore,
    evidence: resolvedDetected.evidence,
    mismatch_reason: mismatchReason,
    recommendation: buildRecommendation(isAligned === true, selectedVertical, resolvedDetected, suggestedVertical),
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
