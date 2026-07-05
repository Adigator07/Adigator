"use client";

import { useMemo } from "react";
import { CheckCircle2, Eye } from "lucide-react";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import { getAdvertiserCampaigns } from "@/app/lib/advertiserStore";

type AdvertiserCampaignSelectProps = {
  advertiserId: string;
  advertiserName: string;
  ownerId: string | null;
  selectedCampaignId: string;
  onCampaignSelect: (campaign: AdvertiserCampaign) => void;
};

export default function AdvertiserCampaignSelect({
  advertiserId,
  advertiserName,
  ownerId,
  selectedCampaignId,
  onCampaignSelect,
}: AdvertiserCampaignSelectProps) {
  const campaigns = useMemo(
    () => (advertiserId && ownerId ? getAdvertiserCampaigns(advertiserId, ownerId) : []),
    [advertiserId, ownerId],
  );

  if (!advertiserId || !ownerId) return null;

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-studio-border bg-black/10 p-4">
        <p className="text-sm font-semibold text-studio-text">No saved campaigns for {advertiserName}</p>
        <p className="mt-1 text-xs text-studio-muted">
          Complete a Campaign Setup for this advertiser first, or enter campaign details manually below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-studio-text">Campaigns for {advertiserName}</p>
        <p className="mt-1 text-xs text-studio-muted">
          Select a campaign from this advertiser&apos;s history. No need to type the name or ID manually.
        </p>
      </div>
      <div className="space-y-2">
        {campaigns.map((campaign) => {
          const selected = selectedCampaignId === campaign.id;
          return (
            <button
              key={campaign.id}
              type="button"
              onClick={() => onCampaignSelect(campaign)}
              className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-studio-accent bg-studio-accent/10"
                  : "border-studio-border bg-black/20 hover:border-studio-accent/40"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-studio-text">{campaign.name}</span>
                <span className="mt-0.5 block font-mono text-xs text-studio-muted">{campaign.id}</span>
                <span className="mt-2 block text-xs text-studio-tertiary">
                  {campaign.adGroups.length} ad group{campaign.adGroups.length === 1 ? "" : "s"}
                  {" · "}
                  {campaign.adGroups.reduce((count, group) => count + group.creatives.length, 0)} creative
                  {campaign.adGroups.reduce((count, group) => count + group.creatives.length, 0) === 1 ? "" : "s"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  campaign.validated
                    ? "border border-studio-success/30 bg-studio-success/10 text-studio-success"
                    : "border border-studio-border bg-black/20 text-studio-muted"
                }`}>
                  {campaign.validated ? "Validated" : "In progress"}
                </span>
                <Eye size={16} className={selected ? "text-studio-accent" : "text-studio-muted"} />
              </span>
            </button>
          );
        })}
      </div>
      {selectedCampaignId ? (
        <p className="flex items-center gap-2 text-xs text-studio-success">
          <CheckCircle2 size={14} />
          Campaign selected — loading details…
        </p>
      ) : null}
    </div>
  );
}
