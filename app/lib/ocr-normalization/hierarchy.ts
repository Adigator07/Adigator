import { horizontalZone, verticalZone } from "./geometry";
import type { NormalizedTextBlock, OcrHierarchy } from "./types";

function scoreProminence(block: NormalizedTextBlock, allBlocks: NormalizedTextBlock[]): number {
  const maxArea = Math.max(...allBlocks.map((item) => item.box?.areaRatio ?? 0.001), 0.001);
  const areaScore = block.box ? (block.box.areaRatio / maxArea) * 55 : 15;
  const positionScore = block.box && block.box.centerY < 0.45 ? 18 : 0;
  const brevityScore = block.features.wordCount <= 9 ? 18 : block.features.wordCount <= 15 ? 10 : 0;
  const capsScore = block.features.isAllCaps ? 9 : 0;
  return Math.min(100, areaScore + positionScore + brevityScore + capsScore);
}

export function applyHierarchy(blocks: NormalizedTextBlock[]): {
  blocks: NormalizedTextBlock[];
  hierarchy: OcrHierarchy;
} {
  const scored = blocks
    .map((block) => ({
      ...block,
      hierarchyScore: scoreProminence(block, blocks),
    }))
    .sort((a, b) => {
      const ay = a.box?.yMin ?? a.lineIndex / Math.max(blocks.length, 1);
      const by = b.box?.yMin ?? b.lineIndex / Math.max(blocks.length, 1);
      if (Math.abs(ay - by) > 0.03) return ay - by;
      return (a.box?.xMin ?? 0) - (b.box?.xMin ?? 0);
    })
    .map((block, index) => ({ ...block, lineIndex: index }));

  const primary = [...scored].sort((a, b) => b.hierarchyScore - a.hierarchyScore)[0] ?? null;
  const layoutZones = {
    top: scored.filter((block) => verticalZone(block.box) === "top").map((block) => block.id),
    middle: scored.filter((block) => verticalZone(block.box) === "middle").map((block) => block.id),
    bottom: scored.filter((block) => verticalZone(block.box) === "bottom").map((block) => block.id),
    left: scored.filter((block) => horizontalZone(block.box) === "left").map((block) => block.id),
    center: scored.filter((block) => horizontalZone(block.box) === "center").map((block) => block.id),
    right: scored.filter((block) => horizontalZone(block.box) === "right").map((block) => block.id),
  };

  return {
    blocks: scored,
    hierarchy: {
      readingOrder: scored.map((block) => block.id),
      primaryTextBlockId: primary?.id ?? null,
      topWeightedBlocks: [...scored]
        .sort((a, b) => b.hierarchyScore - a.hierarchyScore)
        .slice(0, 3)
        .map((block) => block.id),
      textDensity: scored.reduce((sum, block) => sum + (block.box?.areaRatio ?? 0), 0),
      layoutZones,
    },
  };
}
