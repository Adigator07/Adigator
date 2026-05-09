/**
 * STRATEGIC ANALYSIS ENGINE
 * Produces enterprise-grade contextual intelligence output
 * 
 * Transforms raw scoring into strategic insights that answer:
 * "How well does this creative align with the selected campaign goal + vertical?"
 */

import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { FinalScores } from "./scoring-engine";
import type { NormalizedOcrResult } from "@/app/lib/ocr-normalization/types";

export interface ContextualAnalysis {
  // Primary Strategic Score
  strategyAlignmentScore: number;
  strategyAlignmentExplanation: string;

  // 15 Contextual Analysis Scores
  scores: {
    strategyAlignment: { score: number; confidence: number };
    goalAlignment: { score: number; confidence: number };
    ctaAlignment: { score: number; confidence: number };
    emotionalAlignment: { score: number; confidence: number };
    layoutAlignment: { score: number; confidence: number };
    mobileReadiness: { score: number; confidence: number };
    auctionReadiness: { score: number; confidence: number };
    trustAlignment: { score: number; confidence: number };
    visualClarity: { score: number; confidence: number };
    verticalRelevance: { score: number; confidence: number };
    brandAlignment: { score: number; confidence: number };
    conversionPotential: { score: number; confidence: number };
    engagementPotential: { score: number; confidence: number };
    readabilityScore: { score: number; confidence: number };
    competitiveStrength: { score: number; confidence: number };
  };

  // Behavioral Analysis
  behavioralGaps: {
    emotionalGaps: string[];
    ctaGaps: string[];
    layoutGaps: string[];
    trustGaps: string[];
    urgencyGaps: string[];
  };

  // Auction Readiness
  auctionReadiness: {
    readinessScore: number;
    risks: string[];
    strengths: string[];
    criticalIssues: string[];
  };

  // Strategic Recommendations
  recommendations: {
    critical: string[];
    high: string[];
    medium: string[];
    lowPriority: string[];
  };

  // Strengths Analysis
  strengths: {
    primary: string;
    secondary: string[];
  };

  // Weaknesses Analysis
  weaknesses: {
    primary: string;
    secondary: string[];
  };

  // Confidence & Signals
  overallConfidence: number;
  confidenceExplanation: string;
  signalsConsistency: number;

  // Context
  contextNotes: string[];
  comparisonContext: string;
}

export function analyzeContextualAlignment(
  rawScores: FinalScores,
  ocr: NormalizedOcrResult,
  profile: IntelligenceProfile,
  ctaDetection: any,
  layoutAnalysis: any
): ContextualAnalysis {
  // ─────────────────────────────────────────────────────────────────
  // 1. STRATEGY ALIGNMENT SCORE (Primary Metric)
  // ─────────────────────────────────────────────────────────────────
  const strategyAlignment = calculateStrategyAlignment(rawScores, profile, ctaDetection, layoutAnalysis);

  // ─────────────────────────────────────────────────────────────────
  // 2. CONTEXTUAL ANALYSIS SCORES (15 dimensions)
  // ─────────────────────────────────────────────────────────────────
  const scores = calculateContextualScores(
    rawScores,
    ocr,
    profile,
    ctaDetection,
    layoutAnalysis
  );

  // ─────────────────────────────────────────────────────────────────
  // 3. BEHAVIORAL GAPS
  // ─────────────────────────────────────────────────────────────────
  const behavioralGaps = analyzeBehavioralGaps(profile, ocr, ctaDetection, layoutAnalysis);

  // ─────────────────────────────────────────────────────────────────
  // 4. AUCTION READINESS
  // ─────────────────────────────────────────────────────────────────
  const auctionReadiness = assessAuctionReadiness(
    scores,
    rawScores,
    profile,
    ctaDetection,
    ocr
  );

  // ─────────────────────────────────────────────────────────────────
  // 5. STRATEGIC RECOMMENDATIONS
  // ─────────────────────────────────────────────────────────────────
  const recommendations = generateStrategicRecommendations(
    profile,
    rawScores,
    scores,
    behavioralGaps,
    ocr
  );

  // ─────────────────────────────────────────────────────────────────
  // 6. STRENGTHS & WEAKNESSES
  // ─────────────────────────────────────────────────────────────────
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(
    scores,
    profile,
    ctaDetection,
    layoutAnalysis
  );

  // ─────────────────────────────────────────────────────────────────
  // 7. CONFIDENCE CALCULATION
  // ─────────────────────────────────────────────────────────────────
  const { overallConfidence, confidenceExplanation, signalsConsistency } =
    calculateConfidence(rawScores, ocr, scores);

  // ─────────────────────────────────────────────────────────────────
  // 8. CONTEXTUAL NOTES
  // ─────────────────────────────────────────────────────────────────
  const contextNotes = generateContextNotes(profile, scores, behavioralGaps);

  return {
    strategyAlignmentScore: strategyAlignment.score,
    strategyAlignmentExplanation: strategyAlignment.explanation,
    scores,
    behavioralGaps,
    auctionReadiness,
    recommendations,
    strengths,
    weaknesses,
    overallConfidence,
    confidenceExplanation,
    signalsConsistency,
    contextNotes,
    comparisonContext: generateComparisonContext(profile),
  };
}

function calculateStrategyAlignment(
  rawScores: FinalScores,
  profile: IntelligenceProfile,
  ctaDetection: any,
  layoutAnalysis: any
): { score: number; explanation: string } {
  // Weighted combination based on goal
  let score = 0;
  let weights: Record<string, number> = {};

  if (profile.goal === "awareness") {
    // Awareness: emotional resonance + attention + clarity
    weights = {
      attention: 0.3,
      clarity: 0.25,
      persuasion: 0.2,
      ctaStrength: 0.1,
      trust: 0.15,
    };
  } else if (profile.goal === "consideration") {
    // Consideration: trust + clarity + information density
    weights = {
      trust: 0.35,
      clarity: 0.3,
      persuasion: 0.15,
      attention: 0.1,
      ctaStrength: 0.1,
    };
  } else {
    // Conversion: CTA + urgency + clarity
    weights = {
      ctaStrength: 0.35,
      clarity: 0.25,
      persuasion: 0.25,
      attention: 0.1,
      trust: 0.05,
    };
  }

  score =
    rawScores.attention.value * weights.attention +
    rawScores.clarity.value * weights.clarity +
    rawScores.trust.value * weights.trust +
    rawScores.persuasion.value * weights.persuasion +
    rawScores.ctaStrength.value * weights.ctaStrength;

  score = Math.round(score);

  let explanation = "";
  if (score >= 85) {
    explanation = `Excellent alignment with ${profile.goal} strategy for ${profile.vertical}. Creative demonstrates strong contextual fit.`;
  } else if (score >= 75) {
    explanation = `Good alignment with ${profile.goal} strategy. Minor optimizations recommended for ${profile.vertical} context.`;
  } else if (score >= 65) {
    explanation = `Moderate alignment with ${profile.goal} strategy. Significant optimization opportunities identified for ${profile.vertical}.`;
  } else {
    explanation = `Poor alignment with ${profile.goal} strategy for ${profile.vertical}. Major revisions recommended.`;
  }

  return { score, explanation };
}

function calculateContextualScores(
  rawScores: FinalScores,
  ocr: NormalizedOcrResult,
  profile: IntelligenceProfile,
  ctaDetection: any,
  layoutAnalysis: any
) {
  // Map raw scores to 15 contextual dimensions
  const baseConfidence = Math.min(
    0.95,
    Math.max(
      0.5,
      (ocr.confidence ?? 0.7) * 0.7 + rawScores.overallConfidence * 0.3
    )
  );

  return {
    strategyAlignment: {
      score: Math.round(
        rawScores.attention.value * 0.3 +
          rawScores.clarity.value * 0.3 +
          rawScores.persuasion.value * 0.4
      ),
      confidence: baseConfidence,
    },
    goalAlignment: {
      score: ctaDetection.detected
        ? Math.round(rawScores.ctaStrength.value * 0.6 + rawScores.persuasion.value * 0.4)
        : Math.round(rawScores.persuasion.value * 0.7 + rawScores.attention.value * 0.3),
      confidence: ctaDetection.detected ? baseConfidence : baseConfidence * 0.8,
    },
    ctaAlignment: {
      score: ctaDetection.detected ? Math.round(rawScores.ctaStrength.value) : 40,
      confidence: ctaDetection.detected ? ctaDetection.confidence * 0.01 : 0.5,
    },
    emotionalAlignment: {
      score: Math.round(rawScores.persuasion.value),
      confidence: baseConfidence,
    },
    layoutAlignment: {
      score: Math.round(
        layoutAnalysis.weightedScore ?? (rawScores.clarity.value + rawScores.attention.value) / 2
      ),
      confidence: baseConfidence,
    },
    mobileReadiness: {
      score: Math.round(layoutAnalysis.metrics?.mobileReadability?.score ?? rawScores.clarity.value),
      confidence: baseConfidence,
    },
    auctionReadiness: {
      score: Math.round(
        (rawScores.attention.value * 0.3 +
          rawScores.clarity.value * 0.3 +
          rawScores.ctaStrength.value * 0.4) *
          (ctaDetection.detected ? 1 : 0.8)
      ),
      confidence: baseConfidence,
    },
    trustAlignment: {
      score: Math.round(rawScores.trust.value),
      confidence: baseConfidence,
    },
    visualClarity: {
      score: Math.round(rawScores.clarity.value),
      confidence: baseConfidence,
    },
    verticalRelevance: {
      score: Math.round(
        55 +
          (ctaDetection.detected ? 12 : 0) +
          (layoutAnalysis.metrics ? 12 : 0) +
          Math.min(21, (ocr.blocks?.length ?? 0) * 3)
      ),
      confidence: baseConfidence,
    },
    brandAlignment: {
      score: ocr.blocks.length > 0 ? Math.round(65) : Math.round(50),
      confidence: baseConfidence * 0.9,
    },
    conversionPotential: {
      score: Math.round(
        rawScores.ctaStrength.value * 0.4 +
          rawScores.persuasion.value * 0.3 +
          rawScores.clarity.value * 0.3
      ),
      confidence: baseConfidence,
    },
    engagementPotential: {
      score: Math.round(
        rawScores.attention.value * 0.4 +
          rawScores.persuasion.value * 0.3 +
          rawScores.clarity.value * 0.3
      ),
      confidence: baseConfidence,
    },
    readabilityScore: {
      score: Math.round(rawScores.clarity.value),
      confidence: baseConfidence,
    },
    competitiveStrength: {
      score: Math.round(rawScores.overallScore),
      confidence: baseConfidence,
    },
  };
}

function analyzeBehavioralGaps(
  profile: IntelligenceProfile,
  ocr: NormalizedOcrResult,
  ctaDetection: any,
  layoutAnalysis: any
) {
  const gaps = {
    emotionalGaps: [] as string[],
    ctaGaps: [] as string[],
    layoutGaps: [] as string[],
    trustGaps: [] as string[],
    urgencyGaps: [] as string[],
  };

  // Emotional gaps
  const textLength = ocr.cleanedText.length;
  const hasEmotionalContent = textLength > 100; // Assume longer text may have emotional content
  if (!hasEmotionalContent && profile.goal !== "conversion") {
    gaps.emotionalGaps.push(
      `Limited emotional content for ${profile.goal} campaign in ${profile.vertical}. Consider more storytelling.`
    );
  }

  // CTA gaps
  if (!ctaDetection.detected && profile.ctaExpectations.required) {
    gaps.ctaGaps.push(
      `No CTA detected. ${profile.goal} campaigns for ${profile.vertical} require explicit call-to-action.`
    );
  } else if (ctaDetection.detected) {
    const ctaStrength = ctaDetection.strength ?? 1;
    if (profile.goal === "awareness" && ctaStrength > 3) {
      gaps.ctaGaps.push(`CTA too aggressive for awareness stage. Recommend softer phrasing.`);
    }
    if (profile.goal === "conversion" && ctaStrength < 2) {
      gaps.ctaGaps.push(`CTA lacks urgency for conversion. Recommend stronger action language.`);
    }
  }

  // Layout gaps
  const density = layoutAnalysis.metrics?.textDensity?.score ?? 50;
  if (profile.layoutExpectations.density === "minimal" && density > 65) {
    gaps.layoutGaps.push(`Excessive text density for ${profile.vertical}. Recommend increasing whitespace.`);
  }

  // Trust gaps
  const trustSignals = ocr.blocks.filter(b => b.text.length > 20).length;
  if (profile.goal === "consideration" && trustSignals < 2) {
    gaps.trustGaps.push(`Insufficient trust signals for consideration stage. Add credibility markers.`);
  }

  // Urgency gaps
  const textHasUrgency = ocr.cleanedText.toLowerCase().includes("now") || ocr.cleanedText.toLowerCase().includes("limited");
  if (profile.goal === "conversion" && !textHasUrgency) {
    gaps.urgencyGaps.push(`No urgency language detected. Consider adding time-sensitive messaging.`);
  }

  return gaps;
}

function assessAuctionReadiness(
  scores: any,
  rawScores: FinalScores,
  profile: IntelligenceProfile,
  ctaDetection: any,
  ocr: NormalizedOcrResult
) {
  const readinessScore = Math.round(scores.auctionReadiness.score);
  const risks: string[] = [];
  const strengths: string[] = [];
  const criticalIssues: string[] = [];

  // Risk assessment
  if (scores.mobileReadiness.score < 60) {
    risks.push("Mobile readability below recommended threshold");
  }
  if (scores.visualClarity.score < 60) {
    risks.push("Visual clarity may impact mobile performance");
  }
  if (!ctaDetection.detected && profile.goal === "conversion") {
    criticalIssues.push("Missing CTA critical for conversion auctions");
  }
  if (rawScores.overallScore < 60) {
    risks.push("Overall creative quality below competitive baseline");
  }

  // Strengths
  if (scores.visualClarity.score > 80) {
    strengths.push("Strong visual clarity supports engagement");
  }
  if (scores.ctaAlignment.score > 75) {
    strengths.push("CTA well-aligned with campaign goal");
  }
  if (scores.trustAlignment.score > 75) {
    strengths.push("Strong trust signals build confidence");
  }
  const wordCount = ocr.cleanedText.split(/\s+/).length;
  if (wordCount < 20 && profile.goal === "awareness") {
    strengths.push("Excellent copy conciseness for brand awareness");
  }

  return {
    readinessScore,
    risks,
    strengths,
    criticalIssues,
  };
}

function generateStrategicRecommendations(
  profile: IntelligenceProfile,
  rawScores: FinalScores,
  scores: any,
  behavioralGaps: any,
  ocr: NormalizedOcrResult
) {
  const recommendations = {
    critical: [] as string[],
    high: [] as string[],
    medium: [] as string[],
    lowPriority: [] as string[],
  };

  // Critical issues
  if (behavioralGaps.ctaGaps.length > 0) {
    recommendations.critical.push(...behavioralGaps.ctaGaps);
  }
  if (scores.auctionReadiness.score < 50) {
    recommendations.critical.push(
      `Overall creative alignment with ${profile.goal} strategy is critically low. Major revisions recommended.`
    );
  }

  // High priority
  if (behavioralGaps.emotionalGaps.length > 0) {
    recommendations.high.push(...behavioralGaps.emotionalGaps);
  }
  if (behavioralGaps.layoutGaps.length > 0) {
    recommendations.high.push(...behavioralGaps.layoutGaps);
  }
  if (scores.mobileReadiness.score < 65) {
    recommendations.high.push("Mobile readability needs improvement for programmatic environments");
  }

  // Medium priority
  if (behavioralGaps.trustGaps.length > 0) {
    recommendations.medium.push(...behavioralGaps.trustGaps);
  }
  if (behavioralGaps.urgencyGaps.length > 0) {
    recommendations.medium.push(...behavioralGaps.urgencyGaps);
  }

  // Low priority
  if (scores.brandAlignment.score < 70) {
    recommendations.lowPriority.push("Consider strengthening brand presence");
  }

  return recommendations;
}

function analyzeStrengthsWeaknesses(
  scores: any,
  profile: IntelligenceProfile,
  ctaDetection: any,
  layoutAnalysis: any
) {
  let primaryStrength = "Solid overall alignment";
  let primaryWeakness = "Minor optimization opportunities";

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Identify primary strength
  if (scores.visualClarity.score > 80) {
    primaryStrength = "Excellent visual clarity and scannability";
    strengths.push("High visual hierarchy enables quick content parsing");
  } else if (ctaDetection.detected && scores.ctaAlignment.score > 75) {
    primaryStrength = "Well-articulated call-to-action";
    strengths.push("CTA is prominent and action-oriented");
  } else if (scores.emotionalAlignment.score > 75) {
    primaryStrength = "Strong emotional resonance";
    strengths.push("Messaging connects with target audience motivations");
  }

  // Identify primary weakness
  if (scores.mobileReadiness.score < 65) {
    primaryWeakness = "Mobile readability concerns";
    weaknesses.push("Text sizing may be problematic on small screens");
  } else if (!ctaDetection.detected) {
    primaryWeakness = "Missing call-to-action";
    weaknesses.push("No clear action requested from audience");
  } else if (scores.trustAlignment.score < 65) {
    primaryWeakness = "Limited trust signals";
    weaknesses.push("Insufficient credibility markers for consideration stage");
  }

  return {
    strengths: { primary: primaryStrength, secondary: strengths },
    weaknesses: { primary: primaryWeakness, secondary: weaknesses },
  };
}

function calculateConfidence(
  rawScores: FinalScores,
  ocr: NormalizedOcrResult,
  scores: any
): { overallConfidence: number; confidenceExplanation: string; signalsConsistency: number } {
  const ocrConfidence = (ocr.confidence ?? 0.7) * 100;
  const scoreConsistency = calculateScoreConsistency(scores);
  const signalsPresence = calculateSignalsPresence(ocr);

  const overallConfidence = Math.round(
    (ocrConfidence * 0.3 + scoreConsistency * 0.4 + signalsPresence * 0.3) / 100
  );

  let explanation = "";
  if (overallConfidence >= 85) {
    explanation = "High confidence analysis based on clear signals and consistent scoring";
  } else if (overallConfidence >= 70) {
    explanation = "Moderate-to-high confidence with minor signal ambiguities";
  } else if (overallConfidence >= 55) {
    explanation = "Moderate confidence - recommend manual review for edge cases";
  } else {
    explanation = "Lower confidence - insufficient signals for definitive assessment";
  }

  return {
    overallConfidence,
    confidenceExplanation: explanation,
    signalsConsistency: scoreConsistency,
  };
}

function calculateScoreConsistency(scores: any): number {
  const values = Object.values(scores).map((s: any) => s.score).filter((v: any) => typeof v === "number");
  if (values.length < 2) return 100;

  const mean = values.reduce((a: any, b: any) => a + b, 0) / values.length;
  const variance = values.reduce((sum: any, v: any) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Convert standard deviation to consistency score (0-100)
  return Math.max(0, Math.min(100, 100 - stdDev / 2));
}

function calculateSignalsPresence(ocr: NormalizedOcrResult): number {
  let signals = 0;
  if (ocr.blocks.length > 5) signals += 20;
  if (ocr.cleanedText.length > 100) signals += 20; // Emotional/substantive content
  if (ocr.confidence > 0.8) signals += 20; // OCR confidence
  if (ocr.blocks.some(b => b.text.length > 50)) signals += 20; // Trust-building longer text
  if (ocr.cleanedText.toLowerCase().includes("now") || ocr.cleanedText.toLowerCase().includes("limited")) signals += 20; // Urgency

  return Math.min(100, signals);
}

function generateContextNotes(
  profile: IntelligenceProfile,
  scores: any,
  behavioralGaps: any
): string[] {
  const notes: string[] = [];

  if (profile.goal === "awareness") {
    notes.push("Awareness creatives should prioritize attention and emotional connection");
  } else if (profile.goal === "consideration") {
    notes.push("Consideration creatives should balance information clarity with trust signals");
  } else {
    notes.push("Conversion creatives must prioritize action clarity and urgency");
  }

  if (behavioralGaps.emotionalGaps.length > 0) {
    notes.push("Emotional alignment is below profile expectations for this vertical");
  }

  if (scores.mobileReadiness.score < 70) {
    notes.push("Mobile optimization is critical for programmatic success");
  }

  return notes;
}

function generateComparisonContext(profile: IntelligenceProfile): string {
  return `Analyzed as ${profile.goal} campaign in the ${profile.vertical} vertical. This context shapes all evaluations.`;
}
