"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Download,
  Eye,
  FlaskConical,
  Monitor,
  Smartphone,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import {
  compareStrategicEntries,
  getCreativeStatusLabel,
  getEntryPayload,
  getExtractionSignals,
  getGoalAlignment,
  getStrategicAlignmentScore,
  getStrategicFlow,
  getValidatedRecommendations,
  getVerticalAlignment,
  isValidStrategicPayload,
  getBehavioralResponse,
} from "../lib/strategicPresentation";

const VERTICAL_LABELS = {
  healthcare: "Healthcare",
  technology: "Technology",
  automotive: "Automotive",
  news_media: "News / Media",
  sports: "Sports",
  finance: "Business / Finance",
  luxury: "Luxury",
  travel: "Travel",
  hotels: "Hotels",
  food: "Restaurants / Food",
  banking: "Banking / FinTech",
  real_estate: "Real Estate",
  education: "Education / EdTech",
  gaming: "Gaming",
  entertainment: "Entertainment / OTT",
  ecommerce: "E-commerce / Retail",
  unknown: "Unknown",
};

const GOAL_LABELS = {
  awareness: "Awareness",
  consideration: "Consideration",
  conversion: "Conversion",
};

function labelVertical(id) {
  if (!id) return "Unknown";
  return VERTICAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

function getVerticalStrategyProfile(vertical) {
  const key = String(vertical || "").toLowerCase();

  const profiles = {
    food: {
      lens: "sensory appetite and impulse",
      pressure: "appetite-driven urgency",
      anchor: "taste, craving, and immediacy",
      caution: "Avoid turning the ad into a generic offer blast.",
    },
    automotive: {
      lens: "identity, ownership pride, and status",
      pressure: "identity-led consideration",
      anchor: "aspiration, design, and lifestyle signaling",
      caution: "Avoid collapsing the message into retail-style transaction language.",
    },
    fashion: {
      lens: "self-expression and social perception",
      pressure: "style-led intent",
      anchor: "fit, trend alignment, and visual confidence",
      caution: "Avoid sounding like a coupon-driven commerce ad.",
    },
    saas: {
      lens: "clarity, credibility, and efficiency",
      pressure: "friction-sensitive evaluation",
      anchor: "proof, workflow value, and trust",
      caution: "Avoid overloading the message with hype or urgency.",
    },
    finance: {
      lens: "risk, certainty, and credibility",
      pressure: "risk-managed decision making",
      anchor: "security, clarity, and confidence",
      caution: "Avoid language that raises uncertainty without adding proof.",
    },
    education: {
      lens: "future outcome and career lift",
      pressure: "future-state consideration",
      anchor: "growth, authority, and progression",
      caution: "Avoid sounding like a hard-sell recruitment ad.",
    },
    ecommerce: {
      lens: "value, convenience, and purchase momentum",
      pressure: "transaction-ready intent",
      anchor: "product utility and offer clarity",
      caution: "Avoid generic messaging that hides the actual offer.",
    },
  };

  return profiles[key] || {
    lens: "relevance and category fit",
    pressure: "campaign-stage alignment",
    anchor: "brand meaning and value clarity",
    caution: "Avoid using a one-size-fits-all psychology pattern.",
  };
}

function firstSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  const match = value.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] || value).trim();
}

function truncateText(text, maxLength) {
  const value = String(text || "").trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildStrategistNarrative({
  goalAlignment,
  verticalAlignment,
  extractionSignals,
  behavioral,
  flow,
  campaignGoal,
  campaignVertical,
  recommendations,
}) {
  const verticalProfile = getVerticalStrategyProfile(verticalAlignment?.selected_vertical || campaignVertical);
  const selectedGoal = labelGoal(goalAlignment?.selected_goal || campaignGoal || "awareness");
  const selectedVertical = labelVertical(verticalAlignment?.selected_vertical || campaignVertical || "unknown");
  const detectedGoal = labelGoal(goalAlignment?.detected_goal || "unknown");
  const detectedVertical = labelVertical(verticalAlignment?.detected_vertical || "unknown");

  const headline = extractionSignals?.headline?.trim() || "headline unavailable";
  const cta = extractionSignals?.cta?.trim() || "CTA unavailable";
  const imageMeaning = extractionSignals?.topic_summary?.trim() || extractionSignals?.dominant_visual_cue?.trim() || "image meaning unavailable";
  const visualHierarchy = firstSentence(flow?.attentionAnalysis?.attention_path) || "scan flow signal is limited";
  const firstFocus = flow?.attentionAnalysis?.first_focus?.trim() || "primary focus is unclear";
  const emotionalTone = firstSentence(behavioral?.emotional_state) || "emotional tone is unclear";
  const commitmentPressure = firstSentence(behavioral?.commitment_pressure) || "commitment pressure signal unavailable";
  const curiosity = firstSentence(behavioral?.curiosity_vs_intent_balance) || "curiosity-intent signal unavailable";
  const trust = firstSentence(behavioral?.trust_gap) || "trust signal unavailable";
  const hesitation = firstSentence(behavioral?.likely_objection) || "hesitation signal unavailable";
  const readiness = firstSentence(behavioral?.commitment_readiness) || "readiness signal unavailable";
  const brandPresence = extractionSignals?.brand_presence || "unknown";
  const persuasionStyle = extractionSignals?.persuasion_style || "general persuasion";

  const mismatchReasons = [];
  if (goalAlignment?.is_aligned === false) mismatchReasons.push("goal mismatch");
  if (verticalAlignment?.is_aligned === false) mismatchReasons.push("vertical mismatch");

  const ctaText = cta.toLowerCase();
  const aggressiveCta = /(shop now|buy now|sign up|book now|claim|download now|get started|apply now)/i.test(ctaText);
  if (aggressiveCta && selectedGoal.toLowerCase() === "awareness") mismatchReasons.push("premature CTA pressure");

  const urgencySignal = /(limited|hurry|last chance|today|ends|only now|offer)/i.test(`${headline} ${cta}`);
  if (urgencySignal && selectedGoal.toLowerCase() !== "conversion") mismatchReasons.push("urgency-stage mismatch");

  if (/guarded|cautious|skeptic|hesitat|resist/i.test(emotionalTone)) mismatchReasons.push("emotional readiness mismatch");

  if (goalAlignment?.detected_goal && goalAlignment?.selected_goal && goalAlignment.detected_goal !== goalAlignment.selected_goal) {
    mismatchReasons.push("audience stage mismatch");
  }

  const issueLine = mismatchReasons.length > 0
    ? mismatchReasons.join(", ")
    : "a strategy-to-creative gap";

  const fixSuggestion = firstSentence(recommendations?.[0]?.recommended_change) ||
    `Reframe the headline around ${selectedVertical.toLowerCase()} identity, ease CTA pressure, and move brand meaning ahead of action.`;

  const useCaseCue = verticalProfile.anchor;

  return {
    coreProblem: truncateText(`Creative behaves like ${detectedGoal.toLowerCase()}-stage ${detectedVertical.toLowerCase()} advertising instead of ${selectedGoal.toLowerCase()} ${selectedVertical.toLowerCase()} storytelling.`, 170),
    whyItHappens: truncateText(`The eye path starts with ${visualHierarchy.toLowerCase()} and lands on ${firstFocus}, so "${headline}" and "${cta}" pull attention into action before ${useCaseCue} is established.`, 175),
    businessRisk: truncateText(`This may reduce engagement quality for ${selectedGoal.toLowerCase()} traffic and weaken launch readiness when the campaign needs a cleaner story-to-action sequence.`, 175),
    exactFix: truncateText(`Delay the CTA "${cta}" until the headline and image establish ${verticalProfile.anchor}; then tighten the hierarchy around ${fixSuggestion}.`, 185),
  };
}

function buildAudienceInterpretation({
  headline,
  cta,
  visualDescription,
  stage,
  vertical,
  goalAlignment,
  verticalAlignment,
}) {
  const stageLabel = labelGoal(stage || "awareness");
  const verticalLabel = labelVertical(vertical || "unknown");
  const detectedGoal = labelGoal(goalAlignment?.detected_goal || stage || "unknown");
  const detectedVertical = labelVertical(verticalAlignment?.detected_vertical || vertical || "unknown");
  const aggressiveCta = /(shop now|buy now|order now|sign up|book now|apply now|get started|claim now|download now|reserve now|purchase now)/i.test(String(cta || ""));
  const urgencySignal = /(limited|today|now|offer|ends|last chance|discount|sale|save)/i.test(`${headline} ${cta}`);
  const visualCue = firstSentence(visualDescription) || "the visual";

  const likelyInterpretation = truncateText(
    goalAlignment?.is_aligned === false || verticalAlignment?.is_aligned === false
      ? `This creative reads as ${detectedGoal.toLowerCase()}-stage ${detectedVertical.toLowerCase()} advertising, not ${stageLabel.toLowerCase()} ${verticalLabel.toLowerCase()} messaging.`
      : `This creative reads as ${stageLabel.toLowerCase()} ${verticalLabel.toLowerCase()} messaging, with ${visualCue.toLowerCase()} carrying the main meaning.`,
    170,
  );

  const readinessStage = truncateText(
    stageLabel === "Awareness"
      ? (aggressiveCta || urgencySignal
        ? "Cold audiences see a conversion ask before trust is built."
        : "Cold audiences can read the idea, but they still need a clearer reason to care.")
      : stageLabel === "Conversion"
        ? "The creative matches a late-stage decision moment if the proof is strong enough."
        : "The creative sits in a middle stage where clarity and proof still need to do more work.",
    150,
  );

  const trustPerception = truncateText(
    goalAlignment?.is_aligned === false || verticalAlignment?.is_aligned === false
      ? `Trust feels thin because ${headline ? `"${headline}"` : "the headline"} and ${cta ? `"${cta}"` : "the CTA"} push intent before the campaign story is stable.`
      : `Trust feels steadier because the message and action are pointing in the same direction.`,
    170,
  );

  const likelyAudienceReaction = truncateText(
    aggressiveCta && stageLabel === "Awareness"
      ? "Cold audiences are likely to bounce or skip because the ad asks for action before it earns attention."
      : verticalAlignment?.is_aligned === false
        ? "Audiences will likely pause, feel the mismatch, and move on without seeing the creative as relevant."
        : "Audiences are more likely to scan, understand, and keep moving toward the next step.",
    155,
  );

  return {
    likelyInterpretation,
    readinessStage,
    trustPerception,
    likelyAudienceReaction,
  };
}
function labelGoal(id) {
  if (!id) return "Unknown";
  return GOAL_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

function AlignmentBadge({ isAligned }) {
  if (isAligned === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
        <CheckCircle size={11} /> Aligned
      </span>
    );
  }
  if (isAligned === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/40 px-2.5 py-0.5 text-xs font-bold text-red-300">
        <XCircle size={11} /> Not Aligned
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-500/15 border border-slate-500/30 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
      Unknown
    </span>
  );
}

function statusColor(label) {
  if (label === "Strong Alignment") return "text-emerald-300";
  if (label === "Moderate Risk") return "text-amber-300";
  if (label === "Misaligned") return "text-red-300";
  return "text-slate-400";
}

function scoreTone(score) {
  if (!Number.isFinite(score)) return "text-slate-300";
  if (score >= 70) return "text-emerald-300";
  if (score >= 45) return "text-amber-300";
  return "text-red-300";
}

function getEngagementBand(score) {
  if (!Number.isFinite(score)) return "UNKNOWN";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function buildFallbackAbTests(recommendations = []) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return [];
  return recommendations.slice(0, 3).map((rec, i) => ({
    dimension: rec.issue || `Hypothesis ${i + 1}`,
    variant_a: rec.why_it_hurts || "Current creative approach",
    variant_b: rec.recommended_change || "Test a revised creative treatment",
    expected_lift: rec.expected_outcome || "Expected improvement after intervention",
  }));
}

function riskTone(text) {
  const value = String(text || "").toLowerCase();
  if (value.includes("elevated") || value.includes("high") || value.includes("significant")) {
    return { label: "Attention Risk", className: "text-red-300" };
  }
  if (value.includes("moderate")) {
    return { label: "Moderate Risk", className: "text-amber-300" };
  }
  if (value) {
    return { label: "Stable", className: "text-emerald-300" };
  }
  return { label: "Unknown", className: "text-slate-300" };
}


function isLaunchReady(payload) {
  const score = getStrategicAlignmentScore(payload) ?? -1;
  const goalAligned = payload?.goal_alignment?.is_aligned !== false;
  const verticalAligned = payload?.vertical_alignment?.is_aligned !== false;
  return score >= 70 && goalAligned && verticalAligned;
}

function buildLayoutClarityAnalysis({ flow, extractionSignals, behavioral, campaignGoal, campaignVertical }) {
  const attention = flow?.attentionAnalysis || null;
  const headline = extractionSignals?.headline?.trim() || null;
  const cta = extractionSignals?.cta?.trim() || null;
  const dominantVisual = extractionSignals?.dominant_visual_cue?.trim() || null;
  const brandPresence = extractionSignals?.brand_presence || "unknown";

  const firstFocus = attention?.first_focus || (headline ? "headline" : dominantVisual ? "image" : "primary visual");
  const path = attention?.attention_path || "Attention path signal is limited for this creative.";
  const frictionPoints = Array.isArray(attention?.friction_points) ? attention.friction_points.filter(Boolean) : [];
  const ctaVisibility = attention?.cta_visibility || "CTA visibility signal is unavailable.";
  const mobileRisk = attention?.mobile_attention_risk || "Mobile attention risk is not available.";
  const retentionRisk = attention?.attention_retention_risk || "Retention risk is not available.";
  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");

  const flowLine = attention?.attention_path || `Eye path likely starts at the ${headline ? "headline" : dominantVisual ? "visual" : "main message"}, then checks the supporting image, then lands on the CTA.`;
  const focusLabel = firstFocus === "headline" ? "headline area" : `${String(firstFocus).charAt(0).toUpperCase()}${String(firstFocus).slice(1)} area`;

  return {
    flowLine,
    focusLine: `${focusLabel}${headline ? ` (headline: "${headline}")` : ""}`,
  };
}

function FieldBlock({ label, value, accent = "slate" }) {
  if (!value) return null;
  const accents = {
    slate: "border-white/10 bg-slate-950/40",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    red: "border-red-500/20 bg-red-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };
  const labelColors = {
    slate: "text-slate-500",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };
  return (
    <div className={`rounded-lg border p-2.5 ${accents[accent] || accents.slate}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${labelColors[accent] || labelColors.slate}`}>
        {label}
      </p>
      <p className="text-xs text-slate-100 leading-relaxed">{value}</p>
    </div>
  );
}

export default function AnalysisPanel({
  analysisResult,
  campaignGoal,
  campaignVertical,
  platform,
  viewerName,
  onDownloadReport,
}) {
  const strategicEntries = useMemo(() => {
    return Array.isArray(analysisResult) ? analysisResult : [];
  }, [analysisResult]);

  const sorted = useMemo(() => {
    return [...strategicEntries].sort(compareStrategicEntries);
  }, [strategicEntries]);

  const [selectedId, setSelectedId] = useState(() => sorted[0]?.creative?.id || null);
  const [analysisTab, setAnalysisTab] = useState("overview");
  const [utilityTab, setUtilityTab] = useState("score-card");
  const [showAlignmentDetails, setShowAlignmentDetails] = useState(false);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-100">
        <p className="text-sm font-semibold">Strategic analysis partially unavailable</p>
        <p className="mt-2 text-xs text-amber-200">
          Available intelligence will render where possible.
        </p>
      </div>
    );
  }

  // Selected creative data
  const selected = sorted.find((e) => e.creative.id === selectedId) || sorted[0];
  const data = getEntryPayload(selected) || {};
  const flow = getStrategicFlow(data);
  const behavioral = getBehavioralResponse(data);
  const recommendations = getValidatedRecommendations(data);
  const strategicScore = getStrategicAlignmentScore(data);
  const goalAlignment = getGoalAlignment(data);
  const verticalAlignment = getVerticalAlignment(data);
  const extractionSignals = getExtractionSignals(data);
  const layoutClarity = buildLayoutClarityAnalysis({
    flow,
    extractionSignals,
    behavioral,
    campaignGoal,
    campaignVertical,
  });
  const engagementBand = getEngagementBand(strategicScore);
  const strategistNarrative = buildStrategistNarrative({
    goalAlignment,
    verticalAlignment,
    extractionSignals,
    behavioral,
    flow,
    campaignGoal,
    campaignVertical,
    recommendations,
  });
  const abHypotheses = Array.isArray(data?.ab_hypotheses) && data.ab_hypotheses.length > 0
    ? data.ab_hypotheses.slice(0, 3)
    : buildFallbackAbTests(recommendations);
  const desktopRisk = riskTone(flow?.attentionAnalysis?.attention_retention_risk);
  const mobileRisk = riskTone(flow?.attentionAnalysis?.mobile_attention_risk);
  const readyEntries = sorted.filter((entry) => isLaunchReady(getEntryPayload(entry) || {}));
  const readyCount = readyEntries.length;
  const totalCount = sorted.length;
  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const launchReadinessText = readyCount === 1
    ? `${readyEntries[0]?.creative?.name || "1 creative"} is ready to launch.`
    : `${readyCount} out of ${totalCount} creatives are ready to launch.`;
  const launchReadinessTone = readyCount === 0
    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : readyCount === totalCount
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";

  const audienceInterpretation = buildAudienceInterpretation({
    headline: extractionSignals?.headline || "",
    cta: extractionSignals?.cta || "",
    visualDescription: extractionSignals?.topic_summary || extractionSignals?.dominant_visual_cue || "",
    stage: goalAlignment?.selected_goal || campaignGoal || "awareness",
    vertical: verticalAlignment?.selected_vertical || campaignVertical || "unknown",
    goalAlignment,
    verticalAlignment,
  });

  const strategistSummary = buildStrategistNarrative({
    goalAlignment,
    verticalAlignment,
    extractionSignals,
    behavioral,
    flow,
    campaignGoal,
    campaignVertical,
    recommendations,
  });
  const selectedVerticalLabel = labelVertical(
    verticalAlignment?.selected_vertical || campaignVertical || "unknown"
  );
  const detectedBusinessCategory = labelVertical(
    verticalAlignment?.detected_vertical || extractionSignals?.detected_vertical || "unknown"
  );
  const productOrService =
    (typeof extractionSignals?.product_service_label === "string" && extractionSignals.product_service_label.trim())
      ? extractionSignals.product_service_label.trim()
      : "—";

  // Calculate alignment statistics for all creatives
  const alignmentStats = useMemo(() => {
    const verticalAligned = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      const va = getVerticalAlignment(payload);
      return va?.is_aligned === true;
    });
    const goalAligned = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      const ga = getGoalAlignment(payload);
      return ga?.is_aligned === true;
    });

    return {
      verticalAligned: verticalAligned.length,
      // Only count explicit false — null (inconclusive) is not a mismatch
      verticalMisaligned: sorted.filter((entry) => {
        const payload = getEntryPayload(entry) || {};
        return getVerticalAlignment(payload)?.is_aligned === false;
      }).length,
      goalAligned: goalAligned.length,
      goalMisaligned: sorted.length - goalAligned.length,
      alignedDetails: sorted.map((entry) => ({
        creativeId: entry.creative?.id,
        creativeName: entry.creative?.name || "Untitled Creative",
        // Keep as tristate: true = aligned, false = misaligned, null = inconclusive
        verticalIsAligned: getVerticalAlignment(getEntryPayload(entry) || {})?.is_aligned ?? null,
        goalAligned: getGoalAlignment(getEntryPayload(entry) || {})?.is_aligned === true,
      })),
    };
  }, [sorted]);

  const topSummaryStats = useMemo(() => {
    const goalMisaligned = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      return getGoalAlignment(payload)?.is_aligned === false;
    }).length;

    const verticalMisaligned = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      return getVerticalAlignment(payload)?.is_aligned === false;
    }).length;

    const highestAlignedEntry = sorted.reduce((best, entry) => {
      const payload = getEntryPayload(entry) || {};
      const score = getStrategicAlignmentScore(payload);
      if (!best || score > best.score) {
        return {
          score,
          creativeName: entry?.creative?.name || "Untitled Creative",
          status: getCreativeStatusLabel(payload),
        };
      }
      return best;
    }, null);

    const scoreValues = sorted
      .map((entry) => getStrategicAlignmentScore(getEntryPayload(entry) || {}))
      .filter((score) => Number.isFinite(score));
    const bothAlignedCount = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      return payload?.goal_alignment?.is_aligned === true && payload?.vertical_alignment?.is_aligned === true;
    }).length;

    const cohesionScore = sorted.length > 0
      ? Math.round(
        ((scoreValues.length > 0 ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length : 0)
          + (bothAlignedCount / sorted.length) * 100) / 2,
      )
      : 0;

    const mixedVerticals = sorted
      .map((entry) => getVerticalAlignment(getEntryPayload(entry) || {})?.detected_vertical)
      .filter((value) => value && value !== "unknown");
    const verticalCounts = mixedVerticals.reduce((acc, vertical) => {
      acc[vertical] = (acc[vertical] || 0) + 1;
      return acc;
    }, {});
    const topMixedVertical = Object.entries(verticalCounts).sort((left, right) => right[1] - left[1])[0] || null;

    return {
      totalCreatives: sorted.length,
      strategicallyReady: readyCount,
      goalMisaligned,
      verticalMisaligned,
      highestAlignedEntry,
      cohesionScore,
      topMixedVertical,
    };
  }, [sorted, readyCount]);

  const campaignInsights = useMemo(() => {
    const aggressiveCtaCount = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      const cta = String(getExtractionSignals(payload)?.cta || "");
      return /(shop now|buy now|order now|sign up|book now|apply now|get started|claim now|download now|reserve now|purchase now)/i.test(cta);
    }).length;

    const discountLedCount = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      const text = `${getExtractionSignals(payload)?.headline || ""} ${getExtractionSignals(payload)?.cta || ""}`;
      return /(discount|save|sale|off|deal|limited|offer)/i.test(text);
    }).length;

    const uniqueVisuals = new Set(
      sorted
        .map((entry) => getExtractionSignals(getEntryPayload(entry) || {})?.dominant_visual_cue)
        .filter(Boolean),
    );

    const stageMismatchCount = sorted.filter((entry) => {
      const payload = getEntryPayload(entry) || {};
      return payload?.goal_alignment?.is_aligned === false;
    }).length;

    const verticalConflictText = topSummaryStats.topMixedVertical
      ? `${topSummaryStats.topMixedVertical[1]} creatives appear closer to ${labelVertical(topSummaryStats.topMixedVertical[0])} than ${verticalText}.`
      : `${topSummaryStats.verticalMisaligned} creatives do not match ${verticalText}.`;

    return [
      {
        title: "CTA Pressure",
        body: aggressiveCtaCount > 0
          ? `CTA pressure appears early in ${aggressiveCtaCount} creative${aggressiveCtaCount === 1 ? "" : "s"}.`
          : "CTA pressure is not dominating the current set.",
      },
      {
        title: "Discount Pattern",
        body: discountLedCount > 0
          ? `${discountLedCount} creative${discountLedCount === 1 ? "" : "s"} lean on discount-led persuasion.`
          : "Discount-led persuasion is not a dominant pattern.",
      },
      {
        title: "Visual Consistency",
        body: uniqueVisuals.size > 2
          ? `Visual language is fragmented across ${uniqueVisuals.size} different cues.`
          : "Visual language is relatively stable across the set.",
      },
      {
        title: "Stage Messaging",
        body: stageMismatchCount > 0
          ? `${stageMismatchCount} creative${stageMismatchCount === 1 ? "" : "s"} are pulling against the selected campaign stage.`
          : "Stage messaging is aligned across the current set.",
      },
      {
        title: "Vertical Bleed",
        body: verticalConflictText,
      },
    ];
  }, [sorted, topSummaryStats.topMixedVertical, verticalText, topSummaryStats.verticalMisaligned]);

  const greetingName = useMemo(() => {
    const normalized = String(viewerName || "").trim();
    return normalized || "Strategist";
  }, [viewerName]);

  const overviewProblemSummary = useMemo(() => {
    const identified = [];
    const resolved = [];

    if (topSummaryStats.goalMisaligned > 0) {
      identified.push(`${topSummaryStats.goalMisaligned} creative${topSummaryStats.goalMisaligned === 1 ? "" : "s"} with campaign-goal mismatch.`);
    }
    if (topSummaryStats.verticalMisaligned > 0) {
      identified.push(`${topSummaryStats.verticalMisaligned} creative${topSummaryStats.verticalMisaligned === 1 ? "" : "s"} with vertical mismatch.`);
    }
    if (topSummaryStats.topMixedVertical) {
      identified.push(`${topSummaryStats.topMixedVertical[1]} creative${topSummaryStats.topMixedVertical[1] === 1 ? "" : "s"} leaning toward ${labelVertical(topSummaryStats.topMixedVertical[0])}.`);
    }
    if (identified.length === 0) {
      identified.push("No critical campaign-level mismatch patterns detected.");
    }

    if (topSummaryStats.strategicallyReady > 0) {
      resolved.push(`${topSummaryStats.strategicallyReady} creative${topSummaryStats.strategicallyReady === 1 ? "" : "s"} currently marked ready to launch.`);
    }
    if (alignmentStats.goalAligned > 0) {
      resolved.push(`${alignmentStats.goalAligned} creative${alignmentStats.goalAligned === 1 ? "" : "s"} aligned to the ${goalText.toLowerCase()} objective.`);
    }
    if (alignmentStats.verticalAligned > 0) {
      resolved.push(`${alignmentStats.verticalAligned} creative${alignmentStats.verticalAligned === 1 ? "" : "s"} aligned to ${verticalText}.`);
    }
    if (resolved.length === 0) {
      resolved.push("No full strategic resolutions detected yet. Prioritize Creative Analysis for fixes.");
    }

    return { identified, resolved };
  }, [
    alignmentStats.goalAligned,
    alignmentStats.verticalAligned,
    goalText,
    topSummaryStats.goalMisaligned,
    topSummaryStats.strategicallyReady,
    topSummaryStats.topMixedVertical,
    topSummaryStats.verticalMisaligned,
    verticalText,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <button
          type="button"
          onClick={() => setAnalysisTab("overview")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            analysisTab === "overview"
              ? "bg-white/12 text-white border border-white/15"
              : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setAnalysisTab("creative-analysis")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            analysisTab === "creative-analysis"
              ? "bg-white/12 text-white border border-white/15"
              : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          Creative Analysis
        </button>
      </div>

      {analysisTab === "overview" ? (
        <>
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/55 via-violet-950/45 to-fuchsia-950/35 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">Overview Briefing</p>
              <h3 className="mt-2 text-xl font-black text-white">Welcome back, {greetingName}.</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Here is a campaign-level summary of the key problems identified and the strategic issues already resolved.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200/90">Problems Identified</p>
                  <div className="mt-2 space-y-2">
                    {overviewProblemSummary.identified.map((item) => (
                      <p key={item} className="text-sm leading-relaxed text-rose-100">- {item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Problems Resolved</p>
                  <div className="mt-2 space-y-2">
                    {overviewProblemSummary.resolved.map((item) => (
                      <p key={item} className="text-sm leading-relaxed text-emerald-100">- {item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── TOP SUMMARY STRIP ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Creatives</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">{topSummaryStats.totalCreatives}</p>
                <p className="mt-1 text-xs text-slate-400">Uploaded</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Creatives Ready To Launch</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">{topSummaryStats.strategicallyReady}</p>
                <p className="mt-1 text-xs text-slate-400">{goalText} goal</p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200/90">Goal Misaligned</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">{topSummaryStats.goalMisaligned}</p>
                <p className="mt-1 text-xs text-rose-200/85">vs {goalText}</p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200/90">Vertical Misaligned</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">{topSummaryStats.verticalMisaligned}</p>
                <p className="mt-1 text-xs text-rose-200/85">vs {verticalText}</p>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">Highest Alignment</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">
                  {Number.isFinite(topSummaryStats.highestAlignedEntry?.score) ? `${topSummaryStats.highestAlignedEntry.score}/100` : "N/A"}
                </p>
                <p className="mt-1 text-xs text-cyan-100/80 truncate">
                  #{topSummaryStats.highestAlignedEntry?.creativeName || "No creative"} - {topSummaryStats.highestAlignedEntry?.status || "Unknown"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Campaign Cohesion</p>
                <p className="mt-1 text-3xl font-black leading-none text-white">{topSummaryStats.cohesionScore}/100</p>
                <p className="mt-1 text-xs text-slate-400">Consistency across the set</p>
              </div>
            </div>

            {/* ── LAUNCH READINESS STATUS ── */}
            <motion.div
              className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-fuchsia-900/15 overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="shrink-0 text-purple-300" />
                  <p className="text-sm font-semibold text-white">Launch Readiness Status</p>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                    <p className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-400" />
                      Vertical Alignment
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {alignmentStats.verticalAligned} aligned <span className="text-slate-400 font-normal">/</span> {alignmentStats.verticalMisaligned} not aligned
                      {(totalCount - alignmentStats.verticalAligned - alignmentStats.verticalMisaligned) > 0 && (
                        <span className="text-slate-400 font-normal"> / {totalCount - alignmentStats.verticalAligned - alignmentStats.verticalMisaligned} inconclusive</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Out of {totalCount} creatives for {verticalText}</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                    <p className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Target size={12} className="text-cyan-400" />
                      Campaign Goal Alignment
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {alignmentStats.goalAligned} aligned <span className="text-slate-400 font-normal">/</span> {alignmentStats.goalMisaligned} not aligned
                    </p>
                    <p className="text-xs text-slate-400 mt-1">For {goalText} objective</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAlignmentDetails(!showAlignmentDetails)}
                    className="w-full rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 hover:border-purple-500/60 flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    {showAlignmentDetails ? "Hide Details" : "View Alignment Details"}
                  </button>
                </div>
              </div>

              {showAlignmentDetails && (
                <div className="border-t border-purple-500/20 bg-black/20 px-4 py-3">
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {alignmentStats.alignedDetails.map((detail) => (
                      <div key={detail.creativeId} className="flex items-center gap-2.5 text-xs p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 transition">
                        <div className="flex gap-1.5 flex-1">
                          <span className={`flex items-center gap-1 px-2 py-1 rounded ${detail.verticalIsAligned === true ? "bg-emerald-500/20 text-emerald-200" : detail.verticalIsAligned === false ? "bg-red-500/20 text-red-200" : "bg-slate-500/20 text-slate-400"}`}>
                            {detail.verticalIsAligned === true ? <CheckCircle size={10} /> : detail.verticalIsAligned === false ? <XCircle size={10} /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />}
                            Vertical
                          </span>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded ${detail.goalAligned ? "bg-cyan-500/20 text-cyan-200" : "bg-red-500/20 text-red-200"}`}>
                            {detail.goalAligned ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            Goal
                          </span>
                        </div>
                        <span className="text-slate-300 font-semibold truncate flex-1">{detail.creativeName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── CAMPAIGN INSIGHTS ── */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-cyan-300" />
                <h4 className="text-sm font-semibold text-white">Campaign Insights</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {campaignInsights.map((insight) => (
                  <div key={insight.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{insight.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-100">{insight.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TARGET AUDIENCE ── */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} className="text-pink-300" />
                <h4 className="text-sm font-semibold text-white">Target Audience</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Likely Interpretation</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.likelyInterpretation}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Readiness Stage</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.readinessStage}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trust Perception</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.trustPerception}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">Likely audience reaction: {audienceInterpretation.likelyAudienceReaction}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Open <span className="font-semibold text-white">Creative Analysis</span> to inspect one creative at a time.
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── UTILITY TABS ── */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-900/25 to-fuchsia-900/20 p-3">
        <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/10 p-2">
          <button
            type="button"
            onClick={() => setUtilityTab("score-card")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              utilityTab === "score-card"
                ? "bg-white/12 text-white border border-white/15"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Target size={14} /> Score Card
          </button>
          <button
            type="button"
            onClick={() => setUtilityTab("ab-testing")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              utilityTab === "ab-testing"
                ? "bg-white/12 text-white border border-white/15"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <FlaskConical size={14} /> A/B Testing
          </button>
          <button
            type="button"
            onClick={() => setUtilityTab("device-platform")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              utilityTab === "device-platform"
                ? "bg-white/12 text-white border border-white/15"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Monitor size={14} /> Device Platform
          </button>
        </div>

        <div className="mt-3">
          {utilityTab === "score-card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/25 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">Score Card</p>
                <p className={`mt-1 text-4xl font-black leading-none ${scoreTone(strategicScore)}`}>
                  {Number.isFinite(strategicScore) ? `${strategicScore}/100` : "N/A"}
                </p>
                <p className="mt-2 text-xs text-purple-100/80">Weighted score from alignment, attention, and performance layers</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Engagement</p>
                <p className={`mt-1 text-4xl font-black leading-none ${engagementBand === "HIGH" ? "text-emerald-300" : engagementBand === "MEDIUM" ? "text-amber-300" : engagementBand === "LOW" ? "text-red-300" : "text-slate-300"}`}>
                  {engagementBand}
                </p>
                <p className="mt-2 text-xs text-amber-200/80">Derived from attention and performance layers</p>
              </div>
            </div>
          )}

          {utilityTab === "ab-testing" && (
            <div className="rounded-xl border border-fuchsia-500/25 bg-fuchsia-950/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={14} className="text-fuchsia-300" />
                <h4 className="text-sm font-semibold text-white">A/B Testing</h4>
              </div>

              {abHypotheses.length > 0 ? (
                <div className="space-y-2">
                  {abHypotheses.map((hyp, i) => (
                    <div key={`${hyp.dimension || "hyp"}-${i}`} className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/5 p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-fuchsia-300 font-semibold">Test {i + 1}: {hyp.dimension || "Variant"}</p>
                      <p className="text-[11px] text-slate-300 mt-1"><span className="font-semibold text-slate-200">A:</span> {hyp.variant_a || "Control variant"}</p>
                      <p className="text-[11px] text-white mt-0.5"><span className="font-semibold text-fuchsia-300">B:</span> {hyp.variant_b || "Test variant"}</p>
                      <p className="text-[10px] text-fuchsia-200/80 mt-1">Expected lift: {hyp.expected_lift || "Improve strategic alignment"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No A/B tests available for this creative.</p>
              )}
            </div>
          )}

          {utilityTab === "device-platform" && (
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor size={14} className="text-cyan-300" />
                <h4 className="text-sm font-semibold text-white">Device Platform</h4>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"><Monitor size={12} /> Desktop</p>
                    <span className={`text-[10px] font-bold ${desktopRisk.className}`}>{desktopRisk.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{flow?.attentionAnalysis?.attention_retention_risk || "Desktop platform signal unavailable."}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"><Smartphone size={12} /> Mobile</p>
                    <span className={`text-[10px] font-bold ${mobileRisk.className}`}>{mobileRisk.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{flow?.attentionAnalysis?.mobile_attention_risk || "Mobile platform signal unavailable."}</p>
                </div>

                <p className="text-[10px] text-cyan-200/80">Platform context: <span className="font-semibold text-cyan-200">{platform || "display_ads"}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        {/* ── LEFT PANEL: CREATIVE RANKING ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-2">
            Creative Ranking
          </p>
          {sorted.map((entry, index) => {
            const isActive = selectedId === entry.creative.id;
            const payload = getEntryPayload(entry) || {};
            const entryScore = getStrategicAlignmentScore(payload);
            const label = getCreativeStatusLabel(payload);
            const goalOk = payload?.goal_alignment?.is_aligned;
            const vertOk = payload?.vertical_alignment?.is_aligned;

            return (
              <button
                key={entry.creative.id}
                onClick={() => setSelectedId(entry.creative.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isActive
                    ? "border-cyan-400/60 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {entry.creative.url && (
                    <div className="flex-shrink-0 w-12 h-10 rounded-md overflow-hidden border border-white/10 bg-slate-800">
                      <img
                        src={entry.creative.url}
                        alt={entry.creative.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-[10px] font-semibold text-slate-500">#{index + 1}</p>
                      <span className={`text-xs font-bold ${scoreTone(entryScore)}`}>
                        {entryScore ?? "--"}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold text-white mt-0.5">
                      {entry.creative.name}
                    </p>
                    <p className={`text-[10px] mt-0.5 font-semibold ${statusColor(label)}`}>
                      {label}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {goalOk === true && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Goal ✓
                        </span>
                      )}
                      {goalOk === false && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                          Goal ✗
                        </span>
                      )}
                      {vertOk === true && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Vertical ✓
                        </span>
                      )}
                      {vertOk === false && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Vertical ✗
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── RIGHT PANEL: STRATEGIST INTELLIGENCE ── */}
        <div className="space-y-4">
          {/* Creative header */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
            <div>
              <div>
                <h4 className="text-base font-bold text-white">{selected.creative.name}</h4>
                <p className="mt-0.5 text-xs text-slate-500">{platform || "display_ads"}</p>
              </div>
            </div>
          </div>

          {/* 1. GOAL ALIGNMENT */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-cyan-300" />
                <h4 className="text-sm font-semibold text-white">1. Goal Alignment</h4>
              </div>
              <AlignmentBadge isAligned={goalAlignment?.is_aligned} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>
                  Selected:{" "}
                  <span className="font-semibold text-white">
                    {labelGoal(goalAlignment?.selected_goal || campaignGoal)}
                  </span>
                </span>
                {goalAlignment?.detected_goal &&
                  goalAlignment.detected_goal !== goalAlignment.selected_goal && (
                    <span>
                      Detected:{" "}
                      <span className="font-semibold text-amber-300">
                        {labelGoal(goalAlignment.detected_goal)}
                      </span>
                    </span>
                  )}
              </div>
              {goalAlignment?.reason && (
                <p className="text-sm text-slate-200 leading-relaxed">{goalAlignment.reason}</p>
              )}
            </div>
          </div>

          {/* 2. VERTICAL ALIGNMENT */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={15} className="text-purple-300" />
              <h4 className="text-sm font-semibold text-white">2. Vertical Alignment</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Selected Vertical</p>
                <p className="font-semibold text-white">{selectedVerticalLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Alignment Status</p>
                <p className={`font-semibold ${verticalAlignment?.is_aligned === false ? "text-amber-300" : "text-emerald-300"}`}>
                  {verticalAlignment?.is_aligned === false ? "Not Aligned" : "Aligned"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Detected Product / Service</p>
                <p className="text-slate-100">{productOrService}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Detected Business Vertical</p>
                <p className="text-purple-200 font-semibold">{detectedBusinessCategory}</p>
              </div>
            </div>
          </div>

          {/* 3. CREATIVE EXTRACTION SIGNALS */}
          {extractionSignals && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={15} className="text-blue-300" />
                <h4 className="text-sm font-semibold text-white">3. Creative Extraction Signals</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FieldBlock label="Headline" value={extractionSignals.headline} />
                <FieldBlock label="CTA" value={extractionSignals.cta} />
                <FieldBlock
                  label="Brand Presence"
                  value={
                    extractionSignals.brand_presence
                      ? extractionSignals.brand_presence.charAt(0).toUpperCase() +
                        extractionSignals.brand_presence.slice(1)
                      : null
                  }
                />
                <FieldBlock
                  label="Dominant Visual"
                  value={extractionSignals.dominant_visual_cue}
                />
                <FieldBlock
                  label="Persuasion Style"
                  value={extractionSignals.persuasion_style}
                />
                {extractionSignals.detected_vertical &&
                  extractionSignals.detected_vertical !== "unknown" && (
                    <FieldBlock
                      label="Detected Vertical"
                      value={labelVertical(extractionSignals.detected_vertical)}
                    />
                  )}
              </div>
              {extractionSignals.topic_summary && (
                <div className="mt-2 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">
                    What This Creative Is About
                  </p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {extractionSignals.topic_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. AUDIENCE INTERPRETATION */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-pink-300" />
              <h4 className="text-sm font-semibold text-white">4. Audience Interpretation</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Likely Interpretation</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.likelyInterpretation}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Readiness Stage</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.readinessStage}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trust Perception</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-100">{audienceInterpretation.trustPerception}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">Likely audience reaction: {audienceInterpretation.likelyAudienceReaction}</p>
              </div>
            </div>
          </div>

          {/* 5. LAYOUT & ATTENTION FLOW */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={15} className="text-cyan-300" />
              <h4 className="text-sm font-semibold text-white">5. Layout &amp; Attention Flow</h4>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Layout &amp; Attention Flow</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                <span className="font-semibold text-slate-100">Flow:</span> {layoutClarity.flowLine}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed mt-1">
                <span className="font-semibold text-slate-100">Focus:</span> {layoutClarity.focusLine}
              </p>
            </div>
          </div>

          {/* 6. STRATEGIC RECOMMENDATION */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-emerald-300" />
              <h4 className="text-sm font-semibold text-white">6. Strategic Recommendation</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm leading-relaxed">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Core Problem</p>
                <p className="mt-1 text-slate-100">{strategistSummary.coreProblem}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Why It Happens</p>
                <p className="mt-1 text-slate-100">{strategistSummary.whyItHappens}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Business Risk</p>
                <p className="mt-1 text-slate-100">{strategistSummary.businessRisk}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">Exact Fix</p>
                <p className="mt-1 text-slate-100">{strategistSummary.exactFix}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOWNLOAD BUTTON ── */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onDownloadReport}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
      >
        <Download size={16} /> Download Strategic Report
      </motion.button>
        </>
      )}
    </div>
  );
}
