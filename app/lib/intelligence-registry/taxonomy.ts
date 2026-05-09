import type { CampaignGoal, DatasetSource, VerticalKey } from "./types";

export const CAMPAIGN_GOALS: CampaignGoal[] = [
  "awareness",
  "consideration",
  "conversion",
];

export const VERTICALS: VerticalKey[] = [
  "automotive",
  "banking",
  "ecommerce",
  "education",
  "entertainment",
  "finance",
  "food",
  "gaming",
  "healthcare",
  "hotels",
  "luxury",
  "news_media",
  "real_estate",
  "sports",
  "technology",
  "travel",
];

export const DATASET_SOURCES: Record<CampaignGoal, DatasetSource> = {
  awareness: {
    goal: "awareness",
    path: "app/docs/awareness-dataset.md",
    status: "empty",
  },
  consideration: {
    goal: "consideration",
    path: "app/docs/consideration-dataset.md",
    status: "empty",
  },
  conversion: {
    goal: "conversion",
    path: "app/docs/conversion-dataset.md",
    status: "empty",
  },
};

export const VERTICAL_ALIASES: Record<string, VerticalKey> = {
  auto: "automotive",
  automotive: "automotive",
  banking: "banking",
  bank: "banking",
  fintech: "banking",
  business: "finance",
  business_finance: "finance",
  commerce: "ecommerce",
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  retail: "ecommerce",
  education: "education",
  edtech: "education",
  entertainment: "entertainment",
  ott: "entertainment",
  streaming: "entertainment",
  finance: "finance",
  food: "food",
  restaurant: "food",
  restaurants: "food",
  gaming: "gaming",
  game: "gaming",
  healthcare: "healthcare",
  health: "healthcare",
  medical: "healthcare",
  hotels: "hotels",
  hotel: "hotels",
  luxury: "luxury",
  premium: "luxury",
  news: "news_media",
  media: "news_media",
  news_media: "news_media",
  realestate: "real_estate",
  real_estate: "real_estate",
  sports: "sports",
  sport: "sports",
  technology: "technology",
  tech: "technology",
  travel: "travel",
};

export const GOAL_ALIASES: Record<string, CampaignGoal> = {
  awareness: "awareness",
  brand: "awareness",
  reach: "awareness",
  consideration: "consideration",
  compare: "consideration",
  evaluation: "consideration",
  conversion: "conversion",
  performance: "conversion",
  sales: "conversion",
};
