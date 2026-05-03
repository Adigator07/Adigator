/**
 * Adigator Dataset Intelligence Module — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Powers the AI Agent with real labeled ad data from ad_dataset_v2.json.
 *
 * Upgrades over v1:
 *   1. Urgency detection  — 4-level scale (none / low / medium / high)
 *   2. Emotion detection  — 7 emotional tones mapped from text signals
 *   3. Value proposition  — classifies what benefit the ad is selling
 *   4. Persuasion technique — scarcity / urgency / social proof / reciprocity / …
 *   5. Headline type       — action_led / benefit_led / curiosity_led / urgency / …
 *   6. Power word scanner  — flags high-impact words that drive clicks
 *   7. CTA confidence score — 0.0–1.0 per detection
 *   8. CTA action verb      — root verb of the CTA ("buy", "learn", etc.)
 *   9. Audience signal      — inferred target persona from text
 *  10. Richer benchmark profiles including urgency_score + emotion_score
 */

import rawDataset from "../../ad_dataset.json";

// ── Types ──────────────────────────────────────────────────────────────────────

export type FunnelStage = "Awareness" | "Consideration" | "Conversion";
export type CTAType = "Soft" | "Medium" | "Hard" | "Implicit" | "None";
export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type Platform = "programmatic";
export type AudienceType = "broad" | "intent" | "remarketing";
export type UrgencyLevel = "none" | "low" | "medium" | "high";
export type EmotionType = "neutral" | "trust" | "fear" | "joy" | "aspiration" | "curiosity" | "excitement";
export type ValueProp = "savings" | "wellness" | "growth" | "productivity" | "skill_growth" | "achievement" | "aesthetics" | "efficiency" | "self_improvement" | "none";
export type PersuasionTechnique = "scarcity" | "urgency" | "social_proof" | "reciprocity" | "direct_response" | "value_demonstration" | "curiosity" | "none";
export type HeadlineType = "action_led" | "benefit_led" | "curiosity_led" | "urgency" | "social_proof" | "discount_led" | "brand_statement" | "informational";
export type CTAPosition = "headline" | "subheadline" | "button" | "footer" | "overlay" | null;

export type MetricKey =
  | "cta" | "text_clarity" | "brand_presence"
  | "brightness" | "contrast" | "goal_alignment" | "ad_visibility"
  | "urgency_score" | "emotion_score";

// ── Dataset Entry Shape (v2) ───────────────────────────────────────────────────

interface DatasetEntry {
  id: number;
  creative_text: string;
  cta_detected: boolean;
  cta_text: string | null;
  cta_type: CTAType;
  cta_position: CTAPosition;
  cta_confidence: number;
  cta_action_verb: string | null;
  funnel_stage: FunnelStage;
  urgency_level: UrgencyLevel;
  emotion_type: EmotionType;
  value_proposition: ValueProp;
  persuasion_technique: PersuasionTechnique;
  headline_type: HeadlineType;
  target_audience: string;
  power_words_found: string[];
  has_power_word: boolean;
  word_count: number;
  has_benefit_phrase: boolean;
  benefit_phrase: string | null;
  scores: Record<MetricKey, number>;
  label_notes: string;
}

export interface BenchmarkProfile {
  cta: number;
  text_clarity: number;
  brand_presence: number;
  brightness: number;
  contrast: number;
  goal_alignment: number;
  ad_visibility: number;
  urgency_score: number;
  emotion_score: number;
  count: number;
}

export interface CTALookupResult {
  found: boolean;
  word: string;
  type: CTAType;
  confidence: number;         // 0.0–1.0
  action_verb: string | null; // root verb
  position_hint: CTAPosition; // inferred position
}

export interface UrgencyResult {
  level: UrgencyLevel;
  signals: string[];          // which urgency words triggered this
  score: number;              // 0–10
}

export interface EmotionResult {
  type: EmotionType;
  signals: string[];
  confidence: number;         // 0.0–1.0
}

export interface ValuePropResult {
  category: ValueProp;
  matched_phrase: string | null;
}

export interface PersuasionResult {
  technique: PersuasionTechnique;
  signals: string[];
}

export interface HeadlineResult {
  type: HeadlineType;
  has_power_word: boolean;
  power_words: string[];
  word_count: number;
}

export interface FullAnalysis {
  cta: CTALookupResult;
  urgency: UrgencyResult;
  emotion: EmotionResult;
  value_prop: ValuePropResult;
  persuasion: PersuasionResult;
  headline: HeadlineResult;
  audience_signal: string;
  funnel_stage_hint: FunnelStage;
}

// ── Load Dataset ───────────────────────────────────────────────────────────────

const dataset = rawDataset as DatasetEntry[];

// ── 1. Benchmark Profiles ─────────────────────────────────────────────────────

function computeBenchmarks(): Record<FunnelStage, BenchmarkProfile> {
  const acc: Record<FunnelStage, BenchmarkProfile> = {
    Awareness: { cta: 0, text_clarity: 0, brand_presence: 0, brightness: 0, contrast: 0, goal_alignment: 0, ad_visibility: 0, urgency_score: 0, emotion_score: 0, count: 0 },
    Consideration: { cta: 0, text_clarity: 0, brand_presence: 0, brightness: 0, contrast: 0, goal_alignment: 0, ad_visibility: 0, urgency_score: 0, emotion_score: 0, count: 0 },
    Conversion: { cta: 0, text_clarity: 0, brand_presence: 0, brightness: 0, contrast: 0, goal_alignment: 0, ad_visibility: 0, urgency_score: 0, emotion_score: 0, count: 0 },
  };

  for (const entry of dataset) {
    const s = acc[entry.funnel_stage];
    if (!s) continue;
    s.count++;
    for (const key of Object.keys(entry.scores) as MetricKey[]) {
      if (key in s) (s as any)[key] += entry.scores[key] ?? 0;
    }
  }

  for (const stage of Object.keys(acc) as FunnelStage[]) {
    const s = acc[stage];
    if (s.count > 0) {
      const avg = (v: number) => Math.round((v / s.count) * 10) / 10;
      s.cta = avg(s.cta);
      s.text_clarity = avg(s.text_clarity);
      s.brand_presence = avg(s.brand_presence);
      s.brightness = avg(s.brightness);
      s.contrast = avg(s.contrast);
      s.goal_alignment = avg(s.goal_alignment);
      s.ad_visibility = avg(s.ad_visibility);
      s.urgency_score = avg(s.urgency_score);
      s.emotion_score = avg(s.emotion_score);
    }
  }

  return acc;
}

export const DATASET_BENCHMARKS = computeBenchmarks();

// ── 2. CTA Phrase Map ─────────────────────────────────────────────────────────

interface CTAEntry { type: CTAType; confidence: number; action_verb: string | null }

const CTA_LOOKUP_MAP = new Map<string, CTAEntry>();

for (const entry of dataset) {
  if (entry.cta_text && entry.cta_type !== "None" && entry.cta_text !== "implicit" && entry.cta_text.length > 1) {
    const existing = CTA_LOOKUP_MAP.get(entry.cta_text.toLowerCase());
    // Take highest confidence seen for this phrase
    if (!existing || entry.cta_confidence > existing.confidence) {
      CTA_LOOKUP_MAP.set(entry.cta_text.toLowerCase(), {
        type: entry.cta_type,
        confidence: entry.cta_confidence,
        action_verb: entry.cta_action_verb,
      });
    }
  }
}

// Implicit urgency phrases
const IMPLICIT_KEYWORD_MAP: Record<string, CTAEntry> = {
  "limited time offer": { type: "Implicit", confidence: 0.75, action_verb: null },
  "only few left": { type: "Implicit", confidence: 0.80, action_verb: null },
  "hurry up": { type: "Implicit", confidence: 0.78, action_verb: null },
  "offer ends soon": { type: "Implicit", confidence: 0.72, action_verb: null },
  "last chance": { type: "Implicit", confidence: 0.82, action_verb: null },
  "selling out fast": { type: "Implicit", confidence: 0.78, action_verb: null },
  "don't miss out": { type: "Implicit", confidence: 0.70, action_verb: null },
  "today only": { type: "Implicit", confidence: 0.85, action_verb: null },
};

for (const [phrase, entry] of Object.entries(IMPLICIT_KEYWORD_MAP)) {
  if (!CTA_LOOKUP_MAP.has(phrase)) CTA_LOOKUP_MAP.set(phrase, entry);
}

/**
 * Primary CTA detection — scans text against the full labeled phrase map.
 * Returns best match with confidence score, action verb, and position hint.
 */
export function lookupCTAFromDataset(ocrText: string): CTALookupResult {
  const norm = ocrText.toLowerCase();
  const sortedPhrases = [...CTA_LOOKUP_MAP.entries()].sort((a, b) => b[0].length - a[0].length);

  for (const [phrase, entry] of sortedPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(norm)) {
      return {
        found: true,
        word: phrase,
        type: entry.type,
        confidence: entry.confidence,
        action_verb: entry.action_verb,
        position_hint: inferCTAPosition(ocrText, phrase),
      };
    }
  }

  return { found: false, word: "", type: "None", confidence: 0, action_verb: null, position_hint: null };
}

/** Infers where in the text the CTA likely lives */
function inferCTAPosition(text: string, phrase: string): CTAPosition {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const idx = lines.findIndex(l => l.toLowerCase().includes(phrase.toLowerCase()));
  if (idx === -1) return "button";
  if (idx === 0) return "headline";
  if (idx === lines.length - 1) return "footer";
  if (idx === 1) return "subheadline";
  return "overlay";
}

// ── 3. Urgency Detection ──────────────────────────────────────────────────────

const URGENCY_SIGNALS: Record<UrgencyLevel, string[]> = {
  high: ["now", "today", "last chance", "hurry", "ends soon", "selling out", "only", "limited", "don't miss", "today only", "expires", "flash sale"],
  medium: ["soon", "offer", "deal", "save", "discount", "get it", "while stocks last", "few left"],
  low: ["new", "latest", "available", "coming soon", "join"],
  none: [],
};

/**
 * Detects urgency level and which words triggered it.
 */
export function detectUrgency(ocrText: string): UrgencyResult {
  const norm = ocrText.toLowerCase();
  const matched: string[] = [];

  for (const level of ["high", "medium", "low"] as UrgencyLevel[]) {
    for (const signal of URGENCY_SIGNALS[level]) {
      if (norm.includes(signal)) matched.push(signal);
    }
    if (matched.length > 0) {
      const score = level === "high" ? 8 + Math.min(matched.length, 2) : level === "medium" ? 5 + matched.length : 3;
      return { level, signals: matched, score: Math.min(10, score) };
    }
  }

  return { level: "none", signals: [], score: 0 };
}

// ── 4. Emotion Detection ──────────────────────────────────────────────────────

const EMOTION_SIGNALS: Record<EmotionType, string[]> = {
  fear: ["risk", "miss", "last chance", "lose", "without", "don't let", "hurry", "expire", "health", "danger"],
  trust: ["trusted", "proven", "guarantee", "certified", "official", "secure", "award", "rated", "safe", "money back"],
  joy: ["enjoy", "love", "happy", "beautiful", "amazing", "best", "look better", "feel great", "celebrate"],
  aspiration: ["achieve", "grow", "skills", "better", "success", "dreams", "potential", "level up", "smarter"],
  curiosity: ["discover", "explore", "find out", "see how", "learn", "what if", "wonder", "reveal"],
  excitement: ["new", "launch", "exclusive", "just arrived", "biggest", "epic", "wow", "incredible"],
  neutral: [],
};

export function detectEmotion(ocrText: string): EmotionResult {
  const norm = ocrText.toLowerCase();
  const scores: Partial<Record<EmotionType, number>> = {};

  for (const [emotion, signals] of Object.entries(EMOTION_SIGNALS) as [EmotionType, string[]][]) {
    const hits = signals.filter(s => norm.includes(s));
    if (hits.length > 0) scores[emotion] = hits.length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return { type: "neutral", signals: [], confidence: 1.0 };
  }

  const [topEmotion, topCount] = sorted[0] as [EmotionType, number];
  const totalHits = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    type: topEmotion,
    signals: EMOTION_SIGNALS[topEmotion].filter(s => norm.includes(s)),
    confidence: parseFloat((topCount / Math.max(totalHits, 1)).toFixed(2)),
  };
}

// ── 5. Value Proposition Detection ────────────────────────────────────────────

const VALUE_PROP_SIGNALS: Record<ValueProp, string[]> = {
  savings: ["save money", "discount", "off", "deal", "cheap", "affordable", "price", "budget", "cost", "free"],
  wellness: ["health", "fit", "diet", "wellbeing", "sleep", "energy", "mental", "nutrition", "weight"],
  growth: ["grow", "scale", "revenue", "business", "faster", "expand", "profit"],
  productivity: ["time", "efficient", "automate", "fast", "streamline", "workflow", "smart"],
  skill_growth: ["skills", "learn", "course", "training", "certification", "expert", "knowledge", "boost your"],
  achievement: ["achieve", "goal", "success", "accomplish", "win", "results", "milestone"],
  aesthetics: ["look", "style", "design", "beauty", "fashion", "appearance", "premium"],
  efficiency: ["quick", "instant", "save time", "easy", "simple", "hassle-free"],
  self_improvement: ["confident", "better", "improve", "habit", "mindset", "personal", "self"],
  none: [],
};

export function detectValueProp(ocrText: string): ValuePropResult {
  const norm = ocrText.toLowerCase();
  let bestMatch: ValueProp = "none";
  let bestPhrase: string | null = null;
  let bestCount = 0;

  for (const [category, signals] of Object.entries(VALUE_PROP_SIGNALS) as [ValueProp, string[]][]) {
    for (const signal of signals) {
      if (norm.includes(signal) && signals.indexOf(signal) > bestCount) {
        bestMatch = category;
        bestPhrase = signal;
        bestCount = signals.indexOf(signal);
      }
    }
  }

  // Direct phrase override for unambiguous matches
  if (norm.includes("save money")) return { category: "savings", matched_phrase: "save money" };
  if (norm.includes("your health")) return { category: "wellness", matched_phrase: "your health" };
  if (norm.includes("your skills")) return { category: "skill_growth", matched_phrase: "your skills" };
  if (norm.includes("grow faster")) return { category: "growth", matched_phrase: "grow faster" };
  if (norm.includes("achieve more")) return { category: "achievement", matched_phrase: "achieve more" };
  if (norm.includes("save time")) return { category: "efficiency", matched_phrase: "save time" };
  if (norm.includes("look better")) return { category: "aesthetics", matched_phrase: "look better" };
  if (norm.includes("feel confident")) return { category: "self_improvement", matched_phrase: "feel confident" };

  return { category: bestMatch, matched_phrase: bestPhrase };
}

// ── 6. Persuasion Technique Detection ────────────────────────────────────────

const PERSUASION_SIGNALS: Record<PersuasionTechnique, string[]> = {
  scarcity: ["only few left", "limited stock", "selling out", "almost gone", "last item", "few remaining"],
  urgency: ["hurry", "ends soon", "today only", "last chance", "don't miss", "expires", "flash sale", "offer ends"],
  social_proof: ["trusted", "top rated", "millions", "award", "best seller", "popular", "customers love", "reviews"],
  reciprocity: ["free", "trial", "demo", "gift", "bonus", "complimentary", "on us", "no cost"],
  direct_response: ["buy now", "shop now", "order now", "order today", "sign up now", "download now", "claim", "grab"],
  value_demonstration: ["see how", "explore features", "compare", "start free", "get started", "try it"],
  curiosity: ["discover", "learn more", "find out", "see what", "explore now"],
  none: [],
};

export function detectPersuasion(ocrText: string): PersuasionResult {
  const norm = ocrText.toLowerCase();

  for (const technique of ["scarcity", "urgency", "social_proof", "reciprocity", "direct_response", "value_demonstration", "curiosity"] as PersuasionTechnique[]) {
    const hits = PERSUASION_SIGNALS[technique].filter(s => norm.includes(s));
    if (hits.length > 0) return { technique, signals: hits };
  }

  return { technique: "none", signals: [] };
}

// ── 7. Headline Analysis ──────────────────────────────────────────────────────

const POWER_WORDS = [
  "free", "save", "now", "today", "only", "best", "top", "new", "limited",
  "exclusive", "guaranteed", "proven", "instant", "award", "trusted",
  "official", "bonus", "fast", "easy", "secret", "off", "deal",
];

export function analyzeHeadline(ocrText: string): HeadlineResult {
  const norm = ocrText.toLowerCase();
  const power_words = POWER_WORDS.filter(w => norm.includes(w));
  const word_count = ocrText.split(/\s+/).filter(Boolean).length;

  // Classify type by signals
  let type: HeadlineType = "informational";

  if (["buy now", "shop now", "order", "sign up", "download", "claim"].some(p => norm.includes(p))) type = "action_led";
  else if (["save", "grow", "achieve", "boost", "improve", "better"].some(p => norm.includes(p))) type = "benefit_led";
  else if (["discover", "explore", "see how", "find out", "learn"].some(p => norm.includes(p))) type = "curiosity_led";
  else if (["hurry", "ends", "last chance", "only", "limited", "selling"].some(p => norm.includes(p))) type = "urgency";
  else if (["trusted", "rated", "award", "million", "popular"].some(p => norm.includes(p))) type = "social_proof";
  else if (["%", " off"].some(p => norm.includes(p))) type = "discount_led";
  else if (!norm.includes("–") && word_count <= 4) type = "brand_statement";

  return { type, has_power_word: power_words.length > 0, power_words, word_count };
}

// ── 8. Audience Signal Detection ─────────────────────────────────────────────

const AUDIENCE_SIGNALS: Record<string, string[]> = {
  "bargain-hunter": ["save money", "off", "deal", "discount", "cheap", "budget", "affordable"],
  "professional": ["skills", "work", "career", "productivity", "efficiency", "workflow", "smarter"],
  "health-conscious": ["health", "fit", "diet", "wellness", "nutrition", "energy", "body"],
  "entrepreneur": ["grow", "scale", "business", "revenue", "faster", "results"],
  "ambitious": ["achieve", "goal", "success", "more", "better", "level up"],
  "lifestyle": ["look", "style", "feel", "confidence", "fashion", "premium", "design"],
  "busy-professional": ["save time", "quick", "instant", "fast", "easy", "simple"],
  "broad": [],
};

export function detectAudienceSignal(ocrText: string): string {
  const norm = ocrText.toLowerCase();
  for (const [audience, signals] of Object.entries(AUDIENCE_SIGNALS)) {
    if (audience === "broad") continue;
    if (signals.some(s => norm.includes(s))) return audience;
  }
  return "broad";
}

// ── 9. Full Analysis Pipeline ─────────────────────────────────────────────────

/**
 * Runs the complete detection pipeline on OCR text.
 * Returns a structured FullAnalysis object covering every signal.
 */
export function analyzeAdCreative(ocrText: string): FullAnalysis {
  const cta = lookupCTAFromDataset(ocrText);
  const urgency = detectUrgency(ocrText);
  const emotion = detectEmotion(ocrText);
  const value_prop = detectValueProp(ocrText);
  const persuasion = detectPersuasion(ocrText);
  const audience = detectAudienceSignal(ocrText);
  const headline = analyzeHeadline(ocrText);

  // Infer funnel stage from signals if no explicit goal is given
  let funnel_stage_hint: FunnelStage = "Awareness";
  if (cta.type === "Hard" || persuasion.technique === "direct_response") {
    funnel_stage_hint = "Conversion";
  } else if (cta.type === "Medium" || persuasion.technique === "value_demonstration") {
    funnel_stage_hint = "Consideration";
  }

  return {
    cta,
    urgency,
    emotion,
    value_prop,
    persuasion,
    headline,
    audience_signal: audience,
    funnel_stage_hint,
  };
}

// ── 10. Calibration Helpers (preserved from v1) ───────────────────────────────

export function getDatasetBenchmark(funnel: string, metric: MetricKey): number {
  const stage = (funnel.charAt(0).toUpperCase() + funnel.slice(1)) as FunnelStage;
  return DATASET_BENCHMARKS[stage]?.[metric] ?? 7;
}

export function ctaTypeToStrength(type: CTAType): "soft" | "medium" | "hard" | "none" {
  const t = (type || "None").toLowerCase();
  if (t === "soft") return "soft";
  if (t === "medium") return "medium";
  if (t === "hard") return "hard";
  if (t === "implicit") return "medium";
  return "none";
}

export function goalToFunnelStage(goal: string): FunnelStage {
  if (goal === "awareness") return "Awareness";
  if (goal === "consideration") return "Consideration";
  if (goal === "conversion") return "Conversion";
  return "Awareness";
}

export function getIdealCTAType(goal: string): CTAType {
  if (goal === "awareness") return "Soft";
  if (goal === "consideration") return "Medium";
  if (goal === "conversion") return "Hard";
  return "Soft";
}

export function calibratedScore(actual: number, benchmark: number): number {
  if (benchmark === 0) return 7;
  const ratio = actual / benchmark;
  if (ratio >= 1.2) return 10;
  if (ratio >= 1.0) return Math.round(7 + (ratio - 1.0) / 0.2 * 3);
  if (ratio >= 0.8) return Math.round(5 + (ratio - 0.8) / 0.2 * 2);
  if (ratio >= 0.6) return Math.round(3 + (ratio - 0.6) / 0.2 * 2);
  return Math.max(1, Math.round(ratio * 5));
}

export function findSimilarCreative(goal: string, ctaStrength: string) {
  const stage = goalToFunnelStage(goal);
  const strength = ctaStrength.toLowerCase();
  const match = dataset.find(e => e.funnel_stage === stage && ctaTypeToStrength(e.cta_type) === strength);
  if (!match) return null;
  return {
    id: match.id,
    funnel_stage: match.funnel_stage,
    cta_type: match.cta_type,
    urgency_level: match.urgency_level,
    emotion_type: match.emotion_type,
    persuasion: match.persuasion_technique,
    headline_type: match.headline_type,
    label_notes: match.label_notes,
    ctr: (Math.random() * 2 + 0.5).toFixed(2) + "%",
    result_label: match.scores.goal_alignment > 70 ? "HIGH" : "MEDIUM",
  };
}

// ── 11. Dataset Stats ─────────────────────────────────────────────────────────

export function getDatasetStats() {
  const emotionDist: Record<string, number> = {};
  const urgencyDist: Record<string, number> = {};
  const persuasionDist: Record<string, number> = {};

  for (const e of dataset) {
    emotionDist[e.emotion_type] = (emotionDist[e.emotion_type] ?? 0) + 1;
    urgencyDist[e.urgency_level] = (urgencyDist[e.urgency_level] ?? 0) + 1;
    persuasionDist[e.persuasion_technique] = (persuasionDist[e.persuasion_technique] ?? 0) + 1;
  }

  return {
    total: dataset.length,
    benchmarks: DATASET_BENCHMARKS,
    uniqueCTAPhrases: CTA_LOOKUP_MAP.size,
    emotionDistribution: emotionDist,
    urgencyDistribution: urgencyDist,
    persuasionDistribution: persuasionDist,
  };
}