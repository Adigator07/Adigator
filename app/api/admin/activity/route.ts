import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { requireAdminUser } from "@/app/lib/admin/permissions";
import { createServiceSupabase } from "@/app/lib/admin-platform/auth";
import { listActivityLogsForAdmin } from "@/app/lib/admin-platform/services/activity-list.service";

export const runtime = "nodejs";

/**
 * GET /api/admin/activity — legacy route; prefer /api/admin/v1/activity
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

    const supabase = createServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    const params = request.nextUrl.searchParams;
    const { events, error } = await listActivityLogsForAdmin(supabase, {
      limit: Number(params.get("limit") || "50"),
      userId: params.get("user_id"),
      actionType: params.get("action_type"),
      since: params.get("since"),
      search: params.get("search"),
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admin activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
