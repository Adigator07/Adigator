/**
 * Client-side user activity logging.
 * Writes persist to Supabase `activity_logs` in the background for all authenticated users.
 * Reading logs is admin-only — see app/lib/admin/activityAdmin.ts and GET /api/admin/activity.
 */

export {
  LOCAL_ACTIVITY_KEY,
  getActivityAccessToken,
  trackUserActivity,
} from "./supabaseDataService";

import { trackUserActivity } from "./supabaseDataService";

/** @deprecated Use trackUserActivity — kept for existing imports */
export async function logUserActivity(eventType, payload = {}) {
  const result = await trackUserActivity(eventType, payload, {
    dedupeKey: payload.dedupeKey,
  });
  return result.data || {
    event_type: eventType,
    event_label: payload.event_label || eventType.replace(/_/g, " "),
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
  };
}

/**
 * @deprecated Activity history is admin-only. Use fetchAdminActivityLogs from ../admin/activityAdminClient.
 */
export async function fetchUserActivity() {
  return [];
}
