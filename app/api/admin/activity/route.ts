import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createWritableSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { requireAdminUser } from "@/app/lib/admin/permissions";
import { formatActivityLogForAdmin, queryActivityLogs } from "@/app/lib/admin/activityAdmin";

export const runtime = "nodejs";

/**
 * Admin Dashboard activity feed (future UI: /dashboard/admin).
 * GET /api/admin/activity?limit=50&user_id=&action_type=&since=
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, error: authError } = await getAuthenticatedUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
    }

    const readClient = createServerSupabaseClient(accessToken);
    const adminCheck = await requireAdminUser(readClient, user.id);
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const supabase = createWritableSupabaseClient(accessToken);

    const { data, error } = await queryActivityLogs(supabase, {
      limit: Number(params.get("limit") || "50"),
      userId: params.get("user_id"),
      actionType: params.get("action_type"),
      since: params.get("since"),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      events: data.map(formatActivityLogForAdmin),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
