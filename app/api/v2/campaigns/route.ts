import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/app/lib/firebase/auth";
import { createCampaign, listCampaignsForOwner } from "@/app/lib/firestore/campaigns";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireFirebaseUser(request);
    const campaigns = await listCampaignsForOwner(user.uid);
    return NextResponse.json({ ok: true, campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list campaigns.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json().catch(() => ({}));

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return jsonError("name is required");

    const campaign = await createCampaign(user.uid, {
      name,
      platform: typeof body?.platform === "string" ? body.platform : "",
      goal: typeof body?.goal === "string" ? body.goal : "",
      vertical: typeof body?.vertical === "string" ? body.vertical : "",
      landingUrl: typeof body?.landingUrl === "string" ? body.landingUrl : "",
      brief: typeof body?.brief === "string" ? body.brief : "",
    });

    return NextResponse.json({ ok: true, campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}
