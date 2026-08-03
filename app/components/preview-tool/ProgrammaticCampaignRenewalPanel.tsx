"use client";

import ProgrammaticCampaignLookupPanel from "@/app/components/preview-tool/ProgrammaticCampaignLookupPanel";
import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";

type ProgrammaticCampaignRenewalPanelProps = {
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

export default function ProgrammaticCampaignRenewalPanel({
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
}: ProgrammaticCampaignRenewalPanelProps) {
  return (
    <ProgrammaticCampaignLookupPanel
      title="Load Campaign for Renewal"
      description="Select a previously saved Adigator campaign from your advertiser's history, or enter the saved campaign name and ID to use as a starting point for renewal."
      campaignName={campaignName}
      campaignId={campaignId}
      campaignOwnerId={campaignOwnerId}
      campaignAccessToken={campaignAccessToken}
      platform={platform}
      advertiserId={advertiserId}
      advertiserName={advertiserName}
      loadedCampaign={loadedCampaign}
      findError={findError}
      successMessage="Previous campaign settings and creatives are loaded. Update configuration and creatives for the renewed campaign."
      onCampaignNameChange={onCampaignNameChange}
      onCampaignIdChange={onCampaignIdChange}
      onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}
      onFindCampaign={onFindCampaign}
    />
  );
}
