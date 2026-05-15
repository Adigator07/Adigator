import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "../../../lib/supabaseServer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized: missing bearer token." }, { status: 401 });
    }

    const { user, error: authError } = await getAuthenticatedUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Session id is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(accessToken);
    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("id, user_id, campaign_goal, vertical, creative_url, platform, status, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
