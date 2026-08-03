import { getRoleLabel } from "./roleLabels";
import { supabase } from "../supabase";
import { getClientUser, getFreshAccessToken } from "../supabaseAuthClient";
import { getFirebaseClientFirestore } from "../firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { recordApiTelemetry } from "../routeTelemetry";
import {
  addLocalActivity,
  addLocalFileMessage,
  addLocalTextMessage,
  createLocalConversation,
  getLocalConversation,
  listLocalActivity,
  listLocalConversations,
  listLocalMessages,
  lookupLocalUserByEmail,
  submitLocalCreativeReview,
  subscribeLocalConversation,
  subscribeLocalPresence,
  syncLocalProfile,
  updateLocalPresence,
} from "./localCommunicationStore";

let communicationFallbackMode = false;

function shouldUseLocalFallback(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return /unauthorized|request failed|supabase|schema|relation|invalid input syntax|uuid|network|fetch|function/i.test(message);
}

function enableCommunicationFallback(reason) {
  if (!communicationFallbackMode) {
    console.warn("[communications] Falling back to local message store:", reason);
  }
  communicationFallbackMode = true;
}

async function getLocalCurrentProfile() {
  const user = await getClientUser();
  if (!user) throw new Error("Not authenticated");
  const profile = await fetchMyProfile();
  return syncLocalProfile({
    id: user.id,
    email: user.email || profile?.email || "",
    full_name: profile?.full_name || profile?.fullName || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    role: profile?.role || user.user_metadata?.role || "end_client",
    is_online: true,
  });
}

async function getToken() {
  return getFreshAccessToken();
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordApiTelemetry("communications", `${options.method || "GET"} ${path}`, endedAt - startedAt, false, {
      networkError: true,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  recordApiTelemetry("communications", `${options.method || "GET"} ${path}`, endedAt - startedAt, response.ok && Boolean(payload.success), {
    status: response.status,
  });

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Request failed");
  }
  return payload.data;
}

export async function fetchMyProfile() {
  const user = await getClientUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role || "end_client";
  const db = getFirebaseClientFirestore();
  const ref = doc(db, "userProfiles", user.id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload = {
      email: user.email || "",
      fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      role: metaRole,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, payload, { merge: true });
    return syncLocalProfile({ ...payload, id: user.id, full_name: payload.fullName, role_label: getRoleLabel(payload.role) });
  }

  const data = snap.data() || {};
  if (data.role !== metaRole && user.user_metadata?.role) {
    await setDoc(ref, { role: metaRole, updatedAt: serverTimestamp() }, { merge: true });
    return syncLocalProfile({ ...data, id: user.id, role: metaRole, full_name: data.fullName || data.full_name, role_label: getRoleLabel(metaRole) });
  }

  return syncLocalProfile({ ...data, id: user.id, full_name: data.fullName || data.full_name, role_label: getRoleLabel(data.role || metaRole) });
}

export async function fetchConversations() {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return listLocalConversations(profile.id);
  }
  try {
    return await apiFetch("/api/communications/conversations");
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return listLocalConversations(profile.id);
  }
}

export async function fetchConversation(id) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return getLocalConversation(id, profile.id);
  }
  try {
    return await apiFetch(`/api/communications/conversations/${id}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return getLocalConversation(id, profile.id);
  }
}

export async function createConversation(payload) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return createLocalConversation({
      currentUser: profile,
      recipientEmail: payload.recipient_email,
      title: payload.title,
      projectRef: payload.project_ref,
      welcomeMessage: payload.welcome_message,
      type: payload.type,
    });
  }
  try {
    return await apiFetch("/api/communications/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return createLocalConversation({
      currentUser: profile,
      recipientEmail: payload.recipient_email,
      title: payload.title,
      projectRef: payload.project_ref,
      welcomeMessage: payload.welcome_message,
      type: payload.type,
    });
  }
}

export async function fetchMessages(conversationId, { before, limit = 50 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  if (communicationFallbackMode) {
    return listLocalMessages(conversationId);
  }
  try {
    return await apiFetch(`/api/communications/conversations/${conversationId}/messages?${params}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    return listLocalMessages(conversationId);
  }
}

export async function sendTextMessage(conversationId, body) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return addLocalTextMessage({ conversationId, senderProfile: profile, body });
  }
  try {
    return await apiFetch(`/api/communications/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, type: "text" }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return addLocalTextMessage({ conversationId, senderProfile: profile, body });
  }
}

export async function sendFileMessage(conversationId, body, files) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return addLocalFileMessage({ conversationId, senderProfile: profile, body, files });
  }
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  const form = new FormData();
  if (body) form.append("body", body);
  files.forEach((file) => form.append("files", file));

  let response;
  try {
    response = await fetch(`/api/communications/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch (error) {
    const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    recordApiTelemetry("communications", "POST /api/communications/conversations/:id/messages (files)", endedAt - startedAt, false, {
      networkError: true,
      error: error instanceof Error ? error.message : String(error),
    });
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return addLocalFileMessage({ conversationId, senderProfile: profile, body, files });
  }

  const payload = await response.json().catch(() => ({}));
  const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  recordApiTelemetry("communications", "POST /api/communications/conversations/:id/messages (files)", endedAt - startedAt, response.ok && Boolean(payload.success), {
    status: response.status,
    fileCount: Array.isArray(files) ? files.length : 0,
  });

  if (!response.ok || !payload.success) {
    const error = new Error(payload.error || "Upload failed");
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error.message);
    const profile = await getLocalCurrentProfile();
    return addLocalFileMessage({ conversationId, senderProfile: profile, body, files });
  }
  return payload.data;
}

export async function fetchActivity(conversationId, eventType) {
  const params = eventType ? `?event_type=${eventType}` : "";
  if (communicationFallbackMode) {
    return listLocalActivity(conversationId);
  }
  try {
    return await apiFetch(`/api/communications/conversations/${conversationId}/activity${params}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    return listLocalActivity(conversationId);
  }
}

export async function logActivityEvent(conversationId, eventType, eventData = {}, extras = {}) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return addLocalActivity({
      conversationId,
      userId: profile.id,
      eventType,
      eventData,
      extras,
    });
  }
  try {
    return await apiFetch(`/api/communications/conversations/${conversationId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        related_message_id: extras.relatedMessageId || null,
        related_attachment_id: extras.relatedAttachmentId || null,
      }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return addLocalActivity({
      conversationId,
      userId: profile.id,
      eventType,
      eventData,
      extras,
    });
  }
}

export async function submitCreativeReview(attachmentId, status, reviewNote) {
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return submitLocalCreativeReview({ attachmentId, status, reviewNote, reviewerId: profile.id });
  }
  try {
    return await apiFetch(`/api/communications/attachments/${attachmentId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, review_note: reviewNote }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return submitLocalCreativeReview({ attachmentId, status, reviewNote, reviewerId: profile.id });
  }
}

export async function lookupUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return lookupLocalUserByEmail(normalized, profile.id);
  }
  try {
    return await apiFetch(`/api/communications/users?email=${encodeURIComponent(normalized)}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return lookupLocalUserByEmail(normalized, profile.id);
  }
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
  if (communicationFallbackMode) return [];
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
  if (communicationFallbackMode) {
    const profile = await getLocalCurrentProfile();
    return updateLocalPresence(profile.id, isOnline);
  }
  try {
    return await apiFetch("/api/communications/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_online: isOnline }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    enableCommunicationFallback(error?.message || error);
    const profile = await getLocalCurrentProfile();
    return updateLocalPresence(profile.id, isOnline);
  }
}

export function subscribeToConversation(conversationId, handlers = {}) {
  if (communicationFallbackMode) {
    return subscribeLocalConversation(conversationId, handlers);
  }
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
  if (communicationFallbackMode) {
    return subscribeLocalPresence(handlers);
  }
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
