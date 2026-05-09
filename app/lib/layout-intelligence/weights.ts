import type { IntelligenceProfile } from "../intelligence-registry";
import type { LayoutScoreWeights } from "./types";

export const DEFAULT_LAYOUT_WEIGHTS: LayoutScoreWeights = {
  ctaVisibility: 0.12,
  textDensity: 0.08,
  whitespace: 0.08,
  clutter: 0.09,
  visualHierarchy: 0.12,
  brandDominance: 0.08,
  mobileReadability: 0.12,
  alignment: 0.07,
  contrastReadability: 0.08,
  visualBalance: 0.08,
  layoutClarity: 0.12,
  attentionDistribution: 0.06,
};

export function buildLayoutWeights(
  profile: IntelligenceProfile,
  overrides: Partial<LayoutScoreWeights> = {}
): LayoutScoreWeights {
  const weights: LayoutScoreWeights = { ...DEFAULT_LAYOUT_WEIGHTS };

  if (profile.layoutExpectations.whitespace === "generous") {
    weights.whitespace += 0.05;
    weights.clutter += 0.02;
  }

  if (profile.ctaExpectations.visibilityPriority === "critical") {
    weights.ctaVisibility += 0.07;
    weights.attentionDistribution += 0.03;
  }

  if (profile.mobilePreferences.minimumTextSize === "large") {
    weights.mobileReadability += 0.04;
  }

  if (profile.vertical === "luxury" || profile.vertical === "healthcare") {
    weights.whitespace += 0.04;
    weights.visualBalance += 0.03;
  }

  if (profile.vertical === "gaming" && profile.goal === "conversion") {
    weights.ctaVisibility += 0.06;
    weights.attentionDistribution += 0.04;
  }

  Object.assign(weights, overrides);

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / total])
  ) as LayoutScoreWeights;
}
