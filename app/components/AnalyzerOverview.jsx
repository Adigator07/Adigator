"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, CheckCircle, ExternalLink, Layers, Link2, Shield, Target, Wrench } from "lucide-react";
import { qaItemIcon } from "@/app/lib/analyzerInsights";

const PLATFORM_LABELS = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  programmatic: "Programmatic Ads",
};

const RISK_TONES = {
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    badge: "text-emerald-700 bg-emerald-100 border-emerald-200",
  },
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-950",
    badge: "text-amber-800 bg-amber-100 border-amber-200",
  },
  red: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-950",
    badge: "text-red-800 bg-red-100 border-red-200",
  },
};

export default function AnalyzerOverview({
  overview,
  greetingName,
  goalText,
  verticalText,
  platform,
  urlValidation = null,
  campaignBrief = "",
}) {
  if (!overview) return null;

  const sections = overview.sections;
  const platformLabel = PLATFORM_LABELS[platform] || platform?.replace(/_/g, " ") || "Platform";
  const briefing = sections?.briefing;
  const health = sections?.campaignHealth;
  const creativeAnalysis = sections?.creativeAnalysis;
  const technicalQa = sections?.technicalQa;
  const placementQa = sections?.placementQa;
  const riskSummary = sections?.creativeRiskSummary;

  return (
    <div className="space-y-5">
      {/* 1. Overview Briefing */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Overview Briefing</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">Welcome back, {greetingName}.</h3>
        <p className="mt-1 text-sm font-semibold text-slate-800">{briefing?.headline || `${platformLabel} campaign intelligence`}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
          {briefing?.narrative || `Risk-based launch analysis for ${platformLabel}: ${goalText} goal in ${verticalText}.`}
        </p>
        {briefing?.focusAreas?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {briefing.focusAreas.map((area) => (
              <span key={area} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-sky-800">
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
      <UrlValidationSection urlValidation={urlValidation} />

      {!campaignBrief?.trim() ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-semibold text-sky-900">Improve analysis accuracy</p>
          <p className="mt-1 text-sm text-sky-800 leading-relaxed">
            Add a <strong>Client Brief / Campaign Description</strong> in Step 1 for tighter alignment between your creative, objective, vertical, and landing page.
            Update the brief and click <strong>Reanalyze</strong> to refresh results.
          </p>
        </section>
      ) : null}

      {/* 2. Campaign Health Summary */}
      {health ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionHeader icon={Activity} label="Campaign Health Summary" accent="text-violet-600" />
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <HealthScoreCard label="Health Score" value={health.healthScore} tone={health.riskLevel?.tone} />
              <HealthScoreCard label="Compatibility" value={health.compatibilityScore} tone="violet" subtitle="Placement fit" />
              <div className={`rounded-xl border px-4 py-3 ${RISK_TONES[health.riskLevel?.tone]?.border || "border-slate-200"} ${RISK_TONES[health.riskLevel?.tone]?.bg || "bg-slate-50"}`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">Risk Level</p>
                <p className={`mt-1 text-lg font-bold ${RISK_TONES[health.riskLevel?.tone]?.text || "text-slate-900"}`}>
                  {health.riskLevel?.label}
                </p>
              </div>
            </div>
          </div>

          {health.dimensions?.length ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {health.dimensions.map((dim) => (
                <div key={dim.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{dim.label}</p>
                    <p className="text-sm font-black text-slate-900 tabular-nums">{dim.score}</p>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-snug">{dim.note}</p>
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Inventory coverage</p>
              <div className="flex flex-wrap gap-2">
                {health.inventoryCoverage.map((row) => (
                  <span key={row.label} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-800">
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
        <section className="rounded-xl border border-slate-200 bg-white p-4">
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
              <table className="w-full min-w-[520px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Creative</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Status</th>
                    <th className="py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {creativeAnalysis.perCreative.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 pr-3 font-medium text-slate-900">{row.name}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {row.status?.emoji} {row.status?.label}
                      </td>
                      <td className="py-2.5 px-2 text-xs text-slate-700 leading-relaxed">
                        {[row.headline && `Headline: ${row.headline}`, row.dominantVisual, row.textDensity && `Text: ${row.textDensity}`]
                          .filter(Boolean)
                          .join(" · ") || "Visual-led asset"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* 4. Technical QA */}
      {technicalQa ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <SectionHeader icon={Wrench} label={`Technical QA · ${platformLabel}`} accent="text-sky-600" inline />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pass rate {technicalQa.passRate}%
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{technicalQa.summary}</p>
          <QaItemList items={technicalQa.items} />
        </section>
      ) : null}

      {/* 5. Placement QA */}
      {placementQa ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeader icon={Target} label={`Placement QA · ${platformLabel}`} accent="text-violet-600" inline />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pass rate {placementQa.passRate}%
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{placementQa.summary}</p>
          <QaItemList items={placementQa.items} />

          {placementQa.placementColumns?.length && placementQa.placementMatrix?.length ? (
            <PlacementMatrixSection
              title={`${platformLabel} Placement Compatibility`}
              columns={placementQa.placementColumns}
              matrix={placementQa.placementMatrix}
              legend={placementQa.placementLegend}
            />
          ) : null}

          {placementQa.deviceMatrix && placementQa.deviceColumns?.length > 0 ? (
            <PlacementMatrixSection
              title="Device Compatibility"
              columns={placementQa.deviceColumns}
              matrix={placementQa.deviceMatrix}
              legend={placementQa.placementLegend}
            />
          ) : null}
        </section>
      ) : null}

      {/* 6. Creative Risk Summary */}
      {riskSummary ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <SectionHeader icon={Layers} label="Creative Risk Summary" accent="text-amber-600" />
            {riskSummary.hasNoRisk ? (
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <Shield size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">No critical launch risks</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Campaign set passes {platformLabel} checks with no blocking issues detected across creatives.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {riskSummary.launchRisks.map((risk) => (
                  <li key={risk} className="text-sm text-slate-900 leading-relaxed rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    {risk}
                  </li>
                ))}
              </ul>
            )}

            {riskSummary.perCreativeRisks?.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Per-creative risks</p>
                {riskSummary.perCreativeRisks.map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                      <span className="text-xs text-slate-700">{row.status?.emoji} {row.status?.label}</span>
                    </div>
                    {row.mainRisk ? (
                      <p className="mt-1.5 text-xs text-amber-900 leading-relaxed"><span className="font-semibold">Risk:</span> {row.mainRisk}</p>
                    ) : row.statusKey === "ready" ? (
                      <p className="mt-1.5 text-xs text-emerald-800">No blocking issues. Launch ready.</p>
                    ) : null}
                    {row.recommendedFix ? (
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed"><span className="font-semibold">Fix:</span> {row.recommendedFix}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <motion.section
            className={`rounded-xl border p-4 ${
              riskSummary.campaignLaunchStatus?.tone === "emerald"
                ? "border-emerald-200 bg-emerald-50"
                : riskSummary.campaignLaunchStatus?.tone === "amber"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Launch Recommendation</h4>
            <p className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{riskSummary.campaignLaunchStatus?.emoji}</span>
              {riskSummary.campaignLaunchStatus?.label}
            </p>
            <ul className="mt-3 space-y-1.5">
              {riskSummary.recommendationBullets.map((bullet) => (
                <li key={bullet} className="text-sm text-slate-800 leading-relaxed">• {bullet}</li>
              ))}
            </ul>
          </motion.section>
        </section>
      ) : null}

      <p className="text-sm text-slate-600 rounded-xl border border-slate-200 bg-slate-50 p-3">
        Open <span className="font-semibold text-slate-900">Creative Analysis</span> for per-creative goal alignment, extraction signals, and detailed fixes.
      </p>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, accent, inline = false }) {
  return (
    <div className={`flex items-center gap-2 ${inline ? "" : "mb-0"}`}>
      <Icon size={15} className={accent} />
      <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
    </div>
  );
}

function HealthScoreCard({ label, value, tone, subtitle }) {
  const isViolet = tone === "violet";
  const riskTone = RISK_TONES[tone] || RISK_TONES.emerald;
  return (
    <div className={`rounded-xl border px-4 py-3 min-w-[120px] ${isViolet ? "border-violet-200 bg-violet-50" : `${riskTone.border} ${riskTone.bg}`}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80 text-slate-600">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${isViolet ? "text-violet-900" : riskTone.text}`}>{value}</p>
      {subtitle ? <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p> : null}
    </div>
  );
}

function InsightList({ title, items, tone }) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    sky: "border-sky-200 bg-sky-50/50",
  };
  if (!items?.length) {
    return (
      <div className={`rounded-lg border p-3 ${tones[tone] || tones.sky}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">{title}</p>
        <p className="text-xs text-slate-500">None flagged.</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border p-3 ${tones[tone] || tones.sky}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs text-slate-800 leading-relaxed">• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function QaItemList({ items }) {
  if (!items?.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-800">
        <CheckCircle size={14} /> All automated QA checks passed.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-2 text-sm text-slate-900">
          <span className="shrink-0">{qaItemIcon(item.status)}</span>
          <span>
            {item.text}
            {item.count > 1 ? (
              <span className="ml-1 text-[10px] text-slate-500">({item.count} creatives)</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlacementMatrixSection({ title, columns, matrix, legend }) {
  if (!columns?.length || !matrix?.length) return null;

  return (
    <div className="overflow-x-auto pt-2">
      <h5 className="text-xs font-semibold text-slate-900 mb-2">{title}</h5>
      <table className="w-full min-w-[520px] text-sm border-collapse table-fixed">
        <colgroup>
          <col className="w-[min(220px,32%)]" />
          {columns.map((col) => (
            <col key={col.id} className="w-[72px]" />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Creative</th>
            {columns.map((col) => (
              <th key={col.id} className="text-center py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={`${row.name}-${rowIndex}`} className="border-b border-slate-100 align-top">
              <td className="py-2.5 pr-3 font-medium text-slate-900">
                <span className="block whitespace-normal break-words leading-snug">{row.name}</span>
              </td>
              {row.cells.map((cell) => (
                <td key={`${row.name}-${cell.column}`} className="text-center py-2.5 px-2 text-base" title={cell.column}>
                  {cell.emoji}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {legend ? <p className="mt-2 text-xs text-slate-600">{legend}</p> : null}
    </div>
  );
}

function StatCard({ label, value, accent = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  };
  return (
    <div className={`rounded-xl border p-3.5 ${tones[accent] || tones.slate}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-slate-900">{value}</p>
    </div>
  );
}

function UrlValidationSection({ urlValidation }) {
  if (!urlValidation) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <Link2 size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">URL Validation</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              No URL validated yet. In Step 2, enter a landing page URL and run Validate URL.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (urlValidation.status === "skipped") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <SectionHeader icon={Link2} label="URL Validation" accent="text-slate-600" />
        <p className="mt-2 text-sm text-slate-600">Skipped. No URL was submitted.</p>
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
          <ExternalLink size={12} className="shrink-0" />
          {urlValidation.submitted_url}
        </p>
      ) : null}

      {!isAligned && urlValidation.suggestions?.length ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-800">
          {urlValidation.suggestions.slice(0, 3).map((suggestion) => (
            <li key={suggestion}>• {suggestion}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
