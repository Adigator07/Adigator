import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { getFirebaseAdminAuth } from "@/app/lib/firebase/admin";
import {
  getLoginBlockMessage,
  isAccountLoginAllowed,
} from "@/app/lib/auth/accountStatus";
import { getProfileAccountStatus } from "@/app/lib/auth/accountStatus.server";

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { url, anonKey };
}

function baseClientOptions() {
  return {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  } as const;
}

export function getAccessTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;

  return token.trim();
}

/** User-scoped client for database / RPC calls (JWT sent via Authorization header). */
export function createServerSupabaseClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    ...baseClientOptions(),
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function getServiceRoleKey(): string | null {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || null
  );
}

/** Bypasses RLS for trusted server-side writes when SUPABASE_SERVICE_ROLE_KEY is set. */
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getServiceRoleKey();
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, baseClientOptions());
}

/** User-scoped client — use for RPC calls that rely on auth.uid(). */
export function createUserSupabaseClient(accessToken: string): SupabaseClient {
  return createServerSupabaseClient(accessToken);
}

/** Prefer service-role client for direct table writes; fall back to user JWT client. */
export function createWritableSupabaseClient(accessToken: string): SupabaseClient {
  return createAdminSupabaseClient() ?? createServerSupabaseClient(accessToken);
}

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
};

export async function getAuthenticatedUser(accessToken: string): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(accessToken);
    const user: AuthenticatedUser = {
      id: decoded.uid,
      email: decoded.email || null,
      user_metadata: {
        full_name: decoded.name || "",
      },
    };

    if (!user.id) {
      return { user: null, error: "Unauthorized" };
    }

    const admin = createAdminSupabaseClient();
    const accountStatus = await getProfileAccountStatus(admin, user.id);
    if (!isAccountLoginAllowed(accountStatus)) {
      return { user: null, error: getLoginBlockMessage(accountStatus) };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Unauthorized" };
  }
}
