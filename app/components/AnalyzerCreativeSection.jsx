"use client";

import { Brain, Eye, Target, Wrench } from "lucide-react";
import { qaItemIcon } from "@/app/lib/analyzerInsights";
import AnalyzerCreativeThumbnail from "./AnalyzerCreativeThumbnail";

function AlignmentBadge({ isAligned }) {
  if (isAligned === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
        🟢 Aligned
      </span>
    );
  }
  if (isAligned === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-800">
        🔴 Misaligned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
      🟡 Review
    </span>
  );
}

function FieldBlock({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-900 leading-relaxed">{value}</p>
    </div>
  );
}

function QaList({ title, icon: Icon, items, accent = "cyan" }) {
  const accentMap = {
    cyan: "text-sky-600",
    purple: "text-violet-600",
    amber: "text-amber-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={accentMap[accent] || accentMap.cyan} />
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2 text-sm text-slate-900">
            <span className="shrink-0">{qaItemIcon(item.status)}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreativeSelectCard({ insight, isActive, onSelect, index, previewUrl }) {
  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-xl border p-3 text-left transition ${
          isActive
            ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <AnalyzerCreativeThumbnail
            creativeId={insight.creativeId}
            src={previewUrl || insight.creativeUrl}
            alt={insight.creativeName}
            badge={insight.launchStatus.emoji}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-500">#{index + 1}</p>
            <p className="truncate text-xs font-semibold text-slate-900">{insight.creativeName}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
              {insight.launchStatus.emoji} {insight.launchStatus.label}
            </p>
          </div>
        </div>
      </button>

      {isActive ? (
        <div className="mt-1 rounded-lg border border-sky-200 bg-sky-50/80 p-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800 mb-2">Quick Status</p>
          <p className="text-xs text-slate-900 font-semibold">{insight.launchStatus.emoji} {insight.launchStatus.label}</p>
          {insight.mainRisk ? (
            <p className="mt-2 text-[11px] text-amber-900 leading-snug">
              <span className="font-semibold">Risk:</span> {insight.mainRisk}
            </p>
          ) : insight.launchStatusKey === "ready" ? (
            <p className="mt-2 text-[11px] text-emerald-800">No issues detected — creative is fully aligned for launch.</p>
          ) : (
            <p className="mt-2 text-[11px] text-amber-800">Minor recommendations available — see details below.</p>
          )}
          {insight.recommendedFix ? (
            <p className="mt-2 text-[11px] text-slate-800 leading-snug">{insight.recommendedFix}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function AnalyzerCreativeSection({
  insights,
  selectedInsight,
  onSelectCreative,
  creativePreviewById,
  labelGoal,
  labelVertical,
  campaignGoal,
  campaignVertical,
  platform,
}) {
  const insight = selectedInsight;
  if (!insight) return null;

  const { goalAlignment, verticalAlignment, extractionSignals } = insight;
  const isMeta = platform === "meta_ads";
  const isGoogle = platform === "google_ads";
  const isProgrammatic = platform === "programmatic";
  const platformLabel = isMeta ? "Meta Ads" : isGoogle ? "Google Ads" : isProgrammatic ? "Programmatic Ads" : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-2">
          Creatives — select for status
        </p>
        {insights.map((item, index) => (
          <CreativeSelectCard
            key={item.creativeId}
            insight={item}
            index={index}
            previewUrl={creativePreviewById?.get(item.creativeId)}
            isActive={item.creativeId === insight.creativeId}
            onSelect={() => onSelectCreative(item.creativeId)}
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">{insight.creativeName}</h4>
            <p className="text-xs text-slate-500">{platform?.replace(/_/g, " ") || "platform"}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            insight.launchStatus.tone === "emerald"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : insight.launchStatus.tone === "amber"
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-red-300 bg-red-50 text-red-800"
          }`}>
            {insight.launchStatus.emoji} {insight.launchStatus.label}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-sky-600" />
              <h4 className="text-sm font-semibold text-slate-900">Goal Alignment</h4>
            </div>
            <AlignmentBadge isAligned={goalAlignment?.is_aligned} />
          </div>
          <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
            <p>
              Selected goal: <span className="font-semibold text-slate-900">{labelGoal(goalAlignment?.selected_goal || campaignGoal)}</span>
              {goalAlignment?.detected_goal && goalAlignment.detected_goal !== goalAlignment.selected_goal ? (
                <> · Detected: <span className="font-semibold text-amber-700">{labelGoal(goalAlignment.detected_goal)}</span></>
              ) : null}
            </p>
            <p>{goalAlignment?.enrichedReason}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-slate-900">Vertical Alignment</h4>
            </div>
            <AlignmentBadge isAligned={verticalAlignment?.is_aligned} />
          </div>
          <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
            <p>
              Selected: <span className="font-semibold text-slate-900">{labelVertical(verticalAlignment?.selected_vertical || campaignVertical)}</span>
              {verticalAlignment?.detected_vertical && verticalAlignment.detected_vertical !== "unknown" ? (
                <> · Detected: <span className={`font-semibold ${verticalAlignment.is_aligned === false ? "text-amber-700" : "text-emerald-700"}`}>{labelVertical(verticalAlignment.detected_vertical)}</span></>
              ) : null}
            </p>
            {verticalAlignment?.reason ? <p>{verticalAlignment.reason}</p> : null}
          </div>
        </div>

        {extractionSignals ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={15} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-900">Creative Extraction Signals</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldBlock label="Headline" value={extractionSignals.headline} />
              <FieldBlock label="CTA" value={extractionSignals.cta} />
              <FieldBlock label="Dominant Visual" value={extractionSignals.dominant_visual_cue} />
              <FieldBlock label="Persuasion Style" value={extractionSignals.persuasion_style} />
              <FieldBlock label="Text Density" value={extractionSignals.text_density} />
              <FieldBlock label="Product Category" value={extractionSignals.product_category} />
            </div>
            {extractionSignals.topic_summary ? (
              <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 mb-1">What This Creative Communicates</p>
                <p className="text-sm text-slate-900 leading-relaxed">{extractionSignals.topic_summary}</p>
              </div>
            ) : null}
            {Array.isArray(extractionSignals.emotional_cues) && extractionSignals.emotional_cues.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {extractionSignals.emotional_cues.map((cue) => (
                  <span key={cue} className="rounded-md bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] text-violet-800">{cue}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <QaList title={platformLabel ? `Technical QA · ${platformLabel}` : "Technical QA"} icon={Wrench} items={insight.technicalQa} accent="cyan" />
        <QaList title={platformLabel ? `Placement QA · ${platformLabel}` : "Placement QA"} icon={Target} items={insight.placementQa} accent="purple" />

        {insight.mainRisk ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-1">Main Risk</p>
            <p className="text-sm text-amber-950 leading-relaxed">{insight.mainRisk}</p>
          </div>
        ) : null}

        {insight.recommendedFix ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-1">Recommended Fix</p>
            <p className="text-sm text-emerald-950 leading-relaxed">{insight.recommendedFix}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
