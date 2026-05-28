"use client";

import ProgrammaticPreviewStudio from "./ProgrammaticPreviewStudio";
import GoogleAdsPreviewStudio from "./GoogleAds/GoogleAdsPreviewStudio";
import MetaAdsPreviewStudio from "./MetaAds/MetaAdsPreviewStudio";
import { PreviewEmptyState } from "./PreviewShared";

export default function PreviewStudio({
  platform,
  creatives = [],
  sourceCreatives = [],
  vertical,
  goal,
  brandName,
  targetAudience,
  tone,
  keyMessage,
  imageUrls = [],
  onCopyCreative,
  onEditCreative,
}) {
  switch (platform) {
    case "programmatic":
      return (
        <ProgrammaticPreviewStudio
          creatives={creatives}
          vertical={vertical}
          goal={goal}
        />
      );
    case "google_ads":
      return (
        <GoogleAdsPreviewStudio
          vertical={vertical}
          goal={goal}
          brandName={brandName}
          targetAudience={targetAudience}
          tone={tone}
          keyMessage={keyMessage}
          imageUrls={imageUrls}
          sourceCreatives={sourceCreatives}
          onCopyCreative={onCopyCreative}
          onEditCreative={onEditCreative}
        />
      );
    case "meta_ads":
      return (
        <MetaAdsPreviewStudio
          vertical={vertical}
          goal={goal}
          brandName={brandName}
          targetAudience={targetAudience}
          tone={tone}
          keyMessage={keyMessage}
          imageUrls={imageUrls}
          sourceCreatives={sourceCreatives}
          onCopyCreative={onCopyCreative}
          onEditCreative={onEditCreative}
        />
      );
    default:
      return (
        <PreviewEmptyState
          title="Select a platform in Step 1"
          description="Choose Programmatic Ads, Google Ads, or Meta Ads to open the matching preview studio."
        />
      );
  }
}
