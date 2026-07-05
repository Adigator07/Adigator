"use client";

import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import AdvertiserCampaignSelect from "@/app/components/preview-tool/AdvertiserCampaignSelect";
import CampaignIdSelect from "@/app/components/preview-tool/CampaignIdSelect";
import { ToolInput } from "@/app/components/preview-tool/PreviewToolUi";

type ProgrammaticCampaignLookupPanelProps = {
  title: string;
  description: string;
  campaignName: string;
  campaignId: string;
  campaignOwnerId: string | null;
  campaignAccessToken?: string | null;
  advertiserId?: string;
  advertiserName?: string;
  loadedCampaign: ProgrammaticCampaignSnapshot | null;
  findError: string;
  successMessage?: string;
  onCampaignNameChange: (value: string) => void;
  onCampaignIdChange: (value: string) => void;
  onAdvertiserCampaignSelect?: (campaign: AdvertiserCampaign) => void;
  onFindCampaign: () => void;
  children?: ReactNode;
};

export default function ProgrammaticCampaignLookupPanel({
  title,
  description,
  campaignName,
  campaignId,
  campaignOwnerId,
  campaignAccessToken,
  advertiserId = "",
  advertiserName = "",
  loadedCampaign,
  findError,
  successMessage,
  onCampaignNameChange,
  onCampaignIdChange,
  onAdvertiserCampaignSelect,
  onFindCampaign,
  children,
}: ProgrammaticCampaignLookupPanelProps) {
  const showAdvertiserCampaigns = Boolean(advertiserId?.trim() && onAdvertiserCampaignSelect);

  return (
    <div id="programmatic-campaign-lookup" className="space-y-6">
      <div>
        <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">{title}</h3>
        <p className="mt-1 text-studio-muted">{description}</p>
      </div>

      {showAdvertiserCampaigns && onAdvertiserCampaignSelect ? (
        <AdvertiserCampaignSelect
          advertiserId={advertiserId}
          advertiserName={advertiserName}
          ownerId={campaignOwnerId}
          selectedCampaignId={campaignId}
          onCampaignSelect={onAdvertiserCampaignSelect}
        />
      ) : null}

      {!showAdvertiserCampaigns || !loadedCampaign ? (
        <>
          <div className="grid max-w-2xl gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-studio-tertiary">
                Campaign Name
              </label>
              <ToolInput
                type="text"
                value={campaignName}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onCampaignNameChange(event.target.value)}
                placeholder="e.g. Q2 Running Shoes Awareness"
              />
            </div>
            <CampaignIdSelect
              campaignName={campaignName}
              campaignId={campaignId}
              ownerId={campaignOwnerId}
              accessToken={campaignAccessToken}
              onCampaignIdChange={onCampaignIdChange}
            />
          </div>

          <button
            type="button"
            onClick={onFindCampaign}
            className="studio-btn-primary studio-focus-ring rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            Find Campaign
          </button>
        </>
      ) : null}

      {findError ? <p className="text-sm text-studio-error">{findError}</p> : null}

      {loadedCampaign ? (
        <div className="space-y-5 rounded-2xl border border-studio-success/30 bg-studio-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-studio-success" size={20} />
            <div>
              <p className="text-sm font-semibold text-studio-text">Campaign found</p>
              <p className="mt-1 text-sm text-studio-muted">
                {loadedCampaign.campaignName} · {loadedCampaign.id}
              </p>
              <p className="mt-2 text-xs text-studio-tertiary">
                {loadedCampaign.creatives.length} creative{loadedCampaign.creatives.length === 1 ? "" : "s"} saved ·
                {" "}
                {loadedCampaign.analysisResult?.length || 0} analysis result
                {(loadedCampaign.analysisResult?.length || 0) === 1 ? "" : "s"}
              </p>
              {successMessage ? <p className="mt-2 text-sm text-studio-muted">{successMessage}</p> : null}
            </div>
          </div>
          {children}
        </div>
      ) : null}
    </div>
  );
}
