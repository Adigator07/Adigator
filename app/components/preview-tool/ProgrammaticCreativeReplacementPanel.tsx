"use client";

import ProgrammaticCampaignLookupPanel from "@/app/components/preview-tool/ProgrammaticCampaignLookupPanel";
import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";

type ProgrammaticCreativeReplacementPanelProps = {
  campaignName: string;
  campaignId: string;
  campaignOwnerId: string | null;
  campaignAccessToken?: string | null;
  platform?: string;
  advertiserId?: string;
  advertiserName?: string;
  loadedCampaign: CampaignSnapshot | null;
  findError: string;
  onCampaignNameChange: (value: string) => void;
  onCampaignIdChange: (value: string) => void;
  onAdvertiserCampaignSelect?: (campaign: AdvertiserCampaign) => void;
  onFindCampaign: () => void;
};

export default function ProgrammaticCreativeReplacementPanel({
  campaignName,
  campaignId,
  campaignOwnerId,
  campaignAccessToken,
  platform = "programmatic",
  advertiserId,
  advertiserName,
  loadedCampaign,
  findError,
  onCampaignNameChange,
  onCampaignIdChange,
  onAdvertiserCampaignSelect,
  onFindCampaign,
}: ProgrammaticCreativeReplacementPanelProps) {
  return (
    <ProgrammaticCampaignLookupPanel
      title="Load Campaign for Replacement"
      description="Select a previously saved Adigator IQ campaign from your advertiser's history, or enter the saved campaign name and ID manually."
      campaignName={campaignName}
      campaignId={campaignId}
      campaignOwnerId={campaignOwnerId}
      campaignAccessToken={campaignAccessToken}
      platform={platform}
      advertiserId={advertiserId}
      advertiserName={advertiserName}
      loadedCampaign={loadedCampaign}
      findError={findError}
      successMessage="Campaign brief, vertical, URL, and previous analysis are pre-filled. Upload replacement creatives in the next step."
      onCampaignNameChange={onCampaignNameChange}
      onCampaignIdChange={onCampaignIdChange}
      onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}
      onFindCampaign={onFindCampaign}
    />
  );
}
