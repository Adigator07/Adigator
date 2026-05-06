/**
 * Text processing utilities for the Analyzer Agents
 */

export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type Platform = "instagram" | "meta" | "google" | "programmatic" | "auto";

export function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, " ") // Strip emojis
    .replace(/[^\w\s]/g, " ")                // Strip punctuation
    .replace(/[-_]+/g, " ")                  // Normalize separators
    .replace(/(.)\1{2,}/g, "$1")             // Collapse repeated chars
    .replace(/\s+/g, " ")                    // Collapse whitespace
    .trim();
}

export function aggressiveNorm(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Shared OCR bounding-box format */
export interface OcrBlock {
  block_id: string;
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  font_size_px: number | null;
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function normalizeOCRText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\n\r]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyIncludes(text: string, keyword: string): boolean {
  const normText = normalizeOCRText(text);
  const normKeyword = normalizeOCRText(keyword);
  const compactText = normText.replace(/\s+/g, "");
  const compactKeyword = normKeyword.replace(/\s+/g, "");

  if (normText.includes(normKeyword)) return true;
  if (compactText.includes(compactKeyword)) return true;

  const words = normText.split(" ");
  for (const word of words) {
    if (levenshtein(word, normKeyword) <= 2) return true;
  }
  
  if (compactText.length >= compactKeyword.length) {
    for (let i = 0; i <= compactText.length - compactKeyword.length; i++) {
      const sub = compactText.substring(i, i + compactKeyword.length);
      if (levenshtein(sub, compactKeyword) <= 2) return true;
    }
  }

  return false;
}

const COMMON_WORDS = new Set(["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "is", "are", "buy", "shop", "order", "free", "sale", "off"]);

export function isOcrLowQuality(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return true;

  const totalCount = trimmed.replace(/\s/g, '').length;
  if (totalCount === 0) return true;

  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphanumericCount / totalCount < 0.6) return true;

  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return true;

  const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgLength < 2.5) return true;

  const normWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ""));
  const hasEnglishWord = normWords.some(w => COMMON_WORDS.has(w));
  if (!hasEnglishWord && words.length > 2) return true;

  let mixedCaseCount = 0;
  for (const word of words) {
    if (word.length > 3 && /[a-z]/.test(word) && /[A-Z]/.test(word)) {
      let altCount = 0;
      for (let i = 0; i < word.length - 1; i++) {
        const isUpper1 = word[i] === word[i].toUpperCase() && /[a-zA-Z]/.test(word[i]);
        const isUpper2 = word[i+1] === word[i+1].toUpperCase() && /[a-zA-Z]/.test(word[i+1]);
        if (isUpper1 !== isUpper2 && /[a-zA-Z]/.test(word[i]) && /[a-zA-Z]/.test(word[i+1])) {
          altCount++;
        }
      }
      if (altCount > word.length / 2) mixedCaseCount++;
    }
  }
  if (mixedCaseCount > words.length / 3) return true;

  return false;
}
