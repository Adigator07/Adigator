import { NextResponse } from "next/server";
import { generateCampaignBriefInsights } from "@/app/lib/campaignBriefInsights.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const campaignBrief = String(body?.campaignBrief || body?.campaign_brief || "").trim();
    if (!campaignBrief) {
      return NextResponse.json({ error: "Campaign brief is required." }, { status: 400 });
    }

    const insights = await generateCampaignBriefInsights({
      campaignBrief,
      campaignGoal: body?.campaignGoal || body?.campaign_goal || undefined,
      vertical: body?.vertical || undefined,
      platform: body?.platform || undefined,
    });

    if (!insights) {
      return NextResponse.json({ error: "Unable to derive campaign insights." }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brief insights failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
