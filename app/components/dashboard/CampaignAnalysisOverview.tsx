"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import AnalyzerOverview from "@/app/components/AnalyzerOverview";
import { EmptyState } from "@/app/components/ui/EmptyState";
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
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-6">
        <EmptyState
          title="No campaign analysis yet"
          description={`Run Campaign Intelligence for ${advertiserName} · ${campaign.name} to generate the full Overview.`}
          className="border-white/10 bg-[#0b0b12]/80 text-left"
        />
        <Link
          href="/preview-tool?step=campaign-intelligence"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20"
        >
          Open Campaign Intelligence Studio
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
