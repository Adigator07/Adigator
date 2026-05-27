/**
 * OpenAI prompt contract for Meta Ads environment-based preview generation.
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
  return `You are Adigator's Meta Ads creative environment generator.

Return ONLY valid JSON:
{
  "creatives": [
    {
      "id": "meta-ig-feed-1",
      "platform": "meta_ads",
      "vertical": "ecommerce",
      "type": "instagram_feed_ad",
      "placement": "Instagram Feed",
      "environment": "instagram_feed",
      "headline": "Headline below image",
      "description": "Caption / primary text",
      "primaryText": "Primary text above image",
      "cta": "Shop Now",
      "imagePrompt": "Lifestyle product shot",
      "imageUrl": "",
      "size": "1080x1080",
      "pageName": "Brand Name",
      "pageAvatar": "B",
      "rating": 0,
      "reviewCount": 0,
      "cards": [
        { "image": "", "title": "Card 1", "description": "Details", "cta": "Shop", "url": "" }
      ]
    }
  ]
}

Generate 14-18 creatives covering ALL Meta environments:
facebook_feed, facebook_feed_desktop, instagram_feed, instagram_story, instagram_reels, facebook_story, instagram_explore, facebook_marketplace, messenger, audience_network

Rules:
- NO video. Reels/Stories use poster imageUrl/imagePrompt only.
- Every creative MUST include: id, platform, vertical, type, placement, environment, headline, description, cta, imagePrompt, pageName.
- Use primaryText for Meta copy above the image.
- carousel -> instagram_feed with cards array (3-5 cards)
- Match brand, vertical, goal, tone, key message with Meta-native social language.`;
}

export function buildMetaAdsUserPrompt(input) {
  const {
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageUrls = [],
  } = input;

  return `Generate Meta Ads environment creatives for:
Brand: ${brandName || "Brand"}
Vertical: ${vertical}
Target audience: ${targetAudience || "Social users"}
Campaign goal: ${goal}
Tone: ${tone || "Engaging and social-native"}
Key message: ${keyMessage || "Core value proposition"}

Uploaded image URLs:
${imageUrls.length ? imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n") : "None"}

Return diverse creatives across Facebook Feed, Instagram Feed, Stories, Reels, Explore, Marketplace, Messenger, and Audience Network.`;
}
