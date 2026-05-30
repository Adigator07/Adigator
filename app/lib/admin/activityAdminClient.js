/**
 * Browser client for Admin Dashboard activity views (future /dashboard/admin).
 */

import { supabase } from "../supabase";
import { isAdminRole } from "./permissions";

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role || metaRole || null;
}

export async function fetchAdminActivityLogs(options = {}) {
  const role = await getCurrentUserRole();
  if (!isAdminRole(role)) {
    throw new Error("Admin access required");
  }

  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.userId) params.set("user_id", options.userId);
  if (options.actionType) params.set("action_type", options.actionType);
  if (options.since) params.set("since", options.since);

  const response = await fetch(`/api/admin/activity?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Failed to load activity logs");
  }

  return payload.events || [];
}

export async function isCurrentUserAdmin() {
  const role = await getCurrentUserRole();
  return isAdminRole(role);
}
