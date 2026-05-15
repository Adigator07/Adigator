import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "../../../lib/supabaseServer";

interface UpdateSessionBody {
  sessionId?: string;
  campaign_goal?: string | null;
  vertical?: string | null;
  platform?: string | null;
  creative_url?: string | null;
  status?: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized: missing bearer token." }, { status: 401 });
    }

    const { user, error: authError } = await getAuthenticatedUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as UpdateSessionBody;
    const sessionId = (body.sessionId || "").trim();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};

    if (Object.prototype.hasOwnProperty.call(body, "campaign_goal")) updates.campaign_goal = body.campaign_goal ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "vertical")) updates.vertical = body.vertical ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "platform")) updates.platform = body.platform ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "creative_url")) updates.creative_url = body.creative_url ?? null;
    if (Object.prototype.hasOwnProperty.call(body, "status")) updates.status = body.status ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "At least one field must be provided to update." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createServerSupabaseClient(accessToken);
    const { data, error } = await supabase
      .from("analysis_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select("id, user_id, campaign_goal, vertical, creative_url, platform, status, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
