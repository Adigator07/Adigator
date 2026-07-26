export const GOOGLE_DISPLAY_SIZES = [
  { width: 250, height: 250, name: "Square" },
  { width: 200, height: 200, name: "Small Square" },
  { width: 468, height: 60, name: "Banner" },
  { width: 728, height: 90, name: "Leaderboard" },
  { width: 300, height: 250, name: "Inline Rectangle" },
  { width: 336, height: 280, name: "Large Rectangle" },
  { width: 120, height: 600, name: "Skyscraper" },
  { width: 160, height: 600, name: "Wide Skyscraper" },
  { width: 300, height: 600, name: "Half-Page Ad" },
  { width: 970, height: 90, name: "Large Leaderboard" },
  { width: 970, height: 250, name: "Billboard" },
  { width: 930, height: 180, name: "Top Banner" },
  { width: 320, height: 50, name: "Mobile Banner" },
  { width: 320, height: 100, name: "Large Mobile Banner" },
  { width: 300, height: 50, name: "Small Mobile Banner" },
] as const;

export const GDN_STATIC_LIMITS = {
  max_file_size_kb: 150,
  allowed_formats: ["JPG", "PNG", "GIF", "SWF"],
  animated_gif_max_duration_seconds: 30,
  animated_gif_max_loops: 3,
} as const;

export const RDA_ASSET_REQUIREMENTS = {
  images: {
    landscape: {
      aspect_ratio: "1.91:1",
      recommended: { width: 1200, height: 628 },
      min: { width: 600, height: 314 },
      max_file_size_kb: 5120,
    },
    square: {
      aspect_ratio: "1:1",
      recommended: { width: 1200, height: 1200 },
      min: { width: 300, height: 300 },
      max_file_size_kb: 5120,
    },
    logo: {
      aspect_ratio: "1:1 or 4:1",
      square_recommended: { width: 1200, height: 1200 },
      landscape_recommended: { width: 1200, height: 300 },
      min: { width: 128, height: 128 },
      max_file_size_kb: 5120,
    },
  },
  headlines: {
    short: { max_count: 5, max_chars: 30 },
    long: { max_count: 1, max_chars: 90 },
  },
  descriptions: {
    max_count: 5,
    max_chars: 90,
  },
  business_name: { max_chars: 25 },
  final_url: { required: true },
} as const;

export const RDA_PREVIEW_LAYOUTS = [
  { name: "Leaderboard 728×90", uses: ["headline_short", "logo"] },
  { name: "Rectangle 300×250", uses: ["image_landscape", "headline_short", "description", "logo"] },
  { name: "Half Page 300×600", uses: ["image_landscape", "headline_long", "description", "logo"] },
  { name: "Square 250×250", uses: ["image_square", "headline_short", "logo"] },
  { name: "Mobile Banner 320×50", uses: ["headline_short", "logo"] },
  { name: "Wide Skyscraper 160×600", uses: ["image_square", "headline_short", "description", "logo"] },
] as const;

/**
 * Google Demand Gen image requirements.
 * Source: Google Ads Help, "Demand Gen campaign creative: Asset specifications
 * and guidelines" (verified July 2026).
 */
export const DEMAND_GEN_IMAGE_REQUIREMENTS = {
  max_file_size_bytes: 5 * 1024 * 1024,
  allowed_mime_types: ["image/jpeg", "image/png"],
  assets: {
    landscape: {
      aspect_ratio: 1.91,
      tolerance: 0.03,
      min: { width: 600, height: 314 },
      recommended: { width: 1200, height: 628 },
      required: true,
    },
    square: {
      aspect_ratio: 1,
      tolerance: 0.02,
      min: { width: 300, height: 300 },
      recommended: { width: 1200, height: 1200 },
      required: true,
    },
    portrait: {
      aspect_ratio: 0.8,
      tolerance: 0.02,
      min: { width: 480, height: 600 },
      recommended: { width: 960, height: 1200 },
      required: false,
    },
    vertical: {
      aspect_ratio: 9 / 16,
      tolerance: 0.02,
      min: { width: 600, height: 1067 },
      recommended: { width: 1080, height: 1920 },
      required: false,
    },
  },
  logo: {
    aspect_ratio: 1,
    min: { width: 144, height: 144 },
    recommended: { width: 1200, height: 1200 },
    max_file_size_bytes: 150 * 1024,
  },
} as const;

export type DemandGenAssetClass = keyof typeof DEMAND_GEN_IMAGE_REQUIREMENTS.assets;

export type DemandGenAssetEvaluation = {
  assetClass: DemandGenAssetClass | "unsupported";
  ratio: number;
  ratioSupported: boolean;
  meetsMinimum: boolean;
  maxFileSizeBytes: number;
};

export function evaluateDemandGenImageAsset(
  width: number,
  height: number,
): DemandGenAssetEvaluation {
  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);
  const ratio = safeHeight > 0 ? safeWidth / safeHeight : 0;

  for (const [assetClass, requirement] of Object.entries(DEMAND_GEN_IMAGE_REQUIREMENTS.assets)) {
    if (Math.abs(ratio - requirement.aspect_ratio) <= requirement.tolerance) {
      return {
        assetClass: assetClass as DemandGenAssetClass,
        ratio,
        ratioSupported: true,
        meetsMinimum: safeWidth >= requirement.min.width && safeHeight >= requirement.min.height,
        maxFileSizeBytes: DEMAND_GEN_IMAGE_REQUIREMENTS.max_file_size_bytes,
      };
    }
  }

  return {
    assetClass: "unsupported",
    ratio,
    ratioSupported: false,
    meetsMinimum: false,
    maxFileSizeBytes: DEMAND_GEN_IMAGE_REQUIREMENTS.max_file_size_bytes,
  };
}

export const GOOGLE_OBJECTIVE_REQUIREMENTS: Record<
  string,
  { recommended_formats: string[]; url_required: boolean; landing_page_needs: string[]; note: string }
> = {
  conversion: {
    recommended_formats: ["RDA", "Shopping"],
    url_required: true,
    landing_page_needs: ["product", "price", "buy_button"],
    note: "Ensure price/product visible above fold on landing page.",
  },
  lead_generation: {
    recommended_formats: ["RDA", "Lead Form Extension"],
    url_required: true,
    landing_page_needs: ["form"],
    note: "Lead form must be above fold or easily visible.",
  },
  traffic: {
    recommended_formats: ["RDA", "Image Ads"],
    url_required: true,
    landing_page_needs: [],
    note: "Ensure URL is functional and relevant to ad message.",
  },
  awareness: {
    recommended_formats: ["RDA", "Image Ads", "YouTube"],
    url_required: false,
    landing_page_needs: [],
    note: "Focus on visual quality and brand consistency.",
  },
  app_installs: {
    recommended_formats: ["App Campaign"],
    url_required: true,
    landing_page_needs: ["app_store_link"],
    note: "URL must be a valid App Store or Play Store URL.",
  },
  engagement: {
    recommended_formats: ["RDA", "YouTube"],
    url_required: false,
    landing_page_needs: [],
    note: "Video and interactive formats perform best for engagement.",
  },
  retargeting: {
    recommended_formats: ["RDA", "Image Ads"],
    url_required: true,
    landing_page_needs: ["cta"],
    note: "Use reminder messaging aligned with prior site visits.",
  },
};
