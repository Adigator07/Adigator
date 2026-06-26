import type { Session, User } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/app/lib/supabaseServer";
import { syncUserProfile } from "./handlers";
import { migrateLegacyPasswordOnLogin } from "./legacyPasswordMigration";
import { createServerAuthClient } from "./serverClient";
import type { RegisterRole } from "./types";

export type SignUpInput = {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role: RegisterRole;
};

/**
 * Sign up via Supabase Auth.
 * Passwords are bcrypt-hashed by Supabase in auth.users — never stored in plaintext in app tables.
 */
export async function signUpWithSecurePassword(input: SignUpInput) {
  const supabase = createServerAuthClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.displayName,
        username: input.username,
        display_name: input.displayName,
        role: input.role,
      },
    },
  });

  if (error || !data.user) {
    return { data: null, error };
  }

  await syncUserProfile({
    userId: data.user.id,
    email: input.email,
    fullName: input.displayName,
    role: input.role,
  });

  const admin = createAdminSupabaseClient();
  if (admin) {
    await admin
      .from("profiles")
      .update({ password_hash_version: "supabase_bcrypt" })
      .eq("id", data.user.id);
  }

  return { data, error: null };
}

/**
 * Attempt legacy weak-hash migration, then authenticate via Supabase Auth.
 */
export async function signInWithSecurePassword(email: string, password: string) {
  await migrateLegacyPasswordOnLogin(email, password);

  const supabase = createServerAuthClient();
  return supabase.auth.signInWithPassword({ email, password });
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
  const verifier = createServerAuthClient();
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: input.email,
    password: input.currentPassword,
  });

  if (verifyError) {
    return { ok: false as const, error: verifyError };
  }

  const supabase = createServerAuthClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(input.accessToken);
  if (userError || !userData.user) {
    return { ok: false as const, error: userError || new Error("Unauthorized") };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { ok: false as const, error: new Error("Password update unavailable") };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, {
    password: input.newPassword,
  });

  if (updateError) {
    return { ok: false as const, error: updateError };
  }

  await admin
    .from("profiles")
    .update({
      password_hash_version: "supabase_bcrypt",
      password_migrated_at: new Date().toISOString(),
    })
    .eq("id", userData.user.id);

  return { ok: true as const, error: null };
}

export type AuthSessionResult = {
  session: Session;
  user: User;
};
