import { createAdminSupabaseClient } from "@/app/lib/supabaseServer";
import type { LegacyHashAlgorithm } from "./passwordService";
import {
  legacyHashNeedsMigration,
  verifyLegacyPassword,
} from "./passwordService";

export type LegacyPasswordRow = {
  user_id: string;
  email: string;
  password_hash: string;
  hash_algorithm: LegacyHashAlgorithm;
};

export async function fetchLegacyPasswordRecord(
  email: string,
): Promise<LegacyPasswordRow | null> {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await admin
    .from("auth_password_legacy")
    .select("user_id, email, password_hash, hash_algorithm")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.warn("[auth-migration] legacy lookup failed:", error.message);
    return null;
  }

  return data as LegacyPasswordRow | null;
}

export async function deleteLegacyPasswordRecord(userId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  await admin.from("auth_password_legacy").delete().eq("user_id", userId);
}

export async function markPasswordMigrated(userId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  await admin
    .from("profiles")
    .update({
      password_hash_version: "supabase_bcrypt",
      password_migrated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export type LegacyMigrationResult =
  | { migrated: true; userId: string }
  | { migrated: false };

/**
 * On login: verify weak legacy hash, push password to Supabase Auth (bcrypt),
 * remove legacy row, and mark profile as migrated.
 */
export async function migrateLegacyPasswordOnLogin(
  email: string,
  plainPassword: string,
): Promise<LegacyMigrationResult> {
  const legacy = await fetchLegacyPasswordRecord(email);
  if (!legacy) return { migrated: false };

  const algorithm = legacy.hash_algorithm;
  const valid = await verifyLegacyPassword(
    plainPassword,
    legacy.password_hash,
    algorithm,
  );

  if (!valid) return { migrated: false };

  if (!legacyHashNeedsMigration(algorithm, legacy.password_hash)) {
    await deleteLegacyPasswordRecord(legacy.user_id);
    return { migrated: false };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    console.warn("[auth-migration] service role required to upgrade password hash");
    return { migrated: false };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(legacy.user_id, {
    password: plainPassword,
  });

  if (updateError) {
    console.warn("[auth-migration] supabase password upgrade failed:", updateError.message);
    return { migrated: false };
  }

  await deleteLegacyPasswordRecord(legacy.user_id);
  await markPasswordMigrated(legacy.user_id);

  console.info("[auth-migration] upgraded legacy password hash", {
    userId: legacy.user_id,
    from: algorithm,
    timestamp: new Date().toISOString(),
  });

  return { migrated: true, userId: legacy.user_id };
}
