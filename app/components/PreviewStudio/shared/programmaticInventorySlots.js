/**
 * Maps IAB creative sizes to realistic programmatic inventory placements.
 */

export const PROGRAMMATIC_SIZE_SLOTS = {
  "728x90": {
    label: "728×90 Leaderboard",
    desktop: { inventory: "news_articles", slot: "header_leaderboard", width: 728, height: 90 },
    mobile: { inventory: "blogs", slot: "mobile_banner", width: 320, height: 50 },
  },
  "970x250": {
    label: "970×250 Billboard",
    desktop: { inventory: "news_articles", slot: "hero_billboard", width: 970, height: 250 },
    mobile: { inventory: "news_articles", slot: "inline_article", width: 300, height: 250 },
  },
  "970x90": {
    label: "970×90 Large Leaderboard",
    desktop: { inventory: "technology", slot: "top_leaderboard", width: 970, height: 90 },
    mobile: { inventory: "blogs", slot: "mobile_banner", width: 320, height: 50 },
  },
  "300x250": {
    label: "300×250 Medium Rectangle",
    desktop: { inventory: "news_articles", slot: "sidebar_mrec", width: 300, height: 250 },
    mobile: { inventory: "blogs", slot: "in_content_mrec", width: 300, height: 250 },
  },
  "336x280": {
    label: "336×280 Large Rectangle",
    desktop: { inventory: "ecommerce", slot: "product_sidebar", width: 336, height: 280 },
    mobile: { inventory: "ecommerce", slot: "mobile_mrec", width: 300, height: 250 },
  },
  "300x600": {
    label: "300×600 Half Page",
    desktop: { inventory: "news_articles", slot: "sidebar_halfpage", width: 300, height: 600 },
    mobile: { inventory: "blogs", slot: "sticky_sidebar", width: 300, height: 250 },
  },
  "160x600": {
    label: "160×600 Wide Skyscraper",
    desktop: { inventory: "technology", slot: "skyscraper", width: 160, height: 600 },
    mobile: { inventory: "gaming", slot: "interstitial", width: 320, height: 480 },
  },
  "120x600": {
    label: "120×600 Skyscraper",
    desktop: { inventory: "healthcare", slot: "sidebar_skyscraper", width: 120, height: 600 },
    mobile: { inventory: "blogs", slot: "mobile_banner", width: 320, height: 50 },
  },
  "320x50": {
    label: "320×50 Mobile Banner",
    desktop: { inventory: "gaming", slot: "footer_banner", width: 728, height: 90 },
    mobile: { inventory: "gaming", slot: "mobile_footer", width: 320, height: 50 },
  },
  "320x100": {
    label: "320×100 Large Mobile Banner",
    desktop: { inventory: "blogs", slot: "header_banner", width: 728, height: 90 },
    mobile: { inventory: "blogs", slot: "mobile_large_banner", width: 320, height: 100 },
  },
  "320x480": {
    label: "320×480 Mobile Interstitial",
    desktop: { inventory: "ott", slot: "companion_banner", width: 300, height: 250 },
    mobile: { inventory: "gaming", slot: "interstitial", width: 320, height: 480 },
  },
  "480x320": {
    label: "480×320 Mobile Interstitial (Landscape)",
    desktop: { inventory: "gaming", slot: "in_game_banner", width: 728, height: 90 },
    mobile: { inventory: "gaming", slot: "landscape_interstitial", width: 480, height: 320 },
  },
  "300x50": {
    label: "300×50 Mobile Banner",
    desktop: { inventory: "news_articles", slot: "header_leaderboard", width: 728, height: 90 },
    mobile: { inventory: "news_articles", slot: "mobile_strip", width: 300, height: 50 },
  },
  "250x250": {
    label: "250×250 Square",
    desktop: { inventory: "ecommerce", slot: "grid_square", width: 250, height: 250 },
    mobile: { inventory: "ecommerce", slot: "mobile_square", width: 250, height: 250 },
  },
};

export function resolveProgrammaticSlot(size, device = "desktop") {
  const normalized = String(size || "").toLowerCase().replace(/\s/g, "");
  const config = PROGRAMMATIC_SIZE_SLOTS[normalized];
  if (!config) {
    return {
      label: size || "Custom",
      inventory: "news_articles",
      slot: "inline_fallback",
      width: 300,
      height: 250,
    };
  }
  const placement = device === "mobile" ? config.mobile : config.desktop;
  return { label: config.label, ...placement };
}

export const INVENTORY_LABELS = {
  news_articles: "News Publisher",
  technology: "Tech Review Site",
  ecommerce: "E-Commerce Store",
  gaming: "Gaming Portal",
  healthcare: "Health & Wellness",
  blogs: "Content Blog",
  ott: "Streaming / OTT",
  food_restaurant: "Food & Dining",
};
