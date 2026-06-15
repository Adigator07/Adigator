import SearchPreview from "./platforms/google/SearchPreview";
import DisplayPreview from "./platforms/google/DisplayPreview";
import YouTubePreview from "./platforms/google/YouTubePreview";
import AppPreview from "./platforms/google/AppPreview";
import DiscoverPreview from "./platforms/google/DiscoverPreview";
import GmailPreview from "./platforms/google/GmailPreview";
import MapsPreview from "./platforms/google/MapsPreview";
import ShoppingPreview from "./platforms/google/ShoppingPreview";

import FacebookFeedPreview from "./platforms/meta/FacebookFeedPreview";
import FacebookStoriesPreview from "./platforms/meta/FacebookStoriesPreview";
import FacebookReelsPreview from "./platforms/meta/FacebookReelsPreview";
import InstagramFeedPreview from "./platforms/meta/InstagramFeedPreview";
import InstagramStoriesPreview from "./platforms/meta/InstagramStoriesPreview";
import InstagramExplorePreview from "./platforms/meta/InstagramExplorePreview";
import MessengerInboxPreview from "./platforms/meta/MessengerInboxPreview";
import SponsoredMessagesPreview from "./platforms/meta/SponsoredMessagesPreview";
import AudienceNetworkPreview from "./platforms/meta/AudienceNetworkPreview";
import ThreadsFeedPreview from "./platforms/meta/ThreadsFeedPreview";

import HealthcarePreview from "./platforms/programmatic/HealthcarePreview";
import TechnologyPreview from "./platforms/programmatic/TechnologyPreview";
import FoodRestaurantPreview from "./platforms/programmatic/FoodRestaurantPreview";
import EcommercePreview from "./platforms/programmatic/EcommercePreview";
import GamingPreview from "./platforms/programmatic/GamingPreview";
import NewsArticlesPreview from "./platforms/programmatic/NewsArticlesPreview";
import OTTPreview from "./platforms/programmatic/OTTPreview";
import BlogsPreview from "./platforms/programmatic/BlogsPreview";

export const PREVIEW_REGISTRY = {
  google: {
    search: SearchPreview,
    display: DisplayPreview,
    youtube: YouTubePreview,
    app: AppPreview,
    discover: DiscoverPreview,
    gmail: GmailPreview,
    maps: MapsPreview,
    shopping: ShoppingPreview,
  },
  meta: {
    facebook_feed: FacebookFeedPreview,
    facebook_stories: FacebookStoriesPreview,
    facebook_reels: FacebookReelsPreview,
    instagram_feed: InstagramFeedPreview,
    instagram_stories: InstagramStoriesPreview,
    instagram_explore: InstagramExplorePreview,
    messenger_inbox: MessengerInboxPreview,
    sponsored_messages: SponsoredMessagesPreview,
    audience_network: AudienceNetworkPreview,
    threads_feed: ThreadsFeedPreview,
  },
  programmatic: {
    healthcare: HealthcarePreview,
    technology: TechnologyPreview,
    food_restaurant: FoodRestaurantPreview,
    ecommerce: EcommercePreview,
    gaming: GamingPreview,
    news_articles: NewsArticlesPreview,
    ott: OTTPreview,
    blogs: BlogsPreview,
  },
};

export function getPreviewComponent(platform, placement) {
  return PREVIEW_REGISTRY[platform]?.[placement] || null;
}
