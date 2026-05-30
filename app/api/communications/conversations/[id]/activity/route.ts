import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createWritableSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
import { ensureParticipant, logCommActivity } from "@/app/lib/communications/commServer";

export const runtime = "nodejs";

function json<T>(success: boolean, data: T | null, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const supabase = createServerSupabaseClient(token);
    await ensureParticipant(supabase, id, user.id);

    const eventType = request.nextUrl.searchParams.get("event_type");

    let query = supabase
      .from("comm_activity_events")
      .select(`
        *,
        user:profiles!comm_activity_events_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq("conversation_id", id)
      .order("occurred_at", { ascending: false })
      .limit(100);

    if (eventType) query = query.eq("event_type", eventType);

    const { data, error } = await query;
    if (error) return json(false, null, error.message, 400);

    return json(true, data || [], null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch activity";
    return json(false, null, message, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: conversationId } = await params;
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const eventType = String(body.event_type || "").trim();
    if (!eventType) return json(false, null, "event_type is required", 400);

    const readClient = createServerSupabaseClient(token);
    await ensureParticipant(readClient, conversationId, user.id);

    const supabase = createWritableSupabaseClient(token);

    await logCommActivity(supabase, {
      conversationId,
      userId: user.id,
      eventType: eventType as any,
      eventData: body.event_data || {},
      relatedMessageId: body.related_message_id || null,
      relatedAttachmentId: body.related_attachment_id || null,
    });

    if (eventType === "message_opened" && body.related_message_id) {
      await supabase.from("message_read_receipts").upsert(
        { message_id: body.related_message_id, user_id: user.id },
        { onConflict: "message_id,user_id" },
      );

      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
    }

    return json(true, { logged: true }, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to log activity";
    return json(false, null, message, 500);
  }
}
