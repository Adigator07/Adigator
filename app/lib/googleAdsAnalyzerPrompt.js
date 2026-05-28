/**
 * OpenAI prompt contract for Google Ads environment-based preview generation.
 * Optimized for token efficiency — one creative per environment, client injects images.
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
  return `Adigator Google Ads preview generator. Return ONLY valid JSON:
{"creatives":[{"id":"google-1","platform":"google_ads","vertical":"ecommerce","type":"search_ad","placement":"Google Search","environment":"google_search","headline":"Headline","headline2":"","headline3":"","description":"Description","description2":"","primaryText":"","cta":"Shop Now","imagePrompt":"","imageUrl":"","size":"1200x628","displayUrl":"www.example.com","price":"","rating":4.8,"reviewCount":1204,"appName":"","storeName":"Example Store","pageName":"Brand","pageAvatar":"B","cards":[]}]}

Rules:
- Generate EXACTLY 8 creatives — one per environment: google_search, youtube, news_site, mobile_app, google_shopping, google_discover, gmail, google_maps
- NO video. Static poster images only (imageUrl empty — client injects).
- Required: id, platform, vertical, type, placement, environment, headline, description, cta, imagePrompt, size
- google_search → type search_ad, displayUrl required, no imageUrl
- youtube → type youtube_instream, size 16:9
- news_site → type display_ad, IAB size (300x250 or 728x90)
- mobile_app → type mobile_banner, size 320x50 or 320x480
- google_shopping → price, rating, reviewCount, storeName
- google_discover → type discover_card, size 1200x628
- gmail → type gmail_promo
- google_maps → type maps_promoted_pin
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
  } = input;

  return `Brand:${brandName || "Brand"}|Vertical:${vertical}|Audience:${targetAudience || "Prospective customers"}|Goal:${goal}|Tone:${tone || "Performance-focused"}|Message:${keyMessage || "Core value"}

Uploaded creatives:${imageCount} (images injected client-side — leave imageUrl empty)

Return 8 environment templates listed in system prompt. Vary copy per surface (Search vs YouTube vs Display vs Shopping tone).`;
}
