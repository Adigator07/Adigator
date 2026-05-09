import type { IntelligenceProfile } from "../intelligence-registry";
import type { NormalizedOcrResult, NormalizedTextBlock } from "../ocr-normalization";

export type LayoutMetricKey =
  | "ctaVisibility"
  | "textDensity"
  | "whitespace"
  | "clutter"
  | "visualHierarchy"
  | "brandDominance"
  | "mobileReadability"
  | "alignment"
  | "contrastReadability"
  | "visualBalance"
  | "layoutClarity"
  | "attentionDistribution";

export interface LayoutMetric {
  score: number;
  confidence: number;
  signals: string[];
  warnings: string[];
}

export type LayoutMetricMap = Record<LayoutMetricKey, LayoutMetric>;

export type LayoutScoreWeights = Record<LayoutMetricKey, number>;

export interface LayoutViewportSimulation {
  name: "mobile-390" | "source";
  width: number;
  height: number;
  scale: number;
  smallTextBlockIds: string[];
  stickyBannerRisk: "low" | "medium" | "high";
  compressionRisk: "low" | "medium" | "high";
  readableBlockRatio: number;
}

export interface LayoutGeometrySummary {
  textAreaRatio: number;
  emptyAreaRatio: number;
  overlapRatio: number;
  averageBlockGap: number;
  blockCount: number;
  wordCount: number;
  zoneDensity: Record<"top" | "middle" | "bottom" | "left" | "center" | "right", number>;
}

export interface AttentionRank {
  blockId: string;
  role: NormalizedTextBlock["role"];
  text: string;
  score: number;
  rank: number;
}

export interface AnalyzeLayoutOptions {
  profile?: IntelligenceProfile;
  weights?: Partial<LayoutScoreWeights>;
}

export interface LayoutIntelligenceInput {
  ocr: NormalizedOcrResult;
  options?: AnalyzeLayoutOptions;
}

export interface LayoutIntelligenceResult {
  scores: Record<LayoutMetricKey, number>;
  weightedScore: number;
  weights: LayoutScoreWeights;
  metrics: LayoutMetricMap;
  geometry: LayoutGeometrySummary;
  viewportSimulations: LayoutViewportSimulation[];
  attentionOrder: AttentionRank[];
  recommendations: string[];
  profile: {
    key: string;
    label: string;
  };
}
