import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LOGIN_ACCOUNT_DISABLED_ERROR,
  LOGIN_PENDING_APPROVAL_ERROR,
} from "./constants";

export type AccountStatus = "active" | "suspended" | "banned" | "pending_verification";

export async function getProfileAccountStatus(
  admin: SupabaseClient | null,
  userId: string,
): Promise<AccountStatus | null> {
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.status) return null;
  return data.status as AccountStatus;
}

export function getLoginBlockMessage(status: AccountStatus | null | undefined): string {
  if (status === "pending_verification") return LOGIN_PENDING_APPROVAL_ERROR;
  return LOGIN_ACCOUNT_DISABLED_ERROR;
}

export function isAccountLoginAllowed(status: AccountStatus | null | undefined): boolean {
  return status === "active";
}

export async function revokeAllUserSessions(
  admin: SupabaseClient | null,
  userId: string,
): Promise<void> {
  if (!admin) return;
  await admin.auth.admin.signOut(userId, "global");
}

export async function markProfilePendingApproval(
  admin: SupabaseClient | null,
  userId: string,
): Promise<void> {
  if (!admin) return;

  await admin
    .from("profiles")
    .update({
      status: "pending_verification",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
