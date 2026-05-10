"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, CheckCircle2, XCircle, AlertCircle, Monitor, Smartphone,
  Trophy, TrendingUp, Eye, MessageSquare, MousePointer,
  Shield, LayoutDashboard, Maximize2, Zap, Brain, BarChart3,
  Flame, Target, Activity, Database, Layers, ChevronRight,
  Palette, Hierarchy, FlaskConical, Cpu, Gauge, ArrowUpRight,
  AlertTriangle, Info, Sparkles, RefreshCw,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

function rankVerdict(name, score, data) {
  if (data?.analysis_state && data.analysis_state !== "success" && data.analysis_state !== "low_confidence" && !Number.isFinite(score)) {
    return `"${name}" could not be fully scored: ${data.analysis_state_label || "insufficient validated signals"}.`;
  }
  if (data?.analysis_state === "low_confidence") {
    return `"${name}" has low-confidence analysis. Validate with additional evidence before launch decisions.`;
  }
  if (score >= 82) return `"${name}" is peak performance — ready to scale aggressively.`;
  if (score >= 68) {
    const weak = [];
    if (!data.cta_presence) weak.push("CTA needs work");
    if ((data.coreChecks?.crowding?.score ?? 100) < 50) weak.push("overcrowded layout");
    return `"${name}" is launch-ready${weak.length ? ` — ${weak.join(", ")}` : ""}. Minor fixes unlock peak scaling.`;
  }
  if (score >= 45) {
    const issues = [];
    if (!data.cta_presence) issues.push("CTA misaligned");
    if ((data.coreChecks?.messageClarity?.score ?? 100) < 55) issues.push("message clarity");
    return `"${name}" needs revision — ${issues.join(", ") || "multiple issues"}. Review fix blocks.`;
  }
  return `"${name}" has critical issues. Do not run without full redesign.`;
}

function medalFor(rank) {
  return rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`;
}

const FUNNEL_COLOR = {
  Awareness: "bg-blue-500/15 border-blue-500/40 text-blue-300",
  Consideration: "bg-purple-500/15 border-purple-500/40 text-purple-300",
  Conversion: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
};
const FUNNEL_ICON = { Awareness: "👁", Consideration: "🔍", Conversion: "⚡" };

function BestForBadge({ bestFor }) {
  if (!bestFor) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${FUNNEL_COLOR[bestFor] || "bg-white/10 border-white/20 text-gray-300"}`}>
      {FUNNEL_ICON[bestFor]} Best for {bestFor}
    </span>
  );
}

function sc(score) {
  if (!Number.isFinite(score)) return "text-gray-400";
  return score >= 72 ? "text-emerald-400" : score >= 48 ? "text-amber-400" : "text-red-400";
}
function scBg(score) {
  if (!Number.isFinite(score)) return "bg-gray-500";
  return score >= 72 ? "bg-emerald-400" : score >= 48 ? "bg-amber-400" : "bg-red-400";
}
function scoreLabel(score) {
  if (!Number.isFinite(score)) return "Analysis Unavailable";
  if (score >= 85) return "Peak ✨";
  if (score >= 72) return "Good ✓";
  if (score >= 58) return "Fair ⚠";
  if (score >= 42) return "Needs Work 🛠";
  return "Critical ✗";
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: "border-red-500/50 bg-red-500/8", badge: "bg-red-500/20 text-red-300", icon: <XCircle size={12} /> },
  HIGH: { color: "border-orange-500/40 bg-orange-500/6", badge: "bg-orange-500/20 text-orange-300", icon: <AlertTriangle size={12} /> },
  MEDIUM: { color: "border-yellow-500/30 bg-yellow-500/5", badge: "bg-yellow-500/20 text-yellow-300", icon: <AlertCircle size={12} /> },
  LOW: { color: "border-white/15 bg-white/3", badge: "bg-white/10 text-gray-400", icon: <Info size={12} /> },
};

// ── Grade Config ─────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  "Elite Creative":     { emoji: "🌟", bg: "bg-emerald-500/15 border-emerald-500/40", text: "text-emerald-300" },
  "Strong Performer":   { emoji: "🚀", bg: "bg-blue-500/15 border-blue-500/40",     text: "text-blue-300" },
  "Needs Optimization": { emoji: "🛠",  bg: "bg-yellow-500/15 border-yellow-500/40", text: "text-yellow-300" },
  "High Risk Creative": { emoji: "⚠️", bg: "bg-red-500/15 border-red-500/40",       text: "text-red-300" },
  "Analysis Unavailable": { emoji: "ℹ️", bg: "bg-slate-500/15 border-slate-500/40", text: "text-slate-300" },
};

function GradeBadge({ grade }) {
  if (!grade) return null;
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG["Needs Optimization"];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${cfg.bg} ${cfg.text}`}>
      {cfg.emoji} {grade}
    </span>
  );
}

// ── Subscore Bar Row ──────────────────────────────────────────────────────────

function SubscoreRow({ label, value, tooltip }) {
  const hasValue = Number.isFinite(value);
  const barColor =
    !hasValue ? "bg-gray-500" :
      value >= 80 ? "bg-emerald-400" :
      value >= 60 ? "bg-yellow-400" :
      "bg-red-400";
  const textColor =
    !hasValue ? "text-gray-400" :
      value >= 80 ? "text-emerald-400" :
      value >= 60 ? "text-yellow-400" :
      "text-red-400";
  return (
    <div title={tooltip || label}>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-bold tabular-nums ${textColor}`}>{hasValue ? value : "—"}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0, Math.min(1, (hasValue ? value : 0) / 100)) }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className={`h-full origin-left rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

// ── Creative Intelligence Dashboard ──────────────────────────────────────────

function CreativeIntelligenceDashboard({ aiData, decisionEngine }) {
  if (!aiData && !decisionEngine) return null;

  const subs = aiData?.subscores;
  const grade = decisionEngine?.grade;
  const optimizations = decisionEngine?.optimizations || [];

  const SUBSCORE_GROUPS = [
    {
      title: "Funnel Intelligence", icon: "🎯",
      color: "border-blue-500/25 bg-blue-500/5",
      items: [
        { key: "stage_alignment",      label: "Stage Alignment",      tooltip: "How well the creative aligns with the campaign funnel stage" },
        { key: "conversion_readiness", label: "Conversion Readiness", tooltip: "Likelihood this creative converts based on all signals" },
      ],
    },
    {
      title: "Creative Quality", icon: "✨",
      color: "border-purple-500/25 bg-purple-500/5",
      items: [
        { key: "visual_hierarchy",    label: "Visual Hierarchy",    tooltip: "How well the viewer's eye is guided through the ad" },
        { key: "readability",          label: "Readability",          tooltip: "Legibility of text at a glance on any device" },
        { key: "cognitive_simplicity", label: "Cognitive Simplicity", tooltip: "How easy the ad is to process within 2 seconds" },
      ],
    },
    {
      title: "Psychology & Trust", icon: "🧠",
      color: "border-fuchsia-500/25 bg-fuchsia-500/5",
      items: [
        { key: "emotional_resonance", label: "Emotional Resonance", tooltip: "Strength of emotional appeal and audience connection" },
        { key: "trust_signals",       label: "Trust Signals",       tooltip: "Presence of credibility elements: badges, reviews, etc." },
        { key: "brand_recall",        label: "Brand Recall",        tooltip: "How memorable the brand impression is" },
      ],
    },
    {
      title: "Performance Drivers", icon: "⚡",
      color: "border-amber-500/25 bg-amber-500/5",
      items: [
        { key: "offer_clarity",  label: "Offer Clarity",  tooltip: "How clearly the value proposition or offer is stated" },
        { key: "urgency_fit",    label: "Urgency Fit",    tooltip: "Whether urgency levels match the funnel stage" },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_8px_24px_rgba(2,6,23,0.35)] p-4 md:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain size={14} className="text-cyan-400" />
        <p className="text-sm font-semibold text-white">Creative Intelligence</p>
        {grade && (
          <div className="ml-auto">
            <GradeBadge grade={grade.grade} />
          </div>
        )}
      </div>

      {/* Funnel + Vertical context pills */}
      {aiData && (
        <div className="flex flex-wrap gap-2">
          {aiData.campaign_goal && aiData.campaign_goal !== "Unknown" && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
              📣 {aiData.campaign_goal}
            </span>
          )}
          {aiData.vertical && aiData.vertical !== "Other" && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
              🏢 {aiData.vertical}
            </span>
          )}
          {aiData.overall_score > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 ml-auto">
              AI Score: {aiData.overall_score}/100
            </span>
          )}
        </div>
      )}

      {/* Subscore Groups */}
      {subs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBSCORE_GROUPS.map((group) => (
            <div key={group.title} className={`p-3.5 rounded-xl border space-y-2.5 ${group.color}`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{group.icon} {group.title}</p>
              {group.items.map(({ key, label, tooltip }) => (
                <SubscoreRow key={key} label={label} value={subs[key]} tooltip={tooltip} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* OpenAI Vision — Creative Intelligence fields */}
      {aiData && (aiData.brand || aiData.headline || aiData.primary_message || aiData.emotion_trigger || aiData.target_audience) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">🔍 Creative Intelligence Extract</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {aiData.brand && (
              <div className="p-3 rounded-xl bg-white/4 border border-white/10">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Brand</p>
                <p className="text-xs text-white font-semibold">{aiData.brand}</p>
              </div>
            )}
            {aiData.headline && (
              <div className="p-3 rounded-xl bg-white/4 border border-white/10">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Headline</p>
                <p className="text-xs text-white font-semibold">{aiData.headline}</p>
              </div>
            )}
            {aiData.emotion_trigger && (
              <div className="p-3 rounded-xl bg-fuchsia-500/8 border border-fuchsia-500/20">
                <p className="text-[9px] font-bold text-fuchsia-400 uppercase tracking-wider mb-1">Emotion Trigger</p>
                <p className="text-xs text-white font-semibold capitalize">{aiData.emotion_trigger}</p>
              </div>
            )}
            {aiData.target_audience && (
              <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1">Target Audience</p>
                <p className="text-xs text-white font-semibold">{aiData.target_audience}</p>
              </div>
            )}
          </div>
          {aiData.primary_message && (
            <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Primary Message</p>
              <p className="text-xs text-white leading-relaxed">{aiData.primary_message}</p>
            </div>
          )}
          {aiData.layout_hierarchy && (
            <div className="p-3 rounded-xl bg-white/4 border border-white/10 space-y-1.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Layout & Attention Flow</p>
              {aiData.layout_hierarchy.attention_flow && (
                <p className="text-[11px] text-gray-300"><span className="text-gray-500">Flow:</span> {aiData.layout_hierarchy.attention_flow}</p>
              )}
              {aiData.layout_hierarchy.visual_focus && (
                <p className="text-[11px] text-gray-300"><span className="text-gray-500">Focus:</span> {aiData.layout_hierarchy.visual_focus}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Explanation */}
      {aiData?.explanation && (
        <div className="p-3 rounded-xl bg-white/4 border border-white/10">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">AI Analysis Summary</p>
          <p className="text-xs text-gray-300 leading-relaxed">{aiData.explanation}</p>
          {aiData.confidence > 0 && (
            <p className="text-[11px] text-gray-500 mt-1">Confidence: <span className="text-white font-semibold">{Math.round(aiData.confidence * 100)}%</span></p>
          )}
        </div>
      )}

      {/* Decision Engine Optimizations */}
      {optimizations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">🔧 Decision Engine — Optimization Roadmap</p>
          {optimizations.slice(0, 5).map((opt, i) => {
            const pBg = opt.priority === "High"
              ? "border-red-500/30 bg-red-500/5"
              : opt.priority === "Medium"
                ? "border-yellow-500/25 bg-yellow-500/4"
                : "border-white/10 bg-white/3";
            const pBadge = opt.priority === "High"
              ? "bg-red-500/20 text-red-300"
              : opt.priority === "Medium"
                ? "bg-yellow-500/20 text-yellow-300"
                : "bg-gray-500/20 text-gray-400";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`p-3 rounded-xl border ${pBg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-white">{opt.dimension}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${pBadge}`}>{opt.priority}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{opt.issue}</p>
                <p className="text-[11px] text-emerald-300 mt-1">→ {opt.recommendation}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Reusable Animated Bar ────────────────────────────────────────────────────

function AnimBar({ value, color, delay = 0, height = "h-1.5" }) {
  return (
    <div className={`${height} bg-white/10 rounded-full overflow-hidden`}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0, Math.min(1, value / 100)) }}
        transition={{ duration: 0.7, ease: "easeOut", delay }}
        className={`h-full origin-left rounded-full ${color}`}
      />
    </div>
  );
}

// ── Confidence Ring ────────────────────────────────────────────────────────────

function ConfidenceRing({ score, size = 80, label = "" }) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - safeScore / 100);
  const color = !Number.isFinite(score) ? "#64748b" : score >= 72 ? "#34d399" : score >= 48 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xs font-black" style={{ color }}>{Number.isFinite(score) ? score : "--"}</p>
        {label && <p className="text-[9px] text-gray-500 leading-none mt-0.5">{label}</p>}
      </div>
    </div>
  );
}


// ── Color Palette Viewer ──────────────────────────────────────────────────────

function ColorPaletteStrip({ palette, harmony, warmth, hue }) {
  const harmonyColors = {
    HARMONIOUS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    ACCEPTABLE: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    DISCORDANT: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="p-3.5 rounded-xl bg-white/4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Color Intelligence</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${harmonyColors[harmony] || harmonyColors.ACCEPTABLE}`}>
          {harmony}
        </span>
      </div>
      {palette?.length > 0 && (
        <div className="flex gap-2 items-center">
          {palette.map((hex, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-lg border border-white/20 shadow-lg"
                style={{ backgroundColor: hex }}
                title={hex}
              />
              <span className="text-[9px] text-gray-600 font-mono">{hex}</span>
            </div>
          ))}
          <div className="ml-auto text-right space-y-1">
            <p className="text-[10px] text-gray-500">Warmth <span className="text-white font-bold">{warmth ?? 50}%</span></p>
            <p className="text-[10px] text-gray-500">Dom. Hue <span className="text-white font-bold">{hue ?? 0}°</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WCAG Badge ────────────────────────────────────────────────────────────────

function WcagBadge({ level, ratio }) {
  const config = {
    AAA: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: "✓✓" },
    AA: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: "✓" },
    FAIL: { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: "✗" },
  };
  const cfg = config[level] || config.FAIL;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cfg.color}`}>
      <span>{cfg.icon}</span>
      WCAG {level}
      {ratio && <span className="font-normal text-[10px] opacity-70">{ratio}:1</span>}
    </div>
  );
}


// ── Stop Rate Chip ─────────────────────────────────────────────────────────────

function StopRateChip({ estimate }) {
  if (!estimate) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30">
      <Gauge size={11} className="text-fuchsia-400" />
      <span className="text-[11px] font-bold text-fuchsia-300">Est. Stop Rate: {estimate}</span>
    </div>
  );
}

// ── Intelligence Panel (upgraded v4) ─────────────────────────────────────────

const APPEAL_CONFIG = {
  HIGH: { color: "bg-emerald-500/10 border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-300", icon: "🔥" },
  MEDIUM: { color: "bg-yellow-500/10 border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-300", icon: "⚡" },
  LOW: { color: "bg-slate-500/10 border-slate-500/30", badge: "bg-slate-500/20 text-gray-400", icon: "📊" },
};

const FORECAST_CONFIG = {
  HIGH: { color: "bg-emerald-500/10 border-emerald-500/40", text: "text-emerald-300", icon: "🟢", label: "HIGH ENGAGEMENT" },
  MEDIUM: { color: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-300", icon: "🟡", label: "MEDIUM ENGAGEMENT" },
  LOW: { color: "bg-red-500/10 border-red-500/30", text: "text-red-300", icon: "🔴", label: "LOW ENGAGEMENT" },
};

function ClutterMeter({ index, label }) {
  const colors = ["bg-emerald-400", "bg-emerald-400", "bg-emerald-400", "bg-yellow-400", "bg-yellow-400", "bg-yellow-400", "bg-orange-400", "bg-orange-400", "bg-red-400", "bg-red-500"];
  return (
    <div className="p-3.5 rounded-xl bg-white/4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clutter Index</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${label === "CLEAN" ? "bg-emerald-500/20 text-emerald-300" :
          label === "MODERATE" ? "bg-yellow-500/20 text-yellow-300" :
            label === "CLUTTERED" ? "bg-orange-500/20 text-orange-300" :
              "bg-red-500/20 text-red-300"
          }`}>{index}/10 — {label}</span>
      </div>
      <div className="flex items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={`flex-1 rounded-sm origin-bottom ${i < index ? colors[i] : "bg-white/8"}`}
            style={{ height: `${12 + i * 2}px` }}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-500">
        {label === "CLEAN" ? "Clean, mobile-friendly layout with strong stop-rate potential." :
          label === "MODERATE" ? "Some complexity — slight attention dilution on mobile feeds." :
            label === "CLUTTERED" ? "Too many elements competing — mobile readability is poor." :
              "Impossible visual hierarchy — viewer cannot identify the main message."}
      </p>
    </div>
  );
}

function IntelligencePanel({ data }) {
  const hasForecastSignal = Boolean(data.engagement_forecast);
  const hasEmotionSignal = Boolean(data.emotional_appeal);
  const hasClutterSignal = Number.isFinite(data.clutter_index);
  const forecastCfg = hasForecastSignal ? (FORECAST_CONFIG[data.engagement_forecast] || FORECAST_CONFIG.MEDIUM) : null;
  const emotionCfg = hasEmotionSignal ? (APPEAL_CONFIG[data.emotional_appeal] || APPEAL_CONFIG.MEDIUM) : null;
  const clutterIndex = Number.isFinite(data.clutter_index) ? data.clutter_index : null;
  const clutterLabel = data.clutter_label || null;

  return (
    <div className="space-y-4">

      {/* Engagement Forecast */}
      <div className={`p-4 rounded-xl border ${forecastCfg ? forecastCfg.color : "border-slate-700/40 bg-slate-800/30"}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Engagement Forecast</p>
            <span className={`text-lg font-black ${forecastCfg ? forecastCfg.text : "text-gray-400"}`}>
              {forecastCfg ? `${forecastCfg.icon} ${forecastCfg.label}` : "Signal unavailable"}
            </span>
          </div>
        </div>
        {data.stop_rate_estimate && (
          <div className="mb-3">
            <StopRateChip estimate={data.stop_rate_estimate} />
          </div>
        )}
        {data.engagement_drivers?.length > 0 && (
          <ul className="space-y-1.5">
            {data.engagement_drivers.map((driver, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <ChevronRight size={12} className={`shrink-0 mt-0.5 ${forecastCfg ? forecastCfg.text : "text-gray-500"}`} />
                {driver}
              </li>
            ))}
          </ul>
        )}
        {!data.engagement_drivers?.length && !data.stop_rate_estimate && !forecastCfg && (
          <p className="text-xs text-gray-400">Analysis signal unavailable for engagement forecast.</p>
        )}
      </div>

      {/* Emotional Appeal + Archetype */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border ${emotionCfg ? emotionCfg.color : "border-slate-700/40 bg-slate-800/30"}`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Emotional Appeal</p>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${emotionCfg ? emotionCfg.badge : "bg-slate-500/20 text-gray-300"}`}>
            {emotionCfg ? `${emotionCfg.icon} ${data.emotional_appeal}` : "Signal unavailable"}
          </span>
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            {!hasEmotionSignal ? "Analysis signal unavailable for emotional profile." :
              data.emotional_appeal === "HIGH" ? "Strong scroll-stop potential. Triggers emotion in < 2 seconds." :
                data.emotional_appeal === "MEDIUM" ? "Informative and credible. Works for consideration audiences." :
                  "Purely functional. Only effective for high-intent retargeting."}
          </p>
        </div>
        <div className="p-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Creative Archetype</p>
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-fuchsia-500/20 text-fuchsia-300">
            🎯 {data.creative_archetype || "Feature Showcase"}
          </span>
          {data.emotion_signature && (
            <p className="text-[11px] text-gray-400 mt-2">
              Emotion mix: <span className="text-white font-semibold">{data.emotion_signature}</span>
            </p>
          )}
        </div>
      </div>

      {/* Visual Hierarchy */}
      <div className="p-3.5 rounded-xl bg-white/4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={12} className="text-violet-400" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visual Hierarchy</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.visual_hierarchy === "STRONG" ? "bg-emerald-500/20 text-emerald-300" :
            data.visual_hierarchy === "MODERATE" ? "bg-yellow-500/20 text-yellow-300" :
              "bg-red-500/20 text-red-300"
            }`}>{data.visual_hierarchy || "MODERATE"}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: "Headline", value: data.headlineDetected },
            { label: "Linear Flow", value: data.readingFlow === "LINEAR" },
            { label: "Focal Point", value: (data.focalPointStrength ?? 0) > 40 },
          ].map(({ label, value }) => (
            <div key={label} className={`p-2 rounded-lg text-center text-[10px] font-semibold ${value ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
              {value ? "✓" : "✗"} {label}
            </div>
          ))}
        </div>
      </div>

      {/* Color Intelligence */}
      {data.colorPalette?.length > 0 ? (
        <ColorPaletteStrip
          palette={data.colorPalette}
          harmony={data.colorHarmony}
          warmth={data.warmthScore}
          hue={data.dominantHue}
        />
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Color Intelligence</p>
          <p className="text-xs text-gray-400 mt-2">Analysis signal unavailable for color palette extraction.</p>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {data.wcagLevel && <WcagBadge level={data.wcagLevel} ratio={data.textContrast} />}
        {data.hasCurrency && (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
            💰 Price Detected
          </span>
        )}
        {data.hasPercentage && (
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
            % Offer Detected
          </span>
        )}
      </div>

      {/* Clutter Meter */}
      {hasClutterSignal && clutterLabel ? (
        <ClutterMeter index={clutterIndex} label={clutterLabel} />
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Clutter Index</p>
          <p className="text-xs text-gray-400 mt-2">Analysis signal unavailable for clutter diagnostics.</p>
        </div>
      )}

      {/* Dataset */}
      {data.dataset_matches?.length > 0 ? (
        <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-blue-400" />
            <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Dataset Pattern Matches</p>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${data.dataset_confidence === "HIGH" ? "bg-emerald-500/20 text-emerald-300" :
              data.dataset_confidence === "MODERATE" ? "bg-yellow-500/20 text-yellow-300" :
                "bg-gray-500/20 text-gray-400"
              }`}>{data.dataset_confidence || "MODERATE"}</span>
          </div>
          {data.dataset_matches.map((match, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/8">
              <span className={`shrink-0 mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded ${match.result_label === "HIGH_PERFORMER" ? "bg-emerald-500/20 text-emerald-300" :
                match.result_label === "LOW_PERFORMER" ? "bg-red-500/20 text-red-300" :
                  "bg-gray-500/20 text-gray-400"
                }`}>{match.result_label}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white font-semibold">{match.creative_id}{match.ctr ? ` — CTR: ${match.ctr}` : ""}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{match.learning}</p>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">{match.similarity}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-3">
          <Database size={14} className="text-blue-400 shrink-0" />
          <p className="text-xs text-gray-400">
            Connect your historical dataset to unlock pattern matching signals.
          </p>
        </div>
      )}
    </div>
  );
}

// ── A/B Hypothesis Cards ──────────────────────────────────────────────────────

function ABHypothesisCard({ hyp, index }) {
  const priorityColor = hyp.priority === "HIGH"
    ? "border-red-500/30 bg-red-500/5"
    : hyp.priority === "MEDIUM"
      ? "border-yellow-500/25 bg-yellow-500/4"
      : "border-white/10 bg-white/3";

  const priorityBadge = hyp.priority === "HIGH"
    ? "bg-red-500/20 text-red-300"
    : hyp.priority === "MEDIUM"
      ? "bg-yellow-500/20 text-yellow-300"
      : "bg-gray-500/20 text-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`p-3.5 rounded-xl border ${priorityColor}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <FlaskConical size={12} className="text-fuchsia-400" />
          <p className="text-xs font-bold text-white">{hyp.dimension}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge}`}>
          {hyp.priority} PRIORITY
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="p-2 rounded-lg bg-white/5 border border-white/8">
          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Variant A (Control)</p>
          <p className="text-[11px] text-gray-300">{hyp.variant_a}</p>
        </div>
        <div className="p-2 rounded-lg bg-fuchsia-500/8 border border-fuchsia-500/20">
          <p className="text-[9px] font-bold text-fuchsia-500 uppercase mb-1">Variant B (Test)</p>
          <p className="text-[11px] text-white">{hyp.variant_b}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ArrowUpRight size={11} className="text-emerald-400 shrink-0" />
        <p className="text-[11px] text-emerald-300 font-semibold">{hyp.expected_lift}</p>
      </div>
    </motion.div>
  );
}

// ── Fix Blocks Panel (v4) ─────────────────────────────────────────────────────

function FixBlockCard({ fix, index }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_CONFIG[fix.severity] || SEVERITY_CONFIG.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border overflow-hidden ${sev.color}`}
    >
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${fix.score < 40 ? "bg-red-500/20" : fix.score < 60 ? "bg-orange-500/15" : "bg-yellow-500/12"
          }`}>
          <span className={`text-sm font-black leading-none ${sc(fix.score)}`}>{fix.score}</span>
          <span className="text-[9px] text-gray-500">/100</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold text-white">{fix.dimension}</p>
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sev.badge}`}>
              {sev.icon} {fix.severity}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 truncate">{fix.problem}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-600 hidden sm:block">{fix.timeEstimate}</span>
          <motion.div animate={{ rotate: open ? 90 : 0 }}>
            <ChevronRight size={14} className="text-gray-500" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-white/8 pt-3">
              <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Problem</p>
                <p className="text-xs text-gray-300 leading-relaxed">{fix.problem}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Performance Impact</p>
                <p className="text-xs text-gray-300 leading-relaxed">{fix.impact}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">⚡ Fix Now ({fix.timeEstimate})</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{fix.fixNow}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-fuchsia-500/5 border border-fuchsia-500/15">
                  <p className="text-[10px] font-bold text-fuchsia-400 uppercase mb-1">🔬 Fix Deep</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{fix.fixDeep}</p>
                </div>
              </div>
              {fix.abTestIdea && (
                <div className="p-2.5 rounded-lg bg-fuchsia-500/4 border border-fuchsia-500/15">
                  <p className="text-[10px] font-bold text-fuchsia-500 uppercase mb-1">
                    <FlaskConical size={9} className="inline mr-1" />A/B Test Idea
                  </p>
                  <p className="text-[11px] text-gray-300">{fix.abTestIdea}</p>
                </div>
              )}
              {fix.datasetNote && (
                <div className="p-2 rounded-lg bg-white/3 border border-white/8">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">📊 Dataset Note</p>
                  <p className="text-[11px] text-gray-400">{fix.datasetNote}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Core Check Row ─────────────────────────────────────────────────────────────

function CoreCheckRow({ icon: Icon, label, data }) {
  const hasScore = Number.isFinite(data.score);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${!hasScore ? "bg-slate-500/5 border-slate-500/20" : data.pass ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
      }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!hasScore ? "bg-slate-500/15 text-slate-300" : data.pass ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
        }`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className={`text-[11px] truncate ${!hasScore ? "text-slate-300/70" : data.pass ? "text-emerald-300/70" : "text-red-300/70"}`}>{data.label}</p>
      </div>
      <div className={`text-sm font-black shrink-0 tabular-nums ${!hasScore ? "text-slate-300" : data.pass ? "text-emerald-400" : "text-red-400"}`}>{hasScore ? data.score : "--"}</div>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-white font-bold tabular-nums">{value}</span>
      </div>
      <AnimBar value={value} color={color} />
    </div>
  );
}

function LayerSection({ title, score, breakdown, issues, tone = "fuchsia" }) {
  const toneStyles = {
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-300",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-300",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300",
  };
  const hasScore = Number.isFinite(score);

  return (
    <div className={`p-3.5 rounded-xl border ${toneStyles[tone] || toneStyles.fuchsia}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider">{title}</p>
        <span className="text-sm font-black tabular-nums">{hasScore ? `${score}/100` : "Signal unavailable"}</span>
      </div>
      <AnimBar value={hasScore ? score : 0} color="bg-white/70" />
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="mt-3 space-y-1.5">
          {Object.entries(breakdown).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] text-gray-300" title={`Measured ${k.replace(/([A-Z])/g, " $1")} score from deterministic signals`}>
              <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
              <span className="font-semibold tabular-nums">{Number.isFinite(Number(v)) ? Math.round(Number(v)) : "—"}</span>
            </div>
          ))}
        </div>
      )}
      {issues?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {issues.slice(0, 3).map((issue, idx) => (
            <li key={idx} className="text-[11px] text-gray-400">• {issue}</li>
          ))}
        </ul>
      )}
      {!hasScore && (!breakdown || Object.keys(breakdown).length === 0) && (
        <p className="text-[11px] text-gray-400 mt-3">No runtime signal available for this layer.</p>
      )}
    </div>
  );
}

function SectionContainer({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_8px_24px_rgba(2,6,23,0.35)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ScoreCard({ label, value, tone = "blue", hint }) {
  const toneMap = {
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    yellow: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    purple: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300",
    slate: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone] || toneMap.blue}`} title={hint || label}>
      <p className="text-[11px] uppercase tracking-wider font-semibold opacity-80">{label}</p>
      <p className="text-2xl font-black mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] mt-1 opacity-80">{hint}</p>}
    </div>
  );
}

function ImpactCard({ item }) {
  const priorityTone = item.priority === "High"
    ? "border-red-500/30 bg-red-500/7 text-red-300"
    : item.priority === "Medium"
      ? "border-amber-500/30 bg-amber-500/7 text-amber-300"
      : "border-emerald-500/30 bg-emerald-500/7 text-emerald-300";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-white">{item.issue}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityTone}`}>{item.priority}</span>
      </div>
      <p className="text-xs text-gray-300">{item.impact}</p>
      <p className="text-xs text-orange-300 mt-1">{item.estimatedEffect}</p>
      <p className="text-xs text-gray-400 mt-1">Fix: {item.fix}</p>
      <p className="text-xs text-emerald-300 mt-1">Expected outcome: {item.expectedOutcome}</p>
    </div>
  );
}

function PlatformCheckGrid({ platformChecks }) {
  if (!platformChecks) return null;
  const desktopItems = [
    { key: "layoutBalance", label: "Layout Balance" },
    { key: "visualHierarchy", label: "Visual Hierarchy" },
    { key: "contentStructure", label: "Content Structure" },
    { key: "placementBlend", label: "Placement Blend" },
  ];
  const mobileItems = [
    { key: "readability", label: "Readability" },
    { key: "textDensity", label: "Text Density" },
    { key: "ctaSize", label: "CTA Size" },
  ];
  const Pill = ({ label, data }) => (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${data?.pass ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-300" : "bg-red-500/8 border-red-500/25 text-red-300"
      }`}>
      <span className="font-medium">{label}</span>
      <span className="font-bold ml-2">{data?.score ?? 0}</span>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={12} className="text-blue-400" />
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Desktop</p>
        </div>
          {desktopItems.map(({ key, label }) => <Pill key={key} label={label} data={platformChecks.desktop?.[key]} />)}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone size={12} className="text-purple-400" />
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Mobile</p>
        </div>
          {mobileItems.map(({ key, label }) => <Pill key={key} label={label} data={platformChecks.mobile?.[key]} />)}
      </div>
    </div>
  );
}

function RankingLeaderboard({ results }) {
  const sortable = (item) => (Number.isFinite(item?.data?.overall_score) ? item.data.overall_score : -1);
  const sorted = [...results].sort((a, b) => sortable(b) - sortable(a));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={15} className="text-yellow-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Creative Ranking</h4>
        <span className="ml-auto text-[10px] text-gray-500">Sorted by Structured Final Score</span>
      </div>
      {sorted.map((res, rank) => {
        const score = Number.isFinite(res.data.overall_score) ? res.data.overall_score : null;
        const forecast = res.data.engagement_forecast;
        return (
          <motion.div
            key={res.creative.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.07 }}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 ${rank === 0 ? "border-yellow-500/40 bg-yellow-500/5" :
              rank === 1 ? "border-gray-400/30 bg-gray-400/5" :
                rank === 2 ? "border-orange-600/30 bg-orange-600/5" :
                  "border-white/8 bg-white/3"
              }`}
          >
            <div className="text-2xl shrink-0 w-8 text-center">{medalFor(rank)}</div>
            <img src={res.creative.url} className="w-14 h-10 rounded-lg object-cover shrink-0 border border-white/15" alt={res.creative.name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{res.creative.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-[11px] text-gray-400">{res.creative.size}</p>
                <BestForBadge bestFor={res.data?.bestFor} />
                {forecast && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${forecast === "HIGH" ? "bg-emerald-500/20 text-emerald-300" :
                    forecast === "MEDIUM" ? "bg-yellow-500/20 text-yellow-300" :
                        "bg-red-500/20 text-red-300"
                    }`}>
                    {forecast === "HIGH" ? "🟢" : forecast === "MEDIUM" ? "🟡" : "🔴"} {forecast}
                  </span>
                )}
              </div>
              <p className={`text-[11px] mt-1 leading-relaxed ${!Number.isFinite(score) ? "text-slate-300/80" : score >= 65 ? "text-emerald-300/80" : score >= 45 ? "text-yellow-300/80" : "text-red-300/80"
                }`}>{rankVerdict(res.creative.name, score, res.data)}</p>
            </div>
            <div className="shrink-0">
              <span className={`text-xs font-black ${sc(score)}`}>
                {Number.isFinite(score) ? `${score}/100` : "--"}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AnalysisPanel({
  analysisResult,
  campaignGoal,
  platform,
  onDownloadReport,
}) {
  const sortableScore = (entry) => (Number.isFinite(entry?.data?.overall_score) ? entry.data.overall_score : -1);
  const sortedResult = [...analysisResult].sort((a, b) => sortableScore(b) - sortableScore(a));
  const getRank = (id) => sortedResult.findIndex(r => r.creative.id === id);

  const [selectedId, setSelectedId] = useState(analysisResult?.[0]?.creative?.id || null);
  const [tab, setTab] = useState("overview");

  if (!analysisResult || analysisResult.length === 0) return null;

  const scoreAvailable = analysisResult.filter((r) => Number.isFinite(r.data.overall_score));
  const unavailable = analysisResult.filter((r) => !Number.isFinite(r.data.overall_score));
  const perfect = scoreAvailable.filter((r) => r.data.overall_score >= 70);
  const needsWork = scoreAvailable.filter((r) => r.data.overall_score < 70);
  const selected = analysisResult.find((r) => r.creative.id === selectedId);
  const selectedRank = selected ? getRank(selected.creative.id) : -1;
  const goalAligned = analysisResult.filter((r) => r?.data?.goal_alignment?.is_aligned !== false);
  const verticalAligned = analysisResult.filter((r) => r?.data?.vertical_alignment?.is_aligned !== false);
  const goalMisaligned = analysisResult.filter((r) => r?.data?.goal_alignment?.is_aligned === false);
  const verticalMisaligned = analysisResult.filter((r) => r?.data?.vertical_alignment?.is_aligned === false);

  const CORE_CHECK_CONFIG = [
    { key: "noticeability", icon: Eye, label: "Noticeable in Environment" },
    { key: "messageClarity", icon: MessageSquare, label: "Message Clarity (3-sec)" },
    { key: "ctaStrength", icon: MousePointer, label: "CTA Strength" },
    { key: "brandPresence", icon: Shield, label: "Brand Presence" },
    { key: "crowding", icon: LayoutDashboard, label: "Crowding / Clutter" },
    { key: "formatFit", icon: Maximize2, label: "Format Fit" },
  ];

  const TABS = [
    { id: "overview", label: "Intelligence", icon: Brain },
    { id: "abtests", label: "A/B Tests", icon: FlaskConical, badge: selected?.data?.ab_hypotheses?.length },
    { id: "platform", label: "Device Fit", icon: Monitor },
  ];

  return (
    <div className="space-y-6">

      {/* ── Summary Banner ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-linear-to-br from-slate-800/60 to-slate-900/60 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-fuchsia-400" />
          <h3 className="text-sm font-bold text-white">Adigator Creative Intelligence</h3>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
            Adigator AI Engine
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          {[
            { label: "Analyzed", value: analysisResult.length, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
            { label: "Launch Ready", value: perfect.length, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
            { label: "Needs Work", value: needsWork.length, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
            { label: "Unavailable", value: unavailable.length, color: "bg-slate-500/10 border-slate-500/20 text-slate-300" },
            { label: "Goal Aligned", value: `${goalAligned.length}/${analysisResult.length}`, color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" },
            { label: "Vertical Aligned", value: `${verticalAligned.length}/${analysisResult.length}`, color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" },
            { label: "High Forecast", value: analysisResult.filter(r => ["HIGH"].includes(r.data.engagement_forecast)).length, color: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400" },
            { label: "Top Ranked", value: perfect.length > 0 ? perfect[0]?.creative?.name || "-" : "-", color: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`text-center p-2.5 rounded-xl border ${color}`}>
              <p className="text-xl font-black truncate">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {perfect.length > 0 && (
            <p className="text-xs text-emerald-300">
              ✅ <strong>{perfect.map(r => r.creative.name).join(", ")}</strong> {perfect.length === 1 ? "is" : "are"} ready to launch.
            </p>
          )}
          {needsWork.length > 0 && (
            <p className="text-xs text-yellow-300">
              ⚠️ <strong>{needsWork.map(r => r.creative.name).join(", ")}</strong> {needsWork.length === 1 ? "needs" : "need"} improvements before going live.
            </p>
          )}
          {unavailable.length > 0 && (
            <p className="text-xs text-slate-300">
              ℹ️ <strong>{unavailable.map(r => r.creative.name).join(", ")}</strong> {unavailable.length === 1 ? "has" : "have"} unavailable or insufficient evidence states.
            </p>
          )}
          {goalMisaligned.length > 0 && (
            <p className="text-xs text-red-300">
              ❌ <strong>{goalMisaligned.map(r => r.creative.name).join(", ")}</strong> {goalMisaligned.length === 1 ? "is" : "are"} not aligned with selected campaign goal.
            </p>
          )}
          {verticalMisaligned.length > 0 && (
            <p className="text-xs text-red-300">
              ❌ <strong>{verticalMisaligned.map(r => r.creative.name).join(", ")}</strong> {verticalMisaligned.length === 1 ? "is" : "are"} not aligned with selected industry vertical.
            </p>
          )}
        </div>
      </div>

      {/* ── Two-panel layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT: Creative List */}
        <div className="space-y-2">
          {sortedResult.map((res) => {
            const score = res.data.overall_score;
            const isSelected = selectedId === res.creative.id;
            const forecast = res.data.engagement_forecast;
            const criticalFixes = res.data.fix_blocks?.filter(f => f.severity === "CRITICAL").length || 0;
            return (
              <motion.button
                key={res.creative.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => { setSelectedId(res.creative.id); setTab("overview"); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? "border-fuchsia-500 bg-fuchsia-900/25" : "border-white/10 bg-white/4 hover:border-white/22"
                  }`}
              >
                <div className="text-sm shrink-0 w-6 text-center font-bold text-yellow-500">
                  {medalFor(getRank(res.creative.id))}
                </div>
                <img src={res.creative.url} className="w-12 h-10 rounded-lg object-cover shrink-0 border border-white/20" alt={res.creative.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{res.creative.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-[10px] text-gray-500">{res.creative.size}</p>
                    {forecast && <span className="text-[9px]">{forecast === "HIGH" ? "🟢" : forecast === "MEDIUM" ? "🟡" : "🔴"}</span>}
                    {criticalFixes > 0 && (
                      <span className="text-[9px] font-bold text-red-400">⚠ {criticalFixes} critical</span>
                    )}
                    {res?.data?.goal_alignment?.is_aligned === false && (
                      <span className="text-[9px] font-bold text-red-300">Goal mismatch</span>
                    )}
                    {res?.data?.vertical_alignment?.is_aligned === false && (
                      <span className="text-[9px] font-bold text-red-300">Vertical mismatch</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-black shrink-0 ${sc(score)}`}>
                  {Number.isFinite(score) ? `${score}/100` : "--"}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* RIGHT: Detail Panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.creative.id}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="lg:col-span-2 rounded-2xl border border-fuchsia-500/25 bg-linear-to-br from-fuchsia-900/15 to-purple-900/15 p-5 space-y-5"
            >
              <div className="rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md p-3 shadow-[0_10px_30px_rgba(2,6,23,0.5)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <ScoreCard
                    label="Final Score"
                    value={Number.isFinite(selected.data.finalScore ?? selected.data.score)
                      ? `${Math.round(selected.data.finalScore ?? selected.data.score)}/100`
                      : (selected.data.analysis_state_label || "Analysis unavailable")}
                    tone="purple"
                    hint="Weighted score from Eligibility, Attention, and Performance layers"
                  />
                  <ScoreCard
                    label="Engagement"
                    value={selected.data.engagement?.level || selected.data.engagement_forecast || "Analysis unavailable"}
                    tone={(selected.data.engagement?.level || selected.data.engagement_forecast) === "HIGH"
                      ? "green"
                      : (selected.data.engagement?.level || selected.data.engagement_forecast) === "MEDIUM"
                        ? "yellow"
                        : (selected.data.engagement?.level || selected.data.engagement_forecast) === "UNAVAILABLE"
                          ? "slate"
                          : "blue"}
                    hint="Derived from attention and performance layers"
                  />
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center gap-4">
                <img src={selected.creative.url} className="w-20 h-16 rounded-xl object-cover border border-white/20 shrink-0" alt={selected.creative.name} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">{selected.creative.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{medalFor(selectedRank)}</span>
                    <p className={`text-sm font-semibold ${sc(selected.data.overall_score)}`}>
                      {Number.isFinite(selected.data.overall_score)
                        ? `${scoreLabel(selected.data.overall_score)} (${selected.data.overall_score}/100)`
                        : (selected.data.analysis_state_label || scoreLabel(selected.data.overall_score))}
                    </p>
                    {selected.data.decisionEngine?.grade && (
                      <GradeBadge grade={selected.data.decisionEngine.grade.grade} />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.data.engagement_forecast && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selected.data.engagement_forecast === "HIGH" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" :
                          selected.data.engagement_forecast === "MEDIUM" ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300" :
                            "bg-red-500/15 border-red-500/40 text-red-300"
                        }`}>
                        {selected.data.engagement_forecast}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/15 bg-white/5 text-gray-300">
                      Clutter {selected.data.clutter_index ?? "?"}/10
                    </span>
                    {selected.data.wcagLevel && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selected.data.wcagLevel === "AAA" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" :
                        selected.data.wcagLevel === "AA" ? "bg-blue-500/15 border-blue-500/40 text-blue-300" :
                          "bg-red-500/15 border-red-500/40 text-red-300"
                        }`}>WCAG {selected.data.wcagLevel}</span>
                    )}
                    {selected.data.stop_rate_estimate && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300">
                        Stop Rate {selected.data.stop_rate_estimate}
                      </span>
                    )}
                    {selected?.data?.goal_alignment?.is_aligned === false && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/40 bg-red-500/15 text-red-200">
                        Campaign goal not aligned
                      </span>
                    )}
                    {selected?.data?.vertical_alignment?.is_aligned === false && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/40 bg-red-500/15 text-red-200">
                        Vertical not aligned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex items-center gap-1 shrink-0 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${tab === t.id ? "bg-fuchsia-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                      }`}
                  >
                    <t.icon size={11} />
                    {t.label}
                    {t.badge > 0 && (
                      <span className={`ml-0.5 text-[9px] font-black px-1 py-0.5 rounded-full leading-none ${tab === t.id ? "bg-white/25 text-white" : "bg-white/10 text-gray-400"
                        }`}>{t.badge}</span>
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── OVERVIEW TAB ─────────────────────────────── */}
                {tab === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

                    <div className="space-y-4">
                      <IntelligencePanel data={selected.data} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">6 Core Creative Checks</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CORE_CHECK_CONFIG.map(({ key, icon, label }) => (
                          <CoreCheckRow key={key} icon={icon} label={label} data={selected.data.coreChecks?.[key] || { score: "—", label: "Signal unavailable", pass: false }} />
                        ))}
                      </div>
                    </div>

                    <SectionContainer
                      title="Core Scoring Layers"
                      subtitle="Eligibility (20%) + Attention (40%) + Performance (40%)"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <LayerSection
                          title="Eligibility"
                          score={selected.data.eligibility?.score}
                          breakdown={selected.data.eligibility?.breakdown}
                          issues={selected.data.eligibility?.issues}
                          tone="blue"
                        />
                        <LayerSection
                          title="Attention"
                          score={selected.data.attention?.score}
                          breakdown={selected.data.attention?.breakdown}
                          tone="purple"
                        />
                        <LayerSection
                          title="Performance"
                          score={selected.data.performance?.score}
                          breakdown={selected.data.performance?.breakdown}
                          tone="emerald"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Final Score = 20% Eligibility + 40% Attention + 40% Performance = <span className="text-white font-bold">{selected.data.finalScore ?? selected.data.score}</span>
                      </p>
                    </SectionContainer>

                    {/* ── Creative Intelligence Dashboard (AI Subscores + Decision Engine) ── */}
                    {(selected.data.aiData || selected.data.decisionEngine) && (
                      <CreativeIntelligenceDashboard
                        aiData={selected.data.aiData}
                        decisionEngine={selected.data.decisionEngine}
                      />
                    )}

                    {selected.data.performanceImpact?.length > 0 && (
                      <SectionContainer
                        title="Performance Impact Layer"
                        subtitle="Business impact translation from measurable creative signals"
                        right={<span className="text-[11px] px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">Premium</span>}
                      >
                        {(() => {
                          const ordered = [...selected.data.performanceImpact].sort((a, b) => {
                            const rank = { High: 0, Medium: 1, Low: 2 };
                            return rank[a.priority] - rank[b.priority];
                          });
                          const top = ordered[0];
                          return (
                            <div className="space-y-3">
                              {top && (
                                <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3">
                                  <p className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">Top Recommendation</p>
                                  <p className="text-sm font-semibold text-white mt-1">{top.issue}</p>
                                  <p className="text-xs text-fuchsia-200 mt-1">{top.estimatedEffect}</p>
                                  <p className="text-xs text-gray-300 mt-1">Fix: {top.fix}</p>
                                  <p className="text-xs text-emerald-300 mt-1">Expected outcome: {top.expectedOutcome}</p>
                                </div>
                              )}
                              <div className="space-y-2">
                                {ordered.map((item, i) => <ImpactCard key={`${item.issue}-${i}`} item={item} />)}
                              </div>
                            </div>
                          );
                        })()}
                      </SectionContainer>
                    )}

                    {selected.data.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-white mb-2">💡 Quick Suggestions</p>
                        {selected.data.suggestions.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/8 text-xs text-gray-300 mb-1.5">
                            <span className="text-fuchsia-400 shrink-0 mt-0.5">→</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── A/B TESTS TAB ────────────────────────────── */}
                {tab === "abtests" && (
                  <motion.div key="abtests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <p className="text-[10px] text-gray-500">Auto-generated split test hypotheses based on scoring gaps.</p>
                    {selected.data.ab_hypotheses?.length > 0
                      ? selected.data.ab_hypotheses.map((hyp, i) => <ABHypothesisCard key={`${hyp.dimension}-${i}-${hyp.variant_b || ""}`} hyp={hyp} index={i} />)
                      : (
                        <div className="p-6 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20 text-center">
                          <FlaskConical size={20} className="text-fuchsia-400 mx-auto mb-2" />
                          <p className="text-fuchsia-400 font-bold text-sm">No A/B tests needed</p>
                          <p className="text-xs text-gray-400 mt-1">All major dimensions are scoring well. Focus on scaling.</p>
                        </div>
                      )
                    }
                  </motion.div>
                )}

                {/* ── PLATFORM TAB ─────────────────────────────── */}
                {tab === "platform" && (
                  <motion.div key="platform" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <p className="text-[10px] text-gray-500">
                      Device-fit checks for <span className="text-white font-semibold capitalize">{platform}</span>
                    </p>
                    <PlatformCheckGrid platformChecks={selected.data.platformChecks} />
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ── Download Report ───────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        onClick={onDownloadReport}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-white/8 hover:bg-white/14 border border-fuchsia-500/35 text-fuchsia-200 rounded-xl font-bold text-sm transition"
      >
        <Download size={16} /> Download Full ACIE v4.0 Analysis Report
      </motion.button>
    </div>
  );
}
