import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminUser, UserStatus } from "../types";

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: UserStatus;
  sortBy?: "created_at" | "last_login_at" | "email";
  sortDir?: "asc" | "desc";
};

function mapProfile(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: row.full_name ? String(row.full_name) : null,
    phone: row.phone ? String(row.phone) : null,
    role: String(row.role || "end_client"),
    adminRole: (row.admin_role as AdminUser["adminRole"]) || null,
    status: (row.status as UserStatus) || "active",
    country: row.country ? String(row.country) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    timezone: row.timezone ? String(row.timezone) : null,
    isOnline: Boolean(row.is_online),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
    lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listUsers(supabase: SupabaseClient, query: UserListQuery = {}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let dbQuery = supabase
    .from("profiles")
    .select("*", { count: "exact" });

  if (query.search?.trim()) {
    const q = `%${query.search.trim()}%`;
    dbQuery = dbQuery.or(`email.ilike.${q},full_name.ilike.${q},phone.ilike.${q}`);
  }
  if (query.role) dbQuery = dbQuery.eq("role", query.role);
  if (query.status) dbQuery = dbQuery.eq("status", query.status);

  const sortBy = query.sortBy || "created_at";
  dbQuery = dbQuery.order(sortBy, { ascending: query.sortDir === "asc" }).range(from, to);

  const { data, error, count } = await dbQuery;
  if (error) throw new Error(error.message);

  return {
    users: (data || []).map(mapProfile),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getUserById(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProfile(data);
}

export async function getUserDetail(supabase: SupabaseClient, userId: string) {
  const [user, sessions, activities, usage, devices] = await Promise.all([
    getUserById(supabase, userId),
    supabase.from("admin_user_sessions").select("*").eq("user_id", userId).order("login_time", { ascending: false }).limit(50),
    supabase.from("admin_user_activity").select("*").eq("user_id", userId).order("timestamp", { ascending: false }).limit(100),
    supabase.from("admin_feature_usage").select("*").eq("user_id", userId).order("usage_count", { ascending: false }),
    supabase.from("admin_user_sessions").select("device, browser, os, ip_address, login_time").eq("user_id", userId).order("login_time", { ascending: false }).limit(200),
  ]);

  if (!user) return null;

  const deviceHistory = [...new Set((devices.data || []).map((d) => `${d.device || "Unknown"} · ${d.browser || "Unknown"} · ${d.os || ""}`))];

  return {
    user,
    sessions: sessions.data || [],
    activities: activities.data || [],
    featureUsage: usage.data || [],
    deviceHistory,
  };
}

export async function updateUserStatus(
  supabase: SupabaseClient,
  userId: string,
  status: UserStatus,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<{ fullName: string; phone: string; country: string; adminRole: string; role: string }>,
) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.country !== undefined) update.country = patch.country;
  if (patch.adminRole !== undefined) update.admin_role = patch.adminRole;
  if (patch.role !== undefined) update.role = patch.role;

  const { data, error } = await supabase.from("profiles").update(update).eq("id", userId).select("*").single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function deleteUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export function usersToCsv(users: AdminUser[]): string {
  const headers = ["id", "name", "email", "phone", "role", "status", "country", "last_login", "created_at"];
  const rows = users.map((u) => [
    u.id,
    u.fullName || "",
    u.email,
    u.phone || "",
    u.adminRole || u.role,
    u.status,
    u.country || "",
    u.lastLoginAt || "",
    u.createdAt,
  ]);
  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}
