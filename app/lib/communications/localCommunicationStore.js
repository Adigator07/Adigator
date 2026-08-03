const LOCAL_COMM_STORAGE_KEY = "adigator_local_communications_v1";
const LOCAL_COMM_EVENT = "adigator-local-communications";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function readStore() {
  if (!canUseStorage()) {
    return { profiles: {}, conversations: [], messagesByConversation: {}, activityByConversation: {}, notifications: [] };
  }

  try {
    const raw = localStorage.getItem(LOCAL_COMM_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object"
      ? {
          profiles: parsed.profiles || {},
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
          messagesByConversation: parsed.messagesByConversation || {},
          activityByConversation: parsed.activityByConversation || {},
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        }
      : { profiles: {}, conversations: [], messagesByConversation: {}, activityByConversation: {}, notifications: [] };
  } catch {
    return { profiles: {}, conversations: [], messagesByConversation: {}, activityByConversation: {}, notifications: [] };
  }
}

function writeStore(store, detail = {}) {
  if (!canUseStorage()) return;
  localStorage.setItem(LOCAL_COMM_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(LOCAL_COMM_EVENT, { detail }));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeNameFromEmail(email) {
  return String(email || "user")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    email: profile.email || "",
    full_name: profile.full_name || profile.fullName || normalizeNameFromEmail(profile.email),
    avatar_url: profile.avatar_url || null,
    role: profile.role || "end_client",
    company_name: profile.company_name || null,
    phone: profile.phone || null,
    timezone: profile.timezone || null,
    is_online: typeof profile.is_online === "boolean" ? profile.is_online : true,
    last_seen_at: profile.last_seen_at || null,
    created_at: profile.created_at || nowIso(),
    updated_at: profile.updated_at || nowIso(),
  };
}

function stableRecipientId(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return `local-${normalized.replace(/[^a-z0-9]+/g, "-") || "recipient"}`;
}

function ensureProfile(profileInput) {
  const store = readStore();
  const profile = normalizeProfile(profileInput);
  store.profiles[profile.id] = {
    ...(store.profiles[profile.id] || {}),
    ...profile,
    updated_at: nowIso(),
  };
  writeStore(store, { type: "profile", profile: store.profiles[profile.id] });
  return store.profiles[profile.id];
}

export function syncLocalProfile(profileInput) {
  return ensureProfile(profileInput);
}

export function lookupLocalUserByEmail(email, currentUserId = "") {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");

  const store = readStore();
  const existing = Object.values(store.profiles).find((profile) => profile.email?.toLowerCase() === normalized && profile.id !== currentUserId);
  if (existing) return existing;

  const created = normalizeProfile({
    id: stableRecipientId(normalized),
    email: normalized,
    full_name: normalizeNameFromEmail(normalized),
    role: "end_client",
    is_online: false,
  });
  store.profiles[created.id] = created;
  writeStore(store, { type: "profile", profile: created });
  return created;
}

function buildConversationProjection(conversation, currentUserId, store) {
  const otherId = conversation.created_by === currentUserId ? conversation.assigned_to : conversation.created_by;
  const messages = store.messagesByConversation[conversation.id] || [];
  const lastMessage = messages[messages.length - 1];
  return {
    ...conversation,
    other_participant: store.profiles[otherId] || null,
    unread_count: 0,
    last_message_preview: lastMessage?.body || (lastMessage?.attachments?.length ? "📎 File shared" : ""),
  };
}

export function listLocalConversations(currentUserId) {
  const store = readStore();
  return store.conversations
    .filter((conversation) => conversation.created_by === currentUserId || conversation.assigned_to === currentUserId)
    .sort((a, b) => new Date(b.last_message_at || b.updated_at || 0).getTime() - new Date(a.last_message_at || a.updated_at || 0).getTime())
    .map((conversation) => buildConversationProjection(conversation, currentUserId, store));
}

export function getLocalConversation(conversationId, currentUserId) {
  const store = readStore();
  const conversation = store.conversations.find((entry) => entry.id === conversationId);
  if (!conversation) return null;
  return buildConversationProjection(conversation, currentUserId, store);
}

export function createLocalConversation({ currentUser, recipientEmail, title, projectRef = null, welcomeMessage = null, type = "direct" }) {
  const store = readStore();
  const sender = ensureProfile(currentUser);
  const recipient = lookupLocalUserByEmail(recipientEmail, sender.id);
  const conversationId = makeId("conv");
  const timestamp = nowIso();

  const conversation = {
    id: conversationId,
    title,
    created_by: sender.id,
    assigned_to: recipient.id,
    status: "active",
    type,
    project_ref: projectRef,
    last_message_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };

  store.conversations.unshift(conversation);
  store.messagesByConversation[conversationId] = [];
  store.activityByConversation[conversationId] = [];

  if (welcomeMessage) {
    const message = addLocalMessageInternal(store, {
      conversationId,
      senderProfile: sender,
      body: welcomeMessage,
      type: "text",
      files: [],
    });
    addLocalActivityInternal(store, conversationId, sender.id, "message_sent", { type: "text" }, { relatedMessageId: message.id });
  }

  addLocalActivityInternal(store, conversationId, sender.id, "creative_assigned", { recipient_name: recipient.full_name, project_ref: projectRef });
  writeStore(store, { type: "conversation", conversationId, conversation });
  return buildConversationProjection(conversation, sender.id, store);
}

function buildLocalAttachment(file, messageId, uploaderId) {
  return {
    id: makeId("att"),
    message_id: messageId,
    uploader_id: uploaderId,
    file_name: file.name || "Attachment",
    file_type: file.type || "application/octet-stream",
    file_size: file.size || 0,
    file_url: null,
    thumbnail_url: null,
    storage_key: "local-fallback",
    uploaded_at: nowIso(),
    review: {
      id: makeId("review"),
      attachment_id: "",
      reviewer_id: uploaderId,
      conversation_id: "",
      status: "pending",
      review_note: null,
      reviewed_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  };
}

function addLocalMessageInternal(store, { conversationId, senderProfile, body, type = "text", files = [] }) {
  const messageId = makeId("msg");
  const attachments = files.map((file) => {
    const attachment = buildLocalAttachment(file, messageId, senderProfile.id);
    attachment.review.attachment_id = attachment.id;
    attachment.review.conversation_id = conversationId;
    return attachment;
  });

  const message = {
    id: messageId,
    conversation_id: conversationId,
    sender_id: senderProfile.id,
    type,
    body: body || null,
    metadata: { delivery_status: "sent" },
    sent_at: nowIso(),
    edited_at: null,
    deleted_at: null,
    sender: senderProfile,
    attachments,
  };

  if (!store.messagesByConversation[conversationId]) {
    store.messagesByConversation[conversationId] = [];
  }
  store.messagesByConversation[conversationId].push(message);

  const conversation = store.conversations.find((entry) => entry.id === conversationId);
  if (conversation) {
    conversation.last_message_at = message.sent_at;
    conversation.updated_at = message.sent_at;
  }

  return message;
}

function addLocalActivityInternal(store, conversationId, userId, eventType, eventData = {}, extras = {}) {
  const event = {
    id: makeId("evt"),
    conversation_id: conversationId,
    user_id: userId,
    related_message_id: extras.relatedMessageId || null,
    related_attachment_id: extras.relatedAttachmentId || null,
    event_type: eventType,
    event_data: eventData,
    occurred_at: nowIso(),
    user: store.profiles[userId] || null,
  };

  if (!store.activityByConversation[conversationId]) {
    store.activityByConversation[conversationId] = [];
  }
  store.activityByConversation[conversationId].unshift(event);
  return event;
}

export function listLocalMessages(conversationId) {
  const store = readStore();
  return store.messagesByConversation[conversationId] || [];
}

export function addLocalTextMessage({ conversationId, senderProfile, body }) {
  const store = readStore();
  const sender = ensureProfile(senderProfile);
  const message = addLocalMessageInternal(store, { conversationId, senderProfile: sender, body, type: "text", files: [] });
  addLocalActivityInternal(store, conversationId, sender.id, "message_sent", { type: "text" }, { relatedMessageId: message.id });
  writeStore(store, { type: "message", conversationId, message });
  return message;
}

export function addLocalFileMessage({ conversationId, senderProfile, body, files }) {
  const store = readStore();
  const sender = ensureProfile(senderProfile);
  const hasCreative = files.some((file) => String(file.type || "").startsWith("image/") || String(file.type || "").startsWith("video/") || file.type === "application/pdf");
  const message = addLocalMessageInternal(store, {
    conversationId,
    senderProfile: sender,
    body,
    type: hasCreative ? "creative" : "file",
    files,
  });
  addLocalActivityInternal(store, conversationId, sender.id, "file_uploaded", { file_count: files.length }, { relatedMessageId: message.id });
  writeStore(store, { type: "message", conversationId, message });
  return message;
}

export function listLocalActivity(conversationId) {
  const store = readStore();
  return store.activityByConversation[conversationId] || [];
}

export function addLocalActivity({ conversationId, userId, eventType, eventData = {}, extras = {} }) {
  const store = readStore();
  const event = addLocalActivityInternal(store, conversationId, userId, eventType, eventData, extras);
  writeStore(store, { type: "activity", conversationId, event });
  return event;
}

export function submitLocalCreativeReview({ attachmentId, status, reviewNote, reviewerId }) {
  const store = readStore();
  let updatedAttachment = null;
  let conversationId = "";

  Object.entries(store.messagesByConversation).forEach(([convId, messages]) => {
    messages.forEach((message) => {
      (message.attachments || []).forEach((attachment) => {
        if (attachment.id !== attachmentId) return;
        attachment.review = {
          ...(attachment.review || {}),
          attachment_id: attachment.id,
          reviewer_id: reviewerId,
          conversation_id: convId,
          status,
          review_note: reviewNote || null,
          reviewed_at: nowIso(),
          updated_at: nowIso(),
        };
        updatedAttachment = attachment;
        conversationId = convId;
      });
    });
  });

  if (!updatedAttachment) {
    throw new Error("Attachment not found");
  }

  addLocalActivityInternal(store, conversationId, reviewerId, "review_submitted", { status, review_note: reviewNote || null }, { relatedAttachmentId: attachmentId });
  writeStore(store, { type: "review", conversationId, attachmentId, status });
  return updatedAttachment;
}

export function updateLocalPresence(userId, isOnline) {
  const store = readStore();
  const profile = store.profiles[userId];
  if (!profile) return null;
  profile.is_online = isOnline;
  profile.last_seen_at = isOnline ? profile.last_seen_at : nowIso();
  profile.updated_at = nowIso();
  writeStore(store, { type: "presence", profile });
  return profile;
}

export function subscribeLocalConversation(conversationId, handlers = {}) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    const detail = event.detail || {};
    if (detail.conversationId !== conversationId) return;
    if (detail.type === "message" && detail.message) handlers.onMessage?.(detail.message);
    if ((detail.type === "activity" || detail.type === "review") && detail.event) handlers.onActivity?.(detail.event);
  };

  window.addEventListener(LOCAL_COMM_EVENT, listener);
  return () => window.removeEventListener(LOCAL_COMM_EVENT, listener);
}

export function subscribeLocalPresence(handlers = {}) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => {
    const detail = event.detail || {};
    if (detail.type === "presence" && detail.profile) handlers.onPresence?.(detail.profile);
  };

  window.addEventListener(LOCAL_COMM_EVENT, listener);
  return () => window.removeEventListener(LOCAL_COMM_EVENT, listener);
}
