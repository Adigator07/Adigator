import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hasPermission,
  isStaffRole,
  resolveAdminRole,
  type AdminRoleType,
} from "./types";

export type AdminAuthContext = {
  userId: string;
  email: string;
  role: AdminRoleType;
  permissions: string[];
};

export function createServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticateAdminRequest(
  supabase: SupabaseClient,
  accessToken: string,
): Promise<{ ok: true; ctx: AdminAuthContext } | { ok: false; status: number; error: string }> {
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, admin_role, status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 403, error: "Profile not found" };
  }

  if (profile.status === "suspended" || profile.status === "banned") {
    return { ok: false, status: 403, error: "Account suspended" };
  }

  const role = resolveAdminRole(profile);
  if (!isStaffRole(role) && profile.role !== "admin") {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return {
    ok: true,
    ctx: {
      userId: profile.id,
      email: profile.email,
      role,
      permissions: [],
    },
  };
}

export function requirePermission(ctx: AdminAuthContext, permission: string): boolean {
  return hasPermission(ctx.role, permission);
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
  );
}

export function parseUserAgent(ua: string | null): { device: string; browser: string; os: string } {
  const raw = ua || "";
  let device = "Desktop";
  if (/tablet|ipad/i.test(raw)) device = "Tablet";
  else if (/mobile|android|iphone/i.test(raw)) device = /android/i.test(raw) ? "Android" : "iPhone";

  let browser = "Unknown";
  if (/edg\//i.test(raw)) browser = "Edge";
  else if (/firefox/i.test(raw)) browser = "Firefox";
  else if (/chrome/i.test(raw)) browser = "Chrome";
  else if (/safari/i.test(raw)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(raw)) os = "Windows";
  else if (/mac os/i.test(raw)) os = "macOS";
  else if (/android/i.test(raw)) os = "Android";
  else if (/iphone|ipad/i.test(raw)) os = "iOS";
  else if (/linux/i.test(raw)) os = "Linux";

  return { device, browser, os };
}
