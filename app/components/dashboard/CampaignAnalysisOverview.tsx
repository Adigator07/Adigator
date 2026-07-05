"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import AnalyzerOverview from "@/app/components/AnalyzerOverview";
import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import { readDashboardOverviewCache } from "@/app/lib/dashboardCampaignCache";
import {
  computeDashboardCampaignOverview,
  findDashboardCampaignSnapshot,
  labelDashboardGoal,
  labelDashboardVertical,
} from "@/app/lib/dashboardCampaignContext";

type CampaignAnalysisOverviewProps = {
  campaign: AdvertiserCampaign;
  ownerId: string;
  advertiserName: string;
  viewerName?: string;
};

export default function CampaignAnalysisOverview({
  campaign,
  ownerId,
  advertiserName,
  viewerName = "Strategist",
}: CampaignAnalysisOverviewProps) {
  const snapshot = useMemo(
    () => findDashboardCampaignSnapshot(campaign.id, ownerId),
    [campaign.id, ownerId],
  );

  const cachedOverview = useMemo(() => {
    const fromCache = readDashboardOverviewCache(snapshot);
    if (fromCache) return fromCache;

    if (!snapshot?.analysisResult?.length) return null;

    const overview = computeDashboardCampaignOverview(snapshot, campaign, { readOnly: true });
    if (!overview) return null;

    return {
      overview: overview as Record<string, unknown>,
      goalText: labelDashboardGoal(snapshot.campaignGoal || campaign.campaignGoal),
      verticalText: labelDashboardVertical(snapshot.vertical || campaign.vertical),
      platform: campaign.platform || "programmatic",
      campaignBrief: snapshot.campaignBrief || campaign.campaignBrief || "",
      generatedAt: snapshot.updatedAt || new Date().toISOString(),
      sourceFingerprint: "",
    };
  }, [snapshot, campaign]);

  if (!cachedOverview) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
        <FileText size={28} className="mx-auto text-white/25" />
        <p className="mt-3 text-sm font-semibold text-white">No campaign analysis yet</p>
        <p className="mt-1 text-xs text-white/45">
          Run analysis in the Preview Tool for {advertiserName} · {campaign.name} to generate the full Overview.
        </p>
        <Link
          href="/preview-tool?step=3"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20"
        >
          Open Preview Tool
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="analysis-panel-dark overflow-hidden rounded-2xl border border-white/10 bg-[#08080f] p-4 md:p-6">
      <AnalyzerOverview
        overview={cachedOverview.overview}
        greetingName={viewerName}
        goalText={cachedOverview.goalText}
        verticalText={cachedOverview.verticalText}
        platform={cachedOverview.platform}
        urlValidation={(snapshot?.urlValidation ?? null) as null}
        campaignBrief={cachedOverview.campaignBrief}
      />
    </div>
  );
}
