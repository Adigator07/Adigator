import type { NormalizedTextBlock } from "../ocr-normalization";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function roundScore(value: number): number {
  return Math.round(clamp(value));
}

export function scoreCloseness(value: number, ideal: number, tolerance: number): number {
  const distance = Math.abs(value - ideal);
  return roundScore(100 - (distance / Math.max(tolerance, 0.001)) * 100);
}

export function scoreRange(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 100;
  const nearest = value < min ? min : max;
  const tolerance = Math.max(max - min, 0.001);
  return scoreCloseness(value, nearest, tolerance);
}

export function weightedAverage(values: Array<{ score: number; weight: number }>): number {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return roundScore(values.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight);
}

export function blockArea(block: NormalizedTextBlock): number {
  return block.box?.areaRatio ?? 0;
}

export function blockGap(a: NormalizedTextBlock, b: NormalizedTextBlock): number | null {
  if (!a.box || !b.box) return null;
  const dx = Math.max(0, Math.max(a.box.xMin, b.box.xMin) - Math.min(a.box.xMax, b.box.xMax));
  const dy = Math.max(0, Math.max(a.box.yMin, b.box.yMin) - Math.min(a.box.yMax, b.box.yMax));
  return Math.sqrt(dx * dx + dy * dy);
}

export function overlapArea(a: NormalizedTextBlock, b: NormalizedTextBlock): number {
  if (!a.box || !b.box) return 0;
  const x = Math.max(0, Math.min(a.box.xMax, b.box.xMax) - Math.max(a.box.xMin, b.box.xMin));
  const y = Math.max(0, Math.min(a.box.yMax, b.box.yMax) - Math.max(a.box.yMin, b.box.yMin));
  return x * y;
}
