import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

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

/** Plain client for auth validation only — do not combine with accessToken option. */
function createAuthSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, baseClientOptions());
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

export async function getAuthenticatedUser(accessToken: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = createAuthSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      return { user: null, error: "Unauthorized" };
    }

    return { user: data.user ?? null, error: null };
  } catch {
    return { user: null, error: "Unauthorized" };
  }
}
