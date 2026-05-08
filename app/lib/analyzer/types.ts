/**
 * ACIE v5.0 — Shared Type Contracts
 *
 * All modules in the Creative Intelligence Pipeline share these types.
 * This is the single source of truth for all data shapes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — Vision Metrics
// ─────────────────────────────────────────────────────────────────────────────

export interface DominantColor {
  hex: string;
  percentage: number; // 0–100
}

export interface VisionMetrics {
  /** Mean luminance 0–100. Low = dark, high = bright. */
  brightness: number;
  /** RMS contrast 0–100. Low = flat, high = punchy. */
  contrastLevel: number;
  /** Ratio of edge pixels to total 0–1. Higher = busier. */
  edgeDensity: number;
  /** Fraction of near-white pixels 0–1. Higher = more breathing room. */
  whitespaceRatio: number;
  /** Estimated fraction of image covered by text 0–100. */
  textAreaPercentage: number;
  /** Composite clutter index 0–1. Derived from edge density + text coverage. */
  visualClutterScore: number;
  /** Symmetry 0–100. 100 = perfectly balanced left/right halves. */
  layoutBalance: number;
  /** Normalized focal point 0–1 for x and y. */
  focalPointPosition: { x: number; y: number };
  /** Top dominant colors extracted from the image. */
  dominantColors: DominantColor[];
  /** Whether a human face was heuristically detected. */
  faceDetected: boolean;
  /** Approximate number of face-like regions. */
  faceCount: number;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
  /** Aspect ratio (width / height). */
  aspectRatio: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — OCR Structure
// ─────────────────────────────────────────────────────────────────────────────

export interface OCRStructure {
  /** The largest/most prominent text block — the ad headline. */
  headline: string | null;
  /** Secondary prominent text block. */
  subheadline: string | null;
  /** Detected call-to-action phrase. */
  ctaPhrase: string | null;
  /** Detected brand or product name. */
  brandName: string | null;
  /** Price string e.g. "$29.99". */
  price: string | null;
  /** Discount string e.g. "50% OFF". */
  discount: string | null;
  /** Words indicating time pressure: "now", "today", "limited", "hurry", etc. */
  urgencyWords: string[];
  /** Words triggering emotion: "love", "fear", "hope", "dream", etc. */
  emotionalWords: string[];
  /** Outcome-focused words: "save", "gain", "boost", "improve", etc. */
  benefitWords: string[];
  /** Credibility markers: "certified", "guaranteed", "trusted", "award", etc. */
  trustWords: string[];
  /** Product/service attribute words: "fast", "secure", "HD", "wireless", etc. */
  featureWords: string[];
  /** Comparative words: "better", "vs", "versus", "compared", "best", etc. */
  comparisonWords: string[];
  /** Full raw OCR text (pre-parse). */
  rawText: string;
  /** Total word count of all detected text. */
  wordCount: number;
  /** Total character count. */
  charCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — Funnel Hints
// ─────────────────────────────────────────────────────────────────────────────

export type FunnelStage = "awareness" | "consideration" | "conversion";

export interface FunnelHints {
  probabilities: {
    awareness: number;      // 0–1
    consideration: number;  // 0–1
    conversion: number;     // 0–1
  };
  dominantStage: FunnelStage;
  /** Human-readable explanation of which signals drove the classification. */
  signals: string[];
  /** How certain the classifier is 0–1. */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — AI Analysis
// ─────────────────────────────────────────────────────────────────────────────

export interface AIAnalysis {
  likelyObjective: string;
  audienceIntent: string;
  messageClarity: number;       // 0–100
  ctaStrength: number;          // 0–100
  trustLevel: number;           // 0–100
  cognitiveLoad: number;        // 0–100 (higher = heavier cognitive burden)
  emotionalAppeal: number;      // 0–100
  offerClarity: number;         // 0–100
  brandVisibility: number;      // 0–100
  creativeWeaknesses: string[];
  optimizationSuggestions: string[];
  explanation: string;
  confidence: number;           // 0–1
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4b — CTA Detector
// ─────────────────────────────────────────────────────────────────────────────

export interface CTADetectorResult {
  cta_detected: boolean;
  cta_text: string | null;
  cta_type: "purchase" | "signup" | "install" | "learn_more" | "follow" | "contact" | "none";
  cta_modality: "text" | "visual" | "audio" | "mixed" | "none";
  confidence_score: number;
  cta_strength: number; // 0-4
  evidence: string[];
  reasoning: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — Rule Corrections (Decision Engine)
// ─────────────────────────────────────────────────────────────────────────────

export interface AppliedRule {
  rule: string;        // Rule identifier e.g. "AWARENESS_CTA_PENALTY"
  field: string;       // Field corrected e.g. "ctaStrength"
  delta: number;       // Adjustment value (negative = penalty, positive = bonus)
  reason: string;      // Human-readable explanation
}

export interface RuleCorrections {
  corrections: AppliedRule[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 — Scoring Engine
// ─────────────────────────────────────────────────────────────────────────────

export type CreativeGrade =
  | "Elite Creative"
  | "Strong Performer"
  | "Needs Optimization"
  | "High Risk Creative";

export interface ScoredDimension {
  value: number;                    // 0–100 final score
  explanation: string;
  contributingSignals: string[];
  penaltiesApplied: string[];
  confidence: number;               // 0–1
}

export interface FinalScores {
  attention: ScoredDimension;
  clarity: ScoredDimension;
  trust: ScoredDimension;
  persuasion: ScoredDimension;
  brandRecall: ScoredDimension;
  ctaStrength: ScoredDimension;
  emotionalResonance: ScoredDimension;
  conversionReadiness: ScoredDimension;
  cognitiveSimplicity: ScoredDimension;
  visualBalance: ScoredDimension;
  overallScore: number;
  grade: CreativeGrade;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE — Full Output
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalysisPipelineResult {
  creativeId: string;
  analyzedAt: string;              // ISO 8601
  vision: VisionMetrics;
  ocr: OCRStructure;
  funnel_hints: FunnelHints;
  cta_detector: CTADetectorResult;
  ai_analysis: AIAnalysis;
  final_scores: FinalScores;
  rules_applied: AppliedRule[];
  warnings: string[];
  recommendations: string[];
  processingTimeMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE — Intermediate context passed between modules
// ─────────────────────────────────────────────────────────────────────────────

export interface PipelineContext {
  imageBase64: string;
  goal?: FunnelStage;
  vision?: VisionMetrics;
  ocr?: OCRStructure;
  funnelHints?: FunnelHints;
  ctaDetector?: CTADetectorResult;
  aiAnalysis?: AIAnalysis;
  corrections?: RuleCorrections;
}
