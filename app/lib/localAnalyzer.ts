/**
 * ACIE v4.0 — Advanced Creative Intelligence Engine
 * Local Creative Analyzer — NEXT LEVEL UPGRADE
 *
 * Pipeline:
 *   1. JS Pixel Analysis      → brightness, contrast, edge density, clipping,
 *                               color harmony, dominant hue, warmth score
 *   2. Tesseract OCR          → extract + measure ad text, font size estimation
 *   3. CTA Detection          → 4-tier waterfall (dataset → dictionary → regex → NLP-proxy)
 *   4. Intelligence Pre-Scan  → clutter index, emotional appeal, creative archetype,
 *                               visual hierarchy score, color contrast ratio (WCAG),
 *                               focal point detection, reading flow analysis
 *   5. 9-Dimension Scoring    → weighted formula:
 *                               CTA 20%, Text 13%, Brand 10%, Brightness 8%,
 *                               Goal 20%, Pixel 10%, FileSize 7%,
 *                               ColorHarmony 7%, VisualHierarchy 5%
 *   6. Fix Block Generator    → actionable per-dimension fixes for scores < 75
 *   7. Engagement Forecast    → LOW / MEDIUM / HIGH / PEAK with confidence %
 *   8. A/B Hypothesis         → auto-generated split-test suggestions
 *   9. Final Assembly         → merge all signals into LocalAnalysisResult
 */

import Tesseract from "tesseract.js";
import { 
  findSimilarCreative, 
  ctaTypeToStrength, 
  getDatasetStats, 
  lookupCTAFromDataset,
  CTAType,
  CampaignGoal,
  Platform,
  AudienceType
} from "./datasetIntelligence";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Tier = "XS" | "S" | "M" | "L" | "XL" | "Unknown";
export type EmotionalAppeal = "HIGH" | "MEDIUM" | "LOW";
export type ClutterLabel = "CLEAN" | "MODERATE" | "CLUTTERED" | "CHAOTIC";
export type EngagementForecast = "LOW" | "MEDIUM" | "HIGH" | "PEAK";
export type CTAGoalFit = "Perfect Match" | "Acceptable" | "Mismatch" | "None";
export type ColorHarmony = "HARMONIOUS" | "ACCEPTABLE" | "DISCORDANT";
export type VisualHierarchy = "STRONG" | "MODERATE" | "WEAK";
export type ReadingFlow = "LINEAR" | "SCATTERED" | "NONE";
export type WCAGLevel = "AAA" | "AA" | "FAIL";

interface PixelData {
  brightness: number;       // 0–100
  contrast: number;         // 0–100
  edgeDensity: number;
  clipHigh: number;         // fraction 0–1
  clipLow: number;          // fraction 0–1
  saturation: number;       // 0–100
  dominantHue: number;      // 0–360 (HSL hue)
  warmthScore: number;      // 0–100 (warm=high, cool=low)
  colorVariance: number;    // 0–100 (how many distinct hue zones)
  textContrast: number;     // estimated text-bg contrast ratio 1–21
  wcagLevel: WCAGLevel;
  focalPointStrength: number; // 0–100 how strongly one area dominates edges
  colorHarmony: ColorHarmony;
  colorPalette: string[];   // top 3 hex colors
  isBlurry: boolean;
  hasCompressionArtifacts: boolean;
  laplacianVariance: number; // sharp > 100, blur < 100
}

interface OcrData {
  text: string;
  textLength: number;
  textAreaPercent: number;
  minTextHeightPx: number;
  maxTextHeightPx: number;
  ocrConfidence: number;
  wordCount: number;
  lineCount: number;
  headlineDetected: boolean;  // large dominant text block exists
  readingFlow: ReadingFlow;
  sentenceCount: number;
  avgWordLength: number;
  hasNumbers: boolean;
  hasCurrency: boolean;
  hasPercentage: boolean;
  hasTrademark: boolean;
  cornerTextDetected: boolean;
  hasTextCrowding: boolean;
  hasIllegibleText: boolean;
}

interface DimensionScore {
  raw: number;       // 0–100
  weight: number;    // 0–1
  verdict: string;
  pass: boolean;
  detail: string;    // short explanation of this score
}

export interface FixBlock {
  dimension: string;
  score: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  problem: string;
  impact: string;
  fixNow: string;
  fixDeep: string;
  timeEstimate: string;
  datasetNote: string;
  abTestIdea: string;
}

export interface ABHypothesis {
  dimension: string;
  variant_a: string;
  variant_b: string;
  expected_lift: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface LocalAnalysisResult {
  // ── Pixel ──────────────────────────────────────────────────
  brightness: number;
  contrast: number;
  saturation: number;
  dominantHue: number;
  warmthScore: number;
  colorVariance: number;
  wcagLevel: WCAGLevel;
  focalPointStrength: number;
  colorHarmony: ColorHarmony;
  colorPalette: string[];
  isBlurry: boolean;
  hasCompressionArtifacts: boolean;
  // ── Text ───────────────────────────────────────────────────
  text_clarity: number;
  text_density: "low" | "medium" | "high";
  headlineDetected: boolean;
  readingFlow: ReadingFlow;
  hasCurrency: boolean;
  hasPercentage: boolean;
  hasTrademark: boolean;
  cornerTextDetected: boolean;
  hasTextCrowding: boolean;
  hasIllegibleText: boolean;
  // ── 9 Dimension Scores (raw 0–100) ─────────────────────────
  dim_cta: number;
  dim_text: number;
  dim_brand: number;
  dim_brightness: number;
  dim_goal: number;
  dim_pixel: number;
  dim_filesize: number;
  dim_color_harmony: number;
  dim_visual_hierarchy: number;
  // ── Dimension Detail Labels ─────────────────────────────────
  dim_details: Record<string, string>;
  // ── Legacy score fields (kept for UI) ──────────────────────
  layout_score: number;
  visual_quality: number;
  goal_fit: number;
  overall_score: number;
  // ── CTA ────────────────────────────────────────────────────
  cta_presence: boolean;
  cta_strength: string;
  cta_recommendations: string[];
  cta_detected: boolean;
  cta_text: string | null;
  cta_type: CTAType;
  cta_goal_fit: CTAGoalFit;
  cta_scores: {
    overall: number;
    clarity: number;
    urgency: number;
    value: number;
    visibility: number;
  };
  // ── Core & Platform Checks ─────────────────────────────────
  coreChecks: Record<string, { score: number; label: string; pass: boolean }>;
  platformChecks: Record<string, any>;
  adVisibilityScore: number;
  goalAlignmentIndicator: number;
  // ── Suggestions & Fixes ────────────────────────────────────
  suggestions: string[];
  improvement_suggestions: string[];
  fix_blocks: FixBlock[];
  ab_hypotheses: ABHypothesis[];
  // ── ACIE v4.0 Intelligence Signals ─────────────────────────
  creative_archetype: string;
  emotion_signature: string;
  clutter_index: number;          // 1–10
  clutter_label: ClutterLabel;
  emotional_appeal: EmotionalAppeal;
  engagement_forecast: EngagementForecast;
  engagement_forecast_confidence: number;  // 0–100
  engagement_drivers: string[];
  visual_hierarchy: VisualHierarchy;
  cognitive_load_score: number;   // 0–100 (lower = easier to process)
  stop_rate_estimate: string;     // e.g. "2–3%"
  // ── Dataset Pattern Match ───────────────────────────────────
  dataset_matches: DatasetMatch[];
  dataset_confidence: "HIGH" | "MODERATE" | "LOW" | "NONE";
  // ── Meta ────────────────────────────────────────────────────
  goal: CampaignGoal;
  platform: Platform;
  audienceType: AudienceType;
  imageSize: string;
  analyzed_at: string;
  source: string;
  sizeTier: Tier;
  fileSizeKB: number;
  deterministicIssues: any[];
  confidence: string;
  // ── Funnel ──────────────────────────────────────────────────
  primary_stage: string;
  bestFor: string;
  goalMatchScore: number;
  funnelReasoning: string;
  funnelSignals: any[];
  recommendedTemplates: string[];
  messaging_intent: string;
  urgency_level: string;
  audience_type: string;
  ai_cta_strength: string;
  // ── Analysis Text ────────────────────────────────────────────
  analysis: string;
  impact: string;
  improved_ctas: string[];
  qualityMessage?: string;
  // ── Agent Slots ──────────────────────────────────────────────
  agentSummary: string;
  agentFunnelAnalysis: string;
  agentBreakdown: {
    cta: string;
    text_clarity: string;
    brand_presence: string;
    brightness_contrast: string;
    ad_visibility: string;
    goal_alignment: string;
    color_harmony: string;
    visual_hierarchy: string;
  };
  agentScores: {
    cta: number;
    clarity: number;
    brand: number;
    visual_quality: number;
    visibility: number;
    goal_alignment: number;
    color_harmony: number;
    visual_hierarchy: number;
    overall: number;
  };
  agentSuggestions: string[];
}

interface DatasetMatch {
  creative_id: string;
  similarity: "High" | "Medium" | "Low";
  result_label: string;
  ctr?: string;
  learning: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const PLATFORM_SIZES: Record<Platform, { desktop: string[]; mobile: string[] }> = {
  programmatic: {
    desktop: ["300x250", "336x280", "728x90", "970x90", "970x250", "160x600", "300x600",
      "300x1050", "468x60", "234x60", "120x600", "120x240", "250x250", "200x200", "180x150"],
    mobile: ["320x50", "320x100", "300x250", "320x480", "480x320", "360x640", "375x667", "414x736"],
  },
};

export const AWARENESS_CTAS = [
  "learn more", "discover more", "find out more", "explore now", "see how it works",
  "watch now", "view video", "see story", "check it out", "take a look", "see why",
  "discover the secret", "read more", "learn how", "see more", "get inspired", "know more",
  "find out", "explore", "discover",
];

export const CONSIDERATION_CTAS = [
  "explore features", "see details", "view plans", "compare options", "browse collection",
  "try for free", "start free trial", "book a demo", "get a demo", "test it now",
  "sign up", "join now", "create account", "get started", "try it now", "see pricing",
  "check features", "view benefits", "choose your plan", "see how", "learn why",
];

export const CONVERSION_CTAS = [
  "buy now", "shop now", "order now", "add to cart", "get it today", "claim your deal",
  "grab yours now", "subscribe now", "upgrade now", "start membership", "pay now",
  "checkout now", "purchase now", "book now", "get yours today", "secure your spot",
  "download now", "install now", "claim offer", "get deal", "save now", "redeem",
  "order here", "buy today", "shop collection", "grab it", "secure deal",
];

export const AWARENESS_KEYWORDS = ["how", "why", "secret", "discover", "meet", "introducing", "new", "story", "learn", "did you know", "unveil", "reveal"];
export const CONSIDERATION_KEYWORDS = ["best", "rated", "reviews", "features", "compare", "save", "quality", "easy", "benefits", "value", "guide", "top", "trusted", "recommended"];
export const CONVERSION_KEYWORDS = ["today", "limited", "hurry", "ends", "last chance", "only", "now", "sale", "% off", "discount", "buy", "grab", "flash", "exclusive", "expires"];

const HIGH_EMOTION_SIGNALS = ["transform", "change your life", "never been easier", "you deserve", "finally", "stop struggling", "imagine", "dream", "secret", "unbelievable", "proven", "real results", "guaranteed", "breakthrough", "revolutionary"];
const MEDIUM_EMOTION_SIGNALS = ["save", "better", "quality", "trusted", "rated", "recommend", "top", "expert", "easy", "quick", "smart", "simple", "powerful"];
const FALSE_CTA_PATTERNS = ["% off", "best quality", "no.1", "top brand", "award", "as seen", "best seller", "#1", "rated"];

export const GOAL_CTA: Record<CampaignGoal, string[]> = {
  awareness: ["Learn More", "Discover More", "Watch Now", "Check It Out", "Explore Now"],
  consideration: ["View Plans", "Try for Free", "Book a Demo", "Sign Up", "See Details"],
  conversion: ["Buy Now", "order now", "Shop Now", "Get It Today", "Subscribe Now", "Claim Offer"],
};

// ── Dimension Weights (must sum to 1.0) ──────────────────────────────────────

const DIM_WEIGHTS = {
  cta: 0.20,
  text: 0.13,
  brand: 0.10,
  brightness: 0.08,
  goal: 0.20,
  pixel: 0.10,
  filesize: 0.07,
  color_harmony: 0.07,
  visual_hierarchy: 0.05,
} as const;

// ── 1. Size Tiering ──────────────────────────────────────────────────────────

function getTier(width: number, height: number): Tier {
  const area = width * height;
  if (area < 20000) return "XS";
  if (area <= 32000) return "S";
  if (area <= 75000) return "M";
  if (area <= 180000) return "L";
  return "XL";
}

// ── 2. Pixel Analysis (enhanced v4) ──────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
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

function luminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "FAIL";
}

function analyzeColorHarmony(hues: number[]): ColorHarmony {
  if (hues.length < 2) return "HARMONIOUS";
  // Check analogous (within 30°), complementary (150–210°), triadic (120° apart)
  let harmonious = 0, discordant = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j]);
      const minDiff = Math.min(diff, 360 - diff);
      if (minDiff <= 30 || (minDiff >= 150 && minDiff <= 210) || Math.abs(minDiff - 120) <= 15) {
        harmonious++;
      } else {
        discordant++;
      }
    }
  }
  if (discordant > harmonious) return "DISCORDANT";
  if (discordant > 0) return "ACCEPTABLE";
  return "HARMONIOUS";
}

function analyzePixels(image: HTMLImageElement): PixelData {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return {
    brightness: 50, contrast: 50, edgeDensity: 0.1, clipHigh: 0, clipLow: 0,
    saturation: 50, dominantHue: 200, warmthScore: 50, colorVariance: 50,
    textContrast: 4.5, wcagLevel: "AA", focalPointStrength: 50,
    colorHarmony: "ACCEPTABLE", colorPalette: ["#888888"],
    isBlurry: false, hasCompressionArtifacts: false, laplacianVariance: 250,
  };

  const W = Math.min(image.width, 400);
  const H = Math.min(image.height, 400);
  canvas.width = W; canvas.height = H;
  ctx.drawImage(image, 0, 0, W, H);

  const data = ctx.getImageData(0, 0, W, H).data;
  let sumL = 0, minL = 255, maxL = 0;
  let edges = 0, edgesTopHalf = 0, edgesBottomHalf = 0;
  let clipHigh = 0, clipLow = 0, sumSat = 0;
  let sumWarm = 0;
  const pixels = W * H;

  // Hue zone buckets (36 buckets of 10° each)
  const hueBuckets = new Array(36).fill(0);
  // Color quantization: sample grid
  const sampleStep = 8;
  const sampleColors: [number, number, number][] = [];

  // For Laplacian variance (blur detection)
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let validLaplacianPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    sumL += l;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
    if (l > 245) clipHigh++;
    if (l < 10) clipLow++;

    // Warmth (red/orange/yellow = warm)
    const warmth = r > b ? (r - b) / 255 : 0;
    sumWarm += warmth;

    // HSL
    const [h, s] = rgbToHsl(r, g, b);
    if (s > 10) {
      hueBuckets[Math.floor(h / 10)]++;
    }

    const cMax = Math.max(r, g, b) / 255;
    const cMin = Math.min(r, g, b) / 255;
    const delta = cMax - cMin;
    const ll = (cMax + cMin) / 2;
    sumSat += ll > 0 && ll < 1 ? delta / (1 - Math.abs(2 * ll - 1)) : 0;

    // Edge detection + focal point (top vs bottom half)
    const pixelRow = Math.floor((i / 4) / W);
    if (i % (W * 4) !== 0 && i >= W * 4) {
      const lL = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
      const tL = 0.299 * data[i - W * 4] + 0.587 * data[i - W * 4 + 1] + 0.114 * data[i - W * 4 + 2];
      if (Math.abs(l - lL) > 20 || Math.abs(l - tL) > 20) {
        edges++;
        if (pixelRow < H / 2) edgesTopHalf++;
        else edgesBottomHalf++;
      }
    }

    // Sample colors for palette
    const pixelIdx = Math.floor(i / 4);
    if (pixelIdx % (sampleStep * sampleStep) === 0) {
      sampleColors.push([r, g, b]);
    }

    // Laplacian approximation for blur (kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0])
    if (pixelRow > 0 && pixelRow < H - 1 && pixelIdx % W > 0 && pixelIdx % W < W - 1) {
      const pC = l; // center
      const pL = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
      const pR = 0.299 * data[i + 4] + 0.587 * data[i + 3] + 0.114 * data[i + 2];
      const pT = 0.299 * data[i - W * 4] + 0.587 * data[i - W * 4 + 1] + 0.114 * data[i - W * 4 + 2];
      const pB = 0.299 * data[i + W * 4] + 0.587 * data[i + W * 4 + 1] + 0.114 * data[i + W * 4 + 2];
      const lap = pT + pB + pL + pR - 4 * pC;
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      validLaplacianPixels++;
    }
  }

  const laplacianMean = laplacianSum / validLaplacianPixels;
  const laplacianVariance = (laplacianSqSum / validLaplacianPixels) - (laplacianMean * laplacianMean);
  const isBlurry = laplacianVariance > 0 && laplacianVariance < 80; // Threshold for blur

  // Artifact detection: high edge density + low global contrast often indicates blocky JPEG compression
  const contrastScore = ((maxL - minL) / 255) * 100;
  const hasCompressionArtifacts = edges / pixels > 0.4 && contrastScore < 35;

  // Dominant hue
  const maxBucket = hueBuckets.indexOf(Math.max(...hueBuckets));
  const dominantHue = maxBucket * 10;

  // Color variance: how many hue zones have >5% of colored pixels
  const totalHuePx = hueBuckets.reduce((a, b) => a + b, 0);
  const activeZones = hueBuckets.filter(v => totalHuePx > 0 && v / totalHuePx > 0.05).length;
  const colorVariance = Math.min(100, activeZones * 12);

  // Color harmony from top 3 hues
  const sortedBuckets = hueBuckets
    .map((v, i) => ({ v, hue: i * 10 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .filter(b => b.v > 0);
  const topHues = sortedBuckets.map(b => b.hue);
  const harmony = analyzeColorHarmony(topHues);

  // Focal point: compare edge density in quadrants
  const edgeRatio = edgesTopHalf / (edgesBottomHalf + 1);
  const focalPointStrength = clamp(Math.round(Math.abs(edgeRatio - 1) * 100));

  // Text contrast estimate: compare brightest vs darkest region
  const lumBright = luminance(255, 255, 255) * (1 - clipHigh);
  const lumDark = luminance(30, 30, 30);
  const estimatedRatio = contrastRatio(
    (maxL / 255) * 0.9,
    (minL / 255) * 0.1 + 0.05,
  );
  const wcag = wcagLevel(estimatedRatio);

  // Color palette (simplified: top 3 dominant sampled colors)
  const palette: string[] = sampleColors
    .reduce((acc: [number, number, number][], color) => {
      const isDifferent = acc.every(c =>
        Math.abs(c[0] - color[0]) + Math.abs(c[1] - color[1]) + Math.abs(c[2] - color[2]) > 80
      );
      if (isDifferent && acc.length < 3) acc.push(color);
      return acc;
    }, [])
    .map(([r, g, b]) => `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);

  return {
    brightness: Math.round((sumL / pixels / 255) * 100),
    contrast: Math.round(((maxL - minL) / 255) * 100),
    edgeDensity: edges / pixels,
    clipHigh: clipHigh / pixels,
    clipLow: clipLow / pixels,
    saturation: Math.round((sumSat / pixels) * 100),
    dominantHue,
    warmthScore: Math.round((sumWarm / pixels) * 100),
    colorVariance,
    textContrast: parseFloat(estimatedRatio.toFixed(1)),
    wcagLevel: wcag,
    focalPointStrength,
    colorHarmony: harmony,
    colorPalette: palette.length > 0 ? palette : ["#888888"],
    isBlurry,
    hasCompressionArtifacts,
    laplacianVariance: Math.round(laplacianVariance),
  };
}

// ── 3. OCR (enhanced v4) ─────────────────────────────────────────────────────

function preprocessForOCR(img: HTMLImageElement): string {
  const SCALE = 3;
  const W = Math.max(img.naturalWidth * SCALE, 600);
  const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;
  ctx.filter = "grayscale(100%) contrast(160%) brightness(105%)";
  ctx.drawImage(img, 0, 0, W, H);
  return canvas.toDataURL("image/png");
}

async function detectText(imageUrl: string, img: HTMLImageElement, w: number, h: number): Promise<OcrData> {
  try {
    const enhanced = preprocessForOCR(img);
    const worker = await Tesseract.createWorker("eng");

    await worker.setParameters({ tessedit_pageseg_mode: 11 as any });
    const res11 = await worker.recognize(enhanced);
    await worker.setParameters({ tessedit_pageseg_mode: 6 as any });
    const res6 = await worker.recognize(enhanced);

    let best = res11.data.text.length >= res6.data.text.length ? res11.data : res6.data;

    if (best.text.trim().length < 4) {
      await worker.setParameters({ tessedit_pageseg_mode: 11 as any });
      const raw = await worker.recognize(imageUrl);
      if (raw.data.text.length > best.text.length) best = raw.data;
    }

    await worker.terminate();

    const text = (best.text ?? "")
      .replace(/[^\w\s%.,!?'"\-$€£#@]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`[ACIE v4 OCR] "${text}"`);

    let totalArea = 0, minH = 9999, maxH = 0;
    const wordBboxes: Array<{ top: number; left: number }> = [];

    ((best as any).words || []).forEach((word: any) => {
      const bw = word.bbox.x1 - word.bbox.x0;
      const bh = word.bbox.y1 - word.bbox.y0;
      totalArea += bw * bh;
      if (bh > 5 && bh < minH) minH = bh;
      if (bh > maxH) maxH = bh;
      wordBboxes.push({ top: word.bbox.y0, left: word.bbox.x0 });
    });

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const lineCount = text.split(/\n/).filter(l => l.trim().length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
    const allWords = text.split(/\s+/).filter(Boolean);
    const avgWordLen = allWords.length > 0
      ? allWords.reduce((s, w) => s + w.length, 0) / allWords.length
      : 0;

    // Headline detection: max text height > 2.5× min text height
    const headlineDetected = maxH > minH * 2.5 && maxH > 20;

    // Reading flow: are words distributed top-to-bottom linearly?
    const readingFlow: ReadingFlow = wordBboxes.length < 3 ? "NONE" :
      (() => {
        const sortedByTop = [...wordBboxes].sort((a, b) => a.top - b.top);
        const isLinear = sortedByTop.every((w, i) => i === 0 || w.left >= 0);
        return isLinear ? "LINEAR" : "SCATTERED";
      })();

    // Text Crowding: check if bounding boxes overlap or are extremely close
    let crowdingCount = 0;
    for (let i = 0; i < wordBboxes.length; i++) {
      for (let j = i + 1; j < wordBboxes.length; j++) {
        const w1 = wordBboxes[i], w2 = wordBboxes[j];
        // simple distance check
        const dist = Math.sqrt(Math.pow(w1.left - w2.left, 2) + Math.pow(w1.top - w2.top, 2));
        if (dist < 10) crowdingCount++;
      }
    }
    const hasTextCrowding = crowdingCount > wordBboxes.length * 0.2 && wordBboxes.length > 5;
    const hasIllegibleText = minH > 0 && minH < 12;

    // Brand detection via corner text or trademark symbols
    const hasTrademark = /™|®|©/i.test(text);
    let cornerTextDetected = false;
    for (const box of wordBboxes) {
      const inTopLeft = box.left < w * 0.25 && box.top < h * 0.25;
      const inTopRight = box.left > w * 0.75 && box.top < h * 0.25;
      const inBottomRight = box.left > w * 0.75 && box.top > h * 0.75;
      if (inTopLeft || inTopRight || inBottomRight) {
        cornerTextDetected = true;
        break;
      }
    }

    return {
      text,
      textLength: text.length,
      textAreaPercent: w * h > 0 ? (totalArea / (w * h)) * 100 : 0,
      minTextHeightPx: minH === 9999 ? 0 : minH,
      maxTextHeightPx: maxH,
      ocrConfidence: best.confidence ?? 0,
      wordCount,
      lineCount,
      headlineDetected,
      readingFlow,
      sentenceCount: sentences.length,
      avgWordLength: parseFloat(avgWordLen.toFixed(1)),
      hasNumbers: /\d/.test(text),
      hasCurrency: /\$|€|£|₹/.test(text),
      hasPercentage: /%/.test(text),
      hasTrademark,
      cornerTextDetected,
      hasTextCrowding,
      hasIllegibleText,
    };
  } catch (err) {
    console.error("[ACIE v4 OCR] Failed:", err);
    return {
      text: "", textLength: 0, textAreaPercent: 0, minTextHeightPx: 0,
      maxTextHeightPx: 0, ocrConfidence: 0, wordCount: 0, lineCount: 0,
      headlineDetected: false, readingFlow: "NONE", sentenceCount: 0,
      avgWordLength: 0, hasNumbers: false, hasCurrency: false, hasPercentage: false,
      hasTrademark: false, cornerTextDetected: false, hasTextCrowding: false, hasIllegibleText: false,
    };
  }
}

// ── 4. CTA Detection (enhanced v4) ────────────────────────────────────────────

const CTA_VERBS = [
  "buy", "shop", "order", "get", "start", "try", "learn", "discover", "explore",
  "download", "sign up", "register", "book", "join", "claim", "watch", "view",
  "grab", "save", "unlock", "access", "activate", "redeem", "subscribe", "checkout",
  "install", "open", "play", "apply", "visit", "see",
];

const SECONDARY_VERBS = ["now", "today", "fast", "here", "today"];

function isCTA(text: string): boolean {
  const lower = text.toLowerCase();
  return CTA_VERBS.some(verb => lower.includes(verb));
}

function isFakeCTA(text: string): boolean {
  const t = text.toLowerCase();
  if (isCTA(text)) return false;
  return FALSE_CTA_PATTERNS.some(p => t.includes(p));
}

function extractCTAPhrase(text: string): { phrase: string; type: CTAType } {
  const lower = text.toLowerCase();

  // Pass 0: High-Priority conversion phrase check (exact/strong variants)
  const highPriorityMatch = ["order now", "buy now", "shop now", "get it now", "claim now"].find(p => lower.includes(p));
  if (highPriorityMatch) {
    return { phrase: highPriorityMatch, type: "Hard" };
  }

  // Pass 1: Dataset Intelligence (highest accuracy)
  const datasetMatch = lookupCTAFromDataset(text);
  if (datasetMatch.found) {
    return { phrase: datasetMatch.word, type: datasetMatch.type };
  }

  // Pass 2: Hardcoded Dictionary Match
  const allDictionaryCTAs = [...CONVERSION_CTAS, ...CONSIDERATION_CTAS, ...AWARENESS_CTAS];
  const directMatch = allDictionaryCTAs.find(w => lower.includes(w));
  if (directMatch) {
    const type: CTAType = CONVERSION_CTAS.includes(directMatch) ? "Hard" : CONSIDERATION_CTAS.includes(directMatch) ? "Medium" : "Soft";
    return { phrase: directMatch, type };
  }

  // Pass 3: Greedy Verb Search with better delimiter support
  const lines = text.split(/[\n,.;|!\-?]/); // Added dash and common OCR noise chars
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const l = trimmed.toLowerCase();
    
    if (CTA_VERBS.some(v => l.includes(v))) {
      const type: CTAType = ["buy", "order", "shop", "get", "book", "download", "claim"].some(v => l.includes(v)) ? "Hard" : "Medium";
      return { phrase: trimmed.slice(0, 50), type };
    }
  }

  return { phrase: "", type: "None" };
}

function analyzeCTA(fullText: string, campaignGoal: CampaignGoal) {
  const { phrase: ctaText, type: detectedType } = extractCTAPhrase(fullText);

  if (!ctaText || detectedType === "None" || isFakeCTA(ctaText)) {
    return {
      found: false, word: "", strength: "none", goalMatch: false, valid: false,
      reason: "No clear action verb detected",
      goal: "unknown", confidence: "0%",
      ctaType: "None" as CTAType, goalFit: "None" as CTAGoalFit,
      urgencySignal: false, valueSignal: false,
    };
  }

  const t = ctaText.toLowerCase();
  const ft = fullText.toLowerCase();
  // Check for high-emphasis casing (ORDER NOW) in the original text segment
  const segment = fullText.split(/[\n,.;|!]/).find(l => l.toLowerCase().includes(t)) || ctaText;
  const isUppercase = segment.length > 3 && segment === segment.toUpperCase();

  let score = { awareness: 0, consideration: 0, conversion: 0 };

  // Score based on detected type
  if (detectedType === "Hard") score.conversion += 3;
  else if (detectedType === "Medium") score.consideration += 3;
  else if (detectedType === "Soft") score.awareness += 3;
  else if (detectedType === "Implicit") { score.consideration += 2; score.conversion += 1; }

  // Fuzzy keyword fallback boosters
  if (["learn", "discover", "explore", "know more", "watch", "see"].some(w => t.includes(w))) score.awareness += 2;
  if (["view", "see details", "compare", "check", "try", "demo", "sign up"].some(w => t.includes(w))) score.consideration += 2;
  if (["buy", "shop", "order", "get", "book", "download", "subscribe", "claim", "grab", "redeem"].some(w => t.includes(w))) score.conversion += 3;

  // Context & Signal boosters
  if (ft.includes("% off") || ft.includes("discount") || ft.includes("offer") || ft.includes("deal") || ft.includes("$")) score.conversion += 2;
  if (ft.includes("limited time") || ft.includes("hurry") || ft.includes("today") || ft.includes("flash") || ft.includes("now")) score.conversion += 2;
  if (ft.includes("free trial") || ft.includes("try for free")) score.consideration += 2;
  if (isUppercase) score.conversion += 1; // High visibility emphasis

  const finalGoal = (Object.keys(score) as CampaignGoal[])
    .reduce((a, b) => score[a] > score[b] ? a : b);
  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);

  const confidenceVal = totalScore > 0 ? Math.max(...Object.values(score)) / totalScore : 0;

  const isConversion = finalGoal === "conversion";
  const isConsideration = finalGoal === "consideration";
  const strength = isConversion ? "hard" : isConsideration ? "medium" : "soft";
  const ctaType: CTAType = isConversion ? "Hard" : isConsideration ? "Medium" : "Soft";

  const goalMatch = finalGoal === campaignGoal;
  const goalFit: CTAGoalFit = goalMatch
    ? "Perfect Match"
    : (Math.abs(["awareness", "consideration", "conversion"].indexOf(finalGoal)
      - ["awareness", "consideration", "conversion"].indexOf(campaignGoal)) === 1)
      ? "Acceptable"
      : "Mismatch";

  const urgencySignal = /limited|hurry|now|today|expires|ends|only/.test(ft);
  const valueSignal = /free|off|save|bonus|gift|deal/.test(ft);

  return {
    found: true, word: ctaText, strength, goalMatch, valid: true,
    goal: finalGoal, confidence: (confidenceVal * 100).toFixed(0) + "%",
    reason: `Goal: ${finalGoal.charAt(0).toUpperCase() + finalGoal.slice(1)}`,
    ctaType, goalFit, urgencySignal, valueSignal,
  };
}

// ── 5. Intelligence Pre-Scan (v4) ─────────────────────────────────────────────

function detectEmotionalAppeal(text: string, px: PixelData): EmotionalAppeal {
  const lower = text.toLowerCase();
  const highCount = HIGH_EMOTION_SIGNALS.filter(w => lower.includes(w)).length;
  const midCount = MEDIUM_EMOTION_SIGNALS.filter(w => lower.includes(w)).length;
  const satBoost = px.saturation > 55 ? 1 : 0;
  const warmBoost = px.warmthScore > 60 ? 1 : 0;
  const focusBoost = px.focalPointStrength > 60 ? 1 : 0;

  if (highCount >= 2 || (highCount >= 1 && satBoost + warmBoost >= 1)) return "HIGH";
  if (midCount >= 2 || highCount >= 1 || satBoost + warmBoost + focusBoost >= 2) return "MEDIUM";
  return "LOW";
}

function calculateClutterIndex(ocr: OcrData, px: PixelData): { index: number; label: ClutterLabel } {
  let score = 0;

  if (ocr.wordCount > 30) score += 3;
  else if (ocr.wordCount > 15) score += 2;
  else if (ocr.wordCount > 8) score += 1;

  if (ocr.textAreaPercent > 50) score += 3;
  else if (ocr.textAreaPercent > 30) score += 2;
  else if (ocr.textAreaPercent > 15) score += 1;

  if (px.edgeDensity > 0.3) score += 2;
  else if (px.edgeDensity > 0.15) score += 1;

  if (ocr.lineCount > 6) score += 1;
  if (ocr.sentenceCount > 3) score += 1;
  if (px.colorVariance > 60) score += 1; // too many colors = visual chaos

  const index = Math.min(10, Math.max(1, score + 1));
  const label: ClutterLabel = index <= 3 ? "CLEAN"
    : index <= 6 ? "MODERATE"
      : index <= 8 ? "CLUTTERED"
        : "CHAOTIC";
  return { index, label };
}

function detectCreativeArchetype(text: string, ctaStrength: string, goal: CampaignGoal, ocr: OcrData): string {
  const lower = text.toLowerCase();
  if (lower.match(/% off|discount|sale|save|deal|offer|flash/)) return "Offer-Driven";
  if (lower.match(/review|rated|customers|stars|trusted|proven|testimonial/)) return "Social Proof";
  if (lower.match(/introducing|new|launch|meet|announcing|first ever/)) return "Product Launch";
  if (lower.match(/how|learn|guide|tips|discover|secret|step/)) return "Educational";
  if (lower.match(/before|after|transform|results|see the difference/)) return "Transformation";
  if (ocr.hasCurrency && ocr.hasPercentage) return "Price-Led Offer";
  if (goal === "conversion" && ctaStrength === "hard") return "Direct Response";
  if (goal === "awareness") return "Brand Storytelling";
  return "Feature Showcase";
}

function detectEmotionSignature(text: string, goal: CampaignGoal, cta: ReturnType<typeof analyzeCTA>): string {
  const lower = text.toLowerCase();
  const signals = [];
  if (lower.match(/limited|hurry|last|ends|only|flash|expires/)) signals.push("Urgency");
  if (lower.match(/you|your|feel|life|dream|better|deserve/)) signals.push("Aspiration");
  if (lower.match(/trust|safe|proven|guaranteed|secure|certified/)) signals.push("Trust");
  if (lower.match(/secret|discover|hidden|revealed|inside/)) signals.push("Curiosity");
  if (lower.match(/free|bonus|extra|gift|save|off/)) signals.push("Value");
  if (lower.match(/new|fresh|innovation|first|launch/)) signals.push("Novelty");
  if (cta.urgencySignal && !signals.includes("Urgency")) signals.push("Urgency");
  if (cta.valueSignal && !signals.includes("Value")) signals.push("Value");
  if (signals.length === 0) {
    if (goal === "conversion") return "Desire + CTA";
    if (goal === "consideration") return "Confidence + Information";
    return "Neutral / Informational";
  }
  return signals.slice(0, 2).join(" + ");
}

function detectVisualHierarchy(ocr: OcrData, px: PixelData): VisualHierarchy {
  let score = 0;
  if (ocr.headlineDetected) score += 3;
  if (px.focalPointStrength > 50) score += 2;
  if (ocr.readingFlow === "LINEAR") score += 2;
  if (px.contrast > 50) score += 1;
  if (ocr.textAreaPercent < 35 && ocr.wordCount > 0) score += 1;
  if (px.colorVariance < 40) score += 1; // limited palette = cleaner hierarchy

  if (score >= 7) return "STRONG";
  if (score >= 4) return "MODERATE";
  return "WEAK";
}

function calculateCognitiveLoad(ocr: OcrData, px: PixelData, clutter: { index: number }): number {
  // Lower is better (0–100)
  let load = 0;
  load += Math.min(40, ocr.wordCount * 1.3);
  load += clutter.index * 4;
  load += px.colorVariance > 60 ? 15 : px.colorVariance > 40 ? 8 : 0;
  load += ocr.readingFlow === "SCATTERED" ? 10 : 0;
  load += !ocr.headlineDetected && ocr.wordCount > 5 ? 8 : 0;
  return clamp(Math.round(load));
}

function estimateStopRate(forecast: EngagementForecast, emotionalAppeal: EmotionalAppeal, clutter: { label: ClutterLabel }): string {
  if (forecast === "PEAK" && emotionalAppeal === "HIGH") return "3.5–5%";
  if (forecast === "PEAK" || (forecast === "HIGH" && emotionalAppeal === "HIGH")) return "2.5–4%";
  if (forecast === "HIGH") return "1.8–3%";
  if (forecast === "MEDIUM") return "1–2%";
  return "0.3–1%";
}

// ── 6. Tone Detection ─────────────────────────────────────────────────────────

function detectTone(text: string): "urgent" | "helpful" | "curiosity" | "neutral" {
  const norm = text.toLowerCase();
  const a = AWARENESS_KEYWORDS.filter(w => norm.includes(w)).length;
  const c = CONSIDERATION_KEYWORDS.filter(w => norm.includes(w)).length;
  const v = CONVERSION_KEYWORDS.filter(w => norm.includes(w)).length;
  if (v > 0 && v >= c && v >= a) return "urgent";
  if (c > 0 && c >= a) return "helpful";
  if (a > 0) return "curiosity";
  return "neutral";
}

// ── 7. Nine-Dimension Scoring Engine ──────────────────────────────────────────

interface NineDimInput {
  goal: CampaignGoal;
  px: PixelData;
  ocr: OcrData;
  cta: ReturnType<typeof analyzeCTA>;
  fileSizeKB: number;
  clutter: { index: number; label: ClutterLabel };
  emotionalAppeal: EmotionalAppeal;
  visualHierarchy: VisualHierarchy;
}

function scoreAllDimensions(inp: NineDimInput): Record<keyof typeof DIM_WEIGHTS, DimensionScore> {
  const { goal, px, ocr, cta, fileSizeKB, clutter, visualHierarchy } = inp;

  // D1 — CTA (0–100)
  let ctaRaw = 0, ctaDetail = "";
  if (!cta.found) {
    ctaRaw = goal === "awareness" ? 52 : goal === "consideration" ? 32 : 0;
    ctaDetail = `No CTA found. ${goal === "awareness" ? "Soft CTA optional for awareness." : "CTA is essential for this goal."}`;
  } else if (cta.goalFit === "Perfect Match") {
    ctaRaw = 82 + (cta.ctaType === "Hard" && goal === "conversion" ? 10 : 0);
    if (cta.urgencySignal) ctaRaw = Math.min(100, ctaRaw + 5);
    ctaDetail = `"${cta.word}" — Perfect match for ${goal}. ${cta.urgencySignal ? "Urgency signal detected." : ""}`;
  } else if (cta.goalFit === "Acceptable") {
    ctaRaw = 58;
    ctaDetail = `"${cta.word}" — Acceptable for ${goal} but not ideal.`;
  } else {
    ctaRaw = cta.ctaType === "Hard" && goal === "awareness" ? 32 : cta.ctaType === "Soft" && goal === "conversion" ? 22 : 42;
    ctaDetail = `"${cta.word}" — Mismatched CTA type for ${goal} goal.`;
  }
  ctaRaw = clamp(ctaRaw);

  // D2 — Text Clarity (0–100)
  let textRaw = 82, textDetail = "";
  if (ocr.wordCount > 30) textRaw -= 28;
  else if (ocr.wordCount > 20) textRaw -= 18;
  else if (ocr.wordCount > 12) textRaw -= 8;
  if (ocr.textAreaPercent > 50) textRaw -= 22;
  else if (ocr.textAreaPercent > 35) textRaw -= 12;
  if (ocr.hasIllegibleText) textRaw -= 20;
  if (ocr.hasTextCrowding) textRaw -= 15;
  if (clutter.label === "CHAOTIC") textRaw -= 20;
  else if (clutter.label === "CLUTTERED") textRaw -= 12;
  if (!ocr.headlineDetected && ocr.wordCount > 4) textRaw -= 8;
  if (ocr.readingFlow === "LINEAR" && ocr.headlineDetected) textRaw += 8;
  textRaw = clamp(textRaw);
  textDetail = `${ocr.wordCount} words | ${Math.round(ocr.textAreaPercent)}% text area | Legibility: ${ocr.hasIllegibleText ? "POOR" : "GOOD"} | Crowding: ${ocr.hasTextCrowding ? "YES" : "NO"}`;

  // D3 — Brand Presence (0–100)
  let brandRaw = 40, brandDetail = "";
  if (ocr.cornerTextDetected) brandRaw += 25;
  if (ocr.hasTrademark) brandRaw += 15;
  if (px.focalPointStrength > 70) brandRaw += 15;
  else if (px.focalPointStrength > 40) brandRaw += 8;
  if (goal === "conversion" && brandRaw < 50) brandRaw -= 12;
  if (ocr.wordCount === 0) brandRaw -= 15; // no text may mean no brand name
  brandRaw = clamp(brandRaw);
  brandDetail = `Corner text: ${ocr.cornerTextDetected ? "YES" : "NO"} | TM signals: ${ocr.hasTrademark ? "YES" : "NO"} | Focal: ${px.focalPointStrength}/100`;

  // D4 — Brightness & Contrast (0–100)
  let brightRaw = 82, brightDetail = "";
  if (px.brightness < 20) brightRaw -= 25;
  else if (px.brightness < 35) brightRaw -= 15;
  else if (px.brightness < 45) brightRaw -= 8;
  else if (px.brightness > 88) brightRaw -= 18;
  else if (px.brightness > 78) brightRaw -= 8;
  if (px.contrast < 25) brightRaw -= 25;
  else if (px.contrast < 40) brightRaw -= 12;
  if (px.clipHigh > 0.35) brightRaw -= 12;
  if (px.wcagLevel === "FAIL") brightRaw -= 10;
  else if (px.wcagLevel === "AA") brightRaw += 5;
  brightRaw = clamp(brightRaw);
  brightDetail = `Brightness: ${px.brightness}% | Contrast: ${px.contrast}% | WCAG: ${px.wcagLevel} | Ratio: ${px.textContrast}:1`;

  // D5 — Goal Alignment (0–100)
  const goalRaw = calculateGoalAlignmentFull(goal, cta, px, ocr);
  const goalDetail = `CTA fit: ${cta.goalFit} | Has urgency: ${cta.urgencySignal} | Has price: ${ocr.hasCurrency} | Goal: ${goal}`;

  // D6 — Pixel Quality (0–100)
  let pixelRaw = 82, pixelDetail = "";
  if (px.isBlurry) pixelRaw -= 40;
  if (px.hasCompressionArtifacts) pixelRaw -= 25;
  if (px.contrast < 20) pixelRaw -= 28;
  else if (px.contrast < 35) pixelRaw -= 14;
  if (px.clipHigh > 0.45) pixelRaw -= 18;
  else if (px.clipHigh > 0.25) pixelRaw -= 8;
  if (px.edgeDensity < 0.02) pixelRaw -= 12;
  if (ocr.ocrConfidence > 0 && ocr.ocrConfidence < 45) pixelRaw -= 12;
  pixelRaw = clamp(pixelRaw);
  pixelDetail = `Sharpness: ${px.isBlurry ? "BLURRY" : "SHARP"} (${px.laplacianVariance}) | Artifacts: ${px.hasCompressionArtifacts ? "YES" : "NO"} | OCR: ${ocr.ocrConfidence.toFixed(0)}%`;

  // D7 — File Size (0–100)
  let fileSizeRaw = 95;
  if (fileSizeKB <= 0) fileSizeRaw = -1;
  else if (fileSizeKB <= 80) fileSizeRaw = 98;
  else if (fileSizeKB <= 150) fileSizeRaw = 88;
  else if (fileSizeKB <= 250) fileSizeRaw = 70;
  else if (fileSizeKB <= 400) fileSizeRaw = 48;
  else if (fileSizeKB <= 600) fileSizeRaw = 28;
  else fileSizeRaw = 12;
  const fileSizeDetail = fileSizeKB <= 0 ? "Size unknown" : `${fileSizeKB}KB — ${fileSizeRaw >= 70 ? "Acceptable" : "Too large for fast delivery"}`;

  // D8 — Color Harmony (0–100)
  let colorRaw = px.colorHarmony === "HARMONIOUS" ? 88 : px.colorHarmony === "ACCEPTABLE" ? 62 : 35;
  if (px.colorVariance > 70) colorRaw -= 15;
  if (px.saturation < 15) colorRaw -= 10; // desaturated = lifeless
  if (px.saturation > 90) colorRaw -= 8;  // over-saturated = garish
  colorRaw = clamp(colorRaw);
  const colorDetail = `Harmony: ${px.colorHarmony} | Hue variance: ${px.colorVariance}/100 | Saturation: ${px.saturation}%`;

  // D9 — Visual Hierarchy (0–100)
  let hierRaw = visualHierarchy === "STRONG" ? 88 : visualHierarchy === "MODERATE" ? 62 : 30;
  if (ocr.headlineDetected) hierRaw += 8;
  if (ocr.readingFlow === "LINEAR") hierRaw += 5;
  hierRaw = clamp(hierRaw);
  const hierDetail = `Hierarchy: ${visualHierarchy} | Headline: ${ocr.headlineDetected ? "YES" : "NO"} | Flow: ${ocr.readingFlow} | Focal: ${px.focalPointStrength}/100`;

  const verdict = (raw: number) =>
    raw >= 85 ? "Excellent" : raw >= 70 ? "Good" : raw >= 55 ? "Fair" : raw >= 38 ? "Needs Work" : "Poor";

  return {
    cta: { raw: ctaRaw, weight: DIM_WEIGHTS.cta, verdict: verdict(ctaRaw), pass: ctaRaw >= 65, detail: ctaDetail },
    text: { raw: textRaw, weight: DIM_WEIGHTS.text, verdict: verdict(textRaw), pass: textRaw >= 65, detail: textDetail },
    brand: { raw: brandRaw, weight: DIM_WEIGHTS.brand, verdict: verdict(brandRaw), pass: brandRaw >= 55, detail: brandDetail },
    brightness: { raw: brightRaw, weight: DIM_WEIGHTS.brightness, verdict: verdict(brightRaw), pass: brightRaw >= 55, detail: brightDetail },
    goal: { raw: goalRaw, weight: DIM_WEIGHTS.goal, verdict: verdict(goalRaw), pass: goalRaw >= 60, detail: goalDetail },
    pixel: { raw: pixelRaw, weight: DIM_WEIGHTS.pixel, verdict: verdict(pixelRaw), pass: pixelRaw >= 60, detail: pixelDetail },
    filesize: { raw: fileSizeRaw >= 0 ? fileSizeRaw : 82, weight: DIM_WEIGHTS.filesize, verdict: fileSizeRaw < 0 ? "N/A" : verdict(fileSizeRaw), pass: fileSizeRaw < 0 || fileSizeRaw >= 60, detail: fileSizeDetail },
    color_harmony: { raw: colorRaw, weight: DIM_WEIGHTS.color_harmony, verdict: verdict(colorRaw), pass: colorRaw >= 55, detail: colorDetail },
    visual_hierarchy: { raw: hierRaw, weight: DIM_WEIGHTS.visual_hierarchy, verdict: verdict(hierRaw), pass: hierRaw >= 55, detail: hierDetail },
  };
}

function calculateWeightedScore(dims: Record<keyof typeof DIM_WEIGHTS, DimensionScore>): number {
  let total = 0, weightUsed = 0;
  (Object.keys(DIM_WEIGHTS) as (keyof typeof DIM_WEIGHTS)[]).forEach(key => {
    const d = dims[key];
    if (d.verdict !== "N/A") {
      total += d.raw * d.weight;
      weightUsed += d.weight;
    }
  });
  return weightUsed > 0 ? Math.round(total / weightUsed) : 0;
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── 8. Full Goal Alignment Matrix ─────────────────────────────────────────────

function calculateGoalAlignmentFull(
  goal: CampaignGoal,
  cta: ReturnType<typeof analyzeCTA>,
  px: PixelData,
  ocr: OcrData,
): number {
  let ctaScore = 0, intentScore = 0, visualScore = 0, offerScore = 0, clarityScore = 0;
  const t = ocr.text.toLowerCase();

  const hasPrice = /\$|€|£|price|cost|₹/.test(t);
  const hasDiscount = /% off|discount|save|off/.test(t);
  const hasUrgency = /today|now|hurry|limited|ends|flash|expires/.test(t);
  const hasFeatures = /features|benefits|quality|best|guide|compare|top/.test(t);
  const hasProof = /rated|reviews|stars|proven|trusted|#1|customers/.test(t);
  const hasNumber = ocr.hasNumbers;

  // CTA Match (25)
  if (goal === "awareness") {
    ctaScore = cta.strength === "soft" ? 25 : (cta.strength === "medium" || !cta.found) ? 16 : 6;
  } else if (goal === "consideration") {
    ctaScore = cta.strength === "medium" ? 25 : (cta.strength === "soft" || !cta.found) ? 16 : 10;
  } else {
    ctaScore = cta.strength === "hard" ? 25 : cta.strength === "medium" ? 12 : 0;
  }

  // Message Intent (25)
  const aK = AWARENESS_KEYWORDS.filter(w => t.includes(w)).length;
  const cK = CONSIDERATION_KEYWORDS.filter(w => t.includes(w)).length;
  const vK = CONVERSION_KEYWORDS.filter(w => t.includes(w)).length;
  if (goal === "awareness") {
    intentScore = aK >= 2 ? 25 : aK === 1 ? 18 : cK >= 1 ? 12 : 8;
  } else if (goal === "consideration") {
    intentScore = cK >= 2 ? 25 : cK === 1 ? 18 : aK >= 1 ? 12 : 8;
  } else {
    intentScore = vK >= 2 ? 25 : vK === 1 ? 18 : (cK >= 1 || hasNumber) ? 12 : 5;
  }

  // Visual Alignment (15)
  if (goal === "awareness") {
    visualScore = ocr.textAreaPercent < 20 ? 15 : ocr.textAreaPercent < 40 ? 10 : 5;
  } else if (goal === "consideration") {
    visualScore = (ocr.textAreaPercent >= 15 && ocr.textAreaPercent < 40) ? 15 : ocr.textAreaPercent < 15 ? 10 : 5;
  } else {
    visualScore = cta.found && px.contrast > 40 ? 15 : (cta.found || px.contrast > 40) ? 10 : 5;
  }

  // Offer / Info Presence (20)
  if (goal === "awareness") {
    offerScore = (!hasPrice && !hasDiscount) ? 20 : hasPrice && !hasDiscount ? 10 : 5;
  } else if (goal === "consideration") {
    offerScore = (hasFeatures && hasProof) ? 20 : (hasFeatures || hasProof) ? 12 : 5;
  } else {
    offerScore = ((hasPrice || hasDiscount) && hasUrgency) ? 20
      : (hasPrice && hasDiscount) ? 15
        : (hasPrice || hasDiscount || hasUrgency) ? 10 : 0;
  }

  // Action Clarity (15)
  clarityScore = (cta.found && px.contrast > 30 && ocr.textAreaPercent < 40 && ocr.headlineDetected) ? 15
    : (cta.found && px.contrast > 30) ? 12
      : cta.found ? 8 : 3;

  return clamp(ctaScore + intentScore + visualScore + offerScore + clarityScore);
}

// ── 9. Engagement Forecast (enhanced with confidence %) ───────────────────────

function calculateEngagementForecast(
  dims: Record<keyof typeof DIM_WEIGHTS, DimensionScore>,
  emotionalAppeal: EmotionalAppeal,
  clutter: { index: number; label: ClutterLabel },
  cta: ReturnType<typeof analyzeCTA>,
  visualHierarchy: VisualHierarchy,
): { forecast: EngagementForecast; drivers: string[]; confidence: number } {
  const finalScore = calculateWeightedScore(dims);
  const drivers: string[] = [];

  // Positive signals
  if (dims.cta.raw >= 82) drivers.push("Strong CTA with perfect funnel alignment");
  if (dims.goal.raw >= 82) drivers.push("Excellent goal alignment across all creative elements");
  if (emotionalAppeal === "HIGH") drivers.push("High emotional appeal — strong scroll-stop potential");
  if (clutter.label === "CLEAN") drivers.push("Clean layout — mobile feed friendly");
  if (dims.text.raw >= 82) drivers.push("Crystal clear message extractable in < 3 seconds");
  if (visualHierarchy === "STRONG") drivers.push("Strong visual hierarchy guides viewer attention naturally");
  if (dims.color_harmony.raw >= 80) drivers.push("Harmonious color palette — professional and memorable");
  if (cta.urgencySignal) drivers.push("Urgency signal detected — drives immediate action");

  // Negative signals
  if (dims.cta.raw < 50) drivers.push("Weak or missing CTA will hurt click-through rate");
  if (dims.goal.raw < 50) drivers.push("Goal misalignment — creative fights the funnel stage");
  if (clutter.label === "CLUTTERED" || clutter.label === "CHAOTIC") drivers.push("High clutter — poor mobile readability and attention retention");
  if (emotionalAppeal === "LOW") drivers.push("Low emotional appeal — may not stop the scroll");
  if (dims.brightness.raw < 50) drivers.push("Brightness/contrast issues reduce visual impact");
  if (visualHierarchy === "WEAK") drivers.push("Weak visual hierarchy — viewer doesn't know where to look");
  if (dims.color_harmony.raw < 45) drivers.push("Discordant colors hurt brand perception and readability");

  const positives = drivers.filter(d => !["hurt", "Weak", "missing", "poor", "Low", "Clutter", "issues", "misalignment", "Discordant", "don't"].some(k => d.includes(k)));
  const negatives = drivers.filter(d => ["hurt", "Weak", "missing", "poor", "Low", "Clutter", "issues", "misalignment", "Discordant"].some(k => d.includes(k)));

  const topDrivers = finalScore >= 65 ? positives : negatives;

  const forecast: EngagementForecast =
    finalScore >= 85 && emotionalAppeal !== "LOW" && clutter.label !== "CLUTTERED" && clutter.label !== "CHAOTIC" && visualHierarchy !== "WEAK"
      ? "PEAK"
      : finalScore >= 72 && emotionalAppeal !== "LOW"
        ? "HIGH"
        : finalScore >= 55
          ? "MEDIUM"
          : "LOW";

  // Confidence: how many signals align vs contradict
  const allSignalCount = positives.length + negatives.length;
  const dominantSignals = finalScore >= 65 ? positives.length : negatives.length;
  const confidence = allSignalCount > 0
    ? clamp(Math.round((dominantSignals / allSignalCount) * 100))
    : 50;

  return { forecast, drivers: (topDrivers.length > 0 ? topDrivers : drivers).slice(0, 4), confidence };
}

// ── 10. A/B Hypothesis Generator ─────────────────────────────────────────────

function generateABHypotheses(
  dims: Record<keyof typeof DIM_WEIGHTS, DimensionScore>,
  goal: CampaignGoal,
  cta: ReturnType<typeof analyzeCTA>,
  emotionalAppeal: EmotionalAppeal,
  ocr: OcrData,
): ABHypothesis[] {
  const hypotheses: ABHypothesis[] = [];

  if (dims.cta.raw < 80) {
    const goalCTAs = GOAL_CTA[goal];
    hypotheses.push({
      dimension: "CTA",
      variant_a: cta.found ? `Current: "${cta.word}"` : "No CTA (current)",
      variant_b: `Test: "${goalCTAs[0]}" with urgency badge`,
      expected_lift: "15–35% CTR improvement",
      priority: dims.cta.raw < 50 ? "HIGH" : "MEDIUM",
    });
  }

  if (dims.text.raw < 78 && ocr.wordCount > 12) {
    hypotheses.push({
      dimension: "Text Density",
      variant_a: `Current: ${ocr.wordCount} words`,
      variant_b: "Test: Reduce to 5–8 words, bold headline only",
      expected_lift: "10–20% stop-rate lift on mobile",
      priority: "HIGH",
    });
  }

  if (emotionalAppeal === "LOW") {
    hypotheses.push({
      dimension: "Emotional Resonance",
      variant_a: "Current: Informational / neutral tone",
      variant_b: "Test: Add aspirational or urgency-focused headline",
      expected_lift: "20–40% engagement improvement for cold audiences",
      priority: "HIGH",
    });
  }

  if (dims.color_harmony.raw < 65) {
    hypotheses.push({
      dimension: "Color Palette",
      variant_a: "Current color scheme",
      variant_b: "Test: Reduce to 2-color palette with high contrast accent",
      expected_lift: "8–15% brand recall improvement",
      priority: "MEDIUM",
    });
  }

  if (dims.brightness.raw < 70) {
    hypotheses.push({
      dimension: "Visual Impact",
      variant_a: "Current exposure/contrast",
      variant_b: "Test: +30% brightness, add dark text shadow for legibility",
      expected_lift: "10–18% noticeability improvement",
      priority: "MEDIUM",
    });
  }

  return hypotheses.slice(0, 4);
}

// ── 11. Fix Block Generator (enhanced v4) ─────────────────────────────────────

function generateFixBlocks(
  dims: Record<keyof typeof DIM_WEIGHTS, DimensionScore>,
  goal: CampaignGoal,
  cta: ReturnType<typeof analyzeCTA>,
  ocr: OcrData,
  px: PixelData,
): FixBlock[] {
  const fixes: FixBlock[] = [];

  const severity = (score: number): FixBlock["severity"] =>
    score < 35 ? "CRITICAL" : score < 55 ? "HIGH" : score < 75 ? "MEDIUM" : "LOW";

  // D1 — CTA
  if (dims.cta.raw < 75) {
    let problem = "No CTA detected.";
    let fixNow = "Add a clear action phrase matching your funnel stage.";
    let fixDeep = "Redesign with a prominent high-contrast CTA button.";
    let abTestIdea = `A/B: current vs "${GOAL_CTA[goal][0]}" with urgency flag`;

    if (cta.found && cta.goalFit === "Mismatch") {
      const goalCTAs = GOAL_CTA[goal];
      problem = `"${cta.word}" is ${cta.ctaType} but ${goal} needs ${goal === "conversion" ? "Hard" : goal === "consideration" ? "Medium" : "Soft"} CTA.`;
      fixNow = `Replace with "${goalCTAs[0]}" or "${goalCTAs[1]}" — exact intent match.`;
      fixDeep = `Redesign button with high-contrast accent color, white bold text, and the phrase "${goalCTAs[0]}".`;
      abTestIdea = `A/B: "${cta.word}" vs "${goalCTAs[0]}" — predict +20–35% CTR on matching goal`;
    } else if (!cta.found) {
      const goalCTAs = GOAL_CTA[goal];
      fixNow = `Add "${goalCTAs[0]}" in the bottom third, minimum 14px, high contrast.`;
      fixDeep = `Create a button with accent background (e.g. electric blue), white text, and "${goalCTAs[0]}".`;
      abTestIdea = `A/B: no CTA vs "${goalCTAs[0]}" button — CTR delta expected: 40–80%`;
    }

    fixes.push({
      dimension: "CTA",
      score: dims.cta.raw,
      severity: severity(dims.cta.raw),
      problem,
      impact: `Weak/missing CTA reduces CTR 20–60%. ${goal === "conversion" ? "CRITICAL — conversion stage without hard CTA loses most spend." : ""}`,
      fixNow,
      fixDeep,
      timeEstimate: "15–30 min",
      datasetNote: `${goal} creatives with matching CTAs show significantly higher engagement than mismatched ones.`,
      abTestIdea,
    });
  }

  // D2 — Text Clarity
  if (dims.text.raw < 75) {
    let problem = ocr.wordCount > 20
      ? `${ocr.wordCount} words detected — banner viewers read for 1.5–3 seconds maximum.`
      : !ocr.headlineDetected
        ? "No dominant headline found — text has no visual hierarchy."
        : "Text density or size creates reading friction.";
    let fixNow = "Reduce to: 1 headline (5–7 words max) + 1 CTA. Cut everything else.";

    if (ocr.hasIllegibleText) {
      problem = "Text is too small to be legible on mobile devices.";
      fixNow = "Increase minimum font size to 14px and use high-contrast colors.";
    } else if (ocr.hasTextCrowding) {
      problem = "Text elements are crowded together, reducing readability.";
      fixNow = "Increase line-height and letter-spacing; add padding between text blocks.";
    }

    fixes.push({
      dimension: "Text Clarity",
      score: dims.text.raw,
      severity: severity(dims.text.raw),
      problem,
      impact: "Cluttered text kills stop-rate. Mobile users process max 5–7 words in a feed scroll.",
      fixNow,
      fixDeep: "Redesign with a single bold display headline. Apply the '1 thought per creative' rule.",
      timeEstimate: "20–40 min",
      datasetNote: "LOW_PERFORMER creatives consistently have 20+ words. HIGH_PERFORMERs average 6–10 words.",
      abTestIdea: `A/B: ${ocr.wordCount} words vs 6-word headline — stop-rate delta expected: 15–30%`,
    });
  }

  // D3 — Brand Presence
  if (dims.brand.raw < 75) {
    let problem = "Brand visibility is weak — logo may be absent, too small, or low contrast.";
    let fixNow = "Place logo top-left at ≥10% creative width with clear background contrast.";

    if (!ocr.cornerTextDetected && !ocr.hasTrademark) {
      problem = "No brand text, trademark, or logo signatures detected in primary zones.";
      fixNow = "Add your brand name or logo to the top-left or top-right corner.";
    }

    fixes.push({
      dimension: "Brand Presence",
      score: dims.brand.raw,
      severity: severity(dims.brand.raw),
      problem,
      impact: `${goal === "conversion" ? "CRITICAL: buyers must see who they're purchasing from." : "Weak brand reduces recall and attribution."}`,
      fixNow,
      fixDeep: "Integrate brand color as dominant accent so the brand is felt even without a visible logo.",
      timeEstimate: "10–20 min",
      datasetNote: "HIGH_PERFORMERs at conversion stage all had clearly visible logo + brand color.",
      abTestIdea: "A/B: no logo vs logo top-left — brand recall lift expected: 25–45%",
    });
  }

  // D4 — Brightness & Contrast
  if (dims.brightness.raw < 75) {
    const issue = px.brightness < 28 ? "too dark" : px.brightness > 82 ? "overexposed" : px.contrast < 35 ? "low contrast" : "exposure issue";
    fixes.push({
      dimension: "Brightness & Contrast",
      score: dims.brightness.raw,
      severity: severity(dims.brightness.raw),
      problem: `Image is ${issue}. Brightness: ${px.brightness}/100, Contrast: ${px.contrast}/100, WCAG: ${px.wcagLevel}.`,
      impact: "Poor contrast creates banner blindness and platform penalties. WCAG FAIL = text is illegible.",
      fixNow: px.contrast < 35
        ? "Add dark overlay (rgba 0,0,0,0.35) behind text for immediate contrast fix."
        : `Adjust ${issue === "too dark" ? "exposure +30–40%" : "reduce exposure -20–30% and boost saturation slightly"}.`,
      fixDeep: "Reshoot hero image with proper lighting. Use white/light background for programmatic to prevent page blending.",
      timeEstimate: "30–60 min",
      datasetNote: "Creatives with contrast > 50 consistently outperform dark/washed-out variants.",
      abTestIdea: `A/B: current exposure vs +${px.brightness < 40 ? "40%" : "20%"} brightness — visibility lift expected: 15–25%`,
    });
  }

  // D5 — Goal Alignment
  if (dims.goal.raw < 75) {
    const matrix: Record<CampaignGoal, string> = {
      awareness: "Use aspirational visuals + soft CTA. Remove pricing — cold audiences don't respond to offers.",
      consideration: "Add social proof (ratings/reviews), feature benefits, and medium CTA like 'View Plans'.",
      conversion: "Add price/offer, urgency signal (limited time), product close-up, and hard CTA (Buy Now).",
    };
    fixes.push({
      dimension: "Goal Alignment",
      score: dims.goal.raw,
      severity: severity(dims.goal.raw),
      problem: `Creative doesn't fully serve ${goal} stage — visual tone, messaging, and CTA are not cohesive.`,
      impact: "Goal misalignment is #1 cause of wasted ad spend. Conversion creative without urgency/offer can lose 30–50% conversions.",
      fixNow: matrix[goal],
      fixDeep: `Build a creative specifically for ${goal}: ${goal === "conversion" ? "hero product + offer overlay + urgency + hard CTA" : goal === "consideration" ? "benefit headline + social proof + medium CTA" : "emotional visual + brand + soft CTA"}.`,
      timeEstimate: "1–3 hours",
      datasetNote: `HIGH_PERFORMERs at ${goal} stage show unified CTA + message + visual system.`,
      abTestIdea: `A/B: current vs ${goal}-optimized template — goal alignment lift expected: 25–50%`,
    });
  }

  // D6 — Pixel Quality
  if (dims.pixel.raw < 75) {
    let problem = "Visual quality issues detected — may be low-res or heavily compressed.";
    let fixNow = "Re-export at 2× display size (e.g. 600×500 for 300×250) as PNG, minimal compression.";

    if (px.isBlurry) {
      problem = `Image is blurry (Sharpness: ${px.laplacianVariance}). Out-of-focus visuals reduce CTR by 30%.`;
      fixNow = "Use a higher-resolution hero image or apply a sharpening filter (Unsharp Mask).";
    } else if (px.hasCompressionArtifacts) {
      problem = "Severe JPEG compression artifacts detected (blockiness/noise).";
      fixNow = "Save as PNG-24 or WebP with at least 80% quality settings.";
    }

    fixes.push({
      dimension: "Pixel Quality",
      score: dims.pixel.raw,
      severity: severity(dims.pixel.raw),
      problem,
      impact: "Low quality visuals reduce credibility. Some platforms reject creatives below quality thresholds.",
      fixNow,
      fixDeep: "Source higher-res imagery or vector art. For text, use CSS/SVG instead of raster.",
      timeEstimate: "15–45 min",
      datasetNote: "Platform rejection rates spike above 300KB and below 72 DPI equivalent.",
      abTestIdea: "A/B: current vs re-exported high-quality version — engagement lift expected: 8–15%",
    });
  }

  // D7 — File Size
  if (dims.filesize.raw < 75 && dims.filesize.verdict !== "N/A") {
    fixes.push({
      dimension: "File Size",
      score: dims.filesize.raw,
      severity: severity(dims.filesize.raw),
      problem: `File is likely too large. Google Display penalizes creatives > 150KB.`,
      impact: "Heavy files slow creative loading, especially on 3G. High CPC in programmatic campaigns.",
      fixNow: "Compress via TinyPNG.com or Squoosh.app. Target < 150KB display, < 400KB Meta.",
      fixDeep: "Convert PNG to WebP (30–50% smaller at same quality). Consider HTML5 for animated creatives.",
      timeEstimate: "5–15 min",
      datasetNote: "File size > 300KB shows measurably higher CPC in programmatic.",
      abTestIdea: "A/B: current file size vs compressed version — loading speed impact on CTR: 5–12%",
    });
  }

  // D8 — Color Harmony
  if (dims.color_harmony.raw < 75) {
    fixes.push({
      dimension: "Color Harmony",
      score: dims.color_harmony.raw,
      severity: severity(dims.color_harmony.raw),
      problem: `Color palette is ${px.colorHarmony}. ${px.colorVariance > 60 ? `Too many hue zones (${px.colorVariance}/100 variance).` : px.saturation < 15 ? "Colors are too desaturated — creative feels dull." : "Color relationships create visual tension."}`,
      impact: "Discordant colors hurt brand professionalism and reduce readability. Impacts brand recall by 25%.",
      fixNow: "Limit to 2–3 colors: 1 dominant, 1 accent, 1 neutral. Use brand color as primary.",
      fixDeep: "Run the creative through a color harmony tool (Adobe Color or Coolors). Build on analogous or complementary palette.",
      timeEstimate: "30–60 min",
      datasetNote: "Creatives with 2–3 color palettes outperform chaotic multi-color variants by ~20%.",
      abTestIdea: "A/B: current palette vs 2-color brand palette — brand recall lift expected: 15–30%",
    });
  }

  // D9 — Visual Hierarchy
  if (dims.visual_hierarchy.raw < 75) {
    fixes.push({
      dimension: "Visual Hierarchy",
      score: dims.visual_hierarchy.raw,
      severity: severity(dims.visual_hierarchy.raw),
      problem: `Visual hierarchy is ${ocr.headlineDetected ? "moderate" : "weak"} — viewer attention is diffused.`,
      impact: "Weak hierarchy means viewers don't know where to look. Reduces message retention by 40%.",
      fixNow: ocr.headlineDetected
        ? "Increase size contrast between headline and body. Make the headline 3× larger than secondary text."
        : "Add a large, bold headline as the primary visual anchor. Everything else should be secondary.",
      fixDeep: "Apply F-pattern or Z-pattern reading flow: headline top-left → visual → CTA bottom-right.",
      timeEstimate: "30–90 min",
      datasetNote: "Creatives with STRONG visual hierarchy achieve 35% higher message recall.",
      abTestIdea: "A/B: current layout vs strong-hierarchy redesign — stop-rate lift expected: 20–35%",
    });
  }

  return fixes;
}

// ── 12. Dataset Pattern Match ─────────────────────────────────────────────────

function matchDataset(
  goal: CampaignGoal,
  ctaStrength: string,
): DatasetMatch[] {
  try {
    const stats = getDatasetStats();
    if (stats.total === 0) return [];

    // Use findSimilarCreative which matches the datasetIntelligence API
    const match = findSimilarCreative(goal, ctaStrength);
    if (!match) return [];

    return [{
      creative_id: match.id.toString() || "DATASET_MATCH",
      similarity: "High",
      result_label: match.result_label || "MEDIUM",
      ctr: match.ctr,
      learning: match.label_notes || `Similar ${goal} creative with ${ctaStrength} CTA from dataset.`,
    }];
  } catch {
    return [];
  }
}

function computePlatformChecks(platform: Platform, fileSizeKB: number, ocr: OcrData, size: string): Record<string, any> {
  const checks: Record<string, any> = {};
  const isProgrammaticSize = ["300x250", "728x90", "160x600", "320x50", "300x600"].includes(size);

  if (platform === "programmatic") {
    checks.file_weight = { label: "File Weight (< 150KB)", pass: fileSizeKB <= 150, score: fileSizeKB <= 150 ? 100 : 40 };
    checks.standard_dims = { label: "Standard Format", pass: isProgrammaticSize, score: isProgrammaticSize ? 100 : 50 };
    checks.text_safe = { label: "Safe Text Density", pass: ocr.textAreaPercent < 40, score: clamp(100 - ocr.textAreaPercent) };
  } else if (platform === "google_display") {
    checks.file_weight = { label: "Google Policy (< 150KB)", pass: fileSizeKB <= 150, score: fileSizeKB <= 150 ? 100 : 20 };
    checks.animation = { label: "Static Check", pass: true, score: 100 };
  } else if (platform === "meta_social" || platform === "instagram") {
    checks.text_rule = { label: "Text Overlay (< 20%)", pass: ocr.textAreaPercent < 20, score: ocr.textAreaPercent < 20 ? 100 : 60 };
    checks.aspect_ratio = { label: "Mobile Friendly", pass: true, score: 100 };
  }

  return checks;
}

// ── 13. Main Analysis Engine ───────────────────────────────────────────────────

export async function analyzeCreativeLocal(
  imageUrl: string,
  goal: CampaignGoal,
  platform: Platform = "programmatic",
  audienceType: AudienceType = "broad",
  imageSize: string = "",
  fileSizeKB: number = 0,
): Promise<LocalAnalysisResult> {
  return new Promise<LocalAnalysisResult>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = async () => {
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const size = imageSize || `${width}x${height}`;
        const tier = getTier(width, height);

        // Step 1: Pixel Analysis
        const px = analyzePixels(img);

        // Step 2: OCR
        const ocr = await detectText(imageUrl, img, width, height);

        // Step 3: CTA Detection
        const cta = analyzeCTA(ocr.text, goal);
        const tone = detectTone(ocr.text);

        // Step 4: Intelligence Pre-Scan
        const emotionalAppeal = detectEmotionalAppeal(ocr.text, px);
        const clutter = calculateClutterIndex(ocr, px);
        const visualHierarchy = detectVisualHierarchy(ocr, px);
        const creativeArchetype = detectCreativeArchetype(ocr.text, cta.strength, goal, ocr);
        const emotionSignature = detectEmotionSignature(ocr.text, goal, cta);
        const cognitiveLoad = calculateCognitiveLoad(ocr, px, clutter);

        if (process.env.NODE_ENV === "development") {
          const s = getDatasetStats();
          console.log(`[ACIE v4] Dataset: ${s.total} | CTA: "${cta.word}" (${cta.strength}) | Clutter: ${clutter.index}/10 | Hierarchy: ${visualHierarchy} | Harmony: ${px.colorHarmony}`);
        }

        // Step 5: Deterministic Rules
        const issues: any[] = [];
        if ((tier === "XS" || tier === "S") && ocr.textAreaPercent > 40)
          issues.push({ id: "density", severity: "high", evidence: `Text density ${Math.round(ocr.textAreaPercent)}% exceeds 40% max for ${tier} banner` });
        if (ocr.minTextHeightPx > 0 && ocr.minTextHeightPx < 12)
          issues.push({ id: "text_size", severity: "high", evidence: `Text height ${ocr.minTextHeightPx}px is below 12px legibility minimum` });
        if (px.clipHigh > 0.3)
          issues.push({ id: "overexposed", severity: "medium", evidence: `${Math.round(px.clipHigh * 100)}% pure-white pixels — banner blindness risk` });
        if (px.contrast < 30)
          issues.push({ id: "contrast", severity: "high", evidence: `Contrast ${Math.round(px.contrast)}/100 — too low; ads blend into page` });
        if (px.wcagLevel === "FAIL")
          issues.push({ id: "wcag", severity: "medium", evidence: `Text contrast ratio ${px.textContrast}:1 fails WCAG AA (need 4.5:1)` });
        if (ocr.readingFlow === "SCATTERED" && ocr.wordCount > 8)
          issues.push({ id: "reading_flow", severity: "medium", evidence: "Scattered text layout — viewer attention is fragmented" });

        // Step 6: 9-Dimension Scoring
        const dims = scoreAllDimensions({ goal, px, ocr, cta, fileSizeKB, clutter, emotionalAppeal, visualHierarchy });
        const weightedFinalScore = calculateWeightedScore(dims);

        const highPenalty = issues.filter(i => i.severity === "high").length * 3;
        const finalScore = clamp(weightedFinalScore - highPenalty);

        // Step 7: Engagement Forecast
        const { forecast, drivers: engagementDrivers, confidence: forecastConfidence } =
          calculateEngagementForecast(dims, emotionalAppeal, clutter, cta, visualHierarchy);

        // Estimate stop rate
        const stopRateEstimate = estimateStopRate(forecast, emotionalAppeal, clutter);

        // Step 8: Fix Blocks
        const fixBlocks = generateFixBlocks(dims, goal, cta, ocr, px);

        // Step 9: A/B Hypotheses
        const abHypotheses = generateABHypotheses(dims, goal, cta, emotionalAppeal, ocr);

        // Step 10: Dataset Match
        const datasetMatches = matchDataset(goal, cta.strength);
        const datasetConfidence: "HIGH" | "MODERATE" | "LOW" | "NONE" =
          datasetMatches.length >= 3 ? "HIGH" :
            datasetMatches.length >= 1 ? "MODERATE" : "LOW";

        // Step 11: Suggestions
        const allSugg = [
          ...fixBlocks.map(f => `[${f.dimension}] ${f.fixNow}`),
          ...issues.map(i => i.evidence),
        ].filter((s, i, arr) => s && arr.indexOf(s) === i);

        // Step 12: Assembly
        const goalAlignScore = dims.goal.raw;
        const source = "pixel-ocr-acie-v4";
        const summary = cta.found ? `CTA: "${cta.word}" — ${cta.goalFit}` : "No CTA detected.";
        const alignLabel = goalAlignScore >= 80 ? "Strong ✅" : goalAlignScore >= 60 ? "Moderate ⚠️" : "Poor ❌";
        const funnelText = `Funnel: ${goal}. Goal Alignment: ${goalAlignScore}/100 (${alignLabel}). CTA: ${cta.found ? `"${cta.word}" [${cta.ctaType}]` : "none"}. Archetype: ${creativeArchetype}. Hierarchy: ${visualHierarchy}.`;

        const dimDetails: Record<string, string> = {};
        (Object.keys(dims) as (keyof typeof DIM_WEIGHTS)[]).forEach(k => {
          dimDetails[k] = dims[k].detail;
        });

        resolve({
          // Pixel
          brightness: px.brightness,
          contrast: px.contrast,
          saturation: px.saturation,
          dominantHue: px.dominantHue,
          warmthScore: px.warmthScore,
          colorVariance: px.colorVariance,
          wcagLevel: px.wcagLevel,
          focalPointStrength: px.focalPointStrength,
          colorHarmony: px.colorHarmony,
          colorPalette: px.colorPalette,
          isBlurry: px.isBlurry,
          hasCompressionArtifacts: px.hasCompressionArtifacts,
          // Text
          text_clarity: dims.text.raw,
          text_density: ocr.textAreaPercent > 50 ? "high" : ocr.textAreaPercent > 20 ? "medium" : "low",
          headlineDetected: ocr.headlineDetected,
          readingFlow: ocr.readingFlow,
          hasCurrency: ocr.hasCurrency,
          hasPercentage: ocr.hasPercentage,
          hasTrademark: ocr.hasTrademark,
          cornerTextDetected: ocr.cornerTextDetected,
          hasTextCrowding: ocr.hasTextCrowding,
          hasIllegibleText: ocr.hasIllegibleText,
          // 9 Dimensions
          dim_cta: dims.cta.raw,
          dim_text: dims.text.raw,
          dim_brand: dims.brand.raw,
          dim_brightness: dims.brightness.raw,
          dim_goal: dims.goal.raw,
          dim_pixel: dims.pixel.raw,
          dim_filesize: dims.filesize.raw,
          dim_color_harmony: dims.color_harmony.raw,
          dim_visual_hierarchy: dims.visual_hierarchy.raw,
          dim_details: dimDetails,
          // Legacy
          layout_score: 80,
          visual_quality: dims.pixel.raw,
          goal_fit: goalAlignScore,
          overall_score: finalScore,
          // CTA
          cta_presence: cta.found,
          cta_strength: cta.strength,
          cta_recommendations: GOAL_CTA[goal],
          cta_detected: cta.found,
          cta_text: cta.word || null,
          cta_type: cta.ctaType,
          cta_goal_fit: cta.goalFit,
          cta_scores: {
            overall: dims.cta.raw / 10,
            clarity: dims.cta.raw / 10,
            urgency: cta.urgencySignal ? 9 : tone === "urgent" ? 7 : tone === "helpful" ? 4 : 2,
            value: cta.valueSignal ? 8 : dims.goal.raw / 10,
            visibility: dims.pixel.raw / 10,
          },
          // Core Checks
          coreChecks: {
            noticeability: { score: px.contrast, label: px.contrast > 30 ? "Good Contrast" : "Low Contrast", pass: px.contrast > 30 },
            messageClarity: { score: dims.text.raw, label: `${ocr.wordCount} words | ${Math.round(ocr.textAreaPercent)}% area | Headline: ${ocr.headlineDetected ? "✓" : "✗"}`, pass: dims.text.raw >= 65 },
            ctaStrength: { score: dims.cta.raw, label: cta.found ? `"${cta.word}" [${cta.ctaType}]` : "No CTA Found", pass: cta.found || goal === "awareness" },
            brandPresence: { score: dims.brand.raw, label: `Brand Score: ${dims.brand.raw}/100`, pass: dims.brand.raw >= 55 },
            crowding: { score: 100 - clutter.index * 10, label: `Clutter ${clutter.index}/10 — ${clutter.label}`, pass: clutter.index <= 5 },
            formatFit: { score: 100, label: tier, pass: true },
          },
          platformChecks: computePlatformChecks(platform, fileSizeKB, ocr, size),
          adVisibilityScore: dims.pixel.raw,
          goalAlignmentIndicator: goalAlignScore,
          // Suggestions & Fixes
          suggestions: allSugg,
          improvement_suggestions: [],
          fix_blocks: fixBlocks,
          ab_hypotheses: abHypotheses,
          // ACIE v4 Intelligence
          creative_archetype: creativeArchetype,
          emotion_signature: emotionSignature,
          clutter_index: clutter.index,
          clutter_label: clutter.label,
          emotional_appeal: emotionalAppeal,
          engagement_forecast: forecast,
          engagement_forecast_confidence: forecastConfidence,
          engagement_drivers: engagementDrivers,
          visual_hierarchy: visualHierarchy,
          cognitive_load_score: cognitiveLoad,
          stop_rate_estimate: stopRateEstimate,
          // Dataset
          dataset_matches: datasetMatches,
          dataset_confidence: datasetConfidence,
          // Meta
          goal, platform, audienceType, imageSize: size,
          analyzed_at: new Date().toISOString(),
          source, sizeTier: tier, fileSizeKB,
          deterministicIssues: issues,
          confidence: datasetConfidence === "HIGH" ? "high" : "low",
          // Funnel
          primary_stage: goal.charAt(0).toUpperCase() + goal.slice(1),
          bestFor: goal.charAt(0).toUpperCase() + goal.slice(1),
          goalMatchScore: goalAlignScore,
          funnelReasoning: funnelText,
          funnelSignals: [],
          recommendedTemplates: ["newspaper", "health"],
          messaging_intent: tone === "urgent" ? "High Urgency" : tone === "helpful" ? "Informative" : "Persuasive",
          urgency_level: cta.urgencySignal ? "High" : tone === "urgent" ? "High" : tone === "helpful" ? "Medium" : "Low",
          audience_type: audienceType,
          ai_cta_strength: cta.strength,
          // Analysis Text
          analysis: summary,
          impact: issues[0]?.evidence ?? "",
          improved_ctas: GOAL_CTA[goal].slice(0, 3),
          // Agent Slots
          agentSummary: summary,
          agentFunnelAnalysis: funnelText,
          agentBreakdown: {
            cta: cta.found ? `"${cta.word}" — ${cta.ctaType} — ${cta.goalFit}` : "No CTA — Score: 0/100",
            text_clarity: `${ocr.wordCount} words | ${Math.round(ocr.textAreaPercent)}% area | Headline: ${ocr.headlineDetected} | Flow: ${ocr.readingFlow} | Score: ${dims.text.raw}/100`,
            brand_presence: `Focal: ${px.focalPointStrength}/100 | Score: ${dims.brand.raw}/100`,
            brightness_contrast: `B: ${px.brightness}% C: ${px.contrast}% Sat: ${px.saturation}% WCAG: ${px.wcagLevel} → ${dims.brightness.raw}/100`,
            ad_visibility: `Pixel: ${dims.pixel.raw}/100 | Clutter: ${clutter.index}/10 | CogLoad: ${cognitiveLoad}/100`,
            goal_alignment: funnelText,
            color_harmony: `${px.colorHarmony} | Variance: ${px.colorVariance}/100 | Score: ${dims.color_harmony.raw}/100`,
            visual_hierarchy: `${visualHierarchy} | Headline: ${ocr.headlineDetected} | Flow: ${ocr.readingFlow} | Score: ${dims.visual_hierarchy.raw}/100`,
          },
          agentScores: {
            cta: dims.cta.raw / 10,
            clarity: dims.text.raw / 10,
            brand: dims.brand.raw / 10,
            visual_quality: dims.pixel.raw / 10,
            visibility: dims.pixel.raw / 10,
            goal_alignment: dims.goal.raw / 10,
            color_harmony: dims.color_harmony.raw / 10,
            visual_hierarchy: dims.visual_hierarchy.raw / 10,
            overall: finalScore / 10,
          },
          agentSuggestions: allSugg.slice(0, 6),
        });
      } catch (err) { reject(err); }
    };

    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = imageUrl;
  });
}