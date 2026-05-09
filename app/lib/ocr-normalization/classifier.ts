import type { IntelligenceProfile } from "../intelligence-registry";
import {
  BRAND_STOPWORDS,
  DISCOUNT_PATTERN,
  EMOTIONAL_WORDS,
  EXPLICIT_CTA_PHRASES,
  IMPLICIT_CTA_PHRASES,
  LEGAL_WORDS,
  PRICE_PATTERN,
  TRUST_WORDS,
} from "./dictionaries";
import { isButtonLikeBox } from "./geometry";
import { containsPhrase, countSetMatches } from "./text";
import type { NormalizedTextBlock, TextBlockRole } from "./types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function brandScore(block: NormalizedTextBlock): number {
  if (block.tokens.some((token) => BRAND_STOPWORDS.has(token))) return 0;
  let score = 0;
  if (block.features.isAllCaps && block.features.wordCount <= 3) score += 45;
  if (block.box && block.box.centerY < 0.25) score += 20;
  if (block.features.wordCount <= 2 && block.features.charCount >= 3) score += 20;
  if (block.hierarchyScore > 55) score += 10;
  return clampScore(score);
}

function classifyBlock(block: NormalizedTextBlock, profile: IntelligenceProfile): {
  role: TextBlockRole;
  confidence: number;
  features: NormalizedTextBlock["features"];
} {
  const explicitCta = containsPhrase(block.normalizedText, EXPLICIT_CTA_PHRASES);
  const implicitCta = containsPhrase(block.normalizedText, IMPLICIT_CTA_PHRASES);
  const profileCta = containsPhrase(block.normalizedText, profile.ctaExpectations.examples.map((item) => item.toLowerCase()));
  const hasPrice = PRICE_PATTERN.test(block.text);
  PRICE_PATTERN.lastIndex = 0;
  const hasDiscount = DISCOUNT_PATTERN.test(block.text);
  DISCOUNT_PATTERN.lastIndex = 0;
  const emotionalMatches = countSetMatches(block.tokens, EMOTIONAL_WORDS);
  const trustMatches = countSetMatches(block.tokens, TRUST_WORDS);
  const legalMatches = countSetMatches(block.tokens, LEGAL_WORDS);
  const buttonLikelihood = isButtonLikeBox(block.box);

  const features = {
    ...block.features,
    hasPrice,
    hasDiscount,
    hasCtaPhrase: Boolean(explicitCta || implicitCta || profileCta),
    hasEmotionalSignal: emotionalMatches > 0,
    hasTrustSignal: trustMatches > 0,
    hasLegalSignal: legalMatches > 0,
    buttonLikelihood,
  };

  const scores: Record<TextBlockRole, number> = {
    cta: 0,
    headline: 0,
    emotional_copy: 0,
    offer_text: 0,
    supporting_text: 10,
    disclaimer: 0,
    branding_text: 0,
    unknown: 0,
  };

  if (explicitCta || profileCta) scores.cta += 45;
  if (implicitCta) scores.cta += 18;
  if (buttonLikelihood >= 55) scores.cta += 30;
  if (block.features.wordCount > 6) scores.cta -= 20;
  if (legalMatches > 0) scores.cta -= 35;

  if (block.hierarchyScore >= 60) scores.headline += 45;
  if (block.features.wordCount <= 10) scores.headline += 20;
  if (block.box && block.box.centerY < 0.55) scores.headline += 15;
  if (features.hasCtaPhrase) scores.headline -= 25;

  if (emotionalMatches > 0) scores.emotional_copy += 30 + emotionalMatches * 12;
  if (profile.expectedEmotions.primary.some((emotion) => block.normalizedText.includes(emotion))) scores.emotional_copy += 20;

  if (hasPrice || hasDiscount) scores.offer_text += 55;
  if (block.tokens.some((token) => ["free", "save", "deal", "offer", "bonus"].includes(token))) scores.offer_text += 18;

  if (legalMatches > 0 || block.features.wordCount >= 18) scores.disclaimer += legalMatches * 25 + 15;
  if (block.box && block.box.centerY > 0.78 && block.features.charCount > 20) scores.disclaimer += 25;

  scores.branding_text += brandScore(block);

  if (block.features.wordCount >= 7 && !features.hasCtaPhrase && !hasPrice && !hasDiscount) {
    scores.supporting_text += 22;
  }
  if (trustMatches > 0) scores.supporting_text += 12;

  const [role, confidence] = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0] as [TextBlockRole, number];

  return {
    role: confidence < 25 ? "unknown" : role,
    confidence: clampScore(confidence),
    features,
  };
}

export function classifyTextBlocks(
  blocks: NormalizedTextBlock[],
  profile: IntelligenceProfile
): NormalizedTextBlock[] {
  return blocks.map((block) => {
    const classification = classifyBlock(block, profile);
    return {
      ...block,
      role: classification.role,
      roleConfidence: classification.confidence,
      features: classification.features,
    };
  });
}
