"use client";

import { Brain, Eye, FileText, Target, Wrench } from "lucide-react";
import { qaItemIcon } from "@/app/lib/analyzerInsights";
import { resolveGoalAlignmentStatus, resolveVerticalAlignmentStatus, resolveBriefAlignmentStatus } from "@/app/lib/strategicPresentation";
import AnalyzerCreativeThumbnail from "./AnalyzerCreativeThumbnail";

function AlignmentBadge({ status }) {
  const toneClasses = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    red: "border-red-300 bg-red-50 text-red-800",
  };
  const resolved = status || { emoji: "🟡", label: "Needs Review", tone: "amber" };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${toneClasses[resolved.tone] || toneClasses.amber}`}>
      {resolved.emoji} {resolved.label}
    </span>
  );
}

function CampaignBriefAlignmentPanel({ briefAlignment, campaignBrief, labelGoal }) {
  const hasBrief = campaignBrief?.trim() || briefAlignment?.brief_provided;
  if (!hasBrief) return null;

  const status = briefAlignment?.status || resolveBriefAlignmentStatus(briefAlignment);
  const tone = status.tone === "emerald" ? "emerald" : status.tone === "red" ? "red" : "amber";
  const borderTone = {
    emerald: "border-emerald-200 bg-emerald-50/40",
    red: "border-red-200 bg-red-50/40",
    amber: "border-amber-200 bg-amber-50/40",
  }[tone];

  const mismatches = briefAlignment?.misaligned_elements || [];
  const recommendations = briefAlignment?.recommendations || [];
  const aligned = briefAlignment?.aligned_elements || [];
  const missing = briefAlignment?.missing_from_creative || [];
  const goalCheck = briefAlignment?.goal_settings_check;
  const verticalCheck = briefAlignment?.vertical_settings_check;
  const platformCheck = briefAlignment?.platform_requirements_check;

  return (
    <div className={`rounded-xl border p-4 ${borderTone}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-sky-600" />
          <h4 className="text-sm font-semibold text-slate-900">Campaign Brief Alignment</h4>
        </div>
        <AlignmentBadge status={status} />
      </div>

      <p className="text-sm text-slate-800 leading-relaxed">
        {briefAlignment?.enrichedReason || briefAlignment?.summary || briefAlignment?.reason}
      </p>

      {typeof briefAlignment?.alignment_score === "number" ? (
        <p className="mt-2 text-xs font-semibold text-slate-700">
          Brief match score: <span className="tabular-nums">{briefAlignment.alignment_score}</span>/100
        </p>
      ) : null}

      {goalCheck?.is_aligned === false ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-800">Goal vs Brief</p>
          <p className="mt-1 text-sm text-red-950 leading-relaxed">{goalCheck.explanation}</p>
          {goalCheck.brief_implied_goal ? (
            <p className="mt-1 text-xs text-red-800">
              Brief implies: <span className="font-semibold">{labelGoal(goalCheck.brief_implied_goal)}</span>
              {" · "}Selected: <span className="font-semibold">{labelGoal(goalCheck.selected_goal)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {verticalCheck?.is_aligned === false ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-800">Vertical vs Brief</p>
          <p className="mt-1 text-sm text-red-950 leading-relaxed">{verticalCheck.explanation}</p>
        </div>
      ) : null}

      {mismatches.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Mismatches</p>
          {mismatches.map((row) => (
            <div key={`${row.element}-${row.brief_expectation}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{row.element} <span className="text-[10px] uppercase text-red-700">({row.severity})</span></p>
              <p className="mt-1 text-slate-700"><span className="font-medium">Brief:</span> {row.brief_expectation}</p>
              <p className="mt-0.5 text-slate-700"><span className="font-medium">Creative:</span> {row.creative_reality}</p>
            </div>
          ))}
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-1">Missing from creative</p>
          <ul className="text-sm text-slate-800 space-y-1">
            {missing.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {aligned.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 mb-1">Aligned with brief</p>
          <ul className="text-sm text-slate-800 space-y-1">
            {aligned.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {platformCheck?.findings?.length ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            {platformCheck.platform} requirements
          </p>
          <ul className="mt-1 text-sm text-slate-800 space-y-1">
            {platformCheck.findings.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-900 mb-1">Recommendations</p>
          <ul className="text-sm text-sky-950 space-y-1">
            {recommendations.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      ) : null}

      {status.key === "misaligned" ? (
        <p className="mt-3 text-xs text-slate-700">
          Update the creative, revise the Campaign Brief in Step 1, or align your goal/vertical settings — then click <strong>Reanalyze</strong>.
        </p>
      ) : null}
    </div>
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

const PRESENCE_TONES = {
  detected: "border-emerald-200 bg-emerald-50 text-emerald-900",
  partial: "border-amber-200 bg-amber-50 text-amber-950",
  not_detected: "border-red-200 bg-red-50 text-red-950",
};

function PresenceBadge({ presence }) {
  const label = presence === "detected" ? "Detected" : presence === "partial" ? "Partial" : "Not detected";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PRESENCE_TONES[presence] || PRESENCE_TONES.partial}`}>
      {label}
    </span>
  );
}

function DetectionSignalBlock({ title, detection, scoreLabel }) {
  if (!detection) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{title}</p>
        <PresenceBadge presence={detection.presence} />
      </div>
      <p className="text-xs text-slate-900 leading-relaxed">{detection.summary}</p>
      <div className="flex flex-wrap gap-2 text-[10px]">
        {detection.prominence ? (
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
            Prominence: <span className="font-semibold capitalize">{detection.prominence}</span>
          </span>
        ) : null}
        {detection.positioning ? (
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
            Position: {detection.positioning}
          </span>
        ) : null}
        {typeof detection.visibility_score === "number" ? (
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
            Visibility: <span className="font-semibold tabular-nums">{detection.visibility_score}/100</span>
          </span>
        ) : null}
        {detection.visibility ? (
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
            Visibility: <span className="font-semibold capitalize">{detection.visibility}</span>
          </span>
        ) : null}
        {typeof detection.effectiveness_score === "number" ? (
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-slate-700">
            {scoreLabel}: <span className="font-semibold tabular-nums">{detection.effectiveness_score}/100</span>
          </span>
        ) : null}
        {detection.text ? (
          <span className="rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-sky-900">
            Text: &quot;{detection.text}&quot;
          </span>
        ) : null}
      </div>
      {detection.recommendation ? (
        <p className="text-[11px] text-slate-700 leading-relaxed border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-900">Recommendation:</span> {detection.recommendation}
        </p>
      ) : null}
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
            <p className="mt-2 text-[11px] text-emerald-800">No issues detected. Creative is fully aligned for launch.</p>
          ) : (
            <p className="mt-2 text-[11px] text-amber-800">Minor recommendations available. See details below.</p>
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
  campaignBrief = "",
  campaignProductFocus = "",
  platform,
}) {
  const insight = selectedInsight;
  if (!insight) return null;

  const { goalAlignment, verticalAlignment, creativeVerticalAlignment, extractionSignals } = insight;
  const verticalStatus = resolveVerticalAlignmentStatus(verticalAlignment);
  const detectedCategoryLabel = creativeVerticalAlignment?.detected_category_label
    || verticalAlignment?.detected_category_label
    || verticalAlignment?.product_category;
  const suggestedVerticalLabel = creativeVerticalAlignment?.suggested_vertical_label
    || (verticalAlignment?.suggested_vertical ? labelVertical(verticalAlignment.suggested_vertical) : null);
  const goalStatus = resolveGoalAlignmentStatus(goalAlignment);
  const detectedGoalLabel = goalAlignment?.detected_goal || goalAlignment?.detected_goal_stage;
  const showDetectedGoal = detectedGoalLabel
    && detectedGoalLabel !== goalAlignment?.selected_goal
    && goalAlignment?.detected_goal_stage !== goalAlignment?.selected_stage;
  const isMeta = platform === "meta_ads";
  const isGoogle = platform === "google_ads";
  const isProgrammatic = platform === "programmatic";
  const platformLabel = isMeta ? "Meta Ads" : isGoogle ? "Google Ads" : isProgrammatic ? "Programmatic Ads" : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-1 mb-2">
          Creatives: select for status
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
            <AlignmentBadge status={goalStatus} />
          </div>
          <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
            <p>
              Selected goal: <span className="font-semibold text-slate-900">{labelGoal(goalAlignment?.selected_goal || campaignGoal)}</span>
              {showDetectedGoal ? (
                <> · Detected: <span className="font-semibold text-amber-700">{labelGoal(detectedGoalLabel)}</span></>
              ) : null}
            </p>
            <p>{goalAlignment?.enrichedReason}</p>
            {goalAlignment?.brief_goal_conflict ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900 text-xs">
                Your selected goal does not match the Campaign Brief objective. Fix this in Step 1 before trusting launch readiness.
              </p>
            ) : null}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${
          verticalStatus.tone === "emerald"
            ? "border-emerald-200 bg-emerald-50/40"
            : verticalStatus.tone === "red"
              ? "border-red-200 bg-red-50/40"
              : "border-amber-200 bg-amber-50/40"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-slate-900">Vertical Alignment</h4>
            </div>
            <AlignmentBadge status={verticalStatus} />
          </div>
          <div className={`rounded-lg border px-3 py-2 mb-3 text-sm font-semibold ${
            verticalStatus.tone === "emerald"
              ? "border-emerald-200 bg-white text-emerald-900"
              : verticalStatus.tone === "red"
                ? "border-red-200 bg-white text-red-900"
                : "border-amber-200 bg-white text-amber-900"
          }`}>
            {verticalStatus.emoji} {verticalStatus.label}
            {verticalStatus.key === "misaligned" ? ". Creative does not match the selected vertical." : null}
            {verticalStatus.key === "review" ? ". Creative partially matches the selected vertical." : null}
            {verticalStatus.key === "aligned" ? ". Creative matches the selected vertical." : null}
          </div>
          <div className="space-y-2 text-sm text-slate-800 leading-relaxed">
            <p>
              Selected vertical: <span className="font-semibold text-slate-900">{labelVertical(verticalAlignment?.selected_vertical || campaignVertical)}</span>
            </p>
            {detectedCategoryLabel ? (
              <p>
                Creative category detected: <span className={`font-semibold ${
                  verticalStatus.tone === "red"
                    ? "text-red-700"
                    : verticalStatus.tone === "amber"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}>{detectedCategoryLabel}</span>
              </p>
            ) : null}
            {verticalStatus.key === "misaligned" && suggestedVerticalLabel ? (
              <p>
                Suggested vertical: <span className="font-semibold text-sky-800">{suggestedVerticalLabel}</span>
              </p>
            ) : null}
            {verticalAlignment?.detected_vertical && verticalAlignment.detected_vertical !== "unknown" && !detectedCategoryLabel ? (
              <p>
                Detected: <span className={`font-semibold ${
                  verticalStatus.tone === "red"
                    ? "text-red-700"
                    : verticalStatus.tone === "amber"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}>{labelVertical(verticalAlignment.detected_vertical)}</span>
              </p>
            ) : null}
            {verticalAlignment?.enrichedReason || verticalAlignment?.reason ? (
              <p>{verticalAlignment.enrichedReason || verticalAlignment.reason}</p>
            ) : null}
            {verticalStatus.key === "misaligned" && (creativeVerticalAlignment?.recommendation || verticalAlignment?.vertical_recommendation) ? (
              <p className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-900">
                {creativeVerticalAlignment?.recommendation || verticalAlignment.vertical_recommendation}
              </p>
            ) : null}
          </div>
        </div>

        <CampaignBriefAlignmentPanel
          briefAlignment={insight.briefAlignment}
          campaignBrief={campaignBrief}
          labelGoal={labelGoal}
        />

        {extractionSignals ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={15} className="text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-900">Creative Extraction Signals</h4>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              {platformLabel} analysis: logo, CTA, and layout signals validated for this platform&apos;s placements and formats.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldBlock label="Headline" value={extractionSignals.headline} />
              <FieldBlock label="Primary Message" value={extractionSignals.primary_message} />
              <FieldBlock label="Dominant Visual" value={extractionSignals.dominant_visual_cue} />
              <FieldBlock label="Persuasion Style" value={extractionSignals.persuasion_style} />
              <FieldBlock label="Creative Type" value={extractionSignals.creative_type} />
              <FieldBlock label="Text Density" value={extractionSignals.text_density} />
              <FieldBlock label="Readability" value={extractionSignals.readability} />
              <FieldBlock label="Brand Presence" value={extractionSignals.brand_presence} />
              <FieldBlock label="Product Category" value={extractionSignals.product_category} />
              <FieldBlock label="Platform Context" value={extractionSignals.platform_context} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <DetectionSignalBlock
                title="Logo Detection"
                detection={extractionSignals.logo_detection}
              />
              <DetectionSignalBlock
                title="CTA Detection"
                detection={extractionSignals.cta_detection}
                scoreLabel="Effectiveness"
              />
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
        <QaList title={platformLabel ? `Placement QA ${platformLabel}` : "Placement QA"} icon={Target} items={insight.placementQa} accent="purple" />

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
