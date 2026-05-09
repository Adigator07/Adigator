/**
 * Deterministic Recommendation Engine
 * Registry-aware, profile-driven, actionable
 * Generates specific, measurable recommendations
 */

import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { FinalScores } from "./scoring-engine";

export interface RecommendationContext {
  ocr: any;
  ctaDetection: any;
  layoutAnalysis: any;
  scores: FinalScores;
}

export interface Recommendation {
  id: string;
  category: "cta" | "layout" | "emotion" | "copy" | "composition" | "mobile";
  priority: "low" | "medium" | "high" | "critical";
  current: string;
  suggested: string;
  reason: string;
  expectedImpact: number;
  source: "registry" | "deterministic" | "ai";
}

export function generateRecommendations(
  context: RecommendationContext,
  profile: IntelligenceProfile
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const { ocr, ctaDetection, layoutAnalysis, scores } = context;

  // ── CTA RECOMMENDATIONS ──────────────────────────────────────────────

  // Missing CTA when required
  if (profile.ctaExpectations.required && !ctaDetection.detected) {
    recommendations.push({
      id: "cta_missing",
      category: "cta",
      priority: "critical",
      current: "No CTA detected",
      suggested: `Add: "${profile.ctaExpectations.examples[0]}"`,
      reason: `${profile.goal} creatives for ${profile.vertical} require explicit CTA`,
      expectedImpact: 25,
      source: "registry",
    });
  }

  // CTA too strong for awareness
  if (profile.goal === "awareness" && ctaDetection.strength >= 3) {
    recommendations.push({
      id: "cta_too_aggressive",
      category: "cta",
      priority: "medium",
      current: ctaDetection.text || "Direct CTA",
      suggested: `Use soft CTA: "${profile.ctaExpectations.examples[0]}"`,
      reason:
        "Awareness creatives should use soft CTAs like 'Learn More', not aggressive 'Buy Now'",
      expectedImpact: 12,
      source: "registry",
    });
  }

  // CTA too weak for conversion
  if (profile.goal === "conversion" && ctaDetection.strength < 2) {
    recommendations.push({
      id: "cta_too_weak",
      category: "cta",
      priority: "high",
      current: ctaDetection.text || "Soft/missing CTA",
      suggested: `Use direct CTA: "${profile.ctaExpectations.examples[0]}"`,
      reason: "Conversion creatives need strong, direct CTAs",
      expectedImpact: 18,
      source: "registry",
    });
  }

  // ── LAYOUT RECOMMENDATIONS ───────────────────────────────────────────

  // Too much clutter
  if (
    layoutAnalysis.clutter > 0.7 &&
    profile.layoutExpectations.density === "minimal"
  ) {
    const reductionTarget = Math.round(layoutAnalysis.clutter * 100 - 50);
    recommendations.push({
      id: "layout_too_dense",
      category: "layout",
      priority: "high",
      current: `Clutter: ${(layoutAnalysis.clutter * 100).toFixed(0)}%`,
      suggested: `Reduce clutter to < 50% (target: -${reductionTarget}% reduction)`,
      reason: `${profile.vertical} ${profile.goal} expects minimal density layout`,
      expectedImpact: 15,
      source: "deterministic",
    });
  }

  // Too much text
  if (
    layoutAnalysis.textDensity > 55 &&
    profile.layoutExpectations.density === "minimal"
  ) {
    recommendations.push({
      id: "text_overload",
      category: "layout",
      priority: "high",
      current: `Text coverage: ${layoutAnalysis.textDensity}%`,
      suggested: `Reduce to < 40% text coverage`,
      reason: "Too much copy reduces scannability and attention",
      expectedImpact: 12,
      source: "deterministic",
    });
  }

  // Insufficient whitespace
  if (layoutAnalysis.whitespace < 0.15) {
    recommendations.push({
      id: "low_whitespace",
      category: "layout",
      priority: "medium",
      current: `Whitespace: ${(layoutAnalysis.whitespace * 100).toFixed(0)}%`,
      suggested: `Increase whitespace to 20-30%`,
      reason: "Low whitespace increases cognitive load",
      expectedImpact: 10,
      source: "deterministic",
    });
  }

  // Mobile readability issues
  if (layoutAnalysis.mobileReadability < 60) {
    recommendations.push({
      id: "mobile_readability",
      category: "mobile",
      priority: "high",
      current: `Mobile readability: ${layoutAnalysis.mobileReadability}%`,
      suggested: "Increase text size, reduce text density, improve tap targets",
      reason: "Mobile readability below acceptable threshold",
      expectedImpact: 14,
      source: "deterministic",
    });
  }

  // ── EMOTIONAL RECOMMENDATIONS ────────────────────────────────────────

  // Missing emotional triggers
  const missingEmotions = profile.expectedEmotions.primary.filter((emotion) => {
    const allWords = [
      ...(ocr.emotionalWords || []),
      ...(ocr.benefitWords || []),
    ].join(" ");
    return !allWords.toLowerCase().includes(emotion.toLowerCase());
  });

  if (missingEmotions.length > 0 && scores.persuasion.value < 60) {
    recommendations.push({
      id: "emotion_low",
      category: "emotion",
      priority: "medium",
      current: `Emotional words: ${ocr.emotionalWords?.length || 0}`,
      suggested: `Add emotional triggers: ${missingEmotions.slice(0, 2).join(", ")}`,
      reason: `${profile.goal} creatives for ${profile.vertical} benefit from emotional connection`,
      expectedImpact: 14,
      source: "registry",
    });
  }

  // ── TRUST RECOMMENDATIONS ────────────────────────────────────────────

  if (profile.goal === "consideration" && scores.trust.value < 65) {
    recommendations.push({
      id: "trust_signals_low",
      category: "copy",
      priority: "high",
      current: `Trust words: ${ocr.trustWords?.length || 0}`,
      suggested:
        'Add trust markers: "certified", "guaranteed", "trusted by", "award-winning"',
      reason: "Consideration creatives require strong trust signals",
      expectedImpact: 20,
      source: "registry",
    });
  }

  // ── COPY RECOMMENDATIONS ─────────────────────────────────────────────

  // Low benefit messaging
  if ((ocr.benefitWords?.length || 0) < 2 && profile.goal !== "awareness") {
    recommendations.push({
      id: "benefits_missing",
      category: "copy",
      priority: "medium",
      current: `Benefit words: ${ocr.benefitWords?.length || 0}`,
      suggested: "Focus on benefits: save, improve, achieve, solve, reduce",
      reason: "Lack of benefit-focused language reduces persuasion",
      expectedImpact: 11,
      source: "deterministic",
    });
  }

  // Missing urgency for conversion
  if (profile.goal === "conversion" && (!ocr.urgencyWords || ocr.urgencyWords.length === 0)) {
    recommendations.push({
      id: "urgency_missing",
      category: "copy",
      priority: "medium",
      current: "No urgency signals",
      suggested: 'Add time pressure: "limited", "today", "now", "ends soon"',
      reason: "Conversion creatives benefit from time-pressure messaging",
      expectedImpact: 13,
      source: "registry",
    });
  }

  // Sort by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      b.expectedImpact - a.expectedImpact
  );

  return recommendations;
}
