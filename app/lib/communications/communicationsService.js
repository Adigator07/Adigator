import { getRoleLabel } from "./roleLabels";
import { supabase } from "../supabase";

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data;
}

export async function fetchMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role || "end_client";

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        role: metaRole,
      })
      .select("*")
      .single();
    if (createError) throw new Error(createError.message);
    return { ...created, role_label: getRoleLabel(created.role) };
  }

  if (data.role !== metaRole && user.user_metadata?.role) {
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ role: metaRole, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("*")
      .single();
    if (!updateError && updated) {
      return { ...updated, role_label: getRoleLabel(updated.role) };
    }
  }

  return { ...data, role_label: getRoleLabel(data.role) };
}

export async function fetchConversations() {
  return apiFetch("/api/communications/conversations");
}

export async function fetchConversation(id) {
  return apiFetch(`/api/communications/conversations/${id}`);
}

export async function createConversation(payload) {
  return apiFetch("/api/communications/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchMessages(conversationId, { before, limit = 50 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  return apiFetch(`/api/communications/conversations/${conversationId}/messages?${params}`);
}

export async function sendTextMessage(conversationId, body) {
  return apiFetch(`/api/communications/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, type: "text" }),
  });
}

export async function sendFileMessage(conversationId, body, files) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const form = new FormData();
  if (body) form.append("body", body);
  files.forEach((file) => form.append("files", file));

  const response = await fetch(`/api/communications/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.error || "Upload failed");
  return payload.data;
}

export async function fetchActivity(conversationId, eventType) {
  const params = eventType ? `?event_type=${eventType}` : "";
  return apiFetch(`/api/communications/conversations/${conversationId}/activity${params}`);
}

export async function logActivityEvent(conversationId, eventType, eventData = {}, extras = {}) {
  return apiFetch(`/api/communications/conversations/${conversationId}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      event_data: eventData,
      related_message_id: extras.relatedMessageId || null,
      related_attachment_id: extras.relatedAttachmentId || null,
    }),
  });
}

export async function submitCreativeReview(attachmentId, status, reviewNote) {
  return apiFetch(`/api/communications/attachments/${attachmentId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, review_note: reviewNote }),
  });
}

export async function lookupUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");
  return apiFetch(`/api/communications/users?email=${encodeURIComponent(normalized)}`);
}

export async function fetchServicingTeam(search = "") {
  const params = new URLSearchParams({ role: "end_client" });
  if (search) params.set("search", search);
  return apiFetch(`/api/communications/users?${params}`);
}

/** @deprecated Use fetchServicingTeam */
export async function fetchEndClients(search = "") {
  return fetchServicingTeam(search);
}

export async function fetchNotifications(limit = 20) {
  return apiFetch(`/api/communications/notifications?limit=${limit}`);
}

export async function markAllNotificationsRead() {
  return apiFetch("/api/communications/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read_all: true }),
  });
}

export async function updatePresence(isOnline) {
  return apiFetch("/api/communications/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_online: isOnline }),
  });
}

export function subscribeToConversation(conversationId, handlers = {}) {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onMessage?.(payload.new),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "comm_activity_events", filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onActivity?.(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToPresence(handlers = {}) {
  const channel = supabase
    .channel("presence-updates")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles" },
      (payload) => handlers.onPresence?.(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToNotifications(userId, handler) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "comm_notifications", filter: `recipient_id=eq.${userId}` },
      (payload) => handler?.(payload.new),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
