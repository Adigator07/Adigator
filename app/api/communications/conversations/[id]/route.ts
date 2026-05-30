import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
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

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        creator:profiles!conversations_created_by_fkey(*),
        assignee:profiles!conversations_assigned_to_fkey(*),
        participants:conversation_participants(*, profile:profiles(*))
      `)
      .eq("id", id)
      .single();

    if (error) return json(false, null, error.message, 400);

    await logCommActivity(supabase, {
      conversationId: id,
      userId: user.id,
      eventType: "user_joined",
      eventData: { action: "view_conversation" },
    });

    return json(true, data, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch conversation";
    return json(false, null, message, err instanceof Error && err.message.includes("Forbidden") ? 403 : 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const supabase = createServerSupabaseClient(token);
    await ensureParticipant(supabase, id, user.id);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title) updates.title = String(body.title).trim();
    if (["active", "archived", "closed"].includes(body.status)) updates.status = body.status;

    const { data, error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return json(false, null, error.message, 400);

    if (updates.status) {
      await logCommActivity(supabase, {
        conversationId: id,
        userId: user.id,
        eventType: "status_changed",
        eventData: { status: updates.status },
      });
    }

    return json(true, data, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update conversation";
    return json(false, null, message, 500);
  }
}
