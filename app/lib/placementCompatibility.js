/**
 * Platform-specific placement & device compatibility for the Analyzer Overview tab.
 * Status values: good (🟢), warning (🟡), bad (🔴)
 *
 * Scoring is driven by PREVIEW_PLACEMENT_REGISTRY compatibleSizes — the same matrix
 * used in Preview Studio — so matrix colors match actual inventory support.
 */

import {
  getCompatibleSizesForPlacement,
  isSizeCompatibleWithPlacement,
  normalizePreviewSize,
} from "./previewPlacementRegistry";

/** Overview column id → registry placement id(s) */
const OVERVIEW_PLACEMENT_REGISTRY_IDS = {
  google_ads: {
    gdn: ["gdn"],
    responsive_display: ["responsive_display"],
    demand_gen: ["demand_gen"],
    gmail: ["gmail"],
    app_inventory: ["app_inventory"],
    youtube_companion: ["youtube_companion"],
  },
  meta_ads: {
    facebook_feed: ["facebook_feed"],
    instagram_feed: ["instagram_feed"],
    stories: ["facebook_stories", "instagram_stories"],
    reels: ["facebook_reels", "instagram_reels"],
    messenger: ["messenger"],
    audience_network: ["audience_network"],
  },
  programmatic: {
    native_ads: ["native_ads"],
    display_banners: ["display_banners"],
    mobile_app: ["mobile_app_inventory"],
    open_web: ["open_web"],
  },
};

const SMALL_MOBILE_BANNERS = new Set(["320x50", "300x50", "320x100", "300x100"]);
const MOBILE_ONLY_SIZES = new Set([
  "320x50", "300x50", "320x100", "300x100", "320x480", "480x320",
]);

function applyTextDensityAdjustments(status, size, textHigh) {
  if (!textHigh || status !== "good") return status;
  const normalized = normalizePreviewSize(size);
  if (SMALL_MOBILE_BANNERS.has(normalized)) return "warning";
  if (normalized === "728x90" || normalized === "970x90") return "warning";
  return status;
}

/**
 * Score a creative size against one or more registry placements.
 * - good: exact size match in that placement's compatibleSizes list
 * - warning: not exact, but same aspect ratio as a supported size (crop possible)
 * - bad: not supported for that inventory
 */
function scoreRegistryPlacements(size, platform, registryIds, textHigh) {
  const normalized = normalizePreviewSize(size);
  if (!normalized) return "bad";

  let best = "bad";

  for (const registryId of registryIds) {
    const compatible = getCompatibleSizesForPlacement(platform, registryId);
    if (compatible.includes(normalized)) {
      return applyTextDensityAdjustments("good", normalized, textHigh);
    }

    if (isSizeCompatibleWithPlacement(normalized, platform, registryId)) {
      best = "warning";
    }
  }

  return best;
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

function googlePlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  const map = OVERVIEW_PLACEMENT_REGISTRY_IDS.google_ads;
  const scores = {};

  for (const [columnId, registryIds] of Object.entries(map)) {
    scores[columnId] = scoreRegistryPlacements(size, "google_ads", registryIds, textHigh);
  }

  return scores;
}

function googleDeviceScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  const normalized = normalizePreviewSize(size);

  if (!normalized) {
    return { mobile: "bad", desktop: "bad" };
  }

  if (MOBILE_ONLY_SIZES.has(normalized)) {
    return {
      mobile: scoreRegistryPlacements(size, "google_ads", ["mobile_display", "app_inventory"], textHigh),
      desktop: "bad",
    };
  }

  return {
    mobile: scoreRegistryPlacements(size, "google_ads", ["mobile_display", "gdn"], textHigh),
    desktop: scoreRegistryPlacements(size, "google_ads", ["gdn", "gmail"], textHigh),
  };
}

function metaPlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  const map = OVERVIEW_PLACEMENT_REGISTRY_IDS.meta_ads;
  const scores = {};

  for (const [columnId, registryIds] of Object.entries(map)) {
    scores[columnId] = scoreRegistryPlacements(size, "meta_ads", registryIds, textHigh);
  }

  return scores;
}

function programmaticPlacementScores(size, signals) {
  const textHigh = signals?.text_density === "high";
  const map = OVERVIEW_PLACEMENT_REGISTRY_IDS.programmatic;
  const scores = {};

  for (const [columnId, registryIds] of Object.entries(map)) {
    scores[columnId] = scoreRegistryPlacements(size, "programmatic", registryIds, textHigh);
  }

  return scores;
}

export function computePlacementCompatibility(creative, platform, signals) {
  const size = creative?.size || "";

  if (platform === "google_ads") return googlePlacementScores(size, signals);
  if (platform === "meta_ads") return metaPlacementScores(size, signals);
  return programmaticPlacementScores(size, signals);
}

export function computeDeviceCompatibility(creative, platform, signals = {}) {
  if (platform !== "google_ads") return null;
  return googleDeviceScores(creative?.size || "", signals);
}

/** Primary placement keys used for launch-status (best-matching inventory). */
export function getPrimaryPlacementKeys(platform, creative) {
  const scores = computePlacementCompatibility(creative, platform, {});
  const columns = getPlacementColumns(platform);

  const good = columns.filter((col) => scores[col.id] === "good").map((col) => col.id);
  if (good.length) return good.slice(0, 3);

  const warning = columns.filter((col) => scores[col.id] === "warning").map((col) => col.id);
  if (warning.length) return warning.slice(0, 2);

  return columns[0]?.id ? [columns[0].id] : [];
}

export function getPlacementLegend(platform) {
  if (platform === "google_ads") {
    return "🟢 Supported size for inventory · 🟡 same aspect ratio only (crop required) · 🔴 unsupported size";
  }
  if (platform === "meta_ads") {
    return "🟢 Supported size for placement · 🟡 crop may be required · 🔴 unsupported for that placement";
  }
  if (platform === "programmatic") {
    return "🟢 Supported size for channel · 🟡 aspect-ratio match only · 🔴 unsupported for that channel";
  }
  return "🟢 Supported · 🟡 limited / crop required · 🔴 unsupported";
}

/** Dev helper — verify matrix colors against registry for common sizes. */
export function verifyPlacementMatrix(platform, size) {
  const creative = { size };
  const scores = computePlacementCompatibility(creative, platform, {});
  const columns = getPlacementColumns(platform);
  const map = OVERVIEW_PLACEMENT_REGISTRY_IDS[platform] || {};

  return columns.map((col) => {
    const registryIds = map[col.id] || [];
    const compatibleUnion = [...new Set(registryIds.flatMap((id) => getCompatibleSizesForPlacement(platform, id)))];
    const exact = compatibleUnion.includes(normalizePreviewSize(size));
    return {
      placement: col.id,
      score: scores[col.id],
      exactMatch: exact,
    };
  });
}
