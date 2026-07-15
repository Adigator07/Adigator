"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, ChevronDown, ExternalLink, FileText, Layers, Link2, Shield } from "lucide-react";
import { INSIGHT_TONES, RISK_TONES } from "@/app/components/analyzer/analyzerTheme";
import CreativeReplacementComparisonPanel from "@/app/components/preview-tool/CreativeReplacementComparisonPanel";
import CampaignRenewalComparisonPanel from "@/app/components/preview-tool/CampaignRenewalComparisonPanel";
import { labelProgrammaticTaskType } from "@/app/lib/programmaticWorkflow";

const PLATFORM_LABELS = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  programmatic: "Programmatic Ads",
};

export default function AnalyzerOverview({
  overview,
  greetingName,
  goalText,
  verticalText,
  platform,
  urlValidation = null,
  campaignBrief = "",
  programmaticTaskType = "",
  replacementComparisonReport = null,
  renewalComparisonReport = null,
  exportMode = false,
}) {
  if (!overview) return null;

  const sections = overview.sections;
  const platformLabel = PLATFORM_LABELS[platform] || platform?.replace(/_/g, " ") || "Platform";
  const briefing = sections?.briefing;
  const health = sections?.campaignHealth;
  const creativeAnalysis = sections?.creativeAnalysis;
  const riskSummary = sections?.creativeRiskSummary;

  return (
    <div className="space-y-5">
      {/* 1. Overview Briefing */}
      <section className="neon-card rounded-2xl p-5">
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">Overview Briefing</p>
        <h3 className="mt-2 text-xl font-black text-[#f4f4f8]">Welcome back, {greetingName}.</h3>
        <p className="mt-1 text-sm font-semibold text-[#e8e8f0]">{briefing?.headline || `${platformLabel} campaign intelligence`}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c8c8d4]">
          {briefing?.narrative || `Risk-based launch analysis for ${platformLabel}: ${goalText} goal in ${verticalText}.`}
        </p>
        {briefing?.focusAreas?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {briefing.focusAreas.map((area) => (
              <span key={area} className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                {area}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Creatives" value={overview.totalCount} />
          <StatCard label="Aligned / Launch Ready" value={overview.readyCount} accent="emerald" />
          <StatCard label="Needs Review" value={overview.reviewCount} accent="amber" />
          <StatCard label="Misaligned" value={overview.misalignedCount} accent="red" />
        </div>
      </section>

      {/* URL Validation — Step 2 result shown only in Overview */}
      <UrlValidationSection urlValidation={urlValidation} exportMode={exportMode} />

      {programmaticTaskType === "creative_swap" && replacementComparisonReport ? (
        <CreativeReplacementComparisonPanel report={replacementComparisonReport} variant="overview" exportMode={exportMode} />
      ) : null}

      {programmaticTaskType === "campaign_renewal" && renewalComparisonReport ? (
        <CampaignRenewalComparisonPanel report={renewalComparisonReport} variant="overview" exportMode={exportMode} />
      ) : null}

      {!campaignBrief?.trim() ? (
        <section className="neon-card rounded-2xl border border-cyan-400/30 p-4">
          <p className="text-sm font-semibold text-cyan-200">Improve analysis accuracy</p>
          <p className="mt-1 text-sm leading-relaxed text-[#d4d4de]">
            Add a <strong className="text-[#f4f4f8]">Client Brief / Campaign Description</strong> in Step 1 for tighter alignment between your creative, objective, vertical, and landing page.
            Update the brief and click <strong className="text-[#f4f4f8]">Reanalyze</strong> to refresh results.
          </p>
        </section>
      ) : (
        <CampaignBriefOverviewSection
          briefValidation={overview.briefValidation}
          platformLabel={platformLabel}
          programmaticTaskType={programmaticTaskType}
          platform={platform}
          exportMode={exportMode}
        />
      )}

      {overview.campaignAlignment ? (
        <CampaignAlignmentSection alignment={overview.campaignAlignment} />
      ) : null}

      {/* 2. Campaign Health Summary */}
      {health ? (
        <section className="neon-card rounded-2xl p-5">
          <SectionHeader icon={Activity} label="Campaign Health Summary" accent="text-violet-400" />
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <HealthScoreCard label="Health Score" value={health.healthScore} tone={health.riskLevel?.tone} />
              <HealthScoreCard label="Compatibility" value={health.compatibilityScore} tone="violet" subtitle="Placement fit" />
              <div className={`rounded-xl border px-4 py-3 ${RISK_TONES[health.riskLevel?.tone]?.border || "border-white/12"} ${RISK_TONES[health.riskLevel?.tone]?.bg || "bg-white/[0.05]"}`}>
                <p className="text-[10px] uppercase tracking-wider text-[#9a9aad]">Risk Level</p>
                <p className={`mt-1 text-lg font-bold ${RISK_TONES[health.riskLevel?.tone]?.text || "text-[#f4f4f8]"}`}>
                  {health.riskLevel?.label}
                </p>
              </div>
            </div>
          </div>

          {health.dimensions?.length ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {health.dimensions.map((dim) => (
                <div key={dim.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad]">{dim.label}</p>
                    <p className="text-sm font-black text-[#f4f4f8] tabular-nums">{dim.score}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-[#9a9aad] leading-snug">{dim.note}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dim.score >= 80 ? "bg-emerald-500" : dim.score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {health.inventoryCoverage?.length ? (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad] mb-2">Inventory coverage</p>
              <div className="flex flex-wrap gap-2">
                {health.inventoryCoverage.map((row) => (
                  <span key={row.label} className="rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] text-[#d4d4de]">
                    <span className="font-semibold">{row.label}:</span>{" "}
                    {row.ready}/{row.total} ready
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InsightList title="Strengths" items={health.strengths} tone="emerald" />
            <InsightList title="Weaknesses" items={health.weaknesses} tone="amber" />
            <InsightList title="Optimization" items={health.optimizationTips} tone="sky" />
          </div>
        </section>
      ) : null}

      {/* 3. Creative Analysis */}
      {creativeAnalysis ? (
        <section className="neon-card rounded-xl p-4">
          <SectionHeader icon={BarChart3} label="Creative Analysis" accent="text-blue-600" />
          <p className="mt-2 text-sm text-slate-800 leading-relaxed">{creativeAnalysis.summary}</p>
          {creativeAnalysis.highlights?.length ? (
            <ul className="mt-3 space-y-1.5">
              {creativeAnalysis.highlights.map((item) => (
                <li key={item} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                  <span className="text-sky-600 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          {creativeAnalysis.perCreative?.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Creative</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Detected category</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600 text-center">Selected vertical</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Vertical status</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {creativeAnalysis.perCreative.map((row) => {
                    const aligned = row.statusKey === "aligned";
                    return (
                      <tr key={row.id} className="border-b border-slate-100 align-top">
                        <td className="py-2.5 pr-3 font-medium text-slate-900">{row.name}</td>
                        <td className={`py-2.5 px-2 font-semibold ${aligned ? "text-emerald-800" : "text-red-800"}`}>
                          {row.detectedCategory || "Unclear"}
                        </td>
                        <td className="py-2.5 px-2 text-center font-semibold text-sky-900">
                          {row.selectedVerticalLabel || verticalText}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
                            aligned
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : row.statusKey === "misaligned"
                                ? "border-red-300 bg-red-50 text-red-800"
                                : "border-amber-300 bg-amber-50 text-amber-800"
                          }`}>
                            {row.status?.emoji} {row.status?.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-xs text-slate-700 leading-relaxed">
                          {[row.headline && `Headline: ${row.headline}`, row.dominantVisual, row.textDensity && `Text: ${row.textDensity}`]
                            .filter(Boolean)
                            .join(" · ") || "Visual-led asset"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {riskSummary ? (
        <CreativeRiskSummarySection riskSummary={riskSummary} platformLabel={platformLabel} exportMode={exportMode} />
      ) : null}

      {!exportMode ? (
      <p className="text-sm text-[#c8c8d4] rounded-xl border border-white/12 bg-white/[0.04] p-3">
        Open <span className="font-semibold text-[#f4f4f8]">Technical &amp; Placement QA</span> for campaign-level spec and inventory checks, or{" "}
        <span className="font-semibold text-[#f4f4f8]">Creative Analysis</span> for per-creative goal alignment and fixes.
      </p>
      ) : null}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, accent, inline = false }) {
  return (
    <div className={`flex items-center gap-2 ${inline ? "" : "mb-0"}`}>
      <Icon size={15} className={accent} />
      <h4 className="text-sm font-semibold text-[#f4f4f8]">{label}</h4>
    </div>
  );
}

function HealthScoreCard({ label, value, tone, subtitle }) {
  const isViolet = tone === "violet";
  const riskTone = RISK_TONES[tone] || RISK_TONES.emerald;
  return (
    <div className={`rounded-xl border px-4 py-3 min-w-[120px] ${isViolet ? "border-violet-400/35 bg-violet-500/12" : `${riskTone.border} ${riskTone.bg}`}`}>
      <p className="text-[10px] uppercase tracking-wider text-[#9a9aad]">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${isViolet ? "text-violet-200" : riskTone.text}`}>{value}</p>
      {subtitle ? <p className="mt-0.5 text-[10px] text-[#9a9aad]">{subtitle}</p> : null}
    </div>
  );
}

function InsightList({ title, items, tone }) {
  const tones = {
    emerald: INSIGHT_TONES.emerald,
    amber: INSIGHT_TONES.amber,
    sky: INSIGHT_TONES.sky,
  };
  if (!items?.length) {
    return (
      <div className={`rounded-lg border p-3 ${tones[tone] || tones.sky}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad] mb-1">{title}</p>
        <p className="text-xs text-[#9a9aad]">None flagged.</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border p-3 ${tones[tone] || tones.sky}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad] mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs text-[#d4d4de] leading-relaxed">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({ label, value, accent = "slate" }) {
  const tones = {
    slate: "border-white/12 bg-white/[0.05]",
    emerald: "border-emerald-400/35 bg-emerald-500/12 shadow-[0_0_20px_-6px_rgba(74,222,128,0.25)]",
    amber: "border-amber-400/35 bg-amber-500/12 shadow-[0_0_20px_-6px_rgba(251,191,36,0.25)]",
    red: "border-rose-400/35 bg-rose-500/12 shadow-[0_0_20px_-6px_rgba(251,113,133,0.25)]",
  };
  return (
    <div className={`rounded-xl border p-3.5 ${tones[accent] || tones.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad]">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-[#f4f4f8] tabular-nums">{value}</p>
    </div>
  );
}

function getBriefSectionConfig(programmaticTaskType, platform) {
  const task = programmaticTaskType || (platform === "programmatic" ? "" : "campaign_setup");
  const taskLabel = labelProgrammaticTaskType(task) || "Campaign";

  switch (task) {
    case "creative_swap":
      return {
        sectionLabel: "Creative Swap Brief Check",
        defaultSummary: "Replacement creatives are validated against this brief, campaign settings, and the baseline creative set.",
        showIntent: true,
        showGoalVerticalChecks: true,
        showPlatformRequirements: false,
        taskBadge: taskLabel,
      };
    case "creative_addition":
      return {
        sectionLabel: "Creative Addition Brief Check",
        defaultSummary: "New creatives must align with the existing campaign brief, objective, and current ad groups.",
        showIntent: true,
        showGoalVerticalChecks: true,
        showPlatformRequirements: false,
        taskBadge: taskLabel,
      };
    case "campaign_renewal":
      return {
        sectionLabel: "Renewal Brief Alignment",
        defaultSummary: "Confirm renewed settings and creatives remain aligned with the campaign brief and prior launch context.",
        showIntent: true,
        showGoalVerticalChecks: true,
        showPlatformRequirements: false,
        taskBadge: taskLabel,
      };
    case "url_validation_utm_update":
      return {
        sectionLabel: "Brief & Landing Page Context",
        defaultSummary: "Campaign brief context used to validate landing URLs, UTMs, and page experience against stated intent.",
        showIntent: true,
        showGoalVerticalChecks: false,
        showPlatformRequirements: false,
        taskBadge: taskLabel,
      };
    case "campaign_setup":
    default:
      return {
        sectionLabel: "Campaign Brief Validation",
        defaultSummary: "Your Campaign Brief is the primary validation source for creative and settings alignment across all analysis.",
        showIntent: true,
        showGoalVerticalChecks: true,
        showPlatformRequirements: true,
        taskBadge: platform === "programmatic" && task ? taskLabel : null,
      };
  }
}

function CampaignBriefOverviewSection({ briefValidation, platformLabel, programmaticTaskType = "", platform = "", exportMode = false }) {
  const config = getBriefSectionConfig(programmaticTaskType, platform);
  const settings = briefValidation?.settings;
  const sample = briefValidation?.sampleBriefAlignment;
  const intent = briefValidation?.intentSummary;
  const intentLine = briefValidation?.intentLine;
  const verticalOk = settings?.vertical_settings_check?.is_aligned;
  const hasSettingsConflict = config.showGoalVerticalChecks && verticalOk === false;
  const hasCreativeConflict = (briefValidation?.briefMisalignedCount || 0) > 0
    || sample?.creative_matches_brief === false
    || sample?.alignment_status === "misaligned";

  const tone = hasSettingsConflict || hasCreativeConflict ? RISK_TONES.red : RISK_TONES.emerald;
  const summaryText = sample?.summary || intent?.narrative || config.defaultSummary;

  return (
    <section className={`rounded-2xl border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader icon={FileText} label={config.sectionLabel} accent={hasSettingsConflict || hasCreativeConflict ? "text-red-700" : "text-emerald-700"} />
        <div className="flex flex-wrap items-center gap-2">
          {config.taskBadge ? (
            <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c8c8d4]">
              {config.taskBadge}
            </span>
          ) : null}
          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${tone.badge}`}>
            {hasSettingsConflict || hasCreativeConflict ? "Review required" : "Brief active"}
          </span>
        </div>
      </div>

      <p className={`mt-3 text-sm leading-relaxed ${tone.text}`}>
        {summaryText}
      </p>

      {config.showIntent && intentLine ? (
        <div className="mt-4 rounded-lg border border-violet-400/25 bg-violet-500/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">Campaign Intent</p>
          <p className="mt-1 text-sm leading-relaxed text-violet-50">{intentLine}</p>
        </div>
      ) : null}

      {config.showIntent && intent && !intentLine ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <BriefIntentCard title="Campaign objective" value={intent.campaignObjective} />
          <BriefIntentCard title="What it is trying to achieve" value={intent.tryingToAchieve} />
          <BriefIntentCard title="Product or service" value={intent.productOrService} />
          <BriefIntentCard title="Target audience" value={intent.targetAudience} />
          <BriefIntentCard title="Overall purpose" value={intent.overallPurpose} className="md:col-span-2" />
        </div>
      ) : null}

      {config.showGoalVerticalChecks ? (
        <div className="mt-4 grid grid-cols-1 gap-3">
          <BriefCheckCard
            title="Vertical vs Brief"
            ok={verticalOk}
            explanation={settings?.vertical_settings_check?.explanation}
          />
        </div>
      ) : null}

      {config.showPlatformRequirements && settings?.platform_requirements_check?.findings?.length ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{platformLabel} brief requirements</p>
          <ul className="mt-1 text-sm text-slate-800 space-y-1">
            {settings.platform_requirements_check.findings.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasCreativeConflict && sample?.recommendations?.length ? (
        <ul className="mt-3 text-sm text-slate-800 space-y-1">
          {(exportMode ? sample.recommendations : sample.recommendations.slice(0, 3)).map((item) => (
            <li key={item} className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function BriefCheckCard({ title, ok, explanation }) {
  const isFail = ok === false;
  const isUnknown = ok === null || ok === undefined;
  const cardTone = isFail
    ? "border-red-200 bg-white"
    : isUnknown
      ? "border-amber-200 bg-white"
      : "border-emerald-200 bg-white";

  return (
    <div className={`rounded-lg border p-3 ${cardTone}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{title}</p>
      <p className={`mt-1 text-sm font-bold ${isFail ? "text-red-900" : isUnknown ? "text-amber-900" : "text-emerald-900"}`}>
        {isFail ? "Mismatch" : isUnknown ? "Needs clarity" : "Aligned"}
      </p>
      {explanation ? <p className="mt-1 text-xs text-slate-700 leading-relaxed">{explanation}</p> : null}
    </div>
  );
}

function BriefIntentCard({ title, value, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{title}</p>
      <p className="mt-1 text-sm text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}

const ALIGNMENT_STATUS_LABELS = {
  aligned: "Aligned",
  partial: "Partial Alignment",
  misaligned: "Misaligned",
};

const ALIGNMENT_STATUS_TONES = {
  aligned: INSIGHT_TONES.emerald,
  partial: INSIGHT_TONES.amber,
  misaligned: {
    border: "border-rose-400/30",
    bg: "bg-rose-500/8",
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    text: "text-rose-100",
  },
};

function CreativeRiskSummarySection({ riskSummary, platformLabel, exportMode = false }) {
  const [showAllCreatives, setShowAllCreatives] = useState(false);
  const [showAllLaunchRisks, setShowAllLaunchRisks] = useState(false);

  const counts = riskSummary.counts || {};
  const summaryBlocks = riskSummary.riskSummaryBlocks || [];
  const featuredCreatives = riskSummary.featuredCreativeRisks || [];
  const rankedCreatives = riskSummary.rankedCreativeRisks || riskSummary.perCreativeRisks || [];
  const revealAllCreatives = exportMode || showAllCreatives;
  const visibleCreatives = revealAllCreatives ? rankedCreatives : featuredCreatives;
  const launchStatus = riskSummary.campaignLaunchStatus;
  const launchTone = launchStatus?.tone === "emerald"
    ? ALIGNMENT_STATUS_TONES.aligned
    : launchStatus?.tone === "amber"
      ? ALIGNMENT_STATUS_TONES.partial
      : ALIGNMENT_STATUS_TONES.misaligned;

  const revealAllLaunchRisks = exportMode || showAllLaunchRisks;
  const visibleLaunchRisks = revealAllLaunchRisks
    ? (riskSummary.allLaunchRisks || riskSummary.launchRisks || [])
    : (riskSummary.launchRisks || []);

  return (
    <section className="neon-card rounded-2xl p-5 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <SectionHeader icon={Layers} label="Creative Risk Summary" accent="text-amber-400" />
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c8c8d4]">
            Campaign-level risk view across {counts.total || 0} {platformLabel} creative{counts.total === 1 ? "" : "s"}.
            {exportMode
              ? " Full per-creative risk detail is included below."
              : " Critical issues appear first. Expand individual creatives for full detail."}
          </p>
        </div>
        {launchStatus ? (
          <div className={`w-full shrink-0 rounded-xl border p-4 lg:w-64 xl:w-72 ${launchTone.border} ${launchTone.bg}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#f4f4f8]">Launch Readiness</p>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${launchTone.badge}`}>
                {launchStatus.label}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <RiskCountPill label="Ready" value={counts.ready || 0} tone="emerald" />
              <RiskCountPill label="Review" value={counts.review || 0} tone="amber" />
              <RiskCountPill label="Blocked" value={counts.misaligned || 0} tone="red" />
            </div>
          </div>
        ) : null}
      </div>

      {riskSummary.hasNoRisk ? (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${INSIGHT_TONES.emerald}`}>
          <Shield size={18} className="text-emerald-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-100">No critical launch risks</p>
            <p className="mt-1 text-sm text-emerald-200/90">
              Analysis found no blocking issues across your creative set.
            </p>
          </div>
        </div>
      ) : summaryBlocks.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {summaryBlocks.map((block) => (
            <RiskSummaryScoreCard key={block.label} block={block} totalCreatives={counts.total || 0} />
          ))}
        </div>
      ) : null}

      {!riskSummary.hasNoRisk && visibleLaunchRisks.length ? (
        <div className={`rounded-xl border p-4 ${INSIGHT_TONES.amber}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">Priority launch risks</p>
          <ul className="mt-2 space-y-1.5">
            {visibleLaunchRisks.map((risk, index) => (
              <li key={`${risk}-${index}`} className="flex items-start gap-2 text-sm leading-relaxed text-amber-50">
                <AlertTriangle size={12} className="shrink-0 mt-1 text-amber-300" />
                {risk}
              </li>
            ))}
          </ul>
          {riskSummary.hiddenLaunchRiskCount > 0 && !exportMode ? (
            <button
              type="button"
              data-export-hide
              onClick={() => setShowAllLaunchRisks((value) => !value)}
              className="mt-3 text-xs font-semibold text-amber-200 underline-offset-2 hover:underline"
            >
              {showAllLaunchRisks
                ? "Show fewer priority risks"
                : `Show ${riskSummary.hiddenLaunchRiskCount} more priority risk${riskSummary.hiddenLaunchRiskCount === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </div>
      ) : null}

      {rankedCreatives.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#f4f4f8]">Per-Creative Risks</p>
            <p className="text-xs text-[#9a9aad]">
              Showing {visibleCreatives.length} of {rankedCreatives.length}
              {!exportMode && !revealAllCreatives && riskSummary.remainingCreativeRiskCount > 0
                ? ` · ${riskSummary.remainingCreativeRiskCount} more collapsed`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleCreatives.map((row) => (
              <CompactCreativeRiskCard key={row.id} row={row} exportMode={exportMode} />
            ))}
          </div>

          {riskSummary.remainingCreativeRiskCount > 0 && !exportMode ? (
            <button
              type="button"
              data-export-hide
              onClick={() => setShowAllCreatives((value) => !value)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#d4d4de] transition hover:bg-white/[0.07]"
            >
              <ChevronDown size={16} className={`transition-transform ${showAllCreatives ? "rotate-180" : ""}`} />
              {showAllCreatives
                ? "Show priority creatives only"
                : `Show all ${rankedCreatives.length} creatives`}
            </button>
          ) : null}
        </div>
      ) : null}

      {launchStatus ? (
        <motion.div
          className={`rounded-xl border p-4 ${launchTone.border} ${launchTone.bg}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold text-[#f4f4f8]">Launch Recommendation</p>
          <p className="mt-1 text-base font-bold text-[#f4f4f8] flex items-center gap-2">
            <span>{launchStatus.emoji}</span>
            {launchStatus.label}
          </p>
          {riskSummary.recommendationBullets?.length ? (
            <ul className="mt-3 space-y-1.5">
              {riskSummary.recommendationBullets.map((bullet, index) => (
                <li key={`${bullet}-${index}`} className="text-sm text-[#d4d4de] leading-relaxed">• {bullet}</li>
              ))}
            </ul>
          ) : null}
        </motion.div>
      ) : null}
    </section>
  );
}

function RiskCountPill({ label, value, tone }) {
  const tones = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    red: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  };
  return (
    <div className={`rounded-lg border px-2 py-2 ${tones[tone] || tones.amber}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

function RiskSummaryScoreCard({ block, totalCreatives }) {
  const tone = ALIGNMENT_STATUS_TONES[block.status] || ALIGNMENT_STATUS_TONES.partial;
  const statusLabel = ALIGNMENT_STATUS_LABELS[block.status] || block.status;

  return (
    <div className={`rounded-xl border p-4 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#f4f4f8]">{block.label}</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.badge}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-3xl font-black tabular-nums ${tone.text}`}>{block.count}</p>
        <p className="text-xs text-[#9a9aad]">of {totalCreatives || 0}</p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${block.score >= 80 ? "bg-emerald-500" : block.score >= 55 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${block.score}%` }}
        />
      </div>
      <p className={`mt-3 text-sm leading-relaxed ${tone.text}`}>{block.reason}</p>
      {block.recommendations?.length ? (
        <ul className="mt-2 space-y-1">
          {block.recommendations.map((item, index) => (
            <li key={`${block.label}-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#d4d4de]">
              <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CompactCreativeRiskCard({ row, exportMode = false }) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = exportMode || expanded;
  const assessment = row.riskAssessment;
  const headline = row.headline || row.mainRisk || (row.statusKey === "ready" ? "Launch ready." : "Review recommended.");
  const statusTone = row.statusKey === "ready"
    ? ALIGNMENT_STATUS_TONES.aligned
    : row.statusKey === "misaligned"
      ? ALIGNMENT_STATUS_TONES.misaligned
      : ALIGNMENT_STATUS_TONES.partial;

  const detailGroups = [
    { title: "Critical", items: assessment?.criticalIssues || [] },
    { title: "Compliance", items: assessment?.complianceConcerns || [] },
    { title: "Weaknesses", items: assessment?.creativeWeaknesses || [] },
    {
      title: "Optimization",
      items: assessment?.optimizationRecommendations || (row.recommendedFix ? [row.recommendedFix] : []),
    },
  ].filter((group) => group.items.length > 0);

  const hasDetails = detailGroups.length > 0;

  return (
    <div className={`rounded-xl border p-4 ${statusTone.border} ${statusTone.bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#f4f4f8] truncate">{row.name}</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone.badge}`}>
          {row.status?.emoji} {row.status?.label}
        </span>
      </div>
      <p className={`mt-2 text-sm leading-relaxed ${statusTone.text}`}>{headline}</p>
      {row.recommendedFix && row.recommendedFix !== headline && (!isExpanded || (exportMode && !hasDetails)) ? (
        <p className="mt-1 text-xs text-[#d4d4de] leading-relaxed">
          <span className="font-semibold">Fix:</span> {row.recommendedFix}
        </p>
      ) : null}

      {isExpanded && hasDetails ? (
        <div className="mt-3 space-y-2">
          {detailGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad]">{group.title}</p>
              <ul className="mt-1 space-y-1">
                {(exportMode ? group.items : group.items.slice(0, 3)).map((item, index) => (
                  <li key={`${group.title}-${index}`} className="text-xs leading-relaxed text-[#d4d4de]">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {hasDetails && !exportMode ? (
        <button
          type="button"
          data-export-hide
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#c8c8d4] hover:text-[#f4f4f8]"
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Hide details" : "View details"}
        </button>
      ) : null}
    </div>
  );
}

function CampaignAlignmentSection({ alignment }) {
  if (!alignment) return null;

  const detailBlocks = [
    alignment.campaignBriefAlignment,
    alignment.creativeMessagingAlignment,
    alignment.landingPageAlignment,
  ].filter(Boolean);
  const overall = alignment.overall;

  return (
    <section className="neon-card rounded-2xl p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <SectionHeader icon={Shield} label="Campaign Alignment" accent="text-cyan-400" />
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c8c8d4]">
            Alignment across campaign brief, creative messaging, and landing page content.
            Scores reflect whether objectives, offers, CTAs, and user journey stay consistent end to end.
          </p>
        </div>
        {overall ? (
          <div className="w-full shrink-0 lg:w-64 xl:w-72">
            <AlignmentScoreCard block={overall} compact />
          </div>
        ) : null}
      </div>

      {detailBlocks.length ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {detailBlocks.map((block) => (
            <AlignmentScoreCard key={block.label} block={block} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AlignmentScoreCard({ block, compact = false }) {
  const tone = ALIGNMENT_STATUS_TONES[block.status] || ALIGNMENT_STATUS_TONES.partial;
  const statusLabel = ALIGNMENT_STATUS_LABELS[block.status] || block.status;

  return (
    <div className={`rounded-xl border p-4 ${tone.border} ${tone.bg} ${compact ? "h-full" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#f4f4f8]">{block.label}</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.badge}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-3xl font-black tabular-nums ${tone.text}`}>{block.score}</p>
        <p className="text-xs text-[#9a9aad]">/ 100</p>
      </div>

      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${block.score >= 80 ? "bg-emerald-500" : block.score >= 55 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${block.score}%` }}
        />
      </div>

      <p className={`mt-3 text-sm leading-relaxed ${tone.text}`}>{block.reason}</p>

      {!compact && block.recommendations?.length ? (
        <ul className="mt-3 space-y-1.5">
          {block.recommendations.map((item, index) => (
            <li key={`${block.label}-rec-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#d4d4de]">
              <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function UrlValidationSection({ urlValidation, exportMode = false }) {
  if (!urlValidation) {
    return (
      <section className="neon-card rounded-2xl border border-dashed border-white/20 p-5">
        <div className="flex items-start gap-3">
          <Link2 size={18} className="text-[#9a9aad] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#f4f4f8]">URL Validation</p>
            <p className="mt-1 text-sm text-[#c8c8d4] leading-relaxed">
              No URL validated yet. In Step 2, enter a landing page URL and run Validate URL.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (urlValidation.status === "skipped") {
    return (
      <section className="neon-card rounded-2xl p-5">
        <SectionHeader icon={Link2} label="URL Validation" accent="text-[#9a9aad]" />
        <p className="mt-2 text-sm text-[#c8c8d4]">Skipped. No URL was submitted.</p>
      </section>
    );
  }

  const isAligned = urlValidation.status === "aligned";
  const tone = isAligned ? RISK_TONES.emerald : RISK_TONES.red;

  return (
    <section className={`rounded-2xl border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader icon={Link2} label="URL Validation" accent={isAligned ? "text-emerald-700" : "text-red-700"} />
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${tone.badge}`}>
          {isAligned ? "Matches campaign" : "Does not match"}
        </span>
      </div>

      <p className={`mt-3 text-sm font-medium leading-relaxed ${tone.text}`}>
        {isAligned
          ? "The landing page content aligns with your selected platform, goal, and vertical."
          : "The landing page content does not align with your selected platform, goal, or vertical."}
      </p>

      {urlValidation.page_about ? (
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">About the page: </span>
          {urlValidation.page_about}
        </p>
      ) : null}

      {!isAligned && urlValidation.misalignment_reason ? (
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">Why misaligned: </span>
          {urlValidation.misalignment_reason}
        </p>
      ) : null}

      {urlValidation.submitted_url ? (
        <p className="mt-3 flex items-center gap-1.5 break-all text-xs text-slate-700">
          {!exportMode ? <ExternalLink size={12} className="shrink-0" /> : null}
          {urlValidation.submitted_url}
        </p>
      ) : null}

      {!isAligned && urlValidation.suggestions?.length ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-800">
          {(exportMode ? urlValidation.suggestions : urlValidation.suggestions.slice(0, 3)).map((suggestion) => (
            <li key={suggestion}>• {suggestion}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
