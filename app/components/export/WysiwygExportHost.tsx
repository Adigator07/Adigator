"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { flushSync } from "react-dom";
import AnalysisTabExportBundle, {
  type AnalysisExportScope,
} from "@/app/components/export/AnalysisTabExportBundle";
import PreviewStudioExportFrame from "@/app/components/export/PreviewStudioExportFrame";
import { computeCampaignOverview } from "@/app/lib/analyzerInsights";
import { labelGoal, labelVertical } from "@/app/components/AnalysisPanel";
import { compareStrategicEntries } from "@/app/lib/strategicPresentation";
import { PROGRAMMATIC_ENVIRONMENT_LABELS } from "@/app/lib/previewPlacementRegistry";
import { validatePreviewDeviceCompatibility } from "@/app/lib/previewDeviceCompatibility";
import {
  buildAnalysisReportFingerprint,
  buildPreviewStudioReportFingerprint,
  getCachedReportExport,
  saveCachedReportExport,
} from "@/app/lib/reportExportCache";
import {
  captureElement,
  canvasesToPdf,
  waitForExportReady,
  waitForPaint,
  yieldToMain,
} from "@/app/lib/wysiwygCapture";

const PROGRAMMATIC_PREVIEW_PLACEMENT = "open_web";

export type WysiwygExportHostHandle = {
  generateAnalysisReport: (
    input: AnalysisReportInput,
    options?: { useCache?: boolean },
  ) => Promise<{ blob: Blob; filename: string; fingerprint: string; fromCache: boolean }>;
  generatePreviewStudioReport: (
    input: PreviewStudioReportInput,
    options?: { useCache?: boolean },
  ) => Promise<{ blob: Blob; filename: string; fingerprint: string; fromCache: boolean }>;
  captureLivePreviewElement: (
    element: HTMLElement,
    meta?: { title?: string; filename?: string },
  ) => Promise<{ blob: Blob; filename: string }>;
};

export type AnalysisReportInput = {
  analysisResult: unknown[];
  creatives: Array<{ id: string; url?: string; fullUrl?: string }>;
  platform: string;
  campaignGoal: string;
  campaignVertical: string;
  campaignId?: string;
  creativeFingerprint?: string;
  viewerName?: string;
  urlValidation?: unknown;
  campaignBrief?: string;
  campaignProductFocus?: string;
  campaignIntent?: string;
  programmaticTaskType?: string;
  replacementComparisonReport?: unknown;
  renewalComparisonReport?: unknown;
  exportScope?: AnalysisExportScope;
  selectedCreativeId?: string | null;
};

export type PreviewStudioReportInput = {
  previewEngineCreatives: Array<Record<string, unknown>>;
  previewStudioCache?: { entries?: Record<string, unknown>; updatedAt?: string } | null;
  vertical: string;
  goal: string;
  campaignId?: string;
  creativeFingerprint?: string;
  campaignBrief?: string;
  campaignIntent?: string;
  campaignIntentFingerprint?: string;
  advertiserName?: string;
  brandName?: string;
  campaignName?: string;
  campaignProductFocus?: string;
  advertiserId?: string;
  templateId?: string;
  device?: "desktop" | "mobile";
  creativeId?: string | null;
};

type RenderJob =
  | { kind: "analysis"; props: Record<string, unknown> }
  | { kind: "preview"; props: Record<string, unknown> }
  | null;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function safeFilePart(value: string) {
  return String(value || "report")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "report";
}

function analysisFilename(scope: AnalysisExportScope, creativeName?: string) {
  if (scope === "overview") return "Campaign_Overview_Report.pdf";
  if (scope === "qa") return "Campaign_QA_Report.pdf";
  return `Creative_Analysis_${safeFilePart(creativeName || "Creative")}.pdf`;
}

function previewFilename(templateId: string) {
  const label = PROGRAMMATIC_ENVIRONMENT_LABELS[templateId as keyof typeof PROGRAMMATIC_ENVIRONMENT_LABELS]
    || templateId;
  return `Preview_${safeFilePart(label.replace(/\s+/g, "_"))}.pdf`;
}

const WysiwygExportHost = forwardRef<WysiwygExportHostHandle>(function WysiwygExportHost(_props, ref) {
  const [job, setJob] = useState<RenderJob>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sectionCaptureRef = useRef<HTMLDivElement>(null);
  const previewCaptureRef = useRef<HTMLDivElement>(null);

  const mountJob = useCallback(async (nextJob: RenderJob) => {
    flushSync(() => setJob(nextJob));
    await waitForPaint(8);
    await sleep(400);
  }, []);

  const clearJob = useCallback(async () => {
    flushSync(() => setJob(null));
    await waitForPaint(2);
  }, []);

  const resolvePreviewCaptureTarget = useCallback((root: HTMLElement): HTMLElement => root, []);

  const capturePreviewFrame = useCallback(async () => {
    const root = previewCaptureRef.current;
    if (!root) throw new Error("Preview export frame missing.");
    await waitForExportReady(root, 60000);
    await waitForPaint(8);
    await sleep(200);
    const target = resolvePreviewCaptureTarget(root);
    return captureElement(target);
  }, [resolvePreviewCaptureTarget]);

  const buildAnalysisPdf = useCallback(async (input: AnalysisReportInput) => {
    const exportScope: AnalysisExportScope = input.exportScope || "overview";
    const sorted = [...(input.analysisResult || [])].sort(compareStrategicEntries);
    const overview = computeCampaignOverview(
      sorted,
      input.platform,
      input.campaignGoal,
      input.campaignVertical,
      labelVertical,
      labelGoal,
      {
        campaignBrief: input.campaignBrief,
        campaignProductFocus: input.campaignProductFocus,
        campaignIntent: input.campaignIntent,
        urlValidation: input.urlValidation,
      },
    );
    const insights = overview?.insights || [];
    const creativePreviewById = new Map(
      (input.creatives || []).map((creative) => [
        creative.id,
        creative.url || creative.fullUrl || null,
      ]),
    );

    const insight = exportScope === "creative-analysis"
      ? insights.find((item: { creativeId?: string }) => item.creativeId === input.selectedCreativeId) || insights[0] || null
      : null;

    if (exportScope === "creative-analysis" && !insight) {
      throw new Error("No creative selected for analysis export.");
    }

    await mountJob({
      kind: "analysis",
      props: {
        exportScope,
        insight,
        overview,
        platform: input.platform,
        campaignGoal: input.campaignGoal,
        campaignVertical: input.campaignVertical,
        greetingName: input.viewerName || "Strategist",
        urlValidation: input.urlValidation,
        campaignBrief: input.campaignBrief,
        campaignProductFocus: input.campaignProductFocus,
        campaignIntent: input.campaignIntent,
        programmaticTaskType: input.programmaticTaskType,
        replacementComparisonReport: input.replacementComparisonReport,
        renewalComparisonReport: input.renewalComparisonReport,
        creativePreviewById,
        sectionRef: sectionCaptureRef,
      },
    });

    const sectionEl = sectionCaptureRef.current;
    if (!sectionEl) {
      await clearJob();
      throw new Error("Export section failed to render.");
    }

    await waitForPaint(6);
    await sleep(150);

    const canvas = await captureElement(sectionEl);
    await clearJob();
    await yieldToMain();

    const blob = await canvasesToPdf([canvas], {
      title: analysisFilename(exportScope, insight?.creativeName),
      subject: `Adigator ${exportScope} export`,
    });

    return {
      blob,
      filename: analysisFilename(exportScope, insight?.creativeName),
    };
  }, [clearJob, mountJob]);

  const buildPreviewStudioPdf = useCallback(async (input: PreviewStudioReportInput) => {
    const templateId = input.templateId;
    const device = input.device || "desktop";
    const creativeId = input.creativeId ? String(input.creativeId) : null;

    if (!templateId) {
      throw new Error("No preview template selected for export.");
    }

    const creatives = input.previewEngineCreatives || [];
    const creative = creativeId
      ? creatives.find((item) => String(item.id) === creativeId) || creatives[0]
      : creatives[0];

    if (!creative) {
      throw new Error("No creative available for preview export.");
    }

    const deviceSupported = validatePreviewDeviceCompatibility({
      platform: "programmatic",
      placementId: PROGRAMMATIC_PREVIEW_PLACEMENT,
      device,
      size: String(creative.size || ""),
    }).supported;

    const exportDevice = deviceSupported ? device : "desktop";

    await mountJob({
      kind: "preview",
      props: {
        creative,
        templateId,
        device: exportDevice,
        vertical: input.vertical,
        goal: input.goal,
        campaignBrief: input.campaignBrief,
        campaignIntent: input.campaignIntent,
        campaignIntentFingerprint: input.campaignIntentFingerprint,
        advertiserName: input.advertiserName,
        brandName: input.brandName,
        campaignName: input.campaignName,
        campaignProductFocus: input.campaignProductFocus,
        advertiserId: input.advertiserId,
        campaignId: input.campaignId,
        creativeFingerprint: input.creativeFingerprint,
        previewStudioCache: input.previewStudioCache,
        captureRef: previewCaptureRef,
      },
    });

    const canvas = await capturePreviewFrame();
    await clearJob();
    await yieldToMain();

    const filename = previewFilename(templateId);
    const blob = await canvasesToPdf([canvas], {
      title: filename.replace(/\.pdf$/i, ""),
      subject: "Adigator Preview Studio export",
    });

    return { blob, filename };
  }, [clearJob, mountJob, capturePreviewFrame]);

  useImperativeHandle(ref, () => ({
    async generateAnalysisReport(input, options = {}) {
      const exportScope: AnalysisExportScope = input.exportScope || "overview";
      const fingerprint = buildAnalysisReportFingerprint({
        campaignId: input.campaignId,
        platform: input.platform,
        campaignGoal: input.campaignGoal,
        campaignVertical: input.campaignVertical,
        creativeFingerprint: input.creativeFingerprint,
        analysisVersion: String((input.analysisResult || []).length),
        exportScope,
        selectedCreativeId: input.selectedCreativeId || "",
      });
      const filename = analysisFilename(
        exportScope,
        exportScope === "creative-analysis"
          ? String(
            computeCampaignOverview(
              [...(input.analysisResult || [])].sort(compareStrategicEntries),
              input.platform,
              input.campaignGoal,
              input.campaignVertical,
              labelVertical,
              labelGoal,
              { urlValidation: input.urlValidation },
            )?.insights?.find((insightItem: { creativeId?: string }) => insightItem.creativeId === input.selectedCreativeId)?.creativeName || "",
          )
          : undefined,
      );

      if (options.useCache === true) {
        const cached = await getCachedReportExport(fingerprint);
        if (cached?.blob) {
          return { blob: cached.blob, filename: cached.filename || filename, fingerprint, fromCache: true };
        }
      }

      const { blob, filename: resolvedFilename } = await buildAnalysisPdf(input);
      await saveCachedReportExport({
        fingerprint,
        kind: "analysis",
        filename: resolvedFilename,
        generatedAt: new Date().toISOString(),
        blob,
      });
      return { blob, filename: resolvedFilename, fingerprint, fromCache: false };
    },

    async generatePreviewStudioReport(input, options = {}) {
      const fingerprint = buildPreviewStudioReportFingerprint({
        campaignId: input.campaignId,
        previewStudioUpdatedAt: input.previewStudioCache?.updatedAt,
        creativeFingerprint: input.creativeFingerprint,
        templateId: input.templateId,
        device: input.device,
        creativeId: input.creativeId || "",
      });
      const filename = previewFilename(input.templateId || "preview");

      if (options.useCache === true) {
        const cached = await getCachedReportExport(fingerprint);
        if (cached?.blob) {
          return { blob: cached.blob, filename: cached.filename || filename, fingerprint, fromCache: true };
        }
      }

      const { blob, filename: resolvedFilename } = await buildPreviewStudioPdf(input);
      await saveCachedReportExport({
        fingerprint,
        kind: "preview_studio",
        filename: resolvedFilename,
        generatedAt: new Date().toISOString(),
        blob,
      });
      return { blob, filename: resolvedFilename, fingerprint, fromCache: false };
    },

    async captureLivePreviewElement(element, meta = {}) {
      await waitForPaint(8);
      await sleep(200);
      const canvas = await captureElement(element);
      const filename = meta.filename || "Preview_Placement_Report.pdf";
      const blob = await canvasesToPdf([canvas], {
        title: meta.title || "Preview Placement Report",
        subject: "Adigator Preview Studio export",
      });
      return { blob, filename };
    },
  }), [buildAnalysisPdf, buildPreviewStudioPdf]);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] opacity-100"
      aria-hidden
    >
      {job?.kind === "analysis" ? (
        <AnalysisTabExportBundle {...(job.props as ComponentProps<typeof AnalysisTabExportBundle>)} />
      ) : null}
      {job?.kind === "preview" ? (
        <PreviewStudioExportFrame {...(job.props as ComponentProps<typeof PreviewStudioExportFrame>)} />
      ) : null}
    </div>
  );
});

export default WysiwygExportHost;
