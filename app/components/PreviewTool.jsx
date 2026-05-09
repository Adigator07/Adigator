"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SlidePreview from "./SlidePreview";
import dynamic from "next/dynamic";
const ContextualPreviewEngine = dynamic(() => import("./ContextualPreviewEngine"), { ssr: false, loading: () => <div className="py-20 text-center text-gray-500 text-sm">Loading contextual engine…</div> });
import EditCreativeModal from "./EditCreativeModal";
import CreativeCard from "./CreativeCard";
import AnalysisPanel from "./AnalysisPanel";
import { supabase } from "../lib/supabase";
import {
  validateCreativeAsset,
  buildValidationSummary,
  SUPPORTED_DISPLAY_SIZE_GROUPS,
  DSP_PARTNERS,
} from "../lib/creativeValidation";

// Platform and CTA constants (previously from localAnalyzer)
const PLATFORM_SIZES = {
  programmatic: {
    desktop: SUPPORTED_DISPLAY_SIZE_GROUPS.desktop,
    mobile: SUPPORTED_DISPLAY_SIZE_GROUPS.mobile,
    native: SUPPORTED_DISPLAY_SIZE_GROUPS.native,
  },
};

const GOAL_CTA = {
  awareness: ["Learn More", "Discover", "Explore", "Watch Now", "See Now"],
  consideration: ["View Details", "Compare Now", "Check Features", "See Pricing", "Try Demo"],
  conversion: ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer"],
};

const DEFAULT_CAMPAIGN_GOAL = "awareness";
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Download, LayoutGrid, Square, CheckSquare,
  Newspaper, ShoppingCart, Coffee, Activity, Laptop, Briefcase, GraduationCap, Gamepad2, Film,
  Monitor, Smartphone
} from "lucide-react";

// ── Toast Component ──────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium text-white ${t.type === "success" ? "bg-green-900/80 border-green-500/40" :
                t.type === "error" ? "bg-red-900/80 border-red-500/40" : "bg-slate-900/80 border-white/20"
              }`}
          >
            <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "⏳"}</span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const TEMPLATES = [
  { id: "newspaper", name: "News website layout", icon: Newspaper, desc: "Awareness top funnel", slots: 7 },
  { id: "ecommerce", name: "E-commerce product page", icon: ShoppingCart, desc: "Conversion bottom funnel", slots: 7 },
  { id: "health", name: "Native ad placement", icon: Activity, desc: "Awareness top funnel", slots: 5 },
  { id: "technology", name: "Product landing page", icon: Laptop, desc: "Consideration mid funnel", slots: 7 },
  { id: "business", name: "Feature comparison layout", icon: Briefcase, desc: "Consideration mid funnel", slots: 6 },
  { id: "entertainment", name: "Video platform preview", icon: Film, desc: "Awareness top funnel", slots: 6 },
];

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Setup", "Upload", "Analysis", "Preview Studio"];

const LOW_AVAILABILITY_SIZES = new Set([
  "234x60",
  "120x240",
  "180x150",
  "300x1050",
]);

const PLATFORMS = [
  {
    id: "programmatic", icon: "📡", title: "Programmatic Ads", desc: "Real-time bidding across premium publisher inventory",
    color: "from-violet-600/30 to-violet-800/20", border: "border-violet-500/50",
    desktop: SUPPORTED_DISPLAY_SIZE_GROUPS.desktop,
    mobile: SUPPORTED_DISPLAY_SIZE_GROUPS.mobile,
    native: SUPPORTED_DISPLAY_SIZE_GROUPS.native,
  },
];

const GOALS = [
  {
    id: "awareness", emoji: "📣", title: "Awareness", subtitle: "Introduce Brand",
    color: "from-blue-600/30 to-blue-800/20", border: "border-blue-500/50",
    desc: "Maximize reach, visual clarity, and brand recognition.",
  },
  {
    id: "consideration", emoji: "🤔", title: "Consideration", subtitle: "Evaluate Product",
    color: "from-purple-600/30 to-purple-800/20", border: "border-purple-500/50",
    desc: "Balance information, value proposition, and moderate CTA.",
  },
  {
    id: "conversion", emoji: "⚡", title: "Conversion", subtitle: "Drive Action",
    color: "from-orange-600/30 to-orange-800/20", border: "border-orange-500/50",
    desc: "Strong CTA, high contrast, urgent direct messaging.",
  },
];

const VERTICALS = [
  { id: "healthcare", title: "Healthcare" },
  { id: "technology", title: "Technology" },
  { id: "automotive", title: "Automotive" },
  { id: "news_media", title: "News / Media" },
  { id: "sports", title: "Sports" },
  { id: "finance", title: "Business / Finance" },
  { id: "luxury", title: "Luxury" },
  { id: "travel", title: "Travel" },
  { id: "hotels", title: "Hotels" },
  { id: "food", title: "Restaurants / Food" },
  { id: "banking", title: "Banking / FinTech" },
  { id: "real_estate", title: "Real Estate" },
  { id: "education", title: "Education / EdTech" },
  { id: "gaming", title: "Gaming" },
  { id: "entertainment", title: "Entertainment / OTT / Streaming" },
  { id: "ecommerce", title: "E-commerce / Retail" }
];


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const VALID_VERTICALS = new Set([
  "automotive", "banking", "ecommerce", "education", "entertainment",
  "finance", "food", "gaming", "healthcare", "hotels", "luxury",
  "news_media", "real_estate", "sports", "technology", "travel",
]);

function toFiniteNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toPercentValue(value, fallback = null) {
  const num = toFiniteNumber(value, null);
  if (num === null) return fallback;
  if (num <= 1) return Math.round(num * 100);
  return Math.round(num);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function avg(values, fallback = null) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) return fallback;
  return Math.round(valid.reduce((sum, val) => sum + val, 0) / valid.length);
}

function scoreToForecast(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 75) return "HIGH";
  if (score >= 55) return "MEDIUM";
  return "LOW";
}

function scoreToLabel(score, passThreshold = 60) {
  if (!Number.isFinite(score)) {
    return { score: null, label: "Signal unavailable", pass: false, available: false };
  }
  return {
    score,
    label: score >= passThreshold ? "Pass" : "Needs improvement",
    pass: score >= passThreshold,
    available: true,
  };
}

function resolveAnalysisState(unifiedData) {
  const directState = unifiedData?.analysisState;
  const nestedState = unifiedData?.analysisDetails?.analysisState;
  const graphState = unifiedData?.analysisDetails?.graph?.analysisState;
  const state = directState || nestedState || graphState;
  if (state?.status) return state;
  return {
    status: "success",
    reason: "validated_analysis",
    message: "Validated analysis",
  };
}

function analysisStateCopy(status, reason) {
  if (status === "ocr_failure") return "OCR Processing Failed";
  if (status === "pipeline_failure") return "Analysis Pipeline Failed";
  if (status === "insufficient_evidence") return "Insufficient Validated Signals";
  if (status === "partial_analysis") return "Partial Intelligence Available";
  if (status === "low_confidence") return "Low Confidence Analysis";
  if (reason === "partial_signal_coverage") return "Partial Intelligence Available";
  return "Validated Analysis";
}

function buildFixBlocks(recommendations = []) {
  const severityMap = {
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  };

  return recommendations.slice(0, 8).map((rec, index) => ({
    dimension: rec.category || "creative",
    severity: severityMap[rec.priority] || "MEDIUM",
    score: clamp(100 - (toFiniteNumber(rec.expectedImpact, 12) * 3), 15, 92),
    problem: rec.current || "Creative signal needs refinement",
    impact: rec.reason || "May reduce campaign efficiency and auction competitiveness.",
    fixNow: rec.suggested || "Apply recommended optimization.",
    fixDeep: rec.reason || "Deepen test and iterate against goal/vertical profile.",
    abTestIdea: rec.suggested ? `Test variant with: ${rec.suggested}` : null,
    datasetNote: rec.source ? `Source: ${rec.source}` : null,
    expectedOutcome: rec.expectedImpact
      ? `Estimated +${rec.expectedImpact}% relative lift potential`
      : "Expected stronger clarity and conversion intent",
    timeEstimate: index < 2 ? "15m" : index < 5 ? "30m" : "45m",
  }));
}

function buildAbHypotheses(fixBlocks = []) {
  return fixBlocks.slice(0, 4).map((fix) => ({
    dimension: fix.dimension,
    priority: fix.severity === "CRITICAL" ? "HIGH" : fix.severity,
    variant_a: fix.problem,
    variant_b: fix.fixNow,
    expected_lift: fix.expectedOutcome,
  }));
}

function buildFixBlocksFromSuggestions(suggestions = []) {
  return suggestions.slice(0, 6).map((text, index) => ({
    dimension: "strategic_alignment",
    severity: index < 2 ? "HIGH" : "MEDIUM",
    score: index < 2 ? 45 : 58,
    problem: "Strategic optimization required",
    impact: text,
    fixNow: text,
    fixDeep: "Test this recommendation in a controlled A/B split and iterate by vertical.",
    abTestIdea: `Variant B applies: ${text}`,
    datasetNote: "Derived from strategic analysis recommendations",
    expectedOutcome: "Improved campaign alignment and delivery performance",
    timeEstimate: index < 2 ? "20m" : "35m",
  }));
}

function normalizeUnifiedAnalysis(unifiedData, goal, vertical, colorSignals = null) {
  const graph = unifiedData?.analysisDetails?.graph || unifiedData;
  const strategic = unifiedData?.strategicAnalysis || {};
  const details = unifiedData?.analysisDetails || {};
  const state = resolveAnalysisState(unifiedData);
  const stateStatus = state?.status || "success";
  const stateLabel = analysisStateCopy(stateStatus, state?.reason);
  const scoreSuppressed = ["ocr_failure", "insufficient_evidence", "pipeline_failure"].includes(stateStatus);
  const strategicScores = strategic?.scores || {};
  const rawScores = details?.scores || {};
  const layoutMetrics = details?.layoutAnalysis?.metrics || {};
  const recommendations = Array.isArray(details?.recommendations) ? details.recommendations : [];

  const goalAlignment = toFiniteNumber(strategicScores?.goalAlignment?.score);
  const verticalRelevance = toFiniteNumber(strategicScores?.verticalRelevance?.score);
  const trustAlignment = toFiniteNumber(strategicScores?.trustAlignment?.score);
  const mobileReadiness = toFiniteNumber(strategicScores?.mobileReadiness?.score);
  const visualClarity = toFiniteNumber(strategicScores?.visualClarity?.score);
  const layoutAlignment = toFiniteNumber(strategicScores?.layoutAlignment?.score);
  const readabilityScore = toFiniteNumber(strategicScores?.readabilityScore?.score);
  const strategyAlignment = toFiniteNumber(strategicScores?.strategyAlignment?.score);
  const conversionPotential = toFiniteNumber(strategicScores?.conversionPotential?.score);
  const ctaAlignment = toFiniteNumber(strategicScores?.ctaAlignment?.score);
  const engagementPotential = toFiniteNumber(strategicScores?.engagementPotential?.score);
  const competitiveStrength = toFiniteNumber(strategicScores?.competitiveStrength?.score);
  const auctionReadiness = toFiniteNumber(strategicScores?.auctionReadiness?.score);
  const emotionalAlignment = toFiniteNumber(strategicScores?.emotionalAlignment?.score);
  const brandAlignment = toFiniteNumber(strategicScores?.brandAlignment?.score);

  const eligibilityScore = avg([
    goalAlignment,
    verticalRelevance,
    trustAlignment,
    mobileReadiness,
  ], null);

  const attentionScore = avg([
    visualClarity,
    layoutAlignment,
    readabilityScore,
    strategyAlignment,
  ], null);

  const performanceScore = avg([
    conversionPotential,
    ctaAlignment,
    engagementPotential,
    competitiveStrength,
    auctionReadiness,
  ], null);

  const canComputeFinal = !scoreSuppressed && Number.isFinite(eligibilityScore) && Number.isFinite(attentionScore) && Number.isFinite(performanceScore);
  const finalScore = canComputeFinal
    ? clamp(
      Math.round((eligibilityScore * 0.2) + (attentionScore * 0.4) + (performanceScore * 0.4)),
      0,
      100
    )
    : null;

  const confidencePct = toPercentValue(graph?.confidence?.overall, toPercentValue(strategic?.overallConfidence, null));
  const engagementLevel = scoreSuppressed
    ? "UNAVAILABLE"
    : (scoreToForecast(engagementPotential ?? performanceScore) || "INSUFFICIENT DATA");
  const ctaDetection = details?.ctaDetection || {};
  const ctaDetected = Boolean(
    ctaDetection?.detected ??
    ctaDetection?.ctaExists ??
    ctaDetection?.cta ??
    ctaDetection?.candidateBlockId
  );
  const ctaText = ctaDetection?.text || ctaDetection?.cta || null;
  const clutterQuality = toFiniteNumber(layoutMetrics?.clutter?.score, null);
  const clutterRiskScore = Number.isFinite(clutterQuality) ? clamp(100 - clutterQuality, 0, 100) : null;
  const clutterIndex = Number.isFinite(clutterRiskScore) ? clamp(Math.round(clutterRiskScore / 10), 1, 10) : null;
  const clutterLabel = clutterIndex === null
    ? null
    : clutterIndex <= 3
      ? "CLEAN"
      : clutterIndex <= 6
        ? "MODERATE"
        : clutterIndex <= 8
          ? "CLUTTERED"
          : "CRITICAL";
  const strategicRecs = strategic?.recommendations || {};

  const suggestionPool = [
    ...(strategicRecs.critical || []),
    ...(strategicRecs.high || []),
    ...(strategicRecs.medium || []),
    ...(strategicRecs.lowPriority || []),
  ].filter(Boolean);

  const fallbackSuggestions = recommendations.map((rec) => rec?.suggested).filter(Boolean);
  const suggestions = (suggestionPool.length ? suggestionPool : fallbackSuggestions).slice(0, 6);

  const fixBlocksFromRecommendations = buildFixBlocks(recommendations);
  const fixBlocksFromStrategicText = buildFixBlocksFromSuggestions(suggestionPool);
  const fix_blocks = scoreSuppressed
    ? []
    : fixBlocksFromRecommendations.length > 0
    ? fixBlocksFromRecommendations
    : Number.isFinite(finalScore) && finalScore < 75
      ? fixBlocksFromStrategicText
      : [];
  const ab_hypotheses = buildAbHypotheses(fix_blocks);

  const performanceImpact = fix_blocks.slice(0, 5).map((fix) => ({
    issue: fix.problem,
    impact: fix.impact,
    estimatedEffect: fix.expectedOutcome,
    fix: fix.fixNow,
    expectedOutcome: fix.expectedOutcome,
    priority: fix.severity === "CRITICAL" || fix.severity === "HIGH" ? "High" : fix.severity === "MEDIUM" ? "Medium" : "Low",
  }));

  const stopRate = graph?.scores?.visualClarity?.value ?? null;
  const recommendedTemplates = goal === "conversion"
    ? ["ecommerce", "technology"]
    : goal === "consideration"
      ? ["business", "technology"]
      : ["newspaper", "entertainment"];

  const ctaVisibilitySignal = toFiniteNumber(ctaDetection?.strength, null);
  const ctaVisibilityScore = ctaVisibilitySignal !== null
    ? ctaVisibilitySignal <= 10
      ? Math.round(ctaVisibilitySignal * 10)
      : Math.round(ctaVisibilitySignal)
    : toFiniteNumber(ctaDetection?.confidence, null);

  const grade = rawScores?.grade || (
    !Number.isFinite(finalScore)
      ? "Analysis Unavailable"
      : finalScore >= 82
        ? "Elite Creative"
        : finalScore >= 70
          ? "Strong Performer"
          : finalScore >= 55
            ? "Needs Optimization"
            : "High Risk Creative"
  );

  return {
    ...unifiedData,
    goal,
    vertical,
    analysis_state: stateStatus,
    analysis_state_reason: state?.reason || null,
    analysis_state_message: state?.message || stateLabel,
    analysis_state_label: stateLabel,
    finalScore,
    score: finalScore,
    overall_score: finalScore,
    confidence: Number.isFinite(confidencePct) ? `${confidencePct}%` : "Unavailable",
    engagement: { level: engagementLevel },
    engagement_forecast: engagementLevel,
    engagement_forecast_confidence: confidencePct,
    emotional_appeal: scoreSuppressed ? null : (scoreToForecast(emotionalAlignment) || "MEDIUM"),
    creative_archetype: goal === "conversion" ? "Direct Response" : goal === "consideration" ? "Proof-led Consideration" : "Brand Awareness",
    emotion_signature: strategic?.strengths?.primary || null,
    visual_hierarchy: scoreSuppressed
      ? null
      : scoreToForecast(visualClarity) === "HIGH"
        ? "STRONG"
        : scoreToForecast(visualClarity) === "MEDIUM"
          ? "MODERATE"
          : "WEAK",
    headlineDetected: Boolean(details?.ocr?.headline || details?.ocr?.headlineText),
    readingFlow: Number.isFinite(toFiniteNumber(layoutMetrics?.attentionDistribution?.score, null))
      ? toFiniteNumber(layoutMetrics?.attentionDistribution?.score, null) >= 65 ? "LINEAR" : "SCATTERED"
      : null,
    focalPointStrength: toFiniteNumber(layoutMetrics?.visualHierarchy?.score, visualClarity ?? null),
    cta_presence: scoreSuppressed ? null : ctaDetected,
    cta_text: ctaText,
    cta_detected: scoreSuppressed ? null : ctaDetected,
    cta_goal_fit: ctaDetected
      ? (ctaAlignment ?? 0) >= 75 ? "Perfect Match" : (ctaAlignment ?? 0) >= 55 ? "Acceptable" : "Mismatch"
      : scoreSuppressed ? "Unavailable" : "None",
    clutter_index: clutterIndex,
    clutter_label: clutterLabel,
    stop_rate_estimate: stopRate === null ? "Insufficient data" : `${stopRate}%`,
    colorPalette: details?.colorAnalysis?.palette || colorSignals?.palette || [],
    colorHarmony: details?.colorAnalysis?.colorHarmony || colorSignals?.colorHarmony || null,
    warmthScore: toFiniteNumber(details?.colorAnalysis?.warmthScore, toFiniteNumber(colorSignals?.warmthScore, null)),
    dominantHue: toFiniteNumber(details?.colorAnalysis?.dominantHue, toFiniteNumber(colorSignals?.dominantHue, null)),
    intelligenceGraph: graph,
    lockedContext: graph?.lockedContext || { goal, selectedVertical: vertical },
    signalAvailability: details?.signalAvailability || graph?.signalAvailability || {},
    suggestions,
    fix_blocks,
    ab_hypotheses,
    performanceImpact,
    recommendedTemplates,
    eligibility: {
      score: eligibilityScore,
      breakdown: {
        goalAlignment,
        verticalRelevance,
        trustAlignment,
        mobileReadiness,
      },
      issues: strategic?.behavioralGaps?.trustGaps || [],
    },
    attention: {
      score: attentionScore,
      breakdown: {
        visualClarity,
        layoutAlignment,
        readabilityScore,
        strategyAlignment,
      },
    },
    performance: {
      score: performanceScore,
      breakdown: {
        conversionPotential,
        ctaAlignment,
        engagementPotential,
        competitiveStrength,
        auctionReadiness,
      },
      ctaGoalFit: ctaDetected
        ? (ctaAlignment ?? 0) >= 75 ? "good" : (ctaAlignment ?? 0) >= 55 ? "acceptable" : "too weak"
        : scoreSuppressed ? "unavailable" : "missing",
    },
    coreChecks: {
      noticeability: scoreToLabel(visualClarity, 60),
      messageClarity: scoreToLabel(readabilityScore, 60),
      ctaStrength: scoreToLabel(ctaAlignment, 55),
      brandPresence: scoreToLabel(brandAlignment, 55),
      crowding: scoreToLabel(Number.isFinite(clutterRiskScore) ? 100 - clutterRiskScore : null, 50),
      formatFit: scoreToLabel(layoutAlignment, 55),
    },
    cta: {
      text: ctaText,
      visibilityScore: ctaVisibilityScore,
      contrastScore: toFiniteNumber(layoutMetrics?.contrastReadability?.score, null),
      positionScore: toFiniteNumber(layoutMetrics?.attentionDistribution?.score, null),
      urgencyScore: toFiniteNumber(strategicScores?.conversionPotential?.score, null),
    },
    adVisibilityScore: toFiniteNumber(rawScores?.attention?.value, attentionScore),
    goalAlignmentIndicator: toFiniteNumber(strategicScores?.goalAlignment?.score, eligibilityScore),
    cta_strength: toFiniteNumber(rawScores?.ctaStrength?.value, ctaAlignment ?? null),
    brightness: toFiniteNumber(details?.ocr?.imageStats?.brightness, null),
    contrast: toFiniteNumber(details?.ocr?.imageStats?.contrast, null),
    aiData: {
      conversionScore: toFiniteNumber(strategicScores?.conversionPotential?.score, performanceScore),
      verticalFitScore: toFiniteNumber(strategicScores?.verticalRelevance?.score, eligibilityScore),
      campaign_goal: graph?.lockedContext?.goal || goal,
      vertical: graph?.lockedContext?.selectedVertical || vertical,
      cta_state: scoreSuppressed ? "Unavailable" : (ctaDetected ? "Strong" : "Missing"),
      overall_score: finalScore,
      confidence: confidencePct,
      strengths: [strategic?.strengths?.primary, ...(strategic?.strengths?.secondary || [])].filter(Boolean),
      weaknesses: [strategic?.weaknesses?.primary, ...(strategic?.weaknesses?.secondary || [])].filter(Boolean),
      missingElements: [
        ...(strategic?.behavioralGaps?.ctaGaps || []),
        ...(strategic?.behavioralGaps?.layoutGaps || []),
      ],
      subscores: {
        stage_alignment: toFiniteNumber(strategicScores?.goalAlignment?.score, null),
        conversion_readiness: toFiniteNumber(strategicScores?.conversionPotential?.score, null),
        visual_hierarchy: toFiniteNumber(strategicScores?.layoutAlignment?.score, null),
        readability: toFiniteNumber(strategicScores?.readabilityScore?.score, null),
        cognitive_simplicity: toFiniteNumber(strategicScores?.visualClarity?.score, null),
        emotional_resonance: toFiniteNumber(strategicScores?.emotionalAlignment?.score, null),
        trust_signals: toFiniteNumber(strategicScores?.trustAlignment?.score, null),
        brand_recall: toFiniteNumber(strategicScores?.brandAlignment?.score, null),
        cta_alignment: toFiniteNumber(strategicScores?.ctaAlignment?.score, null),
        offer_clarity: toFiniteNumber(strategicScores?.readabilityScore?.score, null),
        urgency_fit: toFiniteNumber(strategicScores?.competitiveStrength?.score, null),
      },
    },
    decisionEngine: {
      grade: {
        grade,
        color: !Number.isFinite(finalScore) ? "slate" : finalScore >= 82 ? "emerald" : finalScore >= 70 ? "blue" : finalScore >= 55 ? "yellow" : "red",
      },
      optimizations: recommendations.slice(0, 6).map((rec) => ({
        dimension: rec.category,
        subscore: finalScore,
        issue: rec.current,
        recommendation: rec.suggested,
        priority: rec.priority === "critical" || rec.priority === "high" ? "High" : rec.priority === "medium" ? "Medium" : "Low",
      })),
    },
    analysisSignal: {
      hasStrategic: Boolean(unifiedData?.strategicAnalysis),
      hasRawDetails: Boolean(unifiedData?.analysisDetails),
      processingTimeMs: toFiniteNumber(unifiedData?.processingTimeMs, null),
      status: stateStatus,
      statusLabel: stateLabel,
      statusReason: state?.reason || null,
    },
  };
}

// ── Shared analysis helper ─────────────────────────────────────────────────────
async function analyzeAllCreatives(creatives, goal, platform, vertical) {
  const results = [];
  for (const creative of creatives) {
    try {
      // Fetch image from URL and convert to Blob
      const imageRes = await fetch(creative.url);
      if (!imageRes.ok) throw new Error(`Failed to fetch image: ${creative.url}`);
      const imageBlob = await imageRes.blob();

      // Call new unified analyzer API
      const formData = new FormData();
      formData.append("image", imageBlob, "creative.jpg");
      formData.append("goal", goal);
      const verticalForApi = VALID_VERTICALS.has(vertical) ? vertical : "technology";
      formData.append("vertical", verticalForApi);

      // Single source of truth: analyze-v2 unified pipeline
      const analysisRes = await fetch("/api/analyze-v2", {
        method: "POST",
        body: formData,
      });

      if (!analysisRes.ok) {
        let apiErrorMessage = analysisRes.statusText;
        let apiErrorBody = null;
        try {
          apiErrorBody = await analysisRes.json();
          apiErrorMessage =
            apiErrorBody?.details ||
            apiErrorBody?.message ||
            apiErrorBody?.error?.message ||
            apiErrorBody?.error ||
            apiErrorMessage;
        } catch {
          // Keep fallback statusText
        }
        const fallbackFailure = {
          analysisState: {
            status: "pipeline_failure",
            reason: "http_error",
            message: `API error (${analysisRes.status}): ${apiErrorMessage}`,
          },
          strategicAnalysis: {
            strategyAlignmentScore: null,
            scores: {},
          },
          analysisDetails: {
            analysisState: {
              status: "pipeline_failure",
              reason: "http_error",
              message: `API error (${analysisRes.status}): ${apiErrorMessage}`,
            },
            scores: {
              overallScore: null,
              overallConfidence: null,
            },
            recommendations: [],
          },
        };
        const data = normalizeUnifiedAnalysis(apiErrorBody || fallbackFailure, goal, verticalForApi, null);
        results.push({ creative, data: { ...data, error: apiErrorMessage } });
        continue;
      }

      const unifiedData = await analysisRes.json();
      const data = normalizeUnifiedAnalysis(unifiedData, goal, verticalForApi, null);

      results.push({ creative, data });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Analysis request failed";
      console.error(`Analysis failed for ${creative.url}:`, err);
      results.push({
        creative,
        data: normalizeUnifiedAnalysis({
          analysisState: {
            status: "pipeline_failure",
            reason: "client_exception",
            message: errMessage,
          },
          strategicAnalysis: {
            strategyAlignmentScore: null,
            scores: {},
          },
          analysisDetails: {
            analysisState: {
              status: "pipeline_failure",
              reason: "client_exception",
              message: errMessage,
            },
            scores: {
              overallScore: null,
              overallConfidence: null,
            },
            recommendations: [],
          },
        }, goal, VALID_VERTICALS.has(vertical) ? vertical : "technology", null),
      });
    }
  }
  return results;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataURL(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not parse image dimensions"));
    img.src = dataUrl;
  });
}

function deriveStatusFromIssues(issues) {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
}

export default function PreviewTool() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize step from URL instead of local storage
  const urlStep = parseInt(searchParams.get("step") || "1", 10);
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Initialize state with basic defaults, then hydrate from localStorage
  const [step, setStep] = useState(urlStep);
  const [platform, setPlatform] = useState("programmatic");
  const [campaignGoal, setCampaignGoal] = useState(DEFAULT_CAMPAIGN_GOAL);
  const [campaignVertical, setCampaignVertical] = useState(null);

  // 1. Persistence: Hydrate from localStorage on mount
  useEffect(() => {
    const savedPlatform = localStorage.getItem("adigator_platform");
    const savedGoal = localStorage.getItem("adigator_goal");
    const savedVertical = localStorage.getItem("adigator_vertical");
    
    if (savedPlatform) setPlatform(savedPlatform);
    if (savedGoal && savedGoal !== "null") setCampaignGoal(savedGoal);
    else setCampaignGoal(DEFAULT_CAMPAIGN_GOAL);
    if (savedVertical && savedVertical !== "null") setCampaignVertical(savedVertical);
  }, []);

  // 2. Persistence: Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("adigator_platform", platform);
    localStorage.setItem("adigator_goal", campaignGoal || DEFAULT_CAMPAIGN_GOAL);
    if (campaignVertical) localStorage.setItem("adigator_vertical", campaignVertical);
  }, [platform, campaignGoal, campaignVertical]);

  // 3. Robust Config Guard: If on Step 2+, but config is missing, force back to Step 1
  useEffect(() => {
    if (step > 1 && (!platform || !campaignGoal || !campaignVertical)) {
      addToast("Configuration required. Please complete Step 1.", "error");
      router.push(`${pathname}?step=1`, { scroll: true });
    }
  }, [step, platform, campaignGoal, campaignVertical, pathname, router, addToast]);

  const [creatives, setCreatives] = useState([]);
  const [drag, setDrag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editModalCreative, setEditModalCreative] = useState(null);
  const [originalBackups, setOriginalBackups] = useState({});

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState("newspaper");
  const [viewMode, setViewMode] = useState("multiple");
  const [showSlotLabels, setShowSlotLabels] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fileRef = useRef(null);
  const userRef = useRef(null);
  const goalSectionRef = useRef(null);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform)?.title || "Not selected";
  const selectedGoal = GOALS.find((g) => g.id === campaignGoal)?.title || "Not selected";
  const scrollToSection = useCallback((ref) => {
    if (!ref?.current) return;
    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const handlePlatformSelect = useCallback((id) => {
    setPlatform(id);
    scrollToSection(goalSectionRef);
  }, [scrollToSection]);

  const handleGoalSelect = useCallback((id) => {
    setCampaignGoal(id);
  }, []);

  const selectedPlatformConfig = PLATFORMS.find((p) => p.id === platform);
  const allowedSizes = platform
    ? [
      ...(PLATFORM_SIZES[platform]?.desktop || []),
      ...(PLATFORM_SIZES[platform]?.mobile || []),
      ...(PLATFORM_SIZES[platform]?.native || []),
    ]
    : [];

  const validCreatives = creatives.filter((c) => c && c.valid && (c.url || c.text || c.image || c.title));
  const invalidCreatives = creatives.filter((c) => c && (!c.valid || !(c.url || c.text || c.image || c.title)));
  const uploadedCreatives = validCreatives;
  const validationResults = creatives.map((c) => c?.validation).filter(Boolean);
  const validationSummary = validationResults.length
    ? buildValidationSummary(validationResults)
    : { totalIssues: 0, criticalCount: 0, warningCount: 0, inventoryImpactScore: 100 };

  const goNext = useCallback(() => {
    if (step === 1 && (!platform || !campaignGoal)) return;
    if (step === 2 && uploadedCreatives.length === 0) return;
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    router.push(`${pathname}?step=${nextStep}`, { scroll: true });
  }, [step, platform, campaignGoal, uploadedCreatives.length, pathname, router]);

  const goBack = useCallback(() => {
    if (step === 1) {
      router.push("/");
      return;
    }
    const prevStep = Math.max(step - 1, 1);
    router.push(`${pathname}?step=${prevStep}`, { scroll: true });
  }, [step, router, pathname]);

  // Sync state when URL parameter changes (e.g., via browser Back button)
  useEffect(() => {
    const newStep = parseInt(searchParams.get("step") || "1", 10);
    setStep(Math.min(Math.max(newStep, 1), TOTAL_STEPS));
  }, [searchParams]);

  // Warn user before they leave with unsaved progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (creatives.length > 0 || step > 1) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [creatives.length, step]);

  // Guard against entering analysis without creatives
  useEffect(() => {
    if (step === 3 && uploadedCreatives.length === 0) {
      router.push(`${pathname}?step=2`, { scroll: true });
    }
  }, [step, uploadedCreatives.length, pathname, router]);

  const getUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const { data: { session } } = await supabase.auth.getSession();
    userRef.current = session?.user || null;
    return userRef.current;
  }, []);

  const saveToSupabase = async (creative) => {
    try {
      const user = await getUser();
      if (!user) return;
      await supabase.from("creatives").upsert({
        id: creative.id,
        user_id: user.id,
        name: creative.name,
        size: creative.size,
        valid: creative.valid,
        previewed: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) { console.error("saveToSupabase error:", e); }
  };

  const handleFiles = async (files) => {
    if (!platform) { addToast("Please select a platform first.", "error"); return; }
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;

    setIsLoading(true);
    try {
      const preparedCreatives = await Promise.all(fileList.map(async (file) => {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImageFromDataURL(dataUrl);
        const size = `${img.width}x${img.height}`;
        const validation = await validateCreativeAsset({
          file,
          image: img,
          platform,
          imageDataUrl: dataUrl,
        });

        const lowAvailabilityIssue = LOW_AVAILABILITY_SIZES.has(size)
          ? {
            type: "technical",
            severity: "medium",
            message: `${size} is valid but often has lower fill in open programmatic inventory.`,
            recommendation: "Keep this size if required, but prioritize 300x250, 336x280, 728x90, 970x250, or 300x600 for broader scale.",
            scorePenalty: 5,
          }
          : null;

        const mergedIssues = lowAvailabilityIssue
          ? [...validation.issues, lowAvailabilityIssue]
          : validation.issues;

        const normalizedValidation = {
          ...validation,
          issues: mergedIssues,
          status: deriveStatusFromIssues(mergedIssues),
        };

        return {
          id: `${Date.now()}-${file.name}-${size}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: dataUrl,
          size,
          valid: normalizedValidation.valid && normalizedValidation.status !== "CRITICAL",
          originalFile: file.name,
          fileSizeKB: Math.round(file.size / 1024),
          validation: normalizedValidation,
          placementType: normalizedValidation.intelligence?.placementType,
          deviceClassification: normalizedValidation.intelligence?.deviceClassification,
          iabCompatibility: normalizedValidation.intelligence?.iabCompatibility,
          dspCompatibility: normalizedValidation.intelligence?.dspCompatibility,
          inventoryAvailability: normalizedValidation.intelligence?.inventory,
          auctionReadiness: normalizedValidation.intelligence?.auctionReadiness,
          premiumPlacementPotential: normalizedValidation.intelligence?.premiumPlacement,
        };
      }));

      setCreatives((prev) => [...prev, ...preparedCreatives]);
      preparedCreatives.forEach((creative) => saveToSupabase(creative));

      const uploadSummary = buildValidationSummary(preparedCreatives.map((c) => c.validation));
      if (uploadSummary.criticalCount > 0) {
        addToast(`Uploaded ${preparedCreatives.length} creatives: ${uploadSummary.warningCount} warning(s), ${uploadSummary.criticalCount} critical.`, "error");
      } else if (uploadSummary.warningCount > 0) {
        addToast(`Uploaded ${preparedCreatives.length} creatives with ${uploadSummary.warningCount} warning(s).`, "info");
      } else {
        addToast(`Uploaded ${preparedCreatives.length} creatives. All checks passed.`, "success");
      }
    } catch (err) {
      addToast(err?.message || "Failed to validate uploaded files.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCreative = useCallback((creative) => {
    if (!creative.url) return;
    const a = document.createElement("a");
    a.href = creative.url;
    a.download = `${creative.name || "creative"}.${creative.url.startsWith("data:image/png") ? "png" : creative.url.startsWith("data:image/gif") ? "gif" : "jpg"}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    addToast(`Downloaded: ${creative.name}`, "success");
  }, [addToast]);

  const removeCreative = async (id) => {
    setCreatives((prev) => prev.filter((c) => c.id !== id));
    try {
      const user = await getUser();
      if (user) await supabase.from("creatives").delete().eq("id", id).eq("user_id", user.id);
    } catch (e) { console.error("removeCreative error:", e); }
  };

  const handleCreativeUpdate = useCallback((id, updates) => {
    setCreatives((prev) => {
      return prev.map((c) => {
        if (c.id !== id) return c;
        if (!originalBackups[id]) setOriginalBackups((b) => ({ ...b, [id]: { ...c } }));
        const updated = { ...c, ...updates, valid: allowedSizes.includes(updates.size || c.size) };
        saveToSupabase(updated);
        return updated;
      });
    });
  }, [originalBackups, allowedSizes]);

  const startEdit = (id, currentName) => { setEditingId(id); setEditingName(currentName); };
  const saveEdit = (id) => {
    setCreatives(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(c => c.id === id);
      if (idx !== -1) arr[idx].name = editingName;
      return arr;
    });
    setEditingId(null);
  };

  const runAnalysis = useCallback(async () => {
    if (validCreatives.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }
    if (!campaignGoal || !platform || !campaignVertical) { addToast("Missing configuration.", "error"); return; }

    setAnalysisLoading(true); setAnalysisResult(null);
    try {
      const results = await analyzeAllCreatives(validCreatives, campaignGoal, platform, campaignVertical);
      setAnalysisResult(results);
      if (results.length > 0 && results[0].data.recommendedTemplates?.length > 0) {
        setSelectedTemplate(results[0].data.recommendedTemplates[0]);
      }
      addToast(`Analyzed ${results.length} creative${results.length !== 1 ? "s" : ""} ✨`, "success");
    } catch (err) {
      addToast(err.message || "Analysis failed.", "error");
    } finally {
      setAnalysisLoading(false);
    }
  }, [validCreatives, campaignGoal, platform, campaignVertical, addToast]);

  const handleGoalChange = (newGoal) => {
    setCampaignGoal(newGoal);
  };

  const handleDownloadReport = useCallback(async () => {
    if (!analysisResult) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: 'a4', unit: 'pt' });

      const setBg = () => { doc.setFillColor(15, 23, 42); doc.rect(0, 0, 595.28, 841.89, 'F'); };
      setBg();

      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("Adigator Creative Analysis Report", 40, 55);

      doc.setFontSize(12); doc.setTextColor(203, 213, 225);
      doc.text(`Platform: ${(platform || '').toUpperCase()} | Goal: ${(campaignGoal || '').toUpperCase()}`, 40, 80);
      doc.text(`Date: ${new Date().toLocaleString()}`, 40, 98);

      const sorted = [...analysisResult].sort((a, b) => b.data.overall_score - a.data.overall_score);

      doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.text("Creative Ranking", 40, 130);

      let currentY = 152;
      sorted.forEach((res, rank) => {
        const score = res.data.overall_score;
        if (score >= 70) doc.setTextColor(74, 222, 128);
        else if (score >= 45) doc.setTextColor(250, 204, 21);
        else doc.setTextColor(248, 113, 113);

        doc.setFontSize(13);
        doc.text(`${rank === 0 ? "1st" : rank === 1 ? "2nd" : rank === 2 ? "3rd" : `#${rank + 1}`}. ${res.creative.name} — ${score}/100`, 40, currentY);
        currentY += 16;

        doc.setFontSize(10); doc.setTextColor(148, 163, 184);
        let verdict = "";
        if (score >= 80) verdict = `"${res.creative.name}" is perfect and strongly aligned with all standards.`;
        else if (score >= 65) verdict = `"${res.creative.name}" meets most standards — minor improvements suggested.`;
        else if (score >= 45) verdict = `"${res.creative.name}" needs work — CTA alignment and visibility require attention.`;
        else verdict = `"${res.creative.name}" has critical issues — not recommended for launch without revisions.`;

        const lines = doc.splitTextToSize(verdict, 515);
        doc.text(lines, 50, currentY);
        currentY += lines.length * 14 + 4;

        if (currentY > 760) { doc.addPage(); setBg(); currentY = 40; }
      });

      for (const res of analysisResult) {
        doc.addPage(); setBg();
        doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text(`Creative: ${res.creative.name}`, 40, 48);

        let cy = 72;
        try { doc.addImage(res.creative.url, 40, cy, 200, 130); cy += 145; } catch (e) { }

        const s = res.data.overall_score;
        if (s >= 70) doc.setTextColor(74, 222, 128);
        else if (s >= 45) doc.setTextColor(250, 204, 21);
        else doc.setTextColor(248, 113, 113);

        doc.setFontSize(15); doc.text(`Score: ${s}/100`, 40, cy); cy += 20;

        doc.setTextColor(148, 163, 184); doc.setFontSize(11);
        doc.text(`Visibility: ${res.data.adVisibilityScore} | Goal Alignment: ${res.data.goalAlignmentIndicator} | CTA: ${res.data.cta_strength}`, 40, cy); cy += 16;
        doc.text(`Brightness: ${res.data.brightness} | Contrast: ${res.data.contrast}`, 40, cy); cy += 28;

        doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text("Suggestions:", 40, cy); cy += 18;
        doc.setTextColor(203, 213, 225); doc.setFontSize(11);
        (res.data.suggestions || []).forEach(sug => {
          const lines = doc.splitTextToSize(`• ${sug}`, 515);
          doc.text(lines, 40, cy); cy += lines.length * 14;
        });
      }

      doc.save("Campaign_Analysis_Report.pdf");
    } catch (err) { console.error(err); addToast("Failed to generate PDF", "error"); }
  }, [analysisResult, campaignGoal, platform, addToast]);

  const handleExportPptx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true); addToast("Generating PPTX...", "info");
    try {
      const { exportToPptx } = await import("../lib/exportPptx");
      const templateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Template";
      const filename = await exportToPptx(
        creatives.filter((c) => c.valid), 
        viewMode, 
        templateName,
        { goal: campaignGoal, platform }
      );
      addToast(`Downloaded: ${filename}`, "success");
    } catch (err) { addToast("Export failed.", "error"); }
    finally { setIsExporting(false); }
  }, [isExporting, creatives, viewMode, selectedTemplate, addToast]);

  // Reusable Buttons
  const NavBtn = ({ onClick, children, variant = "primary", disabled = false }) => {
    const base = "flex-1 py-3 px-6 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed";
    const bg = variant === "primary" ? "bg-linear-to-r from-blue-600 to-purple-600 text-white"
      : variant === "back" ? "bg-white/10 hover:bg-white/20 text-white"
        : "bg-linear-to-r from-green-600 to-emerald-600 text-white";
    return (
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} disabled={disabled} className={`${base} ${bg}`}>
        {children}
      </motion.button>
    );
  };

  const SelectionCard = ({ selected, onClick, children, activeClasses }) => (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={selected ? { boxShadow: ["0 0 0 rgba(168,85,247,0)", "0 0 22px rgba(168,85,247,0.25)", "0 0 0 rgba(168,85,247,0)"] } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
      transition={selected ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 bg-linear-to-br ${selected ? `${activeClasses} shadow-2xl` : "border-white/10 bg-white/5 hover:border-white/25"
        }`}>
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Adigator Creative Studio
          </h1>
          <div className="hidden lg:flex items-center gap-1 text-xs">
            {STEP_LABELS.map((label, idx) => (
              <div key={idx} className="flex items-center">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition-all ${step === idx + 1 ? "bg-purple-500/30 text-purple-300" : step > idx + 1 ? "text-green-400" : "text-gray-600"
                  }`}>
                  {step > idx + 1 ? "✓" : `${idx + 1}.`} {label}
                </div>
                {idx < STEP_LABELS.length - 1 && <span className="text-white/15 mx-0.5">›</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full origin-left bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: step / TOTAL_STEPS }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <AnimatePresence mode="wait">

          {/* STEP 1: SETUP CAMPAIGN */}
          {step === 1 && (
            <motion.div key="step-1" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-12 pb-28">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 1: Setup Campaign</h2>
                <p className="text-gray-400">Configure platform, goal, and audience before uploading creatives.</p>
              </div>

              <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Selected Setup</p>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                  <p className="text-gray-300">Platform: <span className="text-white font-semibold">{platform}</span></p>
                  <p className="text-gray-300">Goal: <span className="text-white font-semibold">{campaignGoal}</span></p>
                  <p className="text-gray-300">Vertical: <span className="text-white font-semibold">{campaignVertical ? VERTICALS.find(v => v.id === campaignVertical)?.title : "None"}</span></p>
                </div>
              </motion.div>


              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">Choose Platform</h3>
                  <p className="mt-1 text-gray-400">Where will these ads run? This determines size validation and best practices.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PLATFORMS.map((p) => (
                    <SelectionCard key={p.id} selected={platform === p.id} onClick={() => handlePlatformSelect(p.id)} activeClasses={`${p.color} ${p.border}`}>
                      <div className="text-5xl mb-4">{p.icon}</div>
                      <h3 className={`text-2xl font-extrabold mb-2 ${platform === p.id ? "text-white" : "text-gray-200"}`}>{p.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-4">{p.desc}</p>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white/70 uppercase">Supported Sizes:</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">Desktop: {p.desktop.length}</span>
                          <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">Mobile: {p.mobile.length}</span>
                          <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">Native: {p.native.length}</span>
                          {[...p.desktop.slice(0, 2), ...p.mobile.slice(0, 2), ...p.native.slice(0, 2)].map(s => (
                            <span key={s} className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">{s}</span>
                          ))}
                        </div>
                      </div>
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section ref={goalSectionRef} variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">Campaign Goal</h3>
                  <p className="mt-1 text-gray-400">Select your objective to guide the AI analysis.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {GOALS.map((g) => (
                    <SelectionCard key={g.id} selected={campaignGoal === g.id} onClick={() => handleGoalSelect(g.id)} activeClasses={`${g.color} ${g.border}`}>
                      <div className="text-5xl mb-4">{g.emoji}</div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">{g.subtitle}</p>
                      <h3 className={`text-2xl font-extrabold mb-2 ${campaignGoal === g.id ? "text-white" : "text-gray-200"}`}>{g.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-6">{g.desc}</p>
                      {campaignGoal === g.id && (
                        <div className="bg-white/10 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-gray-300 uppercase mb-2">Recommended CTAs:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {GOAL_CTA[g.id].map(cta => (
                              <span key={cta} className="px-2 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/30 rounded text-[10px]">{cta}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </SelectionCard>
                  ))}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white">Industry Vertical</h3>
                  <p className="mt-1 text-gray-400">Select the vertical for your campaign.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {VERTICALS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setCampaignVertical(v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        campaignVertical === v.id
                          ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </motion.section>

              <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/85 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-7xl gap-4 px-6 py-4 md:px-10">
                  <NavBtn variant="back" onClick={goBack}>
                    ← Back
                  </NavBtn>
                  <NavBtn
                    onClick={goNext}
                    disabled={!platform || !campaignGoal || !campaignVertical}
                  >
                    Upload Creatives →
                  </NavBtn>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: UPLOAD & VALIDATE */}
          {step === 2 && (
            <motion.div key="step-2" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 2: Upload & Validate</h2>
                <p className="text-gray-400">
                  {selectedPlatformConfig?.title} size intelligence active: {allowedSizes.length} supported display sizes across desktop, mobile, and native.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-white">Supported Display Sizes</h3>
                  <p className="text-xs text-purple-200/90 bg-purple-500/15 border border-purple-500/25 rounded-full px-3 py-1">
                    Display Programmatic Only • IAB Compatible Matrix
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-blue-500/25 bg-blue-500/8 p-4">
                    <p className="text-xs uppercase tracking-wider text-blue-300 font-bold mb-3">Desktop Display</p>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORTED_DISPLAY_SIZE_GROUPS.desktop.map((size) => (
                        <span key={`desktop-${size}`} className="px-2 py-1 rounded-md bg-white/10 text-[11px] text-blue-100 border border-white/10">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-500/25 bg-purple-500/8 p-4">
                    <p className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-3">Mobile Display</p>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORTED_DISPLAY_SIZE_GROUPS.mobile.map((size) => (
                        <span key={`mobile-${size}`} className="px-2 py-1 rounded-md bg-white/10 text-[11px] text-purple-100 border border-white/10">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/8 p-4">
                    <p className="text-xs uppercase tracking-wider text-fuchsia-300 font-bold mb-3">Native / Feed Display</p>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORTED_DISPLAY_SIZE_GROUPS.native.map((size) => (
                        <span key={`native-${size}`} className="px-2 py-1 rounded-md bg-white/10 text-[11px] text-fuchsia-100 border border-white/10">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">DSP Compatibility Intelligence</p>
                  <div className="flex flex-wrap gap-2">
                    {DSP_PARTNERS.map((dsp) => (
                      <span key={dsp} className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200">
                        {dsp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                className={`relative rounded-3xl border-2 border-dashed transition-all p-12 text-center cursor-pointer ${drag ? "border-purple-500 bg-purple-500/10" : "border-white/20 bg-white/5 hover:border-purple-400"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud size={48} className="mx-auto mb-4 text-purple-400" />
                <h3 className="text-2xl font-bold text-white mb-2">{drag ? "Drop files here" : "Upload Creatives"}</h3>
                <p className="text-gray-400 mb-6 text-sm">or click to browse your computer</p>
                <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
              </div>

              {isLoading && (
                <div className="text-center py-4"><div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
              )}

              {/* Validation Summary Stats */}
              {creatives.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-blue-400">{creatives.length}</p>
                    <p className="text-sm text-gray-400 mt-1">Total</p>
                  </div>
                  <div className="bg-linear-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-400">{validCreatives.length}</p>
                    <p className="text-sm text-gray-400 mt-1">Ready</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-400">{validationSummary.warningCount}</p>
                    <p className="text-sm text-gray-400 mt-1">Warnings</p>
                  </div>
                  <div className="bg-linear-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-400">{validationSummary.criticalCount}</p>
                    <p className="text-sm text-gray-400 mt-1">Critical</p>
                  </div>
                </div>
              )}

              {validationResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{validationSummary.totalIssues}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Issues</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:col-span-3">
                    <p className="text-2xl font-bold text-cyan-300">{validationSummary.inventoryImpactScore}/100</p>
                    <p className="text-sm text-gray-400 mt-1">Inventory Impact Score</p>
                  </div>
                </div>
              )}

              {/* Valid List */}
              {validCreatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Valid Creatives</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {validCreatives.map((creative) => (
                      <div key={creative.id} className="flex flex-col gap-1">
                        <CreativeCard creative={creative} onRemove={removeCreative} />
                        {editingId === creative.id ? (
                          <div className="flex gap-1 mt-1">
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(creative.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 min-w-0 bg-white/10 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                            <button onClick={() => saveEdit(creative.id)} className="px-2 py-1 bg-purple-600 rounded-lg text-xs text-white">✓</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(creative.id, creative.name)} className="text-left flex items-center gap-1 mt-1 group/rn">
                            <span className="text-xs text-gray-400 truncate group-hover/rn:text-purple-300">{creative.name}</span>
                            <span className="text-[10px] text-gray-600 group-hover/rn:text-purple-400">✏️</span>
                          </button>
                        )}
                        <button onClick={() => downloadCreative(creative)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5 mt-1">
                          <Download size={12} /> Download
                        </button>
                        {creative.validation?.issues?.length > 0 && (
                          <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
                            <p className="text-[11px] font-semibold text-amber-300">
                              {creative.validation.status} • {creative.validation.issues.length} issue{creative.validation.issues.length > 1 ? "s" : ""}
                            </p>
                            <div className="mt-2 space-y-1.5">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <div key={`${creative.id}-issue-${idx}`} className="rounded-md border border-white/10 bg-black/15 p-1.5">
                                  <p className="text-[10px] text-amber-100 font-semibold uppercase tracking-wide">
                                    {issue.severity} • {issue.type}
                                  </p>
                                  <p className="text-[10px] text-amber-100/90 mt-0.5 leading-snug">{issue.message}</p>
                                  <p className="text-[10px] text-amber-200/80 mt-0.5 leading-snug">Fix: {issue.recommendation}</p>
                                </div>
                              ))}
                              {creative.validation.issues.length > 3 && (
                                <p className="text-[10px] text-amber-200/80">+{creative.validation.issues.length - 3} more issue(s)</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid List */}
              {invalidCreatives.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2"><XCircle className="text-red-500" /> Critical Creatives (Fix Before Analysis)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {invalidCreatives.map((creative) => {
                      return (
                        <div key={creative.id} className="space-y-2">
                          <CreativeCard creative={creative} onEdit={(c) => setEditModalCreative(c)} onRemove={removeCreative} />
                          {creative.validation?.issues?.length > 0 && (
                            <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-2">
                              {creative.validation.issues.slice(0, 3).map((issue, idx) => (
                                <div key={`${creative.id}-critical-issue-${idx}`} className="mb-1.5 last:mb-0 rounded-md border border-white/10 bg-black/15 p-1.5">
                                  <p className="text-[10px] text-red-200 font-semibold uppercase tracking-wide">
                                    {issue.severity} • {issue.type}
                                  </p>
                                  <p className="text-[10px] text-red-100 mt-0.5 leading-snug">{issue.message}</p>
                                  <p className="text-[10px] text-red-200/80 mt-0.5 leading-snug">Fix: {issue.recommendation}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {validationSummary.warningCount > 0 && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="text-amber-300 mt-0.5" size={18} />
                  <p className="text-sm text-amber-100">
                    {validationSummary.warningCount} creative{validationSummary.warningCount > 1 ? "s have" : " has"} non-blocking warning{validationSummary.warningCount > 1 ? "s" : ""}. You can continue to analysis.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn onClick={goNext} disabled={uploadedCreatives.length === 0}>Next: AI Analysis →</NavBtn>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI ANALYSIS */}
          {step === 3 && (
            <motion.div key="step-3" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 3: AI Analysis</h2>
                <p className="text-gray-400">Analyze your creatives against {PLATFORMS.find(p => p.id === platform)?.title} standards.</p>
              </div>

              {!analysisResult && !analysisLoading && (
                <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 text-center">
                  <div className="w-20 h-20 mb-6 bg-linear-to-br from-fuchsia-500/20 to-purple-600/20 rounded-full flex items-center justify-center border border-fuchsia-500/30">
                    <span className="text-4xl">🧠</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Ready to Analyze</h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-md">
                    We will run 6 core checks and platform-specific metrics for <strong>{validCreatives.length} valid creative(s)</strong>.
                  </p>
                  <NavBtn onClick={runAnalysis} className="px-8 shadow-lg shadow-purple-500/30">Run Full Analysis ✨</NavBtn>
                </div>
              )}

              {analysisLoading && (
                <div className="py-10 space-y-4">
                  <p className="text-gray-300 text-sm">Analyzing {validCreatives.length} creatives with deterministic engine...</p>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
                    <div className="h-5 w-40 bg-white/10 rounded mb-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                      <div className="h-20 bg-white/10 rounded-xl" />
                    </div>
                    <div className="h-32 bg-white/10 rounded-xl mb-3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="h-28 bg-white/10 rounded-xl" />
                      <div className="h-28 bg-white/10 rounded-xl" />
                      <div className="h-28 bg-white/10 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              {analysisResult && !analysisLoading && (
                <>
                  <AnalysisPanel
                    analysisResult={analysisResult}
                    campaignGoal={campaignGoal}
                    platform={platform}
                    onDownloadReport={handleDownloadReport}
                    onGoalChange={handleGoalChange}
                  />
                </>
              )}

              <div className="flex gap-4 pt-6">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn onClick={goNext}>Next: Preview Studio →</NavBtn>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PREVIEW STUDIO */}
          {step === 4 && (
            <motion.div key="step-4" variants={itemVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Step 4: Preview Studio</h2>
                  <p className="text-gray-400">See your creatives in realistic interactive website contexts.</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPptx} disabled={isExporting}
                  className="px-8 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60">
                  <Download size={20} /> {isExporting ? "Exporting..." : "Export PPTX"}
                </motion.button>
              </div>

              {validCreatives.length > 0 && (
                <ContextualPreviewEngine
                  creativeUrl={validCreatives[0].url}
                  creativeSize={validCreatives[0].size}
                  vertical={campaignVertical || "general"}
                  goal={campaignGoal || "awareness"}
                  analyzerOutput={analysisResult?.[0]?.data ?? {}}
                  ctaText={analysisResult?.[0]?.data?.cta?.text ?? ""}
                  headline={analysisResult?.[0]?.data?.headline ?? ""}
                />
              )}

              {validCreatives.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white/3 border border-white/10 rounded-2xl">
                  <span className="text-4xl mb-4">🌐</span>
                  <p className="text-white font-semibold">No valid creatives to preview</p>
                  <p className="text-gray-400 text-sm mt-1">Upload and validate a creative in step 2 first.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <NavBtn variant="back" onClick={goBack}>← Back</NavBtn>
                <NavBtn variant="success" onClick={handleExportPptx} disabled={isExporting} className="flex justify-center items-center gap-2">
                  <Download size={20} /> {isExporting ? "Generating..." : "Download PPTX"}
                </NavBtn>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {editModalCreative && (
        <EditCreativeModal
          creative={editModalCreative}
          onApply={handleCreativeUpdate}
          onClose={() => setEditModalCreative(null)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
