import { CTADetectionResult } from '../agents/ctaAgent';
import { VisualAgentResult } from '../agents/visualAgent';
import { BrandDetectionResult } from '../agents/brandAgent';
import { PlatformResult } from '../agents/platformAgent';

export interface FinalScoreResult {
  finalScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  
  // Layer Scores
  eligibility: {
    score: number;
    metrics: {
      fileSize: number;
      format: number;
      blurCheck: number;
      loadReadiness: number;
    }
  };
  attention: {
    score: number;
    metrics: {
      contrast: number;
      clarity: number;
      clutter: number;
      blur: number;
      focalPoint: number;
      layoutBalance: number;
    }
  };
  performance: {
    score: number;
    metrics: {
      cta: number;
      messageClarity: number;
      brandPresence: number;
      goalAlignment: number;
    }
  };

  breakdown: {
    cta: number;
    visual: number;
    brand: number;
    platform: number;
    color: number;
  };
  colorBonus: number;
  warning?: string;
  isFallback?: boolean;
  engagement_forecast?: "PEAK" | "HIGH" | "MEDIUM" | "LOW";
  engagement_forecast_confidence?: number;
}

type HarmonyType = "analogous" | "complementary" | "discordant";

export function calculateFinalScore(
  cta: CTADetectionResult,
  visual: VisualAgentResult,
  brand: BrandDetectionResult,
  platform: PlatformResult,
  isOcrLowQuality: boolean = false,
  goal: string = "conversion",
  fallbackColorData?: { colorPalette: string[]; dominantHue: number; harmonyType: string; warmth: number; contrastScore: number } | null,
  fileSizeKb: number = 0
): FinalScoreResult {

  // ── 1. Eligibility Layer (20%) ──────────────────────────────────────────────
  const eligibilityMetrics = {
    fileSize: platform.platform === "google" && fileSizeKb > 150 ? 30 : fileSizeKb > 500 ? 50 : 95,
    format: 100,
    blurCheck: Math.round(visual.sharpness),
    loadReadiness: Math.round(visual.sharpness * 0.8 + 20)
  };
  const eligibilityScore = Math.round((eligibilityMetrics.fileSize + eligibilityMetrics.format + eligibilityMetrics.blurCheck + eligibilityMetrics.loadReadiness) / 4);

  // ── 2. Attention Layer (40%) ────────────────────────────────────────────────
  const colorData = (visual.color ?? fallbackColorData);
  const colorContrast = colorData?.contrastScore ?? 50;
  
  const attentionMetrics = {
    contrast: Math.round(visual.contrast * 0.6 + colorContrast * 0.4),
    clarity: Math.round(visual.sharpness),
    clutter: Math.max(20, Math.min(98, 100 - (visual.artifacts || 0))),
    blur: Math.round(visual.sharpness > 80 ? 10 : 100 - visual.sharpness),
    focalPoint: Math.round(visual.contrast * 0.5 + visual.sharpness * 0.5),
    layoutBalance: Math.round(100 - (visual.artifacts || 0))
  };
  const attentionScore = Math.round((attentionMetrics.contrast + attentionMetrics.clarity + attentionMetrics.clutter + (100 - attentionMetrics.blur) + attentionMetrics.focalPoint + attentionMetrics.layoutBalance) / 6);

  // ── 3. Performance Layer (40%) ─────────────────────────────────────────────
  const performanceMetrics = {
    cta: Math.round(cta.score),
    messageClarity: isOcrLowQuality ? 40 : 90,
    brandPresence: Math.round(brand.score),
    goalAlignment: cta.ctaType === goal ? 95 : 45
  };
  const performanceScore = Math.round((performanceMetrics.cta + performanceMetrics.messageClarity + performanceMetrics.brandPresence + performanceMetrics.goalAlignment) / 4);

  // ── Final Weighted Sum ───────────────────────────────────────────────────────
  let finalScore = (eligibilityScore * 0.20) + (attentionScore * 0.40) + (performanceScore * 0.40);
  
  // ── Hard Gates ──────────────────────────────────────────────────────────────
  if (visual.sharpness < 50) finalScore = Math.min(finalScore, 50);
  if (brand.score === 0) finalScore = Math.min(finalScore, 75);
  
  finalScore = Math.round(Math.max(0, Math.min(100, finalScore)));

  let grade: "A" | "B" | "C" | "D" | "F" = "F";
  if (finalScore >= 85) grade = "A";
  else if (finalScore >= 70) grade = "B";
  else if (finalScore >= 55) grade = "C";
  else if (finalScore >= 40) grade = "D";

  // ── 4. Engagement Forecast ────────────────────────────────────────────────
  
  // Forecast is derived from the synergy of Attention (Stop power) and Performance (Action power)
  const forecastScore = (attentionScore * 0.5) + (performanceScore * 0.5);
  let engagement_forecast: "PEAK" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let engagement_forecast_confidence = 70;

  if (forecastScore >= 85) engagement_forecast = "PEAK";
  else if (forecastScore >= 70) engagement_forecast = "HIGH";
  else if (forecastScore >= 50) engagement_forecast = "MEDIUM";
  else engagement_forecast = "LOW";

  // Confidence is penalized if signals are low quality or inconsistent
  if (isOcrLowQuality) engagement_forecast_confidence -= 15;
  if (visual.artifacts < 50) engagement_forecast_confidence -= 10;
  engagement_forecast_confidence = Math.max(40, Math.min(95, engagement_forecast_confidence));

  return {
    finalScore,
    grade,
    eligibility: { score: eligibilityScore, metrics: eligibilityMetrics },
    attention: { score: attentionScore, metrics: attentionMetrics },
    performance: { score: performanceScore, metrics: performanceMetrics },
    engagement_forecast,
    engagement_forecast_confidence,
    breakdown: {
      cta: Math.round(cta.score),
      visual: Math.round(visual.score),
      brand: Math.round(brand.score),
      platform: Math.round(platform.score),
      color: 50 // Placeholder
    },
    colorBonus: 0,
    isFallback: isOcrLowQuality
  };
}

