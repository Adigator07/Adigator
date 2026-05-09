import { buildLayoutWeights } from "./weights";
import { buildAttentionOrder, summarizeGeometry } from "./geometry";
import { simulateMobile390 } from "./viewport";
import {
  scoreAlignment,
  scoreAttentionDistribution,
  scoreBrandDominance,
  scoreClutter,
  scoreContrastReadability,
  scoreCtaVisibility,
  scoreLayoutClarity,
  scoreMobileReadability,
  scoreTextDensity,
  scoreVisualBalance,
  scoreVisualHierarchy,
  scoreWhitespace,
} from "./metrics";
import { weightedAverage } from "./math";
import { buildLayoutRecommendations } from "./recommendations";
import type { LayoutIntelligenceInput, LayoutIntelligenceResult, LayoutMetricMap } from "./types";

export function analyzeLayout(input: LayoutIntelligenceInput): LayoutIntelligenceResult {
  const { ocr } = input;
  const profile = input.options?.profile ?? ocr.context.intelligenceProfile;
  const weights = buildLayoutWeights(profile, input.options?.weights);
  const geometry = summarizeGeometry(ocr);
  const attentionOrder = buildAttentionOrder(ocr.blocks);
  const mobile390 = simulateMobile390(ocr);

  const textDensity = scoreTextDensity(geometry, profile);
  const whitespace = scoreWhitespace(geometry, profile);
  const clutter = scoreClutter(geometry);
  const visualHierarchy = scoreVisualHierarchy(ocr, attentionOrder);
  const mobileReadability = scoreMobileReadability(mobile390, profile);
  const alignment = scoreAlignment(ocr);

  const metrics: LayoutMetricMap = {
    ctaVisibility: scoreCtaVisibility(ocr, profile, attentionOrder),
    textDensity,
    whitespace,
    clutter,
    visualHierarchy,
    brandDominance: scoreBrandDominance(ocr, attentionOrder),
    mobileReadability,
    alignment,
    contrastReadability: scoreContrastReadability(ocr),
    visualBalance: scoreVisualBalance(geometry),
    layoutClarity: scoreLayoutClarity({
      textDensity,
      whitespace,
      clutter,
      visualHierarchy,
      alignment,
      mobileReadability,
    }),
    attentionDistribution: scoreAttentionDistribution(ocr, profile, attentionOrder),
  };

  const scores = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [key, value.score])
  ) as LayoutIntelligenceResult["scores"];

  const weightedScore = weightedAverage(
    Object.entries(scores).map(([key, score]) => ({
      score,
      weight: weights[key as keyof typeof weights],
    }))
  );

  return {
    scores,
    weightedScore,
    weights,
    metrics,
    geometry,
    viewportSimulations: [
      {
        name: "source",
        width: ocr.imageSize.width,
        height: ocr.imageSize.height,
        scale: 1,
        smallTextBlockIds: [],
        stickyBannerRisk: "low",
        compressionRisk: "low",
        readableBlockRatio: 1,
      },
      mobile390,
    ],
    attentionOrder,
    recommendations: buildLayoutRecommendations(metrics),
    profile: {
      key: profile.key,
      label: profile.label,
    },
  };
}
