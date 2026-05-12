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
  const selectedGoal = labelGoal(goalAlignment?.selected_goal || campaignGoal || "awareness");
  const selectedVertical = labelVertical(verticalAlignment?.selected_vertical || campaignVertical || "unknown");
  const detectedGoal = labelGoal(goalAlignment?.detected_goal || "unknown");
  const detectedVertical = labelVertical(verticalAlignment?.detected_vertical || "unknown");

  const headline = extractionSignals?.headline?.trim() || "headline unavailable";
  const cta = extractionSignals?.cta?.trim() || "CTA unavailable";
  const imageMeaning = extractionSignals?.topic_summary?.trim() || extractionSignals?.dominant_visual_cue?.trim() || "image meaning unavailable";
  const visualHierarchy = flow?.attentionAnalysis?.attention_path?.trim() || "scan flow signal is limited";
  const firstFocus = flow?.attentionAnalysis?.first_focus?.trim() || "primary focus is unclear";
  const emotionalTone = behavioral?.emotional_state?.trim() || "emotional tone is unclear";
  const commitmentPressure = behavioral?.commitment_pressure?.trim() || "commitment pressure signal unavailable";
  const curiosity = behavioral?.curiosity_vs_intent_balance?.trim() || "curiosity-intent signal unavailable";
  const trust = behavioral?.trust_gap?.trim() || "trust signal unavailable";
  const hesitation = behavioral?.likely_objection?.trim() || "hesitation signal unavailable";
  const readiness = behavioral?.commitment_readiness?.trim() || "readiness signal unavailable";
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
    : "a subtle alignment gap between strategy intent and creative execution";

  const fixSuggestion = recommendations?.[0]?.recommended_change?.trim() ||
    `Reframe the headline around ${selectedVertical.toLowerCase()} identity and desired ${selectedGoal.toLowerCase()} intent, soften CTA pressure, and rebalance hierarchy so brand meaning lands before action.`;

  return {
    wrong: `The creative for ${selectedVertical} under a ${selectedGoal} goal is showing ${issueLine}. It currently uses headline "${headline}", CTA "${cta}", and image interpretation "${imageMeaning}".` ,
    why: `This happens because the visual hierarchy makes users read ${visualHierarchy}, with first focus on ${firstFocus}, while persuasion style (${persuasionStyle}) and urgency cues can introduce action pressure before message absorption. Brand emphasis is ${brandPresence}, and emotional tone signals that ${emotionalTone}.`,
    effect: `Audience interpretation shifts based on commitment pressure (${commitmentPressure}), curiosity pattern (${curiosity}), trust context (${trust}), and likely hesitation (${hesitation}). Net effect: users may stay in ${detectedGoal} mode instead of the intended ${selectedGoal} journey, especially when vertical cues drift toward ${detectedVertical}.`,
    fix: `For the selected ${selectedGoal} goal in ${selectedVertical}, keep CTA "${cta}" only after narrative context from headline "${headline}" and the core image. Strengthen brand anchoring before urgency, reduce premature conversion cues, and align emotional readiness (${readiness}) with the campaign stage. Exact fix: ${fixSuggestion}`,
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

  let clarityScore = 70;
  if (frictionPoints.length > 0) clarityScore -= 18;
  if (/weakened|compete|unclear|risk|drop|fatigue|fragment/i.test(`${ctaVisibility} ${mobileRisk} ${retentionRisk}`)) clarityScore -= 14;
  if (/low|weak/i.test(String(brandPresence))) clarityScore -= 8;
  if (headline) clarityScore += 6;
  if (cta) clarityScore += 4;
  if (dominantVisual) clarityScore += 4;
  clarityScore = Math.max(25, Math.min(95, clarityScore));

  const clarityLabel = clarityScore >= 80 ? "High Clarity" : clarityScore >= 60 ? "Moderate Clarity" : "Low Clarity";
  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const emotionalTone = behavioral?.emotional_state || "emotional response is mixed";

  const clarityNarrative =
    clarityScore >= 80
      ? `The visual hierarchy is clear for ${goalText} in ${verticalText}: users are guided through message, image, and action with limited friction.`
      : clarityScore >= 60
        ? `The layout provides partial clarity for ${goalText} in ${verticalText}, but competing elements and flow friction may dilute message take-away.`
        : `The layout currently lacks clear attention control for ${goalText} in ${verticalText}; users may miss core intent before reaching the CTA.`;

  const recommendedAdjustment = frictionPoints[0]
    ? `Reduce friction by fixing this first: ${frictionPoints[0]}`
    : /compete|weakened|unclear/i.test(ctaVisibility)
      ? `Increase CTA contrast and spacing so action appears only after core value is understood.`
      : `Strengthen visual sequencing so focus starts on the primary message before action cues.`;

  return {
    flowLine: path,
    focusLine: `${String(firstFocus).charAt(0).toUpperCase()}${String(firstFocus).slice(1)} area${headline ? ` (headline: "${headline}")` : ""}`,
    clarityLabel,
    clarityScore,
    clarityNarrative,
    ctaVisibility,
    mobileRisk,
    retentionRisk,
    emotionalTone,
    recommendedAdjustment,
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
  onDownloadReport,
}) {
  const strategicEntries = useMemo(() => {
    return Array.isArray(analysisResult) ? analysisResult : [];
  }, [analysisResult]);

  const sorted = useMemo(() => {
    return [...strategicEntries].sort(compareStrategicEntries);
  }, [strategicEntries]);

  const [selectedId, setSelectedId] = useState(() => sorted[0]?.creative?.id || null);

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
  const launchReadinessText = readyCount === 1
    ? `${readyEntries[0]?.creative?.name || "1 creative"} is ready to launch.`
    : `${readyCount} out of ${totalCount} creatives are ready to launch.`;
  const launchReadinessTone = readyCount === 0
    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : readyCount === totalCount
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";

  return (
    <div className="space-y-5">
      {/* ── LAUNCH READINESS STATUS TAB ── */}
      <div className={`rounded-xl border px-4 py-3 ${launchReadinessTone}`}>
        <div className="flex items-center gap-2">
          <Zap size={14} className="shrink-0" />
          <p className="text-sm font-semibold">Launch Readiness Status</p>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{launchReadinessText}</p>
      </div>

      {/* ── FINAL SCORE + ENGAGEMENT CARDS ── */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-900/25 to-fuchsia-900/20 p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-purple-500/35 bg-purple-950/35 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Final Score</p>
            <p className="mt-1 text-4xl font-black text-white leading-none">
              {Number.isFinite(strategicScore) ? `${strategicScore}/100` : "N/A"}
            </p>
            <p className="mt-2 text-xs text-slate-400">Weighted score from Eligibility, Attention, and Performance layers</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Engagement</p>
            <p className={`mt-1 text-4xl font-black leading-none ${engagementBand === "HIGH" ? "text-emerald-300" : engagementBand === "MEDIUM" ? "text-amber-300" : engagementBand === "LOW" ? "text-red-300" : "text-slate-300"}`}>
              {engagementBand}
            </p>
            <p className="mt-2 text-xs text-amber-200/80">Derived from attention and performance layers</p>
          </div>
        </div>
      </div>

      {/* ── RESTORED: A/B TESTING + DEVICE PLATFORM ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain size={15} className="text-purple-300" />
                <h4 className="text-sm font-semibold text-white">2. Vertical Alignment</h4>
              </div>
              <AlignmentBadge isAligned={verticalAlignment?.is_aligned} />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>
                  Selected:{" "}
                  <span className="font-semibold text-white">
                    {labelVertical(verticalAlignment?.selected_vertical || campaignVertical)}
                  </span>
                </span>
                {verticalAlignment?.detected_vertical &&
                  verticalAlignment.detected_vertical !== "unknown" && (
                    <span>
                      Detected:{" "}
                      <span
                        className={`font-semibold ${
                          verticalAlignment.is_aligned === false
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {labelVertical(verticalAlignment.detected_vertical)}
                      </span>
                    </span>
                  )}
              </div>
              {verticalAlignment?.reason && (
                <p className="text-sm text-slate-200 leading-relaxed">{verticalAlignment.reason}</p>
              )}
              {Array.isArray(verticalAlignment?.evidence) &&
                verticalAlignment.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {verticalAlignment.evidence.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
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

          {/* 4. AUDIENCE PSYCHOLOGY */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-pink-300" />
              <h4 className="text-sm font-semibold text-white">4. Audience Psychology</h4>
            </div>
            <div className="space-y-2">
              <FieldBlock
                label="Likely Behavior"
                value={behavioral?.likely_behavior}
                accent="emerald"
              />
              <FieldBlock
                label="Commitment Pressure"
                value={behavioral?.commitment_pressure}
                accent="amber"
              />
              {behavioral?.likely_objection &&
                !behavioral.likely_objection.includes("unavailable") && (
                  <FieldBlock
                    label="Likely Objection"
                    value={behavioral.likely_objection}
                    accent="red"
                  />
                )}
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
              <p className="text-sm text-slate-200 leading-relaxed mt-2">
                <span className="font-semibold text-cyan-300">Clarity:</span> {layoutClarity.clarityLabel} ({layoutClarity.clarityScore}/100)
              </p>
              <p className="text-sm text-slate-200 leading-relaxed mt-1">
                {layoutClarity.clarityNarrative}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                <span className="font-semibold text-slate-200">CTA visibility:</span> {layoutClarity.ctaVisibility}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                <span className="font-semibold text-slate-200">Mobile risk:</span> {layoutClarity.mobileRisk}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                <span className="font-semibold text-slate-200">Retention risk:</span> {layoutClarity.retentionRisk}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                <span className="font-semibold text-slate-200">Emotional context:</span> {layoutClarity.emotionalTone}
              </p>
              <p className="text-xs text-cyan-200 leading-relaxed mt-2">
                <span className="font-semibold">Recommended adjustment:</span> {layoutClarity.recommendedAdjustment}
              </p>
            </div>
          </div>

          {/* 6. STRATEGIC RECOMMENDATION */}
          {recommendations.length > 0 && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={15} className="text-emerald-300" />
                <h4 className="text-sm font-semibold text-white">6. Strategic Recommendation</h4>
              </div>
              <div className="space-y-3 text-[15px] leading-relaxed">
                <p className="text-slate-100"><span className="font-semibold text-emerald-300">1. What’s wrong:</span> {strategistNarrative.wrong}</p>
                <p className="text-slate-100"><span className="font-semibold text-emerald-300">2. Why it happens:</span> {strategistNarrative.why}</p>
                <p className="text-slate-100"><span className="font-semibold text-emerald-300">3. Audience effect:</span> {strategistNarrative.effect}</p>
                <p className="text-slate-100"><span className="font-semibold text-emerald-300">4. Exact fix:</span> {strategistNarrative.fix}</p>
              </div>
              {recommendations[0]?.priority && (
                <p className="mt-3 text-xs text-emerald-400 font-semibold">Priority: {recommendations[0].priority}</p>
              )}
            </div>
          )}
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
    </div>
  );
}
