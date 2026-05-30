import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createUserSupabaseClient, createWritableSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
import {
  ensureParticipant,
  logCommActivity,
  createNotification,
  uploadCommFile,
  touchConversationLastMessage,
} from "@/app/lib/communications/commServer";
import { isCreativeMimeType } from "@/app/lib/communications/permissions";

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

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "50"), 100);
    const before = request.nextUrl.searchParams.get("before");

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url, role, is_online),
        attachments(*, review:creative_reviews(*))
      `)
      .eq("conversation_id", id)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("sent_at", before);

    const { data, error } = await query;
    if (error) return json(false, null, error.message, 400);

    return json(true, (data || []).reverse(), null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch messages";
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

    const readClient = createServerSupabaseClient(token);
    const userClient = createUserSupabaseClient(token);
    await ensureParticipant(readClient, conversationId, user.id);

    const writeClient = createWritableSupabaseClient(token);

    const contentType = request.headers.get("content-type") || "";
    let body = "";
    let messageType: "text" | "file" | "creative" = "text";
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = String(form.get("body") || "").trim();
      files = form.getAll("files").filter((f): f is File => f instanceof File);
    } else {
      const json = await request.json();
      body = String(json.body || "").trim();
      messageType = json.type || "text";
    }

    if (!body && files.length === 0) {
      return json(false, null, "Message body or files required", 400);
    }

    if (files.length > 0) {
      const hasCreative = files.some((f) => isCreativeMimeType(f.type));
      messageType = hasCreative ? "creative" : "file";
    }

    const { data: message, error: msgError } = await writeClient
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        type: messageType,
        body: body || null,
        metadata: { delivery_status: "sent" },
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email, avatar_url, role, is_online)
      `)
      .single();

    if (msgError) return json(false, null, msgError.message, 400);

    const attachments = [];
    for (const file of files) {
      const uploaded = await uploadCommFile(writeClient, user.id, conversationId, file);
      const { data: attachment, error: attError } = await writeClient
        .from("attachments")
        .insert({
          message_id: message.id,
          uploader_id: user.id,
          file_name: uploaded.fileName,
          file_type: uploaded.fileType,
          file_size: uploaded.fileSize,
          file_url: uploaded.fileUrl,
          storage_key: uploaded.storageKey,
        })
        .select("*")
        .single();

      if (attError) continue;
      attachments.push(attachment);

      if (isCreativeMimeType(file.type)) {
        await writeClient.from("creative_reviews").insert({
          attachment_id: attachment.id,
          reviewer_id: user.id,
          conversation_id: conversationId,
          status: "pending",
        });
      }

      await logCommActivity(writeClient, {
        conversationId,
        userId: user.id,
        eventType: "file_uploaded",
        relatedMessageId: message.id,
        relatedAttachmentId: attachment.id,
        eventData: { file_name: uploaded.fileName, file_type: uploaded.fileType },
      });
    }

    try {
      await touchConversationLastMessage(userClient, conversationId);
    } catch (touchError) {
      const touchMessage = touchError instanceof Error ? touchError.message : "Failed to update conversation";
      if (!touchMessage.includes("Could not find the function")) {
        return json(false, null, touchMessage, 400);
      }
      const { error: convUpdateError } = await writeClient
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      if (convUpdateError) return json(false, null, convUpdateError.message, 400);
    }

    await logCommActivity(writeClient, {
      conversationId,
      userId: user.id,
      eventType: "message_sent",
      relatedMessageId: message.id,
      eventData: { type: messageType, has_attachments: attachments.length > 0 },
    });

    const { data: participants } = await readClient
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id);

    const senderName = message.sender?.full_name || "Someone";
    for (const p of participants || []) {
      await createNotification(writeClient, {
        recipientId: p.user_id,
        conversationId,
        type: messageType === "creative" ? "creative_assigned" : "new_message",
        title: messageType === "creative" ? "New creative to review" : "New message",
        body: body ? `${senderName}: ${body.slice(0, 80)}` : `${senderName} shared a file`,
      });
    }

    return json(true, { ...message, attachments }, null, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return json(false, null, message, 500);
  }
}
