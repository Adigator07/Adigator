import type { CampaignGoal, IntelligenceProfile, VerticalKey } from "../intelligence-registry";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  vertices: Point[];
}

export interface NormalizedBoundingBox extends BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  centerX: number;
  centerY: number;
  areaRatio: number;
}

export interface RawOcrBlock {
  id?: string;
  text: string;
  confidence?: number;
  boundingBox?: {
    vertices?: Point[];
  };
}

export interface RawOcrInput {
  text: string;
  confidence?: number;
  blocks?: RawOcrBlock[];
  imageWidth?: number;
  imageHeight?: number;
}

export type TextBlockRole =
  | "headline"
  | "cta"
  | "emotional_copy"
  | "offer_text"
  | "supporting_text"
  | "disclaimer"
  | "branding_text"
  | "unknown";

export type CtaState = "none" | "implicit" | "explicit";

export interface NormalizedTextBlock {
  id: string;
  rawText: string;
  text: string;
  normalizedText: string;
  tokens: string[];
  confidence: number;
  box: NormalizedBoundingBox | null;
  lineIndex: number;
  role: TextBlockRole;
  roleConfidence: number;
  hierarchyScore: number;
  features: {
    wordCount: number;
    charCount: number;
    isAllCaps: boolean;
    hasPrice: boolean;
    hasDiscount: boolean;
    hasCtaPhrase: boolean;
    hasEmotionalSignal: boolean;
    hasTrustSignal: boolean;
    hasLegalSignal: boolean;
    buttonLikelihood: number;
  };
}

export interface CtaDetectionResult {
  ctaExists: boolean;
  ctaState: CtaState;
  ctaType: CtaState;
  cta: string | null;
  confidence: number;
  candidateBlockId: string | null;
  evidence: string[];
}

export interface NormalizedOcrSchema {
  headline: NormalizedTextBlock | null;
  cta: NormalizedTextBlock | null;
  emotionalCopy: NormalizedTextBlock[];
  offerText: NormalizedTextBlock[];
  supportingText: NormalizedTextBlock[];
  disclaimers: NormalizedTextBlock[];
  brandingText: NormalizedTextBlock[];
}

export interface OcrHierarchy {
  readingOrder: string[];
  primaryTextBlockId: string | null;
  topWeightedBlocks: string[];
  textDensity: number;
  layoutZones: {
    top: string[];
    middle: string[];
    bottom: string[];
    left: string[];
    center: string[];
    right: string[];
  };
}

export interface OcrNormalizationContext {
  campaignGoal: CampaignGoal;
  vertical: VerticalKey;
  intelligenceProfile: IntelligenceProfile;
}

export interface NormalizedOcrResult {
  rawText: string;
  cleanedText: string;
  confidence: number;
  imageSize: {
    width: number;
    height: number;
  };
  blocks: NormalizedTextBlock[];
  hierarchy: OcrHierarchy;
  schema: NormalizedOcrSchema;
  ctaDetection: CtaDetectionResult;
  context: OcrNormalizationContext;
  warnings: string[];
}
