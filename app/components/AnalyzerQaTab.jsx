"use client";

import { CheckCircle, Target, Wrench } from "lucide-react";
import { qaItemIcon } from "@/app/lib/analyzerInsights";

const PLATFORM_LABELS = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  programmatic: "Programmatic Ads",
};

export default function AnalyzerQaTab({ overview, platform }) {
  if (!overview?.sections) return null;

  const platformLabel = PLATFORM_LABELS[platform] || platform?.replace(/_/g, " ") || "Platform";
  const technicalQa = overview.sections.technicalQa;
  const placementQa = overview.sections.placementQa;

  if (!technicalQa && !placementQa) {
    return (
      <div className="neon-card rounded-2xl border border-dashed border-white/20 p-6 text-center">
        <p className="text-sm text-[#c8c8d4]">No QA data available for this campaign yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="neon-card rounded-2xl p-5">
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">Quality Assurance</p>
        <h3 className="mt-2 text-xl font-black text-[#f4f4f8]">{platformLabel} technical & placement checks</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#c8c8d4]">
          Aggregated spec compliance, rendering safety, and inventory placement fit across all creatives in this campaign.
        </p>
      </section>

      {technicalQa ? (
        <section className="neon-card rounded-xl p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <SectionHeader icon={Wrench} label={`Technical QA · ${platformLabel}`} accent="text-sky-600" inline />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pass rate {technicalQa.passRate}%
            </span>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">{technicalQa.summary}</p>
          <QaItemList items={technicalQa.items} />
        </section>
      ) : null}

      {placementQa ? (
        <section className="neon-card space-y-4 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeader icon={Target} label={`Placement QA ${platformLabel}`} accent="text-violet-600" inline />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pass rate {placementQa.passRate}%
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{placementQa.summary}</p>
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

      <p className="rounded-xl border border-white/12 bg-white/[0.04] p-3 text-sm text-[#c8c8d4]">
        Open <span className="font-semibold text-[#f4f4f8]">Creative Analysis</span> for per-creative Technical and Placement QA detail.
      </p>
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
      <h5 className="mb-2 text-xs font-semibold text-slate-900">{title}</h5>
      <table className="w-full min-w-[520px] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[min(220px,32%)]" />
          {columns.map((col) => (
            <col key={col.id} className="w-[72px]" />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600">Creative</th>
            {columns.map((col) => (
              <th key={col.id} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-600">
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
                <td key={`${row.name}-${cell.column}`} className="px-2 py-2.5 text-center text-base" title={cell.column}>
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
