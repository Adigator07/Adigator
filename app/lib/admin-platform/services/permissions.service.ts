import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_FEATURES, type AdminFeature } from "../types";

export async function getFeaturePermissions(
  supabase: SupabaseClient,
  userId?: string,
  roleName?: string,
) {
  let q = supabase.from("admin_feature_permissions").select("*");
  if (userId) q = q.eq("user_id", userId);
  else if (roleName) q = q.eq("role_name", roleName);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPermissionsMatrix(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("admin_role, role")
    .eq("id", userId)
    .maybeSingle();

  const roleName = profile?.admin_role || (profile?.role === "admin" ? "admin" : "user");

  const [rolePerms, userPerms] = await Promise.all([
    supabase.from("admin_feature_permissions").select("*").eq("role_name", roleName),
    supabase.from("admin_feature_permissions").select("*").eq("user_id", userId),
  ]);

  const matrix: Record<AdminFeature, boolean> = {} as Record<AdminFeature, boolean>;
  ADMIN_FEATURES.forEach((f) => {
    matrix[f] = false;
  });

  (rolePerms.data || []).forEach((p) => {
    if (ADMIN_FEATURES.includes(p.feature_name as AdminFeature)) {
      matrix[p.feature_name as AdminFeature] = p.enabled;
    }
  });

  (userPerms.data || []).forEach((p) => {
    if (ADMIN_FEATURES.includes(p.feature_name as AdminFeature)) {
      matrix[p.feature_name as AdminFeature] = p.enabled;
    }
  });

  // Super admin / admin defaults
  if (roleName === "super_admin") {
    ADMIN_FEATURES.forEach((f) => { matrix[f] = true; });
  }

  return { roleName, permissions: matrix };
}

export async function setUserFeaturePermissions(
  supabase: SupabaseClient,
  userId: string,
  permissions: Partial<Record<AdminFeature, boolean>>,
) {
  const upserts = Object.entries(permissions).map(([featureName, enabled]) => ({
    user_id: userId,
    role_name: null,
    feature_name: featureName,
    enabled: Boolean(enabled),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("admin_feature_permissions")
    .upsert(upserts, { onConflict: "user_id,feature_name" });
  if (error) throw new Error(error.message);
}

export async function listRoleDefinitions(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("admin_role_definitions").select("*").order("hierarchy", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
