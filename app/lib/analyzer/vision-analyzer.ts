/**
 * ACIE v5.0 — Module 1: Vision Analyzer
 *
 * Extracts ground-truth visual metrics from ad images using Sharp (server-side).
 * NO AI or OCR is involved here — only pixel-level math.
 *
 * Why Sharp and not Canvas?
 * Canvas is browser-only. Sharp runs on Node.js during server-side processing,
 * which is the correct place for deterministic vision analysis.
 */

import type { VisionMetrics, DominantColor } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (documented to prevent magic numbers)
// ─────────────────────────────────────────────────────────────────────────────

/** Pixels with luminance above this are considered "whitespace". */
const WHITESPACE_LUMINANCE_THRESHOLD = 230;

/** Gradient magnitude above this counts as an "edge". Tuned for print-resolution ads. */
const EDGE_THRESHOLD = 30;

/** Text pixels are estimated by high local contrast in small patches. */
const TEXT_CONTRAST_THRESHOLD = 40;

/** Maximum dominant colors to extract. */
const MAX_DOMINANT_COLORS = 6;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze the visual properties of an image buffer.
 * Returns structured VisionMetrics without any AI assistance.
 */
export async function analyzeVision(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<VisionMetrics> {
  // Dynamically import Sharp so this module tree-shakes cleanly
  const sharp = (await import("sharp")).default;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 300;
  const height = metadata.height || 250;

  // Resize to a standard analysis canvas (faster math, same proportions)
  const ANALYSIS_WIDTH = 400;
  const ANALYSIS_HEIGHT = Math.round((height / width) * ANALYSIS_WIDTH);

  const { data: raw, info } = await image
    .resize(ANALYSIS_WIDTH, ANALYSIS_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const channels = info.channels; // 3 (RGB) or 4 (RGBA)

  // ── 1. Compute per-pixel luminance array ──────────────────────────────────
  const luminance = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    const r = raw[offset];
    const g = raw[offset + 1];
    const b = raw[offset + 2];
    // Perceptual luminance (ITU-R BT.709)
    luminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // ── 2. Brightness: mean luminance normalized 0–100 ────────────────────────
  const brightness = Math.round(
    (luminance.reduce((s, v) => s + v, 0) / totalPixels / 255) * 100
  );

  // ── 3. Contrast: RMS contrast 0–100 ──────────────────────────────────────
  const meanLum = luminance.reduce((s, v) => s + v, 0) / totalPixels;
  const variance =
    luminance.reduce((s, v) => s + (v - meanLum) ** 2, 0) / totalPixels;
  const contrastLevel = Math.min(100, Math.round((Math.sqrt(variance) / 255) * 200));

  // ── 4. Whitespace ratio: fraction of near-white pixels ───────────────────
  let whitespacePixels = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (luminance[i] > WHITESPACE_LUMINANCE_THRESHOLD) whitespacePixels++;
  }
  const whitespaceRatio = parseFloat((whitespacePixels / totalPixels).toFixed(3));

  // ── 5. Edge density: Sobel-approximation ─────────────────────────────────
  // We use simple horizontal + vertical difference as an edge proxy
  let edgePixelCount = 0;
  const W = info.width;
  const H = info.height;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx = luminance[y * W + x + 1] - luminance[y * W + x - 1];
      const gy = luminance[(y + 1) * W + x] - luminance[(y - 1) * W + x];
      if (Math.sqrt(gx * gx + gy * gy) > EDGE_THRESHOLD) edgePixelCount++;
    }
  }
  const edgeDensity = parseFloat((edgePixelCount / totalPixels).toFixed(3));

  // ── 6. Text area percentage: high local contrast patches ──────────────────
  // Estimates text presence via horizontal contrast variance in small windows
  let textLikePixels = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const diff = Math.abs(luminance[y * W + x] - luminance[y * W + x + 1]);
      if (diff > TEXT_CONTRAST_THRESHOLD) textLikePixels++;
    }
  }
  const textAreaPercentage = Math.min(
    100,
    Math.round((textLikePixels / totalPixels) * 300) // scale factor: text pixels are a fraction
  );

  // ── 7. Visual clutter score: composite of edge density + text coverage ────
  const visualClutterScore = parseFloat(
    Math.min(1, edgeDensity * 1.5 + (textAreaPercentage / 100) * 0.5).toFixed(3)
  );

  // ── 8. Layout balance: left vs right half luminance symmetry ─────────────
  let leftSum = 0, rightSum = 0;
  const midX = Math.floor(W / 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < midX) leftSum += luminance[y * W + x];
      else rightSum += luminance[y * W + x];
    }
  }
  const leftMean = leftSum / (H * midX);
  const rightMean = rightSum / (H * (W - midX));
  const imbalance = Math.abs(leftMean - rightMean) / 255;
  const layoutBalance = Math.round(Math.max(0, (1 - imbalance * 3)) * 100);

  // ── 9. Focal point: center of "interest" (darkest concentrated region) ────
  // Simple heuristic: find the region with highest local luminance variance
  let maxVar = 0, focalX = 0.5, focalY = 0.5;
  const BW = 20, BH = 20; // block size for focal search
  for (let by = 0; by < H - BH; by += BH) {
    for (let bx = 0; bx < W - BW; bx += BW) {
      let bSum = 0, bSumSq = 0, bCount = 0;
      for (let dy = 0; dy < BH; dy++) {
        for (let dx = 0; dx < BW; dx++) {
          const v = luminance[(by + dy) * W + (bx + dx)];
          bSum += v; bSumSq += v * v; bCount++;
        }
      }
      const bVar = bSumSq / bCount - (bSum / bCount) ** 2;
      if (bVar > maxVar) {
        maxVar = bVar;
        focalX = parseFloat(((bx + BW / 2) / W).toFixed(2));
        focalY = parseFloat(((by + BH / 2) / H).toFixed(2));
      }
    }
  }

  // ── 10. Dominant colors via quantized color histogram ────────────────────
  const colorBuckets: Map<string, number> = new Map();
  const BUCKET = 32; // quantize to 32-step buckets per channel
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    const r = Math.round(raw[offset] / BUCKET) * BUCKET;
    const g = Math.round(raw[offset + 1] / BUCKET) * BUCKET;
    const b = Math.round(raw[offset + 2] / BUCKET) * BUCKET;
    const key = `${r},${g},${b}`;
    colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
  }
  const sortedColors = [...colorBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_DOMINANT_COLORS);
  const dominantColors: DominantColor[] = sortedColors.map(([key, count]) => {
    const [r, g, b] = key.split(",").map(Number);
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { hex, percentage: parseFloat(((count / totalPixels) * 100).toFixed(1)) };
  });

  // ── 11. Face detection heuristic ─────────────────────────────────────────
  // True face detection requires a model (e.g. face-api.js or Google Vision).
  // For now: use skin-tone pixel prevalence as a proxy.
  // This will be upgraded to Google Vision face detection in the pipeline.
  let skinTonePixels = 0;
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * channels;
    const r = raw[offset], g = raw[offset + 1], b = raw[offset + 2];
    // Basic skin tone detection heuristic (Kovac et al.)
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
      skinTonePixels++;
    }
  }
  const skinRatio = skinTonePixels / totalPixels;
  const faceDetected = skinRatio > 0.04; // >4% skin-tone = likely face present
  const faceCount = faceDetected ? Math.ceil(skinRatio / 0.08) : 0;

  console.log(`[VisionAnalyzer] brightness=${brightness} contrast=${contrastLevel} clutter=${visualClutterScore} balance=${layoutBalance}`);

  return {
    brightness,
    contrastLevel,
    edgeDensity,
    whitespaceRatio,
    textAreaPercentage,
    visualClutterScore,
    layoutBalance,
    focalPointPosition: { x: focalX, y: focalY },
    dominantColors,
    faceDetected,
    faceCount,
    width,
    height,
    aspectRatio: parseFloat((width / height).toFixed(3)),
  };
}
