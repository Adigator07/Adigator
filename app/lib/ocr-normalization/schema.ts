import type { CtaDetectionResult, NormalizedOcrSchema, NormalizedTextBlock } from "./types";

function byConfidence(blocks: NormalizedTextBlock[]): NormalizedTextBlock[] {
  return [...blocks].sort((a, b) => {
    if (b.roleConfidence !== a.roleConfidence) return b.roleConfidence - a.roleConfidence;
    return b.hierarchyScore - a.hierarchyScore;
  });
}

export function buildNormalizedSchema(
  blocks: NormalizedTextBlock[],
  ctaDetection: CtaDetectionResult
): NormalizedOcrSchema {
  const headline = byConfidence(blocks.filter((block) => block.role === "headline"))[0]
    ?? byConfidence(blocks.filter((block) => block.hierarchyScore >= 55 && block.role !== "disclaimer"))[0]
    ?? null;

  const cta = ctaDetection.ctaExists && ctaDetection.candidateBlockId
    ? blocks.find((block) => block.id === ctaDetection.candidateBlockId) ?? null
    : null;

  return {
    headline,
    cta,
    emotionalCopy: byConfidence(blocks.filter((block) => block.role === "emotional_copy")),
    offerText: byConfidence(blocks.filter((block) => block.role === "offer_text")),
    supportingText: byConfidence(blocks.filter((block) => block.role === "supporting_text")),
    disclaimers: byConfidence(blocks.filter((block) => block.role === "disclaimer")),
    brandingText: byConfidence(blocks.filter((block) => block.role === "branding_text")),
  };
}
