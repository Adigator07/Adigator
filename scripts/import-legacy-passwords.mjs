/**
 * Import legacy weak password hashes into auth_password_legacy for login-time migration.
 *
 * Usage (service role required):
 *   node scripts/import-legacy-passwords.mjs path/to/legacy-users.json
 *
 * JSON format:
 * [
 *   { "userId": "uuid", "email": "user@example.com", "passwordHash": "...", "algorithm": "md5" }
 * ]
 *
 * NEVER commit files containing real password hashes.
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/import-legacy-passwords.mjs <legacy-users.json>");
  process.exit(1);
}

const allowed = new Set(["plaintext", "md5", "sha1", "bcrypt"]);
const rows = JSON.parse(readFileSync(filePath, "utf8"));

if (!Array.isArray(rows)) {
  console.error("Input must be a JSON array");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let imported = 0;
let skipped = 0;

for (const row of rows) {
  const userId = String(row.userId || "").trim();
  const email = String(row.email || "").trim().toLowerCase();
  const passwordHash = String(row.passwordHash || "").trim();
  const algorithm = String(row.algorithm || "").trim().toLowerCase();

  if (!userId || !email || !passwordHash || !allowed.has(algorithm)) {
    skipped += 1;
    continue;
  }

  const { error } = await supabase.from("auth_password_legacy").upsert(
    {
      user_id: userId,
      email,
      password_hash: passwordHash,
      hash_algorithm: algorithm,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error(`Failed for ${email}:`, error.message);
    skipped += 1;
  } else {
    imported += 1;
  }
}

console.info(`Import complete. imported=${imported} skipped=${skipped}`);
