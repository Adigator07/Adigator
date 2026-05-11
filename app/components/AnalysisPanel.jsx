"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle,
  Download,
  Eye,
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

function SummaryCard({ label, value, sub, accent = "slate" }) {
  const accents = {
    slate: "border-white/10 bg-white/5",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    red: "border-red-500/30 bg-red-500/10",
    cyan: "border-cyan-500/30 bg-cyan-500/10",
  };
  return (
    <div className={`rounded-xl border p-3 ${accents[accent] || accents.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white leading-tight truncate">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400 leading-snug truncate">{sub}</p>}
    </div>
  );
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

  // Summary bar metrics
  const goalMisalignedCount = sorted.filter(
    (e) => getEntryPayload(e)?.goal_alignment?.is_aligned === false
  ).length;
  const verticalMisalignedCount = sorted.filter(
    (e) => getEntryPayload(e)?.vertical_alignment?.is_aligned === false
  ).length;
  const strategicallyReadyCount = sorted.filter((e) => {
    const p = getEntryPayload(e) || {};
    const score = getStrategicAlignmentScore(p) ?? 0;
    return score >= 70 && p?.goal_alignment?.is_aligned !== false && p?.vertical_alignment?.is_aligned !== false;
  }).length;

  const topEntry = sorted[0];
  const topPayload = getEntryPayload(topEntry) || {};
  const topScore = getStrategicAlignmentScore(topPayload);
  const topLabel = getCreativeStatusLabel(topPayload);
  const topName = topEntry?.creative?.name || "N/A";
  const topNameShort = topName.length > 20 ? topName.slice(0, 19) + "…" : topName;

  const goalLabel = labelGoal(campaignGoal);
  const verticalLabel = labelVertical(campaignVertical);

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

  return (
    <div className="space-y-5">
      {/* ── TOP SUMMARY STRATEGIC BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Total Creatives"
          value={sorted.length}
          sub="Uploaded"
        />
        <SummaryCard
          label="Strategically Ready"
          value={strategicallyReadyCount}
          sub={`${goalLabel} Goal`}
          accent={strategicallyReadyCount > 0 ? "emerald" : "slate"}
        />
        <SummaryCard
          label="Goal Misaligned"
          value={goalMisalignedCount}
          sub={`vs ${goalLabel}`}
          accent={goalMisalignedCount > 0 ? "red" : "slate"}
        />
        <SummaryCard
          label="Vertical Misaligned"
          value={verticalMisalignedCount}
          sub={`vs ${verticalLabel}`}
          accent={verticalMisalignedCount > 0 ? "amber" : "slate"}
        />
        <SummaryCard
          label="Highest Alignment"
          value={topScore != null ? `${topScore}/100` : "N/A"}
          sub={`#1 ${topNameShort} · ${topLabel}`}
          accent="cyan"
        />
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-white">{selected.creative.name}</h4>
                <p className="mt-0.5 text-xs text-slate-500">{platform || "display_ads"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Strategic Score</p>
                <p className={`mt-0.5 text-2xl font-black ${scoreTone(strategicScore)}`}>
                  {Number.isFinite(strategicScore) ? strategicScore : "--"}
                </p>
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

          {/* 5. ATTENTION FLOW */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={15} className="text-cyan-300" />
              <h4 className="text-sm font-semibold text-white">5. Attention Flow</h4>
            </div>
            {flow.attentionAnalysis ? (
              <div className="space-y-2 text-sm">
                {flow.attentionAnalysis.first_focus && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                      First Focus
                    </p>
                    <p className="text-slate-200 capitalize">{flow.attentionAnalysis.first_focus}</p>
                  </div>
                )}
                {flow.attentionAnalysis.attention_path && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                      Attention Path
                    </p>
                    <p className="text-slate-200">{flow.attentionAnalysis.attention_path}</p>
                  </div>
                )}
                {Array.isArray(flow.attentionAnalysis.friction_points) &&
                  flow.attentionAnalysis.friction_points.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                        Friction
                      </p>
                      <p className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-sm text-amber-100">
                        {flow.attentionAnalysis.friction_points[0]}
                      </p>
                    </div>
                  )}
                {flow.attentionAnalysis.cta_visibility && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
                      CTA Visibility
                    </p>
                    <p className="text-slate-200">{flow.attentionAnalysis.cta_visibility}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Attention analysis unavailable.</p>
            )}
          </div>

          {/* 6. STRATEGIC RECOMMENDATION */}
          {recommendations.length > 0 && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={15} className="text-emerald-300" />
                <h4 className="text-sm font-semibold text-white">6. Strategic Recommendation</h4>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {recommendations[0].issue}
              </p>
              <p className="text-sm text-slate-100 leading-relaxed">
                {recommendations[0].recommended_change}
              </p>
              <p className="mt-1.5 text-[10px] text-emerald-400 font-semibold">
                Priority: {recommendations[0].priority}
              </p>
            </div>
          )}

          {/* 7. EXPECTED IMPROVEMENT */}
          {flow.expectedImprovement && !flow.expectedImprovement.includes("incomplete") && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight size={15} className="text-cyan-300" />
                <h4 className="text-sm font-semibold text-white">7. Expected Improvement</h4>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{flow.expectedImprovement}</p>
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
