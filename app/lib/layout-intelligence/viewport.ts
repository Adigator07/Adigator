import type { NormalizedOcrResult } from "../ocr-normalization";
import type { LayoutViewportSimulation } from "./types";

function riskFromRatio(value: number, medium: number, high: number): "low" | "medium" | "high" {
  if (value >= high) return "high";
  if (value >= medium) return "medium";
  return "low";
}

export function simulateMobile390(ocr: NormalizedOcrResult): LayoutViewportSimulation {
  const sourceWidth = Math.max(ocr.imageSize.width, 1);
  const sourceHeight = Math.max(ocr.imageSize.height, 1);
  const scale = 390 / sourceWidth;
  const mobileHeight = sourceHeight * scale;
  const smallTextBlockIds = ocr.blocks
    .filter((block) => {
      if (!block.box) return true;
      const pixelHeight = block.box.height * mobileHeight;
      return pixelHeight < 11 || (pixelHeight < 14 && block.features.wordCount > 5);
    })
    .map((block) => block.id);

  const readableBlockRatio = ocr.blocks.length === 0
    ? 1
    : (ocr.blocks.length - smallTextBlockIds.length) / ocr.blocks.length;

  const bottomBlocks = ocr.blocks.filter((block) => block.box && block.box.centerY > 0.78);
  const stickyBannerRisk = bottomBlocks.some((block) => block.role === "cta" && block.box && block.box.height < 0.045)
    ? "high"
    : riskFromRatio(bottomBlocks.length / Math.max(ocr.blocks.length, 1), 0.28, 0.45);

  const compressionRisk = riskFromRatio(1 - readableBlockRatio, 0.18, 0.35);

  return {
    name: "mobile-390",
    width: 390,
    height: Math.round(mobileHeight),
    scale,
    smallTextBlockIds,
    stickyBannerRisk,
    compressionRisk,
    readableBlockRatio,
  };
}
