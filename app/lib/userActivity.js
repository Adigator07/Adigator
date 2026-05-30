/**
 * Client-side user activity logging.
 * Persists to Supabase `activity_logs` for authenticated users; local fallback for guests.
 */

export {
  LOCAL_ACTIVITY_KEY,
  getActivityAccessToken,
  trackUserActivity,
  fetchActivityLogs,
} from "./supabaseDataService";

import { trackUserActivity, fetchActivityLogs } from "./supabaseDataService";

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

/** @deprecated Use fetchActivityLogs */
export async function fetchUserActivity(limit = 50) {
  return fetchActivityLogs(limit);
}
