"use client";

import type { ComponentProps, RefObject } from "react";
import AnalyzerOverview from "@/app/components/AnalyzerOverview";
import AnalyzerQaTab from "@/app/components/AnalyzerQaTab";
import AnalyzerCreativeSection from "@/app/components/AnalyzerCreativeSection";
import { labelGoal, labelVertical } from "@/app/components/AnalysisPanel";

type Props = {
  creativeIndex: number;
  creativeTotal: number;
  insight: Record<string, unknown>;
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
  sectionRefs?: {
    overview?: RefObject<HTMLElement | null>;
    qa?: RefObject<HTMLElement | null>;
    creative?: RefObject<HTMLElement | null>;
  };
};

export default function AnalysisCreativeExportBundle({
  creativeIndex,
  creativeTotal,
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
  sectionRefs,
}: Props) {
  const goalText = labelGoal(campaignGoal || "awareness");
  const verticalText = labelVertical(campaignVertical || "unknown");
  const creativeName = String(insight?.creativeName || "Creative");

  return (
    <div
      className="analysis-panel-dark preview-tool bg-[#07070f] text-[#f4f4f8]"
      style={{ width: 1280 }}
      data-export-creative={insight?.creativeId}
    >
      <div className="border-b border-white/10 bg-white/[0.03] px-8 py-6">
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">
          Creative {creativeIndex + 1} of {creativeTotal}
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#f4f4f8]">{creativeName}</h2>
        <p className="mt-1 text-sm text-[#c8c8d4]">
          Complete analysis export: Overview, Campaign Alignment, QA, Creative Analysis, Risk Summary, and Recommendations
        </p>
      </div>

      <div className="space-y-5 px-8 py-6">
        <div ref={sectionRefs?.overview as RefObject<HTMLDivElement>}>
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
          />
        </div>

        <div ref={sectionRefs?.qa as RefObject<HTMLDivElement>}>
          <AnalyzerQaTab overview={overview} platform={platform} />
        </div>

        <div ref={sectionRefs?.creative as RefObject<HTMLDivElement>}>
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
        </div>
      </div>
    </div>
  );
}
