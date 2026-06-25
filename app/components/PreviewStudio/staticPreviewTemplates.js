import { getPreviewPlacement } from "@/app/lib/previewPlacementRegistry";

const ENVIRONMENT_TO_TYPE = {
  google_search: "search_ad",
  youtube: "youtube_instream",
  news_site: "news_display",
  mobile_app: "interstitial_ad",
  google_shopping: "shopping_ad",
  google_discover: "discover_ad",
  gmail: "gmail_ad",
  google_maps: "maps_ad",
  facebook_feed: "facebook_feed_ad",
  instagram_feed: "instagram_feed_ad",
  instagram_story: "story_ad",
  facebook_story: "facebook_story_ad",
  instagram_reels: "reels_ad",
  instagram_explore: "explore_ad",
  facebook_marketplace: "marketplace_ad",
  messenger: "messenger_ad",
  audience_network: "audience_network_ad",
};

export function buildStaticPlacementTemplates({
  platform,
  placementId,
  sourceCreative,
  brandName,
  vertical,
  goal,
  keyMessage,
}) {
  const config = getPreviewPlacement(platform, placementId);
  const environments = config?.environments || [];
  const imageUrl = sourceCreative?.url || sourceCreative?.fullUrl || "";

  return environments.map((environment, index) => ({
    id: `${placementId}-${environment}-${index}`,
    environment,
    type: ENVIRONMENT_TO_TYPE[environment] || "display_ad",
    headline: sourceCreative?.name || brandName || "Your Brand",
    description: keyMessage || `Campaign message for ${vertical || "your"} audience.`,
    brandName: brandName || sourceCreative?.name || "Brand",
    displayUrl: "example.com",
    cta: goal === "conversion" ? "Shop Now" : "Learn More",
    imageUrl,
    size: sourceCreative?.size,
    vertical: vertical || "general",
    goal: goal || "awareness",
  }));
}
