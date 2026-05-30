import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createUserSupabaseClient, createWritableSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
import { createConversationWithParticipants, createNotification, logCommActivity } from "@/app/lib/communications/commServer";
import { isCreativeMimeType } from "@/app/lib/communications/permissions";

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

    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (partError) return json(false, null, partError.message, 400);

    const convIds = (participations || []).map((p) => p.conversation_id);
    if (convIds.length === 0) return json(true, [], null);

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        creator:profiles!conversations_created_by_fkey(id, full_name, email, avatar_url, role, is_online, last_seen_at),
        assignee:profiles!conversations_assigned_to_fkey(id, full_name, email, avatar_url, role, is_online, last_seen_at)
      `)
      .in("id", convIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) return json(false, null, error.message, 400);

    const enriched = await Promise.all(
      (conversations || []).map(async (conv) => {
        const other = conv.created_by === user.id ? conv.assignee : conv.creator;
        const part = participations?.find((p) => p.conversation_id === conv.id);

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("sent_at", part?.last_read_at || "1970-01-01")
          .neq("sender_id", user.id);

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body, type")
          .eq("conversation_id", conv.id)
          .is("deleted_at", null)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          other_participant: other,
          unread_count: count || 0,
          last_message_preview: lastMsg?.body || (lastMsg?.type === "file" ? "📎 File shared" : ""),
        };
      }),
    );

    return json(true, enriched, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list conversations";
    return json(false, null, message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const title = String(body.title || "").trim();
    const projectRef = body.project_ref ? String(body.project_ref).trim() : null;
    const welcomeMessage = body.welcome_message ? String(body.welcome_message).trim() : null;
    const type = body.type === "project" ? "project" : "direct";
    const recipientEmail = body.recipient_email
      ? String(body.recipient_email).trim().toLowerCase()
      : "";

    let recipientId = String(body.assigned_to || "").trim();

    const userClient = createUserSupabaseClient(token);
    const writeClient = createWritableSupabaseClient(token);

    const { data: profile } = await userClient
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) return json(false, null, "Profile not found", 404);

    if (recipientEmail) {
      const { data: byEmail, error: emailError } = await userClient
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", recipientEmail)
        .neq("id", user.id)
        .maybeSingle();

      if (emailError) return json(false, null, emailError.message, 400);
      if (!byEmail) {
        return json(false, null, `No registered user found for ${recipientEmail}. They must register first.`, 404);
      }
      recipientId = byEmail.id;
    }

    if (!title || !recipientId) {
      return json(false, null, "title and recipient email are required", 400);
    }

    if (recipientId === user.id) {
      return json(false, null, "Cannot start a conversation with yourself", 400);
    }

    const { data: assignee } = await userClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", recipientId)
      .single();

    if (!assignee) return json(false, null, "Recipient not found", 404);

    let conversation;
    try {
      conversation = await createConversationWithParticipants(userClient, {
        title,
        assignedTo: recipientId,
        type,
        projectRef,
      });
    } catch (rpcError) {
      const rpcMessage = rpcError instanceof Error ? rpcError.message : "Failed to create conversation";
      if (!rpcMessage.includes("Could not find the function")) {
        return json(false, null, rpcMessage, 400);
      }

      const { data: inserted, error: convError } = await writeClient
        .from("conversations")
        .insert({
          title,
          created_by: user.id,
          assigned_to: recipientId,
          type,
          project_ref: projectRef,
          last_message_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (convError) return json(false, null, convError.message, 400);
      conversation = inserted;

      const { error: partError } = await writeClient.from("conversation_participants").insert([
        { conversation_id: conversation.id, user_id: user.id, role_in_conversation: "sender" },
        { conversation_id: conversation.id, user_id: recipientId, role_in_conversation: "receiver" },
      ]);

      if (partError) return json(false, null, partError.message, 400);
    }

    await logCommActivity(writeClient, {
      conversationId: conversation.id,
      userId: user.id,
      eventType: "user_joined",
      eventData: { user_name: profile.full_name },
    });

    if (welcomeMessage) {
      await writeClient.from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        type: "text",
        body: welcomeMessage,
      });
    }

    await logCommActivity(writeClient, {
      conversationId: conversation.id,
      userId: user.id,
      eventType: "creative_assigned",
      eventData: {
        recipient_name: assignee.full_name || assignee.email,
        project_ref: projectRef,
      },
    });

    await createNotification(writeClient, {
      recipientId,
      conversationId: conversation.id,
      type: "new_message",
      title: "New conversation",
      body: `${profile.full_name || profile.email || "Someone"} started a conversation: "${title}"`,
    });

    return json(true, conversation, null, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create conversation";
    return json(false, null, message, 500);
  }
}
