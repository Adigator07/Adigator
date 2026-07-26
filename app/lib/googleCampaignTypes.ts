export const GOOGLE_CAMPAIGN_TYPES = [
  {
    id: "display",
    label: "Google Display",
    description: "Uploaded banners and standard Google Display Network inventory.",
  },
  {
    id: "responsive_display",
    label: "Responsive Display Ads",
    description: "Landscape, square, and logo assets assembled responsively by Google.",
  },
  {
    id: "demand_gen",
    label: "Demand Gen",
    description: "Image and video assets for YouTube, Discover, Gmail, and Shorts surfaces.",
  },
] as const;

export type GoogleCampaignType = (typeof GOOGLE_CAMPAIGN_TYPES)[number]["id"];

export function isGoogleCampaignType(value: unknown): value is GoogleCampaignType {
  return GOOGLE_CAMPAIGN_TYPES.some((item) => item.id === value);
}

export function normalizeGoogleCampaignType(value: unknown): GoogleCampaignType {
  return isGoogleCampaignType(value) ? value : "display";
}

export function getGoogleCampaignTypeLabel(value: unknown): string {
  const normalized = normalizeGoogleCampaignType(value);
  return GOOGLE_CAMPAIGN_TYPES.find((item) => item.id === normalized)?.label || "Google Display";
}
