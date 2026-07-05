import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/app/lib/supabase";

let authChain: Promise<unknown> = Promise.resolve();

function isAuthLockError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /lock|stole/i.test(message);
}

/** Serialize browser auth calls to avoid Supabase navigator lock contention. */
function runSerializedAuth<T>(task: () => Promise<T>): Promise<T> {
  const run = authChain.then(task, task);
  authChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Read the current session from local storage (preferred for client UI). */
export async function getClientSession(): Promise<Session | null> {
  return runSerializedAuth(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session ?? null;
    } catch (error) {
      if (!isAuthLockError(error)) throw error;
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    }
  });
}

/** Resolve the signed-in user without redundant concurrent getUser() calls. */
export async function getClientUser(): Promise<User | null> {
  const session = await getClientSession();
  if (session?.user) return session.user;

  return runSerializedAuth(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    } catch (error) {
      if (!isAuthLockError(error)) throw error;
      const retrySession = await getClientSession();
      return retrySession?.user ?? null;
    }
  });
}

export async function getClientAccessToken(): Promise<string | null> {
  return getFreshAccessToken();
}

const TOKEN_REFRESH_BUFFER_MS = 60_000;

function isSessionTokenFresh(session: Session): boolean {
  if (!session.access_token) return false;
  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (!expiresAtMs) return true;
  return expiresAtMs - Date.now() > TOKEN_REFRESH_BUFFER_MS;
}

/** Return a valid access token, refreshing the session when near expiry. */
export async function getFreshAccessToken(): Promise<string | null> {
  const session = await getClientSession();
  if (!session) return null;
  if (isSessionTokenFresh(session)) {
    return session.access_token;
  }

  return runSerializedAuth(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        return session.access_token ?? null;
      }
      return data.session?.access_token ?? session.access_token ?? null;
    } catch (error) {
      if (!isAuthLockError(error)) {
        return session.access_token ?? null;
      }
      const { data } = await supabase.auth.refreshSession();
      return data.session?.access_token ?? session.access_token ?? null;
    }
  });
}
