import type { LayoutMetricMap } from "./types";

export function buildLayoutRecommendations(metrics: LayoutMetricMap): string[] {
  const recs: string[] = [];

  if (metrics.ctaVisibility.score < 65) {
    recs.push("Increase CTA prominence with clearer placement, larger button geometry, or stronger contrast.");
  }
  if (metrics.mobileReadability.score < 70) {
    recs.push("Improve mobile readability by reducing small text and limiting message units.");
  }
  if (metrics.whitespace.score < 65) {
    recs.push("Increase whitespace around primary message and CTA to reduce scanning friction.");
  }
  if (metrics.clutter.score < 70) {
    recs.push("Reduce visual congestion by removing overlapping or tightly packed text blocks.");
  }
  if (metrics.visualHierarchy.score < 70) {
    recs.push("Make one dominant headline or product message clearly lead the reading order.");
  }
  if (metrics.brandDominance.score < 60) {
    recs.push("Improve brand visibility without overpowering the primary message.");
  }

  return recs.length > 0 ? recs : ["Layout is structurally clear and ready for downstream scoring."];
}
