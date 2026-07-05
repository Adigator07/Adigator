import { NextRequest, NextResponse } from "next/server";

import { runDeterministicCampaignAssessment, CONFIDENCE_THRESHOLD } from "@/app/lib/campaignAssistant/deterministicAssessment";
import { assessCampaignContextWithProviders } from "@/app/lib/campaignAssistant/providers";
import type { CampaignContextAssessmentInput } from "@/app/lib/campaignAssistant/types";

export const runtime = "nodejs";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseInput(body: Record<string, unknown>): CampaignContextAssessmentInput {
  return {
    platform: cleanText(body.platform) || "programmatic",
    campaignName: cleanText(body.campaignName),
    advertiserName: cleanText(body.advertiserName),
    campaignBrief: cleanText(body.campaignBrief),
    campaignGoal: cleanText(body.campaignGoal),
    campaignVertical: cleanText(body.campaignVertical),
    campaignAudienceStage: cleanText(body.campaignAudienceStage),
    campaignProductFocus: cleanText(body.campaignProductFocus),
    landingUrl: cleanText(body.landingUrl),
    programmaticTaskType: cleanText(body.programmaticTaskType),
    creativeCount: typeof body.creativeCount === "number" ? body.creativeCount : Number(body.creativeCount) || 0,
    creativeNames: Array.isArray(body.creativeNames)
      ? body.creativeNames.filter((item): item is string => typeof item === "string")
      : [],
    hasPriorClarifications: Boolean(body.hasPriorClarifications),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = parseInput(body && typeof body === "object" ? body : {});

    const deterministic = runDeterministicCampaignAssessment(input);

    if (deterministic.confidence >= 0.9 && !deterministic.shouldAsk) {
      return NextResponse.json({
        ...deterministic,
        skippedAi: true,
      });
    }

    if (deterministic.confidence <= 0.45 && deterministic.shouldAsk) {
      const aiResult = await assessCampaignContextWithProviders(input);
      if (aiResult?.questions?.length) {
        return NextResponse.json(aiResult);
      }
      return NextResponse.json(deterministic);
    }

    const aiResult = await assessCampaignContextWithProviders(input);
    if (aiResult) {
      if (aiResult.confidence >= CONFIDENCE_THRESHOLD) {
        return NextResponse.json({
          ...aiResult,
          shouldAsk: false,
          questions: [],
        });
      }
      return NextResponse.json(aiResult);
    }

    return NextResponse.json(deterministic);
  } catch (error) {
    console.error("[campaign-context-assessment]", error);
    return NextResponse.json(
      { error: "Campaign context assessment failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "POST /api/campaign-context-assessment",
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    providers: ["deterministic", "openai", "deepseek", "gemini"],
  });
}
