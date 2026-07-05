"use client";

import ProgrammaticCampaignLookupPanel from "@/app/components/preview-tool/ProgrammaticCampaignLookupPanel";
import type { AdvertiserCampaign } from "@/app/lib/advertiserStore";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";

type ProgrammaticUrlValidationUtmPanelProps = {
  campaignName: string;
  campaignId: string;
  campaignOwnerId: string | null;
  campaignAccessToken?: string | null;
  advertiserId?: string;
  advertiserName?: string;
  loadedCampaign: ProgrammaticCampaignSnapshot | null;
  findError: string;
  onCampaignNameChange: (value: string) => void;
  onCampaignIdChange: (value: string) => void;
  onAdvertiserCampaignSelect?: (campaign: AdvertiserCampaign) => void;
  onFindCampaign: () => void;
};

export default function ProgrammaticUrlValidationUtmPanel({
  campaignName,
  campaignId,
  campaignOwnerId,
  campaignAccessToken,
  advertiserId,
  advertiserName,
  loadedCampaign,
  findError,
  onCampaignNameChange,
  onCampaignIdChange,
  onAdvertiserCampaignSelect,
  onFindCampaign,
}: ProgrammaticUrlValidationUtmPanelProps) {
  return (
    <ProgrammaticCampaignLookupPanel
      title="Load Campaign for URL / UTM Update"
      description="Select a campaign from your advertiser's history, or enter the campaign name and ID to load previous URLs, UTM parameters, and validation history."
      campaignName={campaignName}
      campaignId={campaignId}
      campaignOwnerId={campaignOwnerId}
      campaignAccessToken={campaignAccessToken}
      advertiserId={advertiserId}
      advertiserName={advertiserName}
      loadedCampaign={loadedCampaign}
      findError={findError}
      successMessage="Campaign context is loaded. Update destination URLs and UTM parameters in the next step."
      onCampaignNameChange={onCampaignNameChange}
      onCampaignIdChange={onCampaignIdChange}
      onAdvertiserCampaignSelect={onAdvertiserCampaignSelect}
      onFindCampaign={onFindCampaign}
    />
  );
}
