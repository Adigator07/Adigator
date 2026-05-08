/**
 * ACIE v5.0 — Module 3: Funnel Hints
 *
 * Classifies the creative's likely funnel stage using deterministic heuristics.
 * No AI. No guessing. Pure signal → probability math.
 *
 * Why before AI?
 * If GPT knows the likely funnel stage ahead of time, it can reason about
 * the creative's strategic intent more accurately. Heuristics are fast,
 * auditable, and explainable.
 */

import type { FunnelHints, FunnelStage, OCRStructure, VisionMetrics } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// RULE WEIGHTS (documented for auditability)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each rule is a scoring weight applied to a funnel stage when a signal
 * is detected. Weights sum to form unnormalized probabilities.
 */
const RULES: Array<{
  id: string;
  description: string;
  check: (ocr: OCRStructure, vision: VisionMetrics) => boolean;
  scores: { awareness?: number; consideration?: number; conversion?: number };
}> = [
  // ── Conversion signals ────────────────────────────────────────────────────

  {
    id: "PRICE_DETECTED",
    description: "Price string present → direct purchase intent signal",
    check: (ocr) => ocr.price !== null,
    scores: { conversion: 0.35 },
  },
  {
    id: "DISCOUNT_DETECTED",
    description: "Discount/percentage off detected → promotion-driven conversion",
    check: (ocr) => ocr.discount !== null,
    scores: { conversion: 0.30 },
  },
  {
    id: "URGENCY_WORDS_PRESENT",
    description: "1+ urgency words → time-pressure to act now",
    check: (ocr) => ocr.urgencyWords.length > 0,
    scores: { conversion: 0.25 },
  },
  {
    id: "STRONG_CTA_PRESENT",
    description: "Direct action CTA phrase detected → explicit conversion ask",
    check: (ocr) =>
      ocr.ctaPhrase !== null &&
      /(buy|order|shop|download|install|sign up|get started|claim|book)/i.test(ocr.ctaPhrase),
    scores: { conversion: 0.20 },
  },
  {
    id: "BENEFIT_WORDS_HIGH",
    description: "3+ benefit words → outcome-focused messaging (conversion lean)",
    check: (ocr) => ocr.benefitWords.length >= 3,
    scores: { conversion: 0.15, consideration: 0.10 },
  },

  // ── Consideration signals ─────────────────────────────────────────────────

  {
    id: "COMPARISON_WORDS_PRESENT",
    description: "Comparison language → user is evaluating options",
    check: (ocr) => ocr.comparisonWords.length > 0,
    scores: { consideration: 0.30 },
  },
  {
    id: "FEATURE_WORDS_HIGH",
    description: "3+ feature/attribute words → informational, educational",
    check: (ocr) => ocr.featureWords.length >= 3,
    scores: { consideration: 0.25 },
  },
  {
    id: "TRUST_WORDS_PRESENT",
    description: "Trust signals present → credibility building = consideration",
    check: (ocr) => ocr.trustWords.length > 0,
    scores: { consideration: 0.15, awareness: 0.05 },
  },
  {
    id: "HIGH_WORD_COUNT",
    description: "40+ words → information-heavy = consideration-oriented",
    check: (ocr) => ocr.wordCount >= 40,
    scores: { consideration: 0.20 },
  },
  {
    id: "SOFT_CTA_PRESENT",
    description: "Soft CTA (learn more, explore, discover) → consideration stage",
    check: (ocr) =>
      ocr.ctaPhrase !== null &&
      /(learn|discover|explore|view|compare|see|check)/i.test(ocr.ctaPhrase),
    scores: { consideration: 0.20, awareness: 0.10 },
  },

  // ── Awareness signals ─────────────────────────────────────────────────────

  {
    id: "EMOTIONAL_WORDS_HIGH",
    description: "2+ emotional words → emotional connection = awareness",
    check: (ocr) => ocr.emotionalWords.length >= 2,
    scores: { awareness: 0.30 },
  },
  {
    id: "BRAND_NAME_DETECTED",
    description: "Brand name present → brand recall and awareness objective",
    check: (ocr) => ocr.brandName !== null,
    scores: { awareness: 0.15, consideration: 0.05 },
  },
  {
    id: "HIGH_WHITESPACE",
    description: "High whitespace ratio → minimal copy = awareness/branding style",
    check: (_ocr, vision) => vision.whitespaceRatio > 0.4,
    scores: { awareness: 0.20 },
  },
  {
    id: "LOW_WORD_COUNT",
    description: "Fewer than 8 words → punchy brand message = awareness",
    check: (ocr) => ocr.wordCount < 8 && ocr.wordCount > 0,
    scores: { awareness: 0.20 },
  },
  {
    id: "FACE_DETECTED",
    description: "Human face present → emotional storytelling = awareness",
    check: (_ocr, vision) => vision.faceDetected,
    scores: { awareness: 0.15 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function normalize(scores: { awareness: number; consideration: number; conversion: number }) {
  const total = scores.awareness + scores.consideration + scores.conversion;
  if (total === 0) return { awareness: 0.33, consideration: 0.34, conversion: 0.33 };
  return {
    awareness: parseFloat((scores.awareness / total).toFixed(3)),
    consideration: parseFloat((scores.consideration / total).toFixed(3)),
    conversion: parseFloat((scores.conversion / total).toFixed(3)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify the funnel stage using deterministic rules over OCR and vision signals.
 * Fully auditable — the signals array explains every factor.
 */
export function classifyFunnel(ocr: OCRStructure, vision: VisionMetrics): FunnelHints {
  const raw = { awareness: 0, consideration: 0, conversion: 0 };
  const signals: string[] = [];

  for (const rule of RULES) {
    if (rule.check(ocr, vision)) {
      if (rule.scores.awareness)     raw.awareness     += rule.scores.awareness;
      if (rule.scores.consideration) raw.consideration += rule.scores.consideration;
      if (rule.scores.conversion)    raw.conversion    += rule.scores.conversion;
      signals.push(`[${rule.id}] ${rule.description}`);
    }
  }

  const probabilities = normalize(raw);

  // Dominant stage: highest probability
  const dominantStage = (Object.entries(probabilities).sort(
    (a, b) => b[1] - a[1]
  )[0][0]) as FunnelStage;

  // Confidence: how much the dominant stage leads the next
  const sorted = Object.values(probabilities).sort((a, b) => b - a);
  const confidence = parseFloat(Math.min(1, sorted[0] - (sorted[1] || 0) + 0.5).toFixed(2));

  console.log(`[FunnelHints] stage=${dominantStage} confidence=${confidence} signals=${signals.length}`);

  return {
    probabilities,
    dominantStage,
    signals,
    confidence,
  };
}
