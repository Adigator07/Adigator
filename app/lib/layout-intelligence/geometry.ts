import type { NormalizedOcrResult, NormalizedTextBlock } from "../ocr-normalization";
import { blockArea, blockGap, overlapArea } from "./math";
import type { AttentionRank, LayoutGeometrySummary } from "./types";

function zoneArea(blocks: NormalizedTextBlock[], ids: string[]): number {
  const set = new Set(ids);
  return blocks
    .filter((block) => set.has(block.id))
    .reduce((sum, block) => sum + blockArea(block), 0);
}

export function summarizeGeometry(ocr: NormalizedOcrResult): LayoutGeometrySummary {
  const blocks = ocr.blocks;
  const textAreaRatio = Math.min(1, blocks.reduce((sum, block) => sum + blockArea(block), 0));
  let overlapRatio = 0;
  const gaps: number[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      overlapRatio += overlapArea(blocks[i], blocks[j]);
      const gap = blockGap(blocks[i], blocks[j]);
      if (gap !== null) gaps.push(gap);
    }
  }

  const wordCount = blocks.reduce((sum, block) => sum + block.features.wordCount, 0);
  const zones = ocr.hierarchy.layoutZones;

  return {
    textAreaRatio,
    emptyAreaRatio: Math.max(0, 1 - textAreaRatio),
    overlapRatio: Math.min(1, overlapRatio),
    averageBlockGap: gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 1,
    blockCount: blocks.length,
    wordCount,
    zoneDensity: {
      top: zoneArea(blocks, zones.top),
      middle: zoneArea(blocks, zones.middle),
      bottom: zoneArea(blocks, zones.bottom),
      left: zoneArea(blocks, zones.left),
      center: zoneArea(blocks, zones.center),
      right: zoneArea(blocks, zones.right),
    },
  };
}

export function buildAttentionOrder(blocks: NormalizedTextBlock[]): AttentionRank[] {
  return blocks
    .map((block) => {
      const roleBoost =
        block.role === "cta" ? 18 :
        block.role === "headline" ? 14 :
        block.role === "branding_text" ? 8 :
        block.role === "offer_text" ? 7 :
        0;

      const geometryScore = (block.box?.areaRatio ?? 0) * 650;
      const placementScore = block.box && block.box.centerY < 0.55 ? 8 : 0;

      return {
        blockId: block.id,
        role: block.role,
        text: block.text,
        score: Math.round(block.hierarchyScore * 0.55 + geometryScore + roleBoost + placementScore),
        rank: 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
