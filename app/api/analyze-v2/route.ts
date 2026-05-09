/**
 * Production Analyzer API - Phase 1
 * 
 * POST /api/analyze-v2
 * Accepts multipart/form-data:
 * - image: File (required)
 * - goal: string ("awareness" | "consideration" | "conversion")
 * - vertical: string (industry vertical)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeCreativeIntelligence } from "@/app/lib/intelligence/orchestrator";
import type { CampaignGoal, VerticalKey } from "@/app/lib/intelligence-registry";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const goalRaw = (formData.get("goal") as string)?.toLowerCase() || "awareness";
    const verticalRaw = (formData.get("vertical") as string)?.toLowerCase() || "technology";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Upload an image file." },
        { status: 400 }
      );
    }

    const maxSize = 12 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Image file too large. Maximum size is ${maxSize / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    // Validate goal
    const validGoals = ["awareness", "consideration", "conversion"];
    if (!validGoals.includes(goalRaw)) {
      return NextResponse.json(
        { error: `Invalid goal. Must be one of: ${validGoals.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate vertical
    const validVerticals = [
      "automotive", "banking", "ecommerce", "education", "entertainment",
      "finance", "food", "gaming", "healthcare", "hotels", "luxury",
      "news_media", "real_estate", "sports", "technology", "travel",
    ];
    if (!validVerticals.includes(verticalRaw)) {
      return NextResponse.json(
        { error: `Invalid vertical. Must be one of: ${validVerticals.join(", ")}` },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    console.log(`[API] Analyzing: ${verticalRaw}/${goalRaw} (${(file.size / 1024).toFixed(1)}KB)`);

    const result = await analyzeCreativeIntelligence({
      imageBuffer,
      goal: goalRaw as CampaignGoal,
      vertical: verticalRaw as VerticalKey,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    const totalTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...result,
        totalProcessingTimeMs: totalTime,
        apiVersion: "2.0.0-intelligence-graph",
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const errorReport = {
      error: "Analysis failed",
      message,
      details: message,
      analysisState: {
        status: "pipeline_failure",
        reason: "unhandled_backend_exception",
        message,
      },
      strategicAnalysis: {
        strategyAlignmentScore: null,
        strategyAlignmentExplanation: "Pipeline failure prevented validated analysis.",
      },
      analysisDetails: {
        analysisState: {
          status: "pipeline_failure",
          reason: "unhandled_backend_exception",
          message,
        },
        signalAvailability: {},
      },
      ...(process.env.NODE_ENV === "development" && { stack: error instanceof Error ? error.stack : undefined }),
    };
    console.error(`[API] Error at analyze-v2:`, error);
    
    return NextResponse.json(
      errorReport,
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    version: "1.0.0-phase1",
    engine: "Creative Intelligence Platform",
    modules: [
      "ocr-normalization",
      "cta-detection",
      "layout-intelligence",
      "intelligence-registry",
      "scoring-engine",
      "recommendation-engine"
    ],
    endpoint: "POST /api/analyze-v2"
  });
}
