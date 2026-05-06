/**
 * Image and Math utilities for the Analyzer Agents
 */

// ── WCAG 2.1 Contrast Utilities ───────────────────────────────────────────────

/** Linearize an sRGB channel value (0–255) */
function linearize(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

/** Compute relative luminance per WCAG 2.1 spec */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Compute WCAG 2.1 contrast ratio between two RGB colors */
export function wcagContrastRatio(
  fg: [number, number, number],
  bg: [number, number, number]
): number {
  const l1 = relativeLuminance(...fg);
  const l2 = relativeLuminance(...bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/** Classify a contrast ratio into WCAG level */
export function wcagLevel(
  ratio: number,
  isLargeText = false
): "AAA" | "AA" | "FAIL" {
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;
  if (ratio >= aaaThreshold) return "AAA";
  if (ratio >= aaThreshold) return "AA";
  return "FAIL";
}

// ── Color Utilities ───────────────────────────────────────────────────────────

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Math Utilities ────────────────────────────────────────────────────────────

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp(((value - min) / (max - min)) * 100);
}

// ── OCR Helpers ───────────────────────────────────────────────────────────────
import { OcrBlock } from "./textUtils";

/** Convert raw Tesseract word data into OcrBlock format */
export function tesseractWordsToBlocks(
  words: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>
): OcrBlock[] {
  return words
    .filter(w => w.text.trim().length > 0 && w.confidence > 0.3)
    .map((w, i) => ({
      block_id: `b${i}`,
      text: w.text.trim(),
      confidence: w.confidence,
      bbox: {
        x: w.bbox.x0,
        y: w.bbox.y0,
        width: w.bbox.x1 - w.bbox.x0,
        height: w.bbox.y1 - w.bbox.y0,
      },
      font_size_px: Math.round(w.bbox.y1 - w.bbox.y0),
    }));
}
