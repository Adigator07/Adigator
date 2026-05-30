import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUserRole = "admin" | "usa_client" | "end_client";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export async function getProfileRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppUserRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.role) return null;
  return data.role as AppUserRole;
}

export async function requireAdminUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; role: AppUserRole } | { ok: false; error: string }> {
  const role = await getProfileRole(supabase, userId);
  if (!isAdminRole(role)) {
    return { ok: false, error: "Forbidden: admin access required" };
  }
  return { ok: true, role: role as AppUserRole };
}
