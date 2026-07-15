"use client";

import { qaItemIcon } from "@/app/lib/analyzerInsights";
import {
  VIDEO_VALIDATION_LEVELS,
} from "@/app/lib/video/videoValidationQa";

function severityTone(severity) {
  if (severity === "High") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (severity === "Low") return "border-slate-400/20 bg-slate-500/10 text-slate-100";
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

const SCORE_LABELS = {
  campaign_goal_alignment: "Campaign Goal Alignment",
  vertical_alignment: "Industry / Vertical Alignment",
  brief_alignment: "Campaign Brief Alignment",
  brand_visibility: "Brand & Logo Visibility",
  cta_analysis: "CTA Analysis",
  text_readability: "Text Readability",
  visual_quality: "Visual Quality",
  audio_quality: "Audio Quality",
  hook_strength: "Hook Strength (first 3-5s)",
  message_clarity: "Message Clarity",
  product_visibility: "Product Visibility",
  scene_flow: "Scene Flow & Storytelling",
  engagement_potential: "Engagement Potential",
  platform_compliance: "Platform Compliance",
  accessibility: "Accessibility & Subtitles",
  pacing: "Pacing",
  risk_detection: "Risk Detection",
  final_launch_readiness_score: "Final Launch Readiness",
};

function scoreLabel(key) {
  return SCORE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreTone(value) {
  if (value >= 70) return "text-emerald-300";
  if (value >= 45) return "text-amber-300";
  return "text-rose-300";
}

function checklistTone(status) {
  if (status === "pass") return "border-emerald-400/25 bg-emerald-500/8 text-emerald-50";
  if (status === "fail") return "border-rose-400/30 bg-rose-500/10 text-rose-50";
  return "border-amber-400/30 bg-amber-500/10 text-amber-50";
}

function ValidationChecklist({ items }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-2xl border border-studio-border bg-studio-surface p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">What to Validate</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border px-3 py-3 ${checklistTone(item.status)}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">{qaItemIcon(item.status)}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">{item.label}</p>
                <p className="mt-1 text-sm font-semibold leading-snug">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationLevels({ activeTier, fileSizeLabel }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Validation Levels</p>
          <p className="mt-1 text-sm text-slate-300">
            Video file-size guidance. Images still use the 150 KB optimization target.
          </p>
        </div>
        {fileSizeLabel ? (
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Current file</p>
            <p className="text-sm font-bold text-white">{fileSizeLabel}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {VIDEO_VALIDATION_LEVELS.map((level) => {
          const active = level.tier === activeTier;
          return (
            <div
              key={level.tier}
              className={`rounded-xl border px-4 py-3 ${
                active
                  ? "border-cyan-400/40 bg-cyan-500/10 ring-1 ring-cyan-400/30"
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              <p className="text-sm font-bold text-white">{level.emoji} {level.label}</p>
              <p className="mt-1 text-xs text-slate-400">{level.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VideoAnalysisSection({ videoAnalysis, validationMeta = null }) {
  if (!videoAnalysis && !validationMeta) return null;

  const validationEntries = Object.entries(videoAnalysis?.validation_results || {});
  const reportEntries = Object.entries(videoAnalysis?.analysis_report || {});
  const issues = Array.isArray(videoAnalysis?.timestamped_issues) ? videoAnalysis.timestamped_issues : [];
  const recommendations = Array.isArray(videoAnalysis?.recommendations) ? videoAnalysis.recommendations : [];
  const checklist = validationMeta?.checklist || [];
  const activeTier = validationMeta?.sizeTier || "ready";

  return (
    <div className="space-y-4">
      {validationMeta ? (
        <>
          <ValidationLevels activeTier={activeTier} fileSizeLabel={validationMeta.fileSizeLabel} />
          <ValidationChecklist items={checklist} />
        </>
      ) : null}

      {videoAnalysis ? (
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Video Analysis</p>
            <h4 className="mt-1 text-lg font-black text-white">Launch Readiness Score</h4>
          </div>
          <div className="rounded-2xl border border-cyan-300/30 bg-black/20 px-4 py-3 text-center">
            <p className="text-3xl font-black text-cyan-200">{videoAnalysis.final_score ?? 0}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">out of 100</p>
          </div>
        </div>
      </div>
      ) : null}

      {validationEntries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {validationEntries.map(([platform, result]) => (
            <div
              key={platform}
              className={`rounded-2xl border p-4 ${
                result.pass ? "border-emerald-400/30 bg-emerald-500/8" : "border-rose-400/30 bg-rose-500/8"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{platform}</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {result.pass ? "Validation passed" : "Validation issues detected"}
              </p>
              {result.errors?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  {result.errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              ) : null}
              {result.warnings?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-amber-100/90">
                  {result.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {reportEntries.length > 0 ? (
        <div className="rounded-2xl border border-studio-border bg-studio-surface p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Analysis Scores</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reportEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {scoreLabel(key)}
                </p>
                <p className={`mt-1 text-xl font-black ${scoreTone(Number(value) || 0)}`}>{value}<span className="text-xs font-semibold text-slate-500">/100</span></p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="rounded-2xl border border-studio-border bg-studio-surface p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Detected Issues Timeline</p>
          <div className="mt-4 space-y-3">
            {issues.map((issue) => (
              <div key={`${issue.time}-${issue.issue}`} className={`rounded-xl border px-4 py-3 ${severityTone(issue.severity)}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em]">{issue.time}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{issue.issue}</p>
                {issue.suggestion ? <p className="mt-1 text-sm opacity-80">{issue.suggestion}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Recommendations</p>
          <ul className="mt-3 space-y-2 text-sm text-emerald-50">
            {recommendations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
