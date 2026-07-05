"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, MonitorPlay, Search } from "lucide-react";
import { motion } from "framer-motion";

import { getClientUser } from "@/app/lib/supabaseAuthClient";
import { resolveCampaignOwnerId } from "@/app/lib/campaignOwnerScope";
import {
  listDownloadHistory,
  openStoredDownloadReport,
  type DownloadHistoryEntry,
} from "@/app/lib/downloadHistoryStore";

function formatDownloadDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDownloadTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function ReportTypeIcon({ type }: { type: string }) {
  if (type.includes("PPTX") || type.includes("PNG")) {
    return <MonitorPlay size={14} className="text-violet-300 shrink-0" />;
  }
  return <FileText size={14} className="text-cyan-300 shrink-0" />;
}

function StatusBadge({ status }: { status: DownloadHistoryEntry["status"] }) {
  const isCompleted = status === "Completed";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
      isCompleted
        ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
        : "border border-rose-500/35 bg-rose-500/15 text-rose-200"
    }`}>
      {status}
    </span>
  );
}

function matchesSearch(entry: DownloadHistoryEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    entry.reportType,
    entry.campaignName,
    entry.campaignId,
    entry.advertiserName,
    entry.advertiserId,
    entry.downloadedBy,
    entry.filename,
    entry.status,
    formatDownloadDate(entry.downloadedAt),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function ReportTypeCell({
  entry,
  onOpen,
  openingId,
}: {
  entry: DownloadHistoryEntry;
  onOpen: (entry: DownloadHistoryEntry) => void;
  openingId?: string | null;
}) {
  const canOpen = entry.status === "Completed";
  const isOpening = openingId === entry.id;

  if (!canOpen) {
    return (
      <span className="inline-flex items-center gap-2 text-white/55">
        <ReportTypeIcon type={entry.reportType} />
        {entry.reportType}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      disabled={isOpening}
      className="group inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-left text-white/90 transition hover:bg-cyan-500/10 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-70"
      title="Open saved PDF report"
    >
      <ReportTypeIcon type={entry.reportType} />
      <span className="font-medium underline decoration-cyan-500/30 underline-offset-2 group-hover:decoration-cyan-400/70">
        {isOpening ? "Opening…" : entry.reportType}
      </span>
    </button>
  );
}

export default function DownloadsPage() {
  const [entries, setEntries] = useState<DownloadHistoryEntry[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openingReportId, setOpeningReportId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const resolvedOwnerId = await resolveCampaignOwnerId();
    setOwnerId(resolvedOwnerId);
    setEntries(listDownloadHistory(resolvedOwnerId));
  }, []);

  useEffect(() => {
    void refresh();
    const userPromise = getClientUser();
    void userPromise.then((user) => {
      const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
      setViewerName(name);
    });

    const onUpdate = () => { void refresh(); };
    window.addEventListener("adigator-download-history-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("adigator-download-history-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()),
    [entries],
  );

  const filteredEntries = useMemo(
    () => sortedEntries.filter((entry) => matchesSearch(entry, searchQuery)),
    [sortedEntries, searchQuery],
  );

  const handleOpenReport = useCallback(async (entry: DownloadHistoryEntry) => {
    setOpeningReportId(entry.id);
    setOpenError(null);
    try {
      const opened = await openStoredDownloadReport(entry);
      if (!opened) {
        setOpenError(
          `"${entry.reportType}" is not available on this device. Export the report again from the Preview Tool to save a new copy.`,
        );
      }
    } finally {
      setOpeningReportId(null);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07070f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.12),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/50 transition hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Download Center</h1>
              <p className="mt-1 text-sm text-white/45">
                Analysis reports and Preview Studio exports
                {viewerName ? ` · ${viewerName}` : ""}
              </p>
            </div>
          </div>
          <Link
            href="/preview-tool?step=1"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20"
          >
            Open Preview Tool
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_40px_rgba(124,58,237,0.08)]"
        >
          {openError ? (
            <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {openError}
            </div>
          ) : null}
          {sortedEntries.length ? (
            <>
              <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="relative max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search reports by type, campaign, advertiser, or ID…"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/25"
                  />
                </div>
                {searchQuery.trim() ? (
                  <p className="mt-2 text-xs text-white/40">
                    {filteredEntries.length} of {sortedEntries.length} report{sortedEntries.length === 1 ? "" : "s"} match your search
                  </p>
                ) : null}
              </div>

              {filteredEntries.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04]">
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Date</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Time</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Report Type</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Campaign</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Advertiser</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Advertiser ID</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Downloaded By</th>
                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/35">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/[0.06] transition hover:bg-white/[0.03]">
                          <td className="px-4 py-3 text-white/70">{formatDownloadDate(entry.downloadedAt)}</td>
                          <td className="px-4 py-3 text-white/55">{formatDownloadTime(entry.downloadedAt)}</td>
                          <td className="px-4 py-3">
                            <ReportTypeCell entry={entry} onOpen={handleOpenReport} openingId={openingReportId} />
                          </td>
                          <td className="px-4 py-3 font-medium text-white">{entry.campaignName || "—"}</td>
                          <td className="px-4 py-3 text-white/70">{entry.advertiserName || "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs text-white/55">{entry.advertiserId || "—"}</td>
                          <td className="px-4 py-3 text-white/55">{entry.downloadedBy || "—"}</td>
                          <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search size={32} className="mx-auto text-white/25 mb-3" />
                  <p className="text-sm font-medium text-white/70">No reports match your search</p>
                  <p className="mt-1 text-xs text-white/40">Try a different campaign name, advertiser ID, or report type.</p>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <Download size={40} className="mx-auto text-purple-400 mb-4" />
              <p className="text-lg font-semibold text-white">No downloads yet</p>
              <p className="mt-2 text-sm text-white/45 max-w-md mx-auto">
                Export a PDF analysis report from Step 3 or a preview studio report from Step 4.
                Downloads appear here automatically.
              </p>
            </div>
          )}
        </motion.div>

        {!ownerId ? (
          <p className="text-xs text-white/35 text-center">
            Sign in to persist download history across sessions on this device.
          </p>
        ) : null}
      </div>
    </div>
  );
}
