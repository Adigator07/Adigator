/**
 * E2E validation for Creative Brain reuse.
 *
 * Usage:
 *   node scripts/e2e-creative-brain-reuse.mjs
 *   node scripts/e2e-creative-brain-reuse.mjs --base-url http://localhost:3000
 *   node scripts/e2e-creative-brain-reuse.mjs --staging
 *   node scripts/e2e-creative-brain-reuse.mjs --base-url https://staging.example.com --env .env.staging.local
 */
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(envFile = ".env.local") {
  const envPath = resolve(root, envFile);
  if (!existsSync(envPath)) throw new Error(`${envFile} not found`);
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function resolveConfig() {
  const args = process.argv.slice(2);
  const stagingMode = args.includes("--staging");
  const envFlagIdx = args.indexOf("--env");
  const envFile = envFlagIdx >= 0 ? args[envFlagIdx + 1] : stagingMode ? ".env.staging.local" : ".env.local";
  const baseUrlFlagIdx = args.indexOf("--base-url");
  const baseUrl = baseUrlFlagIdx >= 0
    ? args[baseUrlFlagIdx + 1]
    : process.env.STAGING_BASE_URL
      || (stagingMode ? null : "http://localhost:3000");

  if (!baseUrl) {
    throw new Error(
      "Staging base URL required. Use --base-url https://your-staging.app or set STAGING_BASE_URL / create .env.staging.local",
    );
  }

  const env = loadEnv(envFile);
  return { baseUrl, env, envFile, stagingMode };
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Minimal valid 1x1 PNG */
function createTestPng(seed = 1) {
  const base = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  if (seed === 1) return base;
  return Buffer.concat([base, Buffer.from([seed])]);
}

async function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function main() {
  const { baseUrl, env, envFile, stagingMode } = resolveConfig();
  console.log(`\nTarget: ${baseUrl} (${stagingMode ? "staging" : "local"})`);
  console.log(`Env file: ${envFile}`);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("Missing Supabase env vars in .env.local");
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\n=== Step 0: Verify migration tables ===");
  const tables = ["campaign_brains", "creative_brains", "validation_versions"];
  for (const table of tables) {
    const { error } = await admin.from(table).select("id").limit(1);
    if (error) {
      throw new Error(
        `Table public.${table} not available: ${error.message}\nApply supabase/migrations/20260703_brain_objects_validation_versions.sql first.`,
      );
    }
    console.log(`  ✓ public.${table} exists`);
  }

  const testEmail = `e2e-brain-${Date.now()}@adigator-e2e.test`;
  const testPassword = `E2eTest_${Date.now()}_Aa1!`;

  console.log("\n=== Step 1: Create test user ===");
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (createError) throw new Error(`Create user failed: ${createError.message}`);
  const userId = created.user.id;
  console.log(`  ✓ User ${userId}`);

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInError || !signIn.session?.access_token) {
    throw new Error(`Sign in failed: ${signInError?.message || "no session"}`);
  }
  const token = signIn.session.access_token;
  console.log("  ✓ Authenticated");

  const campaignId = `e2e-campaign-${Date.now()}`;
  const creativeIdA = `creative-a-${Date.now()}`;
  const creativeIdB = `creative-b-${Date.now()}`;
  const pngA = createTestPng(1);
  const pngB = createTestPng(2);

  const hashA1 = hashBuffer(pngA);
  const hashA2 = hashBuffer(pngA);
  await assert(hashA1 === hashA2, "Image byte hash must be deterministic");
  console.log("\n=== Step 2: Hash determinism ===");
  console.log(`  ✓ Same bytes → same SHA-256 (${hashA1.slice(0, 16)}…)`);

  async function callValidateCampaign({ creativeId, png, label }) {
    const form = new FormData();
    const blob = new Blob([png], { type: "image/png" });
    form.append("image", blob, `${creativeId}.png`);
    form.append("creative_id", creativeId);
    form.append("campaign_id", campaignId);
    form.append("task_type", "creative_addition");
    form.append("goal", "awareness");
    form.append("vertical", "technology");
    form.append("platform", "programmatic");
    form.append("audience_stage", "cold");
    form.append("campaign_brief", "E2E test campaign for creative brain reuse.");

    const started = Date.now();
    const res = await fetch(`${baseUrl}/api/validate-campaign`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const elapsed = Date.now() - started;
    const body = await res.json();
    console.log(`  [${label}] HTTP ${res.status} in ${elapsed}ms — reused=${body?.data?.reused}`);
    return { res, body, elapsed };
  }

  console.log("\n=== Step 3: First upload (expect NEW brain, OpenAI call) ===");
  const first = await callValidateCampaign({ creativeId: creativeIdA, png: pngA, label: "first" });
  await assert(first.res.ok, `First call failed: ${first.body?.error || first.res.status}`);
  await assert(first.body.data?.reused === false, "First call should not reuse");
  await assert(first.body.data?.creativeBrainId, "First call should return creativeBrainId");
  const brainIdFirst = first.body.data.creativeBrainId;
  const versionFirst = first.body.data.validationVersion;
  console.log(`  ✓ New brain ${brainIdFirst}, version ${versionFirst}`);

  console.log("\n=== Step 4: Re-upload same creative (expect REUSE, no OpenAI) ===");
  const second = await callValidateCampaign({ creativeId: creativeIdA, png: pngA, label: "reupload" });
  await assert(second.res.ok, `Second call failed: ${second.body?.error || second.res.status}`);
  await assert(second.body.data?.reused === true, "Second call should reuse stored brain");
  await assert(
    second.body.data?.creativeBrainId === brainIdFirst,
    "Reused brain id should match first brain",
  );
  await assert(
    second.elapsed < first.elapsed * 0.5 || second.elapsed < 5000,
    `Reuse should be faster than first call (first=${first.elapsed}ms, second=${second.elapsed}ms)`,
  );
  console.log(`  ✓ Reused brain in ${second.elapsed}ms (first was ${first.elapsed}ms)`);

  console.log("\n=== Step 5: Different image (expect NEW brain) ===");
  const third = await callValidateCampaign({ creativeId: creativeIdB, png: pngB, label: "different" });
  await assert(third.res.ok, `Third call failed: ${third.body?.error || third.res.status}`);
  await assert(third.body.data?.reused === false, "Different image should not reuse");
  await assert(
    third.body.data?.creativeBrainId !== brainIdFirst,
    "Different creative should get a new brain id",
  );
  console.log(`  ✓ New brain ${third.body.data.creativeBrainId}`);

  console.log("\n=== Step 6: Validation versions in database ===");
  const { data: versions, error: versionError } = await admin
    .from("validation_versions")
    .select("id, version_number, campaign_id, creative_brain_ids, trigger_reason, status")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .order("version_number", { ascending: true });

  if (versionError) throw new Error(`Version query failed: ${versionError.message}`);
  await assert(versions?.length >= 2, `Expected ≥2 validation versions, got ${versions?.length ?? 0}`);
  await assert(versions[0].version_number === 1, "First version should be 1");
  await assert(
    Array.isArray(versions[0].creative_brain_ids) && versions[0].creative_brain_ids.includes(brainIdFirst),
    "Version 1 should reference first creative brain",
  );
  console.log(`  ✓ ${versions.length} validation version(s) recorded`);
  versions.forEach((v) => {
    console.log(`    - v${v.version_number}: ${v.status}, brains=${v.creative_brain_ids?.length ?? 0}`);
  });

  console.log("\n=== Step 7: Creative brains row count ===");
  const { data: brains, error: brainsError } = await admin
    .from("creative_brains")
    .select("id, creative_id, content_hash")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);

  if (brainsError) throw new Error(`Brains query failed: ${brainsError.message}`);
  await assert(brains?.length === 2, `Expected 2 creative brains, got ${brains?.length ?? 0}`);
  console.log(`  ✓ ${brains.length} creative brain rows (no duplicate for re-upload)`);

  console.log("\n=== E2E PASSED ===\n");
  console.log("Summary:");
  console.log("  • Existing/re-uploaded creative reuses stored brain (reused=true)");
  console.log("  • New creative triggers analysis and new brain row");
  console.log("  • Image hash is deterministic");
  console.log("  • Validation versions created for new analyses");
  console.log(`  • Re-upload did not create duplicate brain (still ${brains.length} rows)`);

  await admin.auth.admin.deleteUser(userId);
  console.log("\n  Cleaned up test user.");
}

main().catch((error) => {
  console.error("\n=== E2E FAILED ===\n");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
