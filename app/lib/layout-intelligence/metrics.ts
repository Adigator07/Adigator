import type { IntelligenceProfile } from "../intelligence-registry";
import type { NormalizedOcrResult, NormalizedTextBlock } from "../ocr-normalization";
import { blockArea, roundScore, scoreCloseness, scoreRange, weightedAverage } from "./math";
import type { AttentionRank, LayoutGeometrySummary, LayoutMetric, LayoutViewportSimulation } from "./types";

function metric(score: number, confidence: number, signals: string[], warnings: string[] = []): LayoutMetric {
  return { score: roundScore(score), confidence: roundScore(confidence), signals, warnings };
}

function roleBlock(blocks: NormalizedTextBlock[], role: NormalizedTextBlock["role"]): NormalizedTextBlock | null {
  return blocks.find((block) => block.role === role) ?? null;
}

function attentionRank(order: AttentionRank[], blockId?: string | null): number | null {
  if (!blockId) return null;
  return order.find((item) => item.blockId === blockId)?.rank ?? null;
}

export function scoreCtaVisibility(
  ocr: NormalizedOcrResult,
  profile: IntelligenceProfile,
  attentionOrder: AttentionRank[]
): LayoutMetric {
  if (!ocr.ctaDetection.ctaExists || !ocr.schema.cta) {
    const score = profile.ctaExpectations.required ? 18 : 62;
    return metric(score, ocr.ctaDetection.confidence, ["CTA not detected"], profile.ctaExpectations.required ? ["CTA is required for this profile"] : []);
  }

  const cta = ocr.schema.cta;
  const rank = attentionRank(attentionOrder, cta.id) ?? 99;
  const areaScore = scoreRange(blockArea(cta), 0.008, 0.055);
  const placementScore = cta.box && cta.box.centerY >= 0.38 && cta.box.centerY <= 0.9 ? 100 : 55;
  const prominenceScore = Math.max(0, 105 - rank * 12);
  const readabilityScore = cta.features.wordCount <= 4 ? 100 : cta.features.wordCount <= 7 ? 70 : 35;

  return metric(
    weightedAverage([
      { score: areaScore, weight: 0.24 },
      { score: placementScore, weight: 0.2 },
      { score: cta.features.buttonLikelihood, weight: 0.24 },
      { score: prominenceScore, weight: 0.2 },
      { score: readabilityScore, weight: 0.12 },
    ]),
    ocr.ctaDetection.confidence,
    [`CTA rank ${rank}`, `CTA state ${ocr.ctaDetection.ctaState}`, `button likelihood ${cta.features.buttonLikelihood}`]
  );
}

export function scoreTextDensity(geometry: LayoutGeometrySummary, profile: IntelligenceProfile): LayoutMetric {
  const ideal =
    profile.layoutExpectations.density === "minimal" ? 0.075 :
    profile.layoutExpectations.density === "balanced" ? 0.12 :
    profile.layoutExpectations.density === "information-rich" ? 0.18 :
    0.2;

  const tolerance = profile.layoutExpectations.density === "minimal" ? 0.07 : 0.1;
  return metric(
    scoreCloseness(geometry.textAreaRatio, ideal, tolerance),
    86,
    [`text area ${(geometry.textAreaRatio * 100).toFixed(1)}%`, `${geometry.wordCount} OCR words`]
  );
}

export function scoreWhitespace(geometry: LayoutGeometrySummary, profile: IntelligenceProfile): LayoutMetric {
  const ideal =
    profile.layoutExpectations.whitespace === "generous" ? 0.82 :
    profile.layoutExpectations.whitespace === "moderate" ? 0.7 :
    0.58;

  return metric(
    scoreCloseness(geometry.emptyAreaRatio, ideal, 0.22),
    84,
    [`empty area ${(geometry.emptyAreaRatio * 100).toFixed(1)}%`, `expected ${profile.layoutExpectations.whitespace} whitespace`]
  );
}

export function scoreClutter(geometry: LayoutGeometrySummary): LayoutMetric {
  const blockPenalty = Math.max(0, geometry.blockCount - 7) * 6;
  const overlapPenalty = geometry.overlapRatio * 300;
  const crowdPenalty = geometry.averageBlockGap < 0.035 ? 22 : geometry.averageBlockGap < 0.07 ? 10 : 0;
  return metric(
    100 - blockPenalty - overlapPenalty - crowdPenalty,
    82,
    [`${geometry.blockCount} text blocks`, `overlap ${(geometry.overlapRatio * 100).toFixed(2)}%`, `avg gap ${geometry.averageBlockGap.toFixed(3)}`]
  );
}

export function scoreVisualHierarchy(ocr: NormalizedOcrResult, attentionOrder: AttentionRank[]): LayoutMetric {
  const top = attentionOrder[0];
  const second = attentionOrder[1];
  const headline = ocr.schema.headline;
  const dominanceGap = top && second ? Math.min(100, Math.max(0, top.score - second.score) * 3) : 65;
  const headlineRank = attentionRank(attentionOrder, headline?.id) ?? 99;
  const headlineScore = headlineRank <= 1 ? 100 : headlineRank <= 3 ? 75 : 35;

  return metric(
    weightedAverage([
      { score: dominanceGap, weight: 0.45 },
      { score: headlineScore, weight: 0.4 },
      { score: ocr.hierarchy.primaryTextBlockId ? 88 : 45, weight: 0.15 },
    ]),
    82,
    [`headline rank ${headlineRank}`, `primary block ${ocr.hierarchy.primaryTextBlockId ?? "none"}`]
  );
}

export function scoreBrandDominance(ocr: NormalizedOcrResult, attentionOrder: AttentionRank[]): LayoutMetric {
  const brand = ocr.schema.brandingText[0] ?? roleBlock(ocr.blocks, "branding_text");
  if (!brand) return metric(34, 76, ["branding text not detected"], ["Brand visibility may be low"]);

  const rank = attentionRank(attentionOrder, brand.id) ?? 99;
  const area = blockArea(brand);
  const visibility = Math.max(0, 105 - rank * 10);
  const dominance = area > 0.09 ? 55 : scoreRange(area, 0.003, 0.055);
  return metric(
    weightedAverage([
      { score: visibility, weight: 0.5 },
      { score: dominance, weight: 0.35 },
      { score: brand.confidence * 100, weight: 0.15 },
    ]),
    78,
    [`brand rank ${rank}`, `brand area ${(area * 100).toFixed(2)}%`]
  );
}

export function scoreMobileReadability(simulation: LayoutViewportSimulation, profile: IntelligenceProfile): LayoutMetric {
  const base = simulation.readableBlockRatio * 100;
  const compressionPenalty = simulation.compressionRisk === "high" ? 22 : simulation.compressionRisk === "medium" ? 10 : 0;
  const stickyPenalty = simulation.stickyBannerRisk === "high" ? 10 : 0;
  const largeTextExpectationPenalty = profile.mobilePreferences.minimumTextSize === "large" && simulation.smallTextBlockIds.length > 0 ? 8 : 0;

  return metric(
    base - compressionPenalty - stickyPenalty - largeTextExpectationPenalty,
    82,
    [`${simulation.smallTextBlockIds.length} small text blocks`, `compression risk ${simulation.compressionRisk}`],
    simulation.smallTextBlockIds.length > 0 ? ["Some OCR text may become too small on 390px mobile"] : []
  );
}

export function scoreAlignment(ocr: NormalizedOcrResult): LayoutMetric {
  const boxes = ocr.blocks
    .map((block) => block.box)
    .filter((box): box is NonNullable<NormalizedTextBlock["box"]> => Boolean(box));
  if (boxes.length < 2) return metric(72, 55, ["not enough coordinate data for alignment"]);
  const lefts = boxes.map((box) => box.xMin);
  const centers = boxes.map((box) => box.centerX);
  const leftVariance = Math.max(...lefts) - Math.min(...lefts);
  const centerVariance = Math.max(...centers) - Math.min(...centers);
  const bestVariance = Math.min(leftVariance, centerVariance);
  return metric(100 - bestVariance * 135, 82, [`alignment variance ${bestVariance.toFixed(3)}`]);
}

export function scoreContrastReadability(ocr: NormalizedOcrResult): LayoutMetric {
  const confidenceScore = (ocr.confidence || 0.75) * 100;
  const lowConfidenceBlocks = ocr.blocks.filter((block) => block.confidence < 0.55).length;
  const smallImportantBlocks = ocr.blocks.filter((block) => ["headline", "cta", "offer_text"].includes(block.role) && block.box && block.box.height < 0.035).length;
  return metric(
    confidenceScore - lowConfidenceBlocks * 8 - smallImportantBlocks * 10,
    62,
    [`OCR confidence ${Math.round(confidenceScore)}`, `${lowConfidenceBlocks} low-confidence blocks`],
    ["Color contrast is estimated from OCR confidence and geometry; pixel contrast can be added later"]
  );
}

export function scoreVisualBalance(geometry: LayoutGeometrySummary): LayoutMetric {
  const horizontalDelta = Math.abs(geometry.zoneDensity.left - geometry.zoneDensity.right);
  const verticalDelta = Math.abs(geometry.zoneDensity.top - geometry.zoneDensity.bottom);
  return metric(
    100 - horizontalDelta * 180 - verticalDelta * 110,
    82,
    [`left/right delta ${horizontalDelta.toFixed(3)}`, `top/bottom delta ${verticalDelta.toFixed(3)}`]
  );
}

export function scoreAttentionDistribution(
  ocr: NormalizedOcrResult,
  profile: IntelligenceProfile,
  attentionOrder: AttentionRank[]
): LayoutMetric {
  if (attentionOrder.length === 0) return metric(40, 50, ["no attention order"]);
  const topShare = attentionOrder[0].score / Math.max(attentionOrder.slice(0, 5).reduce((sum, item) => sum + item.score, 0), 1);
  const ctaRank = attentionRank(attentionOrder, ocr.schema.cta?.id);
  const ctaBonus = profile.ctaExpectations.required
    ? ctaRank === 1 ? 20 : ctaRank && ctaRank <= 3 ? 10 : -18
    : 0;
  return metric(
    scoreRange(topShare, 0.28, 0.52) + ctaBonus,
    78,
    [`top attention share ${(topShare * 100).toFixed(1)}%`, `CTA rank ${ctaRank ?? "none"}`]
  );
}

export function scoreLayoutClarity(metrics: {
  textDensity: LayoutMetric;
  whitespace: LayoutMetric;
  clutter: LayoutMetric;
  visualHierarchy: LayoutMetric;
  alignment: LayoutMetric;
  mobileReadability: LayoutMetric;
}): LayoutMetric {
  return metric(
    weightedAverage([
      { score: metrics.visualHierarchy.score, weight: 0.24 },
      { score: metrics.clutter.score, weight: 0.2 },
      { score: metrics.whitespace.score, weight: 0.18 },
      { score: metrics.textDensity.score, weight: 0.15 },
      { score: metrics.alignment.score, weight: 0.11 },
      { score: metrics.mobileReadability.score, weight: 0.12 },
    ]),
    84,
    ["composite of hierarchy, clutter, whitespace, density, alignment, and mobile readability"]
  );
}
