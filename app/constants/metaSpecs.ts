export const META_PLACEMENTS = {
  facebook_feed: {
    recommended: { width: 1200, height: 628 },
    aspect_ratio: "1.91:1",
    min_size: { width: 600, height: 315 },
    safe_zone: null,
    formats: ["image", "video", "carousel"],
    devices: ["desktop", "mobile"],
  },
  instagram_feed: {
    recommended: { width: 1080, height: 1080 },
    aspect_ratios: ["1:1", "4:5"],
    min_size: { width: 600, height: 600 },
    safe_zone: null,
    formats: ["image", "video", "carousel", "collection"],
    devices: ["mobile"],
  },
  instagram_stories: {
    recommended: { width: 1080, height: 1920 },
    aspect_ratio: "9:16",
    safe_zone: { top: 250, bottom: 250, left: 0, right: 0 },
    formats: ["image", "video"],
    devices: ["mobile"],
  },
  facebook_stories: {
    recommended: { width: 1080, height: 1920 },
    aspect_ratio: "9:16",
    safe_zone: { top: 250, bottom: 250, left: 0, right: 0 },
    formats: ["image", "video"],
    devices: ["mobile"],
  },
  reels: {
    recommended: { width: 1080, height: 1920 },
    aspect_ratio: "9:16",
    safe_zone: { top: 130, bottom: 350, left: 0, right: 120 },
    formats: ["video"],
    devices: ["mobile"],
  },
  right_column: {
    recommended: { width: 1080, height: 1080 },
    min_size: { width: 254, height: 133 },
    aspect_ratio: "1:1",
    formats: ["image"],
    devices: ["desktop"],
  },
  marketplace: {
    recommended: { width: 1200, height: 628 },
    aspect_ratio: "1.91:1 or 1:1",
    formats: ["image", "carousel"],
    devices: ["desktop", "mobile"],
  },
  messenger_inbox: {
    recommended: { width: 1200, height: 628 },
    aspect_ratio: "1.91:1",
    formats: ["image", "carousel"],
    devices: ["mobile"],
  },
  audience_network_native: {
    recommended: { width: 1200, height: 628 },
    aspect_ratio: "1.91:1",
    formats: ["image", "video"],
    devices: ["mobile"],
  },
  audience_network_banner: {
    recommended: { width: 320, height: 50 },
    formats: ["image"],
    devices: ["mobile"],
  },
} as const;

export const META_TEXT_RULES = {
  primary_text_max: 125,
  headline_max: 40,
  description_max: 30,
  text_overlay_max_percent: 20,
} as const;

export const META_OBJECTIVE_REQUIREMENTS: Record<
  string,
  { allowed_formats: string[]; required: string[]; note: string }
> = {
  awareness: {
    allowed_formats: ["image", "video", "carousel"],
    required: [],
    note: "Any placement works. Prioritize brand-safe imagery.",
  },
  traffic: {
    allowed_formats: ["image", "video", "carousel", "collection"],
    required: ["url"],
    note: "Landing page URL required. Check URL is functional.",
  },
  engagement: {
    allowed_formats: ["image", "video", "carousel"],
    required: [],
    note: "Text-heavy creatives may underperform. Keep copy concise.",
  },
  lead_generation: {
    allowed_formats: ["image", "video", "carousel"],
    required: ["lead_form_or_url_with_form"],
    note: "Must connect to Instant Form or landing page with form.",
  },
  app_installs: {
    allowed_formats: ["image", "video"],
    required: ["app_store_url"],
    note: "URL must point to App Store or Google Play.",
  },
  conversion: {
    allowed_formats: ["image", "video", "carousel", "collection"],
    required: ["product_catalog_or_url"],
    note: "Carousel recommended for product showcasing.",
  },
  retargeting: {
    allowed_formats: ["image", "video", "carousel"],
    required: ["url"],
    note: "Use urgency and reminder messaging for hot audiences.",
  },
};
