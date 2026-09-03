"use client";

import type { ChangeEvent } from "react";
import { CheckCircle2, FolderPlus, RefreshCw } from "lucide-react";

import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import AdvertiserCampaignSelect from "@/app/components/preview-tool/AdvertiserCampaignSelect";
import CampaignIdSelect from "@/app/components/preview-tool/CampaignIdSelect";
import { ToolInput } from "@/app/components/preview-tool/PreviewToolUi";

export type CreativeAdditionMode = "new_setup" | "addition";

type ProgrammaticCreativeAdditionPanelProps = {
  campaignName: string;
  campaignId: string;
  campaignOwnerId: string | null;
  campaignAccessToken?: string | null;
  platform?: string;
  advertiserId?: string;
  advertiserName?: string;
  loadedCampaign: CampaignSnapshot | null;
  selectedMode: CreativeAdditionMode | "";
  findError: string;
  onCampaignNameChange: (value: string) => void;
  onCampaignIdChange: (value: string) => void;
  onAdvertiserCampaignSelect?: (campaign: AdvertiserCampaign) => void;
  onFindCampaign: () => void;
  onSelectMode: (mode: CreativeAdditionMode) => void;
};

export default function ProgrammaticCreativeAdditionPanel({
  campaignName,
  campaignId,
  campaignOwnerId,
  campaignAccessToken,
  platform = "programmatic",
  advertiserId = "",
  advertiserName = "",
  loadedCampaign,
  selectedMode,
  findError,
  onCampaignNameChange,
  onCampaignIdChange,
  onAdvertiserCampaignSelect,
  onFindCampaign,
  onSelectMode,
}: ProgrammaticCreativeAdditionPanelProps) {
  const showAdvertiserCampaigns = Boolean(advertiserId?.trim() && onAdvertiserCampaignSelect);

  return (
    <div id="programmatic-campaign-lookup" className="space-y-6">
      <div>
        <h3 className="studio-heading text-2xl font-bold tracking-tight text-studio-text">Load Existing Campaign</h3>
        <p className="mt-1 text-studio-muted">
          Select a previously saved Adigator IQ campaign from your advertiser&apos;s history, or enter the saved campaign name and ID manually.
        </p>
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
              <RefreshCw size={16} /> Import from Connected Google Ads
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
              {loadedCampaign.importSource === "google_ads" ? (
                <p className="mt-2 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                  Imported from Google Ads
                </p>
              ) : null}
              <p className="mt-2 text-xs text-studio-tertiary">
                {loadedCampaign.creatives.length} creative{loadedCampaign.creatives.length === 1 ? "" : "s"} saved ·
                {" "}
                {loadedCampaign.analysisResult?.length || 0} analysis result
                {(loadedCampaign.analysisResult?.length || 0) === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div id="programmatic-creative-addition">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectMode("new_setup")}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedMode === "new_setup"
                    ? "border-studio-accent bg-studio-accent/15"
                    : "border-studio-border bg-black/20 hover:border-studio-accent/40"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-studio-accent">
                  <RefreshCw size={18} />
                  <span className="font-bold">New Setup</span>
                </div>
                <p className="text-sm leading-relaxed text-studio-muted">
                  Keep the campaign brief, vertical, and URL, but start a fresh validation session with new creatives only.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode("addition")}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedMode === "addition"
                    ? "border-studio-accent bg-studio-accent/15"
                    : "border-studio-border bg-black/20 hover:border-studio-accent/40"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-studio-accent">
                  <FolderPlus size={18} />
                  <span className="font-bold">Addition</span>
                </div>
                <p className="text-sm leading-relaxed text-studio-muted">
                  Load existing creatives and analysis, then upload additional creatives for a combined validation pass.
                </p>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
