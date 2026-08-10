import { onAuthStateChanged } from "firebase/auth";

import { getFirebaseClientAuth, getFirebaseClientAuthOrNull } from "@/app/lib/firebase/client";

type ClientUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
    role?: string;
  };
};

type ClientSession = {
  access_token: string;
  expires_at: number | null;
  user: ClientUser;
};

let authChain: Promise<unknown> = Promise.resolve();

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
export async function getClientSession(): Promise<ClientSession | null> {
  return runSerializedAuth(async () => {
    const auth = getFirebaseClientAuth();
    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();
    const tokenResult = await user.getIdTokenResult();
    return {
      access_token: token,
      expires_at: tokenResult.expirationTime ? Math.floor(Date.parse(tokenResult.expirationTime) / 1000) : null,
      user: {
        id: user.uid,
        email: user.email,
        user_metadata: {
          full_name: user.displayName || "",
        },
      },
    };
  });
}

function toClientUser(user: { uid: string; email: string | null; displayName: string | null }): ClientUser {
  return {
    id: user.uid,
    email: user.email,
    user_metadata: {
      full_name: user.displayName || "",
    },
  };
}

/** Resolve the signed-in user without waiting on ID token refresh. */
export async function getClientUser(): Promise<ClientUser | null> {
  const auth = getFirebaseClientAuthOrNull();
  if (!auth) return null;

  // Fast path: Firebase already restored the session from persistence.
  if (auth.currentUser) {
    return toClientUser(auth.currentUser);
  }

  return runSerializedAuth(async () => {
    if (auth.currentUser) {
      return toClientUser(auth.currentUser);
    }

    return new Promise<ClientUser | null>((resolve) => {
      let settled = false;
      const finish = (value: ClientUser | null) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        if (typeof window !== "undefined") window.clearTimeout(timeout);
        resolve(value);
      };

      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        finish(nextUser ? toClientUser(nextUser) : null);
      });

      // Don't hang route shells if auth never emits.
      const timeout =
        typeof window === "undefined"
          ? (0 as unknown as number)
          : window.setTimeout(() => finish(null), 1500);
    });
  });
}

export async function getClientAccessToken(): Promise<string | null> {
  return getFreshAccessToken();
}

const TOKEN_REFRESH_BUFFER_MS = 60_000;

function isSessionTokenFresh(session: ClientSession): boolean {
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
    const auth = getFirebaseClientAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(true);
  });
}
