import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { LayoutIntelligenceResult } from "@/app/lib/layout-intelligence/types";
import type { IntelligenceSignal } from "../graph/types";
import { makeSignal } from "../graph/signal";

function impactFromScore(score: number, scale = 5): number {
  return Math.round((score - 50) / scale);
}

export function emitLayoutSignals(
  layout: LayoutIntelligenceResult,
  profile: IntelligenceProfile
): IntelligenceSignal[] {
  const metrics = layout.metrics;

  return [
    makeSignal({
      type: metrics.clutter.score >= 70 ? "clutter.acceptable" : "clutter.high",
      source: "layout",
      confidence: metrics.clutter.confidence / 100,
      reasoning: "Clutter is scored from OCR block count, overlap, and average spacing.",
      evidence: metrics.clutter.signals.map((value) => ({ kind: "clutter_metric", value })),
      scoreImpact: impactFromScore(metrics.clutter.score),
      severity: metrics.clutter.score >= 70 ? "low" : metrics.clutter.score >= 50 ? "medium" : "high",
    }),
    makeSignal({
      type: metrics.mobileReadability.score >= 70 ? "readability.mobile_ok" : "readability.mobile_risk",
      source: "layout",
      confidence: metrics.mobileReadability.confidence / 100,
      reasoning: `Mobile readability is evaluated against ${profile.mobilePreferences.minimumTextSize} text expectations.`,
      evidence: metrics.mobileReadability.signals.map((value) => ({ kind: "mobile_metric", value })),
      scoreImpact: impactFromScore(metrics.mobileReadability.score),
      severity: metrics.mobileReadability.score >= 70 ? "low" : "high",
    }),
    makeSignal({
      type: metrics.visualHierarchy.score >= 70 ? "hierarchy.clear" : "hierarchy.weak",
      source: "layout",
      confidence: metrics.visualHierarchy.confidence / 100,
      reasoning: "Visual hierarchy is scored from primary block dominance and headline rank.",
      evidence: metrics.visualHierarchy.signals.map((value) => ({ kind: "hierarchy_metric", value })),
      scoreImpact: impactFromScore(metrics.visualHierarchy.score),
      severity: metrics.visualHierarchy.score >= 70 ? "low" : "high",
    }),
    makeSignal({
      type: metrics.textDensity.score >= 70 ? "density.profile_fit" : "density.profile_mismatch",
      source: "layout",
      confidence: metrics.textDensity.confidence / 100,
      reasoning: `Text density is compared with the ${profile.layoutExpectations.density} layout expectation.`,
      evidence: metrics.textDensity.signals.map((value) => ({ kind: "density_metric", value })),
      scoreImpact: impactFromScore(metrics.textDensity.score, 6),
      severity: metrics.textDensity.score >= 70 ? "low" : "medium",
    }),
  ];
}
