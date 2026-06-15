export const IAB_STANDARD_SIZES = [
  { width: 300, height: 250, name: "Medium Rectangle", tier: "universal" },
  { width: 728, height: 90, name: "Leaderboard", tier: "universal" },
  { width: 160, height: 600, name: "Wide Skyscraper", tier: "universal" },
  { width: 320, height: 50, name: "Mobile Banner", tier: "mobile" },
  { width: 300, height: 600, name: "Half Page", tier: "premium" },
  { width: 970, height: 250, name: "Billboard", tier: "premium" },
  { width: 320, height: 480, name: "Mobile Interstitial", tier: "mobile" },
  { width: 300, height: 50, name: "Mobile Banner Small", tier: "mobile" },
  { width: 468, height: 60, name: "Full Banner", tier: "standard" },
  { width: 120, height: 600, name: "Skyscraper", tier: "standard" },
  { width: 240, height: 400, name: "Vertical Rectangle", tier: "standard" },
  { width: 250, height: 250, name: "Square", tier: "standard" },
  { width: 200, height: 200, name: "Small Square", tier: "standard" },
  { width: 336, height: 280, name: "Large Rectangle", tier: "standard" },
  { width: 580, height: 400, name: "Netboard", tier: "premium" },
] as const;

export const FILE_SIZE_LIMITS = {
  static_image: 150 * 1024,
  animated_gif: 150 * 1024,
  html5_zip: 200 * 1024,
  rich_media: 2 * 1024 * 1024,
} as const;

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  automotive: ["suv", "car", "vehicle", "drive", "dealership", "test drive", "motor"],
  finance: ["loan", "credit", "bank", "invest", "mortgage", "interest rate", "financ"],
  health: ["doctor", "clinic", "health", "wellness", "pharmacy", "treatment", "medical"],
  ecommerce: ["shop", "buy", "sale", "discount", "free shipping", "order", "cart"],
  travel: ["flight", "hotel", "book", "trip", "vacation", "destination", "travel"],
  education: ["course", "learn", "enroll", "degree", "university", "certificate", "school"],
  technology: ["software", "app", "cloud", "saas", "tech", "digital", "platform"],
};

export const PROGRAMMATIC_OBJECTIVE_REQUIREMENTS: Record<
  string,
  { required: string[]; note: string }
> = {
  awareness: {
    required: [],
    note: "Brand-safe imagery with clear messaging supports awareness delivery.",
  },
  consideration: {
    required: ["url"],
    note: "Landing page should reinforce product value and trust signals.",
  },
  conversion: {
    required: ["url", "product_or_cta"],
    note: "Require product listing, price, or buy button on landing page.",
  },
  lead_generation: {
    required: ["url", "form_or_phone"],
    note: "Landing page must include a form, phone number, or appointment link.",
  },
};
