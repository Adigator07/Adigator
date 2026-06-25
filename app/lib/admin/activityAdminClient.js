/**
 * Browser client for Admin Dashboard activity views (future /dashboard/admin).
 */

import { supabase } from "../supabase";
import { isAdminRole } from "./permissions";

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

const STAFF_ADMIN_ROLES = ["super_admin", "admin", "moderator", "support"];

async function fetchProfileRole(userId) {
  const full = await supabase
    .from("profiles")
    .select("role, admin_role")
    .eq("id", userId)
    .maybeSingle();

  if (!full.error) return full.data;

  const msg = full.error.message || "";
  if (msg.includes("admin_role")) {
    const fallback = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!fallback.error) return fallback.data;
  }

  console.warn("[Adigator] Could not load profile role:", full.error.message);
  return null;
}

async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const metaRole = user.user_metadata?.role;
  const profile = await fetchProfileRole(user.id);

  if (profile?.admin_role && STAFF_ADMIN_ROLES.includes(profile.admin_role)) {
    return profile.admin_role;
  }
  if (profile?.role === "admin") return "admin";
  if (metaRole === "admin") return "admin";
  return profile?.role || metaRole || null;
}

export async function fetchAdminActivityLogs(options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.userId) params.set("user_id", options.userId);
  if (options.actionType) params.set("action_type", options.actionType);
  if (options.since) params.set("since", options.since);
  if (options.search) params.set("search", options.search);

  const response = await fetch(`/api/admin/v1/activity?${params}`, {
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

export async function getCurrentUserAdminRole() {
  return getCurrentUserRole();
}
