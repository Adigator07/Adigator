export interface TextSignalInput {
  text: string;
  ocrConfidence: number;
  wordCount: number;
  lineCount: number;
  textAreaPercent: number;
  minTextHeightPx: number;
}

export interface TextSignalResult {
  rawText: string;
  normalizedText: string;
  wordCount: number;
  lineCount: number;
  clarity: number;
  hasTooMuchText: boolean;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9%$\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeTextSignals(input: TextSignalInput): TextSignalResult {
  const normalizedText = normalizeText(input.text);

  const confidenceScore = clamp(input.ocrConfidence);
  const densityPenalty = clamp((input.textAreaPercent - 28) * 1.5, 0, 35);
  const crowdingPenalty = input.wordCount > 34 ? 18 : input.wordCount > 24 ? 10 : input.wordCount > 16 ? 4 : 0;
  const legibilityBoost = input.minTextHeightPx >= 14 ? 10 : input.minTextHeightPx >= 11 ? 4 : -8;

  const clarity = clamp(Math.round(confidenceScore - densityPenalty - crowdingPenalty + legibilityBoost));
  const hasTooMuchText = input.wordCount > 32 || input.textAreaPercent > 40 || input.lineCount > 8;

  return {
    rawText: input.text,
    normalizedText,
    wordCount: input.wordCount,
    lineCount: input.lineCount,
    clarity,
    hasTooMuchText,
  };
}
