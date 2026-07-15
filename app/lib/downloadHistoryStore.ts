import {
  buildDownloadEntryFingerprint,
  getCachedReportExport,
  saveDownloadEntryReport,
  setReportExportStorageScope,
  type ReportExportKind,
} from "@/app/lib/reportExportCache";
import { downloadBlob } from "@/app/lib/wysiwygCapture";
import { getWorkflowStepSlug } from "@/app/lib/workflowSteps";

export type DownloadReportType =
  | "Overview Report (PDF)"
  | "QA Report (PDF)"
  | "Creative Analysis Report (PDF)"
  | "Analysis Report (PDF)"
  | "Preview Studio (PDF)"
  | "Preview Studio (PPTX)"
  | "Preview Studio (PNG)";

export type AnalysisExportTab = "overview" | "qa" | "creative-analysis";

export type DownloadHistoryEntry = {
  id: string;
  ownerId: string;
  downloadedAt: string;
  reportType: DownloadReportType | string;
  campaignName: string;
  campaignId?: string;
  advertiserName: string;
  advertiserId?: string;
  /** Step to open in Preview Tool when stored PDF is unavailable. */
  targetStep?: 3 | 4;
  downloadedBy: string;
  status: "Completed" | "Failed";
  filename?: string;
  /** IndexedDB key for the exported PDF blob (content fingerprint). */
  exportFingerprint?: string;
  exportKind?: ReportExportKind;
  /** Analysis tab that was active when the report was downloaded. */
  analysisTab?: AnalysisExportTab;
  selectedCreativeId?: string;
  /** Preview Studio template / placement context at download time. */
  templateId?: string;
  device?: "desktop" | "mobile";
  previewCreativeId?: string;
  platform?: string;
};

const DOWNLOAD_HISTORY_KEY = "adigator_download_history_v1";
const MAX_ENTRIES = 200;

function readAll(): DownloadHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DOWNLOAD_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: DownloadHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  window.dispatchEvent(new CustomEvent("adigator-download-history-updated"));
}

export function listDownloadHistory(ownerId?: string): DownloadHistoryEntry[] {
  const entries = readAll();
  if (!ownerId) return entries;
  return entries.filter((entry) => entry.ownerId === ownerId);
}

export function recordDownloadHistory(
  entry: Omit<DownloadHistoryEntry, "id" | "downloadedAt"> & { downloadedAt?: string },
): DownloadHistoryEntry {
  const record: DownloadHistoryEntry = {
    ...entry,
    id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    downloadedAt: entry.downloadedAt || new Date().toISOString(),
  };
  writeAll([record, ...readAll()]);
  return record;
}

/** Record download history and persist the exported PDF in IndexedDB for one-click reopen. */
export async function recordAndStoreDownloadReport(
  entry: Omit<DownloadHistoryEntry, "id" | "downloadedAt"> & {
    downloadedAt?: string;
    blob?: Blob | null;
  },
): Promise<DownloadHistoryEntry> {
  const record = recordDownloadHistory(entry);
  const blob = entry.blob;

  if (blob && entry.ownerId && entry.status === "Completed") {
    setReportExportStorageScope(entry.ownerId);
    await saveDownloadEntryReport(record.id, blob, {
      filename: entry.filename || "report.pdf",
      kind: entry.exportKind || inferExportKind(entry.reportType),
      fingerprint: entry.exportFingerprint,
    });
  }

  return record;
}

function inferExportKind(reportType: string): ReportExportKind {
  return reportType.includes("Preview") ? "preview_studio" : "analysis";
}

function resolveTargetStep(entry: DownloadHistoryEntry): 3 | 4 | null {
  if (entry.targetStep) return entry.targetStep;
  if (entry.reportType.includes("Preview Studio")) return 4;
  if (
    entry.reportType.includes("Report")
    || entry.reportType.includes("Analysis")
    || entry.reportType.includes("Overview")
    || entry.reportType.includes("QA")
    || entry.reportType.includes("Creative Analysis")
  ) {
    return 3;
  }
  return null;
}

/** Deep-link href to reopen a report context in Campaign Intelligence Studio (fallback when PDF blob is missing). */
export function buildReportOpenHref(entry: DownloadHistoryEntry): string | null {
  if (entry.status !== "Completed") return null;

  const step = resolveTargetStep(entry);
  if (!step) return null;

  const params = new URLSearchParams();
  params.set("step", getWorkflowStepSlug(step));
  if (entry.campaignId) params.set("campaign_id", entry.campaignId);
  if (entry.campaignName) params.set("campaign_name", entry.campaignName);
  if (entry.advertiserId) params.set("advertiser_id", entry.advertiserId);
  if (entry.analysisTab) params.set("analysis_tab", entry.analysisTab);
  if (entry.selectedCreativeId) params.set("creative_id", entry.selectedCreativeId);
  if (entry.templateId) params.set("template_id", entry.templateId);
  if (entry.device) params.set("preview_device", entry.device);
  if (entry.previewCreativeId) params.set("preview_creative_id", entry.previewCreativeId);
  if (entry.platform) params.set("platform", entry.platform);

  return `/preview-tool?${params.toString()}`;
}

/** Open the stored PDF for a download history entry. Returns true if opened from storage. */
export async function openStoredDownloadReport(entry: DownloadHistoryEntry): Promise<boolean> {
  if (entry.status !== "Completed" || typeof window === "undefined") return false;
  if (!entry.ownerId) return false;

  setReportExportStorageScope(entry.ownerId);

  const keys = [
    buildDownloadEntryFingerprint(entry.id),
    entry.exportFingerprint || "",
  ].filter(Boolean);

  for (const fingerprint of keys) {
    const cached = await getCachedReportExport(fingerprint);
    if (!cached?.blob) continue;

    const filename = cached.filename || entry.filename || "report.pdf";
    const url = URL.createObjectURL(cached.blob);
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      downloadBlob(cached.blob, filename);
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    return true;
  }

  return false;
}

export function notifyAdvertisersUpdated() {
  if (typeof window === "undefined") return;
  scheduleAdvertisersUpdated();
}

let advertisersNotifyTimer: ReturnType<typeof setTimeout> | null = null;

/** Coalesce rapid localStorage writes into a single dashboard refresh. */
function scheduleAdvertisersUpdated() {
  if (advertisersNotifyTimer) {
    clearTimeout(advertisersNotifyTimer);
  }
  advertisersNotifyTimer = setTimeout(() => {
    advertisersNotifyTimer = null;
    window.dispatchEvent(new CustomEvent("adigator-advertisers-updated"));
  }, 250);
}
