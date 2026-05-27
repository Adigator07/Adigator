"use client";

import GoogleSearchPreview from "./GoogleAds/GoogleSearchPreview";
import GoogleDisplayPreview from "./GoogleAds/GoogleDisplayPreview";
import GoogleShoppingPreview from "./GoogleAds/GoogleShoppingPreview";
import GoogleAppPreview from "./GoogleAds/GoogleAppPreview";
import FacebookFeedPreview from "./MetaAds/FacebookFeedPreview";
import InstagramFeedPreview from "./MetaAds/InstagramFeedPreview";
import InstagramStoryPreview from "./MetaAds/InstagramStoryPreview";
import ReelsPreview from "./MetaAds/ReelsPreview";
import CarouselPreview from "./MetaAds/CarouselPreview";
import MessengerPreview from "./MetaAds/MessengerPreview";

export const templateRegistry = {
  google_ads: {
    search_ad: GoogleSearchPreview,
    display_ad: GoogleDisplayPreview,
    shopping_ad: GoogleShoppingPreview,
    app_install_ad: GoogleAppPreview,
  },
  meta_ads: {
    facebook_feed_ad: FacebookFeedPreview,
    instagram_feed_ad: InstagramFeedPreview,
    story_ad: InstagramStoryPreview,
    reels_ad: ReelsPreview,
    carousel_ad: CarouselPreview,
    messenger_ad: MessengerPreview,
  },
  programmatic: {
    // Existing programmatic preview uses ProgrammaticPreviewStudio directly.
  },
};

export function renderPlatformCreative(platform, creative, handlers = {}) {
  const Component = templateRegistry[platform]?.[creative?.type];
  if (!Component) return null;
  return <Component creative={creative} onCopy={handlers.onCopy} onEdit={handlers.onEdit} />;
}
