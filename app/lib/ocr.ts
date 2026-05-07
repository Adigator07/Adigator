/**
 * OCR Service - Google Cloud Vision API
 * Handles text extraction from images
 */

import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
type IEntityAnnotation = protos.google.cloud.vision.v1.IEntityAnnotation;
type IVertex = protos.google.cloud.vision.v1.IVertex;

interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
}

interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

/**
 * Create a Vision API client using the credentials from env.
 */
function getVisionClient(): ImageAnnotatorClient {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
  }
  return new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}

/**
 * Extract text from image using Google Vision API
 * @param imageData - Base64 encoded image data (with or without data URI prefix)
 * @returns OCR result with extracted text and confidence scores
 */
export async function extractTextFromImage(imageData: string): Promise<OCRResult> {
  if (!imageData) {
    throw new Error("No image data provided");
  }

  const client = getVisionClient();

  // Strip data URI prefix if present
  const base64Content = imageData.includes(",") ? imageData.split(",")[1] : imageData;

  try {
    const [result] = await client.documentTextDetection({
      image: { content: base64Content },
    });

    const textAnnotations = result.textAnnotations ?? [];
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!textAnnotations.length && !fullTextAnnotation?.text) {
      return { text: "", confidence: 0, blocks: [] };
    }

    const fullText = fullTextAnnotation?.text ?? textAnnotations[0]?.description ?? "";

    // Build blocks from individual word annotations (skip index 0 = full-page annotation)
    const blocks: TextBlock[] = textAnnotations.slice(1).map((ann: IEntityAnnotation) => ({
      text: ann.description ?? "",
      confidence: (ann as IEntityAnnotation & { confidence?: number }).confidence ?? 0.9,
      boundingBox: ann.boundingPoly
        ? { vertices: (ann.boundingPoly.vertices ?? []).map((v: IVertex) => ({ x: v.x ?? 0, y: v.y ?? 0 })) }
        : undefined,
    }));

    const avgConfidence =
      blocks.length > 0
        ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
        : 0.9;

    return {
      text: fullText.trim(),
      confidence: Math.min(avgConfidence, 1),
      blocks,
    };
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate OCR result quality
 * @param result - OCR result to validate
 * @returns True if result meets quality threshold
 */
export function validateOCRQuality(result: OCRResult): boolean {
  if (!result.text || result.text.length === 0) {
    return false;
  }

  // Require minimum confidence and text length
  return result.confidence >= 0.3 && result.text.length >= 10;
}

/**
 * Clean and normalize OCR text
 * @param text - Raw OCR text
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
  return text
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, " ")
    // Fix common OCR errors
    .replace(/[|]/g, "I")
    .replace(/[{}]/g, "")
    .trim();
}
