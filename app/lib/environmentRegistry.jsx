"use client";

import GoogleSearchEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/GoogleSearchEnvironment";
import YouTubeEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/YouTubeEnvironment";
import NewsSiteEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/NewsSiteEnvironment";
import MobileAppEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/MobileAppEnvironment";
import GoogleShoppingEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/GoogleShoppingEnvironment";
import GoogleDiscoverEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/GoogleDiscoverEnvironment";
import GmailEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/GmailEnvironment";
import GoogleMapsEnvironment from "@/app/components/PreviewStudio/GoogleAds/environments/GoogleMapsEnvironment";

import FacebookFeedEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/FacebookFeedEnvironment";
import FacebookFeedDesktopEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/FacebookFeedDesktopEnvironment";
import InstagramFeedEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/InstagramFeedEnvironment";
import InstagramStoryEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/InstagramStoryEnvironment";
import InstagramReelsEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/InstagramReelsEnvironment";
import FacebookStoryEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/FacebookStoryEnvironment";
import InstagramExploreEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/InstagramExploreEnvironment";
import FacebookMarketplaceEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/FacebookMarketplaceEnvironment";
import MessengerEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/MessengerEnvironment";
import AudienceNetworkEnvironment from "@/app/components/PreviewStudio/MetaAds/environments/AudienceNetworkEnvironment";
import FallbackEnvironment from "@/app/components/PreviewStudio/shared/FallbackEnvironment";

export const environmentRegistry = {
  google_search: GoogleSearchEnvironment,
  youtube: YouTubeEnvironment,
  news_site: NewsSiteEnvironment,
  mobile_app: MobileAppEnvironment,
  google_shopping: GoogleShoppingEnvironment,
  google_discover: GoogleDiscoverEnvironment,
  gmail: GmailEnvironment,
  google_maps: GoogleMapsEnvironment,

  facebook_feed: FacebookFeedEnvironment,
  facebook_feed_desktop: FacebookFeedDesktopEnvironment,
  instagram_feed: InstagramFeedEnvironment,
  instagram_story: InstagramStoryEnvironment,
  instagram_reels: InstagramReelsEnvironment,
  facebook_story: FacebookStoryEnvironment,
  instagram_explore: InstagramExploreEnvironment,
  facebook_marketplace: FacebookMarketplaceEnvironment,
  messenger: MessengerEnvironment,
  audience_network: AudienceNetworkEnvironment,
};

const TYPE_TO_ENVIRONMENT = {
  search_ad: "google_search",
  youtube_instream: "youtube",
  youtube_bumper: "youtube",
  display_ad: "news_site",
  news_display: "news_site",
  shopping_ad: "google_shopping",
  app_install_ad: "mobile_app",
  interstitial_ad: "mobile_app",
  discover_ad: "google_discover",
  gmail_ad: "gmail",
  maps_ad: "google_maps",

  facebook_feed_ad: "facebook_feed",
  instagram_feed_ad: "instagram_feed",
  story_ad: "instagram_story",
  facebook_story_ad: "facebook_story",
  reels_ad: "instagram_reels",
  carousel_ad: "instagram_feed",
  messenger_ad: "messenger",
  marketplace_ad: "facebook_marketplace",
  explore_ad: "instagram_explore",
  audience_network_ad: "audience_network",
};

export function resolveCreativeEnvironment(creative, deviceMode = "desktop") {
  if (creative?.environment && environmentRegistry[creative.environment]) {
    if (creative.environment === "facebook_feed" && deviceMode === "desktop") {
      return "facebook_feed_desktop";
    }
    return creative.environment;
  }

  const mapped = TYPE_TO_ENVIRONMENT[creative?.type];
  if (mapped === "facebook_feed" || creative?.type === "facebook_feed_ad") {
    return deviceMode === "desktop" ? "facebook_feed_desktop" : "facebook_feed";
  }
  return mapped || creative?.environment || null;
}

export function renderEnvironmentCreative(creative, handlers = {}, deviceMode = "desktop") {
  const environmentKey = resolveCreativeEnvironment(creative, deviceMode);
  const Component = environmentKey ? environmentRegistry[environmentKey] : FallbackEnvironment;

  return (
    <Component
      creative={{ ...creative, environment: environmentKey || creative.environment }}
      deviceMode={deviceMode}
      onCopy={handlers.onCopy}
      onEdit={handlers.onEdit}
    />
  );
}

export const GOOGLE_CHANNEL_TABS = [
  { id: "all", label: "All", environments: null },
  { id: "search", label: "Search", environments: ["google_search"] },
  { id: "youtube", label: "YouTube", environments: ["youtube"] },
  { id: "news", label: "Display/News", environments: ["news_site"] },
  { id: "shopping", label: "Shopping", environments: ["google_shopping"] },
  { id: "mobile", label: "Mobile App", environments: ["mobile_app"] },
  { id: "discover", label: "Discover", environments: ["google_discover"] },
  { id: "gmail", label: "Gmail", environments: ["gmail"] },
  { id: "maps", label: "Maps", environments: ["google_maps"] },
];

export const META_CHANNEL_TABS = [
  { id: "all", label: "All", environments: null },
  { id: "facebook_feed", label: "Facebook Feed", environments: ["facebook_feed", "facebook_feed_desktop"] },
  { id: "instagram_feed", label: "Instagram Feed", environments: ["instagram_feed"] },
  { id: "stories", label: "Stories", environments: ["instagram_story", "facebook_story"] },
  { id: "reels", label: "Reels", environments: ["instagram_reels"] },
  { id: "explore", label: "Explore", environments: ["instagram_explore"] },
  { id: "marketplace", label: "Marketplace", environments: ["facebook_marketplace"] },
  { id: "messenger", label: "Messenger", environments: ["messenger"] },
  { id: "audience", label: "Audience Network", environments: ["audience_network"] },
];

export const GOOGLE_MOBILE_ENVIRONMENTS = new Set(["mobile_app", "google_discover"]);
export const GOOGLE_DESKTOP_ENVIRONMENTS = new Set(["gmail", "google_search", "news_site", "google_shopping", "google_maps", "youtube"]);
export const META_MOBILE_ENVIRONMENTS = new Set([
  "facebook_feed", "instagram_feed", "instagram_story", "facebook_story",
  "instagram_reels", "instagram_explore", "messenger", "audience_network",
]);
export const META_DESKTOP_ENVIRONMENTS = new Set(["facebook_feed_desktop", "facebook_feed"]);
