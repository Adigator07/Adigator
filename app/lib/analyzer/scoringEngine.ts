export type CampaignGoal = "awareness" | "consideration" | "conversion";

export interface ScoringInput {
  ctaDetected: boolean;
  ctaStrength: "low" | "medium" | "high";
  hasGoodContrast: boolean;
  hasClearText: boolean;
  isBlurry: boolean;
  hasLowContrast: boolean;
  hasTooMuchText: boolean;
  datasetCalibration: number;
}

export interface ScoringResult {
  score: number;
  contributions: string[];
}

export interface LayerScore {
  score: number;
  issues?: string[];
  breakdown?: Record<string, number>;
}

export interface CTADetailInput {
  detected: boolean;
  strength: "low" | "medium" | "high";
  visibilityScore: number;
  contrastScore: number;
  positionScore: number;
  urgencyScore: number;
}

export interface CTADetailResult {
  detected: boolean;
  strength: "low" | "medium" | "high";
  visibilityScore: number;
  contrastScore: number;
  positionScore: number;
  urgencyScore: number;
  ctaScore: number;
}

export interface EligibilityInput {
  fileSizeKB: number;
  formatValid: boolean;
  isBlurry: boolean;
  loadReady: boolean;
}

export interface AttentionInput {
  contrastScore: number;
  clarityScore: number;
  clutterScore: number;
  blurScore: number;
  focalPointScore: number;
  layoutBalanceScore: number;
}

export interface PerformanceInput {
  goal: CampaignGoal;
  cta: CTADetailResult;
  clarityScore: number;
  brandScore: number;
  goalAlignmentScore: number;
}

export interface EngagementInput {
  attentionScore: number;
  performanceScore: number;
  goalAlignmentScore: number;
  goal: CampaignGoal;
  ctaDetected: boolean;
  isBlurry: boolean;
}

export interface EngagementResult {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function computeAuctionEligibility(input: EligibilityInput): LayerScore {
  let score = 100;
  const issues: string[] = [];

  if (!input.formatValid) {
    score -= 35;
    issues.push("Unsupported ad format or size: -35");
  }

  if (!input.loadReady) {
    score -= 25;
    issues.push("Load readiness risk (heavy asset): -25");
  }

  if (input.fileSizeKB > 150) {
    score -= input.fileSizeKB > 300 ? 25 : 12;
    issues.push(input.fileSizeKB > 300 ? "File size very high for auction delivery: -25" : "File size above recommended threshold: -12");
  }

  if (input.isBlurry) {
    score -= 20;
    issues.push("Blur detected impacts auction quality checks: -20");
  }

  return {
    score: clamp(score),
    issues,
    breakdown: {
      fileSize: clamp(100 - Math.max(0, input.fileSizeKB - 80) * 0.35),
      format: input.formatValid ? 100 : 40,
      blurCheck: input.isBlurry ? 35 : 100,
      loadReadiness: input.loadReady ? 100 : 45,
    },
  };
}

export function computeAttentionCapture(input: AttentionInput): LayerScore {
  const breakdown = {
    contrast: clamp(input.contrastScore),
    clarity: clamp(input.clarityScore),
    clutter: clamp(input.clutterScore),
    blur: clamp(input.blurScore),
    focalPoint: clamp(input.focalPointScore),
    layoutBalance: clamp(input.layoutBalanceScore),
  };

  // Required deterministic formula from product spec.
  const score = clamp(
    breakdown.contrast * 0.3 +
    breakdown.clarity * 0.3 +
    (100 - breakdown.clutter) * 0.2 +
    (100 - breakdown.blur) * 0.2,
  );

  return { score, breakdown };
}

export function computeCTADetail(input: CTADetailInput): CTADetailResult {
  const detail: CTADetailResult = {
    detected: input.detected,
    strength: input.strength,
    visibilityScore: clamp(input.visibilityScore),
    contrastScore: clamp(input.contrastScore),
    positionScore: clamp(input.positionScore),
    urgencyScore: clamp(input.urgencyScore),
    ctaScore: 0,
  };

  detail.ctaScore = detail.detected
    ? clamp((detail.visibilityScore + detail.contrastScore + detail.positionScore + detail.urgencyScore) / 4)
    : 0;

  return detail;
}

export function computePerformanceSignals(input: PerformanceInput): LayerScore & { ctaGoalFit: "good" | "too strong" | "missing" | "weak" } {
  let ctaScore = input.cta.ctaScore;
  let ctaGoalFit: "good" | "too strong" | "missing" | "weak" = "weak";

  if (input.cta.detected) {
    if (input.goal === "awareness") {
      if (input.cta.strength === "high") {
        ctaScore = clamp(ctaScore * 0.65);
        ctaGoalFit = "too strong";
      } else {
        ctaScore = clamp(ctaScore + 8);
        ctaGoalFit = "good";
      }
    }

    if (input.goal === "consideration") {
      if (input.cta.strength === "medium") {
        ctaScore = clamp(ctaScore + 6);
        ctaGoalFit = "good";
      } else if (input.cta.strength === "high") {
        ctaScore = clamp(ctaScore - 4);
        ctaGoalFit = "weak";
      } else {
        ctaGoalFit = "weak";
      }
    }

    if (input.goal === "conversion") {
      if (input.cta.strength === "high") {
        ctaScore = clamp(ctaScore + 10);
        ctaGoalFit = "good";
      } else {
        ctaScore = clamp(ctaScore * 0.72);
        ctaGoalFit = "weak";
      }
    }
  } else {
    if (input.goal === "awareness") {
      ctaScore = 70;
      ctaGoalFit = "missing";
    } else if (input.goal === "consideration") {
      ctaScore = 45;
      ctaGoalFit = "missing";
    } else {
      ctaScore = 20;
      ctaGoalFit = "missing";
    }
  }

  const breakdown = {
    cta: clamp(ctaScore),
    messageClarity: clamp(input.clarityScore),
    brandPresence: clamp(input.brandScore),
    goalAlignment: clamp(input.goalAlignmentScore),
  };

  // Required deterministic formula from product spec.
  const score = clamp(
    breakdown.cta * 0.4 +
    breakdown.goalAlignment * 0.3 +
    breakdown.brandPresence * 0.2 +
    breakdown.messageClarity * 0.1,
  );

  return { score, breakdown, ctaGoalFit };
}

export function computeFinalCreativeScore(eligibility: number, attention: number, performance: number): number {
  return clamp(eligibility * 0.2 + attention * 0.4 + performance * 0.4);
}

export function computeEngagement(input: EngagementInput): EngagementResult {
  let score = clamp(input.attentionScore * 0.4 + input.performanceScore * 0.4);
  const reasons: string[] = [];

  if (input.goalAlignmentScore < 50) {
    score -= 20;
    reasons.push("Goal misalignment penalty: -20");
  }

  if (input.goal === "conversion" && !input.ctaDetected) {
    score -= 25;
    reasons.push("Missing CTA for conversion objective: -25");
  }

  if (input.isBlurry) {
    score -= 20;
    reasons.push("Blur penalty on engagement: -20");
  }

  if (input.attentionScore >= 75) reasons.push("Attention layer is strong");
  if (input.performanceScore >= 75) reasons.push("Performance signals are strong");
  if (input.attentionScore < 50) reasons.push("Attention is weak: contrast/clarity/clutter/blur need improvement");
  if (input.performanceScore < 50) reasons.push("Performance is weak: CTA, brand, and alignment are underpowered");

  score = clamp(score);
  const level: "LOW" | "MEDIUM" | "HIGH" = score > 75 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW";

  if (reasons.length === 0) {
    reasons.push(level === "HIGH" ? "Signals are consistently strong" : "Mixed signals detected across layers");
  }

  return { score, level, reasons };
}

// Backward-compatible wrapper used in existing API path.
export function computeDynamicScore(input: ScoringInput): ScoringResult {
  const syntheticBlurScore = input.isBlurry ? 85 : 15;
  const attention = computeAttentionCapture({
    contrastScore: input.hasLowContrast ? 30 : input.hasGoodContrast ? 75 : 55,
    clarityScore: input.hasClearText ? 75 : input.hasTooMuchText ? 40 : 55,
    clutterScore: input.hasTooMuchText ? 70 : 25,
    blurScore: syntheticBlurScore,
    focalPointScore: input.isBlurry ? 40 : 72,
    layoutBalanceScore: input.hasTooMuchText ? 45 : 70,
  });

  const cta = computeCTADetail({
    detected: input.ctaDetected,
    strength: input.ctaStrength,
    visibilityScore: input.hasGoodContrast ? 72 : 48,
    contrastScore: input.hasGoodContrast ? 74 : input.hasLowContrast ? 35 : 55,
    positionScore: input.hasTooMuchText ? 52 : 68,
    urgencyScore: input.ctaStrength === "high" ? 80 : input.ctaStrength === "medium" ? 64 : 46,
  });

  const performance = computePerformanceSignals({
    goal: "conversion",
    cta,
    clarityScore: input.hasClearText ? 75 : 48,
    brandScore: 65,
    goalAlignmentScore: input.ctaDetected ? 72 : 45,
  });

  const eligibility = computeAuctionEligibility({
    fileSizeKB: 120,
    formatValid: true,
    isBlurry: input.isBlurry,
    loadReady: true,
  });

  const finalScore = clamp(computeFinalCreativeScore(eligibility.score, attention.score, performance.score) + input.datasetCalibration);
  const contributions: string[] = [
    `Eligibility layer: ${eligibility.score}`,
    `Attention layer: ${attention.score}`,
    `Performance layer: ${performance.score}`,
  ];

  if (input.datasetCalibration !== 0) {
    contributions.push(`Dataset calibration: ${input.datasetCalibration > 0 ? "+" : ""}${input.datasetCalibration}`);
  }

  return { score: finalScore, contributions };
}
