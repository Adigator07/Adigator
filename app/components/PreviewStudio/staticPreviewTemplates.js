import { getPreviewPlacement } from "@/app/lib/previewPlacementRegistry";
import { getVideoPreviewPlacement } from "@/app/lib/videoPreviewPlacements";

const ENVIRONMENT_TO_TYPE = {
  google_search: "search_ad",
  youtube: "youtube_instream",
  news_site: "news_display",
  mobile_app: "interstitial_ad",
  google_shopping: "shopping_ad",
  google_discover: "discover_ad",
  gmail: "gmail_ad",
  google_maps: "maps_ad",
  google_video_partners: "youtube_instream",
  facebook_feed: "facebook_feed_ad",
  instagram_feed: "instagram_feed_ad",
  instagram_story: "story_ad",
  facebook_story: "facebook_story_ad",
  instagram_reels: "reels_ad",
  instagram_explore: "explore_ad",
  facebook_marketplace: "marketplace_ad",
  messenger: "messenger_ad",
  audience_network: "audience_network_ad",
  meta_in_stream: "reels_ad",
  prog_publisher_video: "display_ad",
  prog_mobile_app_video: "interstitial_ad",
  prog_in_stream: "youtube_instream",
  prog_out_stream: "display_ad",
  prog_ctv: "youtube_instream",
  prog_ott: "youtube_instream",
  prog_dooh: "display_ad",
};

export function buildStaticPlacementTemplates({
  platform,
  placementId,
  sourceCreative,
  brandName,
  vertical,
  goal,
  keyMessage,
  isVideoMode = false,
}) {
  const config = isVideoMode
    ? getVideoPreviewPlacement(platform, placementId)
    : getPreviewPlacement(platform, placementId);
  const environments = config?.environments || [];
  const posterUrl = sourceCreative?.url || sourceCreative?.posterUrl || "";
  const videoUrl =
    sourceCreative?.mediaType === "video"
      ? (sourceCreative?.fullUrl || sourceCreative?.videoUrl || "")
      : (sourceCreative?.videoUrl || "");
  const imageUrl = posterUrl || videoUrl || sourceCreative?.fullUrl || "";

  return environments.map((environment, index) => ({
    id: `${placementId}-${environment}-${index}`,
    environment,
    type: ENVIRONMENT_TO_TYPE[environment] || "display_ad",
    headline: sourceCreative?.name || brandName || "Your Brand",
    description: isVideoMode
      ? "Sponsored"
      : (keyMessage && !/cta appears|misaligned|risk|compress|review before|timestamp/i.test(keyMessage)
        ? keyMessage
        : `Campaign message for ${vertical || "your"} audience.`),
    primaryText: isVideoMode ? "" : undefined,
    brandName: brandName || sourceCreative?.name || "Brand",
    pageName: brandName || sourceCreative?.name || "Brand",
    displayUrl: "example.com",
    cta: goal === "conversion" ? "Shop Now" : "Learn More",
    imageUrl,
    posterUrl: posterUrl || imageUrl,
    videoUrl: videoUrl || undefined,
    fullUrl: videoUrl || sourceCreative?.fullUrl || undefined,
    mediaType: sourceCreative?.mediaType || (videoUrl ? "video" : "image"),
    mimeType: sourceCreative?.mimeType,
    size: sourceCreative?.size,
    vertical: vertical || "general",
    goal: goal || "awareness",
  }));
}
