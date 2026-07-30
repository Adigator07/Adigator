import { getFirebaseAdminAuth } from "@/app/lib/firebase/admin";
import { getUserProfile, upsertUserProfile } from "@/app/lib/firestore/profiles";
import { markProfilePendingApproval } from "./accountStatus.server";
import { syncUserProfile } from "./handlers";
import { migrateLegacyPasswordOnLogin } from "./legacyPasswordMigration";
import type { RegisterRole } from "./types";

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: RegisterRole;
};

type FirebaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      role: RegisterRole;
    };
  };
};

function getFirebaseApiKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!key) throw new Error("Firebase API key is missing.");
  return key;
}

async function firebaseSignInWithPassword(email: string, password: string) {
  const key = getFirebaseApiKey();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Firebase sign-in failed");
  }
  return payload as {
    localId: string;
    email: string;
    displayName?: string;
    idToken: string;
    refreshToken: string;
    expiresIn?: string;
  };
}

/**
 * Sign up via Supabase Auth.
 * Passwords are bcrypt-hashed by Supabase in auth.users — never stored in plaintext in app tables.
 */
export async function signUpWithSecurePassword(input: SignUpInput) {
  try {
    const user = await getFirebaseAdminAuth().createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    });

    await syncUserProfile({
      userId: user.uid,
      email: input.email,
      username: input.displayName,
      fullName: input.displayName,
      role: input.role,
    });

    await upsertUserProfile(user.uid, {
      email: input.email,
      username: input.displayName,
      fullName: input.displayName,
      role: input.role,
    });

    await markProfilePendingApproval(null, user.uid);

    return {
      data: {
        user: {
          id: user.uid,
          email: user.email || input.email,
        },
        session: null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Signup failed") };
  }
}

/**
 * Attempt legacy weak-hash migration, then authenticate via Supabase Auth.
 */
export async function signInWithSecurePassword(email: string, password: string) {
  await migrateLegacyPasswordOnLogin(email, password);

  try {
    const signedIn = await firebaseSignInWithPassword(email, password);
    const profile = await getUserProfile(signedIn.localId);
    const resolvedRole = (profile?.role === "usa_client" ? "usa_client" : "end_client") as RegisterRole;
    const fullName = profile?.fullName || signedIn.displayName || email.split("@")[0] || "";
    const expiresIn = Number.parseInt(String(signedIn.expiresIn || "3600"), 10) || 3600;

    const session: FirebaseSession = {
      access_token: signedIn.idToken,
      refresh_token: signedIn.refreshToken,
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      user: {
        id: signedIn.localId,
        email: signedIn.email || email,
        user_metadata: {
          full_name: fullName,
          role: resolvedRole,
        },
      },
    };

    return {
      data: {
        session,
        user: session.user,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

export type ChangePasswordInput = {
  accessToken: string;
  email: string;
  currentPassword: string;
  newPassword: string;
};

/**
 * Verify current password, then re-hash via Supabase Auth admin API (bcrypt in auth.users).
 */
export async function changePasswordSecure(input: ChangePasswordInput) {
  try {
    await firebaseSignInWithPassword(input.email, input.currentPassword);

    const decoded = await getFirebaseAdminAuth().verifyIdToken(input.accessToken);
    await getFirebaseAdminAuth().updateUser(decoded.uid, {
      password: input.newPassword,
    });

    return { ok: true as const, error: null };
  } catch (error) {
    return { ok: false as const, error };
  }
}

export type AuthSessionResult = {
  session: FirebaseSession;
  user: FirebaseSession["user"];
};
