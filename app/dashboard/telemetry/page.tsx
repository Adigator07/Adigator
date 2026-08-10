"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, RefreshCcw } from "lucide-react";

import RouteAccessShell from "@/app/components/RouteAccessShell";
import { getStoredRouteTelemetry } from "@/app/lib/routeTelemetry";

type TelemetryEntry = {
  id: string;
  type: string;
  surface: string;
  label: string;
  ok: boolean;
  durationMs: number;
  recordedAt: string;
};

function TelemetryPageContent() {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [surfaceFilter, setSurfaceFilter] = useState("all");

  useEffect(() => {
    const load = () => {
      setEntries(getStoredRouteTelemetry().slice().reverse() as TelemetryEntry[]);
    };

    load();
    window.addEventListener("adigator-route-telemetry", load);
    return () => {
      window.removeEventListener("adigator-route-telemetry", load);
    };
  }, []);

  const surfaces = useMemo(() => {
    return ["all", ...new Set(entries.map((entry) => entry.surface).filter(Boolean))];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => surfaceFilter === "all" || entry.surface === surfaceFilter);
  }, [entries, surfaceFilter]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/55 transition hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">Performance Diagnostics</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Telemetry Viewer</h1>
              <p className="mt-2 text-sm text-white/55">Track route load and API timings for communications, QA, and preview flows.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEntries(getStoredRouteTelemetry().slice().reverse() as TelemetryEntry[])}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <Gauge size={18} className="text-sky-300" />
          <span className="text-sm text-white/70">Stored entries: {entries.length}</span>
          <select
            value={surfaceFilter}
            onChange={(event) => setSurfaceFilter(event.target.value)}
            className="ml-auto rounded-xl border border-white/10 bg-[#0b1628] px-3 py-2 text-sm text-white outline-none"
          >
            {surfaces.map((surface) => (
              <option key={surface} value={surface}>{surface === "all" ? "All surfaces" : surface}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Surface</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-white/70">{new Date(entry.recordedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/65">{entry.type}</td>
                  <td className="px-4 py-3 text-white/65">{entry.surface}</td>
                  <td className="px-4 py-3 text-white">{entry.label}</td>
                  <td className="px-4 py-3 text-sky-300">{entry.durationMs} ms</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${entry.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
                      {entry.ok ? "OK" : "Fail"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TelemetryPage() {
  return (
    <RouteAccessShell routeKey="telemetry" title="Telemetry Viewer">
      <TelemetryPageContent />
    </RouteAccessShell>
  );
}