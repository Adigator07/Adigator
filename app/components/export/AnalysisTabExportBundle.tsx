"use client";

import type { RefObject } from "react";
import AnalyzerOverview from "@/app/components/AnalyzerOverview";
import AnalyzerQaTab from "@/app/components/AnalyzerQaTab";
import AnalyzerCreativeSection from "@/app/components/AnalyzerCreativeSection";
import { labelGoal, labelVertical } from "@/app/components/AnalysisPanel";

export type AnalysisExportScope = "overview" | "qa" | "creative-analysis";

const SCOPE_LABELS: Record<AnalysisExportScope, { title: string; subtitle: string }> = {
  overview: {
    title: "Campaign Overview Report",
    subtitle: "Overview briefing, campaign alignment, health summary, risk summary, and URL validation",
  },
  qa: {
    title: "Technical & Placement QA Report",
    subtitle: "Technical QA, placement compatibility, and inventory fit for this campaign",
  },
  "creative-analysis": {
    title: "Creative Analysis Report",
    subtitle: "Goal alignment, vertical fit, QA detail, and recommendations for the selected creative",
  },
};

type Props = {
  exportScope: AnalysisExportScope;
  insight?: Record<string, unknown> | null;
  overview: Record<string, unknown> | null;
  platform: string;
  campaignGoal: string;
  campaignVertical: string;
  greetingName: string;
  urlValidation?: unknown;
  campaignBrief?: string;
  campaignProductFocus?: string;
  campaignIntent?: string;
  programmaticTaskType?: string;
  replacementComparisonReport?: unknown;
  renewalComparisonReport?: unknown;
  creativePreviewById: Map<string, string | null>;
  sectionRef: RefObject<HTMLElement | null>;
};

export default function AnalysisTabExportBundle({
  exportScope,
  insight,
  overview,
  platform,
  campaignGoal,
  campaignVertical,
  greetingName,
  urlValidation = null,
  campaignBrief = "",
  campaignProductFocus = "",
  campaignIntent = "",
  programmaticTaskType = "",
  replacementComparisonReport = null,
  renewalComparisonReport = null,
  creativePreviewById,
  sectionRef,
}: Props) {
  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const labels = SCOPE_LABELS[exportScope];
  const creativeName = insight?.creativeName ? String(insight.creativeName) : null;

  return (
    <div
      ref={sectionRef as RefObject<HTMLDivElement>}
      className="analysis-panel-dark preview-tool bg-[#07070f] text-[#f4f4f8]"
      style={{ width: 1280 }}
      data-export-scope={exportScope}
    >
      <div className="border-b border-white/10 bg-white/[0.03] px-8 py-6">
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">
          Step 3 · Analysis Export
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#f4f4f8]">
          {exportScope === "creative-analysis" && creativeName
            ? `${labels.title} — ${creativeName}`
            : labels.title}
        </h2>
        <p className="mt-1 text-sm text-[#c8c8d4]">{labels.subtitle}</p>
      </div>

      <div className="space-y-5 px-8 py-6">
        {exportScope === "overview" ? (
          <AnalyzerOverview
            overview={overview}
            greetingName={greetingName}
            goalText={goalText}
            verticalText={verticalText}
            platform={platform}
            urlValidation={urlValidation as never}
            campaignBrief={campaignBrief}
            programmaticTaskType={programmaticTaskType}
            replacementComparisonReport={replacementComparisonReport as never}
            renewalComparisonReport={renewalComparisonReport as never}
            exportMode
          />
        ) : null}

        {exportScope === "qa" ? (
          <AnalyzerQaTab overview={overview} platform={platform} />
        ) : null}

        {exportScope === "creative-analysis" && insight ? (
          <AnalyzerCreativeSection
            insights={[insight]}
            selectedInsight={insight}
            onSelectCreative={() => {}}
            creativePreviewById={creativePreviewById}
            labelGoal={labelGoal}
            labelVertical={labelVertical}
            campaignGoal={campaignGoal}
            campaignVertical={campaignVertical}
            campaignBrief={campaignBrief}
            campaignProductFocus={campaignProductFocus}
            platform={platform}
            exportMode
          />
        ) : null}
      </div>
    </div>
  );
}
