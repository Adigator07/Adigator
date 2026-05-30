import type { UserRole } from "./types";

type Permission =
  | "create_conversation"
  | "assign_creative"
  | "send_message"
  | "upload_file"
  | "review_creative"
  | "view_activity"
  | "manage_users"
  | "view_all_conversations"
  | "export_activity"
  | "delete_message"
  | "archive_conversation";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "create_conversation",
    "assign_creative",
    "send_message",
    "upload_file",
    "review_creative",
    "view_activity",
    "manage_users",
    "view_all_conversations",
    "export_activity",
    "delete_message",
    "archive_conversation",
  ],
  usa_client: [
    "create_conversation",
    "assign_creative",
    "send_message",
    "upload_file",
    "view_activity",
    "export_activity",
    "delete_message",
    "archive_conversation",
  ],
  end_client: [
    "create_conversation",
    "send_message",
    "upload_file",
    "review_creative",
    "view_activity",
    "delete_message",
  ],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canCreateConversation(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "create_conversation");
}

export function canReviewCreative(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "review_creative");
}

export function isCreativeMimeType(mime: string): boolean {
  const m = mime.toLowerCase();
  return (
    m.startsWith("image/")
    || m.startsWith("video/")
    || m === "application/pdf"
    || m.includes("presentation")
    || m.includes("document")
  );
}
