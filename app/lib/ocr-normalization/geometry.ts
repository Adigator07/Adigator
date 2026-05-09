import type { BoundingBox, NormalizedBoundingBox, Point, RawOcrBlock } from "./types";

function fallbackBox(): BoundingBox {
  return {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    vertices: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
  };
}

export function boxFromVertices(vertices?: Point[]): BoundingBox | null {
  if (!vertices || vertices.length === 0) return null;
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height, vertices };
}

export function inferImageSize(blocks: RawOcrBlock[], width?: number, height?: number): { width: number; height: number } {
  if (width && height) return { width, height };

  const boxes = blocks
    .map((block) => boxFromVertices(block.boundingBox?.vertices))
    .filter((box): box is BoundingBox => Boolean(box));

  if (boxes.length === 0) return { width: 1, height: 1 };

  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return {
    width: Math.max(maxX, 1),
    height: Math.max(maxY, 1),
  };
}

export function normalizeBox(
  box: BoundingBox | null,
  imageWidth: number,
  imageHeight: number
): NormalizedBoundingBox | null {
  if (!box) return null;
  const safeWidth = Math.max(imageWidth, 1);
  const safeHeight = Math.max(imageHeight, 1);
  const normalized = box ?? fallbackBox();
  const xMin = normalized.x / safeWidth;
  const yMin = normalized.y / safeHeight;
  const width = normalized.width / safeWidth;
  const height = normalized.height / safeHeight;

  return {
    ...normalized,
    xMin,
    yMin,
    width,
    height,
    xMax: xMin + width,
    yMax: yMin + height,
    centerX: xMin + width / 2,
    centerY: yMin + height / 2,
    areaRatio: width * height,
  };
}

export function verticalZone(box: NormalizedBoundingBox | null): "top" | "middle" | "bottom" {
  if (!box) return "middle";
  if (box.centerY < 0.34) return "top";
  if (box.centerY > 0.66) return "bottom";
  return "middle";
}

export function horizontalZone(box: NormalizedBoundingBox | null): "left" | "center" | "right" {
  if (!box) return "center";
  if (box.centerX < 0.34) return "left";
  if (box.centerX > 0.66) return "right";
  return "center";
}

export function isButtonLikeBox(box: NormalizedBoundingBox | null): number {
  if (!box) return 0;
  const ratio = box.width / Math.max(box.height, 0.001);
  let score = 0;
  if (ratio >= 2 && ratio <= 8) score += 30;
  if (box.height >= 0.035 && box.height <= 0.16) score += 25;
  if (box.width >= 0.12 && box.width <= 0.75) score += 20;
  if (box.centerY >= 0.45) score += 15;
  if (box.areaRatio >= 0.006 && box.areaRatio <= 0.08) score += 10;
  return Math.min(score, 100);
}
