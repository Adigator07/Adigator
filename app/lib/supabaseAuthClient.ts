import { onAuthStateChanged } from "firebase/auth";

import { getFirebaseClientAuth } from "@/app/lib/firebase/client";

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

/** Resolve the signed-in user without redundant concurrent getUser() calls. */
export async function getClientUser(): Promise<ClientUser | null> {
  const session = await getClientSession();
  if (session?.user) return session.user;

  return runSerializedAuth(async () => {
    const auth = getFirebaseClientAuth();
    const user = auth.currentUser;
    if (user) {
      return {
        id: user.uid,
        email: user.email,
        user_metadata: {
          full_name: user.displayName || "",
        },
      };
    }

    const resolved = await new Promise<ClientUser | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        unsubscribe();
        if (!nextUser) {
          resolve(null);
          return;
        }
        resolve({
          id: nextUser.uid,
          email: nextUser.email,
          user_metadata: {
            full_name: nextUser.displayName || "",
          },
        });
      });
    });

    return resolved;
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
