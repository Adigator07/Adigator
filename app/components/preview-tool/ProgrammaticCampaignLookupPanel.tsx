"use client";

import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2, CloudDownload } from "lucide-react";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
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
  platform?: string;
  advertiserId?: string;
  advertiserName?: string;
  loadedCampaign: CampaignSnapshot | null;
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
  platform = "programmatic",
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
  const importedFromGoogleAds = loadedCampaign?.importSource === "google_ads";

  return (
    <div id="programmatic-campaign-lookup" className="space-y-6">
      <div>
        <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">{title}</h3>
        <p className="mt-1 text-studio-muted">{description}</p>
        <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-3 text-sm leading-6 text-studio-muted">
          This step loads saved Adigator IQ campaigns and can import campaigns from connected Google Ads, including published and draft campaigns.
        </div>
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
              platform={platform}
              onCampaignIdChange={onCampaignIdChange}
            />
          </div>

          <button
            type="button"
            onClick={onFindCampaign}
            className="studio-btn-primary studio-focus-ring rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            Load Saved Campaign
          </button>
          {platform === "google_ads" ? (
            <button
              type="button"
              onClick={onFindCampaign}
              className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-2 rounded-xl border border-studio-accent/30 px-5 py-2.5 text-sm font-bold text-studio-accent"
            >
              <CloudDownload size={16} /> Import from Connected Google Ads
            </button>
          ) : null}
        </>
      ) : null}

      {findError ? <p className="text-sm text-studio-error">{findError}</p> : null}

      {loadedCampaign ? (
        <div className="space-y-5 rounded-2xl border border-studio-success/30 bg-studio-success/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-studio-success" size={20} />
            <div>
              <p className="text-sm font-semibold text-studio-text">Saved campaign found</p>
              <p className="mt-1 text-sm text-studio-muted">
                {loadedCampaign.campaignName} · {loadedCampaign.id}
              </p>
              {importedFromGoogleAds ? (
                <div className="mt-3 space-y-2">
                  <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    Imported from Google Ads {loadedCampaign.googleAdsCampaignSource === "draft" ? "(Draft)" : "(Published)"}
                  </span>
                  <div className="grid gap-2 text-xs text-studio-tertiary sm:grid-cols-2">
                    <p>Customer ID: <span className="font-mono text-studio-text">{loadedCampaign.googleAdsCustomerId || "—"}</span></p>
                    <p>Status: <span className="text-studio-text">{loadedCampaign.googleAdsCampaignStatus || "—"}</span></p>
                    <p>Channel Summary: <span className="text-studio-text">{loadedCampaign.googleAdsChannelSummary || loadedCampaign.googleAdsChannelType || "—"}</span></p>
                    <p>Dates: <span className="text-studio-text">{loadedCampaign.googleAdsStartDate || "—"}{loadedCampaign.googleAdsEndDate ? ` -> ${loadedCampaign.googleAdsEndDate}` : ""}</span></p>
                  </div>
                </div>
              ) : null}
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
