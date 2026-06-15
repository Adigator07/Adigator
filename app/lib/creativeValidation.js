import { SIZE_TOLERANCE_PX, formatCreativeSize, readImageDimensionsFromBlob } from "./imageDimensions";
import { enrichIssuesWithFixActions } from "./creativeFixActions";
import {
  SIZE_INTELLIGENCE,
  SUPPORTED_DISPLAY_SIZE_GROUPS,
  PLATFORM_SUPPORTED_SIZE_GROUPS,
  PROGRAMMATIC_NATIVE_RESPONSIVE_SIZES,
  GOOGLE_TIER1_SIZES,
  GOOGLE_TIER2_SIZES,
  META_TIER1_SIZES,
  META_TIER2_SIZES,
  PROGRAMMATIC_LOW_AVAILABILITY_SIZES,
  PLATFORM_SIZE_GROUP_LABELS,
  getFlatPlatformSizes,
  getAllKnownCreativeSizes,
} from "./creativeSizeRegistry";

export {
  formatCreativeSize,
  normalizeCreativeDimensions,
  readImageDimensionsFromBlob,
  readImageDimensionsFromBuffer,
} from "./imageDimensions";

export {
  SUPPORTED_DISPLAY_SIZE_GROUPS,
  PLATFORM_SUPPORTED_SIZE_GROUPS,
  PROGRAMMATIC_NATIVE_RESPONSIVE_SIZES,
  PLATFORM_SIZE_GROUP_LABELS,
  getFlatPlatformSizes,
  getAllKnownCreativeSizes,
} from "./creativeSizeRegistry";

export const DSP_PARTNERS = [
  "DV360",
  "The Trade Desk",
  "Xandr",
  "Yahoo DSP",
  "Amazon DSP",
  "StackAdapt",
  "Basis",
];

const GOOGLE_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/zip",
]);

const META_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
]);

function parseSize(size) {
  const [width, height] = String(size || "").split("x").map((n) => Number(n));
  if (!width || !height) return null;
  return { width, height };
}

function classifyGoogleSizeTier(size) {
  if (GOOGLE_TIER1_SIZES.has(size)) return "tier1";
  if (GOOGLE_TIER2_SIZES.has(size)) return "tier2";
  return "non_core";
}

function classifyInventoryType(intelligence) {
  if (!intelligence) return "Unsupported";
  if (intelligence.inventory?.category === "Premium Inventory") return "Premium Inventory";
  if (intelligence.deviceClassification === "Desktop + Mobile") return "Universal Inventory";
  if (intelligence.deviceClassification === "Mobile") return "Mobile Inventory";
  if (intelligence.deviceClassification === "Desktop") return "Desktop Inventory";
  return "Standard Inventory";
}

function evaluateGoogleRdaFit(size) {
  const dims = parseSize(size);
  if (!dims) {
    return {
      class: "unsupported",
      message: "Unable to evaluate Responsive Display fit due to invalid dimensions.",
      satisfiesMinimum: false,
    };
  }

  const ratio = dims.width / dims.height;
  const isLandscape = ratio >= 1.85 && ratio <= 1.98;
  const isSquare = ratio >= 0.95 && ratio <= 1.05;
  const isVertical = ratio >= 0.72 && ratio <= 0.85;

  if (isLandscape) {
    const minPass = dims.width >= 600 && dims.height >= 314;
    return {
      class: "rda_landscape",
      message: minPass
        ? "Landscape RDA-compatible asset (1.91:1) with minimum dimension compliance."
        : "Landscape-like asset but below minimum RDA requirement (600x314).",
      satisfiesMinimum: minPass,
    };
  }

  if (isSquare) {
    const minPass = dims.width >= 300 && dims.height >= 300;
    return {
      class: "rda_square",
      message: minPass
        ? "Square RDA-compatible asset (1:1) with minimum dimension compliance."
        : "Square-like asset but below minimum RDA requirement (300x300).",
      satisfiesMinimum: minPass,
    };
  }

  if (isVertical) {
    return {
      class: "rda_vertical_optional",
      message: "Vertical mobile-first ratio detected. Useful for optional responsive inventory expansion.",
      satisfiesMinimum: true,
    };
  }

  return {
    class: "uploaded_banner",
    message: "Asset best treated as uploaded banner inventory instead of canonical RDA ratio.",
    satisfiesMinimum: true,
  };
}

const HIGH_IMPACT_SIZES = new Set(SUPPORTED_DISPLAY_SIZE_GROUPS.high_impact);
const LEGACY_SIZES = new Set(SUPPORTED_DISPLAY_SIZE_GROUPS.legacy);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDspSupportForSize(size, inventoryCategory) {
  if (inventoryCategory === "Legacy Inventory") {
    return ["DV360", "Xandr", "Basis"];
  }

  if (inventoryCategory === "Limited Inventory") {
    return ["DV360", "The Trade Desk", "Xandr", "Yahoo DSP", "StackAdapt", "Basis"];
  }

  if (HIGH_IMPACT_SIZES.has(size)) {
    return ["DV360", "The Trade Desk", "Xandr", "Yahoo DSP", "Amazon DSP", "StackAdapt"];
  }

  return [...DSP_PARTNERS];
}

function getCoverageLabel(dspCount) {
  if (dspCount >= 7) return "Excellent DSP support";
  if (dspCount >= 6) return "Strong DSP support";
  if (dspCount >= 4) return "Moderate DSP support";
  return "Limited DSP support";
}

function getAuctionBand(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Watchlist";
  return "Challenging";
}

function resolveSizeIntelligence(size) {
  const base = SIZE_INTELLIGENCE[size];
  if (!base) return null;

  const dspSupported = getDspSupportForSize(size, base.inventoryCategory);
  const coverage = getCoverageLabel(dspSupported.length);

  return {
    size,
    sizeLabel: base.label,
    sizeGroup: base.group,
    placementType: base.placementType,
    deviceClassification: base.deviceClassification,
    iabCompatibility: {
      compatible: true,
      standard: base.iabCompatibility,
      message: `${size} (${base.label}) is a valid programmatic display placement.`,
    },
    dspCompatibility: {
      supported: dspSupported,
      count: dspSupported.length,
      coverage,
    },
    inventory: {
      category: base.inventoryCategory,
      score: base.inventoryScore,
      message: `${base.inventoryCategory} for display programmatic buying.`,
    },
    auctionReadiness: {
      score: base.auctionReadinessScore,
      band: getAuctionBand(base.auctionReadinessScore),
      message: `${getAuctionBand(base.auctionReadinessScore)} auction readiness for this format.`,
    },
    premiumPlacement: {
      eligible: base.premiumEligible,
      label: base.premiumEligible ? "Premium Inventory Eligible" : "Standard Inventory Eligible",
      message: base.premiumEligible
        ? "Format is frequently accepted in premium and high-CPM placements."
        : "Format is broadly accepted in standard inventory packages.",
    },
    responsiveCompatibility:
      base.deviceClassification === "Desktop + Mobile"
        ? "Cross-device compatible"
        : base.deviceClassification === "Mobile"
          ? "Mobile optimized"
          : "Desktop optimized",
  };
}

function normalizeStatus(issues) {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
}

function withinTolerance(a, b, tolerance = SIZE_TOLERANCE_PX) {
  return Math.abs(a - b) <= tolerance;
}

/** Match raw pixel dimensions to a platform-supported canonical size (with tolerance). */
export function matchPlatformSupportedSize(rawWidth, rawHeight, platform) {
  const rawW = Math.max(1, Math.round(Number(rawWidth) || 0));
  const rawH = Math.max(1, Math.round(Number(rawHeight) || 0));
  const platformGroups = PLATFORM_SUPPORTED_SIZE_GROUPS[platform] || PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;
  const supportedSizes = [...new Set(Object.values(platformGroups).flat())];

  let best = null;
  let bestDistance = Infinity;

  for (const candidate of supportedSizes) {
    const dims = parseSize(candidate);
    if (!dims) continue;

    const orientations = [{ w: dims.width, h: dims.height, swapped: false }];

    for (const orientation of orientations) {
      if (!withinTolerance(rawW, orientation.w) || !withinTolerance(rawH, orientation.h)) continue;

      const distance = Math.abs(rawW - orientation.w) + Math.abs(rawH - orientation.h);
      if (distance >= bestDistance) continue;

      let matchType = "tolerance";
      if (rawW === dims.width && rawH === dims.height) {
        matchType = "exact";
      } else if (orientation.swapped && (rawW !== dims.width || rawH !== dims.height)) {
        matchType = "orientation";
      } else if (distance === 0) {
        matchType = "exact";
      }

      bestDistance = distance;
      best = {
        match: candidate,
        type: matchType,
        detectedSize: `${rawW}x${rawH}`,
      };
    }
  }

  return best;
}

function isSizeSupportedForPlatform(size, platform, intelligence) {
  const platformGroups = PLATFORM_SUPPORTED_SIZE_GROUPS[platform] || PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;
  const supportedSizes = [...new Set(Object.values(platformGroups).flat())];
  if (!supportedSizes.includes(size)) return false;
  if (platform === "programmatic") return Boolean(intelligence);
  return true;
}

function buildUnsupportedSizeIssue(size, platformLabel) {
  return {
    type: "inventory",
    severity: "high",
    message: `${size} is outside the supported ${platformLabel} size matrix.`,
    recommendation: `Use a supported size from the ${platformLabel} intelligence matrix.`,
    scorePenalty: 40,
  };
}

function isNativeOrResponsiveSize(size, intelligence) {
  if (intelligence?.sizeGroup === "native" || intelligence?.placementType === "native") return true;
  const nativeSizes = new Set([
    ...PROGRAMMATIC_NATIVE_RESPONSIVE_SIZES,
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.native || []),
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.responsive_native || []),
    "1080x1350", "1080x1920", "1920x1080",
  ]);
  return nativeSizes.has(size);
}

function isStandardDisplayBanner(size, intelligence) {
  if (intelligence?.sizeGroup === "desktop" || intelligence?.sizeGroup === "mobile" || intelligence?.sizeGroup === "tablet") return true;
  if (intelligence?.placementType === "desktop" || intelligence?.placementType === "mobile") return true;
  const bannerSizes = new Set([
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.desktop || []),
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.mobile || []),
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.tablet || []),
    ...(SUPPORTED_DISPLAY_SIZE_GROUPS.companion || []),
  ]);
  return bannerSizes.has(size);
}

function buildFileWeightIssues(file, platform, size, intelligence) {
  const fileSize = file?.size || 0;
  if (!fileSize) return [];

  const fileMime = String(file?.type || "").toLowerCase();
  const isNative = isNativeOrResponsiveSize(size, intelligence);
  const isBanner = isStandardDisplayBanner(size, intelligence);

  if (platform === "meta_ads") {
    if (fileMime.startsWith("image/") && fileSize > 30 * 1024 * 1024) {
      return [{
        type: "meta_weight",
        severity: "high",
        message: "Image exceeds Meta image size limit (30MB).",
        recommendation: "Compress image below 30MB and optimize for mobile loading speed.",
        scorePenalty: 26,
      }];
    }
    if (fileMime.startsWith("image/") && fileSize > 5 * 1024 * 1024) {
      return [{
        type: "mobile_delivery",
        severity: "medium",
        message: "Heavy image payload may reduce mobile-first engagement and thumb-stop performance.",
        recommendation: "Export lighter assets for faster in-feed render and stronger first-second retention.",
        scorePenalty: 10,
      }];
    }
    return [];
  }

  if (isBanner && fileSize > 150 * 1024) {
    return [{
      type: "weight",
      severity: "high",
      message: "File size exceeds the 150KB limit for standard display banners.",
      recommendation: "Compress the creative to 150KB or below before analysis.",
      scorePenalty: 30,
    }];
  }

  if (isNative) {
    if (fileSize > 5 * 1024 * 1024) {
      return [{
        type: "weight",
        severity: "high",
        message: "Native asset exceeds 5MB — may fail upload or slow delivery on some platforms.",
        recommendation: "Compress the native creative below 5MB while preserving legibility.",
        scorePenalty: 22,
      }];
    }
    if (fileSize > 150 * 1024) {
      return [{
        type: "weight",
        severity: "medium",
        message: "Native asset exceeds 150KB banner guidance but is within typical native export range.",
        recommendation: "Optional: compress further for faster load; most native placements accept larger files.",
        scorePenalty: 5,
      }];
    }
    return [];
  }

  if (platform === "google_ads" && fileSize > 5120 * 1024) {
    return [{
      type: "google_weight",
      severity: "medium",
      message: "Asset exceeds 5MB — may fail Google Ads upload limits for some formats.",
      recommendation: "Compress toward 150KB for banners or under 5MB for responsive/native assets.",
      scorePenalty: 12,
    }];
  }

  if (fileSize > 150 * 1024) {
    return [{
      type: "weight",
      severity: platform === "programmatic" && !isBanner ? "medium" : "high",
      message: platform === "programmatic"
        ? "File size exceeds 150KB display guidance — may affect viewability scores."
        : "File size exceeds the required 150KB limit.",
      recommendation: "Compress the creative to 150KB or below for optimal display delivery.",
      scorePenalty: platform === "programmatic" ? 12 : 30,
    }];
  }

  return [];
}

export async function validateCreativeAsset({ file, image, platform }) {
  const rawW = Math.max(1, Math.round(Number(image?.width) || 0));
  const rawH = Math.max(1, Math.round(Number(image?.height) || 0));
  const actualSize = `${rawW}x${rawH}`;
  const normalizedPlatform = platform || "programmatic";
  const platformLabel = normalizedPlatform === "google_ads"
    ? "Google Ads"
    : normalizedPlatform === "meta_ads"
      ? "Meta Ads"
      : "Programmatic";
  const platformGroups = PLATFORM_SUPPORTED_SIZE_GROUPS[normalizedPlatform] || PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;
  const supportedSizes = [...new Set(Object.values(platformGroups).flat())];
  const sizeMatch = matchPlatformSupportedSize(rawW, rawH, normalizedPlatform);
  const canonicalSize = sizeMatch?.match || actualSize;
  const size = actualSize;
  const issues = [];
  const intelligence = resolveSizeIntelligence(canonicalSize);
  const fileMime = String(file?.type || "").toLowerCase();
  const rdaFit = normalizedPlatform === "google_ads" ? evaluateGoogleRdaFit(canonicalSize) : null;
  const googleSizeTier = normalizedPlatform === "google_ads" ? classifyGoogleSizeTier(canonicalSize) : null;
  const metaPlacement = normalizedPlatform === "meta_ads" ? classifyMetaPlacement(canonicalSize) : null;
  const metaSafeZone = normalizedPlatform === "meta_ads" ? evaluateMetaSafeZoneRisk(canonicalSize) : null;

  if (!sizeMatch) {
    issues.push(buildUnsupportedSizeIssue(actualSize, platformLabel));
  } else if (normalizedPlatform === "programmatic" && !intelligence) {
    issues.push(buildUnsupportedSizeIssue(actualSize, platformLabel));
  }

  issues.push(...buildFileWeightIssues(file, normalizedPlatform, canonicalSize, intelligence));

  if (sizeMatch && sizeMatch.type === "orientation" && sizeMatch.detectedSize !== canonicalSize) {
    issues.push({
      type: "dimension_normalization",
      severity: "medium",
      message: `Detected ${sizeMatch.detectedSize} — orientation matches supported ${canonicalSize}.`,
      recommendation: "Re-export with embedded orientation or use the canonical dimensions for placement matching.",
      scorePenalty: 0,
    });
  } else if (sizeMatch && sizeMatch.type === "tolerance" && sizeMatch.detectedSize !== canonicalSize) {
    issues.push({
      type: "dimension_normalization",
      severity: "medium",
      message: `Detected ${sizeMatch.detectedSize} — within export tolerance of supported ${canonicalSize}.`,
      recommendation: "Dimensions are accepted; re-export at exact pixel size if your ad server requires it.",
      scorePenalty: 0,
    });
  }

  if (normalizedPlatform === "google_ads") {
    if (fileMime && !GOOGLE_ALLOWED_MIME_TYPES.has(fileMime)) {
      issues.push({
        type: "format",
        severity: "high",
        message: `${fileMime} is not in the Google uploaded display support set (JPG, PNG, GIF, ZIP/HTML5).`,
        recommendation: "Upload JPG, PNG, GIF, or ZIP (HTML5 package) for Google display ecosystem compliance.",
        scorePenalty: 35,
      });
    }

    const isStandardBanner = (intelligence?.sizeGroup === "desktop" || intelligence?.sizeGroup === "mobile") && rdaFit?.class === "uploaded_banner";
    if (isStandardBanner && (file?.size || 0) > 150 * 1024) {
      issues.push({
        type: "google_weight",
        severity: "medium",
        message: "Banner payload is above 150KB guidance and may reduce viewability and load-speed competitiveness.",
        recommendation: "Compress image/HTML5 payload toward 150KB for stronger Google Display delivery quality.",
        scorePenalty: 10,
      });
    }

    if (rdaFit && !rdaFit.satisfiesMinimum && !isNativeOrResponsiveSize(canonicalSize, intelligence)) {
      issues.push({
        type: "rda",
        severity: "high",
        message: "Responsive Display asset does not meet minimum ratio dimension requirements.",
        recommendation: "Use at least 600x314 for landscape or 300x300 for square responsive assets.",
        scorePenalty: 28,
      });
    }
  }

  if (normalizedPlatform === "meta_ads") {
    if (fileMime && !META_ALLOWED_MIME_TYPES.has(fileMime)) {
      issues.push({
        type: "format",
        severity: "high",
        message: `${fileMime} is not supported — display/image creatives only (JPG, PNG, GIF).`,
        recommendation: "Upload a static image creative in JPG, PNG, or GIF format.",
        scorePenalty: 35,
      });
    }

    if (metaPlacement === "non_core") {
      issues.push({
        type: "placement_fit",
        severity: "medium",
        message: `${canonicalSize} is non-core for Meta feed/story/reels placements in V1.`,
        recommendation: "Prefer 1080x1080, 1080x1350, 1080x1920, or 1200x628 for stronger Meta placement compatibility.",
        scorePenalty: 8,
      });
    }

    if (metaSafeZone?.riskLevel === "high") {
      issues.push({
        type: "safe_zone",
        severity: "medium",
        message: "High Meta overlay risk: critical content may collide with CTA/profile/caption UI.",
        recommendation: "Move core text/logo toward center-safe zone and avoid edge-dependent messaging.",
        scorePenalty: 8,
      });
    }
  }

  if (intelligence?.sizeGroup === "mobile" && (file?.size || 0) > 2 * 1024 * 1024) {
    issues.push({
      type: "delivery",
      severity: "medium",
      message: "Mobile asset file size is heavy for auction delivery speed.",
      recommendation: "Reduce payload for faster mobile rendering and stronger auction win-rate.",
      scorePenalty: 8,
    });
  }

  const score = clamp(100 - issues.reduce((sum, issue) => sum + (issue.scorePenalty || 0), 0), 0, 100);
  const enrichedIssues = enrichIssuesWithFixActions(issues, normalizedPlatform);

  return {
    valid: enrichedIssues.every((issue) => issue.severity !== "high"),
    score,
    issues: enrichedIssues,
    status: normalizeStatus(enrichedIssues),
    size,
    canonicalSize,
    sizeMatch,
    dimensions: {
      width: rawW,
      height: rawH,
      detectedWidth: rawW,
      detectedHeight: rawH,
      canonicalWidth: parseSize(canonicalSize)?.width || rawW,
      canonicalHeight: parseSize(canonicalSize)?.height || rawH,
      normalized: Boolean(sizeMatch && sizeMatch.detectedSize !== canonicalSize),
      normalizationReason: sizeMatch?.type || null,
    },
    platform: normalizedPlatform,
    supportedSizes,
    supportedSizeGroups: platformGroups,
    intelligence: intelligence || {
      size,
      sizeLabel: "Unsupported Size",
      placementType: "unsupported",
      sizeGroup: "unsupported",
      deviceClassification: "Unsupported",
      iabCompatibility: {
        compatible: false,
        standard: "Not in supported matrix",
        message: `${size} is not currently in the supported ${platformLabel} matrix.`,
      },
      dspCompatibility: {
        supported: [],
        count: 0,
        coverage: "No DSP support",
      },
      inventory: {
        category: "Unsupported",
        score: 0,
        message: "No reliable inventory availability for this size in current matrix.",
      },
      auctionReadiness: {
        score: 0,
        band: "Not Eligible",
        message: "Unsupported size for production auction strategy.",
      },
      premiumPlacement: {
        eligible: false,
        label: "Not Eligible",
        message: "Unsupported size is not eligible for premium placement packages.",
      },
      responsiveCompatibility: "Unsupported",
    },
    googleStandards: normalizedPlatform === "google_ads"
      ? {
        ecosystemFocus: ["responsive_display_ads", "uploaded_banner_ads"],
        fileFormat: {
          mimeType: fileMime || "unknown",
          supported: !fileMime || GOOGLE_ALLOWED_MIME_TYPES.has(fileMime),
          acceptedFormats: ["image/jpeg", "image/png", "image/gif", "application/zip"],
        },
        inventoryType: classifyInventoryType(intelligence),
        sizeTier: googleSizeTier,
        responsiveDisplayFit: rdaFit,
      }
      : null,
    metaStandards: normalizedPlatform === "meta_ads"
      ? {
        ecosystemFocus: ["feed_ads", "story_image_ads", "reels_image_ads", "carousel_ads"],
        fileFormat: {
          mimeType: fileMime || "unknown",
          supported: !fileMime || META_ALLOWED_MIME_TYPES.has(fileMime),
          acceptedFormats: ["image/jpeg", "image/png", "image/gif"],
        },
        sizeTier: META_TIER1_SIZES.has(size) ? "tier1" : META_TIER2_SIZES.has(size) ? "tier2" : "non_core",
        placementProfile: metaPlacement,
        safeZone: metaSafeZone,
      }
      : null,
  };
}

export function finalizeValidationForPlatform(validation, platform, size) {
  if (platform !== "programmatic" || !PROGRAMMATIC_LOW_AVAILABILITY_SIZES.has(size)) {
    return validation;
  }

  const lowAvailabilityIssue = {
    type: "technical",
    severity: "medium",
    message: `${size} is valid but often has lower fill in open programmatic inventory.`,
    recommendation: "Keep this size if required, but prioritize 300x250, 336x280, 728x90, 970x250, or 300x600 for broader scale.",
    scorePenalty: 5,
  };
  const issues = [...(validation?.issues || []), lowAvailabilityIssue];
  return {
    ...validation,
    issues,
    status: normalizeStatus(issues),
    valid: issues.every((issue) => issue.severity !== "high"),
  };
}

function applyValidationFields(creative, validation) {
  return {
    ...creative,
    validation,
    valid: validation.valid && validation.status !== "CRITICAL",
    placementType: validation.intelligence?.placementType,
    deviceClassification: validation.intelligence?.deviceClassification,
    iabCompatibility: validation.intelligence?.iabCompatibility,
    dspCompatibility: validation.intelligence?.dspCompatibility,
    inventoryAvailability: validation.intelligence?.inventory,
    auctionReadiness: validation.intelligence?.auctionReadiness,
    premiumPlacementPotential: validation.intelligence?.premiumPlacement,
  };
}

function resolveCreativeImageDimensions(creative, imageOverride) {
  if (imageOverride?.width && imageOverride?.height) {
    return {
      width: Math.round(imageOverride.width),
      height: Math.round(imageOverride.height),
    };
  }

  const sourceW = Number(creative?.sourceWidth);
  const sourceH = Number(creative?.sourceHeight);
  if (sourceW > 0 && sourceH > 0) {
    return { width: sourceW, height: sourceH };
  }

  const detectedW = Number(creative?.validation?.dimensions?.detectedWidth);
  const detectedH = Number(creative?.validation?.dimensions?.detectedHeight);
  if (detectedW > 0 && detectedH > 0) {
    return { width: detectedW, height: detectedH };
  }

  const dims = parseSize(creative?.size);
  if (!dims) return null;
  return dims;
}

export function attachSourceDimensions(creative, width, height) {
  const size = formatCreativeSize(width, height);
  return {
    ...creative,
    size,
    sourceCreativeSize: size,
    sourceWidth: Math.round(width),
    sourceHeight: Math.round(height),
  };
}

export async function revalidateCreativeForPlatform(creative, platform, options = {}) {
  if (!platform) return creative;

  const dims = resolveCreativeImageDimensions(creative, options.image);
  if (!dims) return creative;

  const size = formatCreativeSize(dims.width, dims.height);
  const baseValidation = await validateCreativeAsset({
    file: creative.mimeType
      ? { type: creative.mimeType, size: Number(creative.fileSizeBytes || 0) }
      : null,
    image: { width: dims.width, height: dims.height },
    platform,
  });
  const validation = finalizeValidationForPlatform(baseValidation, platform, size);
  return applyValidationFields(
    attachSourceDimensions(creative, dims.width, dims.height),
    validation,
  );
}

export async function revalidateCreativesForPlatform(creatives, platform, options = {}) {
  if (!Array.isArray(creatives) || !creatives.length || !platform) return creatives || [];
  const resolveImage = options.resolveImage;
  if (typeof resolveImage === "function") {
    return Promise.all(creatives.map(async (creative) => {
      const image = await resolveImage(creative);
      return revalidateCreativeForPlatform(creative, platform, { image });
    }));
  }
  return Promise.all(creatives.map((creative) => revalidateCreativeForPlatform(creative, platform, options)));
}

export function buildValidationSummary(validations = []) {
  const issueList = validations.flatMap((validation) => validation?.issues || []);
  const auctionScores = validations
    .map((validation) => validation?.intelligence?.auctionReadiness?.score)
    .filter((score) => typeof score === "number");
  const premiumEligibleCount = validations.filter(
    (validation) => validation?.intelligence?.premiumPlacement?.eligible
  ).length;
  const criticalCount = issueList.filter((issue) => issue.severity === "high").length;
  const warningCount = issueList.filter((issue) => issue.severity === "medium").length;
  const totalPenalty = issueList.reduce((sum, issue) => sum + (issue.scorePenalty || 0), 0);

  return {
    totalIssues: issueList.length,
    criticalCount,
    warningCount,
    inventoryImpactScore: clamp(100 - totalPenalty, 0, 100),
    averageAuctionReadiness: auctionScores.length
      ? Math.round(auctionScores.reduce((sum, score) => sum + score, 0) / auctionScores.length)
      : 0,
    premiumEligibleCount,
  };
}

function classifyMetaPlacement(size) {
  if (size === "1080x1920") return "stories_reels";
  if (size === "1080x1350") return "feed_mobile_4_5";
  if (size === "1080x1080" || size === "600x600") return "feed_carousel_square";
  if (size === "1200x628" || size === "600x314") return "feed_landscape";
  if (size === "1920x1080") return "audience_network_landscape";
  if (size === "1200x1200" || size === "960x1200" || size === "1200x1500") return "native_assets";
  return "non_core";
}

function evaluateMetaSafeZoneRisk(size) {
  const dims = parseSize(size);
  if (!dims) {
    return {
      riskLevel: "high",
      message: "Unable to calculate Meta safe-zone reliability due to invalid dimensions.",
      overlays: ["cta_overlay", "caption_zone", "profile_ui"],
    };
  }

  const ratio = dims.width / dims.height;
  const isVertical = ratio >= 0.55 && ratio <= 0.57;
  const isSquare = ratio >= 0.95 && ratio <= 1.05;
  const isFeed45 = ratio >= 0.79 && ratio <= 0.81;

  if (isVertical) {
    return {
      riskLevel: "medium",
      message: "Story/Reels format detected. Keep critical text/logo in center-safe zone to avoid top/bottom UI overlay collisions.",
      overlays: ["top_profile_bar", "bottom_cta_zone", "caption_overlay"],
    };
  }

  if (isFeed45 || isSquare) {
    return {
      riskLevel: "low",
      message: "Feed-friendly ratio detected with stronger safe-area stability for primary message and CTA visibility.",
      overlays: ["feed_caption_truncation", "cta_button_overlay"],
    };
  }

  return {
    riskLevel: "medium",
    message: "Non-core Meta ratio. Dynamic crops may affect logo/text edges across placements.",
    overlays: ["dynamic_crop_edges", "cta_overlay"],
  };
}