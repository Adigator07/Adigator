/**
 * OpenAI prompt contract for Google Ads environment-based preview generation.
 */

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

export function buildGoogleAdsSystemPrompt() {
  return `You are Adigator's Google Ads creative environment generator.

Return ONLY valid JSON:
{
  "creatives": [
    {
      "id": "google-youtube-1",
      "platform": "google_ads",
      "vertical": "ecommerce",
      "type": "youtube_instream",
      "placement": "YouTube In-Stream",
      "environment": "youtube",
      "headline": "Headline",
      "headline2": "",
      "headline3": "",
      "description": "Description line",
      "description2": "",
      "primaryText": "",
      "cta": "Shop Now",
      "imagePrompt": "Product hero on clean background",
      "imageUrl": "",
      "size": "16:9",
      "displayUrl": "www.example.com",
      "price": "",
      "rating": 4.8,
      "reviewCount": 1204,
      "appName": "",
      "storeName": "Example Store",
      "pageName": "Brand",
      "pageAvatar": "B",
      "cards": []
    }
  ]
}

Generate 12-16 creatives covering ALL Google environments:
google_search, youtube, news_site, mobile_app, google_shopping, google_discover, gmail, google_maps

Rules:
- NO video. Use static poster images only via imageUrl or imagePrompt.
- Every creative MUST include: id, platform, vertical, type, placement, environment, headline, description, cta, imagePrompt.
- search -> google_search, type search_ad, displayUrl required
- youtube -> youtube, types youtube_instream or youtube_bumper
- display/banners -> news_site, type display_ad, include exact IAB size
- shopping -> google_shopping, include price, rating, reviewCount, storeName
- mobile banners/interstitials -> mobile_app
- discover cards -> google_discover
- gmail promo -> gmail
- maps promoted pin -> google_maps
- Match brand, vertical, goal, tone, key message.`;
}

export function buildGoogleAdsUserPrompt(input) {
  const {
    brandName,
    vertical,
    targetAudience,
    goal,
    tone,
    keyMessage,
    imageUrls = [],
  } = input;

  return `Generate Google Ads environment creatives for:
Brand: ${brandName || "Brand"}
Vertical: ${vertical}
Target audience: ${targetAudience || "Prospective customers"}
Campaign goal: ${goal}
Tone: ${tone || "Professional and performance-focused"}
Key message: ${keyMessage || "Core value proposition"}

Uploaded image URLs:
${imageUrls.length ? imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n") : "None"}

Return diverse creatives across Search, YouTube, News/Display, Shopping, Mobile App, Discover, Gmail, and Maps.`;
}
