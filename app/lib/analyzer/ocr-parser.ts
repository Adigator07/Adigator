/**
 * ACIE v5.0 — Module 2: OCR Parser
 *
 * Takes raw OCR text (from Google Vision or any OCR provider) and parses it
 * into a structured semantic schema.
 *
 * Why parse before AI?
 * Raw OCR text is noisy. Passing structured fields to GPT gives dramatically
 * more reliable strategic reasoning than dumping raw strings.
 */

import type { OCRStructure } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// WORD DICTIONARIES (curated, documented)
// ─────────────────────────────────────────────────────────────────────────────

/** Words that create temporal or scarcity pressure → conversion signal. */
const URGENCY_WORDS = new Set([
  "now", "today", "hurry", "limited", "exclusive", "ends", "last", "only",
  "soon", "instantly", "immediately", "deadline", "expire", "final", "offer",
  "flash", "quick", "fast", "urgent", "rush", "countdown",
]);

/** Words that trigger emotional response → awareness signal. */
const EMOTIONAL_WORDS = new Set([
  "love", "hate", "fear", "hope", "dream", "joy", "pain", "freedom",
  "happiness", "pride", "care", "trust", "feel", "amazing", "incredible",
  "powerful", "inspire", "transform", "beautiful", "perfect", "thrill",
]);

/** Words describing an outcome the audience wants → persuasion signal. */
const BENEFIT_WORDS = new Set([
  "save", "gain", "boost", "improve", "grow", "achieve", "maximize",
  "unlock", "increase", "reduce", "eliminate", "solve", "fix", "protect",
  "accelerate", "win", "earn", "get", "results", "success",
]);

/** Words establishing credibility → trust / consideration signal. */
const TRUST_WORDS = new Set([
  "certified", "guaranteed", "trusted", "award", "rated", "proven",
  "official", "verified", "secure", "safe", "warranty", "quality",
  "premium", "approved", "accredited", "backed", "endorsed",
]);

/** Technical or feature descriptors → consideration signal. */
const FEATURE_WORDS = new Set([
  "fast", "secure", "hd", "wireless", "ai", "smart", "advanced", "new",
  "latest", "precision", "ultra", "pro", "plus", "max", "turbo", "next-gen",
  "battery", "display", "camera", "memory", "speed", "performance",
]);

/** Words indicating comparison or evaluation → consideration signal. */
const COMPARISON_WORDS = new Set([
  "vs", "versus", "compare", "better", "best", "top", "ranked", "leading",
  "superior", "ahead", "outperform", "#1", "number one", "than",
]);

/** Common CTA phrases that indicate direct action prompts. */
const CTA_PATTERNS = [
  /buy\s*now/i, /shop\s*now/i, /order\s*now/i, /get\s*started/i,
  /sign\s*up/i, /subscribe/i, /claim\s*(your|offer|deal)?/i,
  /download/i, /install/i, /learn\s*more/i, /discover/i, /explore/i,
  /book\s*now/i, /reserve/i, /try\s*(for\s*free|now|it)?/i,
  /start\s*(your|free)?/i, /get\s*(your|free|it)/i, /grab/i,
  /register/i, /join\s*(now|free|us)?/i, /watch\s*now/i,
];

/** Regex patterns for price detection. */
const PRICE_PATTERN = /(?:£|\$|€|¥|₹|usd|eur|gbp)\s*[\d,.]+|[\d,.]+\s*(?:£|\$|€|¥|₹)/gi;

/** Regex patterns for discount detection. */
const DISCOUNT_PATTERN = /\d+\s*%\s*off|\bsave\s+\d+%|\bdiscount\b|\boff\b|\bdeal\b|\bsale\b/gi;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function matchFromSet(tokens: string[], wordSet: Set<string>): string[] {
  return [...new Set(tokens.filter((t) => wordSet.has(t)))];
}

/**
 * Heuristically find the headline: the shortest, most prominent line.
 * We assume the first non-empty line with fewer than 10 words is the headline.
 */
function extractHeadline(lines: string[]): string | null {
  const candidates = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.split(" ").length <= 10);
  return candidates[0] || null;
}

function extractSubheadline(lines: string[], headline: string | null): string | null {
  const rest = lines.filter((l) => l.trim() !== headline?.trim());
  const candidates = rest
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.split(" ").length <= 15);
  return candidates[0] || null;
}

function extractCTA(fullText: string): string | null {
  for (const pattern of CTA_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

/**
 * Brand detection heuristic: look for all-caps words or proper nouns
 * with 3–20 chars that appear early in the text.
 * Note: This is supplemented by Vision OCR logo detection in the full pipeline.
 */
function extractBrandName(lines: string[]): string | null {
  // Take first 5 lines, look for all-caps words (typical for brand logos)
  for (const line of lines.slice(0, 5)) {
    const words = line.trim().split(" ");
    for (const word of words) {
      if (word.length >= 3 && word.length <= 20 && word === word.toUpperCase() && /^[A-Z]/.test(word)) {
        return word;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse raw OCR text into a structured semantic schema.
 * Input: raw string from Google Vision or any OCR provider.
 * Output: OCRStructure — no AI involved.
 */
export function parseOCR(rawText: string): OCRStructure {
  if (!rawText || rawText.trim().length === 0) {
    return emptyOCRStructure();
  }

  const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
  const tokens = tokenize(rawText);
  const fullTextLower = rawText.toLowerCase();

  const headline = extractHeadline(lines);
  const subheadline = extractSubheadline(lines, headline);
  const ctaPhrase = extractCTA(rawText);
  const brandName = extractBrandName(lines);

  const priceMatches = rawText.match(PRICE_PATTERN);
  const price = priceMatches ? priceMatches[0].trim() : null;

  const discountMatches = rawText.match(DISCOUNT_PATTERN);
  const discount = discountMatches ? discountMatches[0].trim() : null;

  const urgencyWords = matchFromSet(tokens, URGENCY_WORDS);
  const emotionalWords = matchFromSet(tokens, EMOTIONAL_WORDS);
  const benefitWords = matchFromSet(tokens, BENEFIT_WORDS);
  const trustWords = matchFromSet(tokens, TRUST_WORDS);
  const featureWords = matchFromSet(tokens, FEATURE_WORDS);
  const comparisonWords = matchFromSet(tokens, COMPARISON_WORDS);

  const wordCount = tokens.length;
  const charCount = rawText.replace(/\s/g, "").length;

  console.log(`[OCRParser] headline="${headline}" cta="${ctaPhrase}" words=${wordCount} urgency=${urgencyWords.length}`);

  return {
    headline,
    subheadline,
    ctaPhrase,
    brandName,
    price,
    discount,
    urgencyWords,
    emotionalWords,
    benefitWords,
    trustWords,
    featureWords,
    comparisonWords,
    rawText,
    wordCount,
    charCount,
  };
}

function emptyOCRStructure(): OCRStructure {
  return {
    headline: null, subheadline: null, ctaPhrase: null, brandName: null,
    price: null, discount: null,
    urgencyWords: [], emotionalWords: [], benefitWords: [],
    trustWords: [], featureWords: [], comparisonWords: [],
    rawText: "", wordCount: 0, charCount: 0,
  };
}
