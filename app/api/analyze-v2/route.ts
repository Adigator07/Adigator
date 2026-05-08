/**
 * ACIE v5.0 — Production Endpoint
 *
 * POST /api/analyze-v2
 * Accepts multipart/form-data:
 * - image: File
 * - rawOcrText: string (optional, if missing we simulate for now)
 * - goal: string (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeCreativeV5 } from "@/app/lib/analyzer/pipeline";
import type { FunnelStage } from "@/app/lib/analyzer/types";

// Force Node.js runtime because Sharp (vision module) requires native bindings
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const rawOcrText = formData.get("rawOcrText") as string || "";
    const goalRaw = formData.get("goal") as string;
    
    // Validate goal
    const validGoals = ["awareness", "consideration", "conversion"];
    const goal = validGoals.includes(goalRaw?.toLowerCase()) 
      ? (goalRaw.toLowerCase() as FunnelStage) 
      : undefined;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided in form data." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const creativeId = `cr_${Date.now().toString(36)}`;

    console.log(`[API v2] Starting ACIE v5.0 analysis for ${file.name} (${file.size} bytes)`);

    const result = await analyzeCreativeV5(
      creativeId,
      buffer,
      mimeType,
      rawOcrText,
      goal
    );

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API v2] Analysis failed:`, error);
    
    return NextResponse.json(
      { 
        error: "Pipeline execution failed", 
        details: message 
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    engine: "ACIE v5.0",
    modules: [
      "vision-analyzer",
      "ocr-parser",
      "funnel-hints",
      "ai-analyzer",
      "decision-engine",
      "scoring-engine"
    ],
    endpoint: "POST /api/analyze-v2"
  });
}
