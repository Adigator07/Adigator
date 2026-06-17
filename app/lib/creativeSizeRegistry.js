/**
 * Single source of truth for industry-standard creative sizes across
 * Google Ads, Meta Ads, and Programmatic validation + preview workflows.
 */

function intel(
  label,
  group,
  placementType,
  deviceClassification,
  inventoryCategory,
  inventoryScore,
  auctionReadinessScore,
  premiumEligible,
  iabCompatibility,
) {
  return {
    label,
    group,
    placementType,
    deviceClassification,
    inventoryCategory,
    inventoryScore,
    auctionReadinessScore,
    premiumEligible,
    iabCompatibility,
  };
}

/** @type {Record<string, ReturnType<typeof intel>>} */
export const SIZE_INTELLIGENCE = {
  "125x125": intel("Button", "legacy", "desktop", "Desktop", "Legacy Inventory", 48, 50, false, "IAB Legacy Display"),
  "120x60": intel("Button Banner", "legacy", "desktop", "Desktop", "Legacy Inventory", 46, 48, false, "IAB Legacy Display"),
  "120x240": intel("Vertical Banner", "legacy", "desktop", "Desktop", "Legacy Inventory", 50, 52, false, "IAB Legacy Display"),
  "234x60": intel("Half Banner", "legacy", "desktop", "Desktop", "Legacy Inventory", 52, 54, false, "IAB Legacy Display"),
  "200x200": intel("Small Square", "desktop", "desktop", "Desktop", "Legacy Inventory", 56, 58, false, "IAB Legacy Display"),
  "250x250": intel("Square", "desktop", "desktop", "Desktop + Mobile", "Limited Inventory", 66, 69, false, "IAB Display"),
  "250x360": intel("Triple Widescreen", "desktop", "desktop", "Desktop", "Limited Inventory", 62, 64, false, "IAB Display"),
  "300x250": intel("Medium Rectangle", "desktop", "desktop", "Desktop + Mobile", "Universal Inventory", 96, 95, true, "IAB Core Display"),
  "336x280": intel("Large Rectangle", "desktop", "desktop", "Desktop + Mobile", "High Inventory", 90, 89, true, "IAB Core Display"),
  "468x60": intel("Banner", "desktop", "desktop", "Desktop", "Legacy Inventory", 61, 62, false, "IAB Legacy Display"),
  "580x400": intel("Rectangle", "desktop", "desktop", "Desktop", "Limited Inventory", 58, 60, false, "IAB Display"),
  "728x90": intel("Leaderboard", "desktop", "desktop", "Desktop + Tablet", "Strong Inventory", 88, 90, true, "IAB Core Display"),
  "930x180": intel("Panorama", "desktop", "high-impact", "Desktop + Tablet", "Premium Inventory", 80, 82, true, "IAB High-Impact Display"),
  "970x90": intel("Large Leaderboard", "desktop", "desktop", "Desktop + Tablet", "Premium Inventory", 84, 86, true, "IAB High-Impact Display"),
  "970x250": intel("Billboard", "desktop", "high-impact", "Desktop + Tablet", "Premium Inventory", 82, 88, true, "IAB High-Impact Display"),
  "980x120": intel("Panorama", "desktop", "high-impact", "Desktop + Tablet", "Premium Inventory", 79, 81, true, "IAB High-Impact Display"),
  "120x600": intel("Skyscraper", "desktop", "desktop", "Desktop", "Strong Inventory", 78, 80, false, "IAB Core Display"),
  "160x600": intel("Wide Skyscraper", "desktop", "desktop", "Desktop", "Strong Inventory", 84, 85, false, "IAB Core Display"),
  "240x400": intel("Vertical Rectangle", "desktop", "desktop", "Desktop", "Limited Inventory", 60, 62, false, "IAB Display"),
  "300x600": intel("Half Page", "desktop", "high-impact", "Desktop", "Premium Inventory", 81, 87, true, "IAB High-Impact Display"),
  "300x1050": intel("Premium Skyscraper", "desktop", "high-impact", "Desktop", "Premium Inventory", 76, 78, true, "IAB High-Impact Display"),
  "300x50": intel("Mobile Banner", "mobile", "mobile", "Mobile", "Mobile-First Inventory", 92, 90, false, "IAB Mobile Display"),
  "300x100": intel("Mobile Banner Large", "mobile", "mobile", "Mobile", "High Inventory", 86, 85, false, "IAB Mobile Display"),
  "320x50": intel("Mobile Banner", "mobile", "mobile", "Mobile", "Mobile-First Inventory", 95, 93, false, "IAB Mobile Display"),
  "320x100": intel("Large Mobile Banner", "mobile", "mobile", "Mobile", "High Inventory", 89, 88, false, "IAB Mobile Display"),
  "320x480": intel("Mobile Interstitial", "mobile", "mobile", "Mobile", "Limited Inventory", 64, 70, true, "IAB Mobile Display"),
  "480x320": intel("Mobile Interstitial Landscape", "mobile", "mobile", "Mobile", "Limited Inventory", 61, 66, false, "IAB Mobile Display"),
  "768x1024": intel("Tablet Interstitial Portrait", "tablet", "mobile", "Tablet", "Tablet Inventory", 72, 74, true, "IAB Tablet Display"),
  "1024x768": intel("Tablet Interstitial Landscape", "tablet", "mobile", "Tablet", "Tablet Inventory", 70, 72, true, "IAB Tablet Display"),
  "600x314": intel("RDA Landscape Minimum", "native", "native", "Desktop + Mobile", "Responsive Inventory", 74, 76, true, "Responsive / Native Assets"),
  "600x600": intel("Feed Minimum Square", "native", "native", "Desktop + Mobile", "Social Inventory", 72, 74, true, "Responsive / Native Assets"),
  "1200x628": intel("Native Landscape", "native", "native", "Desktop + Mobile", "High Inventory", 88, 87, true, "Responsive / Native Assets"),
  "1200x675": intel("Native Landscape Alt", "native", "native", "Desktop + Mobile", "High Inventory", 86, 85, true, "Responsive / Native Assets"),
  "1080x1080": intel("Native Square", "native", "native", "Desktop + Mobile", "Strong Inventory", 83, 85, true, "Responsive / Native Assets"),
  "1080x1350": intel("Native Portrait", "native", "native", "Mobile", "Strong Inventory", 81, 86, true, "Responsive / Native Assets"),
  "1200x1200": intel("Native Square Large", "native", "native", "Desktop + Mobile", "Strong Inventory", 80, 82, true, "Responsive / Native Assets"),
  "960x1200": intel("Responsive Portrait", "native", "native", "Mobile", "Responsive Inventory", 77, 79, true, "Responsive / Native Assets"),
  "1200x1500": intel("Responsive Portrait Large", "native", "native", "Mobile", "Responsive Inventory", 78, 80, true, "Responsive / Native Assets"),
  "1080x1920": intel("Story / Full-Screen Vertical", "stories", "mobile", "Mobile", "Social Mobile Inventory", 86, 88, true, "Social Story / Full-Screen"),
  "1920x1080": intel("Landscape Display", "native", "native", "Desktop + Mobile", "High Inventory", 88, 87, true, "Responsive / Native Assets"),
  "300x60": intel("Companion Banner", "companion", "desktop", "Desktop", "Companion Inventory", 68, 70, false, "IAB Display Companion"),
};

export const DESKTOP_IAB_SIZES = [
  "125x125", "120x60", "120x240", "234x60",
  "200x200", "250x250", "250x360",
  "300x250", "336x280", "468x60", "580x400",
  "728x90", "930x180", "970x90", "970x250", "980x120",
  "120x600", "160x600", "240x400", "300x600", "300x1050",
];

export const MOBILE_IAB_SIZES = [
  "300x50", "300x100", "320x50", "320x100",
  "300x250", "320x480", "480x320",
];

export const TABLET_IAB_SIZES = ["768x1024", "1024x768"];

export const NATIVE_RESPONSIVE_SIZES = [
  "600x314", "600x600",
  "1200x628", "1080x1080", "1080x1350",
  "1200x1200", "960x1200", "1200x1500",
];

export const COMPANION_SIZES = ["300x60"];

export const STORY_SIZES = ["1080x1920"];

export const PROGRAMMATIC_STANDARD_DISPLAY_SIZES = [
  "300x250", "336x280", "728x90", "160x600", "300x600",
  "970x90", "970x250", "468x60", "250x250", "200x200",
];

export const PROGRAMMATIC_MOBILE_DISPLAY_SIZES = [
  "320x50", "300x50", "320x100", "300x100", "320x480", "480x320",
];

export const PROGRAMMATIC_HIGH_IMPACT_SIZES = [
  "970x250", "300x600", "300x1050", "970x90", "980x120", "930x180",
];

export const PROGRAMMATIC_NATIVE_RESPONSIVE_SIZES = [
  "1200x628", "1200x675", "1200x1200", "1080x1080",
  "960x1200", "1200x1500", "1080x1350",
];

export const SUPPORTED_DISPLAY_SIZE_GROUPS = {
  desktop: DESKTOP_IAB_SIZES,
  mobile: MOBILE_IAB_SIZES,
  tablet: TABLET_IAB_SIZES,
  high_impact: ["970x250", "300x600", "970x90", "300x1050", "980x120", "930x180"],
  native: NATIVE_RESPONSIVE_SIZES,
  responsive_native: NATIVE_RESPONSIVE_SIZES,
  stories: STORY_SIZES,
  companion: COMPANION_SIZES,
  legacy: ["234x60", "125x125", "120x60", "120x240", "468x60", "200x200"],
};

export const PLATFORM_SUPPORTED_SIZE_GROUPS = {
  google_ads: {
    desktop_display: DESKTOP_IAB_SIZES,
    mobile_display: MOBILE_IAB_SIZES,
    responsive_native_assets: NATIVE_RESPONSIVE_SIZES,
    companion_banners: COMPANION_SIZES,
  },
  meta_ads: {
    feed_placements: ["1080x1080", "1080x1350", "1200x628", "600x600"],
    story_reels: STORY_SIZES,
    carousel: ["1080x1080"],
    messenger: ["1200x628", "600x314"],
    audience_network: ["1200x628", "1920x1080", "1080x1920", "1080x1080", "300x250", "320x50"],
    right_column: ["1080x1080"],
    marketplace: ["1080x1080"],
    search_results: ["1080x1080"],
    flexible_native_assets: ["1200x1200", "1200x628", "960x1200", "1200x1500"],
  },
  programmatic: {
    standard_display: PROGRAMMATIC_STANDARD_DISPLAY_SIZES,
    mobile_display: PROGRAMMATIC_MOBILE_DISPLAY_SIZES,
    high_impact: PROGRAMMATIC_HIGH_IMPACT_SIZES,
    native_responsive_assets: PROGRAMMATIC_NATIVE_RESPONSIVE_SIZES,
  },
};

export const PLATFORM_SIZE_GROUP_LABELS = {
  desktop_display: "Desktop Display",
  mobile_display: "Mobile Display",
  responsive_native_assets: "Responsive / Native Assets",
  companion_banners: "Companion Banners",
  feed_placements: "Feed Placements",
  story_reels: "Story / Reels",
  carousel: "Carousel",
  messenger: "Messenger",
  audience_network: "Audience Network",
  right_column: "Right Column (Desktop)",
  marketplace: "Marketplace",
  search_results: "Search Results",
  flexible_native_assets: "Flexible Native Assets",
  standard_display: "Standard Display",
  high_impact: "High Impact",
  native_responsive_assets: "Native / Responsive",
};

export const GOOGLE_TIER1_SIZES = new Set([
  "300x250", "728x90", "160x600", "300x600", "320x50", "970x250",
  "1200x628", "1200x1200", "1080x1080",
]);

export const GOOGLE_TIER2_SIZES = new Set([
  "336x280", "970x90", "320x100", "300x50", "468x60", "250x250", "200x200",
  "320x480", "480x320", "960x1200", "1200x1500", "600x314", "1080x1920",
  "930x180", "980x120", "120x600", "300x1050", "300x60",
  "580x400", "250x360", "240x400",
]);

export const META_TIER1_SIZES = new Set(["1080x1080", "1080x1350", "1080x1920"]);
export const META_TIER2_SIZES = new Set(["1200x628", "1200x1200", "600x600", "1920x1080", "600x314"]);

export const PROGRAMMATIC_LOW_AVAILABILITY_SIZES = new Set([
  "234x60", "120x240", "125x125", "120x60", "300x1050",
  "468x60", "200x200", "580x400", "250x360", "240x400",
]);

export function getFlatPlatformSizes(platform) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS[platform];
  if (!groups) return [];
  return [...new Set(Object.values(groups).flat())];
}

export function getAllKnownCreativeSizes() {
  return Object.keys(SIZE_INTELLIGENCE);
}

export function isKnownCreativeSize(size) {
  return Boolean(SIZE_INTELLIGENCE[size]);
}
