export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function truncate(text: string, max = 40): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function formatEventLabel(
  eventType: string,
  userName: string,
  eventData: Record<string, unknown> = {},
): string {
  const fileName = String(eventData.file_name || "a file");
  const recipient = String(eventData.recipient_name || "client");
  const status = String(eventData.status || "");
  const duration = eventData.duration_seconds ? `${eventData.duration_seconds}s` : "";

  switch (eventType) {
    case "message_sent": return `${userName} sent a message`;
    case "file_uploaded": return `${userName} uploaded ${fileName}`;
    case "creative_assigned": return `${userName} assigned creatives to ${recipient}`;
    case "message_opened": return `${userName} opened the message`;
    case "file_viewed": return `${userName} viewed ${fileName}${duration ? ` for ${duration}` : ""}`;
    case "review_started": return `${userName} started reviewing ${fileName}`;
    case "review_submitted": {
      if (status === "approved") return `${userName} approved ${fileName}`;
      if (status === "revision_requested") return `${userName} requested revision on ${fileName}`;
      return `${userName} submitted a review on ${fileName}`;
    }
    case "user_joined": return `${userName} joined the conversation`;
    case "user_left": return `${userName} left the conversation`;
    case "status_changed": return `Conversation status changed to ${status}`;
    default: return `${userName} performed ${eventType.replace(/_/g, " ")}`;
  }
}

export function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    message_sent: "💬",
    file_uploaded: "📎",
    creative_assigned: "🎨",
    message_opened: "👁️",
    file_viewed: "👁️",
    review_started: "🔍",
    review_submitted: "✅",
    user_joined: "🟢",
    user_left: "⚪",
    status_changed: "🔁",
  };
  return icons[eventType] || "•";
}
