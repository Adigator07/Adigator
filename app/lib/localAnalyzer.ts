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
 *   7. Engagement Forecast    → LOW / MEDIUM / HIGH from deterministic signal scoring
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
  Platform
} from "./datasetIntelligence";
import { analyzeTextSignals } from "./analyzer/textAnalyzer";
import { detectCTA, type CTACandidate, type CTADetectionResult } from "./analyzer/ctaDetector";
import { analyzeImageSignals } from "./analyzer/imageAnalyzer";
import {
  computeAuctionEligibility,
  computeAttentionCapture,
  computeCTADetail,
  computePerformanceSignals,
  computeFinalCreativeScore,
  computeEngagement,
} from "./analyzer/scoringEngine";
import { computeSignalConfidence } from "./analyzer/confidenceEngine";
import { buildValidationAlerts } from "./analyzer/validator";
import { analyzeGoalAlignment } from "./analyzer/goalAlignment";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Tier = "XS" | "S" | "M" | "L" | "XL" | "Unknown";
export type EmotionalAppeal = "HIGH" | "MEDIUM" | "LOW";
export type ClutterLabel = "CLEAN" | "MODERATE" | "CLUTTERED" | "CHAOTIC";
export type EngagementForecast = "LOW" | "MEDIUM" | "HIGH";
export type CTAGoalFit = "Perfect Match" | "Acceptable" | "Mismatch" | "None";
export type ColorHarmony = "HARMONIOUS" | "ACCEPTABLE" | "DISCORDANT";
export type VisualHierarchy = "STRONG" | "MODERATE" | "WEAK";
export type ReadingFlow = "LINEAR" | "SCATTERED" | "NONE";
export type WCAGLevel = "AAA" | "AA" | "FAIL";

interface ClutterData {
  index: number;
  label: ClutterLabel;
}

interface CtaAnalysis {
  found: boolean;
  word: string;
  strength: string;
  goalMatch: boolean;
  valid: boolean;
  goal: string;
  confidence: string;
  reason: string;
  ctaType: CTAType;
  goalFit: CTAGoalFit;
  urgencySignal: boolean;
  valueSignal: boolean;
}

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
  isLowDefinition: boolean;
  hasCompressionArtifacts: boolean;
  blockinessRatio: number;
  laplacianVariance: number; // sharp > 100, blur < 100
  qualityMessage: string;
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
  ctaCandidates: CTACandidate[];
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

export interface PerformanceImpactInsight {
  issue: string;
  impact: string;
  estimatedEffect: string;
  fix: string;
  expectedOutcome: string;
  severity: "low" | "medium" | "high";
  priority: "High" | "Medium" | "Low";
}

export interface LocalAnalysisResult {
  score: number;
  finalScore: number;
  cta: {
    detected: boolean;
    text: string;
    strength: "low" | "medium" | "high";
    confidence: number;
    visibilityScore: number;
    contrastScore: number;
    positionScore: number;
    urgencyScore: number;
  };
  metrics: {
    clarity: number;
    contrast: number;
    visibility: number;
    brand: number;
  };
  eligibility: {
    score: number;
    issues: string[];
    breakdown: Record<string, number>;
  };
  attention: {
    score: number;
    breakdown: Record<string, number>;
  };
  performance: {
    score: number;
    breakdown: Record<string, number>;
    ctaGoalFit: "good" | "too strong" | "missing" | "weak";
  };
  issues: Array<{ type: "warning" | "error"; message: string }>;
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
  performanceImpact: PerformanceImpactInsight[];
  // ── ACIE v4.0 Intelligence Signals ─────────────────────────
  creative_archetype: string;
  emotion_signature: string;
  clutter_index: number;          // 1–10
  clutter_label: ClutterLabel;
  emotional_appeal: EmotionalAppeal;
  engagement_forecast: EngagementForecast;
  engagement_forecast_confidence: number;  // 0–100
  engagement_drivers: string[];
  engagement: {
    engagementScore: number;
    level: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
  };
  aiInsights: {
    contextSummary: string;
    emotion: string;
    insights: string[];
    improvements: string[];
  } | null;
  visual_hierarchy: VisualHierarchy;
  cognitive_load_score: number;   // 0–100 (lower = easier to process)
  stop_rate_estimate: string;     // e.g. "2–3%"
  // ── Dataset Pattern Match ───────────────────────────────────
  dataset_matches: DatasetMatch[];
  dataset_confidence: "HIGH" | "MODERATE" | "LOW" | "NONE";
  // ── Meta ────────────────────────────────────────────────────
  goal: CampaignGoal;
  platform: Platform;
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
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable; cannot extract real pixel signals.");
  }

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
  let boundaryDeltaSum = 0;
  let boundaryDeltaCount = 0;
  let interiorDeltaSum = 0;
  let interiorDeltaCount = 0;

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
    const pixelIdx = Math.floor(i / 4);
    const pixelCol = pixelIdx % W;

    if (pixelCol > 0) {
      const lL = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
      const leftDelta = Math.abs(l - lL);
      if (pixelCol % 8 === 0) {
        boundaryDeltaSum += leftDelta;
        boundaryDeltaCount++;
      } else {
        interiorDeltaSum += leftDelta;
        interiorDeltaCount++;
      }

      if (pixelRow > 0) {
        const tL = 0.299 * data[i - W * 4] + 0.587 * data[i - W * 4 + 1] + 0.114 * data[i - W * 4 + 2];
        const topDelta = Math.abs(l - tL);
        if (pixelRow % 8 === 0) {
          boundaryDeltaSum += topDelta;
          boundaryDeltaCount++;
        } else {
          interiorDeltaSum += topDelta;
          interiorDeltaCount++;
        }

        if (leftDelta > 20 || topDelta > 20) {
          edges++;
          if (pixelRow < H / 2) edgesTopHalf++;
          else edgesBottomHalf++;
        }
      }
    }

    // Sample colors for palette
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
      const lap = Math.abs(pT + pB + pL + pR - 4 * pC);
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      validLaplacianPixels++;
    }
  }

  const laplacianMean = validLaplacianPixels > 0 ? laplacianSum / validLaplacianPixels : 0;
  const laplacianVariance = validLaplacianPixels > 0
    ? (laplacianSqSum / validLaplacianPixels) - (laplacianMean * laplacianMean)
    : 0;
  const contrastScore = ((maxL - minL) / 255) * 100;
  const edgeDensity = edges / pixels;
  const boundaryDeltaAvg = boundaryDeltaCount > 0 ? boundaryDeltaSum / boundaryDeltaCount : 0;
  const interiorDeltaAvg = interiorDeltaCount > 0 ? interiorDeltaSum / interiorDeltaCount : 1;
  const blockinessRatio = boundaryDeltaAvg / Math.max(1, interiorDeltaAvg);
  const blurThreshold = edgeDensity < 0.025 ? 220 : edgeDensity < 0.06 ? 165 : 115;
  const isSoftBlur = laplacianVariance > 0 && laplacianVariance < blurThreshold;
  const isLowDefinition = !isSoftBlur && (
    (blockinessRatio > 1.45 && laplacianVariance < 260) ||
    (laplacianVariance < 150 && contrastScore < 45 && edgeDensity < 0.04)
  );
  const isBlurry = isSoftBlur || isLowDefinition;

  // Artifact detection: block-boundary jumps + weak contrast often indicates JPEG re-compression.
  const hasCompressionArtifacts = !isBlurry && (
    (blockinessRatio > 1.32 && contrastScore < 60) ||
    (edgeDensity > 0.35 && contrastScore < 40)
  );
  const qualityMessage = isLowDefinition
    ? "Low-definition or pixelated image detected"
    : isSoftBlur
      ? "Blur detected"
      : hasCompressionArtifacts
        ? "Compression artifacts detected"
        : "Image quality stable";

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
    edgeDensity,
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
    isLowDefinition,
    hasCompressionArtifacts,
    blockinessRatio: Number(blockinessRatio.toFixed(2)),
    laplacianVariance: Math.round(laplacianVariance),
    qualityMessage,
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

function normalizeOCRCandidateText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sampleRectStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): { mean: number; variance: number; saturation: number; pixels: number } {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const safeWidth = Math.max(0, Math.min(ctx.canvas.width - left, Math.floor(width)));
  const safeHeight = Math.max(0, Math.min(ctx.canvas.height - top, Math.floor(height)));

  if (safeWidth <= 0 || safeHeight <= 0) {
    return { mean: 0, variance: 0, saturation: 0, pixels: 0 };
  }

  const data = ctx.getImageData(left, top, safeWidth, safeHeight).data;
  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let saturationSum = 0;
  let pixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const delta = max - min;
    const lightness = (max + min) / 2;
    const saturation = lightness > 0 && lightness < 1 ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
    luminanceSum += luminance;
    luminanceSqSum += luminance * luminance;
    saturationSum += saturation;
    pixels++;
  }

  const mean = pixels > 0 ? luminanceSum / pixels : 0;
  return {
    mean,
    variance: pixels > 0 ? luminanceSqSum / pixels - mean * mean : 0,
    saturation: pixels > 0 ? saturationSum / pixels : 0,
    pixels,
  };
}

function combineRectStats(stats: Array<{ mean: number; variance: number; saturation: number; pixels: number }>) {
  const totalPixels = stats.reduce((sum, stat) => sum + stat.pixels, 0);
  if (totalPixels <= 0) {
    return { mean: 0, variance: 0, saturation: 0 };
  }

  return {
    mean: stats.reduce((sum, stat) => sum + stat.mean * stat.pixels, 0) / totalPixels,
    variance: stats.reduce((sum, stat) => sum + stat.variance * stat.pixels, 0) / totalPixels,
    saturation: stats.reduce((sum, stat) => sum + stat.saturation * stat.pixels, 0) / totalPixels,
  };
}

function scoreButtonRegion(
  ctx: CanvasRenderingContext2D,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): { buttonScore: number; visibilityScore: number } {
  const width = bbox.x1 - bbox.x0;
  const height = bbox.y1 - bbox.y0;
  if (width <= 0 || height <= 0) {
    return { buttonScore: 0, visibilityScore: 0.25 };
  }

  const padX = Math.max(4, Math.round(width * 0.08));
  const padY = Math.max(4, Math.round(height * 0.35));
  const inside = sampleRectStats(ctx, bbox.x0 - padX, bbox.y0 - padY, width + padX * 2, height + padY * 2);
  const outside = combineRectStats([
    sampleRectStats(ctx, bbox.x0 - padX, bbox.y0 - padY * 2, width + padX * 2, padY),
    sampleRectStats(ctx, bbox.x0 - padX, bbox.y1 + padY, width + padX * 2, padY),
    sampleRectStats(ctx, bbox.x0 - padX * 2, bbox.y0, padX, height),
    sampleRectStats(ctx, bbox.x1 + padX, bbox.y0, padX, height),
  ]);

  const contrastDelta = Math.abs(inside.mean - outside.mean);
  const aspectRatio = width / Math.max(height, 1);
  const uniformityScore = inside.variance < 850 ? 1 : inside.variance < 1700 ? 0.7 : inside.variance < 2600 ? 0.45 : 0.15;
  const contrastScore = contrastDelta > 28 ? 1 : contrastDelta > 18 ? 0.75 : contrastDelta > 12 ? 0.5 : 0.2;
  const saturationScore = inside.saturation > outside.saturation + 0.08 ? 0.9 : inside.saturation > 0.18 ? 0.65 : 0.35;
  const shapeScore = aspectRatio > 1.8 ? 1 : aspectRatio > 1.35 ? 0.7 : 0.3;
  const buttonScore = Math.max(0, Math.min(1, uniformityScore * 0.35 + contrastScore * 0.3 + saturationScore * 0.15 + shapeScore * 0.2));

  const textSizeScore = height < 10 ? 0.25 : height < 14 ? 0.45 : height < 18 ? 0.65 : 0.85;
  const visibilityScore = Math.max(0, Math.min(1, textSizeScore * 0.75 + buttonScore * 0.25));

  return { buttonScore, visibilityScore };
}

function buildCTACandidates(
  ctx: CanvasRenderingContext2D,
  words: any[],
  width: number,
  height: number,
): CTACandidate[] {
  const mappedWords = words
    .map((word) => {
      const text = String(word.text ?? "").trim();
      const bbox = word.bbox;
      if (!text || !bbox) return null;

      return {
        text,
        x0: bbox.x0,
        y0: bbox.y0,
        x1: bbox.x1,
        y1: bbox.y1,
        centerY: (bbox.y0 + bbox.y1) / 2,
        height: bbox.y1 - bbox.y0,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left!.centerY - right!.centerY || left!.x0 - right!.x0) as Array<{
      text: string;
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      centerY: number;
      height: number;
    }>;

  if (mappedWords.length === 0) {
    return [];
  }

  const groups: typeof mappedWords[] = [];
  for (const word of mappedWords) {
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup) {
      groups.push([word]);
      continue;
    }

    const avgCenterY = lastGroup.reduce((sum, item) => sum + item.centerY, 0) / lastGroup.length;
    const avgHeight = lastGroup.reduce((sum, item) => sum + item.height, 0) / lastGroup.length;
    if (Math.abs(word.centerY - avgCenterY) <= Math.max(10, avgHeight * 0.75)) {
      lastGroup.push(word);
    } else {
      groups.push([word]);
    }
  }

  return groups
    .map((group) => group.sort((left, right) => left.x0 - right.x0))
    .map((group) => {
      const rawText = group.map((word) => word.text).join(" ").trim();
      const x0 = Math.min(...group.map((word) => word.x0));
      const y0 = Math.min(...group.map((word) => word.y0));
      const x1 = Math.max(...group.map((word) => word.x1));
      const y1 = Math.max(...group.map((word) => word.y1));
      const textHeight = group.reduce((sum, word) => sum + word.height, 0) / Math.max(group.length, 1);
      const { buttonScore, visibilityScore } = scoreButtonRegion(ctx, { x0, y0, x1, y1 });

      return {
        rawText,
        normalizedText: normalizeOCRCandidateText(rawText),
        centerX: (x0 + x1) / 2,
        centerY: (y0 + y1) / 2,
        relativeCenterX: width > 0 ? ((x0 + x1) / 2) / width : 0.5,
        relativeCenterY: height > 0 ? ((y0 + y1) / 2) / height : 0.5,
        textHeight,
        visibilityScore,
        buttonScore,
      } satisfies CTACandidate;
    })
    .filter((candidate) => candidate.rawText.length > 1);
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

    // Compute lineCount from raw OCR text BEFORE whitespace collapse
    const rawLineCount = (best.text ?? "").split(/\n/).filter(l => l.trim().length > 0).length;

    const text = (best.text ?? "")
      .replace(/[^\w\s%.,!?'"\-$€£#@]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`[ACIE v4 OCR] "${text}"`);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = w;
    previewCanvas.height = h;
    const previewCtx = previewCanvas.getContext("2d");
    if (!previewCtx) {
      throw new Error("Canvas 2D context unavailable for CTA candidate analysis.");
    }
    previewCtx.drawImage(img, 0, 0, w, h);

    let totalArea = 0, minH = 9999, maxH = 0;
    const wordBboxes: Array<{ top: number; left: number }> = [];
    const ocrWords = ((best as any).words || []) as any[];

    ocrWords.forEach((word: any) => {
      const bw = word.bbox.x1 - word.bbox.x0;
      const bh = word.bbox.y1 - word.bbox.y0;
      totalArea += bw * bh;
      if (bh > 5 && bh < minH) minH = bh;
      if (bh > maxH) maxH = bh;
      wordBboxes.push({ top: word.bbox.y0, left: word.bbox.x0 });
    });

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Use rawLineCount (from raw OCR text before collapse) for accurate line detection
    const lineCount = rawLineCount > 0 ? rawLineCount : Math.max(1, Math.ceil(wordCount / 6));
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
    const allWords = text.split(/\s+/).filter(Boolean);
    const avgWordLen = allWords.length > 0
      ? allWords.reduce((s, w) => s + w.length, 0) / allWords.length
      : 0;

    // Headline detection: max text height > 2.5× min text height
    const headlineDetected = maxH > minH * 2.5 && maxH > 20;

    // Reading flow: check horizontal spread of word positions.
    // High left-position variance relative to image width indicates scattered layout.
    const readingFlow: ReadingFlow = wordBboxes.length < 3 ? "NONE" :
      (() => {
        const lefts = wordBboxes.map(wx => wx.left);
        const meanLeft = lefts.reduce((s, v) => s + v, 0) / lefts.length;
        const stdev = Math.sqrt(lefts.reduce((s, v) => s + Math.pow(v - meanLeft, 2), 0) / lefts.length);
        // Scattered if standard deviation of left positions exceeds 25% of image width
        return stdev > w * 0.25 ? "SCATTERED" : "LINEAR";
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

    const ctaCandidates = buildCTACandidates(previewCtx, ocrWords, w, h);

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
      ctaCandidates,
    };
  } catch (err) {
    console.error("[ACIE v4 OCR] Failed:", err);
    return {
      text: "", textLength: 0, textAreaPercent: 0, minTextHeightPx: 0,
      maxTextHeightPx: 0, ocrConfidence: 0, wordCount: 0, lineCount: 0,
      headlineDetected: false, readingFlow: "NONE", sentenceCount: 0,
      avgWordLength: 0, hasNumbers: false, hasCurrency: false, hasPercentage: false,
      hasTrademark: false, cornerTextDetected: false, hasTextCrowding: false, hasIllegibleText: false, ctaCandidates: [],
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

function analyzeCTA(fullText: string, campaignGoal: CampaignGoal, detectedCTA?: CTADetectionResult): CtaAnalysis {
  const detectedTypeFromSignals: CTAType = detectedCTA?.detected
    ? detectedCTA.strength === "high"
      ? "Hard"
      : detectedCTA.strength === "medium"
        ? "Medium"
        : "Soft"
    : "None";
  const { phrase: extractedPhrase, type: extractedType } = extractCTAPhrase(fullText);
  const ctaText = detectedCTA?.detected ? detectedCTA.text : extractedPhrase;
  const detectedType = detectedCTA?.detected ? detectedTypeFromSignals : extractedType;

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

function calculateClutterIndex(ocr: OcrData, px: PixelData): ClutterData {
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

function estimateStopRate(level: EngagementForecast): string {
  if (level === "HIGH") return "1–2%";
  if (level === "MEDIUM") return "2–4%";
  return "4–8%";
}

function buildPerformanceImpactInsights(input: {
  contrast: number;
  isBlurry: boolean;
  qualityMessage?: string;
  ctaDetected: boolean;
  ctaGoalFit: "good" | "too strong" | "missing" | "weak";
  goalAlignmentScore: number;
  goal: CampaignGoal;
}): PerformanceImpactInsight[] {
  const impacts: Array<{
    issue: string;
    impact: string;
    fix: string;
    expectedOutcome: string;
    severity: "low" | "medium" | "high";
    baseCtr: [number, number];
    baseEng: [number, number];
  }> = [];

  const goalWeight = input.goal === "conversion" ? 1.15 : input.goal === "consideration" ? 1 : 0.85;

  if (input.contrast < 40) {
    const severity: "low" | "medium" | "high" = input.contrast < 30 ? "high" : input.contrast < 35 ? "medium" : "low";
    impacts.push({
      issue: `Low contrast (${Math.round(input.contrast)}/100)`,
      impact: "Ad readability is weak in auction environments, reducing scroll-stop and click intent.",
      fix: "Increase foreground/background contrast and apply a controlled overlay behind copy.",
      expectedOutcome: "Higher first-glance readability and stronger top-of-funnel engagement quality.",
      severity,
      baseCtr: severity === "high" ? [20, 34] : severity === "medium" ? [14, 24] : [10, 16],
      baseEng: severity === "high" ? [16, 28] : severity === "medium" ? [12, 20] : [10, 14],
    });
  }

  if (input.isBlurry) {
    const severity: "low" | "medium" | "high" = "high";
    const lowDefinition = input.qualityMessage?.toLowerCase().includes("pixelated") || input.qualityMessage?.toLowerCase().includes("low-definition");
    impacts.push({
      issue: lowDefinition ? "Low-definition asset detected" : "Blur detected",
      impact: lowDefinition
        ? "Visual quality looks under-resolved, reducing trust and making the creative feel cheap in-feed."
        : "Visual trust and product credibility drop, suppressing click-through behavior.",
      fix: lowDefinition
        ? "Replace the source with a higher-resolution asset and avoid scaling up undersized imagery in the final creative."
        : "Swap to a sharper master asset and export with higher effective resolution.",
      expectedOutcome: lowDefinition
        ? "Cleaner rendering, better perceived production quality, and stronger stop-rate on premium placements."
        : "Stronger brand trust signal and improved click propensity on quality-sensitive placements.",
      severity,
      baseCtr: [18, 30],
      baseEng: [14, 24],
    });
  }

  if (!input.ctaDetected || input.ctaGoalFit === "weak") {
    const severity: "low" | "medium" | "high" = input.goal === "conversion" ? "high" : "medium";
    impacts.push({
      issue: !input.ctaDetected ? "CTA missing" : "CTA weak for campaign goal",
      impact: "Action intent is under-communicated, causing conversion funnel leakage.",
      fix: input.goal === "conversion"
        ? "Use a clear high-intent CTA with strong urgency and visual prominence."
        : "Strengthen CTA copy and placement to reduce decision friction.",
      expectedOutcome: "Clearer user next-step behavior and improved downstream conversion efficiency.",
      severity,
      baseCtr: severity === "high" ? [22, 40] : [12, 24],
      baseEng: severity === "high" ? [12, 22] : [10, 16],
    });
  }

  if (input.goalAlignmentScore < 60) {
    const severity: "low" | "medium" | "high" = input.goalAlignmentScore < 45 ? "high" : input.goalAlignmentScore < 52 ? "medium" : "low";
    impacts.push({
      issue: `Goal misalignment (${Math.round(input.goalAlignmentScore)}/100)`,
      impact: "Media spend reaches users with mismatched stage messaging, reducing impression efficiency.",
      fix: `Rebuild headline, offer, and CTA for ${input.goal} intent before scaling budget.`,
      expectedOutcome: "Better stage-message fit and higher effective value from paid impressions.",
      severity,
      baseCtr: severity === "high" ? [18, 30] : severity === "medium" ? [12, 20] : [10, 14],
      baseEng: severity === "high" ? [12, 22] : severity === "medium" ? [10, 16] : [10, 12],
    });
  }

  // Prevent overstacking: cap aggregate modeled downside.
  let ctrBudget = 45;
  let engBudget = 35;

  const mapped = impacts.map((p) => {
    const ctrLo = Math.round(p.baseCtr[0] * goalWeight);
    const ctrHi = Math.round(p.baseCtr[1] * goalWeight);
    const engLo = Math.round(p.baseEng[0] * (input.goal === "awareness" ? 1.1 : 1));
    const engHi = Math.round(p.baseEng[1] * (input.goal === "awareness" ? 1.1 : 1));

    const allowedCtrLo = Math.min(ctrLo, Math.max(0, ctrBudget));
    const allowedCtrHi = Math.min(ctrHi, Math.max(allowedCtrLo, ctrBudget));
    const allowedEngLo = Math.min(engLo, Math.max(0, engBudget));
    const allowedEngHi = Math.min(engHi, Math.max(allowedEngLo, engBudget));

    ctrBudget = Math.max(0, ctrBudget - allowedCtrLo);
    engBudget = Math.max(0, engBudget - allowedEngLo);

    const priority: "High" | "Medium" | "Low" = p.severity === "high" ? "High" : p.severity === "medium" ? "Medium" : "Low";

    return {
      issue: p.issue,
      impact: p.impact,
      estimatedEffect: `Estimated effect: CTR -${allowedCtrLo}% to -${allowedCtrHi}%, Engagement -${allowedEngLo}% to -${allowedEngHi}%`,
      fix: p.fix,
      expectedOutcome: p.expectedOutcome,
      severity: p.severity,
      priority,
    } as PerformanceImpactInsight;
  });

  return mapped.sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.priority] - order[b.priority];
  });
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
  goalAlignmentScore: number;
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

  // D5 — Goal Alignment (0–100): score passed in from analyzeGoalAlignment (single source of truth)
  const goalRaw = inp.goalAlignmentScore;
  const goalDetail = `CTA fit: ${cta.goalFit} | Has urgency: ${cta.urgencySignal} | Has price: ${ocr.hasCurrency} | Goal: ${goal}`;

  // D6 — Pixel Quality (0–100)
  let pixelRaw = 82, pixelDetail = "";
  if (px.isBlurry) pixelRaw -= px.isLowDefinition ? 34 : 40;
  if (px.hasCompressionArtifacts) pixelRaw -= 25;
  if (px.contrast < 20) pixelRaw -= 28;
  else if (px.contrast < 35) pixelRaw -= 14;
  if (px.clipHigh > 0.45) pixelRaw -= 18;
  else if (px.clipHigh > 0.25) pixelRaw -= 8;
  if (px.edgeDensity < 0.02) pixelRaw -= 12;
  if (ocr.ocrConfidence > 0 && ocr.ocrConfidence < 45) pixelRaw -= 12;
  pixelRaw = clamp(pixelRaw);
  pixelDetail = `Quality: ${px.isLowDefinition ? "LOW-DEFINITION" : px.isBlurry ? "BLURRY" : "SHARP"} | Sharpness: ${px.laplacianVariance} | Blockiness: ${px.blockinessRatio}x | Artifacts: ${px.hasCompressionArtifacts ? "YES" : "NO"} | OCR: ${ocr.ocrConfidence.toFixed(0)}%`;

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

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── 9. Engagement confidence helper ───────────────────────────────────────────

function calculateEngagementConfidence(engagementScore: number, reasons: string[]): number {
  // Confidence grows with stronger separation from neutral baseline and number of concrete reasons.
  const separation = Math.abs(engagementScore - 50) * 2;
  const reasonCoverage = Math.min(30, reasons.length * 6);
  return clamp(separation + reasonCoverage, 0, 100);
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
  // REPLACE the entire D6 block:
  if (dims.pixel.raw < 75) {
    const blurLevel = px.laplacianVariance < 30 ? "severely blurry"
      : px.laplacianVariance < 60 ? "noticeably blurry"
        : "slightly soft";

    const problem = px.isLowDefinition
      ? `Image looks low-definition or pixelated (sharpness: ${px.laplacianVariance}, blockiness: ${px.blockinessRatio}x). Under-resolved assets reduce perceived product quality before users read the copy.`
      : px.isBlurry
      ? `Image is ${blurLevel} (sharpness score: ${px.laplacianVariance} — sharp images score 300+). Out-of-focus visuals reduce CTR by up to 30%.`
      : px.hasCompressionArtifacts
        ? `Severe JPEG compression artifacts detected. Blocky noise visible at normal viewing distance (edge density: ${Math.round(px.edgeDensity * 100)}%, contrast: ${px.contrast}/100).`
        : px.contrast < 30
          ? `Very low contrast (${px.contrast}/100) — the image blends into the page background. WCAG level: ${px.wcagLevel}.`
          : `Pixel quality issues: contrast ${px.contrast}/100, OCR confidence ${ocr.ocrConfidence.toFixed(0)}%.`;

    const fixNow = px.isLowDefinition
      ? `Replace the hero with a higher-resolution source file and export at the final slot size or 2x. Avoid stretching small assets to fill the canvas.`
      : px.isBlurry
      ? `Replace with a sharper image. If you must use this one, apply Unsharp Mask (Amount: 80%, Radius: 1px, Threshold: 2) in Photoshop or Affinity Photo.`
      : px.hasCompressionArtifacts
        ? `Re-export as PNG-24 or WebP at ≥ 85% quality. Avoid saving JPEG over JPEG — each save multiplies artifact blocks.`
        : px.contrast < 30
          ? `Add a semi-transparent dark overlay (rgba 0,0,0,0.3) behind any text. Boost image exposure by +25–35% in editing.`
          : `Re-export at 2× display resolution (e.g. 600×500 for a 300×250 slot) as PNG with minimal compression.`;

    const fixDeep = px.isLowDefinition
      ? `Go back to the original photography or design file. If the source itself is small, reshoot, re-render, or switch to vector artwork so the creative stays crisp at delivery size.`
      : px.isBlurry
      ? `Source a higher-resolution original image. For product shots, reshoot with proper depth of field. For lifestyle, use a stock library with sharpness ratings. Consider using vector/illustration art which never blurs.`
      : px.hasCompressionArtifacts
        ? `Audit your export pipeline — find where the JPEG re-compression is happening. If the original source file is also compressed, go back to the raw asset. Switch your banner delivery format to WebP for 30–50% smaller files at identical quality.`
        : `Reshoot or resource the hero image. Use CSS/SVG text overlays instead of baking text into raster images — they stay crisp at all resolutions.`;

    fixes.push({
      dimension: "Pixel Quality",
      score: dims.pixel.raw,
      severity: severity(dims.pixel.raw),
      problem,
      impact: px.isLowDefinition
        ? "Low-definition creatives look cheap at first glance and depress both trust and click intent, especially on premium inventory."
        : px.isBlurry
        ? "Blurry creatives are the #1 reason for immediate scroll-past. Platforms (Meta, DV360) deprioritise low-sharpness creatives in delivery auctions."
        : px.hasCompressionArtifacts
          ? "Artifact-heavy images signal low production quality and reduce brand trust scores by ~20% in user testing."
          : "Low contrast triggers banner blindness — the creative literally disappears against light-coloured page backgrounds.",
      fixNow,
      fixDeep,
      timeEstimate: px.isLowDefinition || px.isBlurry ? "15–30 min (asset swap)" : px.hasCompressionArtifacts ? "5–10 min (re-export)" : "30–60 min",
      datasetNote: px.isLowDefinition
        ? "Dataset analysis: under-resolved creatives consistently lose trust against crisp controls, especially in consideration and conversion campaigns."
        : px.isBlurry
        ? "Dataset analysis: blurry creatives average 0.4% CTR vs 1.8% CTR for sharp equivalents in the same campaign."
        : px.hasCompressionArtifacts
          ? "Platform rejection rates spike significantly for creatives with visible JPEG artifact blocking."
          : "Creatives with contrast > 50 consistently outperform dark or washed-out variants by 25–40%.",
      abTestIdea: px.isLowDefinition
        ? `A/B: current low-definition asset vs higher-resolution replacement — trust and CTR lift expected: 20–40%`
        : px.isBlurry
        ? `A/B: current blurry hero vs sharp replacement — CTR delta expected: 30–60%`
        : px.hasCompressionArtifacts
          ? `A/B: JPEG export vs WebP/PNG re-export — quality perception lift: 15–25%`
          : `A/B: current vs +30% brightness + dark text shadow — noticeability lift: 15–25%`,
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
      learning: match.label_notes || `Similar ${goal} creative with ${ctaStrength} CTA from dataset.`,
    }];
  } catch {
    return [];
  }
}

function computePlatformChecks(
  platform: Platform,
  fileSizeKB: number,
  ocr: OcrData,
  size: string,
  px: PixelData,
  clutter: ClutterData,
  visualHierarchy: string,
  cta: CtaAnalysis,
  ctaScore: number,
  emotionalAppeal: string,
  cognitiveLoad: number
): Record<string, any> {
  const standardProgrammatic = [
    "300x250", "336x280", "728x90", "970x90", "970x250", "160x600", "300x600", "300x1050", "468x60", "234x60", "120x600", "120x240", "250x250", "200x200", "180x150",
    "320x50", "320x100", "320x480", "480x320", "360x640", "375x667", "414x736"
  ];
  const isProgrammaticSize = standardProgrammatic.includes(size);

  const desktop = {
    layoutBalance: { score: clamp(100 - clutter.index * 10), pass: clutter.index <= 5 },
    visualHierarchy: { score: visualHierarchy === "STRONG" ? 100 : visualHierarchy === "MODERATE" ? 70 : 40, pass: visualHierarchy !== "WEAK" },
    contentStructure: { score: clamp(100 - (ocr.wordCount > 15 ? 30 : 0) - (ocr.textAreaPercent > 40 ? 40 : 0)), pass: ocr.textAreaPercent <= 40 },
    placementBlend: { score: clamp(px.contrast > 40 ? 100 : 50), pass: px.contrast > 30 },
  };

  const mobile = {
    readability: { score: ocr.minTextHeightPx >= 14 ? 100 : ocr.minTextHeightPx >= 10 ? 60 : 30, pass: ocr.minTextHeightPx >= 12 },
    textDensity: { score: clamp(100 - ocr.textAreaPercent * 2), pass: ocr.textAreaPercent <= 30 },
    ctaSize: { score: ctaScore >= 70 ? 100 : ctaScore >= 40 ? 70 : 40, pass: cta.found },
    attentionGrab: { score: emotionalAppeal === "HIGH" ? 100 : emotionalAppeal === "MEDIUM" ? 70 : 40, pass: emotionalAppeal !== "LOW" },
  };

  return { desktop, mobile, isProgrammaticSize, fileSizeKB };
}

// ── 13. Main Analysis Engine ───────────────────────────────────────────────────

export async function analyzeCreativeLocal(
  imageUrl: string,
  goal: CampaignGoal,
  platform: Platform = "programmatic",
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
        const textSignals = analyzeTextSignals({
          text: ocr.text,
          ocrConfidence: ocr.ocrConfidence,
          wordCount: ocr.wordCount,
          lineCount: ocr.lineCount,
          textAreaPercent: ocr.textAreaPercent,
          minTextHeightPx: ocr.minTextHeightPx,
        });
        const realCTA = detectCTA({
          normalizedText: textSignals.normalizedText,
          candidates: ocr.ctaCandidates,
          minTextHeightPx: ocr.minTextHeightPx,
          maxTextHeightPx: ocr.maxTextHeightPx,
        });
        const cta = analyzeCTA(ocr.text, goal, realCTA);
        const ctaStrengthFromReal =
          realCTA.strength === "high" ? "hard" : realCTA.strength === "medium" ? "medium" : "soft";
        cta.found = realCTA.detected;
        cta.word = realCTA.text;
        cta.strength = realCTA.detected ? ctaStrengthFromReal : "none";
        cta.confidence = `${realCTA.confidence}%`;
        cta.ctaType = realCTA.strength === "high" ? "Hard" : realCTA.strength === "medium" ? "Medium" : realCTA.detected ? "Soft" : "None";

        const imageSignals = analyzeImageSignals({
          brightness: px.brightness,
          contrast: px.contrast,
          isBlurry: px.isBlurry,
          laplacianVariance: px.laplacianVariance,
          edgeDensity: px.edgeDensity,
        });

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
        if (px.isBlurry)
          issues.push({
            id: "blur",
            severity: "high",
            evidence: px.isLowDefinition
              ? `Image appears low-definition or pixelated (sharpness: ${px.laplacianVariance}, blockiness: ${px.blockinessRatio}x). Under-resolved creatives lose trust fast in feed.`
              : `Image is blurry (sharpness: ${px.laplacianVariance} — sharp images score 300+). Blurry creatives are scroll-past magnets.`,
          });

        if (px.hasCompressionArtifacts)
          issues.push({
            id: "artifacts",
            severity: "medium",
            evidence: `JPEG compression artifacts detected — re-export as PNG or WebP at ≥ 85% quality.`,
          });

        // Step 6: Goal Alignment (single source of truth — computed before 9-dimension scoring)
        const emotionalLevel: "Low" | "Medium" | "High" =
          emotionalAppeal === "HIGH" ? "High" : emotionalAppeal === "MEDIUM" ? "Medium" : "Low";

        const goalAlignment = analyzeGoalAlignment({
          goal,
          cta: {
            detected: realCTA.detected,
            strength: realCTA.strength,
          },
          emotionalLevel,
          textLength: ocr.wordCount,
          clarityScore: textSignals.clarity,
          extractedText: textSignals.normalizedText,
        });

        const supportedSizes = [
          ...(PLATFORM_SIZES[platform]?.desktop ?? []),
          ...(PLATFORM_SIZES[platform]?.mobile ?? []),
        ];

        // Step 7: Three-layer scoring architecture
        const eligibility = computeAuctionEligibility({
          fileSizeKB,
          formatValid: supportedSizes.includes(size),
          isBlurry: imageSignals.isBlurry,
          loadReady: fileSizeKB <= 180,
        });

        const layoutBalanceScore = visualHierarchy === "STRONG" ? 90 : visualHierarchy === "MODERATE" ? 68 : 42;
        const clutterScore = clamp(100 - clutter.index * 10);
        const attention = computeAttentionCapture({
          contrastScore: imageSignals.contrast,
          clarityScore: textSignals.clarity,
          clutterScore,
          blurScore: px.isBlurry ? 85 : 15,
          focalPointScore: px.focalPointStrength,
          layoutBalanceScore,
        });

        const brandPresenceScore = clamp(
          (ocr.cornerTextDetected ? 60 : 38)
          + (ocr.hasTrademark ? 18 : 0)
          + (px.focalPointStrength > 50 ? 14 : px.focalPointStrength > 30 ? 8 : 0),
        );

        const ctaDetail = computeCTADetail({
          detected: realCTA.detected,
          strength: realCTA.strength,
          visibilityScore: imageSignals.visibility,
          contrastScore: imageSignals.contrast,
          positionScore: visualHierarchy === "STRONG" ? 82 : visualHierarchy === "MODERATE" ? 64 : 42,
          urgencyScore: cta.urgencySignal ? 88 : /\b(now|today|limited|hurry|last chance)\b/i.test(textSignals.rawText) ? 72 : 35,
        });

        const performance = computePerformanceSignals({
          goal,
          cta: ctaDetail,
          clarityScore: textSignals.clarity,
          brandScore: brandPresenceScore,
          goalAlignmentScore: goalAlignment.alignmentScore,
        });

        const performanceImpact = buildPerformanceImpactInsights({
          contrast: imageSignals.contrast,
          isBlurry: imageSignals.isBlurry,
          qualityMessage: px.qualityMessage,
          ctaDetected: realCTA.detected,
          ctaGoalFit: performance.ctaGoalFit,
          goalAlignmentScore: goalAlignment.alignmentScore,
          goal,
        });

        const finalScore = computeFinalCreativeScore(eligibility.score, attention.score, performance.score);

        // Keep detailed dimensions for fix blocks and deep diagnostics.
        const dims = scoreAllDimensions({ goal, px, ocr, cta, fileSizeKB, clutter, emotionalAppeal, visualHierarchy, goalAlignmentScore: goalAlignment.alignmentScore });

        // Step 8: Engagement derived from attention + performance + goal alignment
        const engagementCore = computeEngagement({
          attentionScore: attention.score,
          performanceScore: performance.score,
          goalAlignmentScore: goalAlignment.alignmentScore,
          goal,
          ctaDetected: realCTA.detected,
          isBlurry: imageSignals.isBlurry,
        });
        const engagement = {
          engagementScore: engagementCore.score,
          level: engagementCore.level,
          reasons: [
            ...engagementCore.reasons,
            ...performanceImpact.slice(0, 3).map((p) => `${p.issue} (${p.priority} priority)`),
          ],
        };
        const forecast = engagement.level;
        const engagementDrivers = engagement.reasons;

        const signalConfidence = computeSignalConfidence({
          ctaDetected: realCTA.detected,
          textClarityGood: textSignals.clarity >= 60,
          imageQualityGood: imageSignals.imageQuality >= 55,
          contrastGood: imageSignals.hasGoodContrast,
          layoutGood: visualHierarchy !== "WEAK" && clutter.index <= 6,
        });
        const engagementConfidence = calculateEngagementConfidence(engagement.engagementScore, engagement.reasons);

        // Estimate stop rate
        const stopRateEstimate = estimateStopRate(forecast);

        // Step 8: Fix Blocks
        const fixBlocks = generateFixBlocks(dims, goal, cta, ocr, px).map((fix) => {
          const insight = performanceImpact.find((p) => {
            const issue = p.issue.toLowerCase();
            const dim = fix.dimension.toLowerCase();
            if (dim.includes("cta")) return issue.includes("cta");
            if (dim.includes("brightness") || dim.includes("pixel")) return issue.includes("contrast") || issue.includes("blur") || issue.includes("low-definition");
            if (dim.includes("goal")) return issue.includes("goal misalignment");
            return false;
          });

          if (!insight) return fix;
          return {
            ...fix,
            impact: `${fix.impact} ${insight.estimatedEffect}`,
          };
        });

        // Step 9: A/B Hypotheses
        const abHypotheses = generateABHypotheses(dims, goal, cta, emotionalAppeal, ocr);

        // Step 10: Dataset Match
        const datasetMatches = matchDataset(goal, cta.strength);
        const datasetConfidence: "HIGH" | "MODERATE" | "LOW" | "NONE" =
          datasetMatches.length >= 3 ? "HIGH" :
            datasetMatches.length >= 1 ? "MODERATE" : "LOW";

        // Step 11: Suggestions
        const allSugg = [
          `Eligibility score ${eligibility.score}: ${eligibility.issues?.length ? eligibility.issues[0] : "Auction checks are stable"}`,
          `Attention score ${attention.score}: contrast ${Math.round(imageSignals.contrast)}, clarity ${Math.round(textSignals.clarity)}, clutter ${Math.round(clutterScore)}, quality risk ${px.isBlurry ? px.qualityMessage.toLowerCase() : "low"}`,
          `Performance score ${performance.score}: CTA ${Math.round(performance.breakdown?.cta ?? 0)}, goal alignment ${Math.round(goalAlignment.alignmentScore)}, brand ${Math.round(brandPresenceScore)}`,
          ...performanceImpact.map((p) => `${p.issue} -> ${p.estimatedEffect}. Fix: ${p.fix}`),
          ...fixBlocks.map(f => `[${f.dimension}] ${f.fixNow}`),
          ...issues.map(i => i.evidence),
        ].filter((s, i, arr) => s && arr.indexOf(s) === i);

        const validationAlerts = buildValidationAlerts({
          fileSizeKB,
          size,
          supportedSizes,
          isBlurry: imageSignals.isBlurry,
          contrast: imageSignals.contrast,
        });

        // Step 12: Assembly
        const goalAlignScore = goalAlignment.alignmentScore;
        const source = "pixel-ocr-acie-v4";
        const summary = cta.found ? `CTA: "${cta.word}" — ${cta.goalFit}` : "No CTA detected.";
        const alignLabel = goalAlignment.status;
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
          qualityMessage: px.qualityMessage,
          // Text
          text_clarity: textSignals.clarity,
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
          dim_cta: realCTA.confidence,
          dim_text: textSignals.clarity,
          dim_brand: dims.brand.raw,
          dim_brightness: dims.brightness.raw,
          dim_goal: dims.goal.raw,
          dim_pixel: dims.pixel.raw,
          dim_filesize: dims.filesize.raw,
          dim_color_harmony: dims.color_harmony.raw,
          dim_visual_hierarchy: dims.visual_hierarchy.raw,
          dim_details: dimDetails,
          // Legacy
          layout_score: clamp(Math.round((100 - clutter.index * 10 + (visualHierarchy === "STRONG" ? 20 : visualHierarchy === "MODERATE" ? 8 : -8)) / 2)),
          visual_quality: dims.pixel.raw,
          goal_fit: goalAlignScore,
          overall_score: finalScore,
          score: finalScore,
          finalScore,
          cta: {
            detected: realCTA.detected,
            text: realCTA.text,
            strength: realCTA.strength,
            confidence: realCTA.confidence,
            visibilityScore: ctaDetail.visibilityScore,
            contrastScore: ctaDetail.contrastScore,
            positionScore: ctaDetail.positionScore,
            urgencyScore: ctaDetail.urgencyScore,
          },
          metrics: {
            clarity: textSignals.clarity,
            contrast: imageSignals.contrast,
            visibility: imageSignals.visibility,
            brand: dims.brand.raw,
          },
          eligibility: {
            score: eligibility.score,
            issues: eligibility.issues ?? [],
            breakdown: eligibility.breakdown ?? {},
          },
          attention: {
            score: attention.score,
            breakdown: attention.breakdown ?? {},
          },
          performance: {
            score: performance.score,
            breakdown: performance.breakdown ?? {},
            ctaGoalFit: performance.ctaGoalFit,
          },
          issues: validationAlerts,
          // CTA
          cta_presence: realCTA.detected,
          cta_strength: realCTA.strength,
          cta_recommendations: GOAL_CTA[goal],
          cta_detected: realCTA.detected,
          cta_text: realCTA.text || null,
          cta_type: cta.ctaType,
          cta_goal_fit: cta.goalFit,
          cta_scores: {
            overall: ctaDetail.ctaScore / 10,
            clarity: ctaDetail.positionScore / 10,
            urgency: ctaDetail.urgencyScore / 10,
            value: ctaDetail.contrastScore / 10,
            visibility: ctaDetail.visibilityScore / 10,
          },
          // Core Checks
          coreChecks: {
            noticeability: { score: imageSignals.contrast, label: imageSignals.contrast > 30 ? "Good Contrast" : "Low Contrast", pass: imageSignals.contrast > 30 },
            messageClarity: { score: textSignals.clarity, label: `${ocr.wordCount} words | ${Math.round(ocr.textAreaPercent)}% area | Headline: ${ocr.headlineDetected ? "✓" : "✗"}`, pass: textSignals.clarity >= 60 },
            ctaStrength: { score: realCTA.confidence, label: realCTA.detected ? `"${realCTA.text}" [${cta.ctaType}]` : "No CTA Found", pass: realCTA.detected || goal === "awareness" },
            brandPresence: { score: dims.brand.raw, label: `Brand Score: ${dims.brand.raw}/100`, pass: dims.brand.raw >= 55 },
            crowding: { score: 100 - clutter.index * 10, label: `Clutter ${clutter.index}/10 — ${clutter.label}`, pass: clutter.index <= 5 },
            formatFit: { score: 100, label: tier, pass: true },
          },
          platformChecks: computePlatformChecks(platform, fileSizeKB, ocr, size, px, clutter, visualHierarchy, cta, dims.cta.raw, emotionalAppeal, cognitiveLoad),
          adVisibilityScore: imageSignals.visibility,
          goalAlignmentIndicator: goalAlignScore,
          // Suggestions & Fixes
          suggestions: allSugg,
          improvement_suggestions: goalAlignment.reasons,
          fix_blocks: fixBlocks,
          ab_hypotheses: abHypotheses,
          performanceImpact,
          // ACIE v4 Intelligence
          creative_archetype: creativeArchetype,
          emotion_signature: emotionSignature,
          clutter_index: clutter.index,
          clutter_label: clutter.label,
          emotional_appeal: emotionalAppeal,
          engagement_forecast: forecast,
          engagement_forecast_confidence: engagementConfidence,
          engagement_drivers: engagementDrivers,
          engagement,
          aiInsights: null,
          visual_hierarchy: visualHierarchy,
          cognitive_load_score: cognitiveLoad,
          stop_rate_estimate: stopRateEstimate,
          // Dataset
          dataset_matches: datasetMatches,
          dataset_confidence: datasetConfidence,
          // Meta
          goal, platform, imageSize: size,
          analyzed_at: new Date().toISOString(),
          source, sizeTier: tier, fileSizeKB,
          deterministicIssues: issues,
          confidence: `${signalConfidence}%`,
          // Funnel
          primary_stage: goal.charAt(0).toUpperCase() + goal.slice(1),
          bestFor: goal.charAt(0).toUpperCase() + goal.slice(1),
          goalMatchScore: goalAlignScore,
          funnelReasoning: `${funnelText} ${goalAlignment.reasons.join(" | ")}`,
          funnelSignals: [],
          recommendedTemplates: ["newspaper", "health"],
          messaging_intent: tone === "urgent" ? "High Urgency" : tone === "helpful" ? "Informative" : "Persuasive",
          urgency_level: cta.urgencySignal ? "High" : tone === "urgent" ? "High" : tone === "helpful" ? "Medium" : "Low",
          ai_cta_strength: realCTA.strength,
          // Analysis Text
          analysis: summary,
          impact: issues[0]?.evidence ?? "",
          improved_ctas: GOAL_CTA[goal].slice(0, 3),
          // Agent Slots
          agentSummary: summary,
          agentFunnelAnalysis: funnelText,
          agentBreakdown: {
            cta: realCTA.detected ? `"${realCTA.text}" — ${cta.ctaType} — ${cta.goalFit}` : "No CTA — Score: 0/100",
            text_clarity: `${ocr.wordCount} words | ${Math.round(ocr.textAreaPercent)}% area | Headline: ${ocr.headlineDetected} | Flow: ${ocr.readingFlow} | Score: ${textSignals.clarity}/100`,
            brand_presence: `Focal: ${px.focalPointStrength}/100 | Score: ${dims.brand.raw}/100`,
            brightness_contrast: `B: ${px.brightness}% C: ${px.contrast}% Sat: ${px.saturation}% WCAG: ${px.wcagLevel} → ${dims.brightness.raw}/100`,
            ad_visibility: `Pixel: ${dims.pixel.raw}/100 | Clutter: ${clutter.index}/10 | CogLoad: ${cognitiveLoad}/100`,
            goal_alignment: funnelText,
            color_harmony: `${px.colorHarmony} | Variance: ${px.colorVariance}/100 | Score: ${dims.color_harmony.raw}/100`,
            visual_hierarchy: `${visualHierarchy} | Headline: ${ocr.headlineDetected} | Flow: ${ocr.readingFlow} | Score: ${dims.visual_hierarchy.raw}/100`,
          },
          agentScores: {
            cta: realCTA.confidence / 10,
            clarity: textSignals.clarity / 10,
            brand: dims.brand.raw / 10,
            visual_quality: dims.pixel.raw / 10,
            visibility: imageSignals.visibility / 10,
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