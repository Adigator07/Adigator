export type UserRole = "admin" | "usa_client" | "end_client";
export type ConversationStatus = "active" | "archived" | "closed";
export type ConversationType = "direct" | "project";
export type ParticipantRole = "sender" | "receiver" | "observer";
export type MessageType = "text" | "file" | "creative" | "system_event";
export type ReviewStatus = "pending" | "in_review" | "approved" | "revision_requested";
export type CommActivityEventType =
  | "message_sent"
  | "file_uploaded"
  | "creative_assigned"
  | "message_opened"
  | "file_viewed"
  | "review_started"
  | "review_submitted"
  | "user_joined"
  | "user_left"
  | "status_changed";
export type NotificationType =
  | "new_message"
  | "creative_assigned"
  | "review_request"
  | "review_done"
  | "mention";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company_name: string | null;
  phone: string | null;
  timezone: string | null;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_by: string;
  assigned_to: string;
  status: ConversationStatus;
  type: ConversationType;
  project_ref: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  other_participant?: Profile;
  unread_count?: number;
  last_message_preview?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role_in_conversation: ParticipantRole;
  joined_at: string;
  last_read_at: string | null;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender?: Profile;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  uploader_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string | null;
  thumbnail_url: string | null;
  storage_key: string;
  uploaded_at: string;
  review?: CreativeReview;
}

export interface CreativeReview {
  id: string;
  attachment_id: string;
  reviewer_id: string;
  conversation_id: string;
  status: ReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
}

export interface CommActivityEvent {
  id: string;
  conversation_id: string;
  user_id: string;
  related_message_id: string | null;
  related_attachment_id: string | null;
  event_type: CommActivityEventType;
  event_data: Record<string, unknown>;
  occurred_at: string;
  user?: Profile;
}

export interface CommNotification {
  id: string;
  recipient_id: string;
  conversation_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}
