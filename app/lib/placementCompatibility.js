/**
 * Platform-specific placement & device compatibility for the Analyzer Overview tab.
 * Status values: good (🟢), warning (🟡), bad (🔴)
 */

import { PLATFORM_SUPPORTED_SIZE_GROUPS } from "./creativeValidation";

const GDN_TIER1 = new Set([
  "300x250", "336x280", "728x90", "970x90", "970x250", "160x600", "300x600",
  "320x50", "320x100", "468x60", "250x250", "200x200",
]);

const GDN_TIER2 = new Set([
  "1200x628", "1080x1080", "1200x1200", "1280x720", "960x1200", "1200x1500",
]);

const DEMAND_GEN_NATIVE = new Set([
  "1200x628", "1080x1080", "1200x1200", "960x1200", "1200x1500", "1080x1920", "1080x1350",
]);

const GMAIL_SIZES = new Set(["300x250", "728x90", "336x280", "1200x628", "1080x1080", "970x250"]);

const APP_INVENTORY_SIZES = new Set([
  "320x50", "320x100", "300x250", "320x480", "480x320", "768x1024", "1080x1920",
]);

const YOUTUBE_COMPANION_SIZES = new Set([
  "300x250", "728x90", "970x90", "468x60", "336x280", "1280x720", "1920x1080",
]);

const CTV_SIZES = new Set(["1920x1080", "1280x720", "1080x1920"]);

function parseSize(size) {
  const [width, height] = String(size || "").split("x").map((n) => Number(n));
  if (!width || !height) return null;
  return { width, height, ratio: width / height };
}

function sizeInPlatformGroups(size, platform) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS[platform];
  if (!groups) return false;
  return Object.values(groups).some((list) => Array.isArray(list) && list.includes(size));
}

function isMobileSize(size) {
  const mobile = new Set([
    ...(PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads?.mobile_display || []),
    ...(PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic?.mobile_display || []),
    "320x50", "320x100", "320x480", "480x320", "1080x1350", "1080x1920",
  ]);
  return mobile.has(size);
}

function isDesktopSize(size) {
  const desktop = new Set([
    ...(PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads?.desktop_display || []),
    ...(PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic?.standard_display || []),
    "728x90", "970x90", "970x250", "160x600", "300x600", "336x280",
  ]);
  return desktop.has(size);
}

function rdaFitClass(size) {
  const dims = parseSize(size);
  if (!dims) return "unsupported";
  const ratio = dims.ratio;
  if (ratio >= 1.85 && ratio <= 1.98 && dims.width >= 600 && dims.height >= 314) return "landscape";
  if (ratio >= 0.95 && ratio <= 1.05 && dims.width >= 300 && dims.height >= 300) return "square";
  if (ratio >= 0.72 && ratio <= 0.85) return "vertical";
  if (GDN_TIER1.has(size) || GDN_TIER2.has(size)) return "banner";
  return "other";
}

export function getPlacementColumns(platform) {
  if (platform === "google_ads") {
    return [
      { id: "gdn", label: "Google Display Network (GDN)" },
      { id: "responsive_display", label: "Responsive Display" },
      { id: "demand_gen", label: "Demand Gen" },
      { id: "gmail", label: "Gmail" },
      { id: "app_inventory", label: "App Inventory" },
      { id: "youtube_companion", label: "YouTube Companion" },
    ];
  }
  if (platform === "meta_ads") {
    return [
      { id: "facebook_feed", label: "Facebook Feed" },
      { id: "instagram_feed", label: "Instagram Feed" },
      { id: "stories", label: "Stories" },
      { id: "reels", label: "Reels" },
      { id: "messenger", label: "Messenger" },
      { id: "audience_network", label: "Audience Network" },
    ];
  }
  return [
    { id: "native_ads", label: "Native Ads" },
    { id: "display_banners", label: "Display Banners" },
    { id: "mobile_app", label: "Mobile App Inventory" },
    { id: "ctv", label: "Connected TV (CTV)" },
    { id: "digital_audio", label: "Digital Audio" },
    { id: "video_inventory", label: "Video Inventory" },
    { id: "open_web", label: "Open Web Placements" },
  ];
}

export function getDeviceColumns(platform) {
  if (platform === "google_ads") {
    return [
      { id: "mobile", label: "Mobile" },
      { id: "desktop", label: "Desktop" },
    ];
  }
  return [];
}

function scoreGoogleGdn(size, textHigh) {
  if (GDN_TIER1.has(size)) return textHigh && (size === "320x50" || size === "320x100") ? "warning" : "good";
  if (GDN_TIER2.has(size)) return "warning";
  if (sizeInPlatformGroups(size, "google_ads")) return "warning";
  return "bad";
}

function scoreGoogleResponsiveDisplay(size, textHigh) {
  const fit = rdaFitClass(size);
  if (fit === "landscape" || fit === "square") return textHigh ? "warning" : "good";
  if (fit === "vertical") return "warning";
  if (fit === "banner") return "warning";
  if (DEMAND_GEN_NATIVE.has(size)) return "warning";
  return "bad";
}

function scoreGoogleDemandGen(size, textHigh) {
  if (DEMAND_GEN_NATIVE.has(size)) return textHigh ? "warning" : "good";
  const dims = parseSize(size);
  if (dims && dims.ratio >= 1.85 && dims.ratio <= 1.98) return "good";
  if (dims && dims.ratio >= 0.95 && dims.ratio <= 1.05) return "warning";
  if (GDN_TIER1.has(size)) return "warning";
  return "bad";
}

function scoreGoogleGmail(size, textHigh) {
  if (GMAIL_SIZES.has(size)) return textHigh ? "warning" : "good";
  if (size === "728x90" || size === "970x250") return "good";
  if (sizeInPlatformGroups(size, "google_ads")) return "warning";
  return "bad";
}

function scoreGoogleAppInventory(size, textHigh) {
  if (APP_INVENTORY_SIZES.has(size)) return textHigh && size.startsWith("320x") ? "warning" : "good";
  if (size === "300x250" || size === "480x320") return "warning";
  if (isMobileSize(size)) return "warning";
  return "bad";
}

function scoreGoogleYoutubeCompanion(size, textHigh) {
  if (YOUTUBE_COMPANION_SIZES.has(size)) {
    const dims = parseSize(size);
    if (dims && dims.ratio >= 1.6 && dims.ratio <= 1.85) return "good";
    if (size === "300x250" || size === "728x90" || size === "970x90") return textHigh ? "warning" : "good";
    return "warning";
  }
  if (size === "1080x1080" || size === "1200x628") return "warning";
  return "bad";
}

function scoreGoogleDeviceMobile(size) {
  if (isMobileSize(size)) return "good";
  if (size === "300x250") return "good";
  if (GDN_TIER1.has(size) && size.startsWith("320x")) return "good";
  if (DEMAND_GEN_NATIVE.has(size)) return "warning";
  if (isDesktopSize(size)) return "warning";
  return "bad";
}

function scoreGoogleDeviceDesktop(size) {
  if (isDesktopSize(size)) return "good";
  if (size === "300x250" || size === "336x280") return "good";
  if (GDN_TIER1.has(size) && !size.startsWith("320x")) return "good";
  if (isMobileSize(size) && !size.includes("300x250")) return "warning";
  if (DEMAND_GEN_NATIVE.has(size)) return "warning";
  return "bad";
}

function scoreMetaFacebookFeed(size, textHigh) {
  const feed = PLATFORM_SUPPORTED_SIZE_GROUPS.meta_ads?.feed_placements || [];
  if (feed.includes(size)) return textHigh ? "warning" : "good";
  const dims = parseSize(size);
  if (dims && dims.ratio >= 0.9 && dims.ratio <= 1.2) return "warning";
  return "bad";
}

function scoreMetaInstagramFeed(size, textHigh) {
  if (size === "1080x1350" || size === "1080x1080") return textHigh ? "warning" : "good";
  if (size === "1200x628") return "warning";
  return scoreMetaFacebookFeed(size, textHigh);
}

function scoreMetaStories(size, textHigh) {
  if (size === "1080x1920") return textHigh ? "warning" : "good";
  const dims = parseSize(size);
  if (dims && dims.ratio >= 0.55 && dims.ratio <= 0.58) return "warning";
  if (size === "1080x1080" || size === "1080x1350") return "warning";
  return "bad";
}

function scoreMetaReels(size, textHigh) {
  if (size === "1080x1920") return textHigh ? "warning" : "good";
  if (size === "1080x1350") return "warning";
  return scoreMetaStories(size, textHigh);
}

function scoreMetaMessenger(size, textHigh) {
  if (["1080x1080", "1200x628", "1080x1350"].includes(size)) return textHigh ? "warning" : "good";
  if (size === "300x250" || size === "320x50") return "warning";
  return "bad";
}

function scoreMetaAudienceNetwork(size, textHigh) {
  if (["320x50", "300x250", "1080x1080", "728x90"].includes(size)) return textHigh ? "warning" : "good";
  if (isMobileSize(size)) return "warning";
  if (sizeInPlatformGroups(size, "meta_ads")) return "warning";
  return "bad";
}

function scoreProgNative(size, textHigh) {
  const prog = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic || {};
  const native = new Set([...(prog.native_social_display || []), ...(prog.responsive_native || [])]);
  if (native.has(size)) return textHigh ? "warning" : "good";
  return "bad";
}

function scoreProgDisplayBanners(size, textHigh) {
  const standard = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic?.standard_display || [];
  if (standard.includes(size)) return textHigh && (size === "728x90" || size.startsWith("320x")) ? "warning" : "good";
  if (sizeInPlatformGroups(size, "programmatic")) return "warning";
  return "bad";
}

function scoreProgMobileApp(size, textHigh) {
  const mobile = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic?.mobile_display || [];
  if (mobile.includes(size)) return textHigh ? "warning" : "good";
  if (isMobileSize(size)) return "warning";
  return "bad";
}

function scoreProgCtv(size) {
  if (CTV_SIZES.has(size)) return "good";
  const dims = parseSize(size);
  if (dims && dims.ratio >= 1.6 && dims.ratio <= 1.85) return "good";
  return "bad";
}

function scoreProgDigitalAudio() {
  return "bad";
}

function scoreProgVideo(size) {
  const dims = parseSize(size);
  if (dims && dims.ratio >= 1.6 && dims.ratio <= 1.85) return "good";
  if (CTV_SIZES.has(size)) return "good";
  if (size === "1080x1080" || size === "1200x628") return "warning";
  return "bad";
}

function scoreProgOpenWeb(size, textHigh) {
  if (GDN_TIER1.has(size) || scoreProgDisplayBanners(size, textHigh) === "good") return "good";
  if (scoreProgNative(size, textHigh) === "good") return "warning";
  if (sizeInPlatformGroups(size, "programmatic")) return "warning";
  return "bad";
}

function googlePlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  return {
    gdn: scoreGoogleGdn(size, textHigh),
    responsive_display: scoreGoogleResponsiveDisplay(size, textHigh),
    demand_gen: scoreGoogleDemandGen(size, textHigh),
    gmail: scoreGoogleGmail(size, textHigh),
    app_inventory: scoreGoogleAppInventory(size, textHigh),
    youtube_companion: scoreGoogleYoutubeCompanion(size, textHigh),
  };
}

function googleDeviceScores(size) {
  return {
    mobile: scoreGoogleDeviceMobile(size),
    desktop: scoreGoogleDeviceDesktop(size),
  };
}

function metaPlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  return {
    facebook_feed: scoreMetaFacebookFeed(size, textHigh),
    instagram_feed: scoreMetaInstagramFeed(size, textHigh),
    stories: scoreMetaStories(size, textHigh),
    reels: scoreMetaReels(size, textHigh),
    messenger: scoreMetaMessenger(size, textHigh),
    audience_network: scoreMetaAudienceNetwork(size, textHigh),
  };
}

function programmaticPlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  return {
    native_ads: scoreProgNative(size, textHigh),
    display_banners: scoreProgDisplayBanners(size, textHigh),
    mobile_app: scoreProgMobileApp(size, textHigh),
    ctv: scoreProgCtv(size),
    digital_audio: scoreProgDigitalAudio(),
    video_inventory: scoreProgVideo(size),
    open_web: scoreProgOpenWeb(size, textHigh),
  };
}

export function computePlacementCompatibility(creative, platform, signals) {
  const size = creative?.size || "";

  if (platform === "google_ads") return googlePlacementScores(size, signals);
  if (platform === "meta_ads") return metaPlacementScores(size, signals);
  return programmaticPlacementScores(size, signals);
}

export function computeDeviceCompatibility(creative, platform) {
  if (platform !== "google_ads") return null;
  return googleDeviceScores(creative?.size || "");
}

/** Primary placement keys used for launch-status (not secondary inventory). */
export function getPrimaryPlacementKeys(platform, creative) {
  const size = creative?.size || "";

  if (platform === "google_ads") {
    if (DEMAND_GEN_NATIVE.has(size) && !GDN_TIER1.has(size)) {
      return ["demand_gen", "responsive_display"];
    }
    if (APP_INVENTORY_SIZES.has(size) && size.startsWith("320x")) {
      return ["app_inventory"];
    }
    if (GDN_TIER1.has(size) || GDN_TIER2.has(size)) {
      return ["gdn"];
    }
    return ["gdn", "responsive_display"];
  }

  if (platform === "meta_ads") {
    if (size === "1080x1920") return ["stories", "reels"];
    if (size === "1080x1350") return ["instagram_feed", "facebook_feed"];
    return ["facebook_feed", "instagram_feed"];
  }

  if (platform === "programmatic") {
    const prog = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic || {};
    const native = new Set([...(prog.native_social_display || []), ...(prog.responsive_native || [])]);
    if (native.has(size)) return ["native_ads"];
    if ((prog.mobile_display || []).includes(size)) return ["mobile_app"];
    if ((prog.standard_display || []).includes(size)) return ["display_banners"];
    return ["open_web"];
  }

  return [];
}

export function getPlacementLegend(platform) {
  if (platform === "google_ads") {
    return "🟢 Recommended / native fit · 🟡 Compatible but limited · 🔴 Not recommended";
  }
  if (platform === "meta_ads") {
    return "🟢 Feed/Stories/Reels ready · 🟡 usable with crop or copy edits · 🔴 wrong aspect ratio for that placement";
  }
  return "🟢 Strong inventory fit · 🟡 limited scale or format friction · 🔴 weak or unsupported for that channel";
}
