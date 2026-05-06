import rawDataset from "../../../ad_dataset.json";

export interface CTADetectionResult {
  detected: boolean;
  text: string;
  strength: "low" | "medium" | "high";
  confidence: number;
  datasetCalibration: number;
}

export interface CTACandidate {
  rawText: string;
  normalizedText?: string;
  centerX?: number;
  centerY?: number;
  relativeCenterX?: number;
  relativeCenterY?: number;
  textHeight?: number;
  visibilityScore?: number;
  buttonScore?: number;
}

export interface CTADetectionInput {
  normalizedText: string;
  candidates?: CTACandidate[];
  minTextHeightPx?: number;
  maxTextHeightPx?: number;
}

interface DatasetCTA {
  cta_text?: string | null;
  cta_action_verb?: string | null;
  cta_confidence?: number;
  cta_detected?: boolean;
}

const ACTION_VERBS = [
  "buy", "shop", "get", "explore", "claim", "order", "download", "start",
  "join", "learn", "discover", "book", "try", "subscribe", "register", "upgrade",
];

const URGENCY_WORDS = [
  "now", "today", "limited", "hurry", "ends", "soon", "last chance", "expires", "only",
];

const CTA_DICTIONARY = [
  "buy now",
  "shop now",
  "order now",
  "get offer",
  "register now",
  "sign up",
  "learn more",
];

const datasetEntries = rawDataset as DatasetCTA[];

const datasetCTAPhrases = datasetEntries
  .map((entry) => entry.cta_text?.toLowerCase().trim() ?? "")
  .filter((value) => value.length > 1 && value !== "implicit");

const datasetVerbConfidence = datasetEntries.reduce<Record<string, number[]>>((acc, entry) => {
  const verb = entry.cta_action_verb?.toLowerCase().trim();
  if (!verb || !entry.cta_detected) {
    return acc;
  }

  if (!acc[verb]) {
    acc[verb] = [];
  }

  acc[verb].push(Math.max(0, Math.min(1, entry.cta_confidence ?? 0)));
  return acc;
}, {});

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[0]/g, "o")
    .replace(/[1|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row++) matrix[row][0] = row;
  for (let col = 0; col < cols; col++) matrix[0][col] = col;

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const substitutionCost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + substitutionCost,
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function similarity(left: string, right: string): number {
  const normalizedLeft = normalizeForMatch(left);
  const normalizedRight = normalizeForMatch(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return 0.96;
  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  return clampUnit(1 - distance / Math.max(normalizedLeft.length, normalizedRight.length));
}

function derivePositionScore(candidate: CTACandidate): number {
  const x = candidate.relativeCenterX ?? candidate.centerX ?? 0.5;
  const y = candidate.relativeCenterY ?? candidate.centerY ?? 0.5;
  const inBottomBand = y >= 0.6;
  const bottomCenter = inBottomBand && x >= 0.3 && x <= 0.7;
  const bottomRight = inBottomBand && x >= 0.68;
  const center = y >= 0.35 && y <= 0.68 && x >= 0.28 && x <= 0.72;

  if (bottomCenter) return 1;
  if (bottomRight) return 0.92;
  if (center) return 0.78;
  if (inBottomBand) return 0.7;
  return 0.35;
}

function deriveVisibilityScore(candidate: CTACandidate, minTextHeightPx?: number, maxTextHeightPx?: number): number {
  if (typeof candidate.visibilityScore === "number") {
    return clampUnit(candidate.visibilityScore);
  }

  const height = candidate.textHeight ?? minTextHeightPx ?? 0;
  const maxHeight = Math.max(maxTextHeightPx ?? height, height, 1);
  const normalizedHeight = height / maxHeight;

  if (height <= 0) return 0.35;
  if (height < 10) return 0.25;
  if (height < 14) return 0.45;
  return clampUnit(0.45 + normalizedHeight * 0.45);
}

function buildFallbackCandidates(normalizedText: string): CTACandidate[] {
  return normalizedText
    .split(/\n|\.|\||,/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ rawText: line, normalizedText: normalizeForMatch(line) }));
}

function bestDictionaryMatch(candidateText: string): { phrase: string; score: number } {
  const normalizedCandidate = normalizeForMatch(candidateText);
  let bestPhrase = "";
  let bestScore = 0;

  for (const phrase of CTA_DICTIONARY) {
    const score = similarity(normalizedCandidate, phrase);
    if (score > bestScore) {
      bestScore = score;
      bestPhrase = phrase;
    }
  }

  return { phrase: bestPhrase, score: bestScore };
}

function scoreCandidate(line: string): { score: number; calibration: number } {
  const normalized = line.toLowerCase();
  const verbHits = ACTION_VERBS.filter((verb) => normalized.includes(verb));
  if (verbHits.length === 0) {
    return { score: 0, calibration: 0 };
  }

  const urgencyHits = URGENCY_WORDS.filter((word) => normalized.includes(word));
  const datasetPhraseBoost = datasetCTAPhrases.some((phrase) => normalized.includes(phrase)) ? 10 : 0;

  const perVerbConfidence = verbHits
    .flatMap((verb) => datasetVerbConfidence[verb] ?? [])
    .reduce((sum, value, _, arr) => sum + value / arr.length, 0);

  const datasetCalibration = clamp(Math.round((perVerbConfidence - 0.5) * 12), -4, 4);
  const score = clamp(
    35 +
      verbHits.length * 18 +
      urgencyHits.length * 10 +
      (normalized.includes("!") ? 4 : 0) +
      datasetPhraseBoost +
      datasetCalibration,
    0,
    100
  );

  return { score, calibration: datasetCalibration };
}

export function detectCTA(input: string | CTADetectionInput): CTADetectionResult {
  const payload: CTADetectionInput = typeof input === "string"
    ? { normalizedText: input }
    : input;

  const candidates = payload.candidates && payload.candidates.length > 0
    ? payload.candidates
    : buildFallbackCandidates(payload.normalizedText);

  let bestResult: {
    text: string;
    confidence: number;
    strength: "low" | "medium" | "high";
    calibration: number;
  } = {
    text: "",
    confidence: 0,
    strength: "low",
    calibration: 0,
  };

  for (const candidate of candidates) {
    const sourceText = candidate.rawText || candidate.normalizedText || "";
    const normalizedCandidate = candidate.normalizedText || normalizeForMatch(sourceText);
    if (!normalizedCandidate) continue;

    const { phrase, score: fuzzyScore } = bestDictionaryMatch(normalizedCandidate);
    const keywordMatch = fuzzyScore >= 0.8 ? fuzzyScore : 0;
    const positionScore = derivePositionScore(candidate);
    const visibilityScore = deriveVisibilityScore(candidate, payload.minTextHeightPx, payload.maxTextHeightPx);
    const buttonScore = clampUnit(candidate.buttonScore ?? 0);

    const { calibration } = scoreCandidate(sourceText);
    const normalizedConfidence = clampUnit(
      keywordMatch * 0.4 +
      positionScore * 0.2 +
      visibilityScore * 0.2 +
      buttonScore * 0.2,
    );

    const strength: "low" | "medium" | "high" =
      normalizedConfidence < 0.6 || visibilityScore < 0.5
        ? "low"
        : normalizedConfidence < 0.8 || visibilityScore < 0.72
          ? "medium"
          : "high";

    if (normalizedConfidence > bestResult.confidence) {
      bestResult = {
        text: phrase || normalizedCandidate,
        confidence: normalizedConfidence,
        strength,
        calibration,
      };
    }
  }

  const detected = bestResult.confidence >= 0.3;

  return {
    detected,
    text: detected ? bestResult.text : "",
    strength: detected ? bestResult.strength : "low",
    confidence: clamp(Math.round(bestResult.confidence * 100)),
    datasetCalibration: bestResult.calibration,
  };
}
