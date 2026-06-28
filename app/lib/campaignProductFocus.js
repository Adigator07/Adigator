/**
 * Campaign product focus — narrows automotive (and similar) briefs to bike vs car vs truck.
 */

export const PRODUCT_FOCUS_OPTIONS = [
  { id: "", label: "Auto-detect from brief" },
  { id: "automobile", label: "Automobile (general)" },
  { id: "bike", label: "Bike / Motorcycle" },
  { id: "car", label: "Car / SUV" },
  { id: "truck", label: "Truck / Commercial" },
];

const PRODUCT_LABELS = {
  automobile: "Automobile",
  bike: "Bike / Motorcycle",
  car: "Car / SUV",
  truck: "Truck / Commercial",
  unknown: "Unclear product",
};

const PRODUCT_KEYWORDS = {
  bike: [
    "bike", "bicycle", "motorcycle", "motorbike", "scooter", "two-wheeler", "two wheeler",
    "moped", "helmet", "riding gear",
  ],
  car: [
    "car", "sedan", "suv", "hatchback", "coupe", "crossover", "electric car", "ev car",
    "automobile", "vehicle", "4-wheeler", "four wheeler",
  ],
  truck: [
    "truck", "pickup", "lorry", "commercial vehicle", "fleet", "van", "heavy duty",
  ],
  automobile: [
    "automobile", "auto", "automotive", "vehicle", "mobility", "dealer", "showroom",
  ],
};

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function countKeywordHits(text, keywords) {
  return (keywords || []).reduce((count, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = keyword.includes(" ")
      ? new RegExp(escaped, "i")
      : new RegExp(`\\b${escaped}\\b`, "i");
    return count + (re.test(text) ? 1 : 0);
  }, 0);
}

/** Resolve expected product focus from explicit dropdown + brief text. */
export function resolveProductFocus(explicitFocus, brief = "") {
  if (explicitFocus && PRODUCT_LABELS[explicitFocus]) return explicitFocus;

  const text = normalizeText(brief);
  if (!text) return "";

  const scores = Object.entries(PRODUCT_KEYWORDS)
    .map(([id, keywords]) => ({ id, score: countKeywordHits(text, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) return "";
  if (scores[0].id === "automobile" && scores.length > 1) {
    return scores.find((entry) => entry.id !== "automobile")?.id || scores[0].id;
  }
  return scores[0].id;
}

function buildCreativeCorpus(signals = {}, payload = {}) {
  return [
    signals.headline,
    signals.primary_message,
    signals.dominant_visual_cue,
    signals.offer_type,
    payload?.vertical_alignment?.product_category,
    payload?.adigator_analysis?.main_risk,
    ...(Array.isArray(signals.detected_objects) ? signals.detected_objects : []),
    ...(Array.isArray(signals.visual_elements) ? signals.visual_elements : []),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Detect dominant product type shown in the creative. */
export function detectProductFromCreative(signals = {}, payload = {}) {
  const corpus = buildCreativeCorpus(signals, payload);
  if (!corpus.trim()) return "unknown";

  const scores = Object.entries(PRODUCT_KEYWORDS)
    .filter(([id]) => id !== "automobile")
    .map(([id, keywords]) => ({ id, score: countKeywordHits(corpus, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    const autoScore = countKeywordHits(corpus, PRODUCT_KEYWORDS.automobile);
    return autoScore > 0 ? "automobile" : "unknown";
  }

  if (scores.length > 1 && scores[0].score === scores[1].score) {
    return "unknown";
  }
  return scores[0].id;
}

export function getProductFocusLabel(id) {
  return PRODUCT_LABELS[id] || PRODUCT_LABELS.unknown;
}

/**
 * Compare brief / product focus with what the creative actually shows.
 * Specific focus (bike) must not auto-align when creative reads as car.
 */
export function evaluateBriefProductAlignment({
  campaignBrief = "",
  productFocus = "",
  signals = {},
  payload = {},
}) {
  const expected = resolveProductFocus(productFocus, campaignBrief);
  const detected = detectProductFromCreative(signals, payload);

  if (!expected) {
    return {
      is_aligned: true,
      expected_focus: "",
      detected_product: detected,
      reason: "",
      severity: "none",
    };
  }

  if (detected === "unknown") {
    return {
      is_aligned: null,
      expected_focus: expected,
      detected_product: detected,
      reason: `Brief targets ${getProductFocusLabel(expected)} but the creative does not show a clear product match. Review before launch.`,
      severity: "review",
    };
  }

  if (expected === "automobile") {
    const aligned = ["automobile", "car", "bike", "truck"].includes(detected);
    return {
      is_aligned: aligned,
      expected_focus: expected,
      detected_product: detected,
      reason: aligned
        ? `Creative shows ${getProductFocusLabel(detected)}, consistent with a general automobile brief.`
        : `Creative does not read as an automobile campaign.`,
      severity: aligned ? "pass" : "review",
    };
  }

  const aligned = expected === detected;
  return {
    is_aligned: aligned,
    expected_focus: expected,
    detected_product: detected,
    reason: aligned
      ? `Creative matches your ${getProductFocusLabel(expected)} brief.`
      : `Brief is ${getProductFocusLabel(expected)} but the creative reads as ${getProductFocusLabel(detected)}. Update the brief, change product focus, or swap the creative.`,
    severity: aligned ? "pass" : "fail",
  };
}
