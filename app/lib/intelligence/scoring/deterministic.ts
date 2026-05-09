import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { LayoutIntelligenceResult } from "@/app/lib/layout-intelligence/types";
import type { NormalizedOcrResult } from "@/app/lib/ocr-normalization";
import type { IntelligenceScore, IntelligenceSignal } from "../graph/types";
import { clampConfidence, clampScore } from "../graph/signal";

function signalAverage(signals: IntelligenceSignal[], typePrefix: string): number | null {
  const matching = signals.filter((signal) => signal.type.startsWith(typePrefix));
  if (matching.length === 0) return null;
  const weighted = matching.reduce((sum, signal) => sum + (50 + signal.scoreImpact * 3) * signal.confidence, 0);
  const total = matching.reduce((sum, signal) => sum + signal.confidence, 0);
  if (total <= 0) return null;
  return clampScore(weighted / total);
}

function scoreConfidence(signalIds: string[], signals: IntelligenceSignal[]): number | null {
  const matching = signals.filter((signal) => signalIds.includes(signal.id));
  if (matching.length === 0) return null;
  return clampConfidence(matching.reduce((sum, signal) => sum + signal.confidence, 0) / matching.length);
}

function weightedBlend(values: Array<{ value: number | null; weight: number }>): number | null {
  const valid = values.filter((entry) => Number.isFinite(entry.value));
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return null;
  const weightedSum = valid.reduce((sum, entry) => sum + (entry.value as number) * entry.weight, 0);
  return clampScore(weightedSum / totalWeight);
}

export function calculateDeterministicScores(input: {
  ocr: NormalizedOcrResult;
  layout: LayoutIntelligenceResult;
  profile: IntelligenceProfile;
  signals: IntelligenceSignal[];
}): Record<string, IntelligenceScore> {
  const { ocr, layout, profile, signals } = input;
  const weights = profile.scoringPreferences.weights;

  const ctaSignals = signals.filter((signal) => signal.type.startsWith("cta."));
  const verticalSignals = signals.filter((signal) => signal.type.startsWith("vertical."));
  const colorSignals = signals.filter((signal) => signal.type.startsWith("color."));
  const layoutSignals = signals.filter((signal) =>
    signal.type.startsWith("clutter.") ||
    signal.type.startsWith("hierarchy.") ||
    signal.type.startsWith("density.")
  );
  const readabilitySignals = signals.filter((signal) => signal.type.startsWith("readability."));

  const visualClarity = weightedBlend([
    { value: layout.metrics.visualHierarchy.score, weight: 0.3 },
    { value: layout.metrics.clutter.score, weight: 0.25 },
    { value: layout.metrics.contrastReadability.score, weight: 0.25 },
    { value: signalAverage(colorSignals, "color."), weight: 0.2 },
  ]);
  const ctaClarity = weightedBlend([
    { value: layout.metrics.ctaVisibility.score, weight: 0.45 },
    { value: signalAverage(ctaSignals, "cta."), weight: 0.55 },
  ]);
  const trustSignals = clampScore(
    45 +
    Math.min(30, ocr.blocks.filter((block) => block.features.hasTrustSignal).length * 12) +
    (profile.trustExpectations?.trustSignalsRequired ? 0 : 8)
  );
  const offerClarity = clampScore(
    45 +
    Math.min(35, ocr.blocks.filter((block) => block.features.hasPrice || block.features.hasDiscount).length * 18) +
    (ocr.cleanedText.length > 40 ? 8 : 0)
  );
  const brandRecall = clampScore(layout.metrics.brandDominance.score);
  const emotionalResonance = clampScore(
    45 +
    Math.min(35, ocr.blocks.filter((block) => block.features.hasEmotionalSignal).length * 10) +
    (profile.expectedEmotions.primary.some((emotion) => ocr.cleanedText.toLowerCase().includes(emotion)) ? 15 : 0)
  );
  const mobileLegibility = clampScore(layout.metrics.mobileReadability.score);
  const verticalAlignment = signalAverage(verticalSignals, "vertical.");

  const overall = weightedBlend([
    { value: visualClarity, weight: weights.visualClarity },
    { value: ctaClarity, weight: weights.ctaClarity },
    { value: trustSignals, weight: weights.trustSignals },
    { value: offerClarity, weight: weights.offerClarity },
    { value: brandRecall, weight: weights.brandRecall },
    { value: emotionalResonance, weight: weights.emotionalResonance },
    { value: mobileLegibility, weight: weights.mobileLegibility },
    {
      value: Number.isFinite(verticalAlignment) ? clampScore((verticalAlignment as number) - 50 + 50) : null,
      weight: 0.18,
    },
  ]);

  const mk = (
    id: string,
    label: string,
    value: number | null,
    signalIds: string[],
    reasoning: string
  ): IntelligenceScore => ({
    id,
    label,
    value: Number.isFinite(value) ? clampScore(value as number) : null,
    confidence: scoreConfidence(signalIds, signals),
    signalIds,
    reasoning,
    status: Number.isFinite(value) ? "success" : "insufficient_evidence",
    reasonUnavailable: Number.isFinite(value) ? undefined : "missing_validated_signals",
  });

  return {
    visualClarity: mk("visualClarity", "Visual Clarity", visualClarity, [...layoutSignals, ...colorSignals].map((s) => s.id), "Profile-aware combination of hierarchy, clutter, contrast, and palette fit."),
    ctaClarity: mk("ctaClarity", "CTA Clarity", ctaClarity, ctaSignals.map((s) => s.id), "CTA extraction, placement, visibility, and goal fit."),
    trustSignals: mk("trustSignals", "Trust Signals", trustSignals, [], "Deterministic trust-word coverage compared with profile expectation."),
    offerClarity: mk("offerClarity", "Offer Clarity", offerClarity, [], "Price, discount, and offer signal extraction from OCR blocks."),
    brandRecall: mk("brandRecall", "Brand Recall", brandRecall, [], "Brand dominance from OCR role classification and visual attention order."),
    emotionalResonance: mk("emotionalResonance", "Emotional Resonance", emotionalResonance, [], "Emotion terms compared with profile expectations."),
    mobileLegibility: mk("mobileLegibility", "Mobile Legibility", mobileLegibility, readabilitySignals.map((s) => s.id), "Mobile viewport readability simulation."),
    verticalAlignment: mk("verticalAlignment", "Vertical Alignment", verticalAlignment, verticalSignals.map((s) => s.id), "Selected vertical compared with detected creative category."),
    overall: mk("overall", "Overall Creative Intelligence", overall, signals.map((s) => s.id), `Weighted by locked ${profile.goal}/${profile.vertical} intelligence profile.`),
  };
}

export function calculateGraphConfidence(input: {
  ocrConfidence: number;
  signals: IntelligenceSignal[];
  conflictCount: number;
}): { overall: number | null; ocr: number | null; signalCoverage: number | null; validation: number | null } {
  const evidenceSignals = input.signals.filter((signal) => signal.evidence.length > 0);
  const signalCoverage = input.signals.length === 0 ? null : evidenceSignals.length / input.signals.length;
  const signalConfidence = input.signals.length === 0
    ? null
    : input.signals.reduce((sum, signal) => sum + signal.confidence, 0) / input.signals.length;
  const validation = Math.max(0, 1 - input.conflictCount * 0.12);
  const ocr = clampConfidence(input.ocrConfidence);
  const overall = (signalCoverage === null || signalConfidence === null)
    ? null
    : clampConfidence(ocr * 0.3 + signalCoverage * 0.25 + signalConfidence * 0.25 + validation * 0.2);

  return {
    overall,
    ocr,
    signalCoverage: signalCoverage === null ? null : clampConfidence(signalCoverage),
    validation: clampConfidence(validation),
  };
}
