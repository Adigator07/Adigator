import { SupabaseClient } from "@supabase/supabase-js";
import type { CommActivityEventType, NotificationType } from "./types";

const COMM_BUCKET = "communication-files";

export async function logCommActivity(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    userId: string;
    eventType: CommActivityEventType;
    eventData?: Record<string, unknown>;
    relatedMessageId?: string | null;
    relatedAttachmentId?: string | null;
  },
) {
  const { error } = await supabase.from("comm_activity_events").insert({
    conversation_id: params.conversationId,
    user_id: params.userId,
    event_type: params.eventType,
    event_data: params.eventData || {},
    related_message_id: params.relatedMessageId || null,
    related_attachment_id: params.relatedAttachmentId || null,
  });
  if (error) console.error("[Comm] Activity log failed:", error.message);
}

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    recipientId: string;
    conversationId?: string | null;
    type: NotificationType;
    title: string;
    body: string;
  },
) {
  const { error } = await supabase.from("comm_notifications").insert({
    recipient_id: params.recipientId,
    conversation_id: params.conversationId || null,
    type: params.type,
    title: params.title,
    body: params.body,
  });
  if (error) console.error("[Comm] Notification failed:", error.message);
}

export async function uploadCommFile(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  file: File,
) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const storageKey = `${userId}/${conversationId}/${Date.now()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(COMM_BUCKET)
    .upload(storageKey, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: signed, error: signError } = await supabase.storage
    .from(COMM_BUCKET)
    .createSignedUrl(storageKey, 3600);

  if (signError) throw new Error(signError.message);

  return {
    storageKey,
    fileUrl: signed.signedUrl,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
  };
}

export async function getSignedAttachmentUrl(
  supabase: SupabaseClient,
  storageKey: string,
) {
  const { data, error } = await supabase.storage
    .from(COMM_BUCKET)
    .createSignedUrl(storageKey, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function ensureParticipant(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .maybeSingle();

  if (!conv) throw new Error("Forbidden: not a conversation participant");
}

export async function createConversationWithParticipants(
  supabase: SupabaseClient,
  params: {
    title: string;
    assignedTo: string;
    type?: "direct" | "project";
    projectRef?: string | null;
  },
) {
  const { data, error } = await supabase.rpc("create_conversation_with_participants", {
    p_title: params.title,
    p_assigned_to: params.assignedTo,
    p_type: params.type || "direct",
    p_project_ref: params.projectRef || null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function touchConversationLastMessage(
  supabase: SupabaseClient,
  conversationId: string,
) {
  const { error } = await supabase.rpc("touch_conversation_last_message", {
    p_conversation_id: conversationId,
  });

  if (error) throw new Error(error.message);
}
