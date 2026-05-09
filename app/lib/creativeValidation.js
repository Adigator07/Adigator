export const DSP_PARTNERS = [
  "DV360",
  "The Trade Desk",
  "Xandr",
  "Yahoo DSP",
  "Amazon DSP",
  "StackAdapt",
  "Basis",
];

export const SUPPORTED_DISPLAY_SIZE_GROUPS = {
  desktop: [
    "300x250",
    "336x280",
    "728x90",
    "970x90",
    "970x250",
    "160x600",
    "300x600",
    "468x60",
    "250x250",
    "200x200",
  ],
  mobile: ["320x50", "320x100", "300x250", "300x50", "320x480", "480x320"],
  native: ["1200x628", "1080x1080", "1080x1350", "1200x1200"],
};

const HIGH_IMPACT_SIZES = new Set(["970x250", "300x600"]);
const LEGACY_SIZES = new Set(["468x60", "200x200"]);

const SIZE_INTELLIGENCE = {
  "300x250": {
    label: "Medium Rectangle",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop + Mobile",
    inventoryCategory: "Universal Inventory",
    inventoryScore: 96,
    auctionReadinessScore: 95,
    premiumEligible: true,
    iabCompatibility: "IAB Core Display",
  },
  "336x280": {
    label: "Large Rectangle",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "High Inventory",
    inventoryScore: 90,
    auctionReadinessScore: 89,
    premiumEligible: true,
    iabCompatibility: "IAB Core Display",
  },
  "728x90": {
    label: "Leaderboard",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "Strong Inventory",
    inventoryScore: 88,
    auctionReadinessScore: 90,
    premiumEligible: true,
    iabCompatibility: "IAB Core Display",
  },
  "970x90": {
    label: "Large Leaderboard",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "Premium Inventory",
    inventoryScore: 84,
    auctionReadinessScore: 86,
    premiumEligible: true,
    iabCompatibility: "IAB High-Impact Display",
  },
  "970x250": {
    label: "Billboard",
    group: "desktop",
    placementType: "high-impact",
    deviceClassification: "Desktop",
    inventoryCategory: "Premium Inventory",
    inventoryScore: 82,
    auctionReadinessScore: 88,
    premiumEligible: true,
    iabCompatibility: "IAB High-Impact Display",
  },
  "160x600": {
    label: "Wide Skyscraper",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "Strong Inventory",
    inventoryScore: 84,
    auctionReadinessScore: 85,
    premiumEligible: false,
    iabCompatibility: "IAB Core Display",
  },
  "300x600": {
    label: "Half Page",
    group: "desktop",
    placementType: "high-impact",
    deviceClassification: "Desktop",
    inventoryCategory: "Premium Inventory",
    inventoryScore: 81,
    auctionReadinessScore: 87,
    premiumEligible: true,
    iabCompatibility: "IAB High-Impact Display",
  },
  "468x60": {
    label: "Banner",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "Legacy Inventory",
    inventoryScore: 61,
    auctionReadinessScore: 62,
    premiumEligible: false,
    iabCompatibility: "IAB Legacy Display",
  },
  "250x250": {
    label: "Square",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop + Mobile",
    inventoryCategory: "Limited Inventory",
    inventoryScore: 66,
    auctionReadinessScore: 69,
    premiumEligible: false,
    iabCompatibility: "IAB Display",
  },
  "200x200": {
    label: "Small Square",
    group: "desktop",
    placementType: "desktop",
    deviceClassification: "Desktop",
    inventoryCategory: "Legacy Inventory",
    inventoryScore: 56,
    auctionReadinessScore: 58,
    premiumEligible: false,
    iabCompatibility: "IAB Legacy Display",
  },
  "320x50": {
    label: "Mobile Banner",
    group: "mobile",
    placementType: "mobile",
    deviceClassification: "Mobile",
    inventoryCategory: "Mobile-First Inventory",
    inventoryScore: 95,
    auctionReadinessScore: 93,
    premiumEligible: false,
    iabCompatibility: "IAB Mobile Display",
  },
  "320x100": {
    label: "Large Mobile Banner",
    group: "mobile",
    placementType: "mobile",
    deviceClassification: "Mobile",
    inventoryCategory: "High Inventory",
    inventoryScore: 89,
    auctionReadinessScore: 88,
    premiumEligible: false,
    iabCompatibility: "IAB Mobile Display",
  },
  "300x50": {
    label: "Mobile Banner",
    group: "mobile",
    placementType: "mobile",
    deviceClassification: "Mobile",
    inventoryCategory: "Mobile-First Inventory",
    inventoryScore: 87,
    auctionReadinessScore: 84,
    premiumEligible: false,
    iabCompatibility: "IAB Mobile Display",
  },
  "320x480": {
    label: "Mobile Interstitial",
    group: "mobile",
    placementType: "mobile",
    deviceClassification: "Mobile",
    inventoryCategory: "Limited Inventory",
    inventoryScore: 64,
    auctionReadinessScore: 70,
    premiumEligible: true,
    iabCompatibility: "IAB Mobile Display",
  },
  "480x320": {
    label: "Mobile Interstitial Landscape",
    group: "mobile",
    placementType: "mobile",
    deviceClassification: "Mobile",
    inventoryCategory: "Limited Inventory",
    inventoryScore: 61,
    auctionReadinessScore: 66,
    premiumEligible: false,
    iabCompatibility: "IAB Mobile Display",
  },
  "1200x628": {
    label: "Native Landscape",
    group: "native",
    placementType: "native",
    deviceClassification: "Desktop + Mobile",
    inventoryCategory: "High Inventory",
    inventoryScore: 88,
    auctionReadinessScore: 87,
    premiumEligible: true,
    iabCompatibility: "Native / Feed Display",
  },
  "1080x1080": {
    label: "Native Square",
    group: "native",
    placementType: "native",
    deviceClassification: "Desktop + Mobile",
    inventoryCategory: "Strong Inventory",
    inventoryScore: 83,
    auctionReadinessScore: 85,
    premiumEligible: true,
    iabCompatibility: "Native / Feed Display",
  },
  "1080x1350": {
    label: "Native Portrait",
    group: "native",
    placementType: "native",
    deviceClassification: "Mobile",
    inventoryCategory: "Strong Inventory",
    inventoryScore: 81,
    auctionReadinessScore: 86,
    premiumEligible: true,
    iabCompatibility: "Native / Feed Display",
  },
  "1200x1200": {
    label: "Native Square Large",
    group: "native",
    placementType: "native",
    deviceClassification: "Desktop + Mobile",
    inventoryCategory: "Strong Inventory",
    inventoryScore: 80,
    auctionReadinessScore: 82,
    premiumEligible: true,
    iabCompatibility: "Native / Feed Display",
  },
};

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

export async function validateCreativeAsset({ file, image, platform }) {
  const size = `${image?.width || 0}x${image?.height || 0}`;
  const normalizedPlatform = platform || "programmatic";
  const supportedSizes = [
    ...SUPPORTED_DISPLAY_SIZE_GROUPS.desktop,
    ...SUPPORTED_DISPLAY_SIZE_GROUPS.mobile,
    ...SUPPORTED_DISPLAY_SIZE_GROUPS.native,
  ];
  const issues = [];
  const intelligence = resolveSizeIntelligence(size);

  if (!supportedSizes.includes(size) || !intelligence) {
    issues.push({
      type: "inventory",
      severity: "high",
      message: `${size} is outside the supported display programmatic size matrix.`,
      recommendation: "Use a supported Desktop, Mobile, or Native display size from the Supported Display Sizes section.",
      scorePenalty: 40,
    });
  }

  if ((file?.size || 0) > 5 * 1024 * 1024) {
    issues.push({
      type: "weight",
      severity: "medium",
      message: "File size is larger than 5MB.",
      recommendation: "Compress the asset before uploading for faster review and delivery.",
      scorePenalty: 12,
    });
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

  return {
    valid: issues.every((issue) => issue.severity !== "high"),
    score,
    issues,
    status: normalizeStatus(issues),
    size,
    platform: normalizedPlatform,
    supportedSizes,
    supportedSizeGroups: SUPPORTED_DISPLAY_SIZE_GROUPS,
    intelligence: intelligence || {
      size,
      sizeLabel: "Unsupported Size",
      placementType: "unsupported",
      sizeGroup: "unsupported",
      deviceClassification: "Unsupported",
      iabCompatibility: {
        compatible: false,
        standard: "Not in supported matrix",
        message: `${size} is not currently in the supported display programmatic matrix.`,
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
  };
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