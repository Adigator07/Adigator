/**
 * OpenAI prompt contract for Meta Ads environment-based preview generation.
 * Optimized for token efficiency — placement-scoped generation, client injects images.
 */

import { getEnvironmentsForPlacement, getPreviewPlacement } from "./previewPlacementRegistry";

export const META_ENVIRONMENTS = [
  "facebook_feed",
  "facebook_feed_desktop",
  "instagram_feed",
  "instagram_story",
  "instagram_reels",
  "facebook_story",
  "instagram_explore",
  "facebook_marketplace",
  "messenger",
  "audience_network",
];

const PLACEMENT_ENV_SPECS = {
  facebook_feed: [
    { environment: "facebook_feed", type: "facebook_feed_ad", placement: "Facebook Feed", size: "1080x1080" },
  ],
  instagram_feed: [
    { environment: "instagram_feed", type: "instagram_feed_ad", placement: "Instagram Feed", size: "1080x1080" },
  ],
  facebook_stories: [
    { environment: "facebook_story", type: "facebook_story_ad", placement: "Facebook Stories", size: "1080x1920" },
  ],
  instagram_stories: [
    { environment: "instagram_story", type: "story_ad", placement: "Instagram Stories", size: "1080x1920" },
  ],
  facebook_reels: [
    { environment: "instagram_reels", type: "reels_ad", placement: "Facebook Reels", size: "1080x1920" },
  ],
  instagram_reels: [
    { environment: "instagram_reels", type: "reels_ad", placement: "Instagram Reels", size: "1080x1920" },
  ],
  messenger: [
    { environment: "messenger", type: "messenger_ad", placement: "Messenger", size: "1080x1080" },
  ],
  audience_network: [
    { environment: "audience_network", type: "audience_network_ad", placement: "Audience Network", size: "1200x628" },
  ],
};

export function getMetaPlacementEnvSpecs(placementId) {
  const specs = PLACEMENT_ENV_SPECS[placementId];
  if (specs) return specs;
  const placement = getPreviewPlacement("meta_ads", placementId);
  const environments = placement?.environments?.length
    ? placement.environments.filter((env) => env !== "facebook_feed_desktop")
    : ["instagram_feed"];
  return environments.map((environment) => ({
    environment,
    type: environment.includes("story") ? "story_ad" : "instagram_feed_ad",
    placement: placement?.label || "Meta Ads",
    size: environment.includes("story") || environment.includes("reels") ? "1080x1920" : "1080x1080",
  }));
}

export function buildMetaAdsSystemPrompt(placementId = "facebook_feed") {
  const specs = getMetaPlacementEnvSpecs(placementId);
  const envList = specs.map((item) => item.environment).join(", ");
  const count = specs.length;

  return `Adigator Meta Ads preview generator. Return ONLY valid JSON:
{"creatives":[{"id":"meta-1","platform":"meta_ads","vertical":"ecommerce","type":"instagram_feed_ad","placement":"Instagram Feed","environment":"instagram_feed","headline":"","description":"","primaryText":"","cta":"Shop Now","imagePrompt":"","imageUrl":"","size":"1080x1080","pageName":""}]}

Rules:
- Generate EXACTLY ${count} creative(s) — one per environment: ${envList}
- NO video. Stories/Reels use static poster only (imageUrl empty — client injects).
- Required fields: id, platform, vertical, type, placement, environment, headline, description, primaryText, cta, imagePrompt, pageName, size
- Use primaryText for copy above image. Keep headline/description concise (max 12 words each).
- Match brand, vertical, goal, tone, key message with Meta-native social language.
- Do NOT repeat brand context in every field. imageUrl always "".`;
}

export function buildMetaAdsUserPrompt(input) {
  const {
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageCount = 0,
    placement = "facebook_feed",
  } = input;

  const specs = getMetaPlacementEnvSpecs(placement);
  const specLines = specs
    .map((item) => `${item.environment}:${item.type}:${item.placement}:${item.size}`)
    .join("; ");

  return `Brand:${brandName || "Brand"}|Vertical:${vertical}|Audience:${targetAudience || "Prospective customers"}|Goal:${goal}|Tone:${tone || "Engaging"}|Message:${keyMessage || "Core value"}|Placement:${placement}

Uploaded creatives:${imageCount} (images injected client-side — leave imageUrl empty)

Generate ONLY these ${specs.length} template(s): ${specLines}
Vary primaryText/headline per placement. Do NOT generate environments outside this list.`;
}

export function getMetaEnvironmentsForPlacement(placementId) {
  return getEnvironmentsForPlacement("meta_ads", placementId);
}
