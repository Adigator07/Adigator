"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { qaItemIcon } from "@/app/lib/analyzerInsights";

export default function AnalyzerOverview({
  overview,
  greetingName,
  goalText,
  verticalText,
  platform,
}) {
  if (!overview) return null;

  const isMeta = platform === "meta_ads";
  const isGoogle = platform === "google_ads";
  const isProgrammatic = platform === "programmatic";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">Overview Briefing</p>
        <h3 className="mt-2 text-xl font-black text-slate-900">Welcome back, {greetingName}.</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
          Risk-based launch analysis for {platform?.replace(/_/g, " ") || "your platform"} — {goalText} goal in {verticalText}.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Creatives" value={overview.totalCount} />
        <StatCard label="Launch Ready" value={overview.readyCount} accent="emerald" />
        <StatCard label="Needs Review" value={overview.reviewCount} accent="amber" />
        <StatCard label="Misaligned" value={overview.misalignedCount} accent="red" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-amber-600" />
          <h4 className="text-sm font-semibold text-slate-900">Launch Risks Detected</h4>
        </div>
        {overview.hasNoRisk ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <Shield size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">No Risk</p>
              <p className="mt-1 text-sm text-emerald-800">
                Everything looks perfect — no critical launch risks detected across this creative set.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {overview.launchRisks.map((risk) => (
              <li key={risk} className="text-sm text-slate-900 leading-relaxed rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                {risk}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 overflow-x-auto">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Placement Compatibility</h4>
        <table className="w-full min-w-[520px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Creative</th>
              {overview.placementColumns.map((col) => (
                <th key={col.id} className="text-center py-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {overview.placementMatrix.map((row) => (
              <tr key={row.name} className="border-b border-slate-100">
                <td className="py-2.5 pr-3 font-medium text-slate-900 truncate max-w-[140px]">{row.name}</td>
                {row.cells.map((cell) => (
                  <td key={`${row.name}-${cell.column}`} className="text-center py-2.5 px-2 text-base" title={cell.column}>
                    {cell.emoji}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {isMeta ? (
          <p className="mt-2 text-xs text-slate-600">
            Meta legend: 🟢 Feed/Stories/Reels ready · 🟡 usable with crop or copy edits · 🔴 wrong aspect ratio for that placement
          </p>
        ) : isGoogle ? (
          <p className="mt-2 text-xs text-slate-600">
            Google legend: 🟢 Display/YouTube/Discover/Shopping ready · 🟡 usable with crop or RDA edits · 🔴 wrong size for that GDN or video placement
          </p>
        ) : isProgrammatic ? (
          <p className="mt-2 text-xs text-slate-600">
            Programmatic legend: 🟢 Standard/Premium/Mobile/Native ready · 🟡 scale or crop edits needed · 🔴 weak for that inventory tier
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Creative QA Summary</h4>
        <ul className="space-y-2">
          {overview.qaSummary.map((item) => (
            <li key={item.text} className="flex items-start gap-2 text-sm text-slate-900">
              <span className="shrink-0">{qaItemIcon(item.status)}</span>
              <span>{item.text}</span>
            </li>
          ))}
          {overview.qaSummary.length === 0 && (
            <li className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle size={14} /> All automated QA checks passed.
            </li>
          )}
        </ul>
      </section>

      <motion.section
        className={`rounded-xl border p-4 ${
          overview.campaignLaunchStatus.tone === "emerald"
            ? "border-emerald-200 bg-emerald-50"
            : overview.campaignLaunchStatus.tone === "amber"
              ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Launch Recommendation</h4>
        <p className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>{overview.campaignLaunchStatus.emoji}</span>
          {overview.campaignLaunchStatus.label}
        </p>
        <ul className="mt-3 space-y-1.5">
          {overview.recommendationBullets.map((bullet) => (
            <li key={bullet} className="text-sm text-slate-800 leading-relaxed">• {bullet}</li>
          ))}
        </ul>
      </motion.section>

      <p className="text-sm text-slate-600 rounded-xl border border-slate-200 bg-slate-50 p-3">
        Open <span className="font-semibold text-slate-900">Creative Analysis</span> for Technical QA, placement checks, and per-creative fixes.
      </p>
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
