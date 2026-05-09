/**
 * Deprecated compatibility route.
 * All creative intelligence now flows through the canonical graph orchestrator.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeCreativeIntelligence } from "@/app/lib/intelligence/orchestrator";
import type { CampaignGoal, VerticalKey } from "@/app/lib/intelligence-registry";

export const runtime = "nodejs";
export const maxDuration = 60;

const goals: CampaignGoal[] = ["awareness", "consideration", "conversion"];
const verticals: VerticalKey[] = [
  "automotive", "banking", "ecommerce", "education", "entertainment",
  "finance", "food", "gaming", "healthcare", "hotels", "luxury",
  "news_media", "real_estate", "sports", "technology", "travel",
];

function asGoal(value: string): CampaignGoal {
  return goals.includes(value as CampaignGoal) ? value as CampaignGoal : "awareness";
}

function asVertical(value: string): VerticalKey {
  return verticals.includes(value as VerticalKey) ? value as VerticalKey : "technology";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const goal = asGoal(String(formData.get("goal") || "awareness").toLowerCase());
    const vertical = asVertical(String(formData.get("vertical") || "technology").toLowerCase());

    if (!file) {
      return NextResponse.json({ success: false, error: { message: "No image file provided", stage: "validation" } }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const result = await analyzeCreativeIntelligence({
      imageBuffer,
      goal,
      vertical,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    const details = result.analysisDetails as Record<string, unknown>;
    const graph = details.graph as typeof result;
    const ocr = details.ocr as { rawText?: string; cleanedText?: string; confidence?: number; blocks?: unknown[] };
    const overallScore = Number.isFinite(result.scores.overall.value) ? (result.scores.overall.value as number) : null;

    return NextResponse.json({
      success: true,
      data: {
        image: {
          width: result.asset.width,
          height: result.asset.height,
          format: result.asset.mimeType,
          size: result.asset.sizeBytes,
        },
        ocr: {
          text: ocr.rawText || "",
          confidence: ocr.confidence || 0,
          blocksCount: Array.isArray(ocr.blocks) ? ocr.blocks.length : 0,
          cleanedText: ocr.cleanedText || "",
        },
        analysis: {
          summary: result.strategicAnalysis && typeof result.strategicAnalysis === "object"
            ? (result.strategicAnalysis as { strategyAlignmentExplanation?: string }).strategyAlignmentExplanation || ""
            : "",
          classification: graph.lockedContext.detectedVertical,
          keyPoints: result.signals.slice(0, 5).map((signal) => signal.reasoning),
          entities: result.signals.slice(0, 5).map((signal) => ({
            name: signal.type,
            type: signal.source,
            value: signal.reasoning,
          })),
          sentiment: overallScore === null ? "unavailable" : overallScore >= 70 ? "positive" : overallScore >= 50 ? "neutral" : "negative",
          confidence: result.confidence.overall,
          structuredData: result,
        },
        metrics: {
          processingTime: result.processingTimeMs,
          ocrConfidence: result.confidence.ocr,
          aiConfidence: 0,
          overallQuality: result.confidence.overall,
        },
      },
      deprecated: true,
      canonicalEndpoint: "/api/analyze-v2",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ success: false, error: { message, stage: "analysis" } }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    deprecated: true,
    canonicalEndpoint: "POST /api/analyze-v2",
  });
}
