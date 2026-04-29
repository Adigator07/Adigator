"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, CheckCircle2, XCircle, AlertCircle, Monitor, Smartphone,
  Trophy, Star, TrendingUp, Eye, MessageSquare, MousePointer,
  Shield, LayoutDashboard, Maximize2
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const GOAL_CTA = {
  awareness:     ["Learn More", "Discover", "Explore", "Watch Now", "See Now"],
  consideration: ["View Details", "Compare Now", "Check Features", "See Pricing", "Try Demo"],
  conversion:    ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function rankVerdict(name, score, data) {
  if (score >= 80) {
    return `"${name}" is perfect and strongly aligned with all standards and campaign goals.`;
  }
  if (score >= 65) {
    const weak = [];
    if (!data.cta_presence)           weak.push("CTA is missing");
    if (!data.coreChecks?.formatFit?.pass) weak.push("format needs checking");
    if (data.coreChecks?.crowding?.score < 50) weak.push("layout is overcrowded");
    const hint = weak.length > 0 ? ` — ${weak.join(" and ")}` : "";
    return `"${name}" meets most standards${hint}. Minor improvements suggested.`;
  }
  if (score >= 45) {
    const issues = [];
    if (!data.cta_presence) issues.push("CTA not aligned with goal");
    if (data.coreChecks?.messageClarity?.score < 55) issues.push("message clarity needs work");
    if (data.adVisibilityScore < 40) issues.push("low ad visibility");
    const hint = issues.length > 0 ? ` — ${issues.join(", ")}` : "";
    return `"${name}" needs work${hint}. Review suggestions below.`;
  }
  return `"${name}" has critical issues and is not recommended for launch without revisions.`;
}

function medalFor(rank) {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `#${rank + 1}`;
}

function scoreColor(score) {
  if (score >= 70) return "text-green-400";
  if (score >= 45) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score) {
  if (score >= 70) return "bg-green-400";
  if (score >= 45) return "bg-yellow-400";
  return "bg-red-400";
}

function scoreLabel(score) {
  if (score >= 80) return "Excellent ✨";
  if (score >= 70) return "Good ✓";
  if (score >= 55) return "Fair ⚠";
  if (score >= 45) return "Needs Work 🛠";
  return "Poor ✗";
}

// ── Sub-Components ─────────────────────────────────────────────────────────────

function CoreCheckRow({ icon: Icon, label, data }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      data.pass
        ? "bg-green-500/5 border-green-500/20"
        : "bg-red-500/5 border-red-500/20"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        data.pass ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className={`text-[11px] truncate ${data.pass ? "text-green-300/70" : "text-red-300/70"}`}>
          {data.label}
        </p>
      </div>
      <div className={`text-xs font-bold shrink-0 ${data.pass ? "text-green-400" : "text-red-400"}`}>
        {data.score}
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-bold">{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: value / 100 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full origin-left rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function PlatformCheckGrid({ platformChecks }) {
  if (!platformChecks) return null;
  const desktopItems = [
    { key: "layoutBalance",    label: "Layout Balance" },
    { key: "visualHierarchy",  label: "Visual Hierarchy" },
    { key: "contentStructure", label: "Content Structure" },
    { key: "placementBlend",   label: "Placement Blend" },
  ];
  const mobileItems = [
    { key: "readability",   label: "Readability" },
    { key: "textDensity",   label: "Text Density" },
    { key: "ctaSize",       label: "CTA Size" },
    { key: "attentionGrab", label: "Attention Grab" },
  ];

  const Pill = ({ label, data }) => (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
      data?.pass
        ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-300"
        : "bg-red-500/8 border-red-500/25 text-red-300"
    }`}>
      <span className="font-medium">{label}</span>
      <span className="font-bold ml-2">{data?.score ?? 0}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Monitor size={13} className="text-blue-400" />
          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Desktop Checks</p>
        </div>
        {desktopItems.map(({ key, label }) => (
          <Pill key={key} label={label} data={platformChecks.desktop?.[key]} />
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone size={13} className="text-purple-400" />
          <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Mobile Checks</p>
        </div>
        {mobileItems.map(({ key, label }) => (
          <Pill key={key} label={label} data={platformChecks.mobile?.[key]} />
        ))}
      </div>
    </div>
  );
}

function CTARecommendationStrip({ goal, detected }) {
  const recs = GOAL_CTA[goal] || [];
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Recommended CTAs for {goal}
      </p>
      <div className="flex flex-wrap gap-2">
        {recs.map((cta) => {
          const isDetected = detected && detected.toLowerCase().includes(cta.toLowerCase());
          return (
            <span
              key={cta}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                isDetected
                  ? "bg-green-500/20 border-green-500/50 text-green-300"
                  : "bg-white/5 border-white/15 text-gray-400"
              }`}
            >
              {isDetected ? "✓ " : ""}{cta}
            </span>
          );
        })}
      </div>
      {detected && (
        <p className="text-[11px] text-gray-500">
          Detected in creative: <span className="text-white font-semibold">"{detected}"</span>
        </p>
      )}
    </div>
  );
}

function RankingLeaderboard({ results }) {
  const sorted = [...results].sort((a, b) => b.data.overall_score - a.data.overall_score);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-yellow-400" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Creative Ranking</h4>
      </div>
      {sorted.map((res, rank) => {
        const score = res.data.overall_score;
        return (
          <motion.div
            key={res.creative.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.07 }}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
              rank === 0
                ? "border-yellow-500/40 bg-yellow-500/5"
                : rank === 1
                ? "border-gray-400/30 bg-gray-400/5"
                : rank === 2
                ? "border-orange-600/30 bg-orange-600/5"
                : "border-white/8 bg-white/3"
            }`}
          >
            <div className="text-2xl shrink-0 w-8 text-center">{medalFor(rank)}</div>
            <img
              src={res.creative.url}
              className="w-14 h-10 rounded-lg object-cover shrink-0 border border-white/15"
              alt={res.creative.name}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{res.creative.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{res.creative.size}</p>
              <p className={`text-[11px] mt-1 leading-relaxed ${
                score >= 65 ? "text-green-300/80" : score >= 45 ? "text-yellow-300/80" : "text-red-300/80"
              }`}>
                {rankVerdict(res.creative.name, score, res.data)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-xl font-extrabold ${scoreColor(score)}`}>{score}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">/100</p>
              <p className={`text-[10px] font-semibold mt-1 ${scoreColor(score)}`}>
                {scoreLabel(score)}
              </p>
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
  audienceType,
  onDownloadReport,
}) {
  const [selectedId, setSelectedId] = useState(
    analysisResult?.[0]?.creative?.id || null
  );
  const [tab, setTab] = useState("overview"); // 'overview' | 'platform' | 'ranking'

  if (!analysisResult || analysisResult.length === 0) return null;

  const perfect    = analysisResult.filter((r) => r.data.overall_score >= 70);
  const needsWork  = analysisResult.filter((r) => r.data.overall_score < 70);
  const selected   = analysisResult.find((r) => r.creative.id === selectedId);

  const CORE_CHECK_CONFIG = [
    { key: "noticeability",  icon: Eye,             label: "Noticeable in Environment" },
    { key: "messageClarity", icon: MessageSquare,   label: "Message Clarity (1-2 sec)" },
    { key: "ctaStrength",    icon: MousePointer,    label: "CTA Strength" },
    { key: "brandPresence",  icon: Shield,          label: "Brand Presence" },
    { key: "crowding",       icon: LayoutDashboard, label: "Crowding / Layout" },
    { key: "formatFit",      icon: Maximize2,       label: "Format Fit" },
  ];

  const TABS = [
    { id: "overview",  label: "Overview" },
    { id: "platform",  label: "Platform Checks" },
    { id: "ranking",   label: "🏆 Ranking" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Summary Banner ─────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 space-y-2">
        <h3 className="text-base font-bold text-white mb-3">📊 Analysis Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-400">{analysisResult.length}</p>
            <p className="text-xs text-gray-400 mt-1">Analyzed</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{perfect.length}</p>
            <p className="text-xs text-gray-400 mt-1">Ready</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-400">{needsWork.length}</p>
            <p className="text-xs text-gray-400 mt-1">Needs Work</p>
          </div>
        </div>
        {perfect.length > 0 && (
          <p className="text-sm text-green-300">
            ✅ <strong>{perfect.map((r) => r.creative.name).join(", ")}</strong>{" "}
            {perfect.length === 1 ? "is" : "are"} ready for launch.
          </p>
        )}
        {needsWork.length > 0 && (
          <p className="text-sm text-yellow-300">
            ⚠️ <strong>{needsWork.map((r) => r.creative.name).join(", ")}</strong>{" "}
            {needsWork.length === 1 ? "needs" : "need"} improvements.
          </p>
        )}
      </div>

      {/* ── Two-panel layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Creative List */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Creatives</p>
          {analysisResult.map((res) => {
            const score      = res.data.overall_score;
            const isSelected = selectedId === res.creative.id;
            return (
              <motion.button
                key={res.creative.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedId(res.creative.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-fuchsia-500 bg-fuchsia-900/30"
                    : "border-white/10 bg-white/5 hover:border-white/25"
                }`}
              >
                <img
                  src={res.creative.url}
                  className="w-12 h-10 rounded-lg object-cover shrink-0 border border-white/20"
                  alt={res.creative.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{res.creative.name}</p>
                  <p className="text-[10px] text-gray-500">{res.creative.size}</p>
                  <p className={`text-xs font-bold ${scoreColor(score)}`}>
                    {score}/100 — {scoreLabel(score)}
                  </p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${scoreBg(score)}`} />
              </motion.button>
            );
          })}
        </div>

        {/* RIGHT: Detail Panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.creative.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="lg:col-span-2 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <img
                  src={selected.creative.url}
                  className="w-20 h-16 rounded-xl object-cover border border-white/20"
                  alt={selected.creative.name}
                />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white">{selected.creative.name}</h4>
                  <p className={`text-sm font-semibold ${scoreColor(selected.data.overall_score)}`}>
                    {scoreLabel(selected.data.overall_score)} ({selected.data.overall_score}/100)
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selected.data.cta_presence
                        ? "bg-green-500/15 border-green-500/40 text-green-300"
                        : "bg-red-500/15 border-red-500/40 text-red-300"
                    }`}>
                      {selected.data.cta_presence ? "✅ CTA Present" : "❌ No CTA"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/15 bg-white/5 text-gray-300">
                      Visibility: {selected.data.adVisibilityScore}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/15 bg-white/5 text-gray-300">
                      Goal Align: {selected.data.goalAlignmentIndicator}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selected.data.coreChecks?.formatFit?.pass
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                        : "bg-orange-500/15 border-orange-500/40 text-orange-300"
                    }`}>
                      {selected.data.coreChecks?.formatFit?.pass ? "✓ Valid Size" : "⚠ Invalid Size"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      tab === t.id
                        ? "bg-fuchsia-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* AI Funnel Analysis */}
                    {selected.data.primary_stage && (
                      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                            <span>🧠</span> AI Funnel Classification
                          </p>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-lg border border-blue-500/30">
                            {selected.data.primary_stage} Stage
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {selected.data.funnelReasoning}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <MetricBar label="Awareness" value={selected.data.stageScores?.awareness || 0} color="bg-cyan-400" />
                          <MetricBar label="Consideration" value={selected.data.stageScores?.consideration || 0} color="bg-purple-400" />
                          <MetricBar label="Conversion" value={selected.data.stageScores?.conversion || 0} color="bg-emerald-400" />
                        </div>

                        {selected.data.funnelSignals?.length > 0 && (
                          <div className="pt-2 border-t border-white/10 mt-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Detected Signals</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selected.data.funnelSignals.map((sig, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-white/10 text-gray-300 rounded-full border border-white/5">
                                  {sig}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 6 Core Checks */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        6 Core Creative Checks
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CORE_CHECK_CONFIG.map(({ key, icon, label }) => (
                          <CoreCheckRow
                            key={key}
                            icon={icon}
                            label={label}
                            data={selected.data.coreChecks?.[key] || { score: 0, label: "—", pass: false }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* CTA Recommendations */}
                    <CTARecommendationStrip
                      goal={selected.data.goal || campaignGoal}
                      detected={selected.data.cta_detected}
                    />

                    {/* Metric Bars */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Performance Metrics
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricBar label="Ad Visibility"    value={selected.data.adVisibilityScore}       color="bg-cyan-400" />
                        <MetricBar label="Goal Alignment"   value={selected.data.goalAlignmentIndicator}  color="bg-fuchsia-400" />
                        <MetricBar label="Brightness"       value={selected.data.brightness}              color="bg-yellow-400" />
                        <MetricBar label="Contrast"         value={selected.data.contrast}                color="bg-blue-400" />
                        <MetricBar label="Text Clarity"     value={selected.data.text_clarity}            color="bg-sky-400" />
                        <MetricBar label="CTA Strength"     value={
                          { none: 0, weak: 33, medium: 66, strong: 100 }[selected.data.cta_strength] ?? 0
                        } color="bg-green-400" />
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <p className="text-sm font-bold text-white mb-2">💡 Suggestions</p>
                      {selected.data.suggestions?.length > 0
                        ? selected.data.suggestions.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-300 mb-1.5"
                            >
                              <span className="text-fuchsia-400 shrink-0">→</span>
                              {s}
                            </div>
                          ))
                        : (
                          <p className="text-sm text-green-400">
                            No improvements needed — this creative is ready! 🚀
                          </p>
                        )}
                    </div>
                  </motion.div>
                )}

                {tab === "platform" && (
                  <motion.div
                    key="platform"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-gray-500">
                      Platform-specific performance for <span className="text-white font-semibold capitalize">{platform}</span> ads
                    </p>
                    <PlatformCheckGrid platformChecks={selected.data.platformChecks} />
                  </motion.div>
                )}

                {tab === "ranking" && (
                  <motion.div
                    key="ranking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <RankingLeaderboard results={analysisResult} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Standalone Ranking (full width below panels) ───────────── */}
      <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-orange-900/10 p-6">
        <RankingLeaderboard results={analysisResult} />
      </div>

      {/* ── Download Report ───────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onDownloadReport}
        className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 border border-fuchsia-500/40 text-fuchsia-200 rounded-xl font-bold transition"
      >
        <Download size={18} /> Download Full Analysis Report (PDF)
      </motion.button>
    </div>
  );
}
