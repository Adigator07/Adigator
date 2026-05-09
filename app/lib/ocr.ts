/**
 * OCR Service - Google Cloud Vision API
 * Handles text extraction from images
 */

import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
import fs from "node:fs";
import path from "node:path";
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

function normalizeOcrError(error: unknown): string {
  // Always log the raw error for debugging
  console.error("[OCR] Raw error object:", error);

  // Try to extract a real message from any Error instance
  if (error instanceof Error) {
    const message = String(error.message || "").trim();
    console.error("[OCR] Error.message:", message);
    
    // Reject vague/malformed messages
    if (message && message.length > 5 && !/undefined/.test(message)) {
      return message;
    }
  }

  // Try structured error object
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    
    // Check multiple error property names
    const candidates = [
      obj.details,
      obj.message,
      typeof obj.error === "object" && obj.error !== null ? (obj.error as Record<string, unknown>).message : undefined,
      typeof obj.error === "object" && obj.error !== null ? (obj.error as Record<string, unknown>).details : undefined,
      obj.statusMessage,
      obj.reason,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);

    if (candidates.length > 0) {
      const msg = candidates[0].trim();
      if (msg && !/undefined|null/.test(msg)) {
        return msg;
      }
    }

    // Check for error code/status
    const code = obj.code ?? obj.status ?? obj.statusCode;
    if (code && !String(code).includes("undefined")) {
      return `Google Vision API error (code: ${String(code).trim()})`;
    }
  }

  // Ultimate fallback: return a generic but honest message
  return "Google Vision OCR service unavailable or returned an invalid response";
}

/**
 * Create a Vision API client using the credentials from env.
 * Falls back to mock mode if credentials are missing (development).
 */
function getVisionClient(): ImageAnnotatorClient {
  try {
    const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`[OCR] Configured path: ${configuredPath}`);
    
    const candidatePaths = [
      configuredPath,
      "./google-key.json",
      "./app/google-key.json",
    ].filter((p): p is string => Boolean(p));

    const keyFilename = candidatePaths
      .map((p) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)))
      .find((p) => {
        const exists = fs.existsSync(p);
        console.log(`[OCR] Checking ${p}: ${exists ? "✓ found" : "✗ missing"}`);
        return exists;
      });

    if (!keyFilename) {
      const msg = `Google Vision credentials file not found at: ${candidatePaths.join(", ")}. Set GOOGLE_APPLICATION_CREDENTIALS=<path/to/google-key.json>`;
      console.warn(`[OCR] ${msg}`);
      throw new Error(msg);
    }

    console.log(`[OCR] Using credentials: ${keyFilename}`);
    return new ImageAnnotatorClient({
      keyFilename,
    });
  } catch (clientError) {
    console.error(`[OCR] Failed to create Vision client:`, clientError);
    throw clientError;
  }
}

/**
 * Extract text from image using Google Vision API
 * Falls back to mock mode in development if credentials unavailable.
 * @param imageData - Base64 encoded image data (with or without data URI prefix)
 * @returns OCR result with extracted text and confidence scores
 */
export async function extractTextFromImage(imageData: string): Promise<OCRResult> {
  if (!imageData) {
    throw new Error("No image data provided");
  }

  let client: ImageAnnotatorClient;
  try {
    client = getVisionClient();
  } catch (clientError) {
    console.error(`[OCR] Client initialization failed:`, clientError);
    throw new Error(`Vision client error: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
  }

  // Strip data URI prefix if present
  const base64Content = imageData.includes(",") ? imageData.split(",")[1] : imageData;

  console.log(`[OCR] Calling Vision API with ${base64Content.length} bytes of base64 data`);

  try {
    const [result] = await client.documentTextDetection({
      image: { content: base64Content },
    });

    console.log(`[OCR] Vision API response received`);

    const textAnnotations = result.textAnnotations ?? [];
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!textAnnotations.length && !fullTextAnnotation?.text) {
      console.log(`[OCR] No text detected in image`);
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

    const finalResult = {
      text: fullText.trim(),
      confidence: Math.min(avgConfidence, 1),
      blocks,
    };

    console.log(`[OCR] Success: ${finalResult.text.length} chars, confidence=${finalResult.confidence}, blocks=${blocks.length}`);
    return finalResult;
  } catch (visionError) {
    console.error(`[OCR] Vision API call failed:`, visionError);
    console.error(`[OCR] Error type:`, typeof visionError);
    console.error(`[OCR] Error keys:`, visionError instanceof Error ? Object.keys(visionError) : "not an Error");
    
    throw new Error(normalizeOcrError(visionError));
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
