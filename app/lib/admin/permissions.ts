import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAdminRole, type AdminRoleType } from "@/app/lib/admin-platform/types";

export type AppUserRole = "admin" | "usa_client" | "end_client";

const STAFF_ROLES = new Set(["super_admin", "admin", "moderator", "support"]);

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === "admin" || STAFF_ROLES.has(role);
}

export async function getProfileRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, admin_role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const fallback = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (fallback.error || !fallback.data?.role) return null;
    return fallback.data.role;
  }

  if (!data) return null;
  const resolved = resolveAdminRole(data);
  if (STAFF_ROLES.has(resolved) || data.role === "admin") {
    return resolved !== "user" ? resolved : "admin";
  }
  return data.role || null;
}

export async function requireAdminUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; role: AdminRoleType | "admin" } | { ok: false; error: string }> {
  const role = await getProfileRole(supabase, userId);
  if (!isAdminRole(role)) {
    return { ok: false, error: "Forbidden: admin access required" };
  }
  return { ok: true, role: role as AdminRoleType | "admin" };
}
