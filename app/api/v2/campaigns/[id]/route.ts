import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/app/lib/firebase/auth";
import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
} from "@/app/lib/firestore/campaigns";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireFirebaseUser(request);
    const { id } = await params;

    const campaign = await getCampaign(user.uid, id);
    if (!campaign) return jsonError("Campaign not found", 404);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read campaign.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireFirebaseUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const campaign = await updateCampaign(user.uid, id, {
      name: typeof body?.name === "string" ? body.name : undefined,
      platform: typeof body?.platform === "string" ? body.platform : undefined,
      goal: typeof body?.goal === "string" ? body.goal : undefined,
      vertical: typeof body?.vertical === "string" ? body.vertical : undefined,
      landingUrl: typeof body?.landingUrl === "string" ? body.landingUrl : undefined,
      brief: typeof body?.brief === "string" ? body.brief : undefined,
    });

    if (!campaign) return jsonError("Campaign not found", 404);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update campaign.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireFirebaseUser(request);
    const { id } = await params;

    const deleted = await deleteCampaign(user.uid, id);
    if (!deleted) return jsonError("Campaign not found", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete campaign.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}
