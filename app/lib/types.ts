/**
 * Type definitions for OCR & AI Processing System
 */

// ═══════════════════════════════════════════════════════
// Image Processing Types
// ═══════════════════════════════════════════════════════

export interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  size: number;
  format: string;
  error?: string;
}

export interface ImagePreprocessResult {
  base64: string;
  width: number;
  height: number;
  format: string;
  quality: number;
}

export type SupportedImageFormat = "jpeg" | "png" | "gif" | "webp" | "tiff";

// ═══════════════════════════════════════════════════════
// OCR Types
// ═══════════════════════════════════════════════════════

export interface BoundingBox {
  vertices: Array<{ x: number; y: number }>;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
}

// ═══════════════════════════════════════════════════════
// AI Analysis Types
// ═══════════════════════════════════════════════════════

export type Sentiment = "positive" | "negative" | "neutral";

export interface Entity {
  name: string;
  type: string;
  value: string;
}

export interface AIAnalysisResult {
  summary: string;
  classification: string;
  keyPoints: string[];
  entities: Entity[];
  sentiment: Sentiment;
  confidence: number;
  structuredData: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface OCRMetadata {
  text: string;
  confidence: number;
  blocksCount: number;
  cleanedText: string;
}

export interface ProcessingMetrics {
  processingTime: number;
  ocrConfidence: number;
  aiConfidence: number;
  overallQuality: number;
}

export interface ProcessingData {
  image: ImageMetadata;
  ocr: OCRMetadata;
  analysis: AIAnalysisResult;
  metrics: ProcessingMetrics;
}

export type ErrorStage = "validation" | "preprocessing" | "ocr" | "analysis" | "unknown";

export interface ErrorResponse {
  message: string;
  stage: ErrorStage;
  details?: string;
}

export interface ProcessingResponse<T = ProcessingData> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

// ═══════════════════════════════════════════════════════
// Request Types
// ═══════════════════════════════════════════════════════

export interface ProcessImageRequest {
  image: File | Buffer;
  context?: string;
}

// ═══════════════════════════════════════════════════════
// Configuration Types
// ═══════════════════════════════════════════════════════

export interface OCRConfig {
  confidenceThreshold: number;
  maxFileSize: number;
  supportedFormats: SupportedImageFormat[];
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface VisionConfig {
  minDimension: number;
  maxDimension: number;
  optimalAspectRatio: [number, number];
}

export interface PipelineConfig {
  ocr: OCRConfig;
  ai: AIConfig;
  vision: VisionConfig;
  debug: boolean;
}
