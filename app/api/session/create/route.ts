import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "../../../lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ skipped: true, serviceUnavailable: true, error: "Unauthorized: missing bearer token." }, { status: 200 });
    }

    const { user, error: authError } = await getAuthenticatedUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ skipped: true, serviceUnavailable: true, error: authError || "Unauthorized." }, { status: 200 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const supabase = createServerSupabaseClient(accessToken);

    const payload = {
      user_id: user.id,
      campaign_goal: typeof body.campaign_goal === "string" ? body.campaign_goal : null,
      vertical: typeof body.vertical === "string" ? body.vertical : null,
      creative_url: typeof body.creative_url === "string" ? body.creative_url : null,
      platform: typeof body.platform === "string" ? body.platform : null,
      status: typeof body.status === "string" ? body.status : "draft",
    };

    const { data, error } = await supabase
      .from("analysis_sessions")
      .insert(payload)
      .select("id, user_id, campaign_goal, vertical, creative_url, platform, status, created_at, updated_at")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return NextResponse.json({
          skipped: true,
          schemaUnavailable: true,
          sessionId: null,
          session: null,
          error: error.message,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      sessionId: data.id,
      session: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
