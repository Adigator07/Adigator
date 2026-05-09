import type { VerticalKey } from "@/app/lib/intelligence-registry";
import type { NormalizedOcrResult } from "@/app/lib/ocr-normalization";
import type { IntelligenceSignal } from "../graph/types";
import { makeSignal } from "../graph/signal";

const VERTICAL_TERMS: Record<VerticalKey, string[]> = {
  automotive: ["car", "vehicle", "drive", "engine", "suv", "sedan", "auto", "mileage", "ev"],
  banking: ["bank", "account", "card", "loan", "upi", "payment", "secure banking"],
  ecommerce: ["shop", "sale", "cart", "collection", "shipping", "sneaker", "shoes", "fashion", "size"],
  education: ["course", "learn", "curriculum", "student", "certification", "class"],
  entertainment: ["watch", "stream", "show", "movie", "series", "episode", "ott"],
  finance: ["invest", "portfolio", "returns", "wealth", "trading", "fund", "market"],
  food: ["food", "restaurant", "menu", "taste", "pizza", "burger", "dish", "chef", "fresh"],
  gaming: ["game", "play", "level", "reward", "battle", "quest", "download"],
  healthcare: ["health", "doctor", "clinic", "care", "patient", "treatment", "medical"],
  hotels: ["hotel", "stay", "room", "suite", "resort", "amenities", "guest"],
  luxury: ["luxury", "premium", "exclusive", "heritage", "craftsmanship", "prestige"],
  news_media: ["news", "story", "coverage", "journalist", "breaking", "read full"],
  real_estate: ["property", "home", "apartment", "listing", "sqft", "neighborhood"],
  sports: ["match", "team", "score", "league", "athlete", "ticket", "game day"],
  technology: ["software", "ai", "cloud", "platform", "demo", "integration", "security", "automation", "saas"],
  travel: ["travel", "destination", "flight", "trip", "package", "itinerary", "tour"],
};

export function classifyCreativeVertical(ocr: NormalizedOcrResult): {
  detectedVertical: VerticalKey | "unknown";
  confidence: number;
  scores: Record<VerticalKey, number>;
  signals: IntelligenceSignal[];
} {
  const text = ocr.cleanedText.toLowerCase();
  const scores = Object.fromEntries(
    Object.entries(VERTICAL_TERMS).map(([vertical, terms]) => {
      const score = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
      return [vertical, score];
    })
  ) as Record<VerticalKey, number>;

  const ranked = (Object.entries(scores) as Array<[VerticalKey, number]>).sort((a, b) => b[1] - a[1]);
  const [topVertical, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const detectedVertical = topScore > 0 ? topVertical : "unknown";
  const confidence = topScore > 0
    ? Math.min(0.92, Math.max(0.35, (topScore - secondScore + 1) / 6))
    : 0.2;

  const signals: IntelligenceSignal[] = [
    makeSignal({
      type: "creative.classification",
      source: "classifier",
      confidence,
      reasoning: detectedVertical === "unknown"
        ? "No vertical-specific text signals were strong enough to classify the creative."
        : `Creative text matched ${detectedVertical} category terms more strongly than alternatives.`,
      evidence: [
        { kind: "detected_vertical", value: detectedVertical },
        { kind: "top_score", value: topScore },
        { kind: "second_score", value: secondScore },
      ],
      scoreImpact: detectedVertical === "unknown" ? -8 : 6,
      severity: detectedVertical === "unknown" ? "medium" : "low",
    }),
  ];

  return { detectedVertical, confidence, scores, signals };
}

export function emitVerticalAlignmentSignal(input: {
  selectedVertical: VerticalKey;
  detectedVertical: VerticalKey | "unknown";
  confidence: number;
}): IntelligenceSignal {
  const aligned = input.detectedVertical === "unknown" || input.detectedVertical === input.selectedVertical;
  return makeSignal({
    type: aligned ? "vertical.aligned" : "vertical.mismatch",
    source: "classifier",
    confidence: input.confidence,
    reasoning: aligned
      ? "Selected vertical is consistent with detected creative category or classification confidence is insufficient."
      : `Selected vertical ${input.selectedVertical} differs from detected creative category ${input.detectedVertical}.`,
    evidence: [
      { kind: "selected_vertical", value: input.selectedVertical },
      { kind: "detected_vertical", value: input.detectedVertical },
    ],
    scoreImpact: aligned ? 8 : -28,
    severity: aligned ? "low" : "critical",
  });
}
