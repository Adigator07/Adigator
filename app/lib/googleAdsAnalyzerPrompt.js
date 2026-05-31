/**
 * OpenAI prompt contract for Google Ads environment-based preview generation.
 * Optimized for token efficiency — placement-scoped generation, client injects images.
 */

import { getEnvironmentsForPlacement, getPreviewPlacement } from "./previewPlacementRegistry";

export const GOOGLE_ENVIRONMENTS = [
  "google_search",
  "youtube",
  "news_site",
  "mobile_app",
  "google_shopping",
  "google_discover",
  "gmail",
  "google_maps",
];

const PLACEMENT_ENV_SPECS = {
  gdn: [
    { environment: "news_site", type: "display_ad", placement: "GDN Display", size: "300x250" },
  ],
  mobile_display: [
    { environment: "mobile_app", type: "mobile_banner", placement: "Mobile Display", size: "320x50" },
  ],
  responsive_display: [
    { environment: "google_discover", type: "discover_ad", placement: "Responsive Display", size: "1200x628" },
  ],
  demand_gen: [
    { environment: "google_discover", type: "discover_ad", placement: "Demand Gen — Discover", size: "1200x628" },
    { environment: "youtube", type: "youtube_instream", placement: "Demand Gen — YouTube", size: "1280x720" },
  ],
  gmail: [
    { environment: "gmail", type: "gmail_ad", placement: "Gmail Promo", size: "300x250" },
  ],
  app_inventory: [
    { environment: "mobile_app", type: "interstitial_ad", placement: "App Inventory", size: "320x480" },
  ],
  youtube_companion: [
    { environment: "youtube", type: "youtube_instream", placement: "YouTube In-Stream", size: "1280x720" },
  ],
};

export function getGooglePlacementEnvSpecs(placementId) {
  const specs = PLACEMENT_ENV_SPECS[placementId];
  if (specs) return specs;
  const placement = getPreviewPlacement("google_ads", placementId);
  const environments = placement?.environments?.length
    ? placement.environments
    : ["news_site"];
  return environments.map((environment) => ({
    environment,
    type: environment === "youtube" ? "youtube_instream" : "display_ad",
    placement: placement?.label || "Google Ads",
    size: environment === "youtube" ? "1280x720" : "300x250",
  }));
}

export function buildGoogleAdsSystemPrompt(placementId = "gdn") {
  const specs = getGooglePlacementEnvSpecs(placementId);
  const envList = specs.map((item) => item.environment).join(", ");
  const count = specs.length;

  return `Adigator Google Ads preview generator. Return ONLY valid JSON:
{"creatives":[{"id":"google-1","platform":"google_ads","vertical":"ecommerce","type":"display_ad","placement":"GDN Display","environment":"news_site","headline":"Headline","headline2":"","headline3":"","description":"Description","description2":"","primaryText":"","cta":"Shop Now","imagePrompt":"","imageUrl":"","size":"300x250","displayUrl":"www.example.com","price":"","rating":4.8,"reviewCount":1204,"appName":"","storeName":"Example Store","pageName":"Brand","pageAvatar":"B","cards":[]}]}

Rules:
- Generate EXACTLY ${count} creative(s) — one per environment: ${envList}
- NO video. Static poster images only (imageUrl empty — client injects).
- Required: id, platform, vertical, type, placement, environment, headline, description, cta, imagePrompt, size
- google_search → type search_ad, displayUrl required, no imageUrl
- youtube → type youtube_instream, size 16:9 or 1280x720
- news_site → type display_ad, IAB size (300x250 or 728x90)
- mobile_app → type mobile_banner or interstitial_ad, size 320x50, 320x480, or 300x250
- google_discover → type discover_ad, size 1200x628
- gmail → type gmail_ad
- Keep headline/description concise (max 12 words). imageUrl always "".
- Match brand, vertical, goal, tone, key message with Google-native performance language.`;
}

export function buildGoogleAdsUserPrompt(input) {
  const {
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageCount = 0,
    placement = "gdn",
  } = input;

  const specs = getGooglePlacementEnvSpecs(placement);
  const specLines = specs
    .map((item) => `${item.environment}:${item.type}:${item.placement}:${item.size}`)
    .join("; ");

  return `Brand:${brandName || "Brand"}|Vertical:${vertical}|Audience:${targetAudience || "Prospective customers"}|Goal:${goal}|Tone:${tone || "Performance-focused"}|Message:${keyMessage || "Core value"}|Placement:${placement}

Uploaded creatives:${imageCount} (images injected client-side — leave imageUrl empty)

Generate ONLY these ${specs.length} template(s): ${specLines}
Vary copy per surface. Do NOT generate environments outside this list.`;
}

export function getGoogleEnvironmentsForPlacement(placementId) {
  return getEnvironmentsForPlacement("google_ads", placementId);
}
