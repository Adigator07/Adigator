/**
 * Preview Studio placement registry — platform-specific tabs, compatible sizes,
 * and environment mappings for Google Ads, Meta Ads, and Programmatic.
 */

import { PLATFORM_SUPPORTED_SIZE_GROUPS } from "./creativeValidation";

const GOOGLE = PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads;
const META = PLATFORM_SUPPORTED_SIZE_GROUPS.meta_ads;
const PROG = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;

const GDN_SIZES = [
  ...GOOGLE.desktop_display,
  "320x50",
  "320x100",
  "300x250",
];

const MOBILE_DISPLAY_SIZES = [...GOOGLE.mobile_display, "1080x1920"];

const RESPONSIVE_DISPLAY_SIZES = [
  ...GOOGLE.responsive_native_assets,
  "600x314",
  "1200x628",
  "1080x1080",
  "960x1200",
  "1200x1500",
];

const DEMAND_GEN_SIZES = [
  ...GOOGLE.responsive_native_assets,
  "1280x720",
  "1920x1080",
  "1080x1920",
  "1080x1350",
];

const GMAIL_SIZES = ["300x250", "728x90", "336x280", "1200x628", "1080x1080", "970x250"];

const APP_INVENTORY_SIZES = [
  "320x50",
  "320x100",
  "300x250",
  "320x480",
  "480x320",
  "768x1024",
  "1080x1920",
];

const YOUTUBE_COMPANION_SIZES = [
  "300x250",
  "728x90",
  "970x90",
  "468x60",
  "336x280",
  "1280x720",
  "1920x1080",
];

const META_FEED_SIZES = [...META.feed_placements, ...META.flexible_native_assets];
const META_STORY_REEL_SIZES = [...META.story_reels, "1080x1350"];
const META_MESSENGER_SIZES = ["1080x1080", "1200x628", "300x250"];
const META_AUDIENCE_SIZES = [
  ...META.feed_placements,
  ...META.story_reels,
  "300x250",
  "320x50",
  "728x90",
];

const PROG_NATIVE_SIZES = [
  ...(PROG.native_responsive_assets || []),
];

const PROG_BANNER_SIZES = [
  ...(PROG.standard_display || []),
  ...(PROG.mobile_display || []),
];

const PROG_MOBILE_APP_SIZES = [
  ...(PROG.mobile_display || []),
  "320x480",
  "480x320",
  "768x1024",
  "1080x1920",
];

const PROG_OPEN_WEB_SIZES = [...new Set([...PROG_BANNER_SIZES, ...PROG_NATIVE_SIZES])];

/** All publisher context templates for programmatic Display Website Preview. */
export const PROGRAMMATIC_DISPLAY_WEBSITE_ENVIRONMENTS = [
  "news",
  "commerce",
  "social",
  "luxury",
  "sports",
  "gaming",
  "finance",
  "travel",
  "saas",
  "booking",
];

export const PROGRAMMATIC_ENVIRONMENT_LABELS = {
  news: "Editorial / News",
  commerce: "E-Commerce",
  social: "Social Feed",
  luxury: "Premium / Luxury",
  sports: "Sports Media",
  gaming: "Gaming",
  finance: "Finance",
  travel: "Travel",
  saas: "Enterprise / SaaS",
  booking: "Booking / Reservations",
};

/** @typedef {{ id: string, label: string, environments: string[], compatibleSizes: string[], devices?: string[], environmentFamilies?: string[], description?: string }} PreviewPlacement */

/** @type {Record<string, Record<string, PreviewPlacement>>} */
export const PREVIEW_PLACEMENT_REGISTRY = {
  google_ads: {
    gdn: {
      id: "gdn",
      label: "GDN (Google Display Network)",
      environments: ["news_site"],
      compatibleSizes: GDN_SIZES,
      devices: ["desktop", "mobile"],
      description: "Website and publisher banner inventory on Google Display Network.",
    },
    mobile_display: {
      id: "mobile_display",
      label: "Mobile Display",
      environments: ["mobile_app"],
      compatibleSizes: MOBILE_DISPLAY_SIZES,
      devices: ["mobile"],
      description: "Mobile web and in-app display placements.",
    },
    responsive_display: {
      id: "responsive_display",
      label: "Responsive Display",
      environments: ["google_discover"],
      compatibleSizes: RESPONSIVE_DISPLAY_SIZES,
      devices: ["desktop", "mobile"],
      description: "Responsive Display Ads across eligible surfaces.",
    },
    demand_gen: {
      id: "demand_gen",
      label: "Demand Gen",
      environments: ["google_discover", "youtube"],
      compatibleSizes: DEMAND_GEN_SIZES,
      devices: ["desktop", "mobile"],
      description: "Demand Gen across Discover, YouTube, and Gmail surfaces.",
    },
    gmail: {
      id: "gmail",
      label: "Gmail",
      environments: ["gmail"],
      compatibleSizes: GMAIL_SIZES,
      devices: ["desktop", "mobile"],
      description: "Gmail promotional and inbox placements.",
    },
    app_inventory: {
      id: "app_inventory",
      label: "App Inventory",
      environments: ["mobile_app"],
      compatibleSizes: APP_INVENTORY_SIZES,
      devices: ["mobile"],
      description: "Google app network interstitial and banner inventory.",
    },
    youtube_companion: {
      id: "youtube_companion",
      label: "YouTube Companion",
      environments: ["youtube"],
      compatibleSizes: YOUTUBE_COMPANION_SIZES,
      devices: ["desktop", "mobile"],
      description: "YouTube in-stream video with companion display banner in the player layout.",
    },
  },
  meta_ads: {
    facebook_feed: {
      id: "facebook_feed",
      label: "Facebook Feed",
      environments: ["facebook_feed", "facebook_feed_desktop"],
      compatibleSizes: META_FEED_SIZES,
      devices: ["mobile", "desktop"],
      description: "Facebook News Feed placements.",
    },
    instagram_feed: {
      id: "instagram_feed",
      label: "Instagram Feed",
      environments: ["instagram_feed"],
      compatibleSizes: META_FEED_SIZES,
      devices: ["mobile"],
      description: "Instagram Feed placements.",
    },
    facebook_stories: {
      id: "facebook_stories",
      label: "Facebook Stories",
      environments: ["facebook_story"],
      compatibleSizes: META_STORY_REEL_SIZES,
      devices: ["mobile"],
      description: "Facebook Stories full-screen vertical placements.",
    },
    instagram_stories: {
      id: "instagram_stories",
      label: "Instagram Stories",
      environments: ["instagram_story"],
      compatibleSizes: META_STORY_REEL_SIZES,
      devices: ["mobile"],
      description: "Instagram Stories full-screen vertical placements.",
    },
    facebook_reels: {
      id: "facebook_reels",
      label: "Facebook Reels",
      environments: ["instagram_reels"],
      compatibleSizes: META_STORY_REEL_SIZES,
      devices: ["mobile"],
      description: "Facebook Reels vertical video-style placements.",
    },
    instagram_reels: {
      id: "instagram_reels",
      label: "Instagram Reels",
      environments: ["instagram_reels"],
      compatibleSizes: META_STORY_REEL_SIZES,
      devices: ["mobile"],
      description: "Instagram Reels vertical placements.",
    },
    messenger: {
      id: "messenger",
      label: "Messenger",
      environments: ["messenger"],
      compatibleSizes: META_MESSENGER_SIZES,
      devices: ["mobile"],
      description: "Messenger inbox and sponsored message placements.",
    },
    audience_network: {
      id: "audience_network",
      label: "Audience Network",
      environments: ["audience_network"],
      compatibleSizes: META_AUDIENCE_SIZES,
      devices: ["mobile", "desktop"],
      description: "Meta Audience Network across apps and sites.",
    },
  },
  programmatic: {
    native_ads: {
      id: "native_ads",
      label: "Native Ads",
      compatibleSizes: PROG_NATIVE_SIZES,
      environmentFamilies: ["news", "social", "commerce", "finance", "travel"],
      devices: ["desktop", "mobile"],
      description: "In-feed native and content-matched placements.",
    },
    display_banners: {
      id: "display_banners",
      label: "Display Banners",
      compatibleSizes: PROG_BANNER_SIZES,
      environmentFamilies: ["news", "sports", "finance", "commerce", "gaming"],
      devices: ["desktop", "mobile"],
      description: "Standard IAB display banner inventory.",
    },
    mobile_app_inventory: {
      id: "mobile_app_inventory",
      label: "Mobile App Inventory",
      compatibleSizes: PROG_MOBILE_APP_SIZES,
      environmentFamilies: ["gaming", "social", "commerce", "news", "sports"],
      devices: ["mobile"],
      description: "In-app mobile display and interstitial inventory.",
    },
    open_web: {
      id: "open_web",
      label: "Open Web",
      compatibleSizes: PROG_OPEN_WEB_SIZES,
      environmentFamilies: ["news", "travel", "booking", "finance", "luxury", "commerce"],
      devices: ["desktop", "mobile"],
      description: "Open web publisher placements across premium sites.",
    },
  },
};

export function getPreviewPlacementTabs(platform) {
  const registry = PREVIEW_PLACEMENT_REGISTRY[platform];
  if (!registry) return [];
  return Object.values(registry).map(({ id, label, description }) => ({
    id,
    label,
    title: description,
  }));
}

export function getPreviewPlacement(platform, placementId) {
  return PREVIEW_PLACEMENT_REGISTRY[platform]?.[placementId] || null;
}

export function getDefaultPreviewPlacement(platform) {
  const tabs = getPreviewPlacementTabs(platform);
  return tabs[0]?.id || null;
}

export function getCompatibleSizesForPlacement(platform, placementId) {
  const placement = getPreviewPlacement(platform, placementId);
  return placement?.compatibleSizes ? [...placement.compatibleSizes] : [];
}

export function getEnvironmentsForPlacement(platform, placementId) {
  const placement = getPreviewPlacement(platform, placementId);
  return placement?.environments ? [...placement.environments] : [];
}

export function getDeviceOptionsForPlacement(platform, placementId) {
  const placement = getPreviewPlacement(platform, placementId);
  const devices = placement?.devices || ["desktop", "mobile"];
  return devices.map((id) => ({
    id,
    label: id === "mobile" ? "Mobile" : "Desktop",
  }));
}

export function normalizePreviewSize(size) {
  if (!size) return "";
  const raw = String(size).trim().toLowerCase();
  if (raw === "9:16") return "1080x1920";
  if (raw === "16:9") return "1280x720";
  if (raw === "1:1") return "1080x1080";
  return raw.replace(/\s/g, "");
}

export function isSizeCompatibleWithPlacement(size, platform, placementId) {
  const normalized = normalizePreviewSize(size);
  if (!normalized) return false;
  const compatible = getCompatibleSizesForPlacement(platform, placementId);
  if (compatible.includes(normalized)) return true;

  const dims = normalized.split("x").map(Number);
  if (dims.length !== 2 || !dims[0] || !dims[1]) return false;
  const ratio = dims[0] / dims[1];

  for (const candidate of compatible) {
    const parts = candidate.split("x").map(Number);
    if (parts.length !== 2) continue;
    const candidateRatio = parts[0] / parts[1];
    if (Math.abs(ratio - candidateRatio) < 0.08) return true;
  }
  return false;
}

export function filterSourceCreativesByPlacement(sourceCreatives, platform, placementId) {
  if (!Array.isArray(sourceCreatives) || !placementId) return sourceCreatives || [];
  return sourceCreatives.filter((creative) => {
    const size = creative?.size || creative?.validation?.size;
    return isSizeCompatibleWithPlacement(size, platform, placementId);
  });
}

export function filterTemplatesByPlacement(templates, platform, placementId, deviceMode = "mobile") {
  const environments = getEnvironmentsForPlacement(platform, placementId);
  if (!environments.length) return templates;

  const envSet = new Set(environments);
  if (platform === "meta_ads" && envSet.has("facebook_feed")) {
    envSet.add("facebook_feed_desktop");
  }

  return (templates || []).filter((template) => {
    const env = template?.environment;
    if (env && envSet.has(env)) return true;
    if (platform === "meta_ads" && template?.environment === "facebook_feed_desktop" && deviceMode === "desktop") {
      return envSet.has("facebook_feed");
    }
    return false;
  });
}

export function estimatePreviewTokenBudget(platform, placementId) {
  const envCount = getEnvironmentsForPlacement(platform, placementId).length || 1;
  const base = platform === "meta_ads" ? 420 : 380;
  return Math.min(3500, Math.max(600, envCount * base));
}
