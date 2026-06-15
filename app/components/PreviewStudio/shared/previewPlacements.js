export const PLACEMENTS = {
  google: [
    { id: "search", label: "Search", width: 1024 },
    { id: "display", label: "Display", width: 1024 },
    { id: "youtube", label: "YouTube", width: 1024 },
    { id: "app", label: "App Interstitial", width: 375 },
    { id: "discover", label: "Discover", width: 375 },
    { id: "gmail", label: "Gmail", width: 1024 },
    { id: "maps", label: "Maps", width: 1024 },
    { id: "shopping", label: "Shopping", width: 1024 },
  ],
  meta: [
    { id: "facebook_feed", label: "Facebook Feed", width: 375 },
    { id: "facebook_stories", label: "Facebook Stories", width: 375 },
    { id: "facebook_reels", label: "Facebook Reels", width: 375 },
    { id: "instagram_feed", label: "Instagram Feed", width: 375 },
    { id: "instagram_stories", label: "Instagram Stories", width: 375 },
    { id: "instagram_explore", label: "Instagram Explore", width: 375 },
    { id: "messenger_inbox", label: "Messenger Inbox", width: 375 },
    { id: "sponsored_messages", label: "Sponsored Messages", width: 375 },
    { id: "audience_network", label: "Audience Network", width: 375 },
    { id: "threads_feed", label: "Threads Feed", width: 375 },
  ],
  programmatic: [
    { id: "healthcare", label: "Healthcare", width: 1024 },
    { id: "technology", label: "Technology", width: 1024 },
    { id: "food_restaurant", label: "Food & Restaurant", width: 1024 },
    { id: "ecommerce", label: "E-Commerce", width: 1024 },
    { id: "gaming", label: "Gaming", width: 1024 },
    { id: "news_articles", label: "News Articles", width: 1024 },
    { id: "ott", label: "OTT / Streaming", width: 1024 },
    { id: "blogs", label: "Blogs", width: 1024 },
  ],
};

export function mapExternalPlatform(platform) {
  if (platform === "google_ads") return "google";
  if (platform === "meta_ads") return "meta";
  if (platform === "programmatic") return "programmatic";
  return "google";
}

export function getDefaultPlacement(platformKey) {
  return PLACEMENTS[platformKey]?.[0]?.id || "search";
}

export function getPlacementConfig(platformKey, placementId) {
  return PLACEMENTS[platformKey]?.find((p) => p.id === placementId) || null;
}
