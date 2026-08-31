export const ADIGATOR_VERTICAL_IDS = [
  "healthcare",
  "technology",
  "automotive",
  "news_media",
  "sports",
  "fitness",
  "finance",
  "luxury",
  "travel",
  "hotels",
  "food",
  "banking",
  "real_estate",
  "education",
  "gaming",
  "entertainment",
  "ecommerce",
  "fashion",
] as const;

export type AdigatorVerticalId = (typeof ADIGATOR_VERTICAL_IDS)[number];

const VERTICAL_KEYWORDS: Array<{ id: AdigatorVerticalId; keywords: string[] }> = [
  { id: "healthcare", keywords: ["health", "healthcare", "medical", "clinic", "pharma", "hospital", "wellness", "dental", "medicare", "doctor", "pharmacy", "telehealth"] },
  { id: "hotels", keywords: ["hotel", "hotels", "hospitality", "resort", "marriott", "hilton", "hyatt", "lodging", "motel"] },
  { id: "travel", keywords: ["travel", "trip", "tour", "tours", "airline", "flight", "flights", "vacation", "getaway", "booking", "expedia", "kayak", "tripadvisor"] },
  { id: "news_media", keywords: ["news", "media", "publisher", "journal", "magazine", "press", "broadcast"] },
  { id: "sports", keywords: ["sport", "sports", "nfl", "nba", "soccer", "football", "cricket", "league", "athletics"] },
  { id: "fitness", keywords: ["fitness", "gym", "workout", "yoga", "crossfit", "training"] },
  { id: "luxury", keywords: ["luxury", "premium", "haute", "jewelry", "jewellery", "watches"] },
  { id: "food", keywords: ["food", "restaurant", "restaurants", "cafe", "dining", "grocery", "meal", "cuisine"] },
  { id: "banking", keywords: ["bank", "banking", "fintech", "checking", "savings", "neobank"] },
  { id: "finance", keywords: ["finance", "loan", "credit", "invest", "investment", "insurance", "mortgage", "wealth"] },
  { id: "automotive", keywords: ["car", "cars", "auto", "automotive", "vehicle", "vehicles", "dealership", "ev", "suv"] },
  { id: "real_estate", keywords: ["real estate", "property", "housing", "realtor", "apartment", "apartments", "homes"] },
  { id: "education", keywords: ["education", "course", "courses", "school", "edtech", "university", "learn", "learning"] },
  { id: "gaming", keywords: ["game", "games", "gaming", "esports", "xbox", "playstation"] },
  { id: "entertainment", keywords: ["entertainment", "ott", "streaming", "netflix", "movie", "movies", "tv show", "series"] },
  { id: "fashion", keywords: ["fashion", "apparel", "clothing", "style", "sneaker", "sneakers", "footwear", "outfit"] },
  { id: "ecommerce", keywords: ["shop", "store", "retail", "ecommerce", "e-commerce", "marketplace", "checkout", "cart", "shopping"] },
  { id: "technology", keywords: ["software", "saas", "cloud", "tech", "technology", "cyber", "app", "platform", "ai"] },
];

const DOMAIN_VERTICALS: Array<{ id: AdigatorVerticalId; pattern: RegExp }> = [
  { id: "travel", pattern: /booking\.com|expedia\.|kayak\.|tripadvisor\.|airbnb\./i },
  { id: "hotels", pattern: /marriott\.|hilton\.|hyatt\.|ihg\.|hotels\.com/i },
  { id: "automotive", pattern: /tesla\.|ford\.|toyota\.|bmw\.|mercedes/i },
  { id: "finance", pattern: /paypal\.|visa\.|mastercard\.|bloomberg\./i },
  { id: "banking", pattern: /chase\.com|bankofamerica|wellsfargo|capitalone/i },
  { id: "entertainment", pattern: /netflix\.|hulu\.|disneyplus|spotify\./i },
  { id: "ecommerce", pattern: /amazon\.|shopify|ebay\.|walmart\.|etsy\./i },
  { id: "education", pattern: /coursera\.|udemy\.|edx\.org|khanacademy/i },
  { id: "news_media", pattern: /nytimes\.|cnn\.com|bbc\.|wsj\.|theguardian/i },
];

function normalizeSignalText(value: string): string {
  return value
    .replace(/https?:\/\//gi, " ")
    .replace(/[._/?=&%#+:,-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeUrl(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return normalizeSignalText(`${parsed.hostname} ${decodeURIComponent(parsed.pathname)} ${decodeURIComponent(parsed.search)}`);
  } catch {
    return normalizeSignalText(raw);
  }
}

export function isAdigatorVerticalId(value: unknown): value is AdigatorVerticalId {
  return ADIGATOR_VERTICAL_IDS.includes(String(value || "") as AdigatorVerticalId);
}

export function inferVerticalFromGoogleChannel(channelType?: string, channelSubType?: string): AdigatorVerticalId | "" {
  const channel = `${channelType || ""} ${channelSubType || ""}`.toUpperCase();
  if (channel.includes("HOTEL")) return "hotels";
  if (channel.includes("TRAVEL")) return "travel";
  if (channel.includes("SHOPPING")) return "ecommerce";
  if (channel.includes("SMART_CAMPAIGN")) return "";
  return "";
}

export function inferVerticalFromGoogleCampaignSignals(...parts: Array<string | undefined | null>): string {
  const texts = parts.filter(Boolean).map((part) => String(part));
  const joined = texts.join(" ");
  const haystack = normalizeSignalText(joined);
  if (!haystack) return "";

  const scores = new Map<AdigatorVerticalId, number>();

  for (const text of texts) {
    for (const rule of DOMAIN_VERTICALS) {
      if (rule.pattern.test(text)) {
        scores.set(rule.id, (scores.get(rule.id) || 0) + 4);
      }
    }
  }

  for (const { id, keywords } of VERTICAL_KEYWORDS) {
    let hits = 0;
    for (const keyword of keywords) {
      const pattern = keyword.includes(" ")
        ? new RegExp(keyword.replace(/\s+/g, "\\s+"), "i")
        : new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (pattern.test(haystack)) hits += 1;
    }
    if (hits > 0) scores.set(id, (scores.get(id) || 0) + hits);
  }

  let bestId: AdigatorVerticalId | "" = "";
  let bestScore = 0;
  for (const id of ADIGATOR_VERTICAL_IDS) {
    const score = scores.get(id) || 0;
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestScore > 0 ? bestId : "";
}

export function buildVerticalInferenceCorpus(input: {
  campaignName?: string;
  landingUrl?: string;
  campaignBrief?: string;
  channelType?: string;
  channelSubType?: string;
  channelSummary?: string;
  adGroupNames?: string[];
  headlines?: string[];
  descriptions?: string[];
  verticalSignals?: string[];
  productFocus?: string[];
}): string[] {
  const channelHint = inferVerticalFromGoogleChannel(input.channelType, input.channelSubType);
  return [
    input.campaignName,
    tokenizeUrl(input.landingUrl || ""),
    input.campaignBrief,
    input.channelType,
    input.channelSubType,
    input.channelSummary,
    channelHint,
    input.productFocus?.join(" "),
    ...(input.adGroupNames || []),
    ...(input.headlines || []),
    ...(input.descriptions || []),
    ...(input.verticalSignals || []),
  ].filter((value): value is string => Boolean(value && String(value).trim()));
}
