/**
 * ACIE v5.0 — Module 6: Scoring Engine
 *
 * Normalizes all signals and corrected AI scores into the final structured output format.
 * Applies the grading system and formats explainable score objects.
 */

import type {
  AIAnalysis,
  VisionMetrics,
  OCRStructure,
  FunnelHints,
  CTADetectorResult,
  FinalScores,
  ScoredDimension,
  CreativeGrade,
  AppliedRule,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createDimension(
  value: number,
  explanation: string,
  contributingSignals: string[],
  penaltiesApplied: string[] = [],
  confidence: number = 0.8
): ScoredDimension {
  return {
    value: Math.round(Math.min(100, Math.max(0, value))),
    explanation,
    contributingSignals,
    penaltiesApplied,
    confidence,
  };
}

function calculateGrade(overallScore: number): CreativeGrade {
  if (overallScore >= 90) return "Elite Creative";
  if (overallScore >= 75) return "Strong Performer";
  if (overallScore >= 60) return "Needs Optimization";
  return "High Risk Creative";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFinalScores(
  ai: AIAnalysis,
  vision: VisionMetrics,
  ocr: OCRStructure,
  funnel: FunnelHints,
  ctaAgent: CTADetectorResult,
  appliedRules: AppliedRule[]
): FinalScores {
  // Extract rules applied to specific fields for the "penaltiesApplied" array
  const getRulesFor = (field: string) =>
    appliedRules.filter((r) => r.field === field).map((r) => r.rule);

  // 1. Attention (Vision + AI)
  // Contrast + Edge density play a big role physically. AI scores the message part.
  const attentionScore = (vision.contrastLevel * 0.4) + (ai.messageClarity * 0.6);
  const attention = createDimension(
    attentionScore,
    "How well the creative commands initial visual attention.",
    [
      `Contrast Level: ${vision.contrastLevel}`,
      `Clarity: ${ai.messageClarity}`,
      `Edge Density: ${vision.edgeDensity}`,
    ],
    getRulesFor("messageClarity")
  );

  // 2. Clarity (AI + OCR + Vision)
  const clarityScore = ai.messageClarity - (vision.visualClutterScore * 20);
  const clarity = createDimension(
    clarityScore,
    "How easily the core message is understood within 2 seconds.",
    [
      `Word Count: ${ocr.wordCount}`,
      `Text Coverage: ${vision.textAreaPercentage}%`,
    ],
    getRulesFor("messageClarity")
  );

  // 3. Trust (AI + OCR)
  const trust = createDimension(
    ai.trustLevel,
    "Credibility signals and brand authenticity.",
    [`Trust Words: ${ocr.trustWords.length > 0 ? ocr.trustWords.join(", ") : "None"}`],
    getRulesFor("trustLevel")
  );

  // 4. Persuasion (AI + Funnel)
  const persuasionScore = (ai.offerClarity * 0.5) + (ai.emotionalAppeal * 0.5);
  const persuasion = createDimension(
    persuasionScore,
    "The strength of the argument to take action.",
    [`Benefit Words: ${ocr.benefitWords.length}`],
    []
  );

  // 5. Brand Recall (AI + OCR)
  const brandRecall = createDimension(
    ai.brandVisibility,
    "Likelihood the viewer remembers the brand.",
    [`Brand Name Detected: ${ocr.brandName ? "Yes" : "No"}`],
    getRulesFor("brandVisibility")
  );

  // 6. CTA Strength (AI + OCR)
  // Incorporate the strict CTA detector's strength into the AI's base estimate.
  const ctaStrengthScore = ctaAgent.cta_detected 
    ? (ai.ctaStrength * 0.5 + (ctaAgent.cta_strength * 25) * 0.5) 
    : 0;
    
  const ctaStrength = createDimension(
    ctaStrengthScore,
    "Clarity and friction of the call-to-action.",
    [`CTA Phrase: ${ctaAgent.cta_text || "None"}`, `CTA Modality: ${ctaAgent.cta_modality}`],
    getRulesFor("ctaStrength")
  );

  // 7. Emotional Resonance (AI + Vision + OCR)
  const emotionalResonance = createDimension(
    ai.emotionalAppeal,
    "Ability to evoke feeling or connection.",
    [
      `Face Detected: ${vision.faceDetected ? "Yes" : "No"}`,
      `Emotional Words: ${ocr.emotionalWords.length}`,
    ],
    getRulesFor("emotionalAppeal")
  );

  // 8. Conversion Readiness (Funnel + AI + CTADetector)
  // Base readiness comes from funnel hints, scaled by offer clarity
  const baseReadiness = funnel.probabilities.conversion * 100;
  let conversionReadinessScore = (baseReadiness * 0.5) + (ai.offerClarity * 0.5);
  const conversionPenalties = [];

  // MUST ADD THIS INSIDE YOUR DECISION ENGINE:
  if (!ctaAgent.cta_detected) {
    conversionReadinessScore -= 20;
    conversionPenalties.push("MISSING_CTA_PENALTY");
  }

  const conversionReadiness = createDimension(
    conversionReadinessScore,
    "Structural readiness to drive a direct conversion.",
    [
      `Price/Discount: ${ocr.price || ocr.discount ? "Yes" : "No"}`,
      `Urgency Words: ${ocr.urgencyWords.length}`,
    ],
    conversionPenalties
  );

  // 9. Cognitive Simplicity (Vision + AI)
  // Inverse of cognitive load.
  const cognitiveSimplicityScore = 100 - ai.cognitiveLoad;
  const cognitiveSimplicity = createDimension(
    cognitiveSimplicityScore,
    "Ease of mental processing.",
    [
      `Visual Clutter: ${vision.visualClutterScore}`,
      `Whitespace Ratio: ${vision.whitespaceRatio}`,
    ],
    getRulesFor("cognitiveLoad")
  );

  // 10. Visual Balance (Vision)
  const visualBalance = createDimension(
    vision.layoutBalance,
    "Symmetry and layout stability.",
    [`Layout Symmetry: ${vision.layoutBalance}`],
    []
  );

  // ── Overall Score ──────────────────────────────────────────────────────────
  // A weighted combination of the core dimensions
  const overallScoreRaw =
    (attention.value * 0.20) +
    (clarity.value * 0.15) +
    (persuasion.value * 0.15) +
    (ctaStrength.value * 0.15) +
    (cognitiveSimplicity.value * 0.10) +
    (trust.value * 0.10) +
    (brandRecall.value * 0.10) +
    (visualBalance.value * 0.05);

  const overallScore = Math.round(overallScoreRaw);
  const grade = calculateGrade(overallScore);

  return {
    attention,
    clarity,
    trust,
    persuasion,
    brandRecall,
    ctaStrength,
    emotionalResonance,
    conversionReadiness,
    cognitiveSimplicity,
    visualBalance,
    overallScore,
    grade,
  };
}
