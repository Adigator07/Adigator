/**
 * Production-Grade Scoring Engine
 * Registry-aware, profile-driven, deterministic
 * Combines OCR quality, CTA alignment, layout analysis
 */

import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";

export interface ScoringContext {
  ocr: any;
  ctaDetection: any;
  layoutAnalysis: any;
}

export interface ScoredDimension {
  value: number;
  explanation: string;
  signals: string[];
  penalties: string[];
  confidence: number;
}

export interface FinalScores {
  attention: ScoredDimension;
  clarity: ScoredDimension;
  trust: ScoredDimension;
  persuasion: ScoredDimension;
  ctaStrength: ScoredDimension;
  overallScore: number;
  grade: "Elite Creative" | "Strong Performer" | "Needs Optimization" | "High Risk Creative";
  overallConfidence: number;
}

function createDimension(
  value: number,
  explanation: string,
  signals: string[],
  penalties: string[] = [],
  confidence: number = 0.8
): ScoredDimension {
  return {
    value: Math.max(0, Math.min(100, Math.round(value))),
    explanation,
    signals,
    penalties,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

export function calculateFinalScores(
  context: ScoringContext,
  profile: IntelligenceProfile
): FinalScores {
  const { ocr, ctaDetection, layoutAnalysis } = context;

  // ── Get profile-specific weights ───────────────────────────────────
  const weights = profile.scoringPreferences.weights;

  // ── Normalize layout metrics from the layout engine output ──────────
  const hierarchyScore =
    layoutAnalysis?.metrics?.visualHierarchy?.score ??
    layoutAnalysis?.scores?.visualHierarchy ??
    layoutAnalysis?.hierarchy ??
    50;
  const clutterScore =
    layoutAnalysis?.metrics?.clutter?.score ??
    layoutAnalysis?.scores?.clutter ??
    (typeof layoutAnalysis?.clutter === "number" ? (100 - layoutAnalysis.clutter * 100) : 50);
  const textDensityScore =
    layoutAnalysis?.metrics?.textDensity?.score ??
    layoutAnalysis?.scores?.textDensity ??
    layoutAnalysis?.textDensity ??
    50;
  const mobileReadabilityScore =
    layoutAnalysis?.metrics?.mobileReadability?.score ??
    layoutAnalysis?.scores?.mobileReadability ??
    layoutAnalysis?.mobileReadability ??
    50;

  // ── 1. ATTENTION (clarity + visibility) ─────────────────────────────
  const attentionValue = Math.round(
    hierarchyScore * 0.5 + clutterScore * 0.5
  );

  const attention = createDimension(
    attentionValue,
    "How well the creative commands initial visual attention",
    [
      `Hierarchy score: ${Math.round(hierarchyScore)}`,
      `Clutter quality: ${Math.round(clutterScore)}%`,
    ]
  );

  // ── 2. CLARITY (text density + readability) ─────────────────────────
  let clarityValue = 75;
  if (textDensityScore < 45) clarityValue -= 15;
  if (ocr.wordCount > 50) clarityValue -= 10;
  if (clutterScore < 40) clarityValue -= 20;

  const clarity = createDimension(
    clarityValue,
    "How easily the core message is understood in 2 seconds",
    [
      `Text density quality: ${Math.round(textDensityScore)}%`,
      `Word count: ${ocr.wordCount}`,
    ],
    textDensityScore < 45 ? ["TEXT_OVERLOAD"] : []
  );

  // ── 3. TRUST (signals from OCR + registry expectations) ──────────────
  let trustValue = 60;
  if (ocr.trustWords && ocr.trustWords.length >= 2) trustValue += 15;
  if (ocr.brandName) trustValue += 10;

  const trust = createDimension(
    trustValue,
    "Credibility signals and brand authenticity",
    [
      `Trust words: ${ocr.trustWords?.length || 0}`,
      `Brand detected: ${ocr.brandName ? "yes" : "no"}`,
    ]
  );

  // ── 4. PERSUASION (offer + emotional triggers) ──────────────────────
  let persuasionValue = 60;
  if (ocr.price || ocr.discount) persuasionValue += 15;
  if (ocr.benefitWords && ocr.benefitWords.length >= 3) persuasionValue += 10;
  if (ocr.emotionalWords && ocr.emotionalWords.length >= 2) persuasionValue += 10;

  const persuasion = createDimension(
    persuasionValue,
    "The strength of the argument to take action",
    [
      `Offer: ${ocr.price ? "yes" : "no"}`,
      `Benefit words: ${ocr.benefitWords?.length || 0}`,
      `Emotional words: ${ocr.emotionalWords?.length || 0}`,
    ]
  );

  // ── 5. CTA STRENGTH (detection + alignment with goal + profile) ───────
  let ctaStrengthValue = ctaDetection.strength * 25;

  // Goal alignment penalty/bonus
  if (profile.goal === "conversion" && ctaDetection.strength < 3) {
    ctaStrengthValue -= 20;
  }
  if (profile.goal === "awareness" && ctaDetection.strength > 2) {
    ctaStrengthValue -= 15;
  }

  // Registry requirement check
  const penalties: string[] = [];
  if (!ctaDetection.detected && profile.ctaExpectations.required) {
    penalties.push("CTA_REQUIRED_BUT_MISSING");
  }

  const ctaStrength = createDimension(
    ctaStrengthValue,
    "Clarity and alignment of the call-to-action with campaign goal",
    [
      `CTA detected: ${ctaDetection.detected ? "yes" : "no"}`,
      `CTA strength: ${ctaDetection.strength}/4`,
      `CTA required: ${profile.ctaExpectations.required ? "yes" : "no"}`,
    ],
    penalties
  );

  // ── OVERALL SCORE (weighted by profile preferences) ─────────────────
  // Map profile weights to our scoring dimensions correctly
  // Profile weight keys: visualClarity, ctaClarity, trustSignals, offerClarity, brandRecall
  // Our dimensions: attention, clarity, trust, persuasion, ctaStrength
  
  const weightedDimensions = {
    attention: attention.value * (weights.visualClarity || 0.2),
    clarity: clarity.value * (weights.ctaClarity || 0.2),
    trust: trust.value * (weights.trustSignals || 0.2),
    persuasion: persuasion.value * (weights.offerClarity || 0.2),
    ctaStrength: ctaStrength.value * (weights.brandRecall || 0.2),
  };

  // Apply any remaining weights (mobileLegibility affects readability bonus)
  const mobileLegibilityBonus =
    mobileReadabilityScore * (weights.mobileLegibility || 0.15);

  const overallScoreRaw =
    Object.values(weightedDimensions).reduce((a, b) => a + b, 0) +
    mobileLegibilityBonus * 5; // Normalize bonus

  const overallScore = Number.isFinite(overallScoreRaw)
    ? Math.round(Math.max(0, Math.min(100, overallScoreRaw)))
    : 0;

  // ── Calculate overall confidence ─────────────────────────────────────
  const overallConfidence =
    (attention.confidence +
      clarity.confidence +
      trust.confidence +
      ctaStrength.confidence) /
    4;

  // ── Determine grade ──────────────────────────────────────────────────
  let grade: "Elite Creative" | "Strong Performer" | "Needs Optimization" | "High Risk Creative";
  if (overallScore >= 85) grade = "Elite Creative";
  else if (overallScore >= 75) grade = "Strong Performer";
  else if (overallScore >= 60) grade = "Needs Optimization";
  else grade = "High Risk Creative";

  return {
    attention,
    clarity,
    trust,
    persuasion,
    ctaStrength,
    overallScore,
    grade,
    overallConfidence,
  };
}
