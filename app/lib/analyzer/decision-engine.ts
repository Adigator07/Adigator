/**
 * ACIE v5.0 — Module 5: Decision Engine (Post-AI Rule Corrections)
 *
 * After AI reasoning is complete, this module applies deterministic rules
 * to validate and correct the AI's scores based on hard evidence from
 * vision and OCR signals.
 *
 * Core principle:
 * AI output is advisory. Local evidence is authoritative.
 * If the image is cluttered (proven by pixels), cognitiveLoad MUST be high —
 * regardless of what GPT believes.
 */

import type {
  AIAnalysis,
  VisionMetrics,
  OCRStructure,
  FunnelHints,
  AppliedRule,
  RuleCorrections,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// MUTABLE SCORE WORKING COPY
// ─────────────────────────────────────────────────────────────────────────────

interface MutableScores {
  messageClarity: number;
  ctaStrength: number;
  trustLevel: number;
  cognitiveLoad: number;
  emotionalAppeal: number;
  offerClarity: number;
  brandVisibility: number;
}

function clamp(v: number) {
  return Math.round(Math.min(100, Math.max(0, v)));
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type RuleDefinition = {
  id: string;
  description: string;
  condition: (
    scores: MutableScores,
    vision: VisionMetrics,
    ocr: OCRStructure,
    funnel: FunnelHints
  ) => boolean;
  apply: (
    scores: MutableScores,
    vision: VisionMetrics,
    ocr: OCRStructure,
    funnel: FunnelHints
  ) => AppliedRule[];
};

const CORRECTION_RULES: RuleDefinition[] = [
  // ── CTA rules ─────────────────────────────────────────────────────────────

  {
    id: "NO_CTA_DETECTED",
    description: "No CTA phrase found in OCR → cap ctaStrength at 30",
    condition: (_s, _v, ocr) => ocr.ctaPhrase === null,
    apply: (s, _v, _o, _f) => {
      const old = s.ctaStrength;
      s.ctaStrength = Math.min(s.ctaStrength, 30);
      return [{
        rule: "NO_CTA_DETECTED",
        field: "ctaStrength",
        delta: s.ctaStrength - old,
        reason: "No CTA phrase was detected in OCR. CTA strength capped at 30.",
      }];
    },
  },
  {
    id: "AWARENESS_CTA_PENALTY",
    description: "Awareness funnel + strong CTA is misaligned → reduce ctaStrength",
    condition: (s, _v, _o, funnel) =>
      funnel.dominantStage === "awareness" && s.ctaStrength > 80,
    apply: (s, _v, _o, _f) => {
      const delta = -25;
      s.ctaStrength = clamp(s.ctaStrength + delta);
      return [{
        rule: "AWARENESS_CTA_PENALTY",
        field: "ctaStrength",
        delta,
        reason: "Awareness creatives should not have aggressive CTAs. Strong CTA signals misalignment.",
      }];
    },
  },
  {
    id: "CONVERSION_CTA_BONUS",
    description: "Conversion funnel + explicit CTA → boost ctaStrength",
    condition: (s, _v, ocr, funnel) =>
      funnel.dominantStage === "conversion" &&
      ocr.ctaPhrase !== null &&
      s.ctaStrength < 80,
    apply: (s) => {
      const delta = +10;
      s.ctaStrength = clamp(s.ctaStrength + delta);
      return [{
        rule: "CONVERSION_CTA_BONUS",
        field: "ctaStrength",
        delta,
        reason: "Conversion creative with explicit CTA detected. Bonus applied.",
      }];
    },
  },

  // ── Clutter / cognitive load rules ────────────────────────────────────────

  {
    id: "HIGH_CLUTTER_COGNITIVE_PENALTY",
    description: "visualClutterScore > 0.7 → cognitive load must be high",
    condition: (_s, vision) => vision.visualClutterScore > 0.7,
    apply: (s, vision, _o, _f) => {
      const target = Math.max(s.cognitiveLoad, 70);
      const delta = target - s.cognitiveLoad;
      s.cognitiveLoad = target;
      return [{
        rule: "HIGH_CLUTTER_COGNITIVE_PENALTY",
        field: "cognitiveLoad",
        delta,
        reason: `visualClutterScore=${vision.visualClutterScore} exceeds 0.7. Cognitive load forced to minimum 70.`,
      }];
    },
  },
  {
    id: "TEXT_OVERLOAD_CLARITY_PENALTY",
    description: "textAreaPercentage > 55% → too much text, clarity suffers",
    condition: (_s, vision) => vision.textAreaPercentage > 55,
    apply: (s) => {
      const delta = -20;
      s.messageClarity = clamp(s.messageClarity + delta);
      return [{
        rule: "TEXT_OVERLOAD_CLARITY_PENALTY",
        field: "messageClarity",
        delta,
        reason: "Text coverage exceeds 55% of the image. Clarity reduced — too much copy competes for attention.",
      }];
    },
  },

  // ── Whitespace / readability rules ────────────────────────────────────────

  {
    id: "LOW_WHITESPACE_READABILITY_PENALTY",
    description: "whitespaceRatio < 0.15 → cramped layout, readability hurt",
    condition: (_s, vision) => vision.whitespaceRatio < 0.15,
    apply: (s, _v, _o, _f) => {
      const delta1 = -15, delta2 = -10;
      s.messageClarity = clamp(s.messageClarity + delta1);
      s.cognitiveLoad   = clamp(s.cognitiveLoad - delta2); // increase load
      return [
        { rule: "LOW_WHITESPACE_READABILITY_PENALTY", field: "messageClarity", delta: delta1, reason: "whitespaceRatio < 15%. Cramped layout hurts readability." },
        { rule: "LOW_WHITESPACE_READABILITY_PENALTY", field: "cognitiveLoad",   delta: -delta2, reason: "Low whitespace increases cognitive processing burden." },
      ];
    },
  },

  // ── Contrast / attention rules ────────────────────────────────────────────

  {
    id: "LOW_CONTRAST_ATTENTION_PENALTY",
    description: "contrastLevel < 30 → flat creative, poor scroll-stop potential",
    condition: (_s, vision) => vision.contrastLevel < 30,
    apply: (s) => {
      const delta = -20;
      s.messageClarity = clamp(s.messageClarity + delta);
      return [{
        rule: "LOW_CONTRAST_ATTENTION_PENALTY",
        field: "messageClarity",
        delta,
        reason: "contrastLevel < 30. Low visual contrast reduces legibility and scroll-stop power.",
      }];
    },
  },

  // ── Brand rules ──────────────────────────────────────────────────────────

  {
    id: "NO_BRAND_DETECTED_PENALTY",
    description: "No brand name in OCR → brand visibility must be reduced",
    condition: (_s, _v, ocr) => ocr.brandName === null,
    apply: (s, _v, _o, _f) => {
      const delta = -40;
      s.brandVisibility = clamp(s.brandVisibility + delta);
      return [{
        rule: "NO_BRAND_DETECTED_PENALTY",
        field: "brandVisibility",
        delta,
        reason: "No brand name detected in OCR. Brand visibility reduced significantly.",
      }];
    },
  },

  // ── Trust / urgency rules ─────────────────────────────────────────────────

  {
    id: "OVER_URGENCY_TRUST_PENALTY",
    description: "4+ urgency words → feels spammy, trust is eroded",
    condition: (_s, _v, ocr) => ocr.urgencyWords.length >= 4,
    apply: (s, _v, _o, _f) => {
      const delta = -15;
      s.trustLevel = clamp(s.trustLevel + delta);
      return [{
        rule: "OVER_URGENCY_TRUST_PENALTY",
        field: "trustLevel",
        delta,
        reason: `${4}+ urgency words detected. Excessive urgency language erodes trust.`,
      }];
    },
  },
  {
    id: "TRUST_WORDS_BONUS",
    description: "Trust words present → boost trustLevel",
    condition: (_s, _v, ocr) => ocr.trustWords.length > 0,
    apply: (s, _v, ocr, _f) => {
      const delta = +12;
      s.trustLevel = clamp(s.trustLevel + delta);
      return [{
        rule: "TRUST_WORDS_BONUS",
        field: "trustLevel",
        delta,
        reason: `${ocr.trustWords.length} trust/credibility word(s) detected.`,
      }];
    },
  },

  // ── Offer / conversion readiness rules ───────────────────────────────────

  {
    id: "PRICE_AND_CTA_OFFER_BONUS",
    description: "Price + CTA = clear conversion offer → boost offerClarity",
    condition: (_s, _v, ocr) => ocr.price !== null && ocr.ctaPhrase !== null,
    apply: (s) => {
      const delta = +15;
      s.offerClarity = clamp(s.offerClarity + delta);
      return [{
        rule: "PRICE_AND_CTA_OFFER_BONUS",
        field: "offerClarity",
        delta,
        reason: "Both price and CTA phrase detected. Strong purchase signal — offer clarity boosted.",
      }];
    },
  },
  {
    id: "DISCOUNT_OFFER_BONUS",
    description: "Discount detected → offer clarity increases",
    condition: (_s, _v, ocr) => ocr.discount !== null,
    apply: (s) => {
      const delta = +10;
      s.offerClarity = clamp(s.offerClarity + delta);
      return [{
        rule: "DISCOUNT_OFFER_BONUS",
        field: "offerClarity",
        delta,
        reason: "Discount/percentage-off detected. Offer is clearly communicated.",
      }];
    },
  },

  // ── Emotional / face rules ────────────────────────────────────────────────

  {
    id: "FACE_EMOTIONAL_APPEAL_BONUS",
    description: "Face detected → human presence boosts emotional resonance",
    condition: (_s, vision) => vision.faceDetected,
    apply: (s) => {
      const delta = +15;
      s.emotionalAppeal = clamp(s.emotionalAppeal + delta);
      return [{
        rule: "FACE_EMOTIONAL_APPEAL_BONUS",
        field: "emotionalAppeal",
        delta,
        reason: "Human face detected. People connect with human imagery — emotional appeal boosted.",
      }];
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function applyRuleCorrections(
  aiAnalysis: AIAnalysis,
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints
): { corrected: AIAnalysis; corrections: RuleCorrections } {
  // Working mutable copy of AI scores
  const scores: MutableScores = {
    messageClarity:  aiAnalysis.messageClarity,
    ctaStrength:     aiAnalysis.ctaStrength,
    trustLevel:      aiAnalysis.trustLevel,
    cognitiveLoad:   aiAnalysis.cognitiveLoad,
    emotionalAppeal: aiAnalysis.emotionalAppeal,
    offerClarity:    aiAnalysis.offerClarity,
    brandVisibility: aiAnalysis.brandVisibility,
  };

  const allCorrections: AppliedRule[] = [];
  const warnings: string[] = [];

  for (const rule of CORRECTION_RULES) {
    try {
      if (rule.condition(scores, vision, ocr, funnel)) {
        const applied = rule.apply(scores, vision, ocr, funnel);
        allCorrections.push(...applied);
        console.log(`[DecisionEngine] Applied rule: ${rule.id}`);
      }
    } catch (err) {
      const msg = `Rule ${rule.id} failed: ${err instanceof Error ? err.message : "unknown"}`;
      warnings.push(msg);
      console.warn(`[DecisionEngine] ${msg}`);
    }
  }

  const corrected: AIAnalysis = {
    ...aiAnalysis,
    messageClarity:  scores.messageClarity,
    ctaStrength:     scores.ctaStrength,
    trustLevel:      scores.trustLevel,
    cognitiveLoad:   scores.cognitiveLoad,
    emotionalAppeal: scores.emotionalAppeal,
    offerClarity:    scores.offerClarity,
    brandVisibility: scores.brandVisibility,
  };

  return {
    corrected,
    corrections: { corrections: allCorrections, warnings },
  };
}
