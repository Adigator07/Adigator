/**
 * OpenAI prompt contract for Meta Ads environment-based preview generation.
 * Optimized for token efficiency — one creative per environment, client injects images.
 */

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

export function buildMetaAdsSystemPrompt() {
  return `Adigator Meta Ads preview generator. Return ONLY valid JSON:
{"creatives":[{"id":"meta-1","platform":"meta_ads","vertical":"ecommerce","type":"instagram_feed_ad","placement":"Instagram Feed","environment":"instagram_feed","headline":"","description":"","primaryText":"","cta":"Shop Now","imagePrompt":"","imageUrl":"","size":"1080x1080","pageName":""}]}

Rules:
- Generate EXACTLY 10 creatives — one per environment: facebook_feed, facebook_feed_desktop, instagram_feed, instagram_story, instagram_reels, facebook_story, instagram_explore, facebook_marketplace, messenger, audience_network
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
  } = input;

  return `Brand:${brandName || "Brand"}|Vertical:${vertical}|Audience:${targetAudience || "Social users"}|Goal:${goal}|Tone:${tone || "Engaging"}|Message:${keyMessage || "Core value"}

Uploaded creatives:${imageCount} (images injected client-side — leave imageUrl empty)

Return 10 environment templates listed in system prompt. Vary primaryText/headline per placement (Feed vs Stories vs Reels tone).`;
}
