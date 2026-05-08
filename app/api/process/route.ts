/**
 * Main API Route: Image Processing Pipeline
 * Orchestrates: Upload → Preprocessing → OCR → AI Analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { preprocessImage, validateImage, estimateOCRQuality } from "@/app/lib/vision";
import { extractTextFromImage, cleanOCRText, validateOCRQuality } from "@/app/lib/ocr";
import { analyzeCreativeWithAI } from "@/app/lib/ai";

interface ProcessingResponse {
  success: boolean;
  data?: {
    image: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
    ocr: {
      text: string;
      confidence: number;
      blocksCount: number;
      cleanedText: string;
    };
    analysis: {
      summary: string;
      classification: string;
      keyPoints: string[];
      entities: Array<{
        name: string;
        type: string;
        value: string;
      }>;
      sentiment: "positive" | "negative" | "neutral";
      confidence: number;
      structuredData: Record<string, unknown>;
    };
    metrics: {
      processingTime: number;
      ocrConfidence: number;
      aiConfidence: number;
      overallQuality: number;
    };
  };
  error?: {
    message: string;
    stage: "validation" | "preprocessing" | "ocr" | "analysis" | "unknown";
    details?: string;
  };
}

async function analyzeTextWithAI(text: string, context?: string) {
  const analysis = await analyzeCreativeWithAI(
    context ? `${text}\n\nAdditional context: ${context}` : text
  );

  const keyPoints = [
    analysis.hookType && `Hook: ${analysis.hookType}`,
    analysis.vertical && `Vertical: ${analysis.vertical}`,
    analysis.cta && `CTA: ${analysis.cta}`,
    analysis.strengths?.[0] && `Strength: ${analysis.strengths[0]}`,
    analysis.weaknesses?.[0] && `Issue: ${analysis.weaknesses[0]}`,
  ].filter(Boolean) as string[];

  const entities = [
    analysis.hookType && { name: analysis.hookType, type: "hook_type", value: analysis.hookType },
    analysis.vertical && { name: analysis.vertical, type: "vertical", value: analysis.vertical },
    analysis.cta && { name: analysis.cta, type: "cta", value: analysis.cta },
  ].filter(Boolean) as Array<{ name: string; type: string; value: string }>;

  return {
    summary: [
      analysis.hookType && `Hook: ${analysis.hookType}`,
      analysis.vertical && `Vertical: ${analysis.vertical}`,
      analysis.valueProposition && `Value Prop: ${analysis.valueProposition}`,
    ].filter(Boolean).join(" | "),
    classification: analysis.vertical || "marketing-creative",
    keyPoints,
    entities,
    sentiment: (analysis.conversionScore >= 65 ? "positive" : analysis.conversionScore >= 45 ? "neutral" : "negative") as "positive" | "negative" | "neutral",
    confidence: 0.8,
    structuredData: analysis as unknown as Record<string, unknown>,
  };
}

/**
 * POST /api/process
 * Process image through OCR and AI pipeline
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessingResponse>> {
  const startTime = Date.now();

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const context = formData.get("context") as string | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No image file provided",
            stage: "validation",
          },
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════
    // Stage 1: Image Validation
    // ═══════════════════════════════════════════════════
    console.log("[PROCESS] Starting image validation...");
    const validation = await validateImage(file);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validation.error || "Image validation failed",
            stage: "validation",
          },
        },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════
    // Stage 2: Image Preprocessing
    // ═══════════════════════════════════════════════════
    console.log("[PROCESS] Preprocessing image...");
    const preprocessed = await preprocessImage(file, 85);
    const ocrQualityEstimate = estimateOCRQuality(validation.width, validation.height);

    // ═══════════════════════════════════════════════════
    // Stage 3: OCR Text Extraction
    // ═══════════════════════════════════════════════════
    console.log("[PROCESS] Extracting text with OCR...");
    const ocrResult = await extractTextFromImage(preprocessed.base64);

    // Validate OCR quality
    if (!validateOCRQuality(ocrResult)) {
      console.warn("[PROCESS] Low OCR quality detected");
    }

    const cleanedText = cleanOCRText(ocrResult.text);

    if (!cleanedText) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No text detected in image",
            stage: "ocr",
            details: "OCR returned empty result. Image may not contain readable text.",
          },
        },
        { status: 422 }
      );
    }

    // ═══════════════════════════════════════════════════
    // Stage 4: AI Analysis
    // ═══════════════════════════════════════════════════
    console.log("[PROCESS] Analyzing text with AI...");
    const analysis = await analyzeTextWithAI(cleanedText, context || undefined);

    // ═══════════════════════════════════════════════════
    // Compile Results
    // ═══════════════════════════════════════════════════
    const processingTime = Date.now() - startTime;
    const overallQuality =
      (ocrResult.confidence + analysis.confidence + ocrQualityEstimate) / 3;

    console.log(`[PROCESS] Pipeline completed in ${processingTime}ms`);

    return NextResponse.json(
      {
        success: true,
        data: {
          image: {
            width: validation.width,
            height: validation.height,
            format: validation.format,
            size: validation.size,
          },
          ocr: {
            text: ocrResult.text,
            confidence: ocrResult.confidence,
            blocksCount: ocrResult.blocks.length,
            cleanedText,
          },
          analysis: {
            summary: analysis.summary,
            classification: analysis.classification,
            keyPoints: analysis.keyPoints,
            entities: analysis.entities,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            structuredData: analysis.structuredData,
          },
          metrics: {
            processingTime,
            ocrConfidence: ocrResult.confidence,
            aiConfidence: analysis.confidence,
            overallQuality: Math.min(overallQuality, 1),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const stage = determineErrorStage(error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";

    console.error(`[PROCESS] Error at stage '${stage}':`, message);

    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          stage,
          details: process.env.NODE_ENV === "development" ? message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Determine which stage failed based on error
 */
function determineErrorStage(error: unknown): "validation" | "preprocessing" | "ocr" | "analysis" | "unknown" {
  if (!(error instanceof Error)) return "unknown";

  const message = error.message.toLowerCase();

  if (message.includes("validation") || message.includes("format")) {
    return "validation";
  }
  if (message.includes("preprocess")) {
    return "preprocessing";
  }
  if (message.includes("ocr") || message.includes("text_detection")) {
    return "ocr";
  }
  if (message.includes("openai") || message.includes("analysis")) {
    return "analysis";
  }

  return "unknown";
}

/**
 * GET /api/process
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    service: "OCR and AI Processing Pipeline",
    version: "1.0.0",
    endpoints: {
      process: "POST /api/process (multipart/form-data: image, context?)",
    },
  });
}
