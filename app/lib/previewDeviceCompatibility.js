/**
 * Preview Studio device compatibility — platform/placement/size rules
 * before rendering mobile or desktop preview layouts.
 */

import {
  getPreviewPlacement,
  isSizeCompatibleWithPlacement,
  normalizePreviewSize,
} from "./previewPlacementRegistry";

/** Sizes that only serve on mobile inventory. */
const TRUE_MOBILE_ONLY_SIZES = new Set([
  "320x50",
  "320x100",
  "320x480",
  "480x320",
  "768x1024",
  "1080x1920",
]);

/** Sizes that only serve on desktop / large-screen inventory. */
const TRUE_DESKTOP_ONLY_SIZES = new Set([
  "728x90",
  "970x90",
  "970x250",
  "160x600",
  "300x600",
  "468x60",
]);

/** Sizes that work on both mobile and desktop for feed/native/banner placements. */
const CROSS_DEVICE_SIZES = new Set([
  "300x250",
  "336x280",
  "1200x628",
  "1080x1080",
  "1080x1350",
  "1200x1200",
  "960x1200",
  "1200x1500",
  "250x250",
  "200x200",
  "1920x1080",
  "1280x720",
]);

/** Placement-specific size overrides (placement → size → device support). */
const PLACEMENT_SIZE_DEVICE_OVERRIDES = {
  google_ads: {
    gdn: {
      "320x50": "mobile",
      "320x100": "mobile",
      "728x90": "desktop",
      "970x90": "desktop",
      "970x250": "desktop",
      "160x600": "desktop",
      "300x600": "desktop",
      "468x60": "desktop",
    },
    mobile_display: null,
    app_inventory: null,
    youtube_companion: {
      "728x90": "desktop",
      "970x90": "desktop",
      "468x60": "desktop",
      "320x50": "mobile",
      "320x100": "mobile",
    },
  },
  meta_ads: {
    facebook_stories: { "1080x1920": "mobile", "1080x1350": "mobile" },
    instagram_stories: { "1080x1920": "mobile", "1080x1350": "mobile" },
    facebook_reels: { "1080x1920": "mobile", "1080x1350": "mobile" },
    instagram_reels: { "1080x1920": "mobile", "1080x1350": "mobile" },
    instagram_feed: null,
    messenger: null,
  },
  programmatic: {
    mobile_app_inventory: null,
    display_banners: {
      "320x50": "mobile",
      "320x100": "mobile",
      "728x90": "desktop",
      "970x90": "desktop",
      "970x250": "desktop",
      "160x600": "desktop",
      "300x600": "desktop",
    },
  },
};

function parseDimensions(size) {
  const normalized = normalizePreviewSize(size);
  const [width, height] = normalized.split("x").map(Number);
  if (!width || !height) return null;
  return { size: normalized, width, height, ratio: width / height };
}

function classifySizeDeviceSupport(size) {
  if (CROSS_DEVICE_SIZES.has(size)) return "both";
  if (TRUE_MOBILE_ONLY_SIZES.has(size)) return "mobile";
  if (TRUE_DESKTOP_ONLY_SIZES.has(size)) return "desktop";

  const dims = parseDimensions(size);
  if (!dims) return "both";

  if (dims.ratio <= 0.85 || dims.height >= 1200) return "mobile";
  if (dims.width >= 700 && dims.ratio >= 2.5) return "desktop";
  if (dims.width >= 600 && dims.ratio >= 1.5) return "desktop";
  return "both";
}

export function getSizeDeviceSupport(platform, placementId, size) {
  const normalized = normalizePreviewSize(size);
  if (!normalized) return "both";

  const overrides = PLACEMENT_SIZE_DEVICE_OVERRIDES[platform]?.[placementId];
  if (overrides && overrides[normalized]) {
    return overrides[normalized];
  }

  if (overrides === null) {
    const placement = getPreviewPlacement(platform, placementId);
    const devices = placement?.devices || ["desktop", "mobile"];
    if (devices.length === 1) return devices[0];
  }

  return classifySizeDeviceSupport(normalized);
}

export function getDeviceIncompatibilityMessage(device) {
  return device === "desktop"
    ? "This creative is not supported for Desktop placements."
    : "This creative is not supported for Mobile placements.";
}

export function getDetailedDeviceIncompatibilityMessage({
  device,
  size,
  placementLabel,
  sizeSupport,
}) {
  const base = getDeviceIncompatibilityMessage(device);
  const deviceLabel = device === "desktop" ? "Desktop" : "Mobile";
  const parts = [base];

  if (size && sizeSupport && sizeSupport !== "both") {
    parts.push(`${size} is a ${sizeSupport}-first size${placementLabel ? ` for ${placementLabel}` : ""}.`);
  } else if (placementLabel) {
    parts.push(`${placementLabel} does not support ${deviceLabel} inventory for this creative.`);
  }

  parts.push(`Switch to ${device === "desktop" ? "Mobile" : "Desktop"} view or upload a compatible creative size.`);
  return parts.join(" ");
}

/**
 * Validate whether a creative can preview on the selected device for a platform placement.
 * @returns {{ supported: boolean, message: string | null, reason: string | null, sizeSupport: string }}
 */
export function validatePreviewDeviceCompatibility({
  platform,
  placementId,
  device,
  size,
}) {
  const normalized = normalizePreviewSize(size);
  const placement = getPreviewPlacement(platform, placementId);

  if (!placement) {
    return { supported: false, message: "Unknown placement.", reason: "unknown_placement", sizeSupport: "both" };
  }

  if (!normalized) {
    return {
      supported: false,
      message: "Creative dimensions are required to validate device compatibility.",
      reason: "missing_size",
      sizeSupport: "both",
    };
  }

  if (!isSizeCompatibleWithPlacement(normalized, platform, placementId)) {
    return {
      supported: false,
      message: `${normalized} is not compatible with ${placement.label}.`,
      reason: "placement_size",
      sizeSupport: "both",
    };
  }

  const placementDevices = placement.devices || ["desktop", "mobile"];
  if (!placementDevices.includes(device)) {
    return {
      supported: false,
      message: getDetailedDeviceIncompatibilityMessage({
        device,
        size: normalized,
        placementLabel: placement.label,
        sizeSupport: device === "desktop" ? "mobile" : "desktop",
      }),
      reason: "placement_device",
      sizeSupport: placementDevices.length === 1 ? placementDevices[0] : "both",
    };
  }

  const sizeSupport = getSizeDeviceSupport(platform, placementId, normalized);

  if (sizeSupport === "mobile" && device === "desktop") {
    return {
      supported: false,
      message: getDetailedDeviceIncompatibilityMessage({
        device,
        size: normalized,
        placementLabel: placement.label,
        sizeSupport: "mobile",
      }),
      reason: "size_device",
      sizeSupport: "mobile",
    };
  }

  if (sizeSupport === "desktop" && device === "mobile") {
    return {
      supported: false,
      message: getDetailedDeviceIncompatibilityMessage({
        device,
        size: normalized,
        placementLabel: placement.label,
        sizeSupport: "desktop",
      }),
      reason: "size_device",
      sizeSupport: "desktop",
    };
  }

  return { supported: true, message: null, reason: null, sizeSupport };
}

export function isCreativeSupportedOnDevice(creative, platform, placementId, device) {
  const size = creative?.sourceCreativeSize
    || creative?.size
    || creative?.validation?.size;
  return validatePreviewDeviceCompatibility({ platform, placementId, device, size }).supported;
}

export function filterSourceCreativesByDevice(sourceCreatives, platform, placementId, device) {
  if (!Array.isArray(sourceCreatives)) return [];
  return sourceCreatives.filter((creative) => isCreativeSupportedOnDevice(creative, platform, placementId, device));
}

export function getSupportedDevicesForCreative(platform, placementId, size) {
  const normalized = normalizePreviewSize(size);
  const placement = getPreviewPlacement(platform, placementId);
  const placementDevices = placement?.devices || ["desktop", "mobile"];

  return placementDevices.filter((device) => {
    const result = validatePreviewDeviceCompatibility({
      platform,
      placementId,
      device,
      size: normalized,
    });
    return result.supported;
  });
}
