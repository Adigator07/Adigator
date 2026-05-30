import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";

export const runtime = "nodejs";

function json<T>(success: boolean, data: T | null, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const supabase = createServerSupabaseClient(token);
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "20"), 50);

    const { data, error } = await supabase
      .from("comm_notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return json(false, null, error.message, 400);
    return json(true, data || [], null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    return json(false, null, message, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const supabase = createServerSupabaseClient(token);

    if (body.read_all) {
      await supabase
        .from("comm_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("recipient_id", user.id)
        .eq("is_read", false);
      return json(true, { updated: true }, null);
    }

    const notificationId = String(body.id || "").trim();
    if (!notificationId) return json(false, null, "Notification id required", 400);

    const { data, error } = await supabase
      .from("comm_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", user.id)
      .select("*")
      .single();

    if (error) return json(false, null, error.message, 400);
    return json(true, data, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notification";
    return json(false, null, message, 500);
  }
}
