import type { IntelligenceProfile } from "../intelligence-registry";
import { EXPLICIT_CTA_PHRASES, IMPLICIT_CTA_PHRASES } from "./dictionaries";
import { containsPhrase } from "./text";
import type { CtaDetectionResult, NormalizedTextBlock } from "./types";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function explicitEvidenceScore(block: NormalizedTextBlock, profile: IntelligenceProfile): {
  score: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let score = 0;
  const explicitPhrase = containsPhrase(block.normalizedText, EXPLICIT_CTA_PHRASES);
  const profilePhrase = containsPhrase(block.normalizedText, profile.ctaExpectations.examples.map((item) => item.toLowerCase()));

  if (explicitPhrase || profilePhrase) {
    score += 42;
    if (profilePhrase) {
      score += 8; // Boost for profile-matched CTA
      evidence.push(`matched profile CTA phrase: ${profilePhrase}`);
    } else {
      evidence.push(`matched generic CTA phrase: ${explicitPhrase}`);
    }
  }
  
  // Bonus: Block already identified as having CTA phrase by OCR normalization
  if (block.features.hasCtaPhrase) {
    score += 15;
    evidence.push("OCR normalization detected CTA phrase");
  }
  
  // Bonus: Block role already classified as CTA
  if (block.role === "cta") {
    score += 12;
    evidence.push("OCR classifier marked block as CTA role");
  }
  if (block.features.buttonLikelihood >= 55) {
    score += 32;
    evidence.push("button-like OCR geometry");
  }
  if (block.features.wordCount <= 4) {
    score += 10;
    evidence.push("short action-oriented phrase");
  }
  if (block.box && block.box.centerY >= 0.42) {
    score += 8;
    evidence.push("CTA-like lower or mid-frame placement");
  }
  if (block.features.hasLegalSignal) {
    score -= 45;
    evidence.push("legal/disclaimer language lowers CTA confidence");
  }
  if (block.features.wordCount > 7) {
    score -= 25;
    evidence.push("too many words for a CTA button");
  }

  // Apply goal-specific strength penalties
  const textLower = block.normalizedText.toLowerCase();
  const hasDirectWords = /\b(buy|order|get|claim|start|sign up|download)\b/i.test(textLower);
  const hasSoftWords = /\b(learn|discover|explore|find out|see|view)\b/i.test(textLower);

  if (profile.goal === "awareness" && hasDirectWords) {
    score -= 12;
    evidence.push("direct CTA penalized for awareness goal");
  } else if (profile.goal === "awareness" && hasSoftWords) {
    score += 5;
    evidence.push("soft CTA boosted for awareness goal");
  }

  if (profile.goal === "conversion" && hasDirectWords) {
    score += 10;
    evidence.push("direct CTA boosted for conversion goal");
  } else if (profile.goal === "conversion" && hasSoftWords) {
    score -= 8;
    evidence.push("soft CTA penalized for conversion goal");
  }

  return { score: clamp(score), evidence };
}

function implicitEvidenceScore(block: NormalizedTextBlock, profile: IntelligenceProfile): {
  score: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let score = 0;
  const implicitPhrase = containsPhrase(block.normalizedText, IMPLICIT_CTA_PHRASES);
  if (implicitPhrase) {
    score += 28;
    evidence.push(`matched implicit action phrase: ${implicitPhrase}`);
  }
  if (block.features.hasEmotionalSignal && profile.ctaExpectations.strength === "soft") {
    score += 18;
    evidence.push("emotion-led soft action context");
  }
  if (block.hierarchyScore >= 50 && block.features.wordCount <= 8) {
    score += 12;
    evidence.push("prominent concise motivational copy");
  }
  if (block.features.buttonLikelihood >= 55) score += 10;
  if (block.features.hasLegalSignal || block.features.wordCount > 10) score -= 20;
  return { score: clamp(score), evidence };
}

export function detectCta(
  blocks: NormalizedTextBlock[],
  profile: IntelligenceProfile
): CtaDetectionResult {
  const explicitCandidates = blocks
    .map((block) => ({ block, ...explicitEvidenceScore(block, profile) }))
    .sort((a, b) => b.score - a.score);

  const bestExplicit = explicitCandidates[0];
  if (bestExplicit && bestExplicit.score >= 60) {
    return {
      ctaExists: true,
      ctaState: "explicit",
      ctaType: "explicit",
      cta: bestExplicit.block.text,
      confidence: bestExplicit.score,
      candidateBlockId: bestExplicit.block.id,
      evidence: bestExplicit.evidence,
    };
  }

  const implicitCandidates = blocks
    .map((block) => ({ block, ...implicitEvidenceScore(block, profile) }))
    .sort((a, b) => b.score - a.score);

  const bestImplicit = implicitCandidates[0];
  if (bestImplicit && bestImplicit.score >= 62) {
    return {
      ctaExists: true,
      ctaState: "implicit",
      ctaType: "implicit",
      cta: bestImplicit.block.text,
      confidence: bestImplicit.score,
      candidateBlockId: bestImplicit.block.id,
      evidence: bestImplicit.evidence,
    };
  }

  const noCtaConfidence = clamp(100 - Math.max(bestExplicit?.score ?? 0, bestImplicit?.score ?? 0));
  return {
    ctaExists: false,
    ctaState: "none",
    ctaType: "none",
    cta: null,
    confidence: Math.max(noCtaConfidence, 55),
    candidateBlockId: null,
    evidence: [
      "no candidate passed explicit CTA confidence threshold",
      "no candidate passed implicit CTA confidence threshold",
    ],
  };
}
